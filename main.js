const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const I18N = require('./src/i18n');

if (!app.requestSingleInstanceLock()) app.quit();

const isMac = process.platform === 'darwin';
const WIDTH = 236, MARGIN = 12;
let widget = null, historyWin = null, tray = null, data = null;

// ---------- storage (local JSON, atomic write, daily backups) ----------
const dir = () => app.getPath('userData');
const file = () => path.join(dir(), 'data.json');
const backupDir = () => path.join(dir(), 'backups');
const pad = n => String(n).padStart(2, '0');
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

function load() {
  data = readJSON(file());
  if (!data) {
    // fall back to the newest backup if the main file is missing or broken
    try {
      const last = fs.readdirSync(backupDir()).filter(f => f.endsWith('.json')).sort().pop();
      if (last) data = readJSON(path.join(backupDir(), last));
    } catch {}
  }
  data = data || { days: {}, settings: {} };
  data.days = data.days || {};
  data.settings = { pinned: true, opacity: 1, lang: 'en', collapsed: false, ...data.settings };
}

function save() {
  fs.mkdirSync(dir(), { recursive: true });
  const json = JSON.stringify(data, null, 2);
  const tmp = file() + '.tmp';
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, file());
  try {
    fs.mkdirSync(backupDir(), { recursive: true });
    fs.writeFileSync(path.join(backupDir(), todayKey() + '.json'), json);
    const all = fs.readdirSync(backupDir()).filter(f => f.endsWith('.json')).sort();
    all.slice(0, Math.max(0, all.length - 30)).forEach(f => fs.unlinkSync(path.join(backupDir(), f)));
  } catch {}
}

// New day: unfinished tasks from the last recorded day move to today.
function rollover() {
  const k = todayKey();
  if (data.days[k]) return false;
  const prev = Object.keys(data.days).filter(x => x < k).sort().pop();
  const carry = prev ? data.days[prev].todos.filter(t => !t.done).map(t => ({ id: uid(), text: t.text, done: false, from: t.from || prev })) : [];
  data.days[k] = { todos: carry, memo: '' };
  return true;
}

const state = () => ({ today: todayKey(), days: data.days, settings: data.settings });
function broadcast() {
  [widget, historyWin].forEach(w => { if (w && !w.isDestroyed()) w.webContents.send('state', state()); });
  refreshTray();
}

// ---------- widget window ----------
function place() {
  if (!widget) return;
  const { workArea } = screen.getPrimaryDisplay();
  const b = widget.getBounds();
  widget.setBounds({ x: workArea.x + workArea.width - WIDTH - MARGIN, y: workArea.y + MARGIN, width: WIDTH, height: b.height });
}

function createWidget() {
  widget = new BrowserWindow({
    width: WIDTH, height: 160, frame: false, transparent: true, resizable: false,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: false, show: false,
    fullscreenable: false, maximizable: false, minimizable: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  widget.setAlwaysOnTop(true, 'floating');
  widget.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  widget.loadFile(path.join(__dirname, 'src', 'widget.html'));
  place();
  widget.once('ready-to-show', applySettings);
}

function applySettings() {
  if (!widget) return;
  widget.setOpacity(data.settings.opacity);
  if (data.settings.pinned) widget.showInactive(); else widget.hide();
}

// ---------- history window ----------
function openHistory() {
  if (historyWin && !historyWin.isDestroyed()) { historyWin.show(); historyWin.focus(); return; }
  historyWin = new BrowserWindow({
    width: 460, height: 620, minWidth: 360, minHeight: 400,
    title: I18N.str[data.settings.lang].history, autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  historyWin.loadFile(path.join(__dirname, 'src', 'history.html'));
  historyWin.once('ready-to-show', () => { historyWin.show(); if (isMac) app.focus({ steal: true }); });
  historyWin.on('closed', () => { historyWin = null; });
}

// ---------- tray / menu bar ----------
function trayImage() {
  if (isMac) {
    const img = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'));
    const hi = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate-2x.png'));
    if (!hi.isEmpty()) img.addRepresentation({ scaleFactor: 2, width: 16, height: 16, buffer: hi.toPNG() });
    img.setTemplateImage(true);
    return img;
  }
  return nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-win.png'));
}

function refreshTray() {
  if (!tray) return;
  const s = data.settings, L = I18N.str[s.lang];
  const t = (data.days[todayKey()] || { todos: [] }).todos;
  const done = t.filter(x => x.done).length;
  const set = (k, v) => setSetting(k, v);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: L.today + ' · ' + done + '/' + t.length + ' ' + L.done, enabled: false },
    { type: 'separator' },
    { label: L.pin, type: 'checkbox', checked: s.pinned, click: () => set('pinned', !s.pinned) },
    { label: L.history, click: openHistory },
    { type: 'separator' },
    { label: L.opacity, submenu: [100, 90, 80, 70, 60, 50, 40, 30].map(v => ({ label: v + '%', type: 'radio', checked: Math.round(s.opacity * 100) === v, click: () => set('opacity', v / 100) })) },
    { label: L.language, submenu: I18N.langs.map(l => ({ label: l.label, type: 'radio', checked: s.lang === l.value, click: () => set('lang', l.value) })) },
    { label: L.openAtLogin, type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: mi => app.setLoginItemSettings({ openAtLogin: mi.checked }) },
    { label: L.openData, click: () => shell.openPath(dir()) },
    { type: 'separator' },
    { label: L.quit, accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
  ]));
  tray.setToolTip('Today · ' + done + '/' + t.length);
}

function setSetting(k, v) {
  data.settings[k] = v;
  save();
  if (k === 'pinned' || k === 'opacity') applySettings();
  if (k === 'lang' && historyWin && !historyWin.isDestroyed()) historyWin.setTitle(I18N.str[v].history);
  broadcast();
}

// ---------- IPC ----------
ipcMain.handle('get-state', () => state());
ipcMain.on('save-today', (_e, d) => {
  data.days[todayKey()] = { todos: Array.isArray(d.todos) ? d.todos : [], memo: typeof d.memo === 'string' ? d.memo : '' };
  save();
  broadcast();
});
ipcMain.on('set-setting', (_e, k, v) => setSetting(k, v));
ipcMain.on('resize', (_e, h) => {
  if (!widget) return;
  const b = widget.getBounds();
  const height = Math.max(40, Math.min(600, Math.ceil(h)));
  if (b.height !== height) widget.setBounds({ ...b, height });
});

// ---------- app lifecycle ----------
app.whenReady().then(() => {
  if (isMac && app.dock) app.dock.hide();
  load();
  if (rollover()) save();
  tray = new Tray(trayImage());
  if (!isMac) tray.on('click', () => tray.popUpContextMenu());
  refreshTray();
  createWidget();
  screen.on('display-metrics-changed', place);
  screen.on('display-added', place);
  screen.on('display-removed', place);
  setInterval(() => { if (rollover()) { save(); broadcast(); } }, 30 * 1000);
});

app.on('second-instance', () => { if (widget) { data.settings.pinned = true; applySettings(); refreshTray(); } });
app.on('window-all-closed', () => { /* keep running in the tray */ });
