import { NotificationHistoryEntry } from '../model/NotificationHistoryEntry'
import { NotificationId } from '../model/NotificationId'

/**
 * Maximum number of entries kept in the history. Older entries are evicted once the limit is
 * exceeded. History is intentionally in-memory only and lost on app restart.
 */
export const maxNotificationHistorySize = 100

/**
 * Bounded, newest-first, in-memory ring buffer of notification history entries. Pure data
 * structure with no Electron dependencies so it can be unit tested in isolation.
 */
export class NotificationHistory {

    private readonly entries: NotificationHistoryEntry[] = []

    /**
     * Appends a new entry as the newest one, evicting the oldest entry when the buffer is full.
     */
    add(entry: NotificationHistoryEntry): void {
        this.entries.unshift(entry)
        if (this.entries.length > maxNotificationHistorySize) {
            this.entries.length = maxNotificationHistorySize
        }
    }

    /**
     * Returns all entries, newest first. The returned array is a copy; mutating it does not
     * affect the buffer.
     */
    getAll(): NotificationHistoryEntry[] {
        return [...this.entries]
    }

    /**
     * Returns the entry with the given id, or `undefined` when it is no longer in the buffer.
     */
    get(id: NotificationId): NotificationHistoryEntry | undefined {
        return this.entries.find(it => it.id === id)
    }

    /**
     * Marks every entry as read.
     * @return `true` when at least one entry changed from unread to read, `false` otherwise
     */
    markAllRead(): boolean {
        let changed = false
        for (const entry of this.entries) {
            if (!entry.read) {
                entry.read = true
                changed = true
            }
        }
        return changed
    }

    /**
     * Removes all entries.
     * @return `true` when at least one entry was removed, `false` when the history was already empty
     */
    clear(): boolean {
        const changed = this.entries.length > 0
        this.entries.length = 0
        return changed
    }

    /**
     * Returns the number of unread entries.
     */
    unreadCount(): number {
        return this.entries.reduce((count, entry) => entry.read ? count : count + 1, 0)
    }
}
