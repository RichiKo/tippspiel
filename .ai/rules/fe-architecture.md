# Frontend Architecture (Angular)

Architektur-Leitlinien fuer das Frontend dieses Projekts.

## Zielbild

- Klar getrennte Features (z. B. auth, dashboard, home) unter `frontend/src/app/`.
- Komponenten bleiben schlank; Logik liegt in Services und State.
- API-Zugriffe laufen gebuendelt ueber Services und den Proxy.

## Projektstruktur

- `frontend/src/app/` enthaelt Feature-Folder (auth, dashboard, home, shared).
- `shared/` fuer Guards, Types, wiederverwendbare Helfer.
- `material.module.ts` ist zentrale Material-Importsammlung.
- `assets/` und `public/` nur fuer statische Ressourcen.

## Routing & Navigation

- Feature-Routen lazy laden, wenn moeglich (`loadComponent`/`loadChildren`).
- Guards liegen in `shared/guards/`.
- Routen-Parameter immer validieren und dynamische URL-Teile encodieren.

## State & Datenfluss

- Lokaler UI-State bevorzugt ueber Signals.
- Komponenten lesen State, Services pflegen Business-Logik.
- Kein HTTP im Template.

## Forms

- Reactive Forms bevorzugen.
- Typed Forms verwenden; keine untypisierten `FormControl`.
- Validierung im Formular, Fehlerzustand sauber anzeigen.

## API-Integration

- Im Dev-Betrieb API ueber `proxy.conf.json` und `/api` Pfad.
- Kein Hardcoding von Base-URLs.
- Request/Response Typen immer definieren (Interfaces/DTOs).

## Fehlerbehandlung & UX

- Fehlerzustand im Component-State speichern.
- Kein `console.log()` fuer User-Fehler; stattdessen UI-Feedback.
- Ladezustaende (loading/empty/error) explizit abbilden.

## Styling

- Component Styles sind lokal, kein globaler CSS-Wildwuchs.
- SCSS sparsam verschachteln.
- Material-Patterns beibehalten.

## Testing

- Unit-Tests fuer Services und Komponenten.
- E2E-Tests fuer kritische User-Flows (Login, Tippabgabe, Rangliste).
- Mock-API-Calls mit `HttpClientTestingModule`.
- Mindest-Coverage: 70% fuer Services, 50% fuer Components.
- Siehe `.ai/rules/testing.md` fuer Details.

## Erweiterungsregeln

- Erst bestehende Patterns suchen und erweitern, nicht neu erfinden.
- Neue Libraries nur bei klarem Bedarf und nach Absprache.
- Keine Aenderungen in `dist/`.
