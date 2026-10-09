# Fix plan: error toast content not visible / not reachable

- **Status:** Option 3 (notification center) implemented on 2026-07-16
- **Scope:** evitalab-desktop only. A companion change in evitaLab core is *suggested* as an
  issue (text at the bottom) but is not part of this implementation.
- **Problem:** Content of some error toast notifications is not visible due to the limited
  space in the desktop application and cannot be opened in their connection, leaving the user
  in an unknown state of what happened.

## Root cause analysis

The desktop notification panel is a **fixed-size, always-on-top `WebContentsView`** overlaid on
the skeleton window. Its bounds are computed in the main process
(`src/main/notification/service/NotificationManager.ts:13-20`, `constructViewBounds()`) from
hard-coded constants: toast width 592 px, toast height **70 px**, max 5 toasts. Because the main
process cannot know the rendered height of a toast, every toast must fit the fixed 70 px slot —
which is why the renderer hard-truncates messages at 65 characters
(`src/renderer/notification/service/ToastificationIntegrator.ts:46-49`) and the SCSS notes
"we cannot simply support dynamic toast dimensions"
(`src/renderer/styles/settings.scss:175`).

Three independent defects combine into the reported "unknown state":

1. **Truncation with no way to read the rest.** Long error messages are cut at 65 chars. In the
   standalone web evitaLab this problem doesn't exist (toasts grow with content), so error
   messages produced by evitaLab core were never written to fit 65 chars.

2. **Click-through opens the error detail in an *invisible* view.** evitaLab core's
   `RemoteToaster.error()` (evitalab repo,
   `src/modules/notification/service/RemoteToaster.ts:59-82`) registers a click callback that
   opens an **ErrorViewer tab inside its own driver instance**. The desktop routes the toast
   click back to the sender's `WebContents` (`src/main/notification/model/Notification.ts:28-30`)
   but **never activates the source connection**. If the toast came from a connection that is
   not currently displayed (instances are kept alive but hidden —
   `InstanceManager.hideActiveInstance()`), the ErrorViewer tab opens in the hidden view and
   the click appears to do nothing. The plumbing to fix this exists:
   `InstanceNotificationSource` carries the `connectionId`, and
   `ConnectionManager.activateConnection()`
   (`src/main/connection/service/ConnectionManager.ts:97`) is already the canonical way to
   switch connections.

3. **No fallback when there is no click target, and no history.**
   - evitaLab core registers a click callback **only** for `LabError`s with a non-empty
     `detail`; other errors produce a toast that does nothing when clicked.
   - The desktop shell's own `Toaster.error(title, error)`
     (`src/renderer/notification/service/Toaster.ts:57-62`) discards the `Error` object
     (console only) — skeleton errors have no detail to open anywhere.
   - Toasts auto-dismiss after 7.5 s (max 5 visible,
     `src/renderer/vue-plugins/toastification.ts`); after that the message is unrecoverable.

## Considered alternatives (rejected or subsumed)

| Option | Summary | Outcome |
| --- | --- | --- |
| 1 — activate source connection on toast click | Minimal fix for defect 2 only | **Subsumed** into Option 3 (step 1 below) |
| 2 — Option 1 + skeleton error-detail modal | Middle ground; no history, no timeout fix | Not selected; the `detail` field idea survives as an optional extension |
| 3 — notification center with history | Full fix of all three defects | **Selected** |
| 4 — dynamic toast height via renderer→main resize IPC | Would remove truncation in place | **Rejected**: cross-process layout feedback loop racing vue-toastification animations (a 400 ms exit delay is already special-cased, `NotificationManager.ts:82`) — permanently fragile, "too ugly for future maintenance" |

---

## Implementation plan — Option 3: notification center

Target UX: toasts stay short-lived teasers exactly as today; a **bell icon with an unread badge**
in the skeleton navigation panel opens a **notification center modal** listing recent
notifications in full (severity, source connection, complete multi-line message, timestamp).
Clicking a live toast **or** a history row from an instance source activates that connection, so
evitaLab core's ErrorViewer tab opens visibly.

### Step 1 — activate source connection on notification click

