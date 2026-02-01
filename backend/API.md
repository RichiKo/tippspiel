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
    "image": "new-image-url.png"
  }
}
```

#### **Response (JSON)**

```json
{
  "user": {
    "id": 1711742364893,
    "username": "updatedUser",
    "email": "updateduser@example.com",
    "role": "user",
    "image": "new-image-url.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### **Status Codes**
- `200 OK` - Erfolgreiche Aktualisierung
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Fehlende Authentifizierung
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

Setzt das Ergebnis eines Spiels (authentifiziert, nur Admin/Creator).

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
- `200 OK` - Ergebnis gesetzt
- `400 Bad Request` - Ungültige Eingabe
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung
- `404 Not Found` - Spiel existiert nicht

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

Ruft die Rangliste für eine Championship ab.

#### **Response (JSON)**

```json
{
  "rankings": [
    {
      "id": "uuid-v4",
      "userId": "user-uuid",
      "championshipId": "championship-uuid",
      "rank": 1,
      "exactHits": 5,
      "goalDiffHits": 3,
      "tendencyHits": 2,
      "missedTips": 1,
      "updatedAt": "2026-06-20T10:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "username": "testuser"
      }
    }
  ]
}
```

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
