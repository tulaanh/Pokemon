// ==========================================
// LOGIC GACHA (TÁCH UI - GIỮ NGUYÊN CÔNG THỨC)
// ==========================================

import {
  POKEMON_SPECIES,
  RARITIES,
  RARITY_LEVELS,
  ELEMENTAL_SKILL_TEMPLATES,
  GACHA_BANNERS,
  getBannerSpeciesPool,
  INVENTORY_LIMIT,
  rollStunConfig,
} from './data.js'
import { rollPassive } from './skills.js'
import { recalculatePokemonStats, recalculateSkillValues } from './stats.js'
import { applyEvolutions } from './evolution.js'
import { store, addPokemonToInventory, saveGameState } from './store.js'
import { addQuestProgress } from './daily.js'

export function getBannerById(id) {
  return GACHA_BANNERS.find((b) => b.id === id) || GACHA_BANNERS[0]
}

// Sinh instance kỹ năng ngẫu nhiên dựa theo hệ và độ hiếm Pokémon
export function generateSkillInstance(type, skillGroup, pokeRarity, pokeLevel = 1) {
  let pool = ELEMENTAL_SKILL_TEMPLATES[type] ? ELEMENTAL_SKILL_TEMPLATES[type][skillGroup] : null
  if (!pool || pool.length === 0) pool = ELEMENTAL_SKILL_TEMPLATES['Fire']['Basic']

  let pokeRarityIdx = RARITY_LEVELS.indexOf(pokeRarity.name)
  if (pokeRarityIdx === -1) pokeRarityIdx = 0

  let eligiblePool = pool.filter((template) => {
    let skillRarityIdx = RARITY_LEVELS.indexOf(template.rarity || 'Common')
    return skillRarityIdx <= pokeRarityIdx
  })
  // Fix: Nếu không có skill nào phù hợp độ hiếm, lấy skill độ hiếm thấp nhất thay vì pool[0]
  if (eligiblePool.length === 0) {
    let minRarityIdx = Math.min(...pool.map(t => RARITY_LEVELS.indexOf(t.rarity || 'Common')))
    eligiblePool = pool.filter(t => RARITY_LEVELS.indexOf(t.rarity || 'Common') === minRarityIdx)
  }

  let weightedPool = eligiblePool.map((template) => {
    let skillRarityIdx = RARITY_LEVELS.indexOf(template.rarity || 'Common')
    let diff = pokeRarityIdx - skillRarityIdx
    let weight = Math.pow(0.55, diff) * 10
    return { template, weight }
  })

  let totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0)
  let rand = Math.random() * totalWeight
  let accumulatedWeight = 0
  let selectedTemplate = weightedPool[0].template
  for (let item of weightedPool) {
    accumulatedWeight += item.weight
    if (rand <= accumulatedWeight) {
      selectedTemplate = item.template
      break
    }
  }

  let min = pokeRarity.skillMin || 1.0
  let max = pokeRarity.skillMax || 1.0
  let finalSkillMultiplier = min + Math.random() * (max - min)

  let skillInst = {
    name: selectedTemplate.name,
    type: skillGroup,
    rarity: selectedTemplate.rarity || 'Common',
    category: selectedTemplate.category,
    cost: selectedTemplate.cost,
    cd: selectedTemplate.cd,
    currentCd: 0,
    rollMult: finalSkillMultiplier,
    mpGain: selectedTemplate.mpGain || 0,
    effect: selectedTemplate.effect ? JSON.parse(JSON.stringify(selectedTemplate.effect)) : null,
    isTrueDmg: selectedTemplate.isTrueDmg || false,
    baseValPower: selectedTemplate.basePower || 0,
    baseValShield: selectedTemplate.baseShield || 0,
    baseValHeal: selectedTemplate.baseHeal || 0,
  }

  recalculateSkillValues(skillInst, pokeLevel)
  applyStunConfig(skillInst)
  return skillInst
}

