from __future__ import annotations

import argparse
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import torch
from torch import nn
from torch.optim import AdamW
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms

from binary_clothing_model import DEFAULT_LABELS, build_binary_model


IMAGE_SIZE = 224
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


@dataclass
class EpochMetrics:
    loss: float
    accuracy: float
    precision: float
    recall: float
    f1: float


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Train a binary clothing vs not-clothing classifier."
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("data/binary_clothing"),
        help="Dataset root containing train/ and val/ splits.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("artifacts/binary_clothing"),
        help="Directory where checkpoints and metrics will be saved.",
    )
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument(
        "--freeze-features",
        action="store_true",
        help="Train only the classifier head for a faster, lower-data baseline.",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Clothing probability threshold saved into the checkpoint.",
    )
    return parser


def build_transforms() -> tuple[transforms.Compose, transforms.Compose]:
    train_transform = transforms.Compose(
        [
            transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )
    eval_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(IMAGE_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )
    return train_transform, eval_transform


def validate_dataset_root(data_dir: Path) -> None:
    required_dirs = [
        data_dir / "train" / "clothing",
        data_dir / "train" / "not_clothing",
        data_dir / "val" / "clothing",
        data_dir / "val" / "not_clothing",
    ]
    missing = [str(path) for path in required_dirs if not path.exists()]
    if missing:
        raise FileNotFoundError(
            "Dataset is missing required directories:\n- " + "\n- ".join(missing)
        )


def build_datasets(
    data_dir: Path,
) -> tuple[datasets.ImageFolder, datasets.ImageFolder]:
    train_transform, eval_transform = build_transforms()
    train_dataset = datasets.ImageFolder(data_dir / "train", transform=train_transform)
    val_dataset = datasets.ImageFolder(data_dir / "val", transform=eval_transform)

    expected_classes = sorted(DEFAULT_LABELS)
    if sorted(train_dataset.class_to_idx.keys()) != expected_classes:
        raise ValueError(
            "Training classes must be exactly: clothing, not_clothing. "
            f"Found: {sorted(train_dataset.class_to_idx.keys())}"
        )
    if train_dataset.class_to_idx != val_dataset.class_to_idx:
        raise ValueError("Train and val splits must have identical class names.")

    return train_dataset, val_dataset


def build_sampler(dataset: datasets.ImageFolder) -> WeightedRandomSampler:
    class_counts = [0 for _ in dataset.classes]
    for _, target in dataset.samples:
        class_counts[target] += 1

    sample_weights = [1.0 / class_counts[target] for _, target in dataset.samples]
    return WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True,
    )


def freeze_backbone(model: nn.Module) -> None:
    for parameter in model.features.parameters():
        parameter.requires_grad = False


def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
) -> EpochMetrics:
    model.train()
    running_loss = 0.0
    predictions: list[int] = []
    targets: list[int] = []

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad(set_to_none=True)
        logits = model(images)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        running_loss += float(loss.item()) * images.size(0)
        predictions.extend(torch.argmax(logits, dim=1).cpu().tolist())
        targets.extend(labels.cpu().tolist())

    return compute_metrics(
        loss=running_loss / max(len(loader.dataset), 1),
        predictions=predictions,
        targets=targets,
        clothing_index=loader.dataset.class_to_idx["clothing"],
    )


def evaluate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> EpochMetrics:
    model.eval()
    running_loss = 0.0
    predictions: list[int] = []
    targets: list[int] = []

    with torch.inference_mode():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            logits = model(images)
            loss = criterion(logits, labels)

            running_loss += float(loss.item()) * images.size(0)
            predictions.extend(torch.argmax(logits, dim=1).cpu().tolist())
            targets.extend(labels.cpu().tolist())

    return compute_metrics(
        loss=running_loss / max(len(loader.dataset), 1),
        predictions=predictions,
        targets=targets,
        clothing_index=loader.dataset.class_to_idx["clothing"],
    )


def compute_metrics(
    loss: float, predictions: Iterable[int], targets: Iterable[int], clothing_index: int
) -> EpochMetrics:
    predictions = list(predictions)
    targets = list(targets)
    total = max(len(targets), 1)

    tp = sum(
        1
        for prediction, target in zip(predictions, targets)
        if prediction == clothing_index and target == clothing_index
    )
    fp = sum(
        1
        for prediction, target in zip(predictions, targets)
        if prediction == clothing_index and target != clothing_index
    )
    fn = sum(
        1
        for prediction, target in zip(predictions, targets)
        if prediction != clothing_index and target == clothing_index
    )
    correct = sum(1 for prediction, target in zip(predictions, targets) if prediction == target)

    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    f1 = 0.0 if precision + recall == 0 else 2 * precision * recall / (precision + recall)

    return EpochMetrics(
        loss=loss,
        accuracy=correct / total,
        precision=precision,
        recall=recall,
        f1=f1,
    )


def save_checkpoint(
    output_dir: Path,
    model: nn.Module,
    class_names: list[str],
    threshold: float,
    epoch: int,
    val_metrics: EpochMetrics,
) -> Path:
    checkpoint_path = output_dir / "best_binary_clothing.pt"
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "class_names": class_names,
            "threshold": threshold,
            "epoch": epoch,
            "val_metrics": asdict(val_metrics),
            "model_name": "mobilenet_v3_small",
        },
        checkpoint_path,
    )
    return checkpoint_path


def main() -> int:
    args = build_parser().parse_args()
    validate_dataset_root(args.data_dir)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    train_dataset, val_dataset = build_datasets(args.data_dir)
    sampler = build_sampler(train_dataset)

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        sampler=sampler,
        num_workers=args.num_workers,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
    )

    model, _ = build_binary_model(num_classes=len(train_dataset.classes))
    if args.freeze_features:
        freeze_backbone(model)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)

    optimizer = AdamW(
        [parameter for parameter in model.parameters() if parameter.requires_grad],
        lr=args.learning_rate,
        weight_decay=args.weight_decay,
    )
    criterion = nn.CrossEntropyLoss()

    best_f1 = -math.inf
    history: list[dict[str, object]] = []
    best_checkpoint_path: Path | None = None

    for epoch in range(1, args.epochs + 1):
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_metrics = evaluate(model, val_loader, criterion, device)

        epoch_result = {
            "epoch": epoch,
            "train": asdict(train_metrics),
            "val": asdict(val_metrics),
        }
        history.append(epoch_result)
        print(json.dumps(epoch_result))

        if val_metrics.f1 > best_f1:
            best_f1 = val_metrics.f1
            best_checkpoint_path = save_checkpoint(
                output_dir=args.output_dir,
                model=model,
                class_names=train_dataset.classes,
                threshold=args.threshold,
                epoch=epoch,
                val_metrics=val_metrics,
            )

    metrics_path = args.output_dir / "training_metrics.json"
    metrics_path.write_text(json.dumps(history, indent=2), encoding="utf-8")

    summary = {
        "best_checkpoint": str(best_checkpoint_path) if best_checkpoint_path else None,
        "metrics_path": str(metrics_path),
        "classes": train_dataset.classes,
        "freeze_features": args.freeze_features,
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
