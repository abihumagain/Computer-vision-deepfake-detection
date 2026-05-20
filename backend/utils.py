import os
import uuid
import tempfile
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"}
MAX_FILE_SIZE_MB = 200


def validate_video_file(filename: str, file_size: int) -> None:
    """Raise ValueError if the uploaded file is not a valid video."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise ValueError(
            f"File too large ({file_size / 1024 / 1024:.1f} MB). Max allowed: {MAX_FILE_SIZE_MB} MB"
        )


def save_temp_video(data: bytes, suffix: str = ".mp4") -> str:
    """Save binary data to a secure temporary file and return its path."""
    tmp_dir = tempfile.gettempdir()
    filename = f"deepfake_{uuid.uuid4().hex}{suffix}"
    path = os.path.join(tmp_dir, filename)
    with open(path, "wb") as f:
        f.write(data)
    return path


def cleanup_file(path: str) -> None:
    """Delete a temporary file, silently ignoring errors."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception as exc:
        logger.warning("Could not delete temp file %s: %s", path, exc)
