<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { store } from '../game/store.js'
import { sendPickUpdate, sendPickReady, setPvPCallbacks, clearPvPCallbacks } from '../game/pvp/wsClient.js'
import { showToast } from '../components/ui/toast.js'
import PokeSprite from '../components/PokeSprite.vue'
import RarityText from '../components/RarityText.vue'
import TypeBadge from '../components/poke/TypeBadge.vue'
import PvpPlayerIdentity from '../components/pvp/PvpPlayerIdentity.vue'

const props = defineProps({ payload: { type: Object, default: () => ({}) } })
const emit = defineEmits(['open', 'close'])

const battleId = computed(() => props.payload?.battleId || props.payload?.id || 'pending')
const opponent = computed(() => props.payload?.opponent || { name: 'Đối thủ', elo: '???' })
const pickSize = computed(() => props.payload?.pickSize || 3)
const pickTotal = computed(() => props.payload?.pickTotal || 30)
const pickDeadline = computed(() => props.payload?.pickDeadline || Date.now() + pickTotal.value * 1000)

const now = ref(Date.now())
const selected = ref([])
const opponentPicks = ref([])
const started = ref(false)
const aborted = ref(false)

const availablePokemon = computed(() => store.team.filter((p) => p && p.hp > 0))
const secondsLeft = computed(() => Math.max(0, Math.ceil((pickDeadline.value - now.value) / 1000)))
const timeUp = computed(() => secondsLeft.value <= 0)
const progress = computed(() => Math.max(0, Math.min(100, (secondsLeft.value / pickTotal.value) * 100)))

let timer = null
let pickSendTimer = null

function hpPct(pokemon) {
  if (!pokemon?.maxHp) return 0
  return Math.max(0, Math.min(100, Math.round((pokemon.hp / pokemon.maxHp) * 100)))
}

function displayType(pokemon) {
  return pokemon?.type || pokemon?.types?.[0] || 'Normal'
}

function buildSummary(pokemon) {
  return {
    id: pokemon.id,
    speciesId: pokemon.speciesId,
    name: pokemon.name,
    level: pokemon.level,
    hp: pokemon.hp,
    maxHp: pokemon.maxHp,
    atk: pokemon.atk,
    def: pokemon.def,
    spa: pokemon.spa,
    spd: pokemon.spd,
    spe: pokemon.spe,
    type: pokemon.type,
    types: pokemon.types,
    rarity: pokemon.rarity,
    skills: pokemon.skills?.map((s) => ({ id: s.id, pp: s.pp, maxPp: s.maxPp, currentCd: s.currentCd })) || [],
    passive: pokemon.passive,
    talents: pokemon.talents,
  }
}

function isSelected(pokemon) {
  return selected.value.some((p) => p.id === pokemon.id)
}

function getSlotIndex(pokemon) {
  return selected.value.findIndex((p) => p.id === pokemon.id)
}

function toggle(pokemon) {
  if (started.value || aborted.value || timeUp.value) return
  const idx = selected.value.findIndex((p) => p.id === pokemon.id)
  if (idx >= 0) {
    selected.value.splice(idx, 1)
  } else if (selected.value.length < pickSize.value) {
    selected.value.push(pokemon)
  } else {
    showToast(`⚠️ Chỉ được chọn tối đa ${pickSize.value} Pokémon`, 'warning')
    return
  }
  schedulePickSend()
}

