import { ConnectionId } from '../model/ConnectionId'
import { Connection } from '../model/Connection'
import { List } from 'immutable'
import {
    connectionManagerApi_onConnectionActivation,
    connectionManagerApi_onConnectionsChange
} from '../../../preload/api/ConnectionManagerApi'
import { SkeletonManager } from '../../skeleton/service/SkeletonManager'
import { ModalManager } from '../../modal/service/ModalManager'

/**
 * Manages all evitaDB server connections. This is the main part of the desktop wrapper.
 */
export class ConnectionManager {

    private readonly skeletonManager: SkeletonManager
    private readonly modalManager: ModalManager

    private readonly _connections: Map<ConnectionId, Connection>
    private _activeConnection: ConnectionId | undefined
    private readonly onActivateConnectionCallbacks: ((newConnection: Connection) => void)[] = []

    constructor(skeletonManager: SkeletonManager,
                modalManager: ModalManager) {
        this.skeletonManager = skeletonManager
        this.modalManager = modalManager
        // todo lho temporary
        this._connections = new Map([
            ['con-1', new Connection('con-1', 'Connection 1', 'https://demo.evitadb.io:5555', '1')],
            ['con-2', new Connection('con-2', 'Connection 2', 'https://demo.evitadb.io:5555', '1')]
        ]);
    }

    get activeConnection(): Connection | undefined {
        if (this._activeConnection == undefined) {
            return undefined
        }
        return this._connections.get(this._activeConnection)
    }

    get connections(): List<Connection> {
        return List(Array.from(this._connections.values()))
    }

    activateConnection(connectionId: ConnectionId | undefined): void {
        if (connectionId != undefined && !this._connections.has(connectionId)) {
            throw new Error(`Cannot activate connection ${connectionId}, it doesn't exist.`)
        }
        this._activeConnection = connectionId
        this.notifyConnectionActivated()
    }

    addOnActivateConnectionCallback(callback: (newConnection: Connection | undefined) => void): void {
        this.onActivateConnectionCallbacks.push(callback)
    }

    addConnection(connection: Connection): void {
        if (this._connections.has(connection.id)) {
            throw new Error(`Connection ${connection.id} already exists.`);
        }
        this._connections.set(connection.id, connection);
        this.notifyConnectionsChange()
    }

    removeConnection(connectionId: ConnectionId): void {
        this._connections.delete(connectionId);
        this.notifyConnectionsChange()
    }

    private notifyConnectionActivated(): void {
        const activatedConnection: Connection | undefined = this.activeConnection

        this.onActivateConnectionCallbacks.forEach(callback => callback(activatedConnection))

        this.skeletonManager.skeletonWindow.webContents.send(connectionManagerApi_onConnectionActivation, activatedConnection)
        this.modalManager.modals.forEach(modal =>
            modal.webContents.send(connectionManagerApi_onConnectionActivation, activatedConnection))
    }

    private notifyConnectionsChange(): void {
        const connections: Connection[] = this.connections.toArray()
        this.skeletonManager.skeletonWindow.webContents.send(connectionManagerApi_onConnectionsChange, connections)
        this.modalManager.modals.forEach(modal =>
            modal.webContents.send(connectionManagerApi_onConnectionsChange, connections))
    }
}
