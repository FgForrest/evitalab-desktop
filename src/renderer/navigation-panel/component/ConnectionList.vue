<script setup lang="ts">

import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'
import ConnectionListItem from './ConnectionListItem.vue'
import draggable from 'vuedraggable'
import { CONNECTION_EDITOR_URL } from '../../connection/editor/connectionEditorConstants'
import { ref } from 'vue'
import { ConnectionId } from '../../../main/connection/model/ConnectionId'
import { FrontendConnectionManagerIpc } from '../../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { useI18n } from 'vue-i18n'

//@ts-ignore
const connectionManager: FrontendConnectionManagerIpc = window.connectionManager
//@ts-ignore
const modalManager: FrontendModalManagerIpc = window.modalManager

const { t } = useI18n()

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

function selectConnection(item: any): void {
    if (!item.value) {
        connectionManager.activateConnection(undefined)
    } else {
        connectionManager.activateConnection(item.id)
    }
}

function addConnection(): void {
    modalManager.openModal(CONNECTION_EDITOR_URL)
}

function storeConnectionsOrder(): void {
    connectionManager.storeConnectionsOrder(connections.value.map(it => it.id))
}
</script>

<template>
    <VList
        :selected="activatedConnections"
        density="compact"
        nav
        @click:select="selectConnection"
    >
        <div class="connections-header">
            <span class="text-gray-light text-sm-body-2 font-weight-medium">
                {{ t('navigation.panel.connection.title') }}
            </span>

            <VTooltip>
                <template #activator="{ props }">
                    <VBtn
                        v-bind="props"
                        icon
                        density="compact"
                        variant="text"
                        style="padding: 0 !important;"
                        @click="addConnection"
                    >
                        <VIcon>mdi-plus</VIcon>
                    </VBtn>
                </template>
                <template #default>
                    {{ t('navigation.panel.button.addConnection') }}
                </template>
            </VTooltip>
        </div>

        <draggable
            v-model="connections"
            group="connections"
            item-key="id"
            @end="storeConnectionsOrder"
        >
            <template #item="{ element }">
                <ConnectionListItem :connection="(element as ConnectionDto)" />
            </template>
        </draggable>
    </VList>
</template>

<style lang="scss" scoped>

.connections-header {
    width: 100%;
    display: inline-grid;
    grid-template-columns: auto 1.5rem;
    gap: 0.5rem;
    padding: 0 0.5rem 0 0.5rem;
    height: 2rem;
    align-items: center;
}
</style>
