import { manager } from '../PNPDragManager';

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
	 */
	mounted(el, binding) {
		// Options already stored in beforeMount; update in case binding changed between hooks.
		el._pnpOptions = binding.value || {};

		/**
		 * Shared drag-start logic used by both mousedown and pointerdown handlers.
		 *
		 * @param {MouseEvent|PointerEvent} event
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
		 * Mouse drag initiator — active when useTouch is false (default).
		 * Skipped when useTouch is true since pointerdown handles everything in that mode.
		 *
		 * @param {MouseEvent} event
		 */
		const onMouseDown = (event) => {
			if (manager._config.useTouch) return; // pointerdown handles all input in touch mode
			if (event.button !== 0) return;
			tryStartDrag(event);
		};

		/**
		 * Touch/pointer drag initiator — only active when useTouch is true.
		 * Fires for ALL pointer types in that mode (mouse + touch + stylus) so the
		 * app gets a single unified code path regardless of input device.
		 *
		 * @param {PointerEvent} event
		 */
		const onPointerDown = (event) => {
			if (!manager._config.useTouch) return;
			// Ignore non-primary pointer buttons (right-click, etc.).
			if (event.button !== 0) return;
			tryStartDrag(event);
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
		if (el._pnpMouseDown) {
			el.removeEventListener('mousedown', el._pnpMouseDown);
			delete el._pnpMouseDown;
		}
		if (el._pnpPointerDown) {
			el.removeEventListener('pointerdown', el._pnpPointerDown);
			delete el._pnpPointerDown;
		}
		delete el._pnpOptions;
	},
};
