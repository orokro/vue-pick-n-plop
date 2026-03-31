# Vue Pick-n-Plop — Development TODO

Agreed-upon roadmap based on design review. Grouped by concern.

---

## Architecture / Compatibility

- [ ] Export `PNPDragManager` **class** (not just the singleton instance) so consumers can instantiate their own
- [ ] Directives and `PNPDragLayer` should `inject` a manager instead of importing the module-level singleton directly, falling back to the singleton if nothing is provided
- [ ] Document the recommended component library pattern: bundle your own instance, check for an injected manager first — host apps that want full interop `provide` a shared manager

---

## Bug Fixes

- [ ] **`updated` hook on `v-pnp-draggable`**: store options on `el._pnpOptions` in `mounted` and `updated`; mousedown handler reads from `el._pnpOptions` so reactive option changes actually take effect
- [ ] **`hasDragLayer` multi-instance**: change from a boolean `ref` to a counter `ref`; `registerDropLayer` increments, `unregisterDropLayer` decrements, guard checks `> 0` — multiple `<PNPDragLayer>` components no longer clobber each other
- [ ] **Stale DOM refs after drop**: clear `el`, `originalParent`, `originalNextSibling` on `activeDrag` at the end of `_onDragEnd`
- [ ] **`self` mode restore**: guard `insertBefore`/`appendChild` with `document.contains(originalParent)` so it no-ops gracefully if the parent was reactively removed during the drag
- [ ] **Verify `PNPDragLayer`** has `pointer-events: none` on its contents so `document.elementFromPoint` punches through the drag ghost correctly (critical for sort hover detection)

---

## Sorting Overhaul

The current approach mutates app data reactively during drag, which causes oscillation. The new approach has the library own the placeholder.

- [ ] Library manages a **placeholder DOM element**: on sort-drag start, measure the dragged element's rect, insert a placeholder at the original position, move the placeholder as the user drags past midpoints, remove on drop
- [ ] App data is never mutated during the drag — `onSortHover` becomes optional; the critical event is `onSortDrop` (or fold a `toIndex` param into the existing `onDropped`)
- [ ] **Midpoint threshold**: only trigger a position swap when the cursor crosses the vertical (or horizontal) midpoint of the hovered sibling — eliminates oscillation
- [ ] **rAF throttle**: gate `_handleSortHover` through `requestAnimationFrame` so sort evaluation is capped to one per frame
- [ ] **Placeholder style option** on the dropzone — `placeholder: 'space' | 'line' | 'clone' | 'component'`:
  - `space` (default): invisible div sized to the dragged element's bounding rect — layout-agnostic
  - `line`: thin insertion indicator line; direction determined by `orientation`
  - `clone`: semi-transparent DOM clone of the dragged element inserted at the placeholder position
  - `component`: custom Vue component mounted as the placeholder; receives `dragCtx` as prop
- [ ] **`orientation` option** on sortable dropzone: `'vertical'` (default) | `'horizontal'` | `'grid'`; used by `line` placeholder to know which axis to draw on. In `grid` orientation, `line` falls back to `space`.

---

## Manager Constructor & Runtime Config

- [ ] Accept options object in `PNPDragManager` constructor: `{ useTouch, cancelKey, rightClickCancel }`
  - `useTouch: false` — enable pointer event mode for touch/stylus support
  - `cancelKey: 'Escape'` — key that cancels an in-progress drag (`null` to disable)
  - `rightClickCancel: true` — right-click during drag cancels it
- [ ] Add `manager.setOptions(partial)` for runtime changes; runs necessary side effects (e.g. reconstructs `GDragHelper` with `usePointerEvents: true` when `useTouch` is toggled)

---

## Touch Support

