import { Connection } from '../../connection/model/Connection'
import { PreconfiguredDriverConnection } from './PreconfiguredDriverConnection'

/**
 * Query parameters passed to a driver instance when its executable is loaded.
 */
export type DriverInstanceQuery = Record<string, string>

/**
 * Constructs query parameters configuring a driver instance for the passed connection.
 *
 * Every `evitalab-*` system property is base64-encoded, because the evitaLab core decodes all of them
 * from base64. Only the `evitalab` control marker is passed as a raw value.
 */
export function constructDriverInstanceQuery(connection: Connection): DriverInstanceQuery {
    return {
        'evitalab': 'true',
        'evitalab-server-name': btoa(`desktop-${connection.id}`),
        'evitalab-pconnections': btoa(JSON.stringify([PreconfiguredDriverConnection.fromConnection(connection)])),
        'evitalab-readonly': btoa('true')
    }
}
