# Live-Quiz

Quiz am Stundenende, ähnlich wie Socrative, im Lernraum-Design. Adresse: **https://quiz.yannikbrand.eu/**

## So läuft es im Unterricht
1. Lehrkraft öffnet die Startseite → „Lehrkraft“ → Fragen aus einem Kurs wählen (alle Kurs-Quizfragen stehen zur Verfügung) und/oder eigene Fragen schreiben (Mehrfachauswahl, Richtig/Falsch, Kurzantwort, Zahl) und/oder ein **Quiz per Datei laden** (CSV aus Excel oder JSON, Vorlage zum Herunterladen im Quiz). Die Datei wird nur im Browser gelesen, hochgeladen wird erst der fertige Raum → „Raum öffnen“.
2. Es erscheint ein **5-stelliger Raumcode mit QR-Code**. Bis die Lehrkraft auf **„Quiz starten“** tippt, sind alle im **Warteraum** (Namen erscheinen live, danach Countdown 3-2-1). Schüler/innen scannen ihn oder tippen den Code unter `/quiz/` ein und wählen einen **Spitznamen**.
3. Jede Person beantwortet die Fragen im eigenen Tempo und sieht sofort „richtig/falsch“ mit Erklärung.
4. Die Lehrkraft sieht **für jeden Spitznamen einen Fortschrittsbalken** (grün richtig, rot falsch), dazu „Ø richtig“ und je Frage die Trefferquote. Mit „Ansicht: Rennen“ (Standard) wird daraus eine **Rennbahn** (Grafik in `quiz/race.js`): jede Person ist ein gezeichnetes Pferd mit Reiter in ihrer Bahn und galoppiert mit jeder beantworteten Frage Richtung Ziel (**nur richtige Antworten** bewegen das Pferd, falsche nicht; „Einzelantworten: an“ zeigt zusätzlich richtig/falsch je Frage; Staub, „+1“, Krone für die Führung, „Serie 3“ bei drei richtigen in Folge im Detail-Modus, Überhol-Meldungen, Konfetti im Ziel, Siegerpodest). Knöpfe: Namen ausblenden (zeigt „SuS 1, 2 …“), Sortierung, **Beamer-Ansicht** (Vollbild, große Schrift, Bedienknöpfe weg; Beenden mit „✕ Beamer aus“ oder Esc).
5. „Quiz beenden“ schließt den Raum; die Schüler/innen sehen ihr Ergebnis mit allen richtigen Antworten.

Technik: reine statische Seite (`index.html`, `quiz.js`, `quiz.css`), Echtzeit über Supabase-Funktionen (Abfrage alle 2 s). Keine Zusatzbibliothek außer dem vorhandenen QR-Code. Bewertung der Antworten läuft **auf dem Server**: die Lösungen verlassen den Server erst nach der Antwort.

## Quiz mit KI erstellen (Anleitung im Quiz)
Im Quiz-Editor gibt es „Anleitung: Quiz mit KI erstellen“: ein fertiger **Prompt zum Kopieren** (Thema/Material, Niveau und Anzahl eintragen), der eine CSV-Tabelle im richtigen Format erzeugt, plus ein Feld zum Einfügen der KI-Antwort. Der Prompt steht als `KI_PROMPT` in `quiz/quiz.js`; bei Formatänderungen der Datei-Import dort mitpflegen. Die Lehrkraft muss die Fragen vor dem Einsatz prüfen.

## Subdomain?
Das Quiz hat ein **eigenes Repository** (`lernraum-quiz`) mit eigener Adresse `quiz.yannikbrand.eu`, damit Mitwirkende keinen Zugriff auf das Lernraum-Repo brauchen. Design (`assets/styles.css`, Schriften) ist eine Kopie aus dem Lernraum; Kursfragen werden zur Laufzeit lesend von `lernen.yannikbrand.eu/app/` geladen.

