<script setup lang="ts">
/**
 * Navigation panel header with manage options
 */

import ManageMenu from './ManageMenu.vue'
import { useI18n } from 'vue-i18n'
import {
    FrontendConnectionManagerIpc
} from '../../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { NAVIGATION_PANEL_URL } from '../navigationPanelConstants'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'

const connectionManager: FrontendConnectionManagerIpc = window.labConnectionManager
const modalManager: FrontendModalManagerIpc = window.labModalManager
const { t } = useI18n()

async function goHome(): Promise<void> {
    await connectionManager.activateConnection(undefined)
    modalManager.closeModal(NAVIGATION_PANEL_URL)
}
</script>

<template>
    <VListItem class="navigation-panel-header">
        <template #prepend>
            <VAvatar size="30px" @click="goHome" style="cursor: pointer">
                <VImg
                    alt="evitaLab Logo"
                    width="30px"
                    height="30px"
                    src="/logo/evitalab-logo-mini.png?raw=true"
                />
            </VAvatar>
        </template>

        <template #title>
            <strong>{{ t('app.name') }}</strong>
        </template>

        <template #append>
            <ManageMenu />
        </template>
    </VListItem>

    <VDivider/>
</template>

<style lang="scss" scoped>
.navigation-panel-header {
    height: 3.5rem;
}
</style>
