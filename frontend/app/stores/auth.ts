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
  const refreshToken = ref<string | null>(null)

  const isAuthenticated = computed(
    () => Boolean(token.value && user.value),
  )

  // ─── helpers ──────────────────────────────────────────────────────────────
  function setAccessToken (value: string | null) {
    const cookie = useCookie<string | null>('token', {
      sameSite: 'lax',
      secure   : process.env.NODE_ENV === 'production',
      maxAge   : 60 * 60, // 1 час
    })
    cookie.value = value
    token.value  = value
  }

  function setRefreshToken (value: string | null) {
    const cookie = useCookie<string | null>('refresh_token', {
      sameSite: 'lax',
      secure   : process.env.NODE_ENV === 'production',
      maxAge   : 60 * 60 * 24 * 180, // 6 месяцев
    })
    cookie.value  = value
    refreshToken.value = value
  }

  // ─── actions ──────────────────────────────────────────────────────────────
  async function login (email: string, password: string) {
    const config = useRuntimeConfig()
    const form   = new FormData()
    form.append('username', email)
    form.append('password', password)

    const { access_token, refresh_token } = await $fetch<{access_token: string, refresh_token: string}>(
      '/auth/login',
      { baseURL: config.public.apiBase, method: 'POST', body: form },
    )

    setAccessToken(access_token)
    setRefreshToken(refresh_token)
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
    setAccessToken(null)
    setRefreshToken(null)
    await nextTick()
    navigateTo('/login')
  }

  async function refreshTokens () {
    if (!refreshToken.value) return false
    try {
      const config = useRuntimeConfig()
      const { access_token, refresh_token } = await $fetch<{access_token: string, refresh_token: string}>(
        '/auth/refresh',
        { baseURL: config.public.apiBase, method: 'POST', body: { refresh_token: refreshToken.value } },
      )
      setAccessToken(access_token)
      setRefreshToken(refresh_token)
      return true
    } catch (_) {
      return false
    }
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
      const refreshed = await refreshTokens()
      if (refreshed) return fetchUser()
      await logout()      // токен «протух»
    }
  }

  async function init () {
    const cookie = useCookie<string | null>('token')
    const refreshCookie = useCookie<string | null>('refresh_token')
    if (cookie.value) token.value = cookie.value
    if (refreshCookie.value) refreshToken.value = refreshCookie.value
    if (token.value) {
      await fetchUser()
    }
    ready.value = true
  }

  return {
    user, token, refreshToken, ready, isAuthenticated,
    login, register, logout, fetchUser, init, refreshTokens,
  }
})