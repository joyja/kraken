import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  handleGroups: (callback) => ipcRenderer.on('update-groups', callback),
  requestRebirth: (groupId, nodeId) => ipcRenderer.send('requestRebirth', { groupId, nodeId }),
  getConnections: () => ipcRenderer.invoke('getConnections'),
  addConnection: (connection) => ipcRenderer.send('addConnection', connection),
  selectConnection: (id) => ipcRenderer.send('selectConnection', id),
  deleteConnection: (id) => ipcRenderer.send('deleteConnection', id)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
