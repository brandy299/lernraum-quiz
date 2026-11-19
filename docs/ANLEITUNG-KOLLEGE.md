# Mitarbeiten am Live-Quiz mit Claude

Willkommen! Du arbeitest mit Yannik am **Live-Quiz** (https://quiz.yannikbrand.eu). Du hast Zugriff nur auf dieses eine Repo,
nicht auf seine anderen Projekte. Alles läuft über Pull Requests, **Yannik prüft und veröffentlicht**. Du kannst nichts kaputt machen,
was nicht noch geprüft wird.

## Einmalig einrichten (ca. 15 Minuten)
1. **GitHub-Konto** anlegen (github.com), falls noch nicht vorhanden. Gib Yannik deinen GitHub-Benutzernamen.
2. Yannik lädt dich ein. Du bekommst eine E-Mail von GitHub, dort **„Accept invitation“** klicken. Danach siehst du das Repo `lernraum-quiz`.
3. **Claude mit GitHub verbinden** (du brauchst dein eigenes Claude-Abo):
   - Gehe zu https://claude.ai/code und melde dich an.
   - Verbinde dein GitHub-Konto, wenn du dazu aufgefordert wirst, und installiere die **Claude GitHub App** für das Repo `lernraum-quiz` (nur dieses Repo auswählen).
   - Wähle als Repo `lernraum-quiz` und starte eine neue Sitzung.
   - Alternativ geht auch **Claude Code** auf deinem Rechner (Installation: https://code.claude.com/docs). Dann das Repo klonen und im Ordner `claude` starten.
4. Claude liest automatisch die Datei `CLAUDE.md` im Repo. Dort stehen alle Regeln. Du musst sie nicht auswendig kennen.

## So arbeitest du
1. Beschreibe Claude auf Deutsch, was du willst, zum Beispiel:
   - „Die Rennbahn soll bei den letzten drei Metern langsamer werden und die Pferde sollen schnauben.“
   - „Füge einen Aufgabentyp ‚Zuordnen‘ zum Quiz hinzu.“
   - „Mach die Lehreransicht auf dem Tablet übersichtlicher.“
2. Claude arbeitet auf einem **eigenen Branch**, testet im Demo-Modus und öffnet einen **Pull Request**. Du bekommst den Link.
3. Schau dir das Ergebnis an (Claude kann Screenshots oder eine Beschreibung geben). Wenn etwas nicht passt, schreibe es Claude einfach.
4. Sage Yannik Bescheid. **Er prüft und merged den Pull Request.** Danach ist es nach wenigen Minuten live.

## Regeln, die immer gelten
- **Nie direkt auf `main` arbeiten.** Immer Branch + Pull Request. (GitHub verhindert es sowieso.)
- **Keine Geheimnisse ins Repo:** keine Lehrer-PIN, keine Passwörter, keinen Supabase-„service_role“-Schlüssel. Nur der öffentliche Schlüssel in `config.js` ist erlaubt.
- **Datenbank (Supabase):** Du hast keinen Zugang und brauchst keinen. Änderungen stehen in `supabase/quiz.sql`. Schreibe im Pull Request deutlich dazu, dass die Datei in Supabase neu ausgeführt werden muss. **Yannik spielt sie ein**, bevor er merged.
- **Datenschutz:** Es gibt nur Spitznamen. Keine echten Namen, keine neuen personenbezogenen Daten ohne Rücksprache.
- **Handy zuerst:** Schüler/innen nutzen fast nur das Handy. Prüfe Änderungen in schmaler Ansicht (~390 px) und am Beamer.

## Ausprobieren ohne Server
Im Repo-Ordner `python3 -m http.server 8080` starten und http://localhost:8080/ öffnen. Mit leerer `config.js` läuft das Quiz im Demo-Modus
(Lehrkraft in einem Tab, Schüler/innen in weiteren Tabs). Wenn du mit Claude im Web arbeitest, kann Claude das für dich testen.

## Wenn etwas hakt
- Der Check „check“ am Pull Request ist rot: Claude bitten, den Fehler zu beheben.
- Die Seite sieht nach einem Update seltsam aus (alter Stand im Browser): Seite neu laden, notfalls Cache leeren. Bei Änderungen an CSS/JS muss die Versionsnummer in `index.html` erhöht werden (Claude weiß das aus `CLAUDE.md`).
- Alles andere: Yannik fragen.
