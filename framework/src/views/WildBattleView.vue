<script setup>
import { computed, ref } from 'vue'
import { store } from '../game/store.js'
import { battle } from '../game/battle.js'
import { startWildBattle } from '../game/campaign.js'
import { showToast } from '../components/ui/toast.js'
import BattleArena from '../components/battle/BattleArena.vue'
import BattleTeamSelectModal from '../components/battle/BattleTeamSelectModal.vue'
import RarityText from '../components/RarityText.vue'
import TypeBadge from '../components/poke/TypeBadge.vue'
import PokeSprite from '../components/PokeSprite.vue'

const emit = defineEmits(['back'])

const scene = ref('prep')
const selectOpen = ref(false)

const wildPoke = computed(() => battle.wildPoke)

const selectList = computed(() => {
  let list = []
  store.team.forEach((p, originalIndex) => {
    let isAlreadyInTeam =
      battle.teamIndices.includes(originalIndex) &&
      battle.teamIndices[battle.selectingSlot] !== originalIndex
    if (!isAlreadyInTeam) list.push({ pokemon: p, originalIndex })
  })
  return list.sort((a, b) => {
    if (battle.battleSortBy === 'level-desc') return b.pokemon.level - a.pokemon.level
    if (battle.battleSortBy === 'level-asc') return a.pokemon.level - b.pokemon.level
    return 0
  })
})

const sortOptions = [
  { value: 'level-desc', label: 'Cấp độ (Cao -> Thấp)' },
  { value: 'level-asc', label: 'Cấp độ (Thấp -> Cao)' },
]

function openSlot(i) {
  battle.selectingSlot = i
  selectOpen.value = true
}

function onSelectPoke(idx) {
  battle.teamIndices[battle.selectingSlot] = idx
  selectOpen.value = false
}

function startBattle() {
  if (!wildPoke.value) return
  if (!battle.teamIndices.some((idx) => idx !== null && store.team[idx])) {
    showToast('Bạn phải chọn ít nhất 1 Pokémon để xuất trận!', 'warning')
    return
  }
  if (startWildBattle(wildPoke.value)) {
    scene.value = 'battle'
  }
}

function onCloseResult() {
  battle.isBattling = false
  battle.teamIndices = [null, null, null]
  battle.wildPoke = null
  emit('back')
}

function slotPoke(i) {
  const idx = battle.teamIndices[i]
  return idx !== null ? store.team[idx] : null
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- SCENE 1: CHUẨN BỊ -->
    <div v-if="scene === 'prep'" class="app-card p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800">🌿 Gặp Pokémon Hoang Dã</h3>
        <button
          @click="emit('back')"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          🏃 Bỏ Chạy
        </button>
      </div>

      <!-- WILD POKEMON PREVIEW -->
      <div v-if="wildPoke" class="rounded-xl border-2 border-red-200 bg-red-50/50 p-4">
        <div class="flex items-center gap-3">
          <PokeSprite :name="wildPoke.name" :type="wildPoke.type" :size-class="'h-14 w-14'" :img-class="'h-14 w-14'" :rounded="'rounded-full'" />
          <div class="min-w-0">
            <div class="text-sm font-bold text-slate-800">
              <RarityText :rarity="wildPoke.rarity" :label="wildPoke.name" />
              <span class="ml-1 text-xs text-slate-500">(Lv.{{ wildPoke.level }})</span>
              <TypeBadge class="ml-1" :type="wildPoke.type" />
            </div>
            <small class="text-slate-500">HP: {{ Math.max(0, wildPoke.hp) }}/{{ wildPoke.maxHp }} | ATK: {{ wildPoke.atk }} | SPD: {{ wildPoke.speed }}</small>
          </div>
        </div>
        <p class="mt-2 text-xs font-semibold text-red-600">Làm yếu Pokémon (đừng đánh chết) để bắt, hoặc đánh chết để nhận EXP & Vàng! Nếu đánh chết, nó sẽ chết vĩnh viễn.</p>
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

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <select
          v-model="battle.battleSortBy"
          class="app-select"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button
          @click="startBattle"
          class="app-btn-primary px-6 py-3"
        >
          ⚔️ Bắt Đầu Chiến Đấu
        </button>
      </div>
    </div>

    <!-- SCENE 2: SÀN ĐẤU -->
    <div v-else-if="scene === 'battle'">
      <BattleArena @close-result="onCloseResult" />
    </div>

    <BattleTeamSelectModal
      :open="selectOpen"
      :list="selectList"
      title="🌿 Chọn Pokémon Xuất Trận"
      empty-text="Đội hình trống! Vào mục Gacha hoặc Hợp Nhất để có Pokémon."
      @close="selectOpen = false"
      @select="onSelectPoke"
    />
  </div>
</template>
