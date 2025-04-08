/**
 * Register preload APIs for Typescript
 */

import { FrontendModalManagerIpc } from '../preload/renderer/ipc/modal/service/FrontendModalManagerIpc'
import { FrontendConnectionManagerIpc } from '../preload/renderer/ipc/connection/service/FrontendConnectionManagerIpc'
import { FrontendDriverManagerIpc } from '../preload/renderer/ipc/driver/service/FrontendDriverManagerIpc'
import {
    FrontendNotificationManagerIpc
} from '../preload/renderer/ipc/notification/service/FrontendNotificationManagerIpc'
import {
    FrontendServicingNotificationManagerIpc
} from '../preload/renderer/ipc/notification/service/FrontendServicingNotificationManagerIpc'

export {}

declare global {
    interface Window {
        labConnectionManager: FrontendConnectionManagerIpc,
        labModalManager: FrontendModalManagerIpc,
        labDriverManager: FrontendDriverManagerIpc,
        labNotificationManager: FrontendNotificationManagerIpc,
        labServicingNotificationManager: FrontendServicingNotificationManagerIpc
    }
}
