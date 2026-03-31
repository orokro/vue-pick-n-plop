<!--
	App.vue
	-------

	Shell for the Vue Pick-n-Plop demo gallery.
	Add new demos to the `demos` array and they appear in the sidebar automatically.
	PNPDragLayer lives here so it is always mounted regardless of which demo is active.
-->
<script setup>
import { ref, computed } from 'vue';
import CategoryFilterDemo from './components/demos/CategoryFilterDemo.vue';
import DragHandleDemo from './components/demos/DragHandleDemo.vue';
import CancelModifiersDemo from './components/demos/CancelModifiersDemo.vue';
import MultiSelectDemo from './components/demos/MultiSelectDemo.vue';
import SortTouchDemo from './components/demos/SortTouchDemo.vue';

/**
 * @typedef {{ id: string, label: string, icon: string, description: string, component: object }} DemoEntry
 */

/** @type {DemoEntry[]} */
const demos = [
	{
		id: 'category-filter',
		label: 'Category Filter',
		icon: '🗂️',
		description: 'Drag items to overlapping category zones',
		component: CategoryFilterDemo,
	},
	{
		id: 'drag-handle',
		label: 'Drag Handles',
		icon: '⠿',
		description: 'Restrict drag initiation to a specific handle element',
		component: DragHandleDemo,
	},
	{
		id: 'cancel-modifiers',
		label: 'Cancel & Modifiers',
		icon: '⌨️',
		description: 'Cancel keys, right-click cancel, modifier key detection',
		component: CancelModifiersDemo,
	},
	{
		id: 'multi-select',
		label: 'Multi-Select',
		icon: '☑️',
		description: 'Click to select multiple cards, drag them all at once',
		component: MultiSelectDemo,
	},
	{
		id: 'sort-touch',
		label: 'Sort & Touch',
		icon: '↕️',
		description: 'Reorder lists with placeholder, no oscillation, touch support',
		component: SortTouchDemo,
	},
];

/** @type {import('vue').Ref<string>} */
const currentDemoId = ref('category-filter');

/** @type {import('vue').ComputedRef<DemoEntry>} */
const currentDemo = computed(() => demos.find(d => d.id === currentDemoId.value) ?? demos[0]);
</script>

<template>
	<!-- Single drag layer for the whole app — must be mounted once at the root -->
	<PNPDragLayer :z-index="9999" />

	<div class="app-shell">

		<aside class="app-sidebar">
			<div class="sidebar-brand">
				<span class="brand-icon">🖱️</span>
				<div class="brand-text">
					<span class="brand-name">Pick-n-Plop</span>
					<span class="brand-sub">Demo Gallery</span>
				</div>
			</div>

			<nav class="demo-nav">
				<div class="nav-label">Demos</div>
				<button
					v-for="demo in demos"
					:key="demo.id"
					class="nav-item"
					:class="{ active: currentDemoId === demo.id }"
					@click="currentDemoId = demo.id"
				>
					<span class="nav-icon">{{ demo.icon }}</span>
					<div class="nav-text">
						<span class="nav-title">{{ demo.label }}</span>
						<span class="nav-desc">{{ demo.description }}</span>
					</div>
				</button>
			</nav>
		</aside>

		<main class="app-main">
			<component :is="currentDemo.component" />
		</main>

	</div>
</template>

<style>
/* Global resets & base */
*, *::before, *::after {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
}

body {
	font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	background: #f5f6fa;
	color: #2c3e50;
	height: 100vh;
	overflow: hidden;
}

#app {
	height: 100vh;
}

/* Layout shell */
.app-shell {
	display: flex;
	height: 100vh;
}

/* ── Sidebar ─────────────────────────────────────────────── */
.app-sidebar {
	width: 230px;
	flex-shrink: 0;
	background: #16213e;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.sidebar-brand {
	display: flex;
	align-items: center;
	gap: 0.7rem;
	padding: 1.1rem 1rem;
	border-bottom: 1px solid rgba(255,255,255,0.07);
}

.brand-icon {
	font-size: 1.7rem;
}

.brand-text {
	display: flex;
	flex-direction: column;
}

.brand-name {
	font-weight: 700;
	font-size: 0.95rem;
	color: #ffffff;
	letter-spacing: 0.2px;
}

.brand-sub {
	font-size: 0.65rem;
	color: rgba(255,255,255,0.35);
	text-transform: uppercase;
	letter-spacing: 0.8px;
}

.demo-nav {
	flex: 1;
	padding: 0.9rem 0.75rem;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	overflow-y: auto;
}

.nav-label {
	font-size: 0.62rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 1.1px;
	color: rgba(255,255,255,0.28);
	padding: 0 0.3rem;
	margin-bottom: 0.4rem;
}

.nav-item {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.55rem 0.7rem;
	border-radius: 8px;
	border: none;
	background: transparent;
	color: rgba(255,255,255,0.55);
	cursor: pointer;
	text-align: left;
	width: 100%;
	transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
	background: rgba(255,255,255,0.07);
	color: rgba(255,255,255,0.9);
}

.nav-item.active {
	background: rgba(255,255,255,0.11);
	color: #ffffff;
}

.nav-icon {
	font-size: 1.05rem;
	flex-shrink: 0;
}

.nav-text {
	display: flex;
	flex-direction: column;
}

.nav-title {
	font-size: 0.83rem;
	font-weight: 600;
}

.nav-desc {
	font-size: 0.67rem;
	color: rgba(255,255,255,0.35);
	line-height: 1.3;
	margin-top: 1px;
}

.nav-item.active .nav-desc {
	color: rgba(255,255,255,0.5);
}

/* ── Main content ────────────────────────────────────────── */
.app-main {
	flex: 1;
	overflow-y: auto;
	background: #f5f6fa;
}

/* ── Global drag ghost style ─────────────────────────────── */
.pnp-drag-item-clone {
	opacity: 0.88;
	transform: rotate(2deg) scale(1.06);
	pointer-events: none;
	filter: drop-shadow(0 8px 18px rgba(0,0,0,0.22));
}
</style>
