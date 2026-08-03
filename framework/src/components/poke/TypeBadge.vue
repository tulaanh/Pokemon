<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, required: true },
})

const colors = {
  Fire: 'bg-red-100 text-red-700 border-red-300',
  Water: 'bg-blue-100 text-blue-700 border-blue-300',
  Grass: 'bg-green-100 text-green-700 border-green-300',
  Electric: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Rock: 'bg-orange-100 text-orange-700 border-orange-300',
}

const classes = computed(() => colors[props.type] || 'bg-slate-100 text-slate-600 border-slate-300')
</script>

<template>
  <span class="rounded-md border px-2 py-0.5 text-[11px] font-semibold" :class="classes">{{ type }}</span>
</template>
