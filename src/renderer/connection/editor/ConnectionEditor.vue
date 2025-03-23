<script setup lang="ts">
import { computed, ref } from 'vue'
import { CONNECTION_EDITOR_URL } from './connectionEditorConstants'
import { ConnectionId } from '../../../main/connection/model/ConnectionId'
import {
    FrontendConnectionManagerIpc
} from '../../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'

//@ts-ignore
const connectionManager: FrontendConnectionManagerIpc = window.connectionManager
//@ts-ignore
const modalManager: FrontendModalManagerIpc = window.modalManager

const connectionId = ref<ConnectionId | undefined>(undefined)
const connectionName = ref<string>('')
const serverUrl = ref<string>('')
const driverVersion = ref<string>('1')

const isNew = computed<boolean>(() => connectionId.value == undefined)

modalManager.onModalArgsPassed(async (url: string, args: any[]) => {
    if (url !== CONNECTION_EDITOR_URL) {
        return
    }
    if (args.length === 0) {
        return
    }
    if (args.length > 1 || typeof args[0] !== 'string') {
        throw new Error(`Invalid connection editor arguments: ${args}`)
    }
    const existingConnectionId: ConnectionId = args[0] as ConnectionId
    const existingConnection: ConnectionDto = await connectionManager.getConnection(existingConnectionId)
    if (existingConnection == undefined) {
        throw new Error(`Could not find connection for id ${existingConnectionId}.`)
    }

    connectionId.value = existingConnectionId
    connectionName.value = existingConnection.name
    serverUrl.value = existingConnection.serverUrl
    driverVersion.value = existingConnection.driverVersion
})

function reset(): void {
    connectionId.value = undefined
    connectionName.value = ''
    serverUrl.value = ''
    driverVersion.value = '1'
}

async function save(): Promise<void> {
    if (isNew.value) {
        connectionManager.storeConnection({
            id: undefined,
            name: connectionName.value,
            serverUrl: serverUrl.value,
            driverVersion: '1'
        })
    } else {
        const existingConnection: ConnectionDto | undefined = await connectionManager.getConnection(connectionId.value)
        if (existingConnection == undefined) {
            throw new Error(`Cannot find existing connection for id ${connectionId.value}.`)
        }
        existingConnection.name = connectionName.value
        existingConnection.serverUrl = serverUrl.value
        existingConnection.driverVersion = driverVersion.value
        connectionManager.storeConnection(existingConnection)
    }
    close()
    reset()
}

function cancel(): void {
    close()
    reset()
}

function close(): void {
    modalManager.closeModal(CONNECTION_EDITOR_URL)
}
</script>

<template>
    <VApp style="background-color: transparent">
<!--        todo lho VLabDialog-->
        <VDialog :model-value="true" persistent>
            <VCard>
                <VCardTitle>
                    <template v-if="isNew">
                        Add connection
                    </template>
                    <template v-else>
                        Edit connection
                    </template>
                </VCardTitle>

                <VCardText>
                    <VForm>
                        <VTextField
                            v-model="connectionName"
                            label="Connection name"
                        />
                        <VTextField
                            v-model="serverUrl"
                            label="Server URL"
                        />
                    </VForm>
                </VCardText>

                <VCardActions>
                    <VSpacer />

                    <VBtn @click="cancel">
                        Cancel
                    </VBtn>
                    <VBtn @click="save">
                        <template v-if="isNew">
                            Add
                        </template>
                        <template v-else>
                            Save
                        </template>
                    </VBtn>
                </VCardActions>
            </VCard>
        </VDialog>
    </VApp>
</template>

<style lang="scss" scoped>

</style>
