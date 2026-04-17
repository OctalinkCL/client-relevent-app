<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronLeft, ImageIcon, Upload } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useEvents } from '@/features/events/useEvents'
import { useCompanySellers } from './useCompanySellers'
import { useCreateTask, uploadTaskFlyer } from './useTaskMutations'
import { useAuthStore } from '@/stores/auth'
import dayjs from '@/shared/lib/dayjs'

const store = useAuthStore()
const { data: events } = useEvents()
const { data: sellers } = useCompanySellers()
const { mutate: createTask, isPending, error } = useCreateTask()

const eventId = ref('')
const selectedEvent = computed(() => events.value?.find(e => e.id === eventId.value))
const title = ref('')
const description = ref('')
const captionTemplate = ref('')
const deadlineDate = ref(dayjs().format('YYYY-MM-DD'))
const deadlineTime = ref('23:59')
const selectedSellerIds = ref<string[]>([])
const flyerFile = ref<File | null>(null)
const flyerPreview = ref<string | null>(null)
const isUploadingFlyer = ref(false)

const selectedSet = computed(() => new Set(selectedSellerIds.value))
const allSelected = computed(() =>
  !!sellers.value?.length && selectedSellerIds.value.length === sellers.value.length
)

function toggleAll() {
  if (allSelected.value) {
    selectedSellerIds.value = []
  } else {
    selectedSellerIds.value = sellers.value?.map(s => s.user_id) ?? []
  }
}

function toggleSeller(userId: string) {
  const current = selectedSellerIds.value
  if (current.includes(userId)) {
    selectedSellerIds.value = current.filter(id => id !== userId)
  } else {
    selectedSellerIds.value = [...current, userId]
  }
}

function onFlyerChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  flyerFile.value = file
  flyerPreview.value = URL.createObjectURL(file)
}

const canSubmit = computed(() =>
  eventId.value && title.value.trim() && deadlineDate.value && selectedSellerIds.value.length > 0
)

async function submit() {
  if (!canSubmit.value) return

  let flyerUrl: string | undefined

  if (flyerFile.value) {
    isUploadingFlyer.value = true
    try {
      const tempId = crypto.randomUUID()
      const result = await uploadTaskFlyer(store.activeCompany!.id, tempId, flyerFile.value)
      flyerUrl = result.url
    } finally {
      isUploadingFlyer.value = false
    }
  } else {
    flyerUrl = (selectedEvent.value as any)?.flyer_url ?? undefined
  }

  createTask({
    eventId: eventId.value,
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    captionTemplate: captionTemplate.value.trim() || undefined,
    deadlineDate: deadlineDate.value,
    deadlineTime: deadlineTime.value,
    sellerIds: selectedSellerIds.value,
    flyerUrl,
  })
}

const today = dayjs().format('YYYY-MM-DD')
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

    <Card>
      <CardHeader>
        <CardTitle>Crear tarea</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-5" @submit.prevent="submit">

          <!-- Evento -->
          <div class="flex flex-col gap-1.5">
            <Label>Evento</Label>
            <Select v-model="eventId" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="event in events"
                  :key="event.id"
                  :value="event.id"
                >
                  {{ event.name }} — {{ dayjs(event.starts_at).format('D MMM') }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Título -->
          <div class="flex flex-col gap-1.5">
            <Label for="title">Título</Label>
            <Input id="title" v-model="title" placeholder="Ej: Comparte el evento en tu historia" required />
          </div>

          <!-- Descripción -->
          <div class="flex flex-col gap-1.5">
            <Label for="description">Descripción <span class="text-muted-foreground">(opcional)</span></Label>
            <Input id="description" v-model="description" placeholder="Instrucciones adicionales" />
          </div>

          <!-- Caption template -->
          <div class="flex flex-col gap-1.5">
            <Label for="caption">Texto sugerido <span class="text-muted-foreground">(opcional)</span></Label>
            <Input id="caption" v-model="captionTemplate" placeholder="Texto que el seller puede copiar" />
          </div>

          <!-- Deadline -->
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <Label>Fecha límite</Label>
              <Input v-model="deadlineDate" type="date" :min="today" required />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Hora límite</Label>
              <Input v-model="deadlineTime" type="time" required />
            </div>
          </div>

          <!-- Flyer -->
          <div class="flex flex-col gap-1.5">
            <Label>Flyer <span class="text-muted-foreground">(opcional)</span></Label>
            <div v-if="flyerPreview || (selectedEvent as any)?.flyer_url" class="flex items-center gap-4">
              <img
                :src="flyerPreview ?? (selectedEvent as any).flyer_url"
                class="w-20 h-28 object-cover rounded-lg"
                alt="preview"
              />
              <div class="flex flex-col gap-2">
                <p v-if="!flyerPreview" class="text-xs text-muted-foreground">Flyer del evento</p>
                <Label for="flyer-input">
                  <Button variant="outline" size="sm" as="span">
                    <Upload class="size-4 mr-1" />
                    {{ flyerPreview ? 'Cambiar' : 'Usar otro flyer' }}
                  </Button>
                </Label>
              </div>
            </div>
            <Label
              v-else
              for="flyer-input"
              class="flex flex-col items-center gap-2 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <ImageIcon class="size-6 text-muted-foreground" />
              <span class="text-sm text-muted-foreground">Subir flyer (JPG, PNG, WEBP)</span>
            </Label>
            <input id="flyer-input" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFlyerChange" />
          </div>

          <!-- Sellers -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <Label>Asignar a</Label>
              <button
                type="button"
                class="text-xs text-primary hover:underline"
                @click="toggleAll"
              >
                {{ allSelected ? 'Deseleccionar todos' : 'Seleccionar todos' }}
              </button>
            </div>

            <div v-if="sellers?.length" class="flex flex-col gap-2 border rounded-lg p-3">
              <div
                v-for="seller in sellers"
                :key="seller.user_id"
                class="flex items-center gap-3"
              >
                <Checkbox
                  :id="seller.user_id"
                  :model-value="selectedSet.has(seller.user_id)"
                  @update:model-value="toggleSeller(seller.user_id)"
                />
                <Label :for="seller.user_id" class="cursor-pointer font-normal">
                  {{ (seller as any).full_name ?? seller.user_id }}
                </Label>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">Sin sellers en esta empresa.</p>
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ (error as Error).message }}</p>

          <div class="flex justify-end gap-2 pt-2">
            <RouterLink :to="{ name: 'tasks' }">
              <Button type="button" variant="outline">Cancelar</Button>
            </RouterLink>
            <Button type="submit" :disabled="!canSubmit || isPending || isUploadingFlyer">
              {{ isPending || isUploadingFlyer ? 'Guardando…' : 'Crear tarea' }}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  </div>
</template>
