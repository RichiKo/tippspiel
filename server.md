# Server Runbook (Tipp-Spiel)

## Ziel
Diese Datei beschreibt den aktuellen Produktionsbetrieb auf dem Hetzner-Server für `tippsliga.com`.

## Server-Setup (Ist-Zustand)
- Domain: `tippsliga.com` (+ `www.tippsliga.com`)
- Deployment: `docker compose`
- Services:
  - `frontend` (Angular via Nginx im Container, Host-Port `8080`)
  - `backend` (NestJS)
  - `postgres` (PostgreSQL 15)
- Host-Nginx: Reverse Proxy von `:80/:443` -> `127.0.0.1:8080`
- HTTPS: Let's Encrypt (`certbot`), HTTP redirect auf HTTPS aktiv

## Wichtige Pfade (Server)
- Projekt: `/root/tippspiel`
- Backup-Script: `/root/tippspiel/scripts/backup_postgres.sh`
- Backups: `/root/backups/postgres`
- Backup-Log: `/var/log/tippspiel-backup.log`
- Backend Env: `/root/tippspiel/backend/.env.production`
- Compose Env: `/root/tippspiel/.env`

## Backup (Postgres)
### Cron-Job
```bash
crontab -l
# erwartet:
# 15 3 * * * /root/tippspiel/scripts/backup_postgres.sh >> /var/log/tippspiel-backup.log 2>&1
```

### Manueller Backup-Test
```bash
/root/tippspiel/scripts/backup_postgres.sh
ls -lh /root/backups/postgres | tail -n 5
```

### Backup inhaltlich prüfen
```bash
LATEST="$(ls -1t /root/backups/postgres/*.sql.gz | head -n 1)"
zcat "$LATEST" | head -n 20
```

### Aufbewahrung
- Aktuell: Backups älter als 14 Tage werden im Script gelöscht.

## Monitoring Basics
### 1) Container-Status
```bash
cd /root/tippspiel
docker compose ps
```

### 2) Fehler-Logs
```bash
cd /root/tippspiel
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
docker compose logs --tail=100 postgres
```

### 3) App-Erreichbarkeit
```bash
curl -I https://tippsliga.com
curl -I http://tippsliga.com
```
Erwartung:
- `https://...` liefert `200` (oder `301` + dann `200`)
- `http://...` liefert `301` auf HTTPS

### 4) Ressourcen
```bash
df -h
free -h
uptime
```

## Baseline-Strategie fuer Migrationen (einmalig)
Nutzen, wenn Tabellen initial mit `TYPEORM_SYNCHRONIZE=true` erstellt wurden.

Ziel:
- Bestehendes Schema behalten
- Migrationshistorie als "bereits ausgefuehrt" markieren
- Danach nur noch `db:run:prod` nutzen

Schritte:
1. Sicherstellen, dass `TYPEORM_SYNCHRONIZE=false` in `backend/.env.production` steht.
2. Ein frisches Backup ziehen.
3. In der DB die TypeORM-Migrationstabelle befuellen:

```bash
cd /root/tippspiel
docker compose exec -T postgres psql -U postgres -d tippspiel_prod <<'SQL'
CREATE TABLE IF NOT EXISTS "migrations" (
  "id" SERIAL PRIMARY KEY,
  "timestamp" bigint NOT NULL,
  "name" character varying NOT NULL
);

INSERT INTO "migrations" ("timestamp","name") VALUES
(1739907893835,'CreateUsersTable1739907893835'),
(1739978213001,'CreateRoleField1739978213001'),
(1740000000000,'CreateChampionshipsTable1740000000000'),
(1740100000000,'CreateTeamsTable1740100000000'),
(1740200000000,'CreateRoundsTable1740200000000'),
(1740200100000,'AddEndDateToRounds1740200100000'),
(1740300000000,'CreateGamesTable1740300000000'),
(1740400000000,'CreateTipsTable1740400000000'),
(1740500000000,'CreateRankingsTable1740500000000'),
(1740600000000,'MakeTipGoalsNullable1740600000000'),
(1740700000000,'AddTotalPointsToRankings1740700000000'),
(1740700000001,'RecalculateTotalPoints1740700000001'),
(1740800000000,'CreateMembershipsTable1740800000000'),
(1741000000000,'CreateBonusRulesTable1741000000000'),
(1741000000001,'CreateBonusPicksTable1741000000001'),
(1741000000002,'CreateBonusEvaluationsTable1741000000002'),
(1741000000003,'AddBonusPointsToRankings1741000000003'),
(1741100000000,'AddEliminatedTeamsToChampionships1741100000000')
ON CONFLICT DO NOTHING;
SQL
```

4. Danach Migration-Status pruefen:
```bash
cd /root/tippspiel
docker compose exec -T postgres psql -U postgres -d tippspiel_prod -c 'SELECT "timestamp","name" FROM "migrations" ORDER BY "timestamp";'
```

5. Ab jetzt bei neuen Releases:
```bash
cd /root/tippspiel
docker compose up -d --build
docker compose exec -T backend npm run db:run:prod
```

## Deployment-Update (Standardablauf)
```bash
cd /root/tippspiel
git pull
docker compose up -d --build
docker compose ps
```

Bei neuer Migration:
```bash
cd /root/tippspiel
docker compose exec -T backend npm run db:run:prod
```

Wichtig:
- Nur ausfuehren, wenn die Produktionsdatenbank auf Migrationsbetrieb basiert.
- Falls die DB initial mit `TYPEORM_SYNCHRONIZE=true` erstellt wurde, erst Baseline-Strategie klaeren (sonst koennen Initial-Migrationen mit "table already exists" fehlschlagen).

## Incident-Checkliste
Wenn Seite nicht erreichbar ist:
1. DNS prüfen
```bash
dig +short A tippsliga.com
dig +short AAAA tippsliga.com
```
2. Host-Nginx prüfen
```bash
nginx -t
systemctl status nginx --no-pager
```
3. Reverse Proxy testen
```bash
curl -I http://127.0.0.1:8080
curl -I -H "Host: tippsliga.com" http://127.0.0.1
```
4. Compose-Services prüfen
```bash
cd /root/tippspiel
docker compose ps
docker compose logs --tail=100 backend
```

## Restore-Hinweis (Skelett)
Nur im Notfall und mit Wartungsfenster:
```bash
# Beispiel: neueste Sicherung in DB einspielen
LATEST="$(ls -1t /root/backups/postgres/*.sql.gz | head -n 1)"
zcat "$LATEST" | docker compose exec -T postgres psql -U postgres -d tippspiel_prod
```
Hinweis: Restore überschreibt Daten. Vorher immer aktuelles Backup ziehen.
