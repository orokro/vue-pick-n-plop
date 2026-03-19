<script setup>
const props = defineProps({
    ctx: Object,
    delta: Object,
    currentMouse: Object
});
</script>

<template>
    <div class="custom-drag-item">
        📦 {{ ctx.label }}
        <div class="coords">({{ Math.round(currentMouse.x) }}, {{ Math.round(currentMouse.y) }})</div>
    </div>
</template>

<style scoped>
.custom-drag-item {
    background: #42b883;
    color: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    border: 2px solid white;
    white-space: nowrap;
}
.coords {
    font-size: 10px;
    opacity: 0.8;
}
</style>
