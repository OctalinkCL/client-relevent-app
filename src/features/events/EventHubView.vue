<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEventDetail } from './useEventDetail'
import dayjs from '@/shared/lib/dayjs'

const route = useRoute()
const router = useRouter()
const eventId = route.params.id as string

const { data: event, isLoading } = useEventDetail(eventId)

const isEventPast = computed(() => event.value ? dayjs(event.value.ends_at).isBefore(dayjs()) : false)

function formatDateTime(starts: string, ends: string) {
  const s = dayjs(starts)
  const e = dayjs(ends)
  const sameDay = s.isSame(e, 'day')
  return `${s.format('ddd D MMM · HH:mm')} – ${e.format('HH:mm')}${sameDay ? '' : ' (día sig.)'}`
}

const cards = computed(() => [
  {
    title: 'Información del evento',
    description: 'Configura los detalles, el flyer y la visibilidad del evento.',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    disabled: false,
    action: () => router.push({ name: 'events-detail-info', params: { id: eventId } }),
  },
  {
    title: 'Tareas',
    description: isEventPast.value
      ? 'Este evento ya finalizó.'
      : 'Crea y asigna tareas a tu equipo para este evento.',
    colorClass: isEventPast.value ? 'text-orange-400' : 'text-orange-600',
    bgClass: 'bg-orange-50',
    disabled: isEventPast.value,
    action: () => router.push({ name: 'tasks-create', query: { event_id: eventId } }),
  },
])
</script>

<template>
  <div class="grid gap-6 lg:max-w-4xl">
    <header>
      <Button variant="secondary" size="sm" as-child>
        <RouterLink :to="{ name: 'events' }">Volver a Eventos</RouterLink>
      </Button>
    </header>

    <div v-if="isLoading" class="flex flex-col gap-3">
      <Skeleton class="h-7 w-56" />
      <Skeleton class="h-4 w-40" />
    </div>

    <template v-else-if="event">
      <div>
        <h1 class="text-2xl font-bold">{{ event.name }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ formatDateTime(event.starts_at, event.ends_at) }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button
          v-for="card in cards"
          :key="card.title"
          :disabled="card.disabled"
          :class="['rounded-2xl p-5 text-left border border-transparent transition-colors', card.bgClass, card.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-border']"
          @click="!card.disabled && card.action()"
        >
          <h2 :class="['font-semibold text-sm mb-2', card.colorClass]">{{ card.title }}</h2>
          <p class="text-xs text-muted-foreground leading-relaxed">{{ card.description }}</p>
        </button>
      </div>
    </template>
  </div>
</template>
