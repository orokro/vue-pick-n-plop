import { ref, shallowRef, reactive } from 'vue';
import DragHelper from 'gdraghelper';

class EventBus {
    constructor() {
        this.listeners = new Set();
    }
    on(fn) {
        this.listeners.add(fn);
    }
    off(fn) {
        this.listeners.delete(fn);
    }
    emit(...args) {
        this.listeners.forEach(fn => fn(...args));
    }
}

class PNPDragManager {

    /**
     * @param {Object} [options]
     * @param {string|null} [options.cancelKey='Escape'] - Key that cancels an active drag. null to disable.
     * @param {boolean} [options.rightClickCancel=true] - Right-click during drag cancels it.
     * @param {boolean} [options.useTouch=false] - Enable pointer events mode for touch/stylus support.
     */
    constructor(options = {}) {
        this.isDragging = ref(false);
        this.dragZones = shallowRef([]);
        this.onStartEventBus = new EventBus();
        this.onDroppedEventBus = new EventBus();

        // Runtime configuration with sensible defaults.
        this._config = {
            cancelKey: 'Escape',
            rightClickCancel: true,
            useTouch: false,
            ...options,
        };

        // Always use pointer events — they handle mouse, touch, and stylus uniformly.
        // Pointer events are a strict superset of mouse events, so this works for
        // all users regardless of whether they enable useTouch.
        this.dragHelper = new DragHelper({ usePointerEvents: true });

        // Refs for cancel listeners — attached on drag start, removed on drag end.
        this._cancelKeyHandler = null;
        this._rightClickHandler = null;

        // Sort state — managed across the drag lifecycle.
        this._sortRafPending = false;
        this._sortOriginalDisplay = '';

        // Current drag state
        this.activeDrag = reactive({
            el: null,
            originalParent: null,
            originalNextSibling: null,
            keys: [],
            ctx: {},
            /** Full selection array when multi-select is active; null for single-item drag. */
            groupCtx: null,
            options: {},
            startMouse: { x: 0, y: 0 },
            currentMouse: { x: 0, y: 0 },
            delta: { x: 0, y: 0 },
            initialRect: null,
            currentDropZone: null,
            validDropZones: [],
            /** Modifier key state captured at drag start; cleared on window blur. */
            modifiers: {},
            /** Placeholder DOM element inserted by the library during a sort drag. */
            sortPlaceholder: null,
            /** Zone id where the sort drag originated. */
            sortOriginZoneId: null,
            /** Index of the dragged item among sortable siblings at drag start. */
            sortFromIndex: -1,
        });

        // Counter rather than boolean so multiple PNPDragLayer instances
        // can mount/unmount independently without clobbering each other.
        this.hasDragLayer = ref(0);
        this.hoveredZoneId = ref(null);

        // Clear modifier state if the window loses focus mid-drag to prevent
        // desync from missed keyup events (e.g. alt-tab while holding Alt).
        this._blurHandler = () => { this.activeDrag.modifiers = {}; };
        window.addEventListener('blur', this._blurHandler);
    }

    registerDropLayer() {
        this.hasDragLayer.value++;
    }

    unregisterDropLayer() {
        this.hasDragLayer.value = Math.max(0, this.hasDragLayer.value - 1);
    }

    registerDropZone(zone) {
        this.dragZones.value = [...this.dragZones.value, zone];
    }

    unregisterDropZone(id) {
        this.dragZones.value = this.dragZones.value.filter(z => z.id !== id);
    }

    /**
     * Merges partial options into the manager's runtime config.
     * Takes effect on the next drag — does not affect any drag currently in progress.
     *
     * @param {Partial<{ cancelKey: string|null, rightClickCancel: boolean, useTouch: boolean }>} opts
     */
    setOptions(opts) {
        if (!opts) return;
        Object.assign(this._config, opts);
    }

