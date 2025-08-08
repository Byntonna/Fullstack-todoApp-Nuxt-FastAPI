<template>
  <div
    class="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
  >
    <!-- Checkbox for completion -->
    <Checkbox
      class="flex-shrink-0 dark:border-neutral-200"
      :model-value="todo.completed"
      :class="{ 'cursor-progress': isToggling, 'cursor-pointer': !isToggling }"
      @update:model-value="toggleComplete"
    />

    <!-- Task content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <h3
          :class="{ 'line-through text-neutral-500 dark:text-neutral-400': todo.completed }"
          class="font-medium text-neutral-900 dark:text-white truncate"
        >
          {{ todo.title }}
        </h3>

        <!-- Priority badge -->
        <div v-if="todo.priority" class="flex items-center">
          <template v-if="todo.priority === 'P3'">
            <div class="flex items-center bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full px-2">
              <Icon name="tabler:exclamation-mark" size="20" style="color: currentColor" />
            </div>
          </template>
          <template v-else-if="todo.priority === 'P2'">
            <div class="flex items-center -space-x-4 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full px-2">
              <Icon name="tabler:exclamation-mark" size="20" style="color: currentColor" />
              <Icon name="tabler:exclamation-mark" size="20" style="color: currentColor" />
            </div>
          </template>
          <template v-else>
            <div class="flex items-center -space-x-4 bg-red-100 dark:bg-red-900/40 dark:text-red-300 rounded-full px-2">
              <Icon name="tabler:exclamation-mark" size="20" style="color: currentColor" />
              <Icon name="tabler:exclamation-mark" size="20" style="color: currentColor" />
              <Icon name="tabler:exclamation-mark" size="20" style="color: currentColor" />
            </div>
          </template>
        </div>
      </div>

      <!-- Description -->
      <p
        v-if="todo.description"
        :class="{ 'line-through text-neutral-400 dark:text-neutral-500': todo.completed }"
        class="text-sm text-neutral-600 dark:text-neutral-300 mt-1"
      >
        {{ todo.description }}
      </p>

      <!-- Category -->
      <p v-if="todo.category" class="text-xs mt-1 flex items-center gap-1">
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: todo.category.color }"/>
        {{ todo.category.name }}
      </p>

      <!-- Tags -->
      <div v-if="todo.tags && todo.tags.length" class="flex flex-wrap gap-1 mt-1">
        <span
          v-for="tag in todo.tags"
          :key="tag.id"
          class="text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded px-1"
        >
          #{{ tag.name }}
        </span>
      </div>

      <!-- Due date and overdue status -->
      <p
        v-if="todo.due_date"
        :class="['text-xs mt-1', isOverdue ? 'text-red-500 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500']"
      >
        {{ t('todo.expires_until') }} {{ formatDate(todo.due_date, true) }}
        <span v-if="isOverdue" class="text-destructive ml-2">({{ t('todo.overdue') }})</span>
      </p>

      <!-- Created at -->
      <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
        {{ formatDate(todo.created_at) }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 flex-shrink-0">
      <Button size="sm" variant="outline" @click="$emit('edit', todo)">
        <Icon name="icons:todo-edit" size="20" style="color: currentColor" />
      </Button>
      <Button size="sm" variant="destructive" @click="$emit('delete', todo.id)">
        <Icon name="icons:todo-delete" size="20" style="color: currentColor" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import { ref, computed } from 'vue'
import { useTodosStore } from '~/stores/todos'
import { Checkbox } from '~/components/ui/checkbox'
import type { Todo } from '~/stores/todos'
import { useI18n } from '#imports'

interface TodoExtended extends Todo {
  priority?: 'P1' | 'P2' | 'P3'
  due_date?: string | null
}

const props = withDefaults(defineProps<{
  todo: TodoExtended
  delay?: number
}>(), { delay: 0 })
const { todo, delay } = toRefs(props)

const todosStore = useTodosStore()
const isToggling = ref(false)
const { locale, t } = useI18n()

const isOverdue = computed(() => {
  if (!todo.due_date || todo.completed) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(todo.due_date)
  return due < today
})

async function toggleComplete() {
  if (isToggling.value) return
  try {
    isToggling.value = true
    await todosStore.toggleTodo(todo.value.id)
  } catch (e) {
    console.error('Не удалось переключить задачу', e)
  } finally {
    isToggling.value = false
  }
}

function formatDate(dateString: string, onlyDate = false) {
  const loc = locale.value === 'ru' ? 'ru-RU' : 'en-US'
  return new Date(dateString).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'short',
    ...(onlyDate ? {} : {hour: '2-digit', minute: '2-digit'}),
  })
}
</script>