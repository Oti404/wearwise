# WearWise Frontend

Acest modul se ocupă de interfața cu utilizatorul pentru WearWise. Folosește React/React Native (sau Next.js, conform stack-ului curent) pentru a livra o experiență client premium.

## Rulare Locală

Poți rula acest modul independent astfel:

1. Vezi dacă ai instalate pachetele Node:
   ```bash
   npm install
   ```
2. Asigură-te că fișierul `.env` este prezent în acest folder.
3. Pornește proiectul:
   ```bash
   npm start
   # sau npm run dev
   ```

Alternativ, din root:
```bash
./run.bat frontend
```

## Structura Proiectului (Pe Scurt)
- `components/` -> Componente de UI reutilizabile.
- `hooks/` -> Custom hooks pentru gestionarea stării sau autentificare.
- `config/` -> Configurări interne, precum conexiunea cu Supabase.
- `app.json` -> Configurația aplicației.
