# Drivers & instances

The desktop app does not talk to evitaDB itself. For every connection it embeds a **driver** —
a build of the [evitaLab core](https://github.com/FgForrest/evitalab) compiled in its `DRIVER`
run mode — inside a `WebContentsView`. This page covers how drivers are resolved, downloaded and
run. Driver-mode specifics on the evitaLab core side are documented in the
[evitaLab core developer documentation](https://github.com/FgForrest/evitalab/blob/dev/documentation/developer/architecture.md).

## Why drivers

Each evitaDB server version may require a different evitaLab core version. The desktop app picks
and downloads the right evitaLab build **per connection**, so one app can talk to any number of
server versions simultaneously, and evitaLab core updates arrive without waiting for a server
update.

## Driver model

`src/main/driver/model/Driver.ts` — `Driver { version, minServerVersion }` with computed paths:

| Getter | Value |
|--------|-------|
| `sourceUrl` | `https://github.com/FgForrest/evitalab/releases/download/v<version>/Dist.Driver.zip` |
| `path` | `<userData>/drivers/<version>` |
| `executablePath` | `<path>/dist-driver/index.html` |

## Driver metadata database

`DriverManager` (`src/main/driver/service/DriverManager.ts`) learns which driver versions exist
and which server versions they support from a CSV maintained in the
[evitalab-metadata-database](https://github.com/FgForrest/evitalab-metadata-database) repository:

```
https://raw.githubusercontent.com/FgForrest/evitalab-metadata-database/refs/heads/main/evitalab-database.csv
```

Format: header `evitalab-version,min-evitadb-version`, one row per released driver. The CSV is
fetched with `ky` and cached in memory with a **15-minute TTL**. From it the manager builds two
indexes: `driverIndex: Map<version, Driver>` and `driversForServerDatabase` — driver lists
grouped by `minServerVersion`, sorted newest-server-first.

## Version resolution

`resolveLatestAvailableDriver(serverUrl)`:

1. Resolves the server version by POSTing to
   `<serverUrl>/io.evitadb.externalApi.grpc.generated.EvitaManagementService/ServerStatus`
   (gRPC-web/JSON) and reading `.version`.
2. Normalizes it for semver: strips `-SNAPSHOT`, pads short calendar versions
   (`2025.1` → `2025.1.0`).
3. Walks `driversForServerDatabase` newest-first; the first group whose `minServerVersion`
   satisfies `semver.gte(serverVersion, minServerVersion)` wins, taking the newest driver of the
   group. If nothing matches (server older than anything known), it falls back to the **oldest**
   known driver with a warning.

This logic is covered by `test/main/driver/service/DriverManager.test.ts` against the fixture
`mock-evitalab-database.csv` (see [testing](testing.md)).

## Download & cache

`downloadDriver(version)` short-circuits when `<userData>/drivers/<version>` already exists.
Otherwise it downloads `Dist.Driver.zip` from the evitaLab GitHub release into a temp directory,
`decompress`es it and atomically renames the directory into place. Drivers are immutable once
downloaded; there is no eviction.

The connection editor always calls `downloadDriver(...)` before storing a connection, so a
connection's driver is guaranteed to be on disk before its instance starts.

## Instances

`InstanceManager` (`src/main/instance/service/InstanceManager.ts`) keeps one
`WebContentsView` per connection (`Map<ConnectionId, WebContentsView>`), created lazily on first
activation and kept alive when the user switches away (tabs and state inside the driver
survive). Reactions are wired in `initializer.ts`:

- connection **activated** → `activateInstance(connection)` — init if needed, then show
  (hiding the previous one);
- connection **changed** (edited) → `restartInstance(connection)` — destroy and re-create, since
  the URL/driver version may have changed.

The instance view loads `driver.executablePath` with `driver-preload.js` (which exposes only the
notification producer API — see [IPC](ipc.md#notification)) and passes configuration to the
evitaLab core via URL query parameters built by `constructDriverInstanceQuery(...)`
(`src/main/instance/model/DriverInstanceQuery.ts`):

| Query param | Value |
|-------------|-------|
| `evitalab` | `'true'` — driver mode marker, the only raw (non-encoded) parameter |
| `evitalab-server-name` | `btoa('desktop-<connectionId>')` — namespaces the driver's local storage, so every connection keeps its own tabs and history |
| `evitalab-pconnections` | `btoa(JSON.stringify([PreconfiguredDriverConnection]))` — the single connection (name + server URL) the driver should use |
| `evitalab-readonly` | `btoa('true')` — the user must not edit connections from inside the driver |

**Every `evitalab-*` parameter must be base64-encoded.** The evitaLab core decodes all of them
from base64 (since core 2026.4 strictly — a non-base64 value aborts the driver bootstrap and the
instance stays on the static loading screen), mirroring how the evitaDB server embeds evitaLab.
The contract is guarded by `test/main/instance/model/DriverInstanceQuery.test.ts`.

`PreconfiguredDriverConnection` lives in `src/main/instance/model/PreconfiguredDriverConnection.ts`.

## Driver updates

When a connection is activated, `ConnectionManager.checkForDriverUpdate(...)` asks
`DriverManager` for the latest driver applicable to that server and emits
`CONNECTION_MANAGER_EMIT_DRIVER_UPDATE_AVAILABLE` when `semver.gt(latest, current)`. The UI
shows an update chip/badge (connection list, rail avatars); the user applies the update in the
connection editor (`DriverSelect` component), which stores the new `driverVersion` — the
resulting connection-change event restarts the instance with the new driver. A failed update
check is not an error — the server may simply be unreachable at that moment.
