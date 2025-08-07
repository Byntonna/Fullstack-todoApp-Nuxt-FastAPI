<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ submit: [data: { name: string; color: string }]; cancel: [] }>()
const props = defineProps<{ loading?: boolean }>()
const isValid = computed(() => meta.value.valid)

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Название обязательно'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Неверный цвет'),
  })
)

const { handleSubmit, meta, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    color: '#000000',
  },
})

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
  resetForm()
})
</script>

<template>
  <Form @submit="onSubmit" class="space-y-4">
    <FormField name="name" v-slot="{ field, errorMessage }">
      <FormItem>
        <FormLabel>Название</FormLabel>
        <FormControl>
          <Input v-bind="field" :disabled="props.loading" placeholder="Например, Работа" />
        </FormControl>
        <FormMessage>{{ errorMessage }}</FormMessage>
      </FormItem>
    </FormField>

    <FormField name="color" v-slot="{ field, errorMessage }">
      <FormItem>
        <FormLabel>Цвет</FormLabel>
        <FormControl>
          <Input type="color" v-bind="field" :disabled="props.loading" class="h-10 w-16 p-1" />
        </FormControl>
        <FormMessage>{{ errorMessage }}</FormMessage>
      </FormItem>
    </FormField>

    <div class="flex justify-end gap-3">
      <Button type="button" variant="ghost" @click="$emit('cancel')" :disabled="props.loading">Отмена</Button>
      <Button type="submit" :disabled="!isValid || props.loading" :loading="props.loading">Создать</Button>
    </div>
  </Form>
</template>