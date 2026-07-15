# evitaLab Desktop developer documentation

evitaLab Desktop is an [Electron](https://www.electronjs.org/) app built with TypeScript,
[Vue.js 3](https://vuejs.org/) (Composition API) and [Vuetify](https://vuetifyjs.com/en/) for
its views, [Vite](https://vitejs.dev/) (via [Electron Forge](https://www.electronforge.io/))
for building and [Yarn](https://yarnpkg.com/) as the package manager. The required
[Node.js](https://nodejs.org/en) version is in `.nvmrc`.

The desktop app is an **orchestrator shell** around the
[evitaLab core](https://github.com/FgForrest/evitalab) — it manages connections and embeds a
matching evitaLab core build (*driver*) per connection. The UI stack and conventions are kept
as close as possible to the
[evitaLab core developer documentation](https://github.com/FgForrest/evitalab/blob/dev/documentation/developer/index.md).

## Getting started

- [Running development version](running-development-version.md)
- [Building from source](building-from-source.md)
- [Build & tooling](build-and-tooling.md) — scripts, Forge/Vite config, CI/CD, versioning

## Understanding the codebase

Recommended reading order for anyone (human or AI agent) new to the codebase:

1. [Codebase architecture](architecture.md) — process model, source layout, window & view
   model, bootstrap
2. [Main process services](main-process.md) — what every manager does, persistence,
   notifications, updates, logging
3. [IPC framework](ipc.md) — the contract/backend/frontend pattern every main ↔ renderer call
   uses
4. [Drivers & instances](drivers-and-instances.md) — how evitaLab core builds are resolved,
   downloaded and embedded per connection
5. [Renderer windows](renderer.md) — the window catalog and the modal window pattern
6. [UI components](ui-components.md) — custom component catalog and theming

## Writing code

- [Guidelines](guidelines.md) — conventions, best practices, security, git workflow
- [Recipes](recipes.md) — step-by-step instructions for common tasks (new IPC domain, manager,
  modal window, …)
- [Localization](i18n.md) — i18n key structure and usage
- [Testing](testing.md) — Vitest conventions

When implementing or changing any functionality, the change **has to be reflected** in these
documentation files.
