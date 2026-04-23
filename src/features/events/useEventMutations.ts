import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import dayjs from '@/shared/lib/dayjs'
import { uploadImage } from '@/shared/lib/imageUpload'

interface CreateEventInput {
  name: string
  date: string
  startTime: string
  endTime: string
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
        .insert({ company_id: companyId, name, starts_at: startsAt, ends_at: endsAt, created_by: createdBy })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      router.push({ name: 'events-detail', params: { id: data.id } })
    },
  })
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fields: { is_public?: boolean; flyer_url?: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(fields)
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

export async function uploadFlyer(companyId: string, eventId: string, file: File): Promise<string> {
  const path = `events/${companyId}/${eventId}/flyer.jpg`
  const { url } = await uploadImage(file, path, 'flyer')
  return url
}
