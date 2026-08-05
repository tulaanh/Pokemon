<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { store } from '../../game/store.js'
import { getPlayerNextLevelExp } from '../../game/stats.js'
import { POKEDEX_LIMIT } from '../../game/data.js'
import { getPvpRank } from '../../game/pvp/rank.js'
import { WorldScene, setWorldRuntime } from './worldScene.js'
import { LOCATIONS } from '../../game/world.js'
import { getMap, TOWN_ID, getMapTilesets, getMapSpawn, getMapTransitions } from '../../game/maps.js'
import { NPCS, QUESTS } from '../../game/quests.js'
import { getCharacter } from '../../game/characters.js'
import { showToast } from '../ui/toast.js'
import { openSettings } from '../ui/settingsModal.js'
import { beginScreenTransition, endScreenTransition, setScreenProgress } from '../../game/screenTransition.js'
import { getOnboardingStage, setOnboardingStage, STORY_STAGES } from '../../game/story.js'
import {
  connectPvP,
  isConnected,
  joinWorldMap,
  leaveWorldMap,
  sendWorldMove,
  sendPvpInvite,
  respondPvpInvite,
  syncPvpLevel,
  setPvPCallbacks,
  clearPvPCallbacks,
  setWorldCallbacks,
  clearWorldCallbacks,
} from '../../game/pvp/wsClient.js'
import OakLabDialogue from '../onboarding/OakLabDialogue.vue'
import HomeStartDialogue from '../onboarding/HomeStartDialogue.vue'
import HospitalStoryDialogue from '../onboarding/HospitalStoryDialogue.vue'
import HospitalModal from './HospitalModal.vue'
import InteractionMenu from './InteractionMenu.vue'
import NpcDialogue from './NpcDialogue.vue'

const emit = defineEmits(['open'])

// --- STATE ---
const containerRef = ref(null)
const selectedLocation = ref(null) // popover đa chức năng
const inRangeLocId = ref(null)
const oakDialogueOpen = ref(false) // hội thoại onboarding Giáo sư Oak
const homeTalkOpen = ref(false) // tự thoại khi lần đầu xuất hiện trong nhà
const homeTalkShown = ref(false) // đã xem tự thoại lần đầu chưa (reset khi Reset Game)
const hospitalOpen = ref(false) // hội thoại y tá bệnh viện
const hospitalStoryOpen = ref(false) // hội thoại cốt truyện Y tá (Pokédex + hướng dẫn combat)
const playerX = ref(store.worldPos?.x ?? 800)
const playerY = ref(store.worldPos?.y ?? 520)
const cameraX = ref(0)
const cameraY = ref(0)
const viewportW = ref(0)
const viewportH = ref(0)
const infoPanelOpen = ref(false) // bảng thông tin trượt trái, bấm Tab để bật/tắt
const arenaOnline = ref(false)
const arenaPlayers = ref(0)
const arenaConnectionHint = ref('')
const remotePlayers = ref([])
const incomingInvite = ref(null)
const outgoingInvite = ref(null)
const inviteNow = ref(Date.now())

const interactMenuOpen = ref(false) // bảng chọn khi gần ô tương tác (cửa, NPC)
const interactMenu = ref(null) // dữ liệu bảng chọn hiện tại
const npcDialogueOpen = ref(false) // hội thoại NPC (nói chuyện / nhiệm vụ)
const npcDialogue = ref(null) // dữ liệu hội thoại NPC hiện tại

let game = null
let resizeObserver = null
let arenaJoinPending = false
let arenaJoined = false
let arenaMoveLastSent = 0
let arenaLastSentPos = { x: null, y: null, facing: 'down', moving: false }
let inviteTimer = null

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const onboardingStage = computed(() => getOnboardingStage())
const onboardingActive = computed(() => onboardingStage.value < STORY_STAGES.DONE)

// Thông tin người chơi cho HUD (bấm Tab)
const playerInfo = computed(() => store.gameState.player)
const playerPvpRank = computed(() => getPvpRank(store.pvp.elo))
const expPercent = computed(() => {
  const next = getPlayerNextLevelExp(playerInfo.value.level)
  return Math.min(100, Math.max(0, (playerInfo.value.playerExp / next) * 100))
})
const expText = computed(
  () => `${playerInfo.value.playerExp.toLocaleString('en-US')} / ${getPlayerNextLevelExp(playerInfo.value.level).toLocaleString('en-US')} EXP`,
)
const pokedexCount = computed(() => store.gameState.pokedex.length)

