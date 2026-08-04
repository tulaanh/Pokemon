// ==========================================
// LOGIC CỬA HÀNG & KHO VẬT PHẨM (TÁCH UI - GIỮ NGUYÊN)
// ==========================================

import { store, saveGameState } from './store.js'
import { recalculatePokemonStats, recalculateSkillValues } from './stats.js'
import { generateSkillInstance } from './gacha.js'
import { EVOLUTIONS, EVOLUTION_STONES } from './data.js'
import { applyEvolutions, evolvePokemon, getStoneInfo } from './evolution.js'
import { addQuestProgress } from './daily.js'

// ==========================================
// POKÉBALL CATALOG
// ==========================================

export const POKEBALLS = [
  { id: 'pokeball', name: 'Poké Ball', price: 200, catchRate: 1.0, icon: '/images/items/pokeballs/poke-ball.png', description: 'Bóng bắt cơ bản' },
  { id: 'greatball', name: 'Great Ball', price: 600, catchRate: 1.5, icon: '/images/items/pokeballs/great-ball.png', description: 'Bóng bắt tốt hơn Poké Ball' },
  { id: 'ultraball', name: 'Ultra Ball', price: 1200, catchRate: 2.0, icon: '/images/items/pokeballs/ultra-ball.png', description: 'Bóng bắt hiệu quả cao' },
  { id: 'masterball', name: 'Master Ball', price: 50000, catchRate: 255, icon: '/images/items/pokeballs/master-ball.png', description: 'Bắt chắc 100% (hiếm)' },
]

export function getPokeballCatalog() {
  return POKEBALLS.map((b) => ({ ...b, count: store.inventory[b.id] || 0 }))
}

export function buyPokeball(ballId, amount = 1) {
  const ball = POKEBALLS.find((b) => b.id === ballId)
  if (!ball) return { ok: false, message: 'Không tìm thấy loại bóng này!' }
  let cost = ball.price * amount
  if (store.gold < cost) {
    return { ok: false, message: `❌ Không đủ Vàng! Bạn cần ${cost.toLocaleString()} Vàng để mua ${amount} ${ball.name}.` }
  }
  store.gold -= cost
  store.inventory[ballId] = (store.inventory[ballId] || 0) + amount
  saveGameState()
  return { ok: true, message: `Đã mua ${amount} ${ball.name} với giá ${cost.toLocaleString()} Vàng!`, amount, cost }
}

export const RARE_CANDY_PRICE = 1000
export const LEVEL_CAP = 90

// Mua Kẹo Kinh Nghiệm. cost = amount * 1000 vàng.
export function buyRareCandy(amount) {
  let cost = amount * RARE_CANDY_PRICE
  if (store.gold < cost) {
    return { ok: false, message: `❌ Không đủ Vàng! Bạn cần ${cost.toLocaleString()} Vàng để mua ${amount} viên kẹo.` }
  }
  store.gold -= cost
  store.inventory.candy += amount
  saveGameState()
  return { ok: true, message: `🍬 Đã mua ${amount} Kẹo Kinh Nghiệm với giá ${cost.toLocaleString()} Vàng!`, amount, cost }
}

// Lấy cấp Huấn luyện viên hiện tại (dùng làm cấp trần cho Pokémon)
export function getTrainerLevel() {
  return (store.gameState && store.gameState.player && store.gameState.player.level) || 1
}

// Pokémon có bị chặn dùng Kẹo không (đạt cấp trần 90 hoặc cấp trần HLV)
export function isCandyCapped(p) {
  return p.level >= LEVEL_CAP || p.level >= getTrainerLevel()
}

// Danh sách Pokémon sắp theo level giảm dần (dùng trong modal dùng Kẹo)
export function getCandyUsableList() {
  return store.team
    .map((p, idx) => ({ pokemon: p, idx }))
    .sort((a, b) => b.pokemon.level - a.pokemon.level)
}

