import { ConnectionId } from '../../../../main/connection/model/ConnectionId'
import { ConnectionStylingDto } from './ConnectionStylingDto'

/**
 * DTO of connection for IPC
 */
export interface ConnectionDto {

    readonly id: ConnectionId | undefined
    name: string
    serverUrl: string
    driverVersion: string

    readonly styling: ConnectionStylingDto
}
