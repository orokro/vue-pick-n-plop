/**
 * v-pnp-draghandle
 * ----------------
 *
 * Marks an element as the drag handle for its nearest ancestor v-pnp-draggable.
 * Multiple handles can be registered on a single draggable.
 *
 * Only takes effect when the draggable is configured with { requireHandle: true }.
 * With that option set, dragging can only be initiated from within a registered handle —
 * clicking anywhere else on the draggable element does nothing.
 *
 * Timing note: this directive's `mounted` hook walks up the DOM looking for the nearest
 * ancestor with the `data-pnp-draggable` attribute. That attribute is set in the draggable
 * directive's `beforeMount` hook, which fires before this directive's `mounted` hook, so
 * the attribute is guaranteed to exist by the time the walk runs.
 */
export default {

	/**
	 * Walks up the DOM from this element to find the nearest ancestor that has
	 * v-pnp-draggable applied, then registers this element as one of its handles.
	 *
	 * @param {HTMLElement} el
	 */
	mounted(el) {
		let ancestor = el.parentElement;

		while (ancestor && ancestor !== document.body) {
			if (ancestor.hasAttribute('data-pnp-draggable')) {
				if (!ancestor._pnpHandles) {
					ancestor._pnpHandles = new Set();
				}
				ancestor._pnpHandles.add(el);
				el._pnpHandleAncestor = ancestor;
				return;
			}
			ancestor = ancestor.parentElement;
		}

		console.warn('[PNP] v-pnp-draghandle: no v-pnp-draggable ancestor found. The directive has no effect.');
	},

	/**
	 * Removes this element from its draggable ancestor's handle registry.
	 *
	 * @param {HTMLElement} el
	 */
	unmounted(el) {
		if (el._pnpHandleAncestor?._pnpHandles) {
			el._pnpHandleAncestor._pnpHandles.delete(el);
		}
		delete el._pnpHandleAncestor;
	},
};