    /**
     * @param {HTMLElement} el
     * @param {Object} options
     * @param {MouseEvent|PointerEvent} [event]
     */
    startDrag(el, options, event) {
        if (this.hasDragLayer.value < 1) {
            console.warn('[PNP] No <PNPDragLayer /> mounted. Dragging disabled.');
            return;
        }

        // Re-entrancy guard: prevents a second event (e.g. synthesised mousedown
        // after a touch pointerdown) from restarting a drag that just began.
        if (this.isDragging.value) return;

        const keys = typeof options.keys === 'string' ? options.keys.split('|') : (options.keys || []);
        const rect = el.getBoundingClientRect();
        const mouse = this.dragHelper.getCursorPos();

        Object.assign(this.activeDrag, {
            el,
            originalParent: el.parentElement,
            originalNextSibling: el.nextSibling,
            keys,
            ctx: options.ctx || {},
            groupCtx: options.groupCtx || null,
            options,
            startMouse: { ...mouse },
            currentMouse: { ...mouse },
            delta: { x: 0, y: 0 },
            initialRect: rect,
            currentDropZone: null,
            validDropZones: [],
            sortPlaceholder: null,
            sortOriginZoneId: null,
            sortFromIndex: -1,
        });

        // Capture modifier key state from the initiating mouse/pointer event.
        this.activeDrag.modifiers = event ? {
            shiftKey: !!event.shiftKey,
            ctrlKey:  !!event.ctrlKey,
            altKey:   !!event.altKey,
            metaKey:  !!event.metaKey,
        } : {};

        this._updateValidDropZones();

        // Handle 'self' mode: move element to drag layer container
        if (options.dragItem === 'self') {
            const container = document.querySelector('.pnp-drag-item-self-container');
            if (container) {
                container.appendChild(el);
            }
        }

        // Initialize sort placeholder if dragging from within a sortable zone.
        const originSortZone = this.dragZones.value.find(
            z => z.sortable && z.el && z.el.contains(el)
        );
        if (originSortZone) {
            this._initSort(el, originSortZone);
        }

        this.isDragging.value = true;
        document.body.style.userSelect = 'none';

        this._attachCancelListeners();

        this.onStartEventBus.emit(this.activeDrag.ctx, this.activeDrag.groupCtx, this.activeDrag.modifiers);

        if (options.onDragStart) {
            options.onDragStart(this.activeDrag.ctx, this.activeDrag.groupCtx, this.activeDrag.modifiers);
        }

        this.dragHelper.dragStart(
            (dx, dy) => this._onDragMove(dx, dy),
            (dx, dy) => this._onDragEnd(dx, dy)
        );
    }

    /**
     * Cancels the current drag without firing a successful drop.
     * Clears the current drop zone so success resolves to false in _onDragEnd.
     */
    cancelDrag() {
        if (!this.isDragging.value) return;
        this.activeDrag.currentDropZone = null;
        this.dragHelper.dragStop();
    }

    _onDragMove(dx, dy) {
        const actualDx = -dx;
        const actualDy = -dy;

        this.activeDrag.delta.x = actualDx;
        this.activeDrag.delta.y = actualDy;
        this.activeDrag.currentMouse.x = this.activeDrag.startMouse.x + actualDx;
        this.activeDrag.currentMouse.y = this.activeDrag.startMouse.y + actualDy;

        this._findDropZoneUnderMouse();
    }

