// ==========================================
// DỮ LIỆU GAME (TÁCH TỪ pokemonData.js + gacha.js)
// ==========================================

export const TYPE_CHART = {
  Fire: { Grass: 1.5, Water: 0.75, Fire: 0.75, Rock: 0.75 },
  Water: { Fire: 1.5, Rock: 1.5, Grass: 0.75, Water: 0.75 },
  Grass: { Water: 1.5, Rock: 1.5, Fire: 0.75, Grass: 0.75 },
  Electric: { Water: 1.5, Grass: 0.75, Electric: 0.75, Rock: 0.5 },
  Rock: { Fire: 1.5, Electric: 1.5, Grass: 0.75, Water: 0.75 },
}

// Tên hiển thị chuẩn theo cơ chế mới: slow→choáng, buff_speed→+1 lượt đánh
export function getEffectLabel(effect) {
  if (!effect) return ''
  if (effect.type === 'stun') {
    // Ưu tiên tỷ lệ cố định (đã roll khi gắn skill); fallback hiển thị khoảng cho save cũ
    if (effect.chance !== undefined) {
      return `Choáng ${effect.chance}% (${effect.duration || 1} lượt)`
    }
    if (effect.chanceMin !== undefined) {
      return `Choáng ${effect.chanceMin}-${effect.chanceMax}% (1-${effect.durationMax || 2} lượt)`
    }
    return 'Choáng (Bỏ Lượt)'
  }
  if (effect.type === 'extra_turn') return 'Tăng Tốc (+1 Lượt Đánh)'
  return effect.name || effect.type
}

// Cấu hình stun theo rarity skill: khoảng tỷ lệ % ngẫu nhiên + độ thiên về % cao + xác suất ra 2 lượt
// Mọi rarity (trừ Mythic/Secret) đều chung khoảng 10-85% nhưng độ hiếm càng cao càng dễ roll ra % cao.
const STUN_CHANCE_RANGE = {
  Common: [10, 85],
  Rare: [10, 85],
  Epic: [10, 85],
  Legendary: [10, 85],
  Mythic: [50, 90],
  Secret: [80, 100],
}

// Độ thiên về tỷ lệ thấp (skew > 1 → càng khó ra % cao; nhỏ hơn → dễ ra % cao hơn)
// Rarity càng hiếm thì skew càng nhỏ → trong cùng khoảng vẫn dễ ra % cao hơn.
const STUN_SKEW = {
  Common: 1.6,
  Rare: 1.4,
  Epic: 1.2,
  Legendary: 1.0,
  Mythic: 0.8,
  Secret: 0.6,
}

const STUN_TWO_TURN_CHANCE = {
  Common: 0.25,
  Rare: 0.35,
  Epic: 0.45,
  Legendary: 0.55,
  Mythic: 0.65,
  Secret: 0.75,
}

export function getStunConfig(skillRarity) {
  let r = skillRarity || 'Common'
  let range = STUN_CHANCE_RANGE[r] || STUN_CHANCE_RANGE.Common
  return {
    chanceMin: range[0],
    chanceMax: range[1],
    durationMax: 2,
    twoTurnChance: STUN_TWO_TURN_CHANCE[r] !== undefined ? STUN_TWO_TURN_CHANCE[r] : 0.25,
  }
}

// Roll giá trị stun ngẫu nhiên theo rarity: tỷ lệ % + số lượt (1-2)
// Rarity càng hiếm thì xác suất ra % cao càng lớn (nhưng vẫn có thể ra % thấp).
export function rollStunConfig(skillRarity) {
  let cfg = getStunConfig(skillRarity)
  let r = skillRarity || 'Common'
  let skew = STUN_SKEW[r] !== undefined ? STUN_SKEW[r] : 1.0
  // Math.pow(Math.random(), skew): skew càng nhỏ kết quả càng gần 1 → thiên về % cao
  let chance = Math.round(cfg.chanceMin + (cfg.chanceMax - cfg.chanceMin) * Math.pow(Math.random(), skew))
  chance = Math.min(cfg.chanceMax, Math.max(cfg.chanceMin, chance))
  let duration = Math.random() < cfg.twoTurnChance ? 2 : 1
  return { chance, duration }
}

export const RARITY_LEVELS = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret']

export const RARITIES = [
  { name: 'Common', color: 'rarity-Common', statMult: 1.0, chance: 50.0, skillMin: 0.9, skillMax: 1.1 },
  { name: 'Rare', color: 'rarity-Rare', statMult: 1.2, chance: 30.0, skillMin: 1.1, skillMax: 1.3 },
  { name: 'Epic', color: 'rarity-Epic', statMult: 1.5, chance: 15.0, skillMin: 1.3, skillMax: 1.6 },
  { name: 'Legendary', color: 'rarity-Legendary', statMult: 2.0, chance: 4.0, skillMin: 1.6, skillMax: 2.0 },
  { name: 'Mythic', color: 'rarity-Mythic', statMult: 3.0, chance: 0.9, skillMin: 2.0, skillMax: 2.5 },
  { name: 'Secret', color: 'rarity-Secret', statMult: 5.0, chance: 0.1, skillMin: 2.5, skillMax: 3.5 },
]

