// ==========================================
// BATTLE ENGINE CHUNG (TÁCH UI - GIỮ NGUYÊN CÔNG THỨC)
// Dùng chung cho Chiến dịch (campaign) & Phòng Gym (gym)
// ==========================================

import { reactive } from 'vue'
import { store, saveGameState } from './store.js'
import { TYPE_CHART, rollStunConfig } from './data.js'
import { getAllPassiveSkills } from './skills.js'
import { recalculatePokemonStats, recalculateSkillValues } from './stats.js'
import { generateSkillInstance } from './gacha.js'
import { getSkillGroupsForLevel } from './shop.js'

export const battle = reactive({
  isBattling: false,
  mode: null, // 'campaign' | 'gym' | 'story' | 'tower' | 'wild'
  activePokeIdx: null,
  teamIndices: [null, null, null],
  wildPoke: null,
  enemyPoke: null,
  enemyTeam: [],
  gymActiveEnemyIdx: 0,
  currentTurnOwner: 'player',
  extraTurnOwner: null,
  isProcessingTurn: false,
  selectingSlot: null,
  battleSortBy: 'level-desc',
  waveIdx: 0,
  campaignId: null,
  storySceneId: null,
  towerFloor: null,
  towerRunFloor: 0,
  towerPot: { gold: 0, gems: 0, candy: 0 },
  towerBossFloor: false,
  currentEnemies: [],
  gymType: null,
  rewards: { gems: 0, exp: 0, gold: 0, candy: 0 },
  log: [],
  skillQueue: [],
  pendingLevelUps: [],
  resultOpen: false,
  resultWin: false,
  battleTitle: '',
  waveIndicator: '',
  fxQueue: [],
  fxEnabled: true,
})

// --- NHẬT KÝ CHIẾN ĐẤU ---
export function battleLog(msg) {
  battle.log.push(msg)
  if (battle.log.length > 80) battle.log.shift()
}

export function clearBattleLog() {
  battle.log = []
}

// ==========================================
// HÀNG ĐỢI HIỆU ỨNG (ANIMATION) — UI ĐỌC & CHƠI TUẦN TỰ
// Sự kiện kèm SNAPSHOT số liệu (không đọc lại state để tránh lệch khi
// Pokémon bị thay thế giữa chừng — ví dụ Gym đổi đối thủ, wave mới).
// ==========================================
let fxSeq = 0

export function pushFx(event) {
  if (!battle.fxQueue) battle.fxQueue = []
  battle.fxQueue.push({ id: ++fxSeq, ...event })
}

export function clearFx() {
  if (battle.fxQueue) battle.fxQueue.length = 0
}

// Chờ hàng đợi FX xả hết để logic không vượt qua animation đang phát
// An toàn: giới hạn tối đa 3s để tránh kẹt lượt nếu hàng đợi không được xả.
export function awaitFxIdle(maxMs = 3000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      if (!battle.fxQueue || battle.fxQueue.length === 0 || Date.now() - start >= maxMs) resolve()
      else setTimeout(check, 60)
    }
    check()
  })
}

// Xác định phe của 1 Pokémon: player = đang thuộc đội HLV, còn lại = bot
export function fxSide(poke) {
  if (!poke) return 'bot'
  if (poke === battle.enemyPoke) return 'bot'
  let idx = store.team.indexOf(poke)
  if (idx !== -1 && battle.teamIndices.includes(idx)) return 'player'
  if (poke === store.team[battle.activePokeIdx]) return 'player'
  return 'bot'
}

// % HP hiện tại so với tối đa (0-100)
export function getHpPct(poke) {
  if (!poke || !poke.maxHp) return 0
  return Math.max(0, Math.round((Math.max(0, poke.hp) / poke.maxHp) * 100))
}

// Pokémon người chơi đang xuất trận
export function getActivePlayerPoke() {
  if (battle.activePokeIdx === null || battle.activePokeIdx === undefined) return null
  return store.team[battle.activePokeIdx] || null
}

// ==========================================
// CHỈ SỐ HIỆU QUẢ (BUFF/DEBUFF)
// ==========================================

