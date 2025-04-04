<script setup lang="ts">
/**
 * Main lab panel with navigation and useful links
 */

import ConnectionAvatar from './ConnectionAvatar.vue'
import { ref } from 'vue'
import { ConnectionId } from '../../../main/connection/model/ConnectionId'
import { NAVIGATION_PANEL_URL } from '../../navigation-panel/navigationPanelConstants'
import {
    FrontendConnectionManagerIpc
} from '../../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'

//@ts-ignore
const connectionManager: FrontendConnectionManagerIpc = window.connectionManager
//@ts-ignore
const modalManager: FrontendModalManagerIpc = window.modalManager

const activatedConnections = ref<ConnectionId[]>([])
connectionManager.getActiveConnection()
    .then(it => {
        console.log(it)
        activatedConnections.value = [it.id]
    })

const connections = ref<ConnectionDto[]>([])
connectionManager.getConnections()
    .then((fetchedConnections: ConnectionDto[]) => connections.value = fetchedConnections)

connectionManager.onConnectionActivation((activated: ConnectionDto | undefined) => {
    if (activated != undefined) {
        activatedConnections.value = [activated.id]
    } else {
        activatedConnections.value = []
    }
})

connectionManager.onConnectionsChange((newConnections: ConnectionDto[]) =>
    connections.value = newConnections)

function openNavigationPanel(): void {
    modalManager.openModal(NAVIGATION_PANEL_URL)
}
</script>

<template>
    <VNavigationDrawer
        permanent
        rail
        class="bg-primary-dark"
        @mouseenter="openNavigationPanel"
    >
        <template #prepend>
            <div class="app-avatar-container">
                <VAvatar size="30px">
                    <VImg
                        alt="evitaLab Logo"
                        width="30px"
                        height="30px"
                        src="/logo/evitalab-logo-mini.png?raw=true"
                    />
                </VAvatar>
            </div>
        </template>

        <template #default>
            <VList
                :selected="activatedConnections"
                density="compact"
                nav
                class="connection-items"
            >
                <VListItem v-for="connection in connections" :key="connection.id" :value="connection.id">
                    <ConnectionAvatar :connection="connection" />
                </VListItem>
            </VList>
        </template>

        <template #append>
            <!-- just a visual aid to help new users find hidden navigation panel -->
            <VList>
                <VListItem prepend-icon="mdi-arrow-expand-right"></VListItem>
            </VList>
        </template>
    </VNavigationDrawer>
</template>

<style lang="scss" scoped>
@use '../../styles/colors';

.app-avatar-container {
    width: 3.5rem;
    height: 3.5rem;
    display: grid;
    justify-items: center;
    align-items: center;
}

.connection-items {
    & :deep(.v-list-item) {
        padding: 0.25rem;
    }
    & :deep(.v-list-item__underlay) {
        display: none;
    }
    & :deep(.v-list-item__overlay) {
        background: transparent;
        opacity: 1;
        border-radius: 50%;
        transition: background-color .1s ease-in-out;
    }
    & :deep(.v-list-item__content) {
        width: 2rem;
        height: 2rem;
    }
    & :deep(.v-list-item--active > .v-list-item__overlay) {
        background: colors.$primary-lightest;
        opacity: 1;
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
    }
}
</style>
