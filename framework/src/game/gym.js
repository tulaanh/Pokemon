// ==========================================
// LOGIC PHÒNG GYM (TÁCH UI - GIỮ NGUYÊN CÔNG THỨC)
// ==========================================

import { POKEMON_SPECIES, RARITIES } from './data.js'
import { store, saveGameState } from './store.js'
import { showToast } from '../components/ui/toast.js'
import { generateSkillInstance } from './gacha.js'
import { recalculatePokemonStats } from './stats.js'
import { addQuestProgress } from './daily.js'
import {
  battle,
  battleLog,
  clearBattleLog,
  clearFx,
  pushFx,
  fxSide,
  getHpPct,
  getEffectiveSpeed,
  applyStartBattlePassive,
  applyStartTurnPassive,
  executeSkillAction,
  gainExp,
  applyPendingLevelUps,
  healBattleTeam,
  tickSkillCooldowns,
  canUseSkill,
  calculateDotDamage,
  isStunned,
  consumeExtraTurnOnEntry,
  awaitFxIdle,
} from './battle.js'

export const GYM_DATA = {
  Water: {
    name: 'Phòng Gym Nước',
    icon: '🌊',
    type: 'Water',
    waves: [
      { enemies: [{ level: 21, species: 'Squirtle', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Psyduck', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Squirtle', rarity: 'Rare', statMult: 1.5 }] },
      { enemies: [{ level: 36, species: 'Psyduck', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Squirtle', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Psyduck', rarity: 'Epic', statMult: 1.8 }] },
      { enemies: [{ level: 61, species: 'Squirtle', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Psyduck', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Squirtle', rarity: 'Legendary', statMult: 2.2 }] },
      { enemies: [{ level: 76, species: 'Psyduck', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Squirtle', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Psyduck', rarity: 'Mythic', statMult: 2.8 }] },
      { enemies: [{ level: 86, species: 'Squirtle', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Psyduck', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Squirtle', rarity: 'Mythic', statMult: 3.5 }] },
    ],
  },
  Fire: {
    name: 'Phòng Gym Lửa',
    icon: '🔥',
    type: 'Fire',
    waves: [
      { enemies: [{ level: 21, species: 'Charmander', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Magmar', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Charmander', rarity: 'Rare', statMult: 1.5 }] },
      { enemies: [{ level: 36, species: 'Magmar', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Charmander', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Magmar', rarity: 'Epic', statMult: 1.8 }] },
      { enemies: [{ level: 61, species: 'Charmander', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Magmar', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Charmander', rarity: 'Legendary', statMult: 2.2 }] },
      { enemies: [{ level: 76, species: 'Magmar', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Charmander', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Magmar', rarity: 'Mythic', statMult: 2.8 }] },
      { enemies: [{ level: 86, species: 'Charmander', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Magmar', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Charmander', rarity: 'Mythic', statMult: 3.5 }] },
    ],
  },
  Grass: {
    name: 'Phòng Gym Cỏ',
    icon: '🌿',
    type: 'Grass',
    waves: [
      { enemies: [{ level: 21, species: 'Bulbasaur', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Bulbasaur', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Bulbasaur', rarity: 'Rare', statMult: 1.5 }] },
      { enemies: [{ level: 36, species: 'Bulbasaur', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Bulbasaur', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Bulbasaur', rarity: 'Epic', statMult: 1.8 }] },
      { enemies: [{ level: 61, species: 'Bulbasaur', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Bulbasaur', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Bulbasaur', rarity: 'Legendary', statMult: 2.2 }] },
      { enemies: [{ level: 76, species: 'Bulbasaur', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Bulbasaur', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Bulbasaur', rarity: 'Mythic', statMult: 2.8 }] },
      { enemies: [{ level: 86, species: 'Bulbasaur', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Bulbasaur', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Bulbasaur', rarity: 'Mythic', statMult: 3.5 }] },
    ],
  },
  Electric: {
    name: 'Phòng Gym Điện',
    icon: '⚡',
    type: 'Electric',
    waves: [
      { enemies: [{ level: 21, species: 'Pikachu', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Pikachu', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Pikachu', rarity: 'Rare', statMult: 1.5 }] },
      { enemies: [{ level: 36, species: 'Pikachu', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Pikachu', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Pikachu', rarity: 'Epic', statMult: 1.8 }] },
      { enemies: [{ level: 61, species: 'Pikachu', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Pikachu', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Pikachu', rarity: 'Legendary', statMult: 2.2 }] },
      { enemies: [{ level: 76, species: 'Pikachu', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Pikachu', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Pikachu', rarity: 'Mythic', statMult: 2.8 }] },
      { enemies: [{ level: 86, species: 'Pikachu', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Pikachu', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Pikachu', rarity: 'Mythic', statMult: 3.5 }] },
    ],
  },
  Rock: {
    name: 'Phòng Gym Đá',
    icon: '🪨',
    type: 'Rock',
    waves: [
      { enemies: [{ level: 21, species: 'Onix', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Lycanroc', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Onix', rarity: 'Rare', statMult: 1.5 }] },
      { enemies: [{ level: 36, species: 'Lycanroc', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Onix', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Lycanroc', rarity: 'Epic', statMult: 1.8 }] },
      { enemies: [{ level: 61, species: 'Onix', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Lycanroc', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Garganacl', rarity: 'Legendary', statMult: 2.2 }] },
      { enemies: [{ level: 76, species: 'Lycanroc', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Garganacl', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Onix', rarity: 'Mythic', statMult: 2.8 }] },
      { enemies: [{ level: 86, species: 'Onix', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Garganacl', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Tyranitar', rarity: 'Mythic', statMult: 3.5 }] },
    ],
  },
}

