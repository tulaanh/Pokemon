<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { playMusic } from './game/audio.js'
import GameHeader from './components/GameHeader.vue'
import CheatConsole from './components/CheatConsole.vue'
import WorldMap from './components/map/WorldMap.vue'
import GachaView from './views/GachaView.vue'
import RosterView from './views/RosterView.vue'
import MergeView from './views/MergeView.vue'
import ShopView from './views/ShopView.vue'
import InventoryView from './views/InventoryView.vue'
import CampaignView from './views/CampaignView.vue'
import StoryView from './views/StoryView.vue'
import GymView from './views/GymView.vue'
import TowerView from './views/TowerView.vue'
import DailyView from './views/DailyView.vue'
import TrainingView from './views/TrainingView.vue'
import BattleArena from './components/battle/BattleArena.vue'
import { getOnboardingStage, STORY_STAGES } from './game/story.js'
import Toast from './components/ui/Toast.vue'
import ConfirmModal from './components/ui/ConfirmModal.vue'
import SettingsModal from './components/ui/SettingsModal.vue'
import ScreenTransition from './components/ui/ScreenTransition.vue'
import { withScreenTransition } from './game/screenTransition.js'

const categories = [
  {
    id: 'collection',
    icon: '🎮',
    label: 'Thu Thập & Đội Hình',
    desc: 'Quay Gacha, quản lý đội hình và hợp nhất',
    modes: [
      { id: 'gacha', icon: '🎁', label: 'Gacha' },
      { id: 'roster', icon: '🎒', label: 'Đội Hình' },
      { id: 'merge', icon: '🧬', label: 'Hợp Nhất' },
    ],
  },
  {
    id: 'battle',
    icon: '⚔️',
    label: 'Chiến Đấu',
    desc: 'Chiến dịch, Story, Gym và leo tháp',
    modes: [
      { id: 'campaign', icon: '⚔️', label: 'Chiến Dịch' },
      { id: 'story', icon: '📖', label: 'Story' },
      { id: 'gym', icon: '🏟️', label: 'Phòng Gym' },
      { id: 'tower', icon: '🗼', label: 'Leo Tháp' },
    ],
  },
  {
    id: 'items',
    icon: '🛒',
    label: 'Vật Phẩm',
    desc: 'Mua sắm và quản lý vật phẩm',
    modes: [
      { id: 'shop', icon: '🛒', label: 'Cửa Hàng' },
      { id: 'inventory', icon: '📦', label: 'Kho Đồ' },
    ],
  },
  {
    id: 'events',
    icon: '📅',
    label: 'Sự Kiện',
    desc: 'Điểm danh và nhiệm vụ hằng ngày',
    modes: [
      { id: 'daily', icon: '📅', label: 'Hằng Ngày' },
    ],
  },
]

const MODE_VIEWS = {
  gacha: GachaView,
  roster: RosterView,
  merge: MergeView,
  campaign: CampaignView,
  story: StoryView,
  shop: ShopView,
  inventory: InventoryView,
  gym: GymView,
  tower: TowerView,
  daily: DailyView,
  training: TrainingView,
  wild: BattleArena,
}

const activeMode = ref(null)

const activeModeInfo = computed(() => {
  for (const cat of categories) {
    const mode = cat.modes.find((m) => m.id === activeMode.value)
    if (mode) return mode
  }
  // Trận huấn luyện chỉ mở từ cốt truyện (không nằm trong menu chính)
  if (activeMode.value === 'training') return { icon: '🎓', label: 'Trận Huấn Luyện' }
  return null
})

const onboardingStage = computed(() => getOnboardingStage())
const onboardingActive = computed(() => onboardingStage.value < STORY_STAGES.DONE)

function handleOpenMode(mode, ...args) {
  withScreenTransition(async () => {
    if (mode === 'gym' && args[0]) {
      // Set gym type in battle state before opening
      const { battle } = await import('./game/battle.js')
      battle.gymType = args[0]
    }
    if (mode === 'wild' && args[0]) {
      // Set wild Pokemon in battle state before opening
      const { battle, startWildBattle } = await import('./game/battle.js')
      startWildBattle(args[0])
    }
    activeMode.value = mode
  }, { label: 'Đang chuyển cảnh...', minDuration: 300 })
}

