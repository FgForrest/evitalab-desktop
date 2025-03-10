import { contextBridge, ipcRenderer } from 'electron'

/**
 * Exposes model manager to the renderer.
 */
export type ModalManagerApi = {
    openModal(url: string): void,
    closeModal(url: string): void,
    onModalVisibilityChange(listener: (url: string, visible: boolean) => void): void
}

export const modalManagerApi_openModal = 'modalManager:openModal'
export const modalManagerApi_closeModal  = 'modalManager:closeModal'
export const modalManagerApi_onModalVisibilityChange  = 'modalManager:onModalVisibilityChange'

export function exposeModalManagerApi(): void {
    contextBridge.exposeInMainWorld('modalManager', {
        openModal: (url: string) => ipcRenderer.send(modalManagerApi_openModal, url),
        closeModal: (url: string) => ipcRenderer.send(modalManagerApi_closeModal, url),
        onModalVisibilityChange: (listener: (url: string, visible: boolean) => void) =>
            ipcRenderer.on(modalManagerApi_onModalVisibilityChange, (_event, url, visible) => listener(url, visible))
    } as ModalManagerApi)
}
