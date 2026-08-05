<script setup>
import { ref, computed } from 'vue'
import { INVENTORY_LIMIT } from '../game/data.js'
import { store } from '../game/store.js'
import { useCandyOnPokemon, useStoneOnPokemon, getPokeballCatalog } from '../game/shop.js'
import { POKEMON_SPECIES } from '../game/data.js'
import {
  getFormattedInventory,
  filterAndSortTeam,
  getPokemonUniqueId,
  getSellPrice,
  sellPokemon,
  sellDuplicates,
  getDuplicateSellInfo,
} from '../game/inventory.js'
import { showToast, confirmModal } from '../components/ui/toast.js'
import PokeSprite from '../components/PokeSprite.vue'
import CandyUseModal from '../components/shop/CandyUseModal.vue'
import StoneUseModal from '../components/shop/StoneUseModal.vue'
import SkillSelectModal from '../components/shop/SkillSelectModal.vue'

const useOpen = ref(false)
const stoneOpen = ref(false)
const feedback = ref('')

// Pokéball catalog (để hiển thị số lượng trong kho)
const pokeballCatalog = computed(() => getPokeballCatalog())

// Sự kiện tiến hóa (khi dùng Kẹo chạm mốc level / dùng đá)
const evolutionEvent = ref(null)

// Sự kiện chọn kỹ năng mới (khi dùng Kẹo chạm mốc level chia hết cho 5)
const skillEvent = ref(null)

const processedList = computed(() => filterAndSortTeam())
const displayNameByIndex = computed(() => {
  const map = {}
  getFormattedInventory().forEach((item) => {
    map[item.index] = item.displayName
  })
  return map
})
const duplicateInfo = computed(() => getDuplicateSellInfo())
const hasDuplicates = computed(() => duplicateInfo.value.count > 0)

async function onQuickSell(poke) {
  const price = getSellPrice(poke)
  const ok = await confirmModal(`Bán ${poke.name} lấy ${price.toLocaleString('en-US')} Vàng?`, {
    title: 'Bán Pokémon',
    okText: 'Bán',
    danger: true,
  })
  if (!ok) return

  const result = sellPokemon(getPokemonUniqueId(poke), 'gold')
  if (result.ok) showToast(result.message, 'success')
  else showToast(result.message, 'error')
}

async function onSellDuplicates() {
  const info = duplicateInfo.value
  if (info.count === 0) return

  const ok = await confirmModal(
    `Bán ${info.count} Pokémon trùng lặp lấy ${info.gold.toLocaleString('en-US')} Vàng? (Giữ lại 1 con mỗi loại)`,
    { title: 'Bán trùng lặp', okText: 'Bán hết', danger: true },
  )
  if (!ok) return

  const result = sellDuplicates()
  showToast(result.message, result.ok ? 'success' : 'error')
}

function onUseCandy(teamIdx) {
  const result = useCandyOnPokemon(teamIdx)
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }

  if (result.evolved && result.evolved.length > 0) {
    const last = result.evolved[result.evolved.length - 1]
    const fromType = POKEMON_SPECIES.find((s) => s.name === last.from)?.type
    const nextType = POKEMON_SPECIES.find((s) => s.name === last.next)?.type
    evolutionEvent.value = { from: last.from, next: last.next, fromType, nextType }
  }

  if (result.needsSkillSelect) {
    skillEvent.value = {
      poke: result.poke,
      skillGroups: result.skillGroups,
      level: result.level,
      title: `🔥 CẤP ${result.poke.level}: CHỌN HỌC KỸ NĂNG MỚI`,
    }
    useOpen.value = false
  } else {
    feedback.value = `🍬 Đã sử dụng Kẹo Kinh Nghiệm! ${result.poke.name} lên cấp ${result.poke.level}!`
    showToast(`🍬 ${result.poke.name} lên cấp ${result.poke.level}!`, 'success')
    setTimeout(() => (feedback.value = ''), 4000)
  }
}

function onUseStone({ idx, branch }) {
  const result = useStoneOnPokemon(idx, branch)
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }
  const fromType = POKEMON_SPECIES.find((s) => s.name === result.result.from)?.type
  const nextType = POKEMON_SPECIES.find((s) => s.name === result.result.next)?.type
  evolutionEvent.value = {
    from: result.result.from,
    next: result.result.next,
    fromType,
    nextType,
    stoneEmoji: result.stone ? result.stone.emoji : '💎',
  }
  stoneOpen.value = false
  feedback.value = result.message
  showToast(result.message, 'success')
  setTimeout(() => (feedback.value = ''), 5000)
}

