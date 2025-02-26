import { ConnectionId } from '../model/ConnectionId'
import { Connection } from '../model/Connection'
import { List } from 'immutable'

/**
 * Manages all evitaDB server connections. This is the main part of the desktop wrapper.
 */
export class ConnectionManager {

    private readonly _connections: Map<ConnectionId, Connection>
    private _activeConnection: ConnectionId | undefined
    private readonly onActivateConnectionCallbacks: ((newConnection: Connection) => void)[] = []

    constructor() {
        // todo lho temporary
        this._connections = new Map([
            ['con-1', new Connection('con-1', 'Connection 1', 'https://demo.evitadb.io:5555', '1')],
            ['con-2', new Connection('con-2', 'Connection 2', 'https://demo.evitadb.io:5555', '1')]
        ]);
    }

    get activeConnection(): Connection {
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
        if (connectionId != undefined) {
            const newConnection: Connection = this._connections.get(connectionId)
            this.onActivateConnectionCallbacks.forEach(callback => callback(newConnection))
        } else {
            this.onActivateConnectionCallbacks.forEach(callback => callback(undefined))
        }
    }

    addOnActivateConnectionCallback(callback: (newConnection: Connection | undefined) => void): void {
        this.onActivateConnectionCallbacks.push(callback)
    }

    addConnection(connection: Connection): void {
        if (this._connections.has(connection.id)) {
            throw new Error(`Connection ${connection.id} already exists.`);
        }
        this._connections.set(connection.id, connection);
    }

    removeConnection(connectionId: ConnectionId): void {
        this._connections.delete(connectionId);
    }
}
