<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { store } from '../../game/store.js'
import { getPlayerNextLevelExp } from '../../game/stats.js'
import { POKEDEX_LIMIT } from '../../game/data.js'
import { WorldScene, setWorldRuntime } from './worldScene.js'
import { LOCATIONS } from '../../game/world.js'
import { getMap, TOWN_ID, getMapTilesets, getMapSpawn } from '../../game/maps.js'
import { showToast } from '../ui/toast.js'
import OakLabDialogue from '../onboarding/OakLabDialogue.vue'
import HomeStartDialogue from '../onboarding/HomeStartDialogue.vue'
import HospitalModal from './HospitalModal.vue'

const emit = defineEmits(['open'])

// --- STATE ---
const containerRef = ref(null)
const selectedLocation = ref(null) // popover đa chức năng
const inRangeLocId = ref(null)
const oakDialogueOpen = ref(false) // hội thoại onboarding Giáo sư Oak
const homeTalkOpen = ref(false) // tự thoại khi lần đầu xuất hiện trong nhà
const homeTalkShown = ref(false) // đã xem tự thoại lần đầu chưa (reset khi Reset Game)
const hospitalOpen = ref(false) // hội thoại y tá bệnh viện
const playerX = ref(store.worldPos?.x ?? 800)
const playerY = ref(store.worldPos?.y ?? 520)
const cameraX = ref(0)
const cameraY = ref(0)
const viewportW = ref(0)
const viewportH = ref(0)
const infoPanelOpen = ref(false) // bảng thông tin trượt trái, bấm Tab để bật/tắt

let game = null
let resizeObserver = null

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const onboardingActive = computed(() => !store.gameState.player.hasCompletedFirstLogin)

// Thông tin người chơi cho HUD (bấm Tab)
const playerInfo = computed(() => store.gameState.player)
const expPercent = computed(() => {
  const next = getPlayerNextLevelExp(playerInfo.value.level)
  return Math.min(100, Math.max(0, (playerInfo.value.playerExp / next) * 100))
})
const expText = computed(
  () => `${playerInfo.value.playerExp.toLocaleString('en-US')} / ${getPlayerNextLevelExp(playerInfo.value.level).toLocaleString('en-US')} EXP`,
)
const pokedexCount = computed(() => store.gameState.pokedex.length)

// Marker chỉ dẫn khi mới chơi: trỏ tới cửa đích theo từng map
function getOnboardingTarget(mapId) {
  if (!onboardingActive.value) return null
  if (mapId === 'house') return { mapId: 'house', col: 2, row: 0 } // cửa ra nhà
  if (mapId === 'town') return { mapId: 'town', col: 45, row: 28 } // cửa Phòng Lab (tòa nhà phải)
  return null
}
const onboardingTarget = computed(() => getOnboardingTarget(currentMapId.value))

// --- MAP HIỆN TẠI ---
const currentMapId = ref(store.worldPos?.mapId || TOWN_ID)
const mapInfo = computed(() => getMap(currentMapId.value))
const mapW = computed(() => mapInfo.value.width)
const mapH = computed(() => mapInfo.value.height)

// --- COMPUTED ---
const clampedCameraX = computed(() => clamp(cameraX.value, 0, mapW.value - viewportW.value))
const clampedCameraY = computed(() => clamp(cameraY.value, 0, mapH.value - viewportH.value))

const inRangeLoc = computed(() => LOCATIONS.find((l) => l.id === inRangeLocId.value) || null)

// Điểm định vị trên minimap. Đọc `spots` của map hiện tại (x,y = tọa độ tâm, px thế giới);
// fallback LOCATIONS legacy (x,y = góc trên-trái + w,h) chỉ cho map legacy.
const spotCenterX = (l) => l.x + (l.w || 0) / 2
const spotCenterY = (l) => l.y + (l.h || 0) / 2
const mapSpots = computed(() => mapInfo.value.spots || [])
const mapLocations = computed(() =>
  mapSpots.value.length
    ? mapSpots.value.filter((s) => s.type !== 'quest')
    : mapInfo.value.kind === 'legacy'
      ? LOCATIONS.filter((l) => l.modes?.length)
      : [],
)
// Mục tiêu nhiệm vụ (spot type 'quest') — hiện chấm đỏ nhấp nháy, sẵn sàng cho tính năng định vị quest
const questLocations = computed(() => mapSpots.value.filter((s) => s.type === 'quest'))

