// stores/todos.ts - Store для управления задачами
import { defineStore } from 'pinia'

interface Todo {
  id: number
  title: string
  description?: string
  completed: boolean
  user_id: number
  created_at: string
  updated_at?: string
}

interface TodoState {
  todos: Todo[]
  loading: boolean
  error: string | null
}

export const useTodosStore = defineStore('todos', {
  state: (): TodoState => ({
    todos: [],
    loading: false,
    error: null
  }),

  getters: {
    completedTodos: (state) => state.todos.filter(todo => todo.completed),
    incompleteTodos: (state) => state.todos.filter(todo => !todo.completed),
    totalTodos: (state) => state.todos.length
  },

  actions: {
    async fetchTodos() {
      this.loading = true
      this.error = null

      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()

        const todos = await $fetch<Todo[]>('/todos/', {
          baseURL: config.public.apiBase,
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        })

        this.todos = todos
      } catch (error: any) {
        this.error = error.data?.detail || 'Failed to fetch todos'
        console.error('Fetch todos error:', error)
      } finally {
        this.loading = false
      }
    },

    async createTodo(title: string, description?: string) {
      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()

        const newTodo = await $fetch<Todo>('/todos/', {
          baseURL: config.public.apiBase,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          },
          body: { title, description }
        })

        this.todos.unshift(newTodo) // Добавляем в начало списка
        return { success: true }
      } catch (error: any) {
        this.error = error.data?.detail || 'Failed to create todo'
        return { success: false, error: this.error }
      }
    },

    async updateTodo(id: number, updates: Partial<Pick<Todo, 'title' | 'description' | 'completed'>>) {
      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()

        const updatedTodo = await $fetch<Todo>(`/todos/${id}`, {
          baseURL: config.public.apiBase,
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          },
          body: updates
        })

        // Обновляем локальное состояние
        const index = this.todos.findIndex(todo => todo.id === id)
        if (index !== -1) {
          this.todos[index] = updatedTodo
        }

        return { success: true }
      } catch (error: any) {
        this.error = error.data?.detail || 'Failed to update todo'
        return { success: false, error: this.error }
      }
    },

    async deleteTodo(id: number) {
      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()

        await $fetch(`/todos/${id}`, {
          baseURL: config.public.apiBase,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        })

        // Удаляем из локального состояния
        this.todos = this.todos.filter(todo => todo.id !== id)
        return { success: true }
      } catch (error: any) {
        this.error = error.data?.detail || 'Failed to delete todo'
        return { success: false, error: this.error }
      }
    },

    async toggleTodo(id: number) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        return await this.updateTodo(id, { completed: !todo.completed })
      }
      return { success: false, error: 'Todo not found' }
    }
  }
})