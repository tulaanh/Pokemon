// ==========================================
// POKEMON DATA & SKILL TEMPLATES MODULE
// ==========================================

// --- BẢNG TƯƠNG TÁC HỆ ---
const TYPE_CHART = {
    Fire: { Grass: 1.5, Water: 0.75, Fire: 0.75, Rock: 0.75 },
    Water: { Fire: 1.5, Rock: 1.5, Grass: 0.75, Water: 0.75 },
    Grass: { Water: 1.5, Rock: 1.5, Fire: 0.75, Grass: 0.75 },
    Electric: { Water: 1.5, Grass: 0.75, Electric: 0.75, Rock: 0.5 },
    Rock: { Fire: 1.5, Electric: 1.5, Grass: 0.75, Water: 0.75 }
};

const RARITY_LEVELS = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret'];
// --- CẬP NHẬT CHỈ SỐ ĐỘ HIẾM ---
// --- CẬP NHẬT CHỈ SỐ ĐỘ HIẾM TẠI MODULE POKEMON DATA ---
const RARITIES = [
    { name: 'Common', color: 'rarity-Common', statMult: 1.0, chance: 50.0, skillMin: 0.9, skillMax: 1.1 },
    { name: 'Rare', color: 'rarity-Rare', statMult: 1.2, chance: 30.0, skillMin: 1.1, skillMax: 1.3 },
    { name: 'Epic', color: 'rarity-Epic', statMult: 1.5, chance: 15.0, skillMin: 1.3, skillMax: 1.6 },
    { name: 'Legendary', color: 'rarity-Legendary', statMult: 2.0, chance: 4.0, skillMin: 1.6, skillMax: 2.0 },
    { name: 'Mythic', color: 'rarity-Mythic', statMult: 3.0, chance: 0.9, skillMin: 2.0, skillMax: 2.5 },
    { name: 'Secret', color: 'rarity-Secret', statMult: 5.0, chance: 0.1, skillMin: 2.5, skillMax: 3.5 }
];
// --- CÁC LOÀI POKEMON (BAO GỒM DEF) ---
// --- CÁC LOÀI POKEMON (30 POKEMON ĐẠI DIỆN 5 HỆ) ---
const POKEMON_SPECIES = [
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
    { name: 'Diancie', type: 'Rock', baseHp: 220, baseAtk: 28, baseDef: 50, baseSpeed: 95, baseInitMp: 30 }
];

