# Frontend Project Structure

Leitlinien zur Projektstruktur des Frontends.

## Root

- `frontend/` ist der gesamte Frontend-Workspace.
- Aenderungen nur in `frontend/src/`, nicht in `frontend/dist/`.

## Wichtige Pfade

- `frontend/README.md` — Einstieg, lokale Kommandos, Hinweise.
- `frontend/angular.json` — Build/Serve Konfiguration.
- `frontend/proxy.conf.json` — API Proxy fuer lokale Entwicklung.
- `frontend/src/` — App-Quellcode.
- `frontend/src/app/` — Feature-Module und Komponenten.
- `frontend/src/assets/` — statische Assets (Versioniert).
- `frontend/public/` — statische Assets (unverarbeitet).
- `frontend/tsconfig*.json` — TypeScript Konfiguration.

## Feature-Struktur

- Feature-Folder unter `frontend/src/app/` (z. B. `auth`, `dashboard`, `home`).
- Shared Code unter `frontend/src/app/shared/` (Guards, Types, Helpers).
- UI-Komponenten innerhalb des jeweiligen Features (keine Feature-Logik in `shared/`).

## Konventionen

- Keine Aenderungen in `dist/`.
- Keine neuen Root-Ordner ohne Absprache.
- Wiederverwendbares zentralisieren statt duplizieren.
- Konfigurationen nur aendern, wenn notwendig und dokumentiert.

## Dokumentationspflicht

- Struktur- oder Routing-Aenderungen in `frontend/README.md` dokumentieren.
