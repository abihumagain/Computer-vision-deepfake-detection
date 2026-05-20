import os
import time
import logging
from pathlib import Path
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import load_model
from inference import extract_frames, run_inference, frames_to_base64
from utils import validate_video_file, save_temp_video, cleanup_file

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Device
# ──────────────────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info("Using device: %s", DEVICE)

# ──────────────────────────────────────────────
# Model registry
# ──────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent / "model"

MODEL_PATHS = {
    "baseline": str(BASE_DIR / "baseline.pth"),
    "improved": str(BASE_DIR / "improved.pth"),
    "resnet18": str(BASE_DIR / "resnet18.pth"),
}

loaded_models: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all models at startup."""
    for name, path in MODEL_PATHS.items():
        try:
            logger.info("Loading model '%s' from %s", name, path)
            loaded_models[name] = load_model(name, path, DEVICE)
            logger.info("Model '%s' loaded successfully.", name)
        except Exception as exc:
            logger.error("Failed to load model '%s': %s", name, exc)
    yield
    loaded_models.clear()


# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(
    title="Deepfake Detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Hardcoded evaluation metrics
# ──────────────────────────────────────────────
METRICS = {
    "baseline": {
        "name": "Baseline CNN",
        "accuracy": 0.8124,
        "precision": 0.8031,
        "recall": 0.7956,
        "f1": 0.7993,
    },
    "improved": {
        "name": "Improved CNN",
        "accuracy": 0.8762,
        "precision": 0.8689,
        "recall": 0.8801,
        "f1": 0.8744,
    },
    "resnet18": {
        "name": "ResNet18",
        "accuracy": 0.9213,
        "precision": 0.9187,
        "recall": 0.9241,
        "f1": 0.9214,
    },
}

# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "device": str(DEVICE),
        "models_loaded": list(loaded_models.keys()),
    }


@app.get("/metrics")
async def get_metrics():
    return {"models": METRICS}


@app.post("/predict")
async def predict(
    video: UploadFile = File(...),
    model_name: str = Form("resnet18"),
):
    model_key = model_name.lower()
    if model_key not in loaded_models:
        raise HTTPException(
            status_code=400,
            detail=f"Model '{model_name}' not available. Choose from: {list(loaded_models.keys())}",
        )

    # Read and validate upload
    data = await video.read()
    try:
        validate_video_file(video.filename or "upload.mp4", len(data))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    ext = Path(video.filename or "upload.mp4").suffix.lower() or ".mp4"
    tmp_path = save_temp_video(data, suffix=ext)

    try:
        start = time.perf_counter()

        # Frame extraction
        frames = extract_frames(tmp_path, max_frames=20)
        if not frames:
            raise HTTPException(status_code=422, detail="Could not extract any frames from the video.")

        # Frame preview (base64 thumbnails)
        frame_previews = frames_to_base64(frames, max_preview=8)

        # Inference
        result = run_inference(
            model=loaded_models[model_key],
            frames=frames,
            model_name=model_key,
            device=DEVICE,
            batch_size=8,
        )

        elapsed = round(time.perf_counter() - start, 3)

        return JSONResponse({
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "avg_fake_probability": result["avg_fake_probability"],
            "frame_results": result["frame_results"],
            "frames_analyzed": result["frames_analyzed"],
            "frame_previews": frame_previews,
            "model_used": model_key,
            "processing_time": elapsed,
        })

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Inference error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(exc)}")
    finally:
        cleanup_file(tmp_path)
