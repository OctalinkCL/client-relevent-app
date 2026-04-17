import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/lib/supabase'

export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error
      return data
    },
  })
}
