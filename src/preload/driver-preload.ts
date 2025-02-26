import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('desktop', {
    // todo lho remove
    // getInstanceProperties: () => ipcRenderer.invoke('desktop:getInstanceProperties'),
})
