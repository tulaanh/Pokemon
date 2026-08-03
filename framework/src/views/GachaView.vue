<script setup>
import { ref, computed } from 'vue'
import { GACHA_BANNERS } from '../game/data.js'
import { rollGacha, getBannerById } from '../game/gacha.js'
import { store } from '../game/store.js'
import { showToast } from '../components/ui/toast.js'
import RarityText from '../components/RarityText.vue'
import PokeSprite from '../components/PokeSprite.vue'
import GachaBannerCard from '../components/gacha/GachaBannerCard.vue'
import GachaRollPanel from '../components/gacha/GachaRollPanel.vue'
import PokeGachaShop from '../components/gacha/PokeGachaShop.vue'
import CheatPanel from '../components/gacha/CheatPanel.vue'

const selectedBannerId = ref('standard')
const lastResult = ref(null)

const activeBanner = computed(() => getBannerById(selectedBannerId.value))
const teamCount = computed(() => store.team.length)

function selectBanner(id) {
  selectedBannerId.value = id
}

function rarityGlow(r) {
  switch (r?.name) {
    case 'Secret':
      return 'ring-2 ring-red-500 shadow-xl shadow-red-500/40'
    case 'Mythic':
      return 'ring-2 ring-red-400 shadow-lg shadow-red-500/30'
    case 'Legendary':
      return 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/30'
    case 'Epic':
      return 'ring-2 ring-purple-300 shadow-md shadow-purple-400/25'
    case 'Rare':
      return 'ring-2 ring-indigo-300 shadow-md shadow-indigo-400/20'
    default:
      return 'ring-1 ring-slate-300 shadow-sm'
  }
}

function handleRoll(times) {
  const result = rollGacha(selectedBannerId.value, times)
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }
  lastResult.value = result
  const best = result.results.reduce((a, b) => (b.rarity.statMult > a.rarity.statMult ? b : a), result.results[0])
  if (best.rarity.name === 'Legendary' || best.rarity.name === 'Mythic' || best.rarity.name === 'Secret') {
    showToast(`🎉 CHÚC MỪNG! Bạn nhận được ${best.rarity.name}: ${best.name}!`, 'success', 5000)
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="app-card p-6">
      <h3 class="text-lg font-bold text-slate-800">🔮 Đài Triệu Hoán Pokémon</h3>
      <p class="mb-5 mt-1 text-sm text-slate-500">
        Dùng PokePoint để chiêu mộ Pokémon mới về đội và nhận PokeGacha tích lũy đổi Pokémon bảo hiểm!
        <span class="text-slate-400">(Kho: {{ teamCount }}/150)</span>
      </p>

      <h4 class="mb-3 text-left text-sm font-semibold text-amber-600">🌟 Chọn Banner Triệu Hoán:</h4>
      <div class="mb-5 flex flex-col gap-4 sm:flex-row">
        <GachaBannerCard
          v-for="banner in GACHA_BANNERS"
          :key="banner.id"
          :banner="banner"
          :active="banner.id === selectedBannerId"
          @select="selectBanner"
        />
      </div>

      <div class="mb-5">
        <GachaRollPanel :banner="activeBanner" @roll="handleRoll" />
      </div>

      <!-- KẾT QUẢ GACHA -->
      <div v-if="lastResult" class="mb-5 text-sm" :key="lastResult.times + '-' + lastResult.results[0].id">
        <template v-if="lastResult.results.length === 1">
          <div class="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-fuchsia-50/60 p-5 text-center">
            <div class="flex justify-center">
              <PokeSprite
                :name="lastResult.results[0].name"
                :type="lastResult.results[0].type"
                :size-class="'h-24 w-24'"
                :img-class="'h-24 w-24'"
                :rounded="'rounded-full'"
                :class="rarityGlow(lastResult.results[0].rarity)"
              />
            </div>
            <div class="mt-2">
              🎉 Bạn nhận được: <RarityText :rarity="lastResult.results[0].rarity" :label="`[${lastResult.results[0].rarity.name}] ${lastResult.results[0].name}`" />
              <span class="text-slate-500"> (Lv.{{ lastResult.results[0].level }}) - Hệ {{ lastResult.results[0].type }}!</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="mb-2 font-bold text-slate-700">🎉 <b>Kết quả quay {{ lastResult.results.length }} lần:</b></div>
          <div class="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-left sm:grid-cols-3">
            <div v-for="p in lastResult.results" :key="p.id" class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2" :class="rarityGlow(p.rarity)">
              <PokeSprite :name="p.name" :type="p.type" :size-class="'h-10 w-10'" :img-class="'h-10 w-10'" :rounded="'rounded-full'" />
              <div class="min-w-0">
                <div class="truncate"><RarityText :rarity="p.rarity" :label="`[${p.rarity.name}] ${p.name}`" /></div>
                <div class="text-[11px] text-slate-500">(Lv.{{ p.level }}) - Hệ {{ p.type }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="border-t border-slate-200 pt-5">
        <PokeGachaShop :banner-id="selectedBannerId" />
      </div>
    </div>

    <div class="mt-4">
      <CheatPanel />
    </div>
  </div>
</template>
