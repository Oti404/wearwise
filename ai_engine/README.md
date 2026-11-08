# WearWise AI Engine

FastAPI service that checks whether an uploaded photo shows clothing and suggests a name, category and description for the listing. Only the backend calls it, over the internal Docker network; it is never exposed publicly.

## Pipeline
1. **Binary gate**: a fine-tuned MobileNetV3-Small (`artifacts/binary_clothing/best_binary_clothing.pt`) decides *clothing* vs *not clothing*.
2. **Type + safety**: CLIP `openai/clip-vit-base-patch32` zero-shot classifies the garment type and flags unsafe images. One CLIP encoding is shared by both predictions.

Both models load at startup. `/health` reports `ready: true` only once they are in memory, and `/classify/file` returns 503 until then.

## API
| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{ status, ready, pipeline, binary_checkpoint }` |
| POST | `/classify/file` | Multipart `file` (image, max 5 MB); optional form fields `binary_threshold`, `top_k` |

## Run with Docker (production)
The checkpoint is stored with **Git LFS**. Install `git-lfs` before cloning, or run `git lfs pull` afterwards; otherwise the image build fails on purpose.

```bash
docker build -t wearwise-ai ai_engine
docker run -p 7860:7860 wearwise-ai
```

The image is CPU-only. CLIP weights are baked in at build time and `HF_HUB_OFFLINE=1` blocks downloads at runtime. Measured: ready about 11 s after start, about 350 MB RAM, and about 0.6 s per image on CPU.

## Run locally
```bash
cd ai_engine
python -m venv venv && venv/Scripts/activate   # Windows; use venv/bin/activate on Linux/macOS
pip install -r requirements-dev.txt
python serve.py                                # http://127.0.0.1:7860
```

Configuration comes from `.env` (see `.env.example`): `AI_HOST`, `PORT`.

## Training
See [TRAINING_BINARY.md](./TRAINING_BINARY.md). Training and CLI scripts (`train_binary_clothing.py`, `predict_binary_clothing.py`, `main.py`) are excluded from the Docker image.
