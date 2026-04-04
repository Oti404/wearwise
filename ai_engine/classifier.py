from __future__ import annotations

import os
import logging
import warnings
from dataclasses import dataclass
from typing import Dict, List, Sequence

os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
os.environ.setdefault("HF_HUB_VERBOSITY", "error")

from PIL import Image

# Non-blocking imports (lazy)
torch = None
CLIPModel = None
CLIPProcessor = None

def _get_hf_imports():
    global torch, CLIPModel, CLIPProcessor
    if torch is None:
        import torch as t
        from transformers import CLIPModel as m, CLIPProcessor as p
        from transformers.utils import logging as transformers_logging
        
        torch = t
        CLIPModel = m
        CLIPProcessor = p
        
        warnings.filterwarnings(
            "ignore",
            message="You are sending unauthenticated requests to the HF Hub.*",
        )
        transformers_logging.set_verbosity_error()
        logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
        
    return torch, CLIPModel, CLIPProcessor

MODEL_NAME = "openai/clip-vit-base-patch32"

TYPE_PROMPTS: Dict[str, Sequence[str]] = {
    "pants": (
        "a clean product photo of a pair of pants or trousers",
        "legwear clothing such as slacks or trousers laid flat",
        "a standalone pair of casual pants for the lower body",
    ),
    "jeans": (
        "a clean product photo of blue jeans or denim pants",
        "a standalone pair of denim jeans",
        "folded or laid flat jeans as a clothing item",
    ),
    "shorts": (
        "a clean product photo of shorts",
        "a standalone pair of casual shorts",
        "short legwear clothing for warm weather",
    ),
    "skirt": (
        "a clean product photo of a skirt",
        "a standalone skirt as a clothing item",
        "a women's skirt laid flat or photographed alone",
    ),
    "dress": (
        "a clean product photo of a dress",
        "a standalone dress on a white background",
        "a full-body one-piece dress garment",
    ),
    "t_shirt": (
        "a clean product photo of a t-shirt",
        "a standalone short-sleeve t-shirt or tee shirt",
        "casual upper-body clothing, a t-shirt laid flat",
    ),
    "shirt": (
        "a clean product photo of a button-up shirt",
        "a standalone collared shirt garment",
        "an upper-body shirt laid flat or hanging",
    ),
    "blouse": (
        "a clean product photo of a blouse",
        "a standalone women's blouse garment",
        "a lightweight upper-body blouse laid flat",
    ),
    "sweater": (
        "a clean product photo of a sweater",
        "a knit sweater or pullover photographed alone",
        "a standalone long-sleeve sweater garment",
    ),
    "hoodie": (
        "a clean product photo of a hoodie",
        "a hooded sweatshirt photographed alone",
        "a standalone hoodie garment for the upper body",
    ),
    "jacket": (
        "a clean product photo of a jacket",
        "outerwear such as a casual jacket photographed alone",
        "a standalone zip jacket or light coat garment",
    ),
    "coat": (
        "a clean product photo of a coat",
        "long outerwear such as a coat photographed alone",
        "a standalone overcoat or winter coat garment",
    ),
    "suit": (
        "a clean product photo of a formal suit",
        "matching suit jacket and trousers as formal clothing",
        "a standalone business suit outfit",
    ),
    "activewear": (
        "a clean product photo of athletic clothing",
        "sportswear or gym clothing photographed alone",
        "activewear apparel for exercise",
    ),
    "leggings": (
        "a clean product photo of leggings",
        "tight stretchy legwear clothing photographed alone",
        "a standalone pair of leggings",
    ),
    "shoes": (
        "a clean product photo of shoes",
        "footwear such as dress shoes or casual shoes",
        "a standalone pair of shoes",
    ),
    "sneakers": (
        "a clean product photo of sneakers",
        "athletic sneakers or trainers photographed alone",
        "a standalone pair of running shoes or sneakers",
    ),
    "boots": (
        "a clean product photo of boots",
        "ankle boots or tall boots photographed alone",
        "a standalone pair of boots",
    ),
    "sandals": (
        "a clean product photo of sandals",
        "open footwear such as sandals photographed alone",
        "a standalone pair of sandals",
    ),
    "hat": (
        "a clean product photo of a hat",
        "headwear such as a cap or beanie photographed alone",
        "a standalone hat clothing accessory",
    ),
    "scarf": (
        "a clean product photo of a scarf",
        "a standalone scarf or neckwear garment",
        "a folded scarf photographed alone",
    ),
    "gloves": (
        "a clean product photo of gloves",
        "a standalone pair of gloves",
        "handwear clothing accessory photographed alone",
    ),
    "scarf": (
        "a clean product photo of a scarf",
        "a standalone scarf or neckwear garment",
        "a folded scarf photographed alone",
    ),
    "gloves": (
        "a clean product photo of gloves",
        "a standalone pair of gloves",
        "handwear clothing accessory photographed alone",
    ),
    "socks": (
        "a clean product photo of socks",
        "a standalone pair of socks",
        "footwear accessory such as socks laid flat",
    ),
    "underwear": (
        "a clean product photo of underwear",
        "a standalone pair of briefs or undergarments",
        "basic underwear clothing photographed alone",
    ),
    "bra": (
        "a clean product photo of a bra",
        "a standalone brassiere or bra garment",
        "women's undergarment, a bra photographed alone",
    ),
    "swimwear": (
        "a clean product photo of swimwear",
        "a swimsuit or bikini photographed alone",
        "swimming apparel laid flat or shown alone",
    ),
    "backpack": (
        "a clean product photo of a backpack",
        "a standalone backpack or rucksack",
        "basic backpack laid flat or shown alone",
    ),
    "flipflops": (
        "a clean product photo of flipflops",
        "a standalone flipflop or a pair of flipflops",
        "pair of flipflops laid flat or shown alone",
    ),
}

