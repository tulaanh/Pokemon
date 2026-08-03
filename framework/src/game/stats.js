// ==========================================
// TOÁN CHỈ SỐ & BUFF V-LEVEL (GIỮ NGUYÊN)
// ==========================================

import { POKEMON_SPECIES } from './data.js'
import { getAllPassiveSkills } from './skills.js'

// Bonus chỉ số MỖI BẬC tiến hóa (evolutionCount): cao hơn hẳn so với Pokémon không tiến hóa.
// Pokémon roll thẳng dạng cuối từ Gacha có evolutionCount = 0 nên không nhận bonus.
export const EVOLUTION_STAT_BONUS = { hp: 0.6, atk: 0.6, def: 0.6, spd: 0.3 }

export function getVLevelBuffRatio(vLevel) {
  if (!vLevel || vLevel <= 0) return { hpRatio: 0, atkRatio: 0, defRatio: 0, spdRatio: 0 }
  if (vLevel === 1) return { hpRatio: 0.75, atkRatio: 0.75, defRatio: 0.75, spdRatio: 0.1 }
  if (vLevel === 2) return { hpRatio: 1.1, atkRatio: 1.2, defRatio: 1, spdRatio: 0.2 }
  if (vLevel === 3) return { hpRatio: 1.65, atkRatio: 1.6, defRatio: 1.3, spdRatio: 0.4 }
  if (vLevel === 4) return { hpRatio: 2.1, atkRatio: 2.1, defRatio: 1.6, spdRatio: 0.45 }

  let extra = vLevel - 4
  return {
    hpRatio: 2.1 + extra * 0.3,
    atkRatio: 2.1 + extra * 0.3,
    defRatio: 1.6 + extra * 0.3,
    spdRatio: 0.45 + extra * 0.05,
  }
}

/**
 * Tính lại chỉ số Pokémon. Cần truyền gymBuffs (object hệ -> số %) để áp buff Gym.
 * @param {object} p - Pokémon instance (mutates)
 * @param {object} [gymBuffs] - { Fire: 0.1, ... }
 */
export function recalculatePokemonStats(p, gymBuffs = {}) {
  let species = POKEMON_SPECIES.find((s) => s.name === p.name)
  if (!species) return
  if (!p.iv) p.iv = { hp: 1, atk: 1, def: 1, speed: 1 }

  let hpGrowthRate = p.type === 'Rock' ? 0.09 : 0.075
  let atkGrowthRate = 0.07
  let defGrowthRate = 0.06

  let hpMult = Math.pow(1 + hpGrowthRate, p.level - 1)
  let atkMult = Math.pow(1 + atkGrowthRate, p.level - 1)
  let defMult = Math.pow(1 + defGrowthRate, p.level - 1)

  let rawMaxHp = Math.round(species.baseHp * hpMult * p.rarity.statMult * p.iv.hp)
  let rawAtk = Math.round(species.baseAtk * atkMult * p.rarity.statMult * p.iv.atk)
  let rawDef = Math.round(species.baseDef * defMult * p.rarity.statMult * p.iv.def)

  let speedStep = Math.floor((p.level - 1) / 5)
  let rawSpeed = Math.round(species.baseSpeed * p.rarity.statMult * p.iv.speed) + speedStep

  let mpStep = Math.floor((p.level - 1) / 10)
  p.maxMp = 100 + mpStep * 10
  let bonusBaseMp = mpStep * 5
  let rawInitMp = Math.min(p.maxMp, Math.round((species.baseInitMp + bonusBaseMp) * p.rarity.statMult))

  let vBuff = getVLevelBuffRatio(p.vLevel || 0)
  let oldMaxHp = p.maxHp

  p.maxHp = Math.round(rawMaxHp * (1 + vBuff.hpRatio))
  p.atk = Math.round(rawAtk * (1 + vBuff.atkRatio))
  p.speed = Math.round(rawSpeed * (1 + vBuff.spdRatio))
  p.def = Math.round(rawDef * (1 + vBuff.defRatio))
  p.initMp = rawInitMp

  // Bonus tiến hóa: mỗi bậc tiến hóa nhân thêm chỉ số (cộng dồn theo evolutionCount).
  // Đặt TRƯỚC passive/gym để các hệ số này tiếp tục nhân chồng lên — thưởng cho Pokémon tiến hóa.
  let evoCount = p.evolutionCount || 0
  if (evoCount > 0) {
    p.maxHp = Math.round(p.maxHp * (1 + EVOLUTION_STAT_BONUS.hp * evoCount))
    p.atk = Math.round(p.atk * (1 + EVOLUTION_STAT_BONUS.atk * evoCount))
    p.def = Math.round(p.def * (1 + EVOLUTION_STAT_BONUS.def * evoCount))
    p.speed = Math.round(p.speed * (1 + EVOLUTION_STAT_BONUS.spd * evoCount))
  }

  let allPermSkills = getAllPassiveSkills(p)
  allPermSkills.forEach((skill) => {
    if (skill && skill.trigger === 'perm') {
      let val = skill.value || 0
      if (skill.type === 'perm_hp') p.maxHp = Math.round(p.maxHp * (1 + val))
      else if (skill.type === 'perm_atk') p.atk = Math.round(p.atk * (1 + val))
      else if (skill.type === 'perm_def') p.def = Math.round(p.def * (1 + val))
      else if (skill.type === 'perm_hybrid_atk_hp') {
        p.maxHp = Math.round(p.maxHp * (1 + val))
        p.atk = Math.round(p.atk * (1 + val))
      }
    }
  })

  let gymBuff = gymBuffs[p.type] || 0
  if (gymBuff > 0) {
    p.maxHp = Math.round(p.maxHp * (1 + gymBuff))
    p.atk = Math.round(p.atk * (1 + gymBuff))
    p.def = Math.round(p.def * (1 + gymBuff))
    p.speed = Math.round(p.speed * (1 + gymBuff))
  }

  if (!oldMaxHp) {
    p.hp = p.maxHp
  } else {
    let hpRatio = p.hp / oldMaxHp
    p.hp = Math.round(p.maxHp * hpRatio)
  }
}

export function recalculateSkillValues(skill, level) {
  let levelMult = 1 + (level - 1) * 0.12
  let mult = (skill.rollMult || 1) * levelMult

  if (skill.baseValPower) skill.power = Math.round(skill.baseValPower * mult)
  if (skill.baseValShield) skill.shield = Math.round(skill.baseValShield * mult)
  if (skill.baseValHeal) skill.heal = Math.round(skill.baseValHeal * mult)
}

/** EXP cần thiết để lên cấp người chơi tiếp theo */
export function getPlayerNextLevelExp(level) {
  let lvl = Number(level) || 1
  return 100 + (lvl - 1) * 50
}
