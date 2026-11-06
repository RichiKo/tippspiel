# User API

## Web-Push auf dem Server deployen: Schritt fuer Schritt

Diese Anleitung gilt fuer das vorhandene Docker-Compose-Setup mit den Services
`postgres`, `backend` und `frontend` aus `docker-compose.yml`. Sie wurde gegen die
Dateien im Repository geprueft, aber nicht auf deinem Produktionsserver ausgefuehrt.
Bei PM2, einer externen Datenbank oder abweichenden Compose-Dateien nicht einfach
uebernehmen. Ein kurzes Wartungsfenster einplanen: Das Backend wird fuer Backup
und Migration voruebergehend gestoppt. Jeden Schritt einzeln ausfuehren und bei
einem Fehler anhalten.

Wichtig: Die Feature-Aenderungen muessen zuerst bewusst committed und auf den
Branch gepusht werden, den der Server verwendet. Ein `git pull` uebertraegt keine
lokalen, uncommitteten Dateien. Die lokale Testdatenbank und `.env.development`
werden nicht auf den Server uebernommen.

### 1. Bestehendes Server-Projekt und Datenbank pruefen

Per SSH anmelden und in das bisher fuer Production verwendete Projektverzeichnis
wechseln. Den Platzhalter durch den echten Server-Pfad ersetzen:

```bash
cd /DEIN/BISHERIGER/SERVERPFAD/tippspiel
git status --short
git branch --show-current
docker compose ps
docker compose exec -T postgres psql -U postgres -d tippspiel_prod \
  -v ON_ERROR_STOP=1 -c 'SELECT current_database(), COUNT(*) AS users FROM public.users;'
```

Erwartet werden die bisherigen laufenden Container, die Datenbank `tippspiel_prod`
und die bekannte Benutzerzahl. Fehlen Container oder `public.users`, oder ist
die Benutzerzahl unerwartet null: STOPP, zuerst den bisherigen Datenbankzugang
und das richtige Compose-Projekt klaeren. Nicht mit einer neuen DB fortfahren.
Die Benutzerzahl fuer die spaetere Kontrolle notieren.

Dieselben bisherigen Compose-Optionen beibehalten, insbesondere `-p`, `-f` oder
`--env-file`, falls der Server sie verwendet. Sie gelten dann fuer ALLE folgenden
Compose-Befehle. Ein anderer Projektname oder Pfad kann andere Volumes verwenden.
Kein `docker compose config` mit vollstaendiger Ausgabe weitergeben: Es kann
Secrets enthalten. Bei lokalen Server-Aenderungen vor dem Update deren Zweck
klaeren; kein `git reset --hard` verwenden.

### 2. Veroeffentlichten Code laden und Images bauen

Nur fortfahren, wenn Schritt 1 das richtige bestehende Projekt bestaetigt hat
und die Aenderungen im verwendeten Remote-Branch verfuegbar sind:

```bash
git pull --ff-only
docker compose build backend frontend
```

Das baut die neuen Images, ersetzt aber noch keine laufenden Container. Die
Dockerfiles installieren die Abhaengigkeiten und bauen Backend und Frontend;
ein zusaetzliches `npm ci`, `npm start` oder `ng serve` auf dem Server ist nicht
noetig. Das Frontend wird dabei als Production-Build mit Service Worker erstellt.
Falls der Build scheitert, bleibt die laufende Version unveraendert.

### 3. Eigene Production-VAPID-Schluessel konfigurieren

Einmalig ein NEUES Schluesselpaar fuer Production erzeugen, nicht das lokale,
bereits im Chat geteilte Paar verwenden:

```bash
docker compose run --rm --no-deps backend \
  ./node_modules/.bin/web-push generate-vapid-keys --json
nano backend/.env.production
```

In der vorhandenen Datei diese Werte ergaenzen beziehungsweise bestehende
Eintraege ersetzen, nicht mehrfach anlegen. Platzhalter ersetzen:

```dotenv
TYPEORM_SYNCHRONIZE=false
PUSH_ENABLED=false
VAPID_PUBLIC_KEY=DEIN_NEUER_PUBLIC_KEY
VAPID_PRIVATE_KEY=DEIN_NEUER_PRIVATE_KEY
VAPID_SUBJECT=https://tippsliga.com
```

