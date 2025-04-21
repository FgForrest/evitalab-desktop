import log from 'electron-log/renderer'

/**
 * Setups logger for specific renderer instance
 */
export function setupLogger(): void {
    log.errorHandler.startCatching()
    console.log = log.log
    console.error = log.error
}
