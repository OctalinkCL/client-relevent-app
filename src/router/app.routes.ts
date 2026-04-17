import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'

export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true, requiresCompany: true },
    children: [
      {
        path: '',
        redirect: 'dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/features/dashboard/DashboardView.vue'),
      },
      {
        path: 'events',
        name: 'events',
        component: () => import('@/features/events/EventsView.vue'),
      },
      {
        path: 'events/create',
        name: 'events-create',
        component: () => import('@/features/events/EventCreateView.vue'),
      },
    ],
  },
]
