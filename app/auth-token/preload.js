const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  validateAndSaveToken: async (token) => await ipcRenderer.invoke('validate-and-save-token', token),
  closeAuthWindow: () => ipcRenderer.invoke('close-auth-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
});
