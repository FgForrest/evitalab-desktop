import { contextBridge, ipcRenderer } from 'electron'
import { ConnectionId } from '../../main/connection/model/ConnectionId'
import { Connection } from '../../main/connection/model/Connection'

/**
 * Exposes connection manager to renderer
 */
export type ConnectionManagerApi = {
    activateConnection(connectionId: ConnectionId | undefined): void,
    connections(): Promise<Connection[]>
}

export const connectionManagerApi_activateConnection = 'connectionManager:activateConnection'
export const connectionManagerApi_connections = 'connectionManager:connections'

export function exposeConnectionManagerApi(): void {
    contextBridge.exposeInMainWorld('connectionManager', {
        activateConnection: (connectionId: ConnectionId | undefined) => ipcRenderer.send(connectionManagerApi_activateConnection, connectionId),
        connections: () => ipcRenderer.invoke(connectionManagerApi_connections),
    } as ConnectionManagerApi)
}
