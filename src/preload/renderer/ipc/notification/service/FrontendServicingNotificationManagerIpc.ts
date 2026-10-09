import { NotificationId } from '../../../../../main/notification/model/NotificationId'
import { NotificationDto } from '../../../../../common/ipc/notification/model/NotificationDto'
import { NotificationHistoryEntryDto } from '../../../../../common/ipc/notification/model/NotificationHistoryEntryDto'
import { contextBridge, ipcRenderer } from 'electron'
import {
    servicingNotificationManagerIpc_getNotificationHistory,
    servicingNotificationManagerIpc_historyEntryClicked,
    servicingNotificationManagerIpc_markAllNotificationsRead,
    servicingNotificationManagerIpc_notificationClicked,
    servicingNotificationManagerIpc_notificationClosed,
    servicingNotificationManagerIpc_onHistoryChanged,
    servicingNotificationManagerIpc_onNotificationClosureRequested,
    servicingNotificationManagerIpc_onNotificationCreated
} from '../../../../../common/ipc/notification/service/ServicingNotificationManagerIpc'

/**
 * Interface of notification manager IPC for frontend renderer for notification servicing tasks
 */
export interface FrontendServicingNotificationManagerIpc {
    notificationClicked(id: NotificationId): void,
    notificationClosed(id: NotificationId): void,

    onNotificationCreated(listener: (notification: NotificationDto) => void): void,
    onNotificationClosureRequested(listener: (id: NotificationId) => void): void,

    getNotificationHistory(): Promise<NotificationHistoryEntryDto[]>,
    markAllNotificationsRead(): void,
    historyEntryClicked(id: NotificationId): void,
    onHistoryChanged(listener: (unreadCount: number) => void): void
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
        },

        getNotificationHistory(): Promise<NotificationHistoryEntryDto[]> {
            return ipcRenderer.invoke(servicingNotificationManagerIpc_getNotificationHistory)
        },
        markAllNotificationsRead(): void {
            ipcRenderer.send(servicingNotificationManagerIpc_markAllNotificationsRead)
        },
        historyEntryClicked(id: NotificationId): void {
            ipcRenderer.send(servicingNotificationManagerIpc_historyEntryClicked, id)
        },
        onHistoryChanged(listener: (unreadCount: number) => void): void {
            ipcRenderer.on(
                servicingNotificationManagerIpc_onHistoryChanged,
                (_event, unreadCount) => listener(unreadCount)
            )
        }
    } as FrontendServicingNotificationManagerIpc)
}
