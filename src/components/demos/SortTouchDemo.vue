<!--
	SortTouchDemo.vue
	-----------------

	Demonstrates the sorting overhaul + touch support:
	  - Library-owned placeholder (no reactive mutation during drag)
	  - Midpoint threshold eliminates oscillation
	  - rAF-throttled sort evaluation
	  - onSortDrop(dragCtx, dropCtx, fromIndex, toIndex) commits the reorder on release
	  - placeholder style toggle: 'space' (invisible ghost) vs 'line' (insertion indicator)
	  - useTouch toggle enables pointer-events mode (touch + stylus + mouse unified)
	  - Two sortable lists — drag between them works via cross-zone sort
-->
<script setup>
import { ref } from 'vue';
import { usePNPDragging } from '../../pnp-lib/usePNPDragging';

const pnp = usePNPDragging();

/** @typedef {{ id: number, title: string, artist: string, duration: string }} Track */

/** @type {import('vue').Ref<Track[]>} */
const queueTracks = ref([
	{ id: 1,  title: 'Midnight City',         artist: 'M83',               duration: '4:03' },
	{ id: 2,  title: 'Comptine d\'Un Autre Été', artist: 'Yann Tiersen',   duration: '2:27' },
	{ id: 3,  title: 'Intro',                  artist: 'The xx',            duration: '2:07' },
	{ id: 4,  title: 'Breathe',                artist: 'Télépopmusik',      duration: '4:17' },
	{ id: 5,  title: 'Digital Love',           artist: 'Daft Punk',         duration: '4:59' },
]);

/** @type {import('vue').Ref<Track[]>} */
const libraryTracks = ref([
	{ id: 6,  title: 'Pyramid Song',           artist: 'Radiohead',         duration: '4:49' },
	{ id: 7,  title: 'Strange',                artist: 'Celeste',            duration: '3:51' },
	{ id: 8,  title: 'Electric Feel',          artist: 'MGMT',              duration: '3:48' },
	{ id: 9,  title: 'Teardrop',               artist: 'Massive Attack',    duration: '5:29' },
	{ id: 10, title: 'Golden Hours',           artist: 'Brian Eno',         duration: '3:58' },
]);

/** @type {import('vue').Ref<'space'|'line'|'dashed'>} */
const placeholderStyle = ref('dashed');

/** @type {import('vue').Ref<boolean>} */
const useTouch = ref(false);

/** Apply useTouch config to the manager immediately. */
const applyUseTouch = () => {
	pnp.setOptions({ useTouch: useTouch.value });
};

/**
 * Commits a sort drop by moving the track from fromIndex to toIndex within the
 * same list, or across lists if the origin zone differs from the drop zone.
 *
 * onSortDrop signature: (dragCtx, dropCtx, fromIndex, toIndex, groupCtx, modifiers)
 *
 * @param {Track} dragCtx
 * @param {{ list: 'queue'|'library' }} dropCtx
 * @param {number} fromIndex
 * @param {number} toIndex
 */
const handleSortDrop = (dragCtx, dropCtx, fromIndex, toIndex) => {
	const sourceList = dragCtx.list === 'queue' ? queueTracks : libraryTracks;
	const destList   = dropCtx.list  === 'queue' ? queueTracks : libraryTracks;

	// Remove track from source
	const [track] = sourceList.value.splice(fromIndex, 1);

	// Insert at destination index (same or different list)
	destList.value.splice(toIndex, 0, { ...track, list: dropCtx.list });
};

/**
 * Returns draggable options for a track.
 *
 * @param {Track} track
 * @param {'queue'|'library'} listName
 * @returns {Object}
 */
const draggableOpts = (track, listName) => ({
	keys: 'track',
	ctx: { ...track, list: listName },
	dragItem: 'clone',
});

/**
 * Returns dropzone options for a list.
 *
 * @param {'queue'|'library'} listName
 * @returns {Object}
 */
const dropzoneOpts = (listName) => ({
	keys: 'track',
	ctx: { list: listName },
	sortable: true,
	placeholder: placeholderStyle.value,
	onSortDrop: handleSortDrop,
});

/** @type {import('vue').Ref<Array<{ id: number, msg: string, ts: number }>>} */
const log = ref([]);

/**
 * Records a log entry — called from onSortDrop after the data is updated.
 * We wrap handleSortDrop to also log.
 *
 * @param {Track} dragCtx
 * @param {{ list: string }} dropCtx
 * @param {number} fromIndex
 * @param {number} toIndex
 */
