import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import dayjs from '@/shared/lib/dayjs'

export function useEvents() {
  const store = useAuthStore()
  const companyId = computed(() => store.activeCompany?.id)

  return useQuery({
    queryKey: ['events', companyId],
    enabled: computed(() => !!companyId.value),
    queryFn: async () => {
      const from = dayjs().startOf('month').toISOString()
      const to   = dayjs().endOf('month').toISOString()

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('company_id', companyId.value!)
        .gte('starts_at', from)
        .lte('starts_at', to)
        .order('starts_at', { ascending: true })

      if (error) throw error
      return data
    },
  })
}
