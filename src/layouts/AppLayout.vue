<script setup lang="ts">
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/shared/components/AppSidebar.vue";
import AppHeader from "@/shared/components/AppHeader.vue";
</script>

<template>
  <SidebarProvider :default-open="false">
    <AppSidebar />
    <SidebarInset class="bg-neutral-50">
      <AppHeader />
      <div class="container mx-auto p-4">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
