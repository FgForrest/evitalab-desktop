import { Driver } from '../model/Driver'

/**
 * Manages downloading and initializing drivers (individual evitaLab instances).
 */
export class DriverManager {

    private readonly availableDrivers: Map<string, Driver>

    constructor() {
        // todo lho temporary
        this.availableDrivers = new Map([
            ['1', new Driver(
                '1',
                '/Users/lukin/dev/evitalab/dist/index.html'
            )]
        ])
    }

    getDriver(version: string): Driver {
        if (!this.availableDrivers.has(version)) {
            throw new Error(`No driver for version '${version}' is available.`)
        }
        return this.availableDrivers.get(version)
    }

    async resolveDriverForServer(serverUrl: string): Promise<Driver> {
        // todo lho resolve driver version for server version and fetch it?
        return new Promise((resolve) => {
            return resolve(new Driver(
                '1',
                '/Users/lukin/dev/evitalab/dist/index.html'
            ))
        })
    }
}
