# WearWise — Superprompt Complet

> Folosește acest document ca referință completă pentru a înțelege, extinde sau debug-ui aplicația WearWise. Conține arhitectura, logica de business, toate endpoint-urile, modelele de date și deciziile de design.

---

## 1. Ce Este WearWise?

**WearWise** este o aplicație mobilă de tip marketplace secondhand pentru haine, construită ca un **monorepo** cu trei componente principale:

| Modul | Tehnologie | Port |
|---|---|---|
| `frontend/` | React Native (Expo) | — (mobil) |
| `backend/` | Node.js + Express | 5000 |
| `ai_engine/` | Python + FastAPI + CLIP | 5001 |

Utilizatorii pot **lista haine** (vânzare, donație, schimb), **explora feed-ul** altora, **cumpăra**, **da rating** vânzătorilor și **re-lista** articole cumpărate. Un AI analizează automat imaginile uploadate și sugerează categoria, tipul și condițiile hainei.

---

## 2. Structura Monorepo-ului

```
WearWiseApp/
├── frontend/          # React Native / Expo app
├── backend/           # Node.js REST API
├── ai_engine/         # Python AI classifier (CLIP)
├── scripts/           # Script-uri de dev (orchestrator, git sync)
├── docker-compose.yml # Stack local complet
├── bootstrap_wearwise.bat  # Setup inițial complet
└── run.bat            # Pornire rapidă
```

Fiecare sub-modul are propriul `.git`, [.git_remote](file:///d:/Workshop/WearWiseApp/.git_remote) și [sync.bat](file:///d:/Workshop/WearWiseApp/sync.bat) — sunt repo-uri independente care coexistă în același folder.

---

## 3. Frontend — React Native / Expo

### Stack
- **React Native** cu **Expo Router** (file-based routing)
- **Firebase Auth** (email/password) via `@react-native-firebase/auth`
- **Zustand** pentru state management global
- **TypeScript** strict
- **AsyncStorage** pentru persistență locală

### Structura `frontend/`

```
app/
  _layout.tsx          # Root layout, auth guard, Firebase init
  login.tsx / register.tsx
  add-item.tsx         # Ecran de adăugare articol (mare, 27KB)
  modal.tsx
  (tabs)/
    _layout.tsx        # Tab bar navigator
    index.tsx          # Ecranul Home
    explore.tsx        # Feed swipe cu carduri de haine
    cart.tsx           # Coș de cumpărături
    donations.tsx      # Secțiunea donații
    notifications.tsx  # Inbox notificări
    profile.tsx        # Profilul utilizatorului
  item/                # Detalii articol
  resale/              # Flow de re-listare

components/            # Componente reutilizabile
services/api/          # Servicii HTTP (fetch către backend)
store/                 # Zustand stores
types/index.ts         # Interfețe TypeScript globale
constants/index.ts     # Constante UI, rute, chei AsyncStorage
config/                # Firebase config
hooks/                 # Custom hooks
assets/                # Imagini, fonturi
```

### Modele TypeScript ([types/index.ts](file:///d:/Workshop/WearWiseApp/frontend/types/index.ts))

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;  // 'T-shirts' | 'Pants' | 'Dresses' | 'Outerwear' | 'Footwear' | 'Accessories'
  imageUrl: string;
  verified: boolean;
  score?: number;    // AI confidence score
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
}
```

### Constante UI ([constants/index.ts](file:///d:/Workshop/WearWiseApp/frontend/constants/index.ts))

```typescript
CONSTANTS.UI.PRIMARY_COLOR   = '#6C63FF'  // violet
CONSTANTS.UI.SECONDARY_COLOR = '#3F3D56'
CONSTANTS.UI.ERROR_COLOR     = '#FF5252'
CONSTANTS.UI.SUCCESS_COLOR   = '#4CAF50'

CONSTANTS.STORAGE_KEYS.AUTH_TOKEN       = '@wearwise_auth_token'
CONSTANTS.STORAGE_KEYS.USER_PREFERENCES = '@wearwise_user_prefs'
```

### Rute Tab-uri

| Tab | Descriere |
|---|---|
| `Home` | Landing cu articole recomandate |
| `Explore` | Feed de articole cu swipe |
| `Uploads` | Hainele listate de utilizatorul curent |
| `Profile` | Profil: rating, statistici, istoricul tranzacțiilor |
| `Settings` | Setări cont |

---

## 4. Backend — Node.js / Express

### Stack
- **Express.js** cu `express-async-errors` (patching global async errors)
- **Firebase Admin SDK** pentru Firestore (baza de date)
- **Helmet** — security headers
- **CORS** — configurabil din `config/corsOptions.js`
- **Rate Limiting** — `config/rateLimit.js` → `generalLimiter`
- **Multer** — upload imagini în memorie (pentru proxy AI)
- **Axios** — forward request către ai_engine
- **Zod** — validare date (în `validators/`)
- **Winston/Morgan** — logging în `middlewares/requestLogger.js`
- **AppError** — clasă centralizată de erori HTTP

### Structura `backend/`

```
app.js          # Express app (middleware + rute) — ENTRY POINT
server.js       # Pornire server (ascultă PORT)
index.js        # Versiune monolitică legacy (650 linii) — păstrat ca referință

