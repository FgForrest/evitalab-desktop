import { BrowserWindow } from 'electron'
import path from 'path'

const SKELETON_PATH = '/src/renderer/skeleton/skeleton.html'

/**
 * Manages lifecycle of the skeleton, that is the main wrapper view handles all other app things.
 */
export class SkeletonManager {

    private _skeletonWindow: BrowserWindow | undefined = undefined

    async init(): Promise<BrowserWindow> {
        const skeletonWindow = new BrowserWindow({
            width: 1280,
            height: 720,
            minWidth: 800,
            minHeight: 600,
            icon: path.join(__dirname, 'icon/icon.png'),
            autoHideMenuBar: true,
            webPreferences: {
                preload: path.join(__dirname, 'renderer-preload.js'),
            },
        })

        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            await skeletonWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + SKELETON_PATH)
        } else {
            await skeletonWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}${SKELETON_PATH}`))
        }

        // manually uncomment for devtools
        // skeletonWindow.webContents.openDevTools({ mode: 'detach' })

        this._skeletonWindow = skeletonWindow
        return this._skeletonWindow
    }

    get skeletonWindow(): BrowserWindow {
        if (this._skeletonWindow == undefined) {
            throw new Error(`Skeleton is not initialized yet.`)
        }
        return this._skeletonWindow
    }
}
