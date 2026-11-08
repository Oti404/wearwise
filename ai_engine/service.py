from __future__ import annotations

from contextlib import asynccontextmanager
from io import BytesIO
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError

from classifier import CATEGORY_MAPPING
from hybrid_classifier import DEFAULT_BINARY_CHECKPOINT, HybridClothingClassifier


DEFAULT_TOP_K = 5
# Matches the backend upload limit; larger files are rejected before decoding.
MAX_IMAGE_BYTES = 5 * 1024 * 1024


class ClassificationOptions(BaseModel):
    binary_threshold: float | None = Field(default=None, ge=0.0, le=1.0)
    top_k: int = Field(default=DEFAULT_TOP_K, ge=1, le=20)


def _classify_image(
    classifier: HybridClothingClassifier,
    image: Image.Image,
    image_ref: str,
    options: ClassificationOptions,
) -> dict[str, Any]:
    print(f"[AI Service] Classifying image ref: {image_ref}")
    # One CLIP encoding serves both the type prediction and the safety check (CPU-bound in production).
    image_features = classifier.type_classifier.encode_image(image)
    result = classifier.predict_with_threshold(
        image=image,
        top_k=options.top_k,
        binary_threshold=options.binary_threshold,
        image_features=image_features,
    )

    safety = classifier.type_classifier.predict_safety_from_features(image_features)
    is_safe = safety.get("safe", 0) > safety.get("unsafe", 0)

    payload = result.to_dict()
    best_label = payload.get("label")
    
    suggested_name = ""
    suggested_category = "Other"
    suggested_description = ""
    
    if best_label and result.is_clothing:
        clean_label = best_label.replace("_", " ").title()
        
        # Ensure name is 1-3 words
        label_words = clean_label.split()
        if len(label_words) < 3:
            suggested_name = f"Premium {clean_label}"
        else:
            suggested_name = clean_label # Already 3+ words (e.g. "Formal Dress Shirt")
            
        suggested_category = CATEGORY_MAPPING.get(best_label, "Other")
        suggested_description = f"A beautiful {clean_label.lower()} in great condition, perfect for your collection."
        print(f"[AI Service] Prediction: {best_label} -> Suggestion: {suggested_name}")
    else:
        print(f"[AI Service] Result: Not Clothing (Label: {best_label})")

    return {
        "image": image_ref,
        **payload,
        "ai_suggestions": {
            "name": suggested_name,
            "category": suggested_category,
            "description": suggested_description,
            "is_safe": is_safe,
            "safety_scores": safety
        }
    }


def _load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    try:
        with Image.open(BytesIO(image_bytes)) as opened_image:
            image = opened_image.convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image.") from exc
    return image


def _is_ready() -> bool:
    classifier = getattr(app.state, "classifier", None)
    return classifier is not None and classifier.is_ready


def _require_classifier() -> HybridClothingClassifier:
    if not _is_ready():
        raise HTTPException(status_code=503, detail="AI engine is not ready.")
    return app.state.classifier


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all models before accepting traffic so the first /classify call is not a cold load
    checkpoint_path = DEFAULT_BINARY_CHECKPOINT
    print(f"[AI Engine] Initialization using: {checkpoint_path}")

    try:
        classifier = HybridClothingClassifier(
            binary_checkpoint_path=checkpoint_path
        )
        classifier.load()
        app.state.classifier = classifier
        app.state.binary_checkpoint_path = checkpoint_path
        print("[AI Engine] Binary classifier and CLIP model loaded.")
    except Exception as e:
        print(f"[AI Engine] ERROR during lifespan initialization: {e}")
        # Stay up but report not-ready, so /health shows the failure instead of a crash loop
        app.state.classifier = None
        app.state.binary_checkpoint_path = checkpoint_path
        
    yield


app = FastAPI(title="Clothing Classifier Service", version="0.1.0", lifespan=lifespan)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "WearWise AI Engine is Running",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health() -> dict[str, Any]:
    is_ready = _is_ready()
    return {
        "status": "ok" if is_ready else "error",
        "ready": is_ready,
        "pipeline": "binary_gate_then_clip_type",
        "binary_checkpoint": str(getattr(app.state, "binary_checkpoint_path", "unknown")),
    }


@app.post("/classify/file")
async def classify_file(
    file: UploadFile = File(...),
    binary_threshold: float | None = Form(None),
    top_k: int = Form(DEFAULT_TOP_K),
) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    # Read one byte past the limit so oversized uploads are detected without buffering them fully.
    image_bytes = await file.read(MAX_IMAGE_BYTES + 1)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be at most 5 MB.")
    image = _load_image_from_bytes(image_bytes)
    print(f"[AI Service] Image loaded from bytes ({len(image_bytes)} bytes)")
    options = ClassificationOptions(
        binary_threshold=binary_threshold,
        top_k=top_k,
    )
    return _classify_image(
        _require_classifier(),
        image,
        file.filename or "uploaded-image",
        options,
    )
