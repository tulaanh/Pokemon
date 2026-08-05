// ==========================================
// MAPS: REGISTRY CÁC SCENE BẢN ĐỒ
// - town  : thị trấn (Tiled export — home_town.json)
// - house : nhà của bạn (Tiled — main_house.json)
// - lab   : Phòng Lab của Giáo sư Oak (Tiled — labPokemon.json)
// ==========================================
// LƯU Ý: tileset KHÔNG khai báo ở đây — worldScene tự đọc `json.tilesets`
// và resolve ảnh theo `ts.image` (thư mục cạnh map JSON hoặc path `/images/map/`).
// → Đổi/thêm/bỏ tileset trong Tiled chỉ cần export lại JSON + refresh.

export const TOWN_ID = 'town'

const TOWN_DIR = '/images/map/town'

// Vị trí cửa nhà chính ở town (ô io 31,19) — xuất hiện ngay phía dưới cửa
export const TOWN_HOUSE_DOOR_SPAWN = { x: 504, y: 336 }

// Vị trí xuất hiện khi vào lab (ô 7,3 — ngay dưới cửa)
export const LAB_SPAWN = { x: 120, y: 56 }

// Vị trí xuất hiện trong nhà (ô 2,4 — giữa phòng)
export const HOUSE_SPAWN = { x: 32, y: 64 }

// Vị trí xuất hiện khi ra khỏi lab — trước cửa tòa nhà phải (ô 45,30)
export const TOWN_LAB_DOOR_SPAWN = { x: 728, y: 480 }

// Vị trí xuất hiện khi vào bệnh viện (giữa map 16x16 @16px)
export const HOSPITAL_SPAWN = { x: 128, y: 120 }

// Vị trí xuất hiện khi ra khỏi bệnh viện — trước cửa bệnh viện town (ô 16,28/17,28)
export const TOWN_HOSPITAL_DOOR_SPAWN = { x: 264, y: 456 }

// Vị trí xuất hiện khi vào cửa hàng (ô 5,12 — giữa quầy, cách cửa ra 2 ô)
export const STORE_SPAWN = { x: 96, y: 200 }

// Vị trí xuất hiện khi ra khỏi cửa hàng — trước cửa hàng town (ô 46,47/47,47)
export const TOWN_STORE_DOOR_SPAWN = { x: 752, y: 776 }

// Vị trí xuất hiện khi vào cửa hàng Gacha (ô 15,22 — ngay phía trên cửa ở hàng 23-25)
export const GACHA_STORE_SPAWN = { x: 248, y: 360 }

// Vị trí xuất hiện khi ra khỏi cửa hàng Gacha — trước cửa Gacha town (ô 54,46)
export const TOWN_GACHA_DOOR_SPAWN = { x: 872, y: 744 }

