<script setup>
import { computed, ref } from 'vue'
import { store } from '../game/store.js'
import { battle } from '../game/battle.js'
import { showToast } from '../components/ui/toast.js'
import { POKEMON_SPECIES } from '../game/data.js'
import {
  CAMPAIGN_LEVELS,
  CAMPAIGN_CHAPTERS,
  getCampaignSelectList,
  startCampaignBattle,
  isCampaignLevelCleared,
  isCampaignLevelUnlocked,
  isCampaignChapterUnlocked,
  getChapterLevels,
  getCampaignProgress,
} from '../game/campaign.js'
import BattleArena from '../components/battle/BattleArena.vue'
import BattleTeamSelectModal from '../components/battle/BattleTeamSelectModal.vue'
import ModesIntro from '../components/ModesIntro.vue'
import RarityText from '../components/RarityText.vue'
import TypeBadge from '../components/poke/TypeBadge.vue'
import PokeSprite from '../components/PokeSprite.vue'

const scene = ref('list')
const selectOpen = ref(false)
const expandedChapters = ref([1])
const congratsOpen = ref(false)
const modesOpen = ref(false)

const selectedCampaign = computed(() => CAMPAIGN_LEVELS.find((c) => c.id === battle.campaignId))

const enemyPreview = computed(() => {
  if (!selectedCampaign.value) return []
  return selectedCampaign.value.enemies.map((e) => {
    const species = e.species
    return {
      wave: e,
      species,
      level: e.level,
      rarity: e.rarity,
      rarityName: e.rarity,
      type: POKEMON_SPECIES.find((s) => s.name === species)?.type,
    }
  })
})

const selectList = computed(() => getCampaignSelectList())

const progress = computed(() => getCampaignProgress())

function levelCleared(id) {
  return isCampaignLevelCleared(id)
}

function levelUnlocked(id) {
  return isCampaignLevelUnlocked(id)
}

function chapterLevels(chapterId) {
  return getChapterLevels(chapterId)
}

function chapterUnlocked(chapterId) {
  return isCampaignChapterUnlocked(chapterId)
}

function chapterClearedCount(chapterId) {
  return chapterLevels(chapterId).filter((l) => levelCleared(l.id)).length
}

function isChapterExpanded(chapterId) {
  return expandedChapters.value.includes(chapterId)
}

function toggleChapter(chapterId) {
  const idx = expandedChapters.value.indexOf(chapterId)
  if (idx >= 0) expandedChapters.value.splice(idx, 1)
  else expandedChapters.value.push(chapterId)
}

const sortOptions = [
  { value: 'level-desc', label: 'Cấp độ (Cao -> Thấp)' },
  { value: 'level-asc', label: 'Cấp độ (Thấp -> Cao)' },
]

function selectCampaign(id) {
  battle.campaignId = id
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
  if (!battle.teamIndices.some((idx) => idx !== null && store.team[idx])) {
    showToast('Bạn phải chọn ít nhất 1 Pokémon để xuất trận!', 'warning')
    return
  }
  if (startCampaignBattle(battle.campaignId)) {
    scene.value = 'battle'
  }
}

function onCloseResult() {
  battle.isBattling = false
  battle.teamIndices = [null, null, null]
  scene.value = 'list'
  // Vừa hoàn thành nhiệm vụ khởi đầu → mở hội thoại chúc mừng kèm thưởng
  if (store.startMissionCongrats) {
    store.startMissionCongrats = false
    congratsOpen.value = true
  }
}

function onCongratsDone() {
  congratsOpen.value = false
  modesOpen.value = true
}

