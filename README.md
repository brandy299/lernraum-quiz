# Lernraum Live-Quiz

Live-Quiz für den Unterricht: Raumcode, Warteraum, Fragen am Handy, Pferderennen für die Lehrkraft (auch am Beamer).
Adresse: https://quiz.yannikbrand.eu

Mehr: [`docs/LIVE-QUIZ.md`](docs/LIVE-QUIZ.md) · Mitarbeiten: [`docs/ANLEITUNG-KOLLEGE.md`](docs/ANLEITUNG-KOLLEGE.md) · Einrichtung durch den Inhaber: [`docs/EINRICHTUNG.md`](docs/EINRICHTUNG.md)

## Lokal ausprobieren
```
python3 -m http.server 8080
```
Dann http://localhost:8080/ öffnen. Ist `config.js` leer (`window.QUIZ_CONFIG = {}`), läuft das Quiz im **Demo-Modus**
nur im eigenen Browser (Lehrkraft in einem Tab, Schüler/innen in weiteren Tabs, kein Server nötig). Handybreite ~390 px im Browser einstellen.

## Dateien
| Datei | Inhalt |
|---|---|
| `index.html` | Einstieg, lädt alles |
| `quiz.js` | Router, Schüler-/Lehreransicht, Fragen-Editor, KI-Anleitung, Demo-Backend |
| `race.js` | Rennbahn-Grafik: Pferde, Reiter, Zuschauer, Effekte |
| `game.js` | Warteraum-Spiel „Hürdenritt“ (Canvas, Pixel-Look, nur im Browser) |
| `quiz.css` | Aussehen des Quiz |
| `config.js` | Supabase-Adresse und öffentlicher Schlüssel |
| `assets/` | Design, Schriften, QR-Code-Bibliothek (Kopie aus dem Lernraum) |
| `supabase/quiz.sql` | Datenbank, jederzeit erneut ausführbar |
| `docs/` | Dokumentation |
