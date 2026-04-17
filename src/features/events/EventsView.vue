<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Plus, CalendarDays } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { useEvents } from './useEvents'
import dayjs from '@/shared/lib/dayjs'

const store = useAuthStore()
const { data: events, isLoading } = useEvents()

const monthLabel = dayjs().format('MMMM YYYY')

function formatRange(startsAt: string, endsAt: string) {
  const start = dayjs(startsAt)
  const end   = dayjs(endsAt)
  const sameDay = start.isSame(end, 'day')
  const dateStr = start.format('ddd D MMM')
  const timeStr = `${start.format('HH:mm')} – ${end.format('HH:mm')}${sameDay ? '' : ' (día sig.)'}`
  return { dateStr, timeStr }
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold capitalize">Eventos</h1>
        <p class="text-sm text-muted-foreground capitalize">{{ monthLabel }}</p>
      </div>
      <RouterLink v-if="store.isAdmin" :to="{ name: 'events-create' }">
        <Button size="sm">
          <Plus class="size-4 mr-1" />
          Nuevo evento
        </Button>
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <!-- Lista -->
    <div v-else-if="events?.length" class="flex flex-col gap-2">
      <div
        v-for="event in events"
        :key="event.id"
        class="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
      >
        <CalendarDays class="size-5 text-muted-foreground shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate">{{ event.name }}</p>
          <p class="text-xs text-muted-foreground capitalize">
            {{ formatRange(event.starts_at, event.ends_at).dateStr }}
            &middot;
            {{ formatRange(event.starts_at, event.ends_at).timeStr }}
          </p>
        </div>
      </div>
    </div>

    <!-- Vacío -->
    <div v-else class="flex flex-col items-center gap-3 py-16 text-center">
      <CalendarDays class="size-10 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Sin eventos este mes</p>
      <RouterLink v-if="store.isAdmin" :to="{ name: 'events-create' }">
        <Button variant="outline" size="sm">Crear primer evento</Button>
      </RouterLink>
    </div>
  </div>
</template>
