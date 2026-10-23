# Today — a tiny to-do widget for the top-right of your screen

A minimal, always-on-top to-do list for macOS and Windows. No server, no account — your data stays on your computer.

- Pinned to the top-right corner, shows 3 tasks at a time (scroll for more)
- Completed tasks drop to the bottom; drag to reorder
- Click text to check off, hover to edit or delete
- Daily memo
- Unfinished tasks carry over to the next day automatically
- History with a calendar view
- Menu bar / tray icon: pin, history, opacity, language, open at login
- English · 한국어 · 中文 · Español

## Download

Go to **[Releases](../../releases)** and download:

- **macOS:** `Today-x.x.x-universal.dmg` → open it and drag **Today** into Applications
- **Windows:** `Today Setup x.x.x.exe` → run it

**First launch:** the app is not code-signed yet, so your OS will warn you once.
- macOS: right-click Today in Applications → **Open** → **Open**
- Windows: on "Windows protected your PC", click **More info → Run anyway**

## Your data

Open it from the menu: **Open data folder**.

- macOS: `~/Library/Application Support/today-widget/data.json`
- Windows: `%APPDATA%\today-widget\data.json`

Saves are atomic (written to a temp file first), and a daily snapshot is kept in `backups/` for the last 30 days.

## Building installers

Installers are built automatically by GitHub Actions (`.github/workflows/build.yml`):

- **Create a release** with a new tag like `v1.0.0` → installers are attached to that release in ~5–10 minutes.
- Or **Actions → Build installers → Run workflow** and download from Artifacts.

## Development

Requires [Node.js](https://nodejs.org) LTS.

```
npm install
npm start          # run the app
npm run dist:mac   # build .dmg (on macOS)
npm run dist:win   # build .exe (on Windows)
```

## Project structure

```
main.js          windows, tray menu, storage, daily carry-over
preload.js       bridge between UI and main process
src/widget.*     the widget
src/history.*    history window with calendar
src/i18n.js      translations
assets/          icons
```

## License

MIT
