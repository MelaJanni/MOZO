<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="min-h-screen bg-[var(--color-light)]">
    <AppHeader @toggle-menu="ui.toggleOffCanvas()">
      <template #right>
        <slot name="right"></slot>
      </template>
    </AppHeader>
    <div class="max-w-md mx-auto px-4 pt-4 pb-20">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* layout spacing handled with utilities */
</style>
