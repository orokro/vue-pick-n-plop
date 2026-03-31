<!--
	CategoryFilterDemo.vue
	-----------------------

	Demonstrates key-based filtering with overlapping categories.
	Items can belong to multiple categories — dragging one highlights
	every valid target simultaneously using highlight: 'on-start'.
-->
<script setup>
import { reactive, computed } from 'vue';

/**
 * All category keys joined, used by the inventory drop zone so any item
 * can always be dragged back regardless of its keys.
 * @type {string}
 */
const ALL_KEYS = 'electronic|rectangle|luxury|living|transport|food';

/**
 * Color scheme per category key.
 * bg       - zone card background
 * border   - accent / border color
 * light    - brighter bg used on hover
 * shadow   - rgba shadow for the valid-zone glow ring
 * @type {Record<string, { bg: string, border: string, light: string, shadow: string }>}
 */
const ZONE_COLORS = {
	rectangle: { bg: '#e3f2fd', border: '#1565c0', light: '#bbdefb', shadow: 'rgba(21,101,192,0.22)' },
	electronic: { bg: '#fff3e0', border: '#e65100', light: '#ffe0b2', shadow: 'rgba(230,81,0,0.22)' },
	living:     { bg: '#e8f5e9', border: '#2e7d32', light: '#c8e6c9', shadow: 'rgba(46,125,50,0.22)' },
	transport:  { bg: '#fce4ec', border: '#ad1457', light: '#f8bbd0', shadow: 'rgba(173,20,87,0.22)' },
	luxury:     { bg: '#f3e5f5', border: '#6a1b9a', light: '#e1bee7', shadow: 'rgba(106,27,154,0.22)' },
	food:       { bg: '#fff9c4', border: '#f57f17', light: '#fff176', shadow: 'rgba(245,127,23,0.22)' },
};

/**
 * @typedef {{ id: number, emoji: string, label: string, keys: string }} DemoItem
 */

/** @type {DemoItem[]} */
const items = [
	{ id: 1,  emoji: '📱', label: 'Smartphone',  keys: 'electronic|rectangle|luxury' },
	{ id: 2,  emoji: '💻', label: 'Laptop',       keys: 'electronic|rectangle|luxury' },
	{ id: 3,  emoji: '🖥️', label: 'Monitor',      keys: 'electronic|rectangle' },
	{ id: 4,  emoji: '🎮', label: 'Gamepad',      keys: 'electronic|rectangle' },
	{ id: 5,  emoji: '📺', label: 'Television',   keys: 'electronic|rectangle' },
	{ id: 6,  emoji: '📷', label: 'Camera',       keys: 'electronic|rectangle|luxury' },
	{ id: 7,  emoji: '🚗', label: 'Car',          keys: 'transport|rectangle' },
	{ id: 8,  emoji: '🏎️', label: 'Sports Car',  keys: 'transport|luxury' },
	{ id: 9,  emoji: '✈️', label: 'Airplane',     keys: 'transport|luxury' },
	{ id: 10, emoji: '🚁', label: 'Helicopter',   keys: 'transport|luxury' },
	{ id: 11, emoji: '🚢', label: 'Cruise Ship',  keys: 'transport|luxury' },
	{ id: 12, emoji: '🐱', label: 'Cat',          keys: 'living' },
	{ id: 13, emoji: '🦁', label: 'Lion',         keys: 'living|luxury' },
	{ id: 14, emoji: '🦞', label: 'Lobster',      keys: 'living|food|luxury' },
	{ id: 15, emoji: '🐓', label: 'Chicken',      keys: 'living|food' },
	{ id: 16, emoji: '🍕', label: 'Pizza',        keys: 'food|rectangle' },
	{ id: 17, emoji: '🍫', label: 'Chocolate',    keys: 'food|luxury' },
	{ id: 18, emoji: '🥂', label: 'Champagne',    keys: 'food|luxury' },
	{ id: 19, emoji: '💍', label: 'Diamond Ring', keys: 'luxury' },
];

/**
 * @typedef {{ id: string, emoji: string, label: string, keys: string, description: string }} DemoZone
 */

