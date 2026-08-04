// ==========================================
// LOGIC CHẾ ĐỘ STORY (TÁCH UI - GIỮ NGUYÊN CÔNG THỨC)
// Tự nhân bản luồng battle của campaign (giống gym.js) để không ảnh hưởng 2 chế độ kia.
// Scene 'dialogue' (hội thoại) + scene 'battle' (trận chiến) tuyến tính theo chương.
// ==========================================

import { POKEMON_SPECIES, RARITIES } from './data.js'
import { store, saveGameState, addPlayerExp } from './store.js'
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

// Nhãn hiển thị đối thủ trong nhật ký (phân biệt với campaign "(Bot)")
const ENEMY_TAG = '(Đối Thủ)'

export const STORY_CHAPTERS = [
  {
    id: 1,
    name: 'Chương 1: Khởi Đầu Truyền Thuyết',
    description: 'Hành trình bắt đầu từ ngọn lửa bất tử — vượt qua thử thách để chạm đến Ho-Oh!',
    icon: '🌅',
  },
  {
    id: 2,
    name: 'Chương 2: Sóng Thần Lugia',
    description: 'Cơn bão không bao giờ tan ngoài đại dương — đối mặt với thủy thần Lugia!',
    icon: '🌊',
  },
  {
    id: 3,
    name: 'Chương 3: Sấm Sét Raikou',
    description: 'Thảo nguyên sấm sét phía Bắc — chứng tỏ lòng dũng cảm trước mãnh thú Raikou!',
    icon: '⚡',
  },
  {
    id: 4,
    name: 'Chương 4: Lòng Đất Kiên Cường',
    description: 'Vùng núi đá hùng vĩ phía Tây — đối mặt với nữ hoàng kim cương Diancie!',
    icon: '🪨',
  },
  {
    id: 5,
    name: 'Chương 5: Rồng Vòm Trời',
    description: 'Bầu trời rung chuyển trước con rồng cổ đại — trận chiến cuối cùng với Rayquaza!',
    icon: '🌌',
  },
]

