<script setup lang="ts">
import AppSidebar from '@/shared/components/AppSidebar.vue'
import AppHeader from '@/shared/components/AppHeader.vue'
import { ref } from 'vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen bg-background overflow-hidden">
    <!-- Sidebar -->
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Overlay móvil -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Contenido principal -->
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
