import { NotificationId } from '../../../../../main/notification/model/NotificationId'
import { NotificationDto } from '../../../../../common/ipc/notification/model/NotificationDto'
import { contextBridge, ipcRenderer } from 'electron'
import {
    servicingNotificationManagerIpc_notificationClicked,
    servicingNotificationManagerIpc_notificationClosed, servicingNotificationManagerIpc_onNotificationClosureRequested,
    servicingNotificationManagerIpc_onNotificationCreated
} from '../../../../../common/ipc/notification/service/ServicingNotificationManagerIpc'

/**
 * Interface of notification manager IPC for frontend renderer for notification servicing tasks
 */
export interface FrontendServicingNotificationManagerIpc {
    notificationClicked(id: NotificationId): void,
    notificationClosed(id: NotificationId): void,

    onNotificationCreated(listener: (notification: NotificationDto) => void): void,
    onNotificationClosureRequested(listener: (id: NotificationId) => void): void
}

export function exposeFrontendServicingNotificationManagerIpc(): void {
    contextBridge.exposeInMainWorld('labServicingNotificationManager', {
        notificationClicked(id: NotificationId): void {
            ipcRenderer.send(servicingNotificationManagerIpc_notificationClicked, id)
        },
        notificationClosed(id: NotificationId): void {
            ipcRenderer.send(servicingNotificationManagerIpc_notificationClosed, id)
        },

        onNotificationCreated(listener: (notification: NotificationDto) => void): void {
            ipcRenderer.on(
                servicingNotificationManagerIpc_onNotificationCreated,
                (_event, connection) => listener(connection)
            )
        },
        onNotificationClosureRequested(listener: (id: NotificationId) => void) {
            ipcRenderer.on(
                servicingNotificationManagerIpc_onNotificationClosureRequested,
                (_event, id) => listener(id)
            )
        }
    } as FrontendServicingNotificationManagerIpc)
}
