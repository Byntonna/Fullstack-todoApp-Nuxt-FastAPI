// stores/todos.ts - Store для управления задачами
import { defineStore } from 'pinia'

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
      return ({query = '', priority = [], sort = 'due' as 'due' | 'created' | 'priority'}) => {
        let result = [...state.todos];

        // Поиск по title и description (регистр нечувствителен)
        if (query.trim()) {
          const q = query.toLowerCase();
          result = result.filter(t =>
              t.title.toLowerCase().includes(q) ||
              (t.description?.toLowerCase().includes(q))
          );
        }

        // Фильтрация по приоритету (если в todo есть поле priority)
        if (priority.length > 0) {
          result = result.filter(t => {
            // Если у задачи нет priority, исключаем; предполагается, что в todo есть поле priority: 'P1' | 'P2' | 'P3'
            // Если структура другая — адаптируйте
            return priority.includes((t as any).priority);
          });
        }

        // Сортировка
        result.sort((a, b) => {
          if (sort === 'due') {
            const da = (a as any).due_date ? new Date((a as any).due_date).getTime() : Infinity;
            const db = (b as any).due_date ? new Date((b as any).due_date).getTime() : Infinity;
            return da - db;
          }
          if (sort === 'created') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          if (sort === 'priority') {
            const order = {P1: 1, P2: 2, P3: 3};
            const pa = order[((a as any).priority || 'P3') as keyof typeof order] ?? 99;
            const pb = order[((b as any).priority || 'P3') as keyof typeof order] ?? 99;
            return pa - pb;
          }
          return 0;
        });

        return result;
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
      } catch (error: any) {
        this.error = error.data?.detail || 'Failed to fetch todos'
        console.error('Fetch todos error:', error)
      } finally {
        this.loading = false
      }
    },

    async createTodo(title: string, description?: string, priority: 'P1' | 'P2' | 'P3' = 'P3', due_date?: string | null) {
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
          body: { title, description, priority, due_date }
        })

        this.todos.unshift(newTodo) // Добавляем в начало списка
        return { success: true }
      } catch (error: any) {
        this.error = error.data?.detail || 'Failed to create todo'
        return { success: false, error: this.error }
      }
    },

    async exportCsv(list: Todo[] = this.todos) {
      if (process.server) return
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

    async updateTodo(id: number, updates: Partial<Pick<Todo, 'title' | 'description' | 'completed' | 'priority' | 'due_date'>>) {
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