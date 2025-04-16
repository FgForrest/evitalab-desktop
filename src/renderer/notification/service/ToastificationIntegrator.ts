import { ToastInterface } from 'vue-toastification/src/ts/interface'
import { TYPE } from 'vue-toastification/src/ts/constants'
import {
    FrontendServicingNotificationManagerIpc
} from '../../../preload/renderer/ipc/notification/service/FrontendServicingNotificationManagerIpc'
import { NotificationSeverity } from '../../../main/notification/model/NotificationSeverity'
import { NotificationDto } from '../../../common/ipc/notification/model/NotificationDto'

const notificationSeverityToToastIconMapping: Map<string, string> = new Map([
    [NotificationSeverity.Success, 'check-circle-outline'],
    [NotificationSeverity.Info, 'information-outline'],
    [NotificationSeverity.Warning, 'mdi-alert-outline'],
    [NotificationSeverity.Error, 'alert-circle-outline']
])
const notificationSeverityToToastTypeMapping: Map<string, TYPE> = new Map([
    [NotificationSeverity.Success, TYPE.SUCCESS],
    [NotificationSeverity.Info, TYPE.INFO],
    [NotificationSeverity.Warning, TYPE.WARNING],
    [NotificationSeverity.Error, TYPE.ERROR]
])

/**
 * Wrapper around the toastification plugin. Provides a more convenient API for firing toast notifications
 * with built-in features specific to evitaLab needs.
 */
export class ToastificationIntegrator {

    private constructor() {
        // integrator cannot be instantiated
    }

    static integrate(toast: ToastInterface): void {
        const servicingNotificationManager: FrontendServicingNotificationManagerIpc = window.labServicingNotificationManager

        servicingNotificationManager.onNotificationCreated((notification) => {
            this.createToast(toast, servicingNotificationManager, notification)
        })
        servicingNotificationManager.onNotificationClosureRequested((id) => {
            toast.dismiss(id)
        })
    }

    private static createToast(toast: ToastInterface,
                               servicingNotificationManager: FrontendServicingNotificationManagerIpc,
                               notification: NotificationDto) {
        toast(
            notification.message.length > 65
                ? notification.message.substring(0, 62) + '...'
                : notification.message,
            {
                id: notification.id,
                type: notificationSeverityToToastTypeMapping.get(notification.severity),
                icon: `mdi mdi-${notificationSeverityToToastIconMapping.get(notification.severity)}`,
                onClick: () => servicingNotificationManager.notificationClicked(notification.id),
                onClose: () => servicingNotificationManager.notificationClosed(notification.id)
            }
        )
    }
}