Die bisherigen `DATABASE_*`, `JWT_SECRET`, `NODE_ENV`, Ports und sonstigen Werte
beibehalten. Insbesondere keine lokalen Werte wie Port `55432` oder
`tippspiel_push_local` eintragen. Compose uebergibt diese Datei bereits ueber
`env_file` an das Backend; fuer die Push-Variablen ist keine Compose-Aenderung
noetig. Das Paar sicher sichern und bei kuenftigen Deployments wiederverwenden;
ein Wechsel erfordert neue Browser-Subscriptions. Private Schluessel und
`.env.production` weder committen noch in Chat/Logs veroeffentlichen.

### 4. Offene Migrationen vorab anzeigen

Der folgende kurzlebige Container verwendet das neue Backend-Image und dieselbe
Production-Konfiguration, startet aber weder den Webserver noch PostgreSQL neu:

```bash
docker compose run --rm --no-deps backend \
  node ./node_modules/typeorm/cli.js migration:show -d ./dist/ormconfig/datasource.js
```

Fuer dieses Feature wird `CreateNotifications1793880000000` erwartet. Die
zugehoerige Datei ist `1793880000000-CreateNotifications.ts`; sie legt nur
`push_subscriptions`, `notification_dispatches` und `notification_deliveries`
samt Indizes an und loescht keine bestehenden Benutzer, Tipps oder Spiele.
`[ ]` bedeutet offen, `[X]` bereits ausgefuehrt.

Bei weiteren offenen Migrationen zuerst deren `up()` pruefen. Der naechste
Migrationsbefehl fuehrt ALLE offenen Migrationen aus, nicht ausschliesslich die
Push-Migration. Unbekannte offene Migrationen sind ein Grund, hier anzuhalten.

### 5. Schreibzugriffe stoppen und Datenbank sichern

Im Wartungsfenster das Backend stoppen. Andere Dienste mit Schreibzugriff auf
diese Datenbank muessen ebenfalls pausieren. PostgreSQL und dessen Volume bleiben
unveraendert in Betrieb. Alle folgenden Befehle im selben SSH-Terminal ausfuehren:

```bash
docker compose stop backend
umask 077
mkdir -p "$HOME/tippspiel-backups"
BACKUP="$HOME/tippspiel-backups/before-web-push-$(date +%Y%m%d-%H%M%S).dump"
docker compose exec -T postgres pg_dump -U postgres -d tippspiel_prod -Fc > "$BACKUP"
test -s "$BACKUP"
docker compose exec -T postgres pg_restore --list < "$BACKUP"
```

Nur fortfahren, wenn `pg_dump` ohne Fehler endet, `test -s` erfolgreich ist und
`pg_restore --list` ein Inhaltsverzeichnis mit den erwarteten Tabellen zeigt.
Das prueft die Lesbarkeit des Archivs, ersetzt aber keinen Wiederherstellungstest.
Die Sicherung enthaelt sensible Daten; geschuetzt und zusaetzlich ausserhalb des
Servers sichern. Upload-Dateien gehoeren zum separaten `backend-uploads`-Volume
und sind nicht im Datenbank-Dump enthalten; dessen bisherige Sicherung beibehalten.

### 6. Backend-Migration ausfuehren und Backend ausliefern

```bash
docker compose run --rm --no-deps backend npm run db:run:prod
docker compose run --rm --no-deps backend \
  node ./node_modules/typeorm/cli.js migration:show -d ./dist/ormconfig/datasource.js
```

Bei einem Fehler NICHT mit dem Deployment weitermachen. Nach Erfolg muss die
Push-Migration mit `[X]` markiert sein. Danach nur das Backend erneuern:

```bash
docker compose up -d --no-deps backend
docker compose logs --tail=80 backend
docker compose exec -T backend node -e 'fetch("http://127.0.0.1:"+(process.env.PORT||3000)+"/health").then(async r=>{console.log(await r.text());if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))'
docker compose exec -T postgres psql -U postgres -d tippspiel_prod \
  -v ON_ERROR_STOP=1 -c 'SELECT current_database(), COUNT(*) AS users FROM public.users;'
```

