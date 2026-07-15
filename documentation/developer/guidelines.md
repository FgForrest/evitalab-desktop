# Guidelines

Rules and conventions for writing evitaLab Desktop code. The codebase deliberately mirrors the
conventions of the [evitaLab core](https://github.com/FgForrest/evitalab/blob/dev/documentation/developer/guidelines.md)
— vertical feature slices, immutability where it makes sense, and the same UI stack — so that
working on either project feels the same.

## TypeScript conventions

- **Explicit types everywhere** — declare types for variables, parameters and return values even
  when inferable (`const connection: Connection = ...`). This is the prevailing codebase style.
- Prefer `undefined` over `null`; check with `== undefined`.
- Domain model classes are immutable where practical: `readonly` properties, initialization in
  the constructor, [Immutable.js](https://immutable-js.com/) collections (`List`, `Map`) in
  models and service APIs. Mutations return/emit new state rather than exposing internals.
- Enums are string-valued (`enum ConnectionEnvironment { Development = 'development', ... }`).
- Every class, interface, type and Vue component gets a short JSDoc block describing its
  purpose. Do **not** put implementation-plan commentary into source files — extended
  documentation belongs in `documentation/`.

## Naming conventions

- Classes/services/models: `PascalCase`, one class per file, file named after the class.
- Main-process services: `XxxManager` in `src/main/<domain>/service/`.
- IPC triple per domain: contract `XxxManagerIpc` (`src/common/ipc/`), backend
  `BackendXxxManagerIpc` (`src/main/ipc/`), frontend `FrontendXxxManagerIpc`
  (`src/preload/**/ipc/`); channel constants `xxxManagerIpc_<action>` = `'xxxManager:<action>'`
  (see [IPC](ipc.md)).
- Objects crossing the IPC boundary are DTOs: `XxxDto` interfaces in
  `src/common/ipc/<domain>/model/`.
- `EventEmitter` event names are exported constants: `XXX_MANAGER_EMIT_<EVENT>`.
- Renderer window entries: kebab-case directory with `<name>.html` + `<name>.ts` +
  `<name>Constants.ts` (modal URL) — see [renderer windows](renderer.md#entry-points).
- Shared Vue components: `V` prefix (`VLabDialog`); feature components without prefix.
- i18n keys: camelCase, namespaced per feature (see [i18n](i18n.md)).

## Code architecture

### Where logic belongs

- **Main-process managers** own all business logic and durable state: connections, drivers,
  instances, notifications, updates, persistence. If a behavior must survive window reloads or
  affects more than one window, it belongs in a manager.
- **Renderer components** hold only view state and small UI logic; they read/write everything
  through the `window.lab*Manager` IPC APIs and subscribe to push events for updates.
- **Renderer services** (e.g. `ServerMetadataProvider`, `WelcomeScreenService`) wrap external
  HTTP access or non-trivial view-side logic — keep components thin.
- **`src/common/`** is for code genuinely shared by both processes (IPC contracts, pure utils).
  It must not import from `electron`, `src/main/` or `src/renderer/`.

### Component structure

Single-File Components with the Composition API (`<script setup lang="ts">`), section order:
`script` → `template` → `style`. Inside `setup`: imports, constants, service injection
(`useToaster()`, `useI18n()`), props/emits, refs/computed/functions.

### Dependency injection

The renderer uses a lightweight variant of evitaLab core's DI: a service exports an injection
key and a `useX()` helper built on `mandatoryInject` (`src/renderer/util/reactivity.ts`), and is
provided in `src/renderer/initializer.ts`:

```ts
export const toasterInjectionKey: InjectionKey<Toaster> = Symbol('toaster')

export function useToaster(): Toaster {
    return mandatoryInject(toasterInjectionKey)
}
```

Main-process managers use plain constructor injection, composed exclusively in
`src/main/initializer.ts` — never construct a manager elsewhere or reach for singletons.

## Security

Electron hardening is deliberate — do not weaken it:

- Renderers must never get `nodeIntegration`; all main-process access goes through the
  `contextBridge` APIs of the two preload scripts (see [IPC](ipc.md)).
- The **driver preload stays minimal** — driver instances run downloaded code and only get the
  notification producer API.
- Fuses in `forge.config.ts` disable `RunAsNode`, `NODE_OPTIONS` and node CLI inspect arguments,
  and enforce ASAR integrity — keep them enabled.
- External links open via `shell.openExternal`/`window.open` — never load third-party pages
  into app views.

## Error handling & logging

- Wrap `window.lab*Manager` / HTTP calls in components in try-catch and report via
  `toaster.error(t('...'), e)` with a localized title; provide fallback values. Never swallow
  errors silently.
- In the main process, log errors with context via `import log from 'electron-log/main'`
  (`log.error(...)`); prefer failing gracefully (e.g. a failed driver-update check is expected
  when the server is unreachable and must not propagate).
- Never log secrets or user data.

## Asynchronicity

- Anything touching IPC, disk or network is `async` — `await` it and handle errors; avoid
  fire-and-forget except for deliberate background checks (driver-update check).
- Debounce user-input-driven async work (async validation, suggestion lookups) — 500 ms via the
  `debounce` utils.
- Register renderer IPC event subscriptions once per component setup; long-lived main-process
  subscriptions are wired in `initializer.ts`.

## Localization

All user-facing strings go through vue-i18n — no hardcoded texts in templates or services. See
[i18n](i18n.md).

## Documentation

Document every new Vue component, class, type and interface with JSDoc. Any new or changed
functionality **must be reflected** in `documentation/developer/` (this directory) — new
managers belong in [main process services](main-process.md), new IPC domains in [IPC](ipc.md),
new windows in [renderer windows](renderer.md), new shared components in
[UI components](ui-components.md), new recipes in [recipes](recipes.md).

## Git

### Branches

We use 3 types of branches:

- `master` — released versions only
- `dev` — current development; target of feature branches and PRs
- feature branches — created from `dev` for each issue (bug fix or feature)

For hotfixes, a bug-fixing branch may be created from `master`, but it must not do more than fix
a bug in a non-breaking way.

### Commits

We use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit
messages and pull requests — the release workflow derives the app version from them
(`feat:` bumps the minor of the calendar-semantic version, see
[build & tooling](build-and-tooling.md#cicd-github-actions)).
