const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getState: () => ipcRenderer.invoke('get-state'),
  saveToday: d => ipcRenderer.send('save-today', d),
  setSetting: (k, v) => ipcRenderer.send('set-setting', k, v),
  resize: h => ipcRenderer.send('resize', h),
  onState: cb => ipcRenderer.on('state', (_e, s) => cb(s))
});
