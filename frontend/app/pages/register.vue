<script setup lang="ts">
definePageMeta({ layout: false })

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useI18n, useHead } from '#imports'
import RegisterForm from '@/components/RegisterForm.vue'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const { t } = useI18n()

useHead(() => ({
  title: t('register.register'),
}))

async function onRegister({ email, password }: { email: string; password: string }) {
  loading.value = true
  error.value = ''

  try {
    await authStore.register(email, password)
    router.push('/')
  } catch (err: any) {
    if (err?.status === 409) {
      error.value = t('register.email_used', { email })
    } else if (err?.status === 422) {
      error.value = t('register.invalid_data')
    } else {
      error.value = err?.data?.detail || err.message || t('register.failed')
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
