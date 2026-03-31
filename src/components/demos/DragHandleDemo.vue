<!--
	DragHandleDemo.vue
	------------------

	Demonstrates v-pnp-draghandle and the requireHandle option on v-pnp-draggable.

	Two groups of source items:
	  - "Drag Anywhere": whole card initiates drag (default behavior, no handles).
	  - "Handle Only": only the ⠿ grip icon initiates drag; clicking the card title,
	    description, or the action button does nothing drag-related.

	Both groups share two destination columns. Items in columns can be dragged to the
	other column or back to the source tray.
-->
<script setup>
import { reactive, computed, ref } from 'vue';

/**
 * @typedef {{ id: number, emoji: string, label: string, sub: string, type: 'simple'|'rich' }} Task
 */

/** @type {Task[]} */
const tasks = [
	// Simple items — whole card is the drag surface
	{ id: 1, emoji: '📦', label: 'Shipping update',    sub: 'Logistics',   type: 'simple' },
	{ id: 2, emoji: '📣', label: 'Campaign launch',    sub: 'Marketing',   type: 'simple' },
	{ id: 3, emoji: '🔒', label: 'Security audit',     sub: 'Infra',       type: 'simple' },
	{ id: 4, emoji: '🎨', label: 'Brand refresh',      sub: 'Design',      type: 'simple' },

	// Rich items — only the grip handle initiates drag
	{ id: 5, emoji: '📝', label: 'Q3 retrospective',   sub: 'Engineering', type: 'rich' },
	{ id: 6, emoji: '🚀', label: 'v2.0 release prep',  sub: 'Product',     type: 'rich' },
	{ id: 7, emoji: '🐛', label: 'Fix login timeout',  sub: 'Backend',     type: 'rich' },
	{ id: 8, emoji: '📊', label: 'KPI dashboard',      sub: 'Analytics',   type: 'rich' },
];

/**
 * Tracks each task's current location.
 * null = source tray, 'active' = Active column, 'done' = Done column.
 * @type {Record<number, string|null>}
 */
const taskLocations = reactive({});
tasks.forEach(t => { taskLocations[t.id] = null; });

/** Tasks in the source tray */
const trayTasks = computed(() => tasks.filter(t => taskLocations[t.id] === null));

/**
 * Tasks in a given column.
 * Called in template; Vue tracks the reactive dependency automatically.
 * @param {string} colId
 * @returns {Task[]}
 */
const tasksInCol = (colId) => tasks.filter(t => taskLocations[t.id] === colId);

/**
 * Shared drop handler for source tray and both columns.
 * @param {{ id: number }} dragCtx
 * @param {{ colId: string|null }} dropCtx
 */
const handleDrop = (dragCtx, dropCtx) => {
	taskLocations[dragCtx.id] = dropCtx.colId;
};

/** Resets all tasks back to the source tray. */
const reset = () => { tasks.forEach(t => { taskLocations[t.id] = null; }); };

/**
 * Tracks which task id is currently showing the "use the handle" nudge.
 * Cleared after a short timeout.
 * @type {import('vue').Ref<number|null>}
 */
const nudgeId = ref(null);
let nudgeTimer = null;

/**
 * Shows a brief visual nudge when the user clicks the body of a handle-only card.
 * Attached to the card body via @mousedown.
 * @param {number} id
 * @param {MouseEvent} event
 */
const onRichCardBodyClick = (id, event) => {
	// Only react to direct clicks on the card, not on the grip handle itself.
	// The handle has v-pnp-draghandle so this handler won't fire from there anyway,
	// but check the class to keep it clean.
	if (event.target.closest('.grip')) return;
	clearTimeout(nudgeTimer);
	nudgeId.value = id;
	nudgeTimer = setTimeout(() => { nudgeId.value = null; }, 900);
};
</script>

