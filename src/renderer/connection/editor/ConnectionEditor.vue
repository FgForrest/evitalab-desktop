<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CONNECTION_EDITOR_URL } from './connectionEditorConstants'
import { ConnectionId } from '../../../main/connection/model/ConnectionId'
import {
    FrontendConnectionManagerIpc
} from '../../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { FrontendDriverManagerIpc } from '../../../preload/renderer/ipc/driver/service/FrontendDriverManagerIpc'
import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'
import DriverSelect from '../../driver/component/DriverSelect.vue'
import VFormDialog from '../../common/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import VColorSelect from '../../common/component/VColorSelect.vue'
import ModalWindow from '../../common/component/ModalWindow.vue'
import { Toaster, useToaster } from '../../notification/service/Toaster'
import debounce from '../../util/debounce'
import { ServerMetadataProvider } from './service/ServerMetadataProvider'
import { ConnectionEnvironment } from '../../../main/connection/model/ConnectionEnvironment'

const connectionManager: FrontendConnectionManagerIpc = window.labConnectionManager
const modalManager: FrontendModalManagerIpc = window.labModalManager
const driverManager: FrontendDriverManagerIpc = window.labDriverManager
const toaster: Toaster = useToaster()
const { t } = useI18n()
const serverMetadataProvider: ServerMetadataProvider = new ServerMetadataProvider()

enum ConnectionTestResult {
    NotTested,
    Success,
    Failure
}

const availableEnvironments = [
    {
        title: t(`connection.editor.form.environment.type.${ConnectionEnvironment.Development}`),
        value: ConnectionEnvironment.Development
    },
    {
        title: t(`connection.editor.form.environment.type.${ConnectionEnvironment.Test}`),
        value: ConnectionEnvironment.Test
    },
    {
        title: t(`connection.editor.form.environment.type.${ConnectionEnvironment.Production}`),
        value: ConnectionEnvironment.Production
    }
]

const connectionId = ref<ConnectionId | undefined>(undefined)

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

const suggestedConnectionName = ref<string>('')
watch(
    serverUrl,
    () => {
        if (serverUrl.value != undefined && serverUrl.value.trim().length > 0) {
            debouncedResolveSuggestedConnectionName()
        } else {
            suggestedConnectionName.value = ''
        }
    }
)
const customConnectionName = ref<string>('')

const driverVersion = ref<string>('')
const latestAvailableDriverVersion = ref<string>('')

const color = ref<string | undefined>(undefined)
const environment = ref<ConnectionEnvironment | undefined>(undefined)

const isNew = computed<boolean>(() => connectionId.value == undefined)
const downloadingDriver = ref<boolean>(false)
const changed = computed<boolean>(() =>
    (
        (suggestedConnectionName.value != undefined && suggestedConnectionName.value.length > 0) ||
        (customConnectionName.value != undefined && customConnectionName.value.length > 0)
    ) &&
    (serverUrl.value != undefined && serverUrl.value.length > 0) &&
    (
        (driverVersion.value != undefined && driverVersion.value.length > 0) ||
        (latestAvailableDriverVersion.value != undefined && latestAvailableDriverVersion.value.length > 0)
    ))

const connectionNameRules = [
    (value: string | undefined) => {
        if (value != undefined && value.trim().length > 0) return true
        if (suggestedConnectionName.value.trim().length > 0) return true
        return t('connection.editor.form.connectionName.validations.required')
    },
    async (value: string) => {
        const similarConnection: ConnectionDto | undefined = await connectionManager.getSimilarConnection(value)
        if (similarConnection == undefined || similarConnection.id === connectionId.value) {
            return true
        }
        return t('connection.editor.form.connectionName.validations.duplicate')
    }
]
const serverUrlRules = [
    (value: string) => {
        if (value.trim().length > 0) return true
        return t('connection.editor.form.serverUrl.validations.required')
    },
    (value: string) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return t('connection.editor.form.serverUrl.validations.invalidUrl')
        }
    },
    async (value: string) => {
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
    const result: string | undefined = await serverMetadataProvider.testConnection(serverUrl)
    connectionTesting.value = false
    return result
}


const debouncedResolveSuggestedConnectionName = debounce(
    () => serverMetadataProvider.resolveServerName(serverUrl.value)
        .then(name => {
            if (name != undefined) {
                suggestedConnectionName.value = name
            }
        }),
    500
)

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
    customConnectionName.value = existingConnection.name
    serverUrl.value = existingConnection.serverUrl
    driverVersion.value = existingConnection.driverVersion
    color.value = existingConnection.styling.color == undefined ? '' : existingConnection.styling.color
    environment.value = existingConnection.styling.environment
})

async function save(): Promise<boolean> {
    try {
        if (customConnectionName.value == undefined || customConnectionName.value.trim().length === 0) {
            const similarConnection: ConnectionDto | undefined = await connectionManager.getSimilarConnection(suggestedConnectionName.value)
            if (similarConnection != undefined && similarConnection.id !== connectionId.value) {
                await toaster.error(t(
                    'connection.editor.notification.similarNamedConnectionExists',
                    { suggestedConnectionName: suggestedConnectionName.value }
                ))
                return false
            }
        }

        const finalConnectionName: string | undefined = customConnectionName.value == undefined || customConnectionName.value.length === 0
            ? suggestedConnectionName.value
            : customConnectionName.value
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
                name: finalConnectionName,
                serverUrl: serverUrl.value,
                driverVersion: finalDriverVersion,
                styling: {
                    color: finalColor,
                    environment: environment.value
                }
            })

            await toaster.success(t(
                'connection.editor.notification.connectionAdded',
                { connectionName: finalConnectionName }
            ))
        } else {
            const existingConnection: ConnectionDto | undefined = await connectionManager.getConnection(connectionId.value)
            if (existingConnection == undefined) {
                throw new Error(`Could not find existing connection for id ${connectionId.value}.`)
            }
            existingConnection.name = finalConnectionName
            existingConnection.serverUrl = serverUrl.value
            existingConnection.driverVersion = finalDriverVersion
            existingConnection.styling.color = finalColor
            existingConnection.styling.environment = environment.value
            await connectionManager.storeConnection(existingConnection)

            await toaster.success(t(
                'connection.editor.notification.connectionUpdated',
                { connectionName: finalConnectionName }
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
    connectionId.value = undefined
    suggestedConnectionName.value = ''
    customConnectionName.value = ''
    serverUrl.value = ''
    connectionTestResult.value = ConnectionTestResult.NotTested
    driverVersion.value = ''
    latestAvailableDriverVersion.value = ''
    color.value = ''
    environment.value = undefined
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
                <VListSubheader>{{ t('connection.editor.form.serverFieldset.label') }}</VListSubheader>
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

                <VListSubheader>{{ t('connection.editor.form.connectionFieldset.label') }}</VListSubheader>
                <VTextField
                    v-model="customConnectionName"
                    :label="t('connection.editor.form.connectionName.label')"
                    :placeholder="suggestedConnectionName"
                    :persistent-placeholder="suggestedConnectionName.length > 0"
                    :rules="connectionNameRules"
                    required
                />
                <div class="styling-box">
                    <VColorSelect
                        v-model="color"
                        :label="t('connection.editor.form.color.label')"
                        :hint="t('connection.editor.form.color.hint')"
                    />
                    <VSelect
                        v-model="environment"
                        :label="t('connection.editor.form.environment.label')"
                        :hint="t('connection.editor.form.environment.hint')"
                        clearable
                        :items="availableEnvironments"
                    />
                </div>
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
