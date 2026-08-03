<script setup>
import { computed } from 'vue'
import { SHOP_ITEMS, POKEMON_SPECIES } from '../../game/data.js'
import { store, saveGameState } from '../../game/store.js'
import { redeemPokemon } from '../../game/gacha.js'
import { showToast } from '../ui/toast.js'
import RarityText from '../RarityText.vue'
import PokeSprite from '../PokeSprite.vue'

const props = defineProps({
  bannerId: { type: String, required: true },
})

const emit = defineEmits(['redeemed'])

const shopItems = computed(() =>
  SHOP_ITEMS.filter((item) => item.bannerId === props.bannerId).map((item) => {
    const species = POKEMON_SPECIES.find((s) => s.name === item.name)
    return { ...item, type: species?.type || '' }
  }),
)

function onRedeem(item) {
  const result = redeemPokemon(item.name, item.cost, item.rarityName)
  showToast(result.message, result.ok ? 'success' : 'error')
  if (result.ok) {
    saveGameState()
    emit('redeemed', result.poke)
  }
}
</script>

<template>
  <div>
    <h3 class="mb-1.5 flex items-center justify-between text-base font-bold text-emerald-600">
      <span>🎫 Cửa Hàng Đổi Điểm (PokeGacha Shop)</span>
      <span class="text-sm font-normal text-slate-500">
        Điểm của bạn: <strong class="text-lg font-bold text-amber-600">{{ store.gameState.player.pokeGacha.toLocaleString('en-US') }}</strong> 🎫
      </span>
    </h3>
    <p class="mb-4 text-left text-xs text-slate-500">
      Sử dụng điểm PokeGacha tích lũy từ các lần quay để đổi trực tiếp Pokémon đặc trưng của các banner!
    </p>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div v-for="item in shopItems" :key="item.name" class="rounded-xl border border-slate-200 bg-white p-4 text-center">
        <div class="flex justify-center">
          <PokeSprite :name="item.name" :type="item.type" :size-class="'h-14 w-14'" :img-class="'h-14 w-14'" :rounded="'rounded-full'" />
        </div>
        <div class="mt-1 text-sm font-bold">
          <RarityText :rarity="item.rarityName" :label="item.name" />
        </div>
        <div class="mb-2 text-[11px] text-slate-500">Độ hiếm: {{ item.rarityName }}</div>
        <div class="mb-3 text-sm font-semibold text-amber-600">🎫 {{ item.cost }} Điểm</div>
        <button
          @click="onRedeem(item)"
          :disabled="store.gameState.player.pokeGacha < item.cost"
          class="w-full rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            store.gameState.player.pokeGacha >= item.cost
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white hover:brightness-110'
              : 'bg-slate-100 text-slate-400'
          "
        >
          {{ store.gameState.player.pokeGacha >= item.cost ? 'Đổi Pokémon' : 'Chưa đủ điểm' }}
        </button>
      </div>

      <div v-if="shopItems.length === 0" class="col-span-full rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
        Banner này không có Pokémon đổi thưởng!
      </div>
    </div>
  </div>
</template>