export const POKEMON_SPECIES = [
  // --- HỆ LỬA (FIRE) 🔥 ---
  { name: 'Charizard', type: 'Fire', baseHp: 140, baseAtk: 28, baseDef: 18, baseSpeed: 120, baseInitMp: 35 },
  { name: 'Blaziken', type: 'Fire', baseHp: 130, baseAtk: 32, baseDef: 16, baseSpeed: 125, baseInitMp: 30 },
  { name: 'Arcanine', type: 'Fire', baseHp: 145, baseAtk: 29, baseDef: 20, baseSpeed: 115, baseInitMp: 25 },
  { name: 'Infernape', type: 'Fire', baseHp: 125, baseAtk: 30, baseDef: 17, baseSpeed: 130, baseInitMp: 30 },
  { name: 'Fuecoco', type: 'Fire', baseHp: 115, baseAtk: 21, baseDef: 16, baseSpeed: 95, baseInitMp: 25 },
  { name: 'Flareon', type: 'Fire', baseHp: 120, baseAtk: 31, baseDef: 18, baseSpeed: 110, baseInitMp: 30 },

  // --- HỆ NƯỚC (WATER) 💧 ---
  { name: 'Greninja', type: 'Water', baseHp: 125, baseAtk: 27, baseDef: 18, baseSpeed: 145, baseInitMp: 35 },
  { name: 'Blastoise', type: 'Water', baseHp: 160, baseAtk: 22, baseDef: 32, baseSpeed: 95, baseInitMp: 20 },
  { name: 'Gyarados', type: 'Water', baseHp: 165, baseAtk: 31, baseDef: 24, baseSpeed: 105, baseInitMp: 25 },
  { name: 'Vaporeon', type: 'Water', baseHp: 180, baseAtk: 23, baseDef: 22, baseSpeed: 90, baseInitMp: 30 },
  { name: 'Mudkip', type: 'Water', baseHp: 125, baseAtk: 19, baseDef: 22, baseSpeed: 85, baseInitMp: 20 },
  { name: 'Kyogre', type: 'Water', baseHp: 175, baseAtk: 33, baseDef: 28, baseSpeed: 110, baseInitMp: 35 },

  // --- HỆ ĐIỆN / SÉT (ELECTRIC) ⚡ ---
  { name: 'Pikachu', type: 'Electric', baseHp: 95, baseAtk: 26, baseDef: 12, baseSpeed: 140, baseInitMp: 40 },
  { name: 'Raichu', type: 'Electric', baseHp: 115, baseAtk: 29, baseDef: 16, baseSpeed: 145, baseInitMp: 35 },
  { name: 'Luxray', type: 'Electric', baseHp: 130, baseAtk: 32, baseDef: 19, baseSpeed: 120, baseInitMp: 25 },
  { name: 'Zapdos', type: 'Electric', baseHp: 140, baseAtk: 30, baseDef: 20, baseSpeed: 135, baseInitMp: 35 },
  { name: 'Jolteon', type: 'Electric', baseHp: 105, baseAtk: 28, baseDef: 15, baseSpeed: 155, baseInitMp: 40 },
  { name: 'Zeraora', type: 'Electric', baseHp: 120, baseAtk: 33, baseDef: 17, baseSpeed: 160, baseInitMp: 45 },

  // --- HỆ CỎ (GRASS) 🌿 ---
  { name: 'Bulbasaur', type: 'Grass', baseHp: 120, baseAtk: 20, baseDef: 20, baseSpeed: 100, baseInitMp: 25 },
  { name: 'Squirtle', type: 'Water', baseHp: 115, baseAtk: 18, baseDef: 22, baseSpeed: 95, baseInitMp: 25 },
  { name: 'Charmander', type: 'Fire', baseHp: 110, baseAtk: 22, baseDef: 16, baseSpeed: 105, baseInitMp: 25 },
  { name: 'Sceptile', type: 'Grass', baseHp: 125, baseAtk: 28, baseDef: 18, baseSpeed: 140, baseInitMp: 30 },
  { name: 'Decidueye', type: 'Grass', baseHp: 135, baseAtk: 29, baseDef: 21, baseSpeed: 110, baseInitMp: 30 },
  { name: 'Meowscarada', type: 'Grass', baseHp: 120, baseAtk: 31, baseDef: 17, baseSpeed: 145, baseInitMp: 35 },
  { name: 'Celebi', type: 'Grass', baseHp: 150, baseAtk: 25, baseDef: 25, baseSpeed: 125, baseInitMp: 40 },
  { name: 'Leafeon', type: 'Grass', baseHp: 130, baseAtk: 28, baseDef: 28, baseSpeed: 115, baseInitMp: 25 },

  // --- HỆ ĐÁ (ROCK) 🪨 ---
  { name: 'Tyranitar', type: 'Rock', baseHp: 260, baseAtk: 34, baseDef: 45, baseSpeed: 85, baseInitMp: 20 },
  { name: 'Onix', type: 'Rock', baseHp: 280, baseAtk: 21, baseDef: 55, baseSpeed: 80, baseInitMp: 20 },
  { name: 'Aerodactyl', type: 'Rock', baseHp: 180, baseAtk: 30, baseDef: 25, baseSpeed: 135, baseInitMp: 25 },
  { name: 'Lycanroc', type: 'Rock', baseHp: 190, baseAtk: 31, baseDef: 28, baseSpeed: 130, baseInitMp: 25 },
  { name: 'Garganacl', type: 'Rock', baseHp: 320, baseAtk: 24, baseDef: 60, baseSpeed: 65, baseInitMp: 15 },
  { name: 'Diancie', type: 'Rock', baseHp: 220, baseAtk: 28, baseDef: 50, baseSpeed: 95, baseInitMp: 30 },
  { name: 'Rayquaza', type: 'Rock', baseHp: 250, baseAtk: 38, baseDef: 28, baseSpeed: 140, baseInitMp: 35 },
  { name: 'Garchomp', type: 'Rock', baseHp: 210, baseAtk: 33, baseDef: 30, baseSpeed: 120, baseInitMp: 30 },

  // --- HỆ LỬA (FIRE) 🔥 (ĐỢT 2) ---
  { name: 'Ninetales', type: 'Fire', baseHp: 120, baseAtk: 27, baseDef: 17, baseSpeed: 125, baseInitMp: 30 },
  { name: 'Typhlosion', type: 'Fire', baseHp: 135, baseAtk: 29, baseDef: 18, baseSpeed: 115, baseInitMp: 30 },
  { name: 'Cinderace', type: 'Fire', baseHp: 125, baseAtk: 30, baseDef: 16, baseSpeed: 135, baseInitMp: 30 },
  { name: 'Houndoom', type: 'Fire', baseHp: 115, baseAtk: 28, baseDef: 16, baseSpeed: 120, baseInitMp: 25 },

  // --- HỆ NƯỚC (WATER) 💧 (ĐỢT 2) ---
  { name: 'Milotic', type: 'Water', baseHp: 150, baseAtk: 24, baseDef: 26, baseSpeed: 100, baseInitMp: 30 },
  { name: 'Lapras', type: 'Water', baseHp: 170, baseAtk: 22, baseDef: 30, baseSpeed: 90, baseInitMp: 25 },
  { name: 'Feraligatr', type: 'Water', baseHp: 145, baseAtk: 28, baseDef: 24, baseSpeed: 105, baseInitMp: 25 },
  { name: 'Primarina', type: 'Water', baseHp: 155, baseAtk: 26, baseDef: 25, baseSpeed: 95, baseInitMp: 30 },

  // --- HỆ ĐIỆN / SÉT (ELECTRIC) ⚡ (ĐỢT 2) ---
  { name: 'Electivire', type: 'Electric', baseHp: 135, baseAtk: 32, baseDef: 20, baseSpeed: 110, baseInitMp: 30 },
  { name: 'Manectric', type: 'Electric', baseHp: 115, baseAtk: 27, baseDef: 15, baseSpeed: 140, baseInitMp: 35 },
  { name: 'Morpeko', type: 'Electric', baseHp: 105, baseAtk: 25, baseDef: 14, baseSpeed: 150, baseInitMp: 35 },

  // --- HỆ CỎ (GRASS) 🌿 (ĐỢT 2) ---
  { name: 'Venusaur', type: 'Grass', baseHp: 150, baseAtk: 24, baseDef: 26, baseSpeed: 105, baseInitMp: 25 },
  { name: 'Torterra', type: 'Grass', baseHp: 170, baseAtk: 25, baseDef: 34, baseSpeed: 75, baseInitMp: 20 },
  { name: 'Roserade', type: 'Grass', baseHp: 120, baseAtk: 30, baseDef: 16, baseSpeed: 125, baseInitMp: 30 },

  // --- HỆ ĐÁ (ROCK) 🪨 (ĐỢT 2) ---
  { name: 'Golem', type: 'Rock', baseHp: 210, baseAtk: 26, baseDef: 40, baseSpeed: 70, baseInitMp: 15 },
  { name: 'Rhyperior', type: 'Rock', baseHp: 260, baseAtk: 30, baseDef: 45, baseSpeed: 60, baseInitMp: 15 },
  { name: 'Aggron', type: 'Rock', baseHp: 240, baseAtk: 28, baseDef: 48, baseSpeed: 70, baseInitMp: 15 },

  // --- CÁC DẠNG TIẾN HÓA (EVOLUTION) - CHỈ CÓ QUA TIẾN HÓA, KHÔNG ROLL TRONG GACHA ---
  { name: 'Charmeleon', type: 'Fire', baseHp: 125, baseAtk: 25, baseDef: 17, baseSpeed: 112, baseInitMp: 28 },
  { name: 'Ivysaur', type: 'Grass', baseHp: 135, baseAtk: 22, baseDef: 23, baseSpeed: 102, baseInitMp: 28 },
  { name: 'Wartortle', type: 'Water', baseHp: 135, baseAtk: 20, baseDef: 27, baseSpeed: 90, baseInitMp: 24 },
  { name: 'Marshtomp', type: 'Water', baseHp: 145, baseAtk: 23, baseDef: 26, baseSpeed: 82, baseInitMp: 22 },
  { name: 'Swampert', type: 'Water', baseHp: 175, baseAtk: 29, baseDef: 28, baseSpeed: 88, baseInitMp: 25 },
  { name: 'Crocalor', type: 'Fire', baseHp: 125, baseAtk: 25, baseDef: 18, baseSpeed: 98, baseInitMp: 28 },
  { name: 'Skeledirge', type: 'Fire', baseHp: 165, baseAtk: 29, baseDef: 25, baseSpeed: 78, baseInitMp: 28 },

  // --- CÁC DẠNG TIỀN TIẾN HÓA (DÙNG ĐÁ TIẾN HÓA, ĐỢT 3) ---
  { name: 'Vulpix', type: 'Fire', baseHp: 85, baseAtk: 16, baseDef: 12, baseSpeed: 90, baseInitMp: 25 },
  { name: 'Growlithe', type: 'Fire', baseHp: 100, baseAtk: 18, baseDef: 13, baseSpeed: 80, baseInitMp: 20 },
  { name: 'Magikarp', type: 'Water', baseHp: 70, baseAtk: 10, baseDef: 15, baseSpeed: 70, baseInitMp: 10 },
  { name: 'Larvitar', type: 'Rock', baseHp: 100, baseAtk: 17, baseDef: 25, baseSpeed: 60, baseInitMp: 10 },
  { name: 'Eevee', type: 'Electric', baseHp: 95, baseAtk: 16, baseDef: 14, baseSpeed: 110, baseInitMp: 25 },

  // --- POKEMON HUYỀN THOẠI (RARITY MẶC ĐỊNH: LEGENDARY TRỞ LÊN) ---
  { name: 'Ho-Oh', type: 'Fire', baseHp: 165, baseAtk: 36, baseDef: 26, baseSpeed: 120, baseInitMp: 35, minRarity: 'Legendary' },
  { name: 'Lugia', type: 'Water', baseHp: 185, baseAtk: 30, baseDef: 35, baseSpeed: 110, baseInitMp: 30, minRarity: 'Legendary' },
  { name: 'Raikou', type: 'Electric', baseHp: 145, baseAtk: 34, baseDef: 22, baseSpeed: 150, baseInitMp: 35, minRarity: 'Legendary' },
]

// --- CƠ CHẾ TIẾN HÓA ---
// Cấu trúc mở rộng: mỗi loài là MẢNG các nhánh tiến hóa, cho phép về sau thêm:
// - Nhánh rẽ: { next: 'Y', type: 'level', atLevel: 50 }, { next: 'Z', type: 'special', condition: '...' }
// - Tiến hóa đặc biệt / đá tiến hóa: đổi type khác 'level' và thêm condition.
// `type: 'level'` = tiến hóa theo cấp độ (atLevel). Mốc: dạng 2 tại Lv.45, dạng 3 tại Lv.70.
export const EVOLUTIONS = {
  Charmander: [{ next: 'Charmeleon', type: 'level', atLevel: 45 }],
  Charmeleon: [{ next: 'Charizard', type: 'level', atLevel: 70 }],
  Squirtle: [{ next: 'Wartortle', type: 'level', atLevel: 45 }],
  Wartortle: [{ next: 'Blastoise', type: 'level', atLevel: 70 }],
  Bulbasaur: [{ next: 'Ivysaur', type: 'level', atLevel: 45 }],
  Ivysaur: [{ next: 'Venusaur', type: 'level', atLevel: 70 }],
  Mudkip: [{ next: 'Marshtomp', type: 'level', atLevel: 45 }],
  Marshtomp: [{ next: 'Swampert', type: 'level', atLevel: 70 }],
  Fuecoco: [{ next: 'Crocalor', type: 'level', atLevel: 45 }],
  Crocalor: [{ next: 'Skeledirge', type: 'level', atLevel: 70 }],
  Pikachu: [{ next: 'Raichu', type: 'level', atLevel: 45 }],
  // Nhánh rẽ bằng ĐÁ TIẾN HÓA: tiến hóa bất kỳ lúc nào khi có đá trong kho.
  // `type: 'stone'` + `item` = id đá trong EVOLUTION_STONES (tiêu hao khi tiến hóa).
  Eevee: [
    { next: 'Flareon', type: 'stone', item: 'fire_stone' },
    { next: 'Vaporeon', type: 'stone', item: 'water_stone' },
    { next: 'Jolteon', type: 'stone', item: 'thunder_stone' },
    { next: 'Leafeon', type: 'stone', item: 'leaf_stone' },
  ],
  Vulpix: [{ next: 'Ninetales', type: 'stone', item: 'fire_stone' }],
  Growlithe: [{ next: 'Arcanine', type: 'stone', item: 'fire_stone' }],
  Magikarp: [{ next: 'Gyarados', type: 'stone', item: 'water_stone' }],
  Larvitar: [{ next: 'Tyranitar', type: 'stone', item: 'rock_stone' }],
}

