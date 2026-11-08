# Security Policy

## Reporting a vulnerability
Please **do not open a public issue** for security problems. Report them privately through GitHub's **Security → Report a vulnerability** form on this repository. Include steps to reproduce and the affected endpoint or file.

You can expect an acknowledgement within 7 days. Please give us a reasonable amount of time to release a fix before disclosing the issue.

## Scope
- Backend API (`backend/`): authentication, access control, uploads, checkout and ratings
- Web app (`frontend/`)
- AI engine (`ai_engine/`)
- Docker and deployment configuration

## Secrets
This repository contains no credentials. All secrets are supplied at runtime through `.env` files that are excluded from version control. If you find something that looks like a real secret in the code or the history, report it as described above.
