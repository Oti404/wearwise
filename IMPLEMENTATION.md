# IMPLEMENTATION.md

## Task Overview
Resolve UI proportion bugs on the web/mobile swipe interface, fix layout shifting caused by filter menus, restructure the wardrobe list into a 2-column grid, and implement the synchronous AI validation flow for adding new items.

## Step-by-Step Execution Plan

### 1. Swipe Page Header Reorganization (UI/UX Refactor)
* **Branch:** `ui/swipe-header-refactor`
* **Target:** `app/(tabs)/discover.tsx` (or the equivalent Swipe screen component).
* **Action:** Restructure the top header `StyleSheet` containers.
* **Details:**
    * Move the Tabs ("DISCOVER", "COMMUNITY") to the absolute top, ensuring they are properly protected by `SafeAreaView` or padded using `useSafeAreaInsets()` so they aren't hidden behind the device notch or status bar.
    * Consolidate the main header into a single row: Title ("For You"), a collapsed Search Icon, the Filter Icon, and the Notification Bell.
    * Ensure the main swipe container receives a strict `flex: 1` property with `justifyContent: 'center'` and `alignItems: 'center'` so the cards scale proportionately within the maximum available vertical space without squishing.

### 2. Isolate the Filter Menu (Bottom Sheet Implementation)
* **Branch:** `feat/filter-bottom-sheet`
* **Target:** The component rendering the "Rază de Căutare" (Distance Filter).
* **Action:** Move the filter completely out of the inline document flow into a Bottom Sheet overlay.
* **Details:**
    * Remove the filter from the header DOM structure.
    * Implement a Bottom Sheet overlay. Ideally, use a robust library like `@gorhom/bottom-sheet` for a snappy, native-feeling gesture experience (swipe-to-close). If not installed, fallback to a standard React Native `<Modal visible={isFilterOpen} animationType="slide" transparent={true}>`.
    * Bind the Filter Icon in the header to toggle `isFilterOpen`. 
    * This guarantees that adjusting the distance filter will overlay the UI from the bottom up, never triggering a resize of the `flex: 1` swipe container below it.

### 3. Wardrobe Highlights Grid Layout
* **Branch:** `ui/wardrobe-grid-layout`
* **Target:** The Profile / Wardrobe component (e.g., `app/profile.tsx` or `components/WardrobeList.tsx`).
* **Action:** Update the list container to a 2-column grid.
* **Details:**
    * If using `FlatList`: Add the `numColumns={2}` prop. Adjust the `columnWrapperStyle` to apply `justifyContent: 'space-between'` to ensure proper visual spacing (a clean gap) between the cards, alongside horizontal padding.
    * If using a standard `ScrollView` with `.map()`: Add `flexDirection: 'row'`, `flexWrap: 'wrap'`, and `justifyContent: 'space-between'` to the wrapper container. Set the individual item card width to `48%` to leave a small clean gap in the center.

### 4. Add Item Page: AI Image Validation & Status Flow
* **Branch:** `feat/add-item-ai-validation`
* **Target:** The `add_item` screen/component.
* **Action:** Implement real-time status labels, AI validation gating, auto-fill, and async wardrobe synchronization.
* **Details:**
    * **Status UI:** Add dynamic descriptive labels indicating the current lifecycle of the image processing. Required states:
        * *"You must upload an image..."* (Initial/Empty)
        * *"Your image is being processed..."* (Uploading to AI Module)
        * *"Your image is valid"* (Success, returning JSON)
        * *"Your image is invalid"* (Failed AI check)
    * **Validation Gating:** Ensure that every single image uploaded goes through `ai_module` validation. If any image fails validation, the final "Upload Item" action must be explicitly disabled and prevented.
    * **AI Auto-Fill:** Once an image is correctly validated, automatically parse the returning JSON response from `ai_module` and map it to automatically populate the empty fields in the UI.
    * **Async Sync:** The final "Upload Item" process requires asynchronous handling. Show a progress/loading state while saving to the database. Once the network request finishes successfully, transition the user to their Wardrobe view and ensure the new item is present.

---

### Claude Technical Notes [C]

