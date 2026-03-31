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
    constructor() {
        this.isDragging = ref(false);
        this.dragZones = shallowRef([]);
        this.dragHelper = new DragHelper();
        this.onStartEventBus = new EventBus();
        this.onDroppedEventBus = new EventBus();

        // Current drag state
        this.activeDrag = reactive({
            el: null,
            originalParent: null,
            originalNextSibling: null,
            keys: [],
            ctx: {},
            options: {},
            startMouse: { x: 0, y: 0 },
            currentMouse: { x: 0, y: 0 },
            delta: { x: 0, y: 0 },
            initialRect: null,
            currentDropZone: null,
            validDropZones: [],
        });

        // Counter rather than boolean so multiple PNPDragLayer instances
        // can mount/unmount independently without clobbering each other.
        this.hasDragLayer = ref(0);
        this.hoveredZoneId = ref(null);
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

    startDrag(el, options, event) {
        if (this.hasDragLayer.value < 1) {
            console.warn('[PNP] No <PNPDragLayer /> mounted. Dragging disabled.');
            return;
        }

        const keys = typeof options.keys === 'string' ? options.keys.split('|') : (options.keys || []);
        const rect = el.getBoundingClientRect();
        const mouse = this.dragHelper.getCursorPos();

        Object.assign(this.activeDrag, {
            el,
            originalParent: el.parentElement,
            originalNextSibling: el.nextSibling,
            keys,
            ctx: options.ctx || {},
            options,
            startMouse: { ...mouse },
            currentMouse: { ...mouse },
            delta: { x: 0, y: 0 },
            initialRect: rect,
            currentDropZone: null,
            validDropZones: [],
        });

        this._updateValidDropZones();

        // Handle 'self' mode: move element to drag layer container
        if (options.dragItem === 'self') {
            const container = document.querySelector('.pnp-drag-item-self-container');
            if (container) {
                container.appendChild(el);
                // We should also set its style to match the dragItemStyle in the layer
                // but the layer will handle it via its own computed styles if we wrap it.
            }
        }

        this.isDragging.value = true;
        document.body.style.userSelect = 'none';
        this.onStartEventBus.emit(this.activeDrag.ctx);

        if (options.onDragStart) {
            options.onDragStart(this.activeDrag.ctx);
        }

        this.dragHelper.dragStart(
            (dx, dy) => this._onDragMove(dx, dy),
            (dx, dy) => this._onDragEnd(dx, dy)
        );
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
        const success = !!this.activeDrag.currentDropZone;
        const dragCtx = this.activeDrag.ctx;
        const dropCtx = this.activeDrag.currentDropZone?.ctx || null;

        // Call lifecycle methods
        if (this.activeDrag.options.onDropped) {
            this.activeDrag.options.onDropped(success, dragCtx, dropCtx);
        }

        if (success && this.activeDrag.currentDropZone.onDropped) {
            this.activeDrag.currentDropZone.onDropped(dragCtx, dropCtx);
        }

        this.onDroppedEventBus.emit({ success, dragCtx, dropCtx });

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

            if (valid && (this.activeDrag.options.callDragValidateFunctionOnStart || zone.callDropValidateFunctionsOnStart)) {
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

    _handleSortHover(zone) {
        const { x, y } = this.activeDrag.currentMouse;
        const elUnderMouse = document.elementFromPoint(x, y);
        if (!elUnderMouse) return;

        let currentEl = elUnderMouse;
        let targetDraggable = null;

        while (currentEl && currentEl !== zone.el) {
            if (currentEl.hasAttribute('data-pnp-draggable')) {
                targetDraggable = currentEl;
                break;
            }
            currentEl = currentEl.parentElement;
        }

        if (targetDraggable && zone.onSortHover) {
            const siblings = Array.from(zone.el.querySelectorAll('[data-pnp-draggable]'))
                .filter(el => {
                    let parent = el.parentElement;
                    while (parent && parent !== zone.el) {
                        if (parent.hasAttribute('data-pnp-dropzone') && parent.getAttribute('data-pnp-sortable') === 'true') {
                            return false;
                        }
                        parent = parent.parentElement;
                    }
                    return true;
                });
            
            const idx = siblings.indexOf(targetDraggable);
            zone.onSortHover(this.activeDrag.ctx, zone.ctx, idx);
        }
    }

    onDragStart(fn) { this.onStartEventBus.on(fn); }
    offDragStart(fn) { this.onStartEventBus.off(fn); }
    onDropped(fn) { this.onDroppedEventBus.on(fn); }
    offDropped(fn) { this.onDroppedEventBus.off(fn); }
}

export const manager = new PNPDragManager();