## Einrichtung
**Stand 19.11.2026: erledigt.** Läuft im bestehenden Supabase-Projekt (Irland, eu-west-1), `supabase/quiz.sql` ausgeführt, Lehrer-PIN gesetzt (nicht im Repo), `config.js` eingetragen. Zum Ändern der PIN den SQL-Befehl unten erneut ausführen. Für ein neues Projekt:
1. Auf supabase.com ein Projekt anlegen, Region **Frankfurt (eu-central-1)**. (Das Projekt der geplanten Leistungsabfrage kann mitgenutzt werden.)
2. Im **SQL Editor** den ganzen Inhalt von `supabase/quiz.sql` einfügen und „Run“ drücken. Das Skript darf mehrfach laufen.
3. Im SQL Editor die **Lehrer-PIN** setzen (nur wer sie kennt, kann Räume anlegen):
   ```sql
   insert into quiz_config(id, teacher_pin) values (1, 'DEINE-PIN')
   on conflict (id) do update set teacher_pin = excluded.teacher_pin;
   ```
4. Unter *Project Settings → API* die **Project URL** und den **anon/publishable Key** kopieren und in `config.js` eintragen (der öffentliche Key ist für den Browser gedacht; den geheimen `service_role`-Key **nie** eintragen).
5. Beim ersten Anlegen eines Quiz die PIN eingeben (wird nur auf diesem Gerät gemerkt).

Solange `config.js` leer ist, läuft das Quiz im **Demo-Modus** (nur im eigenen Browser, zum Ausprobieren mit zwei Tabs, kein Server nötig).

5. **Aufholbonus** (Knopf im Warteraum und während des Rennens, standardmäßig aus): Ab 4 Personen bekommen alle im hinteren Drittel für eine richtige Antwort **doppelte Punkte** (zwei Schritte, „TURBO +2“, Meldung „holt auf“). Berechnung serverseitig in `quiz_answer`; schaltbar mit `quiz_set_bonus`. Bei Neuanlage der Tabellen/Funktionen `supabase/quiz.sql` erneut ausführen (idempotent).

6. **Zuschauer-Ansicht**: Wer fertig ist, sieht auf dem eigenen Handy das Rennen live mit (eigene Bahn gelb umrandet). Dafür gibt es `quiz_watch_state`: liefert nur Spitzname, Anzahl beantworteter Fragen und Bonus, keine Antworten und keine Raum-Geheimnisse; Zugriff nur mit eigenem Token. Bei Updates `supabase/quiz.sql` erneut ausführen.

## Brauchen Lehrkräfte Supabase?
Nein. Lehrkräfte brauchen **kein Konto**, nur die gemeinsame Lehrer-PIN. Supabase läuft einmal im Hintergrund (von dir eingerichtet) und überträgt nur den Live-Stand zwischen Handys und Lehrkraft. Das Laden einer Datei braucht gar kein Backend.

## Datenschutz und Datensparsamkeit
- Keine Konten, keine echten Namen: nur ein **selbst gewählter Spitzname** (Hinweis dazu steht im Formular). Wer die Zuordnung braucht, spricht sie in der Klasse ab.
- Gespeichert werden pro Raum: Code, Titel, Fragen, Spitznamen, Antworten. **Alles wird nach 24 Stunden gelöscht** (beim Anlegen eines neuen Raums), sofort mit „Raum löschen“.
- Die Tabellen sind für den öffentlichen Schlüssel gesperrt (Row Level Security ohne Regeln). Zugriff nur über wenige Funktionen; Lehrkraft-Funktionen brauchen ein zufälliges Geheimnis, das nur im Browser der Lehrkraft liegt.
- Höchstens 80 Personen pro Raum, 40 Fragen. Bei Betrieb mit Schülern: Abstimmung mit Schulleitung/Datenschutz und Auftragsverarbeitungsvertrag mit Supabase wie bei der Leistungsabfrage.
- Zusätzlich lohnt sich im Supabase-Dashboard: Authentication → „Allow new users to sign up“ **aus**, da kein Login genutzt wird.

## Grenzen
- Jede Person darf jede Frage nur einmal beantworten (erste Antwort zählt). Das ist Üben/Sichern, keine benotete Prüfung.
- Nur der Lerninhalt „Quiz-Fragen“ der Kurse lässt sich übernehmen (Mehrfachauswahl mit 2–4 Antworten).
- Lehrkraft-Zugang gilt pro Gerät: den Raum öffnet man auf dem Gerät, auf dem er angelegt wurde.

## Wartung
Fehlermeldungen des Servers: `NO_PIN` (PIN nicht gesetzt), `BAD_PIN`, `NO_ROOM` (Code falsch oder Raum nach 24 h gelöscht), `NICK_TAKEN`, `FULL`, `CLOSED`.