#### Task 1 — Swipe Header
- **Wrong target file in plan.** `app/(tabs)/discover.tsx` does not exist. The real target is `components/SwipeView.tsx`, rendered by `app/(tabs)/index.tsx`.
- `useSafeAreaInsets()` is already in use at `SwipeView.tsx:33`. No changes needed there.
- `SwipeCard.tsx` already uses `resizeMode="cover"` with `overflow: 'hidden'`. Antigravity's concern is already handled.
- The `Menu` icon at `SwipeView.tsx:202` has an empty `onPress={() => {}}` — dead UI element, should be removed or wired.
- Card height uses `availableHeight` from `onLayout` on the `cardArea` — dynamic and correct for native. On web, the `swiperContainer` style falls back to a static `CARD_HEIGHT`, which could still squish. Needs visual testing on web.
- Search is always rendered inline as a `TextInput`. The plan mentions a "collapsed Search Icon" — this is a UX redesign decision that needs to be confirmed before implementation.

#### Task 2 — Filter Bottom Sheet
- `FilterModal.tsx` is **already a bottom sheet Modal** (`animationType="slide"`, `justifyContent: 'flex-end'`). Task 2 as written is already done.
- The **actual layout-shift bug** is `RadiusSelector` rendering inline inside the header `View` at `SwipeView.tsx:255-261`. When expanded it physically compresses `cardArea`.
- Fix: extract `RadiusSelector` into a standalone `<Modal>` bottom sheet, identical in structure to `FilterModal`. No new dependencies needed.
- `RadiusSelector.tsx` contains Romanian strings (`Rază de căutare`, `Aproape`) — violates the English-only documentation policy from `CODING_STANDARDS.md`.

#### Task 3 — Wardrobe Grid
- **Already fully implemented.** `ProfilePage.tsx:543` has `closetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }` with items at `width: (width - 48 - 16) / 2`.
- Minor gap: `closetImage` at `ProfilePage.tsx:369` has no explicit `resizeMode` prop. Container height is fixed at 180 so stretching won't occur, but `resizeMode="cover"` is still best practice.

#### Task 4 — AI Image Validation
- **AI Engine API contract confirmed.** FastAPI server, endpoint: `POST /classify/file` (multipart form, field name `file`).
- Response shape:
  ```json
  {
    "is_clothing": true,
    "label": "t_shirt",
    "confidence": 0.85,
    "ai_suggestions": {
      "name": "Premium T Shirt",
      "category": "T-shirts",
      "description": "A beautiful t-shirt...",
      "is_safe": true
    }
  }
  ```
- **Validation gate logic:** block save if `is_clothing === false` OR `ai_suggestions.is_safe === false`.
- **Auto-fill mapping:** `ai_suggestions.name → form.name`, `ai_suggestions.category → form.category`, `ai_suggestions.description → form.description`.
- **Multi-image handling:** `add-item.tsx` supports `allowsMultipleSelection: true`. Each image needs its own validation state: `idle | validating | valid | invalid`. Save button disabled unless ALL images are `valid`.
- **Env var needed:** `EXPO_PUBLIC_AI_URL` must be added to `.env` and `.env.example`.
- **Send strategy:** Use `fetch` with `FormData` sending the local URI as a blob. The AI engine is called with the local image before Supabase upload — validates cheaply without wasting storage on invalid items.
- **Current fire-and-forget behavior** (`router.back()` before `addClothes()` resolves) must be reworked: the screen should stay open, show async progress, then navigate to the wardrobe tab on success via `router.replace('/(tabs)/profile')`.

---

### Antigravity Architectural Notes
* **Performance Warning:** When switching to a 2-column grid in the Wardrobe view, ensure image caching is heavily optimized. Loading twice as many images per row can cause stuttering on initial render if the `Premium Coat` images are unoptimized high-res files from the backend.
* **Flexbox Constraints:** The squishing issue currently observed usually happens when an image inside a flex container has `flex: 1` but no bounded `minHeight`. Claude should verify the image `resizeMode` is set to `cover` with `overflow: 'hidden'` on the card border radius.