// Minimap scale (minimap 192×120)
const MM_W = 192
const MM_H = 120
const mmScaleX = computed(() => MM_W / mapW.value)
const mmScaleY = computed(() => MM_H / mapH.value)

// Vòng highlight quanh địa điểm đang trong vùng tương tác (screen-space)
const ringStyle = computed(() => {
  if (!inRangeLoc.value) return {}
  const cx = inRangeLoc.value.x + inRangeLoc.value.w / 2 - clampedCameraX.value
  const cy = inRangeLoc.value.y + inRangeLoc.value.h / 2 - clampedCameraY.value
  const s = Math.max(inRangeLoc.value.w, inRangeLoc.value.h) + 8
  return {
    left: cx - s / 2 + 'px',
    top: cy - s / 2 + 'px',
    width: s + 'px',
    height: s + 'px',
  }
})

// Mode icon/label helpers (popover)
const getModeIcon = (mode) => {
  const icons = {
    gacha: '🎁', roster: '🎒', merge: '🧬',
    shop: '🛒', inventory: '📦',
    campaign: '⚔️', story: '📖', gym: '🏟️', tower: '🗼', daily: '📅',
    enter_house: '🚪',
  }
  return icons[mode] || '📍'
}

const getModeLabel = (mode) => {
  const labels = {
    gacha: 'Gacha', roster: 'Đội Hình', merge: 'Hợp Nhất',
    shop: 'Cửa Hàng', inventory: 'Kho Đồ',
    campaign: 'Chiến Dịch', story: 'Story', gym: 'Phòng Gym', tower: 'Leo Tháp', daily: 'Hằng Ngày',
    enter_house: 'Vào Nhà',
  }
  return labels[mode] || mode
}

// --- METHODS ---
// Trong lúc onboarding (chưa nhập tên + chọn starter), khoá mọi thứ ngoài lab
function gateOnboarding() {
  if (onboardingActive.value) {
    showToast('🧑‍🔬 Hãy nói chuyện với Giáo sư Oak ở phòng lab trước đã nhé!', 'warning')
    return true
  }
  return false
}

// Đồng bộ trạng thái khoá di chuyển của scene với hội thoại/bảng thông tin đang mở
function syncSceneLock() {
  const scene = game?.scene?.getScene('WorldScene')
  scene?.setLocked?.(oakDialogueOpen.value || homeTalkOpen.value || infoPanelOpen.value)
}

function openOakDialogue() {
  if (oakDialogueOpen.value) return
  oakDialogueOpen.value = true
  syncSceneLock()
}

function onOakComplete() {
  oakDialogueOpen.value = false
  syncSceneLock()
  showToast('🎉 Chúc mừng! Bạn đã nhận Pokémon khởi đầu và bắt đầu hành trình!', 'success')
}

function openHomeTalk() {
  if (homeTalkOpen.value) return
  homeTalkOpen.value = true
  syncSceneLock()
}

function onHomeTalkComplete() {
  homeTalkOpen.value = false
  homeTalkShown.value = true
  syncSceneLock()
  showToast('🧭 Ra khỏi nhà → đến Phòng Lab của Giáo sư Oak (tòa nhà bên phải thị trấn) để nhận Pokémon khởi đầu!', 'info')
}

function onOpen(mode) {
  if (gateOnboarding()) return
  // Địa điểm "nhặt" không mở tab — cộng vật phẩm + toast ngay trên bản đồ
  if (mode === 'candy') {
    store.inventory.candy = (store.inventory.candy || 0) + 5
    showToast('Nhặt được 5 🍬 Kẹo Kinh Nghiệm!')
    return
  }
  if (mode === 'lake') {
    store.gold = (store.gold || 0) + 50
    showToast('Nhặt được 50 🪙 Vàng!')
    return
  }
  emit('open', mode)
}

