// ==========================================
// LOGIC KHO POKÉMON & POKÉDEX (TÁCH UI - GIỮ NGUYÊN)
// ==========================================

import { POKEDEX_LIMIT } from './data.js'
import { store, saveGameState } from './store.js'
import { addQuestProgress } from './daily.js'

export const RARITY_ORDER = {
  Common: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Mythic: 5,
  Secret: 6,
}

export function getPokemonUniqueId(poke) {
  if (!poke.id) poke.id = 'poke-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
  return String(poke.id)
}

// Danh sách trong Kho kèm tên hiển thị đã đánh số (#1, #2) khi trùng (tên + độ hiếm)
export function getFormattedInventory() {
  let countMap = {}
  store.team.forEach((p) => {
    let key = p.name + '|' + (p.rarity ? p.rarity.name : 'Common')
    countMap[key] = (countMap[key] || 0) + 1
  })

  let seenCount = {}
  return store.team.map((p, index) => {
    let key = p.name + '|' + (p.rarity ? p.rarity.name : 'Common')
    seenCount[key] = (seenCount[key] || 0) + 1
    let isDuplicate = countMap[key] > 1
    return {
      pokemon: p,
      index,
      displayName: isDuplicate ? `${p.name} #${seenCount[key]}` : p.name,
      duplicateNumber: isDuplicate ? seenCount[key] : null,
      isDuplicate,
    }
  })
}

export function isInPokedex(uniqueId) {
  return store.gameState.pokedex.indexOf(String(uniqueId)) !== -1
}

/**
 * Thêm / Gỡ Pokémon khỏi Pokédex (tối đa 20).
 * @returns {{ added: boolean, full?: boolean, count?: number }}
 */
export function togglePokedex(pokemonUniqueId) {
  pokemonUniqueId = String(pokemonUniqueId)
  let existingIdx = store.gameState.pokedex.indexOf(pokemonUniqueId)

  if (existingIdx !== -1) {
    store.gameState.pokedex.splice(existingIdx, 1)
    return { added: false }
  }

  if (store.gameState.pokedex.length >= POKEDEX_LIMIT) {
    return { added: false, full: true, count: store.gameState.pokedex.length }
  }

  store.gameState.pokedex.push(pokemonUniqueId)
  return { added: true }
}

/**
 * Thêm Pokémon vào Pokédex (KHÔNG gỡ — dùng cho sự kiện cốt truyện, vd Y tá đăng ký starter).
 * @returns {{ added: boolean, already?: boolean, full?: boolean, count?: number }}
 */
export function addToPokedex(pokemonUniqueId) {
  pokemonUniqueId = String(pokemonUniqueId)
  if (store.gameState.pokedex.indexOf(pokemonUniqueId) !== -1) {
    return { added: false, already: true }
  }
  if (store.gameState.pokedex.length >= POKEDEX_LIMIT) {
    return { added: false, full: true, count: store.gameState.pokedex.length }
  }
  store.gameState.pokedex.push(pokemonUniqueId)
  saveGameState()
  return { added: true }
}

// ==========================================
// BÁN POKÉMON (VÀNG / GEM) - GIẢI PHÓNG KHO ĐỒ
// ==========================================

export const SELL_PRICES = { Common: 200, Rare: 500, Epic: 1500, Legendary: 4000, Mythic: 10000, Secret: 25000 }
export const GEM_PRICES = { Legendary: 4000, Mythic: 37500, Secret: 7500000 }

export function getRarityName(poke) {
  return poke && poke.rarity && poke.rarity.name ? poke.rarity.name : 'Common'
}

