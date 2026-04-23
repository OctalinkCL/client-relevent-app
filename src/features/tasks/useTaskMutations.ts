import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import dayjs from '@/shared/lib/dayjs'
import { uploadImage } from '@/shared/lib/imageUpload'

interface CreateTaskInput {
  eventId: string
  title: string
  description?: string
  captionTemplate?: string
  deadlineDate: string
  deadlineTime: string
  sellerIds: string[]
  flyerUrl?: string
}

export function useCreateTask() {
  const store = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      eventId, title, description, captionTemplate,
      deadlineDate, deadlineTime, sellerIds, flyerUrl,
    }: CreateTaskInput) => {
      const companyId = store.activeCompany!.id
      const createdBy = store.profile!.id
      const deadline = dayjs.tz(`${deadlineDate} ${deadlineTime}`, 'America/Santiago').toISOString()

      let uploadedPath: string | null = null

      try {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .insert({
            event_id: eventId,
            company_id: companyId,
            title,
            description: description || null,
            caption_template: captionTemplate || null,
            deadline,
            flyer_url: flyerUrl || null,
            created_by: createdBy,
          })
          .select()
          .single()

        if (taskError) throw taskError

        if (sellerIds.length > 0) {
          const assignments = sellerIds.map(userId => ({
            task_id: task.id,
            user_id: userId,
            status: 'pending',
          }))

          const { error: assignError } = await supabase
            .from('task_assignments')
            .insert(assignments)

          if (assignError) throw assignError
        }

        return task
      } catch (e) {
        if (uploadedPath) {
          await supabase.storage.from('relevent-media').remove([uploadedPath])
        }
        throw e
      }
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      router.push({ name: 'tasks-detail', params: { id: task.id } })
    },
  })
}

export function useReviewSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assignmentId, status, taskId }: {
      assignmentId: string
      status: 'approved' | 'rejected'
      taskId: string
    }) => {
      const { error } = await supabase
        .from('task_assignments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', assignmentId)

      if (error) throw error
      return { assignmentId, status, taskId }
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    },
  })
}

export function useSubmitTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assignmentId, screenshotUrl, observation }: {
      assignmentId: string
      screenshotUrl: string
      observation?: string
    }) => {
      const { error: subError } = await supabase
        .from('task_submissions')
        .insert({ assignment_id: assignmentId, screenshot_url: screenshotUrl, observation: observation || null })

      if (subError) throw subError

      const { error: assignError } = await supabase
        .from('task_assignments')
        .update({ status: 'submitted', updated_at: new Date().toISOString() })
        .eq('id', assignmentId)

      if (assignError) throw assignError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-seller'] })
    },
  })
}

export async function uploadTaskFlyer(companyId: string, taskId: string, file: File): Promise<{ url: string; path: string }> {
  const path = `tasks/${companyId}/${taskId}/flyer.jpg`
  return uploadImage(file, path, 'flyer')
}

export async function uploadSubmissionScreenshot(userId: string, assignmentId: string, file: File): Promise<string> {
  const path = `submissions/${userId}/${assignmentId}/screenshot.jpg`
  const { url } = await uploadImage(file, path, 'screenshot')
  return url
}
