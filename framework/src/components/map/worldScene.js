// ==========================================
// WORLDSCENE: SCENE PHASER CHO BẢN ĐỒ THẾ GIỚI (đa scene)
// - town : thị trấn (legacy — lưới + obstacles + locations)
// - tiled: interior export Tiled (JSON) — tile 16px, camera zoom 2
// ==========================================
import Phaser from 'phaser'
import { LOCATIONS, getLocationAt } from '../../game/world.js'
import {
  TILE_SIZE,
  TILE_TREE,
  TILE_WALL,
  getMapGrid,
  autoGrassTile,
} from '../../game/worldmap.js'
import { TOWN_ID, getMap, getMapTransitions } from '../../game/maps.js'
import { store } from '../../game/store.js'
import { rollWildEncounter } from '../../game/capture.js'

// Runtime truyền từ Vue (gọi setWorldRuntime TRƯỚC khi khởi tạo Phaser.Game)
// để chắc chắn có giá trị khi scene create() chạy (bất kể timing boot của Phaser).
let runtime = { callbacks: {}, startPos: null, onboardingTarget: null, encounters: null }
export function setWorldRuntime(rt) {
  if (rt.callbacks) runtime.callbacks = rt.callbacks
  if ('startPos' in rt) runtime.startPos = rt.startPos
  if ('onboardingTarget' in rt) runtime.onboardingTarget = rt.onboardingTarget
  if ('encounters' in rt) runtime.encounters = rt.encounters
}

const PLAYER_SPEED = 160

// Trạng thái encounter toàn cục (chỉ tồn tại trong session, không lưu vào save)
const wildEncounterState = {
  active: null,        // { id, col, row, x, y, pokemon, sprite, mapId }
  spawnTimer: 0,       // Bộ đếm: mỗi intervalMs lại spawn 1 Pokémon
  despawnTimer: 0,     // Bộ đếm thời gian tồn tại — hết hạn thì biến mất nếu không tương tác
  cooldownTimer: 0,    // Cooldown sau khi bắt/thất bại
}

// Property tương tác trên TILE (gid) — value >= 2, ghi đè property layer nếu có
function tileInteractProp(json, gid) {
  const tileset = json.tilesets.find((t) => gid >= t.firstgid && gid < t.firstgid + t.tilecount)
  if (!tileset || !tileset.tiles) return null
  const tile = tileset.tiles.find((tl) => tl.id === gid - tileset.firstgid)
  if (!tile?.properties) return null
  return tile.properties.find((p) => p.value >= 2) || null
}

