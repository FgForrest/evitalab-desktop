<script setup lang="ts">

import ModalWindow from '../../common/component/ModalWindow.vue'
import VFormDialog from '../../common/component/VFormDialog.vue'
import { CONNECTION_REMOVE_DIALOG_URL } from './connectionRemoveDialogConstants'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import {
    FrontendConnectionManagerIpc
} from '../../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { ConnectionId } from '../../../main/connection/model/ConnectionId'
import { computed, ref, watch } from 'vue'
import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'
import { useI18n } from 'vue-i18n'

//@ts-ignore
const connectionManager: FrontendConnectionManagerIpc = window.connectionManager
//@ts-ignore
const modalManager: FrontendModalManagerIpc = window.modalManager

const { t } = useI18n()

const connectionId = ref<ConnectionId | undefined>(undefined)
const connection = ref<ConnectionDto | undefined>(undefined)

const changed = computed<boolean>(() =>
    connectionId.value != undefined)

modalManager.onModalArgsPassed(async (url: string, args: any[]) => {
    if (url !== CONNECTION_REMOVE_DIALOG_URL) {
        return
    }
    if (args.length === 0) {
        return
    }
    if (args.length > 1 || typeof args[0] !== 'string') {
        throw new Error(`Invalid connection remove dialog arguments: ${args}`)
    }
    const existingConnectionId: ConnectionId = args[0] as ConnectionId
    const existingConnection: ConnectionDto = await connectionManager.getConnection(existingConnectionId)
    if (existingConnection == undefined) {
        throw new Error(`Could not find connection for id ${existingConnectionId}.`)
    }

    connectionId.value = existingConnectionId
    connection.value = existingConnection
})

async function removeConnection(): Promise<boolean> {
    try {
        connectionManager.removeConnection(connectionId.value)
        // todo lho impl
        // toaster.success(t(
        //     'explorer.connection.remove.notification.connectionRemoved',
        //     {
        //         connectionName: connection.value.name
        //     }
        // ))
        return true
    } catch (e: any) {
        // todo lho impl
        // toaster.error(t(
        //     'explorer.connection.remove.notification.couldNotRemoveConnection',
        //     {
        //         connectionName: connection.value.name,
        //         reason: e.message
        //     }
        // ))
        return false
    }
}

function reset(): void {
    close()

    connectionId.value = undefined
    connection.value = undefined
}

function close(): void {
    modalManager.closeModal(CONNECTION_REMOVE_DIALOG_URL)
}

function handleVisibilityChange(visible: boolean): void {
    if (!visible) {
        close()
    }
}
</script>

<template>
    <ModalWindow>
        <VFormDialog
            :model-value="true"
            dangerous
            :changed="changed"
            confirm-button-icon="mdi-delete-outline"
            :confirm="removeConnection"
            :reset="reset"
            @update:model-value="handleVisibilityChange($event)"
        >
            <template #title>
                <I18nT keypath="connection.removeDialog.title">
                    <template #connectionName>
                        <strong>{{ connection.name }}</strong>
                    </template>
                </I18nT>
            </template>

            <template #prepend-form>
                {{ t('connection.removeDialog.question') }}
            </template>

            <template #confirm-button-body>
                {{ t('common.button.remove') }}
            </template>
        </VFormDialog>
    </ModalWindow>
</template>

<style lang="scss" scoped>

</style>
