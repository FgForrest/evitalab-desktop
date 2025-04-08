import { NotificationDefinitionDto } from '../../../../../common/ipc/notification/model/NotificationDefinitionDto'
import { NotificationId } from '../../../../../main/notification/model/NotificationId'
import { contextBridge, ipcRenderer } from 'electron'

/**
 * Interface of notification manager IPC for driver
 */
export interface FrontendNotificationManagerIpc {
    addNotification(definition: NotificationDefinitionDto): Promise<NotificationId>,
    requestNotificationClosure(id: NotificationId): void,

    onNotificationClicked(listener: (id: NotificationId) => void): void,
    onNotificationClosed(listener: (id: NotificationId) => void): void
}

/**
 * Implementation of notification manager IPC for driver.
 */
export function exposeFrontendNotificationManagerIpc(): void {
    contextBridge.exposeInMainWorld('labNotificationManager', {
        // todo lho fix vite cannot build two preloads with shared imported constants
        addNotification(definition: NotificationDefinitionDto): Promise<NotificationId> {
            return ipcRenderer.invoke('notificationManager:addNotification', definition)
        },
        requestNotificationClosure(id: NotificationId): void {
            ipcRenderer.send('notificationManager:requestNotificationClosure', id)
        },

        onNotificationClicked(listener: (id: NotificationId) => void): void {
            ipcRenderer.on(
                'notificationManager:onNotificationClicked',
                (_event, id) => listener(id)
            )
        },
        onNotificationClosed(listener: (id: NotificationId) => void): void {
            ipcRenderer.on(
                'notificationManager:onNotificationClosed',
                (_event, id) => listener(id)
            )
        }
    } as FrontendNotificationManagerIpc)
}
