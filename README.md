# FinanzBot

Lokale Finanzplanungs-Web-App für den Privatgebrauch.
Aktuell enthalten: **Rentenlücke & Sparrate** — basierend auf der Methodik
aus den Finanztip- und Finanzfluss-Videos.

- Daten bleiben **ausschließlich im Browser** (`localStorage`), nichts wird an einen Server gesendet.
- Drei Methodik-Profile: **Konservativ** (Finanztip), **Standard** (Mix), **Investor** (Finanzfluss).
- Bestehendes Vermögen wird je Anlageform getrennt aufgezinst (Tagesgeld 0 %, Welt-ETF 5 % real, …).
- Detaillierter Rechenweg mit Formeln und Quellenverweisen pro Schritt.
- Export/Import als JSON.

## Lokal entwickeln

Voraussetzungen: Node.js ≥ 20.

```bash
npm install
npm run dev          # Dev-Server auf http://localhost:5173
npm test             # Unit-Tests
npm run typecheck    # TypeScript prüfen
npm run build        # Produktions-Build nach dist/
```

## Auf GitHub Pages deployen

1. **GitHub-Repository anlegen** — auf [github.com/new](https://github.com/new) ein neues Repo erstellen, z. B. `finanzbot`. Den Namen merken — er wird als Basis-Pfad für die URL benutzt.

2. **Lokales Repo verknüpfen und pushen**:
   ```bash
   git remote add origin https://github.com/<dein-username>/finanzbot.git
   git branch -M main
   git push -u origin main
   ```

3. **GitHub Pages aktivieren**:
   - Im Repo: *Settings → Pages*
   - **Source** auf **GitHub Actions** stellen (nicht „Deploy from a branch")

4. **Deploy auslösen**:
   - Nach dem ersten Push läuft `.github/workflows/deploy.yml` automatisch.
   - Status unter *Actions* prüfen.
   - Nach erfolgreichem Deploy ist die App unter
     `https://<dein-username>.github.io/<repo-name>/` erreichbar.

Jeder weitere Push auf `main` triggert ein neues Deploy. Pull Requests laufen durch `.github/workflows/test.yml` (Type-Check + Tests, ohne Deploy).

## Architektur in einem Satz

Module unter `src/modules/<id>/` mit fester Datei-Konvention; geteilte Mathematik in
`src/lib/finance.ts`; modulübergreifender Profil-State in `src/lib/profile/`. Beim
Erweitern muss in der Regel nur **ein** Modul-Verzeichnis gelesen werden.

Details: siehe [docs/](docs/) (post-MVP gepflegt).

## Hinweis

Die App ist eine **Orientierungshilfe** zur eigenen Finanzplanung — keine Anlageberatung.
