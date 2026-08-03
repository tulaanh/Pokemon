<script setup>
import { computed } from 'vue'
import { getBannerSpeciesPool } from '../../game/data.js'
import PokeSprite from '../PokeSprite.vue'

const props = defineProps({
  banner: { type: Object, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

// Hiển thị pool Pokémon của banner (data-driven — tự cập nhật khi thêm/bớt Pokémon)
const poolLabel = computed(() => {
  const pool = getBannerSpeciesPool(props.banner)
  if (props.banner.includeStandard) return `Tất cả ${pool.length} Pokémon (thường + huyền thoại)`
  if (pool.length <= 6) return pool.map((s) => s.name).join(', ')
  return `Tất cả ${pool.length} Pokémon thường`
})

// Hiển thị danh sách rate-up (nếu có): các Pokémon đặc trưng của banner, tỷ lệ x2
const rateUpLabel = computed(() => {
  if (!props.banner.rateUp || !props.banner.pokemons || props.banner.pokemons.length === 0) return ''
  const weight = props.banner.rateUpWeight || 2
  return `⭐ Rate-up (x${weight}): ${props.banner.pokemons.join(', ')}`
})

// Sprite đại diện: 3 loài đặc trưng của banner
const featured = computed(() => {
  const pool = getBannerSpeciesPool(props.banner)
  const names = props.banner.pokemons?.length ? props.banner.pokemons : pool.map((s) => s.name)
  return pool.filter((s) => names.includes(s.name)).slice(0, 3)
})

function currencyIcon(banner) {
  return banner.currency === 'gems' ? '💎' : '🎟️'
}

function currencyName(banner) {
  return banner.currency === 'gems' ? 'Gem' : 'PokePoint'
}
</script>

<template>
  <button
    @click="emit('select', banner.id)"
    class="relative flex-1 rounded-xl border-2 p-4 text-left transition"
    :class="
      active
        ? 'border-amber-500 bg-white shadow-lg shadow-amber-500/10'
        : 'border-slate-200 bg-white/80 hover:border-slate-400'
    "
  >
    <span
      v-if="banner.ribbon"
      class="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-red-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow"
    >
      {{ banner.ribbon }}
    </span>

    <div class="mb-1 flex items-center gap-2">
      <div v-if="featured.length" class="flex -space-x-2">
        <PokeSprite
          v-for="s in featured"
          :key="s.name"
          :name="s.name"
          :type="s.type"
          :size-class="'h-10 w-10'"
          :img-class="'h-10 w-10'"
          :rounded="'rounded-full'"
        />
      </div>
      <div class="text-sm font-bold text-slate-800">{{ banner.name }}</div>
    </div>

    <div class="mb-1 text-xs text-amber-600">🔥 Đặc trưng: <b>{{ poolLabel }}</b></div>
    <div v-if="rateUpLabel" class="mb-1 text-xs text-fuchsia-600">{{ rateUpLabel }}</div>
    <div class="text-xs text-slate-500">
      Giá: {{ currencyIcon(banner) }} {{ banner.cost }} {{ currencyName(banner) }} / Lượt
    </div>
  </button>
</template>
