# WearWise AI Engine — CPU-only inference image
FROM python:3.12-slim

# Non-root user; HF_HOME keeps the baked model cache inside the user's home.
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH" \
    HF_HOME=/home/user/.cache/huggingface \
    HF_HUB_DISABLE_XET=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# CPU wheels first: the default PyPI torch bundles CUDA (~2.5 GB) that a GPU-less server never uses.
RUN pip install --user torch==2.10.0 torchvision==0.25.0 --index-url https://download.pytorch.org/whl/cpu

COPY --chown=user requirements.txt .
RUN pip install --user -r requirements.txt

# Bake CLIP into the image so the container never downloads it at runtime. Only the files the service
# loads are fetched: a plain from_pretrained() also pulls a converted safetensors copy (~600 MB more).
# The second command proves the model loads offline, exactly as it will at runtime.
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download('openai/clip-vit-base-patch32', allow_patterns=['*.json', '*.txt', 'pytorch_model.bin'])" \
 && HF_HUB_OFFLINE=1 python -c "from transformers import CLIPModel, CLIPProcessor; name = 'openai/clip-vit-base-patch32'; CLIPProcessor.from_pretrained(name, use_fast=False); CLIPModel.from_pretrained(name)"

COPY --chown=user . .

# A clone without git-lfs ships a ~130-byte pointer instead of the checkpoint; fail the build, not the first request.
RUN python -c "import pathlib, sys; p = pathlib.Path('artifacts/binary_clothing/best_binary_clothing.pt'); data = p.read_bytes()[:64] if p.exists() else b''; sys.exit(0 if data.startswith(b'PK') else 'Binary checkpoint missing or is a Git LFS pointer: install git-lfs and run git lfs pull before building.')"

# Everything is baked in; forbid Hugging Face network access at runtime.
ENV HF_HUB_OFFLINE=1 \
    PORT=7860

EXPOSE 7860

# Models load before the server reports ready; allow generous startup time on small CPUs.
HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=3 \
  CMD python -c "import json, sys, urllib.request; r = urllib.request.urlopen('http://127.0.0.1:7860/health', timeout=4); sys.exit(0 if json.load(r).get('ready') else 1)"

CMD ["python", "serve.py"]
