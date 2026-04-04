from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

from hybrid_classifier import DEFAULT_BINARY_CHECKPOINT, HybridClothingClassifier


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the two-stage clothing classifier and return JSON."
    )
    parser.add_argument("--image", type=Path, required=True, help="Path to the input image.")
    parser.add_argument(
        "--binary-checkpoint",
        type=Path,
        default=DEFAULT_BINARY_CHECKPOINT,
        help="Checkpoint path for the trained binary clothing gate.",
    )
    parser.add_argument(
        "--binary-threshold",
        type=float,
        default=None,
        help="Optional override for the binary clothing threshold.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of clothing label candidates to include when stage 1 passes.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print the JSON response.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()

    if not args.image.exists():
        print(json.dumps({"error": f"Image not found: {args.image}"}), file=sys.stderr)
        return 1
    if not args.binary_checkpoint.exists():
        print(
            json.dumps({"error": f"Binary checkpoint not found: {args.binary_checkpoint}"}),
            file=sys.stderr,
        )
        return 1

    classifier = HybridClothingClassifier(
        binary_checkpoint_path=args.binary_checkpoint,
        binary_threshold=args.binary_threshold,
    )
    image = Image.open(args.image).convert("RGB")
    result = classifier.predict(image=image, top_k=args.top_k)
    payload = {"image": str(args.image), **result.to_dict()}
    print(json.dumps(payload, indent=2 if args.pretty else None))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
