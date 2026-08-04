<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { store } from '../game/store.js'
import { connectPvP, disconnectPvP, findMatch, cancelMatch, setPvPCallbacks, clearPvPCallbacks, isConnected } from '../game/pvp/wsClient.js'
import { showToast } from '../components/ui/toast.js'
import PokeSprite from '../components/PokeSprite.vue'
import RarityText from '../components/RarityText.vue'

const emit = defineEmits(['open', 'close'])

const connecting = ref(false)
const connectionError = ref('')
const inQueue = ref(false)
const queuePosition = ref(0)
const estimatedWait = ref(0)
const matched = ref(false)
const matchData = ref(null)
const selectedTeam = ref([])
const maxTeamSize = 3
const queueTimer = ref(null)
const waitTime = ref(0)

// Computed
const availablePokemon = computed(() => store.team.filter(p => p && p.hp > 0))
const canStartMatchmaking = computed(() => selectedTeam.value.length === maxTeamSize && !inQueue.value && isConnected())
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
      showToast(`⚔️ Đã tìm thấy đối thủ: ${payload.opponent.name}`, 'success')
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

// Toggle Pokémon trong team
function togglePokemon(pokemon) {
  if (inQueue.value || matched.value) return
  const idx = selectedTeam.value.findIndex(p => p.id === pokemon.id)
  if (idx >= 0) {
    selectedTeam.value.splice(idx, 1)
  } else if (selectedTeam.value.length < maxTeamSize) {
    selectedTeam.value.push(pokemon)
  } else {
    showToast(`⚠️ Chỉ được chọn tối đa ${maxTeamSize} Pokémon`, 'warning')
  }
}

function isSelected(pokemon) {
  return selectedTeam.value.some(p => p.id === pokemon.id)
}

function getSlotIndex(pokemon) {
  return selectedTeam.value.findIndex(p => p.id === pokemon.id)
}

function hpPct(pokemon) {
  if (!pokemon?.maxHp) return 0
  return Math.max(0, Math.min(100, Math.round((pokemon.hp / pokemon.maxHp) * 100)))
}

// Bắt đầu tìm trận
async function startMatchmaking() {
  if (selectedTeam.value.length !== maxTeamSize) {
    showToast(`⚠️ Cần chọn đủ ${maxTeamSize} Pokémon`, 'warning')
    return
  }
  if (!isConnected()) {
    await initConnection()
    if (!isConnected()) return
  }
  // Validate team
  const teamSummary = selectedTeam.value.map(p => ({
    id: p.id,
    speciesId: p.speciesId,
    level: p.level,
    hp: p.hp,
    maxHp: p.maxHp,
    atk: p.atk,
    def: p.def,
    spa: p.spa,
    spd: p.spd,
    spe: p.spe,
    types: p.types,
    skills: p.skills?.map(s => ({ id: s.id, pp: s.pp, maxPp: s.maxPp, currentCd: s.currentCd })) || [],
    passive: p.passive,
    talents: p.talents,
  }))
  inQueue.value = true
  startQueueTimer()
  findMatch('standard', teamSummary)
}

// Hủy tìm trận
function cancelMatchmaking() {
  inQueue.value = false
  clearQueueTimer()
  cancelMatch()
  showToast('❌ Đã hủy tìm trận', 'info')
}