// Marker chỉ dẫn theo stage cốt truyện: trỏ tới cửa đích của từng map
function getOnboardingTarget(mapId) {
  if (!onboardingActive.value) return null
  const stage = onboardingStage.value

  // Giai đoạn 0: nhà → thị trấn → lab (nhận starter từ Oak)
  if (stage === STORY_STAGES.HOME) {
    if (mapId === 'house') return { mapId: 'house', col: 2, row: 0 } // cửa ra nhà
    if (mapId === 'town') return { mapId: 'town', col: 45, row: 28 } // cửa Phòng Lab (tòa nhà phải)
    if (mapId === 'lab') return { mapId: 'lab', col: 7, row: 9 } // Giáo sư Oak
    return null
  }

  // Giai đoạn 1-2: đến Bệnh viện → nói chuyện với Y tá
  if (stage === STORY_STAGES.LAB_DONE || stage === STORY_STAGES.HOSPITAL) {
    if (mapId === 'town') return { mapId: 'town', col: 17, row: 28 } // cửa bệnh viện
    if (mapId === 'hospital') return { mapId: 'hospital', col: 8, row: 6 } // y tá
    return null
  }

  // Giai đoạn 3: đến cửa Chiến dịch ⚔️
  if (stage === STORY_STAGES.GO_CAMPAIGN) {
    if (mapId === 'hospital') return { mapId: 'hospital', col: 8, row: 12 } // cửa ra thị trấn
    if (mapId === 'town') return { mapId: 'town', col: 8, row: 12 } // cửa chiến dịch
    return null
  }

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

const isArenaMap = computed(() => currentMapId.value === 'arena')
const nearbyPlayer = computed(() => {
  if (!isArenaMap.value) return null
  return remotePlayers.value
    .map((player) => ({ player, distance: Math.hypot(player.x - playerX.value, player.y - playerY.value) }))
    .filter(({ distance }) => distance <= 64)
    .sort((a, b) => a.distance - b.distance)[0]?.player || null
})
const inviteSeconds = computed(() => Math.max(0, Math.ceil(((incomingInvite.value?.expiresAt || outgoingInvite.value?.expiresAt || 0) - inviteNow.value) / 1000)))

function inviteTeam() {
  return store.team.filter((p) => p && p.hp > 0).slice(0, 3).map((p) => ({
    id: p.id, speciesId: p.speciesId, name: p.name, level: p.level, hp: p.hp, maxHp: p.maxHp,
    atk: p.atk, def: p.def, spa: p.spa, spd: p.spd, spe: p.spe, type: p.type, types: p.types, skills: p.skills,
  }))
}

function inviteNearbyPlayer() {
  if (!nearbyPlayer.value || outgoingInvite.value) return
  const team = inviteTeam()
  if (team.length !== 3) {
    showToast('⚠️ Cần có đủ 3 Pokémon còn HP để mời PvP.', 'warning')
    return
  }
  if (!isConnected()) {
    showToast('🌐 Chưa kết nối máy chủ PvP.', 'warning')
    return
  }
  sendPvpInvite(nearbyPlayer.value.id, 'standard', team)
  showToast(`⚔️ Đã gửi lời mời PvP cho ${nearbyPlayer.value.name}.`, 'info')
}

function answerInvite(accepted) {
  if (!incomingInvite.value) return
  const inviteId = incomingInvite.value.inviteId
  if (accepted && inviteTeam().length !== 3) {
    showToast('⚠️ Cần có đủ 3 Pokémon còn HP để tham gia PvP.', 'warning')
    return
  }
  respondPvpInvite(inviteId, accepted, inviteTeam())
  incomingInvite.value = null
  syncSceneLock()
}

// Pokémon hoang dã đang xuất hiện — { x, y, mapId } (px thế giới, tâm tile)
const wildDot = ref(null)

// Bộ đếm encounter — { active, remainingMs, mapId } từ scene, cập nhật ~2 lần/giây
const encounterTick = ref(null)
const encounterCountdown = computed(() => {
  const t = encounterTick.value
  if (!t || t.mapId !== currentMapId.value) return null
  return t
})
const encounterSeconds = computed(() => Math.max(0, Math.ceil((encounterCountdown.value?.remainingMs ?? 0) / 1000)))

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
// Trong giai đoạn 0 (chưa nhận starter từ Oak), khoá mọi thứ ngoài lab
function gateOnboarding() {
  if (onboardingStage.value === STORY_STAGES.HOME) {
    showToast('🧑‍🔬 Hãy nói chuyện với Giáo sư Oak ở nhà ông ấy trước đã nhé!', 'warning')
    return true
  }
  return false
}

// Đồng bộ trạng thái khoá di chuyển của scene với hội thoại/bảng thông tin đang mở
function syncSceneLock() {
  const scene = game?.scene?.getScene('WorldScene')
  scene?.setLocked?.(
    oakDialogueOpen.value ||
      homeTalkOpen.value ||
      hospitalStoryOpen.value ||
      hospitalOpen.value ||
      infoPanelOpen.value ||
      interactMenuOpen.value ||
      npcDialogueOpen.value,
  )
}

function getScene() {
  return game?.scene?.getScene('WorldScene')
}

async function ensureArenaPresence(force = false) {
  if (!isArenaMap.value) return
  if (!force && arenaJoined) return
  if (arenaJoinPending) return

  arenaJoinPending = true
  try {
    if (!isConnected()) {
      await connectPvP()
    }
    if (!isConnected()) {
      arenaOnline.value = false
      arenaConnectionHint.value = 'Chưa kết nối server PvP'
      return
    }

    // Đồng bộ level hiện tại lên server để người chơi khác thấy đúng level
    syncPvpLevel()

    const scene = getScene()
    const x = scene?.player?.x ?? store.worldPos?.x ?? mapInfo.value.spawn.x
    const y = scene?.player?.y ?? store.worldPos?.y ?? mapInfo.value.spawn.y
    const facing = scene?.lastFacing || 'down'

    joinWorldMap('arena', { x, y, facing, moving: false })
    arenaJoined = true
    arenaOnline.value = true
    arenaConnectionHint.value = 'Đang ở arena online'
    arenaLastSentPos = { x, y, facing, moving: false }
  } catch (e) {
    arenaOnline.value = false
    arenaConnectionHint.value = e?.message || 'Không thể vào arena online'
  } finally {
    arenaJoinPending = false
  }
}

function leaveArenaPresence() {
  if (!arenaJoined) return
  leaveWorldMap('arena')
  arenaJoined = false
  arenaOnline.value = false
  arenaPlayers.value = 0
  arenaConnectionHint.value = ''
}

function sendArenaMove({ x, y, facing = 'down', moving = false }) {
  if (!isArenaMap.value || !arenaJoined || !isConnected()) return
  const now = Date.now()
  const movedFar = Math.hypot((x ?? 0) - (arenaLastSentPos.x ?? x ?? 0), (y ?? 0) - (arenaLastSentPos.y ?? y ?? 0)) >= 2
  const stateChanged = facing !== arenaLastSentPos.facing || moving !== arenaLastSentPos.moving
  if (!movedFar && !stateChanged && now - arenaMoveLastSent < 120) return
  arenaMoveLastSent = now
  arenaLastSentPos = { x, y, facing, moving }
  sendWorldMove('arena', { x, y, facing, moving })
}

function openOakDialogue() {
  if (oakDialogueOpen.value) return
  oakDialogueOpen.value = true
  syncSceneLock()
}

function onOakComplete() {
  oakDialogueOpen.value = false
  syncSceneLock()
  showToast('🎉 Chúc mừng! Bạn đã nhận Pokémon khởi đầu. Hãy đến Bệnh viện Pokémon để y tá đăng ký Pokédex!', 'success')
}

function closeHospitalStory() {
  hospitalStoryOpen.value = false
  syncSceneLock()
}

function closeHospital() {
  hospitalOpen.value = false
  syncSceneLock()
}

function onHospitalStoryTraining() {
  hospitalStoryOpen.value = false
  syncSceneLock()
  emit('open', 'training')
}

function onHospitalStoryGotoCampaign() {
  hospitalStoryOpen.value = false
  syncSceneLock()
  setOnboardingStage(STORY_STAGES.GO_CAMPAIGN)
  showToast('🧭 Hãy đi đến cửa Chiến dịch ⚔️ ở thị trấn để bắt đầu hành trình!', 'info')
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
  showToast('🧭 Ra khỏi nhà → đến nhà Giáo sư Oak (tòa nhà bên phải thị trấn) để nhận Pokémon khởi đầu!', 'info')
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
  beginScreenTransition({ label: 'Đang chuyển bản đồ...', minDuration: 300 })
  await getMapTilesets(mapId)
  const spawn = resolveSpawn(mapId, spawnRef)
  const nextMap = getMap(mapId)
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
  wildDot.value = null
  encounterTick.value = null
  setWorldRuntime({
    onboardingTarget: getOnboardingTarget(mapId),
    encounters: nextMap.encounters || { enabled: false },
  })
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
    if (currentMapId.value !== 'hospital') return
    const stage = onboardingStage.value
    // Giai đoạn 1-2 (cốt truyện): mở hội thoại Y tá hướng dẫn, còn lại mở modal hồi phục thường
    if (stage === STORY_STAGES.LAB_DONE || stage === STORY_STAGES.HOSPITAL) {
      hospitalStoryOpen.value = true
    } else {
      hospitalOpen.value = true
    }
    syncSceneLock()
  },
  // NPC mở cửa hàng / cửa hàng Gacha (store_npc / gacha_npc trong bản đồ tương ứng)
  npc: (pt) => {
    openNpcMenu(pt)
  },
  // dialogue: (pt) => openNpcDialogue(pt.value),
  // quest: (pt) => openQuest(pt.value),
}
const INTERACT_LABELS = { interac: 'Điểm tương tác', quest: 'Nhiệm vụ', io: 'Cửa', healing: 'Y tá', npc: 'NPC', dialogue: 'Hội thoại' }

