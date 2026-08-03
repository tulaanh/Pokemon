// ==========================================
// WORLD: BẢN ĐỒ THẾ GIỚI (đơn vị: px)
// ==========================================

export const WORLD_WIDTH = 1600
export const WORLD_HEIGHT = 1000

// ==========================================
// LOCATIONS: các địa điểm tương tác trên bản đồ
// ==========================================
// id: id duy nhất; name: tên hiển thị; x,y: tọa độ góc trên-trái;
// w,h: kích thước vùng tương tác; radius: bán kính tương tác;
// icon: emoji hiển thị;
// modes (mảng): địa điểm nhiều chức năng -> bật popover chọn chức năng;
// mode (chuỗi): địa điểm 1 chức năng -> gọi onOpen(mode) ngay khi tới gần
export const LOCATIONS = [
  // ==== Nhà người chơi (trung tâm thị trấn) ====
  { id: 'house', name: 'Nhà của bạn', x: 720, y: 360, w: 176, h: 136, radius: 56, icon: '🏠', modes: ['roster', 'merge', 'enter_house'] },
  // ==== Cửa hàng ====
  { id: 'shop', name: 'Cửa hàng', x: 1216, y: 376, w: 160, h: 120, radius: 56, icon: '🏪', modes: ['shop', 'inventory'] },
  // ==== Bãi tập luyện ====
  { id: 'gym', name: 'Bãi tập luyện', x: 416, y: 360, w: 160, h: 120, radius: 56, icon: '🏟️', mode: 'gym' },
  // ==== Đấu trường (cạnh nhà) ====
  { id: 'arena', name: 'Đấu trường', x: 960, y: 208, w: 112, h: 88, radius: 48, icon: '⚔️', mode: 'campaign' },
  // ==== Pokédex cạnh nhà ====
  { id: 'pokedex', name: 'Pokédex', x: 592, y: 384, w: 32, h: 32, radius: 48, icon: '📖', mode: 'roster' },
  // ==== Cây kẹo (nhặt kẹo kinh nghiệm) ====
  { id: 'candy_tree', name: 'Cây kẹo', x: 352, y: 168, w: 48, h: 48, radius: 56, icon: '🍬', mode: 'candy' },
  // ==== Bờ hồ (sự kiện nhỏ) ====
  { id: 'lake', name: 'Bờ hồ', x: 816, y: 584, w: 96, h: 64, radius: 48, icon: '🌊', mode: 'lake' },
]

// ==========================================
// SPAWN: điểm xuất hiện của người chơi
// ==========================================
export const SPAWN_POINT = { x: 800, y: 520 }

