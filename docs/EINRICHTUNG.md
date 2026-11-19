# Einrichtung durch den Inhaber (Yannik)

Einmalige Schritte, damit das Live-Quiz ein eigenes Repo mit eigener Adresse bekommt und dein Kollege nur dort mitarbeiten kann.

## 1. Repo anlegen
- https://github.com/new → Name `lernraum-quiz`, **Public** (GitHub Pages ist im kostenlosen Konto nur für öffentliche Repos), **ohne** README, ohne .gitignore, ohne Lizenz.
- Der Inhalt ist harmlos: Es steht nur der öffentliche Supabase-Schlüssel im Code, der ohnehin im Browser sichtbar ist. Keine PIN, keine Geheimnisse.

## 2. Claude Zugriff geben (damit Claude den Inhalt hochladen kann)
- https://github.com/apps/claude → Configure → bei deinem Konto das Repo `lernraum-quiz` zusätzlich auswählen.
- Danach in der Claude-Sitzung Bescheid sagen. Claude lädt das fertige Paket hoch.

## 3. GitHub Pages und Adresse
- Repo → Settings → Pages: *Deploy from a branch*, Branch `main`, Ordner `/ (root)`.
- *Custom domain*: `quiz.yannikbrand.eu` eintragen (die Datei `CNAME` ist schon im Repo), danach *Enforce HTTPS* aktivieren, sobald es verfügbar ist.
- Beim Anbieter deiner Domain einen **DNS-Eintrag** anlegen: Typ `CNAME`, Name `quiz`, Ziel `brandy299.github.io`. Es kann bis zu einer Stunde dauern.

## 4. Kollegen einladen (nur dieses Repo)
- Repo → Settings → Collaborators → *Add people* → GitHub-Name des Kollegen → Rolle **Write**.
- Er sieht damit nur `lernraum-quiz`, nichts aus deinen anderen Repos.

## 5. `main` schützen
Repo → Settings → Rules → Rulesets → *New branch ruleset* (Ziel: `main`):
Beschluss 19.11.2026: Der Kollege darf selbst mergen. Rollback per Revert-Pull-Request. Das Ruleset enthält nur:
- *Block force pushes* und *Restrict deletions* (der Verlauf bleibt erhalten, Rollback bleibt möglich).
- Optional später: *Require status checks to pass* mit dem Check `check`.
- Kein Pflicht-Review. `.github/CODEOWNERS` benachrichtigt dich bei jedem Pull Request.
- SQL-Änderungen: der Kollege wartet mit dem Merge, bis du das SQL eingespielt hast (steht in CLAUDE.md und seiner Anleitung).

## 6. Supabase
Bleibt unverändert, dasselbe Projekt, dieselbe `config.js`. Dein Kollege braucht **keinen** Supabase-Zugang. Datenbankänderungen spielst du selbst ein (siehe CLAUDE.md).

## 7. Nach dem Start
- Im Lernraum-Repo wird die alte Adresse `/quiz/` durch eine Weiterleitung auf `https://quiz.yannikbrand.eu/` ersetzt und die Startseite verlinkt neu. Claude macht dafür einen Pull Request, sobald die neue Adresse erreichbar ist.
- Bereits ausgegebene QR-Codes mit `lernen.yannikbrand.eu/quiz/#/CODE` führen über die Weiterleitung weiter.
