import { test, expect } from 'vitest'
import { Connection } from '../../../../src/main/connection/model/Connection'
import { ConnectionStyling } from '../../../../src/main/connection/model/ConnectionStyling'
import { constructDriverInstanceQuery, DriverInstanceQuery } from '../../../../src/main/instance/model/DriverInstanceQuery'

/**
 * Tests for the query parameters passed to driver instances. The evitaLab core decodes every
 * `evitalab-*` system property from base64, so a raw value aborts the driver bootstrap.
 */

const connection: Connection = new Connection(
    'c1',
    'Demo',
    'https://demo.evitadb.io',
    '2026.6.0',
    new ConnectionStyling(undefined, undefined)
)

/**
 * Strict decoder: fails on the same invalid UTF-8 the evitaLab core rejects.
 */
function decodeBase64ToUtf8(value: string): string {
    return new TextDecoder('utf-8', { fatal: true })
        .decode(Uint8Array.from(atob(value), (character: string) => character.charCodeAt(0)))
}

test('Should pass raw driver mode marker', () => {
    const query: DriverInstanceQuery = constructDriverInstanceQuery(connection)
    expect(query['evitalab']).toBe('true')
})

test('Should base64-encode every evitalab system property', () => {
    const query: DriverInstanceQuery = constructDriverInstanceQuery(connection)

    const systemProperties: string[] = Object.keys(query).filter(key => key.startsWith('evitalab-'))
    expect(systemProperties).toEqual(['evitalab-server-name', 'evitalab-pconnections', 'evitalab-readonly'])
    for (const systemProperty of systemProperties) {
        expect(() => decodeBase64ToUtf8(query[systemProperty]), systemProperty).not.toThrow()
    }
})

test('Should pass readonly flag as base64-encoded true', () => {
    const query: DriverInstanceQuery = constructDriverInstanceQuery(connection)
    expect(decodeBase64ToUtf8(query['evitalab-readonly'])).toBe('true')
})

test('Should pass server name and preconfigured connection', () => {
    const query: DriverInstanceQuery = constructDriverInstanceQuery(connection)

    expect(decodeBase64ToUtf8(query['evitalab-server-name'])).toBe('desktop-c1')
    expect(JSON.parse(decodeBase64ToUtf8(query['evitalab-pconnections']))).toEqual([
        { id: 'c1', name: 'Demo', serverUrl: 'https://demo.evitadb.io' }
    ])
})