const handleSortDropWithLog = (dragCtx, dropCtx, fromIndex, toIndex) => {
	handleSortDrop(dragCtx, dropCtx, fromIndex, toIndex);
	const sameList = dragCtx.list === dropCtx.list;
	const msg = sameList
		? `Moved "${dragCtx.title}" from position ${fromIndex + 1} → ${toIndex + 1} in ${dropCtx.list}`
		: `Moved "${dragCtx.title}" from ${dragCtx.list} → ${dropCtx.list} at position ${toIndex + 1}`;
	log.value.unshift({ id: Date.now(), msg, ts: Date.now() });
	if (log.value.length > 6) log.value.pop();
};

/** Dropzone options with logging. */
const dropzoneOptsWithLog = (listName) => ({
	...dropzoneOpts(listName),
	onSortDrop: handleSortDropWithLog,
});

/** @param {number} ts */
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
</script>

<template>
	<div class="demo-wrap">
		<div class="demo-header">
			<h2>Sorting &amp; Touch</h2>
			<p>Drag tracks to reorder within a list or move them between lists. The library owns the placeholder — your data only updates on drop, eliminating oscillation. Enable touch mode to use pointer events for mobile/stylus support.</p>
		</div>

		<!-- Config panel -->
		<div class="config-panel">
			<div class="config-group">
				<span class="config-label">Placeholder style</span>
				<div class="btn-group">
					<button
						:class="['btn-opt', { active: placeholderStyle === 'space' }]"
						@click="placeholderStyle = 'space'"
					>Space</button>
					<button
						:class="['btn-opt', { active: placeholderStyle === 'line' }]"
						@click="placeholderStyle = 'line'"
					>Line</button>
					<button
						:class="['btn-opt', { active: placeholderStyle === 'dashed' }]"
						@click="placeholderStyle = 'dashed'"
					>Dashed</button>
				</div>
			</div>
			<div class="config-group">
				<span class="config-label">Touch / pointer events</span>
				<label class="toggle">
					<input type="checkbox" v-model="useTouch" @change="applyUseTouch" />
					<span class="toggle-track"><span class="toggle-thumb"></span></span>
					<span class="toggle-label">{{ useTouch ? 'Enabled' : 'Disabled' }}</span>
				</label>
			</div>
		</div>

		<!-- Board -->
		<div class="board">
			<!-- Queue list -->
			<div class="list-card">
				<div class="list-header queue-header">
					<span class="list-icon">▶</span>
					<span class="list-title">Queue</span>
					<span class="list-count">{{ queueTracks.length }}</span>
				</div>
				<div
					v-pnp-dropzone="dropzoneOptsWithLog('queue')"
					class="track-list"
				>
					<div
						v-for="track in queueTracks"
						:key="track.id"
						v-pnp-draggable="draggableOpts(track, 'queue')"
						class="track-row"
					>
						<span class="drag-grip">⠿</span>
						<div class="track-info">
							<span class="track-title">{{ track.title }}</span>
							<span class="track-artist">{{ track.artist }}</span>
						</div>
						<span class="track-dur">{{ track.duration }}</span>
					</div>
					<div v-if="queueTracks.length === 0" class="empty-list">
						Drop tracks here
					</div>
				</div>
			</div>

			<!-- Library list -->
			<div class="list-card">
				<div class="list-header library-header">
					<span class="list-icon">♫</span>
					<span class="list-title">Library</span>
					<span class="list-count">{{ libraryTracks.length }}</span>
				</div>
				<div
					v-pnp-dropzone="dropzoneOptsWithLog('library')"
					class="track-list"
				>
					<div
						v-for="track in libraryTracks"
						:key="track.id"
						v-pnp-draggable="draggableOpts(track, 'library')"
						class="track-row"
					>
						<span class="drag-grip">⠿</span>
						<div class="track-info">
							<span class="track-title">{{ track.title }}</span>
							<span class="track-artist">{{ track.artist }}</span>
						</div>
						<span class="track-dur">{{ track.duration }}</span>
					</div>
					<div v-if="libraryTracks.length === 0" class="empty-list">
						Drop tracks here
					</div>
				</div>
			</div>
		</div>

		<!-- Event log -->
		<div class="log-panel" v-if="log.length > 0">
			<div class="log-title">Sort Log</div>
			<transition-group name="log" tag="div" class="log-list">
				<div v-for="entry in log" :key="entry.id" class="log-entry">
					<span class="log-time">{{ fmtTime(entry.ts) }}</span>
					<span class="log-msg">{{ entry.msg }}</span>
				</div>
			</transition-group>
		</div>
	</div>
