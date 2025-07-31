<template>
  <Form :control="control" @submit="onSubmit" class="space-y-4">
    <FormField name="title" v-slot="{ field, errorMessage }">
      <FormItem>
        <FormLabel for="title">
          Название задачи<span class="text-red-500">*</span>
        </FormLabel>
        <FormControl>
          <Input
            id="title"
            v-bind="field"
            placeholder="Введите название задачи..."
            :disabled="loading"
          />
        </FormControl>
        <FormMessage>{{ errorMessage }}</FormMessage>
      </FormItem>
    </FormField>

    <!-- Поле «Описание» -->
    <FormField name="description" v-slot="{ field, errorMessage }">
      <FormItem>
        <FormLabel for="description">Описание</FormLabel>
        <FormControl>
          <Textarea
            id="description"
            v-bind="field"
            placeholder="Описание задачи (необязательно)..."
            :disabled="loading"
            rows="3"
          />
        </FormControl>
        <FormMessage>{{ errorMessage }}</FormMessage>
      </FormItem>
    </FormField>

    <div class="flex gap-3 justify-end">
      <Button
        type="button"
        color="gray"
        variant="ghost"
        @click="$emit('cancel')"
        :disabled="loading"
      >
        Отмена
      </Button>
      <Button
        type="submit"
        :loading="loading"
        :disabled="!isValid"
      >
        {{ editMode ? 'Обновить' : 'Создать' }}
      </Button>
    </div>
  </Form>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

// Схема валидации
const todoSchema = z.object({
  title: z.string()
    .min(1, 'Название обязательно')
    .max(255, 'Название слишком длинное'),
  description: z.string()
    .max(1000, 'Описание слишком длинное')
    .optional()
    .or(z.literal(''))
})

const props = defineProps<{
  editingTodo?: Todo
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: { title: string; description?: string }]
  cancel: []
}>()

const editMode = computed(() => !!props.editingTodo)

// Инициализация формы с валидацией
const { handleSubmit, errors, defineField, resetForm, meta } = useForm({
  validationSchema: toTypedSchema(todoSchema),
  initialValues: {
    title: props.editingTodo?.title || '',
    description: props.editingTodo?.description || ''
  }
})

const [title] = defineField('title')
const [description] = defineField('description')

const isValid = computed(() => meta.value.valid)

// Обновляем форму при изменении редактируемой задачи
watch(() => props.editingTodo, (todo) => {
  resetForm({
    values: {
      title: todo?.title || '',
      description: todo?.description || ''
    }
  })
})

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    title: values.title,
    description: values.description || undefined
  })

  if (!editMode.value) {
    resetForm()
  }
})
</script>