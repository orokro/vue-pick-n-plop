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
		 * Initiates a drag on left mousedown. If requireHandle is true, only proceeds
		 * if the event target falls inside one of the element's registered drag handles.
		 *
		 * @param {MouseEvent} event
		 */
		const onMouseDown = (event) => {
			if (event.button !== 0) return;

			const opts = el._pnpOptions;

			if (opts.requireHandle) {
				const handles = el._pnpHandles;
				if (!handles || handles.size === 0) return;
				const inHandle = [...handles].some(handle => handle.contains(event.target));
				if (!inHandle) return;
			}

			manager.startDrag(el, opts, event);
		};

		el._pnpMouseDown = onMouseDown;
		el.addEventListener('mousedown', onMouseDown);
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
		delete el._pnpOptions;
	},
};
