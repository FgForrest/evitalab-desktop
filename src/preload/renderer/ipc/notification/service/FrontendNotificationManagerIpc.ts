import { NotificationDefinitionDto } from '../../../../../common/ipc/notification/model/NotificationDefinitionDto'
import { NotificationId } from '../../../../../main/notification/model/NotificationId'
import { contextBridge, ipcRenderer } from 'electron'
import {
    notificationManagerIpc_addNotification, notificationManagerIpc_onNotificationClicked,
    notificationManagerIpc_onNotificationClosed, notificationManagerIpc_requestNotificationClosure
} from '../../../../../common/ipc/notification/service/NotificationManagerIpc'

/**
 * Interface of notification manager IPC for frontend renderer
 */
export interface FrontendNotificationManagerIpc {
    addNotification(definition: NotificationDefinitionDto): Promise<NotificationId>,
    requestNotificationClosure(id: NotificationId): void,

    onNotificationClicked(listener: (id: NotificationId) => void): void,
    onNotificationClosed(listener: (id: NotificationId) => void): void
}

/**
 * Implementation of notification manager IPC for frontend renderer.
 */
export function exposeFrontendNotificationManagerIpc(): void {
    contextBridge.exposeInMainWorld('labNotificationManager', {
        addNotification(definition: NotificationDefinitionDto): Promise<NotificationId> {
            return ipcRenderer.invoke(notificationManagerIpc_addNotification, definition)
        },
        requestNotificationClosure(id: NotificationId): void {
            ipcRenderer.send(notificationManagerIpc_requestNotificationClosure, id)
        },

        onNotificationClicked(listener: (id: NotificationId) => void): void {
            ipcRenderer.on(
                notificationManagerIpc_onNotificationClicked,
                (_event, id) => listener(id)
            )
        },
        onNotificationClosed(listener: (id: NotificationId) => void): void {
            ipcRenderer.on(
                notificationManagerIpc_onNotificationClosed,
                (_event, id) => listener(id)
            )
        }
    } as FrontendNotificationManagerIpc)
}
