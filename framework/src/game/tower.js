// ==========================================
// LOGIC THÁP VÔ TẬN (TÁCH UI - GIỮ NGUYÊN CÔNG THỨC)
// Roguelike: KHÔNG hồi máu giữa tầng (trừ mốc 5 tầng +20% HP), team gục hết = hết run.
// Thưởng cộng dồn vào "rương" (pot) — Rút Lui mới nhận, thua mất hết.
// Địch sinh ngẫu nhiên, chỉ số tăng hàm mũ theo tầng (giống Gym), số địch 1->2->3.
// ==========================================

import { POKEMON_SPECIES, RARITIES, RARITY_LEVELS } from './data.js'
import { store, saveGameState } from './store.js'
import { showToast } from '../components/ui/toast.js'
import { generateSkillInstance } from './gacha.js'
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
  switchToNextAlivePokemon,
  tickSkillCooldowns,
  canUseSkill,
  healBattleTeam,
  calculateDotDamage,
  isStunned,
  consumeExtraTurnOnEntry,
  awaitFxIdle,
} from './battle.js'

// Nhãn đối thủ trong nhật ký
const ENEMY_TAG = '(Tháp)'

// === CÂN BẰNG (DỄ CHỈNH) ===
const HP_GROWTH = 0.08 // tăng trưởng HP hàm mũ theo tầng
const ATK_GROWTH = 0.07
const DEF_GROWTH = 0.06
const HEAL_MILESTONE = 5 // mốc hồi máu
const HEAL_MILESTONE_PCT = 0.2 // % HP tối đa được hồi tại mốc

// Độ hiếm địch theo cụm tầng
export function getTowerRarityTier(floor) {
  if (floor >= 30) return 'Mythic'
  if (floor >= 20) return 'Legendary'
  if (floor >= 10) return 'Epic'
  if (floor >= 5) return 'Rare'
  return 'Common'
}

// Tầng BOSS: mỗi 10 tầng (10, 20, 30...) — 1 địch mạnh, thưởng rương x3 + Kẹo chắc chắn
export function isTowerBossFloor(floor) {
  return floor % 10 === 0
}

// Số đối thủ theo cụm tầng: 1 -> 2 -> 3 (tầng boss chỉ có 1 địch hùng mạnh)
export function getTowerEnemyCount(floor) {
  if (isTowerBossFloor(floor)) return 1
  if (floor >= 10) return 3
  if (floor >= 5) return 2
  return 1
}

// Sinh cấu hình địch cho 1 tầng (species ngẫu nhiên, level = tầng)
// Tầng boss: nâng độ hiếm lên 1 bậc + statMult x2. Tầng thường: ~20% xuất hiện địch Elite (x1.35).
export function getTowerFloorConfig(floor) {
  let count = getTowerEnemyCount(floor)
  let rarity = getTowerRarityTier(floor)
  let isBoss = isTowerBossFloor(floor)
  let isElite = !isBoss && Math.random() < 0.2

  if (isBoss) {
    let tierIdx = RARITY_LEVELS.indexOf(rarity)
    if (tierIdx > -1 && tierIdx < RARITY_LEVELS.length - 1) rarity = RARITY_LEVELS[tierIdx + 1]
  }

  let configs = []
  for (let i = 0; i < count; i++) {
    let species = POKEMON_SPECIES[Math.floor(Math.random() * POKEMON_SPECIES.length)]
    configs.push({ species: species.name, level: floor, rarity, boss: isBoss, elite: isElite })
  }
  return configs
}

