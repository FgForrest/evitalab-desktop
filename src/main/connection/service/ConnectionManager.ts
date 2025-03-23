import { ConnectionId } from '../model/ConnectionId'
import { Connection } from '../model/Connection'
import { List } from 'immutable'
import { AppConfig } from '../../config/model/AppConfig'
import { EventEmitter } from 'events'
import { ConnectionStyling } from '../model/ConnectionStyling'

/**
 * Gets emitted when a connection was activated.
 */
export const CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION = 'connectionActivation'
/**
 * Gets emitted when a connection was created or changed.
 */
export const CONNECTION_MANAGER_EMIT_CONNECTION_CHANGE = 'connectionChange'
/**
 * Gets emitted when the connection list was changed.
 */
export const CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE = 'connectionsChange'

/**
 * Manages all evitaDB server connections. This is the main part of the desktop wrapper.
 */
export class ConnectionManager extends EventEmitter {

    private readonly appConfig: AppConfig

    private _connections: Map<ConnectionId, Connection> = new Map()
    private _activeConnection: ConnectionId | undefined = undefined

    constructor(appConfig: AppConfig) {
        super()
        this.appConfig = appConfig
    }

    init(): void {
        if (!this.appConfig.connections.isEmpty()) {
            this._connections = new Map(
                this.appConfig.connections
                    .map(connectionConfig => {
                        const connection: Connection = new Connection(
                            connectionConfig.id,
                            connectionConfig.name,
                            connectionConfig.serverUrl,
                            connectionConfig.driverVersion,
                            new ConnectionStyling(
                                connectionConfig.styling.shortName,
                                connectionConfig.styling.color
                            )
                        )
                        return [connectionConfig.id, connection] as [ConnectionId, Connection]
                    })
                    .toArray()
            )
            this.notifyConnectionsChange()
        }
        if (this.appConfig.activeConnection != undefined) {
            this._activeConnection = this.appConfig.activeConnection
            this.notifyConnectionActivated()
        }
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

    getConnection(connectionId: ConnectionId): Connection | undefined {
        return this._connections.get(connectionId)
    }

    async activateConnection(connectionId: ConnectionId | undefined): Promise<void> {
        if (connectionId != undefined && !this._connections.has(connectionId)) {
            throw new Error(`Cannot activate connection ${connectionId}, it doesn't exist.`)
        }
        this._activeConnection = connectionId

        await this.updateActiveConnectionConfig()
        this.notifyConnectionActivated()
    }

    async storeConnection(connection: Connection): Promise<void> {
        this._connections.set(connection.id, connection);

        await this.updateConnectionsConfig()
        this.notifyConnectionChange(connection)
        this.notifyConnectionsChange()
    }

    async storeConnectionsOrder(newOrder: ConnectionId[]): Promise<void> {
        if (newOrder.length != this._connections.size) {
            throw new Error('Cannot reorder connections, sorted list doesn\'t contains same connections')
        }

        const sortedConnections: Map<ConnectionId, Connection> = new Map()
        for (const connectionId of newOrder) {
            const connection: Connection = this._connections.get(connectionId)
            if (connection == undefined) {
                throw new Error(`Sorted connection '${connectionId}' doesn't exist.`)
            }
            sortedConnections.set(connectionId, connection)
        }
        this._connections = sortedConnections

        await this.updateConnectionsConfig()
        this.notifyConnectionsChange()
    }

    async removeConnection(connectionId: ConnectionId): Promise<void> {
        if (this._activeConnection === connectionId) {
            await this.activateConnection(undefined)
        }
        this._connections.delete(connectionId);

        await this.updateActiveConnectionConfig()
        await this.updateConnectionsConfig()
        this.notifyConnectionsChange()
    }

    private updateActiveConnectionConfig(): Promise<void> {
        return this.appConfig.updateActiveConnection(this._activeConnection)
    }

    private updateConnectionsConfig(): Promise<void> {
        return this.appConfig.updateConnections(
            this.connections.map(connection => {
                return {
                    id: connection.id,
                    name: connection.name,
                    serverUrl: connection.serverUrl,
                    driverVersion: connection.driverVersion,
                    styling: {
                        shortName: connection.styling.shortName,
                        color: connection.styling.color
                    }
                }
            })
        )
    }

    private notifyConnectionActivated(): void {
        const activatedConnection: Connection | undefined = this.activeConnection
        this.emit(CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION, activatedConnection)
    }

    private notifyConnectionChange(connection: Connection): void {
        this.emit(CONNECTION_MANAGER_EMIT_CONNECTION_CHANGE, connection)
    }

    private notifyConnectionsChange(): void {
        const connections: Connection[] = this.connections.toArray()
        this.emit(CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE, connections)
    }
}
