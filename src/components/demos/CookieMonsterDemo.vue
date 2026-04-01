<!--
	CookieMonsterDemo.vue
	---------------------

	Shows three stylized cookies demonstrating the core dragItem modes:
	  - 'self'      — the original DOM element physically travels to the drag layer
	  - 'clone'     — a frozen snapshot follows the cursor
	  - component   — a custom Vue component renders as the ghost (Sparkly Golden Star)

	The monster opens its mouth when a cookie is hovering and chomps when one lands.
-->
<script setup>
import { ref, defineComponent, h, markRaw, computed } from 'vue';

// ── Golden Star ghost component ────────────────────────────────────────────────
const GoldenCookieGhost = markRaw(defineComponent({
	name: 'GoldenCookieGhost',
	props: ['ctx', 'groupCtx', 'delta', 'startMouse', 'currentMouse'],
	setup() {
		return () => h('div', { class: 'golden-ghost-wrap' }, [
			h('svg', {
				viewBox: '0 0 100 100',
				width: '100',
				height: '100',
				style: {
					filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.9)) drop-shadow(0 0 4px rgba(255,165,0,0.7))',
					display: 'block',
				},
			}, [
				h('circle', { cx: '50', cy: '50', r: '46', fill: 'rgba(255,215,0,0.12)' }),
				h('polygon', {
					points: '50,6 61,36 93,36 68,56 78,86 50,68 22,86 32,56 7,36 39,36',
					fill: '#FFD700',
					stroke: '#B8860B',
					'stroke-width': '2.5',
					'stroke-linejoin': 'round',
				}),
				h('polygon', {
					points: '50,16 58,38 82,38 63,52 70,74 50,62 30,74 37,52 18,38 42,38',
					fill: '#FFEC6E',
					opacity: '0.5',
				}),
				h('g', { fill: 'white', opacity: '0.95' }, [
					h('polygon', { points: '78,12 80,18 86,20 80,22 78,28 76,22 70,20 76,18' }),
					h('polygon', { points: '18,72 20,76 24,78 20,80 18,84 16,80 12,78 16,76', opacity: '0.8' }),
				]),
			]),
			h('div', { class: 'golden-ghost-label' }, '✨ Golden Star'),
		]);
	},
}));

// ── State ─────────────────────────────────────────────────────────────────────

const cookies = ref([
	{
		id: 'self',
		name: 'Triple Choco',
		type: 'choco',
		subtitle: 'self — moves element',
		dragItem: 'self',
		eaten: false,
	},
	{
		id: 'clone',
		name: 'Pink Velvet',
		type: 'pink',
		subtitle: 'clone — snapshots',
		dragItem: 'clone',
		eaten: false,
	},
	{
		id: 'star',
		name: 'Star Gazer',
		type: 'star',
		subtitle: 'component — custom',
		dragItem: GoldenCookieGhost,
		eaten: false,
	}
]);

const cookiesEaten = ref(0);
const chomping = ref(false);
const nomText = ref('');
const NOM_LINES = ['NOM NOM NOM!', 'DELICIOUS!', 'MORE PLEASE!', 'YUMMY!', 'CHOMP!', 'SO GOOD!'];

const draggableOpts = (cookie) => ({
	keys: 'cookie',
	ctx: { cookieId: cookie.id },
	dragItem: cookie.dragItem,
	onDropped: (success) => {
		if (!success) return;
		cookiesEaten.value++;
		cookie.eaten = true;
		nomText.value = NOM_LINES[cookiesEaten.value % NOM_LINES.length];
		chomping.value = true;
		setTimeout(() => {
			chomping.value = false;
			nomText.value = '';
		}, 900);
	},
});

const monsterOpts = {
	keys: 'cookie',
	ctx: { type: 'monster' },
};

const resetCookies = () => {
	cookies.value.forEach(c => { c.eaten = false; });
	cookiesEaten.value = 0;
	nomText.value = '';
	chomping.value = false;
};

const allEaten = computed(() => cookies.value.every(c => c.eaten));
</script>