function onModeSelected(modeId) {
  if (gateOnboarding()) return
  selectedLocation.value = null
  if (modeId === 'enter_house') {
    enterHouse()
    return
  }
  emit('open', modeId)
}

// Chuyển sang interior `lab`
function enterHouse() {
  switchMap('lab', 'lab_door')
}

// Giải nơi xuất hiện: theo tên spawn trong JSON map đích, theo pixel, hoặc fallback maps.js
function resolveSpawn(mapId, spawnRef) {
  if (typeof spawnRef === 'string') {
    const s = getMapSpawn(mapId, spawnRef)
    if (s) return { x: s.x, y: s.y }
  } else if (spawnRef && typeof spawnRef.x === 'number') {
    return { x: spawnRef.x, y: spawnRef.y }
  }
  const def = getMap(mapId).spawn
  return def ? { x: def.x, y: def.y } : { x: 0, y: 0 }
}

// Chuyển scene (cửa io / nút Vào Nhà): lưu vị trí hiện tại rồi restart scene
async function switchMap(mapId, spawnRef) {
  await getMapTilesets(mapId)
  const spawn = resolveSpawn(mapId, spawnRef)
  store.prevMapPos = {
    mapId: currentMapId.value,
    x: Math.round(playerX.value),
    y: Math.round(playerY.value),
  }
  currentMapId.value = mapId
  store.worldPos.mapId = mapId
  store.worldPos.x = Math.round(spawn.x)
  store.worldPos.y = Math.round(spawn.y)
  selectedLocation.value = null
  setWorldRuntime({ onboardingTarget: getOnboardingTarget(mapId) })
  game?.scene.getScene('WorldScene').scene.restart({ mapId, startPos: { x: spawn.x, y: spawn.y } })
}

function onMapChange(mapId, spawn, transitionData) {
  // Cho phép đi bộ giữa các map trong lúc onboarding (nhà → thị trấn → lab)
  // Nếu là gym, mở tab Gym thay vì chuyển map
  if (mapId === 'gym' && transitionData?.gymType) {
    emit('open', 'gym', transitionData.gymType)
    return
  }
  // Cửa Chiến Dịch (⚔️) — mở tab Chiến Dịch thay vì chuyển map
  if (mapId === 'campaign') {
    emit('open', 'campaign')
    return
  }
  switchMap(mapId, spawn)
}

// Registry handler tương tác theo loại (type = tên property của layer tương tác).
// Thêm loại mới: thêm 1 dòng vào đây + 1 layer <type>=2 trong Tiled, không cần sửa scene.
const INTERACT_HANDLERS = {
  healing: (pt) => {
    if (currentMapId.value === 'hospital') {
      hospitalOpen.value = true
      syncSceneLock()
    }
  },
  // dialogue: (pt) => openNpcDialogue(pt.value),
  // quest: (pt) => openQuest(pt.value),
}
const INTERACT_LABELS = { interac: 'Điểm tương tác', quest: 'Nhiệm vụ', io: 'Cửa', healing: 'Y tá', dialogue: 'Hội thoại' }

function onTileInteract(pt) {
  // Điểm nói chuyện với Giáo sư Oak trong lab
  if (pt.id === 'oak') {
    if (onboardingActive.value) {
      openOakDialogue()
    } else {
      const name = store.gameState.player.playerName || 'nhà vô địch'
      showToast(`👨‍🔬 Giáo sư Oak: Ta tin cháu sẽ làm được, ${name}! Hãy quay lại đây khi cháu cần.`, 'info')
    }
    return
  }
  const handler = INTERACT_HANDLERS[pt.type]
  if (handler) {
    handler(pt)
    return
  }
  showToast(`${INTERACT_LABELS[pt.type] || pt.type} tại ô (${pt.col}, ${pt.row})`)
}