function slotPoke(i) {
  const idx = battle.teamIndices[i]
  return idx !== null ? store.team[idx] : null
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- SCENE 1: BẢN ĐỒ -->
    <div v-if="scene === 'list'" class="app-card p-6">
      <h3 class="text-lg font-bold text-slate-800">⚔️ Bản Đồ Chiến Dịch</h3>
      <p class="mt-1 text-sm text-slate-500">Phải đánh hết màn trước mới mở khóa màn sau, và đánh hết chương trước mới qua được chương kế tiếp!</p>
      <div class="mt-2 text-xs text-slate-500">
        Tiến độ: <span class="font-bold text-amber-600">{{ progress.cleared }}/{{ progress.total }}</span> ải đã hoàn thành
      </div>

      <div class="mt-5 space-y-5">
        <div
          v-for="ch in CAMPAIGN_CHAPTERS"
          :key="ch.id"
          class="rounded-xl border p-4"
          :class="chapterUnlocked(ch.id) ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'"
        >
          <button
            @click="toggleChapter(ch.id)"
            class="flex w-full items-center justify-between gap-2 text-left"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-lg">{{ ch.icon }}</span>
              <div>
                <div class="text-sm font-bold" :class="chapterUnlocked(ch.id) ? 'text-slate-800' : 'text-slate-400'">{{ ch.name }}</div>
                <div class="text-[11px] text-slate-500">{{ ch.description }}</div>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <div v-if="!chapterUnlocked(ch.id)" class="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
                🔒 Đánh hết chương trước
              </div>
              <div v-else class="text-[11px] font-bold text-emerald-600">{{ chapterClearedCount(ch.id) }}/{{ chapterLevels(ch.id).length }}</div>
              <span class="text-xs text-slate-400">{{ isChapterExpanded(ch.id) ? '▲' : '▼' }}</span>
            </div>
          </button>

          <div v-if="isChapterExpanded(ch.id)" class="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              v-for="lvl in chapterLevels(ch.id)"
              :key="lvl.id"
              :disabled="!levelUnlocked(lvl.id)"
              @click="selectCampaign(lvl.id)"
              class="relative w-full rounded-xl border p-3 text-left transition"
              :class="
                !levelUnlocked(lvl.id)
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50'
                  : lvl.id === battle.campaignId
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'
              "
            >
              <span v-if="!levelUnlocked(lvl.id)" class="absolute right-2 top-2 text-sm">🔒</span>
              <span v-if="levelCleared(lvl.id)" class="absolute right-2 top-2 text-sm">✅</span>
              <div class="pr-6 text-sm font-bold" :class="levelUnlocked(lvl.id) ? 'text-amber-600' : 'text-slate-400'">{{ lvl.name }}</div>
              <div class="mt-1 text-xs" :class="levelUnlocked(lvl.id) ? 'text-slate-500' : 'text-slate-400'">{{ lvl.description }}</div>
              <div class="mt-1 text-[11px]" :class="levelUnlocked(lvl.id) ? 'text-emerald-600' : 'text-slate-400'">
                Thưởng: {{ lvl.rewardGems }} Gem | Số ải: {{ lvl.enemies.length }}
              </div>
              <div v-if="!levelUnlocked(lvl.id)" class="mt-1 text-[10px] font-semibold text-red-400/70">Đánh hết màn trước để mở khóa</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SCENE 2: CHUẨN BỊ -->
    <div v-else-if="scene === 'prep'" class="app-card p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800">⚔️ {{ selectedCampaign?.name }}</h3>
        <button
          @click="scene = 'list'"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          ← Quay Lại
        </button>
      </div>
      <p class="text-sm text-slate-500">{{ selectedCampaign?.description }}</p>
      <p class="mt-1 text-xs font-semibold text-amber-600">Thưởng: +{{ selectedCampaign?.rewardGems }} Gem | +{{ selectedCampaign?.rewardExp }} EXP</p>

      <!-- ENEMY PREVIEW -->
      <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div v-for="(e, i) in enemyPreview" :key="i" class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <PokeSprite :name="e.species" :type="e.type" :size-class="'h-12 w-12'" :img-class="'h-12 w-12'" :rounded="'rounded-full'" />
          <div class="mt-1 text-xs font-bold text-slate-800">Wave {{ i + 1 }}: <RarityText :rarity="e.rarity" :label="e.species" /></div>
          <small class="text-slate-500">Cấp {{ e.level }} | {{ e.rarityName }}</small>
        </div>
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

    <!-- SCENE 3: SÀN ĐẤU -->
    <div v-else-if="scene === 'battle'">
      <BattleArena @close-result="onCloseResult" />
    </div>

    <BattleTeamSelectModal
      :open="selectOpen"
      :list="selectList"
      title="⚔️ Chọn Pokémon Xuất Trận"
      empty-text="⭐ Pokédex trống! Vào mục Đội Hình, nhấn ⭐ để thêm Pokémon chủ lực vào Pokédex."
      @close="selectOpen = false"
      @select="onSelectPoke"
    />

    <!-- HỘI THOẠI CHÚC MỪNG HOÀN THÀNH NHIỆM VỤ KHỞI ĐẦU -->
    <Teleport to="body">
      <div v-if="congratsOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-2xl border border-amber-300 bg-white p-6 text-center shadow-2xl">
          <div class="text-5xl">🎉</div>
          <h3 class="mt-3 text-xl font-black text-amber-600">HOÀN THÀNH NHIỆM VỤ KHỞI ĐẦU!</h3>
          <p class="mt-2 text-sm text-slate-600">Chúc mừng bạn đã chính thức bắt đầu hành trình. Phần thưởng nhiệm vụ:</p>
          <div class="mt-4 space-y-2 text-sm font-bold">
            <div class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-amber-700">
              <span>🪙 Vàng</span>
              <span>+1000</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-fuchsia-50 px-3 py-2 text-fuchsia-700">
              <span>💎 Gem</span>
              <span>+1000</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2 text-sky-700">
              <span>🎫 Vé Quay</span>
              <span>+1500</span>
            </div>
          </div>
          <button @click="onCongratsDone" class="app-btn-primary mt-5 w-full py-2.5">
            Nhận Thưởng ▸
          </button>
        </div>
      </div>
    </Teleport>

    <!-- GIỚI THIỆU CÁC CHẾ ĐỘ HIỆN CÓ -->
    <ModesIntro :open="modesOpen" @done="modesOpen = false" />
  </div>
</template>
