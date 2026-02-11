# Daily 3-Minuten-Check (Tipp-Spiel)

## 1) App erreichbar?
```bash
curl -I https://tippsliga.com
```
Erwartung: `200` (oder `301` und danach `200`).

## 2) Container gesund?
```bash
cd /root/tippspiel
docker compose ps
```
Erwartung: `frontend`, `backend`, `postgres` sind `Up`.

## 3) Fehler in Logs?
```bash
cd /root/tippspiel
docker compose logs --tail=80 backend
```
Achte auf: `ERROR`, `ECONNREFUSED`, DB-Fehler.

## 4) Genug Speicher/RAM?
```bash
df -h
free -h
```
Achte auf: Root-Partition nicht voll.

## 5) Backup läuft?
```bash
ls -lh /root/backups/postgres | tail -n 5
```
Erwartung: Neue Datei vom aktuellen/letzten Tag vorhanden.

## Wenn etwas rot ist
1. `docker compose ps` prüfen.
2. `docker compose logs --tail=200 backend frontend postgres`.
3. Falls nötig: `docker compose up -d --build`.
4. Bei DNS/HTTPS-Problemen zusätzlich Host-Nginx prüfen:
```bash
nginx -t
systemctl status nginx --no-pager
```
