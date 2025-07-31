import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/styles/main.scss'
import 'bootstrap/dist/css/bootstrap.min.css'

import * as bootstrap from 'bootstrap'

import 'bootstrap-icons/font/bootstrap-icons.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
