import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { VitePlugin } from '@electron-forge/plugin-vite'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import { MakerDMG } from '@electron-forge/maker-dmg'

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        name: 'evitalab', // seems to be only for building, not displaying to user
        appCategoryType: 'public.app-category.developer-tools',
        icon: 'public/icon/icon'
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({}),
        new MakerZIP({}, ['darwin']),
        new MakerDMG({
            name: 'evitaLab',
            icon: 'public/icon/icon.icns',
            background: 'public/installer/background.png'
        }),
        new MakerRpm({
            options: {
                name: 'evitaLab',
                icon: 'public/icon/icon.png',
                description: 'evitaDB Desktop Client',
                categories: ['Development'],
                homepage: 'https://github.com/FgForrest/evitalab-desktop'
            }
        }),
        new MakerDeb({
            options: {
                name: 'evitaLab',
                icon: 'public/icon/icon.png',
                description: 'evitaDB Desktop Client',
                maintainer: 'Lukáš Hornych',
                homepage: 'https://github.com/FgForrest/evitalab-desktop',
                categories: ['Development'],
                section: 'database'
            }
        })
    ],
    plugins: [
        new VitePlugin({
            // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
            // If you are familiar with Vite configuration, it will look really familiar.
            build: [
                {
                    // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                    entry: 'src/main/main.ts',
                    config: 'vite.main.config.ts',
                    target: 'main'
                },
                {
                    entry: 'src/preload/renderer/preload.ts',
                    config: 'vite.preload.config.ts',
                    target: 'preload'
                },
                {
                    entry: 'src/preload/driver/preload.ts',
                    config: 'vite.preload.config.ts',
                    target: 'preload'
                }
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts'
                }
            ]
        }),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true
        })
    ]
}

export default config
