<!--
	CookieMonsterDemo.vue
	---------------------

	Shows all four dragItem modes side by side:
	  - 'self'      — the original DOM element physically travels to the drag layer
	  - 'clone'     — a frozen snapshot follows the cursor
	  - component   — a custom Vue component renders as the ghost (sparkly SVG star cookie)
	  - text string — a plain text label follows the cursor

	All cookies can be dragged onto the hungry monster on the right.
	The monster opens its mouth when a cookie is hovering above it and
	chomps when one lands.
-->
<script setup>
import { ref, defineComponent, h } from 'vue';

// ── Golden Star ghost component ────────────────────────────────────────────────
/**
 * Custom drag ghost rendered only for the star cookie.
 * Receives standard PNP drag props; renders a glowing gold SVG star.
 * @type {import('vue').Component}
 */
const GoldenCookieGhost = defineComponent({
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
				// Outer glow ring
				h('circle', { cx: '50', cy: '50', r: '46', fill: 'rgba(255,215,0,0.12)' }),
				// Star shape
				h('polygon', {
					points: '50,6 61,36 93,36 68,56 78,86 50,68 22,86 32,56 7,36 39,36',
					fill: '#FFD700',
					stroke: '#B8860B',
					'stroke-width': '2.5',
					'stroke-linejoin': 'round',
				}),
				// Inner lighter star highlight
				h('polygon', {
					points: '50,16 58,38 82,38 63,52 70,74 50,62 30,74 37,52 18,38 42,38',
					fill: '#FFEC6E',
					opacity: '0.5',
				}),
				// Sparkle crosses
				h('g', { fill: 'white', opacity: '0.95' }, [
					// top-right sparkle
					h('polygon', { points: '78,12 80,18 86,20 80,22 78,28 76,22 70,20 76,18' }),
					// bottom-left sparkle
					h('polygon', { points: '18,72 20,76 24,78 20,80 18,84 16,80 12,78 16,76', opacity: '0.8' }),
				]),
			]),
			h('div', { class: 'golden-ghost-label' }, '✨ Golden Star'),
		]);
	},
});

// ── State ─────────────────────────────────────────────────────────────────────

/** @typedef {{ id: string, name: string, subtitle: string, dragItem: any, eaten: boolean }} CookieDef */

/** @type {import('vue').Ref<CookieDef[]>} */
const cookies = ref([
	{
		id: 'self',
		name: 'Classic Chip',
		subtitle: 'self — element moves',
		dragItem: 'self',
		eaten: false,
	},
	{
		id: 'clone',
		name: 'Sugar Heart',
		subtitle: 'clone — frozen snapshot',
		dragItem: 'clone',
		eaten: false,
	},
	{
		id: 'star',
		name: 'Golden Star',
		subtitle: 'component — custom ghost',
		dragItem: GoldenCookieGhost,
		eaten: false,
	},
	{
		id: 'snick',
		name: 'Snickerdoodle',
		subtitle: 'text — label follows',
		dragItem: '🍪 Nom me!',
		eaten: false,
	},
]);

/** @type {import('vue').Ref<number>} */
const cookiesEaten = ref(0);

/** @type {import('vue').Ref<boolean>} */
const chomping = ref(false);

/** @type {import('vue').Ref<string>} */
const nomText = ref('');

const NOM_LINES = ['NOM NOM NOM!', 'DELICIOUS!', 'MORE PLEASE!', 'YUMMY!', 'CHOMP!', 'SO GOOD!'];

/**
 * Returns the draggable options for a cookie.
 *
 * @param {CookieDef} cookie
 * @returns {Object}
 */
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

/** Drop zone options for the monster's mouth. */
const monsterOpts = {
	keys: 'cookie',
	ctx: { type: 'monster' },
};

/**
 * Resets all cookies and the eaten counter.
 */
const resetCookies = () => {
	cookies.value.forEach(c => { c.eaten = false; });
	cookiesEaten.value = 0;
	nomText.value = '';
	chomping.value = false;
};
</script>

