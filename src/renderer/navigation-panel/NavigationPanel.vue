<script setup lang="ts">
import { ref } from 'vue'
import { Connection } from '../../main/connection/model/Connection'
import ConnectionAvatar from '../skeleton/component/ConnectionAvatar.vue'
import { ConnectionManagerApi } from '../../preload/api/ConnectionManagerApi'
import { ModalManagerApi } from '../../preload/api/ModalManagerApi'
import { ConnectionId } from '../../main/connection/model/ConnectionId'
import { CONNECTION_EDITOR_URL } from '../connection/editor/connectionEditorConstants'
import { NAVIGATION_PANEL_URL } from './navigationPanelConstants'

//@ts-ignore
const connectionManager: ConnectionManagerApi = window.connectionManager
//@ts-ignore
const modalManager: ModalManagerApi = window.modalManager

const shown = ref<boolean>(false)
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

modalManager.onModalVisibilityChange((url: string, visible: boolean) => {
    if (url !== NAVIGATION_PANEL_URL) {
        return
    }
    if (visible === true) {
        shown.value = true
    }
})

function selectConnection(item: any): void {
    if (!item.value) {
        connectionManager.activateConnection(undefined)
    } else {
        connectionManager.activateConnection(item.id)
    }
}

function closeNavigationPanel(): void {
    shown.value = false // todo lho <-- doens't hide it nicely
    modalManager.closeModal(NAVIGATION_PANEL_URL)
}

function addConnection(): void {
    modalManager.openModal(CONNECTION_EDITOR_URL)
}

</script>

<template>
    <VApp style="background-color: transparent">
        <VNavigationDrawer
            permanent
            :width="300"
            @mouseleave="closeNavigationPanel"
        >
            <VListItem>
                evitaLab
            </VListItem>
            <VDivider/>

            <VList
                :selected="activatedConnections"
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

            <VBtn @click="addConnection">
                Add connection
            </VBtn>
        </VNavigationDrawer>
<!-- todo lho use modal background-->
        <VMain style="background-color: #00000055"></VMain>
    </VApp>
</template>
