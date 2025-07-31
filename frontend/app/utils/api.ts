// utils/api.ts - Централизованная обработка API запросов
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const apiClient = {
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Добавляем токен авторизации если он есть
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }

    try {
      const response = await fetch(`${config.public.apiBase}${url}`, {
        ...options,
        headers
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new ApiError(
          errorData?.detail || 'Request failed',
          response.status,
          errorData
        )
      }

      // Если ответ пустой (например, после DELETE), возвращаем пустой объект
      const text = await response.text()
      return text ? JSON.parse(text) : {}
    } catch (error) {
      if (error instanceof ApiError) {
        // Если токен недействителен, выходим из системы
        if (error.status === 401) {
          authStore.logout()
        }
        throw error
      }

      // Сетевые ошибки
      throw new ApiError('Network error', 0, error)
    }
  }
}