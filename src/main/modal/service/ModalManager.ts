import { BrowserWindow, WebContentsView } from 'electron'
import path from 'path'
import Rectangle = Electron.Rectangle
import { List } from 'immutable'
import { EventEmitter } from 'events'
import debounce from '../../util/debounce'

const MODAL_WINDOW_BASE_PATH = '/src/renderer'

/**
 * Gets emitted when a modal is being passed args.
 */
export const MODAL_MANAGER_EMIT_MODAL_ARGS_PASS = 'modalArgsPass'

/**
 * Gets emitted when a modal changed its visibility.
 */
export const MODAL_MANAGER_EMIT_MODAL_VISIBILITY_CHANGE = 'modalVisibilityChange'

/**
 * Manages opening and closing modals
 */
export class ModalManager extends EventEmitter {

    private _skeletonWindow: BrowserWindow | undefined = undefined

    private readonly initializedModals: Map<string, WebContentsView> = new Map()

    constructor() {
        super()
    }

    get modals(): List<WebContentsView> {
        return List(this.initializedModals.values())
    }

    set skeletonWindow(skeletonWindow: BrowserWindow | undefined) {
        this._skeletonWindow = skeletonWindow
        if (skeletonWindow != undefined) {
            this.initializedModals.forEach((modal) =>
                this.registerSkeletonListenersForModal(modal))
        }
    }

    async openModal(url: string, args: any[]): Promise<void> {
        await this.initModal(url)
        this.showModal(url, args)
    }

    closeModal(url: string): void {
        this.hideModal(url)
    }

    async initModal(url: string): Promise<void> {
        if (this.initializedModals.has(url)) {
            return
        }
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
        newModal.setVisible(false)

        this.registerSkeletonListenersForModal(newModal)

        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            await newModal.webContents.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + `${MODAL_WINDOW_BASE_PATH}${url}`);
        } else {
            await newModal.webContents.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}${MODAL_WINDOW_BASE_PATH}${url}`));
        }

        // manually uncomment for devtools
        newModal.webContents.openDevTools()

        this.initializedModals.set(url, newModal)
        this._skeletonWindow.contentView.addChildView(
            newModal,
            this.calculateModalPriorityInSkeleton()
        )
    }

    private showModal(url: string, args: any[]): void {
        const modal: WebContentsView = this.getInitializedModal(url)

        // pass arguments before the modal is shown
        this.emit(MODAL_MANAGER_EMIT_MODAL_ARGS_PASS, modal, [url, ...args])

        // set bounds to current skeleton, the skeleton instance may have changed
        modal.setBounds(this.constructViewBounds())
        // rearranges the existing child view to be the top most child
        this._skeletonWindow.contentView.addChildView(
            modal,
            this.calculateModalPriorityInSkeleton()
        )

        // show the modal
        this.notifyModalVisibilityChange(modal, url, true)
        modal.setVisible(true)
    }

    private hideModal(url: string): void {
        const modal: WebContentsView = this.getInitializedModal(url)
        this.notifyModalVisibilityChange(modal, url, false)
        modal.setVisible(false)
    }

    private notifyModalVisibilityChange(modal: WebContentsView, url: string, visible: boolean): void {
        this.emit(MODAL_MANAGER_EMIT_MODAL_VISIBILITY_CHANGE, modal, url, visible)
    }

    private getInitializedModal(url: string) {
        const modal: WebContentsView = this.initializedModals.get(url)
        if (modal == undefined) {
            throw new Error(`No modal for URL '${url}' initialized.`)
        }
        return modal
    }

    private registerSkeletonListenersForModal(modal: WebContentsView): void {
        const resizer = debounce(
            () => modal.setBounds(this.constructViewBounds()),
            50
        )
        this._skeletonWindow.on('resize', resizer)
        this._skeletonWindow.on('maximize', resizer)
        this._skeletonWindow.on('unmaximize', resizer)
        this._skeletonWindow.on('enter-full-screen', resizer)
        this._skeletonWindow.on('leave-full-screen', resizer)
    }

    private calculateModalPriorityInSkeleton(): number {
        // we want to add it instead of the top most view - notification panel - but still be under it
        return this._skeletonWindow.contentView.children.length - 1
    }

    private constructViewBounds(): Rectangle {
        const skeletonBounds: Rectangle = this._skeletonWindow.contentView.getBounds()
        return {
            x: 0,
            y: 0,
            width: skeletonBounds.width,
            height: skeletonBounds.height
        };
    }

}
