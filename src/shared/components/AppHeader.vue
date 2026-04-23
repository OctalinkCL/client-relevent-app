<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useAuth } from "@/shared/composables/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  EllipsisVertical,
  Building2,
  LogOut,
  ChevronsUpDown,
} from "lucide-vue-next";
import { useRouter } from "vue-router";

const store = useAuthStore();
const { logout } = useAuth();
const { toggleSidebar } = useSidebar();
const router = useRouter();

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

async function switchCompany() {
  store.clearActiveCompany();
  router.push("/select-company");
}
</script>

<template>
  <header class="bg-zinc-100 sticky top-0 z-50">
    <div class="container mx-auto flex items-center px-4 py-4 justify-between">
      <!-- Left -->
      <div class="flex items-center gap-3">
        <!-- Toggle sidebar  -->
        <Button
          size="icon"
          class="rounded-full border-0"
          variant="outline"
          @click="toggleSidebar"
        >
          <EllipsisVertical class="size-4" />
        </Button>
        <!-- Nombre company activa -->
        <span class="text-xl font-semibold">{{
          store.activeCompany?.name
        }}</span>
      </div>

      <!-- Menú usuario -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            class="flex items-center gap-2 h-9 px-1 border-0 rounded-full"
          >
            <Avatar class="size-7">
              <AvatarFallback class="text-xs">
                {{ store.user ? initials(store.user.full_name) : "?" }}
              </AvatarFallback>
            </Avatar>
            <span class="hidden sm:block text-sm max-w-32 truncate">
              {{ store.user?.full_name }}
            </span>
            <ChevronsUpDown class="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-52">
          <DropdownMenuLabel class="font-normal">
            <div class="flex flex-col gap-0.5">
              <span class="font-medium text-sm">{{
                store.user?.full_name
              }}</span>
              <span class="text-xs text-muted-foreground capitalize">{{
                store.activeRole
              }}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <!-- Switch company (solo si tiene más de una) -->
          <DropdownMenuItem
            v-if="store.memberships.length > 1"
            class="gap-2"
            @click="switchCompany"
          >
            <Building2 class="size-4" />
            Cambiar empresa
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="store.memberships.length > 1" />

          <DropdownMenuItem
            class="gap-2 text-destructive focus:text-destructive"
            @click="logout"
          >
            <LogOut class="size-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
