import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import '@/assets/main.css'
import '@/shared/lib/dayjs'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin)

// Restaurar sesión antes de montar — así los guards tienen el estado listo
const auth = useAuthStore()
auth.initialize().finally(() => {
  app.mount('#app')
})