// Scene tuyến tính theo thứ tự mảng: scene sau mở khi scene trước đã đọc/đánh xong.
export const STORY_SCENES = [
  // ============ CHƯƠNG 1: KHỞI ĐẦU TRUYỀN THUYẾT ============
  {
    id: 'st-1',
    chapter: 1,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Nơi xa xôi, có một vùng đất nơi Pokémon và con người cùng chung sống...' },
      { speaker: 'Người Kể', text: 'Hôm nay, một Huấn luyện viên trẻ bắt đầu hành trình cùng những người bạn đầu tiên của mình.' },
      { speaker: 'Pikachu ⚡', text: 'Pika pika! Hãy cùng nhau khám phá thế giới này nào!' },
      { speaker: 'Người Kể', text: 'Trước mắt họ là một khu rừng đầy bí ẩn...' },
    ],
  },
  {
    id: 'st-2',
    chapter: 1,
    type: 'battle',
    name: 'Trận Đầu Làm Quen',
    description: 'Làm quen với cơ chế chiến đấu. Đối thủ là những Pokémon cấp thấp trên đường vào rừng.',
    rewardGems: 100,
    rewardExp: 50,
    enemies: [
      { species: 'Pikachu', level: 2, rarity: 'Common', statMult: 0.9 },
      { species: 'Bulbasaur', level: 3, rarity: 'Common', statMult: 0.9 },
    ],
  },
  {
    id: 'st-3',
    chapter: 1,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Sau khi vượt qua khu rừng, họ nhìn thấy một luồng ánh sáng màu lửa bừng lên từ chân trời.' },
      { speaker: 'Pikachu ⚡', text: 'Pika...?! Điều gì đang xảy ra ở đó vậy?' },
      { speaker: 'Người Kể', text: 'Đó là tàn tích Cổ Đại — nơi người ta kể rằng ngọn lửa bất tử vẫn còn cháy mãi...' },
    ],
  },
  {
    id: 'st-4',
    chapter: 1,
    type: 'battle',
    name: 'Thử Thách Ngọn Lửa',
    description: 'Hai ngọn lửa cổ xưa chặn đường tiến vào tàn tích. Hãy phá vỡ hàng rào lửa này!',
    rewardGems: 150,
    rewardExp: 100,
    enemies: [
      { species: 'Ninetales', level: 5, rarity: 'Rare', statMult: 0.9 },
      { species: 'Typhlosion', level: 6, rarity: 'Rare', statMult: 0.9 },
    ],
  },
  {
    id: 'st-5',
    chapter: 1,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Từ đám tro tàn, một bóng hình rực lửa hiện lên — đó là Ho-Oh, phượng hoàng bất tử!' },
      { speaker: 'Ho-Oh 🔥', text: 'Ngươi đã vượt qua ngọn lửa thử thách... Hỡi Huấn luyện viên, hãy chứng tỏ sức mạnh của mình!' },
      { speaker: 'Pikachu ⚡', text: 'Pika! Chúng ta nhất định sẽ thắng!' },
    ],
  },
  {
    id: 'st-6',
    chapter: 1,
    type: 'battle',
    name: 'Boss: Ho-Oh',
    description: 'Phượng hoàng bất tử đã thức giấc! Đánh bại Ho-Oh để kết thúc Chương 1!',
    rewardGems: 400,
    rewardExp: 250,
    enemies: [
      { species: 'Ho-Oh', level: 8, rarity: 'Legendary', statMult: 0.72 },
      { species: 'Ninetales', level: 7, rarity: 'Rare', statMult: 0.85 },
    ],
  },

  // ============ CHƯƠNG 2: SÓNG THẦN LUGIA ============
  {
    id: 'st-7',
    chapter: 2,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Tại bờ biển phía Đông, ngư dân đồn đại về một cơn bão không bao giờ tan...' },
      { speaker: 'Người Kể', text: 'Người ta bảo rằng Lugia — thủy thần gìn giữ đại dương — đang nổi giận.' },
      { speaker: 'Pikachu ⚡', text: 'Pika! Chúng ta phải ra đó xem sao!' },
    ],
  },
  {
    id: 'st-8',
    chapter: 2,
    type: 'battle',
    name: 'Bão Tố Biển Khơi',
    description: 'Sóng lớn cuồn cuộn, các Pokémon hệ Nước trồi lên chặn đường. Vượt qua chúng!',
    rewardGems: 250,
    rewardExp: 200,
    enemies: [
      { species: 'Milotic', level: 10, rarity: 'Rare', statMult: 0.9 },
      { species: 'Feraligatr', level: 11, rarity: 'Rare', statMult: 0.9 },
    ],
  },
  {
    id: 'st-9',
    chapter: 2,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Giữa cơn bão, một sinh vật khổng lồ vượt sóng trồi lên từ vực sâu.' },
      { speaker: 'Lugia 💧', text: 'Ta là Lugia, người canh giữ vực sâu. Sóng thần dấy lên vì tàn tích cổ xưa đã bị quấy nhiễu...' },
      { speaker: 'Pikachu ⚡', text: 'Pika pika! Bọn mình sẽ giúp cậu làm dịu cơn bão!' },
    ],
  },
  {
    id: 'st-10',
    chapter: 2,
    type: 'battle',
    name: 'Boss: Lugia',
    description: 'Thủy thần đại dương giao chiến! Đánh bại Lugia để xoa dịu cơn thịnh nộ của biển cả!',
    rewardGems: 500,
    rewardExp: 350,
    enemies: [
      { species: 'Lugia', level: 13, rarity: 'Legendary', statMult: 0.75 },
      { species: 'Lapras', level: 12, rarity: 'Rare', statMult: 0.9 },
    ],
  },

  // ============ CHƯƠNG 3: SẤM SÉT RAIKOU ============
  {
    id: 'st-11',
    chapter: 3,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Vùng thảo nguyên phía Bắc nổi tiếng với những cơn giông quanh năm không dứt.' },
      { speaker: 'Người Kể', text: 'Dân làng kể rằng mỗi khi sét giáng xuống, đều có bóng dáng một mãnh thú lướt qua.' },
      { speaker: 'Pikachu ⚡', text: 'Pika...? Có vẻ như ai đó cũng mạnh về điện như bọn mình!' },
    ],
  },
  {
    id: 'st-12',
    chapter: 3,
    type: 'battle',
    name: 'Cơn Thịnh Nộ Của Sét',
    description: 'Những tia sét rạch ngang bầu trời — các Pokémon hệ Điện tấn công dồn dập!',
    rewardGems: 350,
    rewardExp: 300,
    enemies: [
      { species: 'Manectric', level: 15, rarity: 'Rare', statMult: 0.9 },
      { species: 'Electivire', level: 16, rarity: 'Rare', statMult: 0.9 },
    ],
  },
  {
    id: 'st-13',
    chapter: 3,
    type: 'dialogue',
    lines: [
      { speaker: 'Raikou ⚡', text: 'Hỡi Huấn luyện viên! Ta là Raikou, kẻ mang cơn thịnh nộ của bầu trời!' },
      { speaker: 'Raikou ⚡', text: 'Ngươi đã dám bước chân vào thảo nguyên sấm sét... Hãy chứng tỏ lòng dũng cảm của mình!' },
      { speaker: 'Pikachu ⚡', text: 'Pika!! Một trận điện với điện — thật sự máu lửa!' },
    ],
  },
  {
    id: 'st-14',
    chapter: 3,
    type: 'battle',
    name: 'Boss: Raikou',
    description: 'Mãnh thú sấm sét giao chiến! Đánh bại Raikou để hoàn tất hành trình truyền thuyết!',
    rewardGems: 600,
    rewardExp: 450,
    enemies: [
      { species: 'Raikou', level: 18, rarity: 'Legendary', statMult: 0.75 },
      { species: 'Zapdos', level: 17, rarity: 'Legendary', statMult: 0.72 },
    ],
  },

  // ============ CHƯƠNG 4: LÒNG ĐẤT KIÊN CƯỜNG ============
  {
    id: 'st-15',
    chapter: 4,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Phía Tây là vùng núi đá trập trùng — nơi những khối kim cương lấp lánh giữa lòng hang sâu.' },
      { speaker: 'Người Kể', text: 'Dân địa phương thì thầm về một nữ hoàng kim cương bảo vệ kho báu của lòng đất.' },
      { speaker: 'Pikachu ⚡', text: 'Pika pika! Kim cương mà lấp lánh như vậy... chắc chắn rất đáng để gặp!' },
    ],
  },
  {
    id: 'st-16',
    chapter: 4,
    type: 'battle',
    name: 'Lối Vào Hang Đá',
    description: 'Những khối đá khổng lồ chặn lối vào hang — phá vỡ hàng rào đá này để tiến sâu hơn!',
    rewardGems: 400,
    rewardExp: 350,
    enemies: [
      { species: 'Garganacl', level: 20, rarity: 'Rare', statMult: 0.9 },
      { species: 'Golem', level: 21, rarity: 'Rare', statMult: 0.9 },
    ],
  },
  {
    id: 'st-17',
    chapter: 4,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Trong sâu thẳm hang động, một luồng sáng rực rỡ phát ra từ khối kim cương khổng lồ.' },
      { speaker: 'Diancie 🪨', text: 'Hỡi kẻ lạ mặt! Ta là Diancie, nữ hoàng của những viên kim cương. Kho báu này không dành cho ngươi!' },
      { speaker: 'Pikachu ⚡', text: 'Pika!! Bọn mình không muốn kho báu — chỉ muốn thử sức với người mạnh nhất ở đây thôi!' },
    ],
  },
  {
    id: 'st-18',
    chapter: 4,
    type: 'battle',
    name: 'Boss: Diancie',
    description: 'Nữ hoàng kim cương giao chiến! Đánh bại Diancie để được thừa nhận sức mạnh của lòng đất!',
    rewardGems: 800,
    rewardExp: 600,
    enemies: [
      { species: 'Diancie', level: 24, rarity: 'Legendary', statMult: 0.75 },
      { species: 'Rhyperior', level: 22, rarity: 'Epic', statMult: 0.85 },
    ],
  },

  // ============ CHƯƠNG 5: RỒNG VÒM TRỜI ============
  {
    id: 'st-19',
    chapter: 5,
    type: 'dialogue',
    lines: [
      { speaker: 'Người Kể', text: 'Sau bao hành trình, bầu trời đột nhiên tối sầm — một con rồng cổ đại bay vút qua những tầng mây.' },
      { speaker: 'Người Kể', text: 'Người ta nói rằng Rayquaza canh giữ bầu trời, và chỉ những Huấn luyện viên xuất sắc nhất mới được đối mặt.' },
      { speaker: 'Pikachu ⚡', text: 'Pika!! Đó chính là con rồng huyền thoại mà bọn mình luôn nghe kể!' },
    ],
  },
  {
    id: 'st-20',
    chapter: 5,
    type: 'battle',
    name: 'Thử Thách Vòm Trời',
    description: 'Những kẻ bảo vệ bầu trời lao xuống — chứng tỏ bản lĩnh trước thử thách cuối cùng!',
    rewardGems: 500,
    rewardExp: 450,
    enemies: [
      { species: 'Garchomp', level: 26, rarity: 'Epic', statMult: 0.85 },
      { species: 'Aerodactyl', level: 25, rarity: 'Rare', statMult: 0.9 },
    ],
  },
  {
    id: 'st-21',
    chapter: 5,
    type: 'dialogue',
    lines: [
      { speaker: 'Rayquaza 🌌', text: 'Ta là Rayquaza, con rồng của bầu trời vĩnh hằng. Nhiều kẻ đã tìm đến... nhưng rất ít kẻ trụ nổi trước ta!' },
      { speaker: 'Rayquaza 🌌', text: 'Hỡi Huấn luyện viên, nếu ngươi đủ mạnh — hãy chứng tỏ để bầu trời này thừa nhận ngươi!' },
      { speaker: 'Pikachu ⚡', text: 'Pika pika!! Trận chiến cuối cùng — bọn mình sẽ chiến hết mình!' },
    ],
  },
  {
    id: 'st-22',
    chapter: 5,
    type: 'battle',
    name: 'Boss: Rayquaza',
    description: 'Trận chiến định mệnh với Rồng Vòm Trời! Đánh bại Rayquaza để hoàn tất huyền thoại!',
    rewardGems: 1000,
    rewardExp: 800,
    enemies: [
      { species: 'Rayquaza', level: 30, rarity: 'Legendary', statMult: 0.72 },
      { species: 'Celebi', level: 28, rarity: 'Legendary', statMult: 0.72 },
    ],
  },
]

