<!--
	CancelModifiersDemo.vue
	-----------------------

	Demonstrates:
	  1. Modifier keys (shiftKey, ctrlKey, altKey, metaKey) passed to onDropped.
	     - Drop normally        → item moves to Processed
	     - Drop with Alt held   → item is COPIED (stays in Inbox too)
	     - Drop with Shift held → item moves and is flagged Urgent

	  2. Cancel mechanics (cancelKey & rightClickCancel) configurable live via
	     the settings panel. Toggle them and then try dragging.

	  3. A mid-drag banner appears using usePNPDragging() that shows active
	     cancel shortcuts based on current config.
-->
<script setup>
import { ref, reactive, computed } from 'vue';
import { usePNPDragging } from '../../pnp-lib/usePNPDragging';

const pnp = usePNPDragging();

// ── Config panel (mirrors manager._config reactively) ─────────────────
const config = reactive({
	cancelKey: 'Escape',
	rightClickCancel: true,
});

/**
 * Applies the current config panel state to the manager.
 * Called whenever a toggle changes.
 */
const applyConfig = () => {
	pnp.setOptions({
		cancelKey: config.cancelKey || null,
		rightClickCancel: config.rightClickCancel,
	});
};

// ── Demo data ─────────────────────────────────────────────────────────

/**
 * @typedef {{ id: number, emoji: string, label: string, from: string }} InboxItem
 */

/** @type {InboxItem[]} */
const ITEMS = [
	{ id: 1, emoji: '📧', label: 'New user signup',      from: 'auth-service' },
	{ id: 2, emoji: '🐛', label: 'Login timeout bug',    from: 'support' },
	{ id: 3, emoji: '💬', label: 'Billing question',     from: 'customer' },
	{ id: 4, emoji: '📊', label: 'Weekly metrics ready', from: 'analytics' },
	{ id: 5, emoji: '🔔', label: 'Disk usage at 85%',    from: 'monitoring' },
	{ id: 6, emoji: '🚀', label: 'Deploy approved',      from: 'ci-pipeline' },
];

/**
 * Tracks each inbox item's presence state.
 * An item can simultaneously be in the inbox AND in processed (copy mode).
 * @type {Record<number, { inInbox: boolean, inProcessed: boolean, urgent: boolean }>}
 */
const itemState = reactive({});
ITEMS.forEach(item => {
	itemState[item.id] = { inInbox: true, inProcessed: false, urgent: false };
});

const inboxItems    = computed(() => ITEMS.filter(i => itemState[i.id].inInbox));
const processedItems = computed(() => ITEMS.filter(i => itemState[i.id].inProcessed));

// ── Last drop result ──────────────────────────────────────────────────

/**
 * @typedef {{ item: InboxItem|null, mode: string, modifiers: object, cancelled: boolean }} DropResult
 */

/** @type {import('vue').Ref<DropResult>} */
const lastResult = ref({ item: null, mode: '', modifiers: {}, cancelled: false });

// ── Drag event log ───────────────────────────────────────────────────

/** @type {import('vue').Ref<Array<{ emoji: string, text: string, ts: string }>>} */
const log = ref([]);

/**
 * Pushes an entry into the event log.
 * @param {string} emoji
 * @param {string} text
 */
const addLog = (emoji, text) => {
	log.value.unshift({
		emoji,
		text,
		ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
	});
	if (log.value.length > 8) log.value.pop();
};

// ── Drop handler ─────────────────────────────────────────────────────

/**
 * Handles an item being dropped onto the Processed zone.
 * Modifier key semantics:
 *   Alt   → copy:   item stays in inbox AND appears in processed
 *   Shift → urgent: item moves and is marked urgent
 *   none  → move:   item leaves inbox, appears in processed
 *
 * @param {{ id: number }} dragCtx
 * @param {Object} _dropCtx
 * @param {Array|null} _groupCtx
 * @param {{ altKey: boolean, shiftKey: boolean }} modifiers
 */
const handleDrop = (dragCtx, _dropCtx, _groupCtx, modifiers) => {
	const item = ITEMS.find(i => i.id === dragCtx.id);
	if (!item) return;

	let mode;

	if (modifiers.altKey) {
		// Copy — item stays in both places
		itemState[item.id].inProcessed = true;
		mode = 'COPY';
	} else if (modifiers.shiftKey) {
		// Urgent move
		itemState[item.id].inInbox = false;
		itemState[item.id].inProcessed = true;
		itemState[item.id].urgent = true;
		mode = 'URGENT';
	} else {
		// Normal move
		itemState[item.id].inInbox = false;
		itemState[item.id].inProcessed = true;
		mode = 'MOVE';
	}

	lastResult.value = { item, mode, modifiers: { ...modifiers }, cancelled: false };
	addLog(item.emoji, `${item.label} → ${mode}`);
};