// ==========================================
// OBSTACLES: danh sách vật cản không đi qua được
// ==========================================
export const OBSTACLES = [
  { id: 'n1', x: 0, y: 0, w: 1600, h: 56 },
  { id: 'n2', x: 0, y: 944, w: 1600, h: 56 },
  { id: 'w1', x: 0, y: 0, w: 48, h: 1000 },
  { id: 'w2', x: 1552, y: 0, w: 48, h: 1000 },
  { id: 'b1', x: 720, y: 360, w: 176, h: 136 },
  { id: 'b2', x: 1216, y: 376, w: 160, h: 120 },
  { id: 'b3', x: 416, y: 360, w: 160, h: 120 },
  { id: 'b4', x: 960, y: 208, w: 112, h: 88 },
  { id: 'p1', x: 350, y: 350, w: 200, h: 150 },
  { id: 'p2', x: 1050, y: 350, w: 200, h: 150 },
  { id: 'p3', x: 650, y: 720, w: 120, h: 80 },
  { id: 't1', x: 144, y: 128, w: 32, h: 32 },
  { id: 't2', x: 208, y: 80, w: 32, h: 32 },
  { id: 't3', x: 288, y: 88, w: 32, h: 32 },
  { id: 't4', x: 112, y: 224, w: 32, h: 32 },
  { id: 't5', x: 208, y: 176, w: 32, h: 32 },
  { id: 't6', x: 288, y: 208, w: 32, h: 32 },
  { id: 't7', x: 160, y: 320, w: 32, h: 32 },
  { id: 't8', x: 96, y: 400, w: 32, h: 32 },
  { id: 't9', x: 176, y: 432, w: 32, h: 32 },
  { id: 't10', x: 288, y: 384, w: 32, h: 32 },
  { id: 't11', x: 128, y: 536, w: 32, h: 32 },
  { id: 't12', x: 224, y: 488, w: 32, h: 32 },
  { id: 't13', x: 112, y: 640, w: 32, h: 32 },
  { id: 't14', x: 208, y: 600, w: 32, h: 32 },
  { id: 't15', x: 128, y: 760, w: 32, h: 32 },
  { id: 't16', x: 208, y: 704, w: 32, h: 32 },
  { id: 't17', x: 288, y: 752, w: 32, h: 32 },
  { id: 't18', x: 96, y: 864, w: 32, h: 32 },
  { id: 't19', x: 176, y: 832, w: 32, h: 32 },
  { id: 't20', x: 272, y: 880, w: 32, h: 32 },
  { id: 't21', x: 368, y: 816, w: 32, h: 32 },
  { id: 't22', x: 448, y: 872, w: 32, h: 32 },
  { id: 't23', x: 1296, y: 128, w: 32, h: 32 },
  { id: 't24', x: 1360, y: 80, w: 32, h: 32 },
  { id: 't25', x: 1440, y: 88, w: 32, h: 32 },
  { id: 't26', x: 1264, y: 224, w: 32, h: 32 },
  { id: 't27', x: 1360, y: 176, w: 32, h: 32 },
  { id: 't28', x: 1440, y: 208, w: 32, h: 32 },
  { id: 't29', x: 1312, y: 320, w: 32, h: 32 },
  { id: 't30', x: 1248, y: 400, w: 32, h: 32 },
  { id: 't31', x: 1328, y: 432, w: 32, h: 32 },
  { id: 't32', x: 1440, y: 384, w: 32, h: 32 },
  { id: 't33', x: 1280, y: 536, w: 32, h: 32 },
  { id: 't34', x: 1376, y: 488, w: 32, h: 32 },
  { id: 't35', x: 1264, y: 640, w: 32, h: 32 },
  { id: 't36', x: 1360, y: 600, w: 32, h: 32 },
  { id: 't37', x: 1280, y: 760, w: 32, h: 32 },
  { id: 't38', x: 1360, y: 704, w: 32, h: 32 },
  { id: 't39', x: 1440, y: 752, w: 32, h: 32 },
  { id: 't40', x: 1264, y: 864, w: 32, h: 32 },
  { id: 't41', x: 1344, y: 832, w: 32, h: 32 },
  { id: 't42', x: 1440, y: 880, w: 32, h: 32 },
  { id: 't43', x: 368, y: 168, w: 32, h: 32 },
  { id: 't44', x: 416, y: 88, w: 32, h: 32 },
  { id: 't45', x: 480, y: 128, w: 32, h: 32 },
  { id: 't46', x: 560, y: 80, w: 32, h: 32 },
  { id: 't47', x: 656, y: 112, w: 32, h: 32 },
  { id: 't48', x: 496, y: 224, w: 32, h: 32 },
  { id: 't49', x: 624, y: 240, w: 32, h: 32 },
  { id: 't50', x: 768, y: 88, w: 32, h: 32 },
  { id: 't51', x: 848, y: 144, w: 32, h: 32 },
  { id: 't52', x: 912, y: 80, w: 32, h: 32 },
  { id: 't53', x: 1024, y: 128, w: 32, h: 32 },
  { id: 't54', x: 1088, y: 80, w: 32, h: 32 },
  { id: 't55', x: 1136, y: 176, w: 32, h: 32 },
  { id: 't56', x: 1104, y: 320, w: 32, h: 32 },
  { id: 't57', x: 432, y: 312, w: 32, h: 32 },
  { id: 't58', x: 336, y: 480, w: 32, h: 32 },
  { id: 't59', x: 384, y: 552, w: 32, h: 32 },
  { id: 't60', x: 512, y: 520, w: 32, h: 32 },
  { id: 't61', x: 640, y: 512, w: 32, h: 32 },
  { id: 't62', x: 1104, y: 504, w: 32, h: 32 },
  { id: 't63', x: 1184, y: 592, w: 32, h: 32 },
  { id: 't64', x: 1264, y: 512, w: 32, h: 32 },
  { id: 't65', x: 1184, y: 352, w: 32, h: 32 },
  { id: 't66', x: 112, y: 96, w: 32, h: 32 },
  { id: 't67', x: 368, y: 640, w: 32, h: 32 },
  { id: 't68', x: 1280, y: 96, w: 32, h: 32 },
  { id: 't69', x: 656, y: 864, w: 32, h: 32 },
  { id: 't70', x: 592, y: 816, w: 32, h: 32 },
  { id: 't71', x: 496, y: 832, w: 32, h: 32 },
  { id: 't72', x: 384, y: 768, w: 32, h: 32 },
  { id: 't73', x: 384, y: 688, w: 32, h: 32 },
  { id: 't74', x: 832, y: 784, w: 32, h: 32 },
  { id: 't75', x: 768, y: 840, w: 32, h: 32 },
  { id: 't76', x: 704, y: 792, w: 32, h: 32 },
  { id: 't77', x: 624, y: 768, w: 32, h: 32 },
  { id: 't78', x: 1120, y: 784, w: 32, h: 32 },
  { id: 't79', x: 1184, y: 824, w: 32, h: 32 },
  { id: 't80', x: 1248, y: 776, w: 32, h: 32 },
  { id: 't81', x: 1312, y: 688, w: 32, h: 32 },
  { id: 't82', x: 1312, y: 616, w: 32, h: 32 },
  { id: 't83', x: 1184, y: 680, w: 32, h: 32 },
  { id: 't84', x: 496, y: 640, w: 32, h: 32 },
  { id: 't85', x: 400, y: 592, w: 32, h: 32 },
  { id: 't86', x: 1280, y: 864, w: 32, h: 32 },
  { id: 't87', x: 1440, y: 824, w: 32, h: 32 },
  { id: 't88', x: 512, y: 880, w: 32, h: 32 },
  { id: 't89', x: 560, y: 88, w: 32, h: 32 },
  { id: 't90', x: 1312, y: 264, w: 32, h: 32 },
]

// ==========================================
// HELPERS: tiện ích cho bản đồ
// ==========================================

export function getBuildingColliders() {
  return OBSTACLES.filter(o => /^b\d+$/.test(o.id)).map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h }))
}

export function getLocationAt(x, y) {
  return LOCATIONS.find(loc => {
    const px = Math.min(Math.max(x, loc.x), loc.x + loc.w)
    const py = Math.min(Math.max(y, loc.y), loc.y + loc.h)
    const dx = x - px
    const dy = y - py
    return Math.sqrt(dx * dx + dy * dy) <= loc.radius
  })
}

export function isInInteractRange(x, y, loc) {
  const px = Math.min(Math.max(x, loc.x), loc.x + loc.w)
  const py = Math.min(Math.max(y, loc.y), loc.y + loc.h)
  const dx = x - px
  const dy = y - py
  return Math.sqrt(dx * dx + dy * dy) <= loc.radius
}
