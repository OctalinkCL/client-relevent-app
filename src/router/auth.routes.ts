import type { RouteRecordRaw } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/features/auth/LoginView.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'select-company',
        name: 'select-company',
        component: () => import('@/features/auth/CompanySelectorView.vue'),
        meta: { requiresAuth: true, requiresCompany: false },
      },
    ],
  },
]
