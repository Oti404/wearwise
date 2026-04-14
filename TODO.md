# WearWise MVP - Reality Check Task Log (TODO.md)

This tracks the immediate development tasks based on our current Mobile / Express architecture baseline. Everything here must bridge the gap between our current state and our ideal architectural standards.

## High Priority (MVP Focus)

- [ ] **1. MVP Auth Flow (Mobile Client)** 
  - **Execuție:** Implement JWT Login system in Expo React Native. Persist the Refresh Token using `@react-native-async-storage/async-storage` and set up Axios Interceptors for the Access Token.
  - **📘 Docs Post-Implementation:** 
    1. Go to `ARCHITECTURE.md` -> Add "Authorization Token Handshake Mermaid Diagram (Mobile Auth)" under System Topology.
    2. Go to `CODING_STANDARDS.md` -> Re-add the "Security & API Authentication (Mobile Native)" section stating expiration targets (15m Access / 7 Day Refresh).

- [ ] **2. Auth Controllers (Backend)**
  - **Execuție:** Create robust Express `/login` and `/auth/refresh` endpoints that generate the short-lived JSON Access Token and long-lived Refresh Token.
  - **📘 Docs Post-Implementation:** Ensure integration documentation is reflected inside `/backend/docs/`.

- [ ] **3. UI Scaffold**
  - **Execuție:** Build the foundational React Native screens using Expo Router (`/app`) and pure native `StyleSheet` (no Tailwind dependencies yet).

- [ ] **4. Python AI Integration (WearWise Data Flow)**
  - **Execuție:** Implement the direct pipeline from the Express Backend to the Python AI engine for photo parsing. Include 10-second timeout, 3 backoff retries, and failure handlers.
  - **📘 Docs Post-Implementation:** 
    1. Go to `ARCHITECTURE.md` -> Add "Data Flow for Core Business Path (WearWise Photo Upload)" flow diagram.
    2. Go to `ARCHITECTURE.md` -> Document the "AI Fallback Protocol" (e.g. failing open with `"ai_enriched": false`).

## Medium Priority (Tech Debt & Infrastructure)

- [ ] **5. Database Resiliency & Scripts**
  - **Execuție:** Map out basic Drizzle ORM queries and implement memory caching. Also, create the `db:push` and `db:seed` script blocks inside `backend/package.json`.
  - **📘 Docs Post-Implementation:** Go to `DEVELOPER_GUIDE.md` and re-add the "Database Migrations & Seeding" step-by-step paragraphs.

- [ ] **6. Testing Infrastructure Boot**
  - **Execuție:** We are currently at `0%` coverage. Configure `Jest` / `Supertest` on the backend and write exactly one integration test to prove the `/login` pipeline works.

- [ ] **7. Standardized Error Handling Middleware**
  - **Execuție:** Build an Express global error-handling wrapper that outputs JSON `{ success: false, error: {...} }`.
  - **📘 Docs Post-Implementation:** Go to `CODING_STANDARDS.md` and re-add the "Standardized Error Response Contract".