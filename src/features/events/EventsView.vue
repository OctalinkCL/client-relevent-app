<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

const store = useAuthStore()
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">Eventos</h1>
      <RouterLink v-if="store.isAdmin" :to="{ name: 'events-create' }">
        <Button size="sm">
          <Plus class="size-4 mr-1" />
          Nuevo evento
        </Button>
      </RouterLink>
    </div>
    <p class="text-muted-foreground text-sm">Próximamente — lista de eventos.</p>
  </div>
</template>