Erwartet: Backend ohne DB-Fehler, Health-Antwort mit `"status":"ok"` und die
bisherige Benutzerzahl. Push ist weiterhin deaktiviert. Das alte Frontend kann
waehrend des Wartungsfensters voruebergehend Proxy-Fehler zeigen, bis es im
naechsten Schritt mit dem neuen Backend verbunden wird.

### 7. Frontend ausliefern und HTTPS pruefen

```bash
docker compose up -d --no-deps --force-recreate frontend
docker compose ps
curl -fsS https://tippsliga.com/api/health
curl -fsSI https://tippsliga.com/ngsw-worker.js
curl -fsS https://tippsliga.com/ngsw.json
curl -fsS https://tippsliga.com/manifest.webmanifest
```

Falls die echte Production-Domain anders lautet, diese verwenden. Erwartet sind
eine erfolgreiche Health-Antwort, JavaScript fuer `ngsw-worker.js` sowie JSON
fuer `ngsw.json` und das Manifest, KEINE auf `index.html` umgeleiteten Antworten.
Die bestehende externe HTTPS-/Reverse-Proxy-Konfiguration beibehalten; Compose
liefert das Frontend intern wie bisher auf Port 8080 aus. Kein weiterer
oeffentlicher Backend- oder Datenbank-Port ist noetig. Vorhandene CDN-/Proxy-Caches
duerfen die Service-Worker-Dateien nicht dauerhaft veraltet ausliefern.

Die Seite im Browser neu laden und mit einem bestehenden Konto anmelden. Beim
ersten Service-Worker-Update gegebenenfalls alle Tabs dieser Domain schliessen
und neu oeffnen. Lokale Subscriptions gelten NICHT fuer die Production-Domain.

### 8. Push freigeben und mit einem Admin-Geraet testen

In `backend/.env.production` jetzt nur `PUSH_ENABLED=false` auf
`PUSH_ENABLED=true` aendern. Dann die Konfiguration per Container-Neuanlage laden;
ein blosses `restart backend` uebernimmt geaenderte `env_file`-Werte nicht:

```bash
nano backend/.env.production
docker compose up -d --no-deps --force-recreate backend
docker compose restart frontend
```

Der Frontend-Neustart sorgt dafuer, dass Nginx die aktuelle Backend-Adresse neu
aufloest. Das Backend benoetigt ausgehende HTTPS-Verbindungen zu den verwendeten
Push-Anbietern (Google, Mozilla, Apple); keine eingehende Push-Verbindung.

1. Mit einem Admin-Konto auf der HTTPS-Website anmelden. In den Browser-DevTools
   muss `/api/notifications/config` `enabled: true` und den oeffentlichen Key
   liefern. Der Endpunkt ist authentifiziert; ein nacktes `curl` liefert `401`.
2. Unter Einstellungen Push fuer dieses Geraet aktivieren und die technische
   Testnachricht senden. Browser- UND Betriebssystem-Mitteilungen erlauben.
   Auf unserem Mac waren beide Chrome-Mitteilungseintraege deaktiviert.
3. Mit einer ausdruecklich dafuer vorgesehenen Test-Meisterschaft pruefen:
   aktive Mitgliedschaft plus Push-Aktivierung ergibt mindestens ein Geraet.
   Tour-Ankuendigung manuell senden und den Klick zur richtigen Tour pruefen.
   Keine echten Teilnehmer versehentlich mit Testankuendigungen anschreiben.
4. Mehrere Spiele speichern: Es darf KEIN automatischer Versand entstehen.
   Erst der Ergebnis-Button im Spiel-Dialog erzeugt eine allgemeine Tour-Meldung.
   Ein spaeterer bewusster Klick darf eine weitere Meldung erzeugen.
5. Anschliessend echte Geraete testen: Android/Chrome und eine installierte
   iPhone-Home-Screen-Web-App. Annahme durch den Push-Anbieter ist keine Anzeige-
   oder Lesebestaetigung. Erst nach dem Admin-Test die Teilnehmer informieren.

