<script setup lang="ts">
definePageMeta({ layout: false })

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import RegisterForm from '@/components/RegisterForm.vue'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')

async function onRegister({ email, password }: { email: string; password: string }) {
  loading.value = true
  error.value = ''

  try {
    await authStore.register(email, password)
    router.push('/')
  } catch (err: any) {
    if (err?.status === 409) {
      error.value = `Email ${email} уже используется. Попробуйте войти или используйте другой email.`
    } else if (err?.status === 422) {
      error.value = 'Проверьте правильность введенных данных'
    } else {
      error.value = err?.data?.detail || err.message || 'Не удалось создать аккаунт. Попробуйте еще раз.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div>
      <h2 class="sr-only">Registration page</h2>
      <RegisterForm
        class="max-w-lg"
        :loading="loading"
        :error="error"
        @register="onRegister"
      />
    </div>
  </div>
</template>
