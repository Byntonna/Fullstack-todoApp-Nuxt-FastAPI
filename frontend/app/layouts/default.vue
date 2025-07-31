<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Top bar -->
    <header class="border-b border-border">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Логотип -->
        <NuxtLink to="/" class="font-semibold tracking-tight text-lg">
          TodoApp
        </NuxtLink>

        <div class="flex items-center gap-4">
          <!-- Переключатель темы -->
          <div>
            <!-- <ModeToggle /> -->
          </div>

          <!-- User / logout -->
          <div v-if="authStore.user">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm" class="relative h-8 w-8 rounded-full">
                  <Avatar class="h-8 w-8">
                    <AvatarImage :src="gravatar(authStore.user.email)" />
                    <AvatarFallback>{{ initials }}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" class="w-56">
                <DropdownMenuLabel class="opacity-70">
                  {{ authStore.user.email }}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="logout" class="cursor-pointer">
                  <Icon name="lucide:log-out" class="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="container mx-auto px-4 py-10">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import MD5 from 'crypto-js/md5'
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

const authStore = useAuthStore()

const initials = computed(() =>
  authStore.user?.email?.slice(0, 2).toUpperCase() || 'U'
)

const useCryptoMD5 = (input: string) => MD5(input).toString()

function gravatar(email: string) {
  return `https://www.gravatar.com/avatar/${useCryptoMD5(email.trim().toLowerCase())}?d=identicon`
}

function logout() {
  authStore.logout()
}
</script>