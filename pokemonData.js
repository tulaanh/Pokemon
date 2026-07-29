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

const RARITY_LEVELS = ['Common', 'Rare', 'Epic', 'Legendary'];

const RARITIES = [
    { name: 'Common', chance: 50, color: 'rarity-Common', statMult: 1.0, skillMin: 0.8, skillMax: 1.1 },
    { name: 'Rare', chance: 30, color: 'rarity-Rare', statMult: 1.3, skillMin: 1.1, skillMax: 1.4 },
    { name: 'Epic', chance: 15, color: 'rarity-Epic', statMult: 1.6, skillMin: 1.4, skillMax: 1.8 },
    { name: 'Legendary', chance: 5, color: 'rarity-Legendary', statMult: 2.2, skillMin: 1.9, skillMax: 2.5 }
];

// --- CÁC LOÀI POKEMON (BAO GỒM DEF) ---
const POKEMON_SPECIES = [
    { name: 'Charmander', type: 'Fire', baseHp: 110, baseAtk: 22, baseDef: 15, baseSpeed: 115, baseInitMp: 30 },
    { name: 'Magmar', type: 'Fire', baseHp: 125, baseAtk: 25, baseDef: 18, baseSpeed: 105, baseInitMp: 25 },
    { name: 'Squirtle', type: 'Water', baseHp: 130, baseAtk: 18, baseDef: 25, baseSpeed: 95, baseInitMp: 20 },
    { name: 'Psyduck', type: 'Water', baseHp: 120, baseAtk: 21, baseDef: 16, baseSpeed: 100, baseInitMp: 30 },
    { name: 'Bulbasaur', type: 'Grass', baseHp: 120, baseAtk: 20, baseDef: 20, baseSpeed: 100, baseInitMp: 25 },
    { name: 'Oddish', type: 'Grass', baseHp: 115, baseAtk: 19, baseDef: 17, baseSpeed: 90, baseInitMp: 20 },
    { name: 'Pikachu', type: 'Electric', baseHp: 95, baseAtk: 26, baseDef: 12, baseSpeed: 140, baseInitMp: 40 },
    { name: 'Voltorb', type: 'Electric', baseHp: 90, baseAtk: 23, baseDef: 14, baseSpeed: 150, baseInitMp: 35 },
    { name: 'Geodude', type: 'Rock', baseHp: 210, baseAtk: 17, baseDef: 40, baseSpeed: 75, baseInitMp: 15 },
    { name: 'Onix', type: 'Rock', baseHp: 280, baseAtk: 21, baseDef: 55, baseSpeed: 80, baseInitMp: 20 },
    { name: 'Rattata', type: 'Grass', baseHp: 90, baseAtk: 16, baseDef: 10, baseSpeed: 110, baseInitMp: 20 },
    { name: 'Pidgey', type: 'Electric', baseHp: 100, baseAtk: 18, baseDef: 12, baseSpeed: 120, baseInitMp: 20 },
    { name: 'Machop', type: 'Fire', baseHp: 140, baseAtk: 24, baseDef: 22, baseSpeed: 85, baseInitMp: 20 }
];

// --- KHO KỸ NĂNG NGUYÊN TỐ (ĐÃ KHẮC PHỤC LỖI UNDEFINED & BỔ SUNG SÁT THƯƠNG CHUẨN/BUFF) ---
const ELEMENTAL_SKILL_TEMPLATES = {
    Fire: {
        Basic: [
            { name: 'Cào Xé Lửa', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' }
        ],
        Skill1: [
            { name: 'Tia Lửa Nhỏ', rarity: 'Common', basePower: 20, cost: 15, cd: 1, category: 'damage', effect: { type: 'burn', duration: 2, val: 8, name: 'Bỏng Nhẹ' } },
            { name: 'Cuồng Nổ Hỏa Lực', rarity: 'Rare', cost: 20, cd: 2, category: 'buff', effect: { type: 'buff_atk', duration: 2, val: 30, name: 'Tăng 30% ATK' } },
            { name: 'Lớp Giáp Nhiệt', rarity: 'Rare', baseShield: 35, cost: 20, cd: 2, category: 'shield' },
            { name: 'Thiêu Rụi Giáp', rarity: 'Epic', basePower: 30, cost: 25, cd: 2, category: 'damage', effect: { type: 'debuff_def', duration: 2, val: 35, name: 'Phá Giáp 35%' } }
        ],
        Skill2: [
            { name: 'Phun Lửa', rarity: 'Common', basePower: 35, cost: 35, cd: 2, category: 'damage' },
            { name: 'Hỏa Xuyên Phá', rarity: 'Rare', basePower: 40, cost: 40, cd: 2, category: 'true_damage', isTrueDmg: true },
            { name: 'Vòng Lửa Hồi Phục', rarity: 'Rare', baseHeal: 40, cost: 40, cd: 3, category: 'heal' },
            { name: 'Bùng Nổ Nhiệt Lượng', rarity: 'Epic', basePower: 68, cost: 50, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 24, name: 'Thiêu Đốt' } }
        ],
        Ultimate: [
            { name: 'Bão Lửa Tập Kích', rarity: 'Rare', basePower: 75, cost: 75, cd: 3, category: 'damage' },
            { name: 'Hỏa Ngục Bộc Phá', rarity: 'Epic', basePower: 80, cost: 85, cd: 3, category: 'true_damage', isTrueDmg: true },
            { name: 'Bão Lửa Địa Ngục', rarity: 'Legendary', basePower: 140, cost: 90, cd: 3, category: 'damage', effect: { type: 'burn', duration: 4, val: 40, name: 'Địa Ngục' } }
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