- [ ] When `useTouch` is enabled, instantiate `GDragHelper` with `{ usePointerEvents: true }` — pointer events natively unify mouse, touch, and stylus; `pageX/pageY` works correctly on all
- [ ] Add `pointerdown` listener to `v-pnp-draggable` alongside `mousedown` when touch is enabled (or replace `mousedown` with `pointerdown` in pointer-events mode)

---

## Cancel Mechanics

- [ ] On drag start, add a `window` `keydown` listener for `cancelKey`; on fire, call `dragHelper.dragStop()` and reset drag state
- [ ] On drag start, if `rightClickCancel` is true, add a `window` `mousedown` listener for button 2 (right click) with the same cancel behavior
- [ ] Both listeners are added only while a drag is active and removed immediately on drag end — zero cost at rest

---

## Modifier Key Tracking

- [ ] Capture `{ shiftKey, ctrlKey, altKey, metaKey }` from the `mousedown` event into `activeDrag.modifiers` at drag start
- [ ] Update `activeDrag.modifiers` on each `mousemove` event (modifier state is on every mouse event)
- [ ] Add `window.addEventListener('blur', ...)` to clear `activeDrag.modifiers` to `{}` when window loses focus — prevents desync from missed `keyup` events
- [ ] Pass `modifiers` as a parameter to `onDragStart` and `onDropped` callbacks

---

## Drag Handles — `v-pnp-draghandle`

- [ ] New `v-pnp-draghandle` directive: on `mounted`, walk up the DOM to the nearest ancestor with `data-pnp-draggable`; add self to that element's `el._pnpHandles` Set. On `unmounted`, remove self from the Set.
- [ ] Only binds to the **nearest** `data-pnp-draggable` ancestor — stops at the first one found, so nested draggables don't accidentally claim child handles
- [ ] Add `requireHandle` option to `v-pnp-draggable` (default `false`): when `true`, the `mousedown` handler only calls `startDrag` if `event.target` is inside one of the element's registered handles. If the Set is empty and `requireHandle: true`, drag never starts.
- [ ] Register `v-pnp-draghandle` directive in the plugin `install` and in named exports from `index.js`

---

## Multi-Select / Group Drag

- [ ] Add `groupCtx` option to `v-pnp-draggable`: an array of ctx objects representing the full selection (including the primary dragged item). Optional — `null` means single-item drag.
- [ ] Store `groupCtx` in `activeDrag`
- [ ] Pass `groupCtx` as the third parameter to `onDropped` callbacks: `onDropped(dragCtx, dropCtx, groupCtx)`
- [ ] When `dragItem` is `'component'`, pass `groupCtx` to the drag component as a prop alongside `ctx`
- [ ] Add `showGroupCount` option (default `false`): when `true` and `groupCtx` has more than one item, overlay a `+N` badge on the clone-mode drag ghost — a lightweight multi-select indicator without needing a custom component

**Conventions:**
- `groupCtx` should be the **full selection array** (including the primary item); `dragCtx` identifies which one was physically grabbed
- Key validation uses only the primary item's keys — app logic in `onDropped` handles any per-item filtering
- `self` mode with `groupCtx`: only the primary element moves; app removes the rest in `onDropped`

---

## Validation Flags Cleanup

- [ ] Rename `callDragValidateFunctionOnStart` → `validateOnStart` (draggable option)
- [ ] Rename `callDropValidateFunctionsOnStart` → `validateOnStart` (dropzone option)
- [ ] Update docs: validation functions are intentionally off by default (keys are the entry-level mechanism); `validateOnStart: true` is the opt-in for apps with more complex per-item logic

---

## Documentation & Demo

- [ ] Document `|` pipe as the canonical key separator (not comma)
- [ ] Update demo app to exercise new features:
  - Drag handle (`requireHandle: true` + `v-pnp-draghandle` on a grip icon)
  - Multi-select with `groupCtx` and a stack ghost component
  - Sortable list with new placeholder options
  - Constructor options (`cancelKey`, `rightClickCancel`)
  - Modifier keys passed through to callbacks
