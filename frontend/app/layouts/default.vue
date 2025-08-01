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
              <div>
                  <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="sm" class="relative h-8 w-8 rounded-full">
                    <Avatar class="h-8 w-8">
                      <AvatarImage :src="gravatar(authStore.user.email)" />
                      <AvatarFallback>{{ initials }}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
              </div>

              <DropdownMenuContent align="end" class="w-56">
                <DropdownMenuLabel class="opacity-70">
                  {{ authStore.user.email }}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="flex items-center">
                    <Icon name="radix-icons:sun"
                          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Icon name="radix-icons:moon"
                          class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span class="ml-2">Тема</span>
                  </DropdownMenuSubTrigger>

                  <DropdownMenuSubContent align="start">
                    <DropdownMenuItem @select.prevent="colorMode.preference = 'light'">
                      Светлая
                    </DropdownMenuItem>
                    <DropdownMenuItem @select.prevent="colorMode.preference = 'dark'">
                      Темная
                    </DropdownMenuItem>
                    <DropdownMenuItem @select.prevent="colorMode.preference = 'system'">
                      Системная
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem class="cursor-pointer" @click="logout">
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
const colorMode = useColorMode()

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