export function getTrainerLevel() {
  return (store.gameState && store.gameState.player && store.gameState.player.level) || 1
}

// === KIỂM TRA ĐỘI HÌNH GYM ===
export function validateGymTeam(gymType) {
  let selectedIndices = battle.teamIndices.filter((idx) => idx !== null && store.team[idx])
  if (selectedIndices.length === 0) {
    return { valid: false, message: 'Bạn phải chọn ít nhất 1 Pokémon để xuất trận!' }
  }

  let playerLevel = getTrainerLevel()

  for (let idx of selectedIndices) {
    let p = store.team[idx]
    if (p.type !== gymType) {
      return { valid: false, message: `❌ ${p.name} là hệ ${p.type}, không phải hệ ${gymType}! Toàn bộ đội hình phải là hệ ${gymType}.` }
    }
    if (p.level > playerLevel) {
      return { valid: false, message: `❌ ${p.name} đang ở cấp ${p.level}, cao hơn cấp HLV (${playerLevel})! Pokémon xuất trận không được vượt quá cấp của người chơi.` }
    }
  }

  return { valid: true, message: '' }
}

// Danh sách Pokémon hệ tương ứng (cấp <= HLV) để chọn
export function getGymEligibleList(gymType) {
  let playerLevel = getTrainerLevel()
  return store.team
    .map((p, originalIndex) => ({ pokemon: p, originalIndex }))
    .filter((item) => {
      if (item.pokemon.type !== gymType) return false
      if (item.pokemon.level > playerLevel) return false
      let isAlreadyInTeam = battle.teamIndices.includes(item.originalIndex) && battle.teamIndices[battle.selectingSlot] !== item.originalIndex
      return !isAlreadyInTeam
    })
    .sort((a, b) => b.pokemon.level - a.pokemon.level)
}

