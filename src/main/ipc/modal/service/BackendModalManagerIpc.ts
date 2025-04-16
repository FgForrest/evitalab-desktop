import {
    MODAL_MANAGER_EMIT_MODAL_ARGS_PASS,
    MODAL_MANAGER_EMIT_MODAL_VISIBILITY_CHANGE,
    ModalManager
} from '../../../modal/service/ModalManager'
import { ipcMain, WebContentsView } from 'electron'
import IpcMainEvent = Electron.IpcMainEvent
import {
    modalManagerIpc_closeModal, modalManagerIpc_onModalArgsPassed, modalManagerIpc_onModalVisibilityChange,
    modalManagerIpc_openModal
} from '../../../../common/ipc/modal/service/ModalManagerIpc'

/**
 * Initializes implementation of modal manager IPC for backend.
 */
export function initBackendModalManagerIpc(modalManager: ModalManager): void {

    ipcMain.on(
        modalManagerIpc_openModal,
        async (event: IpcMainEvent, args: any[]) => {
            const url: string = args[0]
            await modalManager.openModal(url, args.slice(1))
        }
    )
    ipcMain.on(
        modalManagerIpc_closeModal,
        (event: IpcMainEvent, url: string) => {
            modalManager.closeModal(url)
        }
    )

    modalManager.on(
        MODAL_MANAGER_EMIT_MODAL_ARGS_PASS,
        (modal: WebContentsView, args: any[]) => {
            emitModalArgsPassed(modal, args)
        }
    )
    modalManager.on(
        MODAL_MANAGER_EMIT_MODAL_VISIBILITY_CHANGE,
        (modal: WebContentsView, url: string, visible: boolean) => {
            emitModalVisibilityChange(modal, url, visible)
        }
    )
}

function emitModalArgsPassed(target: WebContentsView, args: any[]): void {
    target.webContents.send(modalManagerIpc_onModalArgsPassed, ...args)
}

function emitModalVisibilityChange(target: WebContentsView, url: string, visible: boolean): void {
    target.webContents.send(modalManagerIpc_onModalVisibilityChange, url, visible)
}
