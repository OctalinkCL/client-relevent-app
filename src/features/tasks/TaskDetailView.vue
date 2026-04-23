<script setup lang="ts">
import { ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { ChevronLeft, Check, X, Eye } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTaskDetail } from "./useTasks";
import { useReviewSubmission } from "./useTaskMutations";
import dayjs from "@/shared/lib/dayjs";

const route = useRoute();
const taskId = route.params.id as string;

const { data: task, isLoading } = useTaskDetail(taskId);
const { mutate: review, isPending: reviewing } = useReviewSubmission();

const activeAssignment = ref<any>(null);

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  submitted: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};
const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  submitted: "secondary",
  approved: "default",
  rejected: "destructive",
  expired: "destructive",
};

function openEvidence(assignment: any) {
  activeAssignment.value = assignment;
}

function approve() {
  if (!activeAssignment.value) return;
  review({
    assignmentId: activeAssignment.value.id,
    status: "approved",
    taskId,
  });
  activeAssignment.value = null;
}

function reject() {
  if (!activeAssignment.value) return;
  review({
    assignmentId: activeAssignment.value.id,
    status: "rejected",
    taskId,
  });
  activeAssignment.value = null;
}
</script>

<template>
  <div class="grid gap-4">
    <RouterLink
      :to="{ name: 'tasks' }"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
    >
      <ChevronLeft class="size-4" />
      Tareas
    </RouterLink>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col gap-3">
      <Skeleton class="h-7 w-48" />
      <Skeleton class="h-4 w-32" />
      <Skeleton class="h-24 w-full rounded-lg mt-2" />
    </div>

    <template v-else-if="task">
      <!-- Header tarea -->
      <div class="mb-4">
        <h1 class="text-xl font-semibold">{{ task.title }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ (task.event as any)?.name }} · Límite
          {{ dayjs(task.deadline).format("D MMM YYYY, HH:mm") }}
        </p>
        <p v-if="task.description" class="text-sm mt-2 text-foreground/80">
          {{ task.description }}
        </p>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Data -->
        <Card>
          <CardHeader class="pb-2 flex items-center justify-between"
            ><CardTitle class="text-sm font-semibold"
              >Datos de la tarea</CardTitle
            >
            <span class="text-sm font-normal text-muted-foreground">
              {{
                (task.task_assignments as any[]).filter(
                  (a) => a.status === "approved",
                ).length
              }}/{{ (task.task_assignments as any[]).length }} aprobadas
            </span>
          </CardHeader>
          <CardContent>
            <p class="text-sm whitespace-pre-wrap text-muted-foreground">
              <pre>{{ task }}</pre>
            </p>
          </CardContent>
        </Card>

        <!-- Sellers -->
        <Card class="ring-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[100px]">Estado</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead class="text-right"> Acciones </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="item in task.task_assignments as any[]"
                :key="item.id"
              >
                <TableCell>{{ statusLabel[item.status] }}</TableCell>
                <TableCell>{{ item.profile?.full_name }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    v-if="item.status !== 'pending'"
                    size="sm"
                    variant="outline"
                    class="shrink-0"
                    @click="openEvidence(item)"
                  >
                    <Eye class="size-4 mr-1" />
                    Ver
                  </Button></TableCell
                >
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>
    </template>

    <!-- Dialog evidencia -->
    <Dialog :open="!!activeAssignment" @update:open="(val: boolean) => { if (!val) activeAssignment = null }">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ activeAssignment?.profile?.full_name }}</DialogTitle>
          <DialogDescription>Evidencia enviada para revisión</DialogDescription>
        </DialogHeader>

        <template v-if="activeAssignment">
          <Badge :variant="statusVariant[activeAssignment.status]" class="w-fit">
            {{ statusLabel[activeAssignment.status] }}
          </Badge>

          <!-- Screenshot -->
          <div
            v-if="activeAssignment.task_submissions?.[0]"
            class="flex flex-col gap-3"
          >
            <p class="text-xs text-muted-foreground">
              Enviada
              {{
                dayjs(activeAssignment.task_submissions[0].submitted_at).format(
                  "D MMM YYYY, HH:mm",
                )
              }}
            </p>
            <img
              :src="activeAssignment.task_submissions[0].screenshot_url"
              alt="Evidencia"
              class="w-full rounded-lg object-contain max-h-[70vh]"
            />
            <p
              v-if="activeAssignment.task_submissions[0].observation"
              class="text-sm text-muted-foreground italic"
            >
              "{{ activeAssignment.task_submissions[0].observation }}"
            </p>
          </div>
          <p v-else class="text-sm text-muted-foreground">
            Sin evidencia adjunta.
          </p>

          <!-- Aprobar / Rechazar -->
          <div
            v-if="activeAssignment.status === 'submitted'"
            class="flex gap-3 mt-2"
          >
            <Button
              variant="outline"
              class="flex-1 text-destructive hover:text-destructive"
              :disabled="reviewing"
              @click="reject"
            >
              <X class="size-4 mr-1" /> Rechazar
            </Button>
            <Button class="flex-1" :disabled="reviewing" @click="approve">
              <Check class="size-4 mr-1" /> Aprobar
            </Button>
          </div>
        </template>
      </DialogContent>
    </Dialog>
  </div>
</template>
