// ==========================================
// LOGIC SỰ KIỆN HẰNG NGÀY: ĐIỂM DANH + NHIỆM VỤ (DAILY QUESTS)
// - Điểm danh 7 ngày: streak giữ khi điểm danh liên tục, mất nếu bỏ lỡ 1 ngày.
// - Nhiệm vụ reset mỗi ngày theo giờ địa phương (lastQuestDate).
// ==========================================

import { store, saveGameState } from './store.js'

// Thưởng điểm danh theo chu kỳ 7 ngày (lặp lại)
export const CHECK_IN_REWARDS = [
  { type: 'gold', val: 500 },
  { type: 'gems', val: 100 },
  { type: 'candy', val: 2 },
  { type: 'gold', val: 1000 },
  { type: 'gems', val: 250 },
  { type: 'candy', val: 3 },
  { type: 'stone', stoneId: 'fire_stone' },
]

// Danh sách nhiệm vụ hằng ngày
export const DAILY_QUESTS = [
  { id: 'rolls', icon: '🎁', label: 'Quay Gacha', desc: 'Quay Gacha bất kỳ banner nào', target: 3, reward: { type: 'gold', val: 2000 } },
  { id: 'wins', icon: '⚔️', label: 'Thắng Trận', desc: 'Chiến thắng ở bất kỳ chế độ chiến đấu nào (Chiến dịch, Story, Gym, Tháp)', target: 3, reward: { type: 'gems', val: 200 } },
  { id: 'sells', icon: '💰', label: 'Bán Pokémon', desc: 'Bán Pokémon trong Kho Đồ', target: 2, reward: { type: 'gold', val: 1500 } },
  { id: 'candies', icon: '🍬', label: 'Dùng Kẹo', desc: 'Sử dụng Kẹo Kinh Nghiệm cho Pokémon', target: 1, reward: { type: 'gems', val: 100 } },
]

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseKey(key) {
  if (!key) return null
  const [y, m, day] = key.split('-').map(Number)
  if (!y || !m || !day) return null
  return new Date(y, m - 1, day)
}

function dayDiff(aKey, bKey) {
  const a = parseKey(aKey)
  const b = parseKey(bKey)
  if (!a || !b) return NaN
  return Math.round((a - b) / 86400000)
}

// Reset tiến độ nhiệm vụ khi sang ngày mới
export function ensureDailyReset() {
  const today = todayKey()
  if (store.daily.lastQuestDate !== today) {
    store.daily.lastQuestDate = today
    store.daily.quests = { rolls: 0, wins: 0, sells: 0, candies: 0 }
    store.daily.questClaimed = {}
    saveGameState()
  }
}

// === THƯỞNG ===

function grantReward(reward) {
  if (!reward) return
  if (reward.type === 'gold') store.gold += reward.val
  else if (reward.type === 'gems') store.gems += reward.val
  else if (reward.type === 'pokePoint') store.gameState.player.pokePoint += reward.val
  else if (reward.type === 'candy') store.inventory.candy = (store.inventory.candy || 0) + reward.val
  else if (reward.type === 'stone') store.inventory[reward.stoneId] = (store.inventory[reward.stoneId] || 0) + 1
}

function buildRewardText(reward) {
  if (!reward) return ''
  if (reward.type === 'gold') return `${reward.val.toLocaleString()} 💰 Vàng`
  if (reward.type === 'gems') return `${reward.val.toLocaleString()} 💎 Gem`
  if (reward.type === 'pokePoint') return `${reward.val.toLocaleString()} 🎟️ PokePoint`
  if (reward.type === 'candy') return `${reward.val} 🍬 Kẹo Kinh Nghiệm`
  if (reward.type === 'stone') return '1 💎 Đá Tiến Hóa'
  return ''
}

// === ĐIỂM DANH ===

export function getCheckInStatus() {
  ensureDailyReset()
  const today = todayKey()
  const streak = store.daily.checkInStreak || 0
  const claimedToday = store.daily.lastCheckIn === today
  return {
    today,
    claimedToday,
    streak,
    total: store.daily.checkInTotal || 0,
    rewards: CHECK_IN_REWARDS,
    // Ô ngày (0-6) được xem là "đã điểm danh" trong chu kỳ hiện tại
    claimedDays: streak > 0 ? (streak % 7 === 0 ? 7 : streak % 7) : 0,
    // Ô ngày điểm danh tiếp theo hôm nay (0-6)
    nextDayIndex: streak % 7,
  }
}

export function checkIn() {
  ensureDailyReset()
  const today = todayKey()
  if (store.daily.lastCheckIn === today) {
    return { ok: false, message: 'Bạn đã điểm danh hôm nay rồi! Ngày mai quay lại nhé.' }
  }

  let streak = store.daily.checkInStreak || 0
  if (store.daily.lastCheckIn) {
    const gap = dayDiff(today, store.daily.lastCheckIn)
    streak = gap === 1 ? streak + 1 : 1
  } else {
    streak = 1
  }

  store.daily.checkInStreak = streak
  store.daily.checkInTotal = (store.daily.checkInTotal || 0) + 1
  store.daily.lastCheckIn = today

  const dayIndex = streak % 7 === 0 ? 6 : (streak % 7) - 1
  const reward = CHECK_IN_REWARDS[dayIndex] || CHECK_IN_REWARDS[0]
  grantReward(reward)
  saveGameState()

  return {
    ok: true,
    message: `✅ Điểm danh ngày ${dayIndex + 1}/7 — nhận ${buildRewardText(reward)}!`,
    reward,
    dayIndex,
    streak,
  }
}

// === NHIỆM VỤ HẰNG NGÀY ===

// Ghi nhận tiến độ nhiệm vụ (gọi từ các hệ thống: gacha, battle, shop, inventory...)
export function addQuestProgress(key, amount = 1) {
  ensureDailyReset()
  if (!(key in store.daily.quests)) return
  const q = DAILY_QUESTS.find((x) => x.id === key)
  if (!q) return
  store.daily.quests[key] = Math.min((store.daily.quests[key] || 0) + amount, q.target)
  saveGameState()
}

export function getQuestStatus() {
  ensureDailyReset()
  return DAILY_QUESTS.map((q) => ({
    ...q,
    progress: Math.min(store.daily.quests[q.id] || 0, q.target),
    claimed: !!store.daily.questClaimed[q.id],
    rewardText: buildRewardText(q.reward),
  }))
}

export function claimQuest(questId) {
  ensureDailyReset()
  const q = DAILY_QUESTS.find((x) => x.id === questId)
  if (!q) return { ok: false, message: 'Không tìm thấy nhiệm vụ!' }
  if (store.daily.questClaimed[questId]) return { ok: false, message: 'Nhiệm vụ này đã nhận thưởng rồi!' }

  const progress = store.daily.quests[q.id] || 0
  if (progress < q.target) {
    return { ok: false, message: `Nhiệm vụ chưa hoàn thành (${progress}/${q.target})!` }
  }

  store.daily.questClaimed[questId] = true
  grantReward(q.reward)
  saveGameState()
  return { ok: true, message: `🎉 Đã nhận ${buildRewardText(q.reward)}!`, reward: q.reward }
}