/** @type {DemoZone[]} */
const zones = [
	{ id: 'rectangle', emoji: '📐', label: 'Rectangles',    keys: 'rectangle', description: 'Things with a rectangular form' },
	{ id: 'electronic', emoji: '⚡', label: 'Electronics',   keys: 'electronic', description: 'Powered by electricity' },
	{ id: 'living',    emoji: '🌿', label: 'Living Things', keys: 'living',    description: 'Alive and breathing' },
	{ id: 'transport', emoji: '🚀', label: 'Transportation',keys: 'transport', description: 'Things that carry you places' },
	{ id: 'luxury',    emoji: '👑', label: 'Luxury',        keys: 'luxury',    description: 'Premium and expensive' },
	{ id: 'food',      emoji: '🍽️', label: 'Food & Drink',  keys: 'food',      description: 'Things you can eat or drink' },
];

/**
 * Tracks each item's current location.
 * null means it is in the inventory; otherwise it holds the zone id string.
 * @type {Record<number, string|null>}
 */
const itemLocations = reactive({});
items.forEach(item => { itemLocations[item.id] = null; });

/** Items not yet placed in any zone. */
const inventoryItems = computed(() => items.filter(item => itemLocations[item.id] === null));

/**
 * Returns items currently placed in a given zone.
 * Called directly in the template — Vue tracks the reactive dependency on itemLocations.
 * @param {string} zoneId
 * @returns {DemoItem[]}
 */
const itemsInZone = (zoneId) => items.filter(item => itemLocations[item.id] === zoneId);

/**
 * Splits a pipe-delimited key string into an array of individual keys.
 * @param {string} keys
 * @returns {string[]}
 */
const parseKeys = (keys) => keys.split('|');

/**
 * Shared drop handler for both zone and inventory drop zones.
 * Sets the item's location to the drop zone id, or null for inventory.
 * @param {{ id: number }} dragCtx
 * @param {{ zoneId: string|null }} dropCtx
 */
const handleDrop = (dragCtx, dropCtx) => {
	itemLocations[dragCtx.id] = dropCtx.zoneId;
};

/** Resets all items back to the inventory. */
const reset = () => {
	items.forEach(item => { itemLocations[item.id] = null; });
};
</script>

<template>
	<div class="category-demo">

		<div class="demo-header">
			<div class="demo-title-block">
				<h2>Category Filter Demo</h2>
				<p>
					Items can belong to multiple categories. When you start dragging,
					<strong>every valid target lights up at once</strong>. Try dragging a
					<strong>🦞 Lobster</strong> or <strong>📷 Camera</strong> to see the overlap.
					Items already placed can be dragged to other valid zones or back to inventory.
				</p>
			</div>
			<button class="reset-btn" @click="reset">↩ Reset</button>
		</div>

		<!-- Inventory — accepts all keys so anything can be returned here -->
		<div class="inventory-section">
			<div class="section-label">📦 Inventory</div>
			<div
				v-pnp-dropzone="{
					keys: ALL_KEYS,
					ctx: { zoneId: null },
					onDropped: handleDrop,
				}"
				class="inventory-grid"
			>
				<div
					v-for="item in inventoryItems"
					:key="item.id"
					v-pnp-draggable="{
						keys: item.keys,
						ctx: { id: item.id },
						dragItem: 'clone',
						highlight: 'on-start',
					}"
					class="item-card"
				>
					<span class="item-emoji">{{ item.emoji }}</span>
					<span class="item-label">{{ item.label }}</span>
					<div class="item-tags">
						<span
							v-for="key in parseKeys(item.keys)"
							:key="key"
							class="tag"
							:style="{ background: ZONE_COLORS[key].border }"
						>{{ key }}</span>
					</div>
				</div>

				<div v-if="inventoryItems.length === 0" class="empty-msg">
					🎉 All items placed!
				</div>
			</div>
		</div>

		<!-- Drop Zones — 3-column grid -->
		<div class="zones-grid">
			<div
				v-for="zone in zones"
				:key="zone.id"
				v-pnp-dropzone="{
					keys: zone.keys,
					ctx: { zoneId: zone.id },
					onDropped: handleDrop,
				}"
				class="zone-card"
				:style="{
					'--zone-border': ZONE_COLORS[zone.id].border,
					'--zone-light':  ZONE_COLORS[zone.id].light,
					'--zone-shadow': ZONE_COLORS[zone.id].shadow,
					background: ZONE_COLORS[zone.id].bg,
				}"
			>
				<div class="zone-header">
					<span class="zone-emoji">{{ zone.emoji }}</span>
					<div class="zone-title-block">
						<span class="zone-name">{{ zone.label }}</span>
						<span class="zone-desc">{{ zone.description }}</span>
					</div>
					<span
						v-if="itemsInZone(zone.id).length > 0"
						class="zone-count"
					>{{ itemsInZone(zone.id).length }}</span>
				</div>

				<div class="zone-items">
					<div
						v-for="item in itemsInZone(zone.id)"
						:key="item.id"
						v-pnp-draggable="{
							keys: item.keys,
							ctx: { id: item.id },
							dragItem: 'clone',
							highlight: 'on-start',
						}"
						class="zone-item"
					>
						<span>{{ item.emoji }}</span>
						<span class="zone-item-label">{{ item.label }}</span>
					</div>
					<div v-if="itemsInZone(zone.id).length === 0" class="zone-empty-hint">
						Drop here
					</div>
				</div>
			</div>
		</div>

	</div>
