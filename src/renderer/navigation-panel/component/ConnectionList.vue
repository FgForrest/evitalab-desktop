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
import { NAVIGATION_PANEL_URL } from '../navigationPanelConstants'
import { Toaster, useToaster } from '../../notification/service/Toaster'

const connectionManager: FrontendConnectionManagerIpc = window.labConnectionManager
const modalManager: FrontendModalManagerIpc = window.labModalManager

const toaster: Toaster = useToaster()
const { t } = useI18n()

const activatedConnections = ref<ConnectionId[]>([])
connectionManager.getActiveConnection()
    .then(it => {
        if (it == undefined) {
            activatedConnections.value = []
        } else {
            activatedConnections.value = [it.id]
        }
    })

const connections = ref<ConnectionDto[]>([])
connectionManager.getConnections()
    .then((fetchedConnections: ConnectionDto[]) => connections.value = fetchedConnections)
const connectionsWithDriverUpdate = ref<ConnectionId[]>([])

connectionManager.onConnectionActivation((activated: ConnectionDto | undefined) => {
    if (activated != undefined) {
        activatedConnections.value = [activated.id]
    } else {
        activatedConnections.value = []
    }
})

connectionManager.onConnectionsChange((newConnections: ConnectionDto[]) => {
    connections.value = newConnections
    connectionsWithDriverUpdate.value = []
})

connectionManager.onDriverUpdateAvailable((connectionId: ConnectionId) => {
    if (!connectionsWithDriverUpdate.value.includes(connectionId)) {
        connectionsWithDriverUpdate.value.push(connectionId)
    }
})

function selectConnection(item: any): void {
    try {
        if (!item.value) {
            connectionManager.activateConnection(undefined)
        } else {
            connectionManager.activateConnection(item.id)
        }
        modalManager.closeModal(NAVIGATION_PANEL_URL)
    } catch (e) {
        toaster.error(t(
            'navigation.panel.connection.notification.couldNotActivateConnection',
            { reason: e.message }
        ), e)
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

            <VTooltip v-if="connections.length > 0">
                <template #activator="{ props }">
                    <VBtn
                        v-bind="props"
                        icon
                        density="compact"
                        variant="plain"
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

        <div v-if="connections.length === 0" class="add-first-connection">
            <VBtn @click="addConnection">
                <VIcon>mdi-plus</VIcon>
                {{ t('navigation.panel.button.addConnection') }}
            </VBtn>
        </div>

        <draggable
            v-else
            v-model="connections"
            group="connections"
            item-key="id"
            @end="storeConnectionsOrder"
        >
            <template #item="{ element }">
                <ConnectionListItem
                    :connection="(element as ConnectionDto)"
                    :driver-update-available="connectionsWithDriverUpdate.includes((element as ConnectionDto).id)"
                />
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

.add-first-connection {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}
</style>
