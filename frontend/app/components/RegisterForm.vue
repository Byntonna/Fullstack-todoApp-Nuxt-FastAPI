<!-- components/RegisterForm.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '~/components/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  loading: boolean
  error: string
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  (e: 'register', payload: { email: string; password: string }): void
}>()

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const passwordsMatch = computed(() => password.value === passwordConfirm.value)
const showMismatchError = computed(() => passwordConfirm.value !== '' && !passwordsMatch.value)

// можно дополнительно предотвратить отправку если пустые
const canSubmit = computed(() => {
  return !props.loading &&
    email.value.trim() !== '' &&
    password.value !== '' &&
    passwordConfirm.value !== '' &&
    passwordsMatch.value
})

function onSubmit() {
  if (!canSubmit.value) return
  emit('register', { email: email.value.toLowerCase(), password: password.value })
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card class="overflow-hidden p-0 max-w-sm">
      <CardContent class="p-6 md:p-8">
        <form @submit.prevent="onSubmit" class="space-y-6">
          <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">
                Регистрация
              </h1>
              <p class="text-muted-foreground text-balance">
                Введите свои данные для создания учетной записи
              </p>
            </div>
          <div>
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="mt-3"
            />
          </div>
          <div>
            <Label for="password">Пароль</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              class="mt-3"
            />
          </div>
          <div>
            <Label for="password-confirm">Повторите пароль</Label>
            <Input
              id="password-confirm"
              v-model="passwordConfirm"
              type="password"
              autocomplete="new-password"
              required
              class="mt-3"
              :aria-invalid="showMismatchError ? 'true' : 'false'"
            />
            <p v-if="showMismatchError" class="text-sm text-red-600 mt-1">
              Пароли не совпадают.
            </p>
          </div>

          <p v-if="props.error" class="text-sm text-red-600">
            {{ props.error }}
          </p>

          <Button
            type="submit"
            class="w-full"
            :disabled="props.loading || !passwordsMatch"
          >
            <span v-if="props.loading" class="animate-spin inline-block w-4 h-4 border-2 rounded-full border-current border-t-transparent"/>
            <span v-else>Зарегистрироваться</span>
          </Button>

          <div class="text-center text-sm">
            Уже есть аккаунт?
            <NuxtLink to="/login" class="underline underline-offset-4">
              Войти
            </NuxtLink>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
Z