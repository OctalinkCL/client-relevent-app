<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Plus, ClipboardList } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { useTasksAdmin, useTasksSeller } from './useTasks'
import dayjs from '@/shared/lib/dayjs'

const store = useAuthStore()
const { data: adminTasks, isLoading: loadingAdmin } = useTasksAdmin()
const { data: sellerTasks, isLoading: loadingSeller } = useTasksSeller()

const isLoading = store.isAdmin ? loadingAdmin : loadingSeller

const statusLabel: Record<string, string> = {
  pending:   'Pendiente',
  submitted: 'Enviada',
  approved:  'Aprobada',
  rejected:  'Rechazada',
  expired:   'Expirada',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending:   'outline',
  submitted: 'secondary',
  approved:  'default',
  rejected:  'destructive',
  expired:   'destructive',
}

function taskProgress(assignments: { status: string }[]) {
  const total = assignments.length
  const done = assignments.filter(a => a.status === 'approved').length
  return { done, total }
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">Tareas</h1>
      <RouterLink v-if="store.isAdmin" :to="{ name: 'tasks-create' }">
        <Button size="sm">
          <Plus class="size-4 mr-1" />
          Nueva tarea
        </Button>
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <!-- Vista Admin -->
    <template v-else-if="store.isAdmin">
      <div v-if="adminTasks?.length" class="flex flex-col gap-2">
        <RouterLink
          v-for="task in adminTasks"
          :key="task.id"
          :to="{ name: 'tasks-detail', params: { id: task.id } }"
          class="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <ClipboardList class="size-5 text-muted-foreground shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ task.title }}</p>
            <p class="text-xs text-muted-foreground">
              {{ (task.event as any)?.name }} · Límite {{ dayjs(task.deadline).format('D MMM HH:mm') }}
            </p>
          </div>
          <div class="text-xs text-muted-foreground shrink-0">
            {{ taskProgress(task.task_assignments as any[]).done }}/{{ taskProgress(task.task_assignments as any[]).total }} aprobadas
          </div>
        </RouterLink>
      </div>
      <div v-else class="flex flex-col items-center gap-3 py-16 text-center">
        <ClipboardList class="size-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Sin tareas creadas</p>
        <RouterLink :to="{ name: 'tasks-create' }">
          <Button variant="outline" size="sm">Crear primera tarea</Button>
        </RouterLink>
      </div>
    </template>

    <!-- Vista Seller -->
    <template v-else>
      <div v-if="sellerTasks?.length" class="flex flex-col gap-2">
        <RouterLink
          v-for="assignment in sellerTasks"
          :key="assignment.id"
          :to="{ name: 'tasks-assignment', params: { id: assignment.id } }"
          class="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <ClipboardList class="size-5 text-muted-foreground shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ (assignment.task as any)?.title }}</p>
            <p class="text-xs text-muted-foreground">
              {{ (assignment.task as any)?.event?.name }} · Límite {{ dayjs((assignment.task as any)?.deadline).format('D MMM HH:mm') }}
            </p>
          </div>
          <Badge :variant="statusVariant[assignment.status]">
            {{ statusLabel[assignment.status] }}
          </Badge>
        </RouterLink>
      </div>
      <div v-else class="flex flex-col items-center gap-3 py-16 text-center">
        <ClipboardList class="size-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Sin tareas asignadas</p>
      </div>
    </template>
  </div>
</template>
