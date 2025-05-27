import './assets/css/main.css'
import './assets/css/utilities.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

const app = createApp(App)

app.use(router)
app.use(store)

// Auto login if token exists
store.dispatch('auth/autoLogin')

app.mount('#app')