// --- KHO KỸ NĂNG NGUYÊN TỐ (ĐÃ KHẮC PHỤC LỖI UNDEFINED & BỔ SUNG SÁT THƯƠNG CHUẨN/BUFF) ---
const ELEMENTAL_SKILL_TEMPLATES = {
    Fire: {
        Basic: [
            { name: 'Cào Xé Lửa', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
            { name: 'Đấm Đá Liên Hoàn', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' },
            { name: 'Quyền Thuật Lửa', rarity: 'Common', basePower: 13, cost: 0, cd: 0, mpGain: 25, category: 'damage' }
        ],
        Skill1: [
            // Của Fuecoco & Flareon & Các skill cơ bản
            { name: 'Tia Lửa (Ember)', rarity: 'Common', basePower: 20, cost: 15, cd: 1, category: 'damage', effect: { type: 'burn', duration: 2, val: 8, name: 'Bỏng Nhẹ' } },
            { name: 'Tấn Công Nhanh', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage' },
            // Của Charizard
            { name: 'Phun Lửa (Flamethrower)', rarity: 'Rare', basePower: 35, cost: 25, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 15, name: 'Thiêu Đốt' } },
            // Của Infernape & Arcanine
            { name: 'Cú Đấm Tốc Độ', rarity: 'Rare', basePower: 30, cost: 20, cd: 1, category: 'damage', effect: { type: 'buff_speed', duration: 2, val: 30, name: 'Tăng 30% SPD' } },
            { name: 'Tốc Độ Cực Hạn', rarity: 'Epic', basePower: 45, cost: 30, cd: 2, category: 'damage', effect: { type: 'buff_speed', duration: 3, val: 50, name: 'Tốc Độ Ánh Sáng' } },
            // Của Blaziken
            { name: 'Cú Đá Bùng Cháy', rarity: 'Epic', basePower: 50, cost: 35, cd: 2, category: 'true_damage', isTrueDmg: true } 
        ],
        Skill2: [
            // Của Fuecoco
            { name: 'Ngáp (Yawn)', rarity: 'Rare', cost: 25, cd: 3, category: 'debuff', effect: { type: 'stun', duration: 1, val: 0, name: 'Buồn Ngủ (Choáng)' } },
            // Của Charizard & Infernape
            { name: 'Cú Đấm Lửa (Fire Punch)', rarity: 'Rare', basePower: 45, cost: 35, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Đẩy Lùi (Choáng)' } },
            { name: 'Bánh Xe Lửa (Flame Wheel)', rarity: 'Rare', basePower: 40, cost: 35, cd: 2, category: 'damage', effect: { type: 'buff_speed', duration: 2, val: 20, name: 'Tăng 20% Tốc' } },
            // Của Arcanine & Flareon
            { name: 'Lửa Ma Trái (Will-O-Wisp)', rarity: 'Epic', basePower: 20, cost: 30, cd: 3, category: 'damage', effect: { type: 'debuff_atk', duration: 3, val: 40, name: 'Giảm 40% ATK' } },
            { name: 'Cột Nham Thạch (Lava Plume)', rarity: 'Epic', basePower: 55, cost: 45, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 25, name: 'Cháy Rát' } },
            // Của Blaziken
            { name: 'Bão Lửa (Fire Blast)', rarity: 'Legendary', basePower: 70, cost: 50, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 35, name: 'Biển Lửa' } }
        ],
        Ultimate: [
            // Của Fuecoco & Flareon
            { name: 'Khúc Ca Bùng Cháy', rarity: 'Epic', basePower: 90, cost: 80, cd: 3, category: 'damage', effect: { type: 'buff_atk', duration: 3, val: 40, name: 'Tăng 40% ATK' } },
            { name: 'Vòng Xoáy Lửa (Fire Spin)', rarity: 'Epic', basePower: 85, cost: 75, cd: 3, category: 'damage', effect: { type: 'burn', duration: 4, val: 30, name: 'Khóa Chặt (Cháy)' } },
            // Của Charizard & Arcanine
            { name: 'Cú Ném Trái Đất (Seismic Toss)', rarity: 'Legendary', basePower: 120, cost: 85, cd: 3, category: 'true_damage', isTrueDmg: true },
            { name: 'Tấn Công Bùng Cháy (Flare Blitz)', rarity: 'Legendary', basePower: 135, cost: 90, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 45, name: 'Thiêu Rụi' } },
            // Của Infernape & Blaziken
            { name: 'Hỏa Ngục Bùng Nổ', rarity: 'Mythic', basePower: 150, cost: 95, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Hất Văng (Choáng)' } },
            { name: 'Thiêu Đốt Đại Địa (Overheat)', rarity: 'Mythic', basePower: 160, cost: 100, cd: 4, category: 'damage', effect: { type: 'buff_atk', duration: 2, val: 60, name: 'Giải Phóng Năng Lượng' } }
        ]
    },
    Water: {
        Basic: [ 
            { name: 'Đòn Nước Nhẹ', rarity: 'Common', basePower: 10, cost: 0, cd: 0, mpGain: 25, category: 'damage' } 
        ],
        Skill1: [
            { name: 'Bóng Nước', rarity: 'Common', basePower: 18, cost: 15, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 20, name: 'Giảm Tốc 20%' } },
            { name: 'Thủy Giáp Bảo Hộ', rarity: 'Rare', baseShield: 30, cost: 20, cd: 2, category: 'shield', effect: { type: 'buff_def', duration: 2, val: 40, name: 'Tăng 40% DEF' } }
        ],
        Skill2: [
            { name: 'Dòng Nước Xoáy', rarity: 'Common', basePower: 34, cost: 35, cd: 2, category: 'damage' },
            { name: 'Thủy Áp Xuyên Thấu', rarity: 'Epic', basePower: 50, cost: 45, cd: 2, category: 'true_damage', isTrueDmg: true }
        ],
        Ultimate: [
            { name: 'Sóng Thần Cuồng Nổ', rarity: 'Epic', basePower: 100, cost: 80, cd: 3, category: 'damage' },
            { name: 'Đại Dương Phục Sinh', rarity: 'Legendary', baseHeal: 110, baseShield: 60, cost: 85, cd: 4, category: 'heal' }
        ]
    },
    Grass: {
        Basic: [ 
            { name: 'Roi Gai Cơ Bản', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' } 
        ],
        Skill1: [
            { name: 'Gai Tẩy Cực', rarity: 'Rare', basePower: 25, cost: 20, cd: 2, category: 'true_damage', isTrueDmg: true },
            { name: 'Áo Giáp Gai Phản Đòn', rarity: 'Rare', baseShield: 30, cost: 20, cd: 2, category: 'shield', effect: { type: 'thorn', duration: 3, val: 30, name: 'Giáp Gai 30%' } }
        ],
        Skill2: [
            { name: 'Hạt Giống Ký Sinh', rarity: 'Rare', baseHeal: 45, cost: 40, cd: 3, category: 'heal' },
            { name: 'Tăng Trưởng Sinh Mệnh', rarity: 'Epic', cost: 35, cd: 3, category: 'buff', effect: { type: 'buff_def', duration: 3, val: 50, name: 'Tăng 50% DEF' } }
        ],
        Ultimate: [
            { name: 'Cuồng Phong Thực Vật', rarity: 'Epic', basePower: 102, cost: 80, cd: 3, category: 'damage' }
        ]
    },
    Electric: {
        Basic: [ 
            { name: 'Chớp Điện', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' } 
        ],
        Skill1: [
            { name: 'Tia Điện Tê Liệt', rarity: 'Common', basePower: 20, cost: 15, cd: 1, category: 'damage', effect: { type: 'shock', duration: 1, val: 10, name: 'Giật Nhẹ' } },
            { name: 'Quá Tải Điện Cấp', rarity: 'Rare', cost: 20, cd: 2, category: 'buff', effect: { type: 'buff_atk', duration: 2, val: 20, name: 'Tăng 20% ATK' } },
            { name: 'Điện 100 ngày volt', rarity: 'Epic', basePower: 45, cost: 40, cd: 5, category: 'damage', effect: { type: 'shock', duration: 5, val: 50, name: 'Giật tê tê' } }
        ],
        Skill2: [
            { name: 'Tia Xuyên Lôi', rarity: 'Epic', basePower: 55, cost: 45, cd: 2, category: 'true_damage', isTrueDmg: true }
        ],
        Ultimate: [
            { name: 'Thiên Lôi Hủy Diệt', rarity: 'Epic', basePower: 108, cost: 85, cd: 3, category: 'damage' }
        ]
    },
    Rock: {
        Basic: [ 
            { name: 'Ném Đá Cổ Đại', rarity: 'Common', basePower: 15, cost: 0, cd: 0, mpGain: 25, category: 'damage' } 
        ],
        Skill1: [
            { name: 'Kiên Cố Thạch Giáp', rarity: 'Common', cost: 15, cd: 2, category: 'buff', effect: { type: 'buff_def', duration: 3, val: 40, name: 'Tăng 40% DEF' } },
            { name: 'Vạn Lý Thạch Giáp', rarity: 'Rare', baseShield: 40, cost: 20, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Địa Chấn Nhẹ', rarity: 'Common', basePower: 38, cost: 35, cd: 2, category: 'damage' },
            { name: 'Phá Giáp Thạch Anh', rarity: 'Epic', basePower: 45, cost: 40, cd: 2, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 50, name: 'Giảm 50% DEF' } }
        ],
        Ultimate: [
            { name: 'Động Đất Tận Diệt', rarity: 'Legendary', basePower: 145, cost: 95, cd: 3, category: 'damage' }
        ]
    }
};