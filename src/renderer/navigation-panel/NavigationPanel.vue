<script setup lang="ts">
import { ref } from 'vue'
import { Connection } from '../../main/connection/model/Connection'
import ConnectionAvatar from '../skeleton/component/ConnectionAvatar.vue'
import { ConnectionManagerApi } from '../../preload/api/ConnectionManagerApi'
import { ModalManagerApi } from '../../preload/api/ModalManagerApi'

//@ts-ignore
const connectionManager: ConnectionManagerApi = window.connectionManager
//@ts-ignore
const modalManager: ModalManagerApi = window.modalManager

const connections = ref<Connection[]>([])
connectionManager.connections()
    .then((fetchedConnections: Connection[]) => connections.value = fetchedConnections)

function selectConnection(item: any): void {
    if (!item.value) {
        connectionManager.activateConnection(undefined)
    } else {
        connectionManager.activateConnection(item.id)
    }
}

function closeNavigationPanel(): void {
    modalManager.closeModal('/navigation-panel/navigation-panel.html')
}

</script>

<template>
    <VApp style="background-color: transparent">
        <VNavigationDrawer :model-value="true" :width="300" @mouseleave="closeNavigationPanel">
            <VListItem>
                evitaLab
            </VListItem>
            <VDivider/>

            <VList
                density="compact"
                nav
                @click:select="selectConnection"
                class="connection-items"
            >
                <VListItem v-for="connection in connections" :key="connection.id" :value="connection.id">
                    <template #prepend>
                        <ConnectionAvatar :connection="connection" />
                    </template>

                    <template #title>
                        {{ connection.name }}
                    </template>
                </VListItem>
            </VList>
        </VNavigationDrawer>
    </VApp>
</template>
