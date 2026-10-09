<script setup lang="ts">
/**
 * Notification center modal. Lists recent notifications from the skeleton and all instances in
 * full (severity, source connection, complete multi-line message, relative timestamp). Clicking
 * a row routes the same way as clicking the original toast — activating the source connection so
 * the producer's detail view (e.g. evitaLab core's error viewer) opens visibly.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ModalWindow from '../../common/component/ModalWindow.vue'
import VLabDialog from '../../common/component/VLabDialog.vue'
import { NOTIFICATION_CENTER_URL } from './notificationCenterConstants'
import {
    FrontendServicingNotificationManagerIpc
} from '../../../preload/renderer/ipc/notification/service/FrontendServicingNotificationManagerIpc'
import {
    FrontendConnectionManagerIpc
} from '../../../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendModalManagerIpc } from '../../../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { NotificationHistoryEntryDto } from '../../../common/ipc/notification/model/NotificationHistoryEntryDto'
import { NotificationId } from '../../../main/notification/model/NotificationId'
import {
    notificationSeverityToColor,
    notificationSeverityToIcon
} from '../service/notificationSeverity'
import { instanceNotificationSourceType } from '../../../main/notification/model/InstanceNotificationSource'

const servicingNotificationManager: FrontendServicingNotificationManagerIpc = window.labServicingNotificationManager
const connectionManager: FrontendConnectionManagerIpc = window.labConnectionManager
const modalManager: FrontendModalManagerIpc = window.labModalManager
const { t } = useI18n()

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const entries = ref<NotificationHistoryEntryDto[]>([])
const sourceLabels = ref<Map<NotificationId, string>>(new Map())

async function loadHistory(): Promise<void> {
    entries.value = await servicingNotificationManager.getNotificationHistory()
    await resolveSourceLabels()
}

async function resolveSourceLabels(): Promise<void> {
    const labels = new Map<NotificationId, string>()
    for (const entry of entries.value) {
        labels.set(entry.id, await resolveSourceLabel(entry))
    }
    sourceLabels.value = labels
}

async function resolveSourceLabel(entry: NotificationHistoryEntryDto): Promise<string> {
    if (entry.source.type === instanceNotificationSourceType) {
        const connectionId = entry.source['connectionId'] as string | undefined
        if (connectionId != undefined) {
            const connection = await connectionManager.getConnection(connectionId)
            if (connection != undefined) {
                return connection.name
            }
        }
        return t('notification.center.source.unknownConnection')
    }
    return t('app.name')
}

function severityIcon(entry: NotificationHistoryEntryDto): string {
    return notificationSeverityToIcon.get(entry.severity) ?? 'mdi-bell-outline'
}

function severityColor(entry: NotificationHistoryEntryDto): string {
    return notificationSeverityToColor(entry.severity)
}

function formatTimestamp(iso: string): string {
    const then = new Date(iso).getTime()
    const diffSeconds = Math.round((then - Date.now()) / 1000)
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 60 * 60 * 24 * 365],
        ['month', 60 * 60 * 24 * 30],
        ['day', 60 * 60 * 24],
        ['hour', 60 * 60],
        ['minute', 60]
    ]
    for (const [unit, secondsInUnit] of units) {
        if (Math.abs(diffSeconds) >= secondsInUnit) {
            return relativeTimeFormatter.format(Math.round(diffSeconds / secondsInUnit), unit)
        }
    }
    return relativeTimeFormatter.format(diffSeconds, 'second')
}

function absoluteTimestamp(iso: string): string {
    return new Date(iso).toLocaleString()
}

function onEntryClicked(entry: NotificationHistoryEntryDto): void {
    servicingNotificationManager.historyEntryClicked(entry.id)
    close()
}

function close(): void {
    modalManager.closeModal(NOTIFICATION_CENTER_URL)
}

function handleVisibilityChange(visible: boolean): void {
    if (!visible) {
        close()
    }
}

// re-render when new notifications arrive while the center is open
servicingNotificationManager.onHistoryChanged(() => loadHistory())

// each open re-passes args; reload the fresh history and clear the unread badge
modalManager.onModalArgsPassed(async (url: string) => {
    if (url !== NOTIFICATION_CENTER_URL) {
        return
    }
    await loadHistory()
    servicingNotificationManager.markAllNotificationsRead()
})

loadHistory()
</script>

<template>
    <ModalWindow>
        <VLabDialog
            :model-value="true"
            max-width="40rem"
            scrollable
            @update:model-value="handleVisibilityChange($event)"
        >
            <template #title>
                {{ t('notification.center.title') }}
            </template>

            <template #default>
                <div v-if="entries.length === 0" class="notification-center-empty text-disabled">
                    {{ t('notification.center.empty') }}
                </div>

                <VList v-else class="notification-center-list">
                    <VListItem
                        v-for="entry in entries"
                        :key="entry.id"
                        class="notification-center-item"
                        @click="onEntryClicked(entry)"
                    >
                        <div class="notification-center-item__body">
                            <VIcon :color="severityColor(entry)" class="notification-center-item__icon">
                                {{ severityIcon(entry) }}
                            </VIcon>
                            <div class="notification-center-item__content">
                                <div class="notification-center-item__header">
                                    <VChip size="x-small" label>{{ sourceLabels.get(entry.id) }}</VChip>
                                    <span class="notification-center-item__time text-disabled">
                                        {{ formatTimestamp(entry.createdAt) }}
                                        <VTooltip activator="parent" location="top">
                                            {{ absoluteTimestamp(entry.createdAt) }}
                                        </VTooltip>
                                    </span>
                                </div>
                                <div class="notification-center-item__message">{{ entry.message }}</div>
                            </div>
                        </div>
                    </VListItem>
                </VList>
            </template>
        </VLabDialog>
    </ModalWindow>
</template>

<style lang="scss" scoped>
.notification-center-empty {
    padding: 2rem 1rem;
    text-align: center;
}

.notification-center-list {
    background: transparent;
}

.notification-center-item {
    &__body {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.25rem 0;
    }

    &__icon {
        margin-top: 0.125rem;
    }

    &__content {
        flex: 1;
        min-width: 0;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }

    &__time {
        font-size: 0.75rem;
        white-space: nowrap;
    }

    &__message {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }
}
</style>
