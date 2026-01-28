# Datenmodell (Entity-Relationship-Diagramm)

Dokumentation des Datenbankschemas für das Tipp-Spiel.

---

## Übersicht

Das Datenmodell besteht aus 10 Kernentitäten, die die gesamte Geschäftslogik des Tippspiels abbilden:

1. **User** - Benutzer (Teilnehmer und Administratoren)
2. **Championship** - Wettbewerbe (z. B. "WM 2026")
3. **ChampionshipParticipant** - Teilnahme an Championships
4. **Round** - Spielrunden innerhalb einer Championship
5. **Team** - Mannschaften (spezifisch pro Championship)
6. **Game** - Einzelne Spiele
7. **Tip** - Tipps der Benutzer auf Spiele
8. **ChampionGuessRule** - Regeln für Meister-Tipps
9. **ChampionGuess** - Meister-Tipps der Benutzer
10. **ChampionGuessEvaluation** - Auswertung der Meister-Tipps
11. **Ranking** - Ranglisten pro Championship

---

## Kernentitäten

### User

Repräsentiert einen Benutzer des Systems (Teilnehmer oder Administrator).

**Felder:**
- `id` (UUID) - Primärschlüssel
- `username` (string) - Benutzername, max 30 Zeichen
- `email` (string) - Email-Adresse, eindeutig
- `password` (string) - Gehashtes Passwort, `select: false`
- `role` (enum) - Rolle: `user`, `admin`, `superadmin`
- `createdAt` (Date) - Erstellungsdatum

**Beziehungen:**
- Hat viele `ChampionshipParticipant` (Teilnahmen an Championships)
- Hat viele `Tip` (Tipps auf Spiele)
- Hat viele `ChampionGuess` (Meister-Tipps)
- Hat viele `Ranking` (Ranglisten-Einträge)

**Geschäftslogik:**
- Passwort wird mit bcrypt gehasht
- JWT-Token wird bei Login/Registrierung generiert
- Rolle bestimmt Berechtigungen (User vs. Admin)

---

### Championship

Repräsentiert einen Wettbewerb (z. B. "WM 2026", "EM 2024").

**Felder:**
- `id` (UUID) - Primärschlüssel
- `name` (string) - Name des Wettbewerbs
- `description` (string) - Beschreibung
- `isPublic` (boolean) - Öffentlich sichtbar?
- `isActive` (boolean) - Aktiv (läuft gerade)?
- `createdByUserId` (UUID) - Ersteller (Foreign Key → User)
- `createdAt` (Date) - Erstellungsdatum
- `updatedAt` (Date) - Letzte Änderung
- `entryFee` (number) - Teilnahmegebühr
- `prizePool` (number) - Gesamtpreisgeld
- `prizeDistribution` (string) - Preisgeldverteilung (z. B. "1st: 60%, 2nd: 30%")

**Beziehungen:**
- Hat viele `ChampionshipParticipant` (Teilnehmer)
- Hat viele `Round` (Spielrunden)
- Hat viele `Team` (Mannschaften)
- Hat viele `Tip` (Tipps)
- Hat viele `ChampionGuessRule` (Meister-Regeln)
- Hat viele `ChampionGuess` (Meister-Tipps)
- Hat viele `Ranking` (Ranglisten)

**Geschäftslogik:**
- Nur der Ersteller oder Admins können die Championship bearbeiten
- `isActive` steuert, ob neue Tipps abgegeben werden können
- `prizePool` wird automatisch aus Teilnahmegebühren berechnet

---

### ChampionshipParticipant

Verknüpft User mit Championships (Teilnahme-Relation).

**Felder:**
- `id` (UUID) - Primärschlüssel
- `userId` (UUID) - Foreign Key → User
- `championshipId` (UUID) - Foreign Key → Championship
- `createdAt` (Date) - Teilnahmedatum
- `isPaid` (boolean) - Teilnahmegebühr bezahlt?
- `isApproved` (boolean) - Teilnahme genehmigt?

**Beziehungen:**
- Gehört zu einem `User`
- Gehört zu einer `Championship`

**Geschäftslogik:**
- User kann nur an einer Championship teilnehmen, wenn `isApproved = true`
- `isPaid` relevant für Championships mit `entryFee > 0`

---

### Round

Repräsentiert eine Spielrunde innerhalb einer Championship (z. B. "Vorrunde 1", "Achtelfinale").

**Felder:**
- `id` (UUID) - Primärschlüssel
- `name` (string) - Name der Runde
- `startDate` (Date) - Startdatum
- `championshipId` (UUID) - Foreign Key → Championship
- `createdAt` (Date) - Erstellungsdatum

**Beziehungen:**
- Gehört zu einer `Championship`
- Hat viele `Game` (Spiele)

**Geschäftslogik:**
- Spiele werden nach Runden gruppiert
- `startDate` kann für UI-Filterung verwendet werden

---

### Team

Repräsentiert eine Mannschaft innerhalb einer Championship.