// === TẠO POKÉMON HLV GYM (GIỮ NGUYÊN FORMULA) ===
function createGymEnemy(eConfig) {
  let eSpecies = POKEMON_SPECIES.find((s) => s.name === eConfig.species) || POKEMON_SPECIES[0]
  let eRarity = RARITIES.find((r) => r.name === eConfig.rarity) || RARITIES[0]
  let eLevel = eConfig.level
  let sMult = eConfig.statMult

  let eMpStep = Math.floor((eLevel - 1) / 10)
  let eMaxMp = 100 + eMpStep * 10
  let eInitMp = Math.min(eMaxMp, Math.round((eSpecies.baseInitMp + eMpStep * 5) * eRarity.statMult))

  let hpGrowthRate = eSpecies.type === 'Rock' ? 0.09 : 0.075
  let hpMult = Math.pow(1 + hpGrowthRate, eLevel - 1)
  let atkMult = Math.pow(1 + 0.07, eLevel - 1)
  let defMult = Math.pow(1 + 0.06, eLevel - 1)
  let speedStep = Math.floor((eLevel - 1) / 5)

  let poke = {
    name: eSpecies.name,
    type: eSpecies.type,
    rarity: eRarity,
    vLevel: 0,
    level: eLevel,
    maxHp: Math.round(eSpecies.baseHp * hpMult * eRarity.statMult * sMult),
    hp: Math.round(eSpecies.baseHp * hpMult * eRarity.statMult * sMult),
    shield: 0,
    maxMp: eMaxMp,
    initMp: eInitMp,
    mp: eInitMp,
    atk: Math.round(eSpecies.baseAtk * atkMult * eRarity.statMult * sMult),
    def: Math.round(eSpecies.baseDef * defMult * eRarity.statMult * sMult),
    speed: Math.round(eSpecies.baseSpeed * eRarity.statMult) + speedStep,
    effects: [],
    passive: eSpecies.passive ? JSON.parse(JSON.stringify(eSpecies.passive)) : null,
    skills: [
      generateSkillInstance(eSpecies.type, 'Basic', eRarity, eLevel),
      generateSkillInstance(eSpecies.type, 'Skill1', eRarity, eLevel),
    ],
  }

  if (eLevel >= 5) poke.skills.push(generateSkillInstance(eSpecies.type, 'Skill2', eRarity, eLevel))
  if (eLevel >= 10) poke.skills.push(generateSkillInstance(eSpecies.type, 'Ultimate', eRarity, eLevel))

  return poke
}

// === BẮT ĐẦU TRẬN GYM ===
export function startGymBattle(gymType) {
  let validation = validateGymTeam(gymType)
  if (!validation.valid) {
    showToast(validation.message, 'warning')
    return false
  }

  battle.isBattling = true
  battle.mode = 'gym'
  battle.gymType = gymType
  battle.waveIdx = 0
  battle.rewards = { gems: 0, exp: 0, gold: 0, candy: 0 }
  battle.skillQueue = []
  clearBattleLog()
  clearFx()

  healBattleTeam()

  if (!gymSwitchToNextAlive()) {
    showToast('Không có Pokémon nào còn sống để xuất trận!', 'error')
    return false
  }

  loadGymWave()
  return true
}

function gymSwitchToNextAlive() {
  for (let i = 0; i < 3; i++) {
    let idx = battle.teamIndices[i]
    if (idx !== null && store.team[idx] && store.team[idx].hp > 0) {
      battle.activePokeIdx = idx
      battleLog(`🔄 <b>${store.team[idx].name}</b> được tung vào sân Gym!`)
      applyStartBattlePassive(store.team[idx])
      return true
    }
  }
  return false
}

// === LOAD WAVE GYM (3 POKÉMON) ===
function loadGymWave() {
  let gym = GYM_DATA[battle.gymType]
  let progress = store.gymProgress[battle.gymType] || 0
  let waveConfig = gym.waves[progress]

  battle.enemyTeam = waveConfig.enemies.map((eConfig) => createGymEnemy(eConfig))
  battle.gymActiveEnemyIdx = 0
  battle.enemyPoke = battle.enemyTeam[0]
  battle.isProcessingTurn = false

  battle.battleTitle = `${gym.icon} ${gym.name} — Ải ${progress + 1}/5`
  battle.waveIndicator = 'HLV (3 Pokémon)'

  battleLog(`🏟️ [Gym ${battle.gymType}] Ải ${progress + 1}: <b>${store.team[battle.activePokeIdx].name}</b> VS Đội HLV Gym (3 Pokémon)!`)
  checkStartBattlePassives()
  gymDetermineFirstTurn()
}

