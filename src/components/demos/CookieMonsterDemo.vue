<script setup>
import { ref } from 'vue';

const eatenCount = ref(0);
const isChomping = ref(false);

const cookie1Eaten = ref(false);
const cookie2Eaten = ref(false);
const cookie3Eaten = ref(false);

const onDrop = (success, cookieNum) => {
	if (!success) return;
	eatenCount.value++;
	if (cookieNum === 1) cookie1Eaten.value = true;
	if (cookieNum === 2) cookie2Eaten.value = true;
	if (cookieNum === 3) cookie3Eaten.value = true;
	
	isChomping.value = true;
	setTimeout(() => { isChomping.value = false; }, 800);
};

const reset = () => {
	cookie1Eaten.value = false;
	cookie2Eaten.value = false;
	cookie3Eaten.value = false;
	eatenCount.value = 0;
};
</script>

<template>
	<div class="demo-root">
		<div class="header">
			<h1>Cookie Monster 2.0</h1>
			<p>If you see the purple and green boxes, the UI is rendering. Eaten: {{ eatenCount }}</p>
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

				<!-- Cookie 3: TEXT GHOST -->
				<div 
					v-if="!cookie3Eaten"
					v-pnp-draggable="{ 
						keys: 'food', 
						dragItem: '🍪 YUM!', 
						onDropped: (s) => onDrop(s, 3) 
					}"
					class="cookie-item item-text"
				>
					<div class="cookie-box gold"></div>
					<div class="cookie-text">
						<strong>Star (Text)</strong>
						<span>String ghost</span>
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
					:class="{ 'is-hovered': false }"
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
	border: 5px solid purple; /* EXTREMELY OBVIOUS BORDER */
	padding: 30px;
	background: white;
	border-radius: 20px;
	align-items: center;
}

.jar-side {
	flex: 0 0 300px;
	border: 3px solid limegreen; /* EXTREMELY OBVIOUS BORDER */
	padding: 20px;
	border-radius: 15px;
	display: flex;
	flex-direction: column;
	gap: 15px;
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
	padding: 15px;
	background: #fff;
	border: 1px solid #ddd;
	border-radius: 10px;
	cursor: grab;
	transition: background 0.2s;
}
.cookie-item:hover { background: #f8faff; border-color: #3b82f6; }

.cookie-box {
	width: 50px;
	height: 50px;
	border-radius: 8px;
	flex-shrink: 0;
}
.brown { background: #8B4513; }
.pink { background: #FF69B4; }
.gold { background: #FFD700; }

.cookie-text { display: flex; flex-direction: column; gap: 2px; }
.cookie-text strong { font-size: 14px; color: #333; }
.cookie-text span { font-size: 11px; color: #888; }

.eaten-placeholder {
	height: 82px;
	border: 2px dashed #ccc;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #bbb;
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
	height: 300px;
	border: 3px dashed #cbd5e1;
	border-radius: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 20px;
	transition: background 0.3s;
}

/* Library Hover Class */
:deep(.pnp-dropzone-hovered) {
	background: #e0f2fe;
	border-color: #3b82f6;
	border-style: solid;
}

.monster-face {
	width: 150px;
	height: 150px;
	background: #2563eb;
	border-radius: 50%;
	position: relative;
	transition: transform 0.2s;
}

.eye {
	width: 30px;
	height: 35px;
	background: white;
	border-radius: 50%;
	position: absolute;
	top: 40px;
}
.eye.left { left: 35px; }
.eye.right { right: 35px; }
.eye::after {
	content: '';
	width: 12px;
	height: 12px;
	background: #000;
	border-radius: 50%;
	position: absolute;
	top: 10px;
	left: 9px;
}

.mouth {
	width: 60px;
	height: 10px;
	background: #0f172a;
	border-radius: 5px;
	position: absolute;
	bottom: 40px;
	left: 45px;
	transition: height 0.2s, bottom 0.2s;
}

.is-eating .mouth {
	height: 50px;
	bottom: 20px;
	border-radius: 50% 50% 10px 10px;
}

.target-label {
	font-weight: bold;
	color: #64748b;
	letter-spacing: 2px;
}
</style>
