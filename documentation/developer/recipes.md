# Recipes

Step-by-step instructions for common implementation tasks. Follow the
[guidelines](guidelines.md) throughout.

## Add a new IPC domain

Using the driver domain as the reference implementation. For a domain `foo`:

1. **Contract** — `src/common/ipc/foo/service/FooManagerIpc.ts` with channel constants:

```ts
export const fooManagerIpc_doThing = 'fooManager:doThing'
export const fooManagerIpc_onThingHappened = 'fooManager:onThingHappened'
```

   DTOs (plain serializable interfaces) go to `src/common/ipc/foo/model/`.

2. **Manager** — implement the business logic in `src/main/foo/service/FooManager.ts`
   (see [add a new main-process manager](#add-a-new-main-process-manager)).

3. **Backend** — `src/main/ipc/foo/service/BackendFooManagerIpc.ts`:

```ts
export function initBackendFooManagerIpc(fooManager: FooManager): void {
    ipcMain.handle(fooManagerIpc_doThing, async (event, arg: string) => {
        return convertThingToDto(await fooManager.doThing(arg))
    })
    fooManager.on(FOO_MANAGER_EMIT_THING_HAPPENED, (thing) => {
        // push to the relevant webContents
    })
}
```

   Call it from `src/main/initializer.ts` alongside the other `initBackend*Ipc` calls.

4. **Frontend** — `src/preload/renderer/ipc/foo/service/FrontendFooManagerIpc.ts`:

```ts
export interface FrontendFooManagerIpc {
    doThing(arg: string): Promise<ThingDto>
    onThingHappened(listener: (thing: ThingDto) => void): void
}

export function exposeFrontendFooManagerIpc(): void {
    contextBridge.exposeInMainWorld('labFooManager', {
        doThing: (arg: string) => ipcRenderer.invoke(fooManagerIpc_doThing, arg),
        onThingHappened: (listener) =>
            ipcRenderer.on(fooManagerIpc_onThingHappened, (_, thing) => listener(thing))
    } as FrontendFooManagerIpc)
}
```

   Register it in `src/preload/renderer/preload.ts` (and only if driver instances genuinely
   need it, in `src/preload/driver/preload.ts` — keep the driver surface minimal).

5. **Renderer typing** — add `labFooManager: FrontendFooManagerIpc` to
   `src/renderer/global.d.ts`.
6. Document the domain in [IPC](ipc.md#domain-reference).

Use `ipcMain.handle`/`ipcRenderer.invoke` for request/response, `ipcMain.on`/`ipcRenderer.send`
for one-way commands, and only pass DTOs across the boundary.

## Add a new main-process manager

1. Create `src/main/<domain>/service/MyManager.ts`; models go to `src/main/<domain>/model/`.
   Extend `EventEmitter` and export event-name constants
   (`export const MY_MANAGER_EMIT_X = 'x'`) if other managers or renderers must react to it.
2. Construct it in `src/main/initializer.ts`, passing dependencies through the constructor.
3. Wire cross-manager reactions in `initializer.ts` via `manager.on(EVENT, ...)` — managers must
   not construct or look up each other.
4. If it needs the skeleton window, follow the `skeletonWindow` setter pattern used by
   `NotificationManager`/`ModalManager`/`InstanceManager` (injected in `initSkeleton`, cleared
   on window close).
5. If renderers need it, add an IPC domain (recipe above).
6. Document it in [main process services](main-process.md).

## Add a new modal window

Using the connection editor as the reference (`src/renderer/connection/editor/`):

1. Create the window triad in `src/renderer/<feature>/`:
   - `<name>.html` — copy an existing one, adjust title and script path;
   - `<name>.ts` — `initializeRenderer(MyModal)`;
   - `<name>Constants.ts` — `export const MY_MODAL_URL = '/<feature>/<name>.html'`
     (path relative to `src/renderer`).
2. Root component wraps content in `ModalWindow` and typically a `VFormDialog`/`VLabDialog`.
   Read args via `window.labModalManager.onModalArgsPassed((url, args) => ...)` guarded by
   `url === MY_MODAL_URL`; close via `window.labModalManager.closeModal(MY_MODAL_URL)`.
3. Register the HTML file as a Rollup input in `vite.renderer.config.ts`
   (`build.rollupOptions.input`).
4. Open it from anywhere: `window.labModalManager.openModal(MY_MODAL_URL, someId)`.
   (`ModalManager` lazily initializes modal views on first open; pre-initialize in
   `initializer.ts` via `modalManager.initModal(...)` only when first-open latency matters, as
   done for the navigation panel.)
5. Localize all strings under a new namespace in `src/renderer/i18n/en.json` and document the
   window in [renderer windows](renderer.md#entry-points).

## Show a toast notification

From any desktop-shell renderer:

```ts
const toaster: Toaster = useToaster()

try {
    await window.labConnectionManager.removeConnection(connection.id)
    await toaster.success(t('connection.removeDialog.notification.connectionRemoved', { name }))
} catch (e: any) {
    await toaster.error(t('connection.removeDialog.notification.couldNotRemoveConnection'), e)
}
```

Toasts render in the separate notification-panel window; never use vue-toastification directly
(see [UI components — toast notifications](ui-components.md#toast-notifications)).

## Persist new configuration

1. Extend the config shape in `src/main/config/model/AppConfig.ts` (`StorableConfig` + the
   matching `*Config` interface), keeping backward compatibility with existing `config.json`
   files (treat missing fields as defaults).
2. Add an `updateX(...)` method that sets the state, emits `CONFIG_EMIT_UPDATE` and calls
   `storeConfig()` — mirror `updateConnections`.
3. Let exactly one manager own reading/writing that section, as `ConnectionManager` owns
   `connections`.

## Verify a change in the running app

1. `yarn start` — launches the app with the Vite dev server and hot reload
   (see [running development version](running-development-version.md)).
2. You need a reachable evitaDB server to create a connection — `https://demo.evitadb.io` works
   for UI verification.
3. Exercise the affected UI. Watch the terminal (main-process log) and the DevTools console of
   the relevant window; toasts report user-facing errors.

## Checklist before opening a PR

- [ ] `yarn lint` passes (CI does not run it — do it locally).
- [ ] `yarn test` passes (add unit tests for new pure logic — e.g. anything like the
      `DriverManager` resolution rules; regression test for bug fixes).
- [ ] The app starts (`yarn start`) and the affected flow works.
- [ ] New classes/components have JSDoc; user-facing strings are localized.
- [ ] `documentation/developer/` updated (managers, IPC domains, windows, components, recipes as
      applicable).
- [ ] Conventional-commit messages; feature branch off `dev`.