export function getEffectiveAtk(poke) {
  let mult = 1.0
  if (poke.effects) {
    poke.effects.forEach((e) => {
      if (e.type === 'debuff_atk') mult -= e.val / 100
      if (e.type === 'buff_atk') mult += e.val / 100
    })
  }
  return Math.max(1, Math.round(poke.atk * Math.max(0.1, mult)))
}

export function getEffectiveDef(poke) {
  let mult = 1.0
  if (poke.effects) {
    poke.effects.forEach((e) => {
      if (e.type === 'debuff_def') mult -= e.val / 100
      if (e.type === 'buff_def') mult += e.val / 100
    })
  }
  return Math.max(0, Math.round(poke.def * Math.max(0.1, mult)))
}

export function getEffectiveSpeed(poke) {
  let speedMult = 1.0
  if (poke.effects) {
    poke.effects.forEach((e) => {
      if (e.type === 'slow') speedMult -= e.val / 100
      if (e.type === 'buff_speed') speedMult += e.val / 100
    })
  }
  return Math.max(10, Math.round(poke.speed * Math.max(0.2, speedMult)))
}

// Kiểm tra & tiêu thụ trạng thái choáng (stun): khi bị choáng sẽ mất 1 lượt
export function isStunned(poke) {
  if (!poke.effects) return false
  for (let i = poke.effects.length - 1; i >= 0; i--) {
    if (poke.effects[i].type === 'stun') {
      poke.effects[i].duration--
      if (poke.effects[i].duration <= 0) {
        battleLog(`✨ Hiệu ứng [${poke.effects[i].name}] trên ${poke.name} đã hết hạn.`)
        poke.effects.splice(i, 1)
      }
      pushFx({ type: 'stunned', side: fxSide(poke) })
      return true
    }
  }
  return false
}

// Kiểm tra & tiêu thụ buff tăng tốc khi Pokémon vừa ra trận: +1 lượt đánh
export function consumeExtraTurnOnEntry(poke) {
  if (!poke.effects) return false
  for (let i = poke.effects.length - 1; i >= 0; i--) {
    if (poke.effects[i].type === 'extra_turn') {
      poke.effects[i].duration--
      if (poke.effects[i].duration <= 0) {
        battleLog(`✨ Hiệu ứng [${poke.effects[i].name}] trên ${poke.name} đã hết hạn.`)
        poke.effects.splice(i, 1)
      }
      return true
    }
  }
  return false
}

// ==========================================
// NỘI TẠI (PASSIVE) KÍCH HOẠT
// ==========================================

export function applyStartBattlePassive(poke) {
  let allSkills = getAllPassiveSkills(poke)
  allSkills.forEach((skill) => {
    if (skill && skill.trigger === 'start_battle') {
      if (skill.type === 'mp_buff') {
        poke.mp = Math.min(poke.maxMp || 100, poke.mp + skill.value)
        battleLog(`⭐ [${skill.name}] của ${poke.name} kích hoạt! Nhận thêm +${skill.value} MP ban đầu.`)
      } else if (skill.type === 'speed_buff') {
        // Buff tăng tốc → nhận thêm 1 lượt đánh khi vừa ra trận (thay vì +SPD)
        if (!poke.effects) poke.effects = []
        let hasExtra = poke.effects.some((e) => e.type === 'extra_turn')
        if (!hasExtra) {
          poke.effects.push({
            type: 'extra_turn',
            duration: 1,
            val: 0,
            name: `${skill.name}: +1 Lượt Đánh`,
          })
          battleLog(`⭐ [${skill.name}] của ${poke.name} kích hoạt! Tăng tốc — nhận thêm 1 lượt đánh khi vừa ra trận.`)
        }
      }
    }
  })
}

