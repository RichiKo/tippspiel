# API-Dokumentation

Vollständige API-Referenz für das Tipp-Spiel Backend.

---

## User API

### **POST** `/users/register`

Registriert einen neuen Benutzer.

#### **Request Body (JSON)**

```json
{
  "user": {
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "123456"
  }
}
```

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "image": "default.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### **Status Codes**
- `201 Created` - Erfolgreiche Registrierung
- `400 Bad Request` - Ungültige oder fehlende Eingabe
- `422 Unprocessable Entity` - Email oder Username existiert bereits

---

### **POST** `/users/login`

Meldet einen Benutzer an.

#### **Request Body (JSON)**

```json
{
  "user": {
    "email": "testuser@example.com",
    "password": "123456"
  }
}
```

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "image": "default.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### **Status Codes**
- `200 OK` - Erfolgreicher Login
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Falsche Credentials

---

### **GET** `/user`

Ruft den aktuellen Benutzer ab (authentifiziert).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "image": "default.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage
- `401 Unauthorized` - Fehlende oder ungültige Authentifizierung

---

### **PUT** `/user`

Aktualisiert den aktuellen Benutzer (authentifiziert).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Request Body (JSON)**

```json
{
  "user": {
    "username": "updatedUser",
    "email": "updateduser@example.com",
    "password": "newpassword",
    "image": "/uploads/users/xyz.webp"
  }
}
```

**Hinweise:**
- Alle Felder sind optional
- `password`: Wird gehashed gespeichert (min. 6 Zeichen)
- `username`: Max. 30 Zeichen
- `image`: URL zum Profilbild (von `/upload/user-image` Endpoint)

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "updatedUser",
    "email": "updateduser@example.com",
    "role": "user",
    "image": "/uploads/users/xyz.webp",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Aktualisierung
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Fehlende Authentifizierung
- `404 Not Found` - Benutzer nicht gefunden
- `422 Unprocessable Entity` - Email oder Username bereits vergeben

---

### **GET** `/users/:id`

Ruft Benutzer-Details nach ID ab.

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "image": "default.png"
  }
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage
- `404 Not Found` - Benutzer existiert nicht

---

## Membership API

### **POST** `/championships/:id/join`

Tritt einem Championship bei oder fordert Beitritt an (authentifiziert).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Params**
- `id` (string) - Championship ID

#### **Response (JSON)**

**Public Championship (sofortiger Beitritt):**
```json
{
  "membership": {
    "id": "uuid-v4",
    "userId": 1,
    "championshipId": "championship-uuid",
    "status": "active",
    "createdAt": "2026-01-25T10:00:00.000Z",
    "updatedAt": "2026-01-25T10:00:00.000Z"
  },
  "message": "Successfully joined championship"
}
```

**Private Championship (Beitrittsanfrage):**
```json
{
  "membership": {
    "id": "uuid-v4",
    "userId": 1,
    "championshipId": "championship-uuid",
    "status": "pending",
    "createdAt": "2026-01-25T10:00:00.000Z",
    "updatedAt": "2026-01-25T10:00:00.000Z"
  },
  "message": "Request submitted, waiting for approval"
}
```

#### **Status Codes**
- `200 OK` - Beitritt erfolgreich oder bereits Member
- `400 Bad Request` - Championship ist nicht aktiv
- `401 Unauthorized` - Nicht authentifiziert
- `404 Not Found` - Championship existiert nicht

#### **Idempotenz**
- Wenn User bereits `ACTIVE` Member ist: Gibt existierende Membership zurück
- Wenn User bereits `PENDING` Request hat: Gibt existierende Membership zurück
- Wenn User `REJECTED` wurde: Status wird auf `PENDING` gesetzt (erneute Anfrage)

---

### **GET** `/championships/:id/membership`

Ruft den eigenen Membership-Status für ein Championship ab (authentifiziert).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Params**
- `id` (string) - Championship ID

#### **Response (JSON)**

