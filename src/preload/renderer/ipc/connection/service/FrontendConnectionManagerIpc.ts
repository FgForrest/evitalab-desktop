import { contextBridge, ipcRenderer } from 'electron'
import { ConnectionId } from '../../../../../main/connection/model/ConnectionId'
import { ConnectionDto } from '../../../../../common/ipc/connection/model/ConnectionDto'
import {
    connectionManagerIpc_activateConnection,
    connectionManagerIpc_getConnection,
    connectionManagerIpc_getConnections,
    connectionManagerIpc_onConnectionActivation,
    connectionManagerIpc_onConnectionsChange,
    connectionManagerIpc_removeConnection,
    connectionManagerIpc_storeConnection
} from '../../../../../common/ipc/connection/service/ConnectionManagerIpc'

/**
 * Interface of connection manager IPC for frontend renderer.
 */
export type FrontendConnectionManagerIpc = {
    activateConnection(connectionId: ConnectionId | undefined): void,
    storeConnection(connection: ConnectionDto): void,
    removeConnection(connectionId: ConnectionId): void,
    getConnections(): Promise<ConnectionDto[]>,
    getConnection(connectionId: ConnectionId): Promise<ConnectionDto | undefined>,
    onConnectionActivation(listener: (activated: ConnectionDto | undefined) => void): void
    onConnectionsChange(listener: (connections: ConnectionDto[]) => void): void
}

/**
 * Implementation of connection manager IPC for frontend renderer.
 */
export function exposeFrontendConnectionManagerIpc(): void {
    contextBridge.exposeInMainWorld('connectionManager', {
        activateConnection(connectionId: ConnectionId | undefined): void {
            ipcRenderer.send(connectionManagerIpc_activateConnection, connectionId)
        },
        storeConnection(connection: ConnectionDto): void {
            ipcRenderer.send(connectionManagerIpc_storeConnection, connection)
        },
        removeConnection(connectionId: ConnectionId): void {
            ipcRenderer.send(connectionManagerIpc_removeConnection, connectionId)
        },
        getConnections(): Promise<ConnectionDto[]> {
            return ipcRenderer.invoke(connectionManagerIpc_getConnections)
        },
        getConnection(connectionId: ConnectionId): Promise<ConnectionDto | undefined> {
            return ipcRenderer.invoke(connectionManagerIpc_getConnection, connectionId)
        },
        onConnectionActivation(listener: (activated: ConnectionDto) => void): void {
            ipcRenderer.on(connectionManagerIpc_onConnectionActivation, (_event, activated) => listener(activated))
        },
        onConnectionsChange(listener: (connections: ConnectionDto[]) => void): void {
            ipcRenderer.on(connectionManagerIpc_onConnectionsChange, (_event, connections) => listener(connections))
        }
    } as FrontendConnectionManagerIpc)
}