## Hinweis für Updates
GitHub Pages liefert Dateien bis zu 10 Minuten aus dem Browser-Cache. Darum haben die Dateien in `index.html` eine Versionsnummer (`?v=…`). Bei Änderungen an `quiz.js`, `race.js`, `quiz.css` oder `config.js` die Nummer erhöhen, sonst sieht man zeitweise Alt/Neu gemischt (z. B. Namen im Warteraum ohne Kästchen).

## Ergebnis exportieren
In der Lehreransicht gibt es **„Ergebnis exportieren“**: lädt eine CSV-Datei (Semikolon, für Excel) mit Kopfzeilen (Quiz, Raum, Datum), einer Zeile je Person (Spitzname, richtig, falsch, nicht beantwortet, Bonuspunkte, Punkte gesamt, Prozent, Ergebnis je Frage) und darunter der Trefferquote je Frage. Die Datei entsteht nur im Browser der Lehrkraft und enthält nur Spitznamen. Spitznamen, die mit `=`, `+`, `-` oder `@` beginnen, bekommen ein Hochkomma davor (Schutz vor Excel-Formeln). Der Export zeigt immer die echten Spitznamen, auch wenn „Namen ausblenden“ an ist. Vor dem Löschen des Raums (nach 24 Stunden wird er automatisch gelöscht) exportieren.
## Personen entfernen und umbenennen (Lehrkraft)
Im Warteraum und im Rennen hat jede Person zwei Knöpfe: **✎ Umbenennen** (neuen Spitznamen eintippen, 2 bis 20 Zeichen, bei doppeltem Namen kommt eine Meldung) und **× Entfernen**. Nützlich bei unpassenden Spitznamen. Datenbank: `quiz_rename_player` (nur mit Raum-Geheimnis der Lehrkraft) und `quiz_remove_player`. Entfernte Personen sehen „Du bist nicht mehr im Raum“ mit Knopf zum erneuten Beitreten. Wer umbenannt wurde, sieht den neuen Namen bei der Lehrkraft und in der Rennbahn sofort; auf dem eigenen Handy steht bis zum Neu-Beitritt noch der alte Name. In der Beamer-Ansicht sind die Knöpfe ausgeblendet; zusätzlich gibt es „Namen ausblenden“.

## Zeitlimit, Wertung, Siegerehrung (24.11.2026)
**Handbuch mit Screenshots:** `docs/BEIPACKZETTEL-LIVE-QUIZ.md`.
- **SQL muss neu eingespielt werden** (`supabase/quiz.sql`, wiederholbar): neue Spalten `quiz_rooms.time_limit` und `started_at`, Funktion `quiz_set_time`, Hilfsfunktion `quiz_left`; `quiz_answer` lehnt nach Ablauf mit `TIME_UP` ab (3 s Toleranz); die Abfragen liefern `tl` (Limit), `left` (Rest-Sekunden, Serverzeit) und je Person `lt` (Sekunden vom Start bis zur letzten richtigen Antwort).
- **Wertung:** Punkte = richtig + Aufholbonus. Gleichstand: kleineres `lt` gewinnt. Gilt in Rennbahn, Handy-Platzanzeige, Siegerehrung und CSV.
- **Handy:** Leiste oben mit Platz, Punkten und Restzeit (Abfrage `quiz_watch_state` alle 4 s, Uhr läuft lokal). Größere Schrift.
- **Siegerehrung:** `ceremony.js`, Knopf in der Lehrkraft-Ansicht, auf den Handys automatisch am Ende.

## Lehrkraft-Hilfen (Neues Quiz, großer QR-Code, Spiel-Demo)
- **Alle Fragen löschen:** Auf der „Neues Quiz“-Seite räumt der Knopf die ganze Fragenliste und den Titel auf einmal ab (mit Rückfrage). Der Link „← Neues Quiz“ in der Raumansicht beginnt außerdem mit einem leeren Entwurf.
- **QR-Code vergrößern:** In der Raumansicht auf den QR-Code tippen: Vollbild mit großem Code und Raumcode (Tippen oder Esc schließt). Gedacht für Beamer und hintere Reihen.
- **Spiel ausprobieren:** „Spiel ausprobieren“ (auf der Entwurfsseite und im Warteraum) öffnet das Hürdenritt-Spiel im Vollbild. Reine Demo: kein Raum, keine Bestenliste, es wird nichts gesendet. Alles clientseitig in `quiz.js`, kein SQL.

