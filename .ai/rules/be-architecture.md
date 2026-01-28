# Backend Architecture (NestJS)

Architektur-Leitlinien fuer das Backend dieses Projekts.

## Zielbild

- Modulare NestJS-Architektur mit klaren Feature-Modulen.
- Controller sind duenn, Services enthalten Business-Logik.
- Datenzugriff ueber TypeORM Repositories.

## Projektstruktur

- `backend/src/` enthaelt Module, Controller, Services, Entities, DTOs.
- Feature-Module (z. B. `user`, `championship`) kapseln alle Schichten.
- Guards und Middleware liegen in eigenen Ordnern (`guards/`, `user/middlewares/`).

## Module-Pattern

- Pro Feature: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `dto/`.
- Module exportieren nur das, was andere Module benoetigen.
- `app.module.ts` nur fuer Wiring.

## Controller

- Nur Routing, DTO-Validierung und Statuscodes.
- Eingaben ueber DTOs mit `ValidationPipe`.
- Keine Business-Logik im Controller.

## Services

- Business-Logik, Transaktionen, Validierung auf Service-Ebene.
- Repositoryzugriffe ueber TypeORM.
- Keine direkten SQL-Strings ohne Notwendigkeit.

## Entities & Datenmodell

- Entities spiegeln das DB-Schema wider, keine API-DTOs wiederverwenden.
- Sensitive Felder mit `select: false`.
- IDs/Typen konsistent zu bestehenden Entities halten.

## Auth & Security

- JWT-Validierung nur ueber Middleware/Guard.
- Auth-geschuetzte Endpunkte immer mit `AuthGuard`.
- Secrets nur aus Env-Variablen.

## Fehlerbehandlung

- Einheitliche Fehler via `HttpException` und passenden Statuscodes.
- Keine internen Details in Fehlermeldungen leaken.
- Fehlertexte konsistent und knapp halten.

## Datenbank & Migrationen

- `synchronize: false` beibehalten.
- Schema-Aenderungen ausschliesslich per Migration.
- `backend/migrations.txt` aktualisieren, wenn neue Migrationen hinzukommen.

## API-Contracts

- Request/Response Typen explizit definieren.
- Kompatibilitaet zwischen Backend und Frontend sicherstellen.
- Alle Endpoints in `backend/API.md` dokumentiert (User, Championship, Game, Tip, Ranking).
- Breaking Changes dokumentieren (README/ERD/Migrationshinweise).

## Tests

- Services mit Unit-Tests abdecken (Jest + Repository-Mocks).
- Controller-Aenderungen mit E2E/Integrationstests begleiten (Supertest).
- Mindest-Coverage: 80% fuer Services, 70% fuer Controller.
- Siehe `.ai/rules/testing.md` fuer Details.

## Erweiterungsregeln

- Erst bestehende Patterns suchen und erweitern.
- Keine Aenderungen in `dist/`.
