<script setup>
import { ref, defineComponent, h, markRaw } from 'vue';

const eatenCount = ref(0);
const isChomping = ref(false);

const cookie1Eaten = ref(false);
const cookie2Eaten = ref(false);
const cookie3Eaten = ref(false);
const cookie4Eaten = ref(false);

// Simple custom component for the component drag mode
const MintGhost = markRaw(defineComponent({
	name: 'MintGhost',
	setup() {
		return () => h('div', {
			style: {
				width: '60px',
				height: '60px',
				background: '#10b981',
				borderRadius: '50%',
				border: '3px solid #059669',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: 'white',
				fontWeight: 'bold',
				fontSize: '24px',
				boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
			}
		}, '🍃');
	}
}));

const onDrop = (success, cookieNum) => {
	if (!success) return;
	eatenCount.value++;
	if (cookieNum === 1) cookie1Eaten.value = true;
	if (cookieNum === 2) cookie2Eaten.value = true;
	if (cookieNum === 3) cookie3Eaten.value = true;
	if (cookieNum === 4) cookie4Eaten.value = true;
	
	isChomping.value = true;
	setTimeout(() => { isChomping.value = false; }, 800);
};

const reset = () => {
	cookie1Eaten.value = false;
	cookie2Eaten.value = false;
	cookie3Eaten.value = false;
	cookie4Eaten.value = false;
	eatenCount.value = 0;
};
</script>

<template>
	<div class="demo-root">
		<div class="header">
			<h1>Cookie Monster 2.1</h1>
			<p>Demonstrating all four dragItem modes. Eaten: {{ eatenCount }}</p>
		</div>

		<div class="main-stage">
			
			<!-- COOKIES COLUMN -->
			<div class="jar-side">
				<div class="jar-label">THE COOKIE JAR</div>
				
				<!-- Cookie 1: SELF -->
				<div 
					v-if="!cookie1Eaten"
					v-pnp-draggable="{ 
						keys: 'food', 
						dragItem: 'self', 
						onDropped: (s) => onDrop(s, 1) 
					}"
					class="cookie-item item-self"
				>
					<div class="cookie-box brown"></div>
					<div class="cookie-text">
						<strong>Choco (Self)</strong>
						<span>Actual element moves</span>
					</div>
				</div>
				<div v-else class="eaten-placeholder">Eaten!</div>

				<!-- Cookie 2: CLONE -->
				<div 
					v-if="!cookie2Eaten"
					v-pnp-draggable="{ 
						keys: 'food', 
						dragItem: 'clone', 
						onDropped: (s) => onDrop(s, 2) 
					}"
					class="cookie-item item-clone"
				>
					<div class="cookie-box pink"></div>
					<div class="cookie-text">
						<strong>Sugar (Clone)</strong>
						<span>Snapshot follows</span>
					</div>
				</div>
				<div v-else class="eaten-placeholder">Eaten!</div>

				<!-- Cookie 3: COMPONENT -->
				<div 
					v-if="!cookie3Eaten"
					v-pnp-draggable="{ 
						keys: 'food', 
						dragItem: MintGhost, 
						onDropped: (s) => onDrop(s, 3) 
					}"
					class="cookie-item item-comp"
				>
					<div class="cookie-box green"></div>
					<div class="cookie-text">
						<strong>Mint (Component)</strong>
						<span>Custom Vue ghost</span>
					</div>
				</div>
				<div v-else class="eaten-placeholder">Eaten!</div>

				<!-- Cookie 4: TEXT GHOST -->
				<div 
					v-if="!cookie4Eaten"
					v-pnp-draggable="{ 
						keys: 'food', 
						dragItem: '🍪 Nom me!', 
						onDropped: (s) => onDrop(s, 4) 
					}"
					class="cookie-item item-text"
				>
					<div class="cookie-box gold"></div>
					<div class="cookie-text">
						<strong>Oatmeal (Text)</strong>
						<span>Plain string ghost</span>
					</div>
				</div>
				<div v-else class="eaten-placeholder">Eaten!</div>

				<button @click="reset" class="reset-btn">Reset Jar</button>
			</div>

			<!-- CENTER HINT -->
			<div class="hint-side">
				<div class="arrow">➔</div>
				<div class="hint-sub">DRAG</div>
			</div>

			<!-- MONSTER SIDE -->
			<div class="monster-side">
				<div 
					v-pnp-dropzone="{ keys: 'food' }" 
					class="monster-target"
				>
					<div class="monster-face" :class="{ 'is-eating': isChomping }">
						<div class="eye left"></div>
						<div class="eye right"></div>
						<div class="mouth"></div>
					</div>
					<div class="target-label">FEED ME</div>
				</div>
			</div>

		</div>
	</div>
