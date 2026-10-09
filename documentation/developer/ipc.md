# IPC framework

All communication between the main process and renderer windows goes through a uniform
three-layer IPC pattern. Renderers never import main-process code; the main process never
reaches into renderer internals — everything crosses the boundary via channels defined in a
shared contract.

## The three layers

For every IPC domain `<domain>` (connection, driver, modal, notification, update) there are
three cooperating pieces:

1. **Contract** — `src/common/ipc/<domain>/service/<Domain>ManagerIpc.ts`
   Exported **string channel-name constants** (convention: constant
   `xxxManagerIpc_<action>`, value `'xxxManager:<action>'`) plus DTO interfaces under
   `src/common/ipc/<domain>/model/`. This is the single source of truth shared by both
   processes.
2. **Backend** — `src/main/ipc/<domain>/service/Backend<Domain>ManagerIpc.ts`
   An `initBackend<Domain>ManagerIpc(...)` function called from `initializer.ts`. It registers
   `ipcMain.handle` (request/response) and `ipcMain.on` (fire-and-forget) handlers delegating to
   the corresponding manager, subscribes to the manager's `EventEmitter` events and pushes them
   to renderer(s) via `webContents.send(...)`. Model ⇄ DTO conversion lives here
   (e.g. `convertConnectionToDto`, `NotificationSourceConverter`).
3. **Frontend (preload)** — `src/preload/renderer/ipc/<domain>/service/Frontend<Domain>ManagerIpc.ts`
   An `exposeFrontend<Domain>ManagerIpc()` function that calls
   `contextBridge.exposeInMainWorld('lab<Domain>Manager', {...})`, mapping each method to
   `ipcRenderer.invoke`/`send`/`on` on the same channel constants, and a
   `Frontend<Domain>ManagerIpc` interface as the renderer-side contract (referenced by
   `src/renderer/global.d.ts`).

Convention: `ipcMain.handle` + `ipcRenderer.invoke` for anything returning a value
(`getX`, `storeX`, `addNotification`, …); `ipcMain.on` + `ipcRenderer.send` for one-way commands
(`openModal`, `manualUpdateApp`, …); `ipcRenderer.on` for main → renderer push events
(`onXxx` channels).

## Preload entry points & window globals

| Preload | Built as | Used by | Exposes |
|---------|----------|---------|---------|
| `src/preload/renderer/preload.ts` | `renderer-preload.js` | skeleton, modals, notification panel | all six globals below |
| `src/preload/driver/preload.ts` | `driver-preload.js` | embedded driver instances | `labNotificationManager` only |

Globals available on `window` in desktop-shell renderers (typed in `src/renderer/global.d.ts`):

| Global | Frontend interface |
|--------|--------------------|
| `window.labConnectionManager` | `FrontendConnectionManagerIpc` |
| `window.labDriverManager` | `FrontendDriverManagerIpc` |
| `window.labModalManager` | `FrontendModalManagerIpc` |
| `window.labNotificationManager` | `FrontendNotificationManagerIpc` |
| `window.labServicingNotificationManager` | `FrontendServicingNotificationManagerIpc` |
| `window.labAppUpdateManager` | `FrontendAppUpdateManagerIpc` |

## Domain reference

### Connection (`labConnectionManager`)

- Invoke: `getConnections`, `getConnection`, `getActiveConnection`, `getSimilarConnection`,
  `activateConnection`, `storeConnection` (upsert — `id == undefined` creates),
  `storeConnectionsOrder`, `removeConnection`.
- Push events: `onConnectionActivation`, `onConnectionsChange`, `onDriverUpdateAvailable` —
  fanned out to the skeleton **and** every modal window.
- DTOs: `ConnectionDto`, `ConnectionStylingDto` (`src/common/ipc/connection/model/`).

### Driver (`labDriverManager`)

- Invoke only: `getDriver(version)`, `resolveLatestAvailableDriver(serverUrl)`,
  `downloadDriver(version)`. DTO: `DriverDto`. No push events.

### Modal (`labModalManager`)

- Send: `openModal(url, ...args)`, `closeModal(url)` — `url` is the modal's renderer path
  constant (e.g. `CONNECTION_EDITOR_URL`), args are forwarded to the modal.
- Push events: `onModalVisibilityChange(url, visible)`, `onModalArgsPassed(url, ...args)` —
  targeted at the specific modal's `webContents`. Modals read their subject (e.g. the
  `ConnectionId` to edit) from `onModalArgsPassed`.

### Notification

Two contract surfaces (see [main process — notification system](main-process.md#notification-system)
for the full flow):

- **`labNotificationManager`** (producer-facing, exposed in **both** preloads):
  invoke `addNotification(definition)` → `NotificationId`; send
  `requestNotificationClosure(id)`; push events routed to the producing view only:
  `onNotificationClicked(id)`, `onNotificationClosed(id)`.
- **`labServicingNotificationManager`** (renderer preload only — consumed by the notification
  panel, the notification center and the navigation-panel badge):
  - notification panel: push events `onNotificationCreated(dto)`,
    `onNotificationClosureRequested(id)`; send `notificationClicked(id)`, `notificationClosed(id)`.
  - history/center/badge: invoke `getNotificationHistory()` → `NotificationHistoryEntryDto[]`;
    send `markAllNotificationsRead()`, `historyEntryClicked(id)`; push `onHistoryChanged(unreadCount)`
    (fanned out to the skeleton **and** every modal). `NotificationHistoryEntryDto` carries `id`,
    `severity`, `source` (a `NotificationSourceDto` — with `connectionId` for instance sources, so
    the renderer resolves the connection name itself via `labConnectionManager.getConnection`),
    `message`, `createdAt` (ISO string) and `read`.

### Update (`labAppUpdateManager`)

- Invoke: `isUpdateAvailable()`; send: `manualUpdateApp()`.
- Note: this domain's channel constants use the `appUpdateManagerIpc:` prefix (slight deviation
  from the `xxxManager:` pattern of the others).

## Rules

- **Never** call `ipcRenderer`/`ipcMain` ad hoc — always go through the three-layer pattern so
  channel names stay in one place and renderer APIs stay typed.
- Only DTOs (plain serializable objects from `src/common/ipc/<domain>/model/`) cross the
  boundary — never main-process model classes (they carry behavior and `WebContents`
  references).
- New renderer-facing APIs must be added to `src/renderer/global.d.ts` and registered in the
  appropriate preload entry point.
- The driver preload must stay minimal — driver instances are third-party-ish content (a
  downloaded evitaLab build) and only need the notification producer API.

Step-by-step instructions: [recipes — add a new IPC domain](recipes.md#add-a-new-ipc-domain).
