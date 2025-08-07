<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const emit = defineEmits<{ submit: [data: { name: string; color: string }]; cancel: [] }>()
const props = defineProps<{ loading?: boolean }>()

const formData = ref({
  name: '',
  color: '#000000'
})

const errors = ref({
  name: '',
  color: ''
})

const validateName = (value: string) => {
  if (!value.trim()) {
    return 'Название обязательно'
  }
  return ''
}

const validateColor = (value: string) => {
  const colorRegex = /^#[0-9A-Fa-f]{6}$/
  if (!colorRegex.test(value)) {
    return 'Неверный цвет'
  }
  return ''
}

const isValid = computed(() => {
  const nameError = validateName(formData.value.name)
  const colorError = validateColor(formData.value.color)
  return !nameError && !colorError
})

const updateErrors = () => {
  errors.value.name = validateName(formData.value.name)
  errors.value.color = validateColor(formData.value.color)
}

const onSubmit = (e: Event) => {
  e.preventDefault()
  updateErrors()

  if (isValid.value) {
    emit('submit', {
      name: formData.value.name.trim(),
      color: formData.value.color
    })
    formData.value = {
      name: '',
      color: '#000000'
    }
    errors.value = {
      name: '',
      color: ''
    }
  }
}

const onCancel = () => {
  emit('cancel')
}

const onNameInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  formData.value.name = target.value
  errors.value.name = validateName(target.value)
}

const onColorInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  formData.value.color = target.value
  errors.value.color = validateColor(target.value)
}
</script>

<template>
  <form @submit="onSubmit" class="space-y-4">
    <div class="space-y-2">
      <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Название
      </label>
      <Input
        :value="formData.name"
        @input="onNameInput"
        :disabled="props.loading"
        placeholder="Например, Работа"
        class="w-full"
      />
      <div v-if="errors.name" class="text-sm font-medium text-red-500">
        {{ errors.name }}
      </div>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Цвет
      </label>
      <Input
        type="color"
        v-model="formData.color"
        :disabled="props.loading"
        class="h-10 w-16 p-1"
      />
      <div v-if="errors.color" class="text-sm font-medium text-red-500">
        {{ errors.color }}
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <Button
        type="button"
        variant="ghost"
        @click="onCancel"
        :disabled="props.loading"
      >
        Отмена
      </Button>
      <Button
        type="submit"
        :disabled="!isValid || props.loading"
      >
        <span v-if="props.loading">Создание...</span>
        <span v-else>Создать</span>
      </Button>
    </div>
  </form>
</template>