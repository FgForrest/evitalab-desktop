import log from 'electron-log/main'

const format = `[{level}] [{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{processType}][{scope}] {text}`;

/**
 * Setups and initializes app logger, for both main and renderer processes
 */
export function initializeLogger(): void {
    log.transports.console.format = format
    log.transports.file.format = format

    log.initialize();
    log.errorHandler.startCatching()
    log.eventLogger.startLogging()
}
