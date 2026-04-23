<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/shared/composables/useAuth'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const store = useAuthStore()
const { logout } = useAuth()
const router = useRouter()

const noMemberships = computed(() => store.memberships.length === 0)

const { data: pendingRequests } = useQuery({
  queryKey: ['my-pending-requests'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('member_requests')
      .select('id')
      .eq('user_id', store.user!.id)
    if (error) throw error
    return data
  },
  enabled: noMemberships,
})

const hasPendingRequest = computed(() => !!pendingRequests.value?.length)

async function selectCompany(companyId: string) {
  const membership = store.memberships.find(m => m.company_id === companyId)
  if (!membership) return
  await store.setActiveCompany(membership.company)
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-4">
    <!-- Sin membresías -->
    <Card v-if="noMemberships" class="w-full max-w-sm text-center">
      <CardHeader>
        <CardTitle>{{ hasPendingRequest ? 'Solicitud enviada' : 'Sin acceso' }}</CardTitle>
        <CardDescription>
          <template v-if="hasPendingRequest">
            Tu solicitud está pendiente de aprobación.<br />
            El administrador te notificará cuando sea aceptada.
          </template>
          <template v-else>
            No perteneces a ninguna empresa.<br />
            Pide a tu administrador un link de invitación para solicitar acceso.
          </template>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="ghost" class="w-full" @click="logout">Cerrar sesión</Button>
      </CardContent>
    </Card>

    <!-- Con membresías: selector normal -->
    <Card v-else class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle>Selecciona tu empresa</CardTitle>
        <CardDescription>
          Tienes acceso a múltiples empresas. ¿Con cuál trabajas hoy?
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <Button
          v-for="m in store.memberships"
          :key="m.company_id"
          variant="outline"
          class="w-full justify-between h-auto py-3"
          @click="selectCompany(m.company_id)"
        >
          <div class="flex flex-col items-start text-left">
            <span class="font-medium">{{ m.company.name }}</span>
            <span class="text-xs text-muted-foreground capitalize">
              {{ m.company.type }} · {{ m.role }}
            </span>
          </div>
        </Button>

        <Button variant="ghost" class="w-full mt-2" @click="logout">
          Cerrar sesión
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
