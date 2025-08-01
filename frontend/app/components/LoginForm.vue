<script setup lang="ts">
import { ref } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '~/components/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '#imports'

const props = defineProps<{
  loading: boolean
  error: string
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  (e: 'login', payload: { email: string; password: string }): void
}>()

const email = ref('')
const password = ref('')
const { t } = useI18n()

function onSubmit(event: Event) {
  event.preventDefault()
  emit('login', { email: email.value.toLowerCase(), password: password.value })
}
</script>

<template>
  <div class="items-center" :class="cn('flex flex-col gap-6', props.class)">
    <Card class="overflow-hidden p-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form @submit="onSubmit" class="p-6 md:p-8">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">
                {{ t('login.welcome') }}
              </h1>
              <p class="text-muted-foreground text-balance">
                {{ t('login.signin_to_account') }}
              </p>
            </div>

            <!-- Показать ошибку если есть -->
            <div v-if="props.error" class="text-red-500 max-w-70 text-sm text-center">
              {{ props.error }}
            </div>

            <div class="grid gap-3">
              <Label for="email">Email</Label>
              <Input
                id="email"
                type="email"
                v-model="email"
                autocomplete="email"
                required
              />
            </div>
            <div class="grid gap-3">
              <div class="flex items-center">
                <Label for="password">{{ t('login.password') }}</Label>
                <a
                  href="#"
                  class="ml-auto text-sm underline-offset-2 hover:underline"
                >
                  {{ t('login.forgot_password') }}
                </a>
              </div>
              <Input
                id="password"
                type="password"
                v-model="password"
                autocomplete="current-password"
                required
              />
            </div>
            <Button type="submit" class="w-full" :disabled="props.loading">
              <span v-if="props.loading" class="animate-spin inline-block w-4 h-4 border-2 rounded-full border-current border-t-transparent"></span>
              <span v-else>{{ t('login.sign_in') }}</span>
            </Button>
            <div class="text-center text-sm">
              {{ t('login.no_account') }}
              <NuxtLink to="/register" class="underline underline-offset-4">
                {{ t('login.sign_up') }}
              </NuxtLink>
            </div>
          </div>
        </form>
        <div class="bg-muted relative hidden md:block">
          <NuxtImg
            format="webp"
            src="/images/login.webp"
            alt="Image"
            class="absolute inset-0 h-full w-full dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </CardContent>
    </Card>
    <div class="max-w-2/3 text-muted-foreground text-center text-xs text-balance">
      <i18n-t keypath="login.agree_terms" tag="span">
        <a href="#" class="underline hover:text-primary">{{ t('login.terms_of_service') }}</a>
        <a href="#" class="underline hover:text-primary">{{ t('login.privacy_policy') }}</a>
      </i18n-t>
    </div>
  </div>
</template>