# Codebase architecture

evitaLab Desktop is an [Electron](https://www.electronjs.org/) app built with TypeScript, Vue 3
(Composition API), Vuetify and Vite (via [Electron Forge](https://www.electronforge.io/)). This
page describes how the application is wired together. For a per-service reference see the
[main process services](main-process.md), for the windows see [renderer windows](renderer.md).

The desktop app itself contains **no evitaDB data-access features** — it is an orchestrator shell.
The actual database GUI is the [evitaLab core](https://github.com/FgForrest/evitalab) running in
`DRIVER` mode, downloaded at runtime as a *driver* and embedded per connection
(see [drivers & instances](drivers-and-instances.md)).

## Process model

Like every Electron app, evitaLab Desktop consists of three kinds of processes:

- **Main process** (`src/main/`) — Node.js environment. Owns windows, connection persistence,
  driver downloads, notifications, app updates. Composed of *manager* services
  ([catalog](main-process.md)).
- **Preload scripts** (`src/preload/`) — run in renderers with access to `ipcRenderer`; expose
  typed APIs to the renderer world via `contextBridge` (see [IPC](ipc.md)). There are two:
  `renderer/preload.ts` (skeleton, modals, notification panel) and `driver/preload.ts`
  (embedded evitaLab driver instances).
- **Renderer processes** (`src/renderer/`) — Vue 3 + Vuetify UIs, one HTML entry point per
  window/view (see [renderer windows](renderer.md)).

Code shared by processes lives in `src/common/` — most importantly the IPC contract
(channel constants + DTOs).

## Source layout

```
src/
├── common/                  # code shared between main & renderer processes
│   ├── ipc/                 # IPC contracts: channel constants + DTOs per domain
│   └── util/                # shared utils (computeShortConnectionName)
├── main/                    # main process
│   ├── main.ts              # entrypoint (calls initializer)
│   ├── initializer.ts       # composition root — constructs & wires all managers
│   ├── menu.ts              # application menu
│   ├── config/              # AppConfig — persisted app configuration
│   ├── connection/          # ConnectionManager + Connection model
│   ├── driver/              # DriverManager + Driver model
│   ├── instance/            # InstanceManager — embedded driver views
│   ├── modal/               # ModalManager — modal overlay views
│   ├── notification/        # NotificationManager + notification model
│   ├── skeleton/            # SkeletonManager — the root BrowserWindow
│   ├── update/              # AppUpdateManager + vendored autoupdater
│   ├── ipc/                 # Backend*Ipc — ipcMain handlers per domain
│   ├── log/                 # electron-log setup
│   └── util/                # main-process utils (debounce)
├── preload/
│   ├── renderer/            # preload for desktop shell UIs (renderer-preload.js)
│   │   ├── preload.ts
│   │   └── ipc/             # Frontend*Ipc — contextBridge APIs
│   └── driver/              # preload for driver instances (driver-preload.js)
└── renderer/                # Vue UIs — one directory per window (see renderer.md)
```

## Window & view model

The app uses a **single `BrowserWindow`** — the *skeleton* (`SkeletonManager`, 1280×720,
min 800×600) — and layers everything else into it as `WebContentsView` children of
`skeletonWindow.contentView`. Z-order is controlled by child index:

| View (bottom → top) | Created by | Preload | Loads |
|---------------------|------------|---------|-------|
| Driver instance (one per connection) | `InstanceManager.initInstance()` | `driver-preload.js` | `<userData>/drivers/<version>/dist-driver/index.html` |
| Modal (navigation panel, connection editor, …) | `ModalManager.initModal(url)` | `renderer-preload.js` | `/src/renderer` + modal URL, transparent background |
| Notification panel | `NotificationManager.init()` | `renderer-preload.js` | `notification-panel.html`, transparent, always top-most |

- Driver instances are added at index `0` (under everything) and sized to leave the 56 px
  connection rail on the left (`x: 56, width: skeletonWidth - 57`).
- Modals are inserted at `children.length - 1` — full-window, above instances, below the
  notification panel.
- The notification panel sits in the bottom-right corner; its bounds grow/shrink with the number
  of displayed toasts (max 5).

Each manager registers a debounced (50 ms) resize handler on the skeleton window events
`resize`, `maximize`, `unmaximize`, `enter-full-screen`, `leave-full-screen` to recompute view
bounds (`src/main/util/debounce.ts`).

### Dev vs. production loading

Every view loader checks the Forge-injected global `MAIN_WINDOW_VITE_DEV_SERVER_URL`: when set
(during `yarn start`), views are loaded from the Vite dev server (`loadURL`); in a packaged app
they are loaded from the built renderer directory
(`loadFile(__dirname + '../renderer/' + MAIN_WINDOW_VITE_NAME + <path>)`).

## Bootstrapping

`src/main/main.ts` only calls `initialize()` from `src/main/initializer.ts`, which is the
**composition root** of the app. The startup sequence:

1. Application menu is installed (`Menu.setApplicationMenu(menu)`).
2. Logger is initialized (`initializeLogger()`, see [main process — logging](main-process.md#logging)).
3. `electron-squirrel-startup` guard — quits during Windows install/uninstall shortcut handling.
4. **Managers are constructed** (plain constructor injection):
   `AppUpdateManager`, `AppConfig`, `SkeletonManager`, `NotificationManager`, `ModalManager`,
   `DriverManager`, `ConnectionManager(appConfig, driverManager)`,
   `InstanceManager(driverManager)`.
5. **Managers are interconnected** via `EventEmitter` subscriptions — e.g. connection activation
   (`CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION`) activates the matching driver instance,
   connection change restarts it.
6. `await app.whenReady()`, then `appUpdateManager.tryAutoUpdate()`.
7. **Backend IPC handlers are registered** (`initBackendXxxManagerIpc(...)`, see [IPC](ipc.md)).
8. **The skeleton window is created** and handed to `NotificationManager`, `ModalManager` and
   `InstanceManager` (in this order — the notification manager must know first so it can allocate
   space for the notification panel). The notification panel view and the navigation panel modal
   are pre-initialized.
9. App lifecycle handlers are registered (`window-all-closed` quits except on macOS; `activate`
   re-creates the skeleton on macOS dock click).
10. **Data is initialized last**: `appConfig.init()` loads `config.json`,
    `connectionManager.init()` rehydrates connections — so that the resulting change events land
    on already-live windows.

## Communication overview

- **Main ↔ renderer**: exclusively through the three-layer IPC framework
  (contract in `src/common/ipc/`, `Backend*Ipc` in main, `Frontend*Ipc` exposed as
  `window.lab*Manager` globals) — see [IPC](ipc.md). Renderers never import from `src/main/`.
- **Manager ↔ manager (main)**: constructor injection for direct dependencies; `EventEmitter`
  events (exported `*_EMIT_*` string constants) for reactions, wired centrally in
  `initializer.ts`.
- **Desktop ↔ driver instance**: the driver receives its configuration via base64-encoded URL
  query parameters (`evitalab-*`) and reports notifications back through the driver preload —
  see [drivers & instances](drivers-and-instances.md).

## State management

- All durable state lives in the **main process** and is persisted by `AppConfig` to
  `config.json` in Electron's `userData` directory
  (see [main process — persistence](main-process.md#appconfig--persistence)).
- Renderer windows are thin views: they fetch state via `window.lab*Manager` calls and subscribe
  to push events (`onConnectionsChange`, `onConnectionActivation`, …) to stay in sync. They keep
  only local view state in Vue refs.
- Domain models are immutable where practical, using
  [Immutable.js](https://immutable-js.com/) collections (`List`, `Map`) in models and service
  APIs — same convention as evitaLab core.
