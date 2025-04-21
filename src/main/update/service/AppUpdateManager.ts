import log from 'electron-log/main'
import { app, shell } from 'electron'
import ky from 'ky'
import semver from 'semver/preload'
import { updateElectronApp, UpdateSourceType } from './autoupdater'

const LATEST_RELEASE_URL = 'https://api.github.com/repos/FgForrest/evitalab-desktop/releases/latest'

/**
 * Manages evitaLab Desktop app updates
 */
export class AppUpdateManager {

    private updateAvailable?: boolean = undefined

    tryAutoUpdate(): void {
        if (import.meta.env.DEV) {
            log.log('Skipping auto app update in dev mode...')
            return
        }

        if (process.platform === 'win32') {
            // we delay this work by 10s to ensure that the app doesn't have to worry about updating during launch
            // same thing as Electron Fiddle app does
            setTimeout(() => {
                updateElectronApp({
                    updateSource: {
                        type: UpdateSourceType.ElectronPublicUpdateService,
                        repo: 'FgForrest/evitalab-desktop',
                    },
                    updateInterval: '1 hour',
                    logger: log
                })
            }, 10000)
        } else {
            log.log('Not win32 platform, skipping auto update...')
        }
    }

    manualUpdateApp(): void {
        if (import.meta.env.DEV) {
            log.log('Skipping manual app update in dev mode...')
            return
        }
        shell.openExternal('https://github.com/FgForrest/evitalab-desktop/releases')
            .then(() => app.quit())
    }

    async isUpdateAvailable(): Promise<boolean> {
        if (import.meta.env.DEV || process.platform === 'win32') { // win32 has auto updater enabled
            return false
        }

        if (this.updateAvailable == undefined) {
            // we cannot use auto update for macOS for know, because we don't have app signing process ready yet

            try {
                const currentVersion: string = import.meta.env.VITE_BUILD_VERSION.substring(1)
                const newestVersion: string = await this.resolveNewestAppVersionAvailable()
                this.updateAvailable = semver.gt(newestVersion, currentVersion)
            } catch (e) {
                log.error('Could not resolve app update info: ', e)
                return false;
            }
        }

        return this.updateAvailable
    }

    private async resolveNewestAppVersionAvailable(): Promise<string> {
        const latestRelease: GitHubReleaseView = await ky.get(
            LATEST_RELEASE_URL,
            {
                headers: {
                    Accept: 'application/vnd.github+json'
                }
            }
        )
            .json()
        return latestRelease.tag_name.substring(1)
    }
}

type GitHubReleaseView = {
    tag_name: string
} & Record<string, any>
