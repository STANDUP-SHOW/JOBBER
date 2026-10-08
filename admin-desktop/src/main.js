const { app, BrowserWindow, ipcMain, safeStorage, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// Production API by default; changeable from the login screen (e.g. a
// local backend at http://localhost:4000 for testing).
const DEFAULT_API_URL = 'https://jobber-production-5668.up.railway.app';

const configPath = () => path.join(app.getPath('userData'), 'config.json');
const sessionPath = () => path.join(app.getPath('userData'), 'session.bin');

function readConfig() {
  try { return { apiUrl: DEFAULT_API_URL, ...JSON.parse(fs.readFileSync(configPath(), 'utf8')) }; } catch { return { apiUrl: DEFAULT_API_URL }; }
}
function writeConfig(cfg) { fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2)); }

// The admin token never reaches the renderer: it lives here, encrypted at
// rest with the OS keychain (DPAPI on Windows, Keychain on macOS). If the
// OS offers no encryption, it is kept in memory only for this session.
let token = null;
function loadToken() {
  try {
    if (safeStorage.isEncryptionAvailable() && fs.existsSync(sessionPath())) {
      token = safeStorage.decryptString(fs.readFileSync(sessionPath()));
    }
  } catch { token = null; }
}
function saveToken(value) {
  token = value;
  try {
    if (!value) { fs.rmSync(sessionPath(), { force: true }); return; }
    if (safeStorage.isEncryptionAvailable()) fs.writeFileSync(sessionPath(), safeStorage.encryptString(value));
  } catch { /* memory-only session */ }
}

function apiBase() { return readConfig().apiUrl.replace(/\/+$/, ''); }

async function call(method, urlPath, { body, query, raw } = {}) {
  const url = new URL(apiBase() + urlPath);
  Object.entries(query || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v)); });
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    return { ok: false, status: 0, data: { error: `Serveur injoignable (${apiBase()}) : ${err.cause?.code || err.message}` } };
  }
  if (raw && res.ok) return { ok: true, status: res.status, text: await res.text() };
  let data = null;
  try { data = await res.json(); } catch { data = { error: `Réponse inattendue du serveur (HTTP ${res.status})` }; }
  if (res.status === 401) saveToken(null);
  return { ok: res.ok, status: res.status, data };
}

// A backend without /api/admin/v1 yet answers 404: say so plainly.
async function me() {
  const res = await call('GET', '/api/admin/v1/me');
  if (res.status === 404) {
    return { ok: false, status: 404, data: { error: `Le serveur ${apiBase()} n'a pas encore l'API du back-office (mise à jour du backend à déployer).` } };
  }
  return res;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Jobber Admin Factory',
    backgroundColor: '#F4F5F7',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  // The app never navigates away or opens windows; links go to the OS.
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

// French UI controls (date pickers, spellcheck) whatever the OS language.
app.commandLine.appendSwitch('lang', 'fr');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(() => {
    loadToken();

    ipcMain.handle('config:get', () => ({ ...readConfig(), defaultApiUrl: DEFAULT_API_URL, version: app.getVersion() }));
    ipcMain.handle('config:setApiUrl', (e, apiUrl) => {
      const parsed = new URL(apiUrl);
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('URL invalide');
      if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) throw new Error('HTTPS obligatoire hors localhost');
      writeConfig({ ...readConfig(), apiUrl: parsed.origin });
      saveToken(null);
      return readConfig();
    });

    ipcMain.handle('auth:login', async (e, { email, password }) => {
      const res = await call('POST', '/api/auth/login', { body: { email, password } });
      if (!res.ok) return res;
      if (res.data.user?.role !== 'ADMIN') return { ok: false, status: 403, data: { error: 'Ce compte n\'est pas administrateur Jobber.' } };
      saveToken(res.data.token);
      return me();
    });
    ipcMain.handle('auth:session', async () => (token ? me() : { ok: false, status: 401, data: null }));
    ipcMain.handle('auth:logout', () => { saveToken(null); return true; });

    // Only admin API paths are reachable from the renderer.
    ipcMain.handle('api:request', (e, { method = 'GET', path: p, body, query }) => {
      if (typeof p !== 'string' || !p.startsWith('/api/admin/v1/')) return { ok: false, status: 400, data: { error: 'Chemin refusé' } };
      return call(method, p, { body, query });
    });

    ipcMain.handle('api:exportCsv', async (e, { path: p, query, filename }) => {
      if (typeof p !== 'string' || !p.startsWith('/api/admin/v1/')) return { ok: false, data: { error: 'Chemin refusé' } };
      const res = await call('GET', p, { query: { ...query, format: 'csv', page: undefined, pageSize: undefined }, raw: true });
      if (!res.ok) return res;
      const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: filename, filters: [{ name: 'CSV', extensions: ['csv'] }] });
      if (canceled || !filePath) return { ok: true, canceled: true };
      fs.writeFileSync(filePath, res.text, 'utf8');
      return { ok: true, filePath };
    });

    ipcMain.handle('shell:open', (e, url) => {
      const u = new URL(url);
      if (!['https:', 'mailto:'].includes(u.protocol)) throw new Error('Lien refusé');
      return shell.openExternal(u.toString());
    });

    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
