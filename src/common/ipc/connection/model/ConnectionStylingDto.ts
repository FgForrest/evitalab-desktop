import { ConnectionEnvironment } from '../../../../main/connection/model/ConnectionEnvironment'

/**
 * DTO for connection styling for IPC
 */
export interface ConnectionStylingDto {
    color: string | undefined
    environment: ConnectionEnvironment | undefined
}