export const MAPS = {
  [TOWN_ID]: {
    id: TOWN_ID,
    name: 'Thị trấn',
    kind: 'tiled',
    src: `${TOWN_DIR}/home_town.json`,
    tileSize: 16,
    zoom: 2,
    playerScale: 1,
    width: 960,
    height: 960,
    spawn: TOWN_HOUSE_DOOR_SPAWN,
    transitions: {
      // Cửa nhà chính (ô io 31,19) → vào nhà của bạn (map house)
      '31,19': { to: 'house', toSpawn: HOUSE_SPAWN },
      // Cửa tòa nhà phải (ô io 44,28/45,28) → vào Phòng Lab của Giáo sư Oak
      '44,28': { to: 'lab', toSpawn: LAB_SPAWN },
      '45,28': { to: 'lab', toSpawn: LAB_SPAWN },
      // Cửa bệnh viện (16,28)/(17,28) → vào Bệnh viện Pokémon
      '16,28': { to: 'hospital', toSpawn: HOSPITAL_SPAWN },
      '17,28': { to: 'hospital', toSpawn: HOSPITAL_SPAWN },
      // Phòng Gym Lửa (ô io 26,46/27,46/28,46) → mở tab Gym hệ Lửa
      '26,46': { to: 'gym', gymType: 'Fire' },
      '27,46': { to: 'gym', gymType: 'Fire' },
      '28,46': { to: 'gym', gymType: 'Fire' },
      // Cửa hàng (ô io 46,46/47,46/46,47/47,47) → vào cửa hàng
      '46,46': { to: 'store', toSpawn: STORE_SPAWN },
      '47,46': { to: 'store', toSpawn: STORE_SPAWN },
      '46,47': { to: 'store', toSpawn: STORE_SPAWN },
      '47,47': { to: 'store', toSpawn: STORE_SPAWN },
      // Cửa hàng Gacha (ô io 54,46 — gacha_door trong objectgroup doors của home_town.json) → vào cửa hàng Gacha
      '54,46': { to: 'gacha_store', toSpawn: 'gacha_store_door' },
       // Đấu trường trực tuyến (ô io 56,46/57,46) → vào Arena PvP
       '56,46': { to: 'arena', toSpawn: { x: 160, y: 160 } },
       '57,46': { to: 'arena', toSpawn: { x: 160, y: 160 } },
       // Cửa ra đấu trường (ô io 9,19/10,19 trong doors của arena.json) → ra thị trấn tại cửa arena_door
       '9,19': { to: TOWN_ID, toSpawn: 'arena_door' },
       '10,19': { to: TOWN_ID, toSpawn: 'arena_door' },
    },
    // Cấu hình Pokémon hoang dã (Wild Encounter) — bộ đếm: cứ mỗi intervalMs
    // lại xuất hiện 1 Pokémon ngẫu nhiên; nếu không tương tác sẽ biến mất sau despawnMs.
    encounters: {
      enabled: true,
      intervalMs: 30000,
      despawnMs: 60000,
      maxActive: 1,
      cooldownMs: 12000,
      pool: [
        { species: 'Pikachu', weight: 30 },
        { species: 'Eevee', weight: 25 },
        { species: 'Vulpix', weight: 15 },
        { species: 'Growlithe', weight: 15 },
        { species: 'Magikarp', weight: 10 },
        { species: 'Larvitar', weight: 5 },
      ],
    },
    // Điểm định vị trên minimap (tọa độ tâm, px thế giới — tile 16px).
    // type: 'location' = địa điểm thường (chấm vàng) | 'quest' = mục tiêu nhiệm vụ (chấm đỏ nhấp nháy)
    spots: [
      { id: 'house_door', name: 'Nhà của bạn', type: 'location', x: 504, y: 312, icon: '🏠' },
      { id: 'lab_door', name: 'Phòng Lab', type: 'location', x: 728, y: 456, icon: '🧪' },
      { id: 'market_door', name: 'Chợ', type: 'location', x: 264, y: 456, icon: '🏪' },
      { id: 'hospital_door', name: 'Bệnh viện', type: 'location', x: 264, y: 456, icon: '🏥' },
      { id: 'store_door', name: 'Cửa hàng', type: 'location', x: 752, y: 752, icon: '🛒' },
      { id: 'fire_gym', name: 'Phòng Gym Lửa', type: 'location', x: 424, y: 736, icon: '🔥' },
      { id: 'gacha_door', name: 'Cửa hàng Gacha', type: 'location', x: 872, y: 744, icon: '🎁' },
      { id: 'arena_door', name: 'Đấu Trường Trực Tuyến', type: 'location', x: 904, y: 736, icon: '🌐' },
    ],
  },
  house: {
    id: 'house',
    name: 'Nhà của bạn',
    kind: 'tiled',
    src: '/images/map/main_house/main_house.json',
    tileSize: 16,
    zoom: 2,
    playerScale: 1,
    width: 64,
    height: 96,
    spawn: HOUSE_SPAWN,
    transitions: {
      // Ô io trong nhà → ra thị trấn tại cửa nhà chính
      '2,0': { to: TOWN_ID, toSpawn: TOWN_HOUSE_DOOR_SPAWN },
    },
    spots: [
      { id: 'door_out', name: 'Cửa ra thị trấn', type: 'location', x: 40, y: 8, icon: '🚪' },
    ],
  },
  lab: {
    id: 'lab',
    name: 'Phòng Lab của Giáo sư Oak',
    kind: 'tiled',
    src: `/images/map/labOak/labPokemon.json`,
    tileSize: 16,
    zoom: 2,
    playerScale: 1,
    width: 240,
    height: 240,
    spawn: LAB_SPAWN,
    transitions: {
      // Ô io trong lab → ra thị trấn trước cửa tòa nhà phải (cửa lab)
      '7,2': { to: TOWN_ID, toSpawn: TOWN_LAB_DOOR_SPAWN },
    },
    spots: [
      { id: 'oak', name: 'Giáo sư Oak', type: 'location', x: 120, y: 152, icon: '👨‍🔬' },
      { id: 'door_out', name: 'Cửa ra thị trấn', type: 'location', x: 120, y: 40, icon: '🚪' },
    ],
  },
  hospital: {
    id: 'hospital',
    name: 'Bệnh viện Pokémon',
    kind: 'tiled',
    src: '/images/map/hospital/hospital.json',
    tileSize: 16,
    zoom: 2,
    playerScale: 1,
    width: 256,
    height: 256,
    spawn: HOSPITAL_SPAWN,
    transitions: {
      // Cửa ra bệnh viện (ô io 7,12 / 8,12 / 9,12 — door_out trong objectgroup doors của hospital.json) → ra thị trấn trước cửa bệnh viện
      '7,12': { to: TOWN_ID, toSpawn: TOWN_HOSPITAL_DOOR_SPAWN },
      '8,12': { to: TOWN_ID, toSpawn: TOWN_HOSPITAL_DOOR_SPAWN },
      '9,12': { to: TOWN_ID, toSpawn: TOWN_HOSPITAL_DOOR_SPAWN },
    },
    spots: [
      { id: 'nurse', name: 'Y tá', type: 'location', x: 128, y: 104, icon: '🏥' },
      { id: 'door_out', name: 'Cửa ra', type: 'location', x: 128, y: 240, icon: '🚪' },
    ],
  },
  store: {
    id: 'store',
    name: 'Cửa hàng',
    kind: 'tiled',
    src: '/images/map/store/store.json',
    tileSize: 16,
    zoom: 2,
    playerScale: 1,
    width: 304,
    height: 256,
    spawn: STORE_SPAWN,
    transitions: {
      // Cửa ra cửa hàng (ô io 4,14→7,15 — store_door trong objectgroup doors của store.json) → ra thị trấn trước cửa hàng
      '4,14': { to: TOWN_ID, toSpawn: TOWN_STORE_DOOR_SPAWN },
      '5,14': { to: TOWN_ID, toSpawn: TOWN_STORE_DOOR_SPAWN },
      '6,14': { to: TOWN_ID, toSpawn: TOWN_STORE_DOOR_SPAWN },
      '7,14': { to: TOWN_ID, toSpawn: TOWN_STORE_DOOR_SPAWN },
      '4,15': { to: TOWN_ID, toSpawn: TOWN_STORE_DOOR_SPAWN },
      '5,15': { to: TOWN_ID, toSpawn: TOWN_STORE_DOOR_SPAWN },
      '6,15': { to: TOWN_ID, toSpawn: TOWN_STORE_DOOR_SPAWN },
      '7,15': { to: TOWN_ID, toSpawn: TOWN_STORE_DOOR_SPAWN },
    },
    spots: [
      { id: 'counter', name: 'Quầy thu ngân', type: 'location', x: 96, y: 88, icon: '🛒' },
      { id: 'door_out', name: 'Cửa ra thị trấn', type: 'location', x: 96, y: 232, icon: '🚪' },
    ],
  },
  gacha_store: {
    id: 'gacha_store',
    name: 'Cửa hàng Gacha',
    kind: 'tiled',
    src: '/images/map/gacha_store/gacha_store.json',
    tileSize: 16,
    zoom: 1.5,
    playerScale: 1,
    width: 480,
    height: 416,
    spawn: GACHA_STORE_SPAWN,
    transitions: {
      // Cửa ra cửa hàng Gacha (ô io 13,23→16,25 — gacha_store_door trong objectgroup doors của gacha_store.json) → ra thị trấn trước cửa Gacha
      '13,23': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '14,23': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '15,23': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '16,23': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '13,24': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '14,24': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '15,24': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '16,24': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '13,25': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '14,25': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '15,25': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
      '16,25': { to: TOWN_ID, toSpawn: TOWN_GACHA_DOOR_SPAWN },
    },
    spots: [
      { id: 'gacha_npc', name: 'Máy Gacha', type: 'location', x: 248, y: 104, icon: '🎁' },
      { id: 'door_out', name: 'Cửa ra thị trấn', type: 'location', x: 240, y: 392, icon: '🚪' },
    ],
  },
  arena: {
    id: 'arena',
    name: 'Đấu Trường Trực Tuyến',
    kind: 'tiled',
    src: '/images/map/arena/arena.json',
    tileSize: 16,
    zoom: 2,
    playerScale: 1,
    width: 320,
    height: 320,
    spawn: { x: 160, y: 160 },
    spots: [
      { id: 'james_npc', name: 'James', type: 'location', x: 160, y: 80, icon: '🌐' },
      { id: 'door_out', name: 'Cửa ra thị trấn', type: 'location', x: 160, y: 304, icon: '🚪' },
    ],
  },
}