function onSkillLearned(message) {
  skillEvent.value = null
  feedback.value = message
  showToast(message, 'success')
  setTimeout(() => (feedback.value = ''), 5000)
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <div class="app-card p-6 text-center">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-lg font-bold text-slate-800">📦 Kho Đồ</h3>
        <span class="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          🎒 Pokémon: {{ store.team.length }}/{{ INVENTORY_LIMIT }}
        </span>
      </div>

      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-lg font-bold text-slate-700">🎒 Kho Pokémon</h4>
          <button
            v-if="hasDuplicates"
            @click="onSellDuplicates"
            class="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
          >
            🗑️ Bán trùng ({{ duplicateInfo.count }})
          </button>
        </div>

        <div v-if="store.team.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          Kho Pokémon đang trống.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in processedList"
            :key="getPokemonUniqueId(item.pokemon)"
            class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div class="flex min-w-0 items-center gap-2">
              <PokeSprite :name="item.pokemon.name" :type="item.pokemon.type" :size-class="'h-11 w-11'" :img-class="'h-11 w-11'" :rounded="'rounded-full'" />
              <div class="min-w-0 text-left">
                <div class="truncate text-sm font-bold text-slate-800">{{ displayNameByIndex[item.index] || item.pokemon.name }}</div>
                <div class="text-xs text-slate-500">Lv.{{ item.pokemon.level }} · {{ item.pokemon.rarity?.name || 'Common' }} · {{ item.pokemon.type }}</div>
                <div class="text-[11px] text-slate-400">HP {{ item.pokemon.hp }}/{{ item.pokemon.maxHp }} · ATK {{ item.pokemon.atk }}</div>
              </div>
            </div>
            <button
              @click="onQuickSell(item.pokemon)"
              :disabled="store.team.length <= 1"
              :title="`Bán lấy ${getSellPrice(item.pokemon).toLocaleString('en-US')} Vàng`"
              class="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              🗑️ Bán nhanh
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h4 class="text-lg font-bold text-purple-600">🍬 Kẹo Kinh Nghiệm</h4>
        <p class="text-base text-slate-700">Số lượng: <b class="text-purple-600">{{ store.inventory.candy }}</b> viên</p>
        <button
          @click="useOpen = true"
          :disabled="store.inventory.candy <= 0"
          class="mt-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 px-5 py-2.5 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          🍬 Sử Dụng Kẹo
        </button>
      </div>

      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h4 class="text-lg font-bold text-amber-600">💎 Đá Tiến Hóa</h4>
        <p class="mt-1 text-sm text-slate-700">
          Đá Lửa: <b class="text-amber-600">{{ store.inventory.fire_stone || 0 }}</b> |
          Đá Nước: <b class="text-sky-600">{{ store.inventory.water_stone || 0 }}</b> |
          Đá Sét: <b class="text-yellow-600">{{ store.inventory.thunder_stone || 0 }}</b> |
          Đá Lá: <b class="text-green-600">{{ store.inventory.leaf_stone || 0 }}</b> |
          Đá Cứng: <b class="text-slate-600">{{ store.inventory.rock_stone || 0 }}</b>
        </p>
        <button
          @click="stoneOpen = true"
          class="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-black text-white transition hover:brightness-110"
        >
          💎 Sử Dụng Đá Tiến Hóa
        </button>
      </div>

      <!-- POKÉBALL TRONG KHO -->
      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h4 class="text-lg font-bold text-red-600">🔴 Pokéball</h4>
        <p class="my-2 text-xs text-slate-500">Số lượng các loại Pokéball trong kho. Dùng để bắt Pokémon hoang dã.</p>

        <div class="mt-3 space-y-2">
          <div
            v-for="ball in pokeballCatalog"
            :key="ball.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
                <img :src="ball.icon" :alt="ball.name" class="h-8 w-8 shrink-0 object-contain" />
                <span>{{ ball.name }}</span>
              </div>
              <div class="text-[11px] text-slate-500">{{ ball.description }}</div>
              <div class="mt-0.5 text-xs text-slate-600">
                Số lượng: <b class="text-red-600">{{ ball.count }}</b>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <div class="text-xs text-slate-500">Giá mua: {{ ball.price.toLocaleString() }} 💰</div>
              <div class="text-[10px] text-slate-400">Hệ số bắt: {{ ball.catchRate >= 255 ? '100%' : 'x' + ball.catchRate }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="evolutionEvent" class="mt-3 rounded-2xl border border-amber-400/70 bg-gradient-to-r from-amber-50 to-orange-50 p-5 text-center shadow-lg">
        <div class="text-3xl">{{ evolutionEvent.stoneEmoji || '🔥' }}</div>
        <div class="mt-1 text-sm font-black tracking-widest text-amber-600">TIẾN HÓA!</div>
        <div class="mt-2 flex items-center justify-center gap-3">
          <PokeSprite :name="evolutionEvent.from" :type="evolutionEvent.fromType" :size-class="'h-16 w-16'" :img-class="'h-16 w-16'" :rounded="'rounded-full'" />
          <span class="text-2xl font-black text-amber-500">➜</span>
          <PokeSprite :name="evolutionEvent.next" :type="evolutionEvent.nextType" :size-class="'h-16 w-16'" :img-class="'h-16 w-16'" :rounded="'rounded-full'" />
        </div>
        <div class="mt-1 text-lg font-black text-slate-800">
          <span class="text-slate-500">{{ evolutionEvent.from }}</span>
          <span class="mx-2 text-amber-500">➜</span>
          <span class="text-amber-600">{{ evolutionEvent.next }}</span>
        </div>
        <small class="mt-1 block text-xs text-slate-500">Chỉ số tăng vọt (+60% HP/ATK/DEF, +30% SPD mỗi bậc) — giữ nguyên V-Level và kỹ năng!</small>
      </div>

      <div v-if="feedback" class="mt-3 rounded-xl border border-emerald-400/60 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-600">
        {{ feedback }}
      </div>
    </div>

    <CandyUseModal :open="useOpen" @close="useOpen = false" @use="onUseCandy" />

    <StoneUseModal :open="stoneOpen" @close="stoneOpen = false" @use="onUseStone" />

    <SkillSelectModal
      v-if="skillEvent"
      :open="true"
      :poke="skillEvent.poke"
      :skillGroups="skillEvent.skillGroups"
      :level="skillEvent.level"
      :title="skillEvent.title"
      @close="skillEvent = null"
      @learned="onSkillLearned"
    />
  </div>
</template>