## Warteraum-Spiel „Hürdenritt“
Im Warteraum sehen Schüler/innen unter dem Wartetext ein kleines Pixel-Spiel (`game.js`): Das Pferd galoppiert von selbst, Tippen aufs Bild (oder Leertaste) lässt es springen, **Halten springt höher**. Über Hürden, Büsche und Kisten springen, Münzen (+10) und Herzen sammeln, 3 Herzen. Das **Tempo steigt mit der Zeit** (wie bei Unicorn Dash). Alle 26 Sekunden wechselt die Welt: **Steppe → Stadt → Cyberpunk-Stadt → Weltraum**, danach wieder von vorn (je eigener Himmel, Hintergrund, Boden und Hindernis-Look). Punkte = Münzen × 10 + Meter. Pferdefarbe wählbar (5 Farben, wird auf dem Gerät gemerkt). **Keine Töne** (Beschluss yb 20.11.2026), nur kurze Vibration bei einem Treffer.

**Spielregeln (Stand Gegner/Ebenen):** Tippen = springen, Halten = höher; je schneller das Pferd, desto kräftiger und weiter der Sprung (mit kurzem Schweben am höchsten Punkt). Münzen werden vom Pferd leicht angezogen (Magnet) und liegen in Sprungbögen. Gegner: Pilz/Roboter/Käfer/Alien und Drohnen/Bienen/UFOs kann man **von oben anspringen** (+25 Punkte, Absprung nach oben), Stachelwesen (Igel, Stachelkugel, Mine, Asteroid) nicht. Abgründe muss man überspringen (sonst −1 Herz, danach liegt ein Brett drüber). Plattformen sind einseitig (von unten durchlaufbar, von oben darauf landen) und haben zwei Ebenen. Alles nur in `game.js`, keine Datenbank, keine Töne.

**Spiel-Paket (28.11.2026): Level, neue Gegner, Rutschen, Power-ups, Goldrausch.**
- **Steuerung:** rechts tippen/halten = springen, **links tippen (linkes Drittel) = rutschen**, in der Luft = schnell nach unten. Nach unten wischen, Pfeil runter oder S geht auch. Die ersten Sekunden zeigt das Bild die beiden Zonen.
- **Level:** Nach 26 Sekunden kommt eine **Zielflagge**. Wer durchreitet, kommt ins nächste Level und die nächste Welt (+50 Punkte, +1 Herz). Oben links: Level, Tempo und ein Balken bis zur Flagge. Neue Hindernisse kommen mit dem Level.
- **Neu:** hängender Balken (nur drunter durchrutschen), Sprungfeder (sehr hoher Sprung), bewegte Plattformen (ab L2), rollendes Fass (ab L2, nur drüberspringen), Frosch und Sturzvogel (ab L3, beide kann man anspringen).
- **Power-ups** in Blasen: Magnet (9 s, zieht Münzen an), Schild (fängt einen Treffer oder Absturz ab), Stern (6 s unverwundbar, Gegner fliegen weg), Doppelsprung (12 s). Aktive Power-ups oben rechts mit Restzeit.
- **Missionen:** drei zufällige Aufgaben pro Runde (z. B. „3× unter Balken rutschen“), jede +100. Der Fortschritt steht unter dem Spiel.
- **Goldrausch:** 7 Sekunden Münzregen, zufällig etwa jede Minute. Die Lehrkraft kann ihn im Warteraum mit **„💰 Goldrausch für alle“** für alle Handys auslösen (danach 30 Sekunden Pause). Datenbank: Spalte `quiz_rooms.game_event` (Zähler), Funktion `quiz_game_rush(code, secret)` (nur im Warteraum), `quiz_player_state` liefert `ge`. Das Handy reagiert nur, wenn der Zähler steigt. Keine personenbezogenen Daten.
- Test und Screenshots: `node docs/tools/spiel-screenshots.js` (prüft Rutschen, Balken, Feder, Zielflagge, Schild, Doppelsprung und den Goldrausch von der Lehrkraft zum Handy).

