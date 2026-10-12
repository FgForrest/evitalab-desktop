import { test, expect, vi } from 'vitest'
import { Notification } from '../../../../src/main/notification/model/Notification'
import { NotificationSeverity } from '../../../../src/main/notification/model/NotificationSeverity'
import { SkeletonNotificationSource } from '../../../../src/main/notification/model/SkeletonNotificationSource'

/**
 * Tests for the destroyed-sender guard. A history entry can outlive its producing view, so
 * routing a click/close to an already-destroyed sender must be a no-op instead of crashing.
 */

function notification(sender: any): Notification {
    return new Notification(
        'id',
        sender,
        NotificationSeverity.Error,
        new SkeletonNotificationSource(),
        'message'
    )
}

test('Should not send click to a destroyed sender', () => {
    const send = vi.fn()
    notification({ isDestroyed: () => true, send }).click()
    expect(send).not.toHaveBeenCalled()
})

test('Should not send close to a destroyed sender', () => {
    const send = vi.fn()
    notification({ isDestroyed: () => true, send }).close()
    expect(send).not.toHaveBeenCalled()
})

test('Should send click to an alive sender', () => {
    const send = vi.fn()
    notification({ isDestroyed: () => false, send }).click()
    expect(send).toHaveBeenCalledTimes(1)
})
