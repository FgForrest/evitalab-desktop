<script setup lang="ts">
/**
 * Main lab panel with navigation and useful links
 */

import { Connection } from '../../../main/connection/model/Connection'
import ConnectionAvatar from './ConnectionAvatar.vue'
import { ref } from 'vue'
import { ConnectionManagerApi } from '../../../preload/api/ConnectionManagerApi'
import { ModalManagerApi } from '../../../preload/api/ModalManagerApi'
import { ConnectionId } from '../../../main/connection/model/ConnectionId'

//@ts-ignore
const connectionManager: ConnectionManagerApi = window.connectionManager
//@ts-ignore
const modalManager: ModalManagerApi = window.modalManager

const activatedConnections = ref<ConnectionId[]>([])
const connections = ref<Connection[]>([])
connectionManager.connections()
    .then((fetchedConnections: Connection[]) => connections.value = fetchedConnections)

connectionManager.onConnectionActivation((activated: Connection | undefined) => {
    if (activated != undefined) {
        activatedConnections.value = [activated.id]
    } else {
        activatedConnections.value = []
    }
})

connectionManager.onConnectionsChange((newConnections: Connection[]) =>
    connections.value = newConnections)

function openNavigationPanel(): void {
    modalManager.openModal('/navigation-panel/navigation-panel.html')
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
            <VAvatar size="30px">
                <span class="text-h5">eL</span>
            </VAvatar>
        </template>

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
    </VNavigationDrawer>
</template>

<style lang="scss" scoped>
//@use '@/renderer/styles/colors.scss';

.lab-nav-links {
    display: flex;
    flex-direction: column;
    list-style: none;
    justify-content: center;
    align-items: center;
    margin: 0 0 1.25rem 0;
    gap: 1.25rem 0;
}
.lab-nav-links li img {
    opacity: .5;
    transition: opacity .2s ease-in-out;
}

.lab-nav-links li:hover img {
    opacity: 1;
}

// todo lho uncomment when we have colors
//.connection-items {
//    & :deep(.v-list-item__underlay) {
//        display: none;
//    }
//    & :deep(.v-list-item__overlay) {
//        background: transparent;
//        opacity: 1;
//        border-radius: 50%;
//        transition: background-color .1s ease-in-out;
//    }
//    & :deep(.v-list-item--active > .v-list-item__overlay) {
//        //background: $primary-lightest;
//        opacity: 1;
//        border-radius: 50%;
//    }
//}
</style>