```json
{
  "membership": {
    "id": "uuid-v4",
    "userId": 1,
    "championshipId": "championship-uuid",
    "status": "active",
    "createdAt": "2026-01-25T10:00:00.000Z",
    "updatedAt": "2026-01-25T10:00:00.000Z"
  }
}
```

**Wenn kein Membership existiert:**
```json
{
  "membership": null
}
```

#### **Status Codes**
- `200 OK` - Erfolgreich
- `401 Unauthorized` - Nicht authentifiziert

---

### **GET** `/championships/:id/members`

Ruft alle Members eines Championships ab (authentifiziert, nur Owner/Admin).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Params**
- `id` (string) - Championship ID

#### **Query Parameters**
- `status` (optional) - Filter nach Status: `active`, `pending`, `rejected`

#### **Response (JSON)**

```json
{
  "members": [
    {
      "id": "uuid-v4",
      "userId": 1,
      "championshipId": "championship-uuid",
      "status": "active",
      "createdAt": "2026-01-25T10:00:00.000Z",
      "updatedAt": "2026-01-25T10:00:00.000Z",
      "user": {
        "id": 1,
        "username": "testuser",
        "email": "testuser@example.com",
        "role": "user",
        "image": "default.png"
      }
    }
  ]
}
```

#### **Status Codes**
- `200 OK` - Erfolgreich
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung (nicht Owner/Admin)
- `404 Not Found` - Championship nicht gefunden

---

### **GET** `/championships/:id/members/pending`

Ruft alle offenen Beitrittsanfragen ab (authentifiziert, nur Owner/Admin).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Params**
- `id` (string) - Championship ID

#### **Response (JSON)**

```json
{
  "pendingRequests": [
    {
      "id": "uuid-v4",
      "userId": 2,
      "championshipId": "championship-uuid",
      "status": "pending",
      "createdAt": "2026-01-25T11:00:00.000Z",
      "updatedAt": "2026-01-25T11:00:00.000Z",
      "user": {
        "id": 2,
        "username": "newuser",
        "email": "newuser@example.com",
        "role": "user",
        "image": "default.png"
      }
    }
  ]
}
```

#### **Status Codes**
- `200 OK` - Erfolgreich
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung (nicht Owner/Admin)
- `404 Not Found` - Championship nicht gefunden

---

### **PUT** `/memberships/:membershipId/approve`

Genehmigt eine Beitrittsanfrage (authentifiziert, nur Owner/Admin).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Params**
- `membershipId` (string) - Membership ID

#### **Response (JSON)**

```json
{
  "membership": {
    "id": "uuid-v4",
    "userId": 2,
    "championshipId": "championship-uuid",
    "status": "active",
    "createdAt": "2026-01-25T11:00:00.000Z",
    "updatedAt": "2026-01-25T11:30:00.000Z",
    "user": {
      "id": 2,
      "username": "newuser",
      "email": "newuser@example.com",
      "role": "user",
      "image": "default.png"
    }
  }
}
```

#### **Status Codes**
- `200 OK` - Erfolgreich genehmigt
- `400 Bad Request` - Ungültige Status-Transition
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung (nicht Owner/Admin)
- `404 Not Found` - Membership nicht gefunden

---

### **PUT** `/memberships/:membershipId/reject`

Lehnt eine Beitrittsanfrage ab (authentifiziert, nur Owner/Admin).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Params**
- `membershipId` (string) - Membership ID

#### **Response (JSON)**

```json
{
  "membership": {
    "id": "uuid-v4",
    "userId": 2,
    "championshipId": "championship-uuid",
    "status": "rejected",
    "createdAt": "2026-01-25T11:00:00.000Z",
    "updatedAt": "2026-01-25T11:30:00.000Z",
    "user": {
      "id": 2,
      "username": "newuser",
      "email": "newuser@example.com",
      "role": "user",
      "image": "default.png"
    }
  }
}
```

#### **Status Codes**
- `200 OK` - Erfolgreich abgelehnt
- `400 Bad Request` - Ungültige Status-Transition
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung (nicht Owner/Admin)
- `404 Not Found` - Membership nicht gefunden

**Hinweis:** User kann nach Ablehnung erneut einen Beitritt anfragen (Status wird wieder auf `pending` gesetzt).