export function getMap(mapId) {
  return MAPS[mapId] || MAPS[TOWN_ID]
}

export function getMapTransitions(mapId) {
  return getMap(mapId).transitions || {}
}

// ==========================================
// TILESET: TỰ ĐỘNG ĐỌC TỪ JSON — đổi/thêm/bỏ tileset trong Tiled
// chỉ cần export lại JSON + refresh, không cần sửa code.
// ==========================================
const encodePath = (p) => p.split('/').filter(Boolean).map(encodeURIComponent).join('/')
const baseDir = (url) => url.slice(0, url.lastIndexOf('/') + 1)

// Objectgroup `spawns` (tên = điểm xuất hiện, `start` = mặc định khi vào map).
// Hỗ trợ cả objectgroup `spawn` cũ (1 object) → coi là `start`.
export function parseSpawns(json) {
  const spawns = {}
  for (const layer of json.layers || []) {
    if (layer.type !== 'objectgroup') continue
    if (layer.name === 'spawns') {
      for (const obj of layer.objects || []) {
        const props = Object.fromEntries((obj.properties || []).map((p) => [p.name, p.value]))
        spawns[obj.name || 'start'] = {
          x: obj.x + (obj.width || 0) / 2,
          y: obj.y + (obj.height || 0) / 2,
          facing: props.facing || null,
        }
      }
    } else if (layer.name === 'spawn' && !spawns.start) {
      const obj = layer.objects?.[0]
      if (obj) {
        spawns.start = {
          x: obj.x + (obj.width || 0) / 2,
          y: obj.y + (obj.height || 0) / 2,
          facing: null,
        }
      }
    }
  }
  return spawns
}

