import { ConnectionId } from '../model/ConnectionId'
import { Connection } from '../model/Connection'
import { List } from 'immutable'
import { AppConfig } from '../../config/model/AppConfig'
import { EventEmitter } from 'events'
import { ConnectionStyling } from '../model/ConnectionStyling'
import { DriverManager } from '../../driver/service/DriverManager'
import { Driver } from '../../driver/model/Driver'
import semver from 'semver/preload'
import log from 'electron-log/main'

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
 * Gets emitted when there is newer driver available for activated connection
 */
export const CONNECTION_MANAGER_EMIT_DRIVER_UPDATE_AVAILABLE = 'driverUpdateAvailable'

/**
 * Manages all evitaDB server connections. This is the main part of the desktop wrapper.
 */
export class ConnectionManager extends EventEmitter {

    private readonly appConfig: AppConfig
    private readonly driverManager: DriverManager

    private _connections: Map<ConnectionId, Connection> = new Map()
    private _activeConnection: ConnectionId | undefined = undefined

    private _connectionsCheckedForDriverUpdate: ConnectionId[] = []

    constructor(appConfig: AppConfig, driverManager: DriverManager) {
        super()
        this.appConfig = appConfig
        this.driverManager = driverManager
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
                                connectionConfig.styling.color,
                                connectionConfig.styling.environment
                            )
                        )
                        return [connectionConfig.id, connection] as [ConnectionId, Connection]
                    })
                    .toArray()
            )
            this.notifyConnectionsChange()
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

    getSimilarConnection(connectionName: string): Connection | undefined {
        const normalizedName: string = connectionName.trim().toLowerCase()
        for (const connection of this._connections.values()) {
            if (connection.name.trim().toLowerCase() === normalizedName) {
                return connection
            }
        }
        return undefined
    }

    async activateConnection(connectionId: ConnectionId | undefined): Promise<void> {
        if (connectionId != undefined && !this._connections.has(connectionId)) {
            throw new Error(`Cannot activate connection ${connectionId}, it doesn't exist.`)
        }
        this._activeConnection = connectionId

        if (connectionId != undefined) {
            // we don't want to wait for the update, just notify when we know it
            this.checkForDriverUpdate(connectionId).then()
        }
        this.notifyConnectionActivated()
    }

    async storeConnection(connection: Connection): Promise<void> {
        this._connections.set(connection.id, connection);

        this.resetDriverUpdateInfo(connection.id)

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

        await this.updateConnectionsConfig()
        this.notifyConnectionsChange()
    }

    private async checkForDriverUpdate(connectionId: ConnectionId): Promise<void> {
        if (!this._connectionsCheckedForDriverUpdate.includes(connectionId)) {
            try {
                const connection: Connection = this.getConnection(connectionId)
                const latestAvailableDriver: Driver = await this.driverManager.resolveLatestAvailableDriver(connection.serverUrl)
                if (semver.gt(latestAvailableDriver.version, connection.driverVersion)) {
                    this.emit(CONNECTION_MANAGER_EMIT_DRIVER_UPDATE_AVAILABLE, connectionId)
                }
                this._connectionsCheckedForDriverUpdate.push(connectionId)
            } catch (e) {
                log.warn(`Check for driver update wasn't successful for connection '${connectionId}': `, e)
            }
        }
    }

    private resetDriverUpdateInfo(connectionId: ConnectionId): void {
        const infoIndex: number = this._connectionsCheckedForDriverUpdate.findIndex(it => it === connectionId)
        if (infoIndex > -1) {
            this._connectionsCheckedForDriverUpdate.splice(infoIndex, 1)
        }
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
                        color: connection.styling.color,
                        environment: connection.styling.environment
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
