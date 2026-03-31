<!--
	App.vue
	-------

	This is a demo app showcasing the features of Vue Pick-n-Plop.
-->
<script setup>

// imports
import { ref, reactive, onMounted, onUnmounted } from 'vue';

// Disable default browser image dragging globally for this demo
const preventDefaultDrag = (e) => {
  if (e.target.tagName === 'IMG') e.preventDefault();
};

onMounted(() => {
  window.addEventListener('dragstart', preventDefaultDrag);
});

onUnmounted(() => {
  window.removeEventListener('dragstart', preventDefaultDrag);
});

// the draggable items we'll use in our demo
const files = ref([
  { id: 1, label: 'Resume.pdf', type: 'file', keys: 'file', icon: '📄' },
  { id: 2, label: 'Vacation.jpg', type: 'file', keys: 'file', icon: '🖼️' },
  { id: 3, label: 'Budget.xlsx', type: 'file', keys: 'file', icon: '📊' },
  { id: 4, label: 'Project_Notes.txt', type: 'file', keys: 'file', icon: '📝' },
]);

const folders = ref([
  { id: 101, label: 'Work', type: 'folder', keys: 'folder', icon: '📁', items: [] },
  { id: 102, label: 'Photos', type: 'folder', keys: 'folder', icon: '📁', items: [] },
]);

// items in our sortable container
const favorites = ref([
  { id: 201, label: 'Quick Access 1', type: 'favorite', keys: 'favorite', icon: '⭐' },
  { id: 202, label: 'Quick Access 2', type: 'favorite', keys: 'favorite', icon: '⭐' },
  { id: 203, label: 'Quick Access 3', type: 'favorite', keys: 'favorite', icon: '⭐' },
]);

const dropHistory = ref([]);
const hoverStatus = ref('Ready');

// Handlers
const handleFileDrop = (dragCtx, dropCtx) => {
  dropHistory.value.unshift({
    time: new Date().toLocaleTimeString(),
    msg: `Moved ${dragCtx.label} to ${dropCtx.label}`
  });
  
  // Actually "move" the file
  const fileIdx = files.value.findIndex(f => f.id === dragCtx.id);
  if (fileIdx !== -1) {
    const file = files.value.splice(fileIdx, 1)[0];
    const targetFolder = folders.value.find(f => f.label === dropCtx.label);
    if (targetFolder) {
      if (!targetFolder.items) targetFolder.items = [];
      targetFolder.items.push(file);
    }
  }
};

const handleRecycleDrop = (dragCtx, dropCtx) => {
  dropHistory.value.unshift({
    time: new Date().toLocaleTimeString(),
    msg: `Deleted ${dragCtx.label}`
  });

  // Remove from source lists
  files.value = files.value.filter(f => f.id !== dragCtx.id);
  folders.value = folders.value.filter(f => f.id !== dragCtx.id);
  favorites.value = favorites.value.filter(f => f.id !== dragCtx.id);
};

const handleFavoriteDrop = (dragCtx, dropCtx) => {
  if (dragCtx.keys === 'favorite') return;

  const newItem = {
    id: Date.now(),
    label: dragCtx.label,
    type: 'favorite',
    keys: 'favorite',
    icon: '⭐'
  };
  favorites.value.push(newItem);
  
  dropHistory.value.unshift({
    time: new Date().toLocaleTimeString(),
    msg: `Added ${dragCtx.label} to Favorites`
  });
};

const handleSortHover = (dragCtx, dropCtx, idx) => {
  if (dragCtx.keys !== 'favorite') return;
  
  const fromIdx = favorites.value.findIndex(item => item.id === dragCtx.id);
  if (fromIdx !== -1 && fromIdx !== idx) {
    const item = favorites.value.splice(fromIdx, 1)[0];
    favorites.value.splice(idx, 0, item);
  }
};

const handleHover = (dragCtx, dropCtx) => {
  hoverStatus.value = `Over ${dropCtx.label}`;
};

const handleHoverLeave = () => {
  hoverStatus.value = 'Ready';
};

const dragOptions = reactive({
  highlight: 'on-hover',
  useHighlightBorder: true,
  highlightBorderStyle: '2px solid #3498db'
});

</script>

