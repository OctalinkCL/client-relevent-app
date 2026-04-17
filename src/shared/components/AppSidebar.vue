<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import type { FeatureName, MemberRole } from "@/shared/lib/supabase";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  ScanLine,
  Users,
} from "lucide-vue-next";

interface NavItem {
  label: string;
  to: string;
  icon: Component;
  module?: FeatureName;
  roles?: MemberRole[];
}

const route = useRoute();
const store = useAuthStore();

const allNavItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Eventos", to: "/events", icon: CalendarDays, module: "events" },
  { label: "Tareas", to: "/tasks", icon: ClipboardList, module: "tasks" },
  // {
  //   label: "Puerta",
  //   to: "/access",
  //   icon: ScanLine,
  //   module: "access",
  //   roles: ["door"],
  // },
  // { label: "Staff", to: "/staff", icon: Users, roles: ["admin"] },
];

const navItems = computed(() =>
  allNavItems.filter((item) => {
    if (item.module && !store.hasModule(item.module)) return false;
    if (item.roles && !store.hasRole(...item.roles)) return false;
    return true;
  }),
);

const isActive = (to: string) => route.path.startsWith(to);
</script>

<template>
  <Sidebar>
    <SidebarHeader class="px-4 py-3 border-b">
      <span class="font-semibold tracking-tight text-sm">Relevent</span>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navItems" :key="item.to">
              <SidebarMenuButton as-child :is-active="isActive(item.to)">
                <RouterLink :to="item.to">
                  <component :is="item.icon" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <p class="text-xs text-center text-muted-foreground">Relevent 2026</p>
    </SidebarFooter>
  </Sidebar>
</template>
