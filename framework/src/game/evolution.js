// ==========================================
// LOGIC TIẾN HÓA (EVOLUTION)
// Độc lập với V-Level: V0 vẫn tiến hóa, giữ nguyên V sau khi tiến hóa.
// Kích hoạt theo Level Pokémon (type: 'level'). Cấu trúc EVOLUTIONS dạng mảng nhánh
// cho phép về sau thêm nhánh rẽ / tiến hóa đặc biệt / đá tiến hóa mà không đổi logic.
// ==========================================

import { EVOLUTIONS, POKEMON_SPECIES, EVOLUTION_STONES } from './data.js'
import { recalculatePokemonStats } from './stats.js'
import { store } from './store.js'

// Tra thông tin đá tiến hóa của nhánh stone (để UI hiển thị tên/emoji/số lượng)
export function getStoneInfo(evo) {
  if (!evo || evo.type !== 'stone') return null
  return EVOLUTION_STONES.find((s) => s.id === evo.item) || null
}

/**
 * Danh sách nhánh tiến hóa HIỆN khả dụng của Pokémon (đã lọc theo điều kiện).
 * - type 'level': đủ cấp độ (tự tiến hóa)
 * - type 'stone': có đá tiến hóa tương ứng trong kho (người chơi chủ động dùng)
 * @param {object} p
 * @returns {Array}
 */
export function getAvailableEvolutions(p) {
  if (!p) return []
  const list = EVOLUTIONS[p.name] || []
  return list.filter((evo) => {
    if (evo.type === 'level') return p.level >= (evo.atLevel || 0)
    if (evo.type === 'stone') return (store.inventory && store.inventory[evo.item] > 0) || false
    // Các loại điều kiện khác (special...) sẽ được thêm về sau
    return true
  })
}

// Chỉ xét các nhánh TỰ tiến hóa theo cấp độ (dùng cho đẻ/load/migration)
function canEvolveByLevel(p) {
  const list = EVOLUTIONS[p.name] || []
  return list.some((evo) => evo.type === 'level' && p.level >= (evo.atLevel || 0))
}

/**
 * Pokémon có thể tiến hóa ngay bây giờ hay không.
 * @param {object} p
 * @returns {boolean}
 */
export function canEvolve(p) {
  return getAvailableEvolutions(p).length > 0
}

/**
 * Thông tin tiến hóa dùng cho UI (dạng kế tiếp + mốc level / đá cần thiết). Trả null nếu không có nhánh.
 * @param {object} p
 * @returns {{ from: string, next: string, atLevel: number, branches: Array, stone?: object | null } | null}
 */
export function getEvolutionInfo(p) {
  if (!p) return null
  const list = EVOLUTIONS[p.name] || []
  if (list.length === 0) return null
  return {
    from: p.name,
    next: list[0].next,
    atLevel: list[0].atLevel || 0,
    branches: list,
    stone: getStoneInfo(list[0]),
  }
}

/**
 * Tiến hóa Pokémon theo 1 nhánh (mặc định nhánh đầu tiên hợp lệ).
 * Giữ nguyên rarity, V-Level, level, exp, IV, skill, passive, talent — chỉ đổi loài + chỉ số.
 * Nhánh `stone` sẽ TIÊU HAO đá trong kho.
 * @param {object} p - Pokémon instance (mutates)
 * @param {object} [gymBuffs]
 * @param {object} [path] - Nhánh tiến hóa cụ thể (hỗ trợ UI chọn nhánh đá)
 * @returns {{ from: string, next: string, evolutionCount: number, evo: object } | null}
 */
export function evolvePokemon(p, gymBuffs = {}, path) {
  const list = EVOLUTIONS[p.name] || []
  if (list.length === 0) return null
  const evo = path || list[0]
  if (evo.type === 'level' && p.level < (evo.atLevel || 0)) return null
  if (evo.type === 'stone' && (!store.inventory || !store.inventory[evo.item] || store.inventory[evo.item] <= 0)) return null
  const species = POKEMON_SPECIES.find((s) => s.name === evo.next)
  if (!species) return null

  const fromName = p.name
  if (evo.type === 'stone' && store.inventory) store.inventory[evo.item]--
  p.name = species.name
  p.evolutionCount = (p.evolutionCount || 0) + 1
  recalculatePokemonStats(p, gymBuffs)
  return { from: fromName, next: species.name, evolutionCount: p.evolutionCount, evo }
}

/**
 * Tiến hóa liên tục cho tới dạng cuối cùng đạt đủ điều kiện (dùng khi đẻ/load/migration).
 * CHỈ tự chạy các nhánh `level` — nhánh `stone` yêu cầu người chơi chủ động dùng đá.
 * @param {object} p
 * @param {object} [gymBuffs]
 * @returns {Array} Danh sách các bước tiến hóa đã diễn ra (rỗng nếu không có)
 */
export function applyEvolutions(p, gymBuffs = {}) {
  const evolved = []
  let guard = 0
  while (canEvolveByLevel(p)) {
    const evo = EVOLUTIONS[p.name].find((e) => e.type === 'level')
    const result = evolvePokemon(p, gymBuffs, evo)
    if (!result) break
    evolved.push(result)
    if (++guard > 20) break
  }
  return evolved
}
