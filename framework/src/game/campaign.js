// ==========================================
// LOGIC CHIẾN DỊCH (TÁCH UI - GIỮ NGUYÊN CÔNG THỨC)
// ==========================================

import { POKEMON_SPECIES, RARITIES } from './data.js'
import { store, saveGameState, addPlayerExp } from './store.js'
import { generateSkillInstance } from './gacha.js'
import { addQuestProgress } from './daily.js'
import { getOnboardingStage, setOnboardingStage, STORY_STAGES } from './story.js'
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
  switchToNextAlivePokemon,
  applyPendingLevelUps,
  tickSkillCooldowns,
  canUseSkill,
  healBattleTeam,
  calculateDotDamage,
  isStunned,
  consumeExtraTurnOnEntry,
  awaitFxIdle,
} from './battle.js'

export const CAMPAIGN_CHAPTERS = [
  {
    id: 1,
    name: 'Chương 1: Vùng Đồng Cỏ',
    description: 'Hành trình đầu tiên — vượt qua 10 cửa ải để hoàn thành chương!',
    icon: '🌱',
  },
  {
    id: 2,
    name: 'Chương 2: Cổ Đại Thức Tỉnh',
    description: 'Những Pokémon cổ đại thức giấc — 10 cửa ải với độ khó tăng dần!',
    icon: '🌋',
  },
]

