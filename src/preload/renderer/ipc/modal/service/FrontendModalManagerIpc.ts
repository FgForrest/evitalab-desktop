import { contextBridge, ipcRenderer } from 'electron'
import {
    modalManagerIpc_closeModal, modalManagerIpc_onModalArgsPassed, modalManagerIpc_onModalVisibilityChange,
    modalManagerIpc_openModal
} from '../../../../../common/ipc/modal/service/ModalManagerIpc'

/**
 * Interface of modal manager IPC for frontend renderer
 */
export interface FrontendModalManagerIpc {
    openModal(url: string, ...args: any[]): void,
    closeModal(url: string): void,
    onModalVisibilityChange(listener: (url: string, visible: boolean) => void): void,
    onModalArgsPassed(listener: (url: string, args: any[]) => void): void
}

/**
 * Implementation of modal manager IPC for frontend renderer.
 */
export function exposeFrontendModalManagerIpc(): void {
    contextBridge.exposeInMainWorld('modalManager', {
        openModal(url: string, ...args: any[]): void {
            ipcRenderer.send(modalManagerIpc_openModal, [url, ...args])
        },
        closeModal(url: string): void {
            ipcRenderer.send(modalManagerIpc_closeModal, url)
        },
        onModalVisibilityChange(listener: (url: string, visible: boolean) => void): void {
            ipcRenderer.on(modalManagerIpc_onModalVisibilityChange, (_event, url, visible) => listener(url, visible))
        },
        onModalArgsPassed(listener: (url: string, args: any[]) => void): void {
            ipcRenderer.on(modalManagerIpc_onModalArgsPassed, (_event, ...args) => listener(args[0], args.slice(1)))
        }
    } as FrontendModalManagerIpc)
}
