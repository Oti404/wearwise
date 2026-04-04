# Trainable Binary Clothing Classifier

This is a separate pipeline from the existing zero-shot CLIP classifier.

Use it when you want a real learned decision boundary for:

- `clothing`
- `not_clothing`

The current implementation uses transfer learning with `torchvision` MobileNetV3 Small. That keeps the model local and lightweight while avoiding training from scratch.

## Files

- `binary_clothing_model.py`: model builder and inference wrapper for trained checkpoints
- `train_binary_clothing.py`: training entry point
- `predict_binary_clothing.py`: inference entry point for a trained checkpoint

## Dataset Layout

Expected directory structure:

```text
data/binary_clothing/
  train/
    clothing/
    not_clothing/
  val/
    clothing/
    not_clothing/
  test/
    clothing/
    not_clothing/
```

Only `train/` and `val/` are required by the training script. `test/` is optional and can be used later for your own evaluation.

## What To Collect

Positive examples:

- single clothing items on plain backgrounds
- folded garments
- hanging garments
- shoes, hats, scarves, gloves, socks if those count as clothing in your product definition

Hard negatives:

- pillows, blankets, towels, curtains
- toys, boxes, packaging, printed surfaces
- people wearing clothes
- mannequins
- furniture and household items
- cluttered shelves or rooms
- soft fabric objects that are not garments

The hard negatives matter more than raw volume. Aim for examples that resemble your real failure cases.

## Minimum Useful Starting Point

Reasonable first pass:

- `200` to `500` clothing images
- `200` to `500` not-clothing images
- make sure the negative side includes deceptive textile-like objects

That is enough to start seeing whether the binary model is stronger than the zero-shot approach.

## Start With This

1. Fill `data/binary_clothing/train/...` and `data/binary_clothing/val/...`
2. Keep validation separate from training. Do not reuse the same images.
3. Start with a frozen backbone for a quick baseline:

```powershell
.\.venv\Scripts\python.exe train_binary_clothing.py --freeze-features
```

4. If that works but is still too weak, fine-tune the full backbone:

```powershell
.\.venv\Scripts\python.exe train_binary_clothing.py
```

## Useful Training Command

```powershell
.\.venv\Scripts\python.exe train_binary_clothing.py `
  --data-dir data\binary_clothing `
  --output-dir artifacts\binary_clothing `
  --epochs 8 `
  --batch-size 16 `
  --learning-rate 1e-4
```

The script prints JSON per epoch and saves:

- `artifacts/binary_clothing/best_binary_clothing.pt`
- `artifacts/binary_clothing/training_metrics.json`

## Run Inference With A Trained Checkpoint

```powershell
.\.venv\Scripts\python.exe predict_binary_clothing.py `
  --checkpoint artifacts\binary_clothing\best_binary_clothing.pt `
  --image test_static\pants.jpg `
  --pretty
```

## Recommended Workflow

1. Train a binary classifier first.
2. Test it on hard negatives and borderline cases.
3. Add failure cases back into the dataset.
4. Repeat until the false-positive rate is acceptable.
5. Only then consider wiring it in front of the current clothing-type classifier.

## What I Would Do Next

Once you have your first checkpoint:

1. Measure false positives on a folder of negatives.
2. Measure false negatives on a folder of real clothing items.
3. Adjust threshold only after looking at those results.
4. If needed, add a small evaluation script for batch folder scoring.