// Giá bán Vàng: gốc theo độ hiếm x hệ số theo 3 đoạn cấp độ, nhân x1.5 mỗi V-Level.
//   x <= 40       -> f = base + base*(x-1)/25     (Lv40 = base*2.56)
//   40 < x <= 70  -> f = f(40) + base*(x-40)/15   (Lv70 = base*4.56)
//   70 < x <= 100 -> f = f(70) + base*(x-70)/10   (Lv100 = base*7.56)
export function getSellPrice(poke) {
  let base = SELL_PRICES[getRarityName(poke)] || 200
  let level = poke.level || 1

  let f40 = base + (base * 39) / 25
  let f70 = f40 + (base * 30) / 15

  let value
  if (level <= 40) {
    value = base + (base * (level - 1)) / 25
  } else if (level <= 70) {
    value = f40 + (base * (level - 40)) / 15
  } else {
    value = f70 + (base * (level - 70)) / 10
  }

  return Math.round(value * Math.pow(1.5, poke.vLevel || 0))
}

// Giá bán Gem: chỉ theo độ hiếm + V-Level (không tính level)
export function getGemSellPrice(poke) {
  let base = GEM_PRICES[getRarityName(poke)]
  if (!base) return 0
  return Math.round(base * Math.pow(1.5, poke.vLevel || 0))
}

// Pokémon độ hiếm Legendary trở lên mới bán được Gem
export function canSellForGems(poke) {
  return !!GEM_PRICES[getRarityName(poke)]
}

// Pokémon độ hiếm từ Legendary trở lên (Legendary, Mythic, Secret)
export function isHighRarity(poke) {
  return (RARITY_ORDER[getRarityName(poke)] || 0) >= RARITY_ORDER.Legendary
}

// Tổng hợp thông tin bán cho danh sách uniqueId đã chọn (hiển thị + confirm)
export function getBatchSellInfo(uniqueIds) {
  let count = 0
  let gold = 0
  let highRarityCount = 0
  uniqueIds.forEach((uid) => {
    let poke = store.team.find((p) => getPokemonUniqueId(p) === String(uid))
    if (!poke) return
    count++
    gold += getSellPrice(poke)
    if (isHighRarity(poke)) highRarityCount++
  })
  return { count, gold, highRarityCount }
}

// Xóa Pokémon theo chỉ mục và sửa lại các chỉ mục trỏ vào team
function removePokemonByIndex(removedIdx) {
  store.team.splice(removedIdx, 1)

  if (store.activePokeIdx !== null && store.activePokeIdx !== undefined) {
    if (store.activePokeIdx > removedIdx) store.activePokeIdx--
    else if (store.activePokeIdx === removedIdx) {
      store.activePokeIdx = Math.max(0, Math.min(store.activePokeIdx, store.team.length - 1))
    }
  }

  if (store.mergeSlotMain !== null && store.mergeSlotMain > removedIdx) store.mergeSlotMain--
  else if (store.mergeSlotMain === removedIdx) store.mergeSlotMain = null

  if (store.mergeSlotSub !== null && store.mergeSlotSub > removedIdx) store.mergeSlotSub--
  else if (store.mergeSlotSub === removedIdx) store.mergeSlotSub = null
}

/**
 * Bán 1 Pokémon lấy Vàng (mặc định) hoặc Gem (currency = 'gems', yêu cầu Legendary+).
 * @returns {{ ok: boolean, message?: string, gold?: number, gems?: number, currency?: string }}
 */
