import { ConnectionId } from '../../../../main/connection/model/ConnectionId'

/**
 * DTO of connection for IPC
 */
export type ConnectionDto = {

    readonly id: ConnectionId | undefined
    name: string
    serverUrl: string
    driverVersion: string
}
