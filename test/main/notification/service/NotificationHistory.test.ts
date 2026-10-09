import { test, expect } from 'vitest'
import {
    NotificationHistory,
    maxNotificationHistorySize
} from '../../../../src/main/notification/service/NotificationHistory'
import { NotificationHistoryEntry } from '../../../../src/main/notification/model/NotificationHistoryEntry'
import { Notification } from '../../../../src/main/notification/model/Notification'
import { NotificationSeverity } from '../../../../src/main/notification/model/NotificationSeverity'
import { SkeletonNotificationSource } from '../../../../src/main/notification/model/SkeletonNotificationSource'

/**
 * Tests for the pure notification history ring buffer. The stored notifications carry a fake
 * sender; the history never touches it.
 */

const fakeSender: any = { isDestroyed: () => false, send: () => { /* no-op */ } }

function entry(id: string): NotificationHistoryEntry {
    const notification = new Notification(
        id,
        fakeSender,
        NotificationSeverity.Error,
        new SkeletonNotificationSource(),
        `message ${id}`
    )
    return new NotificationHistoryEntry(notification, new Date())
}

test('Should keep entries newest first', () => {
    const history = new NotificationHistory()
    history.add(entry('a'))
    history.add(entry('b'))
    history.add(entry('c'))

    expect(history.getAll().map(it => it.id)).toEqual(['c', 'b', 'a'])
})

test('Should evict oldest entries beyond the maximum size', () => {
    const history = new NotificationHistory()
    for (let i = 0; i < maxNotificationHistorySize + 5; i++) {
        history.add(entry(`n${i}`))
    }

    const all = history.getAll()
    expect(all.length).toBe(maxNotificationHistorySize)
    // newest is the last added
    expect(all[0].id).toBe(`n${maxNotificationHistorySize + 4}`)
    // the 5 oldest entries have been evicted
    expect(history.get('n0')).toBeUndefined()
    expect(history.get('n4')).toBeUndefined()
    expect(history.get('n5')).toBeDefined()
})

test('Should count unread entries', () => {
    const history = new NotificationHistory()
    expect(history.unreadCount()).toBe(0)

    history.add(entry('a'))
    history.add(entry('b'))
    expect(history.unreadCount()).toBe(2)
})

test('Should mark all entries as read and report change', () => {
    const history = new NotificationHistory()
    history.add(entry('a'))
    history.add(entry('b'))

    expect(history.markAllRead()).toBe(true)
    expect(history.unreadCount()).toBe(0)
    expect(history.getAll().every(it => it.read)).toBe(true)
})

test('Should report no change when marking an already-read history as read', () => {
    const history = new NotificationHistory()
    history.add(entry('a'))
    history.markAllRead()

    expect(history.markAllRead()).toBe(false)
})

test('Should not count newly added entry as read after previous mark-all-read', () => {
    const history = new NotificationHistory()
    history.add(entry('a'))
    history.markAllRead()
    history.add(entry('b'))

    expect(history.unreadCount()).toBe(1)
})

test('Should return a defensive copy from getAll', () => {
    const history = new NotificationHistory()
    history.add(entry('a'))

    const all = history.getAll()
    all.pop()

    expect(history.getAll().length).toBe(1)
})
