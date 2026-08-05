<script setup>
import { computed, ref } from 'vue'
import { INVENTORY_LIMIT, POKEDEX_LIMIT } from '../game/data.js'
import { store, saveGameState } from '../game/store.js'
import {
  getFormattedInventory,
  filterAndSortTeam,
  getPokemonUniqueId,
  togglePokedex,
  getSellPrice,
  sellPokemon,
  sellDuplicates,
  getDuplicateSellInfo,
  getBatchSellInfo,
  sellPokemonBatch,
} from '../game/inventory.js'
import { showToast, confirmModal } from '../components/ui/toast.js'
import { useRubberBandSelect } from '../composables/useRubberBandSelect.js'
import RarityText from '../components/RarityText.vue'
import TypeBadge from '../components/poke/TypeBadge.vue'
import PokeSprite from '../components/PokeSprite.vue'
import PokeDetailModal from '../components/poke/PokeDetailModal.vue'
import PokedexModal from '../components/poke/PokedexModal.vue'

const detailPoke = ref(null)
const pokedexOpen = ref(false)

const displayNameByIndex = computed(() => {
  const map = {}
  getFormattedInventory().forEach((f) => (map[f.index] = f.displayName))
  return map
})

const processedList = computed(() => filterAndSortTeam())

const pokedexCount = computed(() => store.gameState.pokedex.length)

const duplicateInfo = computed(() => getDuplicateSellInfo())
const hasDuplicates = computed(() => duplicateInfo.value.count > 0)

// --- CHẾ ĐỘ BÁN NHANH (CHỌN NHIỀU) ---
const quickSellMode = ref(false)
const selected = ref(new Set())
const cardEls = new Map()

function setCardRef(el, uid) {
  if (el) cardEls.set(uid, el)
  else cardEls.delete(uid)
}

const isSelected = (poke) => selected.value.has(getPokemonUniqueId(poke))

const batchInfo = computed(() => getBatchSellInfo(Array.from(selected.value)))

const { rect, justDragged, onDown } = useRubberBandSelect(
  () => cardEls,
  quickSellMode,
  (ids) => {
    const s = new Set(selected.value)
    ids.forEach((uid) => s.add(uid))
    selected.value = s
  },
)

function toggleQuickSellMode() {
  if (quickSellMode.value) {
    quickSellMode.value = false
    selected.value = new Set()
  } else {
    selected.value = new Set()
    quickSellMode.value = true
  }
}

function onCardClick(item) {
  if (justDragged.value) {
    justDragged.value = false
    return
  }
  if (quickSellMode.value) {
    toggleSelect(item.pokemon)
    return
  }
  detailPoke.value = item.pokemon
}

function toggleSelect(poke) {
  const uid = getPokemonUniqueId(poke)
  const s = new Set(selected.value)
  if (s.has(uid)) s.delete(uid)
  else s.add(uid)
  selected.value = s
}

async function onSellSelected() {
  const ids = Array.from(selected.value)
  if (ids.length === 0) return
  const info = batchInfo.value
  let message = `Bán ${info.count} Pokémon lấy ${info.gold.toLocaleString('en-US')} Vàng?`
  if (info.highRarityCount > 0) {
    message += `\n\n⚠️ Có ${info.highRarityCount} Pokémon độ hiếm Legendary trở lên — bạn có chắc muốn bán chúng?`
  }
  const ok = await confirmModal(message, { title: 'Bán nhanh', okText: 'Bán', danger: true })
  if (!ok) return
  const result = sellPokemonBatch(ids)
  showToast(result.message, result.ok ? 'success' : 'error')
  selected.value = new Set()
  if (result.ok) quickSellMode.value = false
}

