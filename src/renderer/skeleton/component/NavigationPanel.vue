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
import { FrontendAppUpdateManagerIpc } from '../../../preload/renderer/ipc/update/service/FrontendAppUpdateManagerIpc'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '../../notification/service/Toaster'

const appUpdateManager: FrontendAppUpdateManagerIpc = window.labAppUpdateManager
const connectionManager: FrontendConnectionManagerIpc = window.labConnectionManager
const modalManager: FrontendModalManagerIpc = window.labModalManager
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = withDefaults(defineProps<{
    modelValue?: boolean
}>(), {
    modelValue: true
})

const userHovering = ref<boolean>(false)

const activatedConnections = ref<ConnectionId[]>([])
connectionManager.getActiveConnection()
    .then(it => {
        if (it == undefined) {
            activatedConnections.value = []
        } else {
            activatedConnections.value = [it.id]
        }
    })
const connectionsWithDriverUpdate = ref<ConnectionId[]>([])

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
    } catch (e) {
        toaster.error(t(
            'navigation.panel.connection.notification.couldNotActivateConnection',
            { reason: e.message }
        ), e)
    }
}

function openNavigationPanel(): void {
    modalManager.openModal(NAVIGATION_PANEL_URL)
}

const appUpdateAvailable = ref<boolean>(false)
appUpdateManager.isUpdateAvailable()
    .then(it => appUpdateAvailable.value = it)
</script>

<template>
    <VNavigationDrawer
        :model-value="modelValue"
        permanent
        rail
        class="bg-primary-dark"
        @mouseenter="userHovering = true"
        @mouseleave="userHovering = false"
    >
        <template #prepend>
            <div class="app-avatar-container">
                <VBtn v-if="userHovering" icon variant="text" @click="openNavigationPanel">
                    <VIcon>mdi-menu</VIcon>
                </VBtn>
                <VAvatar v-else size="30px">
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
                @click:select="selectConnection"
            >
                <VBadge
                    v-for="connection in connections" :key="connection.id"
                    :model-value="connectionsWithDriverUpdate.includes(connection.id)"
                    color="warning"
                    dot
                    @click.right="openNavigationPanel"
                >
                    <VListItem :value="connection.id">
                        <ConnectionAvatar :connection="connection" />
                    </VListItem>
                </VBadge>
            </VList>
        </template>

        <template #append>
            <!-- just a visual aid to help new users find hidden navigation panel -->
            <VList>
                <VListItem>
                    <a href="https://evitadb.io/documentation" target="_blank">
                        <img src="/documentation.svg" :alt="t('navigation.panel.link.evitaDBDocumentation.icon.alt')">
                        <VTooltip activator="parent">
                            {{ t('navigation.panel.link.evitaDBDocumentation.tooltip') }}
                        </VTooltip>
                    </a>
                </VListItem>
                <VListItem>
                    <a href="https://discord.gg/VsNBWxgmSw" target="_blank">
                        <img src="/discord.svg" :alt="t('navigation.panel.link.discord.icon.alt')">
                        <VTooltip activator="parent">
                            {{ t('navigation.panel.link.discord.tooltip') }}
                        </VTooltip>
                    </a>
                </VListItem>
                <VListItem
                    v-if="appUpdateAvailable"
                    prepend-icon="mdi-alert-decagram-outline"
                    color="warning"
                ></VListItem>
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
