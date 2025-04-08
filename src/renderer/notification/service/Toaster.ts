import { InjectionKey } from 'vue'
import {
    FrontendNotificationManagerIpc
} from '../../../preload/renderer/ipc/notification/service/FrontendNotificationManagerIpc'
import { NotificationSeverity } from '../../../main/notification/model/NotificationSeverity'
import { NotificationSourceDto } from '../../../common/ipc/notification/model/NotificationSourceDto'
import { NotificationId } from '../../../main/notification/model/NotificationId'
import { mandatoryInject } from '../../util/reactivity'

export const toasterInjectionKey: InjectionKey<Toaster> = Symbol('toaster')

const notificationSource: NotificationSourceDto = { type: 'skeleton' }

/**
 * Executed when a notification has been clicked
 */
export type ToastClickCallback = (dismiss: () => void) => void

/**
 * Wrapper around the notification manager. Provides a more convenient API for firing toast notifications
 * with built-in features specific to evitaLab needs.
 */
export class Toaster {
    private readonly notificationManager: FrontendNotificationManagerIpc

    private readonly toastClickCallback: Map<NotificationId, ToastClickCallback> = new Map()

    constructor() {
        this.notificationManager = window.labNotificationManager

        this.notificationManager.onNotificationClicked((id) => {
            const callback: ToastClickCallback | undefined = this.toastClickCallback.get(id)
            if (callback != undefined) {
                callback(
                    () =>{
                        this.notificationManager.requestNotificationClosure(id)
                    }
                )
            }
        })
        this.notificationManager.onNotificationClosed((id) =>
            this.toastClickCallback.delete(id))
    }

    async success(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.addNotification(NotificationSeverity.Success, title, clickCallback)
    }

    async info(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.addNotification(NotificationSeverity.Info, title, clickCallback)
    }

    async warning(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.addNotification(NotificationSeverity.Warning, title, clickCallback)
    }

    async error(title: string, error?: Error, clickCallback?: ToastClickCallback): Promise<void> {
        if (error != undefined) {
            console.error(error)
        }
        await this.addNotification(NotificationSeverity.Error, title, clickCallback)
    }

    private async addNotification(severity: NotificationSeverity, title: string, clickCallback?: ToastClickCallback): Promise<void> {
        const id: NotificationId = await this.notificationManager.addNotification({
            severity,
            source: notificationSource,
            message: title
        })
        if (clickCallback != undefined) {
            this.toastClickCallback.set(id, clickCallback)
        }
    }
}

export const useToaster = (): Toaster => {
    return mandatoryInject(toasterInjectionKey) as Toaster
}
