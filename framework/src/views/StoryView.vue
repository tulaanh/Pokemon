<script setup>
import { computed, ref } from 'vue'
import { store } from '../game/store.js'
import { battle } from '../game/battle.js'
import {
  STORY_SCENES,
  STORY_CHAPTERS,
  getStorySelectList,
  startStoryBattle,
  isStorySceneCleared,
  isStorySceneUnlocked,
  getChapterScenes,
  getStoryProgress,
  markStoryCleared,
  getStorySceneIndex,
} from '../game/story.js'
import BattleArena from '../components/battle/BattleArena.vue'
import BattleTeamSelectModal from '../components/battle/BattleTeamSelectModal.vue'
import StoryDialogue from '../components/story/StoryDialogue.vue'
import RarityText from '../components/RarityText.vue'
import PokeSprite from '../components/PokeSprite.vue'
import { showToast } from '../components/ui/toast.js'
import { POKEMON_SPECIES } from '../game/data.js'

const scene = ref('list')
const selectOpen = ref(false)
const expandedChapters = ref([1])
const activeDialogue = ref(null)

const selectedScene = computed(() => STORY_SCENES.find((s) => s.id === battle.storySceneId))

const enemyPreview = computed(() => {
  if (!selectedScene.value || selectedScene.value.type !== 'battle') return []
  return selectedScene.value.enemies.map((e) => ({
    species: e.species,
    level: e.level,
    rarity: e.rarity,
    rarityName: e.rarity,
    type: POKEMON_SPECIES.find((s) => s.name === e.species)?.type,
  }))
})

const selectList = computed(() => getStorySelectList())

const progress = computed(() => getStoryProgress())

const currentDialogueLines = computed(() => {
  const s = STORY_SCENES.find((x) => x.id === activeDialogue.value)
  return s && s.type === 'dialogue' ? s.lines : []
})

function sceneCleared(id) {
  return isStorySceneCleared(id)
}

function sceneUnlocked(id) {
  return isStorySceneUnlocked(id)
}

function chapterScenes(chapterId) {
  return getChapterScenes(chapterId)
}

function isChapterExpanded(chapterId) {
  return expandedChapters.value.includes(chapterId)
}

function toggleChapter(chapterId) {
  const idx = expandedChapters.value.indexOf(chapterId)
  if (idx >= 0) expandedChapters.value.splice(idx, 1)
  else expandedChapters.value.push(chapterId)
}

function chapterClearedCount(chapterId) {
  return chapterScenes(chapterId).filter((s) => sceneCleared(s.id)).length
}

const sortOptions = [
  { value: 'level-desc', label: 'Cấp độ (Cao -> Thấp)' },
  { value: 'level-asc', label: 'Cấp độ (Thấp -> Cao)' },
]

function openScene(id) {
  const s = STORY_SCENES.find((x) => x.id === id)
  if (!s) return
  if (s.type === 'dialogue') {
    activeDialogue.value = id
  } else {
    battle.storySceneId = id
    battle.teamIndices = [null, null, null]
    scene.value = 'prep'
  }
}

