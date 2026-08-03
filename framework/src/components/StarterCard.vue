<script setup>
import { computed } from 'vue'
import RarityText from './RarityText.vue'
import TypeBadge from './poke/TypeBadge.vue'
import PokeSprite from './PokeSprite.vue'

const props = defineProps({
  name: { type: String, required: true },
  species: { type: Object, required: true },
  rarity: { type: Object, required: true },
  selected: { type: Boolean, required: true },
})

const emit = defineEmits(['click'])

const typeColors = {
  Fire: 'from-red-100 to-orange-100',
  Water: 'from-blue-100 to-cyan-100',
  Grass: 'from-green-100 to-emerald-100',
  Electric: 'from-yellow-100 to-amber-100',
  Rock: 'from-stone-200 to-stone-300',
}

const gradientClass = computed(() => typeColors[props.species.type] || 'from-slate-200 to-slate-300')

function onClick() {
  emit('click', props.name)
}
</script>

<template>
  <button
    @click="onClick"
    class="relative group rounded-xl border-2 overflow-hidden transition-all duration-200 bg-white"
    :class="[
      selected
        ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-105'
        : 'border-slate-200 hover:border-slate-400 hover:shadow-lg hover:shadow-slate-300/50',
    ]"
  >
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-br" :class="gradientClass" :style="{ opacity: selected ? 0.5 : 0.25 }"></div>

    <!-- Selection indicator -->
    <div v-if="selected" class="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-white text-sm font-bold animate-bounce">
      ✓
    </div>

    <div class="relative p-4">
      <!-- Pokémon Icon/Name -->
      <div class="mb-3 flex flex-col items-center">
        <PokeSprite :name="species.name" :type="species.type" :size-class="'h-20 w-20'" :rounded="'rounded-full'" :img-class="'h-20 w-20'" />
        <RarityText :rarity="rarity" :label="name" class="mt-2 text-lg font-bold text-center" />
      </div>

      <!-- Type Badge -->
      <div class="mb-3 flex justify-center">
        <TypeBadge :type="species.type" />
      </div>

      <!-- Base Stats Preview -->
      <div class="space-y-1.5 text-xs">
        <div class="flex justify-between text-slate-500">
          <span>HP</span>
          <span class="font-semibold text-slate-700">{{ species.baseHp }}</span>
        </div>
        <div class="flex justify-between text-slate-500">
          <span>ATK</span>
          <span class="font-semibold text-slate-700">{{ species.baseAtk }}</span>
        </div>
        <div class="flex justify-between text-slate-500">
          <span>DEF</span>
          <span class="font-semibold text-slate-700">{{ species.baseDef }}</span>
        </div>
        <div class="flex justify-between text-slate-500">
          <span>SPD</span>
          <span class="font-semibold text-slate-700">{{ species.baseSpeed }}</span>
        </div>
      </div>

      <!-- Selected overlay -->
      <div v-if="selected" class="absolute inset-0 flex items-center justify-center bg-amber-400/10">
        <span class="text-sm font-bold text-amber-600 animate-pulse">ĐÃ CHỌN</span>
      </div>
    </div>
  </button>
</template>
