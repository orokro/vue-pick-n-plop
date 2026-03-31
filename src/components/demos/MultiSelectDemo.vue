<!--
	MultiSelectDemo.vue
	-------------------

	Demonstrates groupCtx multi-select drag:
	  - Click cards to toggle selection (shift-click range-selects within a column)
	  - Drag a selected card → drags the whole selection (groupCtx = selected array)
	  - Drag an unselected card → single drag; selection is cleared
	  - showGroupCount: true puts the red count badge on the clone ghost
	  - onDropped receives groupCtx as 3rd param; all selected items move together
-->
<script setup>
import { ref, computed } from 'vue';

/** @typedef {{ id: number, label: string, assignee: string, priority: 'low'|'medium'|'high', column: 'backlog'|'sprint'|'done' }} Task */

/** @type {Task[]} */
const tasks = ref([
	{ id: 1,  label: 'Design system tokens',     assignee: 'Alice', priority: 'high',   column: 'backlog' },
	{ id: 2,  label: 'Auth flow refactor',        assignee: 'Bob',   priority: 'high',   column: 'backlog' },
	{ id: 3,  label: 'Onboarding copy review',    assignee: 'Carol', priority: 'medium', column: 'backlog' },
	{ id: 4,  label: 'Fix mobile nav overflow',   assignee: 'Alice', priority: 'medium', column: 'backlog' },
	{ id: 5,  label: 'Dashboard chart tooltips',  assignee: 'Dave',  priority: 'low',    column: 'backlog' },
	{ id: 6,  label: 'Accessibility audit',       assignee: 'Carol', priority: 'high',   column: 'backlog' },
	{ id: 7,  label: 'API rate-limit handling',   assignee: 'Bob',   priority: 'medium', column: 'sprint'  },
	{ id: 8,  label: 'Email template polish',     assignee: 'Dave',  priority: 'low',    column: 'sprint'  },
	{ id: 9,  label: 'Unit tests — auth module',  assignee: 'Alice', priority: 'high',   column: 'sprint'  },
	{ id: 10, label: 'Release notes draft',       assignee: 'Carol', priority: 'low',    column: 'done'    },
	{ id: 11, label: 'Perf profiling',            assignee: 'Bob',   priority: 'medium', column: 'done'    },
]);

/** @type {import('vue').Ref<Set<number>>} */
const selectedIds = ref(new Set());

/** @type {import('vue').Ref<number|null>} */
const lastClickedId = ref(null);

/** @param {string} col */
const tasksIn = (col) => tasks.value.filter(t => t.column === col);

/** @param {number} id */
const isSelected = (id) => selectedIds.value.has(id);

/**
 * Toggle selection on click. Shift+click range-selects within the same column.
 *
 * @param {Task} task
 * @param {MouseEvent} event
 */
const toggleSelect = (task, event) => {
	const col = task.column;
	const colTasks = tasksIn(col);

	if (event.shiftKey && lastClickedId.value !== null) {
		const lastTask = tasks.value.find(t => t.id === lastClickedId.value);
		if (lastTask && lastTask.column === col) {
			const indices = colTasks.map(t => t.id);
			const a = indices.indexOf(lastClickedId.value);
			const b = indices.indexOf(task.id);
			const [lo, hi] = a < b ? [a, b] : [b, a];
			const next = new Set(selectedIds.value);
			for (let i = lo; i <= hi; i++) next.add(indices[i]);
			selectedIds.value = next;
			return;
		}
	}

	const next = new Set(selectedIds.value);
	if (next.has(task.id)) {
		next.delete(task.id);
	} else {
		next.add(task.id);
	}
	selectedIds.value = next;
	lastClickedId.value = task.id;
};

/**
 * Returns the draggable options for a task card.
 * If the task is selected, groupCtx = full selection array (enables multi-drag).
 * If not selected, clears selection and drags just that one card.
 *
 * @param {Task} task
 * @returns {Object}
 */
const draggableOpts = (task) => {
	const inSelection = isSelected(task.id);
	const group = inSelection
		? tasks.value.filter(t => selectedIds.value.has(t.id))
		: null;

	return {
		keys: 'task',
		ctx: task,
		groupCtx: group,
		dragItem: 'clone',
		showGroupCount: true,
		onDragStart: () => {
			if (!inSelection) selectedIds.value = new Set();
		},
	};
};