// === TẠO QUÁI THÁP (CÔNG THỨC HÀM MŨ NHƯ GYM) ===
function createTowerEnemy(config) {
  let eSpecies = POKEMON_SPECIES.find((s) => s.name === config.species) || POKEMON_SPECIES[0]
  let eRarity = RARITIES.find((r) => r.name === config.rarity) || RARITIES[0]
  let floor = config.level

  // Địch boss/elite: tăng hệ số tăng trưởng + nhân thêm chỉ số
  let growthMult = config.boss ? 1.5 : 1
  let sMult = config.boss ? 2.0 : config.elite ? 1.35 : 1.0

  let eMpStep = Math.floor((floor - 1) / 10)
  let eMaxMp = 100 + eMpStep * 10
  let eInitMp = Math.min(eMaxMp, Math.round((eSpecies.baseInitMp + eMpStep * 5) * eRarity.statMult))

  let hpMult = Math.pow(1 + HP_GROWTH * growthMult, floor - 1)
  let atkMult = Math.pow(1 + ATK_GROWTH * growthMult, floor - 1)
  let defMult = Math.pow(1 + DEF_GROWTH * growthMult, floor - 1)
  let speedStep = Math.floor((floor - 1) / 5)

  let enemy = {
    name: eSpecies.name,
    type: eSpecies.type,
    rarity: eRarity,
    vLevel: 0,
    level: floor,
    boss: !!config.boss,
    elite: !!config.elite,
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
      generateSkillInstance(eSpecies.type, 'Basic', eRarity, floor),
      generateSkillInstance(eSpecies.type, 'Skill1', eRarity, floor),
    ],
  }

  if (floor >= 5) enemy.skills.push(generateSkillInstance(eSpecies.type, 'Skill2', eRarity, floor))
  if (floor >= 10) enemy.skills.push(generateSkillInstance(eSpecies.type, 'Ultimate', eRarity, floor))

  return enemy
}

// Danh sách Pokémon hợp lệ để chọn xuất trận (CHỈ load từ Pokédex — giống campaign/story)
export function getTowerSelectList() {
  let pokedexIds = (store.gameState.pokedex || []).map(String)
  return store.team
    .map((p, originalIndex) => ({ pokemon: p, originalIndex }))
    .filter((item) => {
      let isAlreadyInTeam = battle.teamIndices.includes(item.originalIndex) && battle.teamIndices[battle.selectingSlot] !== item.originalIndex
      return !isAlreadyInTeam && pokedexIds.indexOf(String(item.pokemon.id)) !== -1
    })
    .sort((a, b) => {
      let pA = a.pokemon
      let pB = b.pokemon
      if (battle.battleSortBy === 'level-desc') return pB.level - pA.level
      if (battle.battleSortBy === 'level-asc') return pA.level - pB.level
      return 0
    })
}

// === BẮT ĐẦU TRẬN THÁP ===
// fresh = true (tầng 1 run mới): hồi đầy team + reset rương/tầng run.
// fresh = false (tầng kế tiếp / tiếp tục): GIỮ NGUYÊN HP/MP/triệu chứng (roguelike).
export function startTowerBattle(floor, fresh = true) {
  if (!floor || floor < 1) return false

  if (fresh) {
    battle.towerPot = { gold: 0, gems: 0, candy: 0 }
    battle.towerRunFloor = 0
    healBattleTeam()
  }

  battle.isBattling = true
  battle.mode = 'tower'
  battle.towerFloor = floor
  battle.towerBossFloor = isTowerBossFloor(floor)
  battle.waveIdx = 0
  battle.currentEnemies = getTowerFloorConfig(floor).map(createTowerEnemy)
  battle.rewards = { gems: 0, exp: 0, gold: 0, candy: 0 }
  battle.battleTitle = battle.towerBossFloor ? `👑 THÁP VÔ TẬN — BOSS TẦNG ${floor}` : `🗼 Tháp Vô Tận — Tầng ${floor}`
  battle.skillQueue = []
  clearBattleLog()
  clearFx()

  if (!switchToNextAlivePokemon()) {
    showToast('Không còn Pokémon nào sống sót để leo tiếp!', 'error')
    return false
  }

  loadTowerWave(0)
  return true
}

// Tiếp tục sang tầng kế tiếp (không hồi máu)
export function continueTower() {
  let next = battle.towerFloor + 1
  battle.resultOpen = false
  return startTowerBattle(next, false)
}

// Rút lui: nhận toàn bộ rương thưởng về kho, kết thúc run
export function quitTower() {
  store.gold += battle.towerPot.gold
  store.gems += battle.towerPot.gems
  store.inventory.candy = (store.inventory.candy || 0) + battle.towerPot.candy
  battle.towerPot = { gold: 0, gems: 0, candy: 0 }
  battle.towerRunFloor = 0
  battle.resultOpen = false
  saveGameState()
}

