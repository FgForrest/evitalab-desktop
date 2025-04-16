import { ConnectionId } from '../../connection/model/ConnectionId'
import { Connection } from '../../connection/model/Connection'

/**
 * Connection format needed by a driver
 */
export class PreconfiguredDriverConnection {

    readonly id: ConnectionId
    readonly name: string
    readonly serverUrl: string

    private constructor(id: ConnectionId, name: string, serverUrl: string) {
        this.id = id
        this.name = name
        this.serverUrl = serverUrl
    }

    static fromConnection(connection: Connection): PreconfiguredDriverConnection {
        return new PreconfiguredDriverConnection(
            connection.id,
            connection.name,
            connection.serverUrl
        )
    }
}
