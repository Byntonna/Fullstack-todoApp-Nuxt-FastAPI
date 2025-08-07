<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="modelValue"
        class="fixed inset-0 z-100 flex items-center justify-center"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.3 }"
        @click.self="close"
        @keydown.esc="close"
      >
        <motion.div
          class="absolute inset-0 backdrop-blur-smooth bg-black/20"
          :initial="{
            opacity: 0,
            '--blur-amount': '0px'
          }"
          :animate="{
            opacity: 1,
            '--blur-amount': '5px'
          }"
          :exit="{
            opacity: 0,
            '--blur-amount': '0px'
          }"
          :transition="{
            duration: 0.5,
            ease: 'easeOut'
          }"
          :style="{
            backdropFilter: `blur(var(--blur-amount, 0px))`,
            WebkitBackdropFilter: `blur(var(--blur-amount, 0px))`
          }"
        />

        <motion.div
          class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          :initial="{
            opacity: 0,
            scale: 0.7,
            y: 50,
            rotateX: -15
          }"
          :animate="{
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: 0
          }"
          :exit="{
            opacity: 0,
            scale: 0.8,
            y: -30,
            rotateX: 10
          }"
          :transition="{
            type: 'spring',
            damping: 25,
            stiffness: 300,
            mass: 1,
            delay: 0.1
          }"
          @click.stop
        >

          <!-- Content -->
          <motion.div
            class="p-6"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :transition="{ delay: 0.25 }"
          >
            <slot />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>

<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

function close() {
  emit('update:modelValue', false)
}
</script>

<style>
.backdrop-blur-smooth {
  transition: backdrop-filter 0.5s ease-out, -webkit-backdrop-filter 0.5s ease-out;
}
</style>