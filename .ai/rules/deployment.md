# Deployment

Deployment-Prozesse, Environment-Handling und Build-Konfigurationen für das Tipp-Spiel Projekt.

---

## Environments

Das Projekt unterstützt verschiedene Umgebungen mit separaten Konfigurationen.

### Backend Environments

#### Development

**Datei:** `backend/.env.development`

```env
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=tippspiel_dev
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
```

#### Production

**Datei:** `backend/.env.production`

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=prod-db-host
DATABASE_PORT=5432
DATABASE_USER=prod_user
DATABASE_PASSWORD=strong-production-password
DATABASE_NAME=tippspiel_prod
JWT_SECRET=strong-production-secret
JWT_EXPIRES_IN=7d
```

**Wichtig:**
- `.env` Dateien duerfen **nie** in Git committed werden (`.gitignore`)
- Secrets nur ueber sichere Wege teilen (Vault, Secrets Manager)
- **Agent darf `.env` Dateien niemals lesen oder aendern** (siehe Boundaries)

---

### Frontend Environments

#### Development

**Datei:** `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: '/api', // Proxy zu Backend
};
```

**Proxy-Konfiguration:** `frontend/proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": ""
    }
  }
}
```

#### Production

**Datei:** `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tippspiel.example.com',
};
```

**Wichtig:**
- Im Prod-Build wird `apiUrl` auf echte Backend-URL gesetzt
- Keine `/api` Proxy in Produktion
- Beispielwerte nur als Referenz, keine Secrets hier ablegen

---

## Build-Prozesse

### Backend Build

```bash
cd backend

# Development Build
npm run build

# Build Output
# → backend/dist/
```

**Build-Befehle:**

```bash
# Build für Produktion
npm run build

# Build im Watch-Modus
npm run build:watch
```

**Output:**
- Transpilierter Code in `backend/dist/`
- Source Maps für Debugging

---

### Frontend Build

```bash
cd frontend

# Development Build
npm run build

# Production Build
npm run build:prod
```

**Build-Befehle:**

```bash
# Development Build
ng build

# Production Build (optimiert)
ng build --configuration production

# Build mit Source Maps
ng build --configuration production --source-map
```

**Output:**
- Statische Dateien in `frontend/dist/frontend/browser/`
- HTML, CSS, JS (Bundles)
- Assets (Bilder, Fonts)

**Optimierungen (Prod):**
- Minification
- Tree-shaking
- AOT-Compilation
- Code-Splitting

---

## Datenbank-Migrationen

### Migrationen ausführen

```bash
cd backend

# Alle Migrationen ausführen
npm run migration:run

# Letzte Migration rückgängig machen
npm run migration:revert

# Neue Migration erstellen
npm run migration:create -- -n MigrationName
```

### Migration-Status prüfen

```bash
npm run migration:show
```

### Wichtig

- **Vor Deployment:** Immer Migrationen lokal testen
- **Produktion:** Migrationen vor App-Deployment ausführen
- **Rollback-Plan:** Wissen, wie Migrationen rückgängig gemacht werden

---

## Start-Befehle

### Development

#### Backend

```bash
cd backend

# Dev-Server mit Nodemon (Auto-Reload)
npm run start:dev

# Debug-Modus
npm run start:debug
```

**Port:** http://localhost:3000

#### Frontend

```bash
cd frontend

# Dev-Server mit Proxy
npm start

# Alternativer Port
ng serve --port 4201
```

**Port:** http://localhost:4200

---

### Production

#### Backend

```bash
cd backend

# Build erstellen
npm run build

# Production-Start
NODE_ENV=production node dist/main.js