export function loadTowerWave(waveIdx, forcedOwner = null) {
  battle.enemyPoke = battle.currentEnemies[waveIdx]
  battle.isProcessingTurn = false
  battle.waveIndicator = `Tầng ${battle.towerFloor} — Đối thủ ${waveIdx + 1}/${battle.currentEnemies.length}`

  const e = battle.enemyPoke
  const badge = e.boss ? ' 👑 BOSS' : e.elite ? ' ✨ ELITE' : ''
  battleLog(`⚔️ [Tầng ${battle.towerFloor}] Bắt đầu! <b>${store.team[battle.activePokeIdx].name}</b> VS <b>${e.name}${badge} ${ENEMY_TAG}</b>`)
  checkStartBattlePassives()
  towerDetermineFirstTurn(forcedOwner)
}

export function checkStartBattlePassives() {
  let playerPoke = store.team[battle.activePokeIdx]
  if (playerPoke) applyStartBattlePassive(playerPoke)
  if (battle.enemyPoke) applyStartBattlePassive(battle.enemyPoke)
}

// === HIỆU ỨNG ĐẦU LƯỢT (THÁP: PASSIVE + CHOÁNG + GIẢM THỜI LƯỢNG BUFF/DEBUFF) ===
function towerProcessStartOfTurnEffects(poke) {
  let isPlayer = poke === store.team[battle.activePokeIdx]
  let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} ${ENEMY_TAG}</b>`

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

// === SÁT THƯƠNG ĐỐT CUỐI LƯỢT (THÁP: DOT THEO % ATK NGUỒN GÂY RA) ===
// Pokémon bị dính hiệu ứng đốt chịu sát thương vào CUỐI lượt của chính nó (chuẩn Pokémon).
function towerProcessEndOfTurnDot(poke) {
  let isPlayer = poke === store.team[battle.activePokeIdx]
  let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} ${ENEMY_TAG}</b>`

  const dotEffectTypes = ['burn', 'shock', 'poison', 'bleed']

  for (let i = poke.effects.length - 1; i >= 0; i--) {
    let eff = poke.effects[i]

    if (dotEffectTypes.includes(eff.type)) {
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
      if (!promptTowerFaintSwitch()) return true
      return true
    }
    handleTowerEnemyDefeated()
    return true
  }
  return false
}

