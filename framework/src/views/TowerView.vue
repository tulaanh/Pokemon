<script setup>
import { computed, ref } from 'vue'
import { store } from '../game/store.js'
import { battle } from '../game/battle.js'
import { showToast } from '../components/ui/toast.js'
import {
  getTowerSelectList,
  getTowerEnemyCount,
  getTowerRarityTier,
  isTowerBossFloor,
  startTowerBattle,
} from '../game/tower.js'
import BattleArena from '../components/battle/BattleArena.vue'
import BattleTeamSelectModal from '../components/battle/BattleTeamSelectModal.vue'
import RarityText from '../components/RarityText.vue'
import PokeSprite from '../components/PokeSprite.vue'

const scene = ref('list')
const selectOpen = ref(false)
const targetFloor = ref(1)

const selectList = computed(() => getTowerSelectList())

const bestFloor = computed(() => store.towerBestFloor || 0)
const runFloor = computed(() => battle.towerRunFloor || 0)
const pot = computed(() => battle.towerPot || { gold: 0, gems: 0, candy: 0 })
const hasActiveRun = computed(() => runFloor.value > 0)
// Đội hình bị KHÓA kể từ khi bắt đầu trận tầng 1 cho đến khi run kết thúc (thắng rút lui / thua)
const teamLocked = computed(() => battle.mode === 'tower' && (battle.isBattling || battle.towerRunFloor > 0))

const enemyInfo = computed(() => {
  if (scene.value !== 'prep') return null
  return {
    count: getTowerEnemyCount(targetFloor.value),
    rarity: getTowerRarityTier(targetFloor.value),
    boss: isTowerBossFloor(targetFloor.value),
  }
})

function startRun() {
  targetFloor.value = 1
  battle.teamIndices = [null, null, null]
  scene.value = 'prep'
}

function continueRun() {
  targetFloor.value = runFloor.value + 1
  scene.value = 'prep'
}