<template>
	<div class="handle-demo">

		<div class="demo-header">
			<div class="demo-title-block">
				<h2>Drag Handle Demo</h2>
				<p>
					<strong>Drag Anywhere</strong> cards use the default behavior — click anywhere on
					the card to start dragging. <strong>Handle Only</strong> cards use
					<code>v-pnp-draghandle</code> with <code>requireHandle: true</code> — only the
					<span class="inline-grip">⠿</span> icon on the left initiates a drag.
					Try clicking the title, description, or button on a Handle Only card — nothing happens.
				</p>
			</div>
			<button class="reset-btn" @click="reset">↩ Reset</button>
		</div>

		<div class="demo-body">

			<!-- ── Source Tray ──────────────────────────────────── -->
			<div class="source-panel">

				<section class="item-group">
					<div class="group-label">
						<span class="group-badge anywhere">Drag Anywhere</span>
						<span class="group-hint">Click anywhere on the card to drag</span>
					</div>

					<div
						v-pnp-dropzone="{
							keys: 'task-simple',
							ctx: { colId: null },
							onDropped: handleDrop,
						}"
						class="group-items"
					>
						<div
							v-for="task in trayTasks.filter(t => t.type === 'simple')"
							:key="task.id"
							v-pnp-draggable="{
								keys: 'task-simple|task',
								ctx: { id: task.id },
								dragItem: 'clone',
								highlight: 'on-start',
							}"
							class="simple-card"
						>
							<span class="card-emoji">{{ task.emoji }}</span>
							<div class="card-text">
								<span class="card-label">{{ task.label }}</span>
								<span class="card-sub">{{ task.sub }}</span>
							</div>
						</div>
						<div v-if="trayTasks.filter(t => t.type === 'simple').length === 0" class="empty-tray">
							All placed
						</div>
					</div>
				</section>

				<section class="item-group">
					<div class="group-label">
						<span class="group-badge handle-only">Handle Only</span>
						<span class="group-hint">Only the <strong>⠿</strong> grip initiates drag</span>
					</div>

					<div
						v-pnp-dropzone="{
							keys: 'task-rich',
							ctx: { colId: null },
							onDropped: handleDrop,
						}"
						class="group-items"
					>
						<div
							v-for="task in trayTasks.filter(t => t.type === 'rich')"
							:key="task.id"
							v-pnp-draggable="{
								keys: 'task-rich|task',
								ctx: { id: task.id },
								dragItem: 'clone',
								highlight: 'on-start',
								requireHandle: true,
							}"
							class="rich-card"
							:class="{ nudge: nudgeId === task.id }"
							@mousedown="onRichCardBodyClick(task.id, $event)"
						>
							<!-- This element IS the drag handle -->
							<div v-pnp-draghandle class="grip" title="Drag from here">⠿</div>

							<div class="rich-card-content">
								<div class="rich-card-top">
									<span class="card-emoji">{{ task.emoji }}</span>
									<div class="card-text">
										<span class="card-label">{{ task.label }}</span>
										<span class="card-sub">{{ task.sub }}</span>
									</div>
								</div>
								<button class="card-action" @click.stop @mousedown.stop>
									View details
								</button>
							</div>

							<Transition name="nudge-tip">
								<div v-if="nudgeId === task.id" class="nudge-tip">
									👈 Use the grip to drag
								</div>
							</Transition>
						</div>
						<div v-if="trayTasks.filter(t => t.type === 'rich').length === 0" class="empty-tray">
							All placed
						</div>
					</div>
				</section>
			</div>

			<!-- ── Destination Columns ──────────────────────────── -->
			<div class="columns">

				<div class="column">
					<div class="column-header active-header">
						<span>🔥 Active</span>
						<span class="col-count" v-if="tasksInCol('active').length">
							{{ tasksInCol('active').length }}
						</span>
					</div>
					<div
						v-pnp-dropzone="{
							keys: 'task',
							ctx: { colId: 'active' },
							onDropped: handleDrop,
						}"
						class="column-body"
					>
						<!-- Simple tasks dropped here -->
						<div
							v-for="task in tasksInCol('active').filter(t => t.type === 'simple')"
							:key="task.id"
							v-pnp-draggable="{
								keys: 'task-simple|task',
								ctx: { id: task.id },
								dragItem: 'clone',
								highlight: 'on-start',
							}"
							class="simple-card in-col"
						>
							<span class="card-emoji">{{ task.emoji }}</span>
							<div class="card-text">
								<span class="card-label">{{ task.label }}</span>
								<span class="card-sub">{{ task.sub }}</span>
							</div>
						</div>

						<!-- Rich tasks dropped here -->
						<div
							v-for="task in tasksInCol('active').filter(t => t.type === 'rich')"
							:key="task.id"
							v-pnp-draggable="{
								keys: 'task-rich|task',
								ctx: { id: task.id },
								dragItem: 'clone',
								highlight: 'on-start',
								requireHandle: true,
							}"
							class="rich-card in-col"
							:class="{ nudge: nudgeId === task.id }"
							@mousedown="onRichCardBodyClick(task.id, $event)"
						>
							<div v-pnp-draghandle class="grip" title="Drag from here">⠿</div>
							<div class="rich-card-content">
								<div class="rich-card-top">
									<span class="card-emoji">{{ task.emoji }}</span>
									<div class="card-text">
										<span class="card-label">{{ task.label }}</span>
										<span class="card-sub">{{ task.sub }}</span>
									</div>
								</div>
								<button class="card-action" @click.stop @mousedown.stop>View details</button>
							</div>
							<Transition name="nudge-tip">
								<div v-if="nudgeId === task.id" class="nudge-tip">👈 Use the grip</div>
							</Transition>
						</div>

						<div v-if="tasksInCol('active').length === 0" class="col-empty">
							Drop tasks here
						</div>
					</div>
				</div>

				<div class="column">
					<div class="column-header done-header">
						<span>✅ Done</span>
						<span class="col-count" v-if="tasksInCol('done').length">
							{{ tasksInCol('done').length }}
						</span>
					</div>
					<div
						v-pnp-dropzone="{
							keys: 'task',
							ctx: { colId: 'done' },
							onDropped: handleDrop,
						}"
						class="column-body"
					>
						<div
							v-for="task in tasksInCol('done').filter(t => t.type === 'simple')"
							:key="task.id"
							v-pnp-draggable="{
								keys: 'task-simple|task',
								ctx: { id: task.id },
								dragItem: 'clone',
								highlight: 'on-start',
							}"
							class="simple-card in-col"
						>
							<span class="card-emoji">{{ task.emoji }}</span>
							<div class="card-text">
								<span class="card-label">{{ task.label }}</span>
								<span class="card-sub">{{ task.sub }}</span>
							</div>
						</div>

						<div
							v-for="task in tasksInCol('done').filter(t => t.type === 'rich')"
							:key="task.id"
							v-pnp-draggable="{
								keys: 'task-rich|task',
								ctx: { id: task.id },
								dragItem: 'clone',
								highlight: 'on-start',
								requireHandle: true,
							}"
							class="rich-card in-col"
							:class="{ nudge: nudgeId === task.id }"
							@mousedown="onRichCardBodyClick(task.id, $event)"
						>
							<div v-pnp-draghandle class="grip" title="Drag from here">⠿</div>
							<div class="rich-card-content">
								<div class="rich-card-top">
									<span class="card-emoji">{{ task.emoji }}</span>
									<div class="card-text">
										<span class="card-label">{{ task.label }}</span>
										<span class="card-sub">{{ task.sub }}</span>
									</div>
								</div>
								<button class="card-action" @click.stop @mousedown.stop>View details</button>
							</div>
							<Transition name="nudge-tip">
								<div v-if="nudgeId === task.id" class="nudge-tip">👈 Use the grip</div>
							</Transition>
						</div>

						<div v-if="tasksInCol('done').length === 0" class="col-empty">
							Drop tasks here
						</div>
					</div>
				</div>

			</div>
		</div>
	</div>