const sortOptions = [
  { value: 'default', label: '-- Sắp xếp --' },
  { value: 'level-desc', label: 'Cấp độ (Cao -> Thấp)' },
  { value: 'level-asc', label: 'Cấp độ (Thấp -> Cao)' },
  { value: 'rarity-desc', label: 'Độ hiếm (Cao -> Thấp)' },
  { value: 'rarity-asc', label: 'Độ hiếm (Thấp -> Cao)' },
  { value: 'type', label: 'Theo Hệ (Type)' },
]

function onTogglePokedex(poke) {
  const uid = getPokemonUniqueId(poke)
  const result = togglePokedex(uid)
  if (result.full) {
    showToast(`Pokédex đã đầy (${result.count}/${result.count})! Hãy bỏ bớt Pokémon yêu thích để thêm con mới.`, 'warning')
  } else {
    showToast(`${result.in ? 'Đã thêm' : 'Đã gỡ'} ${poke.name} ${result.in ? 'vào' : 'khỏi'} Pokédex!`, 'success')
  }
  saveGameState()
}

async function onQuickSell(poke) {
  const price = getSellPrice(poke)
  const ok = await confirmModal(`Bán ${poke.name} lấy ${price.toLocaleString('en-US')} Vàng?`, {
    title: 'Bán Pokémon',
    okText: 'Bán',
    danger: true,
  })
  if (!ok) return
  const result = sellPokemon(getPokemonUniqueId(poke), 'gold')
  if (!result.ok) showToast(result.message, 'error')
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
  showToast(result.message, 'success')
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="app-card p-6">
      <div class="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <h3 class="text-lg font-bold text-slate-800">🎒 Quản Lý Đội Hình & Kho Pokémon</h3>
        <button
          @click="pokedexOpen = true"
          class="app-btn-primary"
        >
          📖 Pokédex ({{ pokedexCount }}/{{ POKEDEX_LIMIT }})
        </button>
      </div>

      <!-- SEARCH & SORT -->
      <div class="mb-4 flex gap-3">
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="🔍 Tìm theo tên..."
          class="app-input flex-1"
        />
        <select v-model="store.sortBy" class="app-select">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <!-- COUNTER -->
      <div class="mb-4 flex items-center gap-6 rounded-lg bg-slate-100 px-4 py-2 text-xs text-slate-600">
        <span>🎒 Kho Pokémon: <b class="text-slate-800">{{ store.team.length }}/{{ INVENTORY_LIMIT }}</b></span>
        <span v-if="store.pendingInventory.length > 0" class="font-semibold text-amber-600">⏳ Chờ nhập kho: {{ store.pendingInventory.length }}</span>
        <span>⭐ Pokédex: <b class="text-amber-600">{{ pokedexCount }}/{{ POKEDEX_LIMIT }}</b></span>
        <button
          @click="toggleQuickSellMode"
          class="ml-auto rounded-lg border px-2.5 py-1 text-xs font-bold transition"
          :class="
            quickSellMode
              ? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
              : 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
          "
        >
          {{ quickSellMode ? '✕ Thoát bán nhanh' : '⚡ Bán nhanh' }}
        </button>
        <button
          v-if="hasDuplicates"
          @click="onSellDuplicates"
          class="ml-2 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100"
        >
          🗑️ Bán trùng ({{ duplicateInfo.count }}) — {{ duplicateInfo.gold.toLocaleString('en-US') }} 💰
        </button>
      </div>

      <!-- EMPTY STATES -->
      <div v-if="store.team.length === 0" class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
        Kho trống! Hãy sang mục Gacha để quay.
      </div>
      <div v-else-if="processedList.length === 0" class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
        Không tìm thấy Pokémon phù hợp!
      </div>

      <!-- ROSTER LIST -->
      <div v-else class="-mx-6 px-6 -my-2 py-2" :class="quickSellMode ? 'cursor-crosshair touch-none select-none' : ''" @pointerdown="onDown" @dragstart.prevent>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div
          v-for="item in processedList"
          :key="getPokemonUniqueId(item.pokemon)"
          :ref="(el) => setCardRef(el, getPokemonUniqueId(item.pokemon))"
          class="relative cursor-pointer rounded-xl border p-3 transition"
          :class="
            quickSellMode
              ? isSelected(item.pokemon)
                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300'
                : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40'
              : item.index === store.activePokeIdx
                ? 'border-amber-500 bg-amber-50/60 shadow-md shadow-amber-500/10'
                : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
          "
          @click="onCardClick(item)"
        >
          <div
            v-if="quickSellMode"
            class="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-black"
            :class="isSelected(item.pokemon) ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white text-transparent'"
          >
            ✓
          </div>
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <PokeSprite :name="item.pokemon.name" :type="item.pokemon.type" :size-class="'h-11 w-11'" :img-class="'h-11 w-11'" :rounded="'rounded-full'" />
              <div class="min-w-0">
                <RarityText :rarity="item.pokemon.rarity" :label="displayNameByIndex[item.index] || item.pokemon.name" />
                <span v-if="item.pokemon.vLevel > 0" class="ml-1 rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1 text-[10px] font-black text-white">
                  V{{ item.pokemon.vLevel }}
                </span>
                <span class="ml-1 text-xs text-slate-500">(Lv.{{ item.pokemon.level }})</span>
                <TypeBadge class="ml-2" :type="item.pokemon.type" />
                <span v-if="store.gameState.pokedex.includes(getPokemonUniqueId(item.pokemon))" class="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  In Pokédex
                </span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <small class="hidden text-xs text-slate-500 sm:inline">
                HP:{{ item.pokemon.hp }}/{{ item.pokemon.maxHp }} | ATK:{{ item.pokemon.atk }} | SPD:{{ item.pokemon.speed }}
              </small>
              <button
                @pointerdown.stop
                @click.stop="onQuickSell(item.pokemon)"
                :disabled="store.team.length <= 1 || quickSellMode"
                :title="`Bán lấy ${getSellPrice(item.pokemon).toLocaleString('en-US')} Vàng`"
                class="rounded-lg px-2 py-1 text-lg transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                🗑️
              </button>
              <button
                @click.stop="onTogglePokedex(item.pokemon)"
                :title="store.gameState.pokedex.includes(getPokemonUniqueId(item.pokemon)) ? 'Gỡ khỏi Pokédex' : 'Thêm vào Pokédex'"
                class="rounded-lg px-2 py-1 text-lg transition"
                :class="store.gameState.pokedex.includes(getPokemonUniqueId(item.pokemon)) ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'"
              >
                {{ store.gameState.pokedex.includes(getPokemonUniqueId(item.pokemon)) ? '⭐' : '☆' }}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- Ô chọn kéo (rubber band) khi bán nhanh -->
    <div
      v-if="rect"
      class="pointer-events-none fixed z-50 rounded-lg border-2 border-blue-500 bg-blue-500/20"
      :style="{ left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' }"
    ></div>

    <!-- Thanh bán nhanh nổi -->
    <div
      v-if="quickSellMode"
      class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-2xl border border-blue-300 bg-white px-4 py-3 shadow-2xl"
    >
      <span class="text-sm font-bold text-slate-700">⚡ Đã chọn: <b class="text-blue-600">{{ selected.size }}</b></span>
      <span class="text-sm font-bold text-slate-700">Tổng: <b class="text-amber-600">{{ batchInfo.gold.toLocaleString('en-US') }} Vàng 💰</b></span>
      <button
        @click="onSellSelected"
        :disabled="selected.size === 0"
        class="rounded-xl border border-red-300 bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        🗑️ Bán ({{ selected.size }})
      </button>
      <button
        @click="toggleQuickSellMode"
        class="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
      >
        ✕ Thoát
      </button>
    </div>

    <PokeDetailModal :poke="detailPoke" @close="detailPoke = null" @sold="detailPoke = null" />
    <PokedexModal :open="pokedexOpen" @close="pokedexOpen = false" @view="detailPoke = $event" />
  </div>
</template>
