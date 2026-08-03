// ==========================================
// WORLDMAP: LƯỚI BẢN ĐỒ (data-driven)
// 50 cột x 32 hàng; 0 = cỏ tự động (autoGrassTile),
// ngược lại là index tile vào terrain.png (13x9 @ 32px)
// ==========================================

export const TILE_COLS = 50
export const TILE_ROWS = 32
export const TILE_SIZE = 32

// ==========================================
// TILE CONSTANTS (index vào terrain.png)
// ==========================================
export const TILE_PATH_A = 24
export const TILE_PATH_B = 25
export const TILE_WATER_A = 66
export const TILE_WATER_B = 67
export const TILE_WALL = 53
export const TILE_TREE = 43

// Các tile cỏ dùng cho "cỏ tự động" (ô có giá trị 0)
const GRASS_TILES = [2, 8, 9, 11, 12, 39, 91, 92, 93]

// ==========================================
// DEFAULT_GRID: bản đồ mặc định (thị trấn)
// ==========================================
function buildDefaultGrid() {
  const g = Array.from({ length: TILE_ROWS }, () => new Array(TILE_COLS).fill(0))

  // Đường chính (đá rải xen kẽ 2 ô)
  const PATH_ROADS = [
    { minCol: 6, maxCol: 44, minRow: 17, maxRow: 18 },
    { minCol: 6, maxCol: 6, minRow: 4, maxRow: 26 },
    { minCol: 44, maxCol: 44, minRow: 4, maxRow: 26 },
    { minCol: 24, maxCol: 24, minRow: 4, maxRow: 28 },
  ]
  for (const road of PATH_ROADS) {
    for (let r = road.minRow; r <= road.maxRow; r++)
      for (let c = road.minCol; c <= road.maxCol; c++)
        g[r][c] = (c + r) % 2 === 0 ? TILE_PATH_A : TILE_PATH_B
  }

  // Ao/hồ (khớp với obstacle p1/p2/p3 trong world.js)
  const PONDS = [
    { x: 350, y: 350, w: 200, h: 150 },
    { x: 1050, y: 350, w: 200, h: 150 },
    { x: 650, y: 720, w: 120, h: 80 },
  ]
  for (const pond of PONDS) {
    const c0 = Math.floor(pond.x / TILE_SIZE)
    const c1 = Math.floor((pond.x + pond.w - 1) / TILE_SIZE)
    const r0 = Math.floor(pond.y / TILE_SIZE)
    const r1 = Math.floor((pond.y + pond.h - 1) / TILE_SIZE)
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        g[r][c] = (c + r) % 2 === 0 ? TILE_WATER_A : TILE_WATER_B
  }

  return g
}

export const DEFAULT_GRID = buildDefaultGrid()

// ==========================================
// HELPERS
// ==========================================
// Cỏ tự động cho ô trống: trả về tile cỏ theo vị trí (ổn định, không ngẫu nhiên)
export function autoGrassTile(c, r) {
  return GRASS_TILES[(c * 7 + r * 13) % GRASS_TILES.length]
}

// Đọc lưới bản đồ: ưu tiên bản đồ người chơi đã vẽ lưu trong localStorage,
// không có thì dùng DEFAULT_GRID
export function getMapGrid() {
  try {
    const raw = localStorage.getItem('pokemonMapGrid')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        Array.isArray(parsed) &&
        parsed.length === TILE_ROWS &&
        Array.isArray(parsed[0]) &&
        parsed[0].length === TILE_COLS
      ) {
        return parsed
      }
    }
  } catch (e) {
    // Dữ liệu hỏng -> bỏ qua, dùng bản đồ mặc định
  }
  return DEFAULT_GRID
}
