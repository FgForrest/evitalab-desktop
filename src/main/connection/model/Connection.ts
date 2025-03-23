import { ConnectionId } from './ConnectionId'
import XXH, { HashObject } from 'xxhashjs'
import { ConnectionStyling } from './ConnectionStyling'

const hasher: HashObject = XXH.h64()

/**
 * Represents a single connection to evitaDB server with associated driver.
 */
export class Connection {

    readonly id: ConnectionId
    name: string
    serverUrl: string
    driverVersion: string

    readonly styling: ConnectionStyling

    constructor(id: ConnectionId | undefined,
                name: string,
                serverUrl: string,
                driverVersion: string,
                styling: ConnectionStyling) {
        this.id = id ? id : hasher.update(name).digest().toString(16)
        this.name = name
        this.serverUrl = this.validateAndNormalizeUrl(serverUrl)
        this.driverVersion = driverVersion
        this.styling = styling
    }

    update(name: string, serverUrl: string, driverVersion: string, styling: ConnectionStyling): void {
        this.name = name
        this.serverUrl = serverUrl
        this.driverVersion = driverVersion
        this.styling.shortName = styling.shortName
        this.styling.color = styling.color
    }

    private validateAndNormalizeUrl(url: string): string {
        try {
            new URL(url)
        } catch (e) {
            throw new Error(`Server URL '${url}' is not valid URL.`)
        }
        return url.endsWith('/') ? url.substring(0, url.length - 1) : url
    }
}