const COLUMNS = [
	{ id: 'backlog', label: 'Backlog',     color: '#6c757d' },
	{ id: 'sprint',  label: 'Sprint',      color: '#0d6efd' },
	{ id: 'done',    label: 'Done',        color: '#198754' },
];

/** @type {import('vue').Ref<Array<{ id: number, toColumn: string, count: number, ts: number }>>} */
const eventLog = ref([]);

/**
 * Drop handler — moves the dragged task (or all selected tasks) to the target column.
 *
 * @param {Task} dragCtx
 * @param {{ id: string }} dropCtx
 * @param {Task[]|null} groupCtx
 */
const handleDrop = (dragCtx, dropCtx, groupCtx) => {
	const targetCol = dropCtx.id;
	const toMove = groupCtx ? groupCtx.map(t => t.id) : [dragCtx.id];

	tasks.value = tasks.value.map(t =>
		toMove.includes(t.id) ? { ...t, column: targetCol } : t
	);

	const col = COLUMNS.find(c => c.id === targetCol);
	eventLog.value.unshift({
		id: Date.now(),
		toColumn: col?.label ?? targetCol,
		count: toMove.length,
		labels: toMove.map(id => tasks.value.find(t => t.id === id)?.label ?? '').slice(0, 3),
		ts: Date.now(),
	});
	if (eventLog.value.length > 8) eventLog.value.pop();

	selectedIds.value = new Set();
};

/** @param {number} ts */
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const priorityColor = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' };
const priorityLabel = { high: 'High', medium: 'Med', low: 'Low' };
</script>

<template>
	<div class="demo-wrap">
		<div class="demo-header">
			<h2>Multi-Select Drag</h2>
			<p>Click cards to select them, then drag any selected card to move them all. Shift-click to range-select within a column. Drag an unselected card to move just that one.</p>
		</div>

		<div class="demo-body">
			<div class="board">
				<div
					v-for="col in COLUMNS"
					:key="col.id"
					class="column"
				>
					<div class="col-header" :style="{ '--col-color': col.color }">
						<span class="col-title">{{ col.label }}</span>
						<span class="col-count">{{ tasksIn(col.id).length }}</span>
					</div>

					<div
						v-pnp-dropzone="{
							keys: 'task',
							ctx: { id: col.id },
							onDropped: handleDrop,
						}"
						class="col-body"
					>
						<div
							v-for="task in tasksIn(col.id)"
							:key="task.id"
							v-pnp-draggable="draggableOpts(task)"
							class="task-card"
							:class="{
								'is-selected': isSelected(task.id),
								[`priority-${task.priority}`]: true,
							}"
							@click="toggleSelect(task, $event)"
						>
							<div class="card-top">
								<span class="card-label">{{ task.label }}</span>
								<span
									class="priority-dot"
									:style="{ background: priorityColor[task.priority] }"
									:title="priorityLabel[task.priority] + ' priority'"
								></span>
							</div>
							<div class="card-meta">
								<span class="assignee">{{ task.assignee }}</span>
								<span class="priority-tag" :style="{ color: priorityColor[task.priority] }">{{ priorityLabel[task.priority] }}</span>
							</div>
							<div v-if="isSelected(task.id)" class="selected-indicator" aria-hidden="true">✓</div>
						</div>

						<div v-if="tasksIn(col.id).length === 0" class="empty-col">
							Drop here
						</div>
					</div>
				</div>
			</div>

			<!-- Selection bar -->
			<div class="selection-bar" :class="{ visible: selectedIds.size > 0 }">
				<span class="sel-count">{{ selectedIds.size }} card{{ selectedIds.size === 1 ? '' : 's' }} selected</span>
				<button class="sel-clear" @click="selectedIds = new Set()">Clear</button>
			</div>

			<!-- Event log -->
			<div class="log-panel" v-if="eventLog.length > 0">
				<div class="log-title">Drop Log</div>
				<transition-group name="log" tag="div" class="log-list">
					<div v-for="entry in eventLog" :key="entry.id" class="log-entry">
						<span class="log-time">{{ fmtTime(entry.ts) }}</span>
						<span class="log-msg">
							Moved <strong>{{ entry.count }}</strong> card{{ entry.count === 1 ? '' : 's' }} → <strong>{{ entry.toColumn }}</strong>
							<span v-if="entry.count <= 3" class="log-labels">
								({{ entry.labels.join(', ') }})
							</span>
						</span>
					</div>
				</transition-group>
			</div>
		</div>
	</div>
