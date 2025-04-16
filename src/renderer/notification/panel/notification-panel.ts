/**
 * Initialize notification panel
 */

import NotificationPanel from './NotificationPanel.vue'
import { initializeRenderer } from '../../initializer'
import { defaultToastOptions, toast } from '../../vue-plugins/toastification'

initializeRenderer(
    NotificationPanel,
    (app) => app
        .use(toast, defaultToastOptions)
)
