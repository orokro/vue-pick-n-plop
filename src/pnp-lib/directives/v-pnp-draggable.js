import { manager } from '../PNPDragManager';

export default {
    mounted(el, binding) {
        const options = binding.value || {};
        
        // Add data attribute to help manager identify draggables during sorting
        el.setAttribute('data-pnp-draggable', 'true');

        const onMouseDown = (event) => {
            // Only left click
            if (event.button !== 0) return;
            
            // Prevent text selection
            // event.preventDefault(); // This might interfere with child interactions, maybe better to handle in manager
            
            manager.startDrag(el, options, event);
        };

        el._pnpMouseDown = onMouseDown;
        el.addEventListener('mousedown', onMouseDown);
    },

    unmounted(el) {
        if (el._pnpMouseDown) {
            el.removeEventListener('mousedown', el._pnpMouseDown);
            delete el._pnpMouseDown;
        }
    },

    updated(el, binding) {
        // Update options if they changed
        // We might need to handle this more robustly if the user passes different objects
        const options = binding.value || {};
        // If we want to support dynamic options, we'd need to store them on the el
        // but since startDrag is called on mousedown, it will grab the latest value from binding
    }
};
