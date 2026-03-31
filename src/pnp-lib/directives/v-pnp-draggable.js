import { manager as defaultManager } from '../PNPDragManager';

/**
 * Resolves the active PNPDragManager from the component's app context.
 * Falls back to the module singleton when the plugin wasn't installed or the
 * vnode context is unavailable.
 *
 * @param {import('vue').VNode} vnode
 * @returns {import('../PNPDragManager').PNPDragManager}
 */
const getManager = (vnode) => {
	const provides = vnode?.ctx?.appContext?.provides;
	return (provides && provides['pnp-manager']) ?? defaultManager;
};

export default {

	/**
	 * Sets the data-pnp-draggable attribute and stores initial options in beforeMount
	 * so that child v-pnp-draghandle directives can find this element during their own
	 * mounted hooks (which fire after beforeMount of ancestors, before mounted of ancestors).
	 *
	 * @param {HTMLElement} el
	 * @param {import('vue').DirectiveBinding} binding
	 */
	beforeMount(el, binding) {
		el.setAttribute('data-pnp-draggable', 'true');
		el._pnpOptions = binding.value || {};
	},

	/**
	 * @param {HTMLElement} el
	 * @param {import('vue').DirectiveBinding} binding
	 * @param {import('vue').VNode} vnode
	 */
	mounted(el, binding, vnode) {
		const manager = getManager(vnode);
		// Store so updated/unmounted can use the same instance without re-resolving.
		el._pnpManager = manager;
		el._pnpOptions = binding.value || {};

		/**
		 * Shared drag-start logic used by both mousedown and pointerdown handlers.
		 * Always reads el._pnpOptions at call time so it picks up the latest reactive
		 * state (important when threshold gives Vue a microtask to re-render first).
		 *
		 * @param {MouseEvent|PointerEvent} event - The original initiating event.
		 */
		const tryStartDrag = (event) => {
			const opts = el._pnpOptions;

			if (opts.requireHandle) {
				const handles = el._pnpHandles;
				if (!handles || handles.size === 0) return;
				const inHandle = [...handles].some(handle => handle.contains(event.target));
				if (!inHandle) return;
			}

			manager.startDrag(el, opts, event);
		};

		/**
		 * Cancels a pending threshold watch without starting a drag.
		 * Stored on the element so unmounted can clean up if needed.
		 */
		const cancelThreshold = () => {
			if (el._pnpThresholdCancel) {
				el._pnpThresholdCancel();
			}
		};

		/**
		 * Starts watching the mouse for a drag threshold crossing.
		 * Once the cursor has moved at least `threshold` pixels (Pythagorean distance)
		 * from the mousedown point, the drag begins using the original initiating event
		 * so modifier keys (Ctrl/Shift) are preserved correctly.
		 *
		 * A per-draggable `opts.dragThreshold` overrides the manager-level default.
		 * Set to `0` to disable the threshold and start drags immediately.
		 *
		 * @param {MouseEvent|PointerEvent} downEvent - The original mousedown/pointerdown event.
		 */
		const startThresholdWatch = (downEvent) => {
			const opts = el._pnpOptions;
			const threshold = opts.dragThreshold ?? manager._config.dragThreshold ?? 0;

			// Zero threshold -- start immediately (legacy behaviour).
			if (!threshold) {
				tryStartDrag(downEvent);
				return;
			}

			const startX = downEvent.clientX;
			const startY = downEvent.clientY;

			/**
			 * @param {MouseEvent} moveEvent
			 */
			const onMove = (moveEvent) => {
				const dx = moveEvent.clientX - startX;
				const dy = moveEvent.clientY - startY;
				if (Math.sqrt(dx * dx + dy * dy) >= threshold) {
					cleanup();
					// Pass the original downEvent so modifier keys are correct.
					// By now Vue has had its microtask to re-render, so el._pnpOptions
					// holds the freshest reactive state (e.g. updated file selection).
					tryStartDrag(downEvent);
				}
			};

			/** Clears the pending watch listeners on mouseup or unmount. */
			const onUp = () => cleanup();

			const cleanup = () => {
				window.removeEventListener('mousemove', onMove);
				window.removeEventListener('mouseup', onUp, true);
				el._pnpThresholdCancel = null;
			};

			el._pnpThresholdCancel = cleanup;
			window.addEventListener('mousemove', onMove);
			window.addEventListener('mouseup', onUp, true);
		};

		/**
		 * Mouse drag initiator -- always active, handles left-button mouse input.
		 *
		 * @param {MouseEvent} event
		 */
		const onMouseDown = (event) => {
			if (event.button !== 0) return;
			cancelThreshold(); // clear any stale watch from a previous rapid click
			startThresholdWatch(event);
		};

		/**
		 * Touch/stylus drag initiator -- only fires for actual touch or pen input
		 * (pointerType !== 'mouse') when useTouch is enabled.
		 *
		 * Calling preventDefault() here suppresses the browser's synthesised mousedown
		 * that would otherwise fire ~300ms later and erroneously re-trigger the drag.
		 *
		 * @param {PointerEvent} event
		 */
		const onPointerDown = (event) => {
			if (!manager._config.useTouch) return;
			if (event.pointerType === 'mouse') return; // handled by onMouseDown
			if (event.button !== 0) return;
			event.preventDefault(); // suppress synthetic mousedown / click
			startThresholdWatch(event);
		};

		el._pnpMouseDown = onMouseDown;
		el._pnpPointerDown = onPointerDown;
		el.addEventListener('mousedown', onMouseDown);
		el.addEventListener('pointerdown', onPointerDown);
	},

	/**
	 * Keeps el._pnpOptions current when reactive bindings change.
	 * The mousedown handler reads from el._pnpOptions at call time, so it
	 * automatically picks up the latest value without replacing the listener.
	 *
	 * @param {HTMLElement} el
	 * @param {import('vue').DirectiveBinding} binding
	 */
	updated(el, binding) {
		el._pnpOptions = binding.value || {};
	},

	/**
	 * @param {HTMLElement} el
	 */
	unmounted(el) {
		// Cancel any pending threshold watch so we don't leak listeners.
		if (el._pnpThresholdCancel) {
			el._pnpThresholdCancel();
		}
		if (el._pnpMouseDown) {
			el.removeEventListener('mousedown', el._pnpMouseDown);
			delete el._pnpMouseDown;
		}
		if (el._pnpPointerDown) {
			el.removeEventListener('pointerdown', el._pnpPointerDown);
			delete el._pnpPointerDown;
		}
		delete el._pnpOptions;
		delete el._pnpManager;
	},
};
