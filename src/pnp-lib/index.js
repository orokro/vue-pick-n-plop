import PNPDragLayer from './components/PNPDragLayer.vue';
import vPnpDraggable from './directives/v-pnp-draggable';
import vPnpDropzone from './directives/v-pnp-dropzone';
import vPnpDraghandle from './directives/v-pnp-draghandle';
import { usePNPDragging } from './usePNPDragging';

export default {
	install(app) {
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
