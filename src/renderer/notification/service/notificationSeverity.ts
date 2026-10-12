import { NotificationSeverity } from '../../../main/notification/model/NotificationSeverity'

/**
 * Maps a notification severity to its Material Design Icon (full `mdi-*` name). Shared by the
 * toast panel and the notification center so both render the same icon for a given severity.
 */
export const notificationSeverityToIcon: Map<NotificationSeverity, string> = new Map([
    [NotificationSeverity.Success, 'mdi-check-circle-outline'],
    [NotificationSeverity.Info, 'mdi-information-outline'],
    [NotificationSeverity.Warning, 'mdi-alert-outline'],
    [NotificationSeverity.Error, 'mdi-alert-circle-outline']
])

/**
 * Returns the Vuetify theme color name for the given severity. The severity values intentionally
 * match Vuetify's semantic color names.
 */
export function notificationSeverityToColor(severity: NotificationSeverity): string {
    return severity
}