1. `src/main/notification/service/NotificationManager.ts`
   - New emit constant, e.g. `NOTIFICATION_MANAGER_EMIT_SOURCE_ACTIVATION_REQUEST`.
   - In `notificationClicked(id)`: when the notification's `source` is an
     `InstanceNotificationSource`, emit the event with the `connectionId` **before** calling
     `notification.click()` (the producer's callback then runs in a visible instance).
2. `src/main/initializer.ts`
   - Wire the event to `connectionManager.activateConnection(connectionId)` (EventEmitter
     wiring per convention — managers must not look each other up). `activateConnection` is
     async: fire-and-forget with a `.catch` that logs via `electron-log`; a missing/removed
     connection is ignored silently (producers may outlive their connection).

### Step 2 — notification history in `NotificationManager`

1. New model `src/main/notification/model/NotificationHistoryEntry.ts`: `id`, `severity`,
   `source`, `message`, `createdAt: Date`, `read: boolean`. JSDoc as per guidelines.
2. `NotificationManager`:
   - Keep the existing `_notifications` map for *live* toasts (unchanged semantics: entry
     removed on close).
   - Add a bounded **in-memory** history (ring buffer, max 100, newest first) appended in
     `addNotification()`. History is intentionally **not persisted** across app restarts.
   - Keep the original `Notification` (with its `sender`) reachable for history routing, but
     guard every `sender.send(...)` with `sender.isDestroyed()` — instances can be restarted
     or destroyed while their entries remain in history (entry stays readable; producer
     click-routing silently skipped; connection activation from step 1 still applies).
   - New API: `getHistory(): NotificationHistoryEntry[]`, `markAllAsRead(): void`,
     `unreadCount(): number`, `historyEntryClicked(id)` (same routing as
     `notificationClicked`, including step 1 activation).
   - New emit `NOTIFICATION_MANAGER_EMIT_HISTORY_CHANGE` fired on add/mark-read, so the badge
     can update.

### Step 3 — IPC surface (three-layer pattern)

1. `src/common/ipc/notification/model/NotificationHistoryEntryDto.ts`: `id`, `severity`,
   `source` (existing `NotificationSourceDto` — carries `connectionId` for instance sources),
   `message`, `createdAt` (ISO string), `read`. The renderer resolves connection names itself
   via the already-exposed `window.labConnectionManager.getConnection(id)` — no new
   main-process coupling between notification and connection domains for display purposes.
2. Extend the **servicing** contract (`src/common/ipc/notification/service/ServicingNotificationManagerIpc.ts`,
   `src/main/ipc/notification/service/BackendNotificationManagerIpc.ts`,
   `src/preload/renderer/ipc/notification/service/FrontendServicingNotificationManagerIpc.ts`)
   with: invoke `getNotificationHistory()`, send `markAllNotificationsRead()`, send
   `historyEntryClicked(id)`, push `onHistoryChanged(unreadCount)`. Rationale: this surface is
   already the "consumer side" of the notification domain (renderer preload only, not exposed
   to drivers); the docs' wording "consumed exclusively by the notification panel" is updated
   to "consumed by the notification panel, the notification center and the navigation panel
   badge". Only DTOs cross the boundary.

### Step 4 — notification center modal window

Follow the modal-window recipe (`documentation/developer/recipes.md#add-a-new-modal-window`):

1. Triad in `src/renderer/notification/center/`: `notification-center.html`,
   `notification-center.ts` (`initializeRenderer(NotificationCenter)`),
   `notificationCenterConstants.ts` (`NOTIFICATION_CENTER_URL`), registered as Rollup input in
   `vite.renderer.config.ts`.
2. `NotificationCenter.vue` wraps content in `ModalWindow` + `VLabDialog`-style list:
   - one row per history entry: severity icon (extract the severity→icon/type mappings from
     `ToastificationIntegrator.ts` into a shared module under
     `src/renderer/notification/service/` so both consumers use one source of truth),
     connection name chip for instance sources ("evitaLab" / app name for skeleton source),
     **full multi-line message** (wrapped, not truncated), relative timestamp;
   - row click → `historyEntryClicked(id)` + `closeModal(NOTIFICATION_CENTER_URL)` so the
     activated connection is immediately visible;
   - `markAllNotificationsRead()` on open; empty-state message when history is empty.
3. All strings under a new `notification.center.*` namespace in `src/renderer/i18n/en.json`.

### Step 5 — bell + unread badge in the navigation panel

`src/renderer/skeleton/component/NavigationPanel.vue`, `#append` slot (next to the
documentation/Discord links): `VListItem` with `mdi-bell-outline` wrapped in `VBadge`
(unread count; hidden when 0), initialized from `getNotificationHistory()` and updated via
`onHistoryChanged`; click opens the modal via
`modalManager.openModal(NOTIFICATION_CENTER_URL)`. Tooltip + alt strings via i18n.

### Step 6 — documentation, tests, checklist

1. Docs (mandatory per CLAUDE.md):
   - `main-process.md` — notification system section: history buffer, click → connection
     activation, new events;
   - `ipc.md` — notification section: new servicing methods + DTO;
   - `renderer.md` — window catalog (+ notification center entry), notification panel section;
   - `recipes.md` untouched (patterns unchanged).
2. Tests (Vitest): `NotificationManager` — ring-buffer bounds, unread counting,
   mark-all-read, activation event emitted only for instance sources, destroyed-sender guard;
   DTO conversion if a converter is added.
3. Run `yarn lint`, `yarn test`; manual verification against `https://demo.evitadb.io`:
   produce a long error in a **background** connection (e.g. invalid query in one connection,
   switch to another), verify badge increments, center shows full text, row click switches
   connection and the ErrorViewer tab is visible.

### Decisions taken (revisit here if requirements change)

- History is in-memory only, capped at 100 entries; lost on restart — acceptable for v1.
- Toast rendering itself is untouched (still 65-char teaser, 7.5 s, max 5) — the center is
  where full content lives. The bounded "3-line toast" mitigation from Option 4 can be layered
  on later without conflicting with any of this.
- The optional `detail?: string` field on `NotificationDefinition` (Option 2 idea, would let
  skeleton errors carry stack traces into the center) is **out of scope** for v1 but the DTO
  and center layout should not preclude adding it.
- A **side panel** (connection-tree-like, docked or overlay) was considered instead of the
  modal and deferred (2026-07-16): instances are native `WebContentsView`s covering the
  skeleton DOM, so a non-blocking panel requires either a per-URL bounds strategy in
  `ModalManager` (overlay variant) or dynamic instance-bounds coordination (docked variant).
  The standard full-window modal was kept for v1; the overlay variant (exact-bounds
  `WebContentsView` next to the nav rail, reusing the modal triad) is the recommended upgrade
  path if non-blocking behaviour is wanted later — it only replaces step 4's window mechanics,
  the history/IPC/badge design is unaffected.

### Known limitation remaining after this fix

Error toasts produced by evitaLab core **without** `LabError.detail` (and non-`LabError`s) still
have no producer click callback — clicking activates the connection but nothing opens there.
Their full message *is* now readable in the notification center, so the user is no longer in an
unknown state, but the ErrorViewer dead-end can only be fixed in the core repo — see below.

---

## Suggested issue for the evitaLab core repo (not part of this implementation)

> **Title:** RemoteToaster: error toasts without `LabError.detail` are dead-ends in desktop mode
>
> **Description:**
> In evitaLab Desktop, toast notifications are rendered by the desktop shell in a fixed-size
> panel and truncated to ~65 characters. The only way for a user to read a full error is the
> click-through: `RemoteToaster.error()` registers a toast click callback that opens an
> `ErrorViewer` tab in the driver instance.
>
> Today that callback is registered **only** when the error is a `LabError` with a non-empty
> `detail` (`src/modules/notification/service/RemoteToaster.ts:59-82`). For `LabError`s without
> `detail` and for wrapped `UnexpectedError`s, no callback is registered — in desktop mode the
> user sees a truncated one-line error toast that does nothing when clicked.
>
> **Suggestion:** in `RemoteToaster.error()` (and for parity optionally `LocalToaster`),
> register the ErrorViewer click callback for **every** error, not only those with `detail` —
> `ErrorViewer` can render a message-only error. This is backward compatible and makes every
> error toast in the desktop app clickable. The desktop side already routes the click and (as
> of evitalab-desktop's notification-center change) activates the source connection, so the
> ErrorViewer tab opens visibly.
