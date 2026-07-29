// --- TYPE ADVANTAGE MATRIX ---
const TYPE_CHART = {
    Fire: { Grass: 1.5, Water: 0.75, Fire: 0.75, Rock: 0.75 },
    Water: { Fire: 1.5, Rock: 1.5, Grass: 0.75, Water: 0.75 },
    Grass: { Water: 1.5, Rock: 1.5, Fire: 0.75, Grass: 0.75 },
    Electric: { Water: 1.5, Grass: 0.75, Electric: 0.75, Rock: 0.5 },
    Rock: { Fire: 1.5, Electric: 1.5, Grass: 0.75, Water: 0.75 }
};

// --- DATABASE & RARITY ---
const RARITIES = [
    { name: 'Common', chance: 50, color: 'rarity-Common', statMult: 1.0, skillMin: 0.8, skillMax: 1.1 },
    { name: 'Rare', chance: 30, color: 'rarity-Rare', statMult: 1.3, skillMin: 1.1, skillMax: 1.4 },
    { name: 'Epic', chance: 15, color: 'rarity-Epic', statMult: 1.6, skillMin: 1.4, skillMax: 1.8 },
    { name: 'Legendary', chance: 5, color: 'rarity-Legendary', statMult: 2.2, skillMin: 1.9, skillMax: 2.5 }
];

// Mới: Thêm thuộc tính innateSkill1 cho từng Pokémon
const POKEMON_SPECIES = [
    { name: 'Charmander', type: 'Fire', baseHp: 110, baseAtk: 22, baseSpeed: 115, baseInitMp: 30, innateSkill1: { name: 'Mồi Lửa Tẩy Náo', basePower: 24, cost: 20, cd: 1, category: 'damage', effect: { type: 'burn', duration: 3, val: 12, name: 'Thiêu Đốt Bẩm Sinh' } } },
    { name: 'Magmar', type: 'Fire', baseHp: 125, baseAtk: 25, baseSpeed: 105, baseInitMp: 25, innateSkill1: { name: 'Giáp Nham Thạch', baseShield: 35, cost: 25, cd: 2, category: 'shield', effect: { type: 'burn', duration: 2, val: 15, name: 'Phản Ứng Nhiệt' } } },
    { name: 'Squirtle', type: 'Water', baseHp: 130, baseAtk: 18, baseSpeed: 95, baseInitMp: 20, innateSkill1: { name: 'Rút Vào Mai Vỏ', baseShield: 40, cost: 20, cd: 2, category: 'shield' } },
    { name: 'Psyduck', type: 'Water', baseHp: 120, baseAtk: 21, baseSpeed: 100, baseInitMp: 30, innateSkill1: { name: 'Sóng Niệm Lực Water', basePower: 28, cost: 25, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 35, name: 'Choáng Tốc 35%' } } },
    { name: 'Bulbasaur', type: 'Grass', baseHp: 120, baseAtk: 20, baseSpeed: 100, baseInitMp: 25, innateSkill1: { name: 'Hạt Giống Ký Sinh Bẩm Sinh', baseHeal: 25, cost: 20, cd: 2, category: 'heal' } },
    { name: 'Oddish', type: 'Grass', baseHp: 115, baseAtk: 19, baseSpeed: 90, baseInitMp: 20, innateSkill1: { name: 'Bột Gai Phản Đòn', baseShield: 28, cost: 20, cd: 2, category: 'shield', effect: { type: 'thorn', duration: 3, val: 35, name: 'Giáp Gai Bẩm Sinh' } } },
    { name: 'Pikachu', type: 'Electric', baseHp: 95, baseAtk: 26, baseSpeed: 140, baseInitMp: 40, innateSkill1: { name: 'Điện Giật Tinh Anh', basePower: 30, cost: 25, cd: 1, category: 'damage', effect: { type: 'shock', duration: 2, val: 15, name: 'Sốc Điện Đặt Biệt' } } },
    { name: 'Voltorb', type: 'Electric', baseHp: 90, baseAtk: 23, baseSpeed: 150, baseInitMp: 35, innateSkill1: { name: 'Tĩnh Điện Tốc Độ', baseShield: 30, cost: 20, cd: 2, category: 'shield' } },
    { name: 'Geodude', type: 'Rock', baseHp: 210, baseAtk: 17, baseSpeed: 75, baseInitMp: 15, innateSkill1: { name: 'Cứng Như Đá Cổ', baseShield: 50, cost: 20, cd: 2, category: 'shield' } },
    { name: 'Onix', type: 'Rock', baseHp: 280, baseAtk: 21, baseSpeed: 80, baseInitMp: 20, innateSkill1: { name: 'Đá Đè Đất Cổ', basePower: 26, cost: 25, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 30, name: 'Trì Trệ 30%' } } },
    { name: 'Rattata', type: 'Grass', baseHp: 90, baseAtk: 16, baseSpeed: 110, baseInitMp: 20, innateSkill1: { name: 'Cắn Răng Nhanh', basePower: 22, cost: 15, cd: 1, category: 'damage' } },
    { name: 'Pidgey', type: 'Electric', baseHp: 100, baseAtk: 18, baseSpeed: 120, baseInitMp: 20, innateSkill1: { name: 'Cánh Điện Nhẹ', basePower: 20, cost: 15, cd: 1, category: 'damage', effect: { type: 'shock', duration: 1, val: 10, name: 'Giật Nhẹ' } } },
    { name: 'Machop', type: 'Fire', baseHp: 140, baseAtk: 24, baseSpeed: 85, baseInitMp: 20, innateSkill1: { name: 'Cú Đấm Nhiệt Lực', basePower: 27, cost: 20, cd: 1, category: 'damage' } }
];

