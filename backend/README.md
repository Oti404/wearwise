# WearWise Backend

Acest modul Node.js reprezintă motorul principal al aplicației, responsabil pentru API-urile esențiale, gestionarea datelor prin Drizzle ORM și interacțiunea cu baza de date SQL.

## Structura Bazei de Date

Toate operațiile specifice bazei de date sunt documentate separat în [docs/DATA_FLOW.md](./docs/DATA_FLOW.md). Acolo poți găsi informații despre cum să trimiți poze, ce query-uri să folosești și cum comunică serviciile între ele.

## Rulare Locală

Pentru a rula serverul independent de restul modulelor:

1. Asigură-te că pachetele Npm sunt instalate:
   ```bash
   npm install
   ```
2. Ai nevoie de un fișier `.env` valid în root-ul backend-ului conform cu `.env.example`.
3. Pornește serverul:
   ```bash
   npm start
   # sau npm run dev
   ```

Alternativ, din directorul root al monorepo-ului:
```bash
../run.bat backend
```

## Arhitectură
- `server.js` / `app.js` -> Punctele de intrare ale backend-ului.
- `routes/` -> Definirea endpoint-urilor express.
- `controllers/` -> Logica de prelucrare a cererilor.
- `services/` -> Logica de business complexă.
- `database/` / `drizzle/` -> Scheme, conexiuni la baza de date și scripturi seed.
- `docs/` -> Documentația aprofundată a modului backend.
