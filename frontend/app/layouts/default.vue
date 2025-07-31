<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Навигационная панель -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Логотип -->
          <NuxtLink to="/" class="flex items-center space-x-2">
            <span class="text-2xl">📝</span>
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              TodoApp
            </span>
          </NuxtLink>

          <!-- Пользовательское меню -->
          <div class="flex items-center space-x-4">
            <span class="text-gray-600 dark:text-gray-400">
              {{ authStore.user?.email }}
            </span>

            <Button
              icon="i-heroicons-arrow-right-on-rectangle"
              color="gray"
              variant="ghost"
              @click="logout"
            >
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Основной контент -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
}
</script>