<template>
	<div class="demo-wrap">

		<div class="demo-header">
			<h2>Drag Modes</h2>
			<p>Four cookies, four ways to drag. Feed them all to the monster to see each mode in action.</p>
		</div>

		<div class="stage">

			<!-- ── Left: cookies ──────────────────────────────────── -->
			<div class="cookies-panel">
				<div class="panel-title">Cookie Jar</div>
				<div class="cookies-grid">

					<!-- Classic Chip — self drag -->
					<div
						v-if="!cookies[0].eaten"
						v-pnp-draggable="draggableOpts(cookies[0])"
						class="cookie-card"
						:class="{ 'cookie-self': true }"
					>
						<svg viewBox="0 0 80 80" class="cookie-svg">
							<defs>
								<radialGradient id="cc-grad" cx="40%" cy="38%" r="55%">
									<stop offset="0%" stop-color="#d4934a"/>
									<stop offset="100%" stop-color="#a0621e"/>
								</radialGradient>
							</defs>
							<circle cx="40" cy="40" r="36" fill="url(#cc-grad)" stroke="#8a5018" stroke-width="1.5"/>
							<!-- Chips -->
							<ellipse cx="27" cy="30" rx="5" ry="4" fill="#3D1C00" transform="rotate(-15 27 30)"/>
							<ellipse cx="51" cy="24" rx="4.5" ry="3.5" fill="#3D1C00" transform="rotate(10 51 24)"/>
							<ellipse cx="57" cy="47" rx="5" ry="4" fill="#3D1C00" transform="rotate(20 57 47)"/>
							<ellipse cx="21" cy="53" rx="4" ry="3.5" fill="#3D1C00" transform="rotate(-25 21 53)"/>
							<ellipse cx="42" cy="58" rx="4.5" ry="3.5" fill="#3D1C00" transform="rotate(5 42 58)"/>
							<ellipse cx="35" cy="20" rx="3.5" ry="3" fill="#3D1C00" transform="rotate(-10 35 20)"/>
							<!-- Highlight -->
							<ellipse cx="30" cy="28" rx="14" ry="8" fill="white" opacity="0.08" transform="rotate(-20 30 28)"/>
						</svg>
						<div class="cookie-info">
							<span class="cookie-name">{{ cookies[0].name }}</span>
							<span class="cookie-mode">{{ cookies[0].subtitle }}</span>
						</div>
					</div>
					<div v-else class="cookie-eaten-slot">🍽️ Eaten!</div>

					<!-- Sugar Heart — clone drag -->
					<div
						v-if="!cookies[1].eaten"
						v-pnp-draggable="draggableOpts(cookies[1])"
						class="cookie-card"
					>
						<svg viewBox="0 0 80 80" class="cookie-svg">
							<defs>
								<radialGradient id="sh-grad" cx="45%" cy="35%" r="60%">
									<stop offset="0%" stop-color="#ffb3d0"/>
									<stop offset="100%" stop-color="#e8749a"/>
								</radialGradient>
							</defs>
							<!-- Heart shape -->
							<path d="M40,65 C20,50 8,38 8,26 C8,16 16,10 26,12 C32,13 38,17 40,22 C42,17 48,13 54,12 C64,10 72,16 72,26 C72,38 60,50 40,65 Z"
								fill="url(#sh-grad)" stroke="#c95a80" stroke-width="1.5"/>
							<!-- Icing drizzle lines -->
							<path d="M22,30 Q35,25 50,32" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
							<path d="M18,42 Q32,37 52,43" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.75"/>
							<!-- Sprinkles -->
							<line x1="28" y1="52" x2="33" y2="54" stroke="#9B59B6" stroke-width="2.5" stroke-linecap="round"/>
							<line x1="46" y1="57" x2="51" y2="55" stroke="#3498DB" stroke-width="2.5" stroke-linecap="round"/>
							<line x1="37" y1="45" x2="33" y2="48" stroke="#E74C3C" stroke-width="2.5" stroke-linecap="round"/>
							<line x1="54" y1="47" x2="58" y2="50" stroke="#2ECC71" stroke-width="2.5" stroke-linecap="round"/>
							<line x1="30" y1="36" x2="26" y2="39" stroke="#F39C12" stroke-width="2.5" stroke-linecap="round"/>
						</svg>
						<div class="cookie-info">
							<span class="cookie-name">{{ cookies[1].name }}</span>
							<span class="cookie-mode">{{ cookies[1].subtitle }}</span>
						</div>
					</div>
					<div v-else class="cookie-eaten-slot">🍽️ Eaten!</div>

					<!-- Golden Star — custom component -->
					<div
						v-if="!cookies[2].eaten"
						v-pnp-draggable="draggableOpts(cookies[2])"
						class="cookie-card cookie-star-card"
					>
						<svg viewBox="0 0 80 80" class="cookie-svg">
							<defs>
								<radialGradient id="gs-grad" cx="48%" cy="36%" r="60%">
									<stop offset="0%" stop-color="#FFEC6E"/>
									<stop offset="100%" stop-color="#D4A000"/>
								</radialGradient>
							</defs>
							<polygon
								points="40,5 49,27 73,27 54,42 61,65 40,51 19,65 26,42 7,27 31,27"
								fill="url(#gs-grad)" stroke="#B8860B" stroke-width="1.5" stroke-linejoin="round"
							/>
							<!-- Inner highlight -->
							<polygon
								points="40,14 46,30 62,30 49,39 54,55 40,46 26,55 31,39 18,30 34,30"
								fill="white" opacity="0.18"
							/>
							<!-- Sparkle top-right -->
							<polygon points="66,8 68,14 74,16 68,18 66,24 64,18 58,16 64,14" fill="white" opacity="0.9"/>
						</svg>
						<div class="cookie-info">
							<span class="cookie-name">{{ cookies[2].name }}</span>
							<span class="cookie-mode">{{ cookies[2].subtitle }}</span>
						</div>
					</div>
					<div v-else class="cookie-eaten-slot">🍽️ Eaten!</div>

					<!-- Snickerdoodle — text mode -->
					<div
						v-if="!cookies[3].eaten"
						v-pnp-draggable="draggableOpts(cookies[3])"
						class="cookie-card cookie-snick-card"
					>
						<svg viewBox="0 0 80 80" class="cookie-svg">
							<defs>
								<radialGradient id="sn-grad" cx="40%" cy="36%" r="58%">
									<stop offset="0%" stop-color="#F5E6C8"/>
									<stop offset="100%" stop-color="#D4B57A"/>
								</radialGradient>
							</defs>
							<circle cx="40" cy="40" r="36" fill="url(#sn-grad)" stroke="#C4956A" stroke-width="1.5"/>
							<!-- Cinnamon dots -->
							<circle cx="28" cy="27" r="3.2" fill="#7B3F00" opacity="0.72"/>
							<circle cx="51" cy="23" r="2.8" fill="#7B3F00" opacity="0.72"/>
							<circle cx="58" cy="43" r="3.2" fill="#7B3F00" opacity="0.72"/>
							<circle cx="24" cy="50" r="2.8" fill="#7B3F00" opacity="0.7"/>
							<circle cx="44" cy="57" r="3" fill="#7B3F00" opacity="0.7"/>
							<circle cx="36" cy="36" r="2.4" fill="#7B3F00" opacity="0.65"/>
							<circle cx="56" cy="57" r="2.2" fill="#7B3F00" opacity="0.6"/>
							<!-- Highlight -->
							<ellipse cx="30" cy="27" rx="12" ry="7" fill="white" opacity="0.12" transform="rotate(-20 30 27)"/>
						</svg>
						<div class="cookie-info">
							<span class="cookie-name">{{ cookies[3].name }}</span>
							<span class="cookie-mode">{{ cookies[3].subtitle }}</span>
						</div>
					</div>
					<div v-else class="cookie-eaten-slot">🍽️ Eaten!</div>

				</div>

				<button class="reset-btn" @click="resetCookies" :disabled="cookiesEaten === 0">
					🍪 Reset Cookies
				</button>
			</div>

			<!-- ── Divider arrow ──────────────────────────────────── -->
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
					<!-- SVG Monster -->
					<svg viewBox="0 0 200 210" class="monster-svg">

						<!-- Fur / body silhouette — jagged edges for fluffiness -->
						<path class="monster-fur" d="
							M20,100
							L18,82 L28,68 L22,55 L38,65 L35,48 L48,62 L50,44
							L63,60 L68,42 L78,60 L88,40 L95,60 L100,38 L105,60
							L112,40 L122,60 L132,42 L137,62 L150,44 L152,62
							L165,48 L162,65 L178,55 L172,68 L182,82 L180,100
							L182,130 L178,155 L165,172 L150,183 L130,190 L100,193
							L70,190 L50,183 L35,172 L22,155 L18,130 Z
						" fill="#1D4ED8"/>

						<!-- Forehead highlight -->
						<ellipse cx="100" cy="70" rx="55" ry="25" fill="#3B6FEF" opacity="0.4"/>

						<!-- Eyes — whites -->
						<ellipse cx="68" cy="92" rx="26" ry="28" fill="white"/>
						<ellipse cx="132" cy="92" rx="26" ry="28" fill="white"/>
						<!-- Eye depth -->
						<ellipse cx="68" cy="97" rx="26" ry="22" fill="#E8EDF5" opacity="0.4"/>
						<ellipse cx="132" cy="97" rx="26" ry="22" fill="#E8EDF5" opacity="0.4"/>
						<!-- Pupils -->
						<ellipse cx="71" cy="94" rx="15" ry="17" fill="#1a1a2e"/>
						<ellipse cx="135" cy="94" rx="15" ry="17" fill="#1a1a2e"/>
						<!-- Iris ring -->
						<ellipse cx="71" cy="94" rx="15" ry="17" fill="none" stroke="#2244aa" stroke-width="2" opacity="0.5"/>
						<ellipse cx="135" cy="94" rx="15" ry="17" fill="none" stroke="#2244aa" stroke-width="2" opacity="0.5"/>
						<!-- Eye shine -->
						<circle cx="63" cy="84" r="5.5" fill="white" opacity="0.95"/>
						<circle cx="127" cy="84" r="5.5" fill="white" opacity="0.95"/>
						<circle cx="66" cy="87" r="2" fill="white" opacity="0.7"/>
						<circle cx="130" cy="87" r="2" fill="white" opacity="0.7"/>

						<!-- MOUTH CLOSED (default) -->
						<path class="mc" d="M58,152 Q100,172 142,152"
							fill="none" stroke="#0f2460" stroke-width="5.5" stroke-linecap="round"/>

						<!-- MOUTH OPEN (hover + chomp) -->
						<g class="mo">
							<!-- Outer mouth / throat -->
							<path d="M58,148 Q100,212 142,148 Z" fill="#0f2460"/>
							<!-- Upper teeth (rounded rectangles via paths) -->
							<rect x="66"  y="148" width="18" height="22" rx="6" fill="white"/>
							<rect x="91"  y="148" width="18" height="26" rx="6" fill="white"/>
							<rect x="116" y="148" width="18" height="22" rx="6" fill="white"/>
							<!-- Throat darkness -->
							<ellipse cx="100" cy="186" rx="32" ry="18" fill="#060f2a" opacity="0.9"/>
							<!-- Tongue -->
							<ellipse cx="100" cy="180" rx="26" ry="16" fill="#E0526A"/>
							<ellipse cx="100" cy="184" rx="18" ry="8" fill="#c43a52" opacity="0.5"/>
							<!-- Lower teeth -->
							<rect x="74"  y="196" width="16" height="14" rx="5" fill="white" transform="rotate(180 82 203)"/>
							<rect x="100" y="196" width="16" height="14" rx="5" fill="white" transform="rotate(180 108 203)"/>
						</g>

						<!-- Arms reaching out -->
						<g class="arm arm-left">
							<path d="M18,148 Q4,140 8,125 Q12,115 25,120" fill="#1D4ED8" stroke="#1534B8" stroke-width="2"/>
							<!-- Claws -->
							<line x1="8" y1="130" x2="-6" y2="122" stroke="#1D4ED8" stroke-width="9" stroke-linecap="round"/>
							<line x1="10" y1="138" x2="-5" y2="134" stroke="#1D4ED8" stroke-width="9" stroke-linecap="round"/>
							<line x1="14" y1="145" x2="0" y2="145" stroke="#1D4ED8" stroke-width="9" stroke-linecap="round"/>
						</g>
						<g class="arm arm-right">
							<path d="M182,148 Q196,140 192,125 Q188,115 175,120" fill="#1D4ED8" stroke="#1534B8" stroke-width="2"/>
							<line x1="192" y1="130" x2="206" y2="122" stroke="#1D4ED8" stroke-width="9" stroke-linecap="round"/>
							<line x1="190" y1="138" x2="205" y2="134" stroke="#1D4ED8" stroke-width="9" stroke-linecap="round"/>
							<line x1="186" y1="145" x2="200" y2="145" stroke="#1D4ED8" stroke-width="9" stroke-linecap="round"/>
						</g>

					</svg>

					<!-- Nom flash overlay -->
					<Transition name="nom">
						<div v-if="nomText" class="nom-text">{{ nomText }}</div>
					</Transition>

					<div class="drop-hint">Drop a cookie here!</div>
				</div>
			</div>

		</div>

		<!-- Mode legend -->
		<div class="legend">
			<div class="legend-title">Drag Modes</div>
			<div class="legend-grid">
				<div class="legend-item">
					<span class="legend-dot dot-self"></span>
					<div>
						<strong>self</strong> — the original DOM element is physically moved to the drag layer container.
						Vue's DOM reconciliation won't touch it mid-drag.
					</div>
				</div>
				<div class="legend-item">
					<span class="legend-dot dot-clone"></span>
					<div>
						<strong>clone</strong> — a deep clone of the element is created via <code>cloneNode(true)</code>
						and rendered in the drag layer. Original stays in place.
					</div>
				</div>
				<div class="legend-item">
					<span class="legend-dot dot-comp"></span>
					<div>
						<strong>component</strong> — any Vue component can be the ghost. Receives
						<code>ctx</code>, <code>groupCtx</code>, <code>delta</code>, <code>startMouse</code>,
						and <code>currentMouse</code> as props for full control.
					</div>
				</div>
				<div class="legend-item">
					<span class="legend-dot dot-text"></span>
					<div>
						<strong>string</strong> — any string (including emoji) is rendered as
						the drag label. Great for lightweight feedback.
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
	gap: 1.75rem;
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
	max-width: 560px;
	line-height: 1.5;
}