/**
 * Nhóm kỹ năng được đề xuất theo mốc level.
 * - Level 5: chọn 1 kỹ năng THAY THẾ Basic hoặc Skill1 (không mở ô mới)
 * - Level 10: chọn 1 kỹ năng THAY THẾ Skill1 (không mở ô mới)
 * - Level 15: MỞ KHÓA ô kỹ năng 3 — học Skill2
 * - Level 20: chọn 1 kỹ năng THAY THẾ Skill2 (không mở ô mới)
 * - Level 30: MỞ KHÓA ô kỹ năng 4 — học Ultimate (kèm 3 lựa chọn ngẫu nhiên khác)
 * - Level 35+ (mỗi 5 cấp): quay 4 nhóm NGẪU NHIÊN (có thể trùng nhóm: nhiều Basic / nhiều Skill1 / nhiều Skill2 / nhiều Ultimate)
 * @param {number} level
 * @returns {string[]|null}
 */
export function getSkillGroupsForLevel(level) {
  if (level === 5) return ['Basic', 'Skill1'] // 2 lựa chọn: 1 Basic + 1 Skill1
  if (level === 10) return ['Skill1', 'Skill1'] // 2 lựa chọn Skill1
  if (level === 15) return ['Skill2', 'Skill2'] // 2 lựa chọn Skill2 - mở ô kỹ năng 3
  if (level === 20) return ['Skill2', 'Skill2'] // 2 lựa chọn Skill2 - thay thế
  if (level >= 30 && level % 5 === 0) return randomSkillGroups(level) // 30, 35, 40... quay 4 nhóm ngẫu nhiên
  return null
}

// 4 nhóm kỹ năng (dùng cho quay ngẫu nhiên từ cấp 30)
const ALL_SKILL_GROUPS = ['Basic', 'Skill1', 'Skill2', 'Ultimate']

// Quay 4 nhóm ngẫu nhiên (cho phép trùng: nhiều Basic / nhiều Skill1 / nhiều Skill2 / nhiều Ultimate)
function randomSkillGroups(level) {
  let groups = []
  // Cấp 30: đảm bảo ít nhất 1 Ultimate để mở khóa ô kỹ năng 4
  if (level === 30) groups.push('Ultimate')
  while (groups.length < 4) {
    groups.push(ALL_SKILL_GROUPS[Math.floor(Math.random() * ALL_SKILL_GROUPS.length)])
  }
  return groups
}

/**
 * Dùng 1 viên Kẹo Kinh Nghiệm cho Pokémon.
 * @returns {{ ok: boolean, message?: string, poke?: object, needsSkillSelect?: boolean, skillGroups?: string[], level?: number }}
 */
export function useCandyOnPokemon(teamIdx) {
  let p = store.team[teamIdx]
  if (!p) return { ok: false, message: 'Không tìm thấy Pokémon!' }

  if (store.inventory.candy <= 0) {
    return { ok: false, message: '❌ Không còn Kẹo Kinh Nghiệm!' }
  }

  if (p.level >= LEVEL_CAP) {
    return { ok: false, message: `❌ ${p.name} đã đạt cấp ${p.level} (tối đa ${LEVEL_CAP}), không thể sử dụng Kẹo!` }
  }

  let trainerLevel = getTrainerLevel()
  if (p.level >= trainerLevel) {
    return { ok: false, message: `❌ ${p.name} đã đạt cấp trần Lv.${p.level} (bằng cấp Huấn luyện viên)! Hãy nâng cấp HLV trước.` }
  }

  store.inventory.candy--
  p.level++
  p.maxExp = Math.round(p.level * 50 + Math.pow(p.level, 1.5) * 10)
  recalculatePokemonStats(p, store.gymBuffs)
  p.skills.forEach((s) => recalculateSkillValues(s, p.level))

  addQuestProgress('candies', 1)

  // Tiến hóa theo cấp độ: khi level vượt mốc thì tự biến đổi (giữ nguyên V-Level, skill...)
  const evolved = applyEvolutions(p, store.gymBuffs)

  // Hệ thống học skill mới theo mốc level:
  // - Level 5/10/35+: học kỹ năng THAY THẾ skill cùng nhóm (không mở ô mới)
  // - Level 15/30: MỞ KHÓA ô kỹ năng 3 (Skill2) và ô kỹ năng 4 (Ultimate)
  // Modal sẽ tự quyết định: mở ô mới nếu chưa có nhóm đó, ngược lại cho thay thế.
  let skillGroups = getSkillGroupsForLevel(p.level)
  let needsSkillSelect = skillGroups !== null

  saveGameState()
  return { ok: true, poke: p, needsSkillSelect, skillGroups, level: p.level, evolved }
}

