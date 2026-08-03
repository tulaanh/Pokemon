<script setup>
// Hiển thị tên Pokémon / kỹ năng với màu theo độ hiếm (thay thế class .rarity-*)
import { computed } from 'vue'

const props = defineProps({
  rarity: { type: [String, Object], default: 'Common' },
  label: { type: String, default: '' },
})

const rarityName = computed(() => {
  if (typeof props.rarity === 'string') return props.rarity
  return props.rarity?.name || 'Common'
})

const colorClass = computed(() => {
  switch (rarityName.value) {
    case 'Rare':
      return 'text-indigo-600'
    case 'Epic':
      return 'text-purple-600'
    case 'Legendary':
      return 'text-amber-600 font-bold'
    case 'Mythic':
      return 'text-red-600 font-bold [text-shadow:0_0_8px_rgba(255,71,87,0.45)]'
    case 'Secret':
      return 'text-slate-800 font-black tracking-wider [text-shadow:0_0_10px_rgba(239,68,68,0.55)]'
    default:
      return 'text-slate-500'
  }
})
</script>

<template>
  <span :class="colorClass">
    <slot>{{ label || rarityName }}</slot>
  </span>
</template>
