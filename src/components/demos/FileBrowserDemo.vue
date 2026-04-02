<!--
	FileBrowserDemo.vue
	-------------------

	Demonstrates a powerful multi-select drag experience using a custom component ghost:

	  - Two side-by-side "drives" — files can be moved between them
	  - Click to select one file, Ctrl+click to toggle individual files,
	    Shift+click to select a continuous range
	  - When dragging a multi-selection, the custom FilePileGhost component renders:
	      1. Each selected file card at its real world-space position (captured at drag-start)
	      2. All cards then ease-in-out animate to a fanned pile under the cursor
	  - Dropping moves the entire selection to the target drive
	  - Dragging an unselected file performs a plain clone-ghost single-file drag
-->
<script setup>
import { ref, computed, onBeforeUnmount, defineComponent, h, onMounted, markRaw } from 'vue';

// ─── File icon helper ──────────────────────────────────────────────────────────

/**
 * Maps a file extension to an emoji icon.
 * @param {string} ext
 * @returns {string}
 */
const fileIcon = (ext) => {
	const map = {
		xlsx: '📊', xls: '📊', csv: '📊',
		docx: '📝', doc: '📝',
		pdf: '📄',
		jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
		mp4: '🎬', avi: '🎬', mov: '🎬',
		mp3: '🎵', wav: '🎵', flac: '🎵',
		zip: '🗜️', rar: '🗜️', '7z': '🗜️',
		exe: '⚙️', dmg: '⚙️',
		js: '📜', ts: '📜', py: '📜', sh: '📜',
		sql: '🗄️',
		txt: '📋', md: '📋',
		pptx: '📊', ppt: '📊',
		folder: '📁',
	};
	return map[ext?.toLowerCase()] ?? '📄';
};

// ─── File data ─────────────────────────────────────────────────────────────────

/** @typedef {{ id: number, name: string, ext: string, size: string, drive: 'A'|'B' }} FileEntry */

/** @type {FileEntry[]} */
const INITIAL_FILES = [
	// Drive A
	{ id: 1,  name: 'quarterly_report_FINAL_v3_ACTUALLY_FINAL', ext: 'xlsx', size: '2.3 MB', drive: 'A' },
	{ id: 2,  name: 'dont_open_this',                           ext: 'jpg',  size: '4.1 MB', drive: 'A' },
	{ id: 3,  name: 'resume_2019_updated_NEW_v2_FINAL',         ext: 'docx', size: '156 KB', drive: 'A' },
	{ id: 4,  name: 'cat_sitting_on_keyboard_output',           ext: 'txt',  size: '2 KB',   drive: 'A' },
	{ id: 5,  name: 'definitely_not_malware',                   ext: 'exe',  size: '17.2 MB', drive: 'A' },
	{ id: 6,  name: 'grandmas_secret_recipe',                   ext: 'pdf',  size: '312 KB', drive: 'A' },
	{ id: 7,  name: 'backup_of_backup_of_backup',               ext: 'zip',  size: '8.7 GB', drive: 'A' },
	{ id: 8,  name: 'meeting_notes_will_never_be_read',         ext: 'docx', size: '44 KB',  drive: 'A' },
	{ id: 9,  name: 'taxes_2018_idk_maybe',                     ext: 'xlsx', size: '890 KB', drive: 'A' },
	{ id: 10, name: 'the_presentation',                         ext: 'pptx', size: '12.4 MB', drive: 'A' },
	{ id: 11, name: 'final_final_final_logo_v7',                ext: 'png',  size: '3.2 MB', drive: 'A' },
	{ id: 12, name: 'todo_list_2020',                           ext: 'txt',  size: '1 KB',   drive: 'A' },
	// Drive B
	{ id: 13, name: 'screenshot_2023_03_14_at_3_47_AM',         ext: 'png',  size: '1.8 MB', drive: 'B' },
	{ id: 14, name: 'password_list_totally_encrypted',          ext: 'txt',  size: '512 B',  drive: 'B' },
	{ id: 15, name: 'wedding_video_compressed_144p',            ext: 'mp4',  size: '234 MB', drive: 'B' },
	{ id: 16, name: 'bitcoin_wallet_IMPORTANT',                 ext: 'pdf',  size: '1 KB',   drive: 'B' },
	{ id: 17, name: 'left_pad_reimplementation',                ext: 'js',   size: '3 KB',   drive: 'B' },
	{ id: 18, name: 'novel_chapter_1_draft',                    ext: 'docx', size: '28 KB',  drive: 'B' },
	{ id: 19, name: 'that_song_from_that_movie',                ext: 'mp3',  size: '3.6 MB', drive: 'B' },
	{ id: 20, name: 'database_prod_backup_test',                ext: 'sql',  size: '4.2 GB', drive: 'B' },
	{ id: 21, name: 'hire_me',                                  ext: 'pdf',  size: '64 KB',  drive: 'B' },
	{ id: 22, name: 'my_mixtape_fire',                          ext: 'mp3',  size: '5.1 MB', drive: 'B' },
	{ id: 23, name: 'never_gonna_give_you_up',                  ext: 'mp3',  size: '3.5 MB', drive: 'B' },
	{ id: 24, name: 'todo_list_2021_still_not_done',            ext: 'txt',  size: '3 KB',   drive: 'B' },
];

