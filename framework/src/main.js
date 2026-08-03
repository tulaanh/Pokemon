import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initStore } from './game/store.js'

initStore()

createApp(App).mount('#app')
