<template>
  <div class="space-y-8">
    <!-- Заголовок + счётчики -->
    <section>
      <h1 class="text-3xl font-bold tracking-tight">{{ greeting }}</h1>
      <p class="text-sm text-muted-foreground mt-3">
        {{ t('todo.stats', { total: todosStore.totalTodos, completed: todosStore.completedTodos.length, remaining: todosStore.incompleteTodos.length }) }}
      </p>
      <Button class="mt-4" @click="openCreate">{{ t('todo.add') }}</Button>
    </section>

    <!-- Фильтры / сортировка -->
    <Card class="p-4">
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Поиск -->
        <Input v-model="query" :placeholder="t('todo.search')" class="w-64" />

        <!-- Приоритет -->
        <ToggleGroup v-model="priority" type="multiple">
          <ToggleGroupItem value="P1">P1</ToggleGroupItem>
          <ToggleGroupItem value="P2">P2</ToggleGroupItem>
          <ToggleGroupItem value="P3">P3</ToggleGroupItem>
        </ToggleGroup>

        <!-- Сортировка -->
        <Select v-model="sort">
          <SelectTrigger class="w-40">
            <SelectValue :placeholder="t('todo.sort')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due">{{ t('todo.sort_due') }}</SelectItem>
            <SelectItem value="created">{{ t('todo.sort_created') }}</SelectItem>
            <SelectItem value="priority">{{ t('todo.sort_priority') }}</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" @click="resetFilters">{{ t('todo.reset') }}</Button>
      </div>
    </Card>

    <Modal v-model="showForm">
      <TodoForm
        :editing-todo="editingTodo ? {
          title: editingTodo.title,
          description: editingTodo.description,
          priority: editingTodo.priority,
          due_date: editingTodo.due_date,
          category: editingTodo.category?.name || '',
          tags: editingTodo.tags?.map(t => t.name) || []
        } : null"
        :loading="formLoading"
        @submit="handleSubmit"
        @cancel="cancelEdit"
      />
    </Modal>

    <!-- Переключатель видов -->
    <Tabs default-value="list" v-model="view">
      <TabsList class="mb-4">
        <TabsTrigger value="list">{{ t('todo.view_list') }}</TabsTrigger>
        <TabsTrigger value="calendar">{{ t('todo.view_calendar') }}</TabsTrigger>
      </TabsList>
    </Tabs>

    <div class="min-h-[200px] transition-all duration-300 ease-in-out">
      <!-- Список задач -->
      <AnimatePresence mode="wait">
        <motion.div
          v-if="view === 'list'"
          key="list"
          :initial="{ opacity: 0, x: -20 }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: 20 }"
        >
          <ScrollArea class="relative">
            <div
              class="absolute inset-y-0 -left-20 w-20 pointer-events-none z-100 bg-gradient-to-r from-background to-transparent"
            ></div>
            <div
              class="absolute inset-y-0 -right-20 w-20 pointer-events-none z-100 bg-gradient-to-l from-background to-transparent"
            ></div>

            <div
              ref="contentContainer"
              class="transition-all duration-300 ease-in-out overflow-hidden"
              :style="{ height: contentHeight }"
            >
              <motion.div
                layout
                class="space-y-4"
                :transition="{ layout: { duration: 0.3 } }"
              >
                <template v-if="todosStore.loading">
                  <Skeleton v-for="i in 3" :key="i" class="h-20 w-full" />
                </template>
                <p
                  v-else-if="todosStore.todos.length === 0"
                  class="text-center text-muted-foreground py-12"
                >
                  {{ t('todo.no_tasks') }}
                </p>
                <p
                  v-else-if="filteredTodos.length === 0"
                  class="text-center text-muted-foreground py-12"
                >
                  {{ t('todo.no_results') }}
                </p>
                <LayoutGroup v-else>
                  <motion.ul
                    key="list"
                    layout
                    :style="{ position: 'relative' }"
                    class="space-y-4"
                    :initial="{ opacity: 0, x: -20 }"
                    :animate="{ opacity: 1, x: 0 }"
                    :exit="{ opacity: 0, x: -20 }"
                    :transition="{ duration: 0.3 }"
                  >
                    <AnimatePresence>
                      <motion.li
                        v-for="(todo, i) in filteredTodos"
                        :key="todo.id"
                        layout
                        :initial="{ opacity: 0, x: -20 }"
                        :animate="{ opacity: 1, x: 0 }"
                        :exit="{ opacity: 0, x: -20 }"
                        :transition="{ duration: 0.3, delay: i * 0.1 }"
                      >
                        <TodoItem
                          :todo="todo"
                          @edit="startEdit"
                          @delete="deleteTodo"
                        />
                      </motion.li>
                    </AnimatePresence>
                  </motion.ul>
                </LayoutGroup>
              </motion.div>
            </div>
          </ScrollArea>
        </motion.div>

        <!-- Календарь -->
        <motion.div
          v-if="view === 'calendar'"
          key="calendar"
          :initial="{ opacity: 0, x: -20 }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: 20 }"
          :transition="{ duration: 0.3 }"
        >
          <div class="flex flex-col gap-4 md:flex-row">
            <Calendar
              v-model="selectedDate"
              :events="calendarEvents"
              editable
              droppable
              @event-drop="onDateChange"
            />
            <ScrollArea class="md:w-full md:h-auto h-64 space-y-4">
              <p
                v-if="selectedTodos.length === 0"
                class="text-center text-muted-foreground py-12"
              >
                {{ t('todo.no_tasks_date') }}
              </p>
              <TodoItem
                v-for="todo in selectedTodos"
                :key="todo.id"
                :todo="todo"
                @edit="startEdit"
                @delete="deleteTodo"
              />
            </ScrollArea>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>

    <!-- Экспорт -->
    <div class="flex gap-2">
      <Button variant="outline" @click="exportCsv">
        <Icon name="radix-icons:download" class="mr-2 h-4 w-4" style="color: currentColor"/>
        {{ t('todo.export_csv') }}
      </Button>
      <Button variant="outline" @click="exportAnki">
        <Icon name="radix-icons:star" class="mr-2 h-4 w-4 rotate-[-15deg]" style="color: currentColor"/>
        {{ t('todo.export_anki') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Tabs } from "~/components/ui/tabs"
import { toast } from 'vue-sonner'
import { ScrollArea } from "~/components/ui/scroll-area"
import { SelectTrigger, SelectItem, SelectValue, SelectContent, Select } from "~/components/ui/select"
import { useI18n } from '#imports'
import { useTodosStore } from '~/stores/todos'
import type { Todo } from '~/stores/todos'
import Modal from '@/components/Modal.vue'
import { AnimatePresence, motion, LayoutGroup } from 'motion-v'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()

const todosStore = useTodosStore()

/**
 * локальные состояния
 */
const query     = ref('')
const priority  = ref<string[]>([])
const sort      = ref<'due' | 'created' | 'priority'>('due')
const view      = ref<'list' | 'calendar'>('list')
const editingTodo = ref<Todo | null>(null);
const formLoading = ref(false)
const showForm = ref(false)
const selectedDate = ref<Date | null>(null)

const contentContainer = ref<HTMLElement>()
const contentHeight = ref('auto')

/**
 * вычисления
 */
const filteredTodos = computed(() =>
  todosStore.filterAndSort({ query: query.value, priority: priority.value, sort: sort.value })
)
const calendarEvents = computed(() =>
  filteredTodos.value.map(t => ({
    id: t.id,
    title: t.title,
    start: t.due_date,
    allDay: true
  }))
)
const selectedTodos = computed(() =>
  filteredTodos.value.filter(t => {
    if (!selectedDate.value || !t.due_date) return false
    return new Date(t.due_date).toDateString() === new Date(selectedDate.value).toDateString()
  })
)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 5) return t('greeting.night')
  if (hour < 12) return t('greeting.morning')
  if (hour < 18) return t('greeting.day')
  return t('greeting.evening')
})

