import ky from 'ky'
import { i18n } from '../../../vue-plugins/i18n'

export class ServerMetadataProvider {

    async resolveServerName(serverUrl: string): Promise<string | undefined> {
        try {
            const normalizedUrl = this.normalizeUrl(serverUrl)
            return await ky.get(`${normalizedUrl}system/server-name`).text()
        } catch (e) {
            console.error(`Could not resolve server name for URL '${serverUrl}': `, e)
            return undefined
        }
    }

    async testConnection(serverUrl: string): Promise<string | undefined> {
        try {
            const normalizedUrl: string = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/'
            const serverStatus: any = await ky.post(
                `${normalizedUrl}io.evitadb.externalApi.grpc.generated.EvitaManagementService/ServerStatus`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: '{}'
                }
            )
                .json()

            if (serverStatus.readiness !== 'API_READY') {
                return i18n.global.t('connection.editor.form.serverUrl.validations.notReady')
            }
            if (serverStatus.api.lab?.enabled !== true) {
                return i18n.global.t('connection.editor.form.serverUrl.validations.labApiMissing')
            }
            if (serverStatus.api.gRPC?.enabled !== true) {
                return i18n.global.t('connection.editor.form.serverUrl.validations.grpcApiMissing')
            }

            return undefined
        } catch (e) {
            return i18n.global.t('connection.editor.form.serverUrl.validations.unreachable')
        }
    }

    private normalizeUrl(serverUrl: string) {
        return serverUrl.endsWith('/') ? serverUrl : serverUrl + '/'
    }
}
