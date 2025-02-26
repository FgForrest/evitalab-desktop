import { app, BrowserWindow, ipcMain } from 'electron'
import started from 'electron-squirrel-startup'
import log from 'electron-log/main'
import IpcMainEvent = Electron.IpcMainEvent
import { SkeletonManager } from './skeleton/service/SkeletonManager'
import { ConnectionManager } from './connection/service/ConnectionManager'
import { DriverManager } from './driver/service/DriverManager'
import { InstanceManager } from './instance/service/InstanceManager'
import { ModalManager } from './modal/service/ModalManager'
import { ConnectionId } from './connection/model/ConnectionId'
import { Connection } from './connection/model/Connection'
import {
    connectionManagerApi_activateConnection,
    connectionManagerApi_connections
} from '../preload/api/ConnectionManagerApi'
import { modalManagerApi_closeModal, modalManagerApi_openModal } from '../preload/api/ModalManagerApi'

log.initialize();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

const skeletonManager: SkeletonManager = new SkeletonManager()
const modalManager: ModalManager = new ModalManager()
const connectionManager: ConnectionManager = new ConnectionManager()
const driverManager: DriverManager = new DriverManager()
const instanceManager: InstanceManager = new InstanceManager(driverManager)

async function initSkeleton(): Promise<void> {
    const skeletonWindow: BrowserWindow = await skeletonManager.init()

    instanceManager.skeletonWindow = skeletonWindow
    connectionManager.addOnActivateConnectionCallback((newConnection: Connection | undefined) => {
        instanceManager.activateInstance(newConnection)
    })

    modalManager.skeletonWindow = skeletonWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    ipcMain.on(
        connectionManagerApi_activateConnection,
        (event: IpcMainEvent, connectionId: ConnectionId | undefined) => { connectionManager.activateConnection(connectionId) }
    )
    ipcMain.handle(
        connectionManagerApi_connections,
        () => { return connectionManager.connections.toArray() }
    )

    ipcMain.on(
        modalManagerApi_openModal,
        async (event: IpcMainEvent, url: string) => { await modalManager.openModal(url) }
    )
    ipcMain.on(
        modalManagerApi_closeModal,
        (event: IpcMainEvent, url: string) => { modalManager.closeModal(url) }
    )

    await initSkeleton()
});

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
        await initSkeleton();
    }
});
