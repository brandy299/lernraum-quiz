# Beipackzettel: Live-Quiz

Stand: 28.11.2026 · Adresse: https://quiz.yannikbrand.eu · Für Lehrkräfte und Schüler/innen
(Die Bilder zeigen den Demo-Modus mit erfundenen Spitznamen. Im echten Betrieb sieht es genauso aus.)

**Kurz gesagt:** Du legst einen Raum an, die Klasse tritt mit einem Code oder QR-Code bei, alle beantworten Fragen am Handy, und alle sehen live, wer vorne liegt. Am Ende gibt es eine Siegerehrung. Es werden nur Spitznamen gespeichert, keine echten Namen. Nach 24 Stunden ist alles gelöscht.

---

## Für die Lehrkraft

### 1. Quiz zusammenstellen
Auf der Seite „Neues Quiz“ gibst du einen Titel ein und wählst Fragen aus: aus einem Lernraum-Kurs, eigene Fragen, Datei (CSV/JSON), KI-Anleitung oder ein fertiges Demo-Quiz.

![Neues Quiz](img/01-neues-quiz.jpg)

- **Alle Fragen löschen** leert die ganze Liste und den Titel (mit Rückfrage).
- **Spiel ausprobieren (Demo)** zeigt dir das Warte-Spiel, ohne dass ein Raum nötig ist. Es wird nichts gespeichert oder gesendet.
- **Antworten mischen** sorgt dafür, dass die richtige Antwort nicht immer an derselben Stelle steht.

![Spiel-Demo](img/02-spiel-demo.jpg)

### 1a. Rechenaufgaben mit Zahleneingabe (neu)
Für Kaufmännisches Rechnen, Lagerkennzahlen oder Ladungssicherung: Unter „Eigene Frage schreiben“ die Art **Zahl (Rechenaufgabe)** wählen.

![Zahlenfrage anlegen](img/14-zahl-editor.jpg)

- **Richtige Zahl:** z. B. `1.250,49` oder `1250.49`.
- **Einheit** (optional): z. B. €, daN, %, kg. Sie steht auf dem Handy neben dem Eingabefeld.
- **Erlaubte Abweichung:** damit Rundungsunterschiede als richtig zählen. Entweder **± absolut** (z. B. 0,01 €) oder **± Prozent** (z. B. 1 % der Lösung). 0 heißt: genau diese Zahl. Unter den Feldern steht sofort, welcher Bereich als richtig zählt.
- **Beispiel laden: Rechenaufgaben (6 Zahlenfragen)** lädt ein fertiges Beispiel zum Ausprobieren (Bruttopreis, Rabatt, Skonto, Prozent, Lagerumschlag, Reibungskraft).
- **Per Datei oder KI:** In der CSV-Tabelle in der Spalte „Richtig“ `ZAHL` eintragen, Spalte B = richtige Zahl, C = Einheit, D = Abweichung (`0,01` oder `1 %`). Die Vorlage und der KI-Prompt enthalten ein Beispiel.
- In der Fragenliste steht bei jeder Zahlenfrage die Lösung und die Abweichung (z. B. „= 95,20 € · ± 0,01 €“), damit du sie vor dem Start prüfen kannst.
- Im Rennen zählt eine richtige Zahl genau wie jede andere richtige Antwort.

### 2. Raum öffnen und Warteraum
Mit „Raum öffnen“ bekommst du einen 5-stelligen Code und einen QR-Code. Die Klasse tritt bei, spielt im Warteraum das Hürdenritt-Spiel und du siehst, wer da ist.

![Warteraum der Lehrkraft](img/05-lehrer-warteraum.jpg)

- **QR-Code antippen** zeigt ihn im Vollbild, gut für den Beamer und die hintere Reihe. Tippen oder Esc schließt.

![QR-Code groß](img/06-qr-gross.jpg)

- **Quiz auf Zeit:** Wähle ein Zeitlimit (3, 5, 10, 15, 20 oder 30 Minuten). Die Uhr startet mit „Quiz starten“ und läuft für alle gleich. Danach können keine Antworten mehr abgegeben werden.
- **Aufholbonus:** Wer weit hinten liegt, bekommt für richtige Antworten doppelte Punkte (ab 4 Personen). Siehe „Wie wird gewertet?“ unten.
- **Namen ausblenden** zeigt „SuS 1, 2 …“ statt der Spitznamen (für den Beamer).
- **Musik:** Ruhige Hintergrundmusik, nur auf deinem Gerät, Standard aus.
- **💰 Goldrausch für alle (neu):** Im Warte-Spiel regnet es bei allen sieben Sekunden lang Münzen. Gut, wenn die Klasse noch auf Nachzügler wartet. Danach hat der Knopf 30 Sekunden Pause.

