import { exposeFrontendConnectionManagerIpc } from './ipc/connection/service/FrontendConnectionManagerIpc'
import { exposeFrontendModalManagerIpc } from './ipc/modal/service/FrontendModalManagerIpc'

exposeFrontendConnectionManagerIpc()
exposeFrontendModalManagerIpc()
