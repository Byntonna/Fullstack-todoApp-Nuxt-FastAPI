export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Если пользователь не аутентифицирован, перенаправляем на логин
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})