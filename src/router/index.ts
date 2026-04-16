import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/LoginView.vue'),
      meta: { layout: 'auth', requiresAuth: false },
    },
    {
      path: '/select-company',
      name: 'select-company',
      component: () => import('@/features/auth/CompanySelectorView.vue'),
      meta: { layout: 'auth', requiresAuth: true },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/features/dashboard/DashboardView.vue'),
      meta: { layout: 'app', requiresAuth: true },
    },
  ],
})

// Guards se agregarán en la siguiente fase junto al auth store
export default router