export function applyStartTurnPassive(poke) {
  if (poke.hp <= 0) return
  let allSkills = getAllPassiveSkills(poke)
  allSkills.forEach((skill) => {
    if (skill && skill.trigger === 'start_turn') {
      if (skill.type === 'heal_self') {
        let healAmt = Math.round(poke.maxHp * skill.value)
        poke.hp = Math.min(poke.maxHp, poke.hp + healAmt)
        battleLog(`⭐ [${skill.name}] của ${poke.name} kích hoạt! Tự hồi phục +${healAmt} HP.`)
        pushFx({ type: 'heal', side: fxSide(poke), amount: healAmt, hpPct: getHpPct(poke) })
      } else if (skill.type === 'cleanse_cc') {
        let cleaned = false
        if (poke.effects) {
          for (let i = poke.effects.length - 1; i >= 0; i--) {
            if (poke.effects[i].type === 'stun') {
              poke.effects.splice(i, 1)
              cleaned = true
            }
          }
        }
        if (cleaned) {
          battleLog(`⭐ [${skill.name}] của ${poke.name} kích hoạt! Hóa giải hiệu ứng khống chế (choáng).`)
        }
      }
    }
  })
}

export function checkTakeDamagePassives(target, dmg, attacker) {
  if (!target || target.hp <= 0) return
  let allSkills = getAllPassiveSkills(target)

  allSkills.forEach((skill) => {
    if (!skill) return

    // 1. Phản sát thương
    if (skill.trigger === 'take_damage' && skill.type === 'reflect_damage' && dmg > 0) {
      let reflectDmg = Math.round(dmg * skill.value)
      attacker.hp = Math.max(0, attacker.hp - reflectDmg)
      battleLog(`⭐ [${skill.name}] của ${target.name} phản lại ${reflectDmg} sát thương lên ${attacker.name}!`)
      pushFx({ type: 'reflect', side: fxSide(attacker), dmg: reflectDmg, hpPct: getHpPct(attacker) })
    }

    // 2. Buff công khi HP dưới 50%
    if (skill.trigger === 'hp_below_50' && target.hp < target.maxHp * 0.5) {
      if (skill.type === 'atk_buff') {
        if (!target.effects) target.effects = []
        let buffName = `${skill.name}: +${Math.round(skill.value * 100)}% ATK`
        let alreadyHas = target.effects.some((e) => e.name === buffName)
        if (!alreadyHas) {
          target.effects.push({
            type: 'buff_atk',
            duration: 3,
            val: Math.round(skill.value * 100),
            name: buffName,
          })
          battleLog(`⭐ [${skill.name}] của ${target.name} kích hoạt! Tăng ${Math.round(skill.value * 100)}% ATK khi dưới 50% HP (3 lượt).`)
        }
      }
    }
  })
}

// ==========================================
// QUẢN LÝ HIỆU ỨNG (STATUS EFFECTS)
// ==========================================

/**
 * Áp dụng hiệu ứng trạng thái lên target
 * @param {object} target - Pokémon bị ảnh hưởng
 * @param {object} effectObj - Đối tượng hiệu ứng {type, duration, val, name}
 * @param {object} source - Pokémon gây ra hiệu ứng (dùng để tính DoT dựa trên sát thương của source)
 */
