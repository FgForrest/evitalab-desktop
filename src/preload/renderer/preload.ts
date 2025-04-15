import { exposeFrontendConnectionManagerIpc } from './ipc/connection/service/FrontendConnectionManagerIpc'
import { exposeFrontendNotificationManagerIpc } from './ipc/notification/service/FrontendNotificationManagerIpc'
import { exposeFrontendServicingNotificationManagerIpc } from './ipc/notification/service/FrontendServicingNotificationManagerIpc'
import { exposeFrontendModalManagerIpc } from './ipc/modal/service/FrontendModalManagerIpc'
import { exposeFrontendDriverManagerIpc } from './ipc/driver/service/FrontendDriverManagerIpc'
import { exposeFrontendAppUpdateManagerIpc } from './ipc/update/service/FrontendAppUpdateManagerIpc'

exposeFrontendAppUpdateManagerIpc()
exposeFrontendConnectionManagerIpc()
exposeFrontendNotificationManagerIpc()
exposeFrontendServicingNotificationManagerIpc()
exposeFrontendModalManagerIpc()
exposeFrontendDriverManagerIpc()
