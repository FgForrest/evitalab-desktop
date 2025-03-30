<script setup lang="ts">
import { computed, ref } from 'vue'
import { CONNECTION_EDITOR_URL } from './connectionEditorConstants'
import { ConnectionId } from '../../../main/connection/model/ConnectionId'
import {
    FrontendConnectionManagerIpc
} from '../../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { FrontendDriverManagerIpc } from '../../../preload/renderer/ipc/driver/service/FrontendDriverManagerIpc'
import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'
import { computeShortConnectionName } from '../../../common/utils/connection'
import DriverSelectInput from '../../driver/component/DriverSelectInput.vue'

//@ts-ignore
const connectionManager: FrontendConnectionManagerIpc = window.connectionManager
//@ts-ignore
const modalManager: FrontendModalManagerIpc = window.modalManager
//@ts-ignore
const driverManager: FrontendDriverManagerIpc = window.driverManager

const driverSelectInputRef = ref<InstanceType<typeof DriverSelectInput> | undefined>()

const connectionId = ref<ConnectionId | undefined>(undefined)
const connectionName = ref<string>('')
const serverUrl = ref<string>('')
const driverVersion = ref<string>('')
const latestAvailableDriverVersion = ref<string>('')
const customShortConnectionName = ref<string>('')
const computedShortConnectionName = computed<string>(() => computeShortConnectionName(connectionName.value))
const color = ref<string | undefined>(undefined)

const isNew = computed<boolean>(() => connectionId.value == undefined)
const saving = ref<boolean>(false)
const downloadingDriver = ref<boolean>(false)

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
    customShortConnectionName.value = existingConnection.styling.shortName == undefined ? '' : existingConnection.styling.shortName
    color.value = existingConnection.styling.color == undefined ? '' : existingConnection.styling.color
})

async function save(): Promise<void> {
    // todo lho validation (missing latest driver if no other driver present)

    saving.value = true

    const finalShortConnectionName: string | undefined = customShortConnectionName.value == undefined || customShortConnectionName.value.length === 0
        ? undefined
        : customShortConnectionName.value
    const finalColor: string | undefined = color.value == undefined || color.value.length === 0
        ? undefined
        : color.value
    const finalDriverVersion: string = driverVersion.value != undefined && driverVersion.value.length > 0
        ? driverVersion.value
        : latestAvailableDriverVersion.value

    downloadingDriver.value = true
    try {
        await driverManager.downloadDriver(finalDriverVersion)
        downloadingDriver.value = false
    } catch (e) {
        // todo lho toaster impl
        downloadingDriver.value = false
        return
    }

    if (isNew.value) {
        connectionManager.storeConnection({
            id: undefined,
            name: connectionName.value,
            serverUrl: serverUrl.value,
            driverVersion: finalDriverVersion,
            styling: {
                shortName: finalShortConnectionName,
                color: finalColor
            }
        })
    } else {
        const existingConnection: ConnectionDto | undefined = await connectionManager.getConnection(connectionId.value)
        if (existingConnection == undefined) {
            throw new Error(`Cannot find existing connection for id ${connectionId.value}.`)
        }
        existingConnection.name = connectionName.value
        existingConnection.serverUrl = serverUrl.value
        existingConnection.driverVersion = finalDriverVersion
        existingConnection.styling.shortName = finalShortConnectionName
        existingConnection.styling.color = finalColor
        connectionManager.storeConnection(existingConnection)
    }

    saving.value = false

    close()
    reset()
}

function cancel(): void {
    close()
    reset()
}

function reset(): void {
    connectionId.value = undefined
    connectionName.value = ''
    serverUrl.value = ''
    driverVersion.value = ''
    latestAvailableDriverVersion.value = ''
    customShortConnectionName.value = ''
    color.value = ''
}

function close(): void {
    modalManager.closeModal(CONNECTION_EDITOR_URL)
}

async function downloadDriver(): Promise<void> {
    await driverSelectInputRef.value?.downloadDriver()
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
                            v-model="customShortConnectionName"
                            :placeholder="computedShortConnectionName"
                            :persistent-placeholder="computedShortConnectionName.length > 0"
                            label="Short connection name"
                        />
                        <VTextField
                            v-model="serverUrl"
                            label="Server URL"
                        />
                        <VMenu>
                            <template #activator="{ props }">
                                <VBtn v-bind="props">
                                    <template #prepend>
                                        <VAvatar :color="color" size="16"/>
                                    </template>
                                    <span>
                                        Color
                                    </span>
                                </VBtn>
                            </template>

                            <template #default>
                                <VColorPicker
                                    v-model="color"
                                    hide-canvas
                                    hide-inputs
                                    show-swatches
                                />
                            </template>
                        </VMenu>

<!--                        todo lho disable if serverUrl not valid instead-->
                        <DriverSelectInput
                            v-model="driverVersion"
                            @update:latest-available-driver-version="latestAvailableDriverVersion = $event"
                            :disabled="serverUrl == undefined || serverUrl.length === 0"
                            :server-url="serverUrl"
                        />
                    </VForm>
                </VCardText>

                <VCardActions>
                    <VSpacer />

                    <VBtn @click="cancel">
                        Cancel
                    </VBtn>
                    <VBtn
                        :loading="saving"
                        @click="save"
                    >
                        <template v-if="downloadingDriver">
                            Downloading driver...
                        </template>
                        <template v-else-if="isNew">
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
