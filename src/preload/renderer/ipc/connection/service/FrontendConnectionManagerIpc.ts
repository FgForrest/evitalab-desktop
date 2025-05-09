import { contextBridge, ipcRenderer } from 'electron'
import { ConnectionId } from '../../../../../main/connection/model/ConnectionId'
import { ConnectionDto } from '../../../../../common/ipc/connection/model/ConnectionDto'
import {
    connectionManagerIpc_activateConnection, connectionManagerIpc_getActiveConnection,
    connectionManagerIpc_getConnection,
    connectionManagerIpc_getConnections, connectionManagerIpc_getSimilarConnection,
    connectionManagerIpc_onConnectionActivation,
    connectionManagerIpc_onConnectionsChange, connectionManagerIpc_onDriverUpdateAvailable,
    connectionManagerIpc_removeConnection,
    connectionManagerIpc_storeConnection, connectionManagerIpc_storeConnectionsOrder
} from '../../../../../common/ipc/connection/service/ConnectionManagerIpc'

/**
 * Interface of connection manager IPC for frontend renderer.
 */
export interface FrontendConnectionManagerIpc {
    activateConnection(connectionId: ConnectionId | undefined): Promise<void>,
    storeConnection(connection: ConnectionDto): Promise<void>,
    storeConnectionsOrder(newOrder: ConnectionId[]): Promise<void>,
    removeConnection(connectionId: ConnectionId): Promise<void>,
    getConnections(): Promise<ConnectionDto[]>,
    getConnection(connectionId: ConnectionId): Promise<ConnectionDto | undefined>,
    getSimilarConnection(connectionName: string): Promise<ConnectionDto | undefined>,
    getActiveConnection(): Promise<ConnectionDto | undefined>
    onConnectionActivation(listener: (activated: ConnectionDto | undefined) => void): void
    onConnectionsChange(listener: (connections: ConnectionDto[]) => void): void,
    onDriverUpdateAvailable(listener: (connectionId: ConnectionId) => void): void
}

/**
 * Implementation of connection manager IPC for frontend renderer.
 */
export function exposeFrontendConnectionManagerIpc(): void {
    contextBridge.exposeInMainWorld('labConnectionManager', {
        async activateConnection(connectionId: ConnectionId | undefined): Promise<void> {
            await ipcRenderer.invoke(connectionManagerIpc_activateConnection, connectionId)
        },
        async storeConnection(connection: ConnectionDto): Promise<void> {
            await ipcRenderer.invoke(connectionManagerIpc_storeConnection, connection)
        },
        async storeConnectionsOrder(newOrder: ConnectionId[]): Promise<void> {
            await ipcRenderer.invoke(connectionManagerIpc_storeConnectionsOrder, newOrder)
        },
        async removeConnection(connectionId: ConnectionId): Promise<void> {
            await ipcRenderer.invoke(connectionManagerIpc_removeConnection, connectionId)
        },
        getConnections(): Promise<ConnectionDto[]> {
            return ipcRenderer.invoke(connectionManagerIpc_getConnections)
        },
        getConnection(connectionId: ConnectionId): Promise<ConnectionDto | undefined> {
            return ipcRenderer.invoke(connectionManagerIpc_getConnection, connectionId)
        },
        getSimilarConnection(connectionName: string): Promise<ConnectionDto | undefined> {
            return ipcRenderer.invoke(connectionManagerIpc_getSimilarConnection, connectionName)
        },
        getActiveConnection(): Promise<ConnectionDto | undefined> {
            return ipcRenderer.invoke(connectionManagerIpc_getActiveConnection)
        },
        onConnectionActivation(listener: (activated: ConnectionDto) => void): void {
            ipcRenderer.on(connectionManagerIpc_onConnectionActivation, (_event, activated) => listener(activated))
        },
        onConnectionsChange(listener: (connections: ConnectionDto[]) => void): void {
            ipcRenderer.on(connectionManagerIpc_onConnectionsChange, (_event, connections) => listener(connections))
        },
        onDriverUpdateAvailable(listener: (connectionId: ConnectionId) => void) {
            ipcRenderer.on(connectionManagerIpc_onDriverUpdateAvailable, (_event, connectionId) => listener(connectionId))
        }
    } as FrontendConnectionManagerIpc)
}
