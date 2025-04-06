
/**
 * Describes a single available driver for usage by a connection
 */
export class Driver {

    readonly version: string
    readonly minServerVersion: string

    constructor(version: string, minServerVersion: string) {
        this.version = version
        this.minServerVersion = minServerVersion
    }

    /**
     * Where the driver can be downloaded in form of .zip archive
     */
    get sourceUrl(): string {
        return `https://github.com/lukashornych/evitalab/releases/download/v${this.version}/dist-driver.zip`
    }

    /**
     * Local path of downloaded driver.
     */
    get path(): string {
        // todo lho switch
        return '/Users/lukin/dev/evitalab'
        // return `${app.getPath('userData')}/drivers/${this.version}`
    }

    /**
     * Local path of executable file that starts up the driver.
     */
    get executablePath(): string {
        return `${this.path}/dist/index.html`
    }
}
