import log from 'electron-log/main'
import started from 'electron-squirrel-startup'
import { app, BrowserWindow, Menu } from 'electron'
import { AppConfig } from './config/model/AppConfig'
import { SkeletonManager } from './skeleton/service/SkeletonManager'
import { ModalManager } from './modal/service/ModalManager'
import {
    CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION, CONNECTION_MANAGER_EMIT_CONNECTION_CHANGE,
    ConnectionManager
} from './connection/service/ConnectionManager'
import { DriverManager } from './driver/service/DriverManager'
import { InstanceManager } from './instance/service/InstanceManager'
import { Connection } from './connection/model/Connection'
import { NAVIGATION_PANEL_URL } from '../renderer/navigation-panel/navigationPanelConstants'
import {
    initBackendConnectionManagerIpc
} from './ipc/connection/service/BackendConnectionManagerIpc'
import { initBackendModalManagerIpc } from './ipc/modal/service/BackendModalManagerIpc'
import { initBackendDriverManagerIpc } from './ipc/driver/service/BackendDriverManagerIpc'
import menu from './menu'
import { NotificationManager } from './notification/service/NotificationManager'
import { initBackendNotificationManagerIpc } from './ipc/notification/service/BackendNotificationManagerIpc'
import { AppUpdateManager } from './update/service/AppUpdateManager'
import { initBackendAppUpdateManagerIpc } from './ipc/update/service/BackendAppUpdateManagerIpc'
import { initializeLogger } from './log/logger'

/**
 * Entrypoint of evitaLab app. Initializes the entire app.
 */
export async function initialize(): Promise<void> {
    Menu.setApplicationMenu(menu)

    initializeLogger()

    log.log('Initializing app...')

    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    if (started) {
        app.quit();
    }

    // initialize managers
    const appUpdateManager: AppUpdateManager = new AppUpdateManager()
    const appConfig: AppConfig = new AppConfig()
    const skeletonManager: SkeletonManager = new SkeletonManager()
    const notificationManager: NotificationManager = new NotificationManager()
    const modalManager: ModalManager = new ModalManager()
    const driverManager: DriverManager = new DriverManager()
    const connectionManager: ConnectionManager = new ConnectionManager(appConfig, driverManager)
    const instanceManager: InstanceManager = new InstanceManager(driverManager)

    // interconnect managers
    connectionManager.on(
        CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION,
        (activatedConnection: Connection | undefined) => {
            instanceManager.activateInstance(activatedConnection)
        }
    )
    connectionManager.on(
        CONNECTION_MANAGER_EMIT_CONNECTION_CHANGE,
        (connection: Connection) => {
            instanceManager.restartInstance(connection)
        }
    )

    // This method will wait for Electron until it has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    await app.whenReady()
    log.log('Electron app ready.')

    // update app if possible
    appUpdateManager.tryAutoUpdate()

    // initialize structure
    initBackendAppUpdateManagerIpc(appUpdateManager)
    initBackendNotificationManagerIpc(notificationManager)
    initBackendConnectionManagerIpc(skeletonManager, connectionManager, modalManager)
    initBackendModalManagerIpc(modalManager)
    initBackendDriverManagerIpc(driverManager)
    await initSkeleton(skeletonManager, notificationManager, modalManager, connectionManager, instanceManager)
    await notificationManager.init()
    await modalManager.initModal(NAVIGATION_PANEL_URL)

    log.log('App structure initialized.')

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', async () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            await initSkeleton(skeletonManager, notificationManager, modalManager, connectionManager, instanceManager);
        }
    });

    // initialize data
    await appConfig.init()
    connectionManager.init()

    log.log('App initialized.')
}

async function initSkeleton(skeletonManager: SkeletonManager,
                            notificationManager: NotificationManager,
                            modalManager: ModalManager,
                            connectionManager: ConnectionManager,
                            instanceManager: InstanceManager): Promise<void> {
    const skeletonWindow: BrowserWindow = await skeletonManager.init()

    // notification manager needs to know first to properly allocate space for the notification panel in
    // parent skeleton view
    notificationManager.skeletonWindow = skeletonWindow
    modalManager.skeletonWindow = skeletonWindow
    instanceManager.skeletonWindow = skeletonWindow

    skeletonWindow.on('close', () => {
        connectionManager.activateConnection(undefined)
        notificationManager.skeletonWindow = undefined
        modalManager.skeletonWindow = undefined
        instanceManager.skeletonWindow = undefined
    })
}