</template>

<style scoped>
.demo-wrap {
	padding: 2rem;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	min-height: 100vh;
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
	max-width: 640px;
	line-height: 1.5;
}

/* ── Config ───────────────────────────────────── */
.config-panel {
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
	align-items: center;
	background: #fff;
	border-radius: 10px;
	padding: 0.85rem 1.1rem;
	box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}

.config-group {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.config-label {
	font-size: 0.8rem;
	font-weight: 600;
	color: #555;
}

.btn-group {
	display: flex;
	border-radius: 6px;
	overflow: hidden;
	border: 1px solid #ddd;
}

.btn-opt {
	padding: 4px 12px;
	font-size: 0.78rem;
	font-weight: 600;
	border: none;
	background: #f5f6fa;
	color: #666;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.btn-opt.active {
	background: #4a90d9;
	color: #fff;
}

/* Toggle */
.toggle {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
}

.toggle input {
	display: none;
}

.toggle-track {
	width: 38px;
	height: 20px;
	background: #ddd;
	border-radius: 10px;
	position: relative;
	transition: background 0.2s;
}

.toggle input:checked + .toggle-track {
	background: #4a90d9;
}

.toggle-thumb {
	position: absolute;
	top: 2px;
	left: 2px;
	width: 16px;
	height: 16px;
	background: #fff;
	border-radius: 50%;
	box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	transition: left 0.2s;
}

.toggle input:checked ~ .toggle-track .toggle-thumb,
.toggle input:checked + .toggle-track .toggle-thumb {
	left: 20px;
}

.toggle-label {
	font-size: 0.8rem;
	color: #555;
	min-width: 52px;
}

/* ── Board ────────────────────────────────────── */
.board {
	display: flex;
	gap: 1.25rem;
	align-items: flex-start;
}

.list-card {
	flex: 1;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 1px 4px rgba(0,0,0,0.08);
	overflow: hidden;
	min-width: 260px;
}

.list-header {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	padding: 0.75rem 1rem;
	border-bottom: 3px solid transparent;
}

.queue-header   { border-color: #4a90d9; background: #f0f7ff; }
.library-header { border-color: #7c5cbf; background: #f5f0ff; }

.list-icon {
	font-size: 0.9rem;
}

.list-title {
	font-weight: 700;
	font-size: 0.88rem;
	color: #2c3e50;
	flex: 1;
}

.list-count {
	background: #e9ecef;
	color: #666;
	font-size: 0.72rem;
	font-weight: 700;
	padding: 2px 7px;
	border-radius: 10px;
}

/* ── Track rows ───────────────────────────────── */
.track-list {
	padding: 0.5rem;
	display: flex;
	flex-direction: column;
	gap: 0;
	min-height: 80px;
}

.track-row {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.55rem 0.7rem;
	border-radius: 7px;
	cursor: grab;
	user-select: none;
	transition: background 0.12s;
	border: 1px solid transparent;
}

.track-row:hover {
	background: #f5f6fa;
	border-color: #e9ecef;
}

.drag-grip {
	color: #bbb;
	font-size: 1rem;
	flex-shrink: 0;
}

.track-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.track-title {
	font-size: 0.83rem;
	font-weight: 600;
	color: #2c3e50;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.track-artist {
	font-size: 0.72rem;
	color: #999;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.track-dur {
	font-size: 0.75rem;
	color: #bbb;
	flex-shrink: 0;
}

.empty-list {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 60px;
	color: #ccc;
	font-size: 0.8rem;
	font-style: italic;
	border: 2px dashed #eee;
	border-radius: 8px;
}

/* Dropzone CSS hooks */
:deep(.pnp-dropzone-valid) {
	outline: 2px dashed #4a90d9;
	outline-offset: -2px;
	border-radius: 6px;
}

:deep(.pnp-dropzone-hovered) {
	background: #e8f4fd;
	border-radius: 6px;
}

/* ── Log ──────────────────────────────────────── */
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
	gap: 0.7rem;
	font-size: 0.82rem;
	color: #444;
}

.log-time {
	color: #aaa;
	font-size: 0.75rem;
	flex-shrink: 0;
}

.log-enter-active { transition: all 0.2s ease; }
.log-enter-from   { opacity: 0; transform: translateY(-5px); }
</style>