export const CAMPAIGN_LEVELS = [
  // ============ CHƯƠNG 1: VÙNG ĐỒNG CỎ (CỬA 1-10) ============
  {
    id: 1,
    chapter: 1,
    name: 'Cửa 1: Khởi Đầu Khám Phá',
    description: 'Làm quen với cơ chế chiến đấu cơ bản. Đối thủ là các Pokémon cấp thấp.',
    rewardGems: 100,
    rewardExp: 50,
    enemies: [
      { species: 'Fuecoco', level: 1, rarity: 'Common', statMult: 0.9 },
      { species: 'Mudkip', level: 2, rarity: 'Common', statMult: 0.9 },
    ],
  },
  {
    id: 2,
    chapter: 1,
    name: 'Cửa 2: Rừng Cây Rậm Rạp',
    description: 'Chạm trán hệ Cỏ và Điện. Hãy chú ý đến tốc độ đánh của chúng!',
    rewardGems: 150,
    rewardExp: 100,
    enemies: [
      { species: 'Bulbasaur', level: 3, rarity: 'Common', statMult: 0.95 },
      { species: 'Pikachu', level: 4, rarity: 'Common', statMult: 0.95 },
    ],
  },
  {
    id: 3,
    chapter: 1,
    name: 'Cửa 3: Sườn Núi Đầy Sỏi Đá',
    description: 'Thử thách sát thương của bạn trước lớp giáp dày của hệ Đá.',
    rewardGems: 200,
    rewardExp: 150,
    enemies: [
      { species: 'Lycanroc', level: 5, rarity: 'Rare', statMult: 0.83 },
      { species: 'Aerodactyl', level: 6, rarity: 'Rare', statMult: 0.83 },
    ],
  },
  {
    id: 4,
    chapter: 1,
    name: 'Cửa 4: Xung Đột Băng Hỏa',
    description: 'Đối phó với đội hình có hỏa lực mạnh và sức chịu đòn tốt.',
    rewardGems: 250,
    rewardExp: 200,
    enemies: [
      { species: 'Flareon', level: 7, rarity: 'Rare', statMult: 0.88 },
      { species: 'Vaporeon', level: 8, rarity: 'Rare', statMult: 0.88 },
    ],
  },
  {
    id: 5,
    chapter: 1,
    name: 'Cửa 5: Thử Thách Của Charizard (Mini-Boss)',
    description: 'Băng qua ngọn đồi lửa để chứng minh sức mạnh thực sự!',
    rewardGems: 400,
    rewardExp: 300,
    enemies: [
      { species: 'Raichu', level: 9, rarity: 'Rare', statMult: 0.92 },
      { species: 'Charizard', level: 10, rarity: 'Epic', statMult: 0.73 },
    ],
  },
  {
    id: 6,
    chapter: 1,
    name: 'Cửa 6: Bão Sét Chớp Nhoáng',
    description: 'Tốc độ là chìa khóa. Kẻ địch sẽ ra đòn trước nếu bạn quá chậm!',
    rewardGems: 300,
    rewardExp: 250,
    enemies: [
      { species: 'Jolteon', level: 11, rarity: 'Rare', statMult: 0.96 },
      { species: 'Zeraora', level: 12, rarity: 'Epic', statMult: 0.77 },
    ],
  },
  {
    id: 7,
    chapter: 1,
    name: 'Cửa 7: Vùng Đất Sinh Trưởng',
    description: 'Kẻ địch hệ Cỏ có khả năng hồi sinh lực liên tục.',
    rewardGems: 350,
    rewardExp: 300,
    enemies: [
      { species: 'Celebi', level: 13, rarity: 'Epic', statMult: 0.8 },
      { species: 'Leafeon', level: 14, rarity: 'Epic', statMult: 0.8 },
    ],
  },
  {
    id: 8,
    chapter: 1,
    name: 'Cửa 8: Cuồng Phong Đại Dương',
    description: 'Lớp khiên và phòng thủ cực mạnh của hệ Nước cản bước tiến của bạn.',
    rewardGems: 400,
    rewardExp: 350,
    enemies: [
      { species: 'Blastoise', level: 15, rarity: 'Epic', statMult: 0.83 },
      { species: 'Gyarados', level: 16, rarity: 'Legendary', statMult: 0.63 },
    ],
  },
  {
    id: 9,
    chapter: 1,
    name: 'Cửa 9: Bộ Ba Tinh Anh',
    description: 'Cuộc đụng độ với những Pokémon có bộ kỹ năng vô cùng tinh quái.',
    rewardGems: 500,
    rewardExp: 450,
    enemies: [
      { species: 'Decidueye', level: 17, rarity: 'Epic', statMult: 0.87 },
      { species: 'Infernape', level: 18, rarity: 'Legendary', statMult: 0.65 },
      { species: 'Greninja', level: 18, rarity: 'Legendary', statMult: 0.65 },
    ],
  },
  {
    id: 10,
    chapter: 1,
    name: 'Cửa 10: Lãnh Địa Của Cổ Long Đất (Boss)',
    description: 'Ác Mộng Đại Địa! Tyranitar cùng bầy cổ long xuất thế!',
    rewardGems: 1500,
    rewardExp: 1000,
    enemies: [
      { species: 'Garchomp', level: 19, rarity: 'Legendary', statMult: 0.68 },
      { species: 'Rayquaza', level: 19, rarity: 'Legendary', statMult: 0.68 },
      { species: 'Tyranitar', level: 20, rarity: 'Legendary', statMult: 0.68 },
    ],
  },

  // ============ CHƯƠNG 2: CỔ ĐẠI THỨC TỈNH (CỬA 11-20) ============
  {
    id: 11,
    chapter: 2,
    name: 'Cửa 11: Bờ Biển Sóng Lớn',
    description: 'Sóng thần cuồn cuộn từ đại dương — đối thủ hệ Nước hùng hậu đầu tiên của Chương 2.',
    rewardGems: 600,
    rewardExp: 500,
    enemies: [
      { species: 'Lapras', level: 20, rarity: 'Epic', statMult: 1.0 },
      { species: 'Primarina', level: 22, rarity: 'Epic', statMult: 1.0 },
    ],
  },
  {
    id: 12,
    chapter: 2,
    name: 'Cửa 12: Ngọn Lửa Ngàn Năm',
    description: 'Ngọn lửa cổ xưa cháy mãi không tắt — chuẩn bị cho hỏa lực khủng khiếp.',
    rewardGems: 650,
    rewardExp: 550,
    enemies: [
      { species: 'Ninetales', level: 22, rarity: 'Epic', statMult: 1.07 },
      { species: 'Typhlosion', level: 24, rarity: 'Epic', statMult: 1.07 },
    ],
  },
  {
    id: 13,
    chapter: 2,
    name: 'Cửa 13: Rừng Sâu Huyền Bí',
    description: 'Khu rừng cổ đại che giấu những thực vật khổng lồ hồi phục liên tục.',
    rewardGems: 700,
    rewardExp: 600,
    enemies: [
      { species: 'Venusaur', level: 24, rarity: 'Epic', statMult: 1.1 },
      { species: 'Torterra', level: 26, rarity: 'Epic', statMult: 1.1 },
    ],
  },
  {
    id: 14,
    chapter: 2,
    name: 'Cửa 14: Gã Khổng Lồ Núi Đá (Mini-Boss)',
    description: 'Hai gã khổng lồ đá sừng sững chắn đường — phá giáp của chúng bằng sát thương chuẩn!',
    rewardGems: 800,
    rewardExp: 700,
    enemies: [
      { species: 'Golem', level: 25, rarity: 'Epic', statMult: 1.13 },
      { species: 'Aggron', level: 27, rarity: 'Epic', statMult: 1.13 },
    ],
  },
  {
    id: 15,
    chapter: 2,
    name: 'Cửa 15: Bão Điện Nguyên Thủy',
    description: 'Cơn bão sét cổ đại quét qua — kẻ địch di chuyển nhanh như chớp!',
    rewardGems: 900,
    rewardExp: 750,
    enemies: [
      { species: 'Electivire', level: 27, rarity: 'Epic', statMult: 1.2 },
      { species: 'Luxray', level: 28, rarity: 'Epic', statMult: 1.2 },
      { species: 'Zapdos', level: 29, rarity: 'Legendary', statMult: 0.9 },
    ],
  },
  {
    id: 16,
    chapter: 2,
    name: 'Cửa 16: Vực Sâu Biển Cả',
    description: 'Khám phá đáy biển sâu thẳm — thủy thần Kyogre đang chờ bạn!',
    rewardGems: 1000,
    rewardExp: 850,
    enemies: [
      { species: 'Milotic', level: 29, rarity: 'Epic', statMult: 1.23 },
      { species: 'Feraligatr', level: 30, rarity: 'Epic', statMult: 1.23 },
      { species: 'Kyogre', level: 31, rarity: 'Legendary', statMult: 0.93 },
    ],
  },
  {
    id: 17,
    chapter: 2,
    name: 'Cửa 17: Thảo Nguyên Cuồng Phong',
    description: 'Cơn gió cuồng trên thảo nguyên — hệ Cỏ vừa nhanh vừa dai dẳng.',
    rewardGems: 1100,
    rewardExp: 950,
    enemies: [
      { species: 'Meowscarada', level: 30, rarity: 'Epic', statMult: 1.27 },
      { species: 'Roserade', level: 31, rarity: 'Epic', statMult: 1.27 },
      { species: 'Sceptile', level: 32, rarity: 'Legendary', statMult: 0.95 },
    ],
  },
  {
    id: 18,
    chapter: 2,
    name: 'Cửa 18: Lửa Địa Ngục Dữ Dội',
    description: 'Ngọn lửa địa ngục thiêu rụi mọi thứ — đội hình hỏa công siêu mạnh!',
    rewardGems: 1200,
    rewardExp: 1000,
    enemies: [
      { species: 'Houndoom', level: 32, rarity: 'Epic', statMult: 1.33 },
      { species: 'Blaziken', level: 33, rarity: 'Legendary', statMult: 1.0 },
      { species: 'Typhlosion', level: 34, rarity: 'Legendary', statMult: 1.0 },
    ],
  },
  {
    id: 19,
    chapter: 2,
    name: 'Cửa 19: Cổ Đại Phun Trào',
    description: 'Lớp đá cổ đại trỗi dậy với sức mạnh nghiền nát — hãy tìm điểm yếu của chúng!',
    rewardGems: 1500,
    rewardExp: 1200,
    enemies: [
      { species: 'Golem', level: 33, rarity: 'Legendary', statMult: 1.05 },
      { species: 'Rhyperior', level: 34, rarity: 'Legendary', statMult: 1.05 },
      { species: 'Diancie', level: 35, rarity: 'Legendary', statMult: 1.05 },
    ],
  },
  {
    id: 20,
    chapter: 2,
    name: 'Cửa 20: Chúa Tể Cổ Đại (Boss)',
    description: 'Trùm cuối! Chúa tể Tyranitar cùng bầy rồng cổ đại đứng chặn mọi con đường!',
    rewardGems: 3000,
    rewardExp: 2000,
    enemies: [
      { species: 'Aggron', level: 34, rarity: 'Legendary', statMult: 1.1 },
      { species: 'Garchomp', level: 35, rarity: 'Legendary', statMult: 1.1 },
      { species: 'Tyranitar', level: 36, rarity: 'Legendary', statMult: 1.1 },
    ],
  },
]

