import { contextBridge, ipcRenderer } from 'electron'
import {
    appUpdateManagerIpc_isUpdateAvailable,
    appUpdateManagerIpc_manualUpdateApp
} from '../../../../../common/ipc/update/service/AppUpdateManagerIpc'

/**
 * Interface of app update manager IPC for frontend renderer
 */
export interface FrontendAppUpdateManagerIpc {
    isUpdateAvailable(): Promise<boolean>
    manualUpdateApp(): void
}

export function exposeFrontendAppUpdateManagerIpc(): void {
    contextBridge.exposeInMainWorld('labAppUpdateManager', {
        isUpdateAvailable(): Promise<boolean> {
            return ipcRenderer.invoke(appUpdateManagerIpc_isUpdateAvailable)
        },
        manualUpdateApp(): void {
            ipcRenderer.send(appUpdateManagerIpc_manualUpdateApp)
        }
    } as FrontendAppUpdateManagerIpc)
}
