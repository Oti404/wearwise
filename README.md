# WearWise

Bine ai venit în proiectul **WearWise**! Acesta este repo-ul principal de tip monorepo care găzduiește toate componentele aplicației:

- **[Frontend](./frontend/README.md)**: Aplicația vizuală (React/Next).
- **[Backend](./backend/README.md)**: API-ul și conexiunea cu baza de date (Node, Drizzle, SQL).
- **[AI Engine](./ai_engine/README.md)**: Modulul de inteligență artificială (Python).

## Pornirea Proiectului (Global)

Acest proiect dispune de scripturi automatizate pentru pornire și testare locală.
Baza ta o reprezintă scriptul `run.bat` din folderul principal.

Pentru a rula toate modulele concomitent:
```bash
./run.bat all
```

Pentru a porni doar un anumit modul:
```bash
./run.bat frontend
./run.bat backend
./run.bat ai
```

Pentru mai multe detalii despre scripturile de sincronizare și git, citește [GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md).
Pentru a afla mai multe despre cum funcționează testarea modulelor, vezi [TESTING.md](./docs/TESTING.md).

## Documentație Utilitară

Înainte de a contribui, te rugăm să citești:
- [PROMPT.md](./PROMPT.md) – Detalii de business și scopul general al aplicației.
- [ARCHITECTURE.md](./ARCHITECTURE.md) – Arhitectura tehnică (flux de conectare, rolul modulelor).
- [AI.md](./AI.md) – Instrucțiuni pentru agenții AI care ajută la scrierea de cod.