    _onDragEnd(dx, dy) {
        // Remove cancel listeners first — they're only valid during a drag.
        this._removeCancelListeners();

        const success = !!this.activeDrag.currentDropZone;
        const dragCtx = this.activeDrag.ctx;
        const dropCtx = this.activeDrag.currentDropZone?.ctx || null;
        const groupCtx = this.activeDrag.groupCtx;
        const modifiers = { ...this.activeDrag.modifiers };
        const dropZone = this.activeDrag.currentDropZone;

        // Clean up sort placeholder before firing callbacks so the app's onSortDrop
        // receives the correct toIndex, and the placeholder is gone before Vue re-renders.
        const draggedEl = this.activeDrag.el;
        this._cleanupSort(success, dropZone, dragCtx, dropCtx, groupCtx, modifiers, draggedEl);

        // Callbacks: (success, dragCtx, dropCtx, groupCtx, modifiers) for draggable side;
        //            (dragCtx, dropCtx, groupCtx, modifiers) for dropzone side.
        if (this.activeDrag.options.onDropped) {
            this.activeDrag.options.onDropped(success, dragCtx, dropCtx, groupCtx, modifiers);
        }

        if (success && dropZone.onDropped) {
            dropZone.onDropped(dragCtx, dropCtx, groupCtx, modifiers);
        }

        this.onDroppedEventBus.emit({ success, dragCtx, dropCtx, groupCtx, modifiers });

        // Restore 'self' element to its original position.
        // Guard with document.contains in case the parent was reactively removed during the drag.
        if (this.activeDrag.options.dragItem === 'self' && this.activeDrag.el) {
            const { el, originalParent, originalNextSibling } = this.activeDrag;
            if (originalParent && document.contains(originalParent)) {
                if (originalNextSibling) {
                    originalParent.insertBefore(el, originalNextSibling);
                } else {
                    originalParent.appendChild(el);
                }
            }
        }

        // Reset state
        this.isDragging.value = false;
        document.body.style.userSelect = '';
        this.activeDrag.currentDropZone = null;
        this.hoveredZoneId.value = null;

        // Clear stale DOM references so they can be garbage collected.
        this.activeDrag.el = null;
        this.activeDrag.originalParent = null;
        this.activeDrag.originalNextSibling = null;
    }

    // ─── Sort ──────────────────────────────────────────────────────────────────

    /**
     * Sets up the sort placeholder when a drag begins from inside a sortable zone.
     * The placeholder visually takes the dragged item's place; the item is hidden.
     *
     * @param {HTMLElement} el - The dragged element.
     * @param {Object} zone - The registered drop zone the drag originated from.
     */
    _initSort(el, zone) {
        // Capture fromIndex before any DOM changes.
        const siblings = this._getSortSiblings(zone, el);
        const fromIndex = siblings.indexOf(el);

        const rect = el.getBoundingClientRect();
        const placeholder = document.createElement('div');
        placeholder.setAttribute('data-pnp-placeholder', 'true');
        placeholder.style.boxSizing = 'border-box';
        placeholder.style.pointerEvents = 'none';
        placeholder.style.flexShrink = '0';

        const styleMode = zone.placeholder || 'space';
        const isHorizontal = zone.orientation === 'horizontal';

        if (styleMode === 'line') {
            if (isHorizontal) {
                placeholder.style.width = '3px';
                placeholder.style.height = rect.height + 'px';
                placeholder.style.margin = '0 2px';
            } else {
                placeholder.style.width = '100%';
                placeholder.style.height = '3px';
                placeholder.style.margin = '2px 0';
            }
            placeholder.style.background = '#4a90d9';
            placeholder.style.borderRadius = '2px';
        } else {
            // 'space' (default): invisible ghost sized to the dragged element
            placeholder.style.width = rect.width + 'px';
            placeholder.style.height = rect.height + 'px';
            placeholder.style.opacity = '0';
        }

        // Insert placeholder at el's position, then hide el.
        el.parentElement.insertBefore(placeholder, el);
        this._sortOriginalDisplay = el.style.display;
        el.style.display = 'none';

        this.activeDrag.sortPlaceholder = placeholder;
        this.activeDrag.sortOriginZoneId = zone.id;
        this.activeDrag.sortFromIndex = fromIndex;
    }