export function applyStatusEffect(target, effectObj, source = null) {
  if (!effectObj) return
  
  // Tạo bản sao của effectObj để không mutate original
  let newEffect = JSON.parse(JSON.stringify(effectObj))

  // Cơ chế mới: debuff tốc độ → choáng, buff tốc độ → +1 lượt đánh (chuẩn hóa tên hiển thị)
  if (newEffect.type === 'stun') {
    // Tỷ lệ % & số lượt đã CỐ ĐỊNH ngay khi skill được gắn (applyStunConfig). Chỉ roll lại cho save cũ.
    let chance = newEffect.chance
    if (chance === undefined) {
      let rolled = rollStunConfig(newEffect.skillRarity || 'Common')
      chance = rolled.chance
      newEffect.duration = rolled.duration
    }
    newEffect.chance = chance
    newEffect.name = `Choáng (${chance}%)`
    if (Math.random() * 100 >= chance) {
      battleLog(`🛡️ ${target.name} kháng lại hiệu ứng Choáng (${chance}%)!`)
      pushFx({ type: 'status', side: fxSide(target), name: 'Choáng', effectType: 'stun', resisted: true })
      return
    }
  }
  if (newEffect.type === 'extra_turn') newEffect.name = 'Tăng Tốc (+1 Lượt Đánh)'
  
  // Nếu là DoT (burn, shock, poison, bleed) và có source, lưu damage của source để tính DoT
  const dotTypes = ['burn', 'shock', 'poison', 'bleed']
  if (dotTypes.includes(newEffect.type) && source) {
    // Lưu baseDamage của source (dùng getEffectiveAtk + skill power nếu có)
    // Đơn giản: dùng effective ATK của source làm base damage cho DoT
    newEffect.sourceAtk = getEffectiveAtk(source)
    newEffect.sourceName = source.name
  }
  
  let existing = target.effects.find((e) => e.type === newEffect.type)
  if (existing) {
    existing.duration = newEffect.duration
    existing.val = newEffect.val
    // Cập nhật sourceAtk nếu có source mới mạnh hơn
    if (newEffect.sourceAtk && (!existing.sourceAtk || newEffect.sourceAtk > existing.sourceAtk)) {
      existing.sourceAtk = newEffect.sourceAtk
      existing.sourceName = newEffect.sourceName
    }
  } else {
    target.effects.push(newEffect)
  }
  battleLog(`✨ ${target.name} dính hiệu ứng: [${newEffect.name}] (${newEffect.duration} lượt)!`)
  pushFx({
    type: 'status',
    side: fxSide(target),
    name: newEffect.name,
    effectType: newEffect.type,
    resisted: false,
  })
}

/**
 * Tính toán sát thương DoT dựa trên ATK của nguồn gây ra hiệu ứng
 * @param {object} target - Pokémon bị DoT
 * @param {object} effect - Hiệu ứng DoT
 * @returns {number} - Sát thương DoT
 */
export function calculateDotDamage(target, effect) {
  // DoT = sourceAtk * (val / 100) 
  // val là % (ví dụ 15 = 15%)
  if (effect.sourceAtk) {
    return Math.max(1, Math.round(effect.sourceAtk * (effect.val / 100)))
  }
  // Fallback: nếu không có sourceAtk, dùng % máu hiện tại (logic cũ)
  return Math.max(1, Math.round(target.hp * (effect.val / 100)))
}

// ==========================================
// THỰC THI KỸ NĂNG (GIỮ NGUYÊN CÔNG THỨC LEGACY)
// ==========================================