**Felder:**
- `id` (UUID) - Primärschlüssel
- `name` (string) - Name der Mannschaft (z. B. "Deutschland")
- `shortName` (string) - Kurzname (z. B. "GER")
- `logoUrl` (string) - URL zum Logo
- `championshipId` (UUID) - Foreign Key → Championship
- `createdAt` (Date) - Erstellungsdatum

**Beziehungen:**
- Gehört zu einer `Championship`
- Hat viele `Game` als Home-Team
- Hat viele `Game` als Away-Team
- Hat viele `ChampionGuess` (Meister-Tipps auf dieses Team)

**Geschäftslogik:**
- Teams sind spezifisch pro Championship
- Gleiche Mannschaft kann in verschiedenen Championships unterschiedliche IDs haben

---

### Game

Repräsentiert ein einzelnes Spiel zwischen zwei Teams.

**Felder:**
- `id` (UUID) - Primärschlüssel
- `homeTeamId` (UUID) - Foreign Key → Team (Heimmannschaft)
- `awayTeamId` (UUID) - Foreign Key → Team (Auswärtsmannschaft)
- `kickoffTime` (DateTime) - Anstoßzeit (wichtig für Tipp-Deadline!)
- `roundId` (UUID) - Foreign Key → Round
- `createdAt` (Date) - Erstellungsdatum
- `homeScore` (number) - Tore Heimmannschaft (nullable)
- `awayScore` (number) - Tore Auswärtsmannschaft (nullable)
- `isClosed` (boolean) - Spiel abgeschlossen?

**Beziehungen:**
- Gehört zu einer `Round`
- Hat ein Home-Team (`Team`)
- Hat ein Away-Team (`Team`)
- Hat viele `Tip` (Tipps auf dieses Spiel)

**Geschäftslogik:**
- **Zentrale Deadline-Regel:** Tipps können nur vor `kickoffTime` abgegeben/geändert werden
- `isClosed = true` bedeutet: Ergebnis ist eingetragen, Punkte werden berechnet
- `homeScore` und `awayScore` werden vom Admin gesetzt

---

### Tip

Repräsentiert einen Tipp eines Users auf ein Spiel.

**Felder:**
- `id` (UUID) - Primärschlüssel
- `userId` (UUID) - Foreign Key → User
- `championshipId` (UUID) - Foreign Key → Championship
- `gameId` (UUID) - Foreign Key → Game
- `homeTeamGoals` (number) - Getippte Tore Heimmannschaft
- `awayTeamGoals` (number) - Getippte Tore Auswärtsmannschaft
- `createdAt` (Date) - Erstellungsdatum
- `updatedAt` (Date) - Letzte Änderung

**Beziehungen:**
- Gehört zu einem `User`
- Gehört zu einer `Championship`
- Gehört zu einem `Game`

**Geschäftslogik:**
- Ein User kann pro Game nur einen Tipp abgeben (eindeutig: `userId` + `gameId`)
- Tipp kann nur vor `game.kickoffTime` abgegeben/geändert werden
- Nach Spielende: Punkteberechnung basierend auf Vergleich `homeTeamGoals/awayTeamGoals` vs. `game.homeScore/awayScore`

**Punkteverteilung (typisch):**
- **Exakter Tipp:** z. B. 3 Punkte (Ergebnis und Tordifferenz korrekt)
- **Tordifferenz:** z. B. 2 Punkte (Tendenz und Tordifferenz korrekt)
- **Tendenz:** z. B. 1 Punkt (nur Sieger/Unentschieden korrekt)
- **Falsch:** 0 Punkte

---

### ChampionGuessRule

Definiert Regeln für Meister-Tipps (z. B. "Weltmeister", "Torschützenkönig").

**Felder:**
- `id` (UUID) - Primärschlüssel
- `championshipId` (UUID) - Foreign Key → Championship
- `code` (string) - Eindeutiger Code (z. B. "champion", "top_scorer")
- `label` (string) - Anzeigename (z. B. "Weltmeister")
- `points` (number) - Punkte bei richtigem Tipp
- `createdAt` (Date) - Erstellungsdatum

**Beziehungen:**
- Gehört zu einer `Championship`
- Hat viele `ChampionGuessEvaluation` (Auswertungen)

**Geschäftslogik:**
- Pro Championship können verschiedene Meister-Regeln definiert werden
- Punkte werden zusätzlich zur normalen Tipp-Punktzahl vergeben

---

### ChampionGuess

Repräsentiert einen Meister-Tipp eines Users.

**Felder:**
- `id` (UUID) - Primärschlüssel
- `userId` (UUID) - Foreign Key → User
- `championshipId` (UUID) - Foreign Key → Championship
- `teamId` (UUID) - Foreign Key → Team (getippte Mannschaft)
- `createdAt` (Date) - Erstellungsdatum

**Beziehungen:**
- Gehört zu einem `User`
- Gehört zu einer `Championship`
- Gehört zu einem `Team`
- Hat viele `ChampionGuessEvaluation` (Auswertungen)

