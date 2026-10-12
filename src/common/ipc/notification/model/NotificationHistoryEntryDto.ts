import { NotificationId } from '../../../../main/notification/model/NotificationId'
import { NotificationSeverity } from '../../../../main/notification/model/NotificationSeverity'
import { NotificationSourceDto } from './NotificationSourceDto'

/**
 * IPC DTO for a single notification history entry. The source carries the `connectionId` for
 * instance sources so the renderer can resolve the connection name itself.
 */
export interface NotificationHistoryEntryDto {
    readonly id: NotificationId
    readonly severity: NotificationSeverity
    readonly source: NotificationSourceDto
    readonly message: string
    readonly createdAt: string
    readonly read: boolean
}