    /**
     * Fires the onSortDrop callback, removes the placeholder, and restores the
     * dragged element's visibility. Called from _onDragEnd before Vue re-renders.
     *
     * @param {boolean} success
     * @param {Object|null} dropZone
     * @param {*} dragCtx
     * @param {*} dropCtx
     * @param {*} groupCtx
     * @param {Object} modifiers
     * @param {HTMLElement|null} draggedEl - Captured reference before activeDrag is cleared.
     */
    _cleanupSort(success, dropZone, dragCtx, dropCtx, groupCtx, modifiers, draggedEl) {
        const placeholder = this.activeDrag.sortPlaceholder;
        if (!placeholder) return;

        if (success && dropZone && dropZone.sortable && dropZone.onSortDrop) {
            const toIndex = this._getPlaceholderIndex(dropZone, placeholder);
            const fromIndex = this.activeDrag.sortFromIndex;
            dropZone.onSortDrop(dragCtx, dropCtx, fromIndex, toIndex, groupCtx, modifiers);
        }

        placeholder.remove();
        this.activeDrag.sortPlaceholder = null;

        // Defer restoring visibility one rAF so Vue has flushed its re-render first,
        // preventing a flash of the element at its original DOM position.
        const origDisplay = this._sortOriginalDisplay;
        if (draggedEl) {
            requestAnimationFrame(() => {
                draggedEl.style.display = origDisplay || '';
            });
        }
    }

    /**
     * Returns the 0-based index of the placeholder among the dropzone's draggable
     * children (excluding the hidden original element).
     *
     * @param {Object} zone
     * @param {HTMLElement} placeholder
     * @returns {number}
     */
    _getPlaceholderIndex(zone, placeholder) {
        const children = Array.from(zone.el.children);
        const draggedEl = this.activeDrag.el;
        let index = 0;
        for (const child of children) {
            if (child === placeholder) break;
            if (child.hasAttribute('data-pnp-draggable') && child !== draggedEl) {
                index++;
            }
        }
        return index;
    }

    /**
     * Returns direct sortable children of the zone that should be considered
     * when computing midpoints, excluding the hidden dragged element and the
     * placeholder (which has no data-pnp-draggable attribute anyway).
     *
     * @param {Object} zone
     * @param {HTMLElement} [explicitDraggedEl] - Optional override for draggedEl
     * @returns {HTMLElement[]}
     */
    _getSortSiblings(zone, explicitDraggedEl) {
        const draggedEl = explicitDraggedEl ?? this.activeDrag.el;
        return Array.from(zone.el.querySelectorAll('[data-pnp-draggable]'))
            .filter(el => {
                if (el === draggedEl) return false;
                // Exclude draggables inside nested sortable sub-zones.
                let parent = el.parentElement;
                while (parent && parent !== zone.el) {
                    if (parent.hasAttribute('data-pnp-dropzone') &&
                        parent.getAttribute('data-pnp-sortable') === 'true') return false;
                    parent = parent.parentElement;
                }
                return true;
            });
    }

    /**
     * Handles sort-hover logic via rAF throttle + midpoint threshold.
     * Called on every drag-move when over a sortable zone.
     *
     * @param {Object} zone
     */
    _handleSortHover(zone) {
        if (this._sortRafPending) return;
        this._sortRafPending = true;
        requestAnimationFrame(() => {
            this._sortRafPending = false;
            this._doSortMove(zone);
        });
    }

    /**
     * Moves the placeholder to the correct insertion point using midpoint threshold.
     * Also handles cross-zone moves (placeholder may come from a different zone).
     *
     * @param {Object} zone
     */
    _doSortMove(zone) {
        if (!this.isDragging.value) return;

        const placeholder = this.activeDrag.sortPlaceholder;
        if (!placeholder) return;

        // Move placeholder into this zone if it isn't here yet (cross-zone drag).
        if (placeholder.parentElement !== zone.el) {
            zone.el.appendChild(placeholder);
        }

        const { x, y } = this.activeDrag.currentMouse;
        const isHorizontal = zone.orientation === 'horizontal';
        const siblings = this._getSortSiblings(zone);

        // Walk siblings in order; insert placeholder before the first one whose
        // midpoint is past the cursor, or append after all if none qualify.
        let insertBefore = null;
        for (const sibling of siblings) {
            const rect = sibling.getBoundingClientRect();
            const mid = isHorizontal
                ? rect.left + rect.width / 2
                : rect.top + rect.height / 2;
            if ((isHorizontal ? x : y) < mid) {
                insertBefore = sibling;
                break;
            }
        }

        if (insertBefore) {
            if (placeholder.nextSibling !== insertBefore) {
                zone.el.insertBefore(placeholder, insertBefore);
            }
        } else {
            if (zone.el.lastChild !== placeholder) {
                zone.el.appendChild(placeholder);
            }
        }
    }

