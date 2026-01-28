# Code Style (Backend)

Code-Style-Konventionen und Best Practices fuer das Backend (NestJS + TypeORM).

## TypeScript

- Strikte Typisierung beibehalten (strict true).
- Kein `any`; bei Unklarheit `unknown` und Typ-Guards nutzen.
- 2-Space Indentierung.
- Explizite Typen dort, wo Inferenz nicht eindeutig ist.

### null vs undefined

- **Nie explizit `undefined` setzen.**
- **`null` nutzen**, wenn ein Wert absichtlich fehlt.
- **Aus dem Backend:** `T | undefined` oder `{ optionalValue?: T }`
- **An das Backend:** `T | null`
- **Beides moeglich:** `T | null | undefined`

## NestJS

### Module-Struktur

- Feature-Module kapseln Controller, Service, DTOs, Entity.
- Nur benoetigte Provider exportieren.
- Keine Logik im `app.module.ts` ausser Wiring.

### Controller

- Controller duenn halten: Routing, DTO-Validierung, Statuscodes.
- Kein Business-Logic-Code im Controller.
- DTOs mit `@UsePipes(new ValidationPipe())` validieren.
- Eingaben immer typisieren; keine `any`.

### Services

- Business-Logik gehoert in Services.
- Single Responsibility: ein Service, eine Domäne.
- Repositoryzugriffe ueber TypeORM Repositories.
- Keine direkten SQL-Strings, ausser begruendet.

### DTOs & Validation

- `class-validator` / `class-transformer` Patterns beibehalten.
- Input-DTOs und Output-Interfaces trennen.
- Optionalfelder explizit mit `@IsOptional()`.

### Entities

- Entities schlank halten, keine API-DTOs wiederverwenden.
- Sensitive Felder via `select: false`.
- Hooks (z. B. `@BeforeInsert`) nur fuer klare, lokale Logik.

## Fehlerbehandlung

- Einheitliche Fehler via `HttpException` und passende Statuscodes.
- Keine internen Details leaken.
- Custom Fehlertexte sparsam und konsistent halten.

## Auth & Security

- JWT-Pruefung nur ueber Middleware/Guard.
- Secrets niemals hardcoden, nur Env-Variablen.
- Keine Tokens oder Passwoerter loggen.

## Logging

- Kein `console.log()` in produktivem Code.
- Debug-Logs nur temporaer, vor Commit entfernen.

## Datenbank & Migrationen

- `synchronize: false` beibehalten.
- Schema-Aenderungen via Migrationen in `backend/migrations/`.
- `backend/migrations.txt` aktualisieren, falls dort Notizen gefuehrt werden.

## Tests

- Services mit Unit-Tests abdecken (wenn Tests vorhanden).
- Controller-Aenderungen nach Moeglichkeit mit E2E/Integrationstests begleiten.
- Keine Zeit-/Random-Abhaengigkeiten ohne Mocking.

## Naming Conventions

| Item        | Convention                    | Beispiel                      |
|-------------|-------------------------------|-------------------------------|
| Controller  | PascalCase + Controller       | `UserController`              |
| Service     | PascalCase + Service          | `UserService`                 |
| Module      | PascalCase + Module           | `UserModule`                  |
| Entity      | PascalCase + Entity           | `UserEntity`                  |
| DTO         | PascalCase + Dto              | `CreateUserDto`               |
| Dateien     | kebab-case                    | `user.controller.ts`          |
| Routen      | kebab-case                    | `/championships/:id`          |
