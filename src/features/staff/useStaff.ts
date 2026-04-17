import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

export function useCompanyMembers() {
  const store = useAuthStore()
  const companyId = computed(() => store.activeCompany?.id)

  return useQuery({
    queryKey: ['staff-members', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('list_company_members', { p_company_id: companyId.value! })
      if (error) throw error
      return data
    },
    enabled: computed(() => !!companyId.value),
  })
}

export function usePendingRequests() {
  const store = useAuthStore()
  const companyId = computed(() => store.activeCompany?.id)

  return useQuery({
    queryKey: ['staff-requests', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('list_member_requests', { p_company_id: companyId.value! })
      if (error) throw error
      return data
    },
    enabled: computed(() => !!companyId.value),
  })
}
