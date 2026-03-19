import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import PNP from './pnp-lib'

const app = createApp(App)
app.use(PNP)
app.mount('#app')
