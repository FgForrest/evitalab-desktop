import { NotificationSeverity } from './NotificationSeverity'
import { NotificationSource } from './NotificationSource'

/**
 * Blueprint for a new notification from an initiator
 */
export class NotificationDefinition {
    readonly severity: NotificationSeverity
    readonly source: NotificationSource
    readonly message: string

    constructor(severity: NotificationSeverity,
                source: NotificationSource,
                message: string) {
        this.severity = severity
        this.source = source
        this.message = message
    }
}
