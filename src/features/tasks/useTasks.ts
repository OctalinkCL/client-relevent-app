import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useTasksAdmin() {
  const store = useAuthStore()
  const companyId = computed(() => store.activeCompany?.id)

  return useQuery({
    queryKey: ['tasks', companyId],
    enabled: computed(() => !!companyId.value),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          event:events(id, name, starts_at),
          task_assignments(id, status, user_id)
        `)
        .eq('company_id', companyId.value!)
        .order('deadline', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export function useTasksSeller() {
  const store = useAuthStore()
  const userId = computed(() => store.profile?.id)

  return useQuery({
    queryKey: ['tasks-seller', userId],
    enabled: computed(() => !!userId.value),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          *,
          task:tasks(
            *,
            event:events(id, name, starts_at)
          )
        `)
        .eq('user_id', userId.value!)
        .order('assigned_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

export function useTaskDetail(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          event:events(id, name, starts_at),
          task_assignments(
            *,
            profile:profiles(id, full_name, avatar_url),
            task_submissions(*)
          )
        `)
        .eq('id', taskId)
        .single()

      if (error) throw error
      return data
    },
  })
}
