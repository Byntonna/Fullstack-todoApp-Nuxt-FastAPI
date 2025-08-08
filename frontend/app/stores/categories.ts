import { defineStore } from 'pinia'

export interface CategoryItem {
  id: number
  name: string
  color: string
  todo_count?: number
}

interface CategoryState {
  categories: CategoryItem[]
  loading: boolean
  error: string | null
}

export const useCategoriesStore = defineStore('categories', {
  state: (): CategoryState => ({
    categories: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchCategories() {
      this.loading = true
      this.error = null
      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()
        const cats = await $fetch<CategoryItem[]>('/categories/', {
          baseURL: config.public.apiBase,
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        })
        this.categories = cats
      } catch (error: unknown) {
        const err = error as { data?: { detail?: string } }
        this.error = err.data?.detail || 'Failed to fetch categories'
        console.error('Fetch categories error:', error)
      } finally {
        this.loading = false
      }
    },

    async createCategory(name: string, color: string) {
      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()
        const newCat = await $fetch<CategoryItem>('/categories/', {
          baseURL: config.public.apiBase,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          },
          body: { name, color }
        })
        this.categories.push(newCat)
        return { success: true }
      } catch (error: unknown) {
        const err = error as { data?: { detail?: string } }
        return { success: false, error: err.data?.detail || 'Failed to create category' }
      }
    },

    async updateCategory(id: number, data: { name?: string; color?: string }) {
      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()
        const updated = await $fetch<CategoryItem>(`/categories/${id}`, {
          baseURL: config.public.apiBase,
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          },
          body: data
        })
        const idx = this.categories.findIndex(c => c.id === id)
        if (idx !== -1) this.categories[idx] = updated
        return { success: true }
      } catch (error: unknown) {
        const err = error as { data?: { detail?: string } }
        return { success: false, error: err.data?.detail || 'Failed to update category' }
      }
    },

    async deleteCategory(id: number, new_category_id?: number) {
      try {
        const authStore = useAuthStore()
        const config = useRuntimeConfig()
        const deleted = await $fetch<CategoryItem>(`/categories/${id}`, {
          baseURL: config.public.apiBase,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authStore.token}`
          },
          ...(new_category_id !== null ? { query: { new_category_id } } : {})
        })
        this.categories = this.categories.filter(c => c.id !== id)
        return { success: true, data: deleted }
      } catch (error: unknown) {
        const err = error as { data?: { detail?: string } }
        return { success: false, error: err.data?.detail || 'Failed to delete category' }
      }
    }
  }
})