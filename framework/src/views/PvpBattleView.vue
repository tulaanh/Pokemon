<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { store } from '../game/store.js'
import { forfeitBattle, sendBattleAction, setPvPCallbacks, clearPvPCallbacks, reconnectBattle } from '../game/pvp/wsClient.js'
import { showToast } from '../components/ui/toast.js'
import PokeSprite from '../components/PokeSprite.vue'
import TypeBadge from '../components/poke/TypeBadge.vue'
import RarityText from '../components/RarityText.vue'
import PvpPlayerIdentity from '../components/pvp/PvpPlayerIdentity.vue'

const props = defineProps({ payload: { type: Object, default: () => ({}) } })
const emit = defineEmits(['back'])
const battleId = computed(() => props.payload?.battleId || props.payload?.id || 'pending')
const battleState = ref(props.payload?.state || {})
const opponent = computed(() => props.payload?.opponent || battleState.value.opponent || { name: 'Đối thủ', elo: '???' })
const nextActor = ref(props.payload?.nextActor || 'you')
const deadline = ref(props.payload?.deadline || Date.now() + 30000)
const disconnected = ref(false)
const finished = ref(false)
const result = ref(null)
const now = ref(Date.now())
const switchOpen = ref(false)
const logOpen = ref(true)
let timer = null

const secondsLeft = computed(() => Math.max(0, Math.ceil((deadline.value - now.value) / 1000)))
const isMyTurn = computed(() => nextActor.value === 'you' || nextActor.value === store.gameState.player.playerName)
const yourTeam = computed(() => battleState.value?.yourTeam || [])
const opponentTeam = computed(() => battleState.value?.opponentTeam || [])
const yourActive = computed(() => battleState.value?.yourActive || yourTeam.value[0] || null)
const opponentActive = computed(() => battleState.value?.opponentActive || opponentTeam.value[0] || null)
const skills = computed(() => [0, 1, 2, 3].map((index) => ({ index, skill: yourActive.value?.skills?.[index] || null })))
const battleLog = computed(() => battleState.value?.log || [])

function hpPercent(pokemon) { return pokemon?.maxHp ? Math.max(0, Math.min(100, (Number(pokemon.hp || 0) / pokemon.maxHp) * 100)) : 0 }
function mpPercent(pokemon) { return Math.max(0, Math.min(100, Number(pokemon?.mp || 0))) }
function displayType(pokemon) { return pokemon?.type || pokemon?.types?.[0] || 'Normal' }
function sendAction(type, extra = {}) {
  if (!isMyTurn.value || finished.value) return
  sendBattleAction(battleId.value, { type, ...extra })
  showToast('📡 Đã gửi hành động, chờ server xác nhận...', 'info')
}
function useSkill(index) { sendAction('skill', { skillIndex: index }) }
function switchPokemon(index) { switchOpen.value = false; sendAction('switch', { teamIndex: index }) }
function forfeit() { if (!finished.value) { forfeitBattle(battleId.value); showToast('🏳️ Đã gửi yêu cầu xin thua', 'warning') } }
function reconnect() { reconnectBattle(battleId.value); showToast('🔄 Đang xin kết nối lại trận đấu...', 'info') }
function resultTitle() { return result.value?.winner === 'you' ? '🏆 CHIẾN THẮNG PvP!' : result.value?.winner === 'draw' ? '🤝 TRẬN ĐẤU HÒA!' : '💀 THẤT BẠI PvP' }
function resultIcon() { return result.value?.winner === 'you' ? '🏆' : result.value?.winner === 'draw' ? '🤝' : '💀' }

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 250)
  setPvPCallbacks({
    onBattleStart: (payload) => { battleState.value = payload.state || battleState.value; nextActor.value = payload.nextActor || nextActor.value; deadline.value = payload.deadline || deadline.value },
    onTurnResult: (payload) => { if (payload.battleId && payload.battleId !== battleId.value) return; battleState.value = payload.state || battleState.value; nextActor.value = payload.nextActor || nextActor.value; deadline.value = payload.deadline || Date.now() + 30000; disconnected.value = false },
    onBattleEnd: (payload) => { if (payload.battleId && payload.battleId !== battleId.value) return; finished.value = true; result.value = payload; showToast(payload.winner === 'you' ? '🏆 Bạn đã thắng PvP!' : payload.winner === 'draw' ? '🤝 Trận đấu hòa!' : '💀 Bạn đã thua PvP', 'info') },
    onOpponentDisconnected: () => { disconnected.value = true; showToast('⚠️ Đối thủ mất kết nối. Chờ reconnect trong 30 giây.', 'warning') },
  })
})
onUnmounted(() => { if (timer) clearInterval(timer); clearPvPCallbacks() })
</script>

