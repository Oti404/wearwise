# 🛠️ WearWise - Arhitectura Backend

Acest document descrie logica de business, gestiunea datelor, securitatea și punctele REST API pentru Backend-ul aplicației WearWise. Backend-ul este complet curățat de Firebase legacy, rulând într-un mediu PostgreSQL modern, rapid și eficient din punct de vedere a controlului de tip (type checking).

## ⚙️ Stack-ul Tehnologic Backend

*   **Mediu de rulare**: Node.js, implementat cu framework-ul web **Express.js**.
*   **Baza de date**: **PostgreSQL**, hostat pe o componentă tip serverless sau instanță directă definită de Supabase/Neon.
*   **ORM**: **Drizzle ORM** (`drizzle-orm`) – complet Type-Safe, alături de asistentul CLI de migrații `drizzle-kit`.
*   **Platformă Auxiliară**: `@supabase/supabase-js` pentru integrarea de autentificare și logica de storage (imagini trimise).
*   **Securitate**: Rate Limiting (`express-rate-limit`), Headers hardening (`helmet`), cross-origin filtering (`cors`), validare riguroasă a payloadurilor (`zod`).

## 🗄️ Modelarea Datelor (Drizzle Schemas)

Sistemul reprezintă o rețea socială combinată cu un markeplace de modă (wardrobe). Schema completă o găsiți în `drizzle/schema.ts`
Entități cheie:
1.  **`users`**: Stochează profilul, avatarul, metrice agregate (countere follower, scor rating) și ID-ul nativ legat extern `authUid`.
2.  **`clothes`**: Entitatea centrală. Leagă hainele postate de autor (`userId`). Ține starea produsului, locația geocodată, datele extrase de AI precum `category`, detalii și interacțiunea de achiziție `buyer_id`.
3.  **`clothing_images`**: Gestionează instanțe multiple poze (1 haină are multe imagini) care pot primi pe viitor și capabilități avansate vectoriale (observati tipul `vector(512)` pentru `aiEmbedding` – destinat căutărilor vizuale avansate similar Pinterest).
4.  **`notifications`**, **`ratings`**, **`follows`**: Controlează sistemul de relații pe orizontală între entități. Toate conțin constraint-uri de tip cascadă (Cascade Delete) prin UUID-uri.

## 🔀 Structura Proiectului Backend
Miza este decuplarea clară dintre rute, validare, serviciu și modele.
*   **`index.js` / `server.js`**: Punctul de bootstrap, unde se aplică bind la portul standard.
*   **`app.js`**: Rețeaua Express. Aplică secvențial Middlewares. Aici se face Catch la absolut toate erorile non-asincrone prin `express-async-errors`.
*   **`/routes/`**: Punctele de intrare ce grupează pe domenii logice requesturile (`userRoutes.js`, `clothesRoutes.js`, `aiRoutes.js`).
*   **`/controllers/`**: Primește Input-ul standard Express (Request), apelează servicii și produce Răspuns (Response) JSON uniform.
*   **`/services/`**: Inima aplicației. Logica pură. Cum se leagă baza de date de Drizzle cu un business flow; ex: Când se cumpără un item, se creează entitatea checkout, se generează notificarea etc.
*   **`/validators/`**: Pachete Zod ce validează structural Body-urile requesturilor pre-business logic. Aici ne asigurăm că nu sunt "spaghetti properties".
*   **`/middlewares/`**: Protejarea endpoint-urilor prin token checking și interceptoare custom (precum RequestLogger).
*   **`/scripts/`** & **`/drizzle/`** : Conține seed-uri bogate (`seed.js`, `sql_seed.js`) pentru popularea bazei de date.

## 🤖 Legătura cu AI Engine

Backend-ul are rolul de proxy pentru procesarea de deep learning a hainelor.
Rute predefinite in `aiRoutes` abstractizează acest flux:
1. User incarca poza -> intra pe router haină/AI  -> Poza ajunge stocată temporar sau direct trimisă mai departe via Axios ca Form-Data sau ca Path în caz de filesystem comun local.
2. Din Python Engine, Node primește analiza JSON formatată: `is_clothing`, `label`, iar dacă se validează, back-end-ul construiește cu acel payload un Row in tabelul `clothes` sau trimite un rejection clar si explicativ utilizatorului.

## 🚧 Reguli de Scriere Cod
*   Fără interpelări "Raw Query" in afara de query-urile complexe tip "Full Text Search/Similarity Search". Se vor folosi doar apeluri Drizzle ORM pre-validate.
*   Fără funcții asincrone expuse pe rute fără pre-wrap standard care e asigurat în config. Recomandare: Aruncați instanțe de `AppError(mesaj, statusCode)` – acestea vor fi uniform "catchuite" și transmise înapoi aplicației sub formă de JSON descriptiv, nu sub formă de stack HTML crăpat.