// Xử lý tương tác ô cửa (io): mở bảng chọn xác nhận
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
  if (pt.type === 'io') {
    openIoMenu(pt)
    return
  }
  const handler = INTERACT_HANDLERS[pt.type]
  if (handler) {
    handler(pt)
    return
  }
  showToast(`${INTERACT_LABELS[pt.type] || pt.type} tại ô (${pt.col}, ${pt.row})`)
}

// === BẢNG CHỌN XÁC NHẬN CỬA (io) ===
function openIoMenu(pt) {
  const mapId = currentMapId.value
  const t = getMapTransitions(mapId)[`${pt.col},${pt.row}`]
  let label = 'Cửa'
  if (t?.to === 'house') label = 'Vào Nhà'
  else if (t?.to === 'lab') label = 'Vào Phòng Lab'
  else if (t?.to === 'hospital') label = 'Vào Bệnh Viện'
  else if (t?.to === 'store') label = 'Vào Cửa Hàng'
  else if (t?.to === 'gacha_store') label = 'Vào Cửa Hàng Gacha'
  else if (t?.to === 'gym') label = 'Vào Phòng Gym'
  else if (t?.to === 'campaign') label = 'Vào Chiến Dịch'
  interactMenuOpen.value = true
  interactMenu.value = {
    title: `🚪 ${label}`,
    icon: '🚪',
    pt,
    choices: [
      { id: 'enter', label: 'Đi vào', icon: '🚪' },
      { id: 'cancel', label: 'Để dành', icon: '❌' },
    ],
  }
  syncSceneLock()
}

