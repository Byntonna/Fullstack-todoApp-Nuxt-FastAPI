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
      <div class="flex items-center gap-2">
        <h3
          :class="{ 'line-through text-gray-500': todo.completed }"
          class="font-medium text-gray-900 dark:text-white truncate"
        >
          {{ todo.title }}
        </h3>

        <!-- Бейдж приоритета -->
        <span
          v-if="todo.priority"
          :class="['px-2 py-0.5 rounded-full text-xs font-semibold uppercase', priorityClasses[todo.priority]]"
        >
          {{ todo.priority }}
        </span>
      </div>

      <!-- Описание -->
      <p
        v-if="todo.description"
        :class="{ 'line-through text-gray-400': todo.completed }"
        class="text-sm text-gray-600 dark:text-gray-300 mt-1"
      >
        {{ todo.description }}
      </p>

      <!-- Срок выполнения -->
      <p
        v-if="todo.due_date"
        :class="['text-xs mt-1', isOverdue ? 'text-red-500' : 'text-gray-400']"
      >
        до {{ formatDate(todo.due_date, true) }}
      </p>

      <!-- Дата создания -->
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
import { ref, computed } from 'vue'
import { useTodosStore } from '~/stores/todos'
import { Checkbox } from '~/components/ui/checkbox'
import type { Todo } from '~/stores/todos'

/**
 * Расширяем тип Todo, чтобы не падало,
 * если store ещё не содержит новые поля
 */
interface TodoExtended extends Todo {
  priority?: 'P1' | 'P2' | 'P3'
  due_date?: string | null
}

const { todo } = defineProps<{ todo: TodoExtended }>()

defineEmits<{
  (e: 'edit', todo: TodoExtended): void
  (e: 'delete', id: number): void
}>()

const todosStore = useTodosStore()
const isToggling = ref(false)

const priorityClasses: Record<'P1' | 'P2' | 'P3', string> = {
  P1: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  P2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  P3: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

const isOverdue = computed(() => {
  if (!todo.due_date || todo.completed) return false
  const today = new Date()
  // Обнуляем время, чтобы сравнивать только даты
  today.setHours(0, 0, 0, 0)
  const due = new Date(todo.due_date)
  return due < today
})

async function toggleComplete() {
  if (isToggling.value) return
  try {
    isToggling.value = true
    await todosStore.toggleTodo(todo.id)
  } catch (e) {
    console.error('Не удалось переключить задачу', e)
  } finally {
    isToggling.value = false
  }
}

function formatDate(dateString: string, onlyDate = false) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    ...(onlyDate ? {} : { hour: '2-digit', minute: '2-digit' }),
  })
}
</script>