// Roll CỐ ĐỊNH tỷ lệ choáng (%) và số lượt ngay khi skill được gắn (khoảng gacha theo rarity skill)
// Giá trị này được giữ nguyên cho skill đó; chiến đấu chỉ dùng lại, không roll lại.
function applyStunConfig(skill) {
  if (!skill || !skill.effect || skill.effect.type !== 'stun') return
  let rolled = rollStunConfig(skill.rarity)
  skill.effect.skillRarity = skill.rarity || 'Common'
  skill.effect.chance = rolled.chance
  skill.effect.duration = rolled.duration
}

function rollRarityFromChances(rarityChances) {
  let rand = Math.random() * 100
  let cum = 0
  let selectedRarity = RARITIES[0]
  for (let r of RARITIES) {
    let chance = rarityChances[r.name] !== undefined ? rarityChances[r.name] : r.chance
    cum += chance
    if (rand <= cum) {
      selectedRarity = r
      break
    }
  }
  return selectedRarity
}

function rollPokemonLevel() {
  let playerLevel = store.gameState.player.level || 1
  let minLvl = Math.floor(playerLevel / 2)
  if (minLvl < 1) minLvl = 1
  let maxLvl = playerLevel
  if (maxLvl < minLvl) maxLvl = minLvl
  return Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl
}

export function buildNewPokemon(species, rarity, pokeLevel) {
  let newPoke = {
    id: Date.now() + Math.random(),
    name: species.name,
    type: species.type,
    rarity,
    vLevel: 0,
    level: pokeLevel,
    exp: 0,
    maxExp: Math.round(pokeLevel * 50 + Math.pow(pokeLevel, 1.5) * 10),
    maxHp: 0,
    hp: 0,
    shield: 0,
    mp: 0,
    initMp: Math.round(species.baseInitMp * rarity.statMult),
    atk: 0,
    speed: 0,
    def: 0,
    iv: {
      hp: 0.9 + Math.random() * 0.2,
      atk: 0.9 + Math.random() * 0.2,
      def: 0.9 + Math.random() * 0.2,
      speed: 0.9 + Math.random() * 0.2,
    },
    effects: [],
    passive: null,
    passives: [rollPassive(species.type)],
    talents: [],
    skills: [
      generateSkillInstance(species.type, 'Basic', rarity, pokeLevel),
      generateSkillInstance(species.type, 'Skill1', rarity, pokeLevel),
    ],
  }
  newPoke.passive = newPoke.passives[0]

  ensureSkillsByLevel(newPoke)
  recalculatePokemonStats(newPoke, store.gymBuffs)
  // Nếu Pokémon đẻ ra đã đủ level mốc tiến hóa (vd HLV cao) thì tiến hóa ngay cho khớp quy tắc
  applyEvolutions(newPoke, store.gymBuffs)
  newPoke.hp = newPoke.maxHp
  return newPoke
}

/**
 * Đảm bảo Pokémon MỚI từ Gacha có skill đúng theo level hiện tại.
 * CHỈ dùng cho Pokémon mới tạo (buildNewPokemon), KHÔNG dùng cho migration save cũ.
 * Hệ thống mới:
 * - Level 1: Basic + Skill1 (đã có sẵn khi tạo)
 * - Skill2 chỉ mở khi level >= 15 (học qua Candy level 15)
 * - Ultimate chỉ mở khi level >= 30 (học qua Candy level 30)
 * Các skill khác (level 5, 10, 15, 30, 35+) được học qua dùng Candy qua modal chọn.
 * @param {object} p - Pokémon instance
 */
export function ensureSkillsByLevel(p) {
  if (!p || !p.skills || !p.type || !p.rarity) return
  // Pokémon mới từ gacha chỉ có Basic + Skill1 ở level 1
  // Skill2 và Ultimate chỉ được học qua Candy tại mốc level 15 và 30
  // Hàm này KHÔNG tự động thêm skill - chỉ dùng để validation/khởi tạo
}