function onInteractMenuSelect(choiceId) {
  if (!interactMenu.value) return
  const pt = interactMenu.value.pt
  interactMenuOpen.value = false
  interactMenu.value = null
  syncSceneLock()

  if (pt.type === 'io') {
    if (choiceId === 'enter') {
      const scene = game?.scene?.getScene('WorldScene')
      scene?.handleTransition?.(pt)
    }
    return
  }

  if (pt.type === 'npc') {
    onNpcMenuSelect(choiceId, pt.npcId)
    return
  }
}

// === BẢNG CHỌN NPC ===
function openNpcMenu(pt) {
  const npcId = pt.npcId
  const npc = NPCS[npcId]
  const hasQuest = npc?.questId && QUESTS[npc.questId]
  const choices = [{ id: 'talk', label: '💬 Nói chuyện', icon: '💬' }]
  if (hasQuest) choices.push({ id: 'quest', label: '📜 Nhiệm vụ', icon: '📜' })
  // Store/gacha clerk: thêm chức năng mua sắm
  if (npcId === 'store_npc') choices.push({ id: 'shop', label: '🛒 Cửa Hàng', icon: '🛒' })
  if (npcId === 'gacha_npc') choices.push({ id: 'gacha', label: '🎁 Gacha', icon: '🎁' })
  // James - Đấu trường trực tuyến
  if (npcId === 'James') {
    choices.push({ id: 'pvp_lobby', label: '⚔️ Tìm Trận PvP', icon: '⚔️' })
    choices.push({ id: 'pvp_ranking', label: '🏆 Bảng Xếp Hạng', icon: '🏆' })
    choices.push({ id: 'pvp_history', label: '📜 Lịch Sử Đấu', icon: '📜' })
  }
  interactMenuOpen.value = true
  interactMenu.value = {
    title: `${npc?.icon || '👤'} ${npc?.name || 'NPC'}`,
    icon: npc?.icon || '👤',
    pt,
    choices,
  }
  syncSceneLock()
}

