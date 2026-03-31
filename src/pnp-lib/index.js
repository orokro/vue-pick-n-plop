import PNPDragLayer from './components/PNPDragLayer.vue';
import vPnpDraggable from './directives/v-pnp-draggable';
import vPnpDropzone from './directives/v-pnp-dropzone';
import vPnpDraghandle from './directives/v-pnp-draghandle';
import { usePNPDragging } from './usePNPDragging';
import { manager } from './PNPDragManager';

export default {
	/**
	 * Installs the PNP plugin on a Vue app.
	 *
	 * - Provides the manager singleton under `'pnp-manager'` so that
	 *   `usePNPDragging()`, `PNPDragLayer`, and the directives all resolve the
	 *   same instance without coupling to the module-level import.
	 * - Options are forwarded to `manager.setOptions()` so global defaults can be
	 *   configured at the call site: `app.use(PNP, { cancelKey: null })`.
	 *
	 * Advanced — multiple independent instances:
	 *   Create a fresh `PNPDragManager` instance, provide it manually before
	 *   installing the plugin, and the directives / composable will pick it up:
	 *   ```js
	 *   import { PNPDragManager } from './pnp-lib/PNPDragManager';
	 *   const myManager = new PNPDragManager();
	 *   app.provide('pnp-manager', myManager);
	 *   app.use(PNP);   // plugin skips provide if key already set
	 *   ```
	 *
	 * @param {import('vue').App} app
	 * @param {Parameters<import('./PNPDragManager').PNPDragManager['setOptions']>[0]} [options]
	 */
	install(app, options = {}) {
		// Only provide if a custom instance hasn't already been provided upstream.
		if (!app._context.provides['pnp-manager']) {
			app.provide('pnp-manager', manager);
		}

		if (Object.keys(options).length > 0) {
			// Apply options to whichever instance was resolved.
			const instance = app._context.provides['pnp-manager'];
			instance.setOptions(options);
		}

		app.component('PNPDragLayer', PNPDragLayer);
		app.directive('pnp-draggable', vPnpDraggable);
		app.directive('pnp-dropzone', vPnpDropzone);
		app.directive('pnp-draghandle', vPnpDraghandle);
	}
};

export {
	PNPDragLayer,
	vPnpDraggable,
	vPnpDropzone,
	vPnpDraghandle,
	usePNPDragging
};
