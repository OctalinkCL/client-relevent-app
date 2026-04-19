<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ChevronLeft, Copy, ImageIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/lib/supabase'
import { useSubmitTask, uploadSubmissionScreenshot } from './useTaskMutations'
import { useAuthStore } from '@/stores/auth'
import dayjs from '@/shared/lib/dayjs'

const route = useRoute()
const store = useAuthStore()
const assignmentId = route.params.id as string

const { data: assignment, isLoading } = useQuery({
  queryKey: ['assignment', assignmentId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`*, task:tasks(*, event:events(id, name))`)
      .eq('id', assignmentId)
      .single()
    if (error) throw error
    return data
  },
})

const { mutate: submitTask, isPending: submitting, error: submitError } = useSubmitTask()

const screenshotFile = ref<File | null>(null)
const screenshotPreview = ref<string | null>(null)
const observation = ref('')
const isUploading = ref(false)
const copied = ref(false)
const showConfirm = ref(false)

function onScreenshotChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  screenshotFile.value = file
  screenshotPreview.value = URL.createObjectURL(file)
}

async function copyCaption() {
  const caption = (assignment.value?.task as any)?.caption_template
  if (!caption) return
  await navigator.clipboard.writeText(caption)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

async function submit() {
  if (!screenshotFile.value) return
  isUploading.value = true
  try {
    const url = await uploadSubmissionScreenshot(store.profile!.id, assignmentId, screenshotFile.value)
    submitTask({ assignmentId, screenshotUrl: url, observation: observation.value.trim() || undefined })
  } finally {
    isUploading.value = false
  }
}

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
  <div class="p-6 max-w-lg mx-auto">
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

    <template v-else-if="assignment">
      <div class="mb-6 flex items-start justify-between gap-2">
        <div>
          <h1 class="text-xl font-semibold">{{ (assignment.task as any)?.title }}</h1>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ (assignment.task as any)?.event?.name }} ·
            Límite {{ dayjs((assignment.task as any)?.deadline).fromNow() }}
          </p>
        </div>
        <Badge :variant="statusVariant[assignment.status]">
          {{ statusLabel[assignment.status] }}
        </Badge>
      </div>

      <!-- Flyer -->
      <img
        v-if="(assignment.task as any)?.flyer_url"
        :src="(assignment.task as any).flyer_url"
        class="w-full max-w-xs mx-auto rounded-lg mb-4 object-cover aspect-3/4"
        alt="Flyer"
      />

      <!-- Caption -->
      <Card v-if="(assignment.task as any)?.caption_template" class="mb-4">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm">Texto sugerido</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-2">
          <p class="text-sm whitespace-pre-wrap text-muted-foreground">
            {{ (assignment.task as any).caption_template }}
          </p>
          <Button variant="outline" size="sm" class="w-fit" @click="copyCaption">
            <Copy class="size-4 mr-1" />
            {{ copied ? '¡Copiado!' : 'Copiar texto' }}
          </Button>
        </CardContent>
      </Card>

      <!-- Submit form (solo si está pendiente) -->
      <Card v-if="assignment.status === 'pending'">
        <CardHeader><CardTitle class="text-base">Subir evidencia</CardTitle></CardHeader>
        <CardContent>
          <form class="flex flex-col gap-4" @submit.prevent="showConfirm = true">
            <div class="flex flex-col gap-1.5">
              <Label>Screenshot</Label>
              <Label
                v-if="!screenshotPreview"
                for="screenshot-input"
                class="flex flex-col items-center gap-2 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <ImageIcon class="size-6 text-muted-foreground" />
                <span class="text-sm text-muted-foreground">Subir imagen</span>
              </Label>
              <div v-else class="flex flex-col gap-2">
                <img :src="screenshotPreview" class="w-full rounded-lg object-cover" alt="preview" />
                <Label for="screenshot-input">
                  <Button variant="outline" size="sm" as="span">Cambiar imagen</Button>
                </Label>
              </div>
              <input id="screenshot-input" type="file" accept="image/*" class="hidden" @change="onScreenshotChange" />
            </div>

            <div class="flex flex-col gap-1.5">
              <Label for="observation">Comentario <span class="text-muted-foreground">(opcional)</span></Label>
              <Input id="observation" v-model="observation" placeholder="Ej: publicado en mi historia" />
            </div>

            <p v-if="submitError" class="text-sm text-destructive">{{ (submitError as Error).message }}</p>

            <Button type="submit" :disabled="!screenshotFile || submitting || isUploading">
              {{ submitting || isUploading ? 'Enviando…' : 'Enviar evidencia' }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Estado final -->
      <Card v-else-if="assignment.status !== 'pending'" class="text-center py-4">
        <CardContent>
          <Badge :variant="statusVariant[assignment.status]" class="text-sm px-4 py-1">
            {{ statusLabel[assignment.status] }}
          </Badge>
        </CardContent>
      </Card>

      <!-- Confirmación envío -->
      <AlertDialog :open="showConfirm" @update:open="showConfirm = $event">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar evidencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez enviada no podrás modificarla. El admin revisará tu entrega.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction @click="submit">Enviar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </template>
  </div>
</template>