/** @type {import('vue').Ref<FileEntry[]>} */
const files = ref(INITIAL_FILES.map(f => ({ ...f })));

// ─── Selection state ───────────────────────────────────────────────────────────

/** @type {import('vue').Ref<Set<number>>} */
const selectedA = ref(new Set());

/** @type {import('vue').Ref<Set<number>>} */
const selectedB = ref(new Set());

/** @type {import('vue').Ref<number|null>} */
const lastClickedA = ref(null);

/** @type {import('vue').Ref<number|null>} */
const lastClickedB = ref(null);

/** Per-drive DOM element map (populated by template refs). */
const elsA = {};
const elsB = {};

/** @param {'A'|'B'} drive @returns {import('vue').Ref<Set<number>>} */
const selOf   = (drive) => drive === 'A' ? selectedA : selectedB;
/** @param {'A'|'B'} drive @returns {import('vue').Ref<number|null>} */
const lastOf  = (drive) => drive === 'A' ? lastClickedA : lastClickedB;
/** @param {'A'|'B'} drive @returns {Object} */
const elsOf   = (drive) => drive === 'A' ? elsA : elsB;

// ─── Click selection ───────────────────────────────────────────────────────────

/**
 * Handles click selection for a file, supporting Ctrl (toggle) and Shift (range).
 *
 * @param {FileEntry} file
 * @param {MouseEvent} event
 */
const handleClick = (file, event) => {
	const sel  = selOf(file.drive);
	const last = lastOf(file.drive);
	const driveFiles = files.value.filter(f => f.drive === file.drive);

	if (event.shiftKey && last.value !== null) {
		// Range select within the same drive
		const ids = driveFiles.map(f => f.id);
		const a = ids.indexOf(last.value);
		const b = ids.indexOf(file.id);
		const [lo, hi] = a < b ? [a, b] : [b, a];
		const next = new Set(sel.value);
		for (let i = lo; i <= hi; i++) next.add(ids[i]);
		sel.value = next;
		return;
	}

	if (event.ctrlKey || event.metaKey) {
		// Ctrl: toggle individual
		const next = new Set(sel.value);
		if (next.has(file.id)) next.delete(file.id);
		else next.add(file.id);
		sel.value = next;
		last.value = file.id;
		return;
	}

	// Plain click: if the file is already in the selection, preserve the selection
	// so a drag gesture can carry the entire group. If it's not selected, replace
	// the selection with just this file.
	if (!sel.value.has(file.id)) {
		sel.value = new Set([file.id]);
	}
	last.value = file.id;
};

