# Mitarbeiten am Live-Quiz mit Claude

Du arbeitest mit Yannik am **Live-Quiz**: https://quiz.yannikbrand.eu
Lehrkräfte legen einen Raum an, Schüler/innen treten am Handy mit Code oder QR-Code bei und beantworten Fragen. Die Lehrkraft sieht den Fortschritt als
**Pferderennen** (auch am Beamer), mit Warteraum, Start-Knopf, Aufholbonus und Zuschauer-Ansicht.

Du hast Zugriff **nur auf dieses eine Repo** (`lernraum-quiz`), nicht auf Yanniks andere Projekte und nicht auf die Datenbank.
Alles läuft über Pull Requests. Du darfst selbst mergen, wenn der Check „check“ grün ist, und sagst Yannik kurz Bescheid. Geht etwas schief, nimmt ein Revert-Pull-Request die Änderung zurück.

---

## 1. Einmal einrichten (ca. 15 Minuten)

1. **GitHub-Konto** (github.com), falls du noch keins hast. Dieselbe E-Mail-Adresse wie bei der Einladung benutzen, oder Yannik deinen GitHub-Namen geben.
2. **Einladung annehmen:** Yannik hat dich per E-Mail eingeladen. In der Mail auf **„View invitation“ → „Accept invitation“** klicken. Danach siehst du https://github.com/brandy299/lernraum-quiz.
3. **Claude mit GitHub verbinden** (mit deinem eigenen Claude-Abo):
   - https://claude.ai/code öffnen und anmelden.
   - GitHub verbinden, wenn Claude danach fragt, und die **Claude GitHub App** erlauben. Die Freigabe für das Repo `lernraum-quiz` liegt bei Yannik (er hat die App auf seinem Konto dafür freigegeben). Taucht das Repo bei dir nicht auf, sage ihm Bescheid.
   - Repo `brandy299/lernraum-quiz` wählen und eine neue Sitzung starten.
   - Alternativ geht auch **Claude Code** auf deinem Rechner (https://code.claude.com/docs): Repo klonen, im Ordner `claude` starten.
4. Claude liest beim Start automatisch die Datei `CLAUDE.md` im Repo. Dort stehen alle Regeln, du musst sie nicht auswendig kennen.

## 2. Erste Nachricht an Claude (zum Kopieren)

Wenn du eine neue Sitzung startest, kopiere diesen Text als erste Nachricht und ersetze den letzten Satz durch deine Aufgabe:

```
Du arbeitest am Live-Quiz von Yannik Brand (Repo lernraum-quiz, Seite quiz.yannikbrand.eu).
Lies zuerst CLAUDE.md, README.md und docs/LIVE-QUIZ.md. Fasse mir in fünf Sätzen zusammen, wie das Quiz aufgebaut ist und welche Regeln für dich gelten.

Regeln für diese Sitzung:
- Arbeite nur in diesem Repo, immer auf einem eigenen Branch mit Pull Request, nie direkt auf main.
- Zielgruppe sind Schüler/innen am Handy und die Lehrkraft am Beamer: Tippflächen mindestens 44 px, kein seitliches Scrollen ab 320 px, Deutsch.
- Teste jede Änderung im Demo-Modus (leere config.js oder Playwright mit gesperrter config.js) mit mehreren Personen, bevor du den Pull Request öffnest. Prüfe auch die Konsole auf Fehler.
- Ändere ich quiz.js, race.js, game.js, quiz.css oder config.js, erhöhe die Versionsnummer ?v=... in index.html und bei CSS-Änderungen --quiz-css in quiz.css und CSS_NEED in quiz.js gemeinsam.
- Datenbankänderungen nur in supabase/quiz.sql (idempotent). Schreibe in die Pull-Request-Beschreibung deutlich "SQL muss in Supabase ausgeführt werden". Spiele nichts selbst ein, das macht Yannik.
- Schreibe nie Geheimnisse ins Repo: keine Lehrer-PIN, keine Passwörter, keinen service_role-Schlüssel. Nur der öffentliche Schlüssel steht in config.js.
- Keine echten Namen oder neuen personenbezogenen Daten, nur Spitznamen.
- Wenn du dir bei etwas nicht sicher bist, frage mich, bevor du es baust.

Meine Aufgabe: <hier beschreiben, was du ändern oder bauen willst>
```

## 3. So arbeitest du

1. Beschreibe Claude auf Deutsch, was du willst. Beispiele:
   - „Bei den letzten Metern sollen die Pferde langsamer werden und schnauben.“
   - „Neuer Aufgabentyp ‚Zuordnen‘ im Quiz.“
   - „Lehreransicht auf dem Tablet übersichtlicher machen.“
   - „Nach dem Quiz eine Auswertung als Tabelle zum Download.“
2. Claude arbeitet auf einem **eigenen Branch**, testet im Demo-Modus und öffnet einen **Pull Request**. Du bekommst den Link und eine Zusammenfassung.
3. Schau dir das Ergebnis an. Sagt dir etwas nicht zu, schreibe es Claude einfach, es arbeitet im selben Pull Request weiter.
4. Wenn es passt und der Check „check“ grün ist, **mergst du den Pull Request selbst** und sagst Yannik kurz Bescheid. Nach wenigen Minuten ist es auf quiz.yannikbrand.eu live. **Ausnahme:** Braucht der Pull Request SQL, wartest du, bis Yannik es in Supabase eingespielt hat, und mergst erst dann.
5. Ist etwas kaputt gegangen: auf GitHub im gemergten Pull Request „Revert“ wählen und diesen Revert-PR mergen (oder Claude bitten). Nie Force-Push.

Ein Pull Request sollte **eine** klare Sache enthalten. Mehrere Ideen besser in mehreren Pull Requests.

## 4. Regeln, die immer gelten

- **Nie direkt auf `main`.** Immer Branch + Pull Request (auch wenn GitHub es technisch zuließe).
- **Keine Geheimnisse ins Repo:** keine Lehrer-PIN, keine Passwörter, keinen Supabase-`service_role`-Schlüssel. Nur der öffentliche Schlüssel in `config.js` ist erlaubt.
- **Datenbank:** Du hast keinen Zugang und brauchst keinen. Änderungen stehen in `supabase/quiz.sql`; Yannik spielt sie ein, **bevor** gemergt wird. Im Pull Request muss dazu stehen, dass es nötig ist.
- **Datenschutz:** nur Spitznamen, keine echten Namen, Räume werden nach 24 Stunden gelöscht. Neue Daten nur nach Rücksprache.
- **Handy zuerst:** Prüfe in schmaler Ansicht (~390 px) und am Beamer.
- **Nur dieses Repo:** Das Lernraum-Repo von Yannik gehört nicht dazu. Das Design in `assets/` ist eine Kopie und nur nach Absprache zu ändern.

## 5. Ausprobieren ohne Server

Im Repo-Ordner `python3 -m http.server 8080` starten und http://localhost:8080/ öffnen. Ist `config.js` leer (`window.QUIZ_CONFIG = {}`), läuft das Quiz im Demo-Modus nur im eigenen Browser: Lehrkraft in einem Tab, Schüler/innen in weiteren Tabs, ohne Server und ohne Datenbank.
Arbeitest du mit Claude im Web, kann Claude das für dich testen und dir Screenshots schicken.

## 6. Wenn etwas hakt

- **Der Check „check“ am Pull Request ist rot:** Claude bitten, den Fehler zu beheben und neu zu pushen.
- **Die Seite sieht nach einem Update alt oder kaputt aus:** Seite neu laden. Bei Änderungen an CSS/JS muss die Versionsnummer in `index.html` erhöht sein; `CLAUDE.md` erinnert Claude daran.
- **Du siehst das Repo nicht:** Einladung per Mail noch nicht angenommen, oder du bist mit einem anderen GitHub-Konto angemeldet.
- **Alles andere:** Yannik fragen.
