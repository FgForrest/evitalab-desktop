import { BrowserWindow, WebContentsView } from 'electron'
import path from 'path'
import Rectangle = Electron.Rectangle
import debounce from '../../util/debounce'
import WebContents = Electron.WebContents
import { NotificationDefinition } from '../model/NotificationDefinition'
import { NotificationId } from '../model/NotificationId'
import { v4 as uuidv4 } from 'uuid'
import { Notification } from '../model/Notification'
import { EventEmitter } from 'events'

// these must be aligned with toastification renderer
const toastWidth = 592
const toastHeight = 70
const toastMarginBottom = 16
//
const toastAreaMargin = 20
const toastAreaWidth = toastWidth + (2 * toastAreaMargin)
//
const maxDisplayedToastCount = 5

const NOTIFICATION_PANEL_PATH = '/src/renderer/notification/panel/notification-panel.html'

/**
 * Gets emitted when new notification has been created
 */
export const NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CREATE = 'notificationCreate'
/**
 * Gets emitted when notification has been requested for closure
 */
export const NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CLOSURE_REQUEST = 'notificationClosureRequest'

export class NotificationManager extends EventEmitter {

    private _skeletonWindow: BrowserWindow | undefined = undefined
    private _notificationPanel: WebContentsView | undefined = undefined

    private readonly _notifications: Map<string, Notification> = new Map()

    constructor() {
        super()
    }

    set skeletonWindow(skeletonWindow: BrowserWindow | undefined) {
        this._skeletonWindow = skeletonWindow
        if (skeletonWindow != undefined && this._notificationPanel != undefined) {
            this.registerSkeletonListenersForNotificationPanel(this._notificationPanel)
            this.addNotificationPanelToSkeleton()
        }
    }

    addNotification(sender: WebContents, definition: NotificationDefinition): NotificationId {
        this.assertInitialized()

        const id: NotificationId = uuidv4()
        const newNotification: Notification = new Notification(id, sender, definition.severity, definition.source, definition.message)
        this._notifications.set(id, newNotification)
        this.updatePanelBounds()
        this.emit(NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CREATE, this._notificationPanel, newNotification)

        return id
    }

    requestNotificationClosure(id: NotificationId): void {
        if (this._notifications.has(id)) {
            this.emit(NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CLOSURE_REQUEST, this._notificationPanel, id)
        }
    }

    notificationClicked(id: NotificationId): void {
        const notification: Notification | undefined = this._notifications.get(id)
        if (notification != undefined) {
            notification.click()
        }
    }

    notificationClosed(id: NotificationId): void {
        const notification: Notification | undefined = this._notifications.get(id)
        if (notification != undefined) {
            notification.close()
            this._notifications.delete(id)
            this.updatePanelBounds(400) // wait for toast exit animation to finish
        }
    }

    async init(): Promise<void> {
        this.assertSkeletonInitialized()
        if (this._notificationPanel != undefined) {
            throw new Error('Notification panel already initialized.')
        }

        const notificationPanel: WebContentsView = new WebContentsView({
            webPreferences: {
                preload: path.join(__dirname, 'renderer-preload.js'),
            }
        })
        notificationPanel.setBackgroundColor('#00000000');
        notificationPanel.setBounds(this.constructViewBounds());
        notificationPanel.setVisible(true)

        this.registerSkeletonListenersForNotificationPanel(notificationPanel)

        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            await notificationPanel.webContents.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + NOTIFICATION_PANEL_PATH);
        } else {
            await notificationPanel.webContents.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}${NOTIFICATION_PANEL_PATH}`));
        }

        // manually uncomment for devtools
        // notificationPanel.webContents.openDevTools({ mode: 'detach' })

        this._notificationPanel = notificationPanel
        this.addNotificationPanelToSkeleton()
    }

    private registerSkeletonListenersForNotificationPanel(notificationPanel: WebContentsView): void {
        const resizer = debounce(
            () => notificationPanel.setBounds(this.constructViewBounds()),
            50
        )
        this._skeletonWindow.on('resize', resizer)
        this._skeletonWindow.on('maximize', resizer)
        this._skeletonWindow.on('unmaximize', resizer)
        this._skeletonWindow.on('enter-full-screen', resizer)
        this._skeletonWindow.on('leave-full-screen', resizer)
    }

    private addNotificationPanelToSkeleton(): void {
        this.assertInitialized()
        this.assertInitialized()

        // add as the top most view, even on top of modals
        this._skeletonWindow.contentView.addChildView(this._notificationPanel)
    }

    private updatePanelBounds(delay = 0): void {
        setTimeout(
            () => this._notificationPanel.setBounds(this.constructViewBounds()),
            delay
        )
    }

    private constructViewBounds(): Rectangle {
        const skeletonBounds: Rectangle = this._skeletonWindow.contentView.getBounds()

        let toastAreaHeight: number
        if (this._notifications.size === 0) {
            toastAreaHeight = 0
        } else {
            const displayedToastCount = Math.min(this._notifications.size, maxDisplayedToastCount)
            toastAreaHeight =
                ((toastHeight + toastMarginBottom) * displayedToastCount) +
                (toastAreaMargin * 2)
        }

        return {
            x: skeletonBounds.width - toastAreaWidth,
            y: skeletonBounds.height - toastAreaHeight,
            width: toastAreaWidth,
            height: toastAreaHeight
        };
    }

    private assertSkeletonInitialized(): void {
        if (this._skeletonWindow == undefined) {
            throw new Error('Skeleton is not initialized yet.')
        }
    }

    private assertInitialized(): void {
        if (this._notificationPanel == undefined) {
            throw new Error('Notification panel is not initialized yet.')
        }
    }
}
