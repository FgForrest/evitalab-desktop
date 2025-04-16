import { DriverManager } from '../../../driver/service/DriverManager'
import { ipcMain } from 'electron'
import {
    driverManagerIpc_downloadDriver,
    driverManagerIpc_getDriver,
    driverManagerIpc_resolveLatestAvailableDriver
} from '../../../../common/ipc/driver/service/DriverManagerIpc'
import IpcMainEvent = Electron.IpcMainEvent
import { DriverDto } from '../../../../common/ipc/driver/model/DriverDto'
import { Driver } from '../../../driver/model/Driver'

/**
 * Initializes implementation of driver manager IPC for backend
 */
export function initBackendDriverManagerIpc(driverManager: DriverManager): void {
    ipcMain.handle(
        driverManagerIpc_getDriver,
        async (event: IpcMainEvent, version: string): Promise<DriverDto> => {
            return convertDriverToDto(
                await driverManager.getDriver(version)
            )
        }
    )
    ipcMain.handle(
        driverManagerIpc_resolveLatestAvailableDriver,
        async (event: IpcMainEvent, serverUrl: string): Promise<DriverDto> => {
            return convertDriverToDto(
                await driverManager.resolveLatestAvailableDriver(serverUrl)
            )
        }
    )
    ipcMain.handle(
        driverManagerIpc_downloadDriver,
        async (event: IpcMainEvent, version: string): Promise<void> => {
            await driverManager.downloadDriver(version)
        }
    )
}

function convertDriverToDto(driver: Driver): DriverDto {
    return {
        version: driver.version,
        minServerVersion: driver.minServerVersion
    } as DriverDto
}