// ==========================================
// ĐÁ TIẾN HÓA (EVOLUTION STONES)
// ==========================================

// Danh sách đá kèm số lượng đang có trong kho (phục vụ UI Cửa Hàng)
export function getStoneCatalog() {
  return EVOLUTION_STONES.map((s) => ({ ...s, count: store.inventory[s.id] || 0 }))
}

// Mua đá tiến hóa bằng Vàng. cost = price * amount.
export function buyEvolutionStone(stoneId, amount = 1) {
  const stone = EVOLUTION_STONES.find((s) => s.id === stoneId)
  if (!stone) return { ok: false, message: 'Không tìm thấy loại đá này!' }
  let cost = stone.price * amount
  if (store.gold < cost) {
    return { ok: false, message: `❌ Không đủ Vàng! Bạn cần ${cost.toLocaleString()} Vàng để mua ${amount} ${stone.name}.` }
  }
  store.gold -= cost
  store.inventory[stoneId] = (store.inventory[stoneId] || 0) + amount
  saveGameState()
  return { ok: true, message: `${stone.emoji} Đã mua ${amount} ${stone.name} với giá ${cost.toLocaleString()} Vàng!`, amount, cost }
}

// Danh sách Pokémon trong kho CÓ nhánh tiến hóa bằng đá (kèm đá cần + có đủ chưa)
export function getStoneEvolvableList() {
  return store.team
    .map((p, idx) => ({ pokemon: p, idx }))
    .filter((item) => (EVOLUTIONS[item.pokemon.name] || []).some((e) => e.type === 'stone'))
    .map((item) => {
      const branches = (EVOLUTIONS[item.pokemon.name] || []).filter((e) => e.type === 'stone')
      return {
        ...item,
        branches: branches.map((b) => ({
          evo: b,
          stone: getStoneInfo(b),
          hasStone: (store.inventory[b.item] || 0) > 0,
        })),
      }
    })
}

/**
 * Dùng đá tiến hóa cho Pokémon theo nhánh cụ thể.
 * @returns {{ ok: boolean, message?: string, result?: object, stone?: object }}
 */
export function useStoneOnPokemon(teamIdx, evoBranch) {
  const p = store.team[teamIdx]
  if (!p) return { ok: false, message: 'Không tìm thấy Pokémon!' }

  const branch = (EVOLUTIONS[p.name] || []).find((e) => e.type === 'stone' && e.next === evoBranch.next)
  if (!branch) return { ok: false, message: 'Nhánh tiến hóa không hợp lệ!' }

  if (!store.inventory[branch.item] || store.inventory[branch.item] <= 0) {
    return { ok: false, message: '❌ Không còn đá tiến hóa cần thiết trong kho!' }
  }

  const stone = getStoneInfo(branch)
  const result = evolvePokemon(p, store.gymBuffs, branch)
  if (!result) return { ok: false, message: 'Tiến hóa thất bại!' }

  saveGameState()
  return {
    ok: true,
    message: `${stone ? stone.emoji : ''} ${result.from} đã tiến hóa thành ${result.next}!`,
    result,
    stone,
  }
}