export function checkStartBattlePassives() {
  let playerPoke = store.team[battle.activePokeIdx]
  if (playerPoke) applyStartBattlePassive(playerPoke)
  if (battle.enemyPoke) applyStartBattlePassive(battle.enemyPoke)
}

// === TỰ ĐỘNG ĐỔI POKÉMON ĐỐI THỦ KHI BỊ HẠ GỤC ===
function gymCheckEnemyDefeatedOrSwitch() {
  if (battle.enemyPoke.hp <= 0) {
    let nextEnemyIdx = battle.enemyTeam.findIndex((e, idx) => idx > battle.gymActiveEnemyIdx && e.hp > 0)

    if (nextEnemyIdx !== -1) {
      battle.gymActiveEnemyIdx = nextEnemyIdx
      battle.enemyPoke = battle.enemyTeam[battle.gymActiveEnemyIdx]
      battleLog(`🔄 HLV Gym tung <b>${battle.enemyPoke.name}</b> (Lv.${battle.enemyPoke.level}) ra sân [${battle.gymActiveEnemyIdx + 1}/3]!`)
      applyStartBattlePassive(battle.enemyPoke)
      return false
    } else {
      handleGymEnemyDefeated()
      return true
    }
  }
  return false
}

// === HIỆU ỨNG ĐẦU LƯỢT GYM (PASSIVE + CHOÁNG + GIẢM THỜI LƯỢNG BUFF/DEBUFF) ===
function gymProcessStartOfTurnEffects(poke) {
  let isPlayer = poke === store.team[battle.activePokeIdx]
  let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} (HLV)</b>`

  applyStartTurnPassive(poke)

  // Choáng (stun): Pokémon mất 1 lượt
  if (isStunned(poke)) {
    battleLog(`😵 ${pokeTitle} bị CHOÁNG — mất 1 lượt!`)
    return 'stunned'
  }

  // Buff/debuff (không phải DoT) giảm thời lượng ở đầu lượt
  const dotEffectTypes = ['burn', 'shock', 'poison', 'bleed']
  for (let i = poke.effects.length - 1; i >= 0; i--) {
    let eff = poke.effects[i]
    if (dotEffectTypes.includes(eff.type)) continue
    eff.duration--
    if (eff.duration <= 0) {
      battleLog(`✨ Hiệu ứng [${eff.name}] trên ${pokeTitle} đã hết hạn.`)
      poke.effects.splice(i, 1)
    }
  }

  return false
}

// === SÁT THƯƠNG ĐỐT CUỐI LƯỢT GYM (DOT THEO % ATK NGUỒN GÂY RA) ===
// Pokémon bị dính hiệu ứng đốt chịu sát thương vào CUỐI lượt của chính nó (chuẩn Pokémon).
function gymProcessEndOfTurnDot(poke) {
  let isPlayer = poke === store.team[battle.activePokeIdx]
  let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} (HLV)</b>`

  const dotEffectTypes = ['burn', 'shock', 'poison', 'bleed']

  for (let i = poke.effects.length - 1; i >= 0; i--) {
    let eff = poke.effects[i]
    if (dotEffectTypes.includes(eff.type)) {
      // Tính DoT dựa trên ATK của nguồn gây ra hiệu ứng (giống chiến dịch)
      let dmg = calculateDotDamage(poke, eff)
      poke.hp = Math.max(0, poke.hp - dmg)
      let sourceInfo = eff.sourceName ? ` (từ ${eff.sourceName})` : ''
      battleLog(`🔥 ${pokeTitle} chịu <b>${dmg}</b> sát thương từ [${eff.name}]${sourceInfo}!`)
      pushFx({ type: 'dot', side: fxSide(poke), dmg, hpPct: getHpPct(poke) })

      eff.duration--
      if (eff.duration <= 0) {
        battleLog(`✨ Hiệu ứng [${eff.name}] trên ${pokeTitle} đã hết hạn.`)
        poke.effects.splice(i, 1)
      }
    }
  }

  if (poke.hp <= 0) {
    if (isPlayer) {
      battleLog(`💀 <b>${poke.name}</b> đã gục ngã vì sát thương đốt cuối lượt!`)
      if (!gymPromptFaintSwitch()) return true
      gymDetermineFirstTurn()
      return true
    }
    if (!gymCheckEnemyDefeatedOrSwitch()) {
      gymDetermineFirstTurn()
    }
    return true
  }
  return false
}

