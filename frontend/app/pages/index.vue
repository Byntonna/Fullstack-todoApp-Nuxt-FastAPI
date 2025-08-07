<template>
  <div class="space-y-8">
    <!-- Title + counters -->
    <section>
      <h1 class="text-3xl font-bold tracking-tight">{{ greeting }}</h1>
      <p class="text-sm text-muted-foreground mt-3">
        {{ t('todo.stats', { total: todosStore.totalTodos, completed: todosStore.completedTodos.length, remaining: todosStore.incompleteTodos.length }) }}
      </p>
      <Button class="mt-4" @click="openCreate">{{ t('todo.add') }}</Button>
    </section>

    <!-- Filters / sort + export buttons -->
    <Card class="p-4">
      <div class="flex flex-wrap gap-4 items-end justify-between">
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Search -->
          <Input v-model="query" :placeholder="t('todo.search')" class="w-64" />

          <!-- Priority -->
          <ToggleGroup v-model="priority" type="multiple">
            <ToggleGroupItem value="P1">P1</ToggleGroupItem>
            <ToggleGroupItem value="P2">P2</ToggleGroupItem>
            <ToggleGroupItem value="P3">P3</ToggleGroupItem>
          </ToggleGroup>

          <!-- Sort -->
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

        <!-- Export buttons -->
        <div class="flex gap-2">
          <Button variant="outline" @click="exportCsv">
            <Icon name="icons:save" class="mr-2 h-4 w-4" style="color: currentColor"/>
            {{ t('todo.export_csv') }}
          </Button>
          <Button variant="outline" @click="exportAnki">
            <Icon name="icons:anki" class="mr-2 h-4 w-4 rotate-[-15deg]" style="color: currentColor"/>
            {{ t('todo.export_anki') }}
          </Button>
        </div>
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

    <div class="relative">
      <Tabs v-model="view" class="relative">
        <TabsList class="mb-6 relative grid w-80 grid-cols-2 mx-auto bg-muted p-1 rounded-lg">
          <TabsTrigger
            value="list"
            class="relative z-10 transition-all duration-300 rounded-md"
            :class="{ 'bg-background text-foreground shadow-sm': view === 'list' }"
          >
            {{ t('todo.view_list') }}
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            class="relative z-10 transition-all duration-300 rounded-md"
            :class="{ 'bg-background text-foreground shadow-sm': view === 'calendar' }"
          >
            {{ t('todo.view_calendar') }}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <div class="relative min-h-[400px]">
      <!-- Animated transition for List view -->
      <Transition
        name="view-transition"
        mode="out-in"
        @enter="onListEnter"
        @leave="onListLeave"
        @after-enter="onListAfterEnter"
      >
        <div
          v-if="view === 'list'"
          key="list-view"
          class="absolute inset-0 w-full"
        >
          <div class="space-y-4 h-full">
            <template v-if="todosStore.loading">
              <div
                v-for="i in 3"
                :key="`skeleton-${i}`"
                class="animate-pulse transition-opacity duration-300"
                :style="{ animationDelay: `${i * 100}ms` }"
              >
                <Skeleton class="h-20 w-full" />
              </div>
            </template>
            <p
              v-else-if="todosStore.todos.length === 0"
              class="text-center text-muted-foreground py-12 animate-fade-in"
            >
              {{ t('todo.no_tasks') }}
            </p>
            <p
              v-else-if="filteredTodos.length === 0"
              class="text-center text-muted-foreground py-12 animate-fade-in"
            >
              {{ t('todo.no_results') }}
            </p>
            <div v-else class="space-y-4">
              <TransitionGroup
                name="list-item"
                tag="div"
                class="space-y-4"
                :key="listAnimationKey"
              >
                <div
                  v-for="(todo, index) in filteredTodos"
                  :key="todo.id"
                  class="list-todo-item"
                  :style="{ '--index': index }"
                >
                  <TodoItem
                    :todo="todo"
                    @edit="startEdit"
                    @delete="deleteTodo"
                  />
                </div>
              </TransitionGroup>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Animated transition for the Calendar view -->
      <Transition
        name="view-transition"
        mode="out-in"
        @enter="onCalendarEnter"
        @leave="onCalendarLeave"
        @after-enter="onCalendarAfterEnter"
      >
        <div
          v-if="view === 'calendar'"
          key="calendar-view"
          class="absolute inset-0 w-full"
        >
          <div class="flex flex-col gap-4 md:flex-row h-full animate-slide-up">
            <div class="flex-shrink-0 animate-fade-in-left">
              <Calendar
                v-model="selectedDate"
                :events="calendarEvents"
                editable
                droppable
                @event-drop="onDateChange"
              />
            </div>
            <div class="md:flex-1 animate-fade-in-right">
              <ScrollArea class="h-64 md:h-full">
                <div class="space-y-4">
                  <p
                    v-if="selectedTodos.length === 0"
                    class="text-center text-muted-foreground py-12 animate-fade-in"
                  >
                    {{ t('todo.no_tasks_date') }}
                  </p>
                  <TransitionGroup
                    name="calendar-item"
                    tag="div"
                    class="space-y-4"
                  >
                    <div
                      v-for="(todo, index) in selectedTodos"
                      :key="todo.id"
                      class="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                      :style="{ transitionDelay: `${index * 100}ms` }"
                    >
                      <TodoItem
                        :todo="todo"
                        @edit="startEdit"
                        @delete="deleteTodo"
                      />
                    </div>
                  </TransitionGroup>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { toast } from 'vue-sonner'
