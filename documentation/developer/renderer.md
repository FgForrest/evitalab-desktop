# Renderer windows

The renderer side is a set of small Vue 3 + Vuetify apps — **one HTML entry point per
window/view**, all hosted inside the skeleton window as described in
[architecture — window & view model](architecture.md#window--view-model). There is no vue-router:
each window is its own page, and modal windows receive their subject via IPC args.

## Entry points

Every entry follows the same triad: `<name>.html` (with `<div id="app">`), a bootstrap
`<name>.ts` calling `initializeRenderer(...)`, and a root Vue component. Modal windows
additionally export their URL from a `<name>Constants.ts` file — this URL is the modal's
identity for `ModalManager`. All entries are registered as Rollup inputs in
`vite.renderer.config.ts`.

| Entry | Directory (`src/renderer/`) | Root component | Purpose |
|-------|------------------------------|----------------|---------|
| `skeleton` | `skeleton/` | `Skeleton.vue` | The main window content: connection rail + welcome screen when no connection is active |
| `navigationPanel` | `navigation-panel/` | `NavigationPanel.vue` | Full navigation drawer as a modal overlay (`NAVIGATION_PANEL_URL`) |
| `connectionEditor` | `connection/editor/` | `ConnectionEditor.vue` | Add/edit connection form (`CONNECTION_EDITOR_URL`) |
| `connectionRemoveDialog` | `connection/remove-dialog/` | `ConnectionRemoveDialog.vue` | Dangerous confirm dialog for removing a connection (`CONNECTION_REMOVE_DIALOG_URL`) |
| `notificationPanel` | `notification/panel/` | `NotificationPanel.vue` | Transparent toast host window |
| `notificationCenter` | `notification/center/` | `NotificationCenter.vue` | Modal listing full notification history (`NOTIFICATION_CENTER_URL`) |

## Shared initialization

`src/renderer/initializer.ts` — every bootstrap calls:

```ts
initializeRenderer(RootComponent)
```

which sets up the renderer logger (console → electron-log bridge,
`src/renderer/log/logger.ts`), creates the Vue app, installs Vuetify + vue-i18n
(`src/renderer/vue-plugins/`), provides the `Toaster` service and mounts on `#app`. An optional
`appDecorator` callback can install extra plugins — used only by the notification panel to add
vue-toastification (it is the sole window that actually renders toasts).

## Talking to the main process

Renderers use the `window.lab*Manager` globals exposed by the preload bridge — the full API
reference is in [IPC](ipc.md). Typical pattern (list + subscription):

```ts
const connections = ref<ConnectionDto[]>([])

async function loadConnections(): Promise<void> {
    connections.value = await window.labConnectionManager.getConnections()
}

window.labConnectionManager.onConnectionsChange(() => loadConnections())
onMounted(() => loadConnections())
```

## The modal window pattern

A modal window is a full-window transparent overlay:

- The root component wraps its content in `ModalWindow`
  (`src/renderer/common/component/ModalWindow.vue` — transparent `VApp`).
- It is opened from anywhere via
  `window.labModalManager.openModal(CONNECTION_EDITOR_URL, connectionId)` and closes itself via
  `window.labModalManager.closeModal(<OWN_URL>)`.
- It receives its arguments via
  `window.labModalManager.onModalArgsPassed((url, args) => ...)` — always check
  `url === <OWN_URL>` first (the event is broadcast per modal, but the guard keeps it safe).
  The connection editor treats zero args as "create new connection".
- Dialogs inside use `VFormDialog`/`VLabDialog` with `persistent` behavior; cancelling closes
  the modal window.

Step-by-step: [recipes — add a new modal window](recipes.md#add-a-new-modal-window).

## Feature areas

### Skeleton (`src/renderer/skeleton/`)

`Skeleton.vue` renders the minimized connection **rail**
(`skeleton/component/NavigationPanel.vue` — distinct from the modal window's
`NavigationPanel.vue`!) and, when no connection is active, the `WelcomeScreen`. The rail shows
`ConnectionAvatar`s (initials via `computeShortConnectionName` from `src/common/util/connection.ts`,
color from connection styling), driver-update badges, and opens the full navigation panel modal
on the hamburger button. The rail background reflects the active connection's environment
(production/test warning colors).

### Navigation panel (`src/renderer/navigation-panel/`)

`Panel.vue` (drawer, width 350) composed of `Header.vue` (logo = "go home", app name, `ManageMenu`
with external help links), `ConnectionList.vue` (drag-and-drop reordering via `vuedraggable` →
`storeConnectionsOrder`, add-connection button) and `Footer.vue` (Discord/docs links, build
version from `import.meta.env.VITE_BUILD_VERSION`, app-update button backed by
`labAppUpdateManager`). `ConnectionListItem.vue` renders one connection with environment
coloring, a context menu (edit/remove → opens the respective modal) and a "new driver" chip.

### Connection editor (`src/renderer/connection/editor/`)

`ConnectionEditor.vue` — the most complex form: server URL with live async validation
(`ServerMetadataProvider.testConnection(...)` checks `ServerStatus` readiness + lab/gRPC APIs
enabled), driver version selection (`driver/component/DriverSelect.vue`, debounced
`resolveLatestAvailableDriver`), name auto-suggestion from the server
(`resolveServerName` → `GET <url>/system/server-name`) with duplicate check
(`getSimilarConnection`), `VColorSelect` styling and environment select. `save()` downloads the
driver first, then `storeConnection(...)`. `ServerMetadataProvider`
(`editor/service/ServerMetadataProvider.ts`) is the only renderer code doing direct HTTP (via
`ky`) to an evitaDB server.

### Notification panel (`src/renderer/notification/`)

Two-tier toast architecture (main-process side:
[main process — notification system](main-process.md#notification-system)):

- **Producers** anywhere inject `Toaster` (`notification/service/Toaster.ts`,
  `useToaster()`) — `success/info/warning/error(title)` → `labNotificationManager`. `error()`
  also logs the passed `Error` to the console. Never use vue-toastification directly.
- **The panel window** (`ToastificationIntegrator.ts`) listens on
  `labServicingNotificationManager` and renders/dismisses vue-toastification toasts (message
  truncated at ~65 chars), reporting clicks/closures back.
- The severity → `mdi-*` icon mapping is shared between the panel and the center in
  `notification/service/notificationSeverity.ts` (single source of truth).

#### Notification center

`notification/center/NotificationCenter.vue` (modal, `NOTIFICATION_CENTER_URL`) lists the full
notification history — the place where the complete, untruncated message lives. Each row shows a
severity icon, a source chip (the connection name for instance sources, resolved via
`labConnectionManager.getConnection`; the app name for skeleton sources), the full multi-line
message and a relative timestamp. Clicking a row calls `historyEntryClicked(id)` (which activates
the source connection so a producer's detail view opens visibly) and closes the modal. On open it
reloads the history via `getNotificationHistory()` and calls `markAllNotificationsRead()`; while
open it reacts to `onHistoryChanged` to show newly-arriving notifications.

The unread badge lives in the skeleton navigation rail (`skeleton/component/NavigationPanel.vue`,
`#append` slot): an `mdi-bell-outline` in a `VBadge`, initialized from `getNotificationHistory()`
and kept in sync via `onHistoryChanged`; clicking it opens the center modal.

### Welcome screen (`src/renderer/welcome-screen/`)

Hero screen with logo, version, external links and the two latest evitaDB blog posts —
`WelcomeScreenService` fetches and parses `https://evitadb.io/rss.xml` (via `ky` + `DOMParser`)
into `EvitaDBBlogPost` models.

## Utilities

- `src/renderer/util/reactivity.ts` — `mandatoryInject(key)` (throws when a service was not
  provided; used by `useToaster()`).
- `src/renderer/util/debounce.ts` — debounce helper used for async form validation/suggestions
  (500 ms in the connection editor and driver select).

## Localization & styling

All user-facing strings go through vue-i18n (`src/renderer/i18n/en.json`) — see [i18n](i18n.md).
Theming, SCSS structure and the custom component catalog are described in
[UI components](ui-components.md).