/**
 * Migration: Đảm bảo Pokémon từ save cũ có skill đúng theo level.
 * Dùng cho loadGameState() để chuyển đổi save cũ sang hệ thống mới.
 * Logic: thêm Skill2 nếu level >= 15, thêm Ultimate nếu level >= 30.
 * @param {object} p - Pokémon instance
 */
export function ensureSkillsByLevelMigration(p) {
  if (!p || !p.skills || !p.type || !p.rarity) return
  if (p.level >= 15 && !p.skills.some((s) => s.type === 'Skill2')) {
    p.skills.push(generateSkillInstance(p.type, 'Skill2', p.rarity, p.level))
  }
  if (p.level >= 30 && !p.skills.some((s) => s.type === 'Ultimate')) {
    p.skills.push(generateSkillInstance(p.type, 'Ultimate', p.rarity, p.level))
  }
}

// Chọn Pokémon từ pool theo trọng số.
// Pokémon rate-up = list `pokemons` riêng của banner (chỉ có khi banner includeStandard,
// tức phần Pokémon đặc trưng của banner) được nâng trọng số rateUpWeight (mặc định x2).
function pickWeightedSpecies(pool, banner) {
  const rateUpNames = banner.includeStandard ? banner.pokemons || [] : []
  const rateUpWeight = banner.rateUp ? banner.rateUpWeight || 2 : 1
  if (rateUpNames.length === 0 || rateUpWeight <= 1) {
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const weighted = pool.map((s) => ({
    species: s,
    weight: rateUpNames.includes(s.name) ? rateUpWeight : 1,
  }))
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0)
  let rand = Math.random() * totalWeight
  let accumulated = 0
  for (const item of weighted) {
    accumulated += item.weight
    if (rand <= accumulated) return item.species
  }
  return weighted[weighted.length - 1].species
}

// Thực hiện 1 lượt quay theo Banner
function executeBannerRoll(bannerId) {
  const banner = getBannerById(bannerId)

  // 1. Quay độ hiếm
  let selectedRarity = rollRarityFromChances(banner.rarityChances)

  // 2. Chọn Pokémon từ danh sách `pokemons` của banner (data-driven — sửa list là thêm/bớt tùy ý)
  let pool = getBannerSpeciesPool(banner)
  if (pool.length === 0) pool = [...POKEMON_SPECIES]

  // Lọc species KHÔNG hợp với độ hiếm đã roll: con có minRarity (vd Ho-Oh/Lugia/Raikou)
  // chỉ được chọn khi roll được Legendary trở lên — không ép rarity, giữ tỉ lệ đúng theo rarityChances.
  let eligiblePool = pool.filter((s) => {
    if (!s.minRarity) return true
    let minIdx = RARITY_LEVELS.indexOf(s.minRarity)
    let curIdx = RARITY_LEVELS.indexOf(selectedRarity.name)
    return minIdx > -1 && minIdx <= curIdx
  })
  if (eligiblePool.length === 0) eligiblePool = pool

  let species = pickWeightedSpecies(eligiblePool, banner)

  // 3. Level theo cấp người chơi
  let pokeLevel = rollPokemonLevel()

  // 4. Tạo instance
  let newPoke = buildNewPokemon(species, selectedRarity, pokeLevel)
  addPokemonToInventory(newPoke)

  return newPoke
}

/**
 * Roll Gacha theo Banner. Trả về kết quả để UI hiển thị.
 * @param {string} bannerId
 * @param {number} times
 * @returns {{ ok: boolean, message?: string, results?: Array, banner?: object }}
 */
