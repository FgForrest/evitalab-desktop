import { exposeFrontendConnectionManagerIpc } from './ipc/connection/service/FrontendConnectionManagerIpc'
import { exposeFrontendModalManagerIpc } from './ipc/modal/service/FrontendModalManagerIpc'
import { exposeFrontendDriverManagerIpc } from './ipc/driver/service/FrontendDriverManagerIpc'

exposeFrontendConnectionManagerIpc()
exposeFrontendModalManagerIpc()
exposeFrontendDriverManagerIpc()
