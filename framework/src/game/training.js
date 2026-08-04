// ==========================================
// TRẬN HUẤN LUYỆN (SAU HƯỚNG DẪN CỦA Y TÁ) — TÁI DÙNG BATTLE ENGINE
// mode='training', campaignId=null, 1 địch yếu, auto chọn starter.
// Không đánh dấu campaignCleared, không tính quest thắng (guard trong campaign.js).
// ==========================================
import { store } from './store.js'
import { STARTER_NAMES } from './onboarding.js'
import {
  battle,
  battleLog,
  clearBattleLog,
  clearFx,
  healBattleTeam,
  switchToNextAlivePokemon,
} from './battle.js'
import { loadCampaignWave } from './campaign.js'

// Địch trận tập: Fuecoco cấp 1 — yếu hơn đối thủ Cửa 1 campaign để dễ làm quen
const TRAINING_ENEMY = { species: 'Fuecoco', level: 1, rarity: 'Common', statMult: 0.65 }

// Tìm starter trong đội (id bắt đầu bằng 'starter-' — do Oak tạo), fallback theo tên
function findStarterIndex() {
  const byId = store.team.findIndex((p) => p && String(p.id).startsWith('starter-'))
  if (byId !== -1) return byId
  const byName = store.team.findIndex((p) => p && STARTER_NAMES.includes(p.name))
  if (byName !== -1) return byName
  return store.team.length ? 0 : -1
}

export function startTrainingBattle() {
  const starterIdx = findStarterIndex()
  if (starterIdx === -1) return false

  battle.isBattling = true
  battle.mode = 'training'
  battle.campaignId = null
  battle.storySceneId = null
  battle.gymType = null
  battle.waveIdx = 0
  battle.currentEnemies = [TRAINING_ENEMY]
  battle.teamIndices = [starterIdx, null, null]
  battle.rewards = { gems: 0, exp: 0, gold: 0, candy: 0 }
  battle.battleTitle = '🎓 Trận Huấn Luyện'
  battle.skillQueue = []
  battle.resultOpen = false
  battle.resultWin = false
  clearBattleLog()
  clearFx()

  healBattleTeam()

  if (!switchToNextAlivePokemon()) return false

  battleLog('🎓 Y tá giao cho bạn một trận huấn luyện với Fuecoco hoang dã cấp 1!')
  loadCampaignWave(0)
  return true
}