/**
 * Tracks cancelled drags via the draggable's onDropped(success=false) callback.
 * @param {boolean} success
 * @param {{ id: number }} dragCtx
 */
const handleDragResult = (success, dragCtx) => {
	if (!success) {
		const item = ITEMS.find(i => i.id === dragCtx.id);
		lastResult.value = { item: item || null, mode: 'CANCELLED', modifiers: {}, cancelled: true };
		if (item) addLog('❌', `${item.label} → cancelled`);
	}
};

/** Resets all items to their initial state and clears the log. */
const reset = () => {
	ITEMS.forEach(item => {
		itemState[item.id] = { inInbox: true, inProcessed: false, urgent: false };
	});
	lastResult.value = { item: null, mode: '', modifiers: {}, cancelled: false };
	log.value = [];
};

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Returns a human-readable label for a modifier combination.
 * @param {object} mods
 * @returns {string}
 */
const modLabel = (mods) => {
	const held = [];
	if (mods.altKey)   held.push('Alt');
	if (mods.shiftKey) held.push('Shift');
	if (mods.ctrlKey)  held.push('Ctrl');
	if (mods.metaKey)  held.push('Meta');
	return held.length ? held.join(' + ') : 'none';
};
</script>

<template>
	<div class="cm-demo">

		<!-- Header -->
		<div class="demo-header">
			<div class="demo-title-block">
				<h2>Cancel &amp; Modifier Keys</h2>
				<p>
					Drop items onto <strong>Processed</strong> — behaviour changes based on held keys.
					Use the config panel to toggle cancel shortcuts, then try them live.
				</p>
			</div>
			<button class="reset-btn" @click="reset">↩ Reset</button>
		</div>

		<!-- Config panel -->
		<div class="config-panel">
			<span class="config-label">⚙️ Manager Config</span>

			<label class="toggle-row">
				<span class="toggle-name">Cancel key</span>
				<select
					v-model="config.cancelKey"
					class="key-select"
					@change="applyConfig"
				>
					<option value="Escape">Escape</option>
					<option value="">Off</option>
				</select>
			</label>

			<label class="toggle-row">
				<input
					type="checkbox"
					v-model="config.rightClickCancel"
					@change="applyConfig"
				/>
				<span class="toggle-name">Right-click cancels drag</span>
			</label>

			<div class="config-hint">
				Changes take effect on the next drag.
			</div>
		</div>

		<!-- Mid-drag banner — only visible while a drag is active -->
		<Transition name="banner">
			<div v-if="pnp.isDragging.value" class="drag-banner">
				<span class="banner-icon">🖱️</span>
				<span>Dragging…</span>
				<span v-if="config.cancelKey" class="banner-tip">
					Press <kbd>{{ config.cancelKey }}</kbd> to cancel
				</span>
				<span v-if="config.rightClickCancel" class="banner-tip">
					Right-click to cancel
				</span>
				<span class="banner-tip mods">
					Hold <kbd>Alt</kbd> to copy &nbsp;·&nbsp; <kbd>Shift</kbd> for urgent
				</span>
			</div>
		</Transition>

		<div class="demo-columns">

			<!-- Inbox -->
			<div class="inbox-panel">
				<div class="panel-header inbox-header">
					<span>📬 Inbox</span>
					<span class="count-badge">{{ inboxItems.length }}</span>
				</div>

				<div
					v-pnp-dropzone="{
						keys: 'message',
						ctx: { zone: 'inbox' },
					}"
					class="item-list"
				>
					<div
						v-for="item in inboxItems"
						:key="item.id"
						v-pnp-draggable="{
							keys: 'message',
							ctx: { id: item.id },
							dragItem: 'clone',
							highlight: 'on-start',
							onDropped: handleDragResult,
						}"
						class="inbox-item"
					>
						<span class="item-emoji">{{ item.emoji }}</span>
						<div class="item-text">
							<span class="item-label">{{ item.label }}</span>
							<span class="item-from">from: {{ item.from }}</span>
						</div>
						<span
							v-if="itemState[item.id].inProcessed"
							class="copied-badge"
							title="Copy is in Processed"
						>📋</span>
					</div>

					<div v-if="inboxItems.length === 0" class="empty-list">
						Inbox empty!
					</div>
				</div>
			</div>

			<!-- Processed zone -->
			<div class="processed-panel">
				<div class="panel-header processed-header">
					<span>✅ Processed</span>
					<span class="count-badge">{{ processedItems.length }}</span>
				</div>

				<div
					v-pnp-dropzone="{
						keys: 'message',
						ctx: { zone: 'processed' },
						onDropped: handleDrop,
					}"
					class="item-list drop-target"
				>
					<div
						v-for="item in processedItems"
						:key="item.id"
						class="processed-item"
						:class="{ urgent: itemState[item.id].urgent }"
					>
						<span class="item-emoji">{{ item.emoji }}</span>
						<div class="item-text">
							<span class="item-label">{{ item.label }}</span>
							<span v-if="itemState[item.id].urgent" class="urgent-badge">🔴 URGENT</span>
						</div>
					</div>

					<div v-if="processedItems.length === 0" class="drop-hint">
						<div class="drop-hint-icon">⬇️</div>
						<div>Drop items here</div>
						<div class="drop-hint-sub">Hold Alt = copy &nbsp;·&nbsp; Shift = urgent</div>
					</div>
				</div>
			</div>

			<!-- Result & log -->
			<div class="log-panel">

				<div v-if="lastResult.item" class="result-card" :class="lastResult.cancelled ? 'result-cancel' : 'result-ok'">
					<div class="result-header">
						{{ lastResult.cancelled ? '❌ Cancelled' : '✅ Dropped' }}
					</div>
					<div class="result-row">
						<span class="result-key">Item</span>
						<span>{{ lastResult.item.emoji }} {{ lastResult.item.label }}</span>
					</div>
					<div class="result-row" v-if="!lastResult.cancelled">
						<span class="result-key">Mode</span>
						<span class="mode-badge" :class="lastResult.mode.toLowerCase()">
							{{ lastResult.mode }}
						</span>
					</div>
					<div class="result-row" v-if="!lastResult.cancelled">
						<span class="result-key">Modifiers</span>
						<span class="mods-held">{{ modLabel(lastResult.modifiers) }}</span>
					</div>
				</div>

				<div class="panel-header log-header">
					<span>📋 Event Log</span>
				</div>
				<div class="event-log">
					<div v-for="(entry, i) in log" :key="i" class="log-entry">
						<span class="log-ts">{{ entry.ts }}</span>
						<span class="log-emoji">{{ entry.emoji }}</span>
						<span class="log-text">{{ entry.text }}</span>
					</div>
					<div v-if="log.length === 0" class="empty-list">
						No events yet
					</div>
				</div>

			</div>
		</div>
	</div>
