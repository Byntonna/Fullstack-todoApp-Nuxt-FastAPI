// stores/todos.ts - Store для управления задачами
import { defineStore } from 'pinia'
import Fuse from 'fuse.js'

export interface Category {
  id: number
  name: string
}

export interface Tag {
  id: number
  name: string
}

export interface Todo {
  id: number
  title: string
  description?: string
  completed: boolean
  user_id: number
  created_at: string
  updated_at?: string
  due_date?: string
  priority?: 'P1' | 'P2' | 'P3'
  category?: Category | null
  tags?: Tag[]
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
    totalTodos: (state) => state.todos.length,

    // Новый геттер: фильтрация + сортировка
    filterAndSort: (state) => {
      return ({ query = '', priority = [], sort = 'due' as 'due' | 'created' | 'priority' }) => {
        let result = [...state.todos]

        // Поиск по title, description, категории и тегам (регистр нечувствителен)
        if (query.trim()) {
          const fuse = new Fuse(result, {
            keys: ['title', 'description', 'category.name', 'tags.name'],
            threshold: 0.3,
            ignoreLocation: true
          })
          result = fuse.search(query).map(r => r.item)
        }

        // Фильтрация по приоритету (если в todo есть поле priority)
        if (priority.length > 0) {
          result = result.filter(t => t.priority ? priority.includes(t.priority) : false)
        }

        // Сортировка
        result.sort((a, b) => {
          if (sort === 'due') {
            const da = a.due_date ? new Date(a.due_date).getTime() : Infinity
            const db = b.due_date ? new Date(b.due_date).getTime() : Infinity
            return da - db
          }
          if (sort === 'created') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          }
          if (sort === 'priority') {
            const order = { P1: 1, P2: 2, P3: 3 }
            const pa = order[a.priority ?? 'P3'] ?? 99
            const pb = order[b.priority ?? 'P3'] ?? 99
            return pa - pb
          }
          return 0
        })

        return result
      }
    }
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
      } catch (error: unknown) {
        const err = error as { data?: { detail?: string } }
        this.error = err.data?.detail || 'Failed to fetch todos'
        console.error('Fetch todos error:', error)
      } finally {
        this.loading = false
      }
    },

    async createTodo(
      title: string,
      description?: string,
      priority: 'P1' | 'P2' | 'P3' = 'P3',
      due_date?: string | null,
      category?: string,
      tags: string[] = [],
    ) {
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
          body: { title, description, priority, due_date, category, tags }
        })

        this.todos.unshift(newTodo) // Добавляем в начало списка
          return { success: true }
        } catch (error: unknown) {
          const err = error as { data?: { detail?: string } }
          this.error = err.data?.detail || 'Failed to create todo'
          return { success: false, error: this.error }
        }
      },

    async exportCsv(list: Todo[] = this.todos) {
      if (import.meta.server) return
      if (!list.length) return

      const header = [
        'Title',
        'Description',
        'Completed',
        'Priority',
        'Due Date',
        'Created At',
        'Updated At'
      ]

      const quote = (value: string | number | undefined | null) => {
        const str = (value ?? '').toString().replace(/"/g, '""')
        return `"${str}"`
      }

      const rows = list.map(t => [
        quote(t.title),
        quote(t.description),
        t.completed,
        t.priority ?? '',
        t.due_date ?? '',
        t.created_at,
        t.updated_at ?? ''
      ])

      const csv = [header, ...rows].map(r => r.join(',')).join('\r\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `todos_${new Date().toISOString().slice(0,10)}.csv`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    async exportAnki(list: Todo[] = this.todos) {
      if (import.meta.server) return
      if (!list.length) return

      const header = ['Front', 'Back']
      const quote = (value: string | number | undefined | null) => {
        const str = (value ?? '')
          .toString()
          .replace(/"/g, '""')
          .replace(/\r?\n/g, '<br>')
        return `"${str}"`
      }

      const rows = list.map(t => [
        quote(t.title),
        quote(t.description)
      ])

      const csv = [header, ...rows].map(r => r.join(',')).join('\r\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `anki_${new Date().toISOString().slice(0,10)}.csv`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    async updateTodo(
      id: number,
      updates: Partial<Pick<Todo, 'title' | 'description' | 'completed' | 'priority' | 'due_date'>> & {
        category?: string | null
        tags?: string[]
      }
    ) {
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
      } catch (error: unknown) {
        const err = error as { data?: { detail?: string } }
        this.error = err.data?.detail || 'Failed to update todo'
        return { success: false, error: this.error }
      }
    },

    async deleteTodo(id: number) {
      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()

        const deleted = await $fetch<Todo>(`/todos/${id}`, {
          baseURL: config.public.apiBase,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        })

        // Удаляем из локального состояния
        this.todos = this.todos.filter(todo => todo.id !== id)
        return { success: true, todo: deleted }
      } catch (error: unknown) {
        const err = error as { data?: { detail?: string } }
        this.error = err.data?.detail || 'Failed to delete todo'
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