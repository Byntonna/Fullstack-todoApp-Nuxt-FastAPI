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
    const result = await authStore.register(email, password)
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.error || 'Ошибка регистрации'
    }
  } catch (err) {
    error.value = 'Произошла ошибка. Попробуйте снова.'
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
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div>
      <h2 class="sr-only">Registration page</h2>
      <RegisterForm
        :loading="loading"
        :error="error"
        @register="onRegister"
      />
    </div>
  </div>
</template>
