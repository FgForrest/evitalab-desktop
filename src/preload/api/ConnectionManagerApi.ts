import { contextBridge, ipcRenderer } from 'electron'
import { ConnectionId } from '../../main/connection/model/ConnectionId'
import { Connection } from '../../main/connection/model/Connection'

/**
 * Exposes connection manager to renderer
 */
export type ConnectionManagerApi = {
    activateConnection(connectionId: ConnectionId | undefined): void,
    addConnection(connection: Connection): void,
    connections(): Promise<Connection[]>,
    onConnectionActivation(listener: (activated: Connection | undefined) => void): void
    onConnectionsChange(listener: (connections: Connection[]) => void): void
}

export const connectionManagerApi_activateConnection = 'connectionManager:activateConnection'
export const connectionManagerApi_addConnection = 'connectionManager:addConnection'
export const connectionManagerApi_connections = 'connectionManager:connections'
export const connectionManagerApi_onConnectionActivation = 'connectionManager:onConnectionActivation'
export const connectionManagerApi_onConnectionsChange = 'connectionManager:onConnectionsChange'

export function exposeConnectionManagerApi(): void {
    contextBridge.exposeInMainWorld('connectionManager', {
        activateConnection: (connectionId: ConnectionId | undefined) => ipcRenderer.send(connectionManagerApi_activateConnection, connectionId),
        addConnection: (connection: Connection) => ipcRenderer.send(connectionManagerApi_addConnection, connection),
        connections: () => ipcRenderer.invoke(connectionManagerApi_connections),
        onConnectionActivation: (listener: (activated: Connection) => void) =>
            ipcRenderer.on(connectionManagerApi_onConnectionActivation, (_event, activated) => listener(activated)),
        onConnectionsChange: (listener: (connections: Connection[]) => void) =>
            ipcRenderer.on(connectionManagerApi_onConnectionsChange, (_event, connections) => listener(connections))
    } as ConnectionManagerApi)
}
