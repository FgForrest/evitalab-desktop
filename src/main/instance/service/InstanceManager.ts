import { ConnectionId } from '../../connection/model/ConnectionId'
import { BrowserWindow, WebContentsView } from 'electron'
import path from 'path'
import { Connection } from '../../connection/model/Connection'
import { PreconfiguredDriverConnection } from '../model/PreconfiguredDriverConnection'
import { DriverManager } from '../../driver/service/DriverManager'
import { Driver } from '../../driver/model/Driver'
import LoadFileOptions = Electron.LoadFileOptions
import Rectangle = Electron.Rectangle

/**
 * Instance represents alive connection, that is a browser view with correct driver connection to a specific evitaDB server.
 * This manager manages browser views for individual connections
 */
export class InstanceManager {

    private _skeletonWindow: BrowserWindow | undefined = undefined
    private readonly driverManager: DriverManager

    private readonly instances: Map<ConnectionId, WebContentsView>
    private activeInstance: ConnectionId | undefined

    constructor(driverManager: DriverManager) {
        this.driverManager = driverManager
        this.instances = new Map()
    }

    set skeletonWindow(skeletonWindow: BrowserWindow) {
        this._skeletonWindow = skeletonWindow
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
        this._skeletonWindow.on('resize', () => instance.setBounds(this.constructViewBounds()))
        await instance.webContents.loadFile(driver.executablePath, this.constructInstanceUrlOptions(connection))

        this._skeletonWindow.contentView.addChildView(instance, 0) // adding it under every modal window
        this.instances.set(connection.id, instance)
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
        // todo lho move the sidebar width to common place
        return {
            x: 56, // width of wrapper sidebar
            y: 0,
            width: this._skeletonWindow.contentView.getBounds().width - 57,
            height: this._skeletonWindow.contentView.getBounds().height
        };
    }
}
