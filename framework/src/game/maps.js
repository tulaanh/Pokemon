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
    },
    // Điểm định vị trên minimap (tọa độ tâm, px thế giới — tile 16px).
    // type: 'location' = địa điểm thường (chấm vàng) | 'quest' = mục tiêu nhiệm vụ (chấm đỏ nhấp nháy)
    spots: [
      { id: 'house_door', name: 'Nhà của bạn', type: 'location', x: 504, y: 312, icon: '🏠' },
      { id: 'lab_door', name: 'Phòng Lab', type: 'location', x: 728, y: 456, icon: '🧪' },
      { id: 'market_door', name: 'Chợ', type: 'location', x: 264, y: 456, icon: '🏪' },
      { id: 'hospital_door', name: 'Bệnh viện', type: 'location', x: 264, y: 456, icon: '🏥' },
      { id: 'fire_gym', name: 'Phòng Gym Lửa', type: 'location', x: 424, y: 736, icon: '🔥' },
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
export function parseDoors(json) {
  const doors = {}
  const layer = (json.layers || []).find((l) => l.type === 'objectgroup' && l.name === 'doors')
  if (!layer) return doors
  const ts = json.tilewidth || 16
  for (const obj of layer.objects || []) {
    const props = Object.fromEntries((obj.properties || []).map((p) => [p.name, p.value]))
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