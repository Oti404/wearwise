from __future__ import annotations

from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError

from hybrid_classifier import DEFAULT_BINARY_CHECKPOINT, HybridClothingClassifier


DEFAULT_TOP_K = 5


class ClassificationOptions(BaseModel):
    binary_threshold: float | None = Field(default=None, ge=0.0, le=1.0)
    top_k: int = Field(default=DEFAULT_TOP_K, ge=1, le=20)


class PathClassificationRequest(ClassificationOptions):
    image_path: str


def _classify_image(
    classifier: HybridClothingClassifier,
    image: Image.Image,
    image_ref: str,
    options: ClassificationOptions,
) -> dict[str, Any]:
    print(f"[AI Service] Classifying image ref: {image_ref}")
    result = classifier.predict_with_threshold(
        image=image,
        top_k=options.top_k,
        binary_threshold=options.binary_threshold,
    )
    
    # Safety Check
    print("[AI Service] Running safety check...")
    safety = classifier.type_classifier.predict_safety(image)
    is_safe = safety.get("safe", 0) > safety.get("unsafe", 0)
    
    # Mapping to suggestions
    from classifier import CATEGORY_MAPPING
    
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
    return classifier is not None and classifier.type_classifier.is_loaded


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
        classifier.type_classifier.load()
        app.state.classifier = classifier
        app.state.binary_checkpoint_path = checkpoint_path
        print("[AI Engine] Hybrid classifier and CLIP model loaded.")
    except Exception as e:
        print(f"[AI Engine] ERROR during lifespan initialization: {e}")
        # We don't want to crash the whole server, but we mark it as failed
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


@app.post("/classify/path")
async def classify_path(request: PathClassificationRequest) -> dict[str, Any]:
    image_path = Path(request.image_path)
    if not image_path.exists():
        raise HTTPException(status_code=404, detail=f"Image not found: {image_path}")

    try:
        with Image.open(image_path) as opened_image:
            image = opened_image.convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image.") from exc

    return _classify_image(_require_classifier(), image, str(image_path), request)


@app.post("/classify/file")
async def classify_file(
    file: UploadFile = File(...),
    binary_threshold: float | None = Form(None),
    top_k: int = Form(DEFAULT_TOP_K),
) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    print(f"[AI Service] POST /classify/file hit - Filename: {file.filename}")
    image_bytes = await file.read()
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