export function executeSkillAction(caster, target, skill, isPlayer) {
  caster.mp -= skill.cost
  if (skill.mpGain) caster.mp = Math.min(100, caster.mp + skill.mpGain)
  skill.currentCd = skill.cd + 1

  // Skill cũ (save cũ) thiếu tỷ lệ stun cố định → roll 1 lần và gắn vĩnh viễn cho skill đó
  if (skill.effect && skill.effect.type === 'stun' && skill.effect.chance === undefined) {
    let rolled = rollStunConfig(skill.rarity)
    skill.effect.skillRarity = skill.rarity || 'Common'
    skill.effect.chance = rolled.chance
    skill.effect.duration = rolled.duration
  }

  let prefix = isPlayer ? `🥊 <b>${caster.name}</b>` : `🤖 <b>${caster.name} (Bot)</b>`

  if (skill.category === 'damage') {
    let mult = TYPE_CHART[caster.type] && TYPE_CHART[caster.type][target.type] ? TYPE_CHART[caster.type][target.type] : 1.0
    let isCrit = Math.random() < 0.15
    let critMult = isCrit ? 1.5 : 1.0

    let baseDmg = getEffectiveAtk(caster) + (skill.power || 0)
    let targetDef = getEffectiveDef(target)
    let defReduction = 100 / (100 + targetDef)
    let rawDmg = Math.round(baseDmg * defReduction * mult * critMult * (0.9 + Math.random() * 0.2))
    rawDmg = Math.max(1, rawDmg)

    let actualDmgToTarget = rawDmg
    if (target.shield > 0) {
      if (target.shield >= actualDmgToTarget) {
        target.shield -= actualDmgToTarget
        actualDmgToTarget = 0
      } else {
        actualDmgToTarget -= target.shield
        target.shield = 0
      }
    }
    target.hp = Math.max(0, target.hp - actualDmgToTarget)

    pushFx({
      type: 'attack',
      side: fxSide(target),
      casterSide: fxSide(caster),
      casterType: caster.type,
      category: 'damage',
      dmg: actualDmgToTarget,
      rawDmg,
      crit: isCrit,
      mult,
      shield: Math.max(0, rawDmg - actualDmgToTarget),
      hpPct: getHpPct(target),
      ko: target.hp <= 0,
    })

    let critText = isCrit ? '🔥 <b>BÁO KÍCH!</b> ' : ''
    let typeText = mult > 1 ? ' (Xung khắc!)' : mult < 1 ? ' (Kháng...)' : ''
    battleLog(`${critText}${prefix} dùng [${skill.name}] gây <b>${rawDmg}</b> sát thương${typeText}!`)

    checkTakeDamagePassives(target, actualDmgToTarget, caster)
    // Truyền caster làm source để tính DoT dựa trên ATK của caster
    if (skill.effect) applyStatusEffect(target, skill.effect, caster)

    let thornEff = target.effects.find((e) => e.type === 'thorn')
    if (thornEff && rawDmg > 0) {
      let reflectDmg = Math.round(rawDmg * (thornEff.val / 100))
      caster.hp = Math.max(0, caster.hp - reflectDmg)
      battleLog(`🌵 [Giáp Gai] của ${target.name} phản lại ${reflectDmg} sát thương lên ${caster.name}!`)
    }
  } else if (skill.category === 'shield') {
    caster.shield += skill.shield || 0
    battleLog(`🛡️ ${prefix} dùng [${skill.name}] nhận <b>+${skill.shield || 0} Khiên</b>!`)
    pushFx({ type: 'shield', side: fxSide(caster), amount: skill.shield || 0 })
    if (skill.effect) applyStatusEffect(caster, skill.effect, caster)
  } else if (skill.category === 'heal') {
    let healAmount = skill.heal || 0
    caster.hp = Math.min(caster.maxHp, caster.hp + healAmount)
    battleLog(`💚 ${prefix} dùng [${skill.name}] hồi <b>+${healAmount} HP</b>!`)
    pushFx({ type: 'heal', side: fxSide(caster), amount: healAmount, hpPct: getHpPct(caster) })
  } else if (skill.category === 'true_damage') {
    let isCrit = Math.random() < 0.15
    let critMult = isCrit ? 1.5 : 1.0
    let rawDmg = Math.round((getEffectiveAtk(caster) + (skill.power || 0)) * critMult * (0.9 + Math.random() * 0.2))
    rawDmg = Math.max(1, rawDmg)
    target.hp = Math.max(0, target.hp - rawDmg)
    battleLog(`${prefix} dùng [${skill.name}] gây ${rawDmg} SÁT THƯƠNG CHUẨN (Bỏ qua DEF)!`)
    pushFx({
      type: 'attack',
      side: fxSide(target),
      casterSide: fxSide(caster),
      casterType: caster.type,
      category: 'true_damage',
      dmg: rawDmg,
      rawDmg,
      crit: isCrit,
      mult: 1,
      shield: 0,
      hpPct: getHpPct(target),
      ko: target.hp <= 0,
    })
    checkTakeDamagePassives(target, rawDmg, caster)
    if (skill.effect) applyStatusEffect(target, skill.effect, caster)
  }
}

// ==========================================
// EXP & LEVEL UP POKÉMON (KÈM HÀNG ĐỢI CHỌN KỸ NĂNG)
// ==========================================

