<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateEvent } from './useEventMutations'
import dayjs from '@/shared/lib/dayjs'

const name = ref('')
const date = ref(dayjs().format('YYYY-MM-DD'))
const startTime = ref('22:00')
const endTime = ref('03:00')

const today = dayjs().format('YYYY-MM-DD')

// Genera opciones cada 30 min: ['00:00', '00:30', ..., '23:30']
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

const isNextDay = (time: string) => time <= startTime.value

const { mutate: createEvent, isPending, error } = useCreateEvent()

const canSubmit = computed(() =>
  name.value.trim().length > 0 && date.value && startTime.value && endTime.value
)

function submit() {
  if (!canSubmit.value) return
  createEvent({ name: name.value.trim(), date: date.value, startTime: startTime.value, endTime: endTime.value })
}
</script>

<template>
  <div class="p-6 max-w-lg mx-auto">
    <RouterLink
      :to="{ name: 'events' }"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
    >
      <ChevronLeft class="size-4" />
      Eventos
    </RouterLink>

    <Card>
      <CardHeader>
        <CardTitle>Crear evento</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-5" @submit.prevent="submit">

          <div class="flex flex-col gap-1.5">
            <Label for="name">Nombre</Label>
            <Input id="name" v-model="name" placeholder="Nombre del evento" required />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="date">Fecha</Label>
            <Input id="date" v-model="date" type="date" :min="today" required />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <Label>Hora inicio</Label>
              <Select v-model="startTime">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="t in timeOptions" :key="t" :value="t">
                    {{ t }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="flex flex-col gap-1.5">
              <Label>Hora fin</Label>
              <Select v-model="endTime">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="t in timeOptions" :key="t" :value="t">
                    {{ t }}{{ isNextDay(t) ? ' (día sig.)' : '' }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="isNextDay(endTime)" class="text-xs text-muted-foreground">
                Termina el día siguiente
              </p>
            </div>
          </div>

          <p v-if="error" class="text-sm text-destructive">
            {{ (error as Error).message }}
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <RouterLink :to="{ name: 'events' }">
              <Button type="button" variant="outline">Cancelar</Button>
            </RouterLink>
            <Button type="submit" :disabled="!canSubmit || isPending">
              {{ isPending ? 'Guardando…' : 'Crear evento' }}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  </div>
</template>
