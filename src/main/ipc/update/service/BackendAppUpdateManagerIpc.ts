import { AppUpdateManager } from '../../../update/service/AppUpdateManager'
import { ipcMain } from 'electron'
import {
    appUpdateManagerIpc_isUpdateAvailable,
    appUpdateManagerIpc_manualUpdateApp
} from '../../../../common/ipc/update/service/AppUpdateManagerIpc'
import IpcMainEvent = Electron.IpcMainEvent

/**
 * Initializes implementation of app update manager IPC for backend.
 */
export function initBackendAppUpdateManagerIpc(appUpdateManager: AppUpdateManager): void {
    ipcMain.handle(
        appUpdateManagerIpc_isUpdateAvailable,
        (event: IpcMainEvent): Promise<boolean> => {
            return appUpdateManager.isUpdateAvailable()
        }
    )
    ipcMain.on(
        appUpdateManagerIpc_manualUpdateApp,
        (event: IpcMainEvent): void => {
            appUpdateManager.manualUpdateApp()
        }
    )
}