// --- ĐÁ TIẾN HÓA (EVOLUTION STONES) ---
// Item mua trong Cửa Hàng, dùng trong Kho Đồ để tiến hóa nhánh `type: 'stone'`.
export const EVOLUTION_STONES = [
  { id: 'fire_stone', name: 'Đá Lửa', emoji: '🔥', price: 5000, description: 'Tiến hóa Vulpix → Ninetales, Growlithe → Arcanine, Eevee → Flareon.' },
  { id: 'water_stone', name: 'Đá Nước', emoji: '💧', price: 5000, description: 'Tiến hóa Magikarp → Gyarados, Eevee → Vaporeon.' },
  { id: 'thunder_stone', name: 'Đá Sét', emoji: '⚡', price: 5000, description: 'Tiến hóa Eevee → Jolteon.' },
  { id: 'leaf_stone', name: 'Đá Lá', emoji: '🌿', price: 5000, description: 'Tiến hóa Eevee → Leafeon.' },
  { id: 'rock_stone', name: 'Đá Cứng', emoji: '🪨', price: 5000, description: 'Tiến hóa Larvitar → Tyranitar.' },
]

// --- KHO KỸ NĂNG NGUYÊN TỐ (KHÔNG ĐỔI) ---
export const ELEMENTAL_SKILL_TEMPLATES = {
  Fire: {
    Basic: [
      { name: 'Cào Xé Lửa', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Đấm Đá Liên Hoàn', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Quyền Thuật Lửa', rarity: 'Common', basePower: 13, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Tia Lửa Nhỏ (Ember)', rarity: 'Rare', basePower: 15, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'burn', duration: 2, val: 8, name: 'Bỏng Nhỏ' } },
      { name: 'Lửa Trùm Mặt Trời', rarity: 'Rare', basePower: 17, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'burn', duration: 1, val: 5, name: 'Nóng Mặt Trời' } },
      { name: 'Bùng Nổ Lửa Nóng', rarity: 'Rare', basePower: 18, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'burn', duration: 2, val: 8, name: 'Bùng Cháy' } },
      { name: 'Cú Đấm Hỏa Diệm', rarity: 'Rare', basePower: 16, cost: 0, cd: 0, mpGain: 28, category: 'damage' },
      { name: 'Hỏa Diệm Xoáy Nhỏ', rarity: 'Epic', basePower: 20, cost: 0, cd: 0, mpGain: 32, category: 'damage', effect: { type: 'burn', duration: 2, val: 10, name: 'Vòng Lửa Nhỏ' } },
      { name: 'Lửa Thần Thanh', rarity: 'Epic', basePower: 22, cost: 0, cd: 0, mpGain: 35, category: 'damage', effect: { type: 'buff_atk', duration: 1, val: 15, name: 'Thánh Lửa (+15% ATK)' } },
      { name: 'Núi Lửa Vĩnh Cửu', rarity: 'Legendary', basePower: 25, cost: 0, cd: 0, mpGain: 40, category: 'damage', effect: { type: 'burn', duration: 3, val: 15, name: 'Núi Lửa Bùng Nổ' } },
    ],
    Skill1: [
      { name: 'Tia Lửa (Ember)', rarity: 'Common', basePower: 20, cost: 15, cd: 1, category: 'damage', effect: { type: 'burn', duration: 2, val: 8, name: 'Bỏng Nhẹ' } },
      { name: 'Tấn Công Nhanh', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage' },
      { name: 'Cú Đấm Lửa Nhỏ', rarity: 'Common', basePower: 22, cost: 15, cd: 1, category: 'damage', effect: { type: 'burn', duration: 1, val: 5, name: 'Lửa Nhỏ' } },
      { name: 'Phun Lửa (Flamethrower)', rarity: 'Rare', basePower: 35, cost: 25, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 15, name: 'Thiêu Đốt' } },
      { name: 'Cú Đấm Tốc Độ', rarity: 'Rare', basePower: 30, cost: 20, cd: 1, category: 'damage', effect: { type: 'extra_turn', duration: 2, val: 30, name: 'Tăng 30% SPD' } },
      { name: 'Hỏa Diệm Xoáy (Fire Spin)', rarity: 'Rare', basePower: 30, cost: 20, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 12, name: 'Vòng Lửa' } },
      { name: 'Mây Khói Đen (Smog)', rarity: 'Rare', basePower: 28, cost: 20, cd: 2, category: 'damage', effect: { type: 'debuff_atk', duration: 2, val: 25, name: 'Khói Độc (Giảm 25% ATK)' } },
      { name: 'Bánh Xe Lửa (Flame Wheel)', rarity: 'Rare', basePower: 32, cost: 25, cd: 2, category: 'damage', effect: { type: 'extra_turn', duration: 2, val: 25, name: 'Bánh Xe Lửa (+25% SPD)' } },
      { name: 'Tốc Độ Cực Hạn', rarity: 'Epic', basePower: 45, cost: 30, cd: 2, category: 'damage', effect: { type: 'extra_turn', duration: 3, val: 50, name: 'Tốc Độ Ánh Sáng' } },
      { name: 'Cú Đá Bùng Cháy', rarity: 'Epic', basePower: 50, cost: 35, cd: 2, category: 'true_damage', isTrueDmg: true },
      { name: 'Bão Lửa (Fire Blast)', rarity: 'Legendary', basePower: 70, cost: 50, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 35, name: 'Biển Lửa' } },
      { name: 'Lửa Thiêng (Sacred Fire)', rarity: 'Legendary', basePower: 75, cost: 55, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 40, name: 'Lửa Thánh' } },
    ],
    Skill2: [
      { name: 'Giáp Nham Thạch Nhỏ', rarity: 'Common', baseShield: 25, cost: 20, cd: 2, category: 'shield', effect: { type: 'buff_def', duration: 2, val: 20, name: 'Giáp Đá (+20% DEF)' } },
      { name: 'Màn Khói Lửa', rarity: 'Common', baseShield: 20, cost: 15, cd: 2, category: 'shield', effect: { type: 'debuff_atk', duration: 2, val: 15, name: 'Khói Che Mắt (-15% ATK)' } },
      { name: 'Ngáp (Yawn)', rarity: 'Rare', cost: 25, cd: 3, category: 'debuff', effect: { type: 'stun', duration: 1, val: 0, name: 'Buồn Ngủ (Choáng)' } },
      { name: 'Cú Đấm Lửa (Fire Punch)', rarity: 'Rare', basePower: 45, cost: 35, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Đẩy Lùi (Choáng)' } },
      { name: 'Bánh Xe Lửa (Flame Wheel)', rarity: 'Rare', basePower: 40, cost: 35, cd: 2, category: 'damage', effect: { type: 'extra_turn', duration: 2, val: 20, name: 'Tăng 20% Tốc' } },
      { name: 'Lửa Ma Trái (Will-O-Wisp)', rarity: 'Epic', basePower: 20, cost: 30, cd: 3, category: 'damage', effect: { type: 'debuff_atk', duration: 3, val: 40, name: 'Giảm 40% ATK' } },
      { name: 'Cột Nham Thạch (Lava Plume)', rarity: 'Epic', basePower: 55, cost: 45, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 25, name: 'Cháy Rát' } },
      { name: 'Bão Lửa (Fire Blast)', rarity: 'Epic', basePower: 65, cost: 45, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 30, name: 'Biển Lửa Nhỏ' } },
      { name: 'Vỏ Bọc Nham Thạch (Magma Armor)', rarity: 'Epic', baseShield: 50, cost: 35, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 3, val: 45, name: 'Giáp Nham Thạch (+45% DEF)' } },
      { name: 'Hỏa Diêm Cổ Đại (Ancient Fire)', rarity: 'Legendary', basePower: 75, cost: 50, cd: 3, category: 'damage', effect: { type: 'burn', duration: 4, val: 40, name: 'Lửa Cổ Đại' } },
      { name: 'Bão Cát Lửa (Scorching Sands)', rarity: 'Legendary', basePower: 70, cost: 45, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 35, name: 'Cát Nóng' } },
      { name: 'Đốt Cháy Tất Cả (Burn Up)', rarity: 'Legendary', basePower: 80, cost: 55, cd: 3, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 40, name: 'Nóng Chảy (Giảm 40% DEF)' } },
    ],
    Ultimate: [
      { name: 'Lửa Thần Nhỏ', rarity: 'Common', basePower: 90, cost: 70, cd: 3, category: 'damage', effect: { type: 'burn', duration: 2, val: 20, name: 'Lửa Thần Nhỏ' } },
      { name: 'Khúc Ca Bùng Cháy', rarity: 'Rare', basePower: 100, cost: 80, cd: 3, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 40, name: 'Tăng 40% ATK' } },
      { name: 'Vòng Xoáy Lửa (Fire Spin)', rarity: 'Rare', basePower: 95, cost: 75, cd: 3, category: 'damage', effect: { type: 'burn', duration: 4, val: 30, name: 'Khóa Chặt (Cháy)' } },
      { name: 'Cú Ném Trái Đất (Seismic Toss)', rarity: 'Epic', basePower: 120, cost: 85, cd: 3, category: 'true_damage', isTrueDmg: true },
      { name: 'Tấn Công Bùng Cháy (Flare Blitz)', rarity: 'Epic', basePower: 135, cost: 90, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 45, name: 'Thiêu Rụi' } },
      { name: 'Lửa Thiêng (Sacred Fire)', rarity: 'Epic', basePower: 125, cost: 85, cd: 4, category: 'damage', effect: { type: 'burn', duration: 4, val: 35, name: 'Lửa Thánh Đại' } },
      { name: 'Vũ Điệu Lửa (Fiery Dance)', rarity: 'Epic', basePower: 130, cost: 90, cd: 4, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 50, name: 'Vũ Điệu Lửa (+50% ATK)' } },
      { name: 'Ngọn Lửa Vĩnh Hằng (Eternal Flame)', rarity: 'Legendary', basePower: 140, cost: 95, cd: 4, category: 'damage', effect: { type: 'burn', duration: 5, val: 50, name: 'Bùng Cháy Vĩnh Hằng' } },
      { name: 'Bùng Nổ Siêu Tân (Eruption)', rarity: 'Legendary', basePower: 150, cost: 100, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Sốc Nhiệt (Choáng)' } },
      { name: 'Vua Hỏa Diệm (Fire King)', rarity: 'Legendary', basePower: 160, cost: 105, cd: 4, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 60, name: 'Quyền Lực Hỏa Vương (+60% ATK)' } },
      { name: 'Hỏa Ngục Bùng Nổ', rarity: 'Legendary', basePower: 155, cost: 95, cd: 4, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Hỏa Ngục (Choáng 2 lượt)' } },
      { name: 'Thiêu Đốt Đại Địa (Overheat)', rarity: 'Mythic', basePower: 180, cost: 110, cd: 5, category: 'true_damage', isTrueDmg: true, effect: { type: 'buff_atk', duration: 2, val: 70, name: 'Giải Phóng Năng Lượng (+70% ATK)' } },
    ],
  },
  Water: {
    Basic: [
      { name: 'Phi Tiêu Nước Tầm Xa', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Cú Húc Thủy Lực', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Quật Đuôi Cuồng Nộ', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Bong Bóng Nước', rarity: 'Rare', basePower: 15, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'stun', duration: 1, val: 15, name: 'Bong Bóng Dính' } },
      { name: 'Sóng Xung Kích Cổ Đại', rarity: 'Rare', basePower: 17, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'debuff_atk', duration: 1, val: 10, name: 'Sóng Cổ Đại' } },
      { name: 'Tia Nước Nhỏ (Water Gun)', rarity: 'Rare', basePower: 16, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'stun', duration: 2, val: 15, name: 'Làm Mát' } },
      { name: 'Vòi Nước Bùng Nổ', rarity: 'Rare', basePower: 18, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'stun', duration: 2, val: 15, name: 'Sóng Nước' } },
      { name: 'Bong Bóng Hút Máu', rarity: 'Epic', basePower: 20, cost: 0, cd: 0, mpGain: 32, category: 'damage', effect: { type: 'stun', duration: 2, val: 15, name: 'Hút Sinh Lực Mạnh' } },
      { name: 'Nước Thánh (Holy Water)', rarity: 'Epic', basePower: 22, cost: 0, cd: 0, mpGain: 32, category: 'damage', effect: { type: 'buff_atk', duration: 1, val: 20, name: 'Thánh Nước (+20% ATK)' } },
      { name: 'Đại Dương Cổ Đại', rarity: 'Legendary', basePower: 25, cost: 0, cd: 0, mpGain: 40, category: 'damage', effect: { type: 'stun', duration: 3, val: 20, name: 'Áp Lực Sâu Biển' } },
    ],
    Skill1: [
      { name: 'Nước Bùn (Muddy Water)', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage', effect: { type: 'debuff_atk', duration: 2, val: 25, name: 'Giảm 25% ATK' } },
      { name: 'Sóng Nước (Water Pulse)', rarity: 'Common', basePower: 22, cost: 15, cd: 1, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Hỗn Loạn (Choáng)' } },
      { name: 'Bong Bóng Nước (Bubble)', rarity: 'Common', basePower: 20, cost: 15, cd: 1, category: 'damage', effect: { type: 'stun', duration: 2, val: 20, name: 'Bong Bóng Dính' } },
      { name: 'Phi Tiêu Nước (Water Shuriken)', rarity: 'Rare', basePower: 30, baseHeal: 15, cost: 20, cd: 1, category: 'damage', effect: { type: 'stun', duration: 2, val: 25, name: 'Giảm Tốc 25%' } },
      { name: 'Thủy Pháo (Hydro Pump)', rarity: 'Rare', basePower: 35, cost: 20, cd: 2, category: 'damage', effect: { type: 'debuff_atk', duration: 2, val: 20, name: 'Đẩy Lùi (Giảm 20% ATK)' } },
      { name: 'Đuôi Nước (Aqua Tail)', rarity: 'Rare', basePower: 40, cost: 25, cd: 2, category: 'damage', effect: { type: 'stun', duration: 2, val: 30, name: 'Giảm Tốc 30%' } },
      { name: 'Tia Nước (Water Pulse+)', rarity: 'Rare', basePower: 32, cost: 20, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Sóng Sốc (Choáng)' } },
      { name: 'Tạt Bùn (Mud-Slap)', rarity: 'Rare', basePower: 30, cost: 20, cd: 2, category: 'damage', effect: { type: 'stun', duration: 2, val: 25, name: 'Bùn Dính (Giảm Tốc)' } },
      { name: 'Sóng Nguồn Cội (Origin Pulse)', rarity: 'Epic', basePower: 60, cost: 35, cd: 2, category: 'true_damage', isTrueDmg: true },
      { name: 'Nước Bão (Hydro Cannon)', rarity: 'Epic', basePower: 55, cost: 30, cd: 2, category: 'damage', effect: { type: 'stun', duration: 3, val: 40, name: 'Cơn Bão Nước' } },
      { name: 'Nước Cổ Đại (Primordial Sea)', rarity: 'Legendary', basePower: 70, cost: 45, cd: 3, category: 'damage', effect: { type: 'debuff_atk', duration: 3, val: 40, name: 'Áp Lực Sâu Biển' } },
      { name: 'Vũ Trụ Nước (Oceanic Operetta)', rarity: 'Legendary', basePower: 75, cost: 50, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Sóng Vũ Trụ (Choáng)' } },
    ],
    Skill2: [
      { name: 'Màn Khói Nước (Mist)', rarity: 'Common', baseShield: 30, cost: 20, cd: 2, category: 'shield', effect: { type: 'buff_def', duration: 2, val: 20, name: 'Sương Mù (+20% DEF)' } },
      { name: 'Bong Bóng Nhỏ (Small Bubble)', rarity: 'Common', baseShield: 25, cost: 15, cd: 2, category: 'shield', effect: { type: 'stun', duration: 2, val: 15, name: 'Bong Bóng Chậm (+15% SPD)' } },
      { name: 'Mưa Rào Nhỏ (Light Rain)', rarity: 'Rare', cost: 25, cd: 2, category: 'buff', effect: { type: 'extra_turn', duration: 2, val: 20, name: 'Mưa Nhỏ (+20% SPD)' } },
      { name: 'Thế Thân & Màn Khói', rarity: 'Rare', baseShield: 35, cost: 25, cd: 3, category: 'shield', effect: { type: 'extra_turn', duration: 2, val: 30, name: 'Tàng Hình (+30% Tốc)' } },
      { name: 'Tạt Bùn (Mud-Slap)', rarity: 'Rare', basePower: 35, cost: 25, cd: 2, category: 'damage', effect: { type: 'stun', duration: 2, val: 30, name: 'Giảm Tốc 30%' } },
      { name: 'Lướt Sóng (Surf)', rarity: 'Epic', basePower: 50, cost: 40, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Cuốn Sóng (Choáng)' } },
      { name: 'Thác Nước (Waterfall)', rarity: 'Epic', basePower: 55, cost: 40, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Hất Tung (Choáng)' } },
      { name: 'Giáp Acid (Acid Armor)', rarity: 'Epic', baseShield: 60, cost: 35, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 3, val: 50, name: 'Hóa Lỏng (+50% DEF)' } },
      { name: 'Bong Bóng Phòng Thụ (Protect)', rarity: 'Epic', baseShield: 70, cost: 40, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 2, val: 60, name: 'Bong Bóng Vô Địch' } },
      { name: 'Vũ Điệu Mưa (Rain Dance)', rarity: 'Legendary', cost: 40, cd: 3, category: 'buff', effect: { type: 'extra_turn', duration: 3, val: 40, name: 'Mưa Tăng Tốc (+40% SPD)' } },
      { name: 'Mưa Rào & Tâm Cảnh', rarity: 'Legendary', cost: 45, cd: 3, category: 'buff', effect: { type: 'buff_atk', duration: 3, val: 45, name: 'Cơn Mưa Cổ Đại (+45% ATK)' } },
      { name: 'Đại Dương Bùng Nổ (Ocean Blast)', rarity: 'Legendary', basePower: 80, cost: 55, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Sóng Sốc Đại Dương' } },
    ],
    Ultimate: [
      { name: 'Sóng Nước Nhỏ', rarity: 'Common', basePower: 85, cost: 65, cd: 3, category: 'damage', effect: { type: 'stun', duration: 2, val: 25, name: 'Sóng Nhỏ' } },
      { name: 'Trận Bão Bùn Lầy', rarity: 'Rare', basePower: 95, cost: 75, cd: 3, category: 'damage', effect: { type: 'stun', duration: 3, val: 50, name: 'Sa Lầy (Giảm Tốc 50%)' } },
      { name: 'Cơn Bão Thủy Lực', rarity: 'Rare', basePower: 100, cost: 80, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Bão Nước Hất Văng' } },
      { name: 'Vũ Điệu Nước (Aqua Ring)', rarity: 'Epic', baseHeal: 100, cost: 80, cd: 3, category: 'heal', effect: { type: 'buff_def', duration: 3, val: 40, name: 'Vòng Nước (+40% DEF)' } },
      { name: 'Lãnh Địa Đại Dương', rarity: 'Epic', baseHeal: 110, cost: 85, cd: 4, category: 'heal', effect: { type: 'stun', duration: 3, val: 35, name: 'Trầm Mặc (Giảm Tốc 35%)' } },
      { name: 'Sóng Thần (Scald)', rarity: 'Epic', basePower: 120, cost: 85, cd: 4, category: 'damage', effect: { type: 'burn', duration: 3, val: 30, name: 'Nước Sôi (Bỏng)' } },
      { name: 'Vũ Trụ Nước (Hydro Vortex)', rarity: 'Epic', basePower: 130, cost: 90, cd: 4, category: 'damage', effect: { type: 'stun', duration: 4, val: 45, name: 'Vòng Xoáy Nước' } },
      { name: 'Đại Phi Tiêu Nước', rarity: 'Legendary', basePower: 140, cost: 90, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Nổ Lớn (Choáng)' } },
      { name: 'Cơn Thịnh Nộ Đại Dương', rarity: 'Legendary', basePower: 155, cost: 95, cd: 4, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Sóng Thần (Choáng 2 lượt)' } },
      { name: 'Thủy Quân Cổ Đại (Ancient Navy)', rarity: 'Legendary', basePower: 160, cost: 100, cd: 4, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Chiến Binh Thủy (Choáng 2 lượt)' } },
      { name: 'Nước Mặt Trời (Solar Water)', rarity: 'Legendary', basePower: 170, baseHeal: 80, cost: 105, cd: 5, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 50, name: 'Năng Lượng Mặt Trời' } },
      { name: 'Thủy Thần Hải Vương (Water God Poseidon)', rarity: 'Mythic', basePower: 200, cost: 115, cd: 5, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Quyền Linh Hải Vương' } },
    ],
  },
  Grass: {
    Basic: [
      { name: 'Roi Dây Leo Tầm Trung', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Chém Dao Lá', rarity: 'Common', basePower: 13, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Mũi Tên Lông Cánh', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Vuốt Móng Hoa Hồng', rarity: 'Rare', basePower: 15, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'stun', duration: 1, val: 10, name: 'Móng Hoa' } },
      { name: 'Cầu Năng Lượng Thiên Nhiên', rarity: 'Rare', basePower: 14, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'buff_atk', duration: 1, val: 10, name: 'Quang Hợp Nhỏ' } },
      { name: 'Đuôi Lá Cây Sắc Nhọn', rarity: 'Rare', basePower: 15, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'stun', duration: 2, val: 15, name: 'Lá Sắc' } },
      { name: 'Hạt Giống Nhỏ (Seed)', rarity: 'Rare', basePower: 14, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'stun', duration: 2, val: 15, name: 'Gieo Hạt' } },
      { name: 'Lá Xanh Rồng (Leafage)', rarity: 'Rare', basePower: 17, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'stun', duration: 1, val: 10, name: 'Lá Rồng' } },
      { name: 'Rơi Hoa Hồng (Petal Dance)', rarity: 'Epic', basePower: 20, cost: 0, cd: 0, mpGain: 32, category: 'damage', effect: { type: 'stun', duration: 3, val: 20, name: 'Hoa Rơi Mạnh' } },
      { name: 'Hấp Thu Năng Lượng', rarity: 'Legendary', basePower: 25, cost: 0, cd: 0, mpGain: 40, category: 'damage', effect: { type: 'buff_atk', duration: 2, val: 20, name: 'Quang Hợp Đại' } },
    ],
    Skill1: [
      { name: 'Roi Dây Leo (Vine Whip)', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage', effect: { type: 'stun', duration: 2, val: 25, name: 'Trói Giữ (Giảm Tốc 25%)' } },
      { name: 'Lá Cắt (Razor Leaf)', rarity: 'Common', basePower: 26, cost: 15, cd: 1, category: 'damage' },
      { name: 'Hút Máu (Absorb)', rarity: 'Common', basePower: 22, baseHeal: 15, cost: 15, cd: 1, category: 'damage', effect: { type: 'stun', duration: 2, val: 15, name: 'Hút Sinh Lực' } },
      { name: 'Lưỡi Kiếm Lá (Leaf Blade)', rarity: 'Rare', basePower: 38, cost: 20, cd: 1, category: 'damage' },
      { name: 'Bom Hạt Giống (Seed Bomb)', rarity: 'Rare', basePower: 30, cost: 20, cd: 1, category: 'damage', effect: { type: 'stun', duration: 2, val: 30, name: 'Sức Ép (Giảm Tốc 30%)' } },
      { name: 'Bom Bông (Cotton Spore)', rarity: 'Rare', basePower: 28, cost: 15, cd: 2, category: 'damage', effect: { type: 'stun', duration: 3, val: 35, name: 'Bông Bay Giảm Tốc' } },
      { name: 'Sinh Sôi Nảy Nở (Growth)', rarity: 'Rare', cost: 25, cd: 2, category: 'buff', effect: { type: 'buff_atk', duration: 3, val: 30, name: 'Sinh Trưởng (+30% ATK)' } },
      { name: 'Vũ Điệu Kiếm (Swords Dance)', rarity: 'Rare', cost: 30, cd: 3, category: 'buff', effect: { type: 'buff_atk', duration: 3, val: 40, name: 'Kiếm Sĩ (+40% ATK)' } },
      { name: 'Mũi Tên Trói Hồn (Spirit Shackle)', rarity: 'Epic', basePower: 45, cost: 25, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Khóa Chân (Choáng)' } },
      { name: 'Ảo Thuật Hoa Hồng (Flower Trick)', rarity: 'Epic', basePower: 50, cost: 25, cd: 2, category: 'true_damage', isTrueDmg: true },
      { name: 'Sinh Mệnh Vạn Vật (Frenzy Plant)', rarity: 'Legendary', basePower: 72, cost: 45, cd: 3, category: 'damage', effect: { type: 'stun', duration: 3, val: 40, name: 'Rừng Hủy Diệt' } },
      { name: 'Cây Thần Cổ (World Tree)', rarity: 'Legendary', basePower: 70, cost: 40, cd: 3, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 45, name: 'Cây Thức Tỉnh' } },
    ],
    Skill2: [
      { name: 'Màng Lá (Grass Whistle)', rarity: 'Common', cost: 20, cd: 2, category: 'debuff', effect: { type: 'stun', duration: 1, val: 0, name: 'Lá Tiếng (Choáng)' } },
      { name: 'Rào Cản Cây Cối Nhỏ', rarity: 'Common', baseShield: 25, cost: 20, cd: 2, category: 'shield', effect: { type: 'buff_def', duration: 2, val: 20, name: 'Cỏ Nhỏ (+20% DEF)' } },
      { name: 'Hạt Hút Máu (Leech Seed)', rarity: 'Rare', basePower: 20, baseHeal: 35, cost: 25, cd: 2, category: 'heal', effect: { type: 'stun', duration: 2, val: 20, name: 'Hút Sinh Lực' } },
      { name: 'Bóng Ma Đột Kích (Shadow Sneak)', rarity: 'Rare', basePower: 35, cost: 25, cd: 2, category: 'damage', effect: { type: 'extra_turn', duration: 2, val: 40, name: 'Ẩn Nấp (+40% Tốc)' } },
      { name: 'Chuông Hồi Phục (Heal Bell)', rarity: 'Rare', baseHeal: 55, cost: 30, cd: 3, category: 'heal', effect: { type: 'buff_def', duration: 2, val: 30, name: 'Thanh Tẩy (+30% DEF)' } },
      { name: 'Bước Nhảy Ảo Giác (Illusion Step)', rarity: 'Epic', baseShield: 45, cost: 30, cd: 3, category: 'shield', effect: { type: 'extra_turn', duration: 2, val: 50, name: 'Ảo Giác (+50% Tốc)' } },
      { name: 'Rào Cản Cây Cối (Grassy Terrain)', rarity: 'Epic', baseShield: 50, cost: 30, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 3, val: 35, name: 'Địa Hình Cỏ (+35% DEF)' } },
      { name: 'Lá Chữa Lành (Synthesis)', rarity: 'Epic', baseHeal: 60, cost: 35, cd: 3, category: 'heal', effect: { type: 'buff_def', duration: 2, val: 25, name: 'Hồi Phục Thiên Nhiên' } },
      { name: 'Hút Năng Lượng (Giga Drain)', rarity: 'Epic', basePower: 45, baseHeal: 30, cost: 30, cd: 2, category: 'damage' },
      { name: 'Rừng Rậm (Jungle Healing)', rarity: 'Legendary', baseHeal: 70, cost: 40, cd: 3, category: 'heal', effect: { type: 'extra_turn', duration: 3, val: 30, name: 'Rừng Yêu Thích (+30% SPD)' } },
      { name: 'Thiên Nhiên Thần Thánh (Nature Power)', rarity: 'Legendary', basePower: 75, cost: 50, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Quyền Năng Thiên Nhiên' } },
      { name: 'Lá Sắt (Iron Leaf)', rarity: 'Legendary', basePower: 78, cost: 50, cd: 3, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 40, name: 'Lá Thép Phá Giáp Đại' } },
    ],
    Ultimate: [
      { name: 'Lá Nhỏ (Leaf)', rarity: 'Common', basePower: 80, cost: 60, cd: 3, category: 'damage', effect: { type: 'stun', duration: 2, val: 20, name: 'Lá Nhỏ' } },
      { name: 'Đột Kích Lưỡi Kiếm Mặt Trời', rarity: 'Rare', basePower: 90, cost: 75, cd: 3, category: 'damage', effect: { type: 'buff_atk', duration: 2, val: 30, name: 'Quang Năng (+30% ATK)' } },
      { name: 'Rừng Cổ Đại Vĩnh Hằng (Eternal Forest)', rarity: 'Rare', basePower: 100, baseHeal: 40, cost: 80, cd: 3, category: 'damage', effect: { type: 'stun', duration: 3, val: 40, name: 'Rừng Vĩnh Hằng Nhỏ' } },
      { name: 'Lá Sắt (Iron Leaf)', rarity: 'Epic', basePower: 115, cost: 80, cd: 3, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 35, name: 'Lá Thép Phá Giáp' } },
      { name: 'Tia Năng Lượng Mặt Trời (Solar Beam)', rarity: 'Epic', basePower: 135, cost: 90, cd: 4, category: 'damage' },
      { name: 'Bão Lá Cuồng Phong (Leaf Storm)', rarity: 'Epic', basePower: 130, cost: 85, cd: 4, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 40, name: 'Phá Giáp 40%' } },
      { name: 'Mưa Tên Ma Quái', rarity: 'Epic', basePower: 140, cost: 90, cd: 4, category: 'damage' },
      { name: 'Vũ Điệu Hoa Lệ Hủy Diệt', rarity: 'Legendary', basePower: 155, cost: 95, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Màn Ảo Thuật (Choáng)' } },
      { name: 'Lãnh Địa Thời Gian (Time Warp)', rarity: 'Legendary', baseHeal: 120, cost: 95, cd: 4, category: 'heal', effect: { type: 'stun', duration: 3, val: 40, name: 'Ngưng Đọng Thời Gian (-40% Tốc)' } },
      { name: 'Thần Thể Cây Thông (World Tree Avatar)', rarity: 'Legendary', basePower: 170, cost: 100, cd: 4, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 60, name: 'Hóa Thân Cây Thần' } },
      { name: 'Sinh Mệnh Đại Bùng Nổ (Life Explosion)', rarity: 'Legendary', basePower: 185, baseHeal: 100, cost: 110, cd: 5, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Sinh Mệnh Bùng Nổ' } },
      { name: 'Thiên Nhiên Nữ Thần (Nature Goddess)', rarity: 'Mythic', basePower: 210, baseHeal: 80, cost: 120, cd: 5, category: 'damage', effect: { type: 'stun', duration: 4, val: 60, name: 'Quyền Linh Thiên Nhiên' } },
    ],
  },
  Electric: {
    Basic: [
      { name: 'Tia Điện Má Đỏ', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Vuốt Điện Cận Chiến', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Cú Đập Đuôi Sét', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Sóng Điện Đập Cánh', rarity: 'Rare', basePower: 16, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'shock', duration: 1, val: 10, name: 'Sóng Điện' } },
      { name: 'Lông Nhọn Tích Điện', rarity: 'Rare', basePower: 14, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'extra_turn', duration: 1, val: 15, name: 'Tốc Độ Điện' } },
      { name: 'Cào Xé Tốc Độ Cao', rarity: 'Rare', basePower: 15, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'shock', duration: 2, val: 15, name: 'Cào Xé Sét' } },
      { name: 'Sét Nhỏ (Thunder Shock)', rarity: 'Rare', basePower: 15, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'shock', duration: 2, val: 15, name: 'Tê Liêt Nhỏ' } },
      { name: 'Điện Tích (Charge)', rarity: 'Epic', basePower: 12, cost: 0, cd: 0, mpGain: 40, category: 'damage', effect: { type: 'buff_atk', duration: 1, val: 20, name: 'Tích Điện (+20% ATK)' } },
      { name: 'Cú Đấm Sét (Thunder Punch)', rarity: 'Epic', basePower: 20, cost: 0, cd: 0, mpGain: 32, category: 'damage', effect: { type: 'shock', duration: 2, val: 20, name: 'Sét Cùn Cùn Mạnh' } },
      { name: 'Sóng Điện Từ', rarity: 'Legendary', basePower: 25, cost: 0, cd: 0, mpGain: 40, category: 'damage', effect: { type: 'stun', duration: 2, val: 20, name: 'Từ Trường Đại' } },
    ],
    Skill1: [
      { name: 'Tia Sét (Thunderbolt)', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage', effect: { type: 'shock', duration: 2, val: 20, name: 'Giật Điện Tê Liệt' } },
      { name: 'Tên Lông Nhọn (Pin Missile)', rarity: 'Common', basePower: 28, cost: 15, cd: 1, category: 'damage' },
      { name: 'Sét Bão (Thunder)', rarity: 'Common', basePower: 22, cost: 15, cd: 1, category: 'damage', effect: { type: 'shock', duration: 2, val: 18, name: 'Sét Bão Nhỏ' } },
      { name: 'Quả Cầu Điện (Electro Ball)', rarity: 'Rare', basePower: 32, cost: 20, cd: 1, category: 'damage', effect: { type: 'stun', duration: 2, val: 25, name: 'Giảm Tốc 25%' } },
      { name: 'Nanh Sét (Thunder Fang)', rarity: 'Rare', basePower: 38, cost: 20, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Tê Liệt (Choáng)' } },
      { name: 'Nắm Đấm Plasma (Plasma Fists)', rarity: 'Rare', basePower: 35, cost: 20, cd: 2, category: 'damage', effect: { type: 'buff_atk', duration: 2, val: 20, name: 'Tăng 20% ATK' } },
      { name: 'Mồi Điện (Magnet Bomb)', rarity: 'Rare', basePower: 30, cost: 20, cd: 2, category: 'damage', effect: { type: 'debuff_def', duration: 2, val: 25, name: 'Từ Tính Phá Giáp' } },
      { name: 'Sóng Điện Cực Tốc (Electro Drift)', rarity: 'Rare', basePower: 40, cost: 25, cd: 2, category: 'damage', effect: { type: 'extra_turn', duration: 2, val: 35, name: 'Tốc Độ Sóng (+35% SPD)' } },
      { name: 'Cú Đấm Sét Tăng Áp (Rising Voltage)', rarity: 'Rare', basePower: 42, cost: 25, cd: 2, category: 'damage', effect: { type: 'shock', duration: 2, val: 20, name: 'Điện Áp Cao' } },
      { name: 'Pháo Điện (Zap Cannon)', rarity: 'Epic', basePower: 55, cost: 30, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Tê Liệt Nặng (Choáng)' } },
      { name: 'Plasma Cổ Đại (Ancient Plasma)', rarity: 'Epic', basePower: 48, cost: 35, cd: 2, category: 'damage', effect: { type: 'debuff_atk', duration: 2, val: 30, name: 'Plasma Xuyên Thấu' } },
      { name: 'Sét Thần (Bolt Strike)', rarity: 'Legendary', basePower: 70, cost: 45, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Sét Thần (Choáng)' } },
      { name: 'Người Sét (Thunder Raid)', rarity: 'Legendary', basePower: 75, cost: 50, cd: 3, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 45, name: 'Hóa Thân Sét' } },
    ],
    Skill2: [
      { name: 'Tường Điện Nhỏ (Electric Terrain)', rarity: 'Common', baseShield: 25, cost: 20, cd: 2, category: 'shield', effect: { type: 'extra_turn', duration: 2, val: 20, name: 'Địa Hình Điện Nhỏ (+20% SPD)' } },
      { name: 'Sét Chữa Lành Nhỏ', rarity: 'Common', baseHeal: 25, cost: 20, cd: 2, category: 'heal', effect: { type: 'extra_turn', duration: 1, val: 15, name: 'Sét Nhỏ (+15% SPD)' } },
      { name: 'Cú Húc Điện Quang (Volt Tackle)', rarity: 'Rare', basePower: 45, cost: 30, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Hất Tung (Choáng)' } },
      { name: 'Xả Điện (Discharge)', rarity: 'Rare', basePower: 35, baseShield: 35, cost: 30, cd: 2, category: 'damage', effect: { type: 'shock', duration: 2, val: 15, name: 'Giật Điện' } },
      { name: 'Tường Điện (Electric Terrain)', rarity: 'Rare', baseShield: 40, cost: 25, cd: 2, category: 'shield', effect: { type: 'extra_turn', duration: 3, val: 30, name: 'Địa Hình Điện (+30% SPD)' } },
      { name: 'Cú Nhảy Hoang Dại (Wild Charge)', rarity: 'Epic', basePower: 60, cost: 40, cd: 2, category: 'true_damage', isTrueDmg: true },
      { name: 'Cưỡi Đuôi Bay (Surf Ride)', rarity: 'Epic', baseShield: 45, cost: 30, cd: 2, category: 'shield', effect: { type: 'extra_turn', duration: 3, val: 40, name: 'Lướt Sóng Điện (+40% Tốc)' } },
      { name: 'Lướt Điện (Volt Switch)', rarity: 'Epic', basePower: 48, cost: 30, cd: 2, category: 'damage', effect: { type: 'extra_turn', duration: 2, val: 50, name: 'Tráo Đổi (+50% Tốc)' } },
      { name: 'Quả Cầu Từ (Magnet Rise)', rarity: 'Epic', baseShield: 55, cost: 30, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 3, val: 40, name: 'Bay Lơ Lửng (+40% DEF)' } },
      { name: 'Năng Lượng Tích Trữ (Charge Beam)', rarity: 'Epic', basePower: 45, cost: 25, cd: 2, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 35, name: 'Tích Điện (+35% ATK)' } },
      { name: 'Lực Hấp Dẫn (Electromagnetic Force)', rarity: 'Legendary', cost: 40, cd: 3, category: 'buff', effect: { type: 'buff_atk', duration: 3, val: 40, name: 'Lực Từ (+40% ATK)' } },
      { name: 'Cú Húc Siêu Thanh (Sonic Boom)', rarity: 'Legendary', basePower: 70, cost: 45, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Siêu Thanh (Choáng)' } },
      { name: 'Nghỉ Nơi Cánh & Tốc Độ (Roost)', rarity: 'Legendary', baseHeal: 60, cost: 35, cd: 3, category: 'heal', effect: { type: 'extra_turn', duration: 3, val: 40, name: 'Tăng 40% Tốc' } },
    ],
    Ultimate: [
      { name: 'Sét Nhỏ (Small Bolt)', rarity: 'Common', basePower: 80, cost: 60, cd: 3, category: 'damage', effect: { type: 'shock', duration: 2, val: 15, name: 'Sét Nhỏ' } },
      { name: 'Tốc Độ Sét Đột Kích', rarity: 'Rare', basePower: 90, cost: 70, cd: 3, category: 'damage', effect: { type: 'extra_turn', duration: 3, val: 45, name: 'Tốc Độ Sét (+45% SPD)' } },
      { name: 'Cơn Bão Điện Sóng', rarity: 'Rare', basePower: 95, cost: 75, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Tê Liệt Diện Rộng Nhỏ' } },
      { name: 'Trận Bão Sét (Thunderstorm)', rarity: 'Epic', basePower: 115, cost: 85, cd: 4, category: 'damage', effect: { type: 'stun', duration: 3, val: 35, name: 'Mây Dông (Giảm Tốc 35%)' } },
      { name: 'Sét Vỡ Trời (Catastropika)', rarity: 'Epic', basePower: 125, cost: 85, cd: 4, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Sét Hủy Diệt (Choáng 2 lượt)' } },
      { name: 'Cơn Bão Sét Nguyên Thủy', rarity: 'Epic', basePower: 135, cost: 90, cd: 4, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 40, name: 'Giảm 40% DEF' } },
      { name: 'Cơn Bão Plasma Hủy Diệt', rarity: 'Epic', basePower: 140, cost: 90, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Trường Plasma (Hất Tung)' } },
      { name: 'Thiên Nhãn Sét Càn Quét', rarity: 'Legendary', basePower: 150, cost: 95, cd: 4, category: 'true_damage', isTrueDmg: true },
      { name: 'Thần Sét Zeus (Zekrom Strike)', rarity: 'Legendary', basePower: 165, cost: 100, cd: 4, category: 'true_damage', isTrueDmg: true, effect: { type: 'debuff_def', duration: 3, val: 50, name: 'Rồng Đen Phá Giáp' } },
      { name: 'Plasma Cực Đại (Gigavolt Havoc)', rarity: 'Legendary', basePower: 175, cost: 105, cd: 5, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Plasma Vô Hạn (Choáng 2 lượt)' } },
      { name: 'Sét Thần Thor (Thor\'s Hammer)', rarity: 'Legendary', basePower: 185, cost: 110, cd: 5, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Búa Thor (Choáng 2 lượt)' } },
      { name: 'Sét Vỡ Trời Cực Đại (Catastropika Max)', rarity: 'Mythic', basePower: 210, cost: 120, cd: 5, category: 'true_damage', isTrueDmg: true, effect: { type: 'stun', duration: 2, val: 0, name: 'Sét Cực Đại (Choáng 2 lượt)' } },
    ],
  },
  Rock: {
    Basic: [
      { name: 'Cào Xé & Dậm Đất', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Cú Quật Đuôi Đá', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Đập Cánh Cổ Đại', rarity: 'Common', basePower: 13, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
      { name: 'Móng Vuốt Đá Sắc Mảnh', rarity: 'Rare', basePower: 15, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'debuff_def', duration: 1, val: 10, name: 'Móng Sắc' } },
      { name: 'Cú Đấm Khối Đá', rarity: 'Rare', basePower: 16, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'stun', duration: 1, val: 10, name: 'Khối Đá' } },
      { name: 'Bắn Mảnh Kim Cương', rarity: 'Rare', basePower: 15, cost: 0, cd: 0, mpGain: 30, category: 'damage', effect: { type: 'stun', duration: 2, val: 15, name: 'Kim Cương Nhỏ' } },
      { name: 'Đá Nhỏ (Rock Throw)', rarity: 'Rare', basePower: 16, cost: 0, cd: 0, mpGain: 28, category: 'damage', effect: { type: 'stun', duration: 1, val: 10, name: 'Ném Đá Nhỏ' } },
      { name: 'Giáp Đá Cứng (Harden)', rarity: 'Epic', basePower: 14, cost: 0, cd: 0, mpGain: 35, category: 'damage', effect: { type: 'buff_def', duration: 1, val: 20, name: 'Giáp Cứng (+20% DEF)' } },
      { name: 'Cú Đấm Đá (Rock Smash)', rarity: 'Epic', basePower: 20, cost: 0, cd: 0, mpGain: 32, category: 'damage', effect: { type: 'debuff_def', duration: 2, val: 25, name: 'Phá Giáp Đá Mạnh' } },
      { name: 'Lở Đá Nhỏ', rarity: 'Legendary', basePower: 25, cost: 0, cd: 0, mpGain: 40, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Sỏi Bay (Choáng 2 lượt)' } },
    ],
    Skill1: [
      { name: 'Ném Đá (Rock Throw)', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage', effect: { type: 'stun', duration: 2, val: 25, name: 'Giảm Tốc 25%' } },
      { name: 'Đá Văng (Rock Blast)', rarity: 'Common', basePower: 24, cost: 15, cd: 1, category: 'damage', effect: { type: 'stun', duration: 2, val: 20, name: 'Đá Văng Đa Trúng' } },
      { name: 'Lưỡi Dao Đá Nhỏ', rarity: 'Common', basePower: 28, cost: 20, cd: 1, category: 'damage', effect: { type: 'debuff_def', duration: 2, val: 15, name: 'Dao Đá Nhỏ' } },
      { name: 'Lở Đá (Rock Slide)', rarity: 'Rare', basePower: 35, cost: 20, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Lở Đá (Choáng)' } },
      { name: 'Đột Kích Đá Nhanh (Accelerock)', rarity: 'Rare', basePower: 32, cost: 15, cd: 1, category: 'damage', effect: { type: 'extra_turn', duration: 2, val: 35, name: 'Bứt Tốc (+35% Tốc)' } },
      { name: 'Thanh Tẩy Muối Đá (Salt Cure)', rarity: 'Rare', basePower: 20, cost: 20, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 18, name: 'Xát Muối (Đốt HP)' } },
      { name: 'Mỏ Đá (Rock Wrecker)', rarity: 'Rare', basePower: 38, cost: 20, cd: 2, category: 'damage', effect: { type: 'debuff_def', duration: 2, val: 30, name: 'Mỏ Phá Giáp' } },
      { name: 'Lưỡi Dao Đá (Stone Edge)', rarity: 'Rare', basePower: 40, cost: 20, cd: 2, category: 'damage' },
      { name: 'Bẫy Đá Ẩn (Stealth Rock)', rarity: 'Rare', basePower: 25, cost: 20, cd: 2, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 35, name: 'Phá Giáp 35%' } },
      { name: 'Cơn Bão Kim Cương (Diamond Storm)', rarity: 'Epic', basePower: 48, cost: 25, cd: 2, category: 'damage', effect: { type: 'buff_def', duration: 3, val: 35, name: 'Giáp Kim Cương (+35% DEF)' } },
      { name: 'Núi Lửa (Lava Rock)', rarity: 'Legendary', basePower: 68, cost: 45, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 30, name: 'Núi Lửa Cháy' } },
      { name: 'Thạch Thần (Rock God)', rarity: 'Legendary', basePower: 72, cost: 50, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Thần Đá (Choáng)' } },
    ],
    Skill2: [
      { name: 'Giáp Đá Nhỏ (Small Rock Armor)', rarity: 'Common', baseShield: 25, cost: 20, cd: 2, category: 'shield', effect: { type: 'buff_def', duration: 2, val: 20, name: 'Giáp Đá Nhỏ (+20% DEF)' } },
      { name: 'Đá Bay Nhỏ (Small Wide Guard)', rarity: 'Common', baseShield: 30, cost: 20, cd: 2, category: 'shield', effect: { type: 'buff_def', duration: 2, val: 25, name: 'Chắn Đá Nhỏ (+25% DEF)' } },
      { name: 'Mộ Đá (Rock Tomb)', rarity: 'Rare', basePower: 30, cost: 25, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Mộ Đá Giữ Chân (Choáng)' } },
      { name: 'Bẫy Đá Ẩn (Stealth Rock)', rarity: 'Rare', basePower: 25, cost: 20, cd: 2, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 35, name: 'Phá Giáp 35%' } },
      { name: 'Bão Cát Răng Cưa (Sandstorm+)', rarity: 'Rare', basePower: 30, cost: 25, cd: 2, category: 'damage', effect: { type: 'stun', duration: 3, val: 25, name: 'Cát Răng Cưa Giảm Tốc' } },
      { name: 'Bão Cát Thức Tỉnh (Sandstorm)', rarity: 'Epic', basePower: 35, cost: 30, cd: 2, category: 'damage', effect: { type: 'buff_def', duration: 3, val: 40, name: 'Kháng Bão Cát (+40% DEF)' } },
      { name: 'Sức Mạnh Cổ Đại (Ancient Power)', rarity: 'Epic', basePower: 42, cost: 25, cd: 2, category: 'damage', effect: { type: 'buff_atk', duration: 2, val: 30, name: 'Thần Lực (+30% ATK)' } },
      { name: 'Thạch Giáp & Hồi Phục', rarity: 'Epic', baseHeal: 45, cost: 30, cd: 3, category: 'heal', effect: { type: 'buff_def', duration: 3, val: 50, name: 'Hóa Cứng (+50% DEF)' } },
      { name: 'Gương Phản Xạ (Reflect)', rarity: 'Epic', baseShield: 55, cost: 30, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 3, val: 40, name: 'Bức Tường Kim Cương' } },
      { name: 'Đá Bay (Wide Guard)', rarity: 'Epic', baseShield: 60, cost: 30, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 2, val: 50, name: 'Chắn Đá Rộng (+50% DEF)' } },
      { name: 'Lực Địa Chấn (Seismic Force)', rarity: 'Legendary', basePower: 65, cost: 40, cd: 3, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Địa Chấn Nhỏ (Choáng)' } },
      { name: 'Thiên Thạch Nhỏ (Meteor Beam)', rarity: 'Legendary', basePower: 75, cost: 50, cd: 3, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 40, name: 'Thiên Thạch Tăng Công' } },
      { name: 'Căn Đá (Ingrain)', rarity: 'Legendary', baseHeal: 55, cost: 35, cd: 3, category: 'heal', effect: { type: 'buff_def', duration: 3, val: 55, name: 'Gốc Đá Cứng (+55% DEF)' } },
    ],
    Ultimate: [
      { name: 'Đá Nhỏ (Small Rock)', rarity: 'Common', basePower: 80, cost: 60, cd: 3, category: 'damage', effect: { type: 'stun', duration: 2, val: 20, name: 'Đá Nhỏ' } },
      { name: 'Cú Vồ Sói Đêm Báo Thù', rarity: 'Rare', basePower: 95, cost: 75, cd: 3, category: 'true_damage', isTrueDmg: true },
      { name: 'Pháo Đài Muối Đá Vĩnh Cửu', rarity: 'Rare', baseShield: 55, cost: 75, cd: 3, category: 'shield', effect: { type: 'stun', duration: 3, val: 35, name: 'Sóng Chấn Động Nhỏ (-35% Tốc)' } },
      { name: 'Lưỡi Dao Đá (Stone Edge)', rarity: 'Epic', basePower: 115, cost: 80, cd: 3, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 35, name: 'Lưỡi Đá Phá Giáp' } },
      { name: 'Cơn Bão Kim Cương (Diamond Storm)', rarity: 'Epic', basePower: 120, cost: 85, cd: 4, category: 'damage', effect: { type: 'buff_def', duration: 3, val: 45, name: 'Giáp Kim Cương Đại (+45% DEF)' } },
      { name: 'Núi Lửa Bùng Nổ (Volcano Burst)', rarity: 'Epic', basePower: 130, cost: 85, cd: 4, category: 'damage', effect: { type: 'burn', duration: 4, val: 45, name: 'Núi Lửa Hủy Diệt' } },
      { name: 'Cú Chui Đất Đại Địa', rarity: 'Epic', basePower: 125, cost: 85, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Nổ Mặt Đất (Choáng)' } },
      { name: 'Cú Lao Thiên Thạch Cổ Đại', rarity: 'Legendary', basePower: 145, cost: 90, cd: 4, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 45, name: 'Xuyên Phá Giáp 45%' } },
      { name: 'Hoa Kim Cương Hoàng Gia', rarity: 'Legendary', basePower: 155, baseShield: 50, cost: 100, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Mắt Lóa (Choáng)' } },
      { name: 'Thần Đá Cổ Đại (Ancient Rock God)', rarity: 'Legendary', basePower: 165, cost: 100, cd: 4, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Thần Đá (Choáng 2 lượt)' } },
      { name: 'Kim Cương Vô Cực (Infinite Diamond)', rarity: 'Legendary', basePower: 175, baseShield: 80, cost: 110, cd: 5, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 55, name: 'Kim Cương Phá Hủy' } },
      { name: 'Đại Địa Nữ Thần (Gaia)', rarity: 'Mythic', basePower: 210, cost: 120, cd: 5, category: 'damage', effect: { type: 'stun', duration: 2, val: 0, name: 'Quyền Linh Đại Địa' } },
    ],
  },
}

// --- GIỚI HẠN ---
export const INVENTORY_LIMIT = 150
export const POKEDEX_LIMIT = 20

// --- BANNER GACHA ---
// Cơ chế data-driven: mỗi banner có danh sách `pokemons` riêng (tên Pokémon).
// Muốn thêm/bớt Pokémon trong banner nào thì sửa danh sách đó (thêm/đổi tên),
// không phụ thuộc vào minRarity của species.
export const GACHA_BANNERS = [
  {
    id: 'standard',
    name: 'Banner Thường',
    cost: 100,
    currency: 'gems',
    pokemons: [
      // --- HỆ LỬA (FIRE) 🔥 ---
      'Charizard', 'Blaziken', 'Arcanine', 'Infernape', 'Fuecoco', 'Flareon',
      'Ninetales', 'Typhlosion', 'Cinderace', 'Houndoom',
      // --- HỆ NƯỚC (WATER) 💧 ---
      'Greninja', 'Blastoise', 'Gyarados', 'Vaporeon', 'Mudkip', 'Kyogre',
      'Milotic', 'Lapras', 'Feraligatr', 'Primarina',
      // --- HỆ ĐIỆN / SÉT (ELECTRIC) ⚡ ---
      'Pikachu', 'Raichu', 'Luxray', 'Zapdos', 'Jolteon', 'Zeraora',
      'Electivire', 'Manectric', 'Morpeko',
      // --- HỆ CỎ (GRASS) 🌿 ---
      'Bulbasaur', 'Squirtle', 'Charmander', 'Sceptile', 'Decidueye', 'Meowscarada',
      'Celebi', 'Leafeon', 'Venusaur', 'Torterra', 'Roserade',
      // --- HỆ ĐÁ (ROCK) 🪨 ---
      'Tyranitar', 'Onix', 'Aerodactyl', 'Lycanroc', 'Garganacl', 'Diancie',
      'Rayquaza', 'Garchomp', 'Golem', 'Rhyperior', 'Aggron',
      // --- DẠNG TIỀN TIẾN HÓA (ĐÁ) ---
      'Vulpix', 'Growlithe', 'Magikarp', 'Larvitar', 'Eevee',
    ],
    ribbon: 'Cơ bản',
    rarityChances: {
      Common: 58.0,
      Rare: 30.0,
      Epic: 10.0,
      Legendary: 1.8,
      Mythic: 0.199,
      Secret: 0.001,
    },
  },
  {
    id: 'legendary',
    name: 'Banner Huyền Thoại',
    cost: 150,
    currency: 'pokePoint',
    includeStandard: true,
    pokemons: ['Ho-Oh', 'Lugia', 'Raikou'],
    rateUp: true,
    rateUpWeight: 2,
    ribbon: 'Hot!',
    rarityChances: {
      Common: 58.0,
      Rare: 30.0,
      Epic: 10.0,
      Legendary: 1.8,
      Mythic: 0.199,
      Secret: 0.001,
    },
  },
  
]

// Trả về danh sách Pokémon có thể xuất hiện trong banner
// (lọc theo danh sách `pokemons` của banner; list rỗng = tất cả species.
// Nếu banner có `includeStandard: true` thì tự động gộp thêm toàn bộ Pokémon của Banner Thường)
export function getBannerSpeciesPool(banner) {
  let names = banner.pokemons || []
  if (banner.includeStandard) {
    const standard = GACHA_BANNERS.find((b) => b.id === 'standard')
    if (standard) names = [...(standard.pokemons || []), ...names]
  }
  const uniqueNames = [...new Set(names)]
  if (uniqueNames.length === 0) return [...POKEMON_SPECIES]
  return POKEMON_SPECIES.filter((s) => uniqueNames.includes(s.name))
}

// --- CỬA HÀNG ĐỔI ĐIỂM POKEGACHA ---
export const SHOP_ITEMS = [
  { name: 'Ho-Oh', cost: 200, rarityName: 'Legendary', bannerId: 'legendary' },
  { name: 'Lugia', cost: 200, rarityName: 'Legendary', bannerId: 'legendary' },
  { name: 'Raikou', cost: 200, rarityName: 'Legendary', bannerId: 'legendary' },
  { name: 'Charizard', cost: 80, rarityName: 'Epic', bannerId: 'standard' },
  { name: 'Blastoise', cost: 80, rarityName: 'Epic', bannerId: 'standard' },
  { name: 'Sceptile', cost: 80, rarityName: 'Epic', bannerId: 'standard' },
]
