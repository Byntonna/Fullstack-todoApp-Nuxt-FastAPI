export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  if (!authStore.ready) {
    await authStore.init()
  }

  // Если пользователь не аутентифицирован, перенаправляем на логин
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})