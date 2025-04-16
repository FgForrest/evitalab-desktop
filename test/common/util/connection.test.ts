import { test, expect } from 'vitest'
import { computeShortConnectionName } from '../../../src/common/util/connection'

test('Should compute short connection name', () => {
    expect(computeShortConnectionName('my server'))
        .toEqual('MS')

    expect(computeShortConnectionName('my server - test'))
        .toEqual('MST')

    expect(computeShortConnectionName('my-server-test'))
        .toEqual('MST')

    expect(computeShortConnectionName('my server #1'))
        .toEqual('MS1')
})
