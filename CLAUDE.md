# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

evitaLab Desktop is the official desktop GUI client for the evitaDB e-commerce database. It is an
Electron app that acts as an **orchestrator shell** around the
[evitaLab core](https://github.com/FgForrest/evitalab): it manages connections to multiple evitaDB
servers and, for each connection, downloads and embeds a matching evitaLab core build (a *driver*)
as an embedded view. The desktop app itself contains no database-access features — those live in
the evitaLab core repository.

Technology stack: Yarn, Electron 35 + Electron Forge 7, TypeScript, Vue.js 3 (Composition API),
Vite 5, Vitest 3, Vuetify 3.

## Documentation

Developer documentation lives in `documentation/developer/` — **read it before analyzing source
code**; it covers the architecture, all services, windows, conventions and step-by-step recipes:

- [index](documentation/developer/index.md) — TOC with recommended reading order
- [architecture](documentation/developer/architecture.md) — process model, source layout, window & view model, bootstrap
- [main process services](documentation/developer/main-process.md) — manager catalog, persistence, notifications, updates, logging
- [IPC framework](documentation/developer/ipc.md) — the contract/backend/frontend pattern for all main ↔ renderer communication
- [drivers & instances](documentation/developer/drivers-and-instances.md) — how evitaLab core builds are resolved, downloaded and embedded
- [renderer windows](documentation/developer/renderer.md) — window catalog and the modal window pattern
- [UI components](documentation/developer/ui-components.md) — custom component catalog and theming
- [guidelines](documentation/developer/guidelines.md) — coding conventions, security, error handling, git workflow
- [recipes](documentation/developer/recipes.md) — step-by-step: new IPC domain, manager, modal window, toasts, pre-PR checklist
- [i18n](documentation/developer/i18n.md), [testing](documentation/developer/testing.md), [build & tooling](documentation/developer/build-and-tooling.md)

When implementing or changing any functionality, it HAS TO BE REFLECTED in the documentation files.

### Source code pollution

Don't overcomment the source code itself, focus documentation mainly into the /documentation
directories. If you comment the code, don't mention anything from the implementation plans, like
Phases of implementation or things like that. Keep only language-specific documentation in the
source code files.

## Building

**Package manager is yarn. Never run `npm install`, `npm ci`, or `npx` in this repo** — npm may
write `package-lock.json`, which diverges from `yarn.lock`. Node.js version is pinned in `.nvmrc`.

```bash
yarn install                # install dependencies
yarn start                  # run the app in dev mode (Vite dev server + hot reload)
yarn make                   # build platform distributables into out/make/
yarn lint                   # ESLint (NOT run in CI — always run locally)
yarn test                   # Vitest
```

Full reference (Forge/Vite config, env variables, CI/CD): [build & tooling](documentation/developer/build-and-tooling.md).

Verifying UI behavior requires a reachable evitaDB server to connect to — the public demo server
`https://demo.evitadb.io` is the easiest target. Drivers and their metadata database are
downloaded from GitHub at runtime, so network access is needed on first connection use.

## Planning

Always create a detailed plan of implementation or fix if asked for issue analysis. Always store
the plan in a Markdown file inside this project.

## Architecture & Conventions

Described in the [developer documentation](documentation/developer/index.md) — see the links
above. The non-negotiable rules:

- All main ↔ renderer communication goes through the three-layer IPC pattern: channel constants +
  DTOs in `src/common/ipc/`, `Backend*Ipc` handlers in `src/main/ipc/`, `Frontend*Ipc` exposed
  via `contextBridge` as `window.lab*Manager` globals ([IPC](documentation/developer/ipc.md)).
  Never call `ipcMain`/`ipcRenderer` ad hoc; only DTOs cross the process boundary.
- Business logic and durable state belong to main-process managers (`src/main/*/service/`),
  constructed and wired exclusively in `src/main/initializer.ts` (constructor injection +
  EventEmitter events). Renderer windows are thin views over the IPC APIs.
- Do not weaken Electron hardening: no `nodeIntegration`, keep the Forge fuses, keep the driver
  preload minimal (driver instances run downloaded evitaLab code).
- New renderer windows follow the entry-point triad (`<name>.html` + `<name>.ts` +
  `<name>Constants.ts`) and must be registered in `vite.renderer.config.ts` — follow the
  [recipe](documentation/developer/recipes.md#add-a-new-modal-window).
- Report user-facing errors via the injected `Toaster` (`useToaster()`) — never use
  vue-toastification directly; log main-process errors via `electron-log`.
- All user-facing strings go through i18n (`src/renderer/i18n/en.json`).
- Keep the UI stack and component APIs consistent with evitaLab core; prefer the custom `V*`
  components over raw Vuetify ([UI components](documentation/developer/ui-components.md)).
- Document every new Vue component, class, type and interface (JSDoc) and reflect changes in
  `documentation/developer/`.

## Git Workflow

- `master`: released versions only; `dev`: current development (target for PRs and feature branches)
- Feature branches: created from `dev` for each issue
- Use [conventional commits](https://www.conventionalcommits.org/) — CI/CD derives release
  versions from them (`feat:` bumps the minor of the calendar-semantic version)
- Details: [guidelines — git](documentation/developer/guidelines.md#git)

## External Documentation

Always use Context7 MCP when you need library/API documentation, code generation, setup or
configuration steps without being explicitly asked.