</template>

<style scoped>
.cm-demo {
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
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
	max-width: 680px;
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

.reset-btn:hover { background: #f0f0f0; border-color: #999; }

/* Config panel */
.config-panel {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	padding: 0.75rem 1.25rem;
	background: white;
	border: 1px solid #e4e4e4;
	border-radius: 10px;
	box-shadow: 0 2px 6px rgba(0,0,0,0.04);
	flex-wrap: wrap;
}

.config-label {
	font-size: 0.78rem;
	font-weight: 700;
	color: #666;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	flex-shrink: 0;
}

.toggle-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	font-size: 0.85rem;
	color: #333;
}

.toggle-name {
	user-select: none;
}

.key-select {
	font-size: 0.82rem;
	padding: 2px 6px;
	border: 1px solid #ccc;
	border-radius: 5px;
	background: white;
	cursor: pointer;
}

.config-hint {
	font-size: 0.72rem;
	color: #bbb;
	font-style: italic;
	margin-left: auto;
}

/* Mid-drag banner */
.drag-banner {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.65rem 1.25rem;
	background: #1a1a2e;
	color: white;
	border-radius: 10px;
	font-size: 0.85rem;
	flex-wrap: wrap;
}

.banner-icon { font-size: 1.1rem; }

.banner-tip {
	background: rgba(255,255,255,0.1);
	padding: 2px 10px;
	border-radius: 99px;
	font-size: 0.78rem;
}

.banner-tip.mods {
	background: rgba(255,255,255,0.07);
	margin-left: auto;
}

kbd {
	background: rgba(255,255,255,0.18);
	padding: 1px 6px;
	border-radius: 4px;
	font-family: monospace;
	font-size: 0.85em;
}

.banner-enter-active,
.banner-leave-active {
	transition: opacity 0.15s, transform 0.15s;
}
.banner-enter-from,
.banner-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

/* Demo columns */
.demo-columns {
	display: grid;
	grid-template-columns: 1fr 1fr 280px;
	gap: 1rem;
	align-items: start;
}

/* Panel shared styles */
.inbox-panel,
.processed-panel,
.log-panel {
	background: white;
	border-radius: 12px;
	border: 1px solid #e4e4e4;
	overflow: hidden;
	box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.7rem 1rem;
	font-weight: 700;
	font-size: 0.88rem;
}

.inbox-header {
	background: #e3f2fd;
	border-bottom: 1px solid #bbdefb;
	color: #1565c0;
}

.processed-header {
	background: #e8f5e9;
	border-bottom: 1px solid #c8e6c9;
	color: #2e7d32;
}

.log-header {
	background: #f5f5f5;
	border-bottom: 1px solid #e4e4e4;
	color: #555;
	font-size: 0.82rem;
}

.count-badge {
	background: currentColor;
	color: white;
	font-size: 0.65rem;
	padding: 1px 7px;
	border-radius: 99px;
	opacity: 0.75;
}

/* Item list */
.item-list {
	padding: 0.6rem;
	display: flex;
	flex-direction: column;
	gap: 0.45rem;
	min-height: 120px;
	transition: background 0.2s;
}

.item-list.drop-target.pnp-dropzone-valid {
	background: #f0faf0;
}

.item-list.drop-target.pnp-dropzone-hovered {
	background: #e0f4e0;
}

/* Inbox items */
.inbox-item {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.55rem 0.75rem;
	background: #f8f9ff;
	border: 1px solid #dde3f0;
	border-radius: 8px;
	cursor: grab;
	user-select: none;
	transition: transform 0.12s, box-shadow 0.12s;
}

.inbox-item:hover {
	transform: translateX(2px);
	box-shadow: 0 2px 8px rgba(21,101,192,0.1);
}

.inbox-item:active { cursor: grabbing; }

.item-emoji { font-size: 1.3rem; flex-shrink: 0; }

.item-text {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
}

.item-label {
	font-size: 0.83rem;
	font-weight: 600;
	color: #1a1a2e;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.item-from {
	font-size: 0.7rem;
	color: #aaa;
}

.copied-badge {
	font-size: 0.9rem;
	opacity: 0.6;
	flex-shrink: 0;
}

/* Processed items */
.processed-item {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.5rem 0.75rem;
	background: #f8fffe;
	border: 1px solid #c8e6c9;
	border-radius: 8px;
	font-size: 0.83rem;
}

.processed-item.urgent {
	background: #fff5f5;
	border-color: #ffcdd2;
}

.urgent-badge {
	font-size: 0.68rem;
	font-weight: 700;
	color: #c62828;
	text-transform: uppercase;
	letter-spacing: 0.3px;
}

.drop-hint {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.3rem;
	padding: 2rem 1rem;
	color: #bbb;
	font-size: 0.82rem;
	text-align: center;
}

.drop-hint-icon { font-size: 1.4rem; }
.drop-hint-sub  { font-size: 0.72rem; color: #ccc; }

.empty-list {
	color: #ccc;
	font-size: 0.8rem;
	font-style: italic;
	text-align: center;
	padding: 1.2rem 0;
}

/* Result card */
.result-card {
	margin: 0.75rem;
	padding: 0.75rem 1rem;
	border-radius: 8px;
	border: 1px solid;
	font-size: 0.82rem;
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.result-ok     { background: #f0faf0; border-color: #a5d6a7; }
.result-cancel { background: #fdf3f3; border-color: #ffcdd2; }

.result-header {
	font-weight: 700;
	font-size: 0.85rem;
	color: #333;
	margin-bottom: 0.15rem;
}

.result-row {
	display: flex;
	gap: 0.6rem;
	align-items: center;
}

.result-key {
	color: #999;
	min-width: 56px;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.4px;
}

.mode-badge {
	font-size: 0.7rem;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 99px;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	color: white;
}

.mode-badge.move   { background: #1565c0; }
.mode-badge.copy   { background: #6a1b9a; }
.mode-badge.urgent { background: #b71c1c; }

.mods-held {
	font-family: monospace;
	font-size: 0.8rem;
	color: #555;
}

/* Event log */
.event-log {
	padding: 0.5rem 0.75rem;
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
	max-height: 220px;
	overflow-y: auto;
}

.log-entry {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.77rem;
	color: #444;
	padding: 0.2rem 0;
	border-bottom: 1px solid #f5f5f5;
}

.log-ts {
	color: #bbb;
	font-size: 0.7rem;
	flex-shrink: 0;
	font-variant-numeric: tabular-nums;
}

.log-emoji { flex-shrink: 0; }
.log-text  { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
