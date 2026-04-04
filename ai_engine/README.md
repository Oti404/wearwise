---
title: WearWise AI Engine
emoji: 🧶
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# Clothing Classifier

This project exposes:

- a local Python CLI for one-off classification
- a local FastAPI service intended to be called from a JavaScript backend

Both return JSON with:

- `is_clothing`
- `label`
- `confidence`
- `clothing_confidence`
- `non_clothing_confidence`
- `top_predictions`
- `binary_prediction`

`confidence` means:

- if `is_clothing` is `true`, confidence of the chosen clothing label
- if `is_clothing` is `false`, confidence of the non-clothing decision

## Model

The default runtime path is now a two-stage pipeline:

1. A trained binary model decides `clothing` vs `not_clothing`.
2. If stage 1 passes, a CLIP-based type classifier assigns a clothing label such as `pants`, `jeans`, `dress`, `jacket`, `shoes`.

This prevents the type classifier from trying to label obviously non-clothing images directly.

The stage 2 type classifier uses `openai/clip-vit-base-patch32` through `transformers`. Each strict label has multiple descriptive prompts. The best matching prompt is mapped back to its strict label before the final JSON response is produced.

The binary checkpoint is expected at:

`artifacts/binary_clothing/best_binary_clothing.pt`

If you want to retrain it, see `TRAINING_BINARY.md`.

## Run CLI

```powershell
.\.venv\Scripts\python.exe main.py --image path\to\image.jpg --pretty
```

## Run Service

Start the local API service:

```powershell
.\.venv\Scripts\python.exe serve.py
```

It listens on `http://127.0.0.1:8000`.

Health check in PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:8000/health'
```

Classify by file path in PowerShell:

```powershell
$body = @{
  image_path = 'C:\path\to\image.jpg'
} | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Method Post `
  -Uri 'http://127.0.0.1:8000/classify/path' `
  -ContentType 'application/json' `
  -Body $body
```

Optional tuning fields for the request body:

- `binary_threshold`
- `top_k`

Classify by file upload in PowerShell:

```powershell
$form = @{
  file = Get-Item 'C:\path\to\image.jpg'
}

Invoke-RestMethod `
  -Method Post `
  -Uri 'http://127.0.0.1:8000/classify/file' `
  -Form $form
```

If you want `curl`, use `curl.exe` from `cmd.exe` or bash. In PowerShell, `curl` is usually an alias for `Invoke-WebRequest`, so standard curl flags like `-H` and `-d` do not behave the same way.

Minimal Node example:

```js
const response = await fetch("http://127.0.0.1:8000/classify/path", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image_path: "C:\\path\\to\\image.jpg" }),
});

const result = await response.json();
console.log(result);
```

## First Run

The first run downloads the CLIP model weights into the local Hugging Face cache. After that, inference runs locally.
"# wearwise-ai" 
