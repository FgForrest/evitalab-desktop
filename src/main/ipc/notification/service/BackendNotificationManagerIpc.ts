import {
    NOTIFICATION_MANAGER_EMIT_HISTORY_CHANGE,
    NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CLOSURE_REQUEST,
    NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CREATE,
    NotificationManager
} from '../../../notification/service/NotificationManager'
import { ipcMain, WebContentsView } from 'electron'
import {
    notificationManagerIpc_addNotification,
    notificationManagerIpc_requestNotificationClosure
} from '../../../../common/ipc/notification/service/NotificationManagerIpc'
import IpcMainEvent = Electron.IpcMainEvent
import WebContents = Electron.WebContents
import { NotificationSourceConverter } from './NotificationSourceConverter'
import { NotificationDefinitionDto } from '../../../../common/ipc/notification/model/NotificationDefinitionDto'
import { NotificationDefinition } from '../../../notification/model/NotificationDefinition'
import { NotificationId } from '../../../notification/model/NotificationId'
import { Notification } from '../../../notification/model/Notification'
import { NotificationDto } from '../../../../common/ipc/notification/model/NotificationDto'
import { NotificationHistoryEntry } from '../../../notification/model/NotificationHistoryEntry'
import { NotificationHistoryEntryDto } from '../../../../common/ipc/notification/model/NotificationHistoryEntryDto'
import {
    servicingNotificationManagerIpc_getNotificationHistory,
    servicingNotificationManagerIpc_historyEntryClicked,
    servicingNotificationManagerIpc_markAllNotificationsRead,
    servicingNotificationManagerIpc_notificationClicked,
    servicingNotificationManagerIpc_notificationClosed,
    servicingNotificationManagerIpc_onHistoryChanged,
    servicingNotificationManagerIpc_onNotificationClosureRequested,
    servicingNotificationManagerIpc_onNotificationCreated
} from '../../../../common/ipc/notification/service/ServicingNotificationManagerIpc'
import { SkeletonManager } from '../../../skeleton/service/SkeletonManager'
import { ModalManager } from '../../../modal/service/ModalManager'

const notificationSourceFactory: NotificationSourceConverter = new NotificationSourceConverter()

/**
 * Initializes implementation of notification manager IPC for backend.
 */
export function initBackendNotificationManagerIpc(notificationManager: NotificationManager,
                                                  skeletonManager: SkeletonManager,
                                                  modalManager: ModalManager): void {
    ipcMain.handle(
        notificationManagerIpc_addNotification,
        (event: IpcMainEvent, definition: NotificationDefinitionDto): NotificationId => {
            return notificationManager.addNotification(event.sender, parseNotificationDefinitionDto(definition))
        }
    )
    ipcMain.on(
        notificationManagerIpc_requestNotificationClosure,
        (event: IpcMainEvent, id: NotificationId): void => {
            notificationManager.requestNotificationClosure(id)
        }
    )
    notificationManager.on(
        NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CLOSURE_REQUEST,
        (target: WebContentsView, id: NotificationId): void => {
            emitNotificationClosureRequested(target, id)
        }
    )


    notificationManager.on(
        NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CREATE,
        (target: WebContentsView, notification: Notification) => {
            emitNotificationCreated(target, notification)
        }
    )
    ipcMain.on(
        servicingNotificationManagerIpc_notificationClicked,
        (event: IpcMainEvent, notificationId: NotificationId): void => {
            notificationManager.notificationClicked(notificationId)
        }
    )
    ipcMain.on(
        servicingNotificationManagerIpc_notificationClosed,
        (event: IpcMainEvent, notificationId: NotificationId): void => {
            notificationManager.notificationClosed(notificationId)
        }
    )

    ipcMain.handle(
        servicingNotificationManagerIpc_getNotificationHistory,
        (): NotificationHistoryEntryDto[] => {
            return notificationManager.getHistory().map(createNotificationHistoryEntryDto)
        }
    )
    ipcMain.on(
        servicingNotificationManagerIpc_markAllNotificationsRead,
        (): void => {
            notificationManager.markAllAsRead()
        }
    )
    ipcMain.on(
        servicingNotificationManagerIpc_historyEntryClicked,
        (event: IpcMainEvent, notificationId: NotificationId): void => {
            notificationManager.historyEntryClicked(notificationId)
        }
    )
    notificationManager.on(
        NOTIFICATION_MANAGER_EMIT_HISTORY_CHANGE,
        (unreadCount: number): void => {
            // the unread badge lives in the skeleton navigation rail and the notification center
            // is a modal, so both need the update
            emitHistoryChanged(safeWebContents(() => skeletonManager.skeletonWindow.webContents), unreadCount)
            modalManager.modals.forEach(modal =>
                emitHistoryChanged(modal.webContents, unreadCount))
        }
    )
}

function safeWebContents(supplier: () => WebContents): WebContents | undefined {
    try {
        return supplier()
    } catch (e) {
        // skeleton window may not be initialized (e.g. mid-teardown)
        return undefined
    }
}

function emitHistoryChanged(target: WebContents | undefined, unreadCount: number): void {
    if (target == undefined || target.isDestroyed()) {
        return
    }
    target.send(servicingNotificationManagerIpc_onHistoryChanged, unreadCount)
}

function emitNotificationCreated(target: WebContentsView, notification: Notification): void {
    target.webContents.send(servicingNotificationManagerIpc_onNotificationCreated, createNotificationDto(notification))
}

function emitNotificationClosureRequested(target: WebContentsView, id: NotificationId): void {
    target.webContents.send(servicingNotificationManagerIpc_onNotificationClosureRequested, id)
}

function parseNotificationDefinitionDto(dto: NotificationDefinitionDto): NotificationDefinition {
    return new NotificationDefinition(
        dto.severity,
        notificationSourceFactory.convertFromDto(dto.source),
        dto.message
    )
}

function createNotificationDto(notification: Notification): NotificationDto {
    return {
        id: notification.id,
        severity: notification.severity,
        source: notificationSourceFactory.convertToDto(notification.source),
        message: notification.message
    } as NotificationDto
}

function createNotificationHistoryEntryDto(entry: NotificationHistoryEntry): NotificationHistoryEntryDto {
    return {
        id: entry.id,
        severity: entry.severity,
        source: notificationSourceFactory.convertToDto(entry.source),
        message: entry.message,
        createdAt: entry.createdAt.toISOString(),
        read: entry.read
    } as NotificationHistoryEntryDto
}