</template>

<style scoped>
.demo-wrap {
	padding: 2rem;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.demo-header h2 {
	font-size: 1.3rem;
	font-weight: 700;
	color: #1a1a2e;
	margin-bottom: 0.35rem;
}

.demo-header p {
	font-size: 0.85rem;
	color: #666;
	max-width: 600px;
	line-height: 1.5;
}

/* ── Board ────────────────────────────────────── */
.board {
	display: flex;
	gap: 1.25rem;
	align-items: flex-start;
}

.column {
	flex: 1;
	min-width: 220px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 1px 4px rgba(0,0,0,0.08);
	overflow: hidden;
}

.col-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem 1rem;
	border-bottom: 3px solid var(--col-color);
	background: #fafafa;
}

.col-title {
	font-weight: 700;
	font-size: 0.88rem;
	color: #2c3e50;
}

.col-count {
	background: #e9ecef;
	color: #666;
	font-size: 0.72rem;
	font-weight: 700;
	padding: 2px 7px;
	border-radius: 10px;
}

.col-body {
	padding: 0.65rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	min-height: 80px;
}

/* ── Task cards ───────────────────────────────── */
.task-card {
	position: relative;
	background: #fff;
	border: 2px solid #e9ecef;
	border-radius: 8px;
	padding: 0.6rem 0.75rem;
	cursor: pointer;
	user-select: none;
	transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.task-card:hover {
	border-color: #b0b8d0;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.task-card.is-selected {
	border-color: #4a90d9;
	background: #f0f7ff;
	box-shadow: 0 0 0 3px rgba(74,144,217,0.18);
}

.card-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.5rem;
	margin-bottom: 0.35rem;
}

.card-label {
	font-size: 0.82rem;
	font-weight: 600;
	color: #2c3e50;
	line-height: 1.3;
}

.priority-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
	margin-top: 3px;
}

.card-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.assignee {
	font-size: 0.72rem;
	color: #888;
}

.priority-tag {
	font-size: 0.68rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.selected-indicator {
	position: absolute;
	top: 6px;
	left: 8px;
	font-size: 0.65rem;
	font-weight: 900;
	color: #4a90d9;
	line-height: 1;
}

.empty-col {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 60px;
	color: #bbb;
	font-size: 0.8rem;
	font-style: italic;
	border: 2px dashed #e0e0e0;
	border-radius: 8px;
}

/* Dropzone hover states */
:deep(.pnp-dropzone-valid) {
	outline: 2px dashed #4a90d9;
	outline-offset: -2px;
	border-radius: 6px;
}

:deep(.pnp-dropzone-hovered) {
	background: #e8f4fd;
}

/* ── Selection bar ────────────────────────────── */
.selection-bar {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.6rem 1rem;
	background: #1a1a2e;
	border-radius: 10px;
	color: #fff;
	font-size: 0.85rem;
	opacity: 0;
	transform: translateY(6px);
	pointer-events: none;
	transition: opacity 0.2s, transform 0.2s;
}

.selection-bar.visible {
	opacity: 1;
	transform: translateY(0);
	pointer-events: auto;
}

.sel-count {
	font-weight: 600;
}

.sel-clear {
	background: rgba(255,255,255,0.12);
	border: 1px solid rgba(255,255,255,0.2);
	color: #fff;
	font-size: 0.78rem;
	padding: 3px 10px;
	border-radius: 5px;
	cursor: pointer;
	transition: background 0.15s;
}

.sel-clear:hover {
	background: rgba(255,255,255,0.22);
}

/* ── Event log ────────────────────────────────── */
.log-panel {
	background: #fff;
	border-radius: 10px;
	box-shadow: 0 1px 4px rgba(0,0,0,0.07);
	padding: 0.85rem 1rem;
}

.log-title {
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.8px;
	color: #aaa;
	margin-bottom: 0.5rem;
}

.log-list {
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
}

.log-entry {
	display: flex;
	align-items: baseline;
	gap: 0.7rem;
	font-size: 0.82rem;
	color: #444;
}

.log-time {
	color: #aaa;
	font-size: 0.75rem;
	flex-shrink: 0;
}

.log-labels {
	color: #888;
	font-size: 0.78rem;
}

.log-enter-active { transition: all 0.2s ease; }
.log-enter-from   { opacity: 0; transform: translateY(-6px); }
</style>
