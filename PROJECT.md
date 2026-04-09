# 🌟 WearWise - Prezentare Generală a Proiectului

Acest document reprezintă ghidul central (entry-point) pentru întregul monorepo WearWise. Aici veți găsi arhitectura globală a sistemului, modul de comunicare între componente, regulile comune și procedurile de lucru pentru a asigura un proces de dezvoltare predictibil și fluent.

## 📁 Structura Monorepo

Proiectul folosește un pattern de tip Monorepo, separând preocupările tehnice în foldere distincte, dar permițând rularea unitară prin scripturi globale.

- **`/frontend/`**: Aplicația mobilă cross-platform dezvoltată în **React Native** cu **Expo** și **Expo Router**.
- **`/backend/`**: Seriviciul REST API de bază construit în **Node.js/Express**, bazat pe **PostgreSQL** (gestionat via **Drizzle ORM**).
- **`/ai_engine/`**: Serviciul de Inteligență Artificială scris în **Python / FastAPI**, responsabil de recunoașterea și clasificarea hainelor.
- **`/scripts/`**: Utilitare de configurare și sincronizare a proiectului, inclusiv migrații și tool-uri interne.

## 🔄 Comunicarea și Fluxul de Date (Mecanism Client-Server-AI)

Sistemul modern WearWise folosește o abordare micro-servicii / arhitectură stratificată:

1. **Aplicația Mobilă (Frontend)**: Interacționează direct cu **Supabase** doar pentru Autentificare (SSO, logare) și stocare fișiere/imagini (Storage). Restul operațiunilor (date utilizator, postare de iteme) se trimit către serverul de Backend.
2. **Backend-ul Node.js**: Este "Sursa Adevărului" pentru operațiunile de business. Acesta primește token-ul de la aplicație, îl validează, face maparea datelor folosind `Drizzle ORM` cu instanța PostgreSQL și orchestrează procesele principale.
3. **AI Engine (Python)**: Atunci când un utilizator dorește să adauge o haină nouă (fie prin `image_path` absolut local - în dev, fie primind un fișier fizic prin rețea), Backend-ul declanșează un apel REST (POST `/classify/...`) către AI Engine. Dacă AI Engine validează că imaginea conține o haină și oferă un label, Backend-ul persistă itemul în DB. Astfel, AI Engine rulează ca un microserviciu complet decuplat, putând fi actualizat și scalat independent.

## 🛠️ Procedura de Pornire (Bootstrapping)

Pentru eficiență în dev, proiectul include utilitare unificate:
- **`run.bat`**: Scriptul principal folosit pentru pornirea aplicației și a serviciilor adiacente local.
- **`sync.bat`**: Inima gestiunii versiunilor. **Nu se utilizează `git commit/push` manual!** Orice dezvoltator trebuie să ruleze acest utilitar folosind meniul său interactiv.
- **`docker-compose.yml`**: Definește mediul de rețea predefinit, o bază de date PostgreSQL locală sau uneltele periferice necesare.

## 🌿 Fluxul de Dezvoltare Git (Git Workflow)

Am stabilit un flux extrem de rigid (și sigur) via scriptul `sync.bat`, care oferă două meniuri:

*   **Meniul Developer [1]**
    *   **START (Feature Nou)**: Creează automat o ramură `feature/NumeFeature` din `develop`.
    *   **COMMIT / PUSH / MERGE**: Automatizează crearea de commit-uri și fuzionarea testată înapoi în `develop`. Dacă apare o limită de conflict, procesul este abortat preventiv. Aici intervin și automatizările de rulare pentru teste (ex: `run_tests.bat`).
*   **Meniul Admin [2]** (cu parolă "wearwise")
    *   Fuzionează stabil `develop` în `releases` pentru testari formale sau UAT, și în cele din urmă `releases` în `main` (Producție) sub forma de Tag-uri de versiuni semantice.

## 🔐 Variabile de Mediu Comune

Fiecare subsistem conține un fișier `.env`. Pentru a rula WearWise pe o mașină nouă:
1. Copiați `.env.example` -> `.env` în `/backend`, `/frontend` (dacă există) și `/ai_engine`.
2. Asigurați-vă că variabilele PostgreSQL (`DIRECT_URL`) și cele de Supabase sunt valide conectate (pe instanțele de prod/stagging).

## 💡 Bune Practici
- Mențineți contractele JSON între Backend și AI stricte. Orice adăugare de fiță nouă dincolo de "confidence" necesită update de tipare TS (TypeScript/JSDoc) în Backend.
- Aplicațiile de migrări de scheme se rulează folosind `drizzle-kit` din interiorul folderului de backend. Nu alterați tabelele SQL manual!
