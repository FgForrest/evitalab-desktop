import { defineConfig } from 'vite';
import VuePlugin from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config
export default defineConfig({
    plugins: [
        VuePlugin({
            template: { transformAssetUrls }
        }),
        // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
        vuetify({
            autoImport: true,
            // todo lho impl
            // styles: {
            //     configFile: 'src/renderer/styles/settings.scss'
            // }
        })
    ],
    build: {
        rollupOptions: {
            input: {
                skeleton: resolve(__dirname, 'src/renderer/skeleton/skeleton.html'),
                navigationPanel: resolve(__dirname, 'src/renderer/navigation-panel/navigation-panel.html'),
            }
        }
    },
    define: { 'process.env': {} },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
        extensions: [
            '.js',
            '.json',
            '.jsx',
            '.mjs',
            '.ts',
            '.tsx',
            '.vue'
        ]
    }
});
