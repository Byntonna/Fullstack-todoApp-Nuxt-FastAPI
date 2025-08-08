<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <Toaster position="bottom-right" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