// Objectgroup `doors` → map `"col,row"` → transition {to, toSpawn, ...}.
// Cửa rect rộng nhiều ô sẽ tự nở ra mọi tile bị phủ.
// Object không có property `to` (marker NPC/trang trí) → KHÔNG phải cửa, bị bỏ qua.
export function parseDoors(json) {
  const doors = {}
  const layer = (json.layers || []).find((l) => l.type === 'objectgroup' && l.name === 'doors')
  if (!layer) return doors
  const ts = json.tilewidth || 16
  for (const obj of layer.objects || []) {
    const props = Object.fromEntries((obj.properties || []).map((p) => [p.name, p.value]))
    if (!props.to) continue
    const w = obj.width || ts
    const h = obj.height || ts
    const c0 = Math.floor(obj.x / ts)
    const c1 = Math.floor((obj.x + w - 1) / ts)
    const r0 = Math.floor(obj.y / ts)
    const r1 = Math.floor((obj.y + h - 1) / ts)
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        doors[`${c},${r}`] = { ...props }
      }
    }
  }
  return doors
}

// Spawn của map theo tên (đã được getMapTilesets nạp vào mapInfo.spawns)
export function getMapSpawn(mapId, name) {
  return getMap(mapId).spawns?.[name] || null
}

// `ts.image` là tên file đặt cạnh map JSON (town) hoặc path tuyệt đối chứa
// `/images/map/` (house: `../../Pokemon/framework/public/images/map/...`).
export async function getMapTilesets(mapId) {
  const mapInfo = getMap(mapId)
  if (mapInfo.kind !== 'tiled') return []
  if (mapInfo.tilesets && mapInfo.spawns) return mapInfo.tilesets
  const res = await fetch(mapInfo.src)
  const json = await res.json()
  const root = '/images/map'
  const tilesets = json.tilesets.map((ts) => {
    const idx = ts.image.indexOf(root)
    const url =
      idx !== -1
        ? root + '/' + encodePath(ts.image.slice(idx + root.length))
        : baseDir(mapInfo.src) + encodePath(ts.image)
    return { name: ts.name, imageUrl: url }
  })
  mapInfo.tilesets = tilesets
  mapInfo.spawns = parseSpawns(json)
  mapInfo.doors = parseDoors(json)
  return tilesets
}