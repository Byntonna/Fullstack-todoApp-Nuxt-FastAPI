<script setup lang="ts">
import { watch, ref, computed } from 'vue'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { useI18n } from '#imports'
import { DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { toDate } from 'reka-ui/date'
import { Calendar } from '@/components/ui/calendar'
import { PopoverRoot as Popover, PopoverTrigger, PopoverContent } from 'reka-ui'
import { CalendarIcon } from 'lucide-vue-next'
import type { CategoryItem } from '~/stores/categories'

type Priority = 'P1' | 'P2' | 'P3'

const props = defineProps<{
  editingTodo: {
    title: string
    description?: string
    priority?: Priority
    due_date?: string | null
    category_id?: number | null
    tags?: string[]
  } | null
  loading: boolean
  categories: CategoryItem[]
}>()

const emit = defineEmits<{
  (e: 'submit', p: {
    title: string
    description?: string
    priority: Priority
    due_date?: string | null
    category_id?: number
    tags: string[]
  }): void
  (e: 'cancel' | 'add-category'): void
}>()

/* -------------------  ВАЛИДАЦИЯ  ------------------- */
const formSchema = toTypedSchema(
  z.object({
    title:       z.string().min(1, 'Название обязательно'),
    description: z.string().optional(),
    priority:    z.enum(['P1', 'P2', 'P3']).default('P3'),
    // «date» валидируется как строка ISO-формата «YYYY-MM-DD»
    due_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    category_id: z.number().optional().nullable(),
    tags:        z.string().optional(),
  })
)

/* -------------------  ФОРМА  ------------------- */
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title:       props.editingTodo?.title       ?? '',
    description: props.editingTodo?.description ?? '',
    priority:    props.editingTodo?.priority    ?? 'P3',
    due_date:    props.editingTodo?.due_date    ?? null,
    category_id: props.editingTodo?.category_id ?? null,
    tags:        props.editingTodo?.tags?.join(', ') ?? '',
  },
})

/* Сброс, когда выбирают другую задачу для редактирования */
watch(
  () => props.editingTodo,
  (val) => {
    form.resetForm({
      values: {
        title:       val?.title       ?? '',
        description: val?.description ?? '',
        priority:    val?.priority    ?? 'P3',
        due_date:    val?.due_date    ?? null,
        category_id: val?.category_id ?? null,
        tags:        val?.tags?.join(', ') ?? '',
      },
    })
  },
)

const onSubmit = form.handleSubmit((values) => {
  emit('submit', {
    title: values.title,
    description: values.description || undefined,
    priority: values.priority,
    due_date: values.due_date ?? undefined,
    category_id: values.category_id ?? undefined,
    tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
  })
})
const df = new DateFormatter('en-US', { dateStyle: 'long' })
const placeholder = ref()
const dueValue = computed(() => form.values.due_date ? parseDate(form.values.due_date) : undefined)
const { t } = useI18n()
</script>

<template>
  <form @submit="onSubmit" class="space-y-4 p-4">

    <!-- Название -->
    <FormField v-slot="{ componentField }" name="title">
      <FormItem>
        <FormLabel>{{ t('todoform.title') }}</FormLabel>
        <FormControl>
          <Input
            type="text"
            :placeholder="t('todoform.enter_title')"
            :disabled="props.loading"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Описание -->
    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>{{ t('todoform.description') }}</FormLabel>
        <FormControl>
          <Textarea
            :placeholder="t('todoform.enter_description')"
            rows="3"
            :disabled="props.loading"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage/>
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="category_id">
      <FormItem>
        <FormLabel>Категория</FormLabel>
        <FormControl>
          <div class="flex items-center gap-2">
            <Select
              :model-value="componentField.value?.toString() || 'none'"
              @update:model-value="val => componentField.onChange(val === 'none' ? null : Number(val))"
            >
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Без категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без категории</SelectItem>
                <SelectItem
                  v-for="cat in props.categories"
                  :key="cat.id"
                  :value="String(cat.id)"
                >
                  {{ cat.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              :disabled="props.loading"
              @click="$emit('add-category')"
            >
              <Icon name="icons:plus" class="h-4 w-4" />
            </Button>
          </div>
        </FormControl>
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Теги -->
    <FormField v-slot="{ componentField }" name="tags">
      <FormItem>
        <FormLabel>{{ t('todoform.tags') }}</FormLabel>
        <FormControl>
          <Input
            type="text"
            :placeholder="t('todoform.enter_tags')"
            :disabled="props.loading"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Приоритет -->
    <FormField v-slot="{ componentField }" name="priority">
      <FormItem>
        <FormLabel>{{ t('todoform.priority') }}</FormLabel>
        <FormControl>
          <ToggleGroup
            type="single"
            :aria-label="t('todoform.choose_priority')"
            :disabled="props.loading"
            v-bind="componentField"
          >
            <ToggleGroupItem value="P1" class="rounded-l-md">
              <div class="-space-x-4">
                <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: currentColor"/>
              <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: currentColor"/>
              <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: currentColor"/>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value="P2">
              <div class="-space-x-4">
                <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: currentColor"/>
              <Icon name="tabler:exclamation-mark"
                    size="20"
                    style="color: currentColor"/>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value="P3" class="rounded-r-md">
                <Icon name="tabler:exclamation-mark"
                    class="mb-1"
                    size="20"
                    style="color: currentColor"/>
            </ToggleGroupItem>
          </ToggleGroup>
        </FormControl>
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Срок (due_date) -->
    <FormField v-slot="{ componentField }" name="due_date">
      <FormItem class="flex flex-col">
        <FormLabel>{{ t('todoform.due_date') }}</FormLabel>
        <Popover>
          <PopoverTrigger as-child>
            <FormControl>
              <Button
                variant="outline"
                :class="['w-[240px] ps-3 text-start font-normal', !dueValue && 'text-muted-foreground']"
                :disabled="props.loading"
              >
                <span>{{ dueValue ? df.format(toDate(dueValue)) : t('todoform.datepick') }}</span>
                <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
              </Button>
              <input hidden v-bind="componentField" />
            </FormControl>
          </PopoverTrigger>
          <PopoverContent
            class="w-auto p-0 bg-popover rounded-md border"
            @mousedown.capture.stop
            @click.stop
          >
            <Calendar
              v-model:placeholder="placeholder"
              :model-value="dueValue"
              calendar-label="Due date"
              initial-focus
              :min-value="today(getLocalTimeZone())"
              @update:model-value="(v) => {
                if (v) {
                  form.setFieldValue('due_date', v.toString())
                } else {
                  form.setFieldValue('due_date', null)
                }
              }"
            />
          </PopoverContent>
        </Popover>
        <FormMessage/>
      </FormItem>
    </FormField>

    <!-- Кнопки -->
    <div class="flex gap-3 justify-end">
      <Button
        type="button"
        variant="ghost"
        :disabled="props.loading"
        @click="$emit('cancel')"
      >
        {{ t('common.cancel') }}
      </Button>
      <Button
        type="submit"
        :disabled="props.loading"
      >
        {{ props.editingTodo ? t('todoform.update') : t('todoform.create') }}
      </Button>
    </div>
  </form>
</template>
