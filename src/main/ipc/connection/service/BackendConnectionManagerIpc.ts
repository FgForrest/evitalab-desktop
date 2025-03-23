import { ipcMain } from 'electron'
import { ConnectionId } from '../../../connection/model/ConnectionId'
import IpcMainEvent = Electron.IpcMainEvent
import {
    CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION, CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE,
    ConnectionManager
} from '../../../connection/service/ConnectionManager'
import {
    connectionManagerIpc_activateConnection,
    connectionManagerIpc_getConnection,
    connectionManagerIpc_getConnections,
    connectionManagerIpc_onConnectionActivation,
    connectionManagerIpc_onConnectionsChange,
    connectionManagerIpc_removeConnection,
    connectionManagerIpc_storeConnection
} from '../../../../common/ipc/connection/service/ConnectionManagerIpc'
import { ConnectionDto } from '../../../../common/ipc/connection/model/ConnectionDto'
import { Connection } from '../../../connection/model/Connection'
import WebContents = Electron.WebContents
import { SkeletonManager } from '../../../skeleton/service/SkeletonManager'
import { ModalManager } from '../../../modal/service/ModalManager'

/**
 * Implementation of connection manager IPC for backend.
 */
export class BackendConnectionManagerIpc {

    emitConnectionActivation(target: WebContents, connection: Connection | undefined): void {
        target.send(connectionManagerIpc_onConnectionActivation, connection != undefined ? convertConnectionToDto(connection) : undefined)
    }

    emitConnectionsChange(target: WebContents, connections: Connection[]): void {
        target.send(connectionManagerIpc_onConnectionsChange, connections.map(it => convertConnectionToDto(it)))
    }
}

/**
 * Initializes implementation of connection manager IPC for backend.
 */
export function initBackendConnectionManagerIpc(skeletonManager: SkeletonManager,
                                                connectionManager: ConnectionManager,
                                                modalManager: ModalManager): BackendConnectionManagerIpc {
    const backendConnectionManagerIpc: BackendConnectionManagerIpc = new BackendConnectionManagerIpc()

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
                    connectionDto.driverVersion
                ))
            } else {
                const existingConnection: Connection | undefined = connectionManager.getConnection(connectionDto.id)
                if (existingConnection == undefined) {
                    throw new Error(`No connection for ${connectionDto.id} exist.`)
                }
                existingConnection.update(
                    connectionDto.name,
                    connectionDto.serverUrl,
                    connectionDto.driverVersion
                )
                connectionManager.storeConnection(existingConnection)
            }
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

    connectionManager.on(
        CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION,
        (activatedConnection: Connection | undefined) => {
            backendConnectionManagerIpc.emitConnectionActivation(
                skeletonManager.skeletonWindow.webContents,
                activatedConnection
            )
            modalManager.modals.forEach(modal =>
                backendConnectionManagerIpc.emitConnectionActivation(modal.webContents, activatedConnection))
        }
    )
    connectionManager.on(
        CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE,
        (connections: Connection[]) => {
            backendConnectionManagerIpc.emitConnectionsChange(
                skeletonManager.skeletonWindow.webContents,
                connections
            )
            modalManager.modals.forEach(modal =>
                backendConnectionManagerIpc.emitConnectionsChange(modal.webContents, connections))
        }
    )

    return backendConnectionManagerIpc
}

function convertConnectionToDto(connection: Connection): ConnectionDto {
    return {
        id: connection.id,
        name: connection.name,
        serverUrl: connection.serverUrl,
        driverVersion: connection.driverVersion
    } as ConnectionDto
}
