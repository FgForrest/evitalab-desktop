import { NotificationSeverity } from '../../../../main/notification/model/NotificationSeverity'
import { NotificationSourceDto } from './NotificationSourceDto'

/**
 * IPC DTO for NotificationDefinition
 */
export interface NotificationDefinitionDto {
    readonly severity: NotificationSeverity
    readonly source: NotificationSourceDto
    readonly message: string
}
