# Weekly 10-Minuten-Check (Tipp-Spiel)

## Ziel
Einmal pro Woche den Produktionsserver auf Stabilität, Sicherheit und Wiederherstellbarkeit prüfen.

## 1) Service-Status (2 Minuten)
```bash
cd /root/tippspiel
docker compose ps
```
Erwartung: `frontend`, `backend`, `postgres` sind `Up`.

## 2) Fehlerbild in Logs (2 Minuten)
```bash
cd /root/tippspiel
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
docker compose logs --tail=200 postgres
```
Achte auf: `ERROR`, DB-Verbindungsfehler, Neustart-Schleifen.

## 3) Ressourcen (2 Minuten)
```bash
df -h
free -h
uptime
```
Achte auf:
- Root-Partition nicht voll
- RAM nicht dauerhaft am Limit

## 4) HTTPS-Zertifikat (2 Minuten)
```bash
certbot renew --dry-run
```
Erwartung: Test-Renewal erfolgreich.

## 5) Backup/Restore-Readiness (2 Minuten)
```bash
ls -lh /root/backups/postgres | tail -n 7
LATEST="$(ls -1t /root/backups/postgres/*.sql.gz | head -n 1)"
zcat "$LATEST" | head -n 20
```
Erwartung:
- Backups sind aktuell
- Dump ist lesbar und enthält SQL-Header

## Nach Deploy zusätzlich
```bash
cd /root/tippspiel
docker compose up -d --build
docker compose ps
curl -I https://tippsliga.com
```

## Wenn ein Check fehlschlägt
1. `docker compose ps`
2. `docker compose logs --tail=300 backend frontend postgres`
3. `nginx -t && systemctl status nginx --no-pager`
4. Falls nötig: `docker compose up -d --build`