### Bei Problemen / Datenerhalt

Push kann jederzeit wieder mit `PUSH_ENABLED=false` und den beiden
Neustartbefehlen aus Schritt 8 abgeschaltet werden. Die neuen Tabellen koennen
bei einem Code-Rollback bestehen bleiben; nicht reflexartig Migrationen
zurueckrollen oder das Backup in eine inzwischen weiterbenutzte DB einspielen.
Bei einem Migrationsfehler das Wartungsfenster beibehalten und die Ursache
pruefen, bevor ein Backend wieder Schreibzugriff erhaelt.

Niemals fuer dieses Deployment `db:drop`, `schema:drop`,
`TYPEORM_SYNCHRONIZE=true`, `docker compose down -v` oder eine Volume-Bereinigung
verwenden. Weder PostgreSQL noch die Volumes muessen neu angelegt werden.

Referenzen: [Compose-Service aktualisieren](https://docs.docker.com/reference/cli/docker/compose/up/),
[kurzlebige Compose-Container](https://docs.docker.com/reference/cli/docker/compose/run/),
[PostgreSQL-Backup mit pg_dump](https://www.postgresql.org/docs/15/app-pgdump.html).

## Web-Push lokal testen: Schritt fuer Schritt

Diese Anleitung startet Backend und Frontend auf dem eigenen Rechner. Fuer den
ersten echten Push-Test einen normalen Chrome-Browser verwenden, kein privates
Fenster. Eine Internetverbindung zu den Push-Anbietern wird benoetigt; das Backend
muss dafuer nicht aus dem Internet erreichbar sein. Auf dem Rechner ist HTTP auf
`localhost` ausreichend. Ein iPhone-Test benoetigt dagegen eine vom Handy
erreichbare HTTPS-Adresse und eine als Home-Screen-Web-App installierte Website.

Voraussetzungen: Node.js 20 LTS mit npm und eine laufende Docker-Engine, zum
Beispiel Docker Desktop oder ein kompatibler lokaler Docker-Dienst. Fuer alle
Browseraktionen dieselbe Adresse `http://localhost:4203` verwenden; ein Wechsel
zwischen `localhost`, `127.0.0.1` oder Ports erzeugt andere Browser-Subscriptions.

### 1. Eigene lokale PostgreSQL-Datenbank starten

Im ersten Terminal:

```bash
cd /Users/allgemeinerbenutzer/myProjects/tippspiel
docker run --name tippspiel-push-local-db \
  -e POSTGRES_USER=tippspiel_local \
  -e POSTGRES_PASSWORD=local-test-only \
  -e POSTGRES_DB=tippspiel_push_local \
  -p 127.0.0.1:55432:5432 \
  -v tippspiel-push-local-data:/var/lib/postgresql/data \
  -d postgres:15
docker exec tippspiel-push-local-db pg_isready -U tippspiel_local -d tippspiel_push_local
```

Bei `accepting connections` fortfahren; sonst den letzten Befehl nach einigen
Sekunden wiederholen. Fuer weitere Testlaeufe nicht nochmals `docker run`, sondern
`docker start tippspiel-push-local-db` verwenden. Das Volume behaelt die Testdaten.
Die oben genannten Zugangsdaten sind ausschliesslich fuer diese lokale Testinstanz.
Die bestehende Docker-Compose-Konfiguration wird hier nicht verwendet, da sie
auf eine Datenbank namens `tippspiel_prod` zeigt.

### 2. Backend-Abhaengigkeiten und lokale Konfiguration vorbereiten

Im selben ersten Terminal:

```bash
cd /Users/allgemeinerbenutzer/myProjects/tippspiel/backend
npm ci
export NODE_ENV=development
export PORT=3000
export DATABASE_HOST=127.0.0.1
export DATABASE_PORT=55432
export DATABASE_USER=tippspiel_local
export DATABASE_PASSWORD=local-test-only
export DATABASE_NAME=tippspiel_push_local
export TYPEORM_SYNCHRONIZE=false
export JWT_SECRET=tippspiel-local-push-test-only-secret
export PUSH_ENABLED=true
```

Diese Variablen gelten nur in diesem Terminal und werden von dessen Kindprozessen
uebernommen. Sie stellen sicher, dass sowohl die TypeORM-CLI als auch das Backend
dieselbe lokale Testdatenbank benutzen. Es muss keine `.env`-Datei angelegt oder
geaendert werden. In einem neuen Terminal muessen die Exports erneut gesetzt werden.
Ist Port 3000 schon durch ein anderes Backend belegt, dieses fuer den Test stoppen;
der vorhandene Frontend-Proxy erwartet das Backend auf Port 3000.

### 3. VAPID-Schluessel einmalig erzeugen und Push konfigurieren

Weiterhin im Backend-Verzeichnis desselben Terminals:

```bash
./node_modules/.bin/web-push generate-vapid-keys --json
```

Die Ausgabe enthaelt `publicKey` und `privateKey`. Die folgenden Platzhalter durch
genau diese beiden zusammengehoerigen Werte ersetzen. Bei `VAPID_SUBJECT` eine
eigene gueltige Kontaktadresse verwenden:

```bash
export VAPID_PUBLIC_KEY='PUBLIC_KEY_AUS_DER_AUSGABE'
export VAPID_PRIVATE_KEY='PRIVATE_KEY_AUS_DER_AUSGABE'
export VAPID_SUBJECT='mailto:deine-adresse@example.com'
```

Die Schluessel fuer spaetere Tests unveraendert wiederverwenden und vertraulich
aufbewahren; den privaten Schluessel nicht committen oder weitergeben. Nach einem
Schluesselwechsel alte Push-Subscriptions deaktivieren und neu aktivieren. Fuer
einen reinen lokalen Test keine HTTPS-Subject-Adresse mit `localhost` verwenden.
`PUSH_ENABLED=true` allein reicht nicht: Bei ungueltigen oder fehlenden
VAPID-Werten liefert das Backend weiterhin `enabled: false`.

### 4. Migrationen anzeigen und ausfuehren

Im selben Backend-Terminal mit den Exports aus Schritt 2 und 3:

```bash
npm run typeorm -- migration:show --dataSource=./src/ormconfig/datasource.ts
npm run db:generate
npm run typeorm -- migration:show --dataSource=./src/ormconfig/datasource.ts
```

Die fuer Web-Push neue Migration ist
`1793880000000-CreateNotifications.ts`. Sie erstellt:

- `push_subscriptions`: registrierte Browser/Geraete.
- `notification_dispatches`: manuell angelegte Versandauftraege.
- `notification_deliveries`: Versandstatus je Geraet.

Auf einer leeren Datenbank werden auch alle vorherigen Migrationen benoetigt.
TypeORM fuehrt ausstehende Migrationen automatisch in Reihenfolge aus; bereits
ausgefuehrte werden uebersprungen. Beim letzten `migration:show` muss die neue
Migration mit `[X]` markiert sein. Nicht nur die Notifications-Migration einzeln
auf eine leere Datenbank anwenden, da sie bestehende `users` und `rounds` referenziert.

Wichtig: Das bestehende Script `db:generate` fuehrt `migration:run` aus. Es erzeugt
keine neue Migration. `db:create` und `db:drop` werden fuer diesen Test nicht benoetigt.
Diese Entwicklungsversion der Anleitung benoetigt keinen Backend-Build vorab.

### 5. Backend starten und Erreichbarkeit pruefen

Im ersten Backend-Terminal:

```bash
npm start
```

Das Terminal geoeffnet lassen. In einem weiteren Terminal pruefen:

```bash
curl http://localhost:3000/health
```

Erwartet wird eine JSON-Antwort mit `"status":"ok"`. Nach spaeteren Aenderungen
der Terminal-Variablen das Backend in diesem Terminal mit `Ctrl+C` stoppen und
mit `npm start` neu starten.

### 6. Frontend mit Service Worker starten

In einem zweiten Terminal:

```bash
cd /Users/allgemeinerbenutzer/myProjects/tippspiel/frontend
npm ci
NG_BUILD_MAX_WORKERS=2 npm start -- --configuration=production --no-hmr --host=localhost --port=4203
```

Danach [http://localhost:4203](http://localhost:4203) im normalen Browserfenster
oeffnen. Falls Port 4203 belegt ist, einen anderen freien Port waehlen und ihn
anschliessend fuer alle Browseraktionen beibehalten.

`--configuration=production` aktiviert hier den Angular Service Worker; einfaches
`npm start` ohne diesen Parameter reicht fuer Push nicht. Der vorhandene Proxy
leitet `/api` und `/uploads` an das Backend auf Port 3000 weiter. Dafuer ist keine
Aenderung der API-URL oder CORS-Konfiguration erforderlich. Siehe auch die
[Angular-Anleitung zum lokalen Service-Worker-Test](https://angular.dev/ecosystem/service-workers/getting-started).

HMR ist fuer diese Production-Serve-Konfiguration deaktiviert; `--no-hmr` macht
das auch im Startbefehl ausdruecklich. Mit aktiviertem Template-HMR bindet Angular
zusaetzlichen Compiler-Code ein und kann dadurch das Initial-Bundle-Budget
ueberschreiten. Der normale Development-Start behaelt seine HMR-Einstellungen.

### 7. Testkonto und Admin-Rechte vorbereiten

Auf der neuen leeren Datenbank existieren noch keine Benutzer oder Meisterschaften.
Ueber die Oberflaeche ein Testkonto registrieren. Fuer die folgenden Beispiele
`push-admin@example.com` als E-Mail verwenden. Danach in einem weiteren Terminal
ausschliesslich dieses lokale Testkonto zum Admin machen:

```bash
docker exec tippspiel-push-local-db psql -U tippspiel_local -d tippspiel_push_local \
  -c "UPDATE users SET role = 'admin' WHERE email = 'push-admin@example.com';"
```

Erwartet wird `UPDATE 1`. Bei `UPDATE 0` die tatsaechlich registrierte E-Mail
verwenden. Anschliessend im Browser abmelden und neu anmelden, damit auch die
Oberflaeche die neue Rolle kennt. Das passiert vor der Push-Aktivierung aus Schritt 8.

Eine oeffentliche Test-Meisterschaft erstellen. Der Ersteller wird dabei als
aktiver Teilnehmer eingetragen und kann seine eigenen Ankuendigungen empfangen.
Eine Tour anlegen. Fuer den Ergebnisdialog ausserdem zwei Teams anlegen, der
Meisterschaft zuordnen und ein Spiel in dieser Tour erstellen.

### 8. Push am Browser aktivieren und Testnachricht senden

In den Einstellungen (`/settings`) den Bereich fuer Push-Benachrichtigungen
oeffnen, Push fuer dieses Geraet aktivieren und die Browserabfrage erlauben.
Anschliessend den Button fuer die Testnachricht verwenden. Es muss eine
ukrainische Testbenachrichtigung erscheinen.

Falls keine Browserabfrage kommt, die Website-Berechtigung fuer Benachrichtigungen
pruefen. Zusaetzlich muessen im Betriebssystem Mitteilungen fuer den verwendeten
Browser erlaubt sein; ein aktiver Fokus-/Nicht-stoeren-Modus kann die Anzeige
unterdruecken. Der Browser muss fuer den ersten Test geoeffnet bleiben.

Nach der Anmeldung kann in den Browser-Entwicklertools unter Network die Antwort
von `/api/notifications/config` geprueft werden. Erwartet: `enabled: true` und ein
nichtleerer `publicKey`. Der Endpunkt ist authentifiziert; ein Aufruf ohne JWT
liefert `401` und sagt nichts ueber die Push-Konfiguration aus.

### 9. Die beiden Admin-Aktionen testen

1. Die Test-Tour bearbeiten. Im Bereich fuer die Tour-Ankuendigung muss mindestens
   ein Empfaenger/Geraet erscheinen. Vorschau oeffnen, dann den Versand bestaetigen.
   Die ukrainische Tour-Nachricht muss erscheinen. Danach wird die Tour als bereits
   angekuendigt angezeigt. Zum erneuten Testen eine neue Tour anlegen.
2. Ein Spiel aktualisieren und speichern. Dadurch darf keine Nachricht erscheinen.
3. Das Spiel erneut bearbeiten. Bei abgeschlossenen Spielen gegebenenfalls zuerst
   die Tour-Ansicht "Alle Tipps" (`Усі прогнози`) waehlen, um die Spielaktionen zu sehen.
   Im Spiel-Dialog den Button fuer die Tour-Ergebnisse verwenden und bestaetigen.
4. Erwartet wird eine allgemeine Nachricht zur Tour, zum Beispiel
   `У турі «Тур 1» опубліковано нові результати.` Keine einzelnen Spielstaende.
5. Dieselbe Ergebnisaktion bewusst nochmals ausloesen: Eine weitere Meldung ist
   erlaubt, auch ohne zwischenzeitliche Ergebnis-Aenderung. Versandstatus und
   fehlgeschlagene/ausstehende Sendungen im Dialog pruefen.
6. Eine Benachrichtigung anklicken. Sie muss die passende Meisterschaft und Tour
   oeffnen. Zum Hintergrund-Test die Website in einen anderen Tab legen, aber
   nicht abmelden: Abmelden deaktiviert Push fuer dieses Geraet.

Fuer getrennte Admin- und Teilnehmerkonten zwei normale Browserprofile oder zwei
Browser verwenden. Ein zweiter Tab desselben Profils ist kein getrenntes Konto.
Der Teilnehmer muss aktives Mitglied sein und in seinem Browser Push aktivieren.
Die reine Testnachricht aus Schritt 8 benoetigt dagegen keine Mitgliedschaft.

### 10. Test beenden und typische Fehler einordnen

Frontend und Backend jeweils mit `Ctrl+C` stoppen. Die lokale Testdatenbank kann
danach gestoppt werden; ihre Daten bleiben im Volume erhalten:

```bash
docker stop tippspiel-push-local-db
```

Beim naechsten Test `docker start tippspiel-push-local-db` verwenden, die
Backend-Exports einschliesslich desselben VAPID-Paars erneut setzen und Backend
sowie Frontend wie oben starten. Migrationen erneut auszufuehren ist erlaubt;
bereits ausgefuehrte werden nicht wiederholt.

| Beobachtung | Pruefen |
| --- | --- |
| Push nicht unterstuetzt | Production-Konfiguration, localhost, normales Browserfenster, aktiver Service Worker. |
| Push deaktiviert / `enabled: false` | `PUSH_ENABLED=true`, vollstaendiges zusammengehoeriges VAPID-Paar, gueltiger Subject-Wert; Backend neu starten. |
| `relation ... does not exist` | Migrationen und Backend muessen dieselben `DATABASE_*`-Variablen verwenden. |
| Verbindung zur DB abgelehnt | Container laeuft, `pg_isready` erfolgreich, Host-Port 55432 statt Container-Port 5432. |
| `/api` liefert 502 / Proxy-Fehler | Backend auf Port 3000 erreichbar; `curl /health` testen. |
| Null Empfaenger im Dialog | Aktive Mitgliedschaft und aktivierte Push-Subscription pruefen; Admin-Rolle allein genuegt nicht. |
| Test angenommen, aber keine Anzeige | Browser-/OS-Berechtigungen, Fokusmodus und Internetverbindung pruefen. Annahme durch den Anbieter ist keine Zustellbestaetigung. |
| Alte Oberflaeche nach Neustart | Seite neu laden; bei Bedarf unter Application / Service Workers abmelden und Site-Daten zuruecksetzen. Danach neu anmelden und Push wieder aktivieren. |

API-Vertrag und VAPID-Konfiguration: [API.md](API.md#web-push).

## Private Championship-Preisgeldkonfiguration

`GET/PUT /championships/:id/prize-fund` persistiert `entryFeeMinorUnits` (Dezimalstring in Kopeken) und `prizeFundRule` (JSONB: Gleichstandsregel und geordnetes Array `prizeAmountsMinorUnits` mit einem festen Betrag je Platz). Defaults: Einsatz 0, gemeinsame Plätze und drei Platzbeträge von 0. Die Summe wird nicht mit dem Fonds abgeglichen; Prozentwerte dienen nur als Information. Authentifizierte Benutzer können lesen; Owner, Admin und Super-Admin können schreiben. Öffentliche Championships und ungültige Konfigurationen werden abgewiesen.

Fonds und Gewinner werden aus aktiven Standings im Frontend berechnet und nicht persistiert. API-Vertrag und Regeln stehen in [API.md](API.md); Datenmodell in [ERD.md](ERD.md). Vor Einsatz des Backends die neue Migration ausführen, siehe [migrations.txt](migrations.txt).

Die Standings-API liefert in `user.image` die Profilbild-URL oder `null`, auch ohne ausgewertete Bonus-Regeln. Die Gewinnerübersicht verwendet sie für die Benutzeravatare.

## Endpoint: Create User

### **POST** `/users/register`

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

---

## Endpoint: User Login

### **POST** `/users/login`

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

---

## Endpoint: Get Current User

### **GET** `/user`

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

**Note:** This endpoint requires authentication and retrieves the current user based on the provided JWT token.

---

## Endpoint: Update Current User

### **PUT** `/user`

#### **Request Body (JSON)**

```json
{
  "user": {
    "username": "updatedUser",
    "email": "updateduser@example.com",
    "password": "newpassword",
    "image": "new-image-url.png",
    "role": "admin"
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
    "role": "admin",
    "image": "new-image-url.png",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** This endpoint requires authentication and allows updating the current user's profile information.

---

## Endpoint: Get User by ID

### **GET** `/users/:id`

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

### **Validation Rules**

- `username` (string) - **optional**, must not exceed 30 characters.
- `email` (string) - **optional**, must be a valid email address.
- `password` (string) - **optional**, must be at least **6 characters** long.
- `role` (enum: `user`, `admin`, `superadmin`) - **optional**.
- `image` (string) - **optional**.

**Note:** The `password` field is **never** returned in the response for security reasons.

### **Database Requirements**

- `id` (integer) - Automatically generated.
- `token` (string) - Contains the JWT token for authentication.

### **Authentication**

- Authentication **not required** for user registration.
- Authentication **required** for user login.
- Authenticated requests must include the `Authorization` header with a valid JWT token:
  ```http
  Authorization: Bearer <token>
  ```
- The system automatically decodes the JWT and attaches the user object to the request.
- Authentication **required** for retrieving the current user via `GET /user`.
- Authentication **required** for updating the current user via `PUT /user`.
- Access to protected routes is enforced using an **AuthGuard**, which ensures that `request.user` is present before granting access. If `request.user` is missing, a `401 Unauthorized` error is returned.

### **Status Codes**

- `201 Created` - Successful registration.
- `200 OK` - Successful operation.
- `400 Bad Request` - Invalid or missing input.
- `401 Unauthorized` - Authentication required.
- `422 Unprocessable Entity` - Email or username already exists.
- `404 Not Found` - User not found.

---

## File Upload System

### **Upload Directory Structure**

The backend stores uploaded files in the following structure:

```
backend/uploads/
  teams/          # Team logos
  users/          # User profile images
  championships/  # Championship images
```

**Note:** The `/uploads` directory is excluded from version control (in `.gitignore`). Only the directory structure with `.gitkeep` files is versioned.

### **File Upload Endpoints**

See `API.md` for detailed documentation of upload endpoints:
- `POST /upload/team-logo`
- `POST /upload/user-image`
- `POST /upload/championship-image`

### **Upload Specifications**

- **Allowed formats:** JPG, PNG, WebP
- **Maximum file size:** 2MB
- **File naming:** UUID-based for uniqueness
- **Validation:** Server-side validation of MIME type and file size

### **Static File Serving**

Uploaded files are served statically via `/uploads/*` path, configured in `main.ts`.

---

### **Next Steps**

- **Database Integration:** Store the user in PostgreSQL.
- **Password Hashing:** Ensure passwords are not stored in plaintext.
- **JWT Generation:** Generate a token after successful registration and login.
- **User Retrieval:** Implement GET `/users/:id` to fetch user details.
