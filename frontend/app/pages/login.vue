<!-- pages/login.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useI18n, useHead } from '#imports'
import LoginForm from '@/components/LoginForm.vue'

definePageMeta({ layout: false })

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const { t } = useI18n()

useHead(() => ({
  title: t('login.sign_in'),
}))

async function onLogin({ email, password }: { email: string; password: string }) {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(email, password)
    await router.push('/')
  } catch (err: any) {
    error.value = err.data?.detail || err.message || t('login.error')
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
      <h2 class="sr-only">Login page</h2>
      <LoginForm
        class="max-w-2xl"
        :loading="loading"
        :error="error"
        @login="onLogin"
      />
    </div>
  </div>
</template>