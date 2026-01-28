# Code Style (Frontend)

Code-Style-Konventionen und Best Practices fuer das Tipp-Spiel Frontend.

## TypeScript

- Strikte Typisierung beibehalten (strict true).
- Typinferenz nutzen, wenn eindeutig; redundante Typen vermeiden.
- Kein `any`; bei Unklarheit `unknown`.
- 2-Space Indentierung.
- Explizite Typen dort, wo Inferenz nicht eindeutig ist.

### null vs undefined

- **Nie explizit `undefined` setzen.**
- **`null` nutzen**, wenn ein Wert absichtlich fehlt.
- **Aus dem Backend:** `T | undefined` oder `{ optionalValue?: T }`.
- **An das Backend:** `T | null`.
- **Beides moeglich:** `T | null | undefined`.

## Angular

### Components

```typescript
// Immer klaeren, ob Standalone Components genutzt werden sollen
@Component({
  selector: "app-example",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true, // may be omitted, defaults to true
  template: `...`, // Inline-Templates fuer kleine Komponenten
})
export class ExampleComponent {
  // input() und output() nutzen
  data = input<string>();
  change = output<string>();

  // Signals fuer State
  count = signal(0);
  doubled = computed(() => this.count() * 2);
}
```

**Component-Regeln:**

- `changeDetection: ChangeDetectionStrategy.OnPush` setzen.
- Signals und `computed()` fuer State nutzen.
- Komponenten klein und Single-Responsibility halten.
- `input()` und `output()` statt `@Input()` und `@Output()` nutzen.
- Inline-Templates fuer kleine Komponenten bevorzugen.
- `ngClass` und `ngStyle` vermeiden; `[class]` und `[style]` nutzen.
- Reactive Forms statt template-driven Forms bevorzugen.

### Services & Forms

```typescript
@Injectable({ providedIn: "root" })
export class ExampleService {
  private http = inject(HttpClient); // inject() nutzen

  // Typed Forms fuer Typsicherheit
  form = new FormGroup({
    name: new FormControl<string>("", { nonNullable: true }),
  });
}
```

**Service-Regeln:**

- Single-Responsibility beachten.
- `providedIn: 'root'` fuer Singleton Services.
- `inject()` nutzen, nicht Constructor Injection.
- **Typed Forms:** Immer typisieren (Typ explizit oder bei Initialisierung).

### Templates

```html
<!-- Native control flow nutzen -->
@if (condition) {
<p>Content</p>
} @for (item of items; track item.id) {
<div>{{ item.name }}</div>
} @switch (status) { @case ('active') { <span>Active</span> } @case ('inactive')
{ <span>Inactive</span> } }

<!-- async pipe fuer Observables nutzen -->
<div>{{ data$ | async }}</div>

<!-- [class] und [style] statt ngClass/ngStyle -->
<div [class.active]="isActive" [style.color]="color"></div>
```

**Template-Regeln:**

- Native control flow (`@if`, `@for`, `@switch`) statt strukturelle Direktiven.
- `async` pipe fuer Observables.
- Keine komplexe Logik in Templates.
- Signals fuer lokalen State.
- `computed()` fuer abgeleitete Werte.

### Assets & Routing

- `NgOptimizedImage` fuer statische Bilder verwenden.
- Feature-Routen lazy laden.

## Naming Conventions

| Item          | Convention                    | Example                                 |
| ------------- | ----------------------------- | --------------------------------------- |
| Components    | PascalCase                    | `LoginComponent`                        |
| Services      | PascalCase + `Service` suffix | `AuthService`                           |
| Files         | kebab-case                    | `login.component.ts`                    |
| Library paths | tsconfig alias/relative paths | `@app/shared` oder `../shared`          |

## Import Conventions

- Reihenfolge: Angular core, Third-Party, lokal.
- Gruppen mit Leerzeilen trennen.
- Pfad-Aliase aus `tsconfig` bevorzugen.
- Tiefe relative Pfade vermeiden, wenn ein Barrel existiert.

## SCSS

**SCSS rules:**

- Component Styles sind lokal.
- SCSS sparsam verschachteln.
- Globale Overrides nur nach Absprache.
- Gemeinsame Variablen/Mixins wiederverwenden.

## API Integration

- `HttpClient` nur in Services nutzen.
- Dev-Proxy (`/api`) statt Hardcoding von Base-URLs.
- Dynamische URL-Teile mit `encodeURIComponent` encodieren.
- Request/Response Payloads immer typisieren.

## Error Handling & User Feedback

### Error Display Pattern

- **Kein `console.log()` oder `console.error()`** fuer User-Fehler.
- **Fehler im Component-State** halten (z. B. `errorMessage: string | undefined`).
- User-freundliche Meldung anzeigen (Material Snackbar/Dialog/Inline).

### Services Throwing Errors

- Services geben typisierte Fehler zurueck (z. B. `HttpErrorResponse`).
- Komponenten mappen technische Fehler auf UI-Meldungen.

## Logging

- **Kein `console.log()`** ausser temporaeres Debugging.
- **Kein `console.error()`** fuer User-Fehler (siehe Error Display Pattern).
- Kein Logging in Produktions-Browserumgebung.