---

### **DELETE** `/memberships/:membershipId`

Entfernt eine Membership (authentifiziert, nur Owner/Admin).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Params**
- `membershipId` (string) - Membership ID

#### **Status Codes**
- `204 No Content` - Erfolgreich entfernt
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung (nicht Owner/Admin)
- `404 Not Found` - Membership nicht gefunden

---

### **GET** `/user/memberships`

Ruft alle eigenen Memberships ab (authentifiziert).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Response (JSON)**

```json
{
  "memberships": [
    {
      "id": "uuid-v4",
      "userId": 1,
      "championshipId": "championship-uuid-1",
      "status": "active",
      "createdAt": "2026-01-25T10:00:00.000Z",
      "updatedAt": "2026-01-25T10:00:00.000Z",
      "championship": {
        "id": "championship-uuid-1",
        "name": "WM 2026",
        "description": "Fußball-Weltmeisterschaft 2026",
        "image": "/uploads/championships/wm2026.png",
        "isPublic": true,
        "isActive": true,
        "createdByUserId": "admin-uuid",
        "createdAt": "2026-01-20T10:00:00.000Z",
        "updatedAt": "2026-01-20T10:00:00.000Z"
      }
    }
  ]
}
```

#### **Status Codes**
- `200 OK` - Erfolgreich
- `401 Unauthorized` - Nicht authentifiziert

---

## Championship API

### **POST** `/championships`

Erstellt eine neue Championship (authentifiziert, nur für Admins).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Request Body (JSON)**

```json
{
  "name": "WM 2026",
  "description": "Fußball-Weltmeisterschaft 2026",
  "isPublic": true,
  "entryFee": 10,
  "prizeDistribution": "1st: 60%, 2nd: 30%, 3rd: 10%"
}
```

#### **Response (JSON)**

```json
{
  "id": "uuid-v4",
  "name": "WM 2026",
  "description": "Fußball-Weltmeisterschaft 2026",
  "isPublic": true,
  "isActive": true,
  "entryFee": 10,
  "prizePool": 0,
  "prizeDistribution": "1st: 60%, 2nd: 30%, 3rd: 10%",
  "createdByUserId": "user-uuid",
  "createdAt": "2026-01-25T10:00:00.000Z",
  "updatedAt": "2026-01-25T10:00:00.000Z"
}
```

#### **Status Codes**
- `201 Created` - Championship erstellt
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Admin-Rechte

---

### **GET** `/championships`

Ruft alle Championships ab (öffentliche oder eigene).

#### **Query Parameters**
- `isActive` (optional): `true` oder `false`
- `isPublic` (optional): `true` oder `false`

#### **Response (JSON)**

