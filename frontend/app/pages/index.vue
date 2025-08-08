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

          <!-- Category -->
          <div class="flex items-center gap-2">
            <CategoryFilter v-model="selectedCategoryId" :categories="categoriesStore.categories" />
            <Button
              v-if="selectedCategoryId !== null"
              variant="outline"
              size="icon"
              @click="openDeleteModal"
            >
              <Icon name="icons:minus" class="h-4 w-4" style="color: currentColor"/>
            </Button>
            <Button variant="outline" size="icon" @click="showCategoryForm = true">
              <Icon name="icons:plus" class="h-4 w-4" style="color: currentColor"/>
            </Button>
          </div>

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
          category_id: editingTodo.category?.id ?? null,
          tags: editingTodo.tags?.map(t => t.name) || []
        } : null"
        :loading="formLoading"
        :categories="categoriesStore.categories"
        @submit="handleSubmit"
        @cancel="cancelEdit"
        @add-category="showCategoryForm = true"
      />
    </Modal>

    <Modal v-model="showCategoryForm">
      <CategoryForm
        :loading="categoryLoading"
        @submit="handleCategorySubmit"
        @cancel="showCategoryForm = false"
      />
    </Modal>

    <Modal v-model="showDeleteModal">
      <div class="p-4 space-y-4">
        <h3 class="text-lg font-semibold">
          {{ t('category.delete_title') }}
        </h3>

        <p class="text-sm text-muted-foreground">
          {{
            t('category.delete_text', { name: categoryNameToDelete })
            || ('This will remove “' + categoryNameToDelete + '”. Tasks will be uncategorized.')
          }}
        </p>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showDeleteModal = false">
            {{ t('common.cancel') }}
          </Button>
          <Button
            variant="destructive"
            :disabled="categoryDeleting"
            @click="confirmDelete"
          >
            {{ categoryDeleting ? (t('common.deleting') || 'Deleting...') : (t('common.delete') || 'Delete') }}
          </Button>
        </div>
      </div>
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
            <div v-else class="space-y-6">
              <TransitionGroup name="list-group" tag="div" class="space-y-6">
                <div
                    class="space-y-2"
                    v-for="(todos, key) in groupedTodos"
                    :key="key"
                >
                  <h3 class="font-medium flex items-center justify-between">
                    <span class="flex items-center gap-2">
                      <span
                        v-if="key !== 'none'"
                        class="w-3 h-3 rounded-full"
                        :style="{ backgroundColor: categoriesStore.categories.find(c => c.id === Number(key))?.color || '#ccc' }"
                      ></span>
                      {{ key !== 'none' ? categoriesStore.categories.find(c => c.id === Number(key))?.name : t('todoform.category_none') }}
                      <span class="text-sm text-muted-foreground">{{ todos.length }}</span>
                    </span>
                    <button
                      class="transition-transform duration-300"
                      :class="{ 'rotate-180': collapsedCategories.has(key) }"
                      @click="toggleCategory(key)"
                    >
                      <Icon name="icons:down" class="cursor-pointer opacity-80" size="20" style="color: currentColor"/>
                    </button>
                  </h3>
                  <div v-if="!collapsedCategories.has(key)">
                    <TransitionGroup
                      name="list-item"
                      tag="div"
                      class="space-y-4"
                      :key="key"
                    >
                      <div
                        v-for="(todo, index) in todos"
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
import { useI18n, useHead } from '#imports'
import { useTodosStore } from '~/stores/todos'
import type { Todo } from '~/stores/todos'
import { useCategoriesStore } from '~/stores/categories'
import Modal from '@/components/Modal.vue'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const todosStore = useTodosStore()
const categoriesStore = useCategoriesStore()

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
const selectedCategoryId = ref<number | null>(null)
const showCategoryForm = ref(false)
const categoryLoading = ref(false)
const collapsedCategories = ref<Set<string>>(new Set())
const showDeleteModal = ref(false)
const categoryToDeleteId = ref<number | null>(null)
const categoryDeleting = ref(false)

const categoryNameToDelete = computed(() => {
  const id = categoryToDeleteId.value ?? selectedCategoryId.value
  return categoriesStore.categories.find(c => c.id === id)?.name || ''
})

const contentContainer = ref<HTMLElement>()
const contentHeight = ref('200px')

/**
 * compute
 */
const filteredTodos = computed(() => {
  const base = todosStore.filterAndSort({ query: query.value, priority: priority.value, sort: sort.value })
  return selectedCategoryId.value
    ? base.filter(t => t.category?.id === selectedCategoryId.value)
    : base
})

const groupedTodos = computed(() => {
  const groups: Record<string, Todo[]> = {}
  for (const todo of filteredTodos.value) {
    const key = todo.category ? String(todo.category.id) : 'none'
    if (!groups[key]) groups[key] = []
    groups[key].push(todo)
  }
  return groups
})

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

useHead(() => ({
  title: greeting.value,
}))

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

function openDeleteModal() {
  if (selectedCategoryId.value === null) return
  categoryToDeleteId.value = selectedCategoryId.value
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (categoryToDeleteId.value === null) return
  categoryDeleting.value = true
  const id = categoryToDeleteId.value
  const res = await categoriesStore.deleteCategory(id)
  categoryDeleting.value = false

  if (res.success) {
    collapsedCategories.value.delete(String(id))
    if (selectedCategoryId.value === id) selectedCategoryId.value = null
    await todosStore.fetchTodos()
    toast(t('category.deleted'))
    showDeleteModal.value = false
  } else if (res.error) {
    toast(res.error)
  }
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
  await Promise.all([todosStore.fetchTodos(), categoriesStore.fetchCategories()])
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

async function handleSubmit(data: { title: string; description?: string; priority: 'P1' | 'P2' | 'P3'; due_date?: string | null; category_id?: number; tags: string[] }) {
  formLoading.value = true
  try {
    const result = editingTodo.value
      ? await todosStore.updateTodo(editingTodo.value.id, {
          title: data.title,
          description: data.description,
          priority: data.priority,
          due_date: data.due_date,
          category_id: data.category_id ?? null,
          tags: data.tags,
        })
      : await todosStore.createTodo(
          data.title,
          data.description,
          data.priority,
          data.due_date,
          data.category_id,
          data.tags,
        )
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

async function handleCategorySubmit(data: { name: string; color: string }) {
  categoryLoading.value = true
  const res = await categoriesStore.createCategory(data.name, data.color)
  categoryLoading.value = false
  if (res.success) {
    showCategoryForm.value = false
  } else if (res.error) {
    toast(res.error)
  }
}

function toggleCategory(key: string) {
  if (collapsedCategories.value.has(key)) {
    collapsedCategories.value.delete(key)
  } else {
    collapsedCategories.value.add(key)
  }
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
            t.category?.id,
            t.tags?.map(tag => tag.name) ?? [],
          )
        }
      }
    })
  }
}

function onDateChange(info: { event: { id: number; startStr: string } }) {
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

.list-group-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.list-group-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-group-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.list-group-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-group-move {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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