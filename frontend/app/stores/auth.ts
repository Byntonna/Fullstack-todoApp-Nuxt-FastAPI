// ~/stores/auth.ts
import { defineStore } from 'pinia'
import { useCookie, useRuntimeConfig, navigateTo } from '#imports'

interface User {
  id: number
  email: string
  is_active: boolean
  created_at: string
}

export const useAuthStore = defineStore('auth', () => {
  // ─── state ────────────────────────────────────────────────────────────────
  const user  = ref<User | null>(null)
  const token = ref<string | null>(null)
  const ready = ref(false)

  const isAuthenticated = computed(
    () => Boolean(token.value && user.value),
  )

  // ─── helpers ──────────────────────────────────────────────────────────────
  function setToken (value: string | null) {
    const cookie = useCookie<string | null>('token', {
      sameSite: 'lax',
      secure   : process.env.NODE_ENV === 'production',
      maxAge   : 60 * 60 * 24 * 7, // 7 дней
    })
    cookie.value = value
    token.value  = value
  }

  // ─── actions ──────────────────────────────────────────────────────────────
  async function login (email: string, password: string) {
    const config = useRuntimeConfig()
    const form   = new FormData()
    form.append('username', email)
    form.append('password', password)

    const { access_token } = await $fetch<{access_token: string}>(
      '/auth/login',
      { baseURL: config.public.apiBase, method: 'POST', body: form },
    )

    setToken(access_token)
    await fetchUser()
  }

  async function register (email: string, password: string) {
    const config = useRuntimeConfig()
    await $fetch('/auth/register', {
      baseURL: config.public.apiBase,
      method : 'POST',
      body   : { email, password },
    })
    await login(email, password)
  }

  async function logout () {
    user.value = null
    setToken(null)
    await nextTick()
    navigateTo('/login')
  }

  async function fetchUser () {
    if (!token.value) return
    try {
      const config   = useRuntimeConfig()
      const received = await $fetch<User>('/auth/me', {
        baseURL: config.public.apiBase,
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = received
    } catch (_) {
      await logout()      // токен «протух»
    }
  }

  async function init () {
    const cookie = useCookie<string | null>('token')
    if (cookie.value) {
      token.value = cookie.value
      await fetchUser()
    }
    ready.value = true
  }

  return {
    user, token, ready, isAuthenticated,
    login, register, logout, fetchUser, init,
  }
})