config/
  corsOptions.js
  rateLimit.js
controllers/    # Logică de business separată
routes/
  userRoutes.js
  clothesRoutes.js
  checkoutRoutes.js
  notificationRoutes.js
  ratingRoutes.js
  aiRoutes.js
middlewares/
  requestLogger.js
  errorHandler.js
  AppError.js
services/       # Servicii Firebase, email etc.
validators/     # Scheme Zod
utils/
jobs/           # Scheduled tasks
tests/
docs/
```

### Toate Endpoint-urile REST

#### 🔐 Users

| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/register` | Creare cont — verifică unicitatea telefonului, salvează în Firestore |
| `GET` | `/user/:identifier` | Fetch profil după UID, email sau telefon |
| `PATCH` | `/user/:uid` | Update profil (adresă, avatar etc.) |

**Payload `/register`:**
```json
{ "uid", "firstName", "lastName", "email", "phone", "country", "city", "address", "latitude", "longitude" }
```

#### 👗 Haine (Clothes)

| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/clothes` | Adaugă articol nou |
| `GET` | `/clothes?excludeUser=UID` | Feed activ (exclude propriile articole) |
| `GET` | `/clothes/:id` | Detalii articol + info owner |
| `GET` | `/user-closet/:userId` | Garderoba utilizatorului (proprii + cumpărate) |

**Moduri de listare (`mode`):** `'sell'` \| `'trade'` \| `'donate'` \| `'both'`

**Status articol:** `'active'` → `'sold'` / `'deleted'`

**Payload `/clothes` (POST):**
```json
{
  "userId", "name", "description",
  "images": ["url1", "url2"],
  "category", "size", "condition",
  "mode": "sell",
  "price": 49.99,
  "latitude", "longitude"
}
```

#### 🛒 Checkout

| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/checkout` | Procesare cumpărare multiplă (Firestore batch) |
| `POST` | `/re-list` | Re-listare articol cumpărat (transfer ownership) |

**La fiecare cumpărare se declanșează automat:**
1. Articolul → `status: 'sold'`, se setează `buyerId`
2. Notificare vânzător: „Articol Vândut! 🎉"
3. Notificare cumpărător: cerere de rating
4. Update statistici vânzător: `salesCount` / `tradesCount` / `donationsCount`

#### 🔔 Notificări

| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/notifications/:userId` | Ultimele 50 notificări |

**Tipuri notificări:** `'sale_notification'` \| `'rating_request'` \| `'rating_received'`

#### ⭐ Rating

| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/ratings` | Submitere rating (1-5 stele + comentariu) |
| `GET` | `/user-ratings/:userId` | Toate ratingurile primite de un user |

