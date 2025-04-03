<script setup lang="ts">
/**
 * Select input for selecting evitaLab driver version for a evitaDB server
 */

import { computed, ref, watch } from 'vue'
import semver from 'semver/preload'
import { FrontendDriverManagerIpc } from '../../../preload/renderer/ipc/driver/service/FrontendDriverManagerIpc'
import { DriverDto } from '../../../common/ipc/driver/model/DriverDto'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

//@ts-ignore
const driverManager: FrontendDriverManagerIpc = window.driverManager

const props = withDefaults(
    defineProps<{
        serverUrl?: string,
        disabled?: boolean
    }>(),
    {
        serverUrl: undefined,
        disabled: false
    }
)
const emit = defineEmits<{
    (e: 'update:latestAvailableDriverVersion', value: string | undefined): void
}>()

watch(
    () => props.serverUrl,
    async () => await resolveLatestAvailableDriver()
)

const usedDriverVersion = defineModel<string>()
const isUsedDriverVersionPresent = computed<boolean>(() => {
    return usedDriverVersion.value != undefined && usedDriverVersion.value.length > 0
})
const usedDriver = ref<DriverDto | undefined>(undefined)
watch(
    usedDriverVersion,
    async () => {
        if (isUsedDriverVersionPresent.value) {
            usedDriver.value = await driverManager.getDriver(usedDriverVersion.value)
        } else {
            usedDriver.value = undefined
        }
    }
)

const resolvingLatestAvailableDriver = ref<boolean>(false)
const latestAvailableDriver = ref<DriverDto | undefined>(undefined)
watch(
    latestAvailableDriver,
    () => emit('update:latestAvailableDriverVersion', latestAvailableDriver.value?.version)
)

const usedDriverTooOld = computed<boolean>(() => {
    if (usedDriver.value == undefined || latestAvailableDriver.value == undefined) {
        return false
    }
    return semver.gt(
        latestAvailableDriver.value.minServerVersion,
        usedDriver.value.minServerVersion
    )
})

const isNewerDriverAvailable = computed<boolean>(() => {
    if (!isUsedDriverVersionPresent.value || latestAvailableDriver.value == undefined) {
        return false
    }
    return semver.gt(
        latestAvailableDriver.value.version,
        usedDriverVersion.value
    )
})
const isNewestDriverApplied = computed<boolean>(() => {
    if (latestAvailableDriver.value == undefined) {
        return false
    }
    if (!isUsedDriverVersionPresent.value) {
        return true
    }
    return usedDriverVersion.value === latestAvailableDriver.value.version
})

async function resolveLatestAvailableDriver(): Promise<void> {
    resolvingLatestAvailableDriver.value = true

    if (props.serverUrl == undefined || props.serverUrl.length === 0) {
        latestAvailableDriver.value = undefined
    } else {
        try {
            new URL(props.serverUrl) // validate url
            try {
                latestAvailableDriver.value = await driverManager.resolveLatestAvailableDriver(props.serverUrl)
            } catch (e) {
                // todo lho impl toaster
                console.error(e)
                // server probably not reachable
                latestAvailableDriver.value = undefined
            }
        } catch (e) {
            // serverUrl not URL, abort
            latestAvailableDriver.value = undefined
        }
    }

    resolvingLatestAvailableDriver.value = false
}

function chooseNewerDriver(): void {
    if (isNewerDriverAvailable.value) {
        usedDriverVersion.value = latestAvailableDriver.value.version
    }
}

</script>

<template>
    <div :class="['driver-select-input', { 'driver-select-input--with-used-driver': isUsedDriverVersionPresent }]">
        <VTextField
            v-if="isUsedDriverVersionPresent"
            :model-value="usedDriverVersion"
            readonly
            :disabled="disabled"
            :label="t('connection.editor.driverSelect.usedDriver.label')"
            :color="usedDriverTooOld ? 'warning' : undefined"
        >
            <template #prepend-inner>
                <VTooltip v-if="usedDriverTooOld">
                    <template #activator="{ props }">
                        <VIcon v-bind="props">
                            mdi-alert-outline
                        </VIcon>
                    </template>
                    <template #default>
                        {{ t('connection.editor.driverSelect.usedDriver.hint.tooOld') }}
                    </template>
                </VTooltip>
            </template>
        </VTextField>

        <VTextField
            :model-value="latestAvailableDriver?.version"
            readonly
            :disabled="disabled"
            :label="t('connection.editor.driverSelect.latestAvailableDriver.label')"
            :placeholder="t('connection.editor.driverSelect.latestAvailableDriver.placeholder.noDriver')"
            :loading="resolvingLatestAvailableDriver"
        >
            <template #prepend-inner>
                <template v-if="resolvingLatestAvailableDriver">
                    <!-- note: loading is handled by the text field -->
                </template>
                <VIcon v-else-if="isNewerDriverAvailable" color="warning">mdi-alert-decagram-outline</VIcon>
                <VIcon v-else-if="isNewestDriverApplied" color="success">mdi-check</VIcon>
            </template>
            <template #append-inner>
                <VBtn
                    v-if="isNewerDriverAvailable"
                    icon
                    :disabled="disabled"
                    density="compact"
                    variant="plain"
                    @click="chooseNewerDriver"
                >
                    <VIcon>mdi-check</VIcon>
                </VBtn>
            </template>
        </VTextField>
    </div>
</template>

<style lang="scss" scoped>
.driver-select-input {
    width: 100%;
    display: inline-grid;
    grid-template-columns: 1fr;

    &--with-used-driver {
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
}
</style>
