<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { store } from '../game/store.js'
import { connectPvP, disconnectPvP, findMatch, cancelMatch, setPvPCallbacks, clearPvPCallbacks, isConnected, syncPvpLevel } from '../game/pvp/wsClient.js'
import { showToast } from '../components/ui/toast.js'
import PvpPlayerIdentity from '../components/pvp/PvpPlayerIdentity.vue'

const emit = defineEmits(['open', 'close'])

const connecting = ref(false)
const connectionError = ref('')
const inQueue = ref(false)
const queuePosition = ref(0)
const estimatedWait = ref(0)
const matched = ref(false)
const matchData = ref(null)
const maxTeamSize = 3
const queueTimer = ref(null)
const waitTime = ref(0)

// Computed
const aliveCount = computed(() => store.team.filter(p => p && p.hp > 0).length)
const canStartMatchmaking = computed(() => aliveCount >= 1 && !inQueue.value && isConnected())
const myElo = computed(() => store.pvp.elo)
const myRecord = computed(() => `${store.pvp.wins}W / ${store.pvp.losses}L / ${store.pvp.draws}D`)
const winRate = computed(() => {
  const total = store.pvp.wins + store.pvp.losses + store.pvp.draws
  return total > 0 ? Math.round((store.pvp.wins / total) * 100) : 0
})

// Khởi tạo kết nối
async function initConnection() {
  connecting.value = true
  connectionError.value = ''
  try {
    await connectPvP()
    showToast('🌐 Đã kết nối Đấu Trường Trực Tuyến', 'success')
  } catch (e) {
    connectionError.value = e?.message || 'Server PvP chưa hoạt động'
    showToast('⚠️ Server PvP chưa hoạt động. Hãy bật server rồi thử lại.', 'warning')
  } finally {
    connecting.value = false
  }
}

// Đăng ký callbacks
function setupCallbacks() {
  setPvPCallbacks({
    onOpen: () => {
      connectionError.value = ''
    },
    onClose: () => {
      if (inQueue.value) {
        inQueue.value = false
        clearQueueTimer()
      }
    },
    onError: () => {
      connectionError.value = 'Không thể kết nối ws://localhost:8080/pvp. Server PvP có thể chưa chạy.'
    },
    onMatched: (payload) => {
      matched.value = true
      matchData.value = payload
      inQueue.value = false
      clearQueueTimer()
      const pickSeconds = payload.pickDeadline ? Math.max(0, Math.ceil((payload.pickDeadline - Date.now()) / 1000)) : 30
      showToast(`⚔️ Đã tìm thấy đối thủ: ${payload.opponent.name}. Chọn đội hình trong ${pickSeconds} giây!`, 'success')
      emit('open', 'pvp_pick', {
        battleId: payload.battleId || payload.id,
        opponent: payload.opponent,
        format: payload.format,
        pickDeadline: payload.pickDeadline,
        pickSize: payload.pickSize || maxTeamSize,
      })
    },
    onQueueUpdate: (payload) => {
      queuePosition.value = payload.position
      estimatedWait.value = payload.estimatedWaitMs
    },
    onBattleStart: (payload) => {
      // Chuyển sang battle view
      emit('open', 'pvp_battle', payload)
      matched.value = false
    },
    onErrorMsg: (payload) => {
      if (payload.code === 'TEAM_INVALID') {
        showToast('❌ Đội hình không hợp lệ (cần 3 Pokémon, HP > 0)', 'error')
      }
    },
  })
}

function clearQueueTimer() {
  if (queueTimer.value) {
    clearInterval(queueTimer.value)
    queueTimer.value = null
  }
  waitTime.value = 0
}

function startQueueTimer() {
  clearQueueTimer()
  waitTime.value = 0
  queueTimer.value = setInterval(() => {
    waitTime.value++
  }, 1000)
}

// Bắt đầu tìm trận
async function startMatchmaking() {
  if (aliveCount.value < 1) {
    showToast('⚠️ Cần ít nhất 1 Pokémon còn HP để tìm trận', 'warning')
    return
  }
  if (!isConnected()) {
    await initConnection()
    if (!isConnected()) return
  }
  inQueue.value = true
  startQueueTimer()
  syncPvpLevel()
  findMatch('standard')
}

