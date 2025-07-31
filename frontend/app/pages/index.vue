<template>
  <div class="space-y-8">
    <!-- Заголовок + счётчики -->
    <section>
      <h1 class="text-3xl font-bold tracking-tight">Мои задачи</h1>
      <p class="text-sm text-muted-foreground">
        Всего — {{ todosStore.totalTodos }},
        выполнено — {{ todosStore.completedTodos.length }},
        осталось — {{ todosStore.incompleteTodos.length }}
      </p>
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

    <!-- Создание / редактирование задачи -->
    <Card>
      <TodoForm
        :editing-todo="editingTodo"
        :loading="formLoading"
        @submit="handleSubmit"
        @cancel="cancelEdit"
      />
    </Card>

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
            />
          </TransitionGroup>
        </ScrollArea>
      </TabsContent>

      <!-- Календарь -->
      <TabsContent value="calendar">
        <Calendar
          :events="calendarEvents"
          editable
          droppable
          @event-drop="onDateChange"
        />
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
import {Tabs} from "~/components/ui/tabs";
import {ScrollArea} from "~/components/ui/scroll-area";
import {SelectTrigger, SelectItem, SelectValue, SelectContent, Select} from "~/components/ui/select"
import {useTodosStore} from '~/stores/todos'

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

/**
 * методы
 */
function resetFilters() {
  query.value = ''
  priority.value = []
  sort.value = 'due'
}

function startEdit(todo: Todo) {
  editingTodo.value = todo
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleSubmit(data: { title: string; description?: string }) {
  formLoading.value = true
  try {
    const result = editingTodo.value
      ? await todosStore.updateTodo(editingTodo.value.id, data)
      : await todosStore.createTodo(data.title, data.description)
    if (result.success) editingTodo.value = null
  } finally {
    formLoading.value = false
  }
}

function cancelEdit() {
  editingTodo.value = null
}

function onDateChange(info: any) {
  todosStore.updateTodo(info.event.id, { due_date: info.event.startStr })
}

function exportCsv() {
  todosStore.exportCsv(filteredTodos.value)
}
</script>
