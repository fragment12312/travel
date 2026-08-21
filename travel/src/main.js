import { createApp } from 'vue'
import './styles/common.css'
// import './style.css'
import App from './App.vue'
import router from './router'
import Vant from 'vant'
import 'vant/lib/index.css'
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

app.use(Vant)
app.use(pinia)
app.use(router)
app.mount('#app')