async function updateContentHeight() {
  await nextTick()
  if (contentContainer.value) {
    const originalHeight = contentContainer.value.style.height
    contentContainer.value.style.height = 'auto'
    const newHeight = contentContainer.value.scrollHeight
    contentContainer.value.style.height = originalHeight

    contentHeight.value = `${newHeight}px`
  }
}

watch([filteredTodos, () => todosStore.loading], () => {
  updateContentHeight()
}, { immediate: true })

onMounted(() => {
  todosStore.fetchTodos()
})

/**
 * методы
 */
function resetFilters() {
  query.value = ''
  priority.value = []
  sort.value = 'due'
}

function openCreate() {
  editingTodo.value = null
  showForm.value = true
}

function startEdit(todo: Todo) {
  editingTodo.value = todo
  showForm.value = true
}

async function handleSubmit(data: { title: string; description?: string; priority: 'P1' | 'P2' | 'P3'; due_date?: string | null; category?: string; tags: string[] }) {
  formLoading.value = true
  try {
    const result = editingTodo.value
      ? await todosStore.updateTodo(editingTodo.value.id, data)
      : await todosStore.createTodo(data.title, data.description, data.priority, data.due_date, data.category, data.tags)
    if (result.success) {
      editingTodo.value = null
      showForm.value = false
    }
  } finally {
    formLoading.value = false
  }
}

function cancelEdit() {
  editingTodo.value = null
  showForm.value = false
}

async function deleteTodo(id: number) {
  const result = await todosStore.deleteTodo(id)
  if (result.success && result.todo) {
    toast(t('todo.deleted'), {
      action: {
        label: t('todo.undo'),
        async onClick() {
          const t = result.todo
          await todosStore.createTodo(
            t.title,
            t.description,
            t.priority ?? 'P3',
            t.due_date ?? null,
            t.category?.name,
            t.tags?.map(tag => tag.name) ?? [],
          )
        }
      }
    })
  }
}

function onDateChange(info: any) {
  todosStore.updateTodo(info.event.id, { due_date: info.event.startStr })
}

function exportCsv() {
  todosStore.exportCsv(filteredTodos.value)
  toast(t('todo.export'))
}

function exportAnki() {
  todosStore.exportAnki(filteredTodos.value)
  toast(t('todo.export'))
}
</script>