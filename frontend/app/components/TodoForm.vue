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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'

type Priority = 'P1' | 'P2' | 'P3'

const props = defineProps<{
  editingTodo: {
    title: string
    description?: string
    priority?: Priority
    due_date?: string | null
  } | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', p: {
    title: string
    description?: string
    priority: Priority
    due_date?: string | null
  }): void
  (e: 'cancel'): void
}>()

/* -------------------  ВАЛИДАЦИЯ  ------------------- */
const formSchema = toTypedSchema(
  z.object({
    title:       z.string().min(1, 'Название обязательно'),
    description: z.string().optional(),
    priority:    z.enum(['P1', 'P2', 'P3']).default('P3'),
    // «date» валидируется как строка ISO-формата «YYYY-MM-DD»
    due_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  })
)

/* -------------------  ФОРМА  ------------------- */
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title:       props.editingTodo?.title       ?? '',
    description: props.editingTodo?.description ?? '',
    priority:    props.editingTodo?.priority    ?? 'P3',
    due_date:    props.editingTodo?.due_date    ?? null,
  },
})

/* Сброс, когда выбирают другую задачу для редактирования */
watch(
  () => props.editingTodo,
  (val) => {
    form.resetForm({
      values: {
        title:       val?.title       ?? '',
        description: val?.description ?? '',
        priority:    val?.priority    ?? 'P3',
        due_date:    val?.due_date    ?? null,
      },
    })
  },
)

const onSubmit = form.handleSubmit((values) => {
  emit('submit', values)                    // values: {title, description, priority, due_date}
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4 p-4">

    <!-- Название -->
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
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Описание -->
    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>Описание</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Введите описание задачи"
            rows="3"
            :disabled="props.loading"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Приоритет -->
    <FormField v-slot="{ componentField }" name="priority">
      <FormItem>
        <FormLabel>Приоритет</FormLabel>
        <FormControl>
          <ToggleGroup
            type="single"
            aria-label="Выберите приоритет"
            :disabled="props.loading"
            v-bind="componentField"
          >
            <ToggleGroupItem value="P1" class="rounded-l-md">
              <div class="-space-x-4">
                <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: black"/>
              <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: black"/>
              <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: black"/>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value="P2">
              <div class="-space-x-4">
                <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: black"/>
              <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: black"/>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value="P3" class="rounded-r-md">
                <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: black"/>
            </ToggleGroupItem>
          </ToggleGroup>
        </FormControl>
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Срок (due_date) -->
    <FormField v-slot="{ componentField }" name="due_date">
      <FormItem>
        <FormLabel>Срок выполнения</FormLabel>
        <FormControl>
          <!-- Можно заменить на ready-made date-picker, если есть -->
          <Input
            type="date"
            :disabled="props.loading"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Кнопки -->
    <div class="flex gap-3 justify-end">
      <Button
        type="button"
        variant="ghost"
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
