import PNPDragLayer from './components/PNPDragLayer.vue';
import vPnpDraggable from './directives/v-pnp-draggable';
import vPnpDropzone from './directives/v-pnp-dropzone';
import vPnpDraghandle from './directives/v-pnp-draghandle';
import { usePNPDragging } from './usePNPDragging';

export default {
	/**
	 * Installs the PNP plugin on a Vue app.
	 * Options are forwarded to manager.setOptions() so global defaults can be
	 * configured at the call site: app.use(PNP, { cancelKey: 'Escape', rightClickCancel: true })
	 *
	 * @param {import('vue').App} app
	 * @param {Parameters<import('./PNPDragManager').PNPDragManager['setOptions']>[0]} [options]
	 */
	install(app, options = {}) {
		if (Object.keys(options).length > 0) {
			manager.setOptions(options);
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
