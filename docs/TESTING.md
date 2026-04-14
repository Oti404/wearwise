# Documentație Testare (TESTING)

Acest document explică fluxul de testare a conexiunilor și validare a datelor integrat în WearWise.

## 1. Testare de Conexiuni și Endpoints
Avem un set de instrumente deja pregătite pentru a testa comportamentul întregului monorepo (Frontend-Backend-Database).

- **`run_tests.bat`**: Acesta este punctul central de pornire pentru teste automate locale în sistemul nostru pe Windows. Când rulezi `./run_tests.bat`, scriptul apelează la rândul lui modulele de verificare Node.js.
- **`test_api.js`**: Rulează suita de teste HTTP pentru endpoint-urile din Backend. Acesta face apeluri către Express API pe portul default (ex. `3001` sau `8080`) și așteaptă răspunsuri `200 OK`.
- **`check_db.js`**: Acest script se conectează prin Drizzle/Client-ul la Supabase SQL și validează dacă prezența schemelor corespunde, verifică dacă tabelele obligatorii (users, posts etc.) există și întoarce o stare verde de funcționare.

## 2. Rularea Automată la Sync
Când folosești sistemul nostru `sync.bat` sau `sync_universal.bat` pentru a integra cod cu branch-ul principal, e recomandat și integrat un `pre-check` care cheamă aceste teste. Dacă backend-ul pică sau baza de date nu răspunde, procesul ar trebui să se oprească înainte de a ajunge în producție.

## Cum să adaugi teste noi
Orice endpoint nou expus în `backend/routes/` trebuie însoțit de o validare în fișierul `test_api.js` (sau într-o suită viitoare pe bază de framework-uri ca Jest/Mocha).
Testele pentru baza de date (dacă adaugi tabele noi) trebuie adăugate în scriptul `check_db.js` sau într-un alt script pe care te asiguri că îl execuți în `run_tests.bat`.
