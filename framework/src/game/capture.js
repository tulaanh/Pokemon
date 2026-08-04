// ==========================================
// GẶP POKÉMON HOANG DÃ & BẮT POKÉMON
// Encounter chỉ tồn tại trong phiên bản map hiện tại,
// không đưa encounter vào save để tránh encounter bị kẹt.
// ==========================================

import { POKEMON_SPECIES, RARITIES, INVENTORY_LIMIT } from './data.js'
import { buildNewPokemon } from './gacha.js'
import { store, addPokemonToInventory, saveGameState } from './store.js'
import { POKEBALLS } from './shop.js'

export const DEFAULT_ENCOUNTERS = {
  enabled: true,
  intervalMs: 30000,
  despawnMs: 60000,
  maxActive: 1,
  cooldownMs: 12000,
  pool: [
    { species: 'Pikachu', weight: 30 },
    { species: 'Eevee', weight: 25 },
    { species: 'Vulpix', weight: 15 },
    { species: 'Growlithe', weight: 15 },
    { species: 'Magikarp', weight: 10 },
    { species: 'Larvitar', weight: 5 },
  ],
}

// Bảng chênh lệch cấp wild Pokémon so với cấp nhân vật theo độ hiếm.
// below = xác suất cấp < cấp HLV, belowGap/aboveGap = khoảng chênh (min-max).
export const ENCOUNTER_RARITY_GAPS = {
  Common: { below: 0.7, belowGap: [1, 3], aboveGap: [1, 2] },
  Rare: { below: 0.55, belowGap: [1, 3], aboveGap: [1, 4] },
  Epic: { below: 0.4, belowGap: [1, 4], aboveGap: [2, 6] },
  Legendary: { below: 0.25, belowGap: [1, 4], aboveGap: [4, 10] },
  Mythic: { below: 0.1, belowGap: [1, 3], aboveGap: [8, 16] },
  Secret: { below: 0.05, belowGap: [1, 2], aboveGap: [15, 25] },
}

// Cấp tối đa của wild Pokémon (khớp mức trần của game)
export const WILD_LEVEL_CAP = 90

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight || 0), 0)
  if (total <= 0) return items[0]
  let roll = Math.random() * total
  for (const item of items) {
    roll -= Math.max(0, item.weight || 0)
    if (roll <= 0) return item
  }
  return items[items.length - 1]
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function getEncounterRarity() {
  // Pokémon hoang dã mặc định là Common; pool có thể mở rộng thêm rarity sau này.
  return RARITIES.find((rarity) => rarity.name === 'Common') || RARITIES[0]
}

// Roll độ hiếm theo tỉ lệ RARITIES.chance (giống Gacha)
function rollEncounterRarity() {
  const total = RARITIES.reduce((sum, r) => sum + Math.max(0, r.chance || 0), 0)
  if (total <= 0) return RARITIES[0].name
  let roll = Math.random() * total
  for (const r of RARITIES) {
    roll -= Math.max(0, r.chance || 0)
    if (roll <= 0) return r.name
  }
  return RARITIES[RARITIES.length - 1].name
}

// Tính cấp wild Pokémon dựa trên cấp nhân vật và độ hiếm (clamp 1..90)
export function computeWildLevel(rarityName) {
  const playerLevel = Number(store.gameState.player.level) || 1
  const cfg = ENCOUNTER_RARITY_GAPS[rarityName] || ENCOUNTER_RARITY_GAPS.Common
  let level
  if (Math.random() < cfg.below) {
    level = playerLevel - randInt(cfg.belowGap[0], cfg.belowGap[1])
  } else {
    level = playerLevel + randInt(cfg.aboveGap[0], cfg.aboveGap[1])
  }
  return Math.max(1, Math.min(WILD_LEVEL_CAP, level))
}

export function createWildPokemon(entry, level, rarityName) {
  const species = POKEMON_SPECIES.find((item) => item.name === entry.species)
  if (!species) return null

  const rarity = RARITIES.find((item) => item.name === rarityName) || getEncounterRarity()
  const finalLevel = Math.max(1, Math.min(WILD_LEVEL_CAP, Number(level) || 1))
  const pokemon = buildNewPokemon(species, rarity, finalLevel)
  pokemon.isWild = true
  return pokemon
}

export function rollWildEncounter(config = DEFAULT_ENCOUNTERS) {
  if (!config?.enabled || !Array.isArray(config.pool) || config.pool.length === 0) return null
  if (Math.random() > Math.max(0, Math.min(1, config.chance ?? 1))) return null

  const entry = weightedPick(config.pool.filter((item) => POKEMON_SPECIES.some((s) => s.name === item.species)))
  if (!entry) return null

  // Độ hiếm: pool có thể ghim sẵn (entry.rarity), nếu không thì roll theo RARITIES.chance
  const rarityName = entry.rarity || rollEncounterRarity()
  const level = computeWildLevel(rarityName)
  return createWildPokemon(entry, level, rarityName)
}

export function getCaptureChance(pokemon, ballId) {
  const ball = POKEBALLS.find((item) => item.id === ballId)
  if (!ball || !pokemon) return 0
  if (ball.catchRate >= 255) return 1

  const hpRatio = Math.max(0, Math.min(1, pokemon.hp / Math.max(1, pokemon.maxHp)))
  const baseChance = 0.2 + (1 - hpRatio) * 0.6
  const levelPenalty = Math.max(0.55, 1 - Math.max(0, pokemon.level - 1) * 0.015)
  return Math.max(0.01, Math.min(0.95, baseChance * ball.catchRate * levelPenalty))
}

export function attemptCapture(pokemon, ballId) {
  const ball = POKEBALLS.find((item) => item.id === ballId)
  if (!ball) return { ok: false, success: false, message: 'Pokéball không hợp lệ!' }
  if (!pokemon?.isWild) return { ok: false, success: false, message: 'Chỉ có thể bắt Pokémon hoang dã!' }
  if (store.team.length >= INVENTORY_LIMIT) {
    return { ok: false, success: false, message: `Đội hình đã đầy (${INVENTORY_LIMIT} Pokémon)!` }
  }
  if ((store.inventory[ball.id] || 0) <= 0) {
    return { ok: false, success: false, message: `Bạn không còn ${ball.name}!` }
  }

  const chance = getCaptureChance(pokemon, ballId)
  store.inventory[ball.id]--
  if (Math.random() > chance) {
    saveGameState()
    return {
      ok: true,
      success: false,
      chance,
      message: `${ball.name} rung lên... Pokémon đã thoát ra!`,
    }
  }

  const captured = JSON.parse(JSON.stringify(pokemon))
  captured.isWild = false
  captured.hp = captured.maxHp
  captured.shield = 0
  captured.effects = []
  captured.id = undefined
  const added = addPokemonToInventory(captured)
  if (!added) {
    // Trường hợp bất thường: không tiêu hao bóng khi chưa thể thêm Pokémon.
    store.inventory[ball.id]++
    return { ok: false, success: false, message: 'Không thể thêm Pokémon vào đội hình!' }
  }

  if (!store.gameState.pokedex.includes(captured.name)) {
    store.gameState.pokedex.push(captured.name)
  }
  saveGameState()
  return {
    ok: true,
    success: true,
    chance,
    pokemon: captured,
    message: `🎉 Đã bắt được ${captured.name}! Pokémon đã được thêm vào đội hình.`,
  }
}

export function migratePokeballInventory() {
  for (const ball of POKEBALLS) {
    if (!Number.isFinite(store.inventory[ball.id])) store.inventory[ball.id] = 0
  }
}