import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresCompany?: boolean
    roles?: string[]
  }
}
import { authRoutes } from './auth.routes'
import { appRoutes } from './app.routes'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...appRoutes,
  ],
})

setupGuards(router)

export default router
