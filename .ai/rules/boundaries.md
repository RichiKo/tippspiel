# Boundaries & Constraints

Wichtige Constraints, Restriktionen und Sonderregeln fuer das Tipp-Spiel Projekt.

## File Operations

### Was NICHT zu tun ist

❌ **Keine Dateien ausserhalb des Workspace Roots aendern** ohne explizite Freigabe

- Bleibe im Projektroot und Unterordnern
- Keine Systemdateien aendern
- Explizite Freigabe fuer Operationen ausserhalb des Workspace

❌ **`.env` Dateien niemals ansehen**

- Enthalten sensible Daten
- Keine Env-Files mit Secrets lesen oder aendern

❌ **Keine Doku-Dateien proaktiv erstellen**

- `*.md` oder README nur auf explizite Anfrage
- Dokumentation nur erstellen, wenn der User es explizit verlangt

❌ **Keine neuen Dateien, ausser absolut notwendig**

- Bestehende Dateien bevorzugt bearbeiten
- Wenn eine neue Datei noetig ist, kurz begruenden

### Was zu tun ist

✅ **Bestehende Dateien bearbeiten statt neue erstellen**

✅ **Vor dem Erstellen neuer Dateien nachfragen**

```
"Ich muss eine neue Komponente fuer X erstellen. Soll ich:
1. Add it to the existing [feature]/component/ library
2. Create a new library
3. Put it somewhere else?"
```

## Git-Operationen

### Niemals tun

❌ **Kein Force-Push auf main/develop**

```bash
# NEVER do this
git push --force origin main
git push --force origin develop
```

❌ **Keine destruktiven Git-Operationen ohne explizite Freigabe**

```bash
# Only with explicit user request
git reset --hard
git push --force
git rebase -i
git clean -fd
```

❌ **Never skip git hooks**

```bash
# Don't use these flags unless user explicitly requests
git commit --no-verify
git commit --no-gpg-sign
```

### Sichere Git-Praktiken

✅ **Nur Dateien committen, die du geaendert hast**

- Andere aendern parallel weitere Dateien
- Vor Commit `git status` pruefen
- Keine fachfremden Aenderungen committen

✅ **Autorschaft vor Amend pruefen**

```bash
# Vor git commit --amend pruefen:
git log -1 --format='%an %ae'
# Keine Commits anderer Entwickler amenden
```

## Logging

❌ **Kein `console.log()` fuer Production-Logging**

```typescript
// Schlecht: console.log in Production-Code
console.log("User data:", userData);

// OK: Nur temporaer fuer Debugging (vor Commit entfernen)
console.log("Debug: checking value", value);
```

- Kein Logging in Produktions-Browserumgebung
- console.log nur temporaer fuer Debugging
- Alle console.log Statements vor Commit entfernen

## Security Boundaries

### URL Encoding (OWASP Top 10 #3)

✅ **Dynamische URL-Teile immer encodieren**

```typescript
// Gut: Dynamische Werte encodieren
http.get(`/${encodeURIComponent(boniId)}/kulanzkalkulation`);
http.get(`/search?q=${encodeURIComponent(query)}`);

// Schlecht: Kein Encoding
http.get(`/${boniId}/kulanzkalkulation`); // Injection risk!
http.get(`/search?q=${query}`); // Injection risk!
```

### Was encodiert werden muss

✅ **Encodieren:**

- User input
- Database values
- Any dynamic data in URLs
- Query parameters

❌ **Nicht encodieren:**

- Statische Konfigurationswerte
- Hardcoded Strings
- Base-URLs aus der Environment

## Entscheidungsfindung

### Wann nachfragen

❌ **Nicht annehmen**

- Architectural decisions
- Significant refactoring
- Creating new patterns
- Breaking existing conventions

✅ **Nachfragen, wenn:**

- Unsure about approach
- Multiple valid solutions exist
- Significant architectural impact
- Breaking changes required

### Wie nachfragen

```
"Ich sehe zwei Ansaetze fuer die Implementierung:

Option 1: [description]
Pros: ...
Cons: ...

Option 2: [description]
Pros: ...
Cons: ...

Which approach do you prefer?"
```

## Konsistenz-Regeln

### Kollaborative Codebase

⚠️ **Mehrere Contributors arbeiten hier**

- Consistency with existing patterns is critical
- Don't introduce new patterns without discussion
- Follow established conventions strictly
- When in doubt, examine similar existing code

✅ **Vor der Umsetzung:**

1. Look for similar existing implementations
2. Follow the same patterns
3. Use the same libraries and approaches
4. Match the existing code style

## Dokumentations-Referenzen

- **Frontend-Doku:** `frontend/README.md`
- **Backend-Doku:** `backend/README.md`
- **Datenmodell/ERD:** `../erdiagram.mmd`, `../erdiagram.svg`
- **Migration-Hinweise:** `../backend/migrations.txt`
