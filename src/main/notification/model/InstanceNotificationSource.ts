import { NotificationSource } from './NotificationSource'
import { ConnectionId } from '../../connection/model/ConnectionId'

export const instanceNotificationSourceType = 'instance'

/**
 * Represents a notification from an instance (connection + driver).
 */
export class InstanceNotificationSource implements NotificationSource {

    readonly type = instanceNotificationSourceType
    readonly connectionId: ConnectionId

    constructor(connectionId: ConnectionId) {
        this.connectionId = connectionId
    }
}