**Beamer-Bestenliste:** Nach jeder Runde sendet das Handy nur den Punktestand (Zahl) an den Raum (`quiz_game_score`, nur im Warteraum, nur mit eigenem Token, höchstens 99999, es zählt der beste Wert). Die Lehrkraft sieht im Warteraum die Top 5 „Hürdenritt · Bestenliste“ (in der Beamer-Ansicht groß, mit „Namen ausblenden“ als SuS 1, 2 …). Datenbank: Spalte `quiz_players.game_best`, Funktion `quiz_game_score`, `quiz_teacher_state` liefert `gs` je Person. Keine neuen personenbezogenen Daten, der Spielstand verschwindet mit dem Raum (24 Stunden). Rekord und Pferdefarbe bleiben nur lokal. Die Pferde-Pixel kommen aus `race.js` (`QuizRace.pix`).


## Demo-Quiz
Im Setup gibt es den Knopf „Demo-Quiz laden: Deutsche Geschichte (10 Fragen)“ zum schnellen Ausprobieren (`DEMO_QS` in `quiz.js`).

## Antworten mischen und Lernzettel
- Beim Anlegen des Raums gibt es das Häkchen „Antworten mischen“ (Standard an, wird gemerkt). Die Reihenfolge der Antworten wird beim Öffnen des Raums gemischt, damit die richtige nicht immer an derselben Stelle steht. Ausnahmen: Richtig/Falsch, Kurzantworten, Fragen mit „alle/keine …“ und reine Zahlen (aufsteigend sortiert).
- Am Ende sehen Schüler/innen „Das solltest du wiederholen“: falsch beantwortete Fragen mit richtiger Antwort, Erklärung und Thema (bei Kursfragen mit Link in den Lernraum) und den Knopf „Lernzettel speichern“ (Teilen-Menü oder .txt-Datei). Der Lernzettel entsteht nur im Browser der Person, es wird nichts gespeichert.
- Fragen können optional `s` (Thema) und `u` (https-Link) haben, im JSON auch `thema`.

## Nachdenk-Musik (optional)
`music.js` erzeugt ruhige, sphärische Klangflächen live im Browser (Web Audio, keine Audiodateien, keine Fremdlizenz). Die Lehrkraft schaltet sie mit „♪ Musik: an/aus“ zu, Standard ist aus und nach jedem Neuladen wieder aus. Sie läuft nur auf dem Gerät der Lehrkraft (z. B. am Beamer), Schüler-Handys bleiben stumm. Im Warteraum-Spiel bleibt es bei „keine Töne“.

## Fragetyp Zahl (Rechenaufgaben, 25.11.2026)
- **SQL muss in Supabase ausgeführt werden** (`supabase/quiz.sql`, wiederholbar): `quiz_num_cands` (getippten Text in Zahl umwandeln) und `quiz_num_ok` (Lösung mit Abweichung prüfen); `quiz_answer` nutzt sie für `t = 'num'`. Beide Hilfsfunktionen sind für den öffentlichen Schlüssel gesperrt.
- Format: `{ t: "num", q, a: 1250.5, d: 0.01, dp: false, unit: "€", e }`. `a` und `e` verlassen den Server erst nach der Antwort, `d`, `dp` und `unit` sieht das Handy (die Einheit steht neben dem Eingabefeld).
- Eingabe am Handy mit `inputmode="decimal"`. Erlaubt: Komma oder Punkt, Tausenderpunkte (`1.250,50`, `1,250.50`), Leerzeichen und Einheit (`95,20 €`), Minus. `1.250` ist mehrdeutig, dann zählen 1250 und 1,25. Text ohne Zahl wird schon im Browser abgefangen (kein Versuch verbraucht). Gleiche Regeln in `numCands` (`quiz.js`) und `quiz_num_cands` (SQL), bei Änderungen beide pflegen.
- Anlegen: „Eigene Frage schreiben“ → „Zahl (Rechenaufgabe)“; CSV mit `ZAHL` in Spalte „Richtig“ (B = Zahl, C = Einheit, D = Abweichung `0,01` oder `1 %`); JSON mit `"t": "zahl"` bzw. `"num"`, `a`, `einheit`/`unit`, `toleranz`/`tol` (oder `d` + `dp`). Beispiel per Knopf „Beispiel laden: Rechenaufgaben“ (`NUM_QS` in `quiz.js`). Zahlenfragen werden beim Mischen nicht verändert.
