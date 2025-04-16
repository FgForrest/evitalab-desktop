<script setup lang="ts">

import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'
import ConnectionAvatar from '../../skeleton/component/ConnectionAvatar.vue'
import { CONNECTION_EDITOR_URL } from '../../connection/editor/connectionEditorConstants'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { CONNECTION_REMOVE_DIALOG_URL } from '../../connection/remove-dialog/connectionRemoveDialogConstants'
import { ConnectionEnvironment } from '../../../main/connection/model/ConnectionEnvironment'

const modalManager: FrontendModalManagerIpc = window.labModalManager

const { t } = useI18n()

const props = defineProps<{
    connection: ConnectionDto,
    driverUpdateAvailable: boolean
}>()

const actionsOpened = ref<boolean>(false)
const itemColor = computed<string | undefined>(() => {
    switch (props.connection.styling.environment) {
        case ConnectionEnvironment.Production: return 'error'
        case ConnectionEnvironment.Test: return 'warning'
        default: return undefined
    }
})

function editConnection(): void {
    modalManager.openModal(CONNECTION_EDITOR_URL, props.connection.id)
}

function removeConnection(): void {
    modalManager.openModal(CONNECTION_REMOVE_DIALOG_URL, props.connection.id)
}
</script>

<template>
    <VListItem
        :value="connection.id"
        :color="itemColor"
        @contextmenu.prevent="actionsOpened = true"
    >
        <template #prepend>
            <ConnectionAvatar :connection="connection" />
        </template>

        <template #title>
            {{ connection.name }}
        </template>

        <template #append>
            <VChip
                v-if="driverUpdateAvailable"
                color="warning"
                @click.stop="editConnection"
                class="mr-2"
            >
                {{ t('navigation.panel.connection.item.button.driverUpdateAvailable') }}
            </VChip>

            <VMenu v-model="actionsOpened">
                <template #activator="{ props }">
                    <VIcon v-bind="props">
                        mdi-dots-vertical
                    </VIcon>
                </template>

                <template #default>
                    <VList>
                        <VListItem prepend-icon="mdi-pencil" @click="editConnection">
                            {{ t('navigation.panel.connection.item.action.edit') }}
                        </VListItem>
                        <VListItem prepend-icon="mdi-delete-outline" @click="removeConnection">
                            {{ t('navigation.panel.connection.item.action.remove') }}
                        </VListItem>
                    </VList>
                </template>
            </VMenu>
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
