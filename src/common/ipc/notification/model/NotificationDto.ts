import { NotificationId } from '../../../../main/notification/model/NotificationId'
import { NotificationDefinitionDto } from './NotificationDefinitionDto'

/**
 * IPC DTO for a notification
 */
export interface NotificationDto extends NotificationDefinitionDto {
    readonly id: NotificationId
}