// Property phân loại layer: value = 1 → blocked, value >= 2 → layer tương tác
function layerLogicProp(layer) {
  return (layer.properties || []).find((p) => p.value === 1 || p.value >= 2) || null
}

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene')
  }

  init(data) {
    this.mapId = data?.mapId || store.worldPos?.mapId || TOWN_ID
    this.mapInfo = getMap(this.mapId)
    this.callbacks = data?.callbacks || runtime.callbacks || {}
    // Default spawn của map (spawns.start từ JSON) chỉ dùng khi không có vị trí rõ ràng
    // (đi qua cửa luôn truyền startPos đã resolve → không bị ghi đè).
    this.startPos = { ...(data?.startPos || runtime.startPos || this.mapInfo.spawns?.start || this.mapInfo.spawn) }
    this.lastInRangeLocId = null
    this.debounce = 0
    this.lastFacing = 'down'
    this.currentAnim = null
    this.interactPoints = []
    this.transitions = getMapTransitions(this.mapId) // fallback maps.js; buildTiled sẽ ghi đè bằng doors từ JSON
    this.spawns = this.mapInfo.spawns || {}
    this.moveSpeed = PLAYER_SPEED / this.mapInfo.zoom // giữ tốc độ trên màn hình nhất quán giữa các map
    this.locked = false

    // Cấu hình encounter từ runtime (được truyền từ WorldMap.vue qua setWorldRuntime)
    this.encounterConfig = data?.encounters || runtime.encounters || this.mapInfo.encounters || { enabled: false }
    this.encounterState = wildEncounterState
    // Reset encounter khi đổi map và tránh dùng lại timer từ scene trước.
    if (this.encounterState.active && this.encounterState.active.mapId !== this.mapId) {
      this.clearWildEncounter()
    }
    this.encounterState.active = this.encounterState.active?.mapId === this.mapId ? this.encounterState.active : null
    // Seed spawnTimer gần đạt ngưỡng để Pokémon ĐẦU TIÊN xuất hiện sau ~5s,
    // sau đó cứ mỗi intervalMs lại xuất hiện tiếp.
    this.encounterState.spawnTimer = Math.max(0, (this.encounterConfig.intervalMs || 30000) - 5000)
    this.encounterState.despawnTimer = 0
    this.encounterTickTimer = 0
  }

  // Khóa/ mở khóa di chuyển nhân vật (dùng khi hội thoại onboarding đang mở)
  setLocked(locked) {
    this.locked = !!locked
    if (this.locked && this.player) {
      this.player.setVelocity(0, 0)
      if (this.currentAnim) {
        this.player.stop()
        this.currentAnim = null
      }
    }
  }

  // tileset đã được WorldMap.vue resolve sẵn từ JSON (maps.getMapTilesets)
  preload() {
    // Báo tiến trình tải asset (map JSON + tileset PNG + sprite player) cho màn hình chuyển cảnh
    this.load.off('progress')
    this.load.on('progress', (v) => runtime.callbacks.onLoadProgress?.(v))
    this.load.spritesheet('player', '/images/map/player_red.png', {
      frameWidth: 16,
      frameHeight: 32,
    })
    if (this.mapInfo.kind === 'legacy') {
      this.load.image('terrain', '/images/map/terrain.png')
    } else {
      this.load.json('mapjson_' + this.mapId, this.mapInfo.src)
      for (const ts of this.mapInfo.tilesets || []) {
        if (!this.textures.exists(ts.name)) this.load.image(ts.name, ts.imageUrl)
      }
    }
  }

  create() {
    if (this.mapInfo.kind === 'tiled') {
      this.buildTiled()
    } else {
      this.buildTerrain()
      this.buildWalls()
      this.buildBuildings()
    }

    this.buildPlayer()

    // Phòng Lab của Giáo sư Oak — vẽ NPC + điểm nói chuyện
    if (this.mapId === 'lab') {
      this.buildLabProps()
    }

    // Cửa hàng — vẽ nhân viên bán hàng đứng sau quầy (object store_npc)
    if (this.mapId === 'store') {
      this.buildStoreProps()
    }

    // Cửa hàng Gacha — vẽ nhân viên đứng trước máy gacha (object gacha_npc)
    if (this.mapId === 'gacha_store') {
      this.buildGachaStoreProps()
    }

    // Marker chỉ dẫn cho người chơi mới (trỏ tới cửa đích)
    this.buildOnboardingMarker()

    // Camera — interior (Tiled) nền đen; map nhỏ hơn màn hình thì giữ chính giữa
    this.cameras.main.setBackgroundColor(this.mapInfo.kind === 'tiled' ? '#000000' : '#7dd3fc')
    this.cameras.main.setZoom(this.mapInfo.zoom)
    this.cameras.main.setRoundPixels(true)
    // Ưu tiên kích thước thực từ JSON (đã ghi trong buildTiled); fallback maps.js cho map legacy
    const mapW = this.actualMapW || this.mapInfo.width
    const mapH = this.actualMapH || this.mapInfo.height
    const zoomedW = mapW * this.mapInfo.zoom
    const zoomedH = mapH * this.mapInfo.zoom
    if (zoomedW <= this.scale.width && zoomedH <= this.scale.height) {
      // Map vừa đủ màn hình → căn giữa nguyên bản đồ (không follow)
      this.cameras.main.centerOn(mapW / 2, mapH / 2)
    } else {
      this.cameras.main.setBounds(0, 0, mapW, mapH)
      // Căn giữa camera tại tâm map để người chơi thấy ngay toàn bộ phòng/map
      // (follow vẫn bật để trôi theo nhân vật khi di chuyển)
      this.cameras.main.centerOn(mapW / 2, mapH / 2)
      this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    }

    // Input
    this.cursors = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT')

    // Gửi trạng thái ban đầu cho Vue (minimap)
    this.callbacks.onMapInfo?.(this.mapId, this.mapInfo)
    this.callbacks.onPlayerPos?.(this.player.x, this.player.y)
    // Chống loop khi mở lại mà đang đứng trong vùng tương tác
    this.lastInRangeLocId = this.getInteractTarget()?.id ?? null
  }

  // ======================================================================
  // MAP LEGACY (THỊ TRẤN)
  // ======================================================================
  // --- ĐỊA HÌNH (lưới 50x32, 0 = cỏ tự động; vẽ cây/tường building vào tile) ---
  buildTerrain() {
    const grid = getMapGrid()
    const render = grid.map((row, r) =>
      row.map((v, c) => {
        let t = v === 0 ? autoGrassTile(c, r) : v
        for (const o of this.mapInfo.obstacles || []) {
          const tag = o.id[0]
          if (tag !== 't' && tag !== 'b') continue
          const c0 = Math.floor(o.x / TILE_SIZE)
          const c1 = Math.floor((o.x + o.w - 1) / TILE_SIZE)
          const r0 = Math.floor(o.y / TILE_SIZE)
          const r1 = Math.floor((o.y + o.h - 1) / TILE_SIZE)
          if (c >= c0 && c <= c1 && r >= r0 && r <= r1) {
            t = tag === 'b' ? TILE_WALL : TILE_TREE
            break
          }
        }
        return t
      }),
    )
    const map = this.make.tilemap({ data: render, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE })
    const tileset = map.addTilesetImage('terrain', 'terrain', TILE_SIZE, TILE_SIZE, 0, 0)
    map.createLayer(0, tileset)
  }

  // --- VA CHẠM TĨNH (toàn bộ OBSTACLES: biên, building, ao, cây) ---
  buildWalls() {
    this.walls = this.physics.add.staticGroup()
    for (const o of this.mapInfo.obstacles || []) {
      const wall = this.add
        .rectangle(o.x + o.w / 2, o.y + o.h / 2, o.w, o.h)
        .setVisible(false)
      this.walls.add(wall)
    }
  }

  // --- BUILDINGS (nền + icon + nhãn) ---
  buildBuildings() {
    const buildings = LOCATIONS.filter((l) => ['house', 'shop', 'gym', 'arena'].includes(l.id))
    for (const loc of buildings) {
      const cx = loc.x + loc.w / 2
      const cy = loc.y + loc.h / 2

      // Nền building (mái nhà bo góc)
      const g = this.add.graphics()
      g.fillStyle(0xffffff, 0.92)
      g.fillRoundedRect(loc.x, loc.y, loc.w, loc.h, 8)
      g.lineStyle(3, 0xcbd5e1, 1)
      g.strokeRoundedRect(loc.x, loc.y, loc.w, loc.h, 8)

      // Icon (emoji)
      this.add.text(cx, loc.y + 18, loc.icon, {
        fontSize: '34px',
      }).setOrigin(0.5, 0)

      // Nhãn
      this.add.text(cx, cy + loc.h / 2 - 22, loc.name, {
        fontSize: '13px',
        fontFamily: 'system-ui, sans-serif',
        color: '#334155',
        fontStyle: 'bold',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: { x: 6, y: 2 },
      }).setOrigin(0.5, 1).setDepth(5)
    }
  }

  // ======================================================================
  // MAP TILED (INTERIOR)
  // ======================================================================
  buildTiled() {
    const json = this.cache.json.get('mapjson_' + this.mapId)
    if (!json) {
      console.error('❌ Không tải được map Tiled:', this.mapId)
      return
    }

    this.cache.tilemap.add('current', {
      format: Phaser.Tilemaps.Formats.TILED_JSON,
      data: json,
    })

    const map = this.make.tilemap({ key: 'current' })
    // Kích thước thực (px) từ JSON — camera/bounds tin kích thước này thay vì maps.js,
    // tránh lệch camera nếu export map đổi kích thước mà quên cập nhật maps.js.
    this.actualMapW = map.width * map.tileWidth
    this.actualMapH = map.height * map.tileHeight
    if (!this.mapInfo.tilesets?.length) {
      console.error('❌ Không resolve được tileset cho map Tiled:', this.mapId)
      return
    }
    const tilesets = this.mapInfo.tilesets
      .map((ts) => {
        const t = json.tilesets.find((x) => x.name === ts.name)
        if (!t) return null
        return map.addTilesetImage(ts.name, ts.name, t.tilewidth, t.tileheight, t.margin || 0, t.spacing || 0)
      })
      .filter(Boolean)

    // Tạo mọi layer hình ảnh (bỏ qua layer logic: value 1 = blocked, value >= 2 = tương tác)
    // Thứ tự render: layer cuối trong JSON (view_2) tạo TRƯỚC → layer đầu (view_1) đè lên trên,
    // để view_1 (nền/chi tiết trong suốt) chồng lên view_2 (lớp lấp lỗ trống) bên dưới.
    for (let li = json.layers.length - 1; li >= 0; li--) {
      const layer = json.layers[li]
      if (layer.type !== 'tilelayer') continue
      if (layerLogicProp(layer)) continue
      map.createLayer(layer.name, tilesets)
    }

    this.walls = this.physics.add.staticGroup()

    // Objectgroup `colliders` — rect chặn (đồ đạc, tường phụ)
    const collidersLayer = map.getObjectLayer?.('colliders')
    if (collidersLayer) {
      for (const obj of collidersLayer.objects) {
        const w = obj.width || map.tileWidth
        const h = obj.height || map.tileHeight
        const wall = this.add.rectangle(obj.x + w / 2, obj.y + h / 2, w, h).setVisible(false)
        this.walls.add(wall)
      }
    }

    // Layer value = 1 — mọi tile ≠ 0 = ô chặn, không đi qua được
    this.buildBlockedLayers(json)

    // Doors + Spawns từ objectgroup trong JSON (JSON ưu tiên, maps.js làm fallback).
    // KHÔNG ghi đè startPos ở đây — default spawn đã được init() áp dụng khi không có vị trí rõ ràng.
    this.transitions = { ...getMapTransitions(this.mapId), ...(this.mapInfo.doors || {}) }

    // Điểm tương tác cửa (io) sinh từ objectgroup `doors` trong JSON (toạ độ cửa đã có sẵn)
    this.interactPoints = this.buildDoorPoints(map.tileWidth)

    // Các layer tương tác khác (healing / quest / dialogue)
    this.interactPoints.push(...this.buildInteractPoints(json, map.tileWidth))

    // NPC marker (object tên `*_npc` trong objectgroup doors) — điểm tương tác đứng cạnh quầy
    this.interactPoints.push(...this.buildNpcPoints(json, map.tileWidth))

    // Điểm nói chuyện với Giáo sư Oak (ô 7,9 — ngay dưới bàn thí nghiệm)
    if (this.mapId === 'lab') {
      this.interactPoints.push({
        id: 'oak',
        col: 7,
        row: 9,
        type: 'quest',
        name: 'Giáo sư Oak',
        value: 1,
        x: 7 * map.tileWidth + map.tileWidth / 2,
        y: 9 * map.tileWidth + map.tileWidth / 2,
        radius: 16,
      })
    }
  }

  // Vẽ NPC Giáo sư Oak đứng sau bàn thí nghiệm trong lab
  buildLabProps() {
    const g = this.add.graphics()
    g.setDepth(5)
    // Lab coat (thân)
    g.fillStyle(0xf1f5f9, 1)
    g.fillRoundedRect(112, 100, 16, 30, 6)
    g.fillStyle(0x475569, 1)
    g.fillRect(116, 106, 8, 3)
    // Đầu
    g.fillStyle(0xfcd34d, 1)
    g.fillCircle(120, 90, 9)
    // Tóc bạc
    g.fillStyle(0xe2e8f0, 1)
    g.fillCircle(120, 84, 5)
    g.fillRect(112, 85, 16, 3)
  }

  // Vẽ nhân viên bán hàng đứng sau quầy trong cửa hàng — mỗi object `*_npc`
  // trong objectgroup doors của store.json (đồng bộ vị trí với buildNpcPoints).
  buildStoreProps() {
    const json = this.cache.json.get('mapjson_' + this.mapId)
    const doors = (json?.layers || []).find((l) => l.type === 'objectgroup' && l.name === 'doors')
    const npcs = (doors?.objects || []).filter((o) => /^.+_npc$/.test(o.name || ''))
    for (const obj of npcs) {
      const cx = obj.x + (obj.width || 0) / 2
      const cy = obj.y + (obj.height || 0) / 2
      const g = this.add.graphics()
      g.setDepth(5)
      // Thân (tạp dề xanh của nhân viên)
      g.fillStyle(0x38bdf8, 1)
      g.fillRoundedRect(cx - 7, cy - 2, 14, 24, 6)
      // Đầu
      g.fillStyle(0xfcd34d, 1)
      g.fillCircle(cx, cy - 11, 8)
      // Tóc
      g.fillStyle(0x92400e, 1)
      g.fillCircle(cx, cy - 13, 5)
      g.fillRect(cx - 8, cy - 17, 16, 3)
    }
  }

  // Vẽ nhân viên bán hàng Gacha đứng giữa các máy gacha trong cửa hàng Gacha — mỗi
  // object `*_npc` trong objectgroup doors của gacha_store.json (đồng bộ buildNpcPoints).
  buildGachaStoreProps() {
    const json = this.cache.json.get('mapjson_' + this.mapId)
    const doors = (json?.layers || []).find((l) => l.type === 'objectgroup' && l.name === 'doors')
    const npcs = (doors?.objects || []).filter((o) => /^.+_npc$/.test(o.name || ''))
    for (const obj of npcs) {
      const cx = obj.x + (obj.width || 0) / 2
      const cy = obj.y + (obj.height || 0) / 2
      const g = this.add.graphics()
      g.setDepth(5)
      // Thân (đồng phục tím của nhân viên gacha)
      g.fillStyle(0xc084fc, 1)
      g.fillRoundedRect(cx - 7, cy - 2, 14, 24, 6)
      // Đầu
      g.fillStyle(0xfcd34d, 1)
      g.fillCircle(cx, cy - 11, 8)
      // Tóc (hồng)
      g.fillStyle(0xec4899, 1)
      g.fillCircle(cx, cy - 13, 5)
      g.fillRect(cx - 8, cy - 17, 16, 3)
      // Quả bóng gacha cầm tay
      g.fillStyle(0xf43f5e, 1)
      g.fillCircle(cx + 10, cy - 4, 3)
    }
  }

  // Marker nhấp nháy trỏ tới cửa đích khi mới chơi (chỉ hiện trên map đang ở)
  buildOnboardingMarker() {
    const t = runtime.onboardingTarget
    if (!t || t.mapId !== this.mapId) {
      this.onboardMarker = null
      return
    }
    const ts = this.mapInfo.tileSize || 16
    const x = t.col * ts + ts / 2
    const y = t.row * ts - 8
    const marker = this.add.text(x, y, '📍', { fontSize: '16px' }).setOrigin(0.5, 1).setDepth(1000001)
    this.tweens.add({
      targets: marker,
      y: y - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    })
    this.onboardMarker = marker
  }

  // Vẽ lại marker chỉ dẫn khi stage cốt truyện đổi (không cần restart scene)
  refreshOnboardingMarker() {
    if (this.onboardMarker) {
      this.onboardMarker.destroy()
      this.onboardMarker = null
    }
    this.buildOnboardingMarker()
  }

  // Layer va chạm: mọi tilelayer có property value = 1 → tile ≠ 0 là ô chặn
  buildBlockedLayers(json) {
    const ts = json.tilewidth || 16
    for (const layer of json.layers) {
      if (layer.type !== 'tilelayer') continue
      const prop = layer.properties?.find((p) => p.value === 1)
      if (!prop) continue
      for (let i = 0; i < layer.data.length; i++) {
        if (!layer.data[i]) continue
        const col = i % layer.width
        const row = Math.floor(i / layer.width)
        const wall = this.add
          .rectangle(col * ts + ts / 2, row * ts + ts / 2, ts, ts)
          .setVisible(false)
        this.walls.add(wall)
      }
    }
  }

  // Điểm tương tác cửa (io) từ objectgroup `doors` — mỗi ô cửa đã có transition,
  // không cần layer interact nữa. Điểm trang trí (cửa không có transition) tự được bỏ qua.
  buildDoorPoints(tileSize) {
    const points = []
    for (const key of Object.keys(this.mapInfo.doors || {})) {
      const [col, row] = key.split(',').map(Number)
      points.push({
        id: `door-${col}-${row}`,
        col,
        row,
        type: 'io',
        name: 'io',
        value: 2,
        x: col * tileSize + tileSize / 2,
        y: row * tileSize + tileSize,
      })
    }
    return points
  }

  buildInteractPoints(json, tileSize) {
    const points = []
    for (const layer of json.layers) {
      if (layer.type !== 'tilelayer') continue
      const layerProp = layer.properties?.find((p) => p.value >= 2)
      if (!layerProp) continue
      for (let i = 0; i < layer.data.length; i++) {
        const gid = layer.data[i]
        if (!gid) continue
        // Property trên tile (gid) ghi đè property layer
        const prop = tileInteractProp(json, gid) || layerProp
        const col = i % layer.width
        const row = Math.floor(i / layer.width)
        // Cửa (io) mà chưa có transition (objectgroup doors / maps.js) → điểm trang trí, bỏ qua
        if (prop.name === 'io' && !this.transitions[`${col},${row}`]) continue
        points.push({
          id: `tile-${col}-${row}`,
          col,
          row,
          type: prop.name,
          name: prop.name,
          value: prop.value,
          x: col * tileSize + tileSize / 2,
          y: row * tileSize + tileSize,
        })
      }
    }
    return points
  }

  // Điểm tương tác NPC từ objectgroup `doors` — object có tên kết thúc `_npc`
  // (marker điểm đánh dấu, rect 0x0) → tạo ô tương tác cỡ tile quanh tâm.
  // Object NPC không có property `to` nên parseDoors bỏ qua → không thành cửa.
  buildNpcPoints(json, tileSize) {
    const points = []
    const layer = (json.layers || []).find((l) => l.type === 'objectgroup' && l.name === 'doors')
    if (!layer) return points
    for (const obj of layer.objects || []) {
      if (!/^.+_npc$/.test(obj.name || '')) continue
      const cx = obj.x + (obj.width || 0) / 2
      const cy = obj.y + (obj.height || 0) / 2
      const col = Math.floor(cx / tileSize)
      const row = Math.floor(cy / tileSize)
      points.push({
        id: `npc-${obj.name}-${col}-${row}`,
        npcId: obj.name,
        col,
        row,
        type: 'npc',
        name: obj.name,
        value: 2,
        x: col * tileSize + tileSize / 2,
        y: row * tileSize + tileSize,
        radius: tileSize,
      })
    }
    return points
  }

  // ======================================================================
  // NGƯỜI CHƠI
  // ======================================================================
  buildPlayer() {
    if (!this.anims.exists('walk-down')) {
      const frame = (n) => ({ key: 'player', frame: n })
      this.anims.create({
        key: 'walk-down',
        frames: [frame(0), frame(3), frame(0), frame(4)],
        frameRate: 8,
        repeat: -1,
      })
      this.anims.create({
        key: 'walk-up',
        frames: [frame(1), frame(5), frame(1), frame(6)],
        frameRate: 8,
        repeat: -1,
      })
      this.anims.create({
        key: 'walk-left',
        frames: [frame(2), frame(7), frame(2), frame(8)],
        frameRate: 8,
        repeat: -1,
      })
    }

    this.physics.world.setBounds(0, 0, this.actualMapW || this.mapInfo.width, this.actualMapH || this.mapInfo.height)

    this.player = this.physics.add.sprite(this.startPos.x, this.startPos.y, 'player', 0)
    const s = this.mapInfo.playerScale
    this.player.setScale(s)
    this.player.setDepth(1000000)
    this.player.body.setSize(10 * s, 20 * s, true)
    this.player.body.setOffset(3 * s, 12 * s)
    this.player.body.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, this.walls)

    this.player.setFrame(0) // đứng nhìn xuống

    // DEBUG: vẽ hitbox body chữ nhật lên nhân vật để kiểm tra độ chuẩn
    this.debugBox = this.add.graphics()
    this.debugBox.setDepth(2000000)
  }

  // ======================================================================
  // VÒNG LẶP CHÍNH
  // ======================================================================
  update(time, delta) {
    if (!this.player || !this.cursors) return

    // Cập nhật wild encounter TRƯỚC khi bị khoá — bộ đếm 30s/60s chạy theo thời gian
    // thực kể cả khi hội thoại/modal đang mở, để không bị treo trong lúc onboarding.
    this.updateWildEncounter(delta)

    if (this.locked) return

    const keys = this.cursors
    let dx = 0
    let dy = 0
    if (keys.W.isDown || keys.UP.isDown) dy -= 1
    if (keys.S.isDown || keys.DOWN.isDown) dy += 1
    if (keys.A.isDown || keys.LEFT.isDown) dx -= 1
    if (keys.D.isDown || keys.RIGHT.isDown) dx += 1

    const moving = dx !== 0 || dy !== 0

    if (moving) {
      const len = Math.hypot(dx, dy)
      this.player.setVelocity((dx / len) * this.moveSpeed, (dy / len) * this.moveSpeed)

      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (absDy >= absDx) {
        this.lastFacing = dy < 0 ? 'up' : 'down'
        this.player.flipX = false
      } else {
        this.lastFacing = 'left'
        this.player.flipX = dx > 0 // right = mirror of left
      }

      const animKey = this.lastFacing === 'left' ? 'walk-left' : `walk-${this.lastFacing}`
      if (animKey !== this.currentAnim) {
        this.player.play(animKey)
        this.currentAnim = animKey
      }
    } else {
      this.player.setVelocity(0, 0)
      if (this.currentAnim) {
        this.player.stop()
        this.currentAnim = null
        if (this.lastFacing === 'down') this.player.setFrame(0)
        else if (this.lastFacing === 'up') this.player.setFrame(1)
        else this.player.setFrame(2)
      }
    }

    this.drawDebugBox()
    this.checkInteraction()
    this.callbacks.onPlayerPos?.(this.player.x, this.player.y)
  }

  // Vẽ lại hitbox mỗi frame (chỉ dùng để debug): body vật lý (xanh) +
  // rect tương tác phần chân (vàng — thứ thực sự dùng để trigger)
  drawDebugBox() {
    if (!this.debugBox || !this.player?.body) return
    const r = this.interactRect()
    const b = this.player.body
    this.debugBox.clear()
    this.debugBox.lineStyle(1, 0x00ff00, 1)
    this.debugBox.strokeRect(b.left, b.top, b.width, b.height)
    this.debugBox.lineStyle(1, 0xffff00, 1)
    this.debugBox.strokeRect(r.left, r.top, r.right - r.left, r.bottom - r.top)
  }

  // Rect tương tác = box nhỏ neo vào CHÂN nhân vật: lấy tâm (x, y) làm gốc,
  // ngang ± nửa chiều rộng, dọc từ chân (feet = y + nửa chiều cao sprite) lên
  // trên 8px. Box nằm DƯỚI tâm nên chân chạm ô cửa mới trigger — không bị sớm
  // do phần thân trên (đầu/ngực) chạm ô trước.
  interactRect() {
    const s = this.mapInfo.playerScale || 1
    const feet = this.player.y + 16 * s
    return {
      left: this.player.x - 5 * s,
      right: this.player.x + 5 * s,
      top: feet - 8 * s,
      bottom: feet,
    }
  }

  // ======================================================================
  // TƯƠNG TÁC (edge-triggered + debounce)
  // ======================================================================
  // Tìm điểm tương tác bằng AABB — box phần CHÂN của player phải thực sự
  // va chạm (chồng lên) ô tương tác ở cả 2 trục.
  // Không dùng khoảng cách hình tròn (hụt ở đường nối 2 ô + trigger sớm).
  getInteractTarget() {
    if (this.mapInfo.kind === 'legacy') {
      const loc = getLocationAt(this.player.x, this.player.y)
      return loc ? { id: loc.id, type: 'location', loc } : null
    }
    const r = this.interactRect()
    const ts = this.mapInfo.tileSize || 16
    for (const pt of this.interactPoints) {
      const tileL = pt.col * ts
      const tileT = pt.row * ts
      const tileR = tileL + ts
      const tileB = tileT + ts
      // Box phải nằm trùng cột với ô tương tác (khớp ngang)
      const overlapX = r.left < tileR && r.right > tileL
      // Box chồng lên ô theo chiều dọc → va chạm đã xảy ra
      const overlapY = r.top < tileB && r.bottom > tileT
      if (overlapX && overlapY) return pt
    }
    return null
  }

  checkInteraction() {
    if (!this.player) return
    const target = this.getInteractTarget()
    const inRangeId = target?.id ?? null

    if (inRangeId && inRangeId !== this.lastInRangeLocId && this.debounce <= 0) {
      this.lastInRangeLocId = inRangeId
      this.debounce = 30
      if (target.type === 'location') {
        const loc = target.loc
        if (loc.modes?.length) {
          this.callbacks.onShowPopover?.(loc)
        } else if (loc.mode) {
          this.callbacks.onOpen?.(loc.mode)
        }
      } else if (target.type === 'io') {
        this.handleTransition(target)
      } else if (target.type === 'wild') {
        this.handleWildEncounter(target)
      } else {
        this.callbacks.onTileInteract?.(target)
      }
    }

    if (!inRangeId) {
      this.lastInRangeLocId = null
    }
    if (this.debounce > 0) this.debounce--

    this.callbacks.onInRange?.(inRangeId)
  }

  // Cửa vào/ra (io): tìm transition theo vị trí ô (doors từ JSON ưu tiên, fallback maps.js)
  handleTransition(pt) {
    const t = this.transitions[`${pt.col},${pt.row}`]
    if (!t?.to) {
      console.warn('⚠️ Không có transition cho ô io tại', pt.col, pt.row, 'trên map', this.mapId)
      return
    }
    // Pass the full transition data so caller can handle special cases (e.g., gym)
    this.callbacks.onMapChange?.(t.to, t.toSpawn, t)
  }

  // ======================================================================
  // POKÉMON HOANG DÃ (WILD ENCOUNTER)
  // ======================================================================

  // Kiểm tra xem tile có thể spawn Pokémon không (không phải tường, cửa, NPC, vật cản)
  isValidSpawnTile(col, row) {
    const ts = this.mapInfo.tileSize || 16
    const x = col * ts + ts / 2
    const y = row * ts + ts / 2

    // Kiểm tra va chạm với walls
    for (const wall of this.walls?.getChildren() || []) {
      if (x >= wall.left && x <= wall.right && y >= wall.top && y <= wall.bottom) {
        return false
      }
    }

    // Kiểm tra trùng với interactPoints (cửa, NPC, healing, v.v.)
    for (const pt of this.interactPoints) {
      if (pt.col === col && pt.row === row) {
        return false
      }
    }

    // Kiểm tra trùng với player
    const playerCol = Math.floor(this.player.x / ts)
    const playerRow = Math.floor(this.player.y / ts)
    if (Math.abs(playerCol - col) <= 1 && Math.abs(playerRow - row) <= 1) {
      return false
    }

    // Kiểm tra trùng với encounter đang active
    if (this.encounterState.active && this.encounterState.active.col === col && this.encounterState.active.row === row) {
      return false
    }

    return true
  }

  // Tìm vị trí spawn hợp lệ ngẫu nhiên trong phạm vi quanh player
  findRandomSpawnPosition() {
    const ts = this.mapInfo.tileSize || 16
    const mapW = this.mapInfo.width
    const mapH = this.mapInfo.height
    const maxCol = Math.floor(mapW / ts)
    const maxRow = Math.floor(mapH / ts)

    const playerCol = Math.floor(this.player.x / ts)
    const playerRow = Math.floor(this.player.y / ts)

    // Tìm trong bán kính 10-20 tile quanh player
    const minRadius = 10
    const maxRadius = 20
    const candidates = []

    for (let r = minRadius; r <= maxRadius; r++) {
      for (let c = -r; c <= r; c++) {
        const cols = [playerCol + c, playerCol - c]
        const rows = [playerRow + r, playerRow - r]
        for (const col of cols) {
          for (const row of rows) {
            if (col >= 0 && col < maxCol && row >= 0 && row < maxRow) {
              if (this.isValidSpawnTile(col, row)) {
                candidates.push({ col, row })
              }
            }
          }
        }
        // Cạnh ngang
        for (const col of [playerCol - r, playerCol + r]) {
          for (let row = playerRow - r + 1; row <= playerRow + r - 1; row++) {
            if (col >= 0 && col < maxCol && row >= 0 && row < maxRow) {
              if (this.isValidSpawnTile(col, row)) {
                candidates.push({ col, row })
              }
            }
          }
        }
      }
    }

    if (candidates.length === 0) return null

    // Chọn ngẫu nhiên từ candidates
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  // Spawn Pokémon hoang dã
  spawnWildPokemon() {
    if (!this.encounterConfig.enabled) return
    if (this.encounterState.active) return // Đã có encounter
    if (this.encounterState.cooldownTimer > 0) return
    if ((this.encounterConfig.maxActive || 1) < 1) return

    const wildPokemon = rollWildEncounter(this.encounterConfig)
    if (!wildPokemon) return

    const spawnPos = this.findRandomSpawnPosition()
    if (!spawnPos) return

    const ts = this.mapInfo.tileSize || 16
    const x = spawnPos.col * ts + ts / 2
    const y = spawnPos.row * ts + ts / 2

    // Dấu chấm đỏ báo Pokémon hoang dã xuất hiện ngẫu nhiên trên bản đồ.
    const sprite = this.add.circle(x, y, 6, 0xef4444, 1)
      .setStrokeStyle(2, 0xffffff, 1)
      .setDepth(100000)

    // Hiệu ứng nhấp nháy
    this.tweens.add({
      targets: sprite,
      alpha: 0.4,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    })

    // Tạo interact point cho wild Pokémon
    const interactPoint = {
      id: `wild-${Date.now()}`,
      col: spawnPos.col,
      row: spawnPos.row,
      type: 'wild',
      name: 'wild',
      value: 2,
      x,
      y,
      radius: ts,
      pokemon: wildPokemon,
      sprite,
    }

    this.interactPoints.push(interactPoint)
    this.encounterState.active = {
      ...interactPoint,
      mapId: this.mapId,
    }

    // Bắt đầu đếm thời gian tồn tại — sau despawnMs sẽ biến mất nếu không tương tác
    this.encounterState.despawnTimer = 0

    // Báo Vue để vẽ chấm đỏ tương ứng trên minimap
    this.callbacks.onWildSpawn?.({ x, y, mapId: this.mapId })
  }

  // Xử lý khi player tương tác với Pokémon hoang dã
  handleWildEncounter(interactPoint) {
    if (!interactPoint.pokemon) return

    // Xóa encounter khỏi map
    this.clearWildEncounter()

    // Gọi callback để mở battle
    this.callbacks.onWildEncounter?.(interactPoint.pokemon)
  }

  // Xóa wild encounter hiện tại (khi bắt/bỏ chạy) — bắt đầu cooldown
  clearWildEncounter() {
    this.removeWildEncounter()
    // Bắt đầu cooldown trên đúng map đang chạy. Khi đổi map, encounter mới có thể sinh lại.
    this.encounterState.cooldownTimer = this.encounterConfig.cooldownMs || 12000
  }

  // Pokémon hoang dã hết thời gian tồn tại (không tương tác) → biến mất, không gây cooldown
  despawnWildPokemon() {
    this.removeWildEncounter()
    this.encounterState.cooldownTimer = 0
  }

  // Dọn sprite + interact point của wild encounter hiện tại
  removeWildEncounter() {
    if (this.encounterState.active) {
      // Xóa sprite
      if (this.encounterState.active.sprite) {
        this.encounterState.active.sprite.destroy()
      }
      // Xóa khỏi interactPoints
      const idx = this.interactPoints.findIndex(pt => pt.id === this.encounterState.active.id)
      if (idx !== -1) {
        this.interactPoints.splice(idx, 1)
      }
      this.encounterState.active = null
      this.encounterState.despawnTimer = 0
      this.callbacks.onWildClear?.()
    }
  }

  // Cập nhật encounter timer (gọi trong update)
  updateWildEncounter(delta) {
    if (!this.encounterConfig.enabled) return

    // Giảm cooldown timer
    if (this.encounterState.cooldownTimer > 0) {
      this.encounterState.cooldownTimer -= delta
      if (this.encounterState.cooldownTimer < 0) this.encounterState.cooldownTimer = 0
    }

    // Pokémon hoang dã chỉ tồn tại trong despawnMs — sau đó biến mất nếu không tương tác
    if (this.encounterState.active) {
      this.encounterState.despawnTimer += delta
      if (this.encounterState.despawnTimer >= (this.encounterConfig.despawnMs || 60000)) {
        this.despawnWildPokemon()
      }
    }

    // Bộ đếm spawn: cứ mỗi intervalMs lại có 1 Pokémon xuất hiện ngẫu nhiên
    this.encounterState.spawnTimer += delta
    if (this.encounterState.spawnTimer >= (this.encounterConfig.intervalMs || 30000)) {
      this.encounterState.spawnTimer = 0
      this.spawnWildPokemon()
    }

    // Báo Vue bộ đếm ~2 lần/giây để hiển thị đồng hồ đếm ngược + tự đồng bộ chấm đỏ minimap
    this.encounterTickTimer += delta
    if (this.encounterTickTimer >= 500) {
      this.encounterTickTimer = 0
      const activeEnc = this.encounterState.active
      const active = !!activeEnc
      const remainingMs = active
        ? Math.max(0, (this.encounterConfig.despawnMs || 60000) - this.encounterState.despawnTimer)
        : Math.max(0, (this.encounterConfig.intervalMs || 30000) - this.encounterState.spawnTimer)
      this.callbacks.onEncounterTick?.({
        active,
        remainingMs,
        mapId: this.mapId,
        x: activeEnc?.x ?? null,
        y: activeEnc?.y ?? null,
      })
    }
  }
}
