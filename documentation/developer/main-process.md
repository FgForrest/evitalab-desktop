# Main process services

The main process is composed of *manager* services under `src/main/*/service/`. They are
constructed and wired together in `src/main/initializer.ts`
(see [architecture — bootstrapping](architecture.md#bootstrapping)). Managers receive their
direct dependencies as constructor arguments; cross-manager reactions are wired via
`EventEmitter` events (exported `*_EMIT_*` string constants).

| Manager | File | Responsibility |
|---------|------|----------------|
| `SkeletonManager` | `src/main/skeleton/service/SkeletonManager.ts` | Lifecycle of the single root `BrowserWindow` (the *skeleton*) into which all other views are layered |
| `ConnectionManager` | `src/main/connection/service/ConnectionManager.ts` | The heart of the app — manages evitaDB server connections, the active connection, persistence and driver-update detection |
| `DriverManager` | `src/main/driver/service/DriverManager.ts` | Downloads and resolves evitaLab core *drivers* — see [drivers & instances](drivers-and-instances.md) |
| `InstanceManager` | `src/main/instance/service/InstanceManager.ts` | One embedded driver `WebContentsView` per connection — see [drivers & instances](drivers-and-instances.md) |
| `ModalManager` | `src/main/modal/service/ModalManager.ts` | Opens/closes modal overlay views (navigation panel, connection editor, …), keyed by renderer URL |
| `NotificationManager` | `src/main/notification/service/NotificationManager.ts` | Global notification (toast) system — see below |
| `AppUpdateManager` | `src/main/update/service/AppUpdateManager.ts` | Desktop app self-update |
| `AppConfig` | `src/main/config/model/AppConfig.ts` | Persistent app configuration (`config.json`) |

## ConnectionManager

Holds `Map<ConnectionId, Connection>` plus the active connection id. A `Connection`
(`src/main/connection/model/Connection.ts`) carries `id`, `name`, `serverUrl`, `driverVersion`
and `ConnectionStyling` (user-picked `color` + `ConnectionEnvironment` —
`development`/`test`/`production`).

Key methods: `activateConnection(id | undefined)`, `storeConnection(connection)` (upsert),
`removeConnection(id)`, `storeConnectionsOrder(ids)`, `getConnection(id)`,
`getSimilarConnection(name)` (case-insensitive duplicate check for the editor).

Emitted events (constants exported from the manager's file):

| Constant | Event | Consumed by |
|----------|-------|-------------|
| `CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION` | active connection changed | `InstanceManager.activateInstance(...)`, pushed to renderers |
| `CONNECTION_MANAGER_EMIT_CONNECTION_CHANGE` | single connection modified | `InstanceManager.restartInstance(...)` |
| `CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE` | connection list changed | pushed to renderers |
| `CONNECTION_MANAGER_EMIT_DRIVER_UPDATE_AVAILABLE` | newer driver exists for a connection | pushed to renderers (update chip/badge) |

On activation the manager also asynchronously checks for a driver update
(`driverManager.resolveLatestAvailableDriver(...)` + `semver.gt`), at most once per connection
per app run.

## AppConfig & persistence

`AppConfig` persists the app state as **plain JSON**, hand-rolled (no `electron-store`):

- **Location**: `<userData>/config.json` (Electron `app.getPath('userData')` — e.g.
  `~/.config/evitaLab/config.json` on Linux, `~/Library/Application Support/evitaLab/` on macOS).
- **Format**: `{ connections: ConnectionConfig[] }` where `ConnectionConfig` is
  `{ id, name, serverUrl, driverVersion, styling: { color?, environment? } }`.
- `init()` tolerates a missing/empty file. Every `updateConnections(...)` writes the file
  immediately and emits `CONFIG_EMIT_UPDATE`.
- `ConnectionManager` is the **only writer** — after any mutation it maps its `Connection`
  objects to configs and calls `appConfig.updateConnections(...)`.

Downloaded drivers are cached separately under `<userData>/drivers/<version>/`
(see [drivers & instances](drivers-and-instances.md#download--cache)).

## Notification system

Notifications are global — toasts from the desktop shell **and** from every embedded driver
instance render in one always-on-top notification panel view (bottom-right corner, max 5
visible; panel bounds are recomputed as notifications come and go).

Model (`src/main/notification/model/`): `NotificationDefinition { severity, source, message }`,
`NotificationSeverity` (`success`/`info`/`warning`/`error`), `NotificationSource` — either
`SkeletonNotificationSource` (`type: 'skeleton'`) or `InstanceNotificationSource`
(`type: 'instance'`, carries `connectionId`). A stored `Notification` additionally has a uuid
`id` and the originating `WebContents` as `sender`. A `NotificationHistoryEntry` wraps a
`Notification` with its `createdAt` timestamp and a mutable `read` flag.

Flow:

1. A producer (driver instance or desktop shell renderer) calls
   `window.labNotificationManager.addNotification(definition)`.
2. `NotificationManager.addNotification(sender, definition)` stores the notification with the
   sender's `WebContents`, appends it to the history and emits
   `NOTIFICATION_MANAGER_EMIT_NOTIFICATION_CREATE` and `NOTIFICATION_MANAGER_EMIT_HISTORY_CHANGE`.
3. The backend IPC pushes `onNotificationCreated` to the **notification panel** window, which
   renders the toast (vue-toastification — see [renderer windows](renderer.md#notification-panel)).
4. Toast click/close is reported back by the panel via `labServicingNotificationManager`;
   `NotificationManager` routes `onNotificationClicked`/`onNotificationClosed` **back to the
   original sender** `WebContents` — this is how a driver instance can react to its own toast
   being clicked. Every `sender.send(...)` is guarded by `sender.isDestroyed()` because history
   entries can outlive their producing view.
5. A producer may programmatically dismiss its toast via `requestNotificationClosure(id)`.

### Notification history & center

Toasts are short-lived teasers (max 5 visible, message truncated to ~65 chars, auto-dismiss), so
their full content would otherwise be unrecoverable. `NotificationManager` therefore keeps a
bounded **in-memory** history (`NotificationHistory` — a pure, Electron-free ring buffer, newest
first, capped at 100 entries, **not persisted** across restarts). It is surfaced by a
[notification center modal](renderer.md#notification-center) and an unread badge in the skeleton
navigation rail.

- `getHistory()`, `unreadCount()`, `markAllAsRead()`, `clearHistory()` and `historyEntryClicked(id)` back the
  servicing IPC (see [IPC](ipc.md#notification)).
- **Click → source connection activation.** When a clicked toast **or** history row comes from an
  `InstanceNotificationSource`, `NotificationManager` emits
  `NOTIFICATION_MANAGER_EMIT_SOURCE_ACTIVATION_REQUEST` with the `connectionId` **before** routing
  the click to the producer. `initializer.ts` wires it to `connectionManager.activateConnection(id)`
  (fire-and-forget; a missing/removed connection is logged and ignored) so the producer's
  click-through (e.g. evitaLab core's error viewer tab) opens in a **visible** instance rather than
  a hidden one.
- `NOTIFICATION_MANAGER_EMIT_HISTORY_CHANGE` (carrying the current unread count) is fired on add
  on mark-all-read and on clear (the latter two only when something actually changed); clearing
  the history does not dismiss live toasts. The backend IPC fans it out to the
  skeleton and every modal so the badge stays in sync.

The two IPC surfaces (producer-facing `NotificationManagerIpc` vs. panel/center/badge-facing
`ServicingNotificationManagerIpc`) are described in [IPC](ipc.md#notification).

## App updates

`AppUpdateManager` (`src/main/update/service/AppUpdateManager.ts`):

- **Windows**: full auto-update via a vendored, slightly modified copy of
  [`update-electron-app`](https://github.com/electron/update-electron-app)
  (`src/main/update/service/autoupdater.ts` — modified because Forge+Vite changes the
  `package.json` location; do not replace it with the npm package without checking). Uses the
  public `update.electronjs.org` service against `FgForrest/evitalab-desktop`, checks hourly,
  and prompts Restart/Later when an update is downloaded. Started 10 s after app ready by
  `tryAutoUpdate()`; no-op in dev.
- **macOS/Linux**: auto-update is disabled (macOS build is not yet signed). `isUpdateAvailable()`
  compares `VITE_BUILD_VERSION` against the latest GitHub release tag (`semver.gt`), and the UI
  offers `manualUpdateApp()` which opens the
  [releases page](https://github.com/FgForrest/evitalab-desktop/releases) and quits the app.

## Logging

`src/main/log/logger.ts` configures [electron-log](https://github.com/megahertz/electron-log):
common console/file format, `log.initialize()` (enables the renderer → main log bridge),
`log.errorHandler.startCatching()` and `log.eventLogger.startLogging()`.

- In main-process code, log via `import log from 'electron-log/main'` — never bare `console`.
- Renderer windows route `console.log`/`console.error` into electron-log too
  (`src/renderer/log/logger.ts`, called by the shared renderer initializer).
- Log files go to the default electron-log location: `~/.config/evitaLab/logs/main.log` (Linux),
  `~/Library/Logs/evitaLab/main.log` (macOS),
  `%USERPROFILE%\AppData\Roaming\evitaLab\logs\main.log` (Windows).

## Application menu

`src/main/menu.ts` builds the standard Electron menu (macOS-aware via
`process.platform === 'darwin'`) plus a custom **Help** submenu with external links (Discord,
GitHub issues of evitalab-desktop and evitaDB, evitaDB documentation) opened via
`shell.openExternal`.