// === XÁC ĐỊNH NGƯỜI ĐI TRƯỚC KHI VỪA XUẤT TRẬN (THEO TỐC ĐỘ HOẶC BỊ ÉP) ===
function gymDetermineFirstTurn(forcedOwner = null) {
  battle.extraTurnOwner = null
  let p = store.team[battle.activePokeIdx]
  if (!p || p.hp <= 0 || battle.enemyPoke.hp <= 0) return

  // Buff tăng tốc → nhận thêm 1 lượt đánh khi vừa ra trận
  let pExtra = consumeExtraTurnOnEntry(p)
  let eExtra = consumeExtraTurnOnEntry(battle.enemyPoke)

  if (pExtra && !eExtra) {
    battle.extraTurnOwner = 'player'
    battle.currentTurnOwner = 'player'
    battleLog(`⚡ <b>${p.name}</b> bứt tốc — nhận thêm 1 lượt đánh khi vừa ra trận!`)
    gymStartNextTurn()
    return
  }
  if (eExtra && !pExtra) {
    battle.extraTurnOwner = 'bot'
    battle.currentTurnOwner = 'bot'
    battleLog(`⚡ <b>${battle.enemyPoke.name} (HLV Gym)</b> bứt tốc — nhận thêm 1 lượt đánh khi vừa ra trận!`)
    gymStartNextTurn()
    return
  }

  if (forcedOwner) {
    battle.currentTurnOwner = forcedOwner
  } else {
    let pSpd = getEffectiveSpeed(p)
    let eSpd = getEffectiveSpeed(battle.enemyPoke)

    if (pSpd > eSpd) {
      battle.currentTurnOwner = 'player'
    } else if (eSpd > pSpd) {
      battle.currentTurnOwner = 'bot'
    } else {
      battle.currentTurnOwner = Math.random() < 0.5 ? 'player' : 'bot'
    }
  }

  let firstName =
    battle.currentTurnOwner === 'player' ? `<b>${p.name}</b>` : `<b>${battle.enemyPoke.name} (HLV Gym)</b>`
  if (!forcedOwner && getEffectiveSpeed(p) === getEffectiveSpeed(battle.enemyPoke)) {
    battleLog(`🎲 Tốc độ ngang bằng — chọn ngẫu nhiên: ${firstName} đi trước!`)
  } else if (!forcedOwner) {
    battleLog(`⚡ ${firstName} đi trước nhờ Tốc Độ!`)
  }

  gymStartNextTurn()
}

