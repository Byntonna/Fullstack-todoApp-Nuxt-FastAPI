<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div>
      <!-- Заголовок -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Мои задачи
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Всего: {{ todosStore.totalTodos }} |
          Выполнено: {{ todosStore.completedTodos.length }} |
          Осталось: {{ todosStore.incompleteTodos.length }}
        </p>
      </div>

      <!-- Форма создания новой задачи -->
      <Card class="p-8 mb-8">
        <template #header>
          <h2 class="text-xl font-semibold">
            {{ editingTodo ? 'Редактировать задачу' : 'Новая задача' }}
          </h2>
        </template>
        <TodoForm
          :editing-todo="editingTodo"
          :loading="formLoading"
          @submit="handleSubmit"
          @cancel="cancelEdit"
        />
      </Card>

      <!-- Список задач -->
      <div class="space-y-4">
        <div v-if="todosStore.loading" class="text-center py-8">
          <Skeleton v-for="i in 3" :key="i" class="h-20 w-full mb-4" />
        </div>

        <div v-else-if="todosStore.todos.length === 0" class="text-center py-12">
          <p class="text-gray-600 dark:text-gray-400">
            У вас пока нет задач. Создайте первую!
          </p>
        </div>

        <TransitionGroup
          v-else
          name="todo"
          tag="div"
          class="space-y-4"
        >
          <TodoItem
            v-for="todo in todosStore.todos"
            :key="todo.id"
            :todo="todo"
            @edit="startEdit"
            @delete="deleteTodo"
          />
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTodosStore } from '~/stores/todos'
import { toast } from 'vue-sonner'
import TodoForm from '@/components/TodoForm.vue'
import TodoItem from '@/components/TodoItem.vue'
import Card from '@/components/ui/card/Card.vue'
import Skeleton from '@/components/ui/skeleton/Skeleton.vue'

interface Todo {
  id: number
  title: string
  description?: string
  completed: boolean
  user_id: number
  created_at: string
  updated_at?: string
}

const authStore = useAuthStore()
const todosStore = useTodosStore()

// Логика логина
const loginLoading = ref(false)
const loginError = ref('')

async function handleLogin({ email, password }: { email: string; password: string }) {
  loginLoading.value = true
  loginError.value = ''
  try {
    await authStore.login(email, password)
    // После успешного логина автоматически сработает watch и подтянет todos
  } catch (err: any) {
    loginError.value = err.data?.detail || err.message || 'Ошибка входа'
  } finally {
    loginLoading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    todosStore.fetchTodos()
  }
  else {
    navigateTo('/login')
  }
})

// Когда сменился статус аутентификации на `true` — тоже грузим таски
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      todosStore.fetchTodos()
    }
  }
)

const editingTodo = ref<Todo | null>(null)
const formLoading = ref(false)

const handleSubmit = async (data: { title: string; description?: string }) => {
  formLoading.value = true
  try {
    const result = editingTodo.value
      ? await todosStore.updateTodo(editingTodo.value.id, data)
      : await todosStore.createTodo(data.title, data.description)

    if (result.success) {
      toast(
        editingTodo.value ? 'Задача обновлена' : 'Задача создана'
      )
      editingTodo.value = null
    } else {
      toast('Ошибка', {
        description: result.error ? result.error : 'Описание отсутствует'
      })
    }
  } finally {
    formLoading.value = false
  }
}

const startEdit = (todo: Todo) => {
  editingTodo.value = todo
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => {
  editingTodo.value = null
}

const deleteTodo = async (id: number) => {
  const result = await todosStore.deleteTodo(id)
  if (result.success) {
    toast (
        'Задача удалена'
    )
    if (editingTodo.value?.id === id) editingTodo.value = null
  } else {
    toast('Ошибка удаления', {
        description: result.error ? result.error : 'Описание отсутствует'
      })
  }
}
</script>

<style scoped>
.todo-enter-active,
.todo-leave-active {
  transition: all 0.3s ease;
}
.todo-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.todo-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.todo-move {
  transition: transform 0.3s ease;
}
</style>
