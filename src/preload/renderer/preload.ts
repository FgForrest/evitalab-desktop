import { exposeFrontendConnectionManagerIpc } from './ipc/connection/service/FrontendConnectionManagerIpc'
import { exposeFrontendNotificationManagerIpc } from './ipc/notification/service/FrontendNotificationManagerIpc'
import { exposeFrontendServicingNotificationManagerIpc } from './ipc/notification/service/FrontendServicingNotificationManagerIpc'
import { exposeFrontendModalManagerIpc } from './ipc/modal/service/FrontendModalManagerIpc'
import { exposeFrontendDriverManagerIpc } from './ipc/driver/service/FrontendDriverManagerIpc'

exposeFrontendConnectionManagerIpc()
exposeFrontendNotificationManagerIpc()
exposeFrontendServicingNotificationManagerIpc()
exposeFrontendModalManagerIpc()
exposeFrontendDriverManagerIpc()
