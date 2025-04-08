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
import { computeShortConnectionName } from '../../../common/util/connection'
import DriverSelect from '../../driver/component/DriverSelect.vue'
import VFormDialog from '../../common/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import ky from 'ky'
import VColorSelect from '../../common/component/VColorSelect.vue'
import ModalWindow from '../../common/component/ModalWindow.vue'
import { Toaster, useToaster } from '../../notification/service/Toaster'

enum ConnectionTestResult {
    NotTested,
    Success,
    Failure
}

const connectionManager: FrontendConnectionManagerIpc = window.labConnectionManager
const modalManager: FrontendModalManagerIpc = window.labModalManager
const driverManager: FrontendDriverManagerIpc = window.labDriverManager
const toaster: Toaster = useToaster()
const { t } = useI18n()

const connectionId = ref<ConnectionId | undefined>(undefined)
const connectionName = ref<string>('')
const customShortConnectionName = ref<string>('')
const computedShortConnectionName = computed<string>(() => computeShortConnectionName(connectionName.value))

const serverUrl = ref<string>('')
const connectionTesting = ref<boolean>(false)
const connectionTestResult = ref<ConnectionTestResult>(ConnectionTestResult.NotTested)
const connectionTestResultIndicator = computed<string>(() => {
    if (connectionTesting.value) {
        return ''
    }
    switch (connectionTestResult.value) {
        case ConnectionTestResult.NotTested:
            return ''
        case ConnectionTestResult.Success:
            return 'mdi-check-circle-outline'
        case ConnectionTestResult.Failure:
            return 'mdi-close-circle-outline'
    }
})

const driverVersion = ref<string>('')
const latestAvailableDriverVersion = ref<string>('')

const color = ref<string | undefined>(undefined)

const isNew = computed<boolean>(() => connectionId.value == undefined)
const downloadingDriver = ref<boolean>(false)
const changed = computed<boolean>(() =>
    (connectionName.value != undefined && connectionName.value.length > 0) &&
    (serverUrl.value != undefined && serverUrl.value.length > 0) &&
    (
        (driverVersion.value != undefined && driverVersion.value.length > 0) ||
        (latestAvailableDriverVersion.value != undefined && latestAvailableDriverVersion.value.length > 0)
    ))

const connectionNameRules = [
    (value: any) => {
        if (value) return true
        return t('connection.editor.form.connectionName.validations.required')
    },
    async (value: any) => {
        const similarConnection: ConnectionDto | undefined = await connectionManager.getSimilarConnection(value)
        if (similarConnection == undefined || similarConnection.id === connectionId.value) {
            return true
        }
        return t('connection.editor.form.connectionName.validations.duplicate')
    }
]
const shortConnectionNameRules = [
    (value: string | undefined) => {
        if (value == undefined || value.trim() === '') return true
        if (value.trim().length > 3) {
            return t('connection.editor.form.shortConnectionName.validations.tooLong')
        }
        return true
    }
]
const serverUrlRules = [
    (value: any) => {
        if (value) return true
        return t('connection.editor.form.serverUrl.validations.required')
    },
    (value: any) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return t('connection.editor.form.serverUrl.validations.invalidUrl')
        }
    },
    async (value: any) => {
        const resultError: string | undefined = await testConnection(value)
        if (resultError == undefined) {
            connectionTestResult.value = ConnectionTestResult.Success
            return true
        }
        connectionTestResult.value = ConnectionTestResult.Failure
        return resultError
    }
]

async function testConnection(serverUrl: string): Promise<string | undefined> {
    connectionTesting.value = true
    try {
        const normalizedUrl: string = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/'
        const serverStatus: any = await ky.post(
            `${normalizedUrl}io.evitadb.externalApi.grpc.generated.EvitaManagementService/ServerStatus`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: '{}'
            }
        )
            .json()

        if (serverStatus.readiness !== 'API_READY') {
            return t('connection.editor.form.serverUrl.validations.notReady')
        }
        if (serverStatus.api.lab?.enabled !== true) {
            return t('connection.editor.form.serverUrl.validations.labApiMissing')
        }
        if (serverStatus.api.gRPC?.enabled !== true) {
            return t('connection.editor.form.serverUrl.validations.grpcApiMissing')
        }

        connectionTesting.value = false
        return undefined
    } catch (e) {
        connectionTesting.value = false
        return t('connection.editor.form.serverUrl.validations.unreachable')
    }
}

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