function openSlot(i) {
  if (teamLocked.value) return
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
  if (!battle.teamIndices.some((idx) => idx !== null && store.team[idx])) {
    showToast('Bạn phải chọn ít nhất 1 Pokémon để xuất trận!', 'warning')
    return
  }
  if (startTowerBattle(targetFloor.value, targetFloor.value === 1)) {
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
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- SCENE 1: CỔNG THÁP -->
    <div v-if="scene === 'list'" class="app-card p-6">
      <div class="flex items-start gap-4">
        <div class="text-6xl leading-none">🗼</div>
        <div class="min-w-0">
          <h3 class="text-lg font-bold text-slate-800">Tháp Vô Tận</h3>
          <p class="mt-1 text-sm text-slate-500">
            Leo càng cao, địch càng mạnh! <b class="text-slate-700">Không hồi máu</b> giữa các tầng — mỗi <b class="text-amber-600">5 tầng</b> Pokémon còn sống hồi <b class="text-emerald-600">+20% HP</b> (đã gục KHÔNG hồi sinh).
            Thưởng ngẫu nhiên cộng dồn vào rương — <b class="text-slate-700">Rút Lui mới nhận</b>, <b class="text-red-500">thua mất hết</b>!
          </p>
          <div class="mt-2 flex flex-wrap gap-2 text-xs">
            <span class="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">🏅 Kỷ lục: <b class="text-amber-600">Tầng {{ bestFloor }}</b></span>
            <span v-if="hasActiveRun" class="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">🎯 Run hiện tại: <b class="text-sky-600">Tầng {{ runFloor }}</b></span>
          </div>
        </div>
      </div>

      <!-- RƯƠNG THƯỞNG -->
      <div class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
        <div class="text-sm font-bold text-amber-700">💰 Rương Thưởng (Run Hiện Tại)</div>
        <div class="mt-2 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-white p-2 text-xs shadow-sm">
            <div class="text-base font-black text-amber-500">{{ pot.gold }}</div>
            <div class="text-slate-500">🪙 Vàng</div>
          </div>
          <div class="rounded-lg bg-white p-2 text-xs shadow-sm">
            <div class="text-base font-black text-sky-500">{{ pot.gems }}</div>
            <div class="text-slate-500">💎 Gem</div>
          </div>
          <div class="rounded-lg bg-white p-2 text-xs shadow-sm">
            <div class="text-base font-black text-emerald-600">{{ pot.candy }}</div>
            <div class="text-slate-500">🍬 Kẹo</div>
          </div>
        </div>
        <p v-if="!hasActiveRun" class="mt-2 text-[11px] text-slate-500">Chưa có run — bắt đầu leo để tích lũy thưởng!</p>
      </div>

      <div class="mt-5">
        <button
          v-if="!hasActiveRun"
          @click="startRun"
          class="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-black text-white transition hover:brightness-110"
        >
          ⚔️ Bắt Đầu Leo (Tầng 1)
        </button>
        <button
          v-else
          @click="continueRun"
          class="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 py-3 text-sm font-black text-white transition hover:brightness-110"
        >
          ▶️ Tiếp Tục Tầng {{ runFloor + 1 }}
        </button>
      </div>
    </div>

    <!-- SCENE 2: CHUẨN BỊ -->
    <div v-else-if="scene === 'prep'" class="app-card p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800">🗼 Chuẩn Bị Leo — Tầng {{ targetFloor }}</h3>
        <button
          @click="scene = 'list'"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          ← Quay Lại
        </button>
      </div>

      <div v-if="enemyInfo?.boss" class="mb-4 rounded-xl border-2 border-red-400 bg-gradient-to-r from-red-50 to-rose-100 p-4">
        <div class="text-base font-black text-red-600">👑 TẦNG BOSS!</div>
        <p class="mt-1 text-sm text-red-500/90">
          Chỉ có <b>1 địch cực mạnh</b> (chỉ số <b>x2</b>) — hạ gục để nhận <b>rương thưởng x3</b> + <b>2 🍬 Kẹo chắc chắn</b>!
        </p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <div class="text-slate-700">
          Đối thủ: <b class="text-amber-600">{{ enemyInfo?.count }} Pokémon</b> (Độ hiếm: <b class="text-slate-700">{{ enemyInfo?.rarity }}</b>)<template v-if="enemyInfo?.boss"> — <b class="text-red-500">👑 BOSS</b></template>
          <template v-else> — <span class="text-slate-500">~20% tầng xuất hiện địch <b class="text-sky-600">✨ ELITE</b> (x1.35 chỉ số, thưởng Vàng +50%)</span></template>
        </div>
        <div class="mt-1 text-slate-500">Chỉ số địch tăng hàm mũ theo tầng. Team giữ nguyên HP từ tầng trước (chỉ hồi ở tầng 1 và mốc 5 tầng).</div>
        <div v-if="targetFloor > 1" class="mt-1 text-[11px] font-semibold text-red-500/80">⚠️ Tầng này KHÔNG hồi máu đầu trận!</div>
      </div>

      <!-- LOCK NOTICE -->
      <div v-if="teamLocked" class="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        🔒 <b>Đội hình đã khóa trong run này!</b> Không thể thay đổi Pokémon khi đang leo tháp — chỉ chọn được team ở Tầng 1.
      </div>

      <!-- TEAM SLOTS -->
      <div class="mt-5 flex items-center gap-3">
        <div v-for="i in 3" :key="i" class="flex-1">
          <button
            @click="openSlot(i - 1)"
            :disabled="teamLocked"
            class="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 transition"
            :class="teamLocked ? (slotPoke(i - 1) ? 'border-slate-200 bg-slate-50' : 'border-dashed border-slate-200 bg-slate-50') : slotPoke(i - 1) ? 'border-amber-400 bg-amber-50' : 'border-dashed border-slate-300 bg-white hover:border-slate-400'"
          >
            <template v-if="slotPoke(i - 1)">
              <PokeSprite :name="slotPoke(i - 1).name" :type="slotPoke(i - 1).type" :size-class="'h-10 w-10'" :img-class="'h-10 w-10'" :rounded="'rounded-full'" />
              <RarityText :rarity="slotPoke(i - 1).rarity" :label="slotPoke(i - 1).name" />
              <span v-if="slotPoke(i - 1).vLevel > 0" class="rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1 text-[10px] font-black text-white">V{{ slotPoke(i - 1).vLevel }}</span>
              <small class="text-slate-500">Lv.{{ slotPoke(i - 1).level }}</small>
              <small class="text-[10px]" :class="slotPoke(i - 1).hp <= 0 ? 'text-red-500' : 'text-emerald-600'">
                HP: {{ Math.max(0, Math.floor(slotPoke(i - 1).hp)) }}/{{ slotPoke(i - 1).maxHp }}
              </small>
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
          ⚔️ {{ teamLocked ? 'Chiến Đấu Tầng' : 'Bắt Đầu Chiến Đấu' }} {{ targetFloor }}
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
      title="🗼 Chọn Pokémon Xuất Trận"
      empty-text="⭐ Pokédex trống! Vào mục Đội Hình, nhấn ⭐ để thêm Pokémon chủ lực vào Pokédex."
      @close="selectOpen = false"
      @select="onSelectPoke"
    />
  </div>
</template>