// === XÁC ĐỊNH NGƯỜI ĐI TRƯỚC KHI VỪA XUẤT TRẬN (THEO TỐC ĐỘ) ===
export function towerDetermineFirstTurn(forcedOwner = null) {
  battle.extraTurnOwner = null
  let p = store.team[battle.activePokeIdx]
  if (!p || p.hp <= 0 || battle.enemyPoke.hp <= 0) return

  let pExtra = consumeExtraTurnOnEntry(p)
  let eExtra = consumeExtraTurnOnEntry(battle.enemyPoke)

  if (pExtra && !eExtra) {
    battle.extraTurnOwner = 'player'
    battle.currentTurnOwner = 'player'
    battleLog(`⚡ <b>${p.name}</b> bứt tốc — nhận thêm 1 lượt đánh khi vừa ra trận!`)
    towerStartNextTurn()
    return
  }
  if (eExtra && !pExtra) {
    battle.extraTurnOwner = 'bot'
    battle.currentTurnOwner = 'bot'
    battleLog(`⚡ <b>${battle.enemyPoke.name} ${ENEMY_TAG}</b> bứt tốc — nhận thêm 1 lượt đánh khi vừa ra trận!`)
    towerStartNextTurn()
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
    battle.currentTurnOwner === 'player' ? `<b>${p.name}</b>` : `<b>${battle.enemyPoke.name} ${ENEMY_TAG}</b>`
  if (!forcedOwner && getEffectiveSpeed(p) === getEffectiveSpeed(battle.enemyPoke)) {
    battleLog(`🎲 Tốc độ ngang bằng — chọn ngẫu nhiên: ${firstName} đi trước!`)
  } else if (!forcedOwner) {
    battleLog(`⚡ ${firstName} đi trước nhờ Tốc Độ!`)
  }

  towerStartNextTurn()
}

// Chuyển lượt theo cơ chế đánh theo lượt bình thường (xen kẽ)
function towerStartNextTurn() {
  let p = store.team[battle.activePokeIdx]
  if (!p || p.hp <= 0 || battle.enemyPoke.hp <= 0) return

  if (battle.currentTurnOwner === 'player') {
    let res = towerProcessStartOfTurnEffects(p)
    if (res === 'stunned') {
      // Mất lượt nhưng vẫn chịu sát thương đốt cuối lượt
      if (towerProcessEndOfTurnDot(p)) return
      battle.currentTurnOwner = 'bot'
      battle.isProcessingTurn = false
      towerStartNextTurn()
      return
    }
    if (res) return
    if (p.hp <= 0) return
    battleLog(`⚡ Lượt của <b>${p.name}</b>!`)
  } else {
    let res = towerProcessStartOfTurnEffects(battle.enemyPoke)
    if (res === 'stunned') {
      // Mất lượt nhưng vẫn chịu sát thương đốt cuối lượt
      if (towerProcessEndOfTurnDot(battle.enemyPoke)) return
      battle.currentTurnOwner = 'player'
      battle.isProcessingTurn = false
      towerStartNextTurn()
      return
    }
    if (res) return
    if (battle.enemyPoke.hp <= 0) return
    battleLog(`🤖 Lượt của <b>${battle.enemyPoke.name} ${ENEMY_TAG}</b>!`)
    towerExecuteBotTurn()
  }
}

function towerExecuteBotTurn() {
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
      handleTowerEnemyDefeated()
      battle.isProcessingTurn = false
      return
    }

    // CUỐI lượt của địch: sát thương đốt trên chính địch
    if (towerProcessEndOfTurnDot(battle.enemyPoke)) {
      battle.isProcessingTurn = false
      return
    }
    await awaitFxIdle()

    if (p.hp <= 0) {
      battleLog(`💀 <b>${p.name}</b> đã gục ngã!`)
      if (!promptTowerFaintSwitch()) {
        battle.isProcessingTurn = false
        return
      }
      battle.isProcessingTurn = false
      return
    }

    battle.isProcessingTurn = false

    if (battle.extraTurnOwner === 'bot') {
      battle.extraTurnOwner = null
      battle.currentTurnOwner = 'player'
      towerStartNextTurn()
      return
    }

    battle.currentTurnOwner = 'player'
    towerStartNextTurn()
  }, 800)
}

export async function useTowerSkill(skillIdx) {
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
    handleTowerEnemyDefeated()
    battle.isProcessingTurn = false
    return
  }

  // CUỐI lượt của người chơi: sát thương đốt trên chính Pokémon đang xuất trận
  battle.isProcessingTurn = false
  if (towerProcessEndOfTurnDot(p)) return
  await awaitFxIdle()

  if (battle.extraTurnOwner === 'player') {
    battle.extraTurnOwner = null
    battle.currentTurnOwner = 'bot'
    towerStartNextTurn()
    return
  }

  battle.currentTurnOwner = 'bot'
  towerStartNextTurn()
}

// Đổi Pokémon trong trận (tháp)
export function performTowerInBattleSwitch(targetIdx) {
  let oldPoke = store.team[battle.activePokeIdx]
  battle.activePokeIdx = targetIdx
  let newPoke = store.team[battle.activePokeIdx]

  battleLog(`🔄 Thu hồi <b>${oldPoke.name}</b>, tung <b>${newPoke.name}</b> ra sân!`)

  applyStartBattlePassive(newPoke)
  towerDetermineFirstTurn()
}

// === XỬ LÝ HẠ GỤC — CHO CHỌN POKÉMON THAY THẾ (THÁP) ===

// Khi Pokémon người chơi gục, mở modal cho phép chọn con thay thế
export function promptTowerFaintSwitch() {
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
  battleLog(`💀 Toàn bộ đội hình đã gục ngã! Run tháp kết thúc.`)
  battle.isProcessingTurn = false
  showTowerResult(false)
  return false
}