// Chuyển lượt theo cơ chế đánh theo lượt bình thường (xen kẽ)
function gymStartNextTurn() {
  let p = store.team[battle.activePokeIdx]
  if (!p || p.hp <= 0 || battle.enemyPoke.hp <= 0) return

  if (battle.currentTurnOwner === 'player') {
    let res = gymProcessStartOfTurnEffects(p)
    if (res === 'stunned') {
      // Mất lượt nhưng vẫn chịu sát thương đốt cuối lượt
      if (gymProcessEndOfTurnDot(p)) return
      battle.currentTurnOwner = 'bot'
      battle.isProcessingTurn = false
      gymStartNextTurn()
      return
    }
    if (res) return
    if (p.hp <= 0) return
    battleLog(`⚡ Lượt của <b>${p.name}</b>!`)
  } else {
    let res = gymProcessStartOfTurnEffects(battle.enemyPoke)
    if (res === 'stunned') {
      // Mất lượt nhưng vẫn chịu sát thương đốt cuối lượt
      if (gymProcessEndOfTurnDot(battle.enemyPoke)) return
      battle.currentTurnOwner = 'player'
      battle.isProcessingTurn = false
      gymStartNextTurn()
      return
    }
    if (res) return
    if (battle.enemyPoke.hp <= 0) return
    battleLog(`🤖 Lượt của <b>${battle.enemyPoke.name} (HLV Gym)</b>!`)
    gymExecuteBotTurn()
  }
}

function gymExecuteBotTurn() {
  battle.isProcessingTurn = true
  setTimeout(async () => {
    await awaitFxIdle()

    if (battle.enemyPoke.hp <= 0) return

    let p = store.team[battle.activePokeIdx]
    let usableSkills = battle.enemyPoke.skills.filter((s) => s.currentCd === 0 && battle.enemyPoke.mp >= s.cost)
    let chosenSkill =
      usableSkills.find((s) => s.category === 'heal') && battle.enemyPoke.hp / battle.enemyPoke.maxHp < 0.4
        ? usableSkills.find((s) => s.category === 'heal')
        : usableSkills.sort((a, b) => (b.power || 0) - (a.power || 0))[0] || battle.enemyPoke.skills[0]

    executeSkillAction(battle.enemyPoke, p, chosenSkill, false)

    tickSkillCooldowns(battle.enemyPoke)

    await awaitFxIdle()

    if (battle.enemyPoke.hp <= 0) {
      let allDefeated = gymCheckEnemyDefeatedOrSwitch()
      battle.isProcessingTurn = false
      if (!allDefeated) gymDetermineFirstTurn('bot')
      return
    }

    // CUỐI lượt của địch: sát thương đốt trên chính địch
    if (gymProcessEndOfTurnDot(battle.enemyPoke)) {
      battle.isProcessingTurn = false
      return
    }
    await awaitFxIdle()

    if (p.hp <= 0) {
      battleLog(`💀 <b>${p.name}</b> đã gục ngã!`)
      if (!gymPromptFaintSwitch()) {
        battle.isProcessingTurn = false
        return
      }
      battle.isProcessingTurn = false
      gymDetermineFirstTurn()
      return
    }

    battle.isProcessingTurn = false

    if (battle.extraTurnOwner === 'bot') {
      battle.extraTurnOwner = null
      battle.currentTurnOwner = 'player'
      gymStartNextTurn()
      return
    }

    battle.currentTurnOwner = 'player'
    gymStartNextTurn()
  }, 800)
}

export async function useGymSkill(skillIdx) {
  if (!canUseSkill()) return

  let p = store.team[battle.activePokeIdx]
  let skill = p.skills[skillIdx]

  if (p.mp < skill.cost) {
    battleLog(`❌ Không đủ MP để dùng ${skill.name}!`)
    return
  }
  if (skill.currentCd > 0) {
    battleLog(`⏳ ${skill.name} đang hồi chiêu (${skill.currentCd} lượt)!`)
    return
  }

  battle.isProcessingTurn = true
  executeSkillAction(p, battle.enemyPoke, skill, true)

  tickSkillCooldowns(p)

  await awaitFxIdle()

  if (battle.enemyPoke.hp <= 0) {
    let allDefeated = gymCheckEnemyDefeatedOrSwitch()
    battle.isProcessingTurn = false
    if (!allDefeated) gymDetermineFirstTurn('bot')
    return
  }

  // CUỐI lượt của người chơi: sát thương đốt trên chính Pokémon đang xuất trận
  battle.isProcessingTurn = false
  if (gymProcessEndOfTurnDot(p)) return
  await awaitFxIdle()

  if (battle.extraTurnOwner === 'player') {
    battle.extraTurnOwner = null
    battle.currentTurnOwner = 'bot'
    gymStartNextTurn()
    return
  }

  battle.currentTurnOwner = 'bot'
  gymStartNextTurn()
}

