<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useAuth } from "@/shared/composables/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, ChevronsUpDown } from "lucide-vue-next";
import { useRouter } from "vue-router";

const store = useAuthStore();
const { logout } = useAuth();
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
  <header
    class="flex items-center justify-between h-14 px-4 border-b bg-card shrink-0"
  >
    <!-- Toggle sidebar (móvil) -->
    <SidebarTrigger />
    <!-- Nombre company activa -->
    <div class="flex items-center gap-2 text-sm font-medium lg:ml-0 ml-2">
      <Building2 class="size-4 text-muted-foreground" />
      <span>{{ store.activeCompany?.name }}</span>
    </div>

    <!-- Menú usuario -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="flex items-center gap-2 h-9 px-2">
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
            <span class="font-medium text-sm">{{ store.user?.full_name }}</span>
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
  </header>
</template>
