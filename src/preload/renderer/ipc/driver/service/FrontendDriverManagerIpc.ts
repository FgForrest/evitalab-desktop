import { DriverDto } from '../../../../../common/ipc/driver/model/DriverDto'
import { contextBridge, ipcRenderer } from 'electron'
import {
    driverManagerIpc_downloadDriver,
    driverManagerIpc_getDriver,
    driverManagerIpc_resolveLatestAvailableDriver
} from '../../../../../common/ipc/driver/service/DriverManagerIpc'

/**
 * Interface of driver manager IPC for frontend renderer
 */
export type FrontendDriverManagerIpc = {
    getDriver(version: string): Promise<DriverDto>,
    resolveLatestAvailableDriver(serverUrl: string): Promise<DriverDto>,
    downloadDriver(version: string): Promise<void>
}

/**
 * Implementation of driver manager IPC for frontend renderer
 */
export function exposeFrontendDriverManagerIpc(): void {
    contextBridge.exposeInMainWorld('driverManager', {
        getDriver(version: string): Promise<DriverDto> {
            return ipcRenderer.invoke(driverManagerIpc_getDriver, version)
        },
        resolveLatestAvailableDriver(serverUrl: string): Promise<DriverDto> {
            return ipcRenderer.invoke(driverManagerIpc_resolveLatestAvailableDriver, serverUrl)
        },
        async downloadDriver(version: string): Promise<void> {
            await ipcRenderer.invoke(driverManagerIpc_downloadDriver, version)
        }
    } as FrontendDriverManagerIpc)
}
