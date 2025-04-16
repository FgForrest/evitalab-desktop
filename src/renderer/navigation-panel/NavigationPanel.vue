<script setup lang="ts">
import { NAVIGATION_PANEL_URL } from './navigationPanelConstants'
import { FrontendModalManagerIpc } from '../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import ModalWindow from '../common/component/ModalWindow.vue'
import Panel from './component/Panel.vue'

const modalManager: FrontendModalManagerIpc = window.labModalManager

function closeNavigationPanel(): void {
    modalManager.closeModal(NAVIGATION_PANEL_URL)
}

</script>

<template>
<!--    todo lho keydown not working-->
    <ModalWindow @keydown.esc="closeNavigationPanel">
        <Panel />

        <!-- color from modal background -->
        <VMain
            style="background-color: rgba(35, 53, 92, 0.80)"
            @click="closeNavigationPanel"
        />
    </ModalWindow>
</template>

<style lang="scss" scoped>

</style>
