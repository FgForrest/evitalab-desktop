import { ipcMain } from 'electron'
import { ConnectionId } from '../../../connection/model/ConnectionId'
import IpcMainEvent = Electron.IpcMainEvent
import {
    CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION,
    CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE,
    CONNECTION_MANAGER_EMIT_DRIVER_UPDATE_AVAILABLE,
    ConnectionManager
} from '../../../connection/service/ConnectionManager'
import {
    connectionManagerIpc_activateConnection, connectionManagerIpc_getActiveConnection,
    connectionManagerIpc_getConnection,
    connectionManagerIpc_getConnections, connectionManagerIpc_getSimilarConnection,
    connectionManagerIpc_onConnectionActivation,
    connectionManagerIpc_onConnectionsChange, connectionManagerIpc_onDriverUpdateAvailable,
    connectionManagerIpc_removeConnection,
    connectionManagerIpc_storeConnection, connectionManagerIpc_storeConnectionsOrder
} from '../../../../common/ipc/connection/service/ConnectionManagerIpc'
import { ConnectionDto } from '../../../../common/ipc/connection/model/ConnectionDto'
import { Connection } from '../../../connection/model/Connection'
import WebContents = Electron.WebContents
import { SkeletonManager } from '../../../skeleton/service/SkeletonManager'
import { ModalManager } from '../../../modal/service/ModalManager'
import { ConnectionStyling } from '../../../connection/model/ConnectionStyling'
import { ConnectionStylingDto } from '../../../../common/ipc/connection/model/ConnectionStylingDto'

/**
 * Initializes implementation of connection manager IPC for backend.
 */
export function initBackendConnectionManagerIpc(skeletonManager: SkeletonManager,
                                                connectionManager: ConnectionManager,
                                                modalManager: ModalManager): void {
    ipcMain.handle(
        connectionManagerIpc_activateConnection,
        async (event: IpcMainEvent, connectionId: ConnectionId | undefined) => {
            await connectionManager.activateConnection(connectionId)
        }
    )
    ipcMain.handle(
        connectionManagerIpc_storeConnection,
        async (event: IpcMainEvent, connectionDto: ConnectionDto) => {
            if (connectionDto.id == undefined) {
                await connectionManager.storeConnection(new Connection(
                    undefined,
                    connectionDto.name,
                    connectionDto.serverUrl,
                    connectionDto.driverVersion,
                    new ConnectionStyling(
                        connectionDto.styling.color
                    )
                ))
            } else {
                const existingConnection: Connection | undefined = connectionManager.getConnection(connectionDto.id)
                if (existingConnection == undefined) {
                    throw new Error(`No connection for ${connectionDto.id} exist.`)
                }
                existingConnection.update(
                    connectionDto.name,
                    connectionDto.serverUrl,
                    connectionDto.driverVersion,
                    new ConnectionStyling(
                        connectionDto.styling.color
                    )
                )
                await connectionManager.storeConnection(existingConnection)
            }
        }
    )
    ipcMain.handle(
        connectionManagerIpc_storeConnectionsOrder,
        async (event: IpcMainEvent, newOrder: ConnectionId[]) => {
            await connectionManager.storeConnectionsOrder(newOrder)
        }
    )
    ipcMain.handle(
        connectionManagerIpc_removeConnection,
        async (event: IpcMainEvent, connectionId: ConnectionId) => {
            await connectionManager.removeConnection(connectionId)
        }
    )
    ipcMain.handle(
        connectionManagerIpc_getConnection,
        (event: IpcMainEvent, connectionId: ConnectionId) => {
            const connection: Connection | undefined = connectionManager.getConnection(connectionId)
            if (connection == undefined) {
                return undefined
            }
            return convertConnectionToDto(connection)
        }
    )
    ipcMain.handle(
        connectionManagerIpc_getConnections,
        () => {
            return connectionManager.connections
                .map(it => convertConnectionToDto(it))
                .toArray()
        }
    )
    ipcMain.handle(
        connectionManagerIpc_getSimilarConnection,
        (event: IpcMainEvent, connectionName: string) => {
            const connection: Connection | undefined = connectionManager.getSimilarConnection(connectionName)
            if (connection == undefined) {
                return undefined
            }
            return convertConnectionToDto(connection)
        }
    )
    ipcMain.handle(
        connectionManagerIpc_getActiveConnection,
        () => {
            const activeConnection: Connection | undefined = connectionManager.activeConnection
            if (activeConnection == undefined) {
                return undefined
            }
            return convertConnectionToDto(activeConnection)
        }
    )

    connectionManager.on(
        CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION,
        (activatedConnection: Connection | undefined) => {
            emitConnectionActivation(
                skeletonManager.skeletonWindow.webContents,
                activatedConnection
            )
            modalManager.modals.forEach(modal =>
                emitConnectionActivation(modal.webContents, activatedConnection))
        }
    )
    connectionManager.on(
        CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE,
        (connections: Connection[]) => {
            emitConnectionsChange(
                skeletonManager.skeletonWindow.webContents,
                connections
            )
            modalManager.modals.forEach(modal =>
                emitConnectionsChange(modal.webContents, connections))
        }
    )

    connectionManager.on(
        CONNECTION_MANAGER_EMIT_DRIVER_UPDATE_AVAILABLE,
        (connectionId: ConnectionId) => {
            emitDriverUpdateAvailable(
                skeletonManager.skeletonWindow.webContents,
                connectionId
            )
            modalManager.modals.forEach(modal =>
                emitDriverUpdateAvailable(modal.webContents, connectionId))
        }
    )
}

function emitConnectionActivation(target: WebContents, connection: Connection | undefined): void {
    target.send(connectionManagerIpc_onConnectionActivation, connection != undefined ? convertConnectionToDto(connection) : undefined)
}

function emitConnectionsChange(target: WebContents, connections: Connection[]): void {
    target.send(connectionManagerIpc_onConnectionsChange, connections.map(it => convertConnectionToDto(it)))
}

function emitDriverUpdateAvailable(target: WebContents, connectionId: ConnectionId): void {
    target.send(connectionManagerIpc_onDriverUpdateAvailable, connectionId)
}

function convertConnectionToDto(connection: Connection): ConnectionDto {
    return {
        id: connection.id,
        name: connection.name,
        serverUrl: connection.serverUrl,
        driverVersion: connection.driverVersion,
        styling: {
            color: connection.styling.color
        } as ConnectionStylingDto
    } as ConnectionDto
}