# Mit PM2 (empfohlen)
pm2 start dist/main.js --name tippspiel-backend
```

#### Frontend

Frontend ist eine statische App → Dateien über Webserver ausliefern:

**Option 1: Nginx**

```nginx
server {
  listen 80;
  server_name tippspiel.example.com;

  root /var/www/tippspiel/frontend/dist/frontend/browser;
  index index.html;

  # Angular Routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API Proxy
  location /api/ {
    proxy_pass http://localhost:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**Option 2: Express Static Server**

```javascript
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'dist/frontend/browser')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/frontend/browser/index.html'));
});

app.listen(8080, () => {
  console.log('Frontend running on port 8080');
});
```

---

## CI/CD Pipeline

### GitHub Actions (Beispiel)

**Datei:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      # Backend Tests
      - name: Backend Tests
        run: |
          cd backend
          npm ci
          npm run test
          npm run test:e2e
      
      # Frontend Tests
      - name: Frontend Tests
        run: |
          cd frontend
          npm ci
          npm run test:ci
          npm run e2e:headless

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      # Backend Build
      - name: Backend Build
        run: |
          cd backend
          npm ci
          npm run build
      
      # Frontend Build
      - name: Frontend Build
        run: |
          cd frontend
          npm ci
          npm run build:prod
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: |
            backend/dist
            frontend/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download Artifacts
        uses: actions/download-artifact@v3
        with:
          name: build
      
      - name: Deploy to Server
        run: |
          # SSH Deploy, Docker Push, etc.
          echo "Deploy logic here"
```

---

## Git Hooks

### Pre-Commit (Husky)

**Datei:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Lint & Format
cd backend && npm run lint && npm run format
cd ../frontend && npm run lint && npm run format

# Tests für geänderte Dateien
npm run test:affected
```

### Pre-Push

**Datei:** `.husky/pre-push`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Alle Tests ausführen
npm run test
npm run test:e2e
```

---

## Docker Deployment

### Backend Dockerfile

**Datei:** `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Frontend Dockerfile

**Datei:** `frontend/Dockerfile`

```dockerfile
FROM nginx:alpine

COPY dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

**Datei:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tippspiel_prod
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: postgres
      DATABASE_PASSWORD: postgres
      DATABASE_NAME: tippspiel_prod
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres-data:
```

**Start:**

```bash
docker-compose up -d
```

---

## Environment Variables Management

### Development

- `.env.development` lokal im Projekt
- Nicht in Git committen

### Production

**Optionen:**

1. **Environment Variables auf Server:**
   ```bash
   export DATABASE_PASSWORD=strong-password
   export JWT_SECRET=strong-secret
   ```

2. **Secrets Manager (AWS, Azure, GCP):**
   ```bash
   aws secretsmanager get-secret-value --secret-id tippspiel/prod
   ```

3. **Docker Secrets:**
   ```yaml
   services:
     backend:
       secrets:
         - db_password
         - jwt_secret
   ```

---

## Health Checks

### Backend Health Endpoint

```typescript
@Get('health')
health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

**Check:**

```bash
curl http://localhost:3000/health
```

### Database Health

```typescript
@Get('health/db')
async dbHealth() {
  try {
    await this.connection.query('SELECT 1');
    return { status: 'ok', database: 'connected' };
  } catch (error) {
    return { status: 'error', database: 'disconnected' };
  }
}
```

---

## Monitoring & Logging

### Logging (Production)

```typescript
// Winston Logger (empfohlen)
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Error Tracking

- **Sentry:** Fehler-Tracking für Frontend & Backend
- **Loggly/Datadog:** Zentralisiertes Logging

---

## Rollback-Strategie

### Backend

1. **Code Rollback:**
   ```bash
   git revert <commit-hash>
   npm run build
   pm2 restart tippspiel-backend
   ```

2. **Migration Rollback:**
   ```bash
   npm run migration:revert
   ```

### Frontend

1. **Code Rollback:**
   ```bash
   git revert <commit-hash>
   npm run build:prod
   # Upload zu Webserver
   ```

---

## Checkliste: Production Deployment

- [ ] Alle Tests laufen durch
- [ ] Migrationen lokal getestet
- [ ] Environment Variables gesetzt
- [ ] Build erfolgreich
- [ ] Health-Checks funktionieren
- [ ] Backup der Datenbank erstellt
- [ ] Rollback-Plan dokumentiert
- [ ] Monitoring aktiviert
- [ ] SSL/TLS konfiguriert
- [ ] CORS-Settings korrekt
- [ ] Rate-Limiting aktiviert