// === TIẾN TRÌNH CHIẾN DỊCH (CHƯƠNG / MÀN) ===

export function isCampaignLevelCleared(levelId) {
  return (store.campaignCleared || []).includes(levelId)
}

// Màn mở khóa khi đã đánh hết màn ngay trước đó (màn 1 luôn mở)
export function isCampaignLevelUnlocked(levelId) {
  if (levelId === 1) return true
  return isCampaignLevelCleared(levelId - 1)
}

// Chương mở khóa khi đã đánh hết toàn bộ màn của chương trước
export function isCampaignChapterUnlocked(chapterId) {
  let firstLevel = CAMPAIGN_LEVELS.find((l) => l.chapter === chapterId)
  if (!firstLevel) return false
  return isCampaignLevelUnlocked(firstLevel.id)
}

export function getChapterLevels(chapterId) {
  return CAMPAIGN_LEVELS.filter((l) => l.chapter === chapterId)
}

export function getCampaignProgress() {
  let cleared = CAMPAIGN_LEVELS.filter((l) => isCampaignLevelCleared(l.id)).length
  return { cleared, total: CAMPAIGN_LEVELS.length }
}

export function markCampaignCleared(levelId) {
  if (!store.campaignCleared) store.campaignCleared = []
  if (!store.campaignCleared.includes(levelId)) {
    store.campaignCleared.push(levelId)
    saveGameState()
  }
}