export function rollGacha(bannerId, times) {
  const banner = getBannerById(bannerId)
  let totalCost = banner.cost * times

  if (store.team.length + times > INVENTORY_LIMIT) {
    return {
      ok: false,
      message: `Kho đã đầy! (${store.team.length}/${INVENTORY_LIMIT}) Không thể quay thêm. Hãy hợp nhất hoặc giải phóng chỗ trống.`,
    }
  }

  if (banner.currency === 'gems') {
    if (store.gems < totalCost) {
      return {
        ok: false,
        message: `Không đủ Gem! Bạn cần ${totalCost} Gem để quay x${times}. Hiện tại bạn có: ${store.gems}`,
      }
    }
    store.gems -= totalCost
  } else {
    if (store.gameState.player.pokePoint < totalCost) {
      return {
        ok: false,
        message: `Không đủ PokePoint! Bạn cần ${totalCost} PokePoint để quay x${times}. Hiện tại bạn có: ${store.gameState.player.pokePoint}`,
      }
    }
    store.gameState.player.pokePoint -= totalCost
  }
  store.gameState.player.pokeGacha += times

  let results = []
  for (let i = 0; i < times; i++) {
    results.push(executeBannerRoll(bannerId))
  }

  addQuestProgress('rolls', times)

  saveGameState()
  return { ok: true, results, banner }
}

/**
 * Đổi Pokémon trong shop PokeGacha.
 * @param {string} pokemonName
 * @param {number} cost
 * @param {string} [rarityName] - Độ hiếm đổi được (lấy từ SHOP_ITEMS), mặc định 'Epic'.
 * @returns {{ ok: boolean, message: string, poke?: object }}
 */
export function redeemPokemon(pokemonName, cost, rarityName = 'Epic') {
  if (store.gameState.player.pokeGacha < cost) {
    return {
      ok: false,
      message: `Không đủ điểm PokeGacha! Bạn cần ${cost} điểm để đổi ${pokemonName}. Hiện có: ${store.gameState.player.pokeGacha}`,
    }
  }

  if (store.team.length >= INVENTORY_LIMIT) {
    return {
      ok: false,
      message: `Kho đã đầy! (${store.team.length}/${INVENTORY_LIMIT}) Hãy giải phóng chỗ trống trước khi đổi Pokémon.`,
    }
  }

  let species = POKEMON_SPECIES.find((s) => s.name === pokemonName)
  if (!species) return { ok: false, message: `Không tìm thấy Pokémon có tên ${pokemonName} trong dữ liệu!` }

  store.gameState.player.pokeGacha -= cost

  let selectedRarity = RARITIES.find((r) => r.name === rarityName) || RARITIES[2]
  // Ép rarity không thấp hơn minRarity của species
  if (species.minRarity) {
    let minIdx = RARITY_LEVELS.indexOf(species.minRarity)
    let curIdx = RARITY_LEVELS.indexOf(selectedRarity.name)
    if (minIdx > -1 && curIdx < minIdx) selectedRarity = RARITIES[minIdx]
  }

  let pokeLevel = rollPokemonLevel()
  let newPoke = buildNewPokemon(species, selectedRarity, pokeLevel)
  addPokemonToInventory(newPoke)

  saveGameState()
  return { ok: true, message: `Đổi thành công! Nhận được: [${selectedRarity.name}] ${newPoke.name} (Lv.${newPoke.level})!`, poke: newPoke }
}

// ==========================================
// CHEAT / TEST CONTROLS (THỬ NGHIỆM)
// ==========================================

export function cheatAddResource(resource, val) {
  if (store.gameState.player[resource] !== undefined) {
    store.gameState.player[resource] += val
    saveGameState()
  }
}

export function cheatSetLevel(val) {
  val = parseInt(val, 10)
  if (isNaN(val) || val < 1) val = 1
  if (val > 100) val = 100
  store.gameState.player.level = val
  saveGameState()
  return val
}

export function cheatResetAllResources() {
  store.gameState.player.level = 1
  store.gameState.player.playerExp = 0
  store.gameState.player.playerExpToNext = 100
  store.gameState.player.pokePoint = 1000
  store.gameState.player.pokeGacha = 0
  saveGameState()
}