SAFETY_PROMPTS: Dict[str, Sequence[str]] = {
    "safe": (
        "a clean photo of a clothing item",
        "a professional product photo",
        "regular apparel or fashion accessory",
    ),
    "unsafe": (
        "explicit content",
        "offensive imagery",
        "prohibited item",
        "not a piece of clothing",
    )
}

CATEGORY_MAPPING = {
    "t_shirt": "T-shirts",
    "shirt": "T-shirts",
    "blouse": "Dresses",
    "pants": "Pants",
    "jeans": "Pants",
    "shorts": "Pants",
    "skirt": "Dresses",
    "dress": "Dresses",
    "sweater": "Outerwear",
    "hoodie": "Outerwear",
    "jacket": "Outerwear",
    "coat": "Outerwear",
    "shoes": "Footwear",
    "sneakers": "Footwear",
    "boots": "Footwear",
    "sandals": "Footwear",
    "flipflops": "Footwear",
    "hat": "Accessories",
    "scarf": "Accessories",
    "gloves": "Accessories",
    "socks": "Accessories",
    "backpack": "Accessories",
}

@dataclass
class LabelScore:
    label: str
    group: str
    confidence: float
    matched_prompt: str

class ClothingClassifier:
    def __init__(self, model_name: str = MODEL_NAME) -> None:
        self.model_name = model_name
        self._processor = None
        self._model = None
        self._device = None
        self._type_entries = None
        self._type_text_features = None
        self._safety_entries = None
        self._safety_text_features = None

    def _ensure_loaded(self):
        if self._model is not None:
            return

        t, m, p = _get_hf_imports()
        self._device = t.device("cuda" if t.cuda.is_available() else "cpu")
        
        print(f"[AI] Loading CLIP model: {self.model_name}...")
        self._processor = p.from_pretrained(self.model_name, use_fast=False)
        self._model = m.from_pretrained(self.model_name).to(self._device).eval()

        self._type_entries = self._build_prompt_entries(TYPE_PROMPTS, "clothing")
        self._type_text_features = self._encode_text(
            [entry["prompt"] for entry in self._type_entries]
        )
        self._safety_entries = self._build_prompt_entries(SAFETY_PROMPTS, "safety")
        self._safety_text_features = self._encode_text(
            [entry["prompt"] for entry in self._safety_entries]
        )
        print("[AI] CLIP model loaded successfully.")

    def predict_types(self, image: Image.Image, top_k: int = 5) -> List[LabelScore]:
        self._ensure_loaded()
        image_features = self._encode_image(image.convert("RGB"))
        return self.predict_types_from_features(image_features)[:top_k]

    def predict_types_from_features(self, image_features: Any) -> List[LabelScore]:
        self._ensure_loaded()
        return self._predict_from_entries(
            image_features=image_features,
            entries=self._type_entries,
            text_features=self._type_text_features,
        )

    def predict_safety(self, image: Image.Image) -> Dict[str, float]:
        self._ensure_loaded()
        image_features = self._encode_image(image.convert("RGB"))
        preds = self._predict_from_entries(
            image_features=image_features,
            entries=self._safety_entries,
            text_features=self._safety_text_features,
        )
        return {p.label: p.confidence for p in preds}

    def _build_prompt_entries(self, catalog: Dict[str, Sequence[str]], group: str) -> List[dict]:
        entries: List[dict] = []
        for label, prompts in catalog.items():
            for prompt in prompts:
                entries.append({"group": group, "label": label, "prompt": prompt})
        return entries

    def _predict_from_entries(self, image_features: Any, entries: List[dict], text_features: Any) -> List[LabelScore]:
        t, _, _ = _get_hf_imports()
        logits = (
            self._model.logit_scale.exp() * image_features @ text_features.T
        ).squeeze(0)

        label_logits: Dict[str, Any] = {}
        matched_prompts: Dict[str, str] = {}
        label_groups: Dict[str, str] = {}

        for index, entry in enumerate(entries):
            label = entry["label"]
            logit = logits[index]
            if label not in label_logits or logit.item() > label_logits[label].item():
                label_logits[label] = logit
                matched_prompts[label] = entry["prompt"]
                label_groups[label] = entry["group"]

        ordered_labels = list(label_logits.keys())
        ordered_logits = t.stack([label_logits[label] for label in ordered_labels])
        ordered_probabilities = t.softmax(ordered_logits, dim=0)

        predictions = [
            LabelScore(
                label=label,
                group=label_groups[label],
                confidence=float(probability.item()),
                matched_prompt=matched_prompts[label],
            )
            for label, probability in zip(ordered_labels, ordered_probabilities)
        ]
        predictions.sort(key=lambda item: item.confidence, reverse=True)
        return predictions

    def _encode_text(self, prompts: Sequence[str]) -> Any:
        t, _, _ = _get_hf_imports()
        text_inputs = self._processor(
            text=list(prompts),
            padding=True,
            truncation=True,
            return_tensors="pt",
        )
        text_inputs = {key: value.to(self._device) for key, value in text_inputs.items()}

        with t.inference_mode():
            text_features = self._model.get_text_features(**text_inputs)
            if hasattr(text_features, "pooler_output"):
                text_features = text_features.pooler_output

        return text_features / text_features.norm(dim=-1, keepdim=True)

    def _encode_image(self, image: Image.Image) -> Any:
        t, _, _ = _get_hf_imports()
        image_inputs = self._processor(images=image, return_tensors="pt")
        image_inputs = {key: value.to(self._device) for key, value in image_inputs.items()}

        with t.inference_mode():
            image_features = self._model.get_image_features(**image_inputs)
            if hasattr(image_features, "pooler_output"):
                image_features = image_features.pooler_output

        return image_features / image_features.norm(dim=-1, keepdim=True)