export function sellPokemon(uniqueId, currency = 'gold') {
  uniqueId = String(uniqueId)
  let idx = store.team.findIndex((p) => getPokemonUniqueId(p) === uniqueId)
  if (idx === -1) return { ok: false, message: '❌ Không tìm thấy Pokémon!' }
  if (store.team.length <= 1) return { ok: false, message: '❌ Không thể bán Pokémon cuối cùng trong kho!' }

  let poke = store.team[idx]
  let gold = 0
  let gems = 0

  if (currency === 'gems') {
    gems = getGemSellPrice(poke)
    if (!gems) return { ok: false, message: '❌ Pokémon này không thể bán lấy Gem (yêu cầu độ hiếm Legendary trở lên)!' }
    store.gems += gems
  } else {
    gold = getSellPrice(poke)
    store.gold += gold
  }

  // Gỡ khỏi Pokédex nếu đang được đánh dấu
  let pokeDexIdx = store.gameState.pokedex.indexOf(uniqueId)
  if (pokeDexIdx !== -1) store.gameState.pokedex.splice(pokeDexIdx, 1)

  removePokemonByIndex(idx)
  addQuestProgress('sells', 1)
  saveGameState()

  let message = currency === 'gems'
    ? `💎 Đã bán ${poke.name} lấy ${gems.toLocaleString('en-US')} Gem!`
    : `💰 Đã bán ${poke.name} lấy ${gold.toLocaleString('en-US')} Vàng!`

  return { ok: true, message, gold, gems, currency }
}

// Thông tin bán hàng loạt: số Pokémon trùng (tên + độ hiếm) và tổng Vàng nhận được
export function getDuplicateSellInfo() {
  let countMap = {}
  store.team.forEach((p) => {
    let key = p.name + '|' + getRarityName(p)
    countMap[key] = (countMap[key] || 0) + 1
  })

  let seenCount = {}
  let count = 0
  let gold = 0
  store.team.forEach((p) => {
    let key = p.name + '|' + getRarityName(p)
    seenCount[key] = (seenCount[key] || 0) + 1
    if (seenCount[key] > 1) {
      count++
      gold += getSellPrice(p)
    }
  })

  return { count, gold }
}

// Bán hàng loạt các Pokémon trùng lặp (giữ lại 1 con mỗi tên + độ hiếm), nhận Vàng
export function sellDuplicates() {
  let seenCount = {}
  let toSell = []
  store.team.forEach((p, index) => {
    let key = p.name + '|' + getRarityName(p)
    seenCount[key] = (seenCount[key] || 0) + 1
    if (seenCount[key] > 1) toSell.push(index)
  })

  if (toSell.length === 0) return { ok: false, message: 'Không có Pokémon trùng lặp nào để bán.' }

  let totalGold = 0
  toSell.sort((a, b) => b - a)
  toSell.forEach((idx) => {
    let poke = store.team[idx]
    totalGold += getSellPrice(poke)

    let uid = getPokemonUniqueId(poke)
    let pokeDexIdx = store.gameState.pokedex.indexOf(uid)
    if (pokeDexIdx !== -1) store.gameState.pokedex.splice(pokeDexIdx, 1)

    removePokemonByIndex(idx)
  })

  store.gold += totalGold
  addQuestProgress('sells', toSell.length)
  saveGameState()

  return {
    ok: true,
    count: toSell.length,
    gold: totalGold,
    message: `🗑️ Đã bán ${toSell.length} Pokémon trùng lặp lấy ${totalGold.toLocaleString('en-US')} Vàng!`,
  }
}

// Bán hàng loạt theo danh sách uniqueId đã chọn (phải giữ ít nhất 1 con), nhận Vàng
export function sellPokemonBatch(uniqueIds) {
  let ids = uniqueIds.map(String)
  if (ids.length === 0) return { ok: false, message: '❌ Chưa chọn Pokémon nào!' }
  if (store.team.length - ids.length < 1) {
    return { ok: false, message: '❌ Không thể bán hết Pokémon trong kho (phải giữ ít nhất 1 con)!' }
  }

  let toSell = []
  store.team.forEach((p, index) => {
    if (ids.indexOf(getPokemonUniqueId(p)) !== -1) toSell.push(index)
  })
  if (toSell.length === 0) return { ok: false, message: '❌ Không tìm thấy Pokémon để bán!' }

  let totalGold = 0
  toSell.sort((a, b) => b - a)
  toSell.forEach((idx) => {
    let poke = store.team[idx]
    totalGold += getSellPrice(poke)

    let uid = getPokemonUniqueId(poke)
    let pokeDexIdx = store.gameState.pokedex.indexOf(uid)
    if (pokeDexIdx !== -1) store.gameState.pokedex.splice(pokeDexIdx, 1)

    removePokemonByIndex(idx)
  })

  store.gold += totalGold
  addQuestProgress('sells', toSell.length)
  saveGameState()

  return {
    ok: true,
    count: toSell.length,
    gold: totalGold,
    message: `🗑️ Đã bán ${toSell.length} Pokémon lấy ${totalGold.toLocaleString('en-US')} Vàng!`,
  }
}

