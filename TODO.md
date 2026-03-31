# Vue Pick-n-Plop — Development TODO

Agreed-upon roadmap. Completed items are removed; items in progress are marked.

---

## Architecture / Compatibility

- [ ] Export `PNPDragManager` **class** (not just the singleton instance) so consumers can instantiate their own
- [ ] Directives and `PNPDragLayer` should `inject` a manager instead of importing the module-level singleton directly, falling back to the singleton if nothing is provided
- [ ] Document the recommended component library pattern: bundle your own instance, check for an injected manager first — host apps that want full interop `provide` a shared manager

---

## Sorting Overhaul ✅

- [x] Library manages a **placeholder DOM element**: on sort-drag start, measure the dragged element's rect, insert a placeholder at the original position, move the placeholder as the user drags past midpoints, remove on drop
- [x] App data is never mutated during the drag — `onSortHover` becomes optional; the critical event is `onSortDrop(dragCtx, dropCtx, fromIndex, toIndex, groupCtx, modifiers)`
- [x] **Midpoint threshold**: only trigger a position swap when the cursor crosses the vertical (or horizontal) midpoint of the hovered sibling — eliminates oscillation
- [x] **rAF throttle**: gate `_handleSortHover` through `requestAnimationFrame` so sort evaluation is capped to one per frame
- [x] **Placeholder style option**: `placeholder: 'space'` (default invisible ghost) | `'line'` (thin insertion indicator)
- [x] **`orientation` option**: `'vertical'` (default) | `'horizontal'`; controls midpoint axis and line direction
- [ ] Placeholder `'clone'` and `'component'` styles (deferred)

---

## Manager Constructor & Runtime Config ✅

- [x] Accept options object in `PNPDragManager` constructor: `{ cancelKey, rightClickCancel, useTouch }`
- [x] Add `manager.setOptions(partial)` for runtime changes — recreates DragHelper if `useTouch` changes

---

## Touch Support ✅

- [x] `useTouch` constructor/setOptions option — recreates GDragHelper with `{ usePointerEvents: true }` when enabled
- [x] `pointerdown` listener added alongside `mousedown` in `v-pnp-draggable`; each checks `manager._config.useTouch` at runtime so no re-registration needed when the option changes

---

## Cancel Mechanics ✅

- [x] On drag start, add a `window` `keydown` listener for `cancelKey`; on fire, call `cancelDrag()`
- [x] On drag start, if `rightClickCancel` is true, add a `window` `mousedown` listener for button 2 with the same cancel behavior
- [x] Both listeners added only while a drag is active and removed immediately on drag end
- [x] `cancelDrag()` public method on manager

---

## Modifier Key Tracking ✅

- [x] Capture `{ shiftKey, ctrlKey, altKey, metaKey }` from the `mousedown` event into `activeDrag.modifiers` at drag start
- [x] Add `window.addEventListener('blur', ...)` to clear `activeDrag.modifiers` to `{}` when window loses focus — prevents desync from missed `keyup` events
- [x] Pass `modifiers` as a parameter to `onDragStart` and `onDropped` callbacks

---

## Multi-Select / Group Drag ✅

- [x] Add `groupCtx` option to `v-pnp-draggable`: an array of ctx objects representing the full selection (including the primary dragged item). Optional — `null` means single-item drag.
- [x] Store `groupCtx` in `activeDrag`
- [x] Pass `groupCtx` as the third parameter to `onDropped` callbacks: `onDropped(dragCtx, dropCtx, groupCtx, modifiers)`
- [x] When `dragItem` is `'component'`, pass `groupCtx` to the drag component as a prop alongside `ctx`
- [x] Add `showGroupCount` option (default `false`): when `true` and `groupCtx` has more than one item, overlay a `+N` badge on the clone-mode drag ghost

---

## Validation Flags Cleanup ✅

- [x] Rename `callDragValidateFunctionOnStart` → `validateOnStart` (draggable option)
- [x] Rename `callDropValidateFunctionsOnStart` → `validateOnStart` (dropzone option)
- [ ] Update docs: validation functions are intentionally off by default (keys are the entry-level mechanism); `validateOnStart: true` is the opt-in for apps with more complex per-item logic

---

## Documentation & Demo

- [ ] Document `|` pipe as the canonical key separator (not comma)
- [ ] Update demo app to exercise remaining new features as they land