function onNpcMenuSelect(choiceId, npcId) {
  if (!npcId) return
  interactMenuOpen.value = false
  interactMenu.value = null
  syncSceneLock()

  if (choiceId === 'talk') {
    openNpcDialogue(npcId, 'smalltalk')
    return
  }
  if (choiceId === 'quest') {
    openNpcDialogue(npcId, 'quest')
    return
  }
  if (choiceId === 'shop') {
    if (gateOnboarding()) return
    emit('open', 'shop')
    return
  }
  if (choiceId === 'gacha') {
    if (gateOnboarding()) return
    emit('open', 'gacha')
    return
  }
  // James actions
  if (choiceId === 'pvp_lobby') {
    if (gateOnboarding()) return
    // Từ thị trấn/địa điểm khác: đi thẳng sang arena trước.
    // Khi đã ở arena rồi thì mới mở lobby PvP để tìm trận.
    if (currentMapId.value !== 'arena') {
      const arenaSpawn = getMap('arena').spawn || { x: 160, y: 160 }
      switchMap('arena', arenaSpawn)
      return
    }
    emit('open', 'pvp_lobby')
    return
  }
  if (choiceId === 'pvp_ranking') {
    if (gateOnboarding()) return
    emit('open', 'pvp_ranking')
    return
  }
  if (choiceId === 'pvp_history') {
    if (gateOnboarding()) return
    emit('open', 'pvp_history')
    return
  }
}

function openNpcDialogue(npcId, mode) {
  npcDialogueOpen.value = true
  npcDialogue.value = { npcId, mode }
  syncSceneLock()
}

function registerWorldCallbacks() {
  setWorldCallbacks({
    onWorldSnapshot: ({ mapId, players }) => {
      if (mapId !== 'arena') return
      remotePlayers.value = Array.isArray(players) ? players : []
      arenaPlayers.value = Array.isArray(players) ? players.length : 0
      const scene = getScene()
      scene?.clearRemotePlayers?.()
      for (const player of players || []) {
        scene?.upsertRemotePlayer?.(player)
      }
    },
    onWorldPlayerJoined: ({ player }) => {
      if (player?.mapId !== 'arena') return
      arenaPlayers.value += 1
      remotePlayers.value = [...remotePlayers.value.filter((item) => item.id !== player.id), player]
      getScene()?.upsertRemotePlayer?.(player)
    },
    onWorldPlayerMoved: ({ player }) => {
      remotePlayers.value = remotePlayers.value.map((item) => item.id === player.id ? { ...item, ...player } : item)
      if (player?.mapId !== 'arena') return
      getScene()?.upsertRemotePlayer?.(player)
    },
    onWorldPlayerLeft: ({ player }) => {
      if (player?.mapId !== 'arena') return
      arenaPlayers.value = Math.max(0, arenaPlayers.value - 1)
      remotePlayers.value = remotePlayers.value.filter((item) => item.id !== player?.id)
      getScene()?.removeRemotePlayer?.(player?.id)
    },
    onWorldError: ({ message }) => {
      arenaOnline.value = false
      arenaConnectionHint.value = message || 'Không thể đồng bộ arena'
    },
  })
}

function registerInviteCallbacks() {
  setPvPCallbacks({
    onInviteReceived: (payload) => {
      incomingInvite.value = payload
      syncSceneLock()
    },
    onInviteSent: (payload) => {
      outgoingInvite.value = payload
    },
    onInviteResult: (payload) => {
      if (payload.inviteId === outgoingInvite.value?.inviteId) outgoingInvite.value = null
      if (payload.accepted) {
        showToast('⚔️ Lời mời được chấp nhận. Đang vào trận PvP...', 'success')
      } else if (payload.code !== 'INVITE_CANCELLED') {
        showToast(`ℹ️ ${payload.message || 'Lời mời PvP đã kết thúc.'}`, 'info')
      }
    },
    onBattleStart: (payload) => emit('open', 'pvp_battle', payload),
    onErrorMsg: (payload) => {
      if (payload.code?.startsWith('INVITE_') || payload.code === 'TEAM_INVALID') {
        outgoingInvite.value = null
      }
    },
  })
}

