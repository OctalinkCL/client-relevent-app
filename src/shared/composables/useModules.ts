import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { FeatureName } from '@/shared/lib/supabase'

export function useModules() {
  const store = useAuthStore()

  return {
    activeModules: computed(() => store.activeModules),
    hasModule: (feature: FeatureName) => store.hasModule(feature),
  }
}