<template>
	<div class="demo-wrap">
		<div class="demo-header">
			<h2>Stylized Drag Modes</h2>
			<p>Feed the monster to see the three main drag modes in action. Each cookie uses a different technique to render its "ghost".</p>
		</div>

		<div class="stage">
			<!-- ── Left: cookies ──────────────────────────────────── -->
			<div class="cookies-panel">
				<div class="panel-title">Cookie Jar</div>
				<div class="cookies-grid">
					<template v-for="cookie in cookies" :key="cookie.id">
						<div
							v-if="!cookie.eaten"
							v-pnp-draggable="draggableOpts(cookie)"
							class="cookie-card"
							:class="[`cookie-${cookie.type}`, `mode-${cookie.id}`]"
						>
							<div class="cookie-visual">
								<!-- Choco Chunk SVG -->
								<svg v-if="cookie.type === 'choco'" viewBox="0 0 80 80" class="cookie-svg">
									<defs>
										<radialGradient id="grad-choco" cx="40%" cy="38%" r="60%">
											<stop offset="0%" stop-color="#8B4513"/>
											<stop offset="100%" stop-color="#4B2508"/>
										</radialGradient>
									</defs>
									<circle cx="40" cy="40" r="36" fill="url(#grad-choco)" stroke="#3D1C00" stroke-width="2"/>
									<!-- Chunks -->
									<rect x="22" y="25" width="12" height="10" rx="2" fill="#2A1200" transform="rotate(15 28 30)"/>
									<rect x="45" y="20" width="10" height="10" rx="2" fill="#2A1200" transform="rotate(-10 50 25)"/>
									<rect x="50" y="45" width="14" height="12" rx="3" fill="#2A1200" transform="rotate(25 57 51)"/>
									<rect x="20" y="50" width="10" height="8" rx="2" fill="#2A1200" transform="rotate(-20 25 54)"/>
									<circle cx="38" cy="58" r="5" fill="#2A1200"/>
									<!-- Highlight -->
									<ellipse cx="30" cy="25" rx="15" ry="8" fill="white" opacity="0.1" transform="rotate(-20 30 25)"/>
								</svg>

								<!-- Pink Frosted SVG -->
								<svg v-if="cookie.type === 'pink'" viewBox="0 0 80 80" class="cookie-svg">
									<defs>
										<linearGradient id="grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" stop-color="#FFD1DC"/>
											<stop offset="100%" stop-color="#FF69B4"/>
										</linearGradient>
									</defs>
									<circle cx="40" cy="40" r="36" fill="#F5DEB3" stroke="#D2B48C" stroke-width="1.5"/>
									<circle cx="40" cy="40" r="28" fill="url(#grad-pink)"/>
									<!-- Sprinkles -->
									<rect x="30" y="25" width="2" height="6" rx="1" fill="#FFF" transform="rotate(45 31 28)"/>
									<rect x="50" y="35" width="2" height="6" rx="1" fill="#4B0082" transform="rotate(-30 51 38)"/>
									<rect x="35" y="50" width="2" height="6" rx="1" fill="#00FF00" transform="rotate(90 36 53)"/>
									<rect x="45" y="55" width="2" height="6" rx="1" fill="#FFFF00" transform="rotate(15 46 58)"/>
									<rect x="25" y="40" width="2" height="6" rx="1" fill="#0000FF" transform="rotate(-60 26 43)"/>
								</svg>

								<!-- Golden Star SVG -->
								<svg v-if="cookie.type === 'star'" viewBox="0 0 80 80" class="cookie-svg">
									<polygon
										points="40,5 49,27 73,27 54,42 61,65 40,51 19,65 26,42 7,27 31,27"
										fill="#FFD700" stroke="#B8860B" stroke-width="2" stroke-linejoin="round"
									/>
									<circle cx="40" cy="38" r="8" fill="#FFF" opacity="0.3"/>
									<polygon points="65,15 67,21 73,23 67,25 65,31 63,25 57,23 63,21" fill="white"/>
								</svg>
							</div>
							<div class="cookie-info">
								<span class="cookie-name">{{ cookie.name }}</span>
								<span class="cookie-mode">{{ cookie.subtitle }}</span>
							</div>
						</div>
						<div v-else class="cookie-eaten-slot">🍽️ Nom'd!</div>
					</template>
				</div>
				<button class="reset-btn" @click="resetCookies" :disabled="cookiesEaten === 0">
					🔄 Reset Cookies
				</button>
			</div>

			<div class="drag-hint">
				<span class="hint-arrow">→</span>
				<span class="hint-text">drag to feed</span>
			</div>

			<!-- ── Right: monster ─────────────────────────────────── -->
			<div class="monster-panel">
				<div class="panel-title">
					Hungry Monster
					<span class="eaten-badge" v-if="cookiesEaten > 0">{{ cookiesEaten }} eaten</span>
				</div>

				<div
					v-pnp-dropzone="monsterOpts"
					class="monster-zone"
					:class="{ chomping }"
				>
					<svg viewBox="0 0 200 210" class="monster-svg">
						<path class="monster-fur" d="M20,100 L18,82 L28,68 L22,55 L38,65 L35,48 L48,62 L50,44 L63,60 L68,42 L78,60 L88,40 L95,60 L100,38 L105,60 L112,40 L122,60 L132,42 L137,62 L150,44 L152,62 L165,48 L162,65 L178,55 L172,68 L182,82 L180,100 L182,130 L178,155 L165,172 L150,183 L130,190 L100,193 L70,190 L50,183 L35,172 L22,155 L18,130 Z" fill="#2563EB"/>
						<ellipse cx="68" cy="92" rx="26" ry="28" fill="white"/>
						<ellipse cx="132" cy="92" rx="26" ry="28" fill="white"/>
						<circle cx="71" cy="94" r="12" fill="#1a1a2e"/>
						<circle cx="135" cy="94" r="12" fill="#1a1a2e"/>
						<circle cx="65" cy="85" r="5" fill="white"/>
						<circle cx="129" cy="85" r="5" fill="white"/>

						<!-- Mouth CLOSED -->
						<path class="mc" d="M60,155 Q100,175 140,155" fill="none" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>

						<!-- Mouth OPEN -->
						<g class="mo">
							<path d="M60,150 Q100,220 140,150 Z" fill="#0f172a"/>
							<rect x="70"  y="150" width="15" height="20" rx="4" fill="white"/>
							<rect x="92"  y="150" width="15" height="24" rx="4" fill="white"/>
							<rect x="114" y="150" width="15" height="20" rx="4" fill="white"/>
							<ellipse cx="100" cy="185" rx="25" ry="12" fill="#E11D48"/>
						</g>
					</svg>

					<Transition name="nom">
						<div v-if="nomText" class="nom-text">{{ nomText }}</div>
					</Transition>
					<div class="drop-hint">{{ allEaten ? 'Burp! So full.' : 'Drop a cookie here!' }}</div>
				</div>
			</div>
		</div>

		<!-- Legend -->
		<div class="legend">
			<div class="legend-grid">
				<div class="legend-item">
					<span class="legend-dot dot-self"></span>
					<div><strong>self</strong> — The actual cookie element jumps into the drag layer.</div>
				</div>
				<div class="legend-item">
					<span class="legend-dot dot-clone"></span>
					<div><strong>clone</strong> — A static snapshot of the cookie follows the mouse.</div>
				</div>
				<div class="legend-item">
					<span class="legend-dot dot-comp"></span>
					<div><strong>component</strong> — A dedicated Star Ghost component is mounted.</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.demo-wrap { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
.demo-header h2 { font-size: 1.5rem; color: #1e293b; margin-bottom: 0.5rem; }
.demo-header p { color: #64748b; font-size: 0.95rem; }

.stage { display: flex; align-items: flex-start; gap: 2rem; }

.cookies-panel {
	background: #fff;
	padding: 1.5rem;
	border-radius: 1rem;
	box-shadow: 0 4px 12px rgba(0,0,0,0.05);
	min-width: 300px;
}

.panel-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 1.25rem; }
.cookies-grid { display: flex; flex-direction: column; gap: 1rem; }

.cookie-card {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.75rem 1rem;
	background: #f8fafc;
	border: 1.5px solid #e2e8f0;
	border-radius: 0.75rem;
	cursor: grab;
	transition: all 0.2s;
}

.cookie-card:hover { border-color: #3b82f6; background: #eff6ff; transform: translateY(-2px); }
.cookie-card:active { cursor: grabbing; }

.cookie-svg { width: 64px; height: 64px; flex-shrink: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
.cookie-info { display: flex; flex-direction: column; }
.cookie-name { font-weight: 700; color: #334155; }
.cookie-mode { font-size: 0.75rem; color: #64748b; }

.cookie-eaten-slot {
	height: 84px;
	border: 2px dashed #e2e8f0;
	border-radius: 0.75rem;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #94a3b8;
	font-style: italic;
}

.reset-btn {
	margin-top: 1.5rem;
	width: 100%;
	padding: 0.6rem;
	background: #f1f5f9;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	color: #475569;
	cursor: pointer;
}
.reset-btn:hover:not(:disabled) { background: #e2e8f0; color: #1e293b; }
.reset-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.drag-hint { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #cbd5e1; padding-top: 4rem; }
.hint-arrow { font-size: 2rem; animation: slide 1.5s infinite; }
@keyframes slide { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }

.monster-panel { background: #fff; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; max-width: 400px; }
.eaten-badge { margin-left: 0.5rem; background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 1rem; font-size: 0.7rem; }

.monster-zone { position: relative; display: flex; flex-direction: column; align-items: center; min-height: 280px; padding: 1rem; border-radius: 0.75rem; transition: background 0.3s; }
.monster-zone.pnp-dropzone-hovered { background: #f0f9ff; }
.monster-zone .mo { display: none; }
.monster-zone.pnp-dropzone-hovered .mo, .monster-zone.chomping .mo { display: block; }
.monster-zone.pnp-dropzone-hovered .mc, .monster-zone.chomping .mc { display: none; }

.monster-svg { width: 180px; height: 190px; filter: drop-shadow(0 10px 15px rgba(37,99,235,0.2)); }
.chomping .monster-svg { animation: chomp 0.3s infinite; }
@keyframes chomp { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

.nom-text { position: absolute; top: -1rem; font-size: 1.5rem; font-weight: 900; color: #2563eb; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.drop-hint { margin-top: 1rem; font-size: 0.85rem; color: #94a3b8; font-style: italic; }

.legend { background: #fff; padding: 1.25rem; border-radius: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.legend-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.legend-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #475569; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.dot-self { background: #8B4513; }
.dot-clone { background: #FF69B4; }
.dot-comp { background: #FFD700; }

:global(.golden-ghost-wrap) { display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none; }
:global(.golden-ghost-label) { background: rgba(255,255,255,0.9); padding: 4px 12px; border-radius: 2rem; font-weight: 800; color: #B8860B; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
</style>
