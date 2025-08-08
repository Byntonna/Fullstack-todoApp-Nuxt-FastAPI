<script setup lang="ts">
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useI18n } from '#imports'
import type { CategoryItem } from '~/stores/categories'

const props = defineProps<{ modelValue: number | null, categories: CategoryItem[] }>()
const emit = defineEmits<{(e: 'update:modelValue', value: number | null): void}>()
const { t } = useI18n()

/**
 * When value comes back from the UI:
 *  - "" means “user cleared” → null
 *  - "none" means “explicitly chose None” → null
 *  - anything else → parse as number
 */
function onUpdate(value: string) {
  if (value === '' || value === 'none') {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', Number(value))
  }
}
</script>

<template>
  <Select
    :model-value="props.modelValue?.toString() || ''"
    @update:model-value="onUpdate"
  >
    <SelectTrigger class="w-48">
      <SelectValue :placeholder="t('todoform.category')" />
    </SelectTrigger>
    <SelectContent>
      <!-- NOTE: value is now "none", not "" -->
      <SelectItem value="none">
        {{ t('todoform.category_none') }}
      </SelectItem>

      <SelectItem
        v-for="cat in props.categories"
        :key="cat.id"
        :value="cat.id.toString()"
      >
        <span class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: cat.color }" />
          {{ cat.name }} ({{ cat.todo_count || 0 }})
        </span>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
