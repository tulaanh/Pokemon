// ==========================================
// STORE TẬP TRUNG (REACTIVE) + SAVE/LOAD
// Tương thích save cũ với key 'pokemonGameState'
// ==========================================

import { reactive } from 'vue'
import { getPlayerNextLevelExp } from './stats.js'
import { ensureSkillsByLevelMigration } from './gacha.js'
import { applyEvolutions } from './evolution.js'
import { getMap } from './maps.js'

const SAVE_KEY = 'pokemonGameState'

function defaultState() {
  const houseSpawn = getMap('house').spawn
  return {
    gems: 0,
    gold: 0,
    inventory: {
      candy: 0,
      fire_stone: 0,
      water_stone: 0,
      thunder_stone: 0,
      leaf_stone: 0,
      rock_stone: 0,
      poke_ball: 0,
      great_ball: 0,
      ultra_ball: 0,
      master_ball: 0,
    },
    team: [],
    gameState: {
      player: {
        level: 1,
        playerExp: 0,
        playerExpToNext: 100,
        pokePoint: 0,
        pokeGacha: 0,
        playerName: '',
        character: 'red',
        hasCompletedFirstLogin: false,
        hasSeenIntro: false,
        onboardingStage: 0,
      },
      pokedex: [],
    },
    gymBuffs: {},
    gymProgress: { Water: 0, Fire: 0, Grass: 0, Electric: 0, Rock: 0 },
    campaignCleared: [],
    storyCleared: [],
    towerBestFloor: 0,
    quests: {},
    daily: {
      lastCheckIn: '',
      checkInStreak: 0,
      checkInTotal: 0,
      lastQuestDate: '',
      quests: { rolls: 0, wins: 0, sells: 0, candies: 0 },
      questClaimed: {},
    },
    pvp: {
      elo: 1000,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      bestStreak: 0,
      history: [],
      seasonRewards: {},
      lastSeasonElo: 1000,
    },
    searchQuery: '',
    sortBy: 'default',
    // Cờ tạm (không lưu save): đánh dấu vừa hoàn thành nhiệm vụ khởi đầu → mở modal chúc mừng
    startMissionCongrats: false,
    activePokeIdx: 0,
    mergeSlotMain: null,
    mergeSlotSub: null,
    currentSelectingSlot: null,
    mergeSearchQuery: '',
    settings: { musicEnabled: true, musicVolume: 0.5 },
    worldPos: { mapId: 'house', x: houseSpawn.x, y: houseSpawn.y },
    prevMapPos: null,
    onboardingStage: 0,
  }
}

export const store = reactive(defaultState())

export function getPlayer() {
  return store.gameState.player
}

export function addPokemonToInventory(pokemon) {
  if (!pokemon) return false
  if (store.team.length >= 150) return false
  if (!pokemon.id) pokemon.id = 'poke-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
  store.team.push(pokemon)
  return true
}

