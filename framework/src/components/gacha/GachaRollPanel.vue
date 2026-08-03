<script setup>
import { computed } from 'vue'
import { RARITIES } from '../../game/data.js'
import RarityText from '../RarityText.vue'

const props = defineProps({
  banner: { type: Object, required: true },
})

const emit = defineEmits(['roll'])

const currencyIcon = computed(() => (props.banner.currency === 'gems' ? '💎' : '🎟️'))

// Tỷ lệ chi tiết (gộp Legendary/Mythic/Secret thành 1 dòng)
const chanceDetails = computed(() => {
  const items = []
  const chances = props.banner.rarityChances
  const combinedLegendary =
    (chances['Legendary'] || 0) + (chances['Mythic'] || 0) + (chances['Secret'] || 0)

  for (const rName in chances) {
    if (rName === 'Legendary' || rName === 'Mythic' || rName === 'Secret') continue
    if (!chances[rName]) continue
    const rObj = RARITIES.find((r) => r.name === rName) || { name: rName }
    items.push({ rarity: rObj.name, label: `${rName} (${chances[rName]}%)` })
  }
  if (combinedLegendary > 0) {
    items.push({ rarity: 'Legendary', label: `Legendary (${combinedLegendary.toFixed(3)}%)` })
  }
  return items
})
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-fuchsia-50/60 p-5 text-center">
    <h4 class="mb-1 text-base text-slate-800">
      🔮 Đang Triệu Hoán: <span class="font-bold text-amber-600">{{ banner.name }}</span>
    </h4>
    <p class="mb-4 text-xs text-slate-500">
      <template v-for="item in chanceDetails" :key="item.label">
        <RarityText :rarity="item.rarity" :label="item.label" /> <span class="text-slate-300">|</span>
      </template>
    </p>

    <div class="flex justify-center gap-4">
      <button
        @click="emit('roll', 1)"
        class="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:brightness-110"
      >
        Quay x1<br />
        <span class="text-xs font-medium opacity-90">({{ currencyIcon }} {{ banner.cost }})</span>
      </button>
      <button
        @click="emit('roll', 10)"
        class="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
      >
        Quay x10<br />
        <span class="text-xs font-medium opacity-90">({{ currencyIcon }} {{ banner.cost * 10 }})</span>
      </button>
    </div>
  </div>
</template>
