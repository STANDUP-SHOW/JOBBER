const { contextBridge, ipcRenderer } = require('electron');

// The only bridge between the page and the system: no Node, no token.
contextBridge.exposeInMainWorld('jaf', {
  config: () => ipcRenderer.invoke('config:get'),
  setApiUrl: (url) => ipcRenderer.invoke('config:setApiUrl', url),
  login: (email, password) => ipcRenderer.invoke('auth:login', { email, password }),
  session: () => ipcRenderer.invoke('auth:session'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  request: (method, path, { body, query } = {}) => ipcRenderer.invoke('api:request', { method, path, body, query }),
  exportCsv: (path, query, filename) => ipcRenderer.invoke('api:exportCsv', { path, query, filename }),
  open: (url) => ipcRenderer.invoke('shell:open', url),
});
