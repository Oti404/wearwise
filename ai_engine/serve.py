import uvicorn
import os
from dotenv import load_dotenv

# Load local .env
load_dotenv()

if __name__ == "__main__":
    # In cloud environments (Hugging Face, Render), host MUST be 0.0.0.0
    # and port is often provided via the PORT environment variable.
    host = os.getenv("AI_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("AI_PORT", 7860)))
    print(f"[AI Engine] Starting server on {host}:{port}")
    uvicorn.run("service:app", host=host, port=port, reload=False)
