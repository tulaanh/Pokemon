<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { store } from '../game/store.js'
import { forfeitBattle, sendBattleAction, setPvPCallbacks, clearPvPCallbacks, reconnectBattle } from '../game/pvp/wsClient.js'
import { showToast } from '../components/ui/toast.js'

const props = defineProps({
  payload: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['back'])

const battleId = computed(() => props.payload?.battleId || props.payload?.id || 'pending')
const opponent = computed(() => props.payload?.opponent || { name: 'Đối thủ', elo: '???' })
const battleState = ref(props.payload?.state || null)
const nextActor = ref(props.payload?.nextActor || 'you')
const deadline = ref(props.payload?.deadline || Date.now() + 30000)
const disconnected = ref(false)
const finished = ref(false)
const result = ref(null)
const now = ref(Date.now())
let timer = null

const secondsLeft = computed(() => Math.max(0, Math.ceil((deadline.value - now.value) / 1000)))
const isMyTurn = computed(() => nextActor.value === 'you' || nextActor.value === store.gameState.player.playerName)

function sendAction(type, extra = {}) {
  if (!isMyTurn.value || finished.value) return
  sendBattleAction(battleId.value, { type, ...extra })
  showToast('📡 Đã gửi hành động lên server, đang chờ xác nhận...', 'info')
}

function forfeit() {
  if (finished.value) return
  forfeitBattle(battleId.value)
  showToast('🏳️ Đã gửi yêu cầu xin thua', 'warning')
}

function reconnect() {
  reconnectBattle(battleId.value)
  showToast('🔄 Đang xin kết nối lại trận đấu...', 'info')
}

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 250)
  setPvPCallbacks({
    onTurnResult: (payload) => {
      if (payload.battleId && payload.battleId !== battleId.value) return
      battleState.value = payload.state || battleState.value
      nextActor.value = payload.nextActor || nextActor.value
      deadline.value = payload.deadline || Date.now() + 30000
      disconnected.value = false
    },
    onBattleEnd: (payload) => {
      if (payload.battleId && payload.battleId !== battleId.value) return
      finished.value = true
      result.value = payload
      showToast(payload.winner === 'you' ? '🏆 Bạn đã thắng PvP!' : payload.winner === 'draw' ? '🤝 Trận đấu hòa!' : '💀 Bạn đã thua PvP', 'info')
    },
    onOpponentDisconnected: () => {
      disconnected.value = true
      showToast('⚠️ Đối thủ mất kết nối. Chờ reconnect trong 30 giây.', 'warning')
    },
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  clearPvPCallbacks()
})
</script>

<template>
  <section class="space-y-5">
    <div class="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 p-5 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-bold text-indigo-600">⚔️ Server-authoritative Battle</p>
          <h1 class="text-2xl font-black text-slate-900">Trận PvP Online</h1>
          <p class="text-sm text-slate-600">Battle ID: <span class="font-mono">{{ battleId }}</span></p>
        </div>
        <button @click="forfeit" class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white shadow hover:bg-rose-700">
          🏳️ Xin thua
        </button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl border border-emerald-200 bg-white p-5 text-center shadow-sm">
        <div class="text-sm font-bold text-slate-500">Bạn</div>
        <div class="text-xl font-black text-emerald-600">{{ store.gameState.player.playerName || 'Player' }}</div>
        <div class="text-xs text-slate-500">ELO {{ store.pvp.elo }}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-center text-white shadow-sm">
        <div class="text-xs font-bold uppercase text-slate-300">Lượt hiện tại</div>
        <div class="mt-1 text-2xl font-black" :class="isMyTurn ? 'text-emerald-300' : 'text-amber-300'">
          {{ isMyTurn ? 'Đến lượt bạn' : 'Chờ đối thủ' }}
        </div>
        <div class="mt-2 text-sm text-slate-300">⏱️ {{ secondsLeft }}s</div>
      </div>
      <div class="rounded-2xl border border-rose-200 bg-white p-5 text-center shadow-sm">
        <div class="text-sm font-bold text-slate-500">Đối thủ</div>
        <div class="text-xl font-black text-rose-600">{{ opponent.name }}</div>
        <div class="text-xs text-slate-500">ELO {{ opponent.elo }}</div>
      </div>
    </div>

    <div v-if="disconnected" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><b>⚠️ Đối thủ mất kết nối.</b> Server giữ trận trong cửa sổ reconnect 30 giây.</div>
        <button @click="reconnect" class="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white">Kết nối lại</button>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="mb-3 text-lg font-black text-slate-900">Hành động lượt</h2>
      <p class="mb-4 text-sm text-slate-500">Client chỉ gửi action; damage/trạng thái do server tính và broadcast `turn_result`.</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button v-for="i in 4" :key="i" @click="sendAction('skill', { skillIndex: i - 1 })" :disabled="!isMyTurn || finished" class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40">
          Kỹ năng {{ i }}
        </button>
        <button @click="sendAction('switch')" :disabled="!isMyTurn || finished" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
          🔁 Đổi Pokémon
        </button>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="mb-3 text-lg font-black text-slate-900">State từ server</h2>
      <pre class="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{{ JSON.stringify(battleState || props.payload, null, 2) }}</pre>
    </div>

    <div v-if="finished" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-800">
      <div class="text-4xl">{{ result?.winner === 'you' ? '🏆' : result?.winner === 'draw' ? '🤝' : '💀' }}</div>
      <h2 class="mt-2 text-xl font-black">Trận đấu đã kết thúc</h2>
      <p class="text-sm">ELO: {{ result?.eloChange?.you >= 0 ? '+' : '' }}{{ result?.eloChange?.you || 0 }} · Replay: {{ result?.replayId || 'đang chờ' }}</p>
      <button @click="emit('back')" class="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white">Về bản đồ</button>
    </div>
  </section>
</template>