![Goldrausch-Knopf im Warteraum](img/22-lehrer-goldrausch.jpg)

### 3. Quiz starten und beobachten
„Quiz starten“ schickt alle los (Countdown 3-2-1). Du siehst die Rennbahn: Jede richtige Antwort bringt das Pferd ein Stück näher ans Ziel. Mit **Beamer-Ansicht** wird alles groß und ohne Bedienknöpfe gezeigt.

![Rennbahn am Beamer](img/09-lehrer-rennen-beamer.jpg)

### 4. Siegerehrung
Der Knopf **🏆 Siegerehrung** (wird rosa, sobald alle fertig sind, die Zeit abgelaufen ist oder du beendet hast) startet die Show: Platz 3, Platz 2, dann der Sieger mit Pferd, Krone, Namen und Konfetti. Ohne Ton. Ein Tipp auf den Bildschirm springt zum Ergebnis, „Nochmal abspielen“ wiederholt die Show.

![Siegerehrung am Beamer](img/13-siegerehrung-beamer-sieger.jpg)

### 5. Beenden und auswerten
„Quiz beenden“ stoppt alles. **Ergebnis exportieren** speichert eine Tabelle (CSV für Excel) mit Platz, Punkten, Bonus, der Zeit bis zur letzten richtigen Antwort und jeder Einzelantwort. „Raum löschen“ entfernt den Raum sofort.

---

## Für Schüler/innen (Handy)

1. Seite öffnen, Code eingeben oder QR-Code scannen, **Spitznamen** wählen (nicht den echten Namen).
2. Im Warteraum das Spiel spielen (siehe „Das Warte-Spiel“ unten).

![Beitreten](img/03-beitreten.jpg) ![Warteraum Handy](img/04-schueler-warteraum.jpg)

3. Wenn es losgeht, beantwortest du die Fragen. **Oben siehst du immer deinen Platz, deine Punkte und (bei Zeitlimit) die Restzeit.**

![Frage mit Platz und Punkten](img/07-schueler-frage.jpg)

   **Bei Rechenaufgaben** tippst du die Zahl ein, es öffnet sich die Zahlentastatur. Komma oder Punkt sind beide erlaubt, auch mit Tausenderpunkt (`1.250,50`). Die Einheit musst du nicht mittippen. Tippst du keine Zahl ein (z. B. Buchstaben), kommt ein Hinweis und dein Versuch ist **nicht** verbraucht. Bei falscher Zahl siehst du die richtige Lösung und den Rechenweg.

![Zahl eingeben](img/15-zahl-handy-eingabe.jpg) ![Falsche Zahl](img/16-zahl-handy-falsch.jpg) ![Keine Zahl](img/17-zahl-handy-keine-zahl.jpg)

4. Bist du fertig, siehst du das Rennen der anderen live.

![Fertig](img/08-schueler-fertig.jpg)

5. Am Ende kommt die Siegerehrung auf dein Handy, danach dein Platz, deine Punkte und der **Lernzettel** mit allem, was du wiederholen solltest. Speichere ihn, der Raum wird nach 24 Stunden gelöscht.

![Siegerehrung Handy](img/10-siegerehrung-handy.jpg) ![Ende](img/11-schueler-ende.jpg)

---

## Das Warte-Spiel „Hürdenritt“ (neu: Level, Gegner, Power-ups)

![Spiel-Start](img/19-spiel-start.jpg)

- **Steuerung:** Rechts aufs Bild tippen = springen (halten = höher). **Links tippen = rutschen.** In der Luft bringt dich links tippen schnell nach unten. Nach unten wischen geht auch. Am Computer: Leertaste und Pfeil runter.
- Am Anfang zeigt das Spiel die beiden Tipp-Zonen:

![Tipp-Zonen](img/20-spiel-zonen.jpg)

- **Level:** Reite bis zur **Zielflagge**. Dann kommt das nächste Level in einer neuen Welt (Steppe, Stadt, Cyberpunk, Weltraum), dazu +50 Punkte und ein Herz. Oben links stehen Level und ein Balken bis zur Flagge.
- **Hindernisse und Gegner:**
  - **Hängender Balken** (mit Pfeil ↓): nur drunter durchrutschen.
  - **Sprungfeder:** draufreiten, dann fliegt das Pferd sehr hoch, oben hängen Münzen.
  - **Rollendes Fass:** drüberspringen, nicht draufspringen.
  - **Frosch** hüpft, **Sturzvogel** stürzt herab: beide kann man von oben anspringen (+25).
  - Dazu bewegte Plattformen, Kisten, Zäune, Abgründe und die bekannten Gegner.
