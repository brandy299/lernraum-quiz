# Lernraum Live-Quiz – Hinweise für Claude-Agenten

Dieses Repo ist das **Live-Quiz** von Yannik Brand (Lehrer, Berufskolleg NRW): https://quiz.yannikbrand.eu
Eine Lehrkraft legt einen Raum an (Fragen aus Lernraum-Kursen, eigene, Datei-Upload oder KI-Prompt), Schüler/innen
treten per 5-stelligem Code oder QR-Code mit Spitznamen bei, beantworten Fragen am Handy, die Lehrkraft sieht den
Fortschritt als **Pferderennen** (auch am Beamer). Es gibt Warteraum, Start durch die Lehrkraft, Aufholbonus und eine
Zuschauer-Ansicht für Fertige.

Hosting: GitHub Pages aus Branch `main` (eigene Domain über `CNAME`). Kein Build-Schritt. Backend: Supabase (nur
Funktionen, siehe `supabase/quiz.sql`). **Nur dieses Repo gehört zu deinem Auftrag.** Das Lernraum-Repo
(lernen.yannikbrand.eu) ist ein anderes Projekt und nicht Teil davon.

## Pflichtlektüre
`docs/LIVE-QUIZ.md` (Ablauf, Datenschutz, Wartung) und `README.md` (Dateikarte).

## Dateikarte
- `index.html`, `quiz.js` (Router, Schüler-/Lehreransicht, Demo-Backend), `race.js` (Rennbahn: Pferde, Zuschauer, Effekte), `game.js` (Warteraum-Spiel „Hürdenritt“), `music.js` (optionale Nachdenk-Musik der Lehrkraft), `quiz.css`, `config.js` (Supabase-URL + öffentlicher Key)
- `assets/` – Kopie von Design, Schriften und QR-Bibliothek aus dem Lernraum. Nur ändern, wenn das Quiz es wirklich braucht.
- `supabase/quiz.sql` – komplette Datenbank (Tabellen, Funktionen, Rechte), **idempotent**: kann jederzeit erneut ausgeführt werden.
- `docs/` – Dokumentation und Anleitungen.

## Regeln
- Sprache Deutsch. Zielgruppe Schüler/innen, fast nur Handy: Tippflächen ≥ 44 px, kein seitliches Scrollen ab 320 px, am Beamer lesbar.
- Alles automatisch prüfbar, keine Selbstkorrektur. Datenschutz: nur Spitznamen, keine echten Namen, Räume nach 24 h gelöscht. Keine neuen personenbezogenen Daten ohne Rücksprache mit Yannik.
- **Nie** in das Repo schreiben: Lehrer-PIN, Supabase-`service_role`-Key, Passwörter, Zugangsdaten. In `config.js` darf nur der öffentliche (anon/publishable) Key stehen.
- Arbeiten über Branch + Pull Request nach `main`, nie direkt auf `main`. Der Kollege darf selbst mergen, wenn der Check „check“ grün ist, und meldet Yannik kurz, was live gegangen ist. Ausnahme: Braucht der PR SQL, wird **erst gemergt, nachdem Yannik das SQL eingespielt hat**. Fehler werden per Revert-Pull-Request zurückgenommen, nie per Force-Push.
- Änderungen an `quiz.js`, `race.js`, `game.js`, `quiz.css` oder `config.js`: Versionsnummer `?v=…` in `index.html` erhöhen und bei CSS-Änderungen `--quiz-css` in `quiz.css` sowie `CSS_NEED` am Anfang von `quiz.js` gemeinsam erhöhen (Cache-Selbstheilung).
- Änderungen an der Datenbank: nur in `supabase/quiz.sql` (idempotent), im PR deutlich vermerken „SQL muss in Supabase ausgeführt werden“. **Du spielst SQL nicht selbst ein**, das macht Yannik, und der PR wird erst danach gemergt.
- Funktion wirkt neu? Zuerst im Demo-Modus testen (siehe README), dann mit Playwright einen Durchlauf mit mehreren Personen.
