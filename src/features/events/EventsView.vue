<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Plus, CalendarDays } from "lucide-vue-next";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "./useEvents";
import dayjs from "@/shared/lib/dayjs";
import { useAuthStore } from "@/stores/auth";
// Shadcn
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Constants
const store = useAuthStore();
const { data: events, isLoading } = useEvents();
const monthLabel = dayjs().format("MMMM YYYY");

// Methods
function formatRange(startsAt: string, endsAt: string) {
  const start = dayjs(startsAt);
  const end = dayjs(endsAt);
  const sameDay = start.isSame(end, "day");
  const dateStr = start.format("ddd D MMM");
  const timeStr = `${start.format("HH:mm")} – ${end.format("HH:mm")}${sameDay ? "" : " (día sig.)"}`;
  return { dateStr, timeStr };
}
</script>

<template>
  <div id="page-events">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold capitalize">Eventos</h1>
        <p class="text-sm text-muted-foreground capitalize">{{ monthLabel }}</p>
      </div>
      <RouterLink v-if="store.isAdmin" :to="{ name: 'events-create' }">
        <Button class="cursor-pointer">
          <Plus class="size-4 mr-1" />
          Nuevo Evento
        </Button>
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <!-- Lista -->
    <div v-else-if="events?.length">
      <ul class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <!-- Item -->
        <li
          v-for="event in events"
          class="flex bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          <!-- Image -->
          <div
            class="relative w-28 sm:w-36 aspect-4/5 bg-neutral-200 md:aspect-2/2"
          >
            <div
              v-if="event.flyer_url"
              class="absolute inset-0 bg-red-200 bg-cover bg-center"
              :style="{ backgroundImage: `url(${event.flyer_url})` }"
            ></div>
            <div
              v-else
              class="absolute inset-0 bg-neutral-200 flex items-center justify-center"
            >
              <CalendarDays class="size-5 text-muted-foreground shrink-0" />
            </div>
          </div>
          <!-- Content -->
          <div class="p-3 flex-1 flex flex-col">
            <p
              class="text-xs text-muted-foreground flex items-center gap-1 capitalize"
            >
              <CalendarDays class="size-3 text-muted-foreground shrink-0" />
              <span
                >{{ formatRange(event.starts_at, event.ends_at).dateStr }}
                &middot;
                {{ formatRange(event.starts_at, event.ends_at).timeStr }}</span
              >
            </p>
            <h3 class="text-xl font-semibold">{{ event.name }}</h3>
            <Button class="mt-auto" size="sm" variant="outline" as-child>
              <RouterLink
                :to="{ name: 'events-detail', params: { id: event.id } }"
              >
                Revisar Evento
              </RouterLink>
            </Button>
          </div>
        </li>
      </ul>
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