// Danh sách Pokémon trong Pokédex (theo thứ tự trong Kho)
export function getPokedexPokemonList() {
  let pokedexIds = store.gameState.pokedex.map(String)
  return store.team
    .map((p, originalIndex) => ({ pokemon: p, originalIndex }))
    .filter((item) => pokedexIds.indexOf(getPokemonUniqueId(item.pokemon)) !== -1)
}

// Lọc + sắp xếp Kho theo searchQuery / sortBy
export function filterAndSortTeam() {
  let filtered = store.team
    .map((p, originalIndex) => ({ pokemon: p, originalIndex }))
    .filter((item) => item.pokemon.name.toLowerCase().includes(store.searchQuery))

  filtered.sort((a, b) => {
    let pA = a.pokemon
    let pB = b.pokemon
    if (store.sortBy === 'rarity-desc') return (RARITY_ORDER[pB.rarity.name] || 0) - (RARITY_ORDER[pA.rarity.name] || 0)
    if (store.sortBy === 'rarity-asc') return (RARITY_ORDER[pA.rarity.name] || 0) - (RARITY_ORDER[pB.rarity.name] || 0)
    if (store.sortBy === 'type') return pA.type.localeCompare(pB.type)
    if (store.sortBy === 'level-desc') return pB.level - pA.level
    if (store.sortBy === 'level-asc') return pA.level - pB.level
    return 0
  })

  return filtered
}

// ==========================================
// HIỂN THỊ (DỮ LIỆU PHỤC VỤ UI)
// ==========================================

export const TYPE_EMOJI = { Fire: '🔥', Water: '💧', Grass: '🌿', Electric: '⚡', Rock: '🪨' }
export function getTypeEmoji(type) {
  return TYPE_EMOJI[type] || '❓'
}

export const TRIGGER_NAMES = {
  perm: 'Vĩnh viễn',
  start_battle: 'Đầu trận',
  start_turn: 'Đầu lượt',
  take_damage: 'Nhận sát thương',
  hp_below_50: 'Khi HP < 50%',
}

export function getTriggerName(trigger) {
  return TRIGGER_NAMES[trigger] || trigger || '?'
}

export const STAT_BAR_CAPS = { HP: 1500, ATK: 200, DEF: 200, SPD: 200 }

export function statBarPercent(label, value) {
  let cap = STAT_BAR_CAPS[label] || 200
  return Math.min(100, Math.max(0, (value / cap) * 100))
}

// Mô tả giá trị chính của kỹ năng (dùng cho detail/pokedex card)
export function skillValueText(sk) {
  if (sk.category === 'damage' || sk.category === 'true_damage') {
    return { text: `Sát thương: ${sk.power || 0}${sk.isTrueDmg ? ' (Chuẩn - bỏ qua DEF)' : ''}`, color: '#4caf50' }
  }
  if (sk.category === 'shield' || sk.shield) {
    return { text: `Khiên: +${sk.shield || 0}`, color: '#3399ff' }
  }
  if (sk.category === 'heal' || sk.heal) {
    return { text: `Hồi phục: +${sk.heal || 0}`, color: '#4caf50' }
  }
  if (sk.category === 'buff') return { text: 'Tăng viện (Buff)', color: '#f5c518' }
  return { text: 'Hỗ trợ', color: '#a6adc8' }
}