// Danh sách Pokémon hợp lệ để chọn xuất trận (CHỈ load từ Pokédex)
export function getCampaignSelectList() {
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

// === TẠO QUÁI CHIẾN DỊCH (GIỮ NGUYÊN FORMULA) ===
function createCampaignEnemy(enemyConfig) {
  let eSpecies = POKEMON_SPECIES.find((s) => s.name === enemyConfig.species) || POKEMON_SPECIES[0]
  let eRarity = RARITIES.find((r) => r.name === enemyConfig.rarity) || RARITIES[0]
  let eLevel = enemyConfig.level
  let sMult = enemyConfig.statMult

  let eMpStep = Math.floor((eLevel - 1) / 10)
  let eMaxMp = 100 + eMpStep * 10
  let eInitMp = Math.min(eMaxMp, Math.round((eSpecies.baseInitMp + eMpStep * 5) * eRarity.statMult))

  let enemy = {
    name: eSpecies.name,
    type: eSpecies.type,
    rarity: eRarity,
    vLevel: 0,
    level: eLevel,
    maxHp: Math.round((eSpecies.baseHp + eLevel * 25) * eRarity.statMult * sMult),
    hp: Math.round((eSpecies.baseHp + eLevel * 25) * eRarity.statMult * sMult),
    shield: 0,
    maxMp: eMaxMp,
    initMp: eInitMp,
    mp: eInitMp,
    atk: Math.round((eSpecies.baseAtk + eLevel * 5) * eRarity.statMult * sMult),
    def: Math.round((eSpecies.baseDef + eLevel * 3) * eRarity.statMult * sMult),
    speed: Math.round((eSpecies.baseSpeed + eLevel * 2) * eRarity.statMult),
    effects: [],
    passive: eSpecies.passive ? JSON.parse(JSON.stringify(eSpecies.passive)) : null,
    skills: [
      generateSkillInstance(eSpecies.type, 'Basic', eRarity, eLevel),
      generateSkillInstance(eSpecies.type, 'Skill1', eRarity, eLevel),
    ],
  }

  if (eLevel >= 5) enemy.skills.push(generateSkillInstance(eSpecies.type, 'Skill2', eRarity, eLevel))
  if (eLevel >= 10) enemy.skills.push(generateSkillInstance(eSpecies.type, 'Ultimate', eRarity, eLevel))

  return enemy
}

// === BẮT ĐẦU TRẬN CHIẾN DỊCH ===
export function startCampaignBattle(campaignId) {
  if (!isCampaignLevelUnlocked(campaignId)) return false
  let campData = CAMPAIGN_LEVELS.find((c) => c.id === campaignId)
  if (!campData) return false

  battle.isBattling = true
  battle.mode = 'campaign'
  battle.campaignId = campaignId
  battle.waveIdx = 0
  battle.currentEnemies = campData.enemies
  battle.rewards = { gems: 0, exp: 0, gold: 0, candy: 0 }
  battle.battleTitle = `⚔️ ${campData.name}`
  battle.skillQueue = []
  clearBattleLog()
  clearFx()

  healBattleTeam()

  if (!switchToNextAlivePokemon()) return false

  loadCampaignWave(0)
  return true
}

export function loadCampaignWave(waveIdx, forcedOwner = null) {
  let campData = CAMPAIGN_LEVELS.find((c) => c.id === battle.campaignId)
  let enemyConfig = battle.currentEnemies[waveIdx]

  battle.enemyPoke = createCampaignEnemy(enemyConfig)
  battle.isProcessingTurn = false
  battle.waveIndicator = `Wave: ${waveIdx + 1}/${battle.currentEnemies.length}`

  battleLog(`⚔️ [Wave ${waveIdx + 1}] Bắt đầu! <b>${store.team[battle.activePokeIdx].name}</b> VS <b>${battle.enemyPoke.name}</b>`)
  checkStartBattlePassives()
  determineFirstTurn(forcedOwner)
}

export function checkStartBattlePassives() {
  let playerPoke = store.team[battle.activePokeIdx]
  if (playerPoke) applyStartBattlePassive(playerPoke)
  if (battle.enemyPoke) applyStartBattlePassive(battle.enemyPoke)
}

// === BẮT ĐẦU TRẬN BẮT POKÉMON HOANG DÃ ===
export function startWildBattle(wildPokemon) {
  if (!wildPokemon) return false

  battle.isBattling = true
  battle.mode = 'wild'
  battle.wildDied = false
  battle.activePokeIdx = null
  battle.enemyPoke = wildPokemon
  battle.enemyTeam = []
  battle.currentTurnOwner = 'player'
  battle.extraTurnOwner = null
  battle.isProcessingTurn = false
  battle.selectingSlot = null
  battle.waveIdx = 0
  battle.campaignId = null
  battle.storySceneId = null
  battle.towerFloor = null
  battle.currentEnemies = []
  battle.gymType = null
  battle.rewards = { gems: 0, exp: 0, gold: 0, candy: 0 }
  battle.battleTitle = `🌿 Gặp ${wildPokemon.name} Hoang Dã`
  battle.skillQueue = []
  clearBattleLog()
  clearFx()

  healBattleTeam()

  if (!switchToNextAlivePokemon()) return false

  // Chỉ có 1 wave cho wild battle
  battle.waveIndicator = `Wild Pokémon`

  battleLog(`🌿 Bạn gặp phải <b>${wildPokemon.name}</b> Lv.${wildPokemon.level} hoang dã!`)
  checkStartBattlePassives()
  determineFirstTurn()
  return true
}

// Bắt Pokéball thất bại nhưng Pokémon còn sống → trận tiếp tục, đến lượt nó phản công
export function continueAfterWildCapture() {
  if (!battle.enemyPoke || battle.enemyPoke.hp <= 0) return false
  battle.isProcessingTurn = false
  battle.currentTurnOwner = 'bot'
  battleLog(`🔴 <b>${battle.enemyPoke.name}</b> phá bóng thoát ra — nó nổi giận!`)
  startNextTurn()
  return true
}

// === HIỆU ỨNG ĐẦU LƯỢT (PASSIVE + CHOÁNG + GIẢM THỜI LƯỢNG BUFF/DEBUFF) ===
function processStartOfTurnEffects(poke) {
  let isPlayer = poke === store.team[battle.activePokeIdx]
  let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} (Bot)</b>`

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

// === SÁT THƯƠNG ĐỐT CUỐI LƯỢT (CHIẾN DỊCH: DOT THEO % ATK NGUỒN GÂY RA) ===
// Pokémon bị dính hiệu ứng đốt chịu sát thương vào CUỐI lượt của chính nó (chuẩn Pokémon).
function processEndOfTurnDot(poke) {
  let isPlayer = poke === store.team[battle.activePokeIdx]
  let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} (Bot)</b>`

  const dotEffectTypes = ['burn', 'shock', 'poison', 'bleed']

  for (let i = poke.effects.length - 1; i >= 0; i--) {
    let eff = poke.effects[i]

    if (dotEffectTypes.includes(eff.type)) {
      // Tính DoT dựa trên ATK của nguồn gây ra hiệu ứng
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
      if (!promptFaintSwitch()) return true
      return true
    }
    handleEnemyDefeated()
    return true
  }
  return false
}

