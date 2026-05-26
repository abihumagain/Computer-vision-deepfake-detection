import cv2
import torch
import numpy as np
import logging
from torchvision import transforms
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

TRANSFORMS = {
    "small": transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((128, 128)),
        transforms.ToTensor(),
    ]),
    "large": transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ]),
}


def get_transform(model_name: str) -> transforms.Compose:
    name = model_name.lower()
    if name == "resnet18":
        return TRANSFORMS["large"]
    return TRANSFORMS["small"]


def extract_frames(video_path: str, max_frames: int = 20) -> List[np.ndarray]:
    """Extract up to max_frames frames at 1-per-second from a video."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_s = (total_frames / fps) if fps > 0 else 0

    # Match training behavior: sample approximately 1 frame every second.
    # Use integer-second timestamps and cap to max_frames.
    second_marks = max(1, int(duration_s))
    frame_indices = [int(i * fps) for i in range(second_marks)]
    frame_indices = frame_indices[:max_frames]

    # Fallback for very short/invalid metadata videos.
    if not frame_indices:
        frame_indices = [0]

    frames: List[np.ndarray] = []
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue
        # Convert BGR -> RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(frame_rgb)

    cap.release()
    logger.info("Extracted %d frames from %s (duration ~%.1fs)", len(frames), video_path, duration_s)
    return frames


def frames_to_base64(frames: List[np.ndarray], max_preview: int = 8) -> List[str]:
    """Encode a sample of frames as JPEG base64 strings for the frontend gallery."""
    import base64
    result = []
    step = max(1, len(frames) // max_preview)
    for frame in frames[::step][:max_preview]:
        bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        success, buf = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, 70])
        if success:
            result.append(base64.b64encode(buf).decode("utf-8"))
    return result


def run_inference(
    model: torch.nn.Module,
    frames: List[np.ndarray],
    model_name: str,
    device: torch.device,
    fake_index: int = 1,
    batch_size: int = 8,
) -> Dict[str, Any]:
    """
    Run model inference on extracted frames.
    Returns aggregated prediction and per-frame results.
    """
    transform = get_transform(model_name)
    tensors = []
    for frame in frames:
        try:
            t = transform(frame)
            tensors.append(t)
        except Exception as exc:
            logger.warning("Frame transform failed: %s", exc)

    if not tensors:
        raise RuntimeError("No frames could be processed.")

    all_probs: List[float] = []
    frame_results: List[Dict[str, Any]] = []

    with torch.no_grad():
        for i in range(0, len(tensors), batch_size):
            batch = torch.stack(tensors[i: i + batch_size]).to(device)
            logits = model(batch)
            probs = torch.softmax(logits, dim=1)
            fake_probs = probs[:, fake_index].cpu().tolist()
            all_probs.extend(fake_probs)

    for frame_idx, fake_prob in enumerate(all_probs):
        is_fake = fake_prob >= 0.5
        frame_results.append({
            "frame_index": frame_idx,
            "prediction": "FAKE" if is_fake else "REAL",
            "confidence": round(float(fake_prob if is_fake else 1 - fake_prob), 4),
            "fake_probability": round(float(fake_prob), 4),
        })

    avg_fake_prob = float(np.mean(all_probs))
    final_fake = avg_fake_prob >= 0.5
    final_confidence = avg_fake_prob if final_fake else 1.0 - avg_fake_prob

    return {
        "prediction": "FAKE" if final_fake else "REAL",
        "confidence": round(final_confidence, 4),
        "avg_fake_probability": round(avg_fake_prob, 4),
        "frame_results": frame_results,
        "frames_analyzed": len(frame_results),
    }
