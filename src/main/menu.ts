import { app, shell, Menu } from 'electron'

const isMac = process.platform === 'darwin'

// based on https://www.electronjs.org/docs/latest/api/menu#examples
const template: any = [
    // { role: 'appMenu' }
    ...(isMac
        ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }]
        : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac
                ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' }
                        ]
                    }
                ]
                : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac
                ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ]
                : [
                    { role: 'close' }
                ])
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Discuss evitaLab on Discord',
                click: async () => {
                    await shell.openExternal('https://discord.gg/VsNBWxgmSw')
                }
            },
            {
                label: 'evitaLab Issue Tracker',
                click: async () => {
                    await shell.openExternal('https://github.com/FgForrest/evitalab-desktop/issues')
                }
            },
            { type: 'separator' },
            {
                label: 'evitaDB Documentation',
                click: async () => {
                    await shell.openExternal('https://evitadb.io/documentation')
                }
            },
            {
                label: 'Discuss evitaDB on Discord',
                click: async () => {
                    await shell.openExternal('https://discord.gg/VsNBWxgmSw')
                }
            },
            {
                label: 'evitaDB Issue Tracker',
                click: async () => {
                    await shell.openExternal('https://github.com/FgForrest/evitaDB/issues')
                }
            },
        ]
    }
]

export default Menu.buildFromTemplate(template)

