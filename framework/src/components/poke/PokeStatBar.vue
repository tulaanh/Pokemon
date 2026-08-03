<script setup>
import { computed } from 'vue'
import { statBarPercent } from '../../game/inventory.js'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, default: 0 },
})

const colors = { HP: '#4caf50', ATK: '#ff4757', DEF: '#3399ff', SPD: '#e056fd' }
const barColor = computed(() => colors[props.label] || '#e056fd')
const pct = computed(() => statBarPercent(props.label, props.value))
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="w-8 text-xs font-semibold text-slate-500">{{ label }}</span>
    <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
      <div class="h-full rounded-full transition-all duration-300" :style="{ width: pct + '%', background: barColor }"></div>
    </div>
    <span class="w-14 text-right text-xs font-semibold text-slate-700">{{ value }}</span>
  </div>
</template>
