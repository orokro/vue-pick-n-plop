import { v4 as uuidv4 } from 'uuid';
import { watch } from 'vue';
import { manager } from '../PNPDragManager';

export default {
    mounted(el, binding) {
        const id = uuidv4();
        const options = binding.value || {};
        
        el._pnpDropzoneId = id;
        el.setAttribute('data-pnp-dropzone', 'true');
        if (options.sortable) {
            el.setAttribute('data-pnp-sortable', 'true');
        }

        manager.registerDropZone({
            id,
            el,
            ...options
        });

        // Highlight handling
        const applyHighlights = () => {
            if (!manager.isDragging.value) {
                el.classList.remove('pnp-dropzone-valid', 'pnp-dropzone-hovered');
                el.style.border = el._pnpOriginalBorder || '';
                return;
            }

            const isValid = manager.activeDrag.validDropZones.some(vz => vz.id === id);
            const isHovered = manager.hoveredZoneId.value === id;
            const dragOptions = manager.activeDrag.options || {};
            
            const highlightMode = dragOptions.highlight || 'on-hover';

            // Add classes
            if (isValid) {
                if (highlightMode === 'on-start' || (highlightMode === 'on-hover' && isHovered)) {
                    el.classList.add('pnp-dropzone-valid');
                    
                    if (dragOptions.useHighlightBorder) {
                        if (el._pnpOriginalBorder === undefined) {
                            el._pnpOriginalBorder = el.style.border;
                        }
                        el.style.border = dragOptions.highlightBorderStyle || '2px solid #42b883';
                    }
                } else {
                    el.classList.remove('pnp-dropzone-valid');
                    el.style.border = el._pnpOriginalBorder || '';
                }
            } else {
                el.classList.remove('pnp-dropzone-valid');
                el.style.border = el._pnpOriginalBorder || '';
            }

            if (isHovered && isValid) {
                el.classList.add('pnp-dropzone-hovered');
            } else {
                el.classList.remove('pnp-dropzone-hovered');
            }
        };

        const stopWatch = watch(
            [() => manager.isDragging.value, () => manager.hoveredZoneId.value, () => manager.activeDrag.validDropZones.length],
            applyHighlights
        );

        el._pnpStopWatch = stopWatch;
    },

    unmounted(el) {
        if (el._pnpStopWatch) {
            el._pnpStopWatch();
        }
        if (el._pnpDropzoneId) {
            manager.unregisterDropZone(el._pnpDropzoneId);
            delete el._pnpDropzoneId;
        }
    },

    updated(el, binding) {
        const id = el._pnpDropzoneId;
        const options = binding.value || {};
        
        if (options.sortable) {
            el.setAttribute('data-pnp-sortable', 'true');
        } else {
            el.removeAttribute('data-pnp-sortable');
        }

        // Update manager's record
        const zones = manager.dragZones.value;
        const idx = zones.findIndex(z => z.id === id);
        if (idx !== -1) {
            const updatedZone = { ...zones[idx], ...options };
            manager.dragZones.value = [
                ...zones.slice(0, idx),
                updatedZone,
                ...zones.slice(idx + 1)
            ];
        }
    }
};