- **Power-ups** (in Blasen): **Magnet** zieht Münzen an, **Schild** fängt einen Treffer ab, **Stern** macht kurz unverwundbar, **Doppelsprung** erlaubt einen zweiten Sprung in der Luft. Oben rechts siehst du, wie lange sie noch halten.
- **Missionen:** Unter dem Spiel stehen drei Aufgaben, z. B. „3× unter Balken rutschen“. Jede geschaffte Mission gibt +100.
- **Goldrausch:** Ab und zu regnet es sieben Sekunden lang Münzen. Die Lehrkraft kann ihn auch für alle auslösen.
- Immer noch **ohne Ton**.

![Level 1 Steppe](img/21-spiel-welt-1.jpg) ![Level 2 Stadt](img/21-spiel-welt-2.jpg)
![Level 3 Cyberpunk](img/21-spiel-welt-3.jpg) ![Level 4 Weltraum](img/21-spiel-welt-4.jpg)
![Goldrausch](img/23-spiel-goldrausch.jpg)

---

## Wie wird gewertet?

- **Punkte = richtige Antworten (+ Bonuspunkte, wenn der Aufholbonus an ist).** Falsche Antworten geben keine Minuspunkte.
- **Gleichstand:** Haben zwei Personen gleich viele Punkte, liegt vorn, wer seine letzte richtige Antwort früher abgegeben hat (gemessen ab Start des Quiz). Bei Gleichstand sieht man die Zeit auch in der Siegerehrung.
- **Warum kann jemand 33 von 30 Punkten haben?** Das kommt vom **Aufholbonus**: Wer weit hinten liegt, bekommt für eine richtige Antwort 2 Punkte statt 1. Mit 30 Fragen und 3 Bonus-Antworten sind das 33 Punkte. Das war früher in der Rennbahn missverständlich („33/30“). Jetzt steht bei eingeschaltetem Bonus „Pkt“ statt „/30“, und auf dem Handy steht „30 richtig + 3 Bonuspunkte = 33 Punkte“. Wer das nicht möchte, schaltet den Aufholbonus aus.

## Häufige Fragen

- **Kann ich nach Ablauf der Zeit noch antworten?** Nein. Die Antwort wird abgelehnt, das Handy zeigt das Ende mit Platz und Punkten.
- **Ein Schüler hat die Seite zugemacht.** Einfach wieder öffnen, die Antworten sind gespeichert (auf demselben Handy).
- **Kein Ton?** Stimmt. Das Spiel und die Siegerehrung sind absichtlich stumm. Nur die Lehrkraft kann Hintergrundmusik zuschalten.
- **Datenschutz:** Nur Spitznamen, keine Konten, nach 24 Stunden gelöscht.

## Für die Technik (Wartung)

- **Neu (28.11.2026): Spiel-Paket. SQL muss in Supabase ausgeführt werden** (`supabase/quiz.sql`, wiederholbar). Neue Spalte `quiz_rooms.game_event` und Funktion `quiz_game_rush` für „Goldrausch für alle“. Ohne das SQL läuft alles, nur der Goldrausch-Knopf meldet einen Fehler. Test und Screenshots: `node docs/tools/spiel-screenshots.js`.
- **Neu (25.11.2026): Fragetyp Zahl. SQL muss in Supabase ausgeführt werden** (`supabase/quiz.sql`, wiederholbar). Neue Hilfsfunktionen `quiz_num_cands` und `quiz_num_ok`, `quiz_answer` bewertet Fragen mit `t: "num"`. Ohne das SQL würden Zahlenantworten auf dem Server meist als falsch gewertet. Datenformat: `{ "t": "num", "q": "…", "a": 1250.5, "d": 0.01, "dp": false, "unit": "€", "e": "…" }` (`d` = erlaubte Abweichung, `dp: true` = Abweichung in Prozent). Keine neuen personenbezogenen Daten.

![Rennen mit Rechenaufgaben am Beamer](img/18-zahl-lehrer-rennen.jpg)

- **Neu in dieser Version: SQL muss einmal ausgeführt werden.** Die ganze Datei `supabase/quiz.sql` im Supabase-SQL-Editor ausführen (sie ist wiederholbar). Sie ergänzt Zeitlimit (`time_limit`, `started_at`, `quiz_set_time`) und die Schnelligkeit (`lt`) in den Abfragen. Ohne dieses SQL laufen Quiz und Spiel weiter, nur das Zeitlimit und die Schnelligkeit bei Gleichstand fehlen.
- Dateien: `quiz.js` (Ansichten, Demo-Backend), `race.js` (Rennbahn), `ceremony.js` (Siegerehrung), `game.js` (Spiel), `quiz.css`.
- Neue Screenshots für dieses Dokument entstehen mit Playwright im Demo-Modus (siehe `docs/LIVE-QUIZ.md`).

> **Projektregel:** Zu jeder Änderung am Live-Quiz gehört, dass dieser Beipackzettel mit aktuellen Screenshots mitgepflegt wird.
