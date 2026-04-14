
This implementation plan focuses on resolving four specific bugs reported in the WearWise application: resolving 404 refresh errors on the deployed frontend, fixing the clothing addition flow (AI service connectivity), updating a hardcoded text in the profile component, and fixing a layout overflow issue caused by long address strings.

## User Review Required

> [!IMPORTANT]
> Please review the proposed fixes, including the newly added layout fix for the `ProfilePage`. Let me know if you would prefer an Infrastructure-as-Code (`render.yaml`) approach for the Render 404 issue instead of the manual dashboard fix.

## Proposed Changes

### [Render Deployment - 404 on Refresh]
**Summary:** When refreshing the Expo Web app hosted on Render, the server returns a 404 because it tries to look for the file path on disk instead of serving the SPA router (`index.html`).
**Action:** Since the frontend is likely hosted as a Static Site on Render, you must configure a Rewrite rule.
* Go to the **Render Dashboard** -> Select your Static Site -> **Redirects/Rewrites**.
* Add a new rule:
  * **Source:** `/*`
  * **Destination:** `/index.html`
  * **Status:** `Rewrite` (or 200)

### [AI Engine Connection / Add Clothing Flow]
**Summary:** The "Add Item" flow fails locally because of port misalignments between the backend and AI Engine, and the frontend connects to the production backend in `ALL` mode. Error messages are also swallowed by the frontend.

#### [MODIFY] [orchestrator.bat](file:///d:/Workshop/WearWiseApp/scripts/dev/orchestrator.bat)
* Modify the `AI_ENGINE` start command to pass the explicit port: `set AI_PORT=%AI_PORT%&& !PYTHON_CMD! serve.py`.
* Override `EXPO_PUBLIC_API_URL` for the `FRONTEND` start command in `ALL` mode to explicitly target `localhost`.

#### [MODIFY] [add-item.tsx](file:///d:/Workshop/WearWiseApp/frontend/app/add-item.tsx)
* Update `validateImage()` to correctly extract and surface the real error message payload (`errBody.message`) when validation fails, instead of swallowing it with a generic fallback.

### [Profile Component Text Update]

#### [MODIFY] [ProfilePage.tsx](file:///d:/Workshop/WearWiseApp/frontend/components/ProfilePage.tsx)
* Update the hardcoded string at line 344.
* **From:** `My Circular Wardrobe ♻️`
* **To:** `My Wardrobe`

### [Profile Component Layout Fix]
**Summary:** If a user's address is extremely long, it pushes the action buttons (Logout, Settings) off the right side of the screen because the text container isn't bounded to shrink.

#### [MODIFY] [ProfilePage.tsx](file:///d:/Workshop/WearWiseApp/frontend/components/ProfilePage.tsx)
* Add `flex: 1` to `styles.userInfoRow` and `styles.nameContainer`.
* Add `flexShrink: 1` to `styles.locationContainer` and `styles.nameSection`.
* Ensure `<Text style={[styles.userLocation]}>` has `numberOfLines={1}` so it truncates cleanly with an ellipsis instead of wrapping or pushing siblings out of bounds.

## Open Questions

> [!WARNING]  
> * **For Bug 1:** Have you already configured standard Rewrites in the Render dashboard, or would you like me to create a `render.yaml` file so Render picks up the configuration automatically?
> * **For Bug 3:** Is "My Wardrobe" what you want, or do you prefer a different text entirely?
> * **For Bug 4:** Is truncating the address text to a single line with an ellipsis (`...`) acceptable for the header UI?

## Verification Plan

### Manual Verification
1. Apply the Rewrite rule to Render and verify refreshing a subpage (e.g. `/profile`) successfully loads the SPA.
2. Open the app locally using `run.bat` (ALL mode) and verify the Add Item flow properly connects to the AI engine on port 5001.
3. Verify the "My Wardrobe" text appears on the Profile page.
4. Set an extremely long address for your user profile and verify that the Logout and Settings buttons remain cleanly docked on the top right without overflowing.