// Đọc hết hội thoại → đánh dấu đã đọc → tự chuyển sang scene kế tiếp
function onDialogueDone() {
  const id = activeDialogue.value
  if (!id) return
  markStoryCleared(id)
  activeDialogue.value = null
  const next = STORY_SCENES[getStorySceneIndex(id) + 1]
  if (next) openScene(next.id)
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
  if (startStoryBattle(battle.storySceneId)) {
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
    <!-- SCENE 1: BẢN ĐỒ STORY -->
    <div v-if="scene === 'list'" class="app-card p-6">
      <h3 class="text-lg font-bold text-slate-800">📖 Hành Trình Truyền Thuyết</h3>
      <p class="mt-1 text-sm text-slate-500">Đọc hội thoại và đánh bại các Boss huyền thoại — đọc/đánh xong scene trước mới mở scene sau!</p>
      <div class="mt-2 text-xs text-slate-500">
        Tiến độ: <span class="font-bold text-amber-600">{{ progress.cleared }}/{{ progress.total }}</span> scene đã hoàn thành
      </div>

      <!-- HỘI THOẠI ĐANG MỞ -->
      <div v-if="activeDialogue" class="mx-auto mt-5 max-w-xl">
        <StoryDialogue :lines="currentDialogueLines" @done="onDialogueDone" />
      </div>

      <!-- BẢN ĐỒ CHƯƠNG -->
      <div v-else class="mt-5 space-y-5">
        <div
          v-for="ch in STORY_CHAPTERS"
          :key="ch.id"
          class="rounded-xl border border-slate-200 bg-white p-4"
        >
          <button @click="toggleChapter(ch.id)" class="flex w-full items-center justify-between gap-2 text-left">
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-lg">{{ ch.icon }}</span>
              <div>
                <div class="text-sm font-bold text-slate-800">{{ ch.name }}</div>
                <div class="text-[11px] text-slate-500">{{ ch.description }}</div>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <div class="text-[11px] font-bold text-emerald-600">{{ chapterClearedCount(ch.id) }}/{{ chapterScenes(ch.id).length }}</div>
              <span class="text-xs text-slate-400">{{ isChapterExpanded(ch.id) ? '▲' : '▼' }}</span>
            </div>
          </button>

          <div v-if="isChapterExpanded(ch.id)" class="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              v-for="s in chapterScenes(ch.id)"
              :key="s.id"
              :disabled="!sceneUnlocked(s.id)"
              @click="openScene(s.id)"
              class="relative w-full rounded-xl border p-3 text-left transition"
              :class="
                !sceneUnlocked(s.id)
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'
              "
            >
              <span v-if="!sceneUnlocked(s.id)" class="absolute right-2 top-2 text-sm">🔒</span>
              <span v-if="sceneCleared(s.id)" class="absolute right-2 top-2 text-sm">✅</span>
              <div class="pr-6 text-sm font-bold" :class="sceneUnlocked(s.id) ? 'text-amber-600' : 'text-slate-400'">
                {{ s.type === 'dialogue' ? '📖 ' : '⚔️ ' }}{{ s.type === 'dialogue' ? (s.lines[0]?.text?.slice(0, 28) || 'Đối thoại') : s.name }}
              </div>
              <div class="mt-1 text-xs" :class="sceneUnlocked(s.id) ? 'text-slate-500' : 'text-slate-400'">
                {{ s.type === 'dialogue' ? 'Hội thoại — nhấn để đọc' : `${s.description} (${s.enemies.length} đối thủ)` }}
              </div>
              <div v-if="s.type === 'battle'" class="mt-1 text-[11px] text-emerald-600">
                Thưởng: {{ s.rewardGems }} Gem | {{ s.rewardExp }} EXP
              </div>
              <div v-if="!sceneUnlocked(s.id)" class="mt-1 text-[10px] font-semibold text-red-400/70">Xong scene trước để mở khóa</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SCENE 2: CHUẨN BỊ -->
    <div v-else-if="scene === 'prep'" class="app-card p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800">📖 {{ selectedScene?.name }}</h3>
        <button
          @click="scene = 'list'"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          ← Quay Lại
        </button>
      </div>
      <p class="text-sm text-slate-500">{{ selectedScene?.description }}</p>
      <p class="mt-1 text-xs font-semibold text-amber-600">Thưởng: +{{ selectedScene?.rewardGems }} Gem | +{{ selectedScene?.rewardExp }} EXP</p>

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
      title="📖 Chọn Pokémon Xuất Trận"
      empty-text="⭐ Pokédex trống! Vào mục Đội Hình, nhấn ⭐ để thêm Pokémon chủ lực vào Pokédex."
      @close="selectOpen = false"
      @select="onSelectPoke"
    />
  </div>
</template>
