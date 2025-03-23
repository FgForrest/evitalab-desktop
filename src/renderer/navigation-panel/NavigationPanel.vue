<script setup lang="ts">
import { ref } from 'vue'
import ConnectionAvatar from '../skeleton/component/ConnectionAvatar.vue'
import { ConnectionId } from '../../main/connection/model/ConnectionId'
import { CONNECTION_EDITOR_URL } from '../connection/editor/connectionEditorConstants'
import { NAVIGATION_PANEL_URL } from './navigationPanelConstants'
import { FrontendConnectionManagerIpc } from '../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendModalManagerIpc } from '../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { ConnectionDto } from '../../common/ipc/connection/model/ConnectionDto'

//@ts-ignore
const connectionManager: FrontendConnectionManagerIpc = window.connectionManager
//@ts-ignore
const modalManager: FrontendModalManagerIpc = window.modalManager

const shown = ref<boolean>(false)
const activatedConnections = ref<ConnectionId[]>([])
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

function editConnection(connectionId: ConnectionId): void {
    modalManager.openModal(CONNECTION_EDITOR_URL, connectionId)
}

function deleteConnection(connectionId: ConnectionId): void {
    // todo lho confirmation modal
    connectionManager.removeConnection(connectionId)
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

                    <template #append>
                        <VBtn icon @click.stop="editConnection(connection.id)">
                            <VIcon>mdi-pencil</VIcon>
                        </VBtn>
                        <VBtn icon @click.stop="deleteConnection(connection.id)">
                            <VIcon>mdi-close</VIcon>
                        </VBtn>
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