// Kho Kỹ Năng Học Mở Rộng
// Kho Kỹ Năng Phân Cấp Theo Độ Hiếm
const ELEMENTAL_SKILL_TEMPLATES = {
    Fire: {
        Basic: [
            { name: 'Cào Xé Lửa', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' }
        ],
        Skill1: [
            { name: 'Tia Lửa Nhỏ', rarity: 'Common', basePower: 20, cost: 15, cd: 1, category: 'damage', effect: { type: 'burn', duration: 2, val: 8, name: 'Bỏng Nhẹ' } },
            { name: 'Tia Lửa Đốt Bỏng', rarity: 'Rare', basePower: 28, cost: 20, cd: 1, category: 'damage', effect: { type: 'burn', duration: 3, val: 14, name: 'Thiêu Đốt' } },
            { name: 'Lớp Giáp Nhiệt', rarity: 'Rare', baseShield: 35, cost: 20, cd: 2, category: 'shield' },
            { name: 'Bảo Hộ Hỏa Thần', rarity: 'Epic', baseShield: 55, cost: 25, cd: 2, category: 'shield', effect: { type: 'burn', duration: 2, val: 18, name: 'Bỏng Phản Phệ' } }
        ],
        Skill2: [
            { name: 'Phun Lửa', rarity: 'Common', basePower: 35, cost: 35, cd: 2, category: 'damage' },
            { name: 'Phun Lửa Lớn', rarity: 'Rare', basePower: 48, cost: 40, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 16, name: 'Thiêu Đốt' } },
            { name: 'Vòng Lửa Hồi Phục', rarity: 'Rare', baseHeal: 40, cost: 40, cd: 3, category: 'heal' },
            { name: 'Bùng Nổ Nhiệt Lượng', rarity: 'Epic', basePower: 68, cost: 50, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 24, name: 'Thiêu Đốt Báo Thù' } },
            { name: 'Hỏa Cầu Hủy Diệt', rarity: 'Legendary', basePower: 90, cost: 55, cd: 2, category: 'damage', effect: { type: 'burn', duration: 4, val: 32, name: 'Hỏa Ngục Chấn Động' } }
        ],
        Ultimate: [
            { name: 'Bão Lửa Tập Kích', rarity: 'Rare', basePower: 75, cost: 75, cd: 3, category: 'damage' },
            { name: 'Rồng Lửa Hủy Diệt', rarity: 'Epic', basePower: 105, cost: 80, cd: 3, category: 'damage', effect: { type: 'burn', duration: 4, val: 30, name: 'Thiêu Đốt Cuồng Nổ' } },
            { name: 'Bão Lửa Địa Ngục', rarity: 'Legendary', basePower: 140, cost: 90, cd: 3, category: 'damage', effect: { type: 'burn', duration: 4, val: 40, name: 'Địa Ngục Thiêu Rụi' } }
        ]
    },
    Water: {
        Basic: [
            { name: 'Đòn Nước Nhẹ', rarity: 'Common', basePower: 10, cost: 0, cd: 0, mpGain: 25, category: 'damage' }
        ],
        Skill1: [
            { name: 'Bóng Nước', rarity: 'Common', basePower: 18, cost: 15, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 20, name: 'Giảm Tốc 20%' } },
            { name: 'Bóng Nước Làm Chậm', rarity: 'Rare', basePower: 26, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 35, name: 'Giảm Tốc 35%' } },
            { name: 'Khiên Bong Bóng', rarity: 'Rare', baseShield: 35, cost: 20, cd: 2, category: 'shield' },
            { name: 'Thủy Giáp Kiên Cố', rarity: 'Epic', baseShield: 58, cost: 25, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Dòng Nước Xoáy', rarity: 'Common', basePower: 34, cost: 35, cd: 2, category: 'damage' },
            { name: 'Thủy Pháo Làm Băng', rarity: 'Rare', basePower: 46, cost: 40, cd: 2, category: 'damage', effect: { type: 'slow', duration: 3, val: 40, name: 'Giảm Tốc 40%' } },
            { name: 'Dòng Sống Hồi Sinh', rarity: 'Rare', baseHeal: 42, cost: 45, cd: 3, category: 'heal' },
            { name: 'Thủy Giáp Bảo Hộ', rarity: 'Epic', baseShield: 65, cost: 40, cd: 3, category: 'shield' },
            { name: 'Dòng Nước Xiết Cuồng Phong', rarity: 'Legendary', basePower: 88, cost: 50, cd: 2, category: 'damage', effect: { type: 'slow', duration: 3, val: 55, name: 'Giảm Tốc Siêu Cấp 55%' } }
        ],
        Ultimate: [
            { name: 'Sóng Thần Đột Kích', rarity: 'Rare', basePower: 70, cost: 70, cd: 3, category: 'damage' },
            { name: 'Sóng Thần Cuồng Nổ', rarity: 'Epic', basePower: 100, cost: 80, cd: 3, category: 'damage', effect: { type: 'slow', duration: 3, val: 50, name: 'Giảm Tốc 50%' } },
            { name: 'Đại Dương Phục Sinh', rarity: 'Legendary', baseHeal: 110, baseShield: 60, cost: 85, cd: 4, category: 'heal' }
        ]
    },
    Grass: {
        Basic: [
            { name: 'Roi Gai Cơ Bản', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' }
        ],
        Skill1: [
            { name: 'Lá Sắc Nhọn', rarity: 'Common', basePower: 22, cost: 15, cd: 1, category: 'damage' },
            { name: 'Áo Giáp Gai Phản Đòn', rarity: 'Rare', baseShield: 30, cost: 20, cd: 2, category: 'shield', effect: { type: 'thorn', duration: 3, val: 30, name: 'Giáp Gai (30% Reflect)' } },
            { name: 'Thạch Mộc Hộ Thể', rarity: 'Epic', baseShield: 52, cost: 25, cd: 2, category: 'shield', effect: { type: 'thorn', duration: 3, val: 45, name: 'Giáp Gai Cao Cấp 45%' } }
        ],
        Skill2: [
            { name: 'Bão Lá Tấn Công', rarity: 'Common', basePower: 36, cost: 35, cd: 2, category: 'damage' },
            { name: 'Hạt Giống Ký Sinh', rarity: 'Rare', baseHeal: 45, cost: 40, cd: 3, category: 'heal' },
            { name: 'Vỏ Cây Giáp Gai Cổ Thụ', rarity: 'Rare', baseShield: 45, cost: 35, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 40, name: 'Giáp Gai (40% Reflect)' } },
            { name: 'Rễ Cây Cổ Thụ', rarity: 'Epic', baseShield: 65, cost: 40, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 55, name: 'Giáp Gai Cổ Thụ (55% Reflect)' } },
            { name: 'Xung Kích Rừng Cổ', rarity: 'Legendary', basePower: 85, cost: 50, cd: 2, category: 'damage', effect: { type: 'thorn', duration: 4, val: 65, name: 'Bão Gai Cuồng Nổ 65%' } }
        ],
        Ultimate: [
            { name: 'Mưa Lá Cuồng Phong', rarity: 'Rare', basePower: 72, cost: 75, cd: 3, category: 'damage' },
            { name: 'Cuồng Phong Thực Vật', rarity: 'Epic', basePower: 102, cost: 80, cd: 3, category: 'damage' },
            { name: 'Thần Rừng Hồi Sinh', rarity: 'Legendary', baseHeal: 105, baseShield: 70, cost: 85, cd: 4, category: 'heal' }
        ]
    },
    Electric: {
        Basic: [
            { name: 'Chớp Điện', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' }
        ],
        Skill1: [
            { name: 'Tia Điện Tê Liệt', rarity: 'Common', basePower: 20, cost: 15, cd: 1, category: 'damage', effect: { type: 'shock', duration: 1, val: 10, name: 'Giật Nhẹ' } },
            { name: 'Sốc Điện Tê Liệt', rarity: 'Rare', basePower: 28, cost: 20, cd: 1, category: 'damage', effect: { type: 'shock', duration: 2, val: 16, name: 'Nhiễm Điện' } },
            { name: 'Trường Điện Từ', rarity: 'Rare', baseShield: 30, cost: 20, cd: 2, category: 'shield' },
            { name: 'Lôi Giáp Cuồng Bộc', rarity: 'Epic', baseShield: 50, cost: 25, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Tia Sét Xung Kích', rarity: 'Common', basePower: 38, cost: 35, cd: 2, category: 'damage' },
            { name: 'Sấm Sét Liên Hoàn', rarity: 'Rare', basePower: 52, cost: 45, cd: 2, category: 'damage', effect: { type: 'shock', duration: 3, val: 20, name: 'Nhiễm Điện' } },
            { name: 'Quả Cầu Tĩnh Điện', rarity: 'Epic', basePower: 70, cost: 50, cd: 3, category: 'damage', effect: { type: 'shock', duration: 3, val: 28, name: 'Sốc Điện Cao Cấp' } },
            { name: 'Ma Trận Sấm Sét', rarity: 'Legendary', basePower: 92, cost: 55, cd: 2, category: 'damage', effect: { type: 'shock', duration: 3, val: 38, name: 'Bào Máu Tĩnh Điện' } }
        ],
        Ultimate: [
            { name: 'Tia Sét Hoàng Gia', rarity: 'Rare', basePower: 78, cost: 75, cd: 3, category: 'damage' },
            { name: 'Thiên Lôi Hủy Diệt', rarity: 'Epic', basePower: 108, cost: 85, cd: 3, category: 'damage', effect: { type: 'shock', duration: 3, val: 32, name: 'Sốc Điện Nặng' } },
            { name: 'Bão Điện Siêu Cấp', rarity: 'Legendary', basePower: 130, cost: 95, cd: 3, category: 'damage', effect: { type: 'shock', duration: 3, val: 42, name: 'Sốc Điện Tận Diệt' } }
        ]
    },
    Rock: {
        Basic: [
            { name: 'Ném Đá Cổ Đại', rarity: 'Common', basePower: 15, cost: 0, cd: 0, mpGain: 25, category: 'damage' }
        ],
        Skill1: [
            { name: 'Đá Lăn', rarity: 'Common', basePower: 20, cost: 15, cd: 1, category: 'damage' },
            { name: 'Đá Lăn Giảm Tốc', rarity: 'Rare', basePower: 26, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 25, name: 'Giảm Tốc 25%' } },
            { name: 'Vạn Lý Thạch Giáp', rarity: 'Rare', baseShield: 40, cost: 20, cd: 2, category: 'shield' },
            { name: 'Thạch Kim Hộ Thể', rarity: 'Epic', baseShield: 65, cost: 25, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Oanh Kích Đá', rarity: 'Common', basePower: 35, cost: 35, cd: 2, category: 'damage' },
            { name: 'Giáp Đá Thạch Anh', rarity: 'Rare', baseShield: 55, cost: 35, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 35, name: 'Giáp Gai (35% Reflect)' } },
            { name: 'Địa Mộc Oanh Kích', rarity: 'Epic', basePower: 68, cost: 45, cd: 3, category: 'damage', effect: { type: 'slow', duration: 2, val: 35, name: 'Đập Đá Giảm Tốc' } },
            { name: 'Thạch Giáp Độc Tố', rarity: 'Legendary', baseShield: 90, cost: 40, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 60, name: 'Phản Đòn Đá Gai 60%' } }
        ],
        Ultimate: [
            { name: 'Đá Rơi Cuồng Nổ', rarity: 'Rare', basePower: 70, cost: 70, cd: 3, category: 'damage' },
            { name: 'Địa Shaking Hủy Diệt', rarity: 'Epic', basePower: 112, cost: 85, cd: 3, category: 'damage' },
            { name: 'Vạn Lý Trường Thành', rarity: 'Legendary', baseShield: 140, cost: 90, cd: 4, category: 'shield', effect: { type: 'thorn', duration: 4, val: 70, name: 'Phản Đòn Đá Cổ Cấp 70%' } }
        ]
    }
};