import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import dayjs from '@/shared/lib/dayjs'

interface CreateEventInput {
  name: string
  date: string      // 'YYYY-MM-DD'
  startTime: string // 'HH:mm'
  endTime: string   // 'HH:mm'
}

export function useCreateEvent() {
  const store = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ name, date, startTime, endTime }: CreateEventInput) => {
      const companyId = store.activeCompany!.id
      const createdBy = store.profile!.id

      const startsAt = dayjs.tz(`${date} ${startTime}`, 'America/Santiago').toISOString()

      const endDate = endTime <= startTime
        ? dayjs(date).add(1, 'day').format('YYYY-MM-DD')
        : date
      const endsAt = dayjs.tz(`${endDate} ${endTime}`, 'America/Santiago').toISOString()

      const { data, error } = await supabase
        .from('events')
        .insert({
          company_id: companyId,
          name,
          starts_at: startsAt,
          ends_at: endsAt,
          created_by: createdBy,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      router.push({ name: 'events' })
    },
  })
}