**La rating:** se actualizează automat câmpurile `rating` și `reviewCount` pe documentul userului (funcția [updateUserAggregateRating](file:///d:/Workshop/WearWiseApp/backend/index.js#574-599)).

#### 🤖 AI Proxy

| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/ai/analyze` | Upload imagine → forward la ai_engine → returnează clasificare |

Backend-ul acționează ca **proxy**: primește imaginea via `multer` (`multipart/form-data`), o re-forward la `http://localhost:5001/classify/file` și returnează răspunsul AI direct clientului.

#### 🏥 Health

| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/ping` | `{ status: 'ok', timestamp: '...' }` |

### Middleware Stack (ordinea în [app.js](file:///d:/Workshop/WearWiseApp/backend/app.js))

```
helmet() → cors() → express.json({ limit:'5mb' }) → generalLimiter → requestLogger
→ [routes]
→ 404 handler
→ errorHandler (global)
```

### Firebase / Firestore — Colecții

| Colecție | Documente |
|---|---|
| `users` | Profil complet utilizator |
| `clothes` | Articole de haine |
| `notifications` | Notificări per user |
| `ratings` | Ratinguri date/primite |

---

## 5. AI Engine — Python / CLIP

### Stack
- **FastAPI** (HTTP server)
- **OpenAI CLIP** (`openai/clip-vit-base-patch32`) — model zero-shot
- **PyTorch** — inference
- **Pillow** — procesare imagini

### Cum Funcționează

Clasificatorul ([classifier.py](file:///d:/Workshop/WearWiseApp/ai_engine/classifier.py)) folosește CLIP pentru **zero-shot classification** — fără fine-tuning. Compară embedding-ul imaginii cu embedding-uri text ale unor prompt-uri descriptive.

**Pipeline:**
```
Imagine (bytes) → Pillow → CLIP image encoder
                                    ↓
               CLIP text features (prompt-uri pre-encodate)
                                    ↓
               cosine similarity → softmax → top-k predicții
```

### Categorii Detectate (30+)

`pants`, `jeans`, `shorts`, `skirt`, `dress`, `t_shirt`, `shirt`, `blouse`, `sweater`, `hoodie`, `jacket`, `coat`, `suit`, `activewear`, `leggings`, `shoes`, `sneakers`, `boots`, `sandals`, `hat`, `scarf`, `gloves`, `socks`, `underwear`, `bra`, `swimwear`, `backpack`, `flipflops`

### Mapping categorie → grup frontend

```python
CATEGORY_MAPPING = {
  "t_shirt": "T-shirts",  "shirt": "T-shirts",
  "pants": "Pants",       "jeans": "Pants",    "shorts": "Pants",
  "dress": "Dresses",     "skirt": "Dresses",  "blouse": "Dresses",
  "sweater": "Outerwear", "hoodie": "Outerwear", "jacket": "Outerwear",
  "shoes": "Footwear",    "sneakers": "Footwear",
  "hat": "Accessories",   "scarf": "Accessories",
}
```

### Safety Check

CLIP detectează și dacă imaginea este [safe](file:///d:/Workshop/WearWiseApp/ai_engine/classifier.py#287-296) sau `unsafe` (conținut explicit, nu e o haină, imagini ofensatoare) înainte de clasificare.

### Endpoint AI Engine

```
POST /classify/file
Content-Type: multipart/form-data

→ Response:
{
  "type": "t_shirt",
  "category": "T-shirts",
  "confidence": 0.87,
  "top_predictions": [...],
  "is_safe": true
}
```

---

## 6. Infrastructură & DevOps

### Docker Compose

```yaml
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    depends_on: [ai-engine]

  ai-engine:
    build: ./ai_engine
    ports: ["5001:5001"]
```

### Variabile de Mediu Backend ([.env](file:///d:/Workshop/WearWiseApp/backend/.env))

```env
PORT=5000
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
AI_ENGINE_URL=http://localhost:5001
```

**Producție:** variabilele Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) sunt setate direct ca env vars (fără fișier JSON).

### Script-uri

| Fișier | Rol |
|---|---|
| [bootstrap_wearwise.bat](file:///d:/Workshop/WearWiseApp/bootstrap_wearwise.bat) | Setup complet din zero (npm install, pip install, etc.) |
| [run.bat](file:///d:/Workshop/WearWiseApp/run.bat) | Pornire rapidă dev |
| [scripts/dev/orchestrator.bat](file:///d:/Workshop/WearWiseApp/scripts/dev/orchestrator.bat) | Pornire paralelă backend + ai_engine + frontend |
| [scripts/git/sync_main.bat](file:///d:/Workshop/WearWiseApp/scripts/git/sync_main.bat) | Git sync pentru toate sub-modulele |
| `*/sync.bat` | Git sync individual per modul |

---

## 7. Fluxuri de Business Principale

### A. Adăugare Articol cu AI

```
Utilizator foto → add-item.tsx
  → POST /ai/analyze (imagine)
    → backend proxy → ai_engine CLIP
    → răspuns: tip, categorie, confidence
  → formular pre-completat automat
  → POST /clothes (date complete)
  → articol activ în feed
```

### B. Cumpărare

```
explore.tsx → swipe / tap articol
  → item/:id (detalii)
  → adaugă în cart
  → checkout flow
    → POST /checkout { userId, items: [id1, id2] }
    → Firestore batch:
        - clothes[id].status = 'sold'
        - notif vânzător (sale)
        - notif cumpărător (rating request)
        - users[sellerId].salesCount++
```

### C. Rating

```
notifications.tsx → rating_request notification
  → POST /ratings { raterId, targetUserId, itemId, rating, comment, notificationId }
  → notif marcat completed
  → updateUserAggregateRating(targetUserId) → async
```

### D. Re-listare

```
profile.tsx / closet → articol cumpărat
  → POST /re-list { userId, itemId, updates? }
  → clothes[id].userId = buyer (transfer ownership)
  → clothes[id].status = 'active'
  → articolul apare în feed din nou
```

---

## 8. Decizii de Design Notabile

| Decizie | Rațiune |
|---|---|
| Două versiuni de backend ([app.js](file:///d:/Workshop/WearWiseApp/backend/app.js) + [index.js](file:///d:/Workshop/WearWiseApp/backend/index.js)) | [index.js](file:///d:/Workshop/WearWiseApp/backend/index.js) este versiunea monolitică legacy; [app.js](file:///d:/Workshop/WearWiseApp/backend/app.js) este arhitectura modernă pe care se lucrează activ |
| Sortare în memorie (nu `orderBy` Firestore) | Evită necesitatea de indecși compoziți în Firestore pentru fazele de dev |
| Backend proxy pentru AI | Frontend-ul nu comunică direct cu ai_engine; trece prin backend pentru auth + logging |
| CLIP zero-shot (fără fine-tuning) | Flexibilitate — categorii noi se adaugă doar prin prompt-uri text, fără re-antrenare |
| Fiecare sub-modul = repo Git independent | Permite deploy-uri independente și echipe separate pe modul |

---