// Hủy tìm trận
function cancelMatchmaking() {
  inQueue.value = false
  clearQueueTimer()
  cancelMatch()
  showToast('❌ Đã hủy tìm trận', 'info')
}

// Đóng lobby
function closeLobby() {
  if (inQueue.value) cancelMatchmaking()
  if (matched.value) matched.value = false
  disconnectPvP()
  clearPvPCallbacks()
  emit('close')
}

// Format thời gian
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

onMounted(() => {
  setupCallbacks()
})

onUnmounted(() => {
  clearQueueTimer()
  clearPvPCallbacks()
})

// Watch queue status để auto-clear khi component unmount
watch(() => inQueue.value, (val) => {
  if (!val) clearQueueTimer()
})
</script>

<template>
  <Transition name="fade">
    <div v-if="!matched" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" @click.self="closeLobby">
      <div class="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col animate-slide-up">
        <!-- Header -->
        <div class="border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🌐</span>
            <div>
              <h2 class="text-xl font-bold text-white">Đấu Trường Trực Tuyến</h2>
              <div class="text-xs text-blue-100">PvP Multiplayer - James Manager</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <!-- Connection status -->
            <div class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium" :class="connecting ? 'bg-yellow-100 text-yellow-800' : (store.pvp.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')">
              <span class="h-1.5 w-1.5 rounded-full" :class="connecting ? 'bg-yellow-500 animate-pulse' : (store.pvp.connected ? 'bg-emerald-500' : 'bg-red-500')"></span>
              {{ connecting ? 'Đang kết nối...' : (store.pvp.connected ? 'Đã kết nối' : 'Chưa kết nối') }}
            </div>
            <button
              v-if="!store.pvp.connected"
              @click="initConnection"
              :disabled="connecting"
              class="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/25 disabled:opacity-50"
            >
              🔄 Thử kết nối
            </button>
            <button @click="closeLobby" class="p-2 rounded-lg hover:bg-white/20 transition" title="Đóng">
              ✕
            </button>
          </div>
        </div>

        <!-- Profile Stats Bar -->
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3 grid grid-cols-4 gap-3 text-center">
          <div class="rounded-lg bg-white p-2 shadow-sm">
            <div class="text-lg font-bold text-indigo-600">{{ myElo }}</div>
            <div class="text-[10px] text-slate-500">ELO</div>
          </div>
          <div class="rounded-lg bg-white p-2 shadow-sm">
            <div class="text-sm font-bold text-slate-700">{{ myRecord }}</div>
            <div class="text-[10px] text-slate-500">Thắng/Thua/Hòa</div>
          </div>
          <div class="rounded-lg bg-white p-2 shadow-sm">
            <div class="text-lg font-bold" :class="winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'">{{ winRate }}%</div>
            <div class="text-[10px] text-slate-500">Tỷ lệ thắng</div>
          </div>
          <div class="rounded-lg bg-white p-2 shadow-sm">
            <div class="text-lg font-bold text-amber-600">{{ store.pvp.streak }}</div>
            <div class="text-[10px] text-slate-500">Chuỗi thắng (Best: {{ store.pvp.bestStreak }})</div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <div v-if="connectionError && !store.pvp.connected" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div class="font-black">⚠️ Server PvP chưa hoạt động</div>
            <div class="mt-1">{{ connectionError }}</div>
            <div class="mt-1 text-xs text-amber-700">Bạn vẫn xem được đội hình/lịch sử, nhưng cần bật backend WebSocket trước khi tìm trận online.</div>
          </div>

          <!-- Sẵn sàng tìm trận -->
          <div v-if="!inQueue" class="space-y-4">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span class="text-xl">👥</span>
              Tìm Trận Đấu PvP
            </h3>
            <p class="text-sm text-slate-500">Sau khi có đối thủ, bạn có <b>30 giây</b> chọn 1–{{ maxTeamSize }} Pokémon từ bộ sưu tập. Cả 2 bên đều thấy được đội hình đối phương đang chọn.</p>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div class="flex items-center justify-between">
                <span>🎒 Pokémon còn HP sẵn sàng chiến đấu</span>
                <b class="text-slate-800">{{ aliveCount }}</b>
              </div>
              <div v-if="aliveCount < 1" class="mt-2 text-xs text-rose-600">Không có Pokémon nào còn HP! Hãy hồi phục tại Bệnh viện hoặc nhận Pokémon mới.</div>
              <div v-else-if="aliveCount < maxTeamSize" class="mt-2 text-xs text-amber-600">Bạn chỉ có {{ aliveCount }} Pokémon còn HP — trận đấu sẽ diễn ra với đội hình ít hơn (bất lợi nhỏ).</div>
            </div>

            <!-- Start Button -->
            <button
              @click="startMatchmaking"
              :disabled="connecting || aliveCount < 1"
              class="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ store.pvp.connected ? '🔍 Tìm Trận Đấu' : '🌐 Kết nối & Tìm Trận' }}
            </button>
          </div>

          <!-- Đang trong hàng đợi -->
          <div v-else-if="inQueue" class="space-y-4 text-center">
            <div class="text-5xl animate-bounce">⏳</div>
            <h3 class="text-xl font-bold text-slate-800">Đang tìm đối thủ...</h3>
            <div class="text-sm text-slate-500">Thời gian chờ: {{ formatTime(waitTime) }}</div>
            <div class="text-sm text-slate-500">Vị trí trong hàng đợi: #{{ queuePosition || '...' }}</div>
            <div class="text-sm text-slate-500">Ước tính: {{ formatTime(Math.ceil(estimatedWait / 1000)) }}</div>
            <div class="h-2 bg-slate-200 rounded-full overflow-hidden mt-4">
              <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" style="width: 100%"></div>
            </div>
            <button @click="cancelMatchmaking" class="mt-4 px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition">
              ❌ Hủy tìm trận
            </button>
          </div>

          <!-- Đã tìm thấy đối thủ (chuyển sang màn chọn đội hình) -->
          <div v-else-if="matched" class="space-y-4 text-center border-2 border-amber-400 bg-amber-50 rounded-2xl p-6">
            <div class="text-5xl animate-pulse">⚔️</div>
            <h3 class="text-xl font-bold text-slate-800">Đã tìm thấy đối thủ!</h3>
            <div class="flex items-center justify-center gap-6 mt-4">
                <div class="min-w-0 max-w-[180px] text-center">
                <div class="mb-1 text-sm text-slate-500">Bạn</div>
                <PvpPlayerIdentity mine />
              </div>
              <span class="text-2xl">VS</span>
                <div class="min-w-0 max-w-[180px] text-center">
                <div class="text-sm text-slate-500">Đối thủ</div>
                <PvpPlayerIdentity :player="matchData.opponent" />
              </div>
            </div>
            <div class="mt-4 text-sm text-amber-700">Đang mở màn chọn đội hình... Hãy chọn Pokémon trong 30 giây!</div>
          </div>
        </div>

        <!-- History -->
        <div v-if="store.pvp.history.length > 0" class="border-t border-slate-100 p-4">
          <h4 class="text-sm font-bold text-slate-600 mb-3">Lịch sử gần đây</h4>
          <div class="flex gap-2 overflow-x-auto pb-2">
            <div 
              v-for="match in store.pvp.history.slice(0, 10)" 
              :key="match.id" 
              class="flex-shrink-0 w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center text-xs"
              :class="match.result === 'you' ? 'border-emerald-300 bg-emerald-50' : (match.result === 'opponent' ? 'border-rose-300 bg-rose-50' : 'border-amber-300 bg-amber-50')"
            >
              <div class="text-2xl">{{ match.result === 'you' ? '🏆' : (match.result === 'opponent' ? '💀' : '🤝') }}</div>
              <div class="font-bold" :class="match.result === 'you' ? 'text-emerald-700' : (match.result === 'opponent' ? 'text-rose-700' : 'text-amber-700')">
                {{ match.result === 'you' ? 'THẮNG' : (match.result === 'opponent' ? 'THUA' : 'HÒA') }}
              </div>
              <div class="text-[10px] text-slate-500">{{ match.eloChange > 0 ? '+' : '' }}{{ match.eloChange }}</div>
              <div class="text-[10px] text-slate-400 truncate w-full px-1">{{ match.opponent?.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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