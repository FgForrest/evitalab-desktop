import { contextBridge, ipcRenderer } from 'electron'

/**
 * Exposes model manager to the renderer.
 */
export type ModalManagerApi = {
    openModal(url: string): void,
    closeModal(url: string): void
}

export const modalManagerApi_openModal = 'modalManager:openModal'
export const modalManagerApi_closeModal  = 'modalManager:closeModal'

export function exposeModalManagerApi(): void {
    contextBridge.exposeInMainWorld('modalManager', {
        openModal: (url: string) => ipcRenderer.send(modalManagerApi_openModal, url),
        closeModal: (url: string) => ipcRenderer.send(modalManagerApi_closeModal, url)
    } as ModalManagerApi)
}