<template>
  <section class="app-card p-4 sm:p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p class="text-xs font-bold text-indigo-600">⚔️ ĐẤU TRƯỜNG ONLINE</p><h1 class="text-xl font-black text-slate-900 sm:text-2xl">Trận PvP Online</h1><p class="text-xs text-slate-500">Battle ID: <span class="font-mono">{{ battleId }}</span></p></div><button @click="forfeit" :disabled="finished" class="rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white shadow transition hover:bg-rose-700 disabled:opacity-40">🏳️ Xin thua</button></div>
    <div class="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"><PvpPlayerIdentity :player="battleState.you" mine /><div class="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">LƯỢT {{ battleState.turn || 1 }}</div><PvpPlayerIdentity :player="opponent" /></div>
    <div v-if="disconnected" class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><span>⚠️ Đối thủ mất kết nối. Server giữ trận trong 30 giây.</span><button @click="reconnect" class="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white">Kết nối lại</button></div>

    <div class="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4">
      <div class="rounded-2xl border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white p-3 shadow-xl sm:p-4"><div class="flex items-center gap-2"><PokeSprite v-if="yourActive" :name="yourActive.name" :type="displayType(yourActive)" :size-class="'h-14 w-14'" :img-class="'h-14 w-14'" rounded="rounded-full" /><div class="min-w-0"><RarityText :rarity="yourActive?.rarity" :label="yourActive?.name || 'Chưa ra sân'" /><div class="text-xs text-slate-500">Lv.{{ yourActive?.level || '-' }} <TypeBadge v-if="yourActive" :type="displayType(yourActive)" /></div></div></div><div class="mt-3 flex justify-between text-[10px] text-slate-500"><span>HP</span><span>{{ Math.max(0, yourActive?.hp || 0) }}/{{ yourActive?.maxHp || 0 }}</span></div><div class="h-4 overflow-hidden rounded-full bg-slate-200"><div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300" :style="{ width: hpPercent(yourActive) + '%' }" /></div><div class="mt-2 flex justify-between text-[10px] text-slate-500"><span>MP</span><span>{{ yourActive?.mp || 0 }}/100</span></div><div class="h-2 overflow-hidden rounded-full bg-slate-200"><div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400" :style="{ width: mpPercent(yourActive) + '%' }" /></div><div class="mt-2 text-[10px] font-bold text-sky-600">BẠN</div></div>
      <div class="flex items-center justify-center"><div class="flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-black" :class="isMyTurn ? 'border-amber-400 bg-amber-100 text-amber-600' : 'border-red-300 bg-red-100 text-red-600'">{{ isMyTurn ? '⚡' : '🤖' }}</div></div>
      <div class="rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-white p-3 shadow-xl sm:p-4"><div class="flex items-center gap-2"><PokeSprite v-if="opponentActive" :name="opponentActive.name" :type="displayType(opponentActive)" :size-class="'h-14 w-14'" :img-class="'h-14 w-14'" rounded="rounded-full" /><div class="min-w-0"><RarityText :rarity="opponentActive?.rarity" :label="opponentActive?.name || 'Chưa ra sân'" /><div class="text-xs text-slate-500">Lv.{{ opponentActive?.level || '-' }} <TypeBadge v-if="opponentActive" :type="displayType(opponentActive)" /></div></div></div><div class="mt-3 flex justify-between text-[10px] text-slate-500"><span>HP</span><span>{{ Math.max(0, opponentActive?.hp || 0) }}/{{ opponentActive?.maxHp || 0 }}</span></div><div class="h-4 overflow-hidden rounded-full bg-slate-200"><div class="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300" :style="{ width: hpPercent(opponentActive) + '%' }" /></div><div class="mt-2 flex justify-between text-[10px] text-slate-500"><span>MP</span><span>{{ opponentActive?.mp || 0 }}/100</span></div><div class="h-2 overflow-hidden rounded-full bg-slate-200"><div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400" :style="{ width: mpPercent(opponentActive) + '%' }" /></div><div class="mt-2 text-[10px] font-bold text-red-600">ĐỐI THỦ</div></div>
    </div>
    <div class="mt-3 rounded-xl border px-3 py-2 text-center text-sm font-bold" :class="isMyTurn ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-red-300 bg-red-50 text-red-600'">{{ isMyTurn ? '⚡ Lượt của BẠN — Chọn chiêu để tấn công!' : '🤖 Lượt của ĐỐI THỦ...' }} <span class="ml-2 text-xs font-normal">⏱️ {{ secondsLeft }}s</span></div>
    <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><button v-for="slot in skills" :key="slot.index" @click="useSkill(slot.index)" :disabled="!isMyTurn || finished || !yourActive" class="rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"><div class="text-xs font-bold sm:text-sm"><RarityText :rarity="slot.skill?.rarity" :label="slot.skill?.name || `Kỹ năng ${slot.index + 1}`" /></div><div class="mt-1 text-[10px] text-amber-600">{{ slot.skill?.power ? `Dame: ${slot.skill.power}` : 'Tấn công' }}</div><div class="text-[10px] text-slate-400">MP: {{ slot.skill?.cost || 0 }}</div></button></div>
    <button @click="switchOpen = true" :disabled="!isMyTurn || finished" class="mt-3 rounded-lg border border-sky-300 bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-40">🔄 Đổi Pokémon</button>
    <div class="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white"><button @click="logOpen = !logOpen" class="flex w-full items-center justify-between px-3 py-2 text-xs font-bold text-slate-500"><span>📜 Nhật Ký Trận Đấu</span><span>{{ logOpen ? '▲' : '▼' }}</span></button><div v-if="logOpen" class="max-h-40 overflow-y-auto border-t border-slate-200 p-3 text-xs text-slate-600"><div v-for="(entry, i) in battleLog" :key="i" class="py-0.5">{{ entry }}</div></div></div>

    <Teleport to="body"><div v-if="switchOpen" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="switchOpen = false"><div class="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl"><div class="mb-3 flex items-center justify-between"><h3 class="font-bold text-sky-600">🔄 Đổi Pokémon Trong Trận</h3><button @click="switchOpen = false" class="text-2xl text-slate-400">&times;</button></div><div class="space-y-2"><button v-for="(poke, i) in yourTeam" :key="poke.id || i" :disabled="poke.hp <= 0 || poke.id === yourActive?.id" @click="switchPokemon(i)" class="w-full rounded-xl border border-sky-200 p-3 text-left transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"><div class="flex items-center gap-2"><PokeSprite :name="poke.name" :type="displayType(poke)" :size-class="'h-10 w-10'" :img-class="'h-10 w-10'" rounded="rounded-full" /><RarityText :rarity="poke.rarity" :label="poke.name" /><span class="text-xs text-slate-500">Lv.{{ poke.level }}</span></div><div class="mt-2 h-2 overflow-hidden rounded bg-slate-200"><div class="h-full bg-emerald-500" :style="{ width: hpPercent(poke) + '%' }" /></div><small class="text-slate-500">HP: {{ poke.hp }}/{{ poke.maxHp }}</small></button></div></div></div><div v-if="finished" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"><div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"><div class="text-5xl">{{ resultIcon() }}</div><h2 class="mt-2 text-xl font-black" :class="result?.winner === 'you' ? 'text-emerald-600' : 'text-red-500'">{{ resultTitle() }}</h2><p class="mt-3 text-sm text-slate-600">ELO: {{ result?.eloChange?.you >= 0 ? '+' : '' }}{{ result?.eloChange?.you || 0 }} · Replay: {{ result?.replayId || 'đang chờ' }}</p><button @click="emit('back')" class="app-btn-primary mt-5 w-full py-2.5">Quay Lại Bản Đồ</button></div></div></Teleport>
  </section>
</template>