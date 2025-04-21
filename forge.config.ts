import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { VitePlugin } from '@electron-forge/plugin-vite'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import { MakerAppImage } from '@reforged/maker-appimage'
import { MakerDMG } from '@electron-forge/maker-dmg'

const config: ForgeConfig = {
    packagerConfig: {
        name: 'evitaLab',
        executableName: 'evitalab',
        asar: true,
        appCategoryType: 'public.app-category.developer-tools',
        icon: 'assets/icon/icon',
        win32metadata: {
            CompanyName: 'FgForrest a.s.',
            OriginalFilename: 'evitaLab',
        },
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel(
            (arch: string) => ({
                name: 'evitaLab',
                authors: 'FgForrest a.s.',
                exe: 'evitaLab.exe',
                iconUrl:
                    'https://raw.githubusercontent.com/FgForrest/evitalab-desktop/dev/assets/icon/icon.ico',
                loadingGif: 'assets/installer/installing.gif',
                noMsi: true,
                setupIcon: 'assets/icon/icon.ico'
            }),
            ['win32']
        ),
        new MakerZIP(
            {},
            ['darwin']
        ),
        new MakerDMG(
            {
                icon: 'assets/icon/icon.icns',
                background: 'assets/installer/background.png'
            },
            ['darwin']
        ),
        new MakerRpm(
            {
                options: {
                    icon: 'assets/icon/icon.png',
                    description: 'evitaDB Desktop Client',
                    categories: ['Development'],
                    homepage: 'https://github.com/FgForrest/evitalab-desktop'
                }
            },
            ['linux']
        ),
        new MakerDeb(
            {
                options: {
                    icon: 'assets/icon/icon.png',
                    description: 'evitaDB Desktop Client',
                    maintainer: 'FgForrest a.s.',
                    homepage: 'https://github.com/FgForrest/evitalab-desktop',
                    categories: ['Development'],
                    section: 'database'
                }
            },
            ['linux']
        ),
        new MakerAppImage(
            {
                options: {
                    categories: ['Development']
                }
            },
            ['linux']
        )
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
