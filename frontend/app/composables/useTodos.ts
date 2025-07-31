export const useTodos = () => {
  const todosStore = useTodosStore()

  // Мемоизированные вычисления
  const sortedTodos = computed(() => {
    return [...todosStore.todos].sort((a, b) => {
      // Сначала незавершенные, потом завершенные
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      // По дате создания (новые сначала)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  })

  const todosByStatus = computed(() => ({
    pending: todosStore.incompleteTodos,
    completed: todosStore.completedTodos
  }))

  // Поиск и фильтрация
  const searchQuery = ref('')
  const filteredTodos = computed(() => {
    if (!searchQuery.value) return sortedTodos.value

    const query = searchQuery.value.toLowerCase()
    return sortedTodos.value.filter(todo =>
      todo.title.toLowerCase().includes(query) ||
      todo.description?.toLowerCase().includes(query)
    )
  })

  // Дебаунс для поиска
  const debouncedSearch = useDebounceFn((query: string) => {
    searchQuery.value = query
  }, 300)

  return {
    todos: sortedTodos,
    todosByStatus,
    filteredTodos,
    searchQuery: readonly(searchQuery),
    search: debouncedSearch,
    ...todosStore
  }
}