// === XÁC ĐỊNH NGƯỜI ĐI TRƯỚC KHI VỪA XUẤT TRẬN (THEO TỐC ĐỘ) ===
// Tốc độ chỉ quyết định ai đi trước khi Pokémon vừa xuất trận.
// Tốc độ cao hơn -> đi trước. Bằng nhau -> chọn ngẫu nhiên 50/50.
// Sau đó trận đấu diễn ra theo lượt bình thường (đối thủ đánh xen kẽ).
export function determineFirstTurn(forcedOwner = null) {
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
    startNextTurn()
    return
  }
  if (eExtra && !pExtra) {
    battle.extraTurnOwner = 'bot'
    battle.currentTurnOwner = 'bot'
    battleLog(`⚡ <b>${battle.enemyPoke.name} (Bot)</b> bứt tốc — nhận thêm 1 lượt đánh khi vừa ra trận!`)
    startNextTurn()
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
    battle.currentTurnOwner === 'player' ? `<b>${p.name}</b>` : `<b>${battle.enemyPoke.name} (Bot)</b>`
  if (!forcedOwner && getEffectiveSpeed(p) === getEffectiveSpeed(battle.enemyPoke)) {
    battleLog(`🎲 Tốc độ ngang bằng — chọn ngẫu nhiên: ${firstName} đi trước!`)
  } else if (!forcedOwner) {
    battleLog(`⚡ ${firstName} đi trước nhờ Tốc Độ!`)
  }

  startNextTurn()
}

