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

/**
 * Entrypoint of evitaLab app. Initializes the entire app.
 */
export async function initialize(): Promise<void> {
    Menu.setApplicationMenu(menu)

    log.initialize();
    log.log('Initializing app...')

    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    if (started) {
        app.quit();
    }

    // initialize managers
    const appConfig: AppConfig = new AppConfig()
    const skeletonManager: SkeletonManager = new SkeletonManager()
    const modalManager: ModalManager = new ModalManager()
    const connectionManager: ConnectionManager = new ConnectionManager(appConfig)
    const driverManager: DriverManager = new DriverManager()
    const instanceManager: InstanceManager = new InstanceManager(driverManager)

    // This method will wait for Electron until it has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    await app.whenReady()
    log.log('Electron app ready.')

    // initialize structure
    initBackendConnectionManagerIpc(skeletonManager, connectionManager, modalManager)
    initBackendModalManagerIpc(modalManager)
    initBackendDriverManagerIpc(driverManager)
    await initSkeleton(skeletonManager, modalManager, connectionManager, instanceManager)
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
            await initSkeleton(skeletonManager, modalManager, connectionManager, instanceManager);
        }
    });

    // initialize data
    await appConfig.init()
    connectionManager.init()

    log.log('App initialized.')
}

async function initSkeleton(skeletonManager: SkeletonManager,
                            modalManager: ModalManager,
                            connectionManager: ConnectionManager,
                            instanceManager: InstanceManager): Promise<void> {
    const skeletonWindow: BrowserWindow = await skeletonManager.init()

    instanceManager.skeletonWindow = skeletonWindow
    modalManager.skeletonWindow = skeletonWindow

    skeletonWindow.on('close', () => connectionManager.activateConnection(undefined))

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
}
