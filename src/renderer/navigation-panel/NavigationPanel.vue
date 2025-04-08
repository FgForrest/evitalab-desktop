<script setup lang="ts">
import { NAVIGATION_PANEL_URL } from './navigationPanelConstants'
import { FrontendModalManagerIpc } from '../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import ConnectionList from './component/ConnectionList.vue'
import ModalWindow from '../common/component/ModalWindow.vue'
import Header from './component/Header.vue'
import Footer from './component/Footer.vue'

const modalManager: FrontendModalManagerIpc = window.labModalManager

function closeNavigationPanel(): void {
    modalManager.closeModal(NAVIGATION_PANEL_URL)
}

</script>

<template>
    <ModalWindow>
        <VNavigationDrawer permanent :width="350">
            <template #prepend>
                <Header />
            </template>

            <template #default>
                <ConnectionList />
            </template>

            <template #append>
                <Footer />
            </template>
        </VNavigationDrawer>

        <VMain
            style="background-color: rgba(35, 53, 92, 0.80)"
            @mouseenter="closeNavigationPanel"
        />
    </ModalWindow>
</template>

<style lang="scss" scoped>

</style>
