import WebContents = Electron.WebContents
import { NotificationDefinition } from './NotificationDefinition'
import { NotificationId } from './NotificationId'
import {
    notificationManagerIpc_onNotificationClicked,
    notificationManagerIpc_onNotificationClosed
} from '../../../common/ipc/notification/service/NotificationManagerIpc'
import { NotificationSeverity } from './NotificationSeverity'
import { NotificationSource } from './NotificationSource'

/**
 * Represents created/alive notification
 */
export class Notification extends NotificationDefinition {
    readonly id: NotificationId
    readonly sender: WebContents

    constructor(id: NotificationId,
                sender: WebContents,
                severity: NotificationSeverity,
                source: NotificationSource,
                message: string) {
        super(severity, source, message)
        this.id = id
        this.sender = sender
    }

    click(): void {
        this.sender.send(notificationManagerIpc_onNotificationClicked, this.id)
    }

    close(): void {
        this.sender.send(notificationManagerIpc_onNotificationClosed, this.id)
    }
}