// --- NHẠC NỀN THEO NGỮ CẢNH ---
const BATTLE_MODES = ['campaign', 'story', 'gym', 'tower', 'training']

function trackForMode(mode) {
  if (mode === 'gacha') return 'gacha'
  if (BATTLE_MODES.includes(mode)) return 'battle'
  return 'map'
}

watch(activeMode, (mode) => {
  playMusic(trackForMode(mode))
})

// Trình duyệt chặn autoplay → khởi động nhạc ở thao tác đầu tiên của người dùng
function kickStart() {
  window.removeEventListener('pointerdown', kickStart)
  window.removeEventListener('keydown', kickStart)
  playMusic(trackForMode(activeMode.value))
}

onMounted(() => {
  window.addEventListener('pointerdown', kickStart)
  window.addEventListener('keydown', kickStart)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', kickStart)
  window.removeEventListener('keydown', kickStart)
})
</script>

<template>
  <div class="min-h-screen text-slate-800">
    <div
      class="pointer-events-none fixed inset-0 bg-cover bg-center opacity-20"
      style="background-image: url('/images/hinh_nen/anh_nen.jpg');"
    ></div>
    <div class="pointer-events-none fixed inset-0 bg-gradient-to-br from-sky-100/70 via-slate-50/60 to-fuchsia-100/70"></div>

    <div class="relative">
      <!-- BẢN ĐỒ THẾ GIỚI (fullscreen, ẩn header để map chiếm toàn bộ màn hình) -->
        <template v-if="activeMode === null">
          <div class="fixed inset-0 z-10">
            <WorldMap @open="handleOpenMode" />
          </div>
        <div
          v-if="onboardingActive"
          class="fixed left-1/2 top-3 z-20 -translate-x-1/2 rounded-xl border border-amber-300 bg-amber-50/95 px-4 py-3 text-center text-sm font-semibold text-amber-700 shadow-lg backdrop-blur-sm"
        >
          <template v-if="onboardingStage === STORY_STAGES.HOME">
            🧭 Nhiệm vụ: Đi đến <span class="font-black">Phòng Lab của Giáo sư Oak</span> (tòa nhà bên phải thị trấn) để nhập tên và nhận Pokémon khởi đầu!
          </template>
          <template v-else-if="onboardingStage === STORY_STAGES.GO_CAMPAIGN">
            🧭 Nhiệm vụ: Đi đến <span class="font-black">Cửa Chiến dịch ⚔️</span> ở thị trấn để bắt đầu hành trình!
          </template>
          <template v-else>
            🧭 Nhiệm vụ: Đến <span class="font-black">Bệnh viện Pokémon</span> nói chuyện với Y tá để đăng ký Pokédex và học cách chiến đấu!
          </template>
        </div>
      </template>

      <!-- CHẾ ĐỘ ĐANG MỞ (header + layout giữ nguyên) -->
      <template v-else>
        <GameHeader />
        <CheatConsole />

        <main class="mx-auto max-w-6xl px-4 py-6">
          <div class="mb-4 flex items-center gap-3">
            <button
              @click="activeMode = null"
              class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            >
              🏠 Trở Về
            </button>
            <div class="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-bold text-slate-800 shadow-sm">
              <span class="text-lg">{{ activeModeInfo?.icon }}</span>
              <span>{{ activeModeInfo?.label }}</span>
            </div>
          </div>

          <component :is="MODE_VIEWS[activeMode]" v-if="MODE_VIEWS[activeMode]" @back="activeMode = null" />
        </main>
      </template>
    </div>

    <!-- Toast + Confirm + Loading + Settings -->
    <Toast />
    <ConfirmModal />
    <ScreenTransition />
    <SettingsModal />
  </div>
</template>