function unregisterWorldCallbacks() {
  clearWorldCallbacks()
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
  beginScreenTransition({ label: 'Đang vào bản đồ...', minDuration: 300 })
  viewportW.value = container.clientWidth || 960
  viewportH.value = container.clientHeight || 560

  // Resolve tileset từ JSON trước khi boot Phaser (worldScene preload đọc mapInfo.tilesets)
  await getMapTilesets(currentMapId.value)

  const map = getMap(currentMapId.value)

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
        const scene = getScene()
        sendArenaMove({
          x,
          y,
          facing: scene?.lastFacing || 'down',
          moving: !!scene?.currentAnim,
        })
      },
      onInRange: (id) => {
        inRangeLocId.value = id
        if (selectedLocation.value && id !== selectedLocation.value.id) {
          selectedLocation.value = null
        }
      },
      onMapInfo: (mapId) => {
        currentMapId.value = mapId
        // Tự mở hội thoại theo stage cốt truyện: nhà (stage 0) → lab (stage 0)
        if (onboardingStage.value === STORY_STAGES.HOME && mapId === 'house' && !homeTalkShown.value) {
          openHomeTalk()
        } else if (onboardingStage.value === STORY_STAGES.HOME && mapId === 'lab' && !oakDialogueOpen.value) {
          openOakDialogue()
        } else {
          syncSceneLock()
        }
        if (mapId === 'arena') {
          void ensureArenaPresence(true)
        } else {
          leaveArenaPresence()
        }
        // Scene đã dựng xong (create() hoàn tất) → ẩn màn hình chuyển cảnh
        setScreenProgress(100)
        endScreenTransition()
      },
      onLoadProgress: (v) => setScreenProgress(v * 100),
      onMapChange,
      onTileInteract,
      onWildSpawn: (data) => {
        // Cập nhật chấm đỏ minimap tại vị trí Pokémon hoang dã xuất hiện
        wildDot.value = data
      },
      onWildClear: () => {
        wildDot.value = null
      },
      onEncounterTick: (tick) => {
        // Đồng hồ đếm ngược tới lần xuất hiện tiếp theo / thời gian còn lại của Pokémon
        encounterTick.value = tick
        // Tự đồng bộ chấm đỏ minimap: Pokémon xuất hiện → cập nhật vị trí,
        // hết thời gian tồn tại → xoá (đảm bảo minimap luôn khớp dù lỡ onWildSpawn)
        if (tick.active && tick.x != null) {
          wildDot.value = { x: tick.x, y: tick.y, mapId: tick.mapId }
        } else if (!tick.active) {
          wildDot.value = null
        }
      },
      onWildEncounter: (pokemon) => {
        // Mở BattleArena với mode wild + dữ liệu wild Pokémon
        emit('open', 'wild', pokemon)
      },
    },
    startPos: { x: playerX.value, y: playerY.value },
    onboardingTarget: onboardingTarget.value,
    encounters: map.encounters || { enabled: false },
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
  registerWorldCallbacks()
  registerInviteCallbacks()
  inviteTimer = setInterval(() => {
    inviteNow.value = Date.now()
    if (incomingInvite.value && incomingInvite.value.expiresAt <= inviteNow.value) incomingInvite.value = null
    if (outgoingInvite.value && outgoingInvite.value.expiresAt <= inviteNow.value) outgoingInvite.value = null
  }, 1000)
  startGame()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydownCapture, true)
  window.removeEventListener('keydown', onTabKeydown)
  leaveArenaPresence()
  unregisterWorldCallbacks()
  clearPvPCallbacks()
  if (inviteTimer) clearInterval(inviteTimer)
  destroyGame()
})

