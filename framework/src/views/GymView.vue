<script setup>
import { computed, ref } from 'vue'
import { store } from '../game/store.js'
import { battle } from '../game/battle.js'
import { showToast } from '../components/ui/toast.js'
import {
  GYM_DATA,
  getTrainerLevel,
  getGymEligibleList,
  startGymBattle,
} from '../game/gym.js'
import BattleArena from '../components/battle/BattleArena.vue'
import BattleTeamSelectModal from '../components/battle/BattleTeamSelectModal.vue'
import RarityText from '../components/RarityText.vue'
import PokeSprite from '../components/PokeSprite.vue'

const scene = ref('list')
const selectOpen = ref(false)

const selectedGym = computed(() => (battle.gymType ? GYM_DATA[battle.gymType] : null))

const currentProgress = computed(() => (battle.gymType ? store.gymProgress[battle.gymType] || 0 : 0))

const selectList = computed(() => (battle.gymType ? getGymEligibleList(battle.gymType) : []))

function selectGym(type) {
  if (getTrainerLevel() < 25) {
    showToast(`🔒 Cấp HLV hiện tại của bạn là ${getTrainerLevel()}. Cần đạt cấp 25 mới mở khóa Phòng Gym!`, 'warning')
    return
  }
  if ((store.gymProgress[type] || 0) >= 5) {
    showToast(`${GYM_DATA[type].name} đã hoàn thành! Bạn đã nhận buff 10%.`, 'info')
    return
  }
  battle.gymType = type
  battle.teamIndices = [null, null, null]
  scene.value = 'prep'
}

function openSlot(i) {
  battle.selectingSlot = i
  selectOpen.value = true
}

function onSelectPoke(idx) {
  battle.teamIndices[battle.selectingSlot] = idx
  selectOpen.value = false
}

function clearSlot() {
  battle.teamIndices[battle.selectingSlot] = null
  selectOpen.value = false
}

function startBattle() {
  if (startGymBattle(battle.gymType)) {
    scene.value = 'battle'
  }
}

function onCloseResult() {
  battle.isBattling = false
  battle.teamIndices = [null, null, null]
  scene.value = 'list'
}

function slotPoke(i) {
  const idx = battle.teamIndices[i]
  return idx !== null ? store.team[idx] : null
}

function gymTypes() {
  return Object.keys(GYM_DATA)
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- SCENE 1: DANH SÁCH GYM -->
    <div v-if="scene === 'list'" class="app-card p-6">
      <h3 class="text-lg font-bold text-slate-800">🏟️ Phòng Gym</h3>
      <p class="mt-1 text-sm text-slate-500">
        Chinh phục 5 ải của mỗi Gym để nhận <b class="text-amber-600">BUFF +10% chỉ số vĩnh viễn</b> cho cả hệ!
        Pokémon xuất trận phải <b class="text-slate-700">cùng hệ</b> và có cấp <b class="text-slate-700">≤ cấp HLV</b> (Lv.{{ getTrainerLevel() }}).
      </p>

      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          v-for="type in gymTypes()"
          :key="type"
          @click="selectGym(type)"
          class="rounded-xl border p-4 text-left transition"
          :class="battle.gymType === type ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm font-bold text-slate-800">{{ GYM_DATA[type].icon }} {{ GYM_DATA[type].name }}</div>
            <span
              v-if="store.gymBuffs[type]"
              class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700"
            >BUFF +10% ✔</span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                :style="{ width: (store.gymProgress[type] || 0) / 5 * 100 + '%' }"
              ></div>
            </div>
            <small class="shrink-0 text-xs text-slate-500">{{ store.gymProgress[type] || 0 }}/5</small>
          </div>
        </button>
      </div>
    </div>

    <!-- SCENE 2: CHUẨN BỊ -->
    <div v-else-if="scene === 'prep'" class="app-card p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800">🏟️ {{ selectedGym?.icon }} {{ selectedGym?.name }}</h3>
        <button
          @click="scene = 'list'"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          ← Quay Lại
        </button>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <div class="text-slate-700">Ải hiện tại: <b class="text-amber-600">Ải {{ currentProgress + 1 }}/5</b></div>
        <div class="mt-1 text-slate-500">Yêu cầu: toàn bộ đội hình hệ <b class="text-slate-700">{{ selectedGym?.type }}</b>, cấp ≤ <b class="text-slate-700">{{ getTrainerLevel() }}</b> (cấp HLV).</div>
        <div class="mt-1 text-slate-500">Đối thủ: <b class="text-slate-700">3 Pokémon</b> của HLV Gym.</div>
      </div>

      <!-- TEAM SLOTS -->
      <div class="mt-5 flex items-center gap-3">
        <div v-for="i in 3" :key="i" class="flex-1">
          <button
            @click="openSlot(i - 1)"
            class="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 transition"
            :class="slotPoke(i - 1) ? 'border-amber-400 bg-amber-50' : 'border-dashed border-slate-300 bg-white hover:border-slate-400'"
          >
            <template v-if="slotPoke(i - 1)">
              <PokeSprite :name="slotPoke(i - 1).name" :type="slotPoke(i - 1).type" :size-class="'h-10 w-10'" :img-class="'h-10 w-10'" :rounded="'rounded-full'" />
              <RarityText :rarity="slotPoke(i - 1).rarity" :label="slotPoke(i - 1).name" />
              <span v-if="slotPoke(i - 1).vLevel > 0" class="rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1 text-[10px] font-black text-white">V{{ slotPoke(i - 1).vLevel }}</span>
              <small class="text-slate-500">Lv.{{ slotPoke(i - 1).level }}</small>
            </template>
            <template v-else>
              <span class="text-2xl text-slate-300">+</span>
              <span class="text-xs text-slate-400">Slot {{ i }}</span>
            </template>
          </button>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          @click="startBattle"
          class="app-btn-primary px-6 py-3"
        >
          ⚔️ Bắt Đầu Chiến Đấu
        </button>
      </div>
    </div>

    <!-- SCENE 3: SÀN ĐẤU -->
    <div v-else-if="scene === 'battle'">
      <BattleArena @close-result="onCloseResult" />
    </div>

    <BattleTeamSelectModal
      :open="selectOpen"
      :list="selectList"
      :title="`🏟️ Chọn Pokémon Hệ ${selectedGym?.type || ''}`"
      :empty-text="`Bạn chưa có Pokémon hệ ${selectedGym?.type || ''} nào có cấp ≤ cấp HLV!`"
      @close="selectOpen = false"
      @select="onSelectPoke"
    />
  </div>
</template>
