import log from 'electron-log/main'
import started from 'electron-squirrel-startup'
import { app, BrowserWindow, ipcMain } from 'electron'
import { AppConfig } from './config/model/AppConfig'
import { SkeletonManager } from './skeleton/service/SkeletonManager'
import { ModalManager } from './modal/service/ModalManager'
import {
    CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION,
    CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE,
    ConnectionManager
} from './connection/service/ConnectionManager'
import { DriverManager } from './driver/service/DriverManager'
import { InstanceManager } from './instance/service/InstanceManager'
import { Connection } from './connection/model/Connection'
import {
    connectionManagerApi_activateConnection,
    connectionManagerApi_addConnection,
    connectionManagerApi_connections,
    connectionManagerApi_onConnectionActivation,
    connectionManagerApi_onConnectionsChange
} from '../preload/api/ConnectionManagerApi'
import { ConnectionId } from './connection/model/ConnectionId'
import { modalManagerApi_closeModal, modalManagerApi_openModal } from '../preload/api/ModalManagerApi'
import IpcMainEvent = Electron.IpcMainEvent
import { NAVIGATION_PANEL_URL } from '../renderer/navigation-panel/navigationPanelConstants'

/**
 * Entrypoint of evitaLab app. Initializes the entire app.
 */
export async function initialize(): Promise<void> {
    log.initialize();

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

    // initialize structure
    initializeInterProcessCommunication(connectionManager, modalManager)
    await initSkeleton(skeletonManager, modalManager, connectionManager, instanceManager)
    await modalManager.initModal(NAVIGATION_PANEL_URL)

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
}

async function initSkeleton(skeletonManager: SkeletonManager,
                            modalManager: ModalManager,
                            connectionManager: ConnectionManager,
                            instanceManager: InstanceManager,): Promise<void> {
    const skeletonWindow: BrowserWindow = await skeletonManager.init()

    instanceManager.skeletonWindow = skeletonWindow
    modalManager.skeletonWindow = skeletonWindow

    connectionManager.on(CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION, (activatedConnection: Connection | undefined) => {
        instanceManager.activateInstance(activatedConnection)

        skeletonManager.skeletonWindow.webContents.send(connectionManagerApi_onConnectionActivation, activatedConnection)
        modalManager.modals.forEach(modal =>
            modal.webContents.send(connectionManagerApi_onConnectionActivation, activatedConnection))
    })
    connectionManager.on(CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE, (connections: Connection[]) => {
        skeletonManager.skeletonWindow.webContents.send(connectionManagerApi_onConnectionsChange, connections)
        modalManager.modals.forEach(modal =>
            modal.webContents.send(connectionManagerApi_onConnectionsChange, connections))
    })
}

function initializeInterProcessCommunication(connectionManager: ConnectionManager, modalManager: ModalManager) {
    ipcMain.on(
        connectionManagerApi_activateConnection,
        (event: IpcMainEvent, connectionId: ConnectionId | undefined) => {
            connectionManager.activateConnection(connectionId)
        }
    )
    ipcMain.on(
        connectionManagerApi_addConnection,
        (event: IpcMainEvent, connection: Connection) => {
            connectionManager.addConnection(connection)
        }
    )
    ipcMain.handle(
        connectionManagerApi_connections,
        () => {
            return connectionManager.connections.toArray()
        }
    )

    ipcMain.on(
        modalManagerApi_openModal,
        async (event: IpcMainEvent, url: string) => {
            await modalManager.openModal(url)
        }
    )
    ipcMain.on(
        modalManagerApi_closeModal,
        (event: IpcMainEvent, url: string) => {
            modalManager.closeModal(url)
        }
    )
}
