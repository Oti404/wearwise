# WearWise Frontend

The WearWise web app, built with Expo (React Native for Web) and Expo Router. It is **web-only**: Expo is used to produce a static web export, which nginx serves in production. There are no native iOS or Android builds.

## Run
- **With the whole stack (recommended):** `docker compose up -d --build` from the repo root, then open http://localhost:8080.
- **Dev server with hot reload:** start the backend first (Option B in [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)), then:
  ```bash
  cp .env.example .env   # EXPO_PUBLIC_API_URL=http://localhost:3000
  npm install
  npx expo start --web   # http://localhost:8081
  ```

`EXPO_PUBLIC_*` variables are baked into the bundle at build time. The Docker image is built with `EXPO_PUBLIC_API_URL=/api` (same origin, proxied by nginx), so the same image works on any domain.

## Production image
`Dockerfile` builds in two stages: `npx expo export --platform web`, then `nginx:alpine` with `deploy/nginx.conf`:
- serves the app with SPA fallback to `index.html`, so deep links work
- proxies `/api/` to the backend container
- caches hashed bundles under `/_expo/` for a year
- exposes `/healthz` for the container health check

## Structure
```text
app/          Expo Router screens: (tabs), item/[id], user/[id], resale/[id], add-item, login, register
components/   UI components (SwipeView, ProfilePage, LocationPicker, ...)
config/       apiClient.ts: API base URL, token storage, authHeaders(), uploadImage()
hooks/        useAuth, useClothes, useUser, useFollow
store/        Zustand store (session, cart, filters), persisted to AsyncStorage
deploy/       nginx.conf for the production image
```

**Auth.** `useAuth` calls `/auth/register` and `/auth/login` and stores the JWT through `apiClient`. `app/_layout.tsx` restores the session at startup with `GET /auth/me`. A 401 signs the user out; a network error keeps the cached profile.

**Maps.** `LocationPicker` uses Leaflet with OpenStreetMap tiles and Nominatim geocoding. These are free public services with usage limits; high traffic needs a paid or self-hosted provider.

**Known issue.** `components/ui/` contains unused template components that do not type-check; they are not imported anywhere.
