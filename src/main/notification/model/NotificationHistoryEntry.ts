import { NotificationId } from './NotificationId'
import { NotificationSeverity } from './NotificationSeverity'
import { NotificationSource } from './NotificationSource'
import { Notification } from './Notification'

/**
 * A single entry in the notification history. Unlike a live {@link Notification} (which is
 * removed once its toast is closed), a history entry is kept in a bounded in-memory buffer so
 * the user can read the full content later in the notification center. It carries a reference to
 * the originating {@link Notification} for click routing (activating the source connection and
 * notifying the producer), and a mutable read flag driving the navigation badge.
 */
export class NotificationHistoryEntry {
    readonly id: NotificationId
    readonly severity: NotificationSeverity
    readonly source: NotificationSource
    readonly message: string
    readonly createdAt: Date
    /**
     * Live notification this entry originates from. Used for click routing only; its `sender`
     * may already be destroyed while the entry remains readable in history.
     */
    readonly notification: Notification
    read: boolean

    constructor(notification: Notification, createdAt: Date) {
        this.id = notification.id
        this.severity = notification.severity
        this.source = notification.source
        this.message = notification.message
        this.createdAt = createdAt
        this.notification = notification
        this.read = false
    }
}
