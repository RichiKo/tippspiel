# Frontend

frontend/
│── src/
│ ├── app/
│ │ ├── core/ # 🌟 Zentrale Dienste & globale Logik
│ │ │ ├── auth/ # → Authentifizierungslogik
│ │ │ │ ├── auth.service.ts
│ │ │ │ ├── auth.guard.ts
│ │ │ │ ├── jwt.interceptor.ts
│ │ │ │ ├── models.ts
│ │ │ ├── services/ # → API-Services (z. B. Spielstände)
│ │ │ │ ├── game.service.ts
│ │ │ │ ├── user.service.ts
│ │ │ ├── state/ # 🌟 Signal-basiertes State-Management
│ │ │ │ ├── auth.store.ts
│ │ │ │ ├── game.store.ts
│ │ │ ├── guards/ # → Route Guards
│ │ │ │ ├── auth.guard.ts
│ │ │ ├── interceptors/ # → HTTP Interceptors
│ │ │ │ ├── jwt.interceptor.ts
│ │ │ ├── config.ts # → API-URLs & globale Konstante
│ │ │ ├── app.config.ts # → App-weite Konfiguration
│ │ │
│ │ ├── modules/ # 🌟 Feature-Module für Modularität
│ │ │ ├── auth/ # → Auth-Modul (Login, Registrierung)
│ │ │ │ ├── auth.module.ts
│ │ │ │ ├── login/ # Login-Seite
│ │ │ │ │ ├── login.component.ts
│ │ │ │ │ ├── login.component.html
│ │ │ │ ├── register/ # Registrierung
│ │ │ │ │ ├── register.component.ts
│ │ │ │ │ ├── register.component.html
│ │ │ ├── dashboard/ # → Haupt-UI für eingeloggte Nutzer
│ │ │ │ ├── dashboard.module.ts
│ │ │ │ ├── dashboard.component.ts
│ │ │ │ ├── dashboard.component.html
│ │ │ ├── games/ # → Spielübersicht & Tipps
│ │ │ │ ├── games.module.ts
│ │ │ │ ├── game-list/
│ │ │ │ ├── game-detail/
│ │ │ ├── users/ # → Profilseite & User-Management
│ │ │ │ ├── profile/
│ │ │ │ ├── settings/
│ │ │
│ │ ├── shared/ # 🌟 Wiederverwendbare UI-Komponenten
│ │ │ ├── components/
│ │ │ │ ├── navbar/
│ │ │ │ │ ├── navbar.component.ts
│ │ │ │ │ ├── navbar.component.html
│ │ │ │ ├── button/
│ │ │ ├── directives/ # → Custom Directives
│ │ │ ├── pipes/ # → Custom Pipes
│ │ │
│ │ ├── app.component.ts
│ │ ├── app.module.ts
│ │ ├── app-routing.module.ts
│ │
│ ├── assets/ # 🌟 Bilder, Icons, Styles
│ ├── environments/ # 🌟 Umgebungsvariablen
│ │ ├── environment.ts # Dev-Umgebung
│ │ ├── environment.prod.ts # Prod-Umgebung
│ ├── styles.scss # Globale Styles (Tailwind + Material)
│ ├── tailwind.config.js # Tailwind Konfiguration
│
├── angular.json # Angular Projektkonfiguration
├── package.json # Abhängigkeiten & Scripts
├── tsconfig.json
