<template>
  <div class="space-y-8">
    <!-- Заголовок + счётчики -->
    <section>
      <h1 class="text-3xl font-bold tracking-tight">{{ greeting }}</h1>
      <p class="text-sm text-muted-foreground mt-3">
        Всего — {{ todosStore.totalTodos }},
        выполнено — {{ todosStore.completedTodos.length }},
        осталось — {{ todosStore.incompleteTodos.length }}
      </p>
      <Button class="mt-4" @click="openCreate">Добавить задачу</Button>
    </section>

    <!-- Фильтры / сортировка -->
    <Card class="p-4">
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Поиск -->
        <Input v-model="query" placeholder="Поиск…" class="w-64" />

        <!-- Приоритет -->
        <ToggleGroup v-model="priority" type="multiple">
          <ToggleGroupItem value="P1">P1</ToggleGroupItem>
          <ToggleGroupItem value="P2">P2</ToggleGroupItem>
          <ToggleGroupItem value="P3">P3</ToggleGroupItem>
        </ToggleGroup>

        <!-- Сортировка -->
        <Select v-model="sort">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due">По сроку</SelectItem>
            <SelectItem value="created">По дате создания</SelectItem>
            <SelectItem value="priority">По приоритету</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" @click="resetFilters">Сброс</Button>
      </div>
    </Card>

    <Modal v-model="showForm">
      <TodoForm
        :editing-todo="editingTodo"
        :loading="formLoading"
        @submit="handleSubmit"
        @cancel="cancelEdit"
      />
    </Modal>

    <!-- Переключатель видов -->
    <Tabs default-value="list" v-model="view">
      <TabsList class="mb-4">
        <TabsTrigger value="list">Список</TabsTrigger>
        <TabsTrigger value="calendar">Календарь</TabsTrigger>
      </TabsList>

      <!-- Список задач -->
      <TabsContent value="list">
        <ScrollArea class="space-y-4">
          <Skeleton v-if="todosStore.loading" v-for="i in 3" :key="i" class="h-20 w-full" />

          <p v-else-if="todosStore.todos.length === 0"
             class="text-center text-muted-foreground py-12">
            У вас пока нет задач. Создайте первую!
          </p>

          <TransitionGroup v-else name="todo" tag="div" class="space-y-4">
            <TodoItem
              v-for="todo in filteredTodos"
              :key="todo.id"
              :todo="todo"
              @edit="startEdit"
              @delete="deleteTodo"
            />
          </TransitionGroup>
        </ScrollArea>
      </TabsContent>

      <!-- Календарь -->
      <TabsContent value="calendar">
        <div class="flex flex-col gap-4 md:flex-row">
          <Calendar
            v-model="selectedDate"
            :events="calendarEvents"
            editable
            droppable
            @event-drop="onDateChange"
          />
          <ScrollArea class="md:w-full md:h-auto h-64 space-y-4">
            <p v-if="selectedTodos.length === 0" class="text-center text-muted-foreground py-12">
              Задач на выбранную дату нет
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
      </TabsContent>
    </Tabs>

    <!-- Экспорт -->
    <Button variant="outline" @click="exportCsv">
      <Icon name="lucide:file-down" class="mr-2 h-4 w-4" />
      Экспорт CSV
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Tabs } from "~/components/ui/tabs"
import { toast } from 'vue-sonner'
import { ScrollArea } from "~/components/ui/scroll-area"
import { SelectTrigger, SelectItem, SelectValue, SelectContent, Select } from "~/components/ui/select"
import { useTodosStore } from '~/stores/todos'
import type { Todo } from '~/stores/todos'
import Modal from '@/components/Modal.vue'

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
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
})

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

async function handleSubmit(data: { title: string; description?: string; priority: 'P1' | 'P2' | 'P3'; due_date?: string | null }) {
  formLoading.value = true
  try {
    const result = editingTodo.value
      ? await todosStore.updateTodo(editingTodo.value.id, data)
      : await todosStore.createTodo(data.title, data.description, data.priority, data.due_date)
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
    toast('Задача удалена', {
      action: {
        label: 'Отменить',
        async onClick() {
          const t = result.todo
          await todosStore.createTodo(t.title, t.description, t.priority ?? 'P3', t.due_date ?? null)
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
  toast('Файл .csv с планами успешно загружен')
}
</script>