// === TIẾN TRÌNH STORY (TẤT CẢ SCENE - HỘI THOẠI & TRẬN CHIẾN - NẰM TRONG storyCleared) ===

export function isStorySceneCleared(sceneId) {
  return (store.storyCleared || []).includes(sceneId)
}

export function getStorySceneIndex(sceneId) {
  return STORY_SCENES.findIndex((s) => s.id === sceneId)
}

// Scene mở khóa khi scene ngay trước đó đã đọc/đánh xong (scene đầu luôn mở)
export function isStorySceneUnlocked(sceneId) {
  let idx = getStorySceneIndex(sceneId)
  if (idx <= 0) return true
  return isStorySceneCleared(STORY_SCENES[idx - 1].id)
}

export function getChapterScenes(chapterId) {
  return STORY_SCENES.filter((s) => s.chapter === chapterId)
}

export function getStoryProgress() {
  let cleared = STORY_SCENES.filter((s) => isStorySceneCleared(s.id)).length
  return { cleared, total: STORY_SCENES.length }
}

export function markStoryCleared(sceneId) {
  if (!store.storyCleared) store.storyCleared = []
  if (!store.storyCleared.includes(sceneId)) {
    store.storyCleared.push(sceneId)
    saveGameState()
  }
}

// Danh sách Pokémon hợp lệ để chọn xuất trận (CHỈ load từ Pokédex — giống campaign)
export function getStorySelectList() {
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

// === TẠO QUÁI STORY (GIỮ NGUYÊN FORMULA NHƯ CAMPAIGN) ===
function createStoryEnemy(enemyConfig) {
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

// === BẮT ĐẦU TRẬN STORY ===
export function startStoryBattle(sceneId) {
  if (!isStorySceneUnlocked(sceneId)) return false
  let sceneData = STORY_SCENES.find((s) => s.id === sceneId)
  if (!sceneData || sceneData.type !== 'battle') return false

  battle.isBattling = true
  battle.mode = 'story'
  battle.storySceneId = sceneId
  battle.waveIdx = 0
  battle.currentEnemies = sceneData.enemies
  battle.rewards = { gems: 0, exp: 0, gold: 0, candy: 0 }
  battle.battleTitle = `📖 ${sceneData.name}`
  battle.skillQueue = []
  clearBattleLog()
  clearFx()

  healBattleTeam()

  if (!switchToNextAlivePokemon()) return false

  loadStoryWave(0)
  return true
}

export function loadStoryWave(waveIdx) {
  let sceneData = STORY_SCENES.find((s) => s.id === battle.storySceneId)
  let enemyConfig = battle.currentEnemies[waveIdx]

  battle.enemyPoke = createStoryEnemy(enemyConfig)
  battle.isProcessingTurn = false
  battle.waveIndicator = `Wave: ${waveIdx + 1}/${battle.currentEnemies.length}`

  battleLog(`⚔️ [Wave ${waveIdx + 1}] Bắt đầu! <b>${store.team[battle.activePokeIdx].name}</b> VS <b>${battle.enemyPoke.name}</b>`)
  checkStartBattlePassives()
  determineFirstTurn()
}

export function checkStartBattlePassives() {
  let playerPoke = store.team[battle.activePokeIdx]
  if (playerPoke) applyStartBattlePassive(playerPoke)
  if (battle.enemyPoke) applyStartBattlePassive(battle.enemyPoke)
}

// === HIỆU ỨNG ĐẦU LƯỢT (STORY: PASSIVE + CHOÁNG + GIẢM THỜI LƯỢNG BUFF/DEBUFF) ===
function processStartOfTurnEffects(poke) {
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

// === SÁT THƯƠNG ĐỐT CUỐI LƯỢT (STORY: DOT THEO % ATK NGUỒN GÂY RA - NHƯ CAMPAIGN) ===
// Pokémon bị dính hiệu ứng đốt chịu sát thương vào CUỐI lượt của chính nó (chuẩn Pokémon).
function processEndOfTurnDot(poke) {
  let isPlayer = poke === store.team[battle.activePokeIdx]
  let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} ${ENEMY_TAG}</b>`

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
      if (!switchToNextAlivePokemon()) {
        showStoryResult(false)
        return true
      }
      determineFirstTurn()
      return true
    }
    handleStoryEnemyDefeated()
    return true
  }
  return false
}

// === XÁC ĐỊNH NGƯỜI ĐI TRƯỚC KHI VỪA XUẤT TRẬN (THEO TỐC ĐỘ) ===
export function determineFirstTurn() {
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
    battleLog(`⚡ <b>${battle.enemyPoke.name} ${ENEMY_TAG}</b> bứt tốc — nhận thêm 1 lượt đánh khi vừa ra trận!`)
    startNextTurn()
    return
  }

  let pSpd = getEffectiveSpeed(p)
  let eSpd = getEffectiveSpeed(battle.enemyPoke)

  if (pSpd > eSpd) {
    battle.currentTurnOwner = 'player'
  } else if (eSpd > pSpd) {
    battle.currentTurnOwner = 'bot'
  } else {
    battle.currentTurnOwner = Math.random() < 0.5 ? 'player' : 'bot'
  }

  let firstName =
    battle.currentTurnOwner === 'player' ? `<b>${p.name}</b>` : `<b>${battle.enemyPoke.name} ${ENEMY_TAG}</b>`
  if (pSpd === eSpd) {
    battleLog(`🎲 Tốc độ ngang bằng — chọn ngẫu nhiên: ${firstName} đi trước!`)
  } else {
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
    battleLog(`🤖 Lượt của <b>${battle.enemyPoke.name} ${ENEMY_TAG}</b>!`)
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
      handleStoryEnemyDefeated()
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
      if (!switchToNextAlivePokemon()) {
        battleLog(`💀 Toàn bộ đội hình đã gục ngã! Cảnh phim thất bại.`)
        battle.isProcessingTurn = false
        showStoryResult(false)
        return
      }
      battle.isProcessingTurn = false
      determineFirstTurn()
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

export async function useStorySkill(skillIdx) {
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
    handleStoryEnemyDefeated()
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

// Đổi Pokémon trong trận (story)
export function performStoryInBattleSwitch(targetIdx) {
  let oldPoke = store.team[battle.activePokeIdx]
  battle.activePokeIdx = targetIdx
  let newPoke = store.team[battle.activePokeIdx]

  battleLog(`🔄 Bạn đã thu hồi <b>${oldPoke.name}</b> và tung <b>${newPoke.name}</b> ra sân!`)

  applyStartBattlePassive(newPoke)
  determineFirstTurn()
}

// === XỬ LÝ HẠ GỤC QUÁI / CHIẾN THẮNG ===
function handleStoryEnemyDefeated() {
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

  battle.waveIdx++
  if (battle.waveIdx < battle.currentEnemies.length) {
    battleLog(`➡️ Chuẩn bị bước vào Wave ${battle.waveIdx + 1}...`)
    setTimeout(() => loadStoryWave(battle.waveIdx), 1200)
  } else {
    let sceneData = STORY_SCENES.find((s) => s.id === battle.storySceneId)
    store.gems += sceneData.rewardGems
    battle.rewards.gems = sceneData.rewardGems
    battle.rewards.exp += sceneData.rewardExp

    battle.teamIndices.forEach((idx) => {
      if (idx !== null && store.team[idx]) gainExp(store.team[idx], sceneData.rewardExp)
    })
    let levels = addPlayerExp(sceneData.rewardExp)
    if (levels > 0) battleLog(`⬆️ <b>Nâng cấp người chơi! Lv.${store.gameState.player.level}</b> 🎉`)

    showStoryResult(true)
  }
}

export function showStoryResult(win) {
  applyPendingLevelUps()
  if (win) {
    markStoryCleared(battle.storySceneId)
    addQuestProgress('wins', 1)
  }
  battle.resultOpen = true
  battle.resultWin = win
  saveGameState()
}

// ==========================================
// GIAI ĐOẠN ONBOARDING (NHIỆM VỤ CHÍNH TUYẾN TÍNH)
// Thay thế boolean hasCompletedFirstLogin cũ bằng stage-machine:
// HOME(0) → LAB_DONE(1) → HOSPITAL(2) → GO_CAMPAIGN(3) → DONE(4)
// ==========================================

export const STORY_STAGES = {
  HOME: 0,
  LAB_DONE: 1,
  HOSPITAL: 2,
  GO_CAMPAIGN: 3,
  DONE: 4,
}

export function getOnboardingStage() {
  return store.onboardingStage ?? STORY_STAGES.HOME
}

export function isOnboardingActive() {
  return getOnboardingStage() < STORY_STAGES.DONE
}

export function setOnboardingStage(stage) {
  store.onboardingStage = stage
  store.hasCompletedFirstLogin = stage >= STORY_STAGES.LAB_DONE
  saveGameState()
}