    // ─── Drop zone detection ───────────────────────────────────────────────────

    /**
     * Attaches window-level listeners for cancel mechanics.
     * Both are removed in _removeCancelListeners() when the drag ends.
     */
    _attachCancelListeners() {
        if (this._config.cancelKey) {
            this._cancelKeyHandler = (e) => {
                if (e.key === this._config.cancelKey) {
                    e.preventDefault();
                    this.cancelDrag();
                }
            };
            window.addEventListener('keydown', this._cancelKeyHandler);
        }

        if (this._config.rightClickCancel) {
            this._rightClickHandler = (e) => {
                if (e.button === 2) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.cancelDrag();
                    // contextmenu fires after mouseup — add a one-shot suppressor that
                    // outlives the cancelDrag() → _removeCancelListeners() cleanup.
                    window.addEventListener('contextmenu', (ce) => {
                        ce.preventDefault();
                        ce.stopPropagation();
                    }, { capture: true, once: true });
                }
            };
            window.addEventListener('mousedown', this._rightClickHandler, true);
        }
    }

    /** Removes cancel listeners added by _attachCancelListeners(). */
    _removeCancelListeners() {
        if (this._cancelKeyHandler) {
            window.removeEventListener('keydown', this._cancelKeyHandler);
            this._cancelKeyHandler = null;
        }
        if (this._rightClickHandler) {
            window.removeEventListener('mousedown', this._rightClickHandler, true);
            this._rightClickHandler = null;
        }
    }

    _updateValidDropZones() {
        const dragKeys = this.activeDrag.keys;
        const dragCtx = this.activeDrag.ctx;

        this.activeDrag.validDropZones = this.dragZones.value.filter(zone => {
            let valid = true;
            if (this.activeDrag.options.validateByKeys !== false) {
                const zoneKeys = typeof zone.keys === 'string' ? zone.keys.split('|') : (zone.keys || []);
                const intersection = dragKeys.filter(k => zoneKeys.includes(k));
                valid = intersection.length > 0;
            }

            if (valid && (this.activeDrag.options.validateOnStart || zone.validateOnStart)) {
                if (zone.validate && !zone.validate(dragCtx)) valid = false;
                if (valid && this.activeDrag.options.validate && !this.activeDrag.options.validate(zone.ctx)) valid = false;
            }

            return valid;
        });
    }

    _findDropZoneUnderMouse() {
        const { x, y } = this.activeDrag.currentMouse;

        const elUnderMouse = document.elementFromPoint(x, y);
        if (!elUnderMouse) {
            this._updateHoverState(null);
            return;
        }

        let currentEl = elUnderMouse;
        let foundZone = null;

        while (currentEl && currentEl !== document.body) {
            const zone = this.dragZones.value.find(z => z.el === currentEl);
            if (zone) {
                const isValid = this.activeDrag.validDropZones.some(vz => vz.id === zone.id);
                if (isValid) {
                    foundZone = zone;
                    break;
                }
            }
            currentEl = currentEl.parentElement;
        }

        this._updateHoverState(foundZone);
    }

    _updateHoverState(zone) {
        if (this.activeDrag.currentDropZone?.id === zone?.id) {
            if (zone && zone.sortable) {
                this._handleSortHover(zone);
            }
            return;
        }

        this.activeDrag.currentDropZone = zone;
        this.hoveredZoneId.value = zone ? zone.id : null;

        if (zone) {
            if (zone.onHover) zone.onHover(this.activeDrag.ctx, zone.ctx);
            if (zone.sortable) this._handleSortHover(zone);
        }
    }

    onDragStart(fn) { this.onStartEventBus.on(fn); }
    offDragStart(fn) { this.onStartEventBus.off(fn); }
    onDropped(fn) { this.onDroppedEventBus.on(fn); }
    offDropped(fn) { this.onDroppedEventBus.off(fn); }
}

export const manager = new PNPDragManager();
