<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  stroke: { type: [Number, String], default: 2 },
  class: { type: String, default: '' }
})

const paths = {
  bell: [
    'M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7',
    'M13.73 21a2 2 0 01-3.46 0'
  ],
  store: [
    'M3 7l1.5-3h15L21 7M3 7h18v13H3z',
    'M8 10h8v10H8z'
  ],
  key: [
    'M21 2l-2 2',
    'M15 8a5 5 0 11-7.07 7.07L2 21l1.5-4.5L8 11.5A5 5 0 0115 8z'
  ],
  envelopeOpen: [
    'M22 12l-10 7L2 12',
    'M2 12l10-7 10 7',
    'M2 12v7h20v-7'
  ],
  building: [
    'M3 22h18',
    'M6 2h12v20H6z',
    'M9 6h2v2H9zM13 6h2v2h-2zM9 10h2v2H9zM13 10h2v2h-2zM9 14h2v2H9zM13 14h2v2h-2z'
  ],
  chevronRight: ['M9 18l6-6-6-6'],
  mapPin: ['M12 21C12 21 5 13.5 5 9a7 7 0 1114 0c0 4.5-7 12-7 12z', 'M12 11a2 2 0 100-4 2 2 0 000 4z'],
  table: ['M3 10h18M3 14h18M3 6h18M7 18v-12M17 18v-12'],
  bookmark: ['M6 2h12v18l-6-3-6 3z'],
  check: ['M20 6L9 17l-5-5'],
  loader: ['M12 2a10 10 0 1010 10'],
  volumeMute: ['M9 9H5v6h4l5 4V5z','M23 9l-6 6','M17 9l6 6'],
  ban: ['M18.364 5.636A9 9 0 105.636 18.364 9 9 0 0018.364 5.636z','M6 6l12 12'],
  unlock: ['M7 11V7a5 5 0 019.9-1', 'M5 11h14v10H5z'],
  times: ['M6 6l12 12M6 18L18 6'],
  warning: ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01'],
  refresh: ['M21 12a9 9 0 11-3.54-7.06L21 5','M21 5v6h-6'],
  shieldCheck: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10','M9 12l2 2 4-4']
  ,
  person: ['M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z','M2 22a10 10 0 0 1 20 0'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  grid: ['M3 3h8v8H3z','M13 3h8v8h-8z','M3 13h8v8H3z','M13 13h8v8h-8z'],
  menu: ['M3 6h18','M3 12h18','M3 18h18'],
  home: ['M3 9.5L12 3l9 6.5V21H3z','M9 21V12h6v9'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.83 5.96l.06-.06A1.65 1.65 0 0 0 5 4.6a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 9 8.6c.24.06.48.06.72 0 .26-.07.53-.1.8-.1s.54.03.8.1c.24.06.48.06.72 0A1.65 1.65 0 0 0 15 8.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c-.24.06-.48.06-.72 0a5 5 0 0 0-.8-.1 5 5 0 0 0-.8.1c-.24.06-.48.06-.72 0a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82l-.06.06a2 2 0 1 1 2.83 2.83l.06-.06c.52-.52 1.3-.64 1.96-.35z'],
  chevronDown: ['M6 9l6 6 6-6']
  ,qr: ['M3 3h4v4H3z','M17 3h4v4h-4z','M3 17h4v4H3z','M11 3h2v2h-2z','M9 7h6v6H9z','M13 17h2v2h-2z','M19 11h2v2h-2z','M17 13h2v2h-2z']
  ,chart: ['M3 3v18h18','M7 15v-6','M12 21V9','M17 21v-12']
  ,users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M12 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0','M22 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75']
}

const viewBox = computed(() => '0 0 24 24')
</script>

<template>
  <svg
    :xmlns="'http://www.w3.org/2000/svg'"
    :width="size"
    :height="size"
    :viewBox="viewBox"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="class"
    aria-hidden="true"
  >
    <template v-for="(d, idx) in paths[name] || []" :key="idx">
      <path :d="d" />
    </template>
  </svg>
  
</template>

