<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  ScanLine,
  Users,
  X,
} from 'lucide-vue-next'
import type { FeatureName, MemberRole } from '@/shared/lib/supabase'
import type { Component } from 'vue'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const route = useRoute()
const store = useAuthStore()

interface NavItem {
  label: string
  to: string
  icon: Component
  module?: FeatureName
  roles?: MemberRole[]
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Tareas',    to: '/tasks',     icon: ClipboardList, module: 'tasks' },
  { label: 'Eventos',   to: '/events',    icon: CalendarDays,  module: 'events' },
  { label: 'Puerta',    to: '/access',    icon: ScanLine,      module: 'access', roles: ['door'] },
  { label: 'Staff',     to: '/staff',     icon: Users,         roles: ['admin'] },
]

const navItems = computed(() =>
  allNavItems.filter(item => {
    if (item.module && !store.hasModule(item.module)) return false
    if (item.roles && !store.hasRole(...item.roles)) return false
    return true
  })
)

const isActive = (to: string) => route.path.startsWith(to)
</script>

<template>
  <!-- Desktop -->
  <aside class="hidden lg:flex flex-col w-60 border-r bg-card shrink-0">
    <div class="flex items-center px-5 h-14 border-b">
      <span class="font-semibold tracking-tight">Relevent</span>
    </div>
    <nav class="flex flex-col gap-1 p-3 flex-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
        :class="isActive(item.to)
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
      >
        <component :is="item.icon" class="size-4 shrink-0" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>

  <!-- Mobile drawer -->
  <aside
    class="fixed inset-y-0 left-0 z-30 flex flex-col w-60 border-r bg-card lg:hidden transition-transform duration-200"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center justify-between px-4 h-14 border-b">
      <span class="font-semibold tracking-tight">Relevent</span>
      <button class="p-1 rounded hover:bg-muted" @click="$emit('close')">
        <X class="size-4" />
      </button>
    </div>
    <nav class="flex flex-col gap-1 p-3 flex-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
        :class="isActive(item.to)
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
        @click="$emit('close')"
      >
        <component :is="item.icon" class="size-4 shrink-0" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
