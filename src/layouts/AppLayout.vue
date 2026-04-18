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
      <div class="container mx-auto px-4 pt-4">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
