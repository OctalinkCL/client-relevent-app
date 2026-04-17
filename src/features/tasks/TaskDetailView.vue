<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { ChevronLeft, Check, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskDetail } from './useTasks'
import { useReviewSubmission } from './useTaskMutations'
import dayjs from '@/shared/lib/dayjs'

const route = useRoute()
const taskId = route.params.id as string

const { data: task, isLoading } = useTaskDetail(taskId)
const { mutate: review, isPending: reviewing } = useReviewSubmission()

const statusLabel: Record<string, string> = {
  pending: 'Pendiente', submitted: 'Enviada',
  approved: 'Aprobada', rejected: 'Rechazada', expired: 'Expirada',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', submitted: 'secondary',
  approved: 'default', rejected: 'destructive', expired: 'destructive',
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto">
    <RouterLink
      :to="{ name: 'tasks' }"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
    >
      <ChevronLeft class="size-4" />
      Tareas
    </RouterLink>

    <div v-if="isLoading" class="flex flex-col gap-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-40 w-full rounded-lg" />
    </div>

    <template v-else-if="task">
      <div class="mb-6">
        <h1 class="text-xl font-semibold">{{ task.title }}</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ (task.event as any)?.name }} · Límite {{ dayjs(task.deadline).format('D MMM YYYY HH:mm') }}
        </p>
      </div>

      <!-- Caption template -->
      <Card v-if="task.caption_template" class="mb-4">
        <CardHeader><CardTitle class="text-base">Texto sugerido</CardTitle></CardHeader>
        <CardContent>
          <p class="text-sm whitespace-pre-wrap">{{ task.caption_template }}</p>
        </CardContent>
      </Card>

      <!-- Submissions -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">
            Sellers
            <span class="text-muted-foreground font-normal text-sm ml-2">
              {{ (task.task_assignments as any[]).filter(a => a.status === 'approved').length }}/{{ (task.task_assignments as any[]).length }} aprobadas
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <div
            v-for="assignment in (task.task_assignments as any[])"
            :key="assignment.id"
            class="flex flex-col gap-3 pb-4 border-b last:border-0 last:pb-0"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">{{ assignment.profile?.full_name }}</p>
                <Badge :variant="statusVariant[assignment.status]" class="mt-1">
                  {{ statusLabel[assignment.status] }}
                </Badge>
              </div>
              <!-- Botones aprobar/rechazar si hay submission -->
              <div v-if="assignment.status === 'submitted'" class="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  class="text-destructive hover:text-destructive"
                  :disabled="reviewing"
                  @click="review({ assignmentId: assignment.id, status: 'rejected', taskId })"
                >
                  <X class="size-4" />
                </Button>
                <Button
                  size="sm"
                  :disabled="reviewing"
                  @click="review({ assignmentId: assignment.id, status: 'approved', taskId })"
                >
                  <Check class="size-4" />
                </Button>
              </div>
            </div>

            <!-- Screenshot -->
            <div v-if="assignment.task_submissions?.[0]" class="flex flex-col gap-2">
              <img
                :src="assignment.task_submissions[0].screenshot_url"
                alt="Screenshot"
                class="w-full max-w-xs rounded-lg object-cover"
              />
              <p v-if="assignment.task_submissions[0].observation" class="text-xs text-muted-foreground">
                "{{ assignment.task_submissions[0].observation }}"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
