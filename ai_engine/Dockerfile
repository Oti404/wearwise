# AI Engine Dockerfile for Hugging Face Spaces
FROM python:3.10-slim

# Set up a new user named "user" with user ID 1000
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy requirements and install
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Bake CLIP weights into the image so the container never downloads them at runtime
RUN python -c "from transformers import CLIPModel, CLIPProcessor; name = 'openai/clip-vit-base-patch32'; CLIPProcessor.from_pretrained(name, use_fast=False); CLIPModel.from_pretrained(name)"

# Copy the rest of the application
COPY --chown=user . .

# Hugging Face Spaces run on port 7860
EXPOSE 7860

CMD ["python", "serve.py"]