// Xác nhận vào trận
function acceptMatch() {
  // Server sẽ gửi battle_start
  matched.value = false
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

          <!-- Chọn đội hình -->
          <div v-if="!inQueue" class="space-y-4">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span class="text-xl">👥</span>
              Chọn đội hình ({{ selectedTeam.length }}/{{ maxTeamSize }})
            </h3>
            <p class="text-sm text-slate-500">Chọn đúng 3 Pokémon có HP > 0 để vào hàng đợi</p>
            
            <!-- Selected Team Slots -->
            <div class="flex gap-3 overflow-x-auto pb-2">
              <div v-for="i in maxTeamSize" :key="i" class="flex-shrink-0">
                <div class="relative w-28 h-36">
                  <div v-if="selectedTeam[i-1]" class="h-full rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-center shadow-sm">
                    <PokeSprite :name="selectedTeam[i-1].name" :type="selectedTeam[i-1].type" :size-class="'mx-auto h-12 w-12'" :img-class="'h-12 w-12'" :rounded="'rounded-full'" />
                    <RarityText :rarity="selectedTeam[i-1].rarity" :label="selectedTeam[i-1].name" class="mt-1 block truncate text-xs font-black" />
                    <div class="mt-1 text-[10px] font-bold text-slate-500">Lv.{{ selectedTeam[i-1].level }}</div>
                    <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${hpPct(selectedTeam[i-1])}%` }"></div>
                    </div>
                  </div>
                  <div v-else class="absolute inset-0 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-center">
                    <span class="text-3xl text-slate-300">+</span>
                  </div>
                  <button v-if="selectedTeam[i-1]" @click="togglePokemon(selectedTeam[i-1])" class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-lg hover:bg-red-600">×</button>
                </div>
              </div>
            </div>

            <!-- Available Pokemon Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto">
              <button
                v-for="poke in availablePokemon" 
                :key="poke.id" 
                @click="togglePokemon(poke)"
                type="button"
                class="relative rounded-xl border bg-white p-3 text-left shadow-sm transition hover:scale-105 hover:border-indigo-300"
                :class="isSelected(poke) ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'"
              >
                <div v-if="isSelected(poke)" class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {{ getSlotIndex(poke) + 1 }}
                </div>
                <div class="flex items-center gap-2">
                  <PokeSprite :name="poke.name" :type="poke.type" :size-class="'h-10 w-10'" :img-class="'h-10 w-10'" :rounded="'rounded-full'" />
                  <div class="min-w-0 flex-1">
                    <RarityText :rarity="poke.rarity" :label="poke.name" class="block truncate text-xs font-black" />
                    <div class="text-[10px] font-bold text-slate-500">Lv.{{ poke.level }} · {{ poke.type }}</div>
                  </div>
                </div>
                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${hpPct(poke)}%` }"></div>
                </div>
                <div class="mt-1 text-[10px] font-bold text-slate-500">HP {{ poke.hp }}/{{ poke.maxHp }}</div>
              </button>
            </div>

            <div v-if="availablePokemon.length === 0" class="text-center py-8 text-slate-500">
              <div class="text-4xl mb-2">😴</div>
              <p>Không có Pokémon nào sẵn sàng chiến đấu</p>
              <p class="text-sm">Hãy hồi phục HP tại Bệnh viện hoặc nhận Pokémon mới</p>
            </div>

            <!-- Start Button -->
            <button 
              v-if="selectedTeam.length === maxTeamSize"
              @click="startMatchmaking"
              :disabled="connecting"
              class="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ store.pvp.connected ? '🔍 Tìm Trận Đấu' : '🌐 Kết nối & Tìm Trận' }}
            </button>
            <button 
              v-else
              @click="startMatchmaking"
              :disabled="connecting"
              class="w-full mt-4 py-3 rounded-xl bg-slate-200 text-slate-400 font-bold text-lg cursor-not-allowed"
            >
              ⚠️ Cần chọn đủ 3 Pokémon
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

          <!-- Đã tìm thấy đối thủ -->
          <div v-else-if="matched" class="space-y-4 text-center border-2 border-amber-400 bg-amber-50 rounded-2xl p-6">
            <div class="text-5xl animate-pulse">⚔️</div>
            <h3 class="text-xl font-bold text-slate-800">Đã tìm thấy đối thủ!</h3>
            <div class="flex items-center justify-center gap-6 mt-4">
              <div class="text-center">
                <div class="text-sm text-slate-500">Bạn</div>
                <div class="font-bold text-indigo-600">{{ store.gameState.player.playerName || 'Player' }}</div>
                <div class="text-xs text-slate-500">ELO: {{ myElo }}</div>
              </div>
              <span class="text-2xl">VS</span>
              <div class="text-center">
                <div class="text-sm text-slate-500">Đối thủ</div>
                <div class="font-bold text-rose-600">{{ matchData.opponent?.name }}</div>
                <div class="text-xs text-slate-500">ELO: {{ matchData.opponent?.elo }}</div>
              </div>
            </div>
            <div class="mt-4 text-sm text-amber-700">Trận đấu sẽ bắt đầu trong giây lát...</div>
            <button @click="acceptMatch" class="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:brightness-110">
              ✅ Sẵn Sàng Chiến Đấu
            </button>
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