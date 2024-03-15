"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const preload_1 = require("@electron-toolkit/preload");
// Custom APIs for renderer
const api = {
    handleGroups: (callback) => electron_1.ipcRenderer.on('update-groups', callback),
    requestRebirth: (groupId, nodeId) => electron_1.ipcRenderer.send('requestRebirth', { groupId, nodeId }),
    sendNodeCommand: (groupId, nodeId, metricId, value) => electron_1.ipcRenderer.send('sendNodeCommand', { groupId, nodeId, metricId, value }),
    sendDeviceCommand: (groupId, nodeId, deviceId, metricId, value) => electron_1.ipcRenderer.send('sendDeviceCommand', { groupId, nodeId, deviceId, metricId, value }),
    getConnections: () => electron_1.ipcRenderer.invoke('getConnections'),
    addConnection: (connection) => electron_1.ipcRenderer.send('addConnection', connection),
    selectConnection: (id) => electron_1.ipcRenderer.send('selectConnection', id),
    deleteConnection: (id) => electron_1.ipcRenderer.send('deleteConnection', id)
};
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        electron_1.contextBridge.exposeInMainWorld('electron', preload_1.electronAPI);
        electron_1.contextBridge.exposeInMainWorld('api', api);
    }
    catch (error) {
        console.error(error);
    }
}
else {
    // @ts-ignore (define in dts)
    window.electron = preload_1.electronAPI;
    // @ts-ignore (define in dts)
    window.api = api;
}
