<script setup>
import { ref, reactive } from 'vue';
import CustomDragItem from './components/CustomDragItem.vue';

const items = ref([
  { id: 1, label: 'Draggable (Self)', dragItem: 'self', keys: 'file', ctx: { label: 'File 1' } },
  { id: 2, label: 'Draggable (Clone)', dragItem: 'clone', keys: 'folder', ctx: { label: 'Folder A' } },
  { id: 3, label: 'Draggable (Component)', dragItem: CustomDragItem, keys: 'file|folder', ctx: { label: 'Universal 1' } },
]);

const sortableItems = ref([
  { id: 10, label: 'Sortable Item 1' },
  { id: 11, label: 'Sortable Item 2' },
  { id: 12, label: 'Sortable Item 3' },
  { id: 13, label: 'Sortable Item 4' },
]);

const dropHistory = ref([]);

const handleDrop = (dragCtx, dropCtx) => {
  dropHistory.value.unshift({
    time: new Date().toLocaleTimeString(),
    drag: dragCtx.label,
    drop: dropCtx.label
  });
};

const hoverStatus = ref('None');
const handleHover = (dragCtx, dropCtx) => {
  hoverStatus.value = `Hovering over ${dropCtx.label}`;
};

const handleSortHover = (dragCtx, dropCtx, idx) => {
  // console.log(`Sorting: Over ${dropCtx.label} at index ${idx}`);
  // In a real app, we might rearrange sortableItems here
};

const dragOptions = reactive({
  highlight: 'on-hover',
  useHighlightBorder: true,
  highlightBorderStyle: '3px dashed #34495e'
});

</script>

<template>
  <div class="demo-container">
    <PNPDragLayer :z-index="10000" />

    <header>
      <h1>Vue Pick-n-Plop Demo</h1>
      <div class="controls">
        <label>
          Highlight:
          <select v-model="dragOptions.highlight">
            <option value="on-start">On Start</option>
            <option value="on-hover">On Hover</option>
          </select>
        </label>
        <label>
          <input type="checkbox" v-model="dragOptions.useHighlightBorder"> Use Custom Border
        </label>
      </div>
    </header>

    <main>
      <section class="draggables">
        <h2>Draggables</h2>
        <div 
          v-for="item in items" 
          :key="item.id"
          v-pnp-draggable="{
            keys: item.keys,
            ctx: item.ctx,
            dragItem: item.dragItem,
            highlight: dragOptions.highlight,
            useHighlightBorder: dragOptions.useHighlightBorder,
            highlightBorderStyle: dragOptions.highlightBorderStyle
          }"
          class="draggable-card"
        >
          {{ item.label }}
          <span class="keys">Keys: {{ item.keys }}</span>
        </div>
      </section>

      <section class="dropzones">
        <h2>Drop Zones</h2>
        <div class="zone-grid">
          <div 
            v-pnp-dropzone="{
              keys: 'file',
              ctx: { label: 'File Zone' },
              onDropped: handleDrop,
              onHover: handleHover
            }"
            class="dropzone-box file-zone"
          >
            📂 Files Only
          </div>

          <div 
            v-pnp-dropzone="{
              keys: 'folder',
              ctx: { label: 'Folder Zone' },
              onDropped: handleDrop,
              onHover: handleHover
            }"
            class="dropzone-box folder-zone"
          >
            📁 Folders Only
          </div>

          <div 
            v-pnp-dropzone="{
              keys: 'file|folder',
              ctx: { label: 'Universal Zone' },
              onDropped: handleDrop,
              onHover: handleHover
            }"
            class="dropzone-box universal-zone"
          >
            🌟 Anything
          </div>
        </div>
      </section>

      <section class="sorting">
        <h2>Sortable Zone</h2>
        <div 
          v-pnp-dropzone="{
            keys: 'file|folder',
            sortable: true,
            ctx: { label: 'Sortable Container' },
            onSortHover: handleSortHover
          }"
          class="sortable-container"
        >
          <div 
            v-for="item in sortableItems" 
            :key="item.id"
            v-pnp-draggable="{
              keys: 'folder',
              ctx: { label: item.label },
              dragItem: 'clone'
            }"
            class="sortable-item"
          >
            ⠿ {{ item.label }}
          </div>
        </div>
      </section>

      <aside class="info">
        <h3>Status</h3>
        <p>Current Hover: <strong>{{ hoverStatus }}</strong></p>
        
        <h3>History</h3>
        <ul class="history-list">
          <li v-for="(entry, i) in dropHistory" :key="i">
            [{{ entry.time }}] {{ entry.drag }} -> {{ entry.drop }}
          </li>
          <li v-if="dropHistory.length === 0">No drops yet.</li>
        </ul>
      </aside>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #f8f9fa;
  color: #2c3e50;
}

.demo-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 1rem;
}

.controls {
  display: flex;
  gap: 1rem;
}

main {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  gap: 2rem;
}

section h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.draggables {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.draggable-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  cursor: grab;
  user-select: none;
  border: 1px solid #ddd;
  position: relative;
}

.draggable-card:active {
  cursor: grabbing;
}

.keys {
  display: block;
  font-size: 0.7rem;
  color: #999;
  margin-top: 0.5rem;
}

.zone-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.dropzone-box {
  height: 200px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  background: white;
  transition: all 0.2s;
}

.universal-zone {
  grid-column: span 2;
}

/* These classes are added by our directive */
.pnp-dropzone-valid {
  background: #e8f5e9;
  border-color: #42b883;
}

.pnp-dropzone-hovered {
  background: #c8e6c9;
  transform: scale(1.02);
}

.sortable-container {
  margin-top: 2rem;
  background: #fff;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  min-height: 200px;
}

.sortable-item {
  padding: 1rem;
  background: #fdfdfd;
  border: 1px solid #eee;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: grab;
}

.info {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 0.9rem;
}

.history-list {
  list-style: none;
  padding: 0;
  max-height: 400px;
  overflow-y: auto;
}

.history-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}
</style>
