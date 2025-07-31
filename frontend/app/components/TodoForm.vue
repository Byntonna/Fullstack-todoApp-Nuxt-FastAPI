<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  editingTodo: { title: string; description?: string } | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', p: { title: string; description?: string }): void
  (e: 'cancel'): void
}>()

// Схема валидации
const formSchema = toTypedSchema(z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
}))

// useForm из vee-validate + zod
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: props.editingTodo?.title ?? '',
    description: props.editingTodo?.description ?? '',
  },
})

watch(
  () => props.editingTodo,
  (val) => {
    form.resetForm({
      values: {
        title: val?.title ?? '',
        description: val?.description ?? '',
      }
    })
  },
)

const onSubmit = form.handleSubmit((values) => {
  emit('submit', values)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4">
    <!-- Поле title -->
    <FormField v-slot="{ componentField }" name="title">
      <FormItem>
        <FormLabel>Название задачи</FormLabel>
        <FormControl>
          <Input
            type="text"
            placeholder="Введите название задачи"
            :disabled="props.loading"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Поле description -->
    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>Описание</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Введите описание задачи"
            :disabled="props.loading"
            rows="3"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="flex gap-3 justify-end">
      <Button
        variant="ghost"
        type="button"
        :disabled="props.loading"
        @click="$emit('cancel')"
      >
        Отмена
      </Button>
      <Button
        type="submit"
        :disabled="props.loading"
      >
        {{ props.editingTodo ? 'Обновить' : 'Создать' }}
      </Button>
    </div>
  </form>
</template>