async function save(): Promise<boolean> {
    try {
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
            await toaster.error(t(
                'connection.editor.notification.couldNotDownloadDriver',
                { reason: e.message }
            ), e)
            downloadingDriver.value = false
            return false
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

            await toaster.success(t(
                'connection.editor.notification.connectionAdded',
                { connectionName: connectionName.value }
            ))
        } else {
            const existingConnection: ConnectionDto | undefined = await connectionManager.getConnection(connectionId.value)
            if (existingConnection == undefined) {
                throw new Error(`Could not find existing connection for id ${connectionId.value}.`)
            }
            existingConnection.name = connectionName.value
            existingConnection.serverUrl = serverUrl.value
            existingConnection.driverVersion = finalDriverVersion
            existingConnection.styling.shortName = finalShortConnectionName
            existingConnection.styling.color = finalColor
            connectionManager.storeConnection(existingConnection)

            await toaster.success(t(
                'connection.editor.notification.connectionUpdated',
                { connectionName: connectionName.value }
            ))
        }

        return true
    } catch (e: any) {
        await toaster.error(t(
            'connection.editor.notification.couldNotSaveConnection',
            { reason: e.message }
        ), e)
        return false
    }
}

function reset(): void {
    close()

    connectionId.value = undefined
    connectionName.value = ''
    serverUrl.value = ''
    connectionTestResult.value = ConnectionTestResult.NotTested
    driverVersion.value = ''
    latestAvailableDriverVersion.value = ''
    customShortConnectionName.value = ''
    color.value = ''
}

function close(): void {
    modalManager.closeModal(CONNECTION_EDITOR_URL)
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
            :changed="changed"
            confirm-button-icon="mdi-content-save"
            :confirm="save"
            :reset="reset"
            @update:model-value="handleVisibilityChange($event)"
        >
            <template #title>
                <template v-if="isNew">
                    {{ t('connection.editor.title.add') }}
                </template>
                <template v-else>
                    {{ t('connection.editor.title.edit') }}
                </template>
            </template>

            <template #default>
                <VTextField
                    v-model="connectionName"
                    :label="t('connection.editor.form.connectionName.label')"
                    placeholder="evitaDB"
                    :rules="connectionNameRules"
                    required
                />
                <div class="styling-box">
                    <VTextField
                        v-model="customShortConnectionName"
                        :label="t('connection.editor.form.shortConnectionName.label')"
                        :hint="t('connection.editor.form.shortConnectionName.hint')"
                        :placeholder="computedShortConnectionName"
                        :persistent-placeholder="computedShortConnectionName.length > 0"
                        :rules="shortConnectionNameRules"
                    />
                    <VColorSelect
                        v-model="color"
                        :label="t('connection.editor.form.color.label')"
                        :hint="t('connection.editor.form.color.hint')"
                    />
                </div>

                <VListSubheader>Server</VListSubheader>
                <VTextField
                    v-model="serverUrl"
                    :label="t('connection.editor.form.serverUrl.label')"
                    placeholder="https://{evitadb-server}:5555"
                    :hint="t('connection.editor.form.serverUrl.hint')"
                    required
                    :rules="serverUrlRules"
                    :loading="connectionTesting"
                    :append-inner-icon="connectionTestResultIndicator"
                />

                <DriverSelect
                    v-model="driverVersion"
                    @update:latest-available-driver-version="latestAvailableDriverVersion = $event"
                    :disabled="serverUrl == undefined || serverUrl.length === 0"
                    :server-url="serverUrl"
                />
            </template>

            <template #confirm-button-body>
                <template v-if="downloadingDriver">
                    {{ t('connection.editor.button.downloadingDriver') }}
                </template>
                <template v-else-if="isNew">
                    {{ t('common.button.add') }}
                </template>
                <template v-else>
                    {{ t('common.button.save') }}
                </template>
            </template>
        </VFormDialog>
    </ModalWindow>
</template>

<style lang="scss" scoped>
.styling-box {
    width: 100%;
    display: inline-grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
</style>
