import PNPDragLayer from './components/PNPDragLayer.vue';
import vPnpDraggable from './directives/v-pnp-draggable';
import vPnpDropzone from './directives/v-pnp-dropzone';
import { usePNPDragging } from './usePNPDragging';

export default {
    install(app) {
        app.component('PNPDragLayer', PNPDragLayer);
        app.directive('pnp-draggable', vPnpDraggable);
        app.directive('pnp-dropzone', vPnpDropzone);
    }
};

export {
    PNPDragLayer,
    vPnpDraggable,
    vPnpDropzone,
    usePNPDragging
};