</template>

<style scoped>
.category-demo {
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
	max-width: 700px;
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

/* Inventory */
.inventory-section {
	background: white;
	border-radius: 12px;
	border: 1px solid #e4e4e4;
	padding: 1rem 1.25rem;
	box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.section-label {
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 1px;
	color: #999;
	margin-bottom: 0.75rem;
}

.inventory-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem;
	min-height: 90px;
	padding: 0.4rem;
	border-radius: 8px;
	transition: background 0.2s;
}

.inventory-grid.pnp-dropzone-hovered {
	background: #f0f7ff;
}

/* Individual draggable item cards */
.item-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	padding: 0.55rem 0.7rem;
	background: #fafafa;
	border: 1px solid #eaeaea;
	border-radius: 10px;
	cursor: grab;
	user-select: none;
	transition: transform 0.15s, box-shadow 0.15s;
	min-width: 76px;
	text-align: center;
}

.item-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.item-card:active {
	cursor: grabbing;
}

.item-emoji {
	font-size: 1.9rem;
	line-height: 1;
}

.item-label {
	font-size: 0.68rem;
	font-weight: 500;
	color: #444;
	white-space: nowrap;
}

.item-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 2px;
	justify-content: center;
}

.tag {
	font-size: 0.52rem;
	padding: 1px 5px;
	border-radius: 4px;
	color: white;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.2px;
}

.empty-msg {
	width: 100%;
	text-align: center;
	color: #bbb;
	font-style: italic;
	padding: 1.5rem 0;
	font-size: 0.9rem;
}

/* Drop Zone Grid */
.zones-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;
}

.zone-card {
	border-radius: 12px;
	border: 2px solid transparent;
	padding: 1rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	min-height: 160px;
	transition: border-color 0.2s, box-shadow 0.2s, background 0.2s, transform 0.15s;
}

/* Valid target — lit up on drag start because highlight: 'on-start' */
.zone-card.pnp-dropzone-valid {
	border-color: var(--zone-border);
	box-shadow: 0 0 0 3px var(--zone-shadow);
}

/* Active hover over this zone */
.zone-card.pnp-dropzone-hovered {
	background: var(--zone-light) !important;
	transform: scale(1.015);
}

.zone-header {
	display: flex;
	align-items: center;
	gap: 0.6rem;
}

.zone-emoji {
	font-size: 1.5rem;
	flex-shrink: 0;
}

.zone-title-block {
	display: flex;
	flex-direction: column;
	flex: 1;
}

.zone-name {
	font-weight: 700;
	font-size: 0.9rem;
	color: #1a1a2e;
}

.zone-desc {
	font-size: 0.72rem;
	color: #777;
	line-height: 1.3;
}

.zone-count {
	flex-shrink: 0;
	background: var(--zone-border);
	color: white;
	font-size: 0.68rem;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 99px;
}

/* Items sitting inside a zone */
.zone-items {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
	min-height: 34px;
}

.zone-item {
	display: flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.28rem 0.55rem;
	background: white;
	border-radius: 6px;
	font-size: 0.85rem;
	cursor: grab;
	border: 1px solid rgba(0,0,0,0.07);
	transition: transform 0.1s, box-shadow 0.1s;
	user-select: none;
}

.zone-item:hover {
	transform: translateY(-1px);
	box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.zone-item:active {
	cursor: grabbing;
}

.zone-item-label {
	font-size: 0.72rem;
	color: #333;
}

.zone-empty-hint {
	color: #ccc;
	font-size: 0.78rem;
	font-style: italic;
	align-self: center;
}
</style>
