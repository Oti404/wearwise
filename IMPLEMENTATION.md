# IMPLEMENTATION.md

## Task Overview
Fix the `ERR_CONNECTION_REFUSED` / "Could not reach AI service" error that occurs during AI image validation on the Add Item screen. Three overlapping root causes have been identified.

---

## Root Cause Analysis

### Root Cause 1 — Port mismatch in `ALL` mode
`scripts/dev/config.bat` defines `AI_PORT=5001`. The orchestrator (`START_ALL`) injects `AI_ENGINE_URL=http://localhost:5001` into the backend process. However, the AI engine (`ai_engine/serve.py`) is launched without the `AI_PORT` environment variable being forwarded to the subprocess, causing it to default to port **7860**:
```python
port = int(os.getenv("PORT", os.getenv("AI_PORT", 7860)))
```
The backend targets port 5001, the AI engine listens on 7860 — guaranteed connection refused.

### Root Cause 2 — Frontend hits deployed backend in `ALL` mode
The orchestrator's `START_ALL` launches the frontend with a plain `npx expo start`, without overriding `EXPO_PUBLIC_API_URL`. The value from `frontend/.env` remains `https://wearwise-api-6ltc.onrender.com` (the Render-deployed backend). All AI validation requests therefore bypass the local backend entirely and hit the deployed instance, whose `AI_ENGINE_URL` points to a Hugging Face Space that may be sleeping.

### Root Cause 3 — Error message swallowing in `validateImage()`
The `catch {}` block in `frontend/app/add-item.tsx` always surfaces `'Could not reach AI service'` regardless of the actual failure (HTTP 400, 503, CORS block, network timeout). When the backend returns a descriptive error (e.g., a 503 `"Serviciul AI nu este disponibil momentan."`), the real message is discarded, making debugging impossible.

---

## Step-by-Step Execution Plan

### 1. Fix AI Engine Port Forwarding in Orchestrator
* **Branch:** `fix/orchestrator-ai-port`
* **Target:** `scripts/dev/orchestrator.bat`
* **Action:** Pass `AI_PORT` explicitly to the AI engine subprocess so it binds to the same port the backend expects.
* **Details:**
    * In `:START_ALL`, change the `START_SERVICE` call for `AI_ENGINE` from:
      ```bat
      call :START_SERVICE "AI_ENGINE" "0A" "%AI_DIR%" "!PYTHON_CMD! serve.py"
      ```
      To:
      ```bat
      call :START_SERVICE "AI_ENGINE" "0A" "%AI_DIR%" "set AI_PORT=%AI_PORT%&& !PYTHON_CMD! serve.py"
      ```
    * This ensures `serve.py` binds to `AI_PORT` (5001), matching the `AI_ENGINE_URL=http://localhost:5001` injected into the backend.

### 2. Fix Frontend API URL Override in `ALL` Mode
* **Branch:** `fix/orchestrator-ai-port`
* **Target:** `scripts/dev/orchestrator.bat`
* **Action:** Override `EXPO_PUBLIC_API_URL` for the frontend process in `ALL` mode so it targets the local backend.
* **Details:**
    * In `:START_ALL`, change the `START_SERVICE` call for `FRONTEND` from:
      ```bat
      call :START_SERVICE "FRONTEND" "09" "%FRONTEND_DIR%" "npx expo start"
      ```
      To:
      ```bat
      call :START_SERVICE "FRONTEND" "09" "%FRONTEND_DIR%" "set EXPO_PUBLIC_API_URL=http://localhost:%BACKEND_PORT%&& npx expo start"
      ```
    * This mirrors the existing behavior already correctly implemented in `:START_LOCAL`.

### 3. Improve Error Propagation in `validateImage()`
* **Branch:** `fix/ai-validation-error-handling`
* **Target:** `frontend/app/add-item.tsx`
* **Action:** Surface the real error message from the backend response instead of swallowing it with a generic fallback.
* **Details:**
    * When `!aiRes.ok`, read the response body and extract the `message` field before throwing:
      ```typescript
      if (!aiRes.ok) {
        const errBody = await aiRes.json().catch(() => ({}));
        throw new Error(errBody.message || `Server error (${aiRes.status})`);
      }
      ```
    * In the `catch` block, use the caught error's message instead of a hardcoded string:
      ```typescript
      } catch (err: any) {
        next[index] = { status: 'invalid', error: err.message || 'Could not reach AI service' };
      }
      ```
    * This way a sleeping HF Space (503), a bad request (400), or a CORS block each surface a distinct, actionable message to the user.

---

## Verification Plan
1. Run `run.bat` → `ALL`.
2. Navigate to Add Item and upload a clothing image.
3. Verify in the backend console window that the request arrives at `POST /ai/analyze`.
4. Verify in the AI engine console window that the request is received on port 5001.
5. Confirm the validation status transitions: `validating` → `valid` with auto-fill triggered.
6. Upload a non-clothing image and confirm the overlay shows the specific rejection reason from the AI engine.

---

## Claude Technical Notes [C]
* Fix 1 and Fix 2 are both in `orchestrator.bat` and can land in the same branch/commit.
* Fix 3 is frontend-only and can be a separate commit or bundled — the scope is small enough for either.
* The `START_LOCAL` flow already handles the frontend URL override correctly (`orchestrator.bat:134`). Fix 2 brings `ALL` mode to parity with `LOCAL`.
* `aiService.js` contains Romanian error strings (`'Serviciul AI nu este disponibil momentan.'`). These violate the English-only policy in `CODING_STANDARDS.md` and should be addressed in a separate `chore/` branch.
