import { NotificationSource } from './NotificationSource'

export const skeletonNotificationSourceType = 'skeleton'

/**
 * Represents a notification from the skeleton.
 */
export class SkeletonNotificationSource implements NotificationSource {

    readonly type = skeletonNotificationSourceType

    constructor() {
        // no additional args
    }
}
