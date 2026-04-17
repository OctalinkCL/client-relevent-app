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
      {
        path: 'events/:id',
        name: 'events-detail',
        component: () => import('@/features/events/EventDetailView.vue'),
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/features/tasks/TasksView.vue'),
      },
      {
        path: 'tasks/create',
        name: 'tasks-create',
        component: () => import('@/features/tasks/TaskCreateView.vue'),
      },
      {
        path: 'tasks/:id',
        name: 'tasks-detail',
        component: () => import('@/features/tasks/TaskDetailView.vue'),
      },
      {
        path: 'tasks/assignment/:id',
        name: 'tasks-assignment',
        component: () => import('@/features/tasks/TaskAssignmentView.vue'),
      },
    ],
  },
]