// Chuyển lượt theo cơ chế đánh theo lượt bình thường (xen kẽ)
function startNextTurn() {
  let p = store.team[battle.activePokeIdx]
  if (!p || p.hp <= 0 || battle.enemyPoke.hp <= 0) return

  if (battle.currentTurnOwner === 'player') {
    let res = processStartOfTurnEffects(p)
    if (res === 'stunned') {
      // Mất lượt nhưng vẫn chịu sát thương đốt cuối lượt
      if (processEndOfTurnDot(p)) return
      battle.currentTurnOwner = 'bot'
      battle.isProcessingTurn = false
      startNextTurn()
      return
    }
    if (res) return
    if (p.hp <= 0) return
    battleLog(`⚡ Lượt của <b>${p.name}</b>!`)
  } else {
    let res = processStartOfTurnEffects(battle.enemyPoke)
    if (res === 'stunned') {
      // Mất lượt nhưng vẫn chịu sát thương đốt cuối lượt
      if (processEndOfTurnDot(battle.enemyPoke)) return
      battle.currentTurnOwner = 'player'
      battle.isProcessingTurn = false
      startNextTurn()
      return
    }
    if (res) return
    if (battle.enemyPoke.hp <= 0) return
    battleLog(`🤖 Lượt của <b>${battle.enemyPoke.name} (Bot)</b>!`)
    executeBotTurn()
  }
}

