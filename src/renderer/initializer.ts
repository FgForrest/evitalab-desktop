import { App, Component } from 'vue'
import { createApp } from 'vue'
import vuetify from './vue-plugins/vuetify'
import { i18n } from './vue-plugins/i18n'
import { Toaster, toasterInjectionKey } from './notification/service/Toaster'

/**
 * Initializes a renderer using the component as starting point. App decorator can be used to register renderer-specific
 * plugins and so on.
 */
export function initializeRenderer(component: Component, appDecorator?: (app: App) => void): void {
    const app: App = createApp(component)
    // plugins
    app
        .use(vuetify)
        .use(i18n)
    // services
    app
        .provide(toasterInjectionKey, new Toaster())

    if (appDecorator != undefined) {
        appDecorator(app)
    }

    app.mount('#app')
}