```json
{
  "championships": [
    {
      "id": "uuid-v4",
      "name": "WM 2026",
      "description": "Fußball-Weltmeisterschaft 2026",
      "isPublic": true,
      "isActive": true,
      "entryFee": 10,
      "prizePool": 100,
      "createdAt": "2026-01-25T10:00:00.000Z"
    }
  ]
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage

---

### **GET** `/championships/:id`

Ruft Championship-Details ab.

#### **Response (JSON)**

```json
{
  "id": "uuid-v4",
  "name": "WM 2026",
  "description": "Fußball-Weltmeisterschaft 2026",
  "isPublic": true,
  "isActive": true,
  "entryFee": 10,
  "prizePool": 100,
  "prizeDistribution": "1st: 60%, 2nd: 30%, 3rd: 10%",
  "createdByUserId": "user-uuid",
  "createdAt": "2026-01-25T10:00:00.000Z",
  "updatedAt": "2026-01-25T10:00:00.000Z"
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage
- `404 Not Found` - Championship existiert nicht

---

### **PUT** `/championships/:id`

Aktualisiert eine Championship (authentifiziert, nur Creator oder Admin).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Request Body (JSON)**

```json
{
  "name": "WM 2026 (Aktualisiert)",
  "description": "Neue Beschreibung",
  "isActive": false
}
```

#### **Response (JSON)**

```json
{
  "id": "uuid-v4",
  "name": "WM 2026 (Aktualisiert)",
  "description": "Neue Beschreibung",
  "isPublic": true,
  "isActive": false,
  "entryFee": 10,
  "prizePool": 100,
  "prizeDistribution": "1st: 60%, 2nd: 30%, 3rd: 10%",
  "createdByUserId": "user-uuid",
  "createdAt": "2026-01-25T10:00:00.000Z",
  "updatedAt": "2026-01-25T11:00:00.000Z"
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Aktualisierung
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung
- `404 Not Found` - Championship existiert nicht

---

### **DELETE** `/championships/:id`

Löscht eine Championship (authentifiziert, nur Creator oder Admin).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Status Codes**
- `200 OK` - Championship gelöscht
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung
- `404 Not Found` - Championship existiert nicht

---

## Round API

### **POST** `/championships/:championshipId/rounds`

Erstellt eine neue Spielrunde (authentifiziert, nur Admin/Creator).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Request Body (JSON)**

```json
{
  "name": "Vorrunde 1",
  "startDate": "2026-06-15T00:00:00.000Z"
}
```

#### **Response (JSON)**

```json
{
  "id": "uuid-v4",
  "name": "Vorrunde 1",
  "startDate": "2026-06-15T00:00:00.000Z",
  "championshipId": "championship-uuid",
  "createdAt": "2026-01-25T10:00:00.000Z"
}
```

#### **Status Codes**
- `201 Created` - Runde erstellt
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung

---

## Game API

### **POST** `/rounds/:roundId/games`

Erstellt ein neues Spiel (authentifiziert, nur Admin/Creator).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Request Body (JSON)**

```json
{
  "homeTeamId": "team-uuid-1",
  "awayTeamId": "team-uuid-2",
  "kickoffTime": "2026-06-15T18:00:00.000Z"
}
```

#### **Response (JSON)**

```json
{
  "id": "uuid-v4",
  "homeTeamId": "team-uuid-1",
  "awayTeamId": "team-uuid-2",
  "kickoffTime": "2026-06-15T18:00:00.000Z",
  "roundId": "round-uuid",
  "homeScore": null,
  "awayScore": null,
  "isClosed": false,
  "createdAt": "2026-01-25T10:00:00.000Z"
}
```

#### **Status Codes**
- `201 Created` - Spiel erstellt
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung

---

### **GET** `/championships/:championshipId/games`

Ruft alle Spiele einer Championship ab.

#### **Query Parameters**
- `roundId` (optional): Filter nach Runde
- `isClosed` (optional): `true` oder `false`

#### **Response (JSON)**

```json
{
  "games": [
    {
      "id": "uuid-v4",
      "homeTeamId": "team-uuid-1",
      "awayTeamId": "team-uuid-2",
      "kickoffTime": "2026-06-15T18:00:00.000Z",
      "roundId": "round-uuid",
      "homeScore": 2,
      "awayScore": 1,
      "isClosed": true,
      "createdAt": "2026-01-25T10:00:00.000Z"
    }
  ]
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage

---

### **PUT** `/games/:id/result`

Setzt das Ergebnis eines Spiels und triggert automatisch Punkteberechnung und Ranking-Update (authentifiziert, nur Admin/Creator).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Request Body (JSON)**

```json
{
  "homeScore": 2,
  "awayScore": 1,
  "isClosed": true
}
```

#### **Verhalten**

**Fall 1: Spiel wird geschlossen (isClosed: true)**
- Beim **ersten Schließen**: Automatische Erstellung von `notTipped` Tips für User, die keinen Tipp abgegeben haben
- Bei **Korrekturen** (bereits geschlossen): Alle Tips werden neu ausgewertet mit dem neuen Ergebnis, keine neuen `notTipped` Tips
- Rankings werden neu berechnet

**Fall 2: Spiel wird wieder geöffnet (isClosed: false)**
- Alle `notTipped` Tips werden gelöscht
- Alle User-Tips werden zurückgesetzt (`points` und `outcomeType` werden `null`)
- Rankings werden neu berechnet (ohne die Tips dieses Spiels)

**Fall 3: Nur Score-Korrektur (isClosed bleibt true)**
- Alle Tips werden mit dem neuen Score neu ausgewertet
- Rankings werden aktualisiert

#### **Response (JSON)**

```json
{
  "id": "uuid-v4",
  "homeTeamId": "team-uuid-1",
  "awayTeamId": "team-uuid-2",
  "kickoffTime": "2026-06-15T18:00:00.000Z",
  "roundId": "round-uuid",
  "homeScore": 2,
  "awayScore": 1,
  "isClosed": true,
  "createdAt": "2026-01-25T10:00:00.000Z"
}
```

#### **Status Codes**
- `200 OK` - Ergebnis gesetzt, Tipps ausgewertet, Rankings aktualisiert
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung
- `404 Not Found` - Spiel existiert nicht

---

### **GET** `/games/:id/tips`

Ruft alle Tipps für ein bestimmtes Spiel ab (für Tabelle 1: "Tipps aller User für dieses Spiel").

#### **Response (JSON)**

```json
[
  {
    "id": "uuid-v4",
    "userId": 1,
    "gameId": "game-uuid",
    "championshipId": "championship-uuid",
    "homeTeamGoals": 2,
    "awayTeamGoals": 1,
    "points": 3,
    "outcomeType": "exact",
    "createdAt": "2026-06-14T10:00:00.000Z",
    "updatedAt": "2026-06-15T20:00:00.000Z",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "testuser@example.com"
    }
  }
]
```

**Hinweis:** 
- `points` und `outcomeType` sind `null`, wenn das Spiel noch nicht abgeschlossen (`isClosed = false`) ist.
- Wenn `outcomeType = 'notTipped'` und `homeTeamGoals`/`awayTeamGoals` sind `null`, dann wurde kein Tipp abgegeben (User hat vergessen zu tippen).

**Beispiel für nicht getipptes Spiel:**
```json
{
  "id": "uuid-v4",
  "userId": 2,
  "gameId": "game-uuid",
  "championshipId": "championship-uuid",
  "homeTeamGoals": null,
  "awayTeamGoals": null,
  "points": 0,
  "outcomeType": "notTipped",
  "createdAt": "2026-06-15T18:05:00.000Z",
  "updatedAt": "2026-06-15T18:05:00.000Z",
  "user": {
    "id": 2,
    "username": "forgetfulUser",
    "email": "forgetful@example.com"
  }
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage

---

## Tip API

### **POST** `/tips`

Gibt einen Tipp ab (authentifiziert).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Request Body (JSON)**

```json
{
  "gameId": "game-uuid",
  "championshipId": "championship-uuid",
  "homeTeamGoals": 2,
  "awayTeamGoals": 1
}
```

#### **Response (JSON)**

```json
{
  "id": "uuid-v4",
  "userId": "user-uuid",
  "gameId": "game-uuid",
  "championshipId": "championship-uuid",
  "homeTeamGoals": 2,
  "awayTeamGoals": 1,
  "createdAt": "2026-06-14T10:00:00.000Z",
  "updatedAt": "2026-06-14T10:00:00.000Z"
}
```

#### **Status Codes**
- `201 Created` - Tipp erstellt
- `200 OK` - Tipp aktualisiert (wenn bereits vorhanden)
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Tippabgabe nach Kickoff-Zeit nicht erlaubt

---

### **GET** `/tips/user/:userId/championship/:championshipId`

Ruft alle Tipps eines Users für eine Championship ab.

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Response (JSON)**

```json
{
  "tips": [
    {
      "id": "uuid-v4",
      "userId": "user-uuid",
      "gameId": "game-uuid",
      "championshipId": "championship-uuid",
      "homeTeamGoals": 2,
      "awayTeamGoals": 1,
      "createdAt": "2026-06-14T10:00:00.000Z",
      "updatedAt": "2026-06-14T10:00:00.000Z"
    }
  ]
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage
- `401 Unauthorized` - Nicht authentifiziert

---

### **PUT** `/tips/:id`

Aktualisiert einen Tipp (authentifiziert, nur vor Kickoff).

#### **Headers**
```
Authorization: Bearer <token>
```

#### **Request Body (JSON)**

```json
{
  "homeTeamGoals": 3,
  "awayTeamGoals": 2
}
```

#### **Response (JSON)**

```json
{
  "id": "uuid-v4",
  "userId": "user-uuid",
  "gameId": "game-uuid",
  "championshipId": "championship-uuid",
  "homeTeamGoals": 3,
  "awayTeamGoals": 2,
  "createdAt": "2026-06-14T10:00:00.000Z",
  "updatedAt": "2026-06-14T11:00:00.000Z"
}
```

#### **Status Codes**
- `200 OK` - Tipp aktualisiert
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Änderung nach Kickoff-Zeit nicht erlaubt
- `404 Not Found` - Tipp existiert nicht

---

## Ranking API

### **GET** `/rankings/championship/:championshipId`

Ruft die Rangliste für eine Championship ab (für Tabellen 2 & 3: Prüf-Kalkulation und Ergebnis-Tabelle).

#### **Response (JSON)**

```json
[
  {
    "id": "uuid-v4",
    "userId": 1,
    "championshipId": "championship-uuid",
    "rank": 1,
    "exactHits": 5,
    "goalDiffHits": 3,
    "tendencyHits": 2,
    "missedTips": 1,
    "totalPoints": 21,
    "updatedAt": "2026-06-20T10:00:00.000Z",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "testuser@example.com"
    }
  }
]
```

**Hinweis:** `totalPoints` wird automatisch berechnet als: `(exactHits × 3) + (goalDiffHits × 2) + (tendencyHits × 1)` und in der Datenbank gespeichert.

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage
- `404 Not Found` - Championship existiert nicht

---

### **GET** `/rankings/championship/:championshipId/standings`

Ruft die Ergebnis-Tabelle mit Aufschlüsselung der Bonus-Punkte pro ausgewerteter Bonus-Regel ab.
Für `champion` wird eine Spalte geliefert, für `champion_finalist` zwei Spalten (`Finalist`, `Champion`).

#### **Response (JSON)**

```json
{
  "evaluatedBonusRules": [
    { "id": "bonus-rule-uuid-1", "name": "Champion LE", "type": "champion" },
    { "id": "bonus-rule-uuid-2", "name": "UCL Bonus", "type": "champion_finalist" }
  ],
  "bonusColumns": [
    { "key": "bonus-rule-uuid-1:single", "ruleId": "bonus-rule-uuid-1", "subrule": "single", "label": "Champion LE" },
    { "key": "bonus-rule-uuid-2:finalist", "ruleId": "bonus-rule-uuid-2", "subrule": "finalist", "label": "UCL Bonus (Finalist)" },
    { "key": "bonus-rule-uuid-2:champion", "ruleId": "bonus-rule-uuid-2", "subrule": "champion", "label": "UCL Bonus (Champion)" }
  ],
  "standings": [
    {
      "id": "uuid-v4",
      "userId": 1,
      "championshipId": "championship-uuid",
      "rank": 1,
      "exactHits": 5,
      "goalDiffHits": 3,
      "tendencyHits": 2,
      "missedTips": 1,
      "totalPoints": 24,
      "bonusPoints": 3,
      "gamePoints": 21,
      "bonusPointsByRule": {
        "bonus-rule-uuid-1": 3,
        "bonus-rule-uuid-2": 3
      },
      "bonusPointsByColumn": {
        "bonus-rule-uuid-1:single": 3,
        "bonus-rule-uuid-2:finalist": 3,
        "bonus-rule-uuid-2:champion": 0
      },
      "updatedAt": "2026-06-20T10:00:00.000Z",
      "user": {
        "id": 1,
        "username": "testuser",
        "email": "testuser@example.com"
      }
    }
  ]
}
```

- `evaluatedBonusRules`: Liste der ausgewerteten Bonus-Regeln (Reihenfolge = Spaltenreihenfolge).
- `bonusColumns`: Dynamische Bonus-Spalten (inkl. `single|finalist|champion`).
- `standings`: Pro Zeile `gamePoints` = Punkte aus Spielen, `bonusPointsByRule` = Summe je Regel-ID, `bonusPointsByColumn` = Punkte je Spalte, `totalPoints` = Spielpunkte + alle Bonus-Punkte.

#### **Status Codes**
- `200 OK` - Erfolgreiche Abfrage
- `404 Not Found` - Championship existiert nicht

---

## Upload API

### **POST** `/upload/team-logo`

Lädt ein Team-Logo hoch (Multipart Form Data).

#### **Request**

Content-Type: `multipart/form-data`

Form Data:
- `file`: File (required) - Image file (JPG, PNG, WebP, max 2MB)

#### **Response (JSON)**

```json
{
  "url": "/uploads/teams/abc-123-def.png"
}
```

#### **Status Codes**
- `201 Created` - Erfolgreicher Upload
- `400 Bad Request` - Ungültiger Dateityp oder keine Datei
- `413 Payload Too Large` - Datei zu groß (>2MB)

---

### **POST** `/upload/user-image`

Lädt ein Benutzer-Profilbild hoch (Multipart Form Data).

#### **Request**

Content-Type: `multipart/form-data`

Form Data:
- `file`: File (required) - Image file (JPG, PNG, WebP, max 2MB)

#### **Response (JSON)**

```json
{
  "url": "/uploads/users/xyz-456-ghi.png"
}
```

#### **Status Codes**
- `201 Created` - Erfolgreicher Upload
- `400 Bad Request` - Ungültiger Dateityp oder keine Datei
- `413 Payload Too Large` - Datei zu groß (>2MB)

---

### **POST** `/upload/championship-image`

Lädt ein Championship-Bild hoch (Multipart Form Data).

#### **Request**

Content-Type: `multipart/form-data`

Form Data:
- `file`: File (required) - Image file (JPG, PNG, WebP, max 2MB)

#### **Response (JSON)**

```json
{
  "url": "/uploads/championships/def-789-jkl.webp"
}
```

#### **Status Codes**
- `201 Created` - Erfolgreicher Upload
- `400 Bad Request` - Ungültiger Dateityp oder keine Datei
- `413 Payload Too Large` - Datei zu groß (>2MB)

---

## Authentifizierung

### JWT Token
Authentifizierte Anfragen erfordern einen JWT-Token im `Authorization` Header:

```
Authorization: Bearer <token>
```

### Token-Gültigkeit
- Tokens werden bei Login und Registrierung zurückgegeben
- Tokens enthalten User-ID, Email und Role
- Tokens haben eine begrenzte Gültigkeitsdauer

### Rollen
- `user` - Standardbenutzer (Tippabgabe, eigene Tipps ansehen)
- `admin` - Administrator (Championships erstellen/verwalten)
- `superadmin` - Super-Administrator (alle Berechtigungen)

---

## Fehlerbehandlung

### Standard-Fehlerformat

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Häufige Statuscodes
- `200 OK` - Erfolgreiche Anfrage
- `201 Created` - Ressource erstellt
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Authentifizierung erforderlich
- `403 Forbidden` - Keine Berechtigung
- `404 Not Found` - Ressource nicht gefunden
- `422 Unprocessable Entity` - Datenkonflikt (z.B. Email bereits vorhanden)
- `500 Internal Server Error` - Serverfehler

---

## Validierungsregeln

### User
- `username`: String, max 30 Zeichen, erforderlich bei Registrierung
- `email`: String, gültige Email, erforderlich
- `password`: String, mindestens 6 Zeichen, erforderlich (nie im Response)
- `role`: Enum (`user`, `admin`, `superadmin`)

### Championship
- `name`: String, erforderlich
- `description`: String, optional
- `isPublic`: Boolean, default `true`
- `entryFee`: Number, optional
- `prizeDistribution`: String, optional

### Game
- `homeTeamId`: UUID, erforderlich
- `awayTeamId`: UUID, erforderlich
- `kickoffTime`: DateTime, erforderlich
- `homeScore`: Number, optional
- `awayScore`: Number, optional

### Tip
- `homeTeamGoals`: Number, erforderlich, >= 0
- `awayTeamGoals`: Number, erforderlich, >= 0
- Tippabgabe nur vor `kickoffTime` erlaubt

---

## Bonus API

### **POST** `/championships/:championshipId/bonus-rules`

Erstellt eine neue Bonus-Regel für ein Championship (nur Admin/Owner).

**Authentication:** Bearer Token (AuthGuard, BonusAdminGuard)

**Request Body:**
```json
{
  "championshipId": "abc-123",
  "type": "champion",
  "name": "Bundesliga Champion 2024/25",
  "config": { "championPoints": 10 },
  "deadline": "2025-05-15T23:59:59.000Z"
}
```

**Bonus Types:**
- `champion`: Config `{ championPoints: number }`
- `champion_finalist`: Config `{ championPoints: number, finalistPoints: number }`

**Status Codes:** `201 Created`, `400 Bad Request`, `403 Forbidden`, `404 Not Found`

---

### **GET** `/championships/:championshipId/bonus-rules`

Listet alle Bonus-Regeln auf (Admin/Owner). Query param `?status=draft|published|locked|partially_evaluated|evaluated` optional.

---

### **PATCH** `/bonus-rules/:id`

Bearbeitet Bonus-Regel (nur DRAFT/PUBLISHED).

---

### **PATCH** `/bonus-rules/:id/publish`

Veröffentlicht DRAFT Bonus-Regel → PUBLISHED.

---

### **DELETE** `/bonus-rules/:id`

Löscht eine Bonus-Regel (Admin/Owner). Vorhandene Picks/Evaluations werden durch FK-Cascade mit gelöscht.
Nach dem Löschen wird das Ranking der Championship neu berechnet.

---

### **POST** `/bonus-rules/:id/evaluate`

Wertet Bonus-Regeln aus und ruft Ranking-Neuberechnung auf.

**Request Body:**
```json
{
  "championTeamId": "team-uuid",           // optional
  "finalistTeamIds": ["uuid1", "uuid2"]    // optional, genau 2 Teams
}
```

**Hinweise:**
- `champion`: benötigt `championTeamId`, setzt Status auf `evaluated`.
- `champion_finalist` ist 2-stufig:
  - **Phase 1:** nur `finalistTeamIds` (genau 2 verschiedene Teams) -> Status `partially_evaluated`.
  - **Phase 2:** nur `championTeamId`, und dieses Team muss eines der 2 gespeicherten Finalisten sein -> Status `evaluated`.
- Champion vor Finalisten ist ungültig (`400`).

---

### **GET** `/bonus-rules/:id/picks`

Alle Picks (Admin).

---

### **GET** `/bonus-rules/:id/evaluation-result`

Liefert den aktuellen Auswertungsstand für den Admin-Dialog.

**Response (JSON):**
```json
{
  "phase": "finalists_done",
  "finalistTeamIds": ["uuid1", "uuid2"],
  "championTeamId": "uuid1"
}
```

`phase` ist einer von: `none`, `finalists_done`, `complete`.

---

### **GET** `/championships/:championshipId/bonus-rules/active`

Aktive Bonus-Regeln für User (PUBLISHED, Deadline in Zukunft).

---

### **POST** `/bonus-rules/:id/pick`

Pick abgeben/ändern (nur vor Deadline).

**Request Body:**
```json
{ "teamId": "team-uuid" }
```

---

### **GET** `/bonus-rules/:id/my-pick`

Eigenen Pick abrufen. Gibt `null` zurück falls kein Pick vorhanden.

---

### **GET** `/bonus-rules/:id/all-picks`

Alle Picks für User (nur nach Deadline).

---

### **GET** `/championships/:championshipId/bonus-rules/evaluated`

Alle ausgewerteten Bonus-Regeln mit Ergebnissen.

---

**Hinweis:** Bonus-Punkte werden in `rankings.bonusPoints` gespeichert und in `rankings.totalPoints` addiert.
