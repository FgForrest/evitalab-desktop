import { ConnectionId } from '../../connection/model/ConnectionId'
import { List } from 'immutable'
import { app } from 'electron'
import fs from 'node:fs/promises'
import { EventEmitter } from 'events'
import log from 'electron-log/main'
import { ConnectionEnvironment } from '../../connection/model/ConnectionEnvironment'

/**
 * Gets emitted when the app config gets updated with new data
 */
export const CONFIG_EMIT_UPDATE = 'update'

/**
 * Holds entire evitaLab user-specific configuration for running the app.
 */
export class AppConfig extends EventEmitter {

    private _connections: List<ConnectionConfig> = List()

    async init(): Promise<void> {
        try {
            const storedConfig: string = await fs.readFile(this.configPath, 'utf-8')
            if (storedConfig.length > 0) {
                const parsedConfig: StorableConfig = JSON.parse(storedConfig) as StorableConfig
                this._connections = List(parsedConfig.connections)
            }
        } catch (e) {
            log.error('Could not load stored app config: ', e.message)
        }
        this.emitUpdated()
    }

    get connections(): List<ConnectionConfig> {
        return this._connections
    }

    async updateConnections(connections: List<ConnectionConfig>): Promise<void> {
        this._connections = connections
        await this.updated()
    }

    private async updated(): Promise<void> {
        this.emitUpdated()
        await this.storeConfig()
    }

    private async storeConfig(): Promise<void> {
        const configToStore: StorableConfig = {
            connections: this._connections.toArray()
        }
        const serializedConfig: string = JSON.stringify(configToStore)
        await fs.writeFile(this.configPath, serializedConfig, 'utf-8')
        log.info('Updated app config stored.')
    }

    private emitUpdated() {
        this.emit(CONFIG_EMIT_UPDATE, this)
    }

    private get configPath(): string {
        return `${app.getPath('userData')}/config.json`
    }
}

export interface ConnectionConfig {

    readonly id: ConnectionId
    readonly name: string
    readonly serverUrl: string
    readonly driverVersion: string

    readonly styling: ConnectionStylingConfig
}

export interface ConnectionStylingConfig {

    readonly color: string | undefined
    readonly environment: ConnectionEnvironment | undefined
}

interface StorableConfig {
    connections: ConnectionConfig[]
}