// ─── Custom pile ghost component ───────────────────────────────────────────────

/**
 * Ghost component that renders selected files flying from their world-space positions
 * and converging into a fanned pile under the cursor.
 *
 * Props (standard PNP drag component props):
 *   ctx         — the dragged file's context
 *   groupCtx    — array of selected files, each enriched with _rect and _isAnchor
 *   startMouse  — { x, y } of the initial pointer-down position
 *   currentMouse — { x, y } current pointer position (live)
 *
 * @type {import('vue').Component}
 */
const FilePileGhost = markRaw(defineComponent({
	name: 'FilePileGhost',
	props: ['ctx', 'groupCtx', 'delta', 'startMouse', 'currentMouse'],

	setup(props) {
		const animated = ref(false);

		onMounted(() => {
			// Two rAF delays guarantee the browser has painted a full frame with the
			// initial (world-space) positions before triggering the CSS transition to
			// the pile layout.
			//
			// When a drag starts, the drag layer transitions from display:none to
			// visible in the same Vue render flush as this component's mount.  Because
			// the layer was hidden, the browser hasn't laid out its children yet and
			// may lazily defer their style computation to the next rendering step.  A
			// single rAF can therefore fire *before* the initial transform has been
			// committed as a "before-change" value, so the browser never sees a source
			// state to transition from and jumps straight to the pile.
			//
			// The outer rAF waits for that first paint (with animated=false / world-
			// space transforms).  The inner rAF then fires one frame later, after the
			// initial state is guaranteed to be committed, and triggers the transition.
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					animated.value = true;
				});
			});
		});

		/**
		 * The anchor file is the one actually being dragged; its rect === the drag
		 * container's initial position so it maps cleanly to (0, 0) in component space.
		 * @type {import('vue').ComputedRef<FileEntry|null>}
		 */
		const anchor = computed(() =>
			(props.groupCtx ?? []).find(f => f._isAnchor) ?? null
		);

		/**
		 * Up to 5 files shown visually (back → front). The anchor is always front.
		 * @type {import('vue').ComputedRef<FileEntry[]>}
		 */
		const visible = computed(() => {
			const gc = props.groupCtx ?? [];
			const others = gc.filter(f => !f._isAnchor).slice(0, 4);
			const anch   = gc.find(f => f._isAnchor);
			return [...others, ...(anch ? [anch] : [])];
		});

		/**
		 * Returns the CSS style object for a single card.
		 *
		 * Before animation (world-space): cards start at their screen position
		 * relative to the anchor's top-left.
		 *
		 * After animation (pile): cards form a fanned stack near (0, 0).
		 *
		 * @param {FileEntry & { _rect?: DOMRect, _isAnchor?: boolean }} file
		 * @param {number} index  — 0 = back of pile, last = front
		 * @param {number} total
		 * @returns {Object}
		 */
		const cardStyle = (file, index, total) => {
			const fromEnd   = (total - 1) - index; // 0 = front card
			const anchorRect = anchor.value?._rect ?? null;
			const fileRect   = file._rect ?? null;

			let translateX, translateY, rotate;

			if (!animated.value && anchorRect && fileRect) {
				// World-space starting position relative to anchor
				translateX = fileRect.left - anchorRect.left;
				translateY = fileRect.top  - anchorRect.top;
				rotate = 0;
			} else {
				// Pile position — back cards are offset slightly down-right with rotation
				translateX = fromEnd * 5;
				translateY = fromEnd * 5;
				rotate = (fromEnd - Math.floor(total / 2)) * 9;
			}

			return {
				position: 'absolute',
				top: '0',
				left: '0',
				width: '150px',
				height: '78px',
				transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`,
				transition: animated.value
					? 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
					: 'none',
				zIndex: index + 1,
				background: 'white',
				borderRadius: '8px',
				border: file._isAnchor ? '2px solid #4a90d9' : '1.5px solid #d0d8e8',
				boxShadow: file._isAnchor
					? '0 6px 20px rgba(74,144,217,0.22)'
					: '0 3px 10px rgba(0,0,0,0.10)',
				padding: '8px 10px',
				display: 'flex',
				flexDirection: 'column',
				gap: '4px',
				overflow: 'hidden',
				boxSizing: 'border-box',
			};
		};

		/** @param {string} ext */
		const icon = (ext) => fileIcon(ext);

		return () => {
			const gc    = props.groupCtx ?? [];
			const vis   = visible.value;
			const total = vis.length;
			const count = gc.length;

			return h('div', {
				style: {
					position: 'relative',
					width:  '150px',
					height: '78px',
					overflow: 'visible',
				},
			}, [
				// File cards (back to front)
				...vis.map((file, i) =>
					h('div', { key: file.id, style: cardStyle(file, i, total) }, [
						h('div', { style: { fontSize: '1.4rem', lineHeight: '1' } }, icon(file.ext)),
						h('div', {
							style: {
								fontSize: '0.64rem',
								fontWeight: '600',
								color: '#2c3e50',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							},
						}, file.name + '.' + file.ext),
						h('div', { style: { fontSize: '0.6rem', color: '#aaa' } }, file.size),
					])
				),
				// Count badge (shown when more than 1 file selected)
				count > 1
					? h('div', {
						style: {
							position: 'absolute',
							top: '-10px',
							right: '-10px',
							minWidth: '24px',
							height: '24px',
							background: '#e74c3c',
							color: 'white',
							borderRadius: '12px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '0.78rem',
							fontWeight: '700',
							padding: '0 5px',
							boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
							zIndex: total + 2,
							boxSizing: 'border-box',
						},
					}, String(count))
					: null,
			]);
		};
	},
}));

// ─── Draggable options ─────────────────────────────────────────────────────────

/**
 * Builds the draggable options for a file.
 * Multi-select: uses FilePileGhost + groupCtx with rect capture in onDragStart.
 * Single:       falls back to 'clone'.
 *
 * @param {FileEntry} file
 * @returns {Object}
 */
const draggableOpts = (file) => {
	const sel = selOf(file.drive);
	const isSelected = sel.value.has(file.id);

	// Build groupCtx when this file is selected (drag the whole selection)
	const groupCtx = isSelected
		? files.value
			.filter(f => f.drive === file.drive && sel.value.has(f.id))
			.map(f => ({ ...f }))
		: null;

	const useCustomGhost = groupCtx && groupCtx.length > 1;

	return {
		keys: 'file',
		ctx: { ...file },
		groupCtx,
		dragItem: useCustomGhost ? FilePileGhost : 'clone',
		showGroupCount: !useCustomGhost, // pile ghost handles its own badge

		/**
		 * Capture world-space rects of all selected elements right when the drag starts.
		 * The FilePileGhost uses these to position cards at their true screen locations
		 * on first render, then transitions them to a pile.
		 *
		 * @param {FileEntry} ctx
		 * @param {FileEntry[]|null} gc
		 */
		onDragStart: (ctx, gc) => {
			if (!gc) return;
			const els = elsOf(file.drive);
			gc.forEach(item => {
				const el = els[item.id];
				item._rect     = el ? el.getBoundingClientRect() : null;
				item._isAnchor = item.id === ctx.id;
			});
		},

		/**
		 * Move the dragged files to the target drive on a successful drop.
		 *
		 * @param {boolean} success
		 * @param {FileEntry} dragCtx
		 * @param {{ drive: 'A'|'B' }} dropCtx
		 * @param {FileEntry[]|null} gc
		 */
		onDropped: (success, dragCtx, dropCtx, gc) => {
			if (!success || !dropCtx) return;

			const toDrive = dropCtx.drive;
			if (toDrive === dragCtx.drive) return; // same drive — no-op for now

			const movedIds = new Set(gc ? gc.map(f => f.id) : [dragCtx.id]);
			files.value = files.value.map(f =>
				movedIds.has(f.id) ? { ...f, drive: toDrive } : f
			);

			// Clear source selection after move
			selOf(dragCtx.drive).value = new Set();
			lastOf(dragCtx.drive).value = null;
		},
	};
};

// ─── Drop zone options ─────────────────────────────────────────────────────────

/**
 * @param {'A'|'B'} drive
 * @returns {Object}
 */
const dropzoneOpts = (drive) => ({
	keys: 'file',
	ctx: { drive },
});

// ─── Derived file lists ────────────────────────────────────────────────────────

/** @type {import('vue').ComputedRef<FileEntry[]>} */
const filesA = computed(() => files.value.filter(f => f.drive === 'A'));
/** @type {import('vue').ComputedRef<FileEntry[]>} */
const filesB = computed(() => files.value.filter(f => f.drive === 'B'));

// ─── Clear selection when clicking outside ─────────────────────────────────────

/**
 * @param {MouseEvent} e
 */
const onDocClick = (e) => {
	if (!e.target.closest('.file-grid')) {
		selectedA.value = new Set();
		selectedB.value = new Set();
	}
};

document.addEventListener('mousedown', onDocClick);
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick));
</script>

<template>
	<div class="demo-wrap">

		<div class="demo-header">
			<h2>File Browser — Multi-Select Pile</h2>
			<p>
				<strong>Click</strong> to select a file &nbsp;·&nbsp;
				<strong>Ctrl+click</strong> to toggle &nbsp;·&nbsp;
				<strong>Shift+click</strong> for a range.
				Drag a selection between drives — the ghost starts at each file's real screen
				position and animates to a fanned pile under your cursor.
			</p>
		</div>

		<div class="drives-row">

			<!-- ── Drive A ─────────────────────────────────────────── -->
			<div class="drive-card">
				<div class="drive-header">
					<span class="drive-icon">🖥️</span>
					<div class="drive-info">
						<span class="drive-name">Local Disk (C:)</span>
						<span class="drive-count">{{ filesA.length }} files</span>
					</div>
					<span v-if="selectedA.size > 0" class="sel-badge">
						{{ selectedA.size }} selected
					</span>
				</div>

				<div
					v-pnp-dropzone="dropzoneOpts('A')"
					class="file-grid"
				>
					<div
						v-for="file in filesA"
						:key="file.id"
						:ref="el => { if (el) elsA[file.id] = el; else delete elsA[file.id]; }"
						v-pnp-draggable="draggableOpts(file)"
						class="file-cell"
						:class="{ selected: selectedA.has(file.id) }"
						@mousedown.stop="handleClick(file, $event)"
					>
						<span class="file-icon">{{ fileIcon(file.ext) }}</span>
						<span class="file-name">{{ file.name }}</span>
						<span class="file-ext">.{{ file.ext }}</span>
						<span class="file-size">{{ file.size }}</span>
					</div>

					<div v-if="filesA.length === 0" class="drive-empty">
						<span>Drop files here</span>
					</div>
				</div>
			</div>

			<!-- ── Transfer arrow ──────────────────────────────────── -->
			<div class="transfer-arrow">
				<span>⇄</span>
				<span class="arrow-label">drag to move</span>
			</div>

			<!-- ── Drive B ─────────────────────────────────────────── -->
			<div class="drive-card">
				<div class="drive-header">
					<span class="drive-icon">💾</span>
					<div class="drive-info">
						<span class="drive-name">External Drive (D:)</span>
						<span class="drive-count">{{ filesB.length }} files</span>
					</div>
					<span v-if="selectedB.size > 0" class="sel-badge">
						{{ selectedB.size }} selected
					</span>
				</div>

				<div
					v-pnp-dropzone="dropzoneOpts('B')"
					class="file-grid"
				>
					<div
						v-for="file in filesB"
						:key="file.id"
						:ref="el => { if (el) elsB[file.id] = el; else delete elsB[file.id]; }"
						v-pnp-draggable="draggableOpts(file)"
						class="file-cell"
						:class="{ selected: selectedB.has(file.id) }"
						@mousedown.stop="handleClick(file, $event)"
					>
						<span class="file-icon">{{ fileIcon(file.ext) }}</span>
						<span class="file-name">{{ file.name }}</span>
						<span class="file-ext">.{{ file.ext }}</span>
						<span class="file-size">{{ file.size }}</span>
					</div>

					<div v-if="filesB.length === 0" class="drive-empty">
						<span>Drop files here</span>
					</div>
				</div>
			</div>

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
	margin-bottom: 0.4rem;
}

.demo-header p {
	font-size: 0.85rem;
	color: #666;
	max-width: 700px;
	line-height: 1.6;
}

/* ── Drives layout ────────────────────────────────────── */
.drives-row {
	display: flex;
	gap: 0;
	align-items: flex-start;
}

.drive-card {
	flex: 1;
	background: #fff;
	border-radius: 14px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	overflow: hidden;
	min-width: 0;
}

.drive-header {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	padding: 0.85rem 1rem;
	background: #fafafa;
	border-bottom: 1px solid #eee;
	flex-wrap: wrap;
}

.drive-icon {
	font-size: 1.3rem;
	flex-shrink: 0;
}

.drive-info {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
}

.drive-name {
	font-size: 0.85rem;
	font-weight: 700;
	color: #2c3e50;
}

.drive-count {
	font-size: 0.7rem;
	color: #aaa;
}

.sel-badge {
	background: #4a90d9;
	color: white;
	font-size: 0.7rem;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 10px;
	flex-shrink: 0;
}

/* ── File grid ────────────────────────────────────────── */
.file-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0;
	padding: 0.5rem;
	min-height: 300px;
}

.file-cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0.65rem 0.4rem 0.5rem;
	border-radius: 8px;
	cursor: pointer;
	user-select: none;
	text-align: center;
	border: 2px solid transparent;
	transition: background 0.1s, border-color 0.1s, box-shadow 0.1s;
	gap: 2px;
}

.file-cell:hover {
	background: #f0f6ff;
}

.file-cell.selected {
	background: #e8f0ff;
	border-color: #4a90d9;
	box-shadow: 0 0 0 1px rgba(74,144,217,0.15);
}

.file-icon {
	font-size: 1.8rem;
	line-height: 1;
	margin-bottom: 2px;
}

.file-name {
	font-size: 0.61rem;
	color: #2c3e50;
	font-weight: 600;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	display: block;
	width: 100%;
}

.file-ext {
	font-size: 0.58rem;
	color: #aaa;
	text-transform: uppercase;
	letter-spacing: 0.4px;
}

.file-size {
	font-size: 0.58rem;
	color: #bbb;
}

.drive-empty {
	grid-column: 1 / -1;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 200px;
	color: #ccc;
	font-size: 0.85rem;
	font-style: italic;
	border: 2px dashed #eee;
	border-radius: 10px;
	margin: 0.5rem;
}

/* ── Transfer arrow ───────────────────────────────────── */
.transfer-arrow {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	padding: 0 0.75rem;
	color: #ccc;
	font-size: 1.5rem;
	flex-shrink: 0;
	padding-top: 5rem;
}

.arrow-label {
	font-size: 0.65rem;
	text-transform: uppercase;
	letter-spacing: 0.8px;
	color: #ddd;
}

/* ── Dropzone CSS hooks ───────────────────────────────── */
:deep(.pnp-dropzone-valid) {
	outline: 2px dashed #4a90d9;
	outline-offset: -2px;
}

:deep(.pnp-dropzone-hovered) {
	background: #eef4ff;
}
</style>
