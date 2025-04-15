<script setup lang="ts">/**
 * Navigation panel footer with useful info.
 */
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { FrontendAppUpdateManagerIpc } from '../../../preload/renderer/ipc/update/service/FrontendAppUpdateManagerIpc'

const appUpdateManager: FrontendAppUpdateManagerIpc = window.labAppUpdateManager
const { t } = useI18n()

const version = computed(() => {
    const actualVersion: string = import.meta.env.VITE_BUILD_VERSION
    if (actualVersion == undefined || actualVersion.length === 0) {
        return '?'
    }
    return actualVersion
})

const appUpdateAvailable = ref<boolean>(false)
appUpdateManager.isUpdateAvailable()
    .then(it => appUpdateAvailable.value = it)

</script>

<template>
    <VDivider />

    <footer class="navigation-panel-footer">
        <ul class="lab-nav-links">
            <li>
                <a href="https://evitadb.io/documentation" target="_blank">
                    <img src="/documentation.svg" :alt="t('navigation.panel.link.evitaDBDocumentation.icon.alt')">
                    <VTooltip activator="parent">
                        {{ t('navigation.panel.link.evitaDBDocumentation.tooltip') }}
                    </VTooltip>
                </a>
            </li>
            <li>
                <a href="https://discord.gg/VsNBWxgmSw" target="_blank">
                    <img src="/discord.svg" :alt="t('navigation.panel.link.discord.icon.alt')">
                    <VTooltip activator="parent">
                        {{ t('navigation.panel.link.discord.tooltip') }}
                    </VTooltip>
                </a>
            </li>
        </ul>

        <div class="version-container">
            <span class="app-version text-subtitle-2 text-disabled">
                {{ version }}
            </span>
            <VTooltip>
                <template #activator="{ props }">
                    <VBtn
                        v-if="appUpdateAvailable"
                        icon
                        variant="flat"
                        density="compact"
                        v-bind="props"
                        @click="appUpdateManager.manualUpdateApp()"
                        class="app-update-button"
                    >
                        <VIcon color="warning">mdi-alert-decagram-outline</VIcon>
                    </VBtn>
                </template>
                <template #default>
                    {{ t('app.update.availableInfo') }}
                </template>
            </VTooltip>
        </div>
    </footer>
</template>

<style lang="scss" scoped>

.navigation-panel-footer {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 1rem;
    height: 3rem;
}

.version-container {
    display: flex;
    align-items: center;
}

.lab-nav-links {
    display: flex;
    list-style: none;
    justify-content: center;
    align-items: center;
    margin-left: 1rem;
    gap: 1rem;
}

.lab-nav-links li {
    width: 1.5rem;
    height: 1.5rem;
}

.lab-nav-links li img {
    opacity: .5;
    transition: opacity .2s ease-in-out;
}

.lab-nav-links li:hover img {
    opacity: 1;
}

.app-version {
    display: block;
    text-align: right;
    line-height: 3rem;
    margin-right: 0.5rem;
}

.app-update-button {
    margin-right: 0.25rem;
}
</style>
