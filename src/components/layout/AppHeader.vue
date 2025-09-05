<template>
  <header class="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white">
    <div class="max-w-md mx-auto flex items-center justify-between p-4">
      <div class="flex items-center gap-3">
        <button
          class="inline-flex items-center justify-center p-2 h-auto rounded-lg transition-all duration-200 text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95"
          @click="$emit('toggle-menu')"
          type="button"
          aria-label="Abrir menú"
        >
          <MozoIcon name="menu" :size="22" />
        </button>
        <h1 class="text-xl font-bold">MÖZÖ</h1>
      </div>
      <slot name="right"></slot>
    </div>
  </header>
</template>
<script setup>
import MozoIcon from '@/components/icons/MozoIcon.vue'
// shared header for admin/waiter
</script>
