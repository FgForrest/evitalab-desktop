/**
 * Describes a single available driver for usage by a connection
 */
export class Driver {

    readonly version: string
    // todo lho supported server versions?
    readonly url: string

    constructor(version: string, url: string) {
        this.version = version
        this.url = url
    }
}
