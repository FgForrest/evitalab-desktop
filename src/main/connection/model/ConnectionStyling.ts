import { ConnectionEnvironment } from './ConnectionEnvironment'

/**
 * User styling for connection
 */
export class ConnectionStyling {

    color: string | undefined
    environment: ConnectionEnvironment | undefined

    constructor(color: string | undefined, environment: ConnectionEnvironment | undefined) {
        this.color = color
        this.environment = environment
    }
}
