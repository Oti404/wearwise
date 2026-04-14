# WearWise Developer Guide & Local Playbook (DEVELOPER_GUIDE.md)

This document contains instructions for running the monorepo locally and taking advantage of the automated development pipeline scripts.

## Prerequisites
Before you begin, ensure your local development environment strictly meets these requirements to avoid onboarding failures:
- **Node.js**: `>=18.x`
- **Python**: `>=3.10.x`
- **PostgreSQL**: Running instance or Docker container.

*(Note: Advanced DB Migration and Seeding workflows are currently pending script implementation. Refer to `TODO.md`)*

## Step-by-Step Local Setup

1. **Clone the Repository**
   ```bash
   git clone <repo-url>
   cd WearWiseApp
   ```

2. **Install Dependencies**
   Run the setup script which installs all Node and Python dependencies automatically:
   ```bash
   ./scripts/setup_project.bat
   ```

3. **Environment Setup**
   Duplicate the example environment paths. You must configure the DB URL and APIs manually:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp ai-engine/.env.example ai-engine/.env
   ```

4. **Start the Application**
   Run the orchestrator script to spin up the Frontend, Backend, and AI Engine concurrently:
   ```bash
   ./scripts/orchestrator.bat
   ```

## Common Issues & Troubleshooting
- **Port Conflicts:** The Orchestrator expects Frontend on `3000`, Backend on `5000`, AI Engine on `8000`. If any of these fail to open, check for background processes hogging the port using `netstat -ano`.
- **Database Connection Failures:** Ensure `DATABASE_URL` in `backend/.env` is strictly formatted (`postgres://user:password@localhost:5432/dbname`) and Postgres is actively running.
- **AI Engine Boot Error:** If Python fails with `ModuleNotFoundError`, your virtual environment didn't initialize correctly. Run `python -m venv venv` manually in the `ai-engine` folder and install `requirements.txt`.
- **Hugging Face LFS Sync Error (`_pickle.UnpicklingError: invalid load key, 'v'`):**
  - **Context:** When syncing AI models to Hugging Face Spaces from a private GitHub repository, HF Spaces often fails to authenticate to GitHub's Large File Storage (LFS). Instead of downloading the actual binary `.pt` files, it downloads the text-based LFS pointers (which start with 'version...', hence the 'v' key error in PyTorch).
  - **Solution:** For models smaller than 50-100MB (like `best_binary_clothing.pt`), bypass Git LFS entirely. Run `git lfs untrack "*.pt"`, `git rm --cached <file>`, and add/commit it as a standard native Git blob. This completely eliminates dependency on external LFS permissions and allows Hugging Face to clone the model natively.

## Automation Scripts Ecosystem
The monorepo architecture utilizes an array of scripts located under the `/scripts/` directory:
- **`orchestrator.bat`** – Reads `.env` and concurrently boots `npm run dev` (frontend), `npm run dev` (backend API), and `python main.py` (AI).
- **`run_tests.bat`, `test_api.js`, `check_db.js`** – Execute verifications and validate API/Database stability.
- **`sync.bat` / `bootstrap_wearwise.bat` / `setup_project.bat`** – Facilitate operations like environment bootstrapping and pip installs.

*This file acts as a living document. Any new CLI tools added to the repository should be documented here.*
