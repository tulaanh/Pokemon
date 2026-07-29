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
const ELEMENTAL_SKILL_TEMPLATES = {
    Fire: {
        Basic: [{ name: 'Cào Xé Lửa', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Tia Lửa Đốt Bỏng', basePower: 22, cost: 20, cd: 1, category: 'damage', effect: { type: 'burn', duration: 3, val: 10, name: 'Thiêu Đốt' } },
            { name: 'Lớp Giáp Nhiệt', baseShield: 25, cost: 20, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Phun Lửa Lớn', basePower: 45, cost: 45, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 16, name: 'Thiêu Đốt' } },
            { name: 'Vòng Lửa Hồi Phục', baseHeal: 35, cost: 40, cd: 3, category: 'heal' },
            { name: 'Bùng Nổ Nhiệt Lượng', basePower: 58, cost: 50, cd: 3, category: 'damage', effect: { type: 'burn', duration: 3, val: 22, name: 'Thiêu Đốt Báo Thù' } },
            { name: 'Giáp Lửa Cuồng Nổ', baseShield: 40, cost: 40, cd: 3, category: 'shield', effect: { type: 'burn', duration: 2, val: 15, name: 'Bỏng Giáp' } }
        ],
        Ultimate: [
            { name: 'Rồng Lửa Hủy Diệt', basePower: 90, cost: 80, cd: 3, category: 'damage', effect: { type: 'burn', duration: 4, val: 25, name: 'Thiêu Đốt Cuồng Nổ' } },
            { name: 'Bão Lửa Địa Ngục', basePower: 105, cost: 90, cd: 4, category: 'damage', effect: { type: 'burn', duration: 3, val: 30, name: 'Địa Ngục Thiêu Rụi' } }
        ]
    },
    Water: {
        Basic: [{ name: 'Đòn Nước Nhẹ', basePower: 10, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Bóng Nước Làm Chậm', basePower: 22, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 30, name: 'Giảm Tốc 30%' } },
            { name: 'Khiên Bong Bóng', baseShield: 30, cost: 20, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Thủy Pháo Làm Băng', basePower: 42, cost: 40, cd: 2, category: 'damage', effect: { type: 'slow', duration: 3, val: 40, name: 'Giảm Tốc 40%' } },
            { name: 'Dòng Sống Hồi Sinh', baseHeal: 40, cost: 45, cd: 3, category: 'heal' },
            { name: 'Dòng Nước Xiết Cuồng Phong', basePower: 52, cost: 50, cd: 2, category: 'damage', effect: { type: 'slow', duration: 3, val: 45, name: 'Giảm Tốc Nặng 45%' } },
            { name: 'Thủy Giáp Bảo Hộ', baseShield: 45, cost: 40, cd: 3, category: 'shield' }
        ],
        Ultimate: [
            { name: 'Sóng Thần Cuồng Nổ', basePower: 95, cost: 80, cd: 3, category: 'damage', effect: { type: 'slow', duration: 3, val: 50, name: 'Giảm Tốc 50%' } },
            { name: 'Đại Dương Phục Sinh', baseHeal: 90, cost: 85, cd: 4, category: 'heal' }
        ]
    },
    Grass: {
        Basic: [{ name: 'Roi Gai Cơ Bản', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Lá Sắc Nhọn', basePower: 26, cost: 20, cd: 1, category: 'damage' },
            { name: 'Áo Giáp Gai Phản Đòn', baseShield: 25, cost: 25, cd: 2, category: 'shield', effect: { type: 'thorn', duration: 3, val: 30, name: 'Giáp Gai (30% Reflect)' } }
        ],
        Skill2: [
            { name: 'Bão Lá Tấn Công', basePower: 48, cost: 40, cd: 2, category: 'damage' },
            { name: 'Vỏ Cây Giáp Gai Cổ Thụ', baseShield: 35, cost: 35, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 45, name: 'Giáp Gai (45% Reflect)' } },
            { name: 'Hạt Giống Ký Sinh', baseHeal: 45, cost: 45, cd: 3, category: 'heal' },
            { name: 'Rễ Cây Cổ Thụ', baseShield: 50, cost: 40, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 50, name: 'Giáp Gai Cổ Thụ (50% Reflect)' } }
        ],
        Ultimate: [
            { name: 'Cuồng Phong Thực Vật', basePower: 98, cost: 80, cd: 3, category: 'damage' },
            { name: 'Thần Rừng Hồi Sinh', baseHeal: 85, baseShield: 50, cost: 85, cd: 4, category: 'heal' }
        ]
    },
    Electric: {
        Basic: [{ name: 'Chớp Điện', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Sốc Điện Tê Liệt', basePower: 25, cost: 25, cd: 1, category: 'damage', effect: { type: 'shock', duration: 2, val: 12, name: 'Nhiễm Điện' } },
            { name: 'Trường Điện Từ', baseShield: 22, cost: 20, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Sấm Sét Liên Hoàn', basePower: 50, cost: 50, cd: 2, category: 'damage', effect: { type: 'shock', duration: 3, val: 18, name: 'Nhiễm Điện' } },
            { name: 'Nạp Năng Lượng', baseHeal: 30, cost: 35, cd: 3, category: 'heal' },
            { name: 'Quả Cầu Tĩnh Điện', basePower: 55, cost: 45, cd: 3, category: 'damage', effect: { type: 'shock', duration: 3, val: 24, name: 'Sốc Điện Cao Cấp' } },
            { name: 'Khiên Điện Từ Trường', baseShield: 40, cost: 35, cd: 2, category: 'shield' }
        ],
        Ultimate: [
            { name: 'Thiên Lôi Hủy Diệt', basePower: 100, cost: 85, cd: 3, category: 'damage', effect: { type: 'shock', duration: 3, val: 28, name: 'Sốc Điện Nặng' } },
            { name: 'Bão Điện Siêu Cấp', basePower: 115, cost: 95, cd: 4, category: 'damage', effect: { type: 'shock', duration: 3, val: 35, name: 'Sốc Điện Tận Diệt' } }
        ]
    },
    Rock: {
        Basic: [{ name: 'Ném Đá Cổ Đại', basePower: 15, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Vạn Lý Thạch Giáp', baseShield: 45, cost: 20, cd: 2, category: 'shield' },
            { name: 'Đá Lăn Giảm Tốc', basePower: 20, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 25, name: 'Giảm Tốc 25%' } }
        ],
        Skill2: [
            { name: 'Giáp Đá Thạch Anh', baseShield: 65, cost: 35, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 35, name: 'Giáp Gai (35% Reflect)' } },
            { name: 'Mưa Đá Đè Chắn', basePower: 52, cost: 45, cd: 2, category: 'damage' },
            { name: 'Địa Mộc Oanh Kích', basePower: 60, cost: 50, cd: 3, category: 'damage', effect: { type: 'slow', duration: 2, val: 30, name: 'Đập Đá Giảm Tốc' } },
            { name: 'Thạch Giáp Độc Tố', baseShield: 70, cost: 40, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 50, name: 'Phản Đòn Đá Gai 50%' } }
        ],
        Ultimate: [
            { name: 'Địa Shaking Hủy Diệt', basePower: 110, cost: 85, cd: 3, category: 'damage' },
            { name: 'Vạn Lý Trường Thành', baseShield: 120, cost: 90, cd: 4, category: 'shield', effect: { type: 'thorn', duration: 4, val: 60, name: 'Phản Đòn Đá Cổ Cấp 60%' } }
        ]
    }
};