</template>

<style scoped>
.handle-demo {
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

/* Header */
.demo-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
}

.demo-title-block h2 {
	margin: 0 0 0.5rem;
	font-size: 1.4rem;
	color: #1a1a2e;
}

.demo-title-block p {
	margin: 0;
	color: #555;
	font-size: 0.9rem;
	line-height: 1.6;
	max-width: 720px;
}

.demo-title-block code {
	background: #f0f0f0;
	padding: 1px 5px;
	border-radius: 4px;
	font-size: 0.85em;
	color: #c0392b;
}

.inline-grip {
	font-family: monospace;
	font-size: 1.1em;
	font-weight: 700;
	color: #555;
}

.reset-btn {
	flex-shrink: 0;
	padding: 0.5rem 1.2rem;
	border: 1px solid #ccc;
	border-radius: 8px;
	background: white;
	cursor: pointer;
	font-size: 0.88rem;
	transition: background 0.15s, border-color 0.15s;
	white-space: nowrap;
}

.reset-btn:hover {
	background: #f0f0f0;
	border-color: #999;
}

/* Demo body layout: source panel left, columns right */
.demo-body {
	display: grid;
	grid-template-columns: 360px 1fr;
	gap: 1.5rem;
	align-items: start;
}

/* ── Source Panel ──────────────────────────────────────── */
.source-panel {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.item-group {
	background: white;
	border-radius: 12px;
	border: 1px solid #e4e4e4;
	padding: 1rem;
	box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

.group-label {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	margin-bottom: 0.75rem;
}

.group-badge {
	font-size: 0.68rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	padding: 3px 8px;
	border-radius: 99px;
	color: white;
}

.group-badge.anywhere {
	background: #2980b9;
}

.group-badge.handle-only {
	background: #8e44ad;
}

.group-hint {
	font-size: 0.75rem;
	color: #999;
}

.group-items {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	min-height: 48px;
	border-radius: 8px;
	padding: 0.25rem;
	transition: background 0.2s;
}

.group-items.pnp-dropzone-hovered {
	background: #f5f0ff;
}

.empty-tray {
	color: #ccc;
	font-size: 0.8rem;
	font-style: italic;
	text-align: center;
	padding: 0.75rem 0;
}

/* ── Simple Cards ──────────────────────────────────────── */
.simple-card {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	padding: 0.6rem 0.75rem;
	background: #f8f9ff;
	border: 1px solid #dde3f0;
	border-radius: 8px;
	cursor: grab;
	user-select: none;
	transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.simple-card:hover {
	transform: translateX(2px);
	box-shadow: 0 2px 8px rgba(41,128,185,0.12);
	border-color: #aac4e8;
}

.simple-card:active {
	cursor: grabbing;
}

.simple-card.in-col {
	background: white;
}

/* ── Rich Cards ──────────────────────────────────────────── */
.rich-card {
	display: flex;
	align-items: stretch;
	background: white;
	border: 1px solid #e0d0f0;
	border-radius: 8px;
	overflow: hidden;
	user-select: none;
	transition: box-shadow 0.15s, border-color 0.15s;
	position: relative;
	cursor: default;
}

.rich-card:hover {
	box-shadow: 0 2px 8px rgba(142,68,173,0.1);
	border-color: #c9a8e8;
}

/* Shake animation when clicking the body of a handle-required card */
.rich-card.nudge {
	animation: shake 0.35s ease;
}

@keyframes shake {
	0%   { transform: translateX(0); }
	20%  { transform: translateX(-4px); }
	40%  { transform: translateX(4px); }
	60%  { transform: translateX(-3px); }
	80%  { transform: translateX(3px); }
	100% { transform: translateX(0); }
}

/* The drag grip handle */
.grip {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	flex-shrink: 0;
	background: #f3eafc;
	color: #9b59b6;
	font-size: 1.1rem;
	cursor: grab;
	border-right: 1px solid #e0d0f0;
	transition: background 0.15s;
	letter-spacing: -1px;
}

.grip:hover {
	background: #e8d5f8;
}

.grip:active {
	cursor: grabbing;
}

.rich-card-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 0.55rem 0.75rem;
	gap: 0.45rem;
	min-width: 0;
}

.rich-card-top {
	display: flex;
	align-items: center;
	gap: 0.6rem;
}

/* Action button — fully interactive, does not start drag */
.card-action {
	align-self: flex-start;
	font-size: 0.7rem;
	padding: 2px 10px;
	border: 1px solid #d0b8e8;
	border-radius: 99px;
	background: white;
	color: #8e44ad;
	cursor: pointer;
	transition: background 0.12s, border-color 0.12s;
}

.card-action:hover {
	background: #f3eafc;
	border-color: #9b59b6;
}

/* Tooltip nudge */
.nudge-tip {
	position: absolute;
	bottom: calc(100% + 6px);
	left: 50%;
	transform: translateX(-50%);
	background: #2c3e50;
	color: white;
	font-size: 0.72rem;
	padding: 4px 10px;
	border-radius: 6px;
	white-space: nowrap;
	pointer-events: none;
	z-index: 10;
}

.nudge-tip::after {
	content: '';
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	border: 5px solid transparent;
	border-top-color: #2c3e50;
}

.nudge-tip-enter-active,
.nudge-tip-leave-active {
	transition: opacity 0.15s, transform 0.15s;
}

.nudge-tip-enter-from,
.nudge-tip-leave-to {
	opacity: 0;
	transform: translateX(-50%) translateY(4px);
}

/* Shared card text styles */
.card-emoji {
	font-size: 1.3rem;
	flex-shrink: 0;
}

.card-text {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.card-label {
	font-size: 0.83rem;
	font-weight: 600;
	color: #1a1a2e;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.card-sub {
	font-size: 0.7rem;
	color: #999;
}

/* ── Destination Columns ─────────────────────────────────── */
.columns {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	align-items: start;
}

.column {
	border-radius: 12px;
	overflow: hidden;
	border: 1px solid #e4e4e4;
	background: white;
	box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

.column-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem 1rem;
	font-weight: 700;
	font-size: 0.88rem;
}

.active-header {
	background: #fff3e0;
	border-bottom: 1px solid #ffe0b2;
	color: #e65100;
}

.done-header {
	background: #e8f5e9;
	border-bottom: 1px solid #c8e6c9;
	color: #2e7d32;
}

.col-count {
	background: currentColor;
	color: white;
	font-size: 0.65rem;
	padding: 1px 7px;
	border-radius: 99px;
	opacity: 0.85;
}

.column-body {
	padding: 0.75rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	min-height: 120px;
	transition: background 0.2s;
}

.column-body.pnp-dropzone-valid {
	background: #fafafa;
}

.column-body.pnp-dropzone-hovered {
	background: #f0faf0;
}

.col-empty {
	color: #ccc;
	font-size: 0.8rem;
	font-style: italic;
	text-align: center;
	padding: 1.5rem 0;
}
</style>
