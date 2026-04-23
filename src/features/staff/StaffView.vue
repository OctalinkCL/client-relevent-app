<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, X, Copy, Users } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { useCompanyMembers, usePendingRequests } from './useStaff'
import { useApproveRequest, useRejectRequest, useRemoveMember } from './useStaffMutations'

const store = useAuthStore()
const { data: members, isLoading: loadingMembers } = useCompanyMembers()
const { data: requests, isLoading: loadingRequests } = usePendingRequests()

const { mutate: approve, isPending: approving } = useApproveRequest()
const { mutate: reject, isPending: rejecting } = useRejectRequest()
const { mutate: remove, isPending: removing, error: removeError } = useRemoveMember()

const copied = ref(false)
const joinLink = computed(() => {
  const code = (store.activeCompany as any)?.code
  return code ? `${window.location.origin}/join?code=${code}` : ''
})

async function copyLink() {
  await navigator.clipboard.writeText(joinLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  seller: 'Seller',
  door: 'Puerta',
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-xl font-semibold mb-6">Equipo</h1>

    <!-- Solicitudes pendientes -->
    <template v-if="loadingRequests">
      <Skeleton class="h-5 w-32 mb-3" />
      <Skeleton class="h-14 w-full rounded-lg mb-6" />
    </template>
    <template v-else-if="requests && requests.length > 0">
      <div class="flex items-center gap-2 mb-3">
        <p class="text-sm font-medium">Solicitudes</p>
        <Badge variant="secondary">{{ requests.length }}</Badge>
      </div>
      <div class="flex flex-col gap-2 mb-6">
        <div
          v-for="req in requests"
          :key="req.id"
          class="flex items-center justify-between px-4 py-3 rounded-lg border bg-card"
        >
          <div>
            <p class="text-sm font-medium">{{ (req as any).full_name }}</p>
            <p class="text-xs text-muted-foreground">Quiere unirse como seller</p>
          </div>
          <div class="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              class="text-destructive hover:text-destructive"
              :disabled="rejecting || approving"
              @click="reject(req.id)"
            >
              <X class="size-4" />
            </Button>
            <Button
              size="sm"
              :disabled="approving || rejecting"
              @click="approve({ requestId: req.id, userId: req.user_id })"
            >
              <Check class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </template>

    <!-- Miembros activos -->
    <p class="text-sm font-medium mb-3">Miembros activos</p>

    <div v-if="loadingMembers" class="flex flex-col gap-2 mb-6">
      <Skeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-lg" />
    </div>

    <div v-else-if="members && members.length > 0" class="flex flex-col gap-2 mb-6">
      <div
        v-for="member in members"
        :key="member.id"
        class="flex items-center justify-between px-4 py-3 rounded-lg border bg-card"
      >
        <div>
          <p class="text-sm font-medium">{{ (member as any).full_name }}</p>
          <Badge variant="outline" class="mt-1 text-xs">{{ roleLabel[member.role] }}</Badge>
        </div>
        <Button
          v-if="member.role !== 'admin'"
          size="icon"
          variant="ghost"
          class="size-8 text-muted-foreground hover:text-destructive"
          :disabled="removing"
          @click="remove(member.id)"
        >
          <X class="size-4" />
        </Button>
      </div>
    </div>

    <div v-else class="flex flex-col items-center gap-2 py-10 text-center mb-6">
      <Users class="size-10 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Sin miembros en tu equipo</p>
    </div>

    <p v-if="removeError" class="text-sm text-destructive mb-4">
      Error al desvincular: {{ (removeError as Error).message }}
    </p>

    <!-- Link de invitación -->
    <Card v-if="joinLink">
      <CardHeader class="pb-2">
        <CardTitle class="text-sm">Link de invitación</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <p class="text-xs text-muted-foreground break-all">{{ joinLink }}</p>
        <Button variant="outline" size="sm" class="w-fit" @click="copyLink">
          <Copy class="size-4 mr-1" />
          {{ copied ? '¡Copiado!' : 'Copiar link' }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
