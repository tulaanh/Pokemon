<script setup>
import RarityText from '../RarityText.vue'
import PokeSprite from '../PokeSprite.vue'

defineProps({
  poke: { type: Object, default: null },
  placeholder: { type: String, required: true },
})

const emit = defineEmits(['select'])
</script>

<template>
  <button
    @click="emit('select')"
    class="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 bg-white transition"
    :class="poke ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-dashed border-slate-300 hover:border-slate-400'"
  >
    <template v-if="poke">
      <PokeSprite :name="poke.name" :type="poke.type" :size-class="'h-12 w-12'" :img-class="'h-12 w-12'" :rounded="'rounded-full'" />
      <RarityText :rarity="poke.rarity" :label="poke.name" />
      <span v-if="poke.vLevel > 0" class="rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1.5 text-[10px] font-black text-white">
        V{{ poke.vLevel }}
      </span>
      <small class="text-slate-500">Lv.{{ poke.level }} - {{ poke.rarity.name }}</small>
    </template>
    <template v-else>
      <span class="text-2xl text-slate-300">+</span>
      <span class="text-xs text-slate-400">{{ placeholder }}</span>
    </template>
  </button>
</template>
