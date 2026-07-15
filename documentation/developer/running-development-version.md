# Running development version

To develop evitaLab Desktop, you need to know how to run it in the development environment.

Before you start, make sure you have [Node.js](https://nodejs.org/en/) installed in the version
specified in `.nvmrc` and the [Yarn](https://yarnpkg.com/) package manager installed.

```shell
yarn install
yarn start
```

`yarn start` runs [Electron Forge](https://www.electronforge.io/) with the Vite plugin: the main
process and preloads are rebuilt on change, renderer windows are served from a Vite dev server
with hot reload.

Notes for development runs:

- **Network access is needed on first use of a connection** — the driver metadata database and
  the driver itself are downloaded at runtime
  (see [drivers & instances](drivers-and-instances.md)).
- **You need a reachable evitaDB server** to create a connection. The public demo server
  `https://demo.evitadb.io` is the easiest target for UI verification; any local evitaDB
  (2025.1+) works too.
- App data written during development lives in Electron's `userData` directory (connections in
  `config.json`, drivers in `drivers/`) — see
  [main process — persistence](main-process.md#appconfig--persistence).
- Main-process logs go to the terminal and the electron-log file; each window has its own
  DevTools console (renderer logs are also bridged into electron-log).
- The auto-updater is disabled in dev.

To build the production version, check out [building from source](building-from-source.md).
