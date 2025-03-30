import { test, expect } from 'vitest'
import fetchMock, { manageFetchMockGlobally } from '@fetch-mock/vitest'
import { readFile } from 'node:fs/promises'
import { DriverManager } from '../../../../src/main/driver/service/DriverManager'
import { Driver } from '../../../../src/main/driver/model/Driver'

/**
 * Tests for backend DriverManager.
 */

manageFetchMockGlobally()

test('Should resolve latest available driver for the newest server', async () => {
    await testLatestAvailableDriverResolution(
        '2025.2',
        new Driver('2025.1.1', '2025.1.0')
    )
})

test('Should resolve latest available driver for server snapshot', async () => {
    await testLatestAvailableDriverResolution(
        '2025.2-SNAPSHOT',
        new Driver('2025.1.1', '2025.1.0')
    )
})

test('Should resolve latest available driver for server version equals to min server version', async () => {
    await testLatestAvailableDriverResolution(
        '2025.1.0',
        new Driver('2025.1.1', '2025.1.0')
    )
})

test('Should resolve latest available driver when driver path release after newer version', async () => {
    await testLatestAvailableDriverResolution(
        '2024.2.0',
        new Driver('2024.1.8', '2024.1.0')
    )
})

test('Should resolve latest available driver for not oldest nor newest server', async () => {
    await testLatestAvailableDriverResolution(
        '2024.3.10',
        new Driver('2024.2.0', '2024.3.0')
    )
})

test('Should resolve latest available driver for not supported server', async () => {
    // should fallback to the oldest known driver
    await testLatestAvailableDriverResolution(
        '2023.1',
        new Driver('2024.1.0', '2024.1.0')
    )
})

test('Should get driver for specific version', async () => {
    await createMockEvitaLabDatabaseEndpoint()
    const driverManager: DriverManager = new DriverManager()

    expect((await driverManager.getDriver('2025.1.1')))
        .toStrictEqual(new Driver('2025.1.1', '2025.1.0'))

    expect((await driverManager.getDriver('2024.4.2')))
        .toStrictEqual(new Driver('2024.4.2', '2024.10.0'))

    expect((await driverManager.getDriver('2024.1.8')))
        .toStrictEqual(new Driver('2024.1.8', '2024.1.0'))

    expect((await driverManager.getDriver('2024.1.7')))
        .toStrictEqual(new Driver('2024.1.7', '2024.1.0'))

    expect((await driverManager.getDriver('2024.2.0')))
        .toStrictEqual(new Driver('2024.2.0', '2024.3.0'))

    fetchMock.removeRoutes()
})

test('Should not get driver for non-existent version', async () => {
    await createMockEvitaLabDatabaseEndpoint()
    const driverManager: DriverManager = new DriverManager()

    expect(async () => {
        await driverManager.getDriver('2023.1.0')
    })
        .rejects
        .toThrowError()

    expect(async () => {
        await driverManager.getDriver('2025.20.0')
    })
        .rejects
        .toThrowError()

    fetchMock.removeRoutes()
})

/*
    Helper methods
 */

async function testLatestAvailableDriverResolution(serverVersion: string, expectedDriver: Driver): Promise<void> {
    await createMockEvitaLabDatabaseEndpoint()
    const driverManager: DriverManager = new DriverManager()

    createMockServerStatusEndpoint('https://server1.io:5555', serverVersion)
    expect((await driverManager.resolveLatestAvailableDriver('https://server1.io:5555')))
        .toStrictEqual(expectedDriver)

    fetchMock.removeRoutes()
}

async function createMockEvitaLabDatabaseEndpoint(): Promise<void> {
    const mockEvitaLabDatabase: string = await readFile(
        'test/main/driver/service/mock-evitalab-database.csv',
        'utf-8'
    )

    fetchMock.mockGlobal()
        .get(
            'https://raw.githubusercontent.com/lukashornych/evitalab-metadata-database/refs/heads/main/evitalab-database.csv',
            mockEvitaLabDatabase
        )
}

function createMockServerStatusEndpoint(serverUrl: string, version: string): void {
    fetchMock.mockGlobal()
        .post(
            `${serverUrl}/io.evitadb.externalApi.grpc.generated.EvitaManagementService/ServerStatus`,
            createMockServerStatusResponse(version),
            {
                body: {}
            }
        )
}

function createMockServerStatusResponse(version: string): any {
    return {
        "version": version,
        "startedAt": {
            "timestamp": "2025-03-24T16:53:36.763826523Z",
            "offset": "Z"
        },
        "uptime": "437860",
        "instanceId": "evitaDB-demo",
        "catalogsOk": 1,
        "readiness": "API_READY",
        "api": {},
        "readOnly": true
    }
}
