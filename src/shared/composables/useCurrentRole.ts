import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useCurrentRole() {
  const store = useAuthStore()

  return {
    role: computed(() => store.activeRole),
    isAdmin: computed(() => store.isAdmin),
    isSeller: computed(() => store.isSeller),
    isDoor: computed(() => store.isDoor),
    hasRole: store.hasRole,
  }
}
