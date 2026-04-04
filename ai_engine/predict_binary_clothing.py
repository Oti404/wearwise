from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

from binary_clothing_model import BinaryClothingClassifier


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run inference with the separately trained binary clothing classifier."
    )
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--threshold", type=float, default=None)
    parser.add_argument("--pretty", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()

    if not args.checkpoint.exists():
        print(json.dumps({"error": f"Checkpoint not found: {args.checkpoint}"}), file=sys.stderr)
        return 1
    if not args.image.exists():
        print(json.dumps({"error": f"Image not found: {args.image}"}), file=sys.stderr)
        return 1

    classifier = BinaryClothingClassifier(args.checkpoint, threshold=args.threshold)
    image = Image.open(args.image).convert("RGB")
    result = classifier.predict(image)
    payload = {"image": str(args.image), **result.to_dict()}
    print(json.dumps(payload, indent=2 if args.pretty else None))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
