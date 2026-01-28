# Backend Project Structure

Leitlinien zur Projektstruktur des Backends.

## Root

- `backend/` ist der gesamte Backend-Workspace.
- Aenderungen nur in `backend/src/`, nicht in `backend/dist/`.

## Wichtige Pfade

- `backend/README.md` — Einstieg, lokale Kommandos, Hinweise.
- `backend/src/` — App-Quellcode.
- `backend/src/app.module.ts` — Wiring der Module.
- `backend/src/**/` — Feature-Module (Controller, Service, DTOs, Entity).
- `backend/src/guards/` — Guards.
- `backend/src/**/middlewares/` — Middleware.
- `backend/ormconfig/` — TypeORM Konfiguration.
- `backend/migrations/` — DB-Migrationen.
- `backend/migrations.txt` — Hinweise/Notizen zu Migrationen.
- `backend/tsconfig*.json` — TypeScript Konfiguration.

## Feature-Struktur

- Pro Feature: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `dto/`, `types/`.
- DTOs in `dto/`, Interfaces/Typen in `types/`.
- Entities nur im Feature, keine Cross-Feature Entitaeten ohne Absprache.

## Konventionen

- Keine Aenderungen in `dist/`.
- `synchronize: false` beibehalten; Schema-Aenderungen via Migrationen.
- Keine neuen Root-Ordner ohne Absprache.
- Konfigurationen nur aendern, wenn notwendig und dokumentiert.

## Dokumentationspflicht

- Struktur- oder API-Aenderungen in `backend/README.md` dokumentieren.
