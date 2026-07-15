# Building from source

To build the production version of evitaLab Desktop, follow the steps below.

Before you start, make sure you have [Node.js](https://nodejs.org/en/) installed in the version
specified in `.nvmrc` and the [Yarn](https://yarnpkg.com/) package manager installed.

```shell
yarn install
yarn make
```

`yarn make` builds distributables for the **current platform** into `out/make/`:

| Platform | Artifacts |
|----------|-----------|
| Windows | Squirrel installer |
| macOS | `.dmg` + `.zip` |
| Linux | `.deb`, `.rpm`, `.AppImage` |

To only produce the packaged (unbundled) app, use `yarn package` (output in `out/`).

The maker set per platform is configured in `forge.config.ts` — see
[build & tooling](build-and-tooling.md#electron-forge-forgeconfigts). Official releases are
built by the CI release workflow, which also injects the release version via
`EVITALAB_DESKTOP_BUILD_VERSION` — a local `yarn make` without it produces a build with an empty
displayed version, which is fine for testing.

Note: builds are currently unsigned; on macOS the resulting app must be taken out of quarantine
(see the README's macOS section).