/* ── Stage layout ──────────────────────────────────────────── */
.stage {
	display: flex;
	align-items: flex-start;
	gap: 1.5rem;
}

/* ── Cookies panel ─────────────────────────────────────────── */
.cookies-panel {
	flex: 0 0 auto;
	background: #fff;
	border-radius: 14px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	padding: 1.25rem 1.25rem 1rem;
	min-width: 280px;
}

.panel-title {
	font-size: 0.78rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.9px;
	color: #999;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.cookies-grid {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.cookie-card {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	padding: 0.6rem 0.85rem;
	border-radius: 10px;
	background: #fafafa;
	border: 1px solid #eee;
	cursor: grab;
	user-select: none;
	transition: transform 0.12s, box-shadow 0.12s, background 0.12s;
}

.cookie-card:hover {
	background: #f0f6ff;
	border-color: #cce0ff;
	box-shadow: 0 3px 10px rgba(74,144,217,0.12);
	transform: translateY(-1px);
}

.cookie-card:active {
	cursor: grabbing;
	transform: scale(0.98);
}

.cookie-svg {
	width: 56px;
	height: 56px;
	flex-shrink: 0;
}

.cookie-star-card { background: linear-gradient(135deg, #fffbe6 0%, #fff9cc 100%); border-color: #ffe58a; }
.cookie-star-card:hover { background: linear-gradient(135deg, #fff3b0 0%, #ffeb7a 100%); border-color: #f5c400; }
.cookie-snick-card { background: linear-gradient(135deg, #fdf6ec 0%, #f9eed8 100%); border-color: #e8cfa0; }

.cookie-info {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.cookie-name {
	font-size: 0.88rem;
	font-weight: 700;
	color: #2c3e50;
}

.cookie-mode {
	font-size: 0.72rem;
	color: #999;
	margin-top: 1px;
}

.cookie-eaten-slot {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 76px;
	border-radius: 10px;
	border: 2px dashed #ddd;
	color: #ccc;
	font-size: 0.82rem;
	font-style: italic;
	gap: 0.4rem;
}

.reset-btn {
	margin-top: 1rem;
	width: 100%;
	padding: 0.5rem;
	border-radius: 8px;
	border: 1px solid #e0e0e0;
	background: #f8f8f8;
	color: #666;
	font-size: 0.8rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.reset-btn:hover:not(:disabled) {
	background: #fff3e0;
	border-color: #ffcc80;
	color: #e65100;
}

.reset-btn:disabled {
	opacity: 0.4;
	cursor: default;
}

/* ── Drag hint arrow ───────────────────────────────────────── */
.drag-hint {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.4rem;
	padding-top: 3rem;
	color: #ccc;
	flex-shrink: 0;
}

.hint-arrow {
	font-size: 2rem;
	animation: pulse-right 1.4s ease-in-out infinite;
}

.hint-text {
	font-size: 0.7rem;
	text-transform: uppercase;
	letter-spacing: 0.8px;
}

@keyframes pulse-right {
	0%, 100% { transform: translateX(0); opacity: 0.6; }
	50% { transform: translateX(6px); opacity: 1; }
}

/* ── Monster panel ─────────────────────────────────────────── */
.monster-panel {
	flex: 1;
	background: #fff;
	border-radius: 14px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	padding: 1.25rem;
	min-width: 260px;
	max-width: 380px;
}

.eaten-badge {
	margin-left: 0.5rem;
	background: #e74c3c;
	color: white;
	font-size: 0.68rem;
	padding: 2px 7px;
	border-radius: 10px;
	font-weight: 700;
	letter-spacing: 0.3px;
}

.monster-zone {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	border-radius: 12px;
	padding: 1rem 0.5rem 0.5rem;
	transition: background 0.2s;
	min-height: 280px;
}

/* Pnp dropzone class hooks */
.monster-zone.pnp-dropzone-hovered {
	background: rgba(29, 78, 216, 0.05);
}

/* Monster open/close mouth via CSS class hooks */
.monster-zone .mc { display: block; }
.monster-zone .mo { display: none; }
.monster-zone.pnp-dropzone-hovered .mc { display: none; }
.monster-zone.pnp-dropzone-hovered .mo { display: block; }
.monster-zone.chomping .mc { display: none; }
.monster-zone.chomping .mo { display: block; }

.monster-svg {
	width: 200px;
	height: 210px;
	filter: drop-shadow(0 8px 20px rgba(29, 78, 216, 0.3));
	transition: filter 0.2s, transform 0.15s;
}

.monster-zone.pnp-dropzone-hovered .monster-svg {
	filter: drop-shadow(0 8px 28px rgba(29, 78, 216, 0.5));
	transform: scale(1.03);
}

.monster-zone.chomping .monster-svg {
	animation: chomp 0.35s ease-in-out;
}

@keyframes chomp {
	0%, 100% { transform: scale(1); }
	40% { transform: scale(1.12) rotate(-2deg); }
	70% { transform: scale(0.96) rotate(1deg); }
}

.drop-hint {
	font-size: 0.78rem;
	color: #bbb;
	margin-top: 0.5rem;
	font-style: italic;
}

.monster-zone.pnp-dropzone-hovered .drop-hint {
	color: #4a90d9;
}

.nom-text {
	position: absolute;
	top: 10px;
	left: 50%;
	transform: translateX(-50%);
	font-size: 1.4rem;
	font-weight: 900;
	color: #1D4ED8;
	text-shadow: 0 2px 8px rgba(29,78,216,0.25);
	white-space: nowrap;
	pointer-events: none;
}

.nom-enter-active { animation: nom-pop 0.25s ease-out; }
.nom-leave-active { animation: nom-fade 0.5s ease-in forwards; }

@keyframes nom-pop {
	0% { opacity: 0; transform: translateX(-50%) scale(0.5) translateY(8px); }
	100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
}

@keyframes nom-fade {
	0% { opacity: 1; transform: translateX(-50%) translateY(0); }
	100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}

/* ── Legend ────────────────────────────────────────────────── */
.legend {
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 1px 4px rgba(0,0,0,0.07);
	padding: 1rem 1.25rem;
}

.legend-title {
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.8px;
	color: #aaa;
	margin-bottom: 0.75rem;
}

.legend-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.7rem 1.5rem;
}

.legend-item {
	display: flex;
	align-items: flex-start;
	gap: 0.6rem;
	font-size: 0.8rem;
	color: #555;
	line-height: 1.45;
}

.legend-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	flex-shrink: 0;
	margin-top: 3px;
}

.dot-self  { background: #e74c3c; }
.dot-clone { background: #3498db; }
.dot-comp  { background: #f39c12; }
.dot-text  { background: #2ecc71; }

code {
	background: #f4f4f4;
	border-radius: 3px;
	padding: 1px 4px;
	font-size: 0.78rem;
	color: #c0392b;
}

/* ── Golden ghost (custom component) ──────────────────────── */
:global(.golden-ghost-wrap) {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
}

:global(.golden-ghost-label) {
	font-size: 0.75rem;
	font-weight: 700;
	color: #B8860B;
	text-shadow: 0 1px 3px rgba(184,134,11,0.3);
	background: rgba(255,255,255,0.85);
	border-radius: 4px;
	padding: 1px 6px;
}
</style>
