// ==========================================
// QUEST SYSTEM: nhiệm vụ NPC + theo dõi tiến độ
// - NPCS: registry NPC có hội thoại/nhiệm vụ
// - QUESTS: định nghĩa nhiệm vụ (mục tiêu, phần thưởng)
// - Trạng thái lưu trong store.quests (questId → {status, progress})
// ==========================================

import { store, saveGameState } from './store.js'

// Registry NPC có hội thoại / nhiệm vụ
export const NPCS = {
  BichBeo: {
    id: 'BichBeo',
    name: 'Bích Béo',
    icon: '👩',
    smallTalk: [
      'Ở đây à? Ta là Bích Béo, người trông coi khu dân cư thị trấn này.',
      'Chào cháu! Có cần ta giúp gì không?',
      'Phòng Lab của Giáo sư Oak ở phía tây thị trấn, nếu cháu muốn đến đó.',
      'Cửa hàng Gacha ngay cạnh chợ, nếu cháu muốn thử vận may.',
      'Chúc cháu một ngày tốt lành!',
    ],
    questId: 'wild_catcher',
  },
}

// Định nghĩa nhiệm vụ
export const QUESTS = {
  wild_catcher: {
    id: 'wild_catcher',
    npcId: 'BichBeo',
    name: 'Săn Bắt Pokémon Hoang Dã',
    desc: 'Bắt 3 Pokémon hoang dã bất kỳ trên bản đồ thị trấn.',
    target: 3,
    reward: { type: 'candy', val: 2 },
    rewardGold: 2000,
    rewardText: '2 🍬 Kẹo Kinh Nghiệm + 2000 🪙 Vàng',
  },
}

// Trạng thái nhiệm vụ
export const QUEST_STATUS = {
  NONE: 'none',
  ACTIVE: 'active',
  DONE: 'done',
  CLAIMED: 'claimed',
}

// Lấy trạng thái nhiệm vụ của NPC
export function getNpcQuestStatus(npcId) {
  const npc = NPCS[npcId]
  if (!npc?.questId) return null
  const quest = QUESTS[npc.questId]
  if (!quest) return null
  const state = store.quests?.[quest.id] || { status: QUEST_STATUS.NONE, progress: 0 }
  return { ...quest, ...state }
}

// Nhận nhiệm vụ từ NPC
export function acceptNpcQuest(npcId) {
  const npc = NPCS[npcId]
  if (!npc?.questId) return { ok: false, message: 'NPC này không có nhiệm vụ.' }
  const quest = QUESTS[npc.questId]
  if (!quest) return { ok: false, message: 'Không tìm thấy nhiệm vụ!' }
  if (!store.quests) store.quests = {}
  const existing = store.quests[quest.id]
  if (existing && existing.status !== QUEST_STATUS.NONE) {
    return { ok: false, message: 'Nhiệm vụ này đã được nhận rồi!' }
  }
  store.quests[quest.id] = { status: QUEST_STATUS.ACTIVE, progress: 0 }
  saveGameState()
  return { ok: true, message: `📜 Đã nhận nhiệm vụ: ${quest.name} — ${quest.desc}` }
}

// Tăng tiến độ nhiệm vụ (gọi từ các hệ thống: capture, battle...)
export function addQuestProgress(questId, amount = 1) {
  if (!store.quests) store.quests = {}
  const state = store.quests[questId]
  if (!state || state.status !== QUEST_STATUS.ACTIVE) return
  const quest = QUESTS[questId]
  if (!quest) return
  state.progress = Math.min((state.progress || 0) + amount, quest.target)
  if (state.progress >= quest.target) {
    state.status = QUEST_STATUS.DONE
  }
  saveGameState()
}

// Nhận thưởng nhiệm vụ
export function claimQuestReward(questId) {
  if (!store.quests) store.quests = {}
  const state = store.quests[questId]
  if (!state || state.status !== QUEST_STATUS.DONE) {
    return { ok: false, message: 'Nhiệm vụ chưa hoàn thành!' }
  }
  const quest = QUESTS[questId]
  if (!quest) return { ok: false, message: 'Không tìm thấy nhiệm vụ!' }
  if (state.status === QUEST_STATUS.CLAIMED) {
    return { ok: false, message: 'Nhiệm vụ này đã nhận thưởng rồi!' }
  }
  // Cộng thưởng
  if (quest.reward?.type === 'candy') {
    store.inventory.candy = (store.inventory.candy || 0) + quest.reward.val
  }
  if (quest.rewardGold) {
    store.gold = (store.gold || 0) + quest.rewardGold
  }
  state.status = QUEST_STATUS.CLAIMED
  saveGameState()
  return {
    ok: true,
    message: `🎉 Đã nhận thưởng: ${quest.rewardText}!`,
  }
}