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
      const { data, error } = await supabase
        .from('company_members')
        .select('user_id, profile:profiles(id, full_name, avatar_url)')
        .eq('company_id', companyId.value!)
        .eq('role', 'seller')

      if (error) throw error
      return data
    },
  })
}
