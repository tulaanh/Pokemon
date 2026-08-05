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
  getBatchSellInfo,
  sellPokemonBatch,
} from '../game/inventory.js'
import { showToast, confirmModal } from '../components/ui/toast.js'
import { useRubberBandSelect } from '../composables/useRubberBandSelect.js'
import PokeSprite from '../components/PokeSprite.vue'
import RarityText from '../components/RarityText.vue'
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

const sortOptions = [
  { value: 'default', label: '-- Sắp xếp --' },
  { value: 'level-desc', label: 'Cấp độ (Cao -> Thấp)' },
  { value: 'level-asc', label: 'Cấp độ (Thấp -> Cao)' },
  { value: 'rarity-desc', label: 'Độ hiếm (Cao -> Thấp)' },
  { value: 'rarity-asc', label: 'Độ hiếm (Thấp -> Cao)' },
  { value: 'type', label: 'Theo Hệ (Type)' },
]

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
  if (!quickSellMode.value) return
  if (justDragged.value) {
    justDragged.value = false
    return
  }
  toggleSelect(item.pokemon)
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
  <div class="mx-auto max-w-6xl">
    <div class="app-card p-6 text-center">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-lg font-bold text-slate-800">📦 Kho Đồ</h3>
        <span class="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          🎒 Pokémon: {{ store.team.length }}/{{ INVENTORY_LIMIT }}
        </span>
      </div>

      <div v-if="store.pendingInventory.length > 0" class="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
        ⏳ Có {{ store.pendingInventory.length }} Pokémon đang chờ nhập kho (kho đã đầy khi quay gacha).
        Bán hoặc hợp nhất để giải phóng chỗ — chúng sẽ tự vào kho.
      </div>

      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-lg font-bold text-slate-700">🎒 Kho Pokémon</h4>
          <div class="flex items-center gap-2">
            <select v-model="store.sortBy" class="app-select text-xs">
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <button
              @click="toggleQuickSellMode"
              class="rounded-lg border px-2.5 py-1.5 text-xs font-bold transition"
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
              class="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              🗑️ Bán trùng ({{ duplicateInfo.count }})
            </button>
          </div>
        </div>

        <div v-if="store.team.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          Kho Pokémon đang trống.
        </div>
        <div v-else class="-mx-5 px-5 -my-2 py-2" :class="quickSellMode ? 'cursor-crosshair touch-none select-none' : ''" @pointerdown="onDown" @dragstart.prevent>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="item in processedList"
            :key="getPokemonUniqueId(item.pokemon)"
            :ref="(el) => setCardRef(el, getPokemonUniqueId(item.pokemon))"
            class="relative flex min-h-44 flex-col items-center gap-2 rounded-xl border p-3 text-center transition"
            :class="
              quickSellMode
                ? isSelected(item.pokemon)
                  ? 'cursor-pointer border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300'
                  : 'cursor-pointer border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40'
                : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm'
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
            <div class="flex min-w-0 flex-col items-center gap-2">
              <PokeSprite :name="item.pokemon.name" :type="item.pokemon.type" :size-class="'h-11 w-11'" :img-class="'h-11 w-11'" :rounded="'rounded-full'" />
              <div class="min-w-0 max-w-full text-center">
                <div class="truncate text-sm font-bold">
                  <RarityText
                    :rarity="item.pokemon.rarity"
                    :label="displayNameByIndex[item.index] || item.pokemon.name"
                  />
                </div>
                <div class="text-xs text-slate-500">Lv.{{ item.pokemon.level }} · {{ item.pokemon.rarity?.name || 'Common' }} · {{ item.pokemon.type }}</div>
                <div class="text-[11px] text-slate-400">HP {{ item.pokemon.hp }}/{{ item.pokemon.maxHp }} · ATK {{ item.pokemon.atk }}</div>
              </div>
            </div>
            <button
              @pointerdown.stop
              @click.stop="onQuickSell(item.pokemon)"
              :disabled="store.team.length <= 1 || quickSellMode"
              :title="`Bán lấy ${getSellPrice(item.pokemon).toLocaleString('en-US')} Vàng`"
              class="mt-auto shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              🗑️ Bán
            </button>
          </div>
          </div>
        </div>
      </div>

      <!-- HÀNG CHỜ NHẬP KHO -->
      <div v-if="store.pendingInventory.length > 0" class="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-5">
        <h4 class="text-lg font-bold text-amber-700">⏳ Pokémon Đang Chờ Nhập Kho ({{ store.pendingInventory.length }})</h4>
        <p class="mb-3 text-xs text-amber-600/80">
          Kho đã đầy nên chúng đang chờ ở đây. Bán hoặc hợp nhất để giải phóng chỗ — Pokémon sẽ tự vào kho theo thứ tự.
        </p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="p in store.pendingInventory"
            :key="getPokemonUniqueId(p)"
            class="flex items-center gap-2 rounded-xl border border-amber-200 bg-white p-2 text-center"
          >
            <PokeSprite :name="p.name" :type="p.type" :size-class="'h-9 w-9'" :img-class="'h-9 w-9'" :rounded="'rounded-full'" />
            <div class="min-w-0 text-left">
              <div class="truncate text-xs font-bold"><RarityText :rarity="p.rarity" :label="`[${p.rarity?.name || 'Common'}] ${p.name}`" /></div>
              <div class="text-[11px] text-slate-500">Lv.{{ p.level }} · Hệ {{ p.type }}</div>
            </div>
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