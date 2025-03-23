<script setup lang="ts">
import { ref } from 'vue'
import ConnectionAvatar from '../skeleton/component/ConnectionAvatar.vue'
import { ConnectionId } from '../../main/connection/model/ConnectionId'
import { CONNECTION_EDITOR_URL } from '../connection/editor/connectionEditorConstants'
import { NAVIGATION_PANEL_URL } from './navigationPanelConstants'
import { FrontendConnectionManagerIpc } from '../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendModalManagerIpc } from '../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { ConnectionDto } from '../../common/ipc/connection/model/ConnectionDto'
import draggable from 'vuedraggable'

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

function storeConnectionsOrder(): void {
    connectionManager.storeConnectionsOrder(connections.value.map(it => it.id))
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
                <draggable
                    v-model="connections"
                    group="connections"
                    item-key="id"
                    @end="storeConnectionsOrder"
                >
                    <template #item="{ element }">
                        <VListItem :value="(element as ConnectionDto).id">
                            <template #prepend>
                                <ConnectionAvatar :connection="element" />
                            </template>

                            <template #title>
                                {{ (element as ConnectionDto).name }}
                            </template>

                            <template #append>
                                <VBtn icon @click.stop="editConnection((element as ConnectionDto).id)">
                                    <VIcon>mdi-pencil</VIcon>
                                </VBtn>
                                <VBtn icon @click.stop="deleteConnection((element as ConnectionDto).id)">
                                    <VIcon>mdi-close</VIcon>
                                </VBtn>
                            </template>
                        </VListItem>
                    </template>

                </draggable>
            </VList>

            <VBtn @click="addConnection">
                Add connection
            </VBtn>
        </VNavigationDrawer>
<!-- todo lho use modal background-->
        <VMain style="background-color: #00000055"></VMain>
    </VApp>
</template>
