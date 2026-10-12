# Testing

evitaLab Desktop uses [Vitest](https://vitest.dev/) for unit tests.

```bash
yarn test        # runs vitest (watch mode locally, single run in CI)
```

There is no `vitest.config.*` — tests run on Vitest defaults and are auto-discovered as
`*.test.ts`.

## Layout & conventions

Tests live in the top-level `test/` directory, mirroring the `src/` structure:

```
test/
├── common/util/connection.test.ts            # computeShortConnectionName
└── main/driver/service/
    ├── DriverManager.test.ts                 # driver version resolution
    └── mock-evitalab-database.csv            # driver metadata DB fixture
```

- File naming: `<Subject>.test.ts`, path mirroring the tested source file.
- Use plain `test`/`expect` imports from `vitest`; test names are human-readable sentences
  (`'Should resolve latest driver for outdated server'`).

## Mocking HTTP

Network access is mocked with [`@fetch-mock/vitest`](https://www.wheresrhys.co.uk/fetch-mock/):
`manageFetchMockGlobally()` at module top, `fetchMock.mockGlobal()` in the test,
`fetchMock.removeRoutes()` in cleanup. `DriverManager.test.ts` is the reference: it mocks the
driver metadata CSV endpoint (with the `mock-evitalab-database.csv` fixture — deliberately
including out-of-order rows to exercise semver ordering) and the evitaDB `ServerStatus` endpoint
per fake server URL.

## What to test

Current coverage focuses on pure and main-process logic that doesn't need a running Electron
shell: utilities, parsers, version-resolution rules. When you add or fix such logic, add a unit
test with it — **every bug fix in such logic should include a regression test**.

Window management, IPC wiring and renderer components are currently verified manually by
running the app (`yarn start`) against a reachable evitaDB server — see
[recipes — verify a change](recipes.md#verify-a-change-in-the-running-app).

## CI

`yarn test` runs in GitHub Actions on every push to `dev` (`.github/workflows/dev.yml`) and as
part of the release build from `master` (`.github/workflows/release.yml`) — see
[build & tooling](build-and-tooling.md#cicd-github-actions). Note that `yarn lint` is **not**
part of CI — run it locally before pushing.
