import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useAuth() {
  const store = useAuthStore()
  const router = useRouter()

  async function login(email: string, password: string) {
    await store.login(email, password)

    if (store.memberships.length === 0) {
      // Sin companies asignadas — no debería pasar, pero lo manejamos
      throw new Error('Tu cuenta no tiene companies asignadas. Contacta al administrador.')
    }

    if (store.memberships.length === 1) {
      // Una sola company → entramos directo
      await store.setActiveCompany(store.memberships[0].company)
      await router.push('/dashboard')
    } else {
      // Múltiples companies → selector
      await router.push('/select-company')
    }
  }

  async function logout() {
    await store.logout()
    await router.push('/login')
  }

  return { login, logout }
}
