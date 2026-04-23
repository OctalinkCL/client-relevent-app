import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

function getHomeRoute(role: string | null) {
  if (role === 'seller') return { name: 'tasks' }
  return { name: 'events' }
}

export function setupGuards(router: Router) {
  router.beforeEach(async (to) => {
    const store = useAuthStore()
    await store.initialize()

    const isAuthenticated = store.isAuthenticated
    const hasCompany = !!store.activeCompany
    const requiresAuth = to.meta.requiresAuth !== false
    const requiresCompany = to.meta.requiresCompany !== false

    // Ruta protegida sin sesión → login
    if (requiresAuth && !isAuthenticated) {
      return { name: 'login' }
    }

    // Ya autenticado intenta ir a login → adentro
    if (!requiresAuth && isAuthenticated) {
      return hasCompany ? getHomeRoute(store.activeRole) : { name: 'select-company' }
    }

    // Autenticado pero sin company → selector
    if (isAuthenticated && requiresCompany && !hasCompany) {
      return { name: 'select-company' }
    }

    // Dashboard → redirigir al home del rol (dashboard está oculto, pendiente de uso futuro)
    if (to.name === 'dashboard' && isAuthenticated && hasCompany) {
      return getHomeRoute(store.activeRole)
    }

    // Rol insuficiente → home del rol
    const requiredRoles = to.meta.roles as string[] | undefined
    if (requiredRoles && store.activeRole && !requiredRoles.includes(store.activeRole)) {
      return getHomeRoute(store.activeRole)
    }
  })
}
