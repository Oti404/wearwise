# WearWise - Project Vision (PROMPT.md)

## Viziunea de Ansamblu
**WearWise** tinde spre crearea unui ecosistem inteligent care asistă utilizatorii prin funcționalități avansate de AI, un frontend fluid și captivant, și un backend performant și scalabil.

Acest fișier acționează ca punctul de pornire pentru orice programator sau AI care se implică în proiect. 

## Scopul Proiectului
Obiectivul nostru principal este livrarea unei platforme modulare (Frontend, Backend, AI Engine) destinate asistenței avansate a utilizatorului.
Aplicația se bazează pe:
- **Scalabilitate:** Serviciile rulează independent și comunică prin request-uri sigure (REST API / Socket).
- **Inovație (AI Module):** Integrarea capabilităților machine-learning pentru procesarea și interpretarea inteligentă a acțiunilor și nevoilor utilizatorilor.
- **Dezvoltare Modulară (Monorepo):** Sistem centralizat de deployment și debugging, cu componente izolate logic.

## Abordare Technicală (Filosofie)
- Scrie cod curat și decuplat.
- O funcție are o singură responsabilitate (Single Responsibility Principle).
- Păstrează configurațiile dependente de mediu (`.env`) stricte, fără a comite informații sensibile pe GitHub.
- Orice nouă funcționalitate de bază va fi propusă prin `PULL REQUESTS` folosind sistemul nostru intern de scripturi (vezi folderul `scripts/git/`).

*Dacă ai întrebări despre cum se conectează lucrurile, studiază fișierul `ARCHITECTURE.md` alăturat.*
