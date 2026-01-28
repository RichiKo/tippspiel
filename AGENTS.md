# Agent Guide

# AGENTS.md — Tipp-Spiel (Index)

## Zweck

Du bist ein Senior Angular/TypeScript und NestJS Entwickler. Antworte kurz, klaere Unsicherheiten vor dem Coden und halte dich an etablierte Patterns und Konventionen.

**Transparenzpflicht: Sage dem User IMMER, dass du diese Datei und relevante Dokumente gelesen und verstanden hast.**

Dieses Repository ist ein Fullstack-Projekt (Angular + NestJS + PostgreSQL). Diese Datei ist ein **Index**
und verweist auf die Regeln in den separaten Dateien. Inhalte werden dort gepflegt, um Duplikate zu vermeiden.

## Projektziel

Ziel des Projekts **„Tipp-Spiel“** ist es, ein bisher manuell organisiertes Fussball-Tippspiel
(Messenger + Excel) vollstaendig zu digitalisieren und zu automatisieren.

Das Frontend stellt die zentrale Benutzeroberflaeche fuer Teilnehmer und Organisator bereit und hat folgende Kernaufgaben:

- **Benutzerfuehrung:** Klare, einfache Bedienung fuer Tippabgabe, Einsicht in eigene Tipps und Ranglisten.
- **Verlaesslichkeit:** Ein abgegebener Tipp ist nach Ablauf der Abgabefrist unveraenderbar.
- **Transparenz:** Punktevergabe, Tabellenstaende und historische Ergebnisse sind fuer alle nachvollziehbar.
- **Fehlervermeidung:** UI muss ungueltige Aktionen verhindern (z. B. Tippabgabe nach Spielbeginn).
- **Trennung der Verantwortlichkeiten:**
  - Frontend = Darstellung, UX, Validierung, Nutzerfuehrung
  - Backend = Geschaeftslogik, Punkteberechnung, Deadlines, Persistenz

🎨 **[Code Style Frontend](.ai/rules/fe-code-style.md)** - TypeScript, Angular, Namenskonventionen
Start hier fuer: Component Patterns, API Integration, SCSS, null vs undefined

🎨 **[Code Style Backend](.ai/rules/be-code-style.md)** - TypeScript, NestJS, Namenskonventionen
Start hier fuer: Controller/Service Patterns, DTOs, Fehlerbehandlung, Tests

🏗️ **[Architecture Frontend](.ai/rules/fe-architecture.md)** - Frontend Architektur, State, Components

🏗️ **[Architecture Backend](.ai/rules/be-architecture.md)** - Backend Architektur, Module, Services

🏗️ **[Project Structure Frontend](.ai/rules/fe-project-structure.md)** - Ordner, Konventionen, Ablage

🏗️ **[Project Structure Backend](.ai/rules/be-project-structure.md)** - Ordner, Konventionen, Ablage

🚫 **[Boundaries](.ai/rules/boundaries.md)** - Constraints und Sonderregeln
Start hier fuer: Was NICHT zu tun ist, Security-Regeln, File-Operation-Limits

🧪 **[Testing](.ai/rules/testing.md)** - Unit/E2E-Tests, Mocking, Coverage
Start hier fuer: Test-Patterns, Jasmine/Jest, HttpClientTestingModule, Repository-Mocks

🚀 **[Deployment](.ai/rules/deployment.md)** - Build, Environments, CI/CD
Start hier fuer: Production-Build, Migrationen, Docker, Environment Variables

---

## Dokumentation & Referenzen

- **Frontend-Doku:** `frontend/README.md`
- **Backend-Doku:** `backend/README.md`
- **Datenmodell/ERD:** `backend/ERD.md` (Dokumentation), `erdiagram.mmd`, `erdiagram.svg` (Diagramme)
- **API-Contracts:** `backend/API.md` (Alle Endpoints: User, Championship, Game, Tip, Ranking)
- **Migration-Hinweise:** `backend/migrations.txt`
