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
import WebContents = Electron.WebContents

/**
 * Implementation of modal manager IPC for backend.
 */
export class BackendModalManagerIpc {

    emitModalArgsPassed(target: WebContents, args: any[]): void {
        target.send(modalManagerIpc_onModalArgsPassed, ...args)
    }

    emitModalVisibilityChange(target: WebContents, url: string, visible: boolean): void {
        target.send(modalManagerIpc_onModalVisibilityChange, url, visible)
    }

}

/**
 * Initializes implementation of modal manager IPC for backend.
 */
export function initBackendModalManagerIpc(modalManager: ModalManager): BackendModalManagerIpc {
    const backendModalManagerIpc: BackendModalManagerIpc = new BackendModalManagerIpc()

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
            backendModalManagerIpc.emitModalArgsPassed(modal.webContents, args)
        }
    )
    modalManager.on(
        MODAL_MANAGER_EMIT_MODAL_VISIBILITY_CHANGE,
        (modal: WebContentsView, url: string, visible: boolean) => {
            backendModalManagerIpc.emitModalVisibilityChange(modal.webContents, url, visible)
        }
    )

    return backendModalManagerIpc
}
