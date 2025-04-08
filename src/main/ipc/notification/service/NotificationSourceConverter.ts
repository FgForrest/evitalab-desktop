import { NotificationSourceDto } from '../../../../common/ipc/notification/model/NotificationSourceDto'
import { NotificationSource } from '../../../notification/model/NotificationSource'
import {
    SkeletonNotificationSource,
    skeletonNotificationSourceType
} from '../../../notification/model/SkeletonNotificationSource'
import {
    InstanceNotificationSource,
    instanceNotificationSourceType
} from '../../../notification/model/InstanceNotificationSource'

/**
 * Creates instance of notification source from DTO
 */
export class NotificationSourceConverter {

    /**
     * Creates instance of notification source from DTO
     * @param dto DTO
     */
    convertFromDto(dto: NotificationSourceDto): NotificationSource {
        const type: string = dto.type
        if (type == undefined) {
            throw new Error('Not a notification source')
        }

        if (type === skeletonNotificationSourceType) {
            if (dto.type !== skeletonNotificationSourceType) {
                throw new Error('Cannot parse notification source as skeleton notification source. Type mismatch.')
            }
            return new SkeletonNotificationSource()
        } else if (type === instanceNotificationSourceType) {
            if (dto.type !== instanceNotificationSourceType) {
                throw new Error('Cannot parse notification source as instance notification source. Type mismatch.')
            }
            if (dto['connectionId'] == undefined || (dto['connectionId'] as string).length === 0) {
                throw new Error('Missing connectionId')
            }

            return new InstanceNotificationSource(dto['connectionId'] as string)
        } else {
            throw new Error(`Unsupported notification source type ${type}.`)
        }
    }

    convertToDto(notificationSource: NotificationSource): NotificationSourceDto {
        if (notificationSource instanceof SkeletonNotificationSource) {
            return {
                type: notificationSource.type
            }
        } else if (notificationSource instanceof InstanceNotificationSource) {
            return {
                type: notificationSource.type,
                connectionId: notificationSource.connectionId
            }
        } else {
            throw new Error(`Unsupported notification source type ${JSON.stringify(notificationSource)}`)
        }
    }
}
