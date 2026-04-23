<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import { Info } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateEvent } from "./useEventMutations";
import dayjs from "@/shared/lib/dayjs";

const name = ref("");
const date = ref(dayjs().format("YYYY-MM-DD"));
const startTime = ref("20:00");
const endTime = ref("05:00");

const today = dayjs().format("YYYY-MM-DD");

// Genera opciones cada 30 min: ['00:00', '00:30', ..., '23:30']
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const isNextDay = (time: string) => time <= startTime.value;

const { mutate: createEvent, isPending, error } = useCreateEvent();

const canSubmit = computed(
  () =>
    name.value.trim().length > 0 &&
    date.value &&
    startTime.value &&
    endTime.value,
);

function submit() {
  if (!canSubmit.value) return;
  createEvent({
    name: name.value.trim(),
    date: date.value,
    startTime: startTime.value,
    endTime: endTime.value,
  });
}
</script>

<template>
  <div id="page-create" class="grid gap-4 max-w-3xl">
    <!-- Header -->
    <header>
      <Button variant="secondary" size="sm" as-child>
        <RouterLink :to="{ name: 'events' }"> Volver a Eventos </RouterLink>
      </Button>
    </header>

    <Card class="ring-0">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Crear evento</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="grid grid-cols-2 gap-4" @submit.prevent="submit">
          <!-- Name -->
          <div class="form-group col-span-2">
            <Label for="name">Nombre</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Nombre del evento"
              required
            />
          </div>
          <!-- Date -->
          <div class="form-group col-span-2">
            <Label for="date">Fecha</Label>
            <Input id="date" v-model="date" type="date" :min="today" required />
          </div>
          <!-- Start Time -->
          <div class="form-group col-span-1">
            <Label>Hora inicio</Label>
            <Select v-model="startTime">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in timeOptions" :key="t" :value="t">
                  {{ t }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <!-- End Time -->
          <div class="form-group col-span-1">
            <Label>Hora fin</Label>
            <Select v-model="endTime">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in timeOptions" :key="t" :value="t">
                  {{ t }}{{ isNextDay(t) ? " (día sig.)" : "" }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Alerts -->
          <div class="col-span-2 grid gap-2">
            <!-- Info -->
            <div
              v-if="isNextDay(endTime)"
              class="flex items-center gap-1.5 rounded-md bg-violet-100 p-2 text-xs font-medium text-violet-600"
            >
              <Info class="h-4 w-4" />
              Termina el día siguiente
            </div>
            <!-- Error -->
            <div
              v-if="error"
              class="flex items-center gap-1.5 rounded-md bg-red-100 p-2 text-xs font-medium text-red-600"
            >
              <Info class="h-4 w-4" />
              {{ (error as Error).message }}
            </div>
          </div>
          <!-- Buttons -->
          <div class="col-span-2 flex justify-end gap-2 pt-2">
            <RouterLink :to="{ name: 'events' }">
              <Button type="button" variant="outline">Cancelar</Button>
            </RouterLink>
            <Button type="submit" :disabled="!canSubmit || isPending">
              {{ isPending ? "Guardando…" : "Crear evento" }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
