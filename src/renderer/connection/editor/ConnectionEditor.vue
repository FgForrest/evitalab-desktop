<script setup lang="ts">
import { ModalManagerApi } from '../../../preload/api/ModalManagerApi'
import { ConnectionManagerApi } from '../../../preload/api/ConnectionManagerApi'
import { ref } from 'vue'
import { Connection } from '../../../main/connection/model/Connection'
import { CONNECTION_EDITOR_URL } from './connectionEditorConstants'

//@ts-ignore
const connectionManager: ConnectionManagerApi = window.connectionManager
//@ts-ignore
const modalManager: ModalManagerApi = window.modalManager

const connectionName = ref<string>('')
const serverUrl = ref<string>('')

function reset(): void {
    connectionName.value = ''
    serverUrl.value = ''
}

function add(): void {
    connectionManager.addConnection(new Connection(
        undefined,
        connectionName.value,
        serverUrl.value,
        '1'
    ))
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
                    Add connection
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
                    <VBtn @click="add">
                        Add
                    </VBtn>
                </VCardActions>
            </VCard>
        </VDialog>
    </VApp>
</template>

<style lang="scss" scoped>

</style>