// --- LIFECYCLE ---
function destroyGame() {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (game) {
    game.destroy(true)
    game = null
  }
}

async function startGame() {
  const container = containerRef.value
  if (!container) return
  viewportW.value = container.clientWidth || 960
  viewportH.value = container.clientHeight || 560

  // Resolve tileset từ JSON trước khi boot Phaser (worldScene preload đọc mapInfo.tilesets)
  await getMapTilesets(currentMapId.value)

  setWorldRuntime({
    callbacks: {
      onOpen,
      onShowPopover: (loc) => { selectedLocation.value = loc },
      onPlayerPos: (x, y) => {
        playerX.value = x
        playerY.value = y
        store.worldPos.x = Math.round(x)
        store.worldPos.y = Math.round(y)
        cameraX.value = x - viewportW.value / 2
        cameraY.value = y - viewportH.value / 2
      },
      onInRange: (id) => {
        inRangeLocId.value = id
        if (selectedLocation.value && id !== selectedLocation.value.id) {
          selectedLocation.value = null
        }
      },
      onMapInfo: (mapId) => {
        currentMapId.value = mapId
        // Lần đầu vào game: tự thoại trong nhà → sau đó mới tới hội thoại Oak ở lab
        if (onboardingActive.value && mapId === 'house' && !homeTalkShown.value) {
          openHomeTalk()
        } else if (onboardingActive.value && mapId === 'lab' && !oakDialogueOpen.value) {
          openOakDialogue()
        } else {
          syncSceneLock()
        }
      },
      onMapChange,
      onTileInteract,
    },
    startPos: { x: playerX.value, y: playerY.value },
    onboardingTarget: onboardingTarget.value,
  })

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    backgroundColor: '#7dd3fc',
    render: { pixelArt: true, roundPixels: true },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scene: [WorldScene],
  })

  resizeObserver = new ResizeObserver(() => {
    viewportW.value = container.clientWidth
    viewportH.value = container.clientHeight
  })
  resizeObserver.observe(container)
}

// Phaser đăng ký listener keydown trên window (bubble) và preventDefault các phím di chuyển
// (addKeys mặc định capture=true) → gõ WASD/arrows trong ô nhập liệu bị chặn, map bị "nuốt" phím.
// Guard này chặn sự kiện ở pha capture khi focus đang nằm trong ô nhập liệu để Phaser không đọc phím đó.
function isEditableTarget(t) {
  return !!t && !!t.tagName && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}
function onGlobalKeydownCapture(e) {
  if (isEditableTarget(e.target)) e.stopPropagation()
}
// Phím Tab: bật/tắt bảng thông tin (tránh chuyển focus của trình duyệt)
function onTabKeydown(e) {
  if (e.key === 'Tab' && !isEditableTarget(e.target)) {
    e.preventDefault()
    infoPanelOpen.value = !infoPanelOpen.value
    syncSceneLock()
  }
}

function closeInfoPanel() {
  infoPanelOpen.value = false
  syncSceneLock()
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydownCapture, true)
  window.addEventListener('keydown', onTabKeydown)
  startGame()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydownCapture, true)
  window.removeEventListener('keydown', onTabKeydown)
  destroyGame()
})

// Reset game (hoặc thay đổi mapId từ ngoài): quay về map mới trong store
watch(
  () => store.worldPos.mapId,
  async (newMapId) => {
    if (!newMapId || newMapId === currentMapId.value) return
    const map = getMap(newMapId)
    await getMapTilesets(newMapId)
    currentMapId.value = newMapId
    playerX.value = store.worldPos.x ?? map.spawn.x
    playerY.value = store.worldPos.y ?? map.spawn.y
    selectedLocation.value = null
    inRangeLocId.value = null
    setWorldRuntime({ onboardingTarget: getOnboardingTarget(newMapId) })
    game?.scene.getScene('WorldScene').scene.restart({
      mapId: newMapId,
      startPos: { x: playerX.value, y: playerY.value },
    })
  },
)

