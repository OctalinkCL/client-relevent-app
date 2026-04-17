<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const route = useRoute()
const router = useRouter()
const store = useAuthStore()

const code = route.query.code as string

type Company = { id: string; name: string; code: string }
const company = ref<Company | null>(null)
const codeInvalid = ref(false)
const loadingCompany = ref(true)

const mode = ref<'choose' | 'login' | 'register'>('choose')

// Form state
const fullName = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(async () => {
  if (!code) {
    codeInvalid.value = true
    loadingCompany.value = false
    return
  }

  const { data } = await supabase
    .from('companies')
    .select('id, name, code')
    .eq('code', code)
    .single()

  loadingCompany.value = false
  if (!data) {
    codeInvalid.value = true
    return
  }
  company.value = data as Company
})

async function submitJoinRequest(userId: string, companyId: string): Promise<'already_member' | 'requested' | 'already_requested'> {
  const { data: existing } = await supabase
    .from('company_members')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (existing) return 'already_member'

  const { error } = await supabase
    .from('member_requests')
    .insert({ user_id: userId, company_id: companyId })

  if (error) {
    if (error.code === '23505') return 'already_requested'
    throw error
  }
  return 'requested'
}

async function handleLogin() {
  if (!company.value) return
  errorMsg.value = ''
  isLoading.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (error) throw error

    await store.fetchProfileAndMemberships(data.user.id)
    const result = await submitJoinRequest(data.user.id, company.value.id)

    if (result === 'already_member') {
      await store.setActiveCompany(store.memberships.find(m => m.company_id === company.value!.id)!.company)
      router.push('/dashboard')
      return
    }
    successMsg.value = result === 'already_requested'
      ? 'Ya tienes una solicitud pendiente con esta empresa.'
      : `Solicitud enviada. El administrador de ${company.value.name} la revisará pronto.`
    setTimeout(() => router.push('/select-company'), 2000)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Error al iniciar sesión'
  } finally {
    isLoading.value = false
  }
}

async function handleRegister() {
  if (!company.value) return
  errorMsg.value = ''
  isLoading.value = true
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { data: { full_name: fullName.value } },
    })
    if (error) throw error
    if (!data.user) throw new Error('No se pudo crear el usuario')
    if (!data.session) {
      successMsg.value = 'Revisa tu correo para confirmar tu cuenta y luego vuelve a este link.'
      return
    }

    await store.fetchProfileAndMemberships(data.user.id)
    const result = await submitJoinRequest(data.user.id, company.value.id)

    successMsg.value = result === 'already_requested'
      ? 'Ya tienes una solicitud pendiente con esta empresa.'
      : `Solicitud enviada. El administrador de ${company.value.name} la revisará pronto.`
    setTimeout(() => router.push('/select-company'), 2000)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Error al registrarse'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-4">
    <!-- Loading company -->
    <Card v-if="loadingCompany" class="w-full max-w-sm">
      <CardContent class="pt-6 flex flex-col gap-3">
        <Skeleton class="h-5 w-40 mx-auto" />
        <Skeleton class="h-12 w-full rounded-lg" />
      </CardContent>
    </Card>

    <!-- Código inválido -->
    <Card v-else-if="codeInvalid" class="w-full max-w-sm text-center">
      <CardHeader>
        <CardTitle>Link inválido</CardTitle>
        <CardDescription>Este link de invitación no existe o venció.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" class="w-full" @click="router.push('/login')">Ir al login</Button>
      </CardContent>
    </Card>

    <!-- Solicitud enviada con éxito -->
    <Card v-else-if="successMsg" class="w-full max-w-sm text-center">
      <CardHeader>
        <CardTitle>¡Listo!</CardTitle>
        <CardDescription>{{ successMsg }}</CardDescription>
      </CardHeader>
    </Card>

    <!-- Flujo de unirse -->
    <Card v-else class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">Relevent</CardTitle>
        <CardDescription>
          Te invitaron a unirte a
        </CardDescription>
        <div class="mt-2 px-4 py-2 rounded-lg bg-muted text-sm font-medium">
          {{ company?.name }}
        </div>
      </CardHeader>

      <CardContent>
        <!-- Elegir modo -->
        <div v-if="mode === 'choose'" class="flex flex-col gap-3">
          <Button class="w-full" @click="mode = 'register'">Soy nuevo, registrarme</Button>
          <Button variant="outline" class="w-full" @click="mode = 'login'">Ya tengo cuenta</Button>
        </div>

        <!-- Formulario registro -->
        <form v-else-if="mode === 'register'" class="flex flex-col gap-4" @submit.prevent="handleRegister">
          <div class="flex flex-col gap-1.5">
            <Label for="fullname">Nombre completo</Label>
            <Input id="fullname" v-model="fullName" type="text" placeholder="Juan Pérez" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="email">Correo</Label>
            <Input id="email" v-model="email" type="email" placeholder="tu@correo.com" autocomplete="email" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="password">Contraseña</Label>
            <Input id="password" v-model="password" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password" required minlength="6" />
          </div>
          <p v-if="errorMsg" class="text-sm text-destructive">{{ errorMsg }}</p>
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? 'Creando cuenta…' : 'Crear cuenta y solicitar unirse' }}
          </Button>
          <Button type="button" variant="ghost" class="w-full" @click="mode = 'choose'">Volver</Button>
        </form>

        <!-- Formulario login -->
        <form v-else-if="mode === 'login'" class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-1.5">
            <Label for="login-email">Correo</Label>
            <Input id="login-email" v-model="email" type="email" placeholder="tu@correo.com" autocomplete="email" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="login-password">Contraseña</Label>
            <Input id="login-password" v-model="password" type="password" autocomplete="current-password" required />
          </div>
          <p v-if="errorMsg" class="text-sm text-destructive">{{ errorMsg }}</p>
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? 'Ingresando…' : 'Ingresar y solicitar unirse' }}
          </Button>
          <Button type="button" variant="ghost" class="w-full" @click="mode = 'choose'">Volver</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