import { ScrollArea } from "~/components/ui/scroll-area"
import { SelectTrigger, SelectItem, SelectValue, SelectContent, Select } from "~/components/ui/select"
import { useI18n } from '#imports'
import { useTodosStore } from '~/stores/todos'
import type { Todo } from '~/stores/todos'
import Modal from '@/components/Modal.vue'
import { debounce } from 'lodash-es'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const todosStore = useTodosStore()

/**
 * local states
 */
const query = ref('')
const priority = ref<string[]>([])
const sort = ref<'due' | 'created' | 'priority'>('due')
const view = ref<'list' | 'calendar'>('list')
const editingTodo = ref<Todo | null>(null)
const formLoading = ref(false)
const showForm = ref(false)
const selectedDate = ref<Date | null>(null)

const contentContainer = ref<HTMLElement>()
const contentHeight = ref('200px')
const listAnimationKey = ref(0)

/**
 * compute
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
    const scrollHeight = contentContainer.value.scrollHeight
    contentHeight.value = Math.max(200, scrollHeight) + 'px'
  }
}

function onListEnter(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.opacity = '0';
  htmlEl.style.transform = 'translateX(-30px)'; // Список появляется слева
  htmlEl.style.position = 'absolute';
  htmlEl.style.width = '100%';
  htmlEl.style.zIndex = '1';

  nextTick(() => {
    htmlEl.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    htmlEl.style.opacity = '1';
    htmlEl.style.transform = 'translateX(0)';
  });
}

function onListLeave(el: Element) {
  const htmlEl = el as HTMLElement;
  // If the list leaves, it shifts to the left
  htmlEl.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  htmlEl.style.position = 'absolute';
  htmlEl.style.width = '100%';
  htmlEl.style.zIndex = '0';
  htmlEl.style.opacity = '0';
  htmlEl.style.transform = 'translateX(-30px)';
}

function onListAfterEnter() {
}

// Transition animations for the Calendar view
function onCalendarEnter(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.opacity = '0';
  htmlEl.style.transform = 'translateX(30px)'; // The calendar appears on the right
  htmlEl.style.position = 'absolute';
  htmlEl.style.width = '100%';
  htmlEl.style.zIndex = '1';

  nextTick(() => {
    htmlEl.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    htmlEl.style.opacity = '1';
    htmlEl.style.transform = 'translateX(0)';
  });
}

function onCalendarLeave(el: Element) {
  const htmlEl = el as HTMLElement;
  // If the calendar moves away, it moves to the right
  htmlEl.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  htmlEl.style.position = 'absolute';
  htmlEl.style.width = '100%';
  htmlEl.style.zIndex = '0';
  htmlEl.style.opacity = '0';
  htmlEl.style.transform = 'translateX(30px)';
}

function onCalendarAfterEnter() {
  // No need to update listAnimationKey here
}
// Track changes to update the list
watch(filteredTodos, () => {
  updateContentHeight()
}, { immediate: true, deep: true })

// Loading tracking
watch(() => todosStore.loading, () => {
  updateContentHeight()
})

// Init
onMounted(async () => {
  await todosStore.fetchTodos()
  updateContentHeight()
})

/**
 * methods
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

<style scoped>

/* Анимации для элементов списка */
.list-item-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transition-delay: calc(var(--index, 0) * 0.05s);
}

.list-item-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-item-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.list-item-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.list-item-move {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.list-todo-item {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Анимации для элементов календаря */
.calendar-item-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.calendar-item-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.calendar-item-enter-from {
  opacity: 0;
  transform: translateX(10px) scale(0.95);
}

.calendar-item-leave-to {
  opacity: 0;
  transform: translateX(-10px) scale(0.95);
}

.calendar-item-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Базовые анимации */
.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-fade-in-left {
  animation: fadeInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-fade-in-right {
  animation: fadeInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
}

.animate-slide-up {
  animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Адаптивность для кнопок экспорта */
@media (max-width: 768px) {
  .flex.flex-wrap.gap-4.items-end.justify-between {
    flex-direction: column;
    align-items: stretch;
  }

  .flex.gap-2 {
    justify-content: center;
    margin-top: 1rem;
  }
}
</style>