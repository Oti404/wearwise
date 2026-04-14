# IMPLEMENTATION.md

## Task Overview
Resolve the `ERR_CONNECTION_REFUSED` error that occurs during AI image validation on the Add Item screen.

## Root Cause Analysis
By analyzing the necessary files, I discovered the following:
1. **Frontend (`frontend/app/add-item.tsx`)**: The UI is attempting to send the image blob directly to `EXPO_PUBLIC_AI_URL` (which points to `http://localhost:7860/classify/file`). This fails because browsers and mobile emulators often block direct local network requests, or `localhost` simply does not map to the AI Engine for the deployed/runnable frontend.
2. **Backend Engine (`backend/routes/aiRoutes.js` & `backend/services/aiService.js`)**: The backend actually already has a dedicated, secure proxy route setup specifically for this (`POST /ai/analyze`). The backend uses `multer.single('image')` to receive the file, attaches the required secret tokens, and safely forwards it to the Python AI engine.

**Conclusion**: We need to route the frontend's image validation traffic through the backend rather than attempting to hit the AI engine directly.

## Step-by-Step Execution Plan

### 1. Refactor Frontend AI Validation Route
* **Branch:** `fix/add-item-connection-refused`
* **Target:** `frontend/app/add-item.tsx`
* **Action:** Route AI classification requests through the Node.js backend proxy.
* **Details:**
    * Replace the `EXPO_PUBLIC_AI_URL` environment variable reference with `EXPO_PUBLIC_API_URL` (which points to the deployed backend).
    * Update the fetch URL inside `validateImage()` from `${AI_URL}/classify/file` to `${API_URL}/ai/analyze`.
    * Modify the `FormData.append()` key. It currently sets the file under the key `'file'`, but the backend `aiRoutes.js` explicitly expects `'image'` via `upload.single('image')`.
      ```javascript
      // Change from:
      formData.append('file', blob, `image_${index}.jpg`);
      // To:
      formData.append('image', blob, `image_${index}.jpg`);
      ```

### 2. Clean Up Redundant Configuration
* **Branch:** `fix/add-item-connection-refused`
* **Target:** `frontend/.env`
* **Action:** Remove obsolete client-side environment variables.
* **Details:**
    * Delete the line `EXPO_PUBLIC_AI_URL=http://localhost:7860`. The frontend should never hold environment variables pointing directly to the hidden AI engine, as this represents both an architectural flaw and a minor security risk.
    * (The backend's own `.env` will continue securely maintaining the `AI_ENGINE_URL` mapping to the Python microservice).

## Verification Plan
1. Start the React Native development server (e.g., using `run.bat` or `npm run web`).
2. Navigate to the Add Item screen and upload a test image.
3. Observe the web developer console / Network tab: Ensure the payload goes to `[API_URL]/ai/analyze` rather than `http://localhost:7860`.
4. Ensure the validation UI updates properly ("Your image is valid") and the auto-fill functions work correctly without raising the "Could not reach AI service" error.
