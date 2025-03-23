import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                'driver-preload': resolve(__dirname, 'src/preload/driver/preload.ts'),
                'renderer-preload': resolve(__dirname, 'src/preload/renderer/preload.ts'),
            },
            output: {
                inlineDynamicImports: false
            }
        },
    },
});