</template>

<style scoped>
.demo-root {
	padding: 40px;
	font-family: sans-serif;
	background: #f0f2f5;
	min-height: 100vh;
}

.header { margin-bottom: 30px; }
.header h1 { color: #1a1a2e; margin-bottom: 8px; }

.main-stage {
	display: flex;
	gap: 30px;
	border: 5px solid purple;
	padding: 30px;
	background: white;
	border-radius: 20px;
	align-items: center;
}

.jar-side {
	flex: 0 0 320px;
	border: 3px solid limegreen;
	padding: 20px;
	border-radius: 15px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.jar-label {
	font-weight: bold;
	color: #999;
	font-size: 12px;
	letter-spacing: 1px;
	margin-bottom: 5px;
}

.cookie-item {
	display: flex;
	align-items: center;
	gap: 15px;
	padding: 12px;
	background: #fff;
	border: 1px solid #ddd;
	border-radius: 10px;
	cursor: grab;
	transition: background 0.2s;
}
.cookie-item:hover { background: #f8faff; border-color: #3b82f6; }

.cookie-box {
	width: 44px;
	height: 44px;
	border-radius: 8px;
	flex-shrink: 0;
}
.brown { background: #8B4513; }
.pink { background: #FF69B4; }
.green { background: #10b981; }
.gold { background: #FFD700; }

.cookie-text { display: flex; flex-direction: column; gap: 2px; }
.cookie-text strong { font-size: 13px; color: #333; }
.cookie-text span { font-size: 10px; color: #888; }

.eaten-placeholder {
	height: 70px;
	border: 2px dashed #ccc;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #bbb;
	font-size: 12px;
	font-style: italic;
}

.reset-btn {
	margin-top: 10px;
	padding: 10px;
	border: none;
	background: #333;
	color: white;
	border-radius: 5px;
	cursor: pointer;
}

.hint-side {
	display: flex;
	flex-direction: column;
	align-items: center;
	color: #ccc;
}
.arrow { font-size: 40px; }
.hint-sub { font-size: 10px; font-weight: bold; }

.monster-side {
	flex: 1;
}

.monster-target {
	width: 100%;
	height: 350px;
	border: 3px dashed #cbd5e1;
	border-radius: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 20px;
	transition: background 0.3s;
}

:deep(.pnp-dropzone-hovered) {
	background: #e0f2fe;
	border-color: #3b82f6;
	border-style: solid;
}

.monster-face {
	width: 160px;
	height: 160px;
	background: #2563eb;
	border-radius: 50%;
	position: relative;
	transition: transform 0.2s;
}

.eye {
	width: 34px;
	height: 40px;
	background: white;
	border-radius: 50%;
	position: absolute;
	top: 45px;
}
.eye.left { left: 38px; }
.eye.right { right: 38px; }
.eye::after {
	content: '';
	width: 14px;
	height: 14px;
	background: #000;
	border-radius: 50%;
	position: absolute;
	top: 12px;
	left: 10px;
}

.mouth {
	width: 70px;
	height: 12px;
	background: #0f172a;
	border-radius: 6px;
	position: absolute;
	bottom: 45px;
	left: 45px;
	transition: height 0.2s, bottom 0.2s;
}

.is-eating .mouth {
	height: 60px;
	bottom: 25px;
	border-radius: 50% 50% 10px 10px;
}

.target-label {
	font-weight: bold;
	color: #64748b;
	letter-spacing: 2px;
}
</style>