<template>
  <div class="desktop-demo">
    <PNPDragLayer :z-index="10000" />

    <aside class="sidebar">
      <div class="sidebar-header">
        <h3>Favorites</h3>
      </div>
      <div 
        v-pnp-dropzone="{
          keys: 'favorite|file|folder',
          sortable: true,
          ctx: { label: 'Favorites' },
          onSortHover: handleSortHover,
          onDropped: handleFavoriteDrop
        }"
        class="favorites-list"
      >
        <div 
          v-for="item in favorites" 
          :key="item.id"
          v-pnp-draggable="{
            keys: 'favorite',
            ctx: { id: item.id, label: item.label, keys: 'favorite' },
            dragItem: 'clone'
          }"
          class="favorite-item"
        >
          <span class="icon">{{ item.icon }}</span> {{ item.label }}
        </div>
      </div>

      <div class="sidebar-footer">
        <div 
          v-pnp-dropzone="{
            keys: 'file|folder|favorite',
            ctx: { label: 'Recycle Bin' },
            onDropped: handleRecycleDrop,
            onHover: handleHover
          }"
          class="recycle-bin"
        >
          🗑️ Recycle Bin
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="app-header">
        <h1>Filesystem Explorer</h1>
        <div class="status-bar">
          Status: <strong>{{ hoverStatus }}</strong>
        </div>
      </header>

      <section class="file-grid">
        <div 
          v-for="folder in folders" 
          :key="folder.id"
          v-pnp-dropzone="{
            keys: 'file',
            ctx: { label: folder.label },
            onDropped: handleFileDrop,
            onHover: handleHover
          }"
          v-pnp-draggable="{
            keys: 'folder',
            ctx: { id: folder.id, label: folder.label },
            dragItem: 'clone'
          }"
          class="folder-card"
        >
          <div class="folder-icon">
            📁
            <span v-if="folder.items?.length" class="folder-badge">{{ folder.items.length }}</span>
          </div>
          <div class="folder-label">{{ folder.label }}</div>
        </div>

        <div 
          v-for="file in files" 
          :key="file.id"
          v-pnp-draggable="{
            keys: 'file',
            ctx: { id: file.id, label: file.label },
            dragItem: 'clone'
          }"
          class="file-card"
        >
          <div class="file-icon">{{ file.icon }}</div>
          <div class="file-label">{{ file.label }}</div>
        </div>
      </section>

      <section class="drop-history">
        <h3>Recent Actions</h3>
        <ul>
          <li v-for="(entry, i) in dropHistory" :key="i">
            <small>{{ entry.time }}</small> - {{ entry.msg }}
          </li>
          <li v-if="dropHistory.length === 0" class="empty-msg">No actions yet. Drag some files!</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style>
:root {
  --bg-color: #f0f2f5;
  --sidebar-bg: #ffffff;
  --text-main: #2c3e50;
  --accent-color: #3498db;
  --danger-color: #e74c3c;
  --border-color: #dcdde1;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--bg-color);
  color: var(--text-main);
  height: 100vh;
  overflow: hidden;
}

#app {
  display: block;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.desktop-demo {
  display: flex;
  height: 100vh;
}

/* Sidebar Styling */
.sidebar {
  width: 260px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #7f8c8d;
}

.favorites-list {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.favorite-item {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: grab;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.favorite-item:hover {
  background: #eef2f7;
  border-color: var(--accent-color);
}

.favorite-item .icon {
  margin-right: 10px;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.recycle-bin {
  padding: 1rem;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  text-align: center;
  color: #7f8c8d;
  transition: all 0.3s;
}

.recycle-bin.pnp-dropzone-hovered {
  background: #fadbd8;
  border-color: var(--danger-color);
  color: var(--danger-color);
  transform: scale(1.05);
}

/* Main Content Styling */
.main-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.app-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.status-bar {
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  font-size: 0.9rem;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.folder-card, .file-card {
  background: white;
  padding: 1.5rem 1rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid transparent;
}

.folder-card:hover, .file-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.folder-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  position: relative;
}

.folder-badge {
  position: absolute;
  top: 10px;
  right: 50%;
  transform: translateX(25px);
  background: var(--accent-color);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

.file-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.folder-label, .file-label {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dropzone Highlights */
.pnp-dropzone-valid {
  border-color: var(--accent-color);
}

.folder-card.pnp-dropzone-hovered {
  background: #ebf5fb;
  border-color: var(--accent-color);
  transform: scale(1.1);
}

.favorites-list.pnp-dropzone-valid {
  background: #f4faff;
}

/* History */
.drop-history {
  margin-top: auto;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.drop-history h3 {
  margin-top: 0;
  font-size: 1rem;
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.drop-history ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.drop-history li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f2f6;
  font-size: 0.9rem;
}

.drop-history li:last-child {
  border-bottom: none;
}

.empty-msg {
  color: #bdc3c7;
  font-style: italic;
}

/* Custom Drag Item Style (applied by the layer) */
.pnp-drag-item-clone {
  opacity: 0.8;
  transform: rotate(3deg);
  pointer-events: none;
}

.pnp-drag-item-clone * {
  box-shadow: 0 20px 30px rgba(0,0,0,0.2) !important;
}
</style>
