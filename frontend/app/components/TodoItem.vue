<template>
  <div class="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
    <!-- Чекбокс для отметки выполнения -->
    <Checkbox
        class="flex-shrink-0"
        :model-value="todo.completed"
        :class="{ 'cursor-progress': isToggling, 'cursor-pointer': !isToggling }"
        @update:model-value="toggleComplete"
    />

    <!-- Содержимое задачи -->
    <div class="flex-1 min-w-0">
      <h3
        :class="{ 'line-through text-gray-500': todo.completed }"
        class="font-medium text-gray-900 dark:text-white truncate"
      >
        {{ todo.title }}
      </h3>
      <p
        v-if="todo.description"
        :class="{ 'line-through text-gray-400': todo.completed }"
        class="text-sm text-gray-600 dark:text-gray-300 mt-1"
      >
        {{ todo.description }}
      </p>
      <p class="text-xs text-gray-400 mt-2">
        {{ formatDate(todo.created_at) }}
      </p>
    </div>

    <!-- Действия -->
    <div class="flex gap-2 flex-shrink-0">
      <Button
        size="sm"
        color="gray"
        variant="ghost"
        @click="$emit('edit', todo)"
      >
        <Icon name="solar:pen-new-square-outline" size="20" style="color: dimgray"/>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        @click="$emit('delete', todo.id)"
      >
        <Icon name="solar:trash-bin-minimalistic-2-outline" size="20" style="color: red" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTodosStore } from '~/stores/todos'
import { Checkbox } from '~/components/ui/checkbox'

interface Todo {
  id: number
  title: string
  description?: string
  completed: boolean
  user_id: number
  created_at: string
  updated_at?: string
}

const { todo } = defineProps<{ todo: Todo }>()

defineEmits<{
  (e: 'edit', todo: Todo): void
  (e: 'delete', id: number): void
}>()

const todosStore = useTodosStore()
const isToggling = ref(false)

async function toggleComplete() {
  if (isToggling.value) return // Предотвращаем множественные клики

  try {
    isToggling.value = true
    await todosStore.toggleTodo(todo.id)
  } catch (e) {
    console.error('Не удалось переключить задачу', e)
  } finally {
    isToggling.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
