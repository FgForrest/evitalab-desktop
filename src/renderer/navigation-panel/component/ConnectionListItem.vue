<script setup lang="ts">

import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'
import ConnectionAvatar from '../../skeleton/component/ConnectionAvatar.vue'
import { CONNECTION_EDITOR_URL } from '../../connection/editor/connectionEditorConstants'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { CONNECTION_REMOVE_DIALOG_URL } from '../../connection/remove-dialog/connectionRemoveDialogConstants'

//@ts-ignore
const modalManager: FrontendModalManagerIpc = window.modalManager

const { t } = useI18n()

const props = defineProps<{
    connection: ConnectionDto
}>()

const actionsOpened = ref<boolean>(false)

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
        @contextmenu.prevent="actionsOpened = true"
    >
        <template #prepend>
            <ConnectionAvatar :connection="connection" />
        </template>

        <template #title>
            {{ connection.name }}
        </template>

        <template #append>
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
