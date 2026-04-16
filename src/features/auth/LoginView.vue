<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/shared/composables/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
  error.value = ''
  isLoading.value = true
  try {
    await login(email.value, password.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al iniciar sesión'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-4">
    <Card class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">Relevent</CardTitle>
        <CardDescription>Ingresa con tu cuenta</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-1.5">
            <Label for="email">Correo</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@correo.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="password">Contraseña</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? 'Ingresando...' : 'Ingresar' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
