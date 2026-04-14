from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from PIL import Image

# Non-blocking imports (lazy)
torch = None
nn = None
build_binary_model_func = None

def _get_torch():
    global torch, nn, build_binary_model_func
    if torch is None:
        import torch as t
        from torch import nn as n
        from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
        torch = t
        nn = n
        
        def build_binary_model(num_classes: int = 2):
            weights = MobileNet_V3_Small_Weights.DEFAULT
            model = mobilenet_v3_small(weights=weights)
            in_features = model.classifier[-1].in_features
            model.classifier[-1] = nn.Linear(in_features, num_classes)
            return model, weights
        
        build_binary_model_func = build_binary_model
    return torch, nn, build_binary_model_func

DEFAULT_LABELS = ["clothing", "not_clothing"]

@dataclass
class BinaryPrediction:
    is_clothing: bool
    label: str
    confidence: float
    clothing_confidence: float
    non_clothing_confidence: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

class BinaryClothingClassifier:
    def __init__(self, checkpoint_path: str | Path, threshold: float | None = None) -> None:
        self.checkpoint_path = Path(checkpoint_path)
        self.threshold = threshold
        self._model = None
        self._preprocess = None
        self._class_names = None
        self._clothing_index = None
        self._not_clothing_index = None
        self._device = None

    def _load_model(self):
        if self._model is not None:
            return

        t, n, build_fn = _get_torch()
        self._device = t.device("cuda" if t.cuda.is_available() else "cpu")
        
        print(f"[AI] Loading Binary Classifier from {self.checkpoint_path}...")
        checkpoint = t.load(self.checkpoint_path, map_location="cpu", weights_only=False)
        self._class_names = checkpoint["class_names"]
        
        if self.threshold is None:
            self.threshold = checkpoint.get("threshold", 0.5)

        model, weights = build_fn(num_classes=len(self._class_names))
        model.load_state_dict(checkpoint["model_state_dict"])
        self._model = model.to(self._device).eval()
        self._preprocess = weights.transforms()

        self._clothing_index = self._class_names.index("clothing")
        self._not_clothing_index = self._class_names.index("not_clothing")
        print("[AI] Binary Classifier loaded successfully.")

    def predict(
        self, image: Image.Image, threshold: float | None = None
    ) -> BinaryPrediction:
        self._load_model()
        t, _, _ = _get_torch()
        
        tensor = self._preprocess(image.convert("RGB")).unsqueeze(0).to(self._device)
        with t.inference_mode():
            logits = self._model(tensor)
            probabilities = t.softmax(logits, dim=1)[0]

        clothing_confidence = float(probabilities[self._clothing_index].item())
        non_clothing_confidence = float(probabilities[self._not_clothing_index].item())
        applied_threshold = self.threshold if threshold is None else threshold
        is_clothing = clothing_confidence >= applied_threshold
        label = "clothing" if is_clothing else "not_clothing"
        confidence = clothing_confidence if is_clothing else non_clothing_confidence

        return BinaryPrediction(
            is_clothing=is_clothing,
            label=label,
            confidence=confidence,
            clothing_confidence=clothing_confidence,
            non_clothing_confidence=non_clothing_confidence,
        )