export function saveGameState() {
  try {
    const player = store.gameState.player
    const data = {
      gems: store.gems,
      gold: store.gold,
      inventory: store.inventory,
      team: store.team,
      gymBuffs: store.gymBuffs,
      gymProgress: store.gymProgress,
      campaignCleared: store.campaignCleared,
      storyCleared: store.storyCleared,
      towerBestFloor: store.towerBestFloor,
      quests: store.quests,
      daily: store.daily,
      pvp: store.pvp,
      pokedex: store.gameState.pokedex,
      searchQuery: store.searchQuery,
      sortBy: store.sortBy,
      activePokeIdx: store.activePokeIdx,
      mergeSlotMain: store.mergeSlotMain,
      mergeSlotSub: store.mergeSlotSub,
      settings: store.settings,
      worldPos: store.worldPos,
      prevMapPos: store.prevMapPos,
      playerState: {
        level: player.level,
        playerExp: player.playerExp,
        playerExpToNext: player.playerExpToNext,
        pokePoint: player.pokePoint,
        pokeGacha: player.pokeGacha,
        playerName: player.playerName,
        character: player.character || 'red',
        hasCompletedFirstLogin: player.hasCompletedFirstLogin,
        hasSeenIntro: player.hasSeenIntro,
        onboardingStage: player.onboardingStage,
      },
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('❌ Lỗi khi tự động lưu game:', e)
  }
}

export function addPlayerExp(amount) {
  if (!store.gameState || !store.gameState.player) return 0
  amount = Number(amount) || 0
  if (amount <= 0) return 0

  let p = store.gameState.player
  p.playerExp = (p.playerExp || 0) + amount
  let next = getPlayerNextLevelExp(p.level)
  let levels = 0

  while (p.playerExp >= next) {
    p.playerExp -= next
    p.level++
    levels++
    next = getPlayerNextLevelExp(p.level)
  }

  p.playerExpToNext = next
  return levels
}

export function loadGameState() {
  try {
    const savedData = localStorage.getItem(SAVE_KEY)
    if (!savedData) return
    const data = JSON.parse(savedData)

    if (data.gems !== undefined) store.gems = data.gems
    if (data.gold !== undefined) store.gold = data.gold
    if (data.inventory) store.inventory = { ...store.inventory, ...data.inventory }
    // Migration save cũ: bổ sung các loại Pokéball mới với số lượng mặc định bằng 0.
    for (const ballId of ['poke_ball', 'great_ball', 'ultra_ball', 'master_ball']) {
      if (!Number.isFinite(store.inventory[ballId])) store.inventory[ballId] = 0
    }
    if (data.team) store.team = data.team
    if (data.gymBuffs) store.gymBuffs = data.gymBuffs
    if (data.gymProgress) store.gymProgress = { ...store.gymProgress, ...data.gymProgress }
    store.campaignCleared = Array.isArray(data.campaignCleared) ? data.campaignCleared : []
    store.storyCleared = Array.isArray(data.storyCleared) ? data.storyCleared : []
    store.towerBestFloor = Number.isFinite(data.towerBestFloor) ? data.towerBestFloor : 0
    if (data.quests) store.quests = data.quests
    if (data.daily) store.daily = { ...store.daily, ...data.daily }
    if (data.pvp) store.pvp = { ...store.pvp, ...data.pvp }
    if (data.searchQuery) store.searchQuery = data.searchQuery
    if (data.sortBy) store.sortBy = data.sortBy
    if (data.activePokeIdx !== undefined) store.activePokeIdx = data.activePokeIdx
    if (data.mergeSlotMain !== undefined) store.mergeSlotMain = data.mergeSlotMain
    if (data.mergeSlotSub !== undefined) store.mergeSlotSub = data.mergeSlotSub
    if (data.settings) store.settings = { ...store.settings, ...data.settings }
    if (data.worldPos) store.worldPos = { ...store.worldPos, ...data.worldPos }
    if (data.prevMapPos) store.prevMapPos = data.prevMapPos
    store.gameState.pokedex = Array.isArray(data.pokedex) ? data.pokedex : []

    const p = store.gameState.player
    if (data.playerState) {
      p.level = data.playerState.level !== undefined ? data.playerState.level : 1
      p.playerExp = data.playerState.playerExp !== undefined ? data.playerState.playerExp : 0
      p.playerExpToNext = data.playerState.playerExpToNext !== undefined ? data.playerState.playerExpToNext : 100
      p.pokePoint = data.playerState.pokePoint !== undefined ? data.playerState.pokePoint : 1000
      p.pokeGacha = data.playerState.pokeGacha !== undefined ? data.playerState.pokeGacha : 0
      p.playerName = data.playerState.playerName !== undefined ? data.playerState.playerName : ''
      p.character = data.playerState.character || 'red'
      p.hasCompletedFirstLogin = data.playerState.hasCompletedFirstLogin !== undefined ? data.playerState.hasCompletedFirstLogin : false
      // Migration save cũ: chưa từng xem intro → người chơi cũ bỏ qua, save mới sẽ xem
      p.hasSeenIntro = data.playerState.hasSeenIntro !== undefined ? data.playerState.hasSeenIntro : !!p.hasCompletedFirstLogin
      if (data.playerState.onboardingStage !== undefined) {
        p.onboardingStage = data.playerState.onboardingStage
      } else {
        // Migration save cũ: đã hoàn thành onboarding cũ (có starter) → coi như xong luồng
        // cốt truyện mới (DONE = 4); ngược lại bắt đầu lại từ đầu (HOME = 0).
        p.onboardingStage = p.hasCompletedFirstLogin ? 4 : 0
      }
      // Đồng bộ stage cốt truyện lên field top-level (nguồn đọc thực sự của getOnboardingStage)
      store.onboardingStage = p.onboardingStage
    }

    // Migration: passive cũ -> passives[]
    if (store.team.length > 0) {
      store.team.forEach((pok) => {
        if (!pok.passives) pok.passives = []
        if (!pok.talents) pok.talents = []
        if (pok.passive && pok.passives.length === 0) {
          pok.passives.push(JSON.parse(JSON.stringify(pok.passive)))
        }
        // Migration: Pokémon cũ thiếu Skill2/Ultimate -> bổ sung theo cấp độ
        ensureSkillsByLevelMigration(pok)
        // Migration tiến hóa: Pokémon đã đủ level mốc (level >= 45/70) mà chưa tiến hóa -> tự tiến hóa
        applyEvolutions(pok, store.gymBuffs)
      })
    }
  } catch (e) {
    console.error('❌ Lỗi khi tải tiến trình game:', e)
  }
}

export function resetGameState() {
  localStorage.removeItem(SAVE_KEY)
  Object.assign(store, defaultState())
  saveGameState()
}

export function resetProgress() {
  const savedSettings = { ...store.settings }
  localStorage.removeItem(SAVE_KEY)
  Object.assign(store, defaultState())
  store.settings = savedSettings
  saveGameState()
}

/**
 * Hồi phục toàn bộ HP, MP, shield và xóa hiệu ứng cho tất cả Pokémon trong team
 * Gọi khi nói chuyện với y tá tại bệnh viện
 */
export function healAllPokemon() {
  store.team.forEach((pok) => {
    if (!pok) return
    pok.hp = pok.maxHp
    pok.mp = pok.initMp
    pok.shield = 0
    pok.effects = []
    pok.skills?.forEach((s) => { s.currentCd = 0 })
  })
  saveGameState()
}

export function initStore() {
  loadGameState()
  setInterval(saveGameState, 5000)
  window.addEventListener('beforeunload', saveGameState)
}
