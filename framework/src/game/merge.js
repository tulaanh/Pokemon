// ==========================================
// LOGIC HỢP NHẤT (MERGE) - GIỮ NGUYÊN CÔNG THỨC
// ==========================================

import { store, saveGameState } from './store.js'
import { RARITY_ORDER } from './inventory.js'
import { recalculatePokemonStats, recalculateSkillValues } from './stats.js'
import { TALENT_UNLOCK_VLEVELS, rollTalent, rollPassive } from './skills.js'
import { applyEvolutions } from './evolution.js'

// Danh sách Pokémon hợp lệ để chọn phôi (theo slot đang chọn)
export function getMergeEligibleList() {
  const slotType = store.currentSelectingSlot
  return store.team
    .map((p, originalIndex) => ({ pokemon: p, originalIndex }))
    .filter((item) => {
      if (slotType === 'main' && item.originalIndex === store.mergeSlotSub) return false
      if (slotType === 'sub' && item.originalIndex === store.mergeSlotMain) return false
      if (store.mergeSearchQuery && !item.pokemon.name.toLowerCase().includes(store.mergeSearchQuery)) return false
      return true
    })
    .sort((a, b) => {
      let nameCompare = a.pokemon.name.localeCompare(b.pokemon.name)
      if (nameCompare === 0) {
        return (RARITY_ORDER[b.pokemon.rarity.name] || 0) - (RARITY_ORDER[a.pokemon.rarity.name] || 0)
      }
      return nameCompare
    })
}

// Gán phôi cho slot đang chọn
export function selectPokemonForMerge(idx) {
  if (store.currentSelectingSlot === 'main') store.mergeSlotMain = idx
  if (store.currentSelectingSlot === 'sub') store.mergeSlotSub = idx
}

/**
 * Tính trước kết quả hợp nhất (Preview). Trả về null nếu chưa đủ 2 phôi.
 * @returns {{ ok: boolean, message?: string, temp?: object, diffs?: object } | null}
 */
export function computeMergePreview() {
  const main = store.mergeSlotMain
  const sub = store.mergeSlotSub
  if (main === null || sub === null) return null

  const pMain = store.team[main]
  const pSub = store.team[sub]
  if (!pMain || !pSub) return { ok: false, message: 'Không tìm thấy Pokémon trong Kho!' }

  if (pMain.name !== pSub.name) return { ok: false, message: `❌ Phải cùng loài (${pMain.name})!` }
  if (pMain.rarity.name !== pSub.rarity.name) {
    return { ok: false, message: `❌ Phải cùng độ hiếm (${pMain.rarity.name} vs ${pSub.rarity.name})!` }
  }
  if ((pMain.vLevel || 0) !== (pSub.vLevel || 0)) {
    return { ok: false, message: `❌ Phải cùng cấp V (V${pMain.vLevel || 0} vs V${pSub.vLevel || 0})!` }
  }

  // Giả lập chỉ số sau khi hợp nhất
  const tempPoke = JSON.parse(JSON.stringify(pMain))
  tempPoke.vLevel = (tempPoke.vLevel || 0) + 1
  if (pSub.level > tempPoke.level) tempPoke.level = pSub.level

  recalculatePokemonStats(tempPoke, store.gymBuffs)

  // Nếu level tăng (phôi phụ cao hơn) có thể chạm mốc tiến hóa → giả lập luôn trong preview
  const willEvolve = applyEvolutions(tempPoke, store.gymBuffs)

  const diffs = {
    hp: tempPoke.maxHp - pMain.maxHp,
    atk: tempPoke.atk - pMain.atk,
    def: tempPoke.def - pMain.def,
    spd: tempPoke.speed - pMain.speed,
  }

  return { ok: true, temp: tempPoke, diffs, willEvolve }
}

/**
 * Thực hiện hợp nhất. Phôi phụ bị tiêu biến, phôi chính tăng cấp V.
 * @returns {{ ok: boolean, message?: string, poke?: object, unlockedTalent?: object | null, evolved?: Array }}
 */
export function executeMerge() {
  const main = store.mergeSlotMain
  const sub = store.mergeSlotSub
  if (main === null || sub === null) return { ok: false, message: 'Vui lòng chọn đủ 2 Pokémon!' }

  const pMain = store.team[main]
  const pSub = store.team[sub]
  if (!pMain || !pSub || pMain.name !== pSub.name || pMain.rarity.name !== pSub.rarity.name || (pMain.vLevel || 0) !== (pSub.vLevel || 0)) {
    return { ok: false, message: 'Không đủ điều kiện hợp nhất!' }
  }

  // Tăng cấp V
  pMain.vLevel = (pMain.vLevel || 0) + 1

  // Hệ thống Tài năng: mở khóa tại V1, V3, V5
  if (!pMain.talents) pMain.talents = []
  if (!pMain.passives) {
    pMain.passives = pMain.passive ? [JSON.parse(JSON.stringify(pMain.passive))] : [rollPassive(pMain.type)]
    pMain.passive = pMain.passives[0]
  }

  let unlockedTalent = null
  if (TALENT_UNLOCK_VLEVELS.includes(pMain.vLevel)) {
    unlockedTalent = rollTalent()
    pMain.talents.push(unlockedTalent)
  }

  // Giữ level cao hơn nếu phôi phụ level cao hơn
  if (pSub.level > pMain.level) {
    pMain.level = pSub.level
    pMain.exp = pSub.exp
    pMain.maxExp = pSub.maxExp
  }

  // Tính lại chỉ số & damage kỹ năng theo V-Level mới
  recalculatePokemonStats(pMain, store.gymBuffs)
  pMain.skills.forEach((s) => recalculateSkillValues(s, pMain.level))

  // Tiến hóa theo cấp độ: nếu chép level cao hơn từ phôi phụ và chạm mốc → tự tiến hóa (giữ nguyên V)
  const evolved = applyEvolutions(pMain, store.gymBuffs)

  // Xóa phôi phụ
  store.team.splice(sub, 1)

  // Dọn dẹp: gỡ phôi phụ khỏi Pokédex nếu đang được yêu thích
  if (store.gameState.pokedex && pSub.id) {
    const staleIdx = store.gameState.pokedex.indexOf(String(pSub.id))
    if (staleIdx !== -1) store.gameState.pokedex.splice(staleIdx, 1)
  }

  const result = { ok: true, poke: pMain, unlockedTalent, evolved }

  store.mergeSlotMain = null
  store.mergeSlotSub = null
  saveGameState()
  return result
}