function schedulePickSend() {
  if (pickSendTimer) clearTimeout(pickSendTimer)
  pickSendTimer = setTimeout(() => {
    sendPickUpdate(battleId.value, selected.value.map(buildSummary))
  }, 300)
}

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 250)
  sendPickReady(battleId.value, availablePokemon.value.map(buildSummary))
  setPvPCallbacks({
    onPickOpponentUpdate: (payload) => {
      if (payload.battleId && payload.battleId !== battleId.value) return
      opponentPicks.value = Array.isArray(payload.team) ? payload.team : []
    },
    onPickAborted: (payload) => {
      if (payload.battleId && payload.battleId !== battleId.value) return
      aborted.value = true
      showToast(`❌ ${payload.message || 'Trận đấu bị hủy.'}`, 'error')
      emit('close')
    },
    onOpponentDisconnected: () => {
      aborted.value = true
      showToast('⚠️ Đối thủ mất kết nối. Trận đấu bị hủy.', 'warning')
      emit('close')
    },
    onBattleStart: (payload) => {
      if (payload.battleId && payload.battleId !== battleId.value) return
      started.value = true
      emit('open', 'pvp_battle', payload)
    },
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (pickSendTimer) clearTimeout(pickSendTimer)
  clearPvPCallbacks()
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
    <div class="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up">
      <!-- Header + đếm ngược -->
      <div class="border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="text-3xl">⚔️</span>
            <div>
              <h2 class="text-xl font-bold">Chọn Đội Hình PvP</h2>
              <p class="text-xs text-indigo-100">Chọn 1–{{ pickSize }} Pokémon còn sống. Cả 2 bên đều thấy được đội hình của nhau.</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-3xl font-black tabular-nums" :class="timeUp ? 'text-amber-300' : 'text-white'">{{ timeUp ? '0' : secondsLeft }}<span class="text-sm font-bold">s</span></div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-indigo-100">{{ timeUp ? 'Đang bắt đầu trận đấu...' : 'Còn lại' }}</div>
          </div>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
          <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-250" :style="{ width: progress + '%' }" />
        </div>
      </div>

      <!-- Bạn vs Đối thủ -->
      <div class="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div class="rounded-xl border border-sky-200 bg-white p-3 shadow-sm">
          <PvpPlayerIdentity mine />
          <div class="mt-2 flex gap-2">
            <div v-for="i in pickSize" :key="'me-' + i" class="flex-1 rounded-lg border-2 border-dashed p-1.5 text-center"
              :class="selected[i - 1] ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-slate-50'">
              <template v-if="selected[i - 1]">
                <PokeSprite :name="selected[i - 1].name" :type="displayType(selected[i - 1])" :size-class="'mx-auto h-10 w-10'" :img-class="'h-10 w-10'" rounded="rounded-full" />
                <RarityText :rarity="selected[i - 1].rarity" :label="selected[i - 1].name" class="mt-1 block truncate text-[10px] font-black" />
                <div class="text-[9px] font-bold text-slate-500">Lv.{{ selected[i - 1].level }}</div>
              </template>
              <span v-else class="flex h-16 items-center justify-center text-xl text-slate-300">+</span>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-rose-200 bg-white p-3 shadow-sm">
          <PvpPlayerIdentity :player="opponent" />
          <div class="mt-2 flex gap-2">
            <div v-for="i in pickSize" :key="'op-' + i" class="flex-1 rounded-lg border-2 border-dashed p-1.5 text-center"
              :class="opponentPicks[i - 1] ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50'">
              <template v-if="opponentPicks[i - 1]">
                <PokeSprite :name="opponentPicks[i - 1].name" :type="displayType(opponentPicks[i - 1])" :size-class="'mx-auto h-10 w-10'" :img-class="'h-10 w-10'" rounded="rounded-full" />
                <RarityText :rarity="opponentPicks[i - 1].rarity" :label="opponentPicks[i - 1].name" class="mt-1 block truncate text-[10px] font-black" />
                <div class="text-[9px] font-bold text-slate-500">Lv.{{ opponentPicks[i - 1].level }}</div>
              </template>
              <span v-else class="flex h-16 items-center justify-center text-xl text-slate-300">?</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Kho Pokémon còn sống -->
      <div class="flex-1 overflow-y-auto p-4">
        <h3 class="mb-3 flex items-center justify-between text-sm font-bold text-slate-600">
          <span>🎒 Pokémon còn sống ({{ selected.length }}/{{ pickSize }} đã chọn)</span>
          <span v-if="timeUp && !started" class="text-amber-600">Đang bắt đầu trận đấu...</span>
        </h3>
        <div v-if="availablePokemon.length === 0" class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          Không có Pokémon nào còn HP! Hãy hồi phục tại Bệnh viện trước khi PvP.
        </div>
        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <button
            v-for="poke in availablePokemon"
            :key="poke.id"
            type="button"
            @click="toggle(poke)"
            :disabled="timeUp || started || aborted"
            class="relative rounded-xl border bg-white p-2.5 text-left shadow-sm transition hover:scale-105"
            :class="isSelected(poke) ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'"
          >
            <div v-if="isSelected(poke)" class="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-white">
              {{ getSlotIndex(poke) + 1 }}
            </div>
            <div class="flex items-center gap-2">
              <PokeSprite :name="poke.name" :type="displayType(poke)" :size-class="'h-10 w-10'" :img-class="'h-10 w-10'" rounded="rounded-full" />
              <div class="min-w-0 flex-1">
                <RarityText :rarity="poke.rarity" :label="poke.name" class="block truncate text-xs font-black" />
                <div class="mt-0.5 text-[10px] font-bold text-slate-500">Lv.{{ poke.level }} <TypeBadge class="ml-1" :type="displayType(poke)" /></div>
              </div>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full rounded-full bg-emerald-500" :style="{ width: hpPct(poke) + '%' }" />
            </div>
            <div class="mt-1 text-[9px] font-bold text-slate-500">HP {{ poke.hp }}/{{ poke.maxHp }}</div>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
        Hết giờ nếu chưa chọn con nào, hệ thống sẽ tự lấy 3 con còn sống đầu tiên để vào trận.
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
