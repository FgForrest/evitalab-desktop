# Build & tooling

Reference of the build pipeline and developer tooling. For basic setup see
[running development version](running-development-version.md) and
[building from source](building-from-source.md).

## Package manager & Node

- **Yarn only.** Never run `npm install`/`npm ci`/`npx` in this repo — npm writes
  `package-lock.json`, diverging from `yarn.lock`.
- Node.js version is pinned in `.nvmrc` (v22.12.0, also hardcoded in the CI setup action).
- Electron 35, Vite 5, TypeScript ~4.5, Vue 3, Vuetify 3.

## Scripts (`package.json`)

| Script | Purpose |
|--------|---------|
| `yarn start` | `electron-forge start` — runs the app with Vite dev servers + hot reload |
| `yarn package` | Packages the app into a platform bundle (no installers) |
| `yarn make` | Builds distributable installers/archives for the current platform |
| `yarn lint` | ESLint over `.ts`/`.tsx` files |
| `yarn test` | Vitest |

There is no separate `build`/`typecheck` script — type checking happens as part of the Vite
builds driven by Forge.

## Electron Forge (`forge.config.ts`)

- **packagerConfig**: `name: 'evitaLab'`, `executableName: 'evitalab'`, `asar: true`, developer-
  tools app category, icons from `assets/icon/` (`.icns`/`.ico`/`.png` per platform). The app is
  currently **unsigned** (no `osxSign`/`osxNotarize`) — hence the macOS quarantine workaround in
  the README and disabled macOS auto-update.
- **Makers**: Squirrel (Windows, with `assets/installer/installing.gif`), DMG + ZIP (macOS),
  deb + rpm + AppImage (Linux, `@reforged/maker-appimage`).
- **Vite plugin** builds three targets — `src/main/main.ts` (via `vite.main.config.ts`) and the
  two preloads `src/preload/renderer/preload.ts` + `src/preload/driver/preload.ts`
  (via `vite.preload.config.ts`) — plus one renderer (`main_window`, via
  `vite.renderer.config.ts`).
- **Fuses plugin** hardens the binary: `RunAsNode` off, cookie encryption on, `NODE_OPTIONS` and
  node CLI inspect arguments off, ASAR integrity validation on, only-load-from-ASAR on.
- **No Forge publishers** — releases are published by GitHub Actions (below), and Windows
  auto-update is served by `update.electronjs.org` from GitHub releases.

## Vite configuration

| File | Contents |
|------|----------|
| `vite.main.config.ts` | Empty — Forge defaults for the main bundle |
| `vite.preload.config.ts` | Two inputs: `renderer-preload` and `driver-preload` (these output names are referenced by window `webPreferences.preload` paths) |
| `vite.renderer.config.ts` | Vue + Vuetify plugins (`styles.configFile: src/renderer/styles/settings.scss`), `@` alias → `src/`, and **one Rollup HTML input per window**: `skeleton`, `navigationPanel`, `notificationPanel`, `connectionEditor`, `connectionRemoveDialog` — new windows must be added here |

Forge injects globals used by the main process: `MAIN_WINDOW_VITE_DEV_SERVER_URL` and
`MAIN_WINDOW_VITE_NAME` (dev vs. packaged view loading, see
[architecture](architecture.md#dev-vs-production-loading)).

## Environment variables

`.env` defines `VITE_BUILD_VERSION=$EVITALAB_DESKTOP_BUILD_VERSION` — the displayed app version
comes from the `EVITALAB_DESKTOP_BUILD_VERSION` OS env var, which CI sets to the released
version during `yarn make`. In dev it is empty; code reading `import.meta.env.VITE_BUILD_VERSION`
must tolerate that.

## Linting

Legacy `.eslintrc.json`: `@typescript-eslint` recommended presets + `eslint-plugin-import`
(including `plugin:import/electron`). Scope is `.ts`/`.tsx` only — Vue SFCs are not linted. CI
does **not** run lint; run `yarn lint` before committing.

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/dev.yml` | push to `dev` | Verify: install (`yarn install --frozen-lockfile`) + `yarn test` |
| `.github/workflows/release.yml` | push to `master` | Test → resolve version → build on macOS (arm64 + x64), Windows and Linux → publish GitHub release with all installers |

Details of the release pipeline:

- **Versioning**: `semantic-calendar-version` resolves a calendar-semantic version (`v` prefix)
  from [conventional commits](https://www.conventionalcommits.org/) — a `feat:` commit bumps the
  minor. This is why commit message format is mandatory. Desktop versioning is **independent**
  of evitaLab core versioning.
- Each platform job runs the composite action
  `.github/actions/build-evitalab-desktop-action` — it rewrites `package.json` version, exports
  `EVITALAB_DESKTOP_BUILD_VERSION` and runs `yarn make`.
- The final job assembles a GitHub release via release-drafter
  (`.github/release-drafter.yml` — feature/fix categorization and autolabeling) and uploads all
  artifacts (`.dmg`, mac `.zip`, Squirrel installer, `.deb`, `.rpm`, `.AppImage`).
