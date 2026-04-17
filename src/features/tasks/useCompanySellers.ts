import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useCompanySellers() {
  const store = useAuthStore()
  const companyId = computed(() => store.activeCompany?.id)

  return useQuery({
    queryKey: ['company-sellers', companyId],
    enabled: computed(() => !!companyId.value),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .rpc('list_company_members', { p_company_id: companyId.value! })
      if (error) throw error
      return ((data ?? []) as any[]).filter(m => m.role === 'seller')
    },
  })
}
