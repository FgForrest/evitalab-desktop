<script setup lang="ts">
import NavigationPanel from './component/NavigationPanel.vue'
import WelcomeScreen from '../welcome-screen/component/WelcomeScreen.vue'
import Panel from '../navigation-panel/component/Panel.vue'
import {
    FrontendConnectionManagerIpc
} from '../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { ref } from 'vue'
import { ConnectionDto } from '../../common/ipc/connection/model/ConnectionDto'

const connectionManager: FrontendConnectionManagerIpc = window.labConnectionManager

const isConnectionActive = ref<boolean>(false)
connectionManager.getActiveConnection().then(it => isConnectionActive.value = it != undefined)
connectionManager.onConnectionActivation((activated: ConnectionDto | undefined) => isConnectionActive.value = activated != undefined)
</script>

<template>
    <VApp>
        <!-- show minimized navigation panel if there is connection renderer -->
        <NavigationPanel v-if="isConnectionActive" />
        <!-- otherwise show full panel -->
        <Panel v-else />

        <VMain :scrollable="false" class="main">
            <WelcomeScreen v-if="!isConnectionActive" />
        </VMain>
    </VApp>
</template>

<style lang="scss" scoped>
.main {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    justify-items: stretch;
    align-items: stretch;
}
</style>