export function gainExp(p, amount) {
  p.exp += amount

  let trainerLevel = (store.gameState && store.gameState.player && store.gameState.player.level) || 1

  if (p.level >= trainerLevel) {
    p.exp = Math.min(p.exp, p.maxExp)
    battleLog(`✨ ${p.name} nhận +${amount} EXP!`)
    battleLog(`🔒 ${p.name} đã đạt cấp trần Lv.${p.level} (bằng cấp Huấn luyện viên) - không thể lên cấp thêm.`)
    return
  }

  battleLog(`✨ ${p.name} nhận +${amount} EXP!`)

  while (p.exp >= p.maxExp && p.level < trainerLevel) {
    p.level++
    p.exp -= p.maxExp
    p.maxExp = Math.round(p.level * 50 + Math.pow(p.level, 1.5) * 10)

    if (!battle.pendingLevelUps.some((item) => item.poke === p)) {
      battle.pendingLevelUps.push({ poke: p, levels: [] })
    }
    battle.pendingLevelUps.find((item) => item.poke === p).levels.push(p.level)

    battleLog(`🎉 <b>${p.name} LÊN CẤP ${p.level}!</b> (Chỉ số và kỹ năng sẽ cập nhật sau trận!)`)
  }

  if (p.level >= trainerLevel && p.exp > p.maxExp) {
    p.exp = p.maxExp
  }
}

export function applyPendingLevelUps() {
  if (!battle.pendingLevelUps.length) return

  battle.pendingLevelUps.forEach(({ poke, levels }) => {
    recalculatePokemonStats(poke, store.gymBuffs)
    poke.skills.forEach((skill) => recalculateSkillValues(skill, poke.level))

    levels.forEach((level) => {
      if (level % 5 !== 0) return
      let skillGroups = getSkillGroupsForLevel(level)
      if (skillGroups) {
        battle.skillQueue.push({
          poke,
          skillGroups,
          level,
          title: `🔥 THĂNG CẤP LEVEL ${level}: CHỌN HỌC KỸ NĂNG MỚI`,
        })
      }
    })
  })

  battle.pendingLevelUps = []
}

export function shiftSkillQueue() {
  battle.skillQueue.shift()
}

// ==========================================
// DỤNG CỤ CHUNG
// ==========================================

// Hồi phục toàn bộ đội hình trước trận
export function healBattleTeam() {
  battle.teamIndices.forEach((idx) => {
    if (idx !== null && store.team[idx]) {
      let p = store.team[idx]
      p.hp = p.maxHp
      p.shield = 0
      p.mp = p.initMp
      p.effects = []
      if (p.skills) p.skills.forEach((s) => (s.currentCd = 0))
    }
  })
}

// Đưa Pokémon còn sống tiếp theo ra sân (trả false khi toàn đội gục)
export function switchToNextAlivePokemon() {
  for (let i = 0; i < 3; i++) {
    let idx = battle.teamIndices[i]
    if (idx !== null && store.team[idx] && store.team[idx].hp > 0) {
      battle.activePokeIdx = idx
      battleLog(`🔄 <b>${store.team[idx].name}</b> được tung vào sân!`)
      applyStartBattlePassive(store.team[idx])
      return true
    }
  }
  return false
}

// Kiểm tra lượt đi của player (dùng chung cho campaign/gym)
export function canUseSkill() {
  return battle.currentTurnOwner === 'player' && !battle.isProcessingTurn
}

// Hồi chiêu cuối lượt cho phía đã ra đòn
export function tickSkillCooldowns(poke) {
  poke.skills.forEach((s) => {
    if (s.currentCd > 0) s.currentCd--
  })
}

export function showBattleResult(win, onSaveCb) {
  applyPendingLevelUps()
  battle.resultOpen = true
  battle.resultWin = win
  saveGameState()
}

// Danh sách Pokémon còn sống khác để đổi trong trận
export function getInBattleSwitchOptions() {
  let list = []
  for (let i = 0; i < 3; i++) {
    let idx = battle.teamIndices[i]
    if (idx !== null && store.team[idx] && idx !== battle.activePokeIdx) {
      let poke = store.team[idx]
      if (poke.hp > 0) {
        list.push({
          idx,
          name: poke.name,
          level: poke.level,
          rarity: poke.rarity,
          hp: Math.floor(poke.hp),
          maxHp: poke.maxHp,
          hpPercent: (poke.hp / poke.maxHp) * 100,
        })
      }
    }
  }
  return list
}