**Geschäftslogik:**
- User kann vor Turnierbeginn auf den Meister tippen
- Tipp kann nur einmal abgegeben werden (oder bis Deadline änderbar)

---

### ChampionGuessEvaluation

Verknüpft Meister-Tipps mit Regeln und speichert Auswertung.

**Felder:**
- `id` (UUID) - Primärschlüssel
- `championGuessId` (UUID) - Foreign Key → ChampionGuess
- `ruleId` (UUID) - Foreign Key → ChampionGuessRule
- `fulfilled` (boolean) - Regel erfüllt?

**Beziehungen:**
- Gehört zu einem `ChampionGuess`
- Gehört zu einer `ChampionGuessRule`

**Geschäftslogik:**
- Nach Turnierenden: Admin setzt `fulfilled = true` für korrekte Tipps
- Punkte aus `ChampionGuessRule.points` werden zur Gesamtpunktzahl addiert

---

### Ranking

Repräsentiert die Rangliste pro Championship.

**Felder:**
- `id` (UUID) - Primärschlüssel
- `userId` (UUID) - Foreign Key → User
- `championshipId` (UUID) - Foreign Key → Championship
- `rank` (number) - Platzierung
- `exactHits` (number) - Anzahl exakter Tipps
- `goalDiffHits` (number) - Anzahl Tordifferenz-Tipps
- `tendencyHits` (number) - Anzahl Tendenz-Tipps
- `missedTips` (number) - Anzahl verpasster Tipps
- `updatedAt` (Date) - Letzte Aktualisierung

**Beziehungen:**
- Gehört zu einem `User`
- Gehört zu einer `Championship`

**Geschäftslogik:**
- Wird automatisch berechnet nach jedem abgeschlossenen Spiel
- Sortierung: Gesamtpunkte (absteigend), dann `exactHits` (absteigend)
- `missedTips` reduziert Gesamtpunktzahl nicht, aber wird transparent angezeigt

**Punkteberechnung (Beispiel):**
```
Gesamtpunkte = (exactHits * 3) + (goalDiffHits * 2) + (tendencyHits * 1)
```

---

## Beziehungsdiagramm

```
User ↔ ChampionshipParticipant ↔ Championship
  ↓                                    ↓
  Tip ← Game ← Round ←──────────────────┘
  ↓      ↑              ↓
  └────→ ↓            Team
    ChampionGuess ───→ ↑
         ↓
    ChampionGuessEvaluation → ChampionGuessRule
         
User → Ranking ← Championship
```

---

## Wichtige Constraints

### Unique Constraints
- `User.email` - eindeutig
- `User.username` - eindeutig
- `Tip(userId, gameId)` - ein Tipp pro User und Spiel
- `ChampionshipParticipant(userId, championshipId)` - Teilnahme nur einmal

### Foreign Keys
Alle `*Id` Felder sind Foreign Keys mit `onDelete: CASCADE` (außer dokumentiert).

### Validierung
- `Game.kickoffTime` muss in der Zukunft liegen (bei Erstellung)
- `Tip` nur vor `game.kickoffTime` erlaubt
- `homeScore`, `awayScore`, `homeTeamGoals`, `awayTeamGoals` >= 0

---

## Migrations

Schema-Änderungen werden über TypeORM Migrations verwaltet:

1. `1739907893835-CreateUsersTable.ts` - User-Tabelle
2. `1739978213001-CreateRoleField.ts` - Role-Enum hinzugefügt
3. `1740000000000-CreateChampionshipsTable.ts` - Championship-Tabelle

Siehe `backend/migrations.txt` für Details zu Migrationen.

---

## Sicherheit

### Sensitive Felder
- `User.password` hat `select: false` → wird nie in Queries zurückgegeben
- Passwort wird mit bcrypt gehasht (Salt-Rounds: 10)

### Zugriffskontrolle
- JWT-Token enthält `userId`, `email`, `role`
- AuthGuard prüft Token bei geschützten Endpunkten
- Role-basierte Berechtigungen für Admin-Aktionen

---

## Performance-Überlegungen

### Indizes (empfohlen)
- `User.email` - für Login
- `Tip(userId, championshipId)` - für Benutzer-Tipps
- `Game.kickoffTime` - für Deadline-Checks
- `Ranking(championshipId, rank)` - für Ranglisten

### Caching (zukünftig)
- Ranglisten können gecacht werden (invalidieren nach jedem Spiel)
- Game-Liste pro Round kann gecacht werden

---

## Erweiterungen (zukünftig)

### Geplante Features
- **Notifications:** Benachrichtigungen vor Spielbeginn
- **Live-Updates:** WebSocket für Echtzeit-Ranglisten
- **Statistics:** Detaillierte Statistiken pro User
- **Achievements:** Badges für besondere Leistungen
- **Social Features:** Kommentare, Reactions

### Mögliche Entitäten
- `Notification` - Benachrichtigungen
- `Comment` - Kommentare zu Spielen
- `Achievement` - Erfolge
- `UserStatistics` - Detaillierte Statistiken
