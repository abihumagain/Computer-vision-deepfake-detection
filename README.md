# DeepShield — Deepfake Detection Dashboard

A professional deepfake detection web application built with FastAPI + React.

---

## Project Structure

```
deepfake/
├── model/
│   ├── baseline.pth
│   ├── improved.pth
│   └── resnet18.pth
├── backend/
│   ├── app.py           ← FastAPI application
│   ├── models.py        ← Model architectures
│   ├── inference.py     ← Frame extraction & inference
│   ├── utils.py         ← Upload validation & temp file helpers
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── pages/
        │   └── Dashboard.jsx
        ├── components/
        │   ├── VideoUploader.jsx
        │   ├── ResultCard.jsx
        │   ├── MetricsPanel.jsx
        │   ├── FrameGallery.jsx
        │   └── ConfidenceChart.jsx
        └── services/
            └── api.js
```

---

## Backend Setup

### 1. Create & activate a virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

> **GPU acceleration:** If you have a CUDA-capable GPU, install the CUDA-enabled
> PyTorch build from https://pytorch.org/get-started/locally/ before running the above.

### 3. Start the backend server

```bash
python run_dev.py
```

Alternative CLI command (if you prefer direct uvicorn):

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload --reload-exclude "venv/*" --reload-exclude "**/site-packages/*"
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

## Frontend Setup

### 1. Install Node dependencies (already done if you ran npm install)

```bash
cd frontend
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

> The Vite dev server proxies `/api/*` requests to `http://localhost:8000`,
> so both services must be running simultaneously.

---

## API Reference

### `GET /health`
```json
{
  "status": "ok",
  "device": "cpu",
  "models_loaded": ["baseline", "improved", "resnet18"]
}
```

### `GET /metrics`
```json
{
  "models": {
    "baseline":  { "name": "Baseline CNN",  "accuracy": 0.8124, "precision": 0.8031, "recall": 0.7956, "f1": 0.7993 },
    "improved":  { "name": "Improved CNN",  "accuracy": 0.8762, "precision": 0.8689, "recall": 0.8801, "f1": 0.8744 },
    "resnet18":  { "name": "ResNet18",      "accuracy": 0.9213, "precision": 0.9187, "recall": 0.9241, "f1": 0.9214 }
  }
}
```

### `POST /predict`
**Form fields:** `video` (file), `model_name` (string)

```json
{
  "prediction": "FAKE",
  "confidence": 0.8734,
  "avg_fake_probability": 0.8734,
  "frame_results": [
    { "frame_index": 0, "prediction": "FAKE", "confidence": 0.91, "fake_probability": 0.91 }
  ],
  "frames_analyzed": 15,
  "frame_previews": ["<base64-jpeg>", "..."],
  "model_used": "resnet18",
  "processing_time": 4.231
}
```

---

## Inference Flow

1. **Upload** — Video file is validated (type & size ≤ 200 MB) and saved to a secure temp path.
2. **Frame extraction** — OpenCV samples 1 frame/second up to 20 frames.
3. **Pre-processing** — Each frame is resized (128×128 for baseline/improved, 224×224 for resnet18), converted to a tensor, and ImageNet-normalised.
4. **Batch inference** — Frames are processed in batches of 8 through the selected model.
5. **Aggregation** — Softmax probabilities are averaged across all frames; `avg_fake_prob ≥ 0.5` → **FAKE**.
6. **Cleanup** — The temporary video file is deleted.
7. **Response** — JSON with prediction, confidence, per-frame results, and JPEG frame previews (base64).

---

## Features

| Feature | Details |
|---|---|
| Video upload | Drag & drop or click — MP4, AVI, MOV, MKV, WebM |
| Model selector | Baseline CNN / Improved CNN / ResNet-18 |
| Inference progress | Animated progress bar during detection |
| Result card | REAL/FAKE badge, confidence bar, processing time |
| Frame gallery | Up to 8 extracted frame thumbnails |
| Confidence chart | Per-frame fake-probability bar chart |
| Metrics dashboard | Table + bar chart comparing all 3 models |
| JSON report download | One-click download of full inference report |
| Toast notifications | Success / error / warning snackbars |
| Dark glassmorphism UI | MUI dark theme with blur/glass cards |