// Reset game (hoặc thay đổi mapId từ ngoài): quay về map mới trong store
watch(
  () => store.worldPos.mapId,
  async (newMapId) => {
    if (!newMapId || newMapId === currentMapId.value) return
    beginScreenTransition({ label: 'Đang chuyển bản đồ...', minDuration: 300 })
    const map = getMap(newMapId)
    await getMapTilesets(newMapId)
    currentMapId.value = newMapId
    playerX.value = store.worldPos.x ?? map.spawn.x
    playerY.value = store.worldPos.y ?? map.spawn.y
    selectedLocation.value = null
    inRangeLocId.value = null
    wildDot.value = null
    encounterTick.value = null
    if (newMapId === 'arena') {
      await ensureArenaPresence(true)
    } else {
      leaveArenaPresence()
    }
    setWorldRuntime({
      onboardingTarget: getOnboardingTarget(newMapId),
      encounters: map.encounters || { enabled: false },
    })
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

// Đổi stage cốt truyện (vd sau Oak / sau huấn luyện) → cập nhật marker chỉ dẫn ngay
watch(onboardingStage, () => {
  setWorldRuntime({ onboardingTarget: getOnboardingTarget(currentMapId.value) })
  game?.scene.getScene('WorldScene')?.refreshOnboardingMarker?.()
})

watch(isArenaMap, (active) => {
  if (active) {
    void ensureArenaPresence(true)
  } else {
    leaveArenaPresence()
  }
})

// Đổi nhân vật (nam/nữ) từ Cài Đặt → restart scene để nạp sprite + anim mới
watch(
  () => store.gameState.player.character,
  (newChar, oldChar) => {
    if (!newChar || newChar === oldChar) return
    beginScreenTransition({ label: 'Đang đổi nhân vật...', minDuration: 300 })
    const map = getMap(currentMapId.value)
    setWorldRuntime({
      onboardingTarget: getOnboardingTarget(currentMapId.value),
      encounters: map.encounters || { enabled: false },
    })
    game?.scene.getScene('WorldScene')?.scene.restart({
      mapId: currentMapId.value,
      startPos: { x: playerX.value, y: playerY.value },
    })
    showToast(`👤 Đã đổi sang nhân vật ${getCharacter(newChar).label} (${getCharacter(newChar).name})!`, 'success')
  },
)
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-black">
    <!-- PHASER CANVAS -->
    <div ref="containerRef" class="absolute inset-0" />

    <div
      v-if="isArenaMap"
      class="pointer-events-none absolute left-3 top-3 z-20 rounded-xl border border-cyan-200 bg-slate-950/75 px-3 py-2 text-xs font-semibold text-cyan-100 shadow-lg backdrop-blur"
    >
      <div class="flex items-center gap-2">
        <span :class="arenaOnline ? 'animate-pulse text-emerald-300' : 'text-rose-300'">🌐</span>
        <span>{{ arenaOnline ? 'Arena online' : 'Arena offline' }}</span>
      </div>
      <div class="mt-1 text-[11px] text-slate-300">👥 {{ arenaPlayers }} người đang ở đấu trường</div>
      <div v-if="arenaConnectionHint" class="mt-1 text-[11px] text-cyan-200">{{ arenaConnectionHint }}</div>
    </div>

    <!-- MENU KHI ĐỨNG GẦN NGƯỜI CHƠI -->
    <div
      v-if="nearbyPlayer && !incomingInvite && !outgoingInvite"
      class="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-xl border border-fuchsia-200 bg-white/95 px-4 py-3 text-center shadow-xl backdrop-blur"
    >
      <div class="text-xs text-slate-500">Người chơi ở gần</div>
      <div class="font-black text-slate-900">👤 {{ nearbyPlayer.name }}</div>
      <div class="mt-1 text-[11px] font-bold text-slate-500">
        Lv.{{ nearbyPlayer.level || '?' }} · {{ getPvpRank(nearbyPlayer.elo).shortName }} · ELO {{ nearbyPlayer.elo ?? '?' }}
      </div>
      <button
        class="mt-2 rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!arenaOnline"
        @click="inviteNearbyPlayer"
      >
        ⚔️ Mời PvP
      </button>
    </div>

    <!-- TRẠNG THÁI LỜI MỜI ĐÃ GỬI -->
    <div
      v-if="outgoingInvite"
      class="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-xl border border-amber-200 bg-white/95 px-4 py-3 text-center shadow-xl backdrop-blur"
    >
      <div class="font-bold text-slate-800">⏳ Đang chờ {{ outgoingInvite.target?.name }} phản hồi</div>
      <div class="mt-1 text-xs text-slate-500">Còn {{ inviteSeconds }} giây</div>
    </div>

    <!-- LỜI MỜI PVP ĐẾN -->
    <Teleport to="body">
      <div v-if="incomingInvite" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-2xl border border-fuchsia-200 bg-white p-6 text-center shadow-2xl">
          <div class="text-4xl">⚔️</div>
          <h3 class="mt-2 text-xl font-black text-slate-800">Lời mời PvP</h3>
          <p class="mt-2 text-sm text-slate-600">
            <strong>{{ incomingInvite.from?.name }}</strong> muốn đấu PvP với bạn.
          </p>
          <p class="mt-1 text-xs text-slate-400">Tự động hết hạn sau {{ inviteSeconds }} giây</p>
          <div class="mt-5 grid grid-cols-2 gap-3">
            <button class="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-600 hover:bg-slate-50" @click="answerInvite(false)">
              Từ chối
            </button>
            <button class="rounded-xl bg-fuchsia-600 px-3 py-2 font-bold text-white hover:bg-fuchsia-700" @click="answerInvite(true)">
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    </Teleport>

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
            <div class="text-base font-black text-slate-900">{{ playerInfo.playerName || 'Player 1' }}</div>
            <div class="text-xs font-bold text-amber-600">Lv. {{ playerInfo.level }}</div>
            <div class="mt-1 flex items-center gap-1.5 text-xs font-black text-indigo-600">
              <img :src="playerPvpRank.image" :alt="playerPvpRank.name" class="h-6 w-6" />
              <span>{{ playerPvpRank.shortName }} · ELO {{ store.pvp.elo }}</span>
            </div>
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
        <!-- Pokémon hoang dã xuất hiện ngẫu nhiên (chấm đỏ nổi bật, viền trắng) -->
        <div
          v-if="wildDot && wildDot.mapId === currentMapId"
          class="absolute h-2 w-2 rounded-full bg-red-600 ring-2 ring-white animate-pulse"
          :style="{
            left: wildDot.x * mmScaleX - 4 + 'px',
            top: wildDot.y * mmScaleY - 4 + 'px',
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

    <!-- BỘ ĐẾM POKÉMON HOANG DÃ (30s xuất hiện / 60s biến mất) -->
    <div
      v-if="encounterCountdown"
      class="absolute bottom-40 right-3 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-sm"
      :class="encounterCountdown.active
        ? 'border-red-300 bg-red-500/90 text-white animate-pulse'
        : 'border-slate-200 bg-white/90 text-slate-600'"
    >
      <template v-if="encounterCountdown.active">
        ❗ Pokémon xuất hiện ở chấm đỏ!
      </template>
      <template v-else>
        ⏳ Pokémon hoang dã sau {{ encounterSeconds }}s
      </template>
    </div>

    <!-- CONTROLS HINT -->
    <div class="absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-md backdrop-blur-sm">
      <kbd class="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">WASD</kbd> /
      <kbd class="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">↑↓←→</kbd>
      để di chuyển — đến gần địa điểm để tương tác ·
      <kbd class="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">Tab</kbd>
      để xem thông tin
    </div>

    <!-- NÚT CÀI ĐẶT -->
    <button
      @click="openSettings()"
      title="Cài đặt"
      class="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-lg text-slate-600 shadow-md backdrop-blur-sm transition hover:bg-white"
    >
      ⚙️
    </button>
  </div>

  <!-- HỘI THOẠI ONBOARDING GIÁO SƯ OAK -->
  <OakLabDialogue :open="oakDialogueOpen" @complete="onOakComplete" />

  <!-- TỰ THOẠI LẦN ĐẦU TRONG NHÀ -->
  <HomeStartDialogue :open="homeTalkOpen" @complete="onHomeTalkComplete" />

  <!-- HỘI THOẠI Y TÁ BỆNH VIỆN (hồi phục) -->
  <HospitalModal :open="hospitalOpen" @close="closeHospital" @openRoster="emit('open', 'roster')" />

  <!-- HỘI THOẠI CỐT TRUYỆN Y TÁ (Pokédex + hướng dẫn combat + trận huấn luyện) -->
  <HospitalStoryDialogue
    :open="hospitalStoryOpen"
    @close="closeHospitalStory"
    @training="onHospitalStoryTraining"
    @gotoCampaign="onHospitalStoryGotoCampaign"
  />

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

   <!-- BẢNG CHỌN XÁC NHẬN CỬA (io) -->
   <InteractionMenu
     :open="interactMenuOpen"
     :title="interactMenu?.title || ''"
     :icon="interactMenu?.icon || ''"
     :choices="interactMenu?.choices || []"
     @select="onInteractMenuSelect"
     @close="interactMenuOpen = false; interactMenu = null; syncSceneLock()"
   />

   <!-- HỘI THOẠI NPC (nói chuyện / nhiệm vụ) -->
   <NpcDialogue
     :open="npcDialogueOpen"
     :npc-id="npcDialogue?.npcId || ''"
     :mode="npcDialogue?.mode || 'smalltalk'"
     @complete="npcDialogueOpen = false; npcDialogue = null; syncSceneLock()"
   />
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
