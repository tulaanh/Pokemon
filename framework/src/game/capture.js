// ==========================================
// GẶP POKÉMON HOANG DÃ & BẮT POKÉMON
// Encounter chỉ tồn tại trong phiên bản map hiện tại,
// không đưa encounter vào save để tránh encounter bị kẹt.
// ==========================================

import { POKEMON_SPECIES, RARITIES, RARITY_LEVELS, INVENTORY_LIMIT } from './data.js'
import { buildNewPokemon } from './gacha.js'
import { store, addPokemonToInventory, saveGameState } from './store.js'
import { POKEBALLS } from './shop.js'

export const DEFAULT_ENCOUNTERS = {
  enabled: true,
  intervalMs: 9000,
  chance: 0.25,
  maxActive: 1,
  cooldownMs: 12000,
  pool: [
    { species: 'Pidgey', minLevel: 1, maxLevel: 5, weight: 40 },
    { species: 'Rattata', minLevel: 1, maxLevel: 5, weight: 35 },
  ],
}

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

function getEncounterRarity() {
  // Pokémon hoang dã mặc định là Common; pool có thể mở rộng thêm rarity sau này.
  return RARITIES.find((rarity) => rarity.name === 'Common') || RARITIES[0]
}

export function createWildPokemon(entry, level) {
  const species = POKEMON_SPECIES.find((item) => item.name === entry.species)
  if (!species) return null

  const rarity = RARITIES.find((item) => item.name === entry.rarity) || getEncounterRarity()
  const minLevel = Math.max(1, Number(entry.minLevel) || 1)
  const maxLevel = Math.max(minLevel, Number(entry.maxLevel) || minLevel)
  const finalLevel = Math.max(minLevel, Math.min(maxLevel, Number(level) || minLevel))
  const pokemon = buildNewPokemon(species, rarity, finalLevel)
  pokemon.isWild = true
  return pokemon
}

export function rollWildEncounter(config = DEFAULT_ENCOUNTERS) {
  if (!config?.enabled || !Array.isArray(config.pool) || config.pool.length === 0) return null
  if (Math.random() > Math.max(0, Math.min(1, config.chance ?? 1))) return null

  const entry = weightedPick(config.pool.filter((item) => POKEMON_SPECIES.some((s) => s.name === item.species)))
  if (!entry) return null
  const minLevel = Math.max(1, Number(entry.minLevel) || 1)
  const maxLevel = Math.max(minLevel, Number(entry.maxLevel) || minLevel)
  const level = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1))
  return createWildPokemon(entry, level)
}

export function getCaptureChance(pokemon, ballId) {
  const ball = POKEBALLS.find((item) => item.id === ballId)
  if (!ball || !pokemon) return 0
  if (ball.multiplier === Infinity) return 1

  const hpRatio = Math.max(0, Math.min(1, pokemon.hp / Math.max(1, pokemon.maxHp)))
  const baseChance = 0.2 + (1 - hpRatio) * 0.6
  const levelPenalty = Math.max(0.55, 1 - Math.max(0, pokemon.level - 1) * 0.015)
  return Math.max(0.01, Math.min(0.95, baseChance * ball.multiplier * levelPenalty))
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
      message: `${ball.emoji} ${ball.name} rung lên... Pokémon đã thoát ra!`,
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