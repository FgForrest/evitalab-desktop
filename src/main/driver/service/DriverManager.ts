import { Driver } from '../model/Driver'
import { List } from 'immutable'
import semver from 'semver/preload'
import ky from 'ky'
import { mkdir, access, writeFile, rm, rename } from 'node:fs/promises'
import decompress from 'decompress'

const updateDriverDatabaseAfterInMillis = 15 * 60 * 1000

const shortCalendarVersionPattern = /^\d{4}\.\d{1,2}$/

const driverDatabaseSourceUrl = 'https://raw.githubusercontent.com/FgForrest/evitalab-metadata-database/refs/heads/main/evitalab-database.csv'

/**
 * Manages downloading and initializing drivers (individual evitaLab instances).
 */
export class DriverManager {

    private driverIndex?: Map<string, Driver>
    private driversForServerDatabase?: List<DriversForServer>

    private lastDriverDatabaseUpdate?: number

    async getDriver(version: string): Promise<Driver> {
        await this.initIndexes()

        if (!this.driverIndex.has(version)) {
            throw new Error(`No driver for version '${version}' is available.`)
        }
        return this.driverIndex.get(version)
    }

    async resolveLatestAvailableDriver(serverUrl: string): Promise<Driver> {
        await this.initIndexes(true)

        const serverVersion: string = await this.resolveServerVersion(serverUrl)

        let driverForServer: Driver | undefined = undefined
        for (let i = 0; i < this.driversForServerDatabase.size; i++) {
            const driversForServer: DriversForServer = this.driversForServerDatabase.get(i)
            if (semver.gte(serverVersion, driversForServer.minServerVersion)) {
                driverForServer = driversForServer.availableDrivers.last()
                break
            }
        }
        if (driverForServer == undefined) {
            // fallback to the oldest known driver
            // todo lho somehow tell this info to the user
            driverForServer = this.driversForServerDatabase.last().availableDrivers.first()
        }

        return driverForServer
    }

    async downloadDriver(version: string): Promise<void> {
        const driver: Driver = await this.getDriver(version)
        if (await this.isDriverDownloaded(driver)) {
            return
        }

        const tempDriverPath = `${driver.path}-${Date.now()}`
        await mkdir(
            tempDriverPath,
            {
                recursive: true
            }
        )

        const driverArchive: Blob = await ky.get(driver.sourceUrl).blob()
        await writeFile(
            `${tempDriverPath}/dist.zip`,
            new Uint8Array(await driverArchive.arrayBuffer())
        )

        await decompress(
            `${tempDriverPath}/dist.zip`,
            tempDriverPath
        )

        await rm(`${tempDriverPath}/dist.zip`)

        await rename(tempDriverPath, driver.path)
    }

    private async isDriverDownloaded(driver: Driver): Promise<boolean> {
        try {
            await access(driver.path)
            return true
        } catch (e) {
            return false
        }
    }

    private async initIndexes(update?: boolean): Promise<void> {
        if (!update &&
            this.driverIndex != undefined &&
            this.driversForServerDatabase != undefined) {
            return
        }

        // we don't need to update everytime, driver release are not that frequent
        if (this.lastDriverDatabaseUpdate != undefined &&
            (this.lastDriverDatabaseUpdate + updateDriverDatabaseAfterInMillis) > Date.now()) {
            return
        }

        const availableDrivers: List<Driver> = await this.downloadDriverDatabase()
        this.driverIndex = this.constructDriverIndex(availableDrivers)
        this.driversForServerDatabase = this.constructDriversForServerDatabase(availableDrivers)

        this.lastDriverDatabaseUpdate = Date.now()
    }

    private async resolveServerVersion(serverUrl: string): Promise<string> {
        try {
            const normalizedUrl: string = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/'
            const serverStatus: { version: string } = await ky.post(
                `${normalizedUrl}io.evitadb.externalApi.grpc.generated.EvitaManagementService/ServerStatus`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: '{}'
                }
            )
                .json()

            const originalServerVersion: string = serverStatus.version
            return this.normalizeServerVersion(originalServerVersion)
        } catch (e) {
            throw new Error(`Could not resolve server version from '${serverUrl}': ${e.message}`)
        }
    }

    private async downloadDriverDatabase(): Promise<List<Driver>> {
        try {
            const rawDriverDatabase: string = await ky.get(driverDatabaseSourceUrl)
                .text()

            const drivers: Driver[] = []
            const rawDrivers: string[] = rawDriverDatabase.split(/\n/)
            for (let i = 1; i < rawDrivers.length; i++) {
                const rawDriver: string = rawDrivers[i]
                if (rawDriver.trim().length === 0) {
                    continue
                }

                const rawDriverData: string[] = rawDriver.split(/,/)

                drivers.push(new Driver(
                    rawDriverData[0].substring(1),
                    rawDriverData[1]
                ))
            }

            return List(drivers)
        } catch (e) {
            throw new Error('Could not download driver lookup table: ' + e.message)
        }
    }

    private constructDriverIndex(drivers: List<Driver>): Map<string, Driver> {
        const index: Map<string, Driver> = new Map()
        for (const driver of drivers) {
            index.set(driver.version, driver)
        }
        return index
    }

    private constructDriversForServerDatabase(drivers: List<Driver>): List<DriversForServer> {
        const index: Map<string, Driver[]> = new Map()

        const sortedDrivers: List<Driver> = drivers.sort((a, b) => {
            return semver.compare(a.version, b.version)
        })

        for (const driver of sortedDrivers) {
            const minServerVersion: string = driver.minServerVersion
            let driversForServerVersion: Driver[] | undefined = index.get(minServerVersion)
            if (driversForServerVersion == undefined) {
                driversForServerVersion = []
                index.set(minServerVersion, driversForServerVersion)
            }
            driversForServerVersion.push(driver)
        }

        return List(
            [...index.entries()]
                .map(entry => new DriversForServer(entry[0], List(entry[1])))
                .sort((a, b) => {
                    // sorted from the newest server version
                    return semver.compare(b.minServerVersion, a.minServerVersion)
                })
        )
    }

    private normalizeServerVersion(originalVersion: string): string {
        let normalizedVersion: string = originalVersion

        // we won't have specific driver version for snapshot of server, it will be driver for the released version
        // the snapshot is referring to
        normalizedVersion = normalizedVersion.replace('-SNAPSHOT', '')

        // calendar versioning scheme doesn't require patch version like semantic version, however
        // semver library requires it
        if (shortCalendarVersionPattern.test(normalizedVersion)) {
            normalizedVersion = `${normalizedVersion}.0`
        }

        return normalizedVersion
    }
}

class DriversForServer {

    readonly minServerVersion: string
    readonly availableDrivers: List<Driver>

    constructor(minServerVersion: string, availableDrivers: List<Driver>) {
        this.minServerVersion = minServerVersion
        this.availableDrivers = availableDrivers
    }
}