function executeBotTurn() {
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
      handleEnemyDefeated()
      battle.isProcessingTurn = false
      return
    }

    // CUỐI lượt của địch: sát thương đốt trên chính địch
    if (processEndOfTurnDot(battle.enemyPoke)) {
      battle.isProcessingTurn = false
      return
    }
    await awaitFxIdle()

    if (p.hp <= 0) {
      battleLog(`💀 <b>${p.name}</b> đã gục ngã!`)
      if (!promptFaintSwitch()) {
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
      startNextTurn()
      return
    }

    battle.currentTurnOwner = 'player'
    startNextTurn()
  }, 800)
}

export async function useSkill(skillIdx) {
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
    handleEnemyDefeated()
    battle.isProcessingTurn = false
    return
  }

  // CUỐI lượt của người chơi: sát thương đốt trên chính Pokémon đang xuất trận
  battle.isProcessingTurn = false
  if (processEndOfTurnDot(p)) return
  await awaitFxIdle()

  if (battle.extraTurnOwner === 'player') {
    battle.extraTurnOwner = null
    battle.currentTurnOwner = 'bot'
    startNextTurn()
    return
  }

  battle.currentTurnOwner = 'bot'
  startNextTurn()
}

// Đổi Pokémon trong trận (chiến dịch)
export function performInBattleSwitch(targetIdx) {
  let oldPoke = store.team[battle.activePokeIdx]
  battle.activePokeIdx = targetIdx
  let newPoke = store.team[battle.activePokeIdx]

  battleLog(`🔄 Bạn đã thu hồi <b>${oldPoke.name}</b> và tung <b>${newPoke.name}</b> ra sân!`)

  applyStartBattlePassive(newPoke)
  determineFirstTurn()
}

// === XỬ LÝ HẠ GỤC — CHO CHỌN POKÉMON THAY THẾ ===

// Khi Pokémon người chơi gục, mở modal cho phép chọn con thay thế
export function promptFaintSwitch() {
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
  battleLog(`💀 Toàn bộ đội hình đã gục ngã! Chiến dịch thất bại.`)
  battle.isProcessingTurn = false
  showCampaignResult(false)
  return false
}

// Xác nhận chọn Pokémon thay thế sau khi con trước đó gục
export function confirmFaintSwitch(targetIdx) {
  battle.awaitingFaintSwitch = false
  let oldPoke = store.team[battle.activePokeIdx]
  battle.activePokeIdx = targetIdx
  let newPoke = store.team[targetIdx]

  battleLog(`🔄 <b>${oldPoke.name}</b> đã gục, tung <b>${newPoke.name}</b> vào sân!`)
  applyStartBattlePassive(newPoke)
  determineFirstTurn('player')
}

