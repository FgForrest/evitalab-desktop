import { BrowserWindow, WebContentsView } from 'electron'
import path from 'path'
import Rectangle = Electron.Rectangle

/**
 * Manages opening and closing modals
 */
export class ModalManager {

    private _skeletonWindow: BrowserWindow | undefined = undefined

    private readonly initializedModals: Map<string, WebContentsView>

    constructor() {
        this.initializedModals = new Map()
    }

    set skeletonWindow(skeletonWindow: BrowserWindow) {
        this._skeletonWindow = skeletonWindow
    }

    // todo lho nice urls like evitalab:navigation-panel ???
    async openModal(url: string): Promise<void> {
        if (this.initializedModals.has(url)) {
            this.showModal(url)
        } else {
            await this.initModal(url)
        }
    }

    closeModal(url: string): void {
        this.hideModal(url)
    }

    private showModal(url: string): void {
        const modal: WebContentsView = this.getInitializedModal(url)
        // rearranges the existing child view to be the top most child
        this._skeletonWindow.contentView.addChildView(modal)
        modal.setVisible(true)
    }

    private hideModal(url: string): void {
        const modal: WebContentsView = this.getInitializedModal(url)
        modal.setVisible(false)
    }

    private async initModal(url: string): Promise<void> {
        if (this._skeletonWindow == undefined) {
            throw new Error('Skeleton is not initialized yet.')
        }

        const newModal: WebContentsView = new WebContentsView({
            webPreferences: {
                preload: path.join(__dirname, 'renderer-preload.js'),
            },
        })
        newModal.setBackgroundColor('#00000000');
        newModal.setBounds(this.constructViewBounds());
        this._skeletonWindow.on('resize', () => newModal.setBounds(this.constructViewBounds()))
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            await newModal.webContents.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + `/src/renderer${url}`);
        } else {
            await newModal.webContents.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}${url}`));
        }

        this._skeletonWindow.contentView.addChildView(newModal)
        this.initializedModals.set(url, newModal)
    }

    private getInitializedModal(url: string) {
        const modal: WebContentsView = this.initializedModals.get(url)
        if (modal == undefined) {
            throw new Error(`No modal for URL '${url}' initialized.`)
        }
        return modal
    }

    private constructViewBounds(): Rectangle {
        return {
            x: 0,
            y: 0,
            width: this._skeletonWindow.contentView.getBounds().width,
            height: this._skeletonWindow.contentView.getBounds().height
        };
    }

}
