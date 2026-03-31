<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { usePNPDragging } from '../usePNPDragging';

const props = defineProps({
    zIndex: {
        type: [Number, String],
        default: 9001
    }
});

const manager = usePNPDragging();
const activeDrag = manager.activeDrag;

onMounted(() => {
    manager.registerDropLayer();
});

onUnmounted(() => {
    manager.unregisterDropLayer();
});

const layerStyle = computed(() => ({
    position: 'fixed',
    inset: '0px',
    zIndex: props.zIndex,
    pointerEvents: 'none',
    display: manager.isDragging.value ? 'block' : 'none'
}));

const dragItemStyle = computed(() => {
    if (!manager.isDragging.value || !activeDrag.initialRect) return {};
    
    const x = activeDrag.initialRect.left + activeDrag.delta.x;
    const y = activeDrag.initialRect.top + activeDrag.delta.y;

    return {
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        width: `${activeDrag.initialRect.width}px`,
        height: `${activeDrag.initialRect.height}px`,
        pointerEvents: 'none',
        margin: 0,
        zIndex: 1 // Relative to the layer
    };
});

// Clone handling
const cloneEl = ref(null);
watch(() => manager.isDragging.value, (isDragging) => {
    if (isDragging && activeDrag.options.dragItem === 'clone' && activeDrag.el) {
        nextTick(() => {
            if (cloneEl.value) {
                cloneEl.value.innerHTML = '';
                const clone = activeDrag.el.cloneNode(true);
                clone.style.width = '100%';
                clone.style.height = '100%';
                clone.style.margin = '0';
                cloneEl.value.appendChild(clone);
            }
        });
    }
});

// For custom component mode
const isComponentMode = computed(() => {
    return activeDrag.options && typeof activeDrag.options.dragItem !== 'string' && activeDrag.options.dragItem !== undefined;
});

</script>

<template>
    <div v-show="manager.isDragging.value" :style="layerStyle" class="pnp-drag-layer">
        
        <!-- Mode: self (Container for the original element to be appended to) -->
        <div v-show="activeDrag.options.dragItem === 'self'" :style="dragItemStyle" class="pnp-drag-item-self-container">
        </div>

        <!-- Mode: clone -->
        <div v-if="activeDrag.options.dragItem === 'clone'" :style="dragItemStyle" ref="cloneEl" class="pnp-drag-item-clone">
            <!-- +N badge: shown when showGroupCount is on and more than one item is selected -->
            <span
                v-if="activeDrag.options.showGroupCount && activeDrag.groupCtx && activeDrag.groupCtx.length > 1"
                class="pnp-group-count-badge"
            >{{ activeDrag.groupCtx.length }}</span>
        </div>

        <!-- Mode: component -->
        <div v-else-if="isComponentMode" :style="dragItemStyle" class="pnp-drag-item-component">
            <component
                :is="activeDrag.options.dragItem"
                :ctx="activeDrag.ctx"
                :group-ctx="activeDrag.groupCtx"
                :delta="activeDrag.delta"
                :start-mouse="activeDrag.startMouse"
                :current-mouse="activeDrag.currentMouse"
            />
        </div>

        <!-- Mode: string (but not self/clone) -->
        <div v-else-if="typeof activeDrag.options.dragItem === 'string' && activeDrag.options.dragItem !== 'self' && activeDrag.options.dragItem !== 'clone'" 
             :style="dragItemStyle" 
             class="pnp-drag-item-default">
             {{ activeDrag.options.dragItem }}
        </div>

    </div>
</template>

<style scoped>
.pnp-drag-layer {
    user-select: none;
}

.pnp-group-count-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    min-width: 22px;
    height: 22px;
    padding: 0 5px;
    background: #e74c3c;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    pointer-events: none;
    z-index: 2;
}
</style>