// === XỬ LÝ HẠ GỤC QUÁI / CHIẾN THẮNG ===
function handleEnemyDefeated() {
  // Trận bắt wild: Pokémon đã chết → không thể bắt, trận kết thúc.
  if (battle.mode === 'wild') {
    battle.wildDied = true
    let earnedExp = 15 + battle.enemyPoke.level * 5
    let goldDrop = Math.floor(Math.random() * (battle.enemyPoke.level * 3 + 5)) + (5 + battle.enemyPoke.level * 3)
    battle.rewards.exp += earnedExp
    battle.rewards.gold = (battle.rewards.gold || 0) + goldDrop
    store.gold += goldDrop
    battleLog(`💀 <b>${battle.enemyPoke.name}</b> đã chết! Nhận +${earnedExp} EXP, +${goldDrop} 🪙`)
    battle.teamIndices.forEach((idx) => {
      if (idx !== null && store.team[idx]) gainExp(store.team[idx], earnedExp)
    })
    let playerLevels = addPlayerExp(earnedExp)
    if (playerLevels > 0) {
      battleLog(`⬆️ <b>Nâng cấp người chơi! Lv.${store.gameState.player.level}</b> 🎉`)
    }
    showCampaignResult(true)
    return
  }

  let earnedExp = 30 + battle.enemyPoke.level * 10
  battle.rewards.exp += earnedExp

  let goldDrop = Math.floor(Math.random() * (battle.enemyPoke.level * 5 + 10)) + (10 + battle.enemyPoke.level * 5)
  store.gold += goldDrop
  battle.rewards.gold = (battle.rewards.gold || 0) + goldDrop

  battleLog(`🏆 Hạ gục thành công ${battle.enemyPoke.name}! Nhận +${earnedExp} EXP, +${goldDrop} 🪙`)

  let candyChance = 0.1 + Math.random() * 0.05
  if (Math.random() < candyChance) {
    store.inventory.candy++
    battle.rewards.candy = (battle.rewards.candy || 0) + 1
    battleLog(`🍬 <b>RỚT ĐỒ!</b> Bạn nhặt được 1 Kẹo Kinh Nghiệm!`)
  }

  // Cấp EXP cho toàn bộ Pokémon tham gia trận đấu
  battle.teamIndices.forEach((idx) => {
    if (idx !== null && store.team[idx]) gainExp(store.team[idx], earnedExp)
  })

  // Người chơi cũng nhận EXP ngay khi hạ từng Pokémon địch.
  // EXP thưởng hoàn thành màn ở cuối trận vẫn được cộng riêng.
  let playerLevels = addPlayerExp(earnedExp)
  if (playerLevels > 0) {
    battleLog(`⬆️ <b>Nâng cấp người chơi! Lv.${store.gameState.player.level}</b> 🎉`)
  }

  battle.waveIdx++
  if (battle.waveIdx < battle.currentEnemies.length) {
    battleLog(`➡️ Chuẩn bị bước vào Wave ${battle.waveIdx + 1}...`)
    setTimeout(() => loadCampaignWave(battle.waveIdx, 'bot'), 1200)
  } else {
    // Trận huấn luyện: không có campData (campaignId = null) → bỏ qua thưởng màn
    if (battle.mode !== 'training') {
      let campData = CAMPAIGN_LEVELS.find((c) => c.id === battle.campaignId)
      store.gems += campData.rewardGems
      battle.rewards.gems = campData.rewardGems
      battle.rewards.exp += campData.rewardExp

      battle.teamIndices.forEach((idx) => {
        if (idx !== null && store.team[idx]) gainExp(store.team[idx], campData.rewardExp)
      })
      let levels = addPlayerExp(campData.rewardExp)
      if (levels > 0) battleLog(`⬆️ <b>Nâng cấp người chơi! Lv.${store.gameState.player.level}</b> 🎉`)
    }

    showCampaignResult(true)
  }
}

export function showCampaignResult(win) {
  applyPendingLevelUps()
  // Trận bắt wild: không đánh dấu chiến dịch, không tính quest thắng
  if (battle.mode === 'wild') {
    battle.resultOpen = true
    battle.resultWin = win
    saveGameState()
    return
  }
  // Trận huấn luyện không đánh dấu chiến dịch, không tính quest thắng
  if (win && battle.mode !== 'training') {
    markCampaignCleared(battle.campaignId)
    addQuestProgress('wins', 1)
    // Nhiệm vụ khởi đầu: thắng trận chiến dịch đầu tiên (Cửa 1) khi đang ở giai đoạn GO_CAMPAIGN
    if (getOnboardingStage() === STORY_STAGES.GO_CAMPAIGN) {
      store.gold += 1000
      store.gems += 1000
      store.gameState.player.pokeGacha += 1500
      setOnboardingStage(STORY_STAGES.DONE)
      store.startMissionCongrats = true
      battleLog('🎉 Hoàn thành nhiệm vụ khởi đầu! Nhận +1000 🪙, +1000 💎, +1500 🎟️ Vé Quay!')
    }
  }
  battle.resultOpen = true
  battle.resultWin = win
  saveGameState()
}
