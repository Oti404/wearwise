from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from PIL import Image

from binary_clothing_model import BinaryClothingClassifier, BinaryPrediction
from classifier import ClothingClassifier, LabelScore


DEFAULT_BINARY_CHECKPOINT = Path("artifacts/binary_clothing/best_binary_clothing.pt")


@dataclass
class HybridClassificationResult:
    is_clothing: bool
    label: str | None
    confidence: float
    clothing_confidence: float
    non_clothing_confidence: float
    top_predictions: list[LabelScore]
    binary_prediction: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["top_predictions"] = [asdict(item) for item in self.top_predictions]
        return payload


class HybridClothingClassifier:
    def __init__(
        self,
        binary_checkpoint_path: str | Path = DEFAULT_BINARY_CHECKPOINT,
        binary_threshold: float | None = None,
    ) -> None:
        self.binary_checkpoint_path = Path(binary_checkpoint_path)
        if not self.binary_checkpoint_path.exists():
            raise FileNotFoundError(
                f"Binary checkpoint not found: {self.binary_checkpoint_path}"
            )

        self.binary_classifier = BinaryClothingClassifier(
            self.binary_checkpoint_path,
            threshold=binary_threshold,
        )
        self.type_classifier = ClothingClassifier()

    def predict(self, image: Image.Image, top_k: int = 5) -> HybridClassificationResult:
        binary_result = self.binary_classifier.predict(image)
        return self._build_result(image, binary_result, top_k=top_k)

    def predict_with_threshold(
        self, image: Image.Image, top_k: int = 5, binary_threshold: float | None = None
    ) -> HybridClassificationResult:
        binary_result = self.binary_classifier.predict(image, threshold=binary_threshold)
        return self._build_result(image, binary_result, top_k=top_k)

    def _build_result(
        self, image: Image.Image, binary_result: BinaryPrediction, top_k: int
    ) -> HybridClassificationResult:
        if not binary_result.is_clothing:
            return HybridClassificationResult(
                is_clothing=False,
                label=None,
                confidence=binary_result.confidence,
                clothing_confidence=binary_result.clothing_confidence,
                non_clothing_confidence=binary_result.non_clothing_confidence,
                top_predictions=[],
                binary_prediction=binary_result.to_dict(),
            )

        type_predictions = self.type_classifier.predict_types(image, top_k=top_k)
        best_label = type_predictions[0] if type_predictions else None

        return HybridClassificationResult(
            is_clothing=True,
            label=best_label.label if best_label else None,
            confidence=best_label.confidence if best_label else binary_result.confidence,
            clothing_confidence=binary_result.clothing_confidence,
            non_clothing_confidence=binary_result.non_clothing_confidence,
            top_predictions=type_predictions,
            binary_prediction=binary_result.to_dict(),
        )
