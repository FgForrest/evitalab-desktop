import { ipcMain } from 'electron'
import { ConnectionId } from '../../../connection/model/ConnectionId'
import IpcMainEvent = Electron.IpcMainEvent
import {
    CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION, CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE,
    ConnectionManager
} from '../../../connection/service/ConnectionManager'
import {
    connectionManagerIpc_activateConnection, connectionManagerIpc_getActiveConnection,
    connectionManagerIpc_getConnection,
    connectionManagerIpc_getConnections, connectionManagerIpc_getSimilarConnection,
    connectionManagerIpc_onConnectionActivation,
    connectionManagerIpc_onConnectionsChange,
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
    ipcMain.on(
        connectionManagerIpc_activateConnection,
        (event: IpcMainEvent, connectionId: ConnectionId | undefined) => {
            connectionManager.activateConnection(connectionId)
        }
    )
    ipcMain.on(
        connectionManagerIpc_storeConnection,
        (event: IpcMainEvent, connectionDto: ConnectionDto) => {
            if (connectionDto.id == undefined) {
                connectionManager.storeConnection(new Connection(
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
                connectionManager.storeConnection(existingConnection)
            }
        }
    )
    ipcMain.on(
        connectionManagerIpc_storeConnectionsOrder,
        (event: IpcMainEvent, newOrder: ConnectionId[]) => {
            connectionManager.storeConnectionsOrder(newOrder)
        }
    )
    ipcMain.on(
        connectionManagerIpc_removeConnection,
        (event: IpcMainEvent, connectionId: ConnectionId) => {
            connectionManager.removeConnection(connectionId)
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
}

function emitConnectionActivation(target: WebContents, connection: Connection | undefined): void {
    target.send(connectionManagerIpc_onConnectionActivation, connection != undefined ? convertConnectionToDto(connection) : undefined)
}

function emitConnectionsChange(target: WebContents, connections: Connection[]): void {
    target.send(connectionManagerIpc_onConnectionsChange, connections.map(it => convertConnectionToDto(it)))
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