// Xác nhận chọn Pokémon thay thế sau khi con trước đó gục
export function confirmTowerFaintSwitch(targetIdx) {
  battle.awaitingFaintSwitch = false
  let oldPoke = store.team[battle.activePokeIdx]
  battle.activePokeIdx = targetIdx
  let newPoke = store.team[targetIdx]

  battleLog(`🔄 <b>${oldPoke.name}</b> đã gục, tung <b>${newPoke.name}</b> ra sân!`)
  applyStartBattlePassive(newPoke)
  towerDetermineFirstTurn('player')
}

// === XỬ LÝ HẠ GỤC ĐỐI THỦ / XONG TẦNG ===
function handleTowerEnemyDefeated() {
  let earnedExp = 30 + battle.enemyPoke.level * 10
  battle.rewards.exp += earnedExp

  battleLog(`🏆 Hạ gục ${battle.enemyPoke.name}! Nhận +${earnedExp} EXP`)

  battle.teamIndices.forEach((idx) => {
    if (idx !== null && store.team[idx]) gainExp(store.team[idx], earnedExp)
  })

  battle.waveIdx++
  if (battle.waveIdx < battle.currentEnemies.length) {
    battleLog(`➡️ Đối thủ tiếp theo trên tầng ${battle.towerFloor}...`)
    setTimeout(() => loadTowerWave(battle.waveIdx, 'bot'), 1200)
  } else {
    handleTowerFloorCleared()
  }
}

// Thắng tầng: cộng thưởng ngẫu nhiên vào rương (tầng càng cao càng nhiều)
export function handleTowerFloorCleared() {
  let floor = battle.towerFloor
  let isBoss = battle.towerBossFloor

  let gold = Math.round((40 + floor * 25) * (0.8 + Math.random() * 0.4))
  let gems = Math.round((3 + floor * 2) * (0.8 + Math.random() * 0.4))
  let candy = Math.random() < Math.min(0.5, 0.1 + floor * 0.01) ? 1 : 0

  // Tầng có địch ELITE: vàng +50%
  if (battle.currentEnemies.some((e) => e.elite)) {
    gold = Math.round(gold * 1.5)
    battleLog(`✨ Tầng xuất hiện địch <b>ELITE</b> — thưởng Vàng +50%!`)
  }

  // Tầng BOSS: rương x3 + Kẹo chắc chắn
  if (isBoss) {
    gold = Math.round(gold * 3)
    gems = Math.round(gems * 3)
    candy = 2
    battleLog(`👑 <b>BOSS TẦNG ${floor} bị hạ gục!</b> Rương thưởng x3 + ${candy} Kẹo chắc chắn!`)
  }

  battle.towerPot.gold += gold
  battle.towerPot.gems += gems
  battle.towerPot.candy += candy
  battleLog(`💰 Rương thưởng: +${gold} 🪙, +${gems} 💎${candy ? `, +${candy} 🍬` : ''}!`)

  // Mốc 5 tầng: hồi 20% HP tối đa cho đội hình CÒN SỐNG (Pokémon đã gục KHÔNG hồi sinh)
  if (floor % HEAL_MILESTONE === 0) {
    battle.teamIndices.forEach((idx) => {
      if (idx !== null && store.team[idx]) {
        let p = store.team[idx]
        if (p.hp <= 0) return
        p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * HEAL_MILESTONE_PCT))
      }
    })
    battleLog(`💚 MỐC TẦNG ${floor}! Pokémon còn sống hồi +${Math.round(HEAL_MILESTONE_PCT * 100)}% HP tối đa!`)
  }

  battle.towerRunFloor = Math.max(battle.towerRunFloor, floor)
  if ((store.towerBestFloor || 0) < floor) {
    store.towerBestFloor = floor
    battleLog(`🏅 KỶ LỤC MỚI! Tầng cao nhất: ${floor}`)
  }

  showTowerResult(true)
}

export function showTowerResult(win) {
  applyPendingLevelUps()
  if (win) {
    addQuestProgress('wins', 1)
  } else {
    // Thua: mất toàn bộ rương, kết thúc run (kỷ lục tầng cao nhất vẫn giữ)
    battle.towerPot = { gold: 0, gems: 0, candy: 0 }
    battle.towerRunFloor = 0
    battleLog(`💀 Rương thưởng đã bị mất hết! Run kết thúc.`)
  }
  battle.resultOpen = true
  battle.resultWin = win
  saveGameState()
}