// Reset game → bắt đầu lại onboarding từ đầu (tự thoại trong nhà sẽ hiện lại)
watch(
  onboardingActive,
  (active) => {
    if (active) {
      homeTalkShown.value = false
      homeTalkOpen.value = false
      oakDialogueOpen.value = false
      // Trường hợp reset ngay trong nhà (không restart scene): mở lại tự thoại
      if (game && currentMapId.value === 'house') openHomeTalk()
    }
  },
)
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-black">
    <!-- PHASER CANVAS -->
    <div ref="containerRef" class="absolute inset-0" />

    <!-- BẢNG THÔNG TIN TRƯỢT TRÁI (bấm Tab để mở/đóng) -->
    <Teleport to="body">
      <div
        v-show="infoPanelOpen"
        class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        :class="infoPanelOpen ? 'opacity-100' : 'opacity-0'"
        @click="closeInfoPanel"
      />
      <aside
        v-show="infoPanelOpen"
        class="fixed left-0 top-0 z-40 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out"
        :class="infoPanelOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="flex items-center gap-3 border-b border-slate-200 p-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-fuchsia-500 text-xl shadow-md shadow-fuchsia-500/30">
            👤
          </div>
          <div class="flex-1">
            <div class="text-base font-bold text-slate-800">{{ playerInfo.playerName || 'Player 1' }}</div>
            <div class="text-xs font-semibold text-amber-600">Lv. {{ playerInfo.level }}</div>
          </div>
          <button
            @click="closeInfoPanel"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Đóng (Tab)"
          >
            ×
          </button>
        </div>

        <div class="space-y-5 p-4">
          <!-- KINH NGHIỆM -->
          <div>
            <span class="mb-1.5 block text-xs font-semibold text-slate-500">⚡ Kinh Nghiệm</span>
            <div class="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                :style="{ width: expPercent + '%' }"
              ></div>
            </div>
            <span class="mt-1.5 block text-xs text-slate-500">{{ expText }}</span>
          </div>

          <!-- TÀI NGUYÊN -->
          <div>
            <span class="mb-2 block text-xs font-semibold text-slate-500">💎 Tài Nguyên</span>
            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div class="text-[11px] text-slate-400">💰 Vàng</div>
                <div class="text-sm font-bold text-amber-600">{{ store.gold.toLocaleString('en-US') }}</div>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div class="text-[11px] text-slate-400">💎 Kim Cương</div>
                <div class="text-sm font-bold text-sky-600">{{ store.gems.toLocaleString('en-US') }}</div>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div class="text-[11px] text-slate-400">🎟️ PokePoint</div>
                <div class="text-sm font-bold text-fuchsia-600">{{ playerInfo.pokePoint.toLocaleString('en-US') }}</div>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div class="text-[11px] text-slate-400">🎫 PokeGacha</div>
                <div class="text-sm font-bold text-amber-600">{{ playerInfo.pokeGacha.toLocaleString('en-US') }}</div>
              </div>
            </div>
          </div>

          <!-- POKÉDEX -->
          <div>
            <span class="mb-2 block text-xs font-semibold text-slate-500">📖 Pokédex</span>
            <div class="rounded-xl border border-amber-400/60 bg-amber-50 px-3 py-2.5">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-amber-700">Số lượng đã ghi nhận</span>
                <span class="text-sm font-black text-amber-700">{{ pokedexCount }} / {{ POKEDEX_LIMIT }}</span>
              </div>
              <p class="mt-1 text-[11px] leading-snug text-amber-600/80">
                Thêm Pokémon chủ lực vào Pokédex bằng cách bấm ⭐ trong mục Đội Hình.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </Teleport>

    <!-- Vòng highlight khi trong vùng tương tác -->
    <div
      v-if="inRangeLoc"
      class="absolute z-10 rounded-full border-2 border-amber-400/70 bg-amber-300/10 animate-ping pointer-events-none"
      :style="ringStyle"
    />

    <!-- MINIMAP (góc dưới phải) -->
    <div class="pointer-events-none absolute bottom-3 right-3 h-30 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-lg">
      <div class="absolute inset-0">
        <!-- Viewport indicator -->
        <div
          class="absolute rounded-sm border-2 border-sky-500/60"
          :style="{
            left: clampedCameraX * mmScaleX + 'px',
            top: clampedCameraY * mmScaleY + 'px',
            width: viewportW * mmScaleX + 'px',
            height: viewportH * mmScaleY + 'px',
          }"
        />
        <!-- Địa điểm đa chức năng -->
        <div
          v-for="loc in mapLocations"
          :key="loc.id"
          class="absolute rounded"
          :class="loc.id === inRangeLocId ? 'h-1.5 w-1.5 bg-amber-400 animate-pulse' : 'h-1 w-1 bg-amber-400/80'"
          :style="{
            left: spotCenterX(loc) * mmScaleX - 2 + 'px',
            top: spotCenterY(loc) * mmScaleY - 2 + 'px',
          }"
        />
        <!-- Mục tiêu nhiệm vụ (định vị quest) -->
        <div
          v-for="spot in questLocations"
          :key="spot.id"
          class="absolute h-1.5 w-1.5 rounded bg-red-500 animate-pulse"
          :style="{
            left: spotCenterX(spot) * mmScaleX - 3 + 'px',
            top: spotCenterY(spot) * mmScaleY - 3 + 'px',
          }"
        />
        <!-- Người chơi -->
        <div
          class="absolute h-2 w-2 rounded-full border border-white bg-sky-500 shadow"
          :style="{
            left: playerX * mmScaleX - 4 + 'px',
            top: playerY * mmScaleY - 4 + 'px',
          }"
        />
      </div>
      <div class="absolute left-1 top-1 rounded bg-sky-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
        📍 Bản đồ
      </div>
    </div>

    <!-- CONTROLS HINT -->
    <div class="absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-md backdrop-blur-sm">
      <kbd class="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">WASD</kbd> /
      <kbd class="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">↑↓←→</kbd>
      để di chuyển — đến gần địa điểm để tương tác ·
      <kbd class="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">Tab</kbd>
      để xem thông tin
    </div>
  </div>

  <!-- HỘI THOẠI ONBOARDING GIÁO SƯ OAK -->
  <OakLabDialogue :open="oakDialogueOpen" @complete="onOakComplete" />

  <!-- TỰ THOẠI LẦN ĐẦU TRONG NHÀ -->
  <HomeStartDialogue :open="homeTalkOpen" @complete="onHomeTalkComplete" />

  <!-- HỘI THOẠI Y TÁ BỆNH VIỆN -->
  <HospitalModal :open="hospitalOpen" @close="hospitalOpen = false" @openRoster="emit('open', 'roster')" />

  <!-- MODE SELECT POPOVER (địa điểm nhiều chức năng) -->
  <Teleport to="body">
    <div
      v-if="selectedLocation"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="selectedLocation = null"
    >
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div class="relative w-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
          <span class="text-2xl">{{ selectedLocation.icon }}</span>
          {{ selectedLocation.name }}
        </h3>
        <p class="mb-4 text-sm text-slate-500">Chọn chức năng:</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="mode in selectedLocation.modes"
            :key="mode"
            @click="onModeSelected(mode)"
            class="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 transition hover:border-amber-400 hover:bg-amber-50"
          >
            <span class="text-3xl">{{ getModeIcon(mode) }}</span>
            <span class="text-sm font-bold text-slate-700">{{ getModeLabel(mode) }}</span>
          </button>
        </div>
        <button
          @click="selectedLocation = null"
          class="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          Đóng
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Animation cho popover */
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-in {
  animation: scale-in 0.15s ease-out;
}

/* Ping animation cho vòng highlight */
@keyframes ping {
  75%, 100% { transform: scale(1.5); opacity: 0; }
}
.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
