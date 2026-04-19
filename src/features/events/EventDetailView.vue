<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { ChevronLeft, Upload, ImageIcon } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventDetail } from "./useEventDetail";
import { useUpdateEvent, uploadFlyer } from "./useEventMutations";
import { useAuthStore } from "@/stores/auth";
import dayjs from "@/shared/lib/dayjs";

const route = useRoute();
const store = useAuthStore();
const eventId = route.params.id as string;

const { data: event, isLoading } = useEventDetail(eventId);
const { mutate: updateEvent } = useUpdateEvent(eventId);

const isPublic = ref(true);
const isUploadingFlyer = ref(false);
const flyerError = ref("");

watch(
  () => event.value?.is_public,
  (val) => {
    if (val !== undefined) isPublic.value = val;
  },
  { immediate: true },
);

function onPublicToggle(val: boolean) {
  isPublic.value = val;
  updateEvent({ is_public: val });
}

async function onFlyerChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  flyerError.value = "";
  isUploadingFlyer.value = true;
  try {
    const url = await uploadFlyer(store.activeCompany!.id, eventId, file);
    updateEvent({ flyer_url: url });
  } catch (err) {
    flyerError.value = (err as Error).message;
  } finally {
    isUploadingFlyer.value = false;
  }
}

function formatDateTime(starts: string, ends: string) {
  const s = dayjs(starts);
  const e = dayjs(ends);
  const sameDay = s.isSame(e, "day");
  return `${s.format("ddd D MMM · HH:mm")} – ${e.format("HH:mm")}${sameDay ? "" : " (día sig.)"}`;
}
</script>

<template>
  <div id="page-event-detail" class="grid gap-4 lg:max-w-3xl">
    <!-- Header -->
    <header>
      <Button variant="secondary" size="sm" as-child>
        <RouterLink :to="{ name: 'events' }"> Volver a Eventos </RouterLink>
      </Button>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col gap-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-32 w-full rounded-lg" />
      <Skeleton class="h-32 w-full rounded-lg" />
    </div>

    <template v-else-if="event">
      <div class="grid grid-cols-1 gap-4">
        <!-- Header -->
        <header>
          <h1 class="text-xl font-semibold">{{ event.name }}</h1>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ formatDateTime(event.starts_at, event.ends_at) }}
          </p>
        </header>

        <!-- Flyer -->
        <Card class="ring-0">
          <CardHeader>
            <CardTitle class="text-sm font-semibold"
              >Imagen del evento</CardTitle
            >
          </CardHeader>
          <CardContent>
            <div v-if="event.flyer_url" class="flex flex-col gap-3">
              <img
                :src="event.flyer_url"
                alt="Flyer del evento"
                class="w-full max-w-xs rounded-lg object-cover aspect-[3/4]"
              />
              <div class="flex gap-2">
                <Label for="flyer-upload" class="cursor-pointer">
                  <Button variant="outline" size="sm" as="span" :disabled="isUploadingFlyer">
                    <Upload class="size-4 mr-1" />
                    {{ isUploadingFlyer ? "Subiendo…" : "Cambiar flyer" }}
                  </Button>
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-destructive hover:text-destructive"
                  :disabled="isUploadingFlyer"
                  @click="updateEvent({ flyer_url: null })"
                >
                  Quitar
                </Button>
              </div>
            </div>

            <Label
              v-else
              for="flyer-upload"
              class="flex flex-col items-center gap-3 py-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <ImageIcon class="size-8 text-muted-foreground" />
              <div class="text-center">
                <p class="text-sm font-medium">
                  {{ isUploadingFlyer ? "Subiendo…" : "Subir flyer" }}
                </p>
                <p class="text-xs text-muted-foreground">JPG, PNG o WEBP</p>
              </div>
            </Label>

            <input
              id="flyer-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              :disabled="isUploadingFlyer"
              @change="onFlyerChange"
            />

            <p v-if="flyerError" class="text-sm text-destructive mt-2">
              {{ flyerError }}
            </p>
          </CardContent>
        </Card>

        <!-- Visibilidad -->
        <Card class="ring-0">
          <CardHeader>
            <CardTitle class="text-sm font-semibold">Visibilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">
                  {{ isPublic ? "Público" : "Privado" }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{
                    isPublic
                      ? "Visible para todos"
                      : "Solo visible para tu equipo"
                  }}
                </p>
              </div>
              <Switch
                :model-value="isPublic"
                @update:model-value="onPublicToggle"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
