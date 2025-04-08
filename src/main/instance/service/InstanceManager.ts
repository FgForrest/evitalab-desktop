import { ConnectionId } from '../../connection/model/ConnectionId'
import { BrowserWindow, WebContentsView } from 'electron'
import path from 'path'
import { Connection } from '../../connection/model/Connection'
import { PreconfiguredDriverConnection } from '../model/PreconfiguredDriverConnection'
import { DriverManager } from '../../driver/service/DriverManager'
import { Driver } from '../../driver/model/Driver'
import LoadFileOptions = Electron.LoadFileOptions
import Rectangle = Electron.Rectangle
import debounce from '../../util/debounce'

/**
 * Instance represents alive connection, that is a browser view with correct driver connection to a specific evitaDB server.
 * This manager manages browser views for individual connections
 */
export class InstanceManager {

    private _skeletonWindow: BrowserWindow | undefined = undefined
    private readonly driverManager: DriverManager

    private readonly instances: Map<ConnectionId, WebContentsView> = new Map()
    private activeInstance: ConnectionId | undefined

    constructor(driverManager: DriverManager) {
        this.driverManager = driverManager
    }

    set skeletonWindow(skeletonWindow: BrowserWindow | undefined) {
        this._skeletonWindow = skeletonWindow
        if (skeletonWindow != undefined) {
            this.instances.forEach((instance) =>
                this.registerSkeletonListenersForInstance(instance))
        }
    }

    async activateInstance(connection: Connection | undefined): Promise<void> {
        if (connection != undefined && !this.instances.has(connection.id)) {
            await this.initInstance(connection)
        }
        this.showInstance(connection)
    }

    async restartInstance(connection: Connection): Promise<void> {
        if (!this.instances.has(connection.id)) {
            return
        }

        this.destroyInstance(connection)
        await this.initInstance(connection)
        if (this.activeInstance === connection.id) {
            this.showInstance(connection)
        }
    }

    private showInstance(connection: Connection | undefined): void {
        if (connection != undefined && !this.instances.has(connection.id)) {
            throw new Error(`Existing instance for connection '${connection.id}' could not be found.`)
        }

        this.hideActiveInstance()

        if (connection != undefined) {
            const newInstance: WebContentsView = this.instances.get(connection.id)
            // set bounds to current skeleton, the skeleton instance may have changed
            newInstance.setBounds(this.constructViewBounds())
            this._skeletonWindow.contentView.addChildView(newInstance, 0) // adding it under every modal window
            newInstance.setVisible(true)
            this.activeInstance = connection.id
        }
    }

    private async initInstance(connection: Connection): Promise<void> {
        if (this._skeletonWindow == undefined) {
            throw new Error('Skeleton is not initialized yet.')
        }

        const driver: Driver = await this.driverManager.getDriver(connection.driverVersion)

        const instance = new WebContentsView({
            webPreferences: {
                preload: path.join(__dirname, 'driver-preload.js'),
            },
        })
        instance.setBounds(this.constructViewBounds());
        instance.setVisible(false)

        this.registerSkeletonListenersForInstance(instance)

        await instance.webContents.loadFile(driver.executablePath, this.constructInstanceUrlOptions(connection))

        // manually uncomment for devtools
        // instance.webContents.openDevTools()

        this.instances.set(connection.id, instance)
        this._skeletonWindow.contentView.addChildView(instance, 0) // adding it under every modal window
    }

    private destroyInstance(connection: Connection): void {
        if (!this.instances.has(connection.id)) {
            return
        }
        this._skeletonWindow.contentView.removeChildView(this.instances.get(connection.id))
    }

    private hideActiveInstance() {
        if (this.activeInstance != undefined) {
            const currentInstance: WebContentsView = this.instances.get(this.activeInstance)
            currentInstance.setVisible(false)
        }
    }

    private registerSkeletonListenersForInstance(instance: WebContentsView): void {
        const resizer = debounce(
            () => instance.setBounds(this.constructViewBounds()),
            50
        )
        this._skeletonWindow.on('resize', resizer)
        this._skeletonWindow.on('maximize', resizer)
        this._skeletonWindow.on('unmaximize', resizer)
        this._skeletonWindow.on('enter-full-screen', resizer)
        this._skeletonWindow.on('leave-full-screen', resizer)
    }

    private constructInstanceUrlOptions(connection: Connection): LoadFileOptions {
        return {
            query: {
                'evitalab': 'true',
                'evitalab-server-name': btoa(this.constructServerNameForInstance(connection)),
                'evitalab-pconnections': btoa(JSON.stringify(this.constructPreconfiguredConnectionsForInstance(connection))),
                'evitalab-readonly': 'true'
            }
        }
    }

    private constructServerNameForInstance(connection: Connection): string {
        return `desktop-${connection.id}`
    }

    private constructPreconfiguredConnectionsForInstance(connection: Connection): PreconfiguredDriverConnection[] {
        return [PreconfiguredDriverConnection.fromConnection(connection)]
    }

    private constructViewBounds(): Rectangle {
        const skeletonBounds: Rectangle = this._skeletonWindow.contentView.getBounds()
        return {
            x: 56, // width of wrapper sidebar
            y: 0,
            width: skeletonBounds.width - 57,
            height: skeletonBounds.height
        };
    }
}