// Đổi Pokémon trong trận Gym
export function performGymInBattleSwitch(targetIdx) {
  let oldPoke = store.team[battle.activePokeIdx]
  battle.activePokeIdx = targetIdx
  let newPoke = store.team[battle.activePokeIdx]

  battleLog(`🔄 Thu hồi <b>${oldPoke.name}</b>, tung <b>${newPoke.name}</b> vào sân Gym!`)

  applyStartBattlePassive(newPoke)
  gymDetermineFirstTurn()
}

// === XỬ LÝ HẠ GỤC — CHO CHỌN POKÉMON THAY THẾ (GYM) ===

// Khi Pokémon người chơi gục, mở modal cho phép chọn con thay thế
export function gymPromptFaintSwitch() {
  for (let i = 0; i < 3; i++) {
    let idx = battle.teamIndices[i]
    if (idx !== null && store.team[idx] && store.team[idx].hp > 0 && idx !== battle.activePokeIdx) {
      battle.awaitingFaintSwitch = true
      battle.isProcessingTurn = false
      battle.currentTurnOwner = 'player'
      battleLog(`🐣 <b>${store.team[battle.activePokeIdx].name}</b> đã gục — chọn Pokémon tiếp theo ra sân!`)
      return true
    }
  }
  // Không còn Pokémon nào khác để thay thế
  battleLog(`💀 Toàn bộ đội hình đã gục ngã! Gym thất bại.`)
  battle.isProcessingTurn = false
  showGymResult(false)
  return false
}

// Xác nhận chọn Pokémon thay thế sau khi con trước đó gục
export function confirmGymFaintSwitch(targetIdx) {
  battle.awaitingFaintSwitch = false
  let oldPoke = store.team[battle.activePokeIdx]
  battle.activePokeIdx = targetIdx
  let newPoke = store.team[targetIdx]

  battleLog(`🔄 <b>${oldPoke.name}</b> đã gục, tung <b>${newPoke.name}</b> vào sân Gym!`)
  applyStartBattlePassive(newPoke)
  gymDetermineFirstTurn('player')
}

// === XỬ LÝ THẮNG GYM ===
function handleGymEnemyDefeated() {
  let p = store.team[battle.activePokeIdx]
  let totalLevel = battle.enemyTeam.reduce((acc, e) => acc + e.level, 0)
  let earnedExp = 50 + totalLevel * 15
  let earnedGold = Math.floor(Math.random() * (totalLevel * 10)) + totalLevel * 5

  battle.rewards.exp += earnedExp
  battle.rewards.gold += earnedGold
  store.gold += earnedGold

  battleLog(`🏆 Hạ gục HLV Gym thành công! Nhận +${earnedExp} EXP, +${earnedGold} 🪙`)
  gainExp(p, earnedExp)

  store.gymProgress[battle.gymType] = (store.gymProgress[battle.gymType] || 0) + 1

  // Hoàn thành Gym (ải 5) -> Buff 10% vĩnh viễn cho hệ
  if (store.gymProgress[battle.gymType] >= 5) {
    store.gymBuffs[battle.gymType] = 0.1
    battleLog(`🏅 <b>HOÀN THÀNH ${GYM_DATA[battle.gymType].name}!</b> Tất cả Pokémon hệ ${battle.gymType} được BUFF 10% chỉ số!`)

    store.team.forEach((poke) => {
      if (poke.type === battle.gymType) {
        recalculatePokemonStats(poke, store.gymBuffs)
      }
    })
  }

  showGymResult(true)
}

export function showGymResult(win) {
  applyPendingLevelUps()
  if (win) addQuestProgress('wins', 1)
  battle.resultOpen = true
  battle.resultWin = win
  saveGameState()
}
