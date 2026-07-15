# UI components

evitaLab Desktop uses [Vuetify](https://vuetifyjs.com/) with a dark-only custom theme and
opinionated defaults, deliberately kept **as close as possible to the evitaLab core UI stack**
(see [evitaLab core UI components](https://github.com/FgForrest/evitalab/blob/dev/documentation/developer/ui-components.md))
so both apps feel like one product. Always prefer an existing custom component over a raw
Vuetify equivalent when one exists for the use case.

Custom shared components live in `src/renderer/common/component/` (prefixed `V*`, plus
`ModalWindow`). Feature components live inside their feature directory
(see [renderer windows](renderer.md#feature-areas)).

## Theming

Configured in `src/renderer/vue-plugins/vuetify.ts` — single dark theme with the evitaLab
palette: `background`/`surface`/`primary` (`#1f1f33`), `primary-dark` (`#131323`),
`primary-light` (`#23355C`), `primary-lightest` (`#21BFE3` — the accent), `gray-light`
(`#A5ACBC`), `warning` (`#f7a729`), `error` (`#E13321`). Component defaults are set globally
(compact density, `solo-filled` inputs, outlined buttons, no ripple, tooltip styling) — don't
repeat them per component. Labs components `VDateInput`, `VTimePicker`, `VPicker` are
registered.

Global SCSS lives in `src/renderer/styles/`:

| File | Contents |
|------|----------|
| `settings.scss` | Vuetify SASS overrides (overlay opacity/scrim), Poppins as the global font, solo-filled field styling, toastification toast variants, overlay blur; entry point wired via `vite-plugin-vuetify` (`styles.configFile`) |
| `colors.scss` | SCSS color variables mirroring the theme palette (import via `@use` in component styles) |
| `btn.scss` | Button overrides — no text-transform, pill radius, `tonal`/`outlined`/`primary` variants |
| `chip.scss` | Chip variant styling |
| `md-content.scss` | Markdown output styling for `VMarkdown` (`.md-content`) |

Icons are [Material Design Icons](https://pictogrammers.com/library/mdi/) (`mdi-*` strings,
`@mdi/font`). Keep a feature's icon consistent across menus, buttons and dialogs.

## Dialogs

| Component | Use for |
|-----------|---------|
| `VLabDialog` | Every plain dialog. Props: `modelValue`, `maxWidth?` (default `36rem`), `persistent?`, `scrollable?`; slots: `activator`, `title`, `title-actions`, default (body), `alternative-action-button`, `reject-button`, `confirm-button` |
| `VFormDialog` | Dialogs containing a form. Built-in Vuetify form + validation handling, submit/loading state, reset support. Key props: `modelValue`, `changed` (enables confirm), `dangerous?` (red confirm), `confirmButtonIcon?`, `confirm: () => Promise<boolean>` (return `false` to keep open), `reset?`; slots: `activator`, `title`, `prepend-form`, default (fields), `append-form`, `confirm-button-body`. Exposes `validateForm()` |
| `VConfirmDialog` | Secondary "are you sure" prompt — usually not used directly, it is driven by `VConfirmDialogButton` |
| `VConfirmDialogButton` | Confirm action button; with `dangerous` (boolean or `DangerousConfirmType`) it is error-colored and first opens a `VConfirmDialog` |
| `VRejectDialogButton` | Standardized cancel/reject button |

Convention: the dialog owns its open state via `modelValue`, performs its action in `confirm`
returning `true`/`false` for success, and reports errors via the `Toaster`. In modal windows the
dialog closes the whole modal window on cancel/success
(see [renderer — modal window pattern](renderer.md#the-modal-window-pattern)).

`DangerousConfirmType` lives in `src/renderer/common/model/dialog/DangerousConfirmType.ts`.

## Other shared components

| Component | Use for |
|-----------|---------|
| `ModalWindow` | Root wrapper of every modal window entry — transparent `VApp` |
| `VCardTitleWithActions` | Card title row with a right-aligned `#actions` slot |
| `VColorSelect` | Color picker field (readonly text field + swatch, opens `VColorPicker` in a menu) — used for connection styling |
| `VMarkdown` | Markdown rendering (`source` prop; markdown-it + emoji, styled by `md-content.scss`) |

Feature-specific building blocks worth knowing: `ConnectionAvatar`
(`src/renderer/skeleton/component/ConnectionAvatar.vue` — colored initials avatar of a
connection) and `DriverSelect` (`src/renderer/driver/component/DriverSelect.vue` — driver
version picker with update detection).

## Toast notifications

Inject the `Toaster` — never use vue-toastification directly (toasts render in a separate
always-on-top window, see [main process — notification system](main-process.md#notification-system)):

```ts
import { Toaster, useToaster } from '../notification/service/Toaster'

const toaster: Toaster = useToaster()
await toaster.success(t('...'))
await toaster.error(t('...'), e)
```

## Writing a new shared component

1. Only place a component in `src/renderer/common/component/` when it is (or will be) used by
   multiple windows/features; otherwise keep it in the owning feature directory.
2. Prefix shared components with `V`, follow Vuetify prop naming (`modelValue`, `density`, …).
3. Check the [evitaLab core component catalog](https://github.com/FgForrest/evitalab/blob/dev/documentation/developer/ui-components.md)
   first — if an equivalent exists there, mirror its API so the two codebases stay consistent.
4. Document the component with a JSDoc block in the SFC and add it to this catalog.
