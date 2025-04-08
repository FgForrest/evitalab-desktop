import {
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
import { NotificationSourceConverter } from './NotificationSourceConverter'
import { NotificationDefinitionDto } from '../../../../common/ipc/notification/model/NotificationDefinitionDto'
import { NotificationDefinition } from '../../../notification/model/NotificationDefinition'
import { NotificationId } from '../../../notification/model/NotificationId'
import { Notification } from '../../../notification/model/Notification'
import { NotificationDto } from '../../../../common/ipc/notification/model/NotificationDto'
import {
    servicingNotificationManagerIpc_notificationClicked,
    servicingNotificationManagerIpc_notificationClosed, servicingNotificationManagerIpc_onNotificationClosureRequested,
    servicingNotificationManagerIpc_onNotificationCreated
} from '../../../../common/ipc/notification/service/ServicingNotificationManagerIpc'

const notificationSourceFactory: NotificationSourceConverter = new NotificationSourceConverter()

/**
 * Initializes implementation of notification manager IPC for backend.
 */
export function initBackendNotificationManagerIpc(notificationManager: NotificationManager): void {
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
