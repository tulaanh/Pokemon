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
    { name: 'Charizard', type: 'Fire', baseHp: 140, baseAtk: 28, baseDef: 18, baseSpeed: 120, baseInitMp: 35, passive: { name: 'Bùng Cháy', desc: 'Tăng 30% ATK khi HP dưới 50%', trigger: 'hp_below_50', type: 'atk_buff', value: 0.3 } },
    { name: 'Blaziken', type: 'Fire', baseHp: 130, baseAtk: 32, baseDef: 16, baseSpeed: 125, baseInitMp: 30, passive: { name: 'Sức Mạnh Vĩnh Cửu', desc: 'Tăng 15% ATK vĩnh viễn', trigger: 'perm', type: 'perm_atk', value: 0.15 } },
    { name: 'Arcanine', type: 'Fire', baseHp: 145, baseAtk: 29, baseDef: 20, baseSpeed: 115, baseInitMp: 25, passive: { name: 'Khởi Đầu Nhanh', desc: 'Tăng 30 MP khi bắt đầu trận đấu', trigger: 'start_battle', type: 'mp_buff', value: 30 } },
    { name: 'Infernape', type: 'Fire', baseHp: 125, baseAtk: 30, baseDef: 17, baseSpeed: 130, baseInitMp: 30, passive: { name: 'Bứt Phá Tốc Độ', desc: 'Tăng 25% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.25 } },
    { name: 'Fuecoco', type: 'Fire', baseHp: 115, baseAtk: 21, baseDef: 16, baseSpeed: 95, baseInitMp: 25, passive: { name: 'Bùng Cháy Nhẹ', desc: 'Tăng 20% ATK khi HP dưới 50%', trigger: 'hp_below_50', type: 'atk_buff', value: 0.2 } },
    { name: 'Flareon', type: 'Fire', baseHp: 120, baseAtk: 31, baseDef: 18, baseSpeed: 110, baseInitMp: 30, passive: { name: 'Sức Mạnh Vĩnh Cửu', desc: 'Tăng 10% ATK vĩnh viễn', trigger: 'perm', type: 'perm_atk', value: 0.10 } },

    // --- HỆ NƯỚC (WATER) 💧 ---
    { name: 'Greninja', type: 'Water', baseHp: 125, baseAtk: 27, baseDef: 18, baseSpeed: 145, baseInitMp: 35, passive: { name: 'Bứt Phá Tốc Độ', desc: 'Tăng 30% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.30 } },
    { name: 'Blastoise', type: 'Water', baseHp: 160, baseAtk: 22, baseDef: 32, baseSpeed: 95, baseInitMp: 20, passive: { name: 'Sức Bền Vĩnh Cửu', desc: 'Tăng 20% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.20 } },
    { name: 'Gyarados', type: 'Water', baseHp: 165, baseAtk: 31, baseDef: 24, baseSpeed: 105, baseInitMp: 25, passive: { name: 'Phản Sát Thương', desc: 'Phản lại 20% sát thương nhận vào cho đối thủ', trigger: 'take_damage', type: 'reflect_damage', value: 0.20 } },
    { name: 'Vaporeon', type: 'Water', baseHp: 180, baseAtk: 23, baseDef: 22, baseSpeed: 90, baseInitMp: 30, passive: { name: 'Tự Hồi Phục', desc: 'Hồi 6% HP tối đa mỗi khi bắt đầu lượt hành động', trigger: 'start_turn', type: 'heal_self', value: 0.06 } },
    { name: 'Mudkip', type: 'Water', baseHp: 125, baseAtk: 19, baseDef: 22, baseSpeed: 85, baseInitMp: 20, passive: { name: 'Tự Hồi Phục Nhẹ', desc: 'Hồi 4% HP tối đa mỗi khi bắt đầu lượt hành động', trigger: 'start_turn', type: 'heal_self', value: 0.04 } },
    { name: 'Kyogre', type: 'Water', baseHp: 175, baseAtk: 33, baseDef: 28, baseSpeed: 110, baseInitMp: 35, passive: { name: 'Khởi Đầu Đại Dương', desc: 'Tăng 40 MP khi bắt đầu trận đấu', trigger: 'start_battle', type: 'mp_buff', value: 40 } },

    // --- HỆ ĐIỆN / SÉT (ELECTRIC) ⚡ ---
    { name: 'Pikachu', type: 'Electric', baseHp: 95, baseAtk: 26, baseDef: 12, baseSpeed: 140, baseInitMp: 40, passive: { name: 'Khởi Đầu Nhanh', desc: 'Tăng 25 MP khi bắt đầu trận đấu', trigger: 'start_battle', type: 'mp_buff', value: 25 } },
    { name: 'Raichu', type: 'Electric', baseHp: 115, baseAtk: 29, baseDef: 16, baseSpeed: 145, baseInitMp: 35, passive: { name: 'Khởi Đầu Nhanh', desc: 'Tăng 30 MP khi bắt đầu trận đấu', trigger: 'start_battle', type: 'mp_buff', value: 30 } },
    { name: 'Luxray', type: 'Electric', baseHp: 130, baseAtk: 32, baseDef: 19, baseSpeed: 120, baseInitMp: 25, passive: { name: 'Bùng Cháy', desc: 'Tăng 25% ATK khi HP dưới 50%', trigger: 'hp_below_50', type: 'atk_buff', value: 0.25 } },
    { name: 'Zapdos', type: 'Electric', baseHp: 140, baseAtk: 30, baseDef: 20, baseSpeed: 135, baseInitMp: 35, passive: { name: 'Bứt Phá Tốc Độ', desc: 'Tăng 25% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.25 } },
    { name: 'Jolteon', type: 'Electric', baseHp: 105, baseAtk: 28, baseDef: 15, baseSpeed: 155, baseInitMp: 40, passive: { name: 'Bứt Phá Tốc Độ', desc: 'Tăng 30% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.30 } },
    { name: 'Zeraora', type: 'Electric', baseHp: 120, baseAtk: 33, baseDef: 17, baseSpeed: 160, baseInitMp: 45, passive: { name: 'Kháng Khống Chế', desc: 'Bắt đầu lượt tự giải hiệu ứng khống chế (choáng)', trigger: 'start_turn', type: 'cleanse_cc', value: 1 } },

    // --- HỆ CỎ (GRASS) 🌿 ---
    { name: 'Bulbasaur', type: 'Grass', baseHp: 120, baseAtk: 20, baseDef: 20, baseSpeed: 100, baseInitMp: 25, passive: { name: 'Sức Bền Vĩnh Cửu', desc: 'Tăng 10% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.10 } },
    { name: 'Sceptile', type: 'Grass', baseHp: 125, baseAtk: 28, baseDef: 18, baseSpeed: 140, baseInitMp: 30, passive: { name: 'Bứt Phá Tốc Độ', desc: 'Tăng 25% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.25 } },
    { name: 'Decidueye', type: 'Grass', baseHp: 135, baseAtk: 29, baseDef: 21, baseSpeed: 110, baseInitMp: 30, passive: { name: 'Sức Mạnh Vĩnh Cửu', desc: 'Tăng 15% ATK vĩnh viễn', trigger: 'perm', type: 'perm_atk', value: 0.15 } },
    { name: 'Meowscarada', type: 'Grass', baseHp: 120, baseAtk: 31, baseDef: 17, baseSpeed: 145, baseInitMp: 35, passive: { name: 'Khởi Đầu Nhanh', desc: 'Tăng 25 MP khi bắt đầu trận đấu', trigger: 'start_battle', type: 'mp_buff', value: 25 } },
    { name: 'Celebi', type: 'Grass', baseHp: 150, baseAtk: 25, baseDef: 25, baseSpeed: 125, baseInitMp: 40, passive: { name: 'Tự Hồi Phục', desc: 'Hồi 8% HP tối đa mỗi khi bắt đầu lượt hành động', trigger: 'start_turn', type: 'heal_self', value: 0.08 } },
    { name: 'Leafeon', type: 'Grass', baseHp: 130, baseAtk: 28, baseDef: 28, baseSpeed: 115, baseInitMp: 25, passive: { name: 'Sức Bền Vĩnh Cửu', desc: 'Tăng 15% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.15 } },

    // --- HỆ ĐÁ (ROCK) 🪨 ---
    { name: 'Tyranitar', type: 'Rock', baseHp: 260, baseAtk: 34, baseDef: 45, baseSpeed: 85, baseInitMp: 20, passive: { name: 'Phòng Thủ Vĩnh Cửu', desc: 'Tăng 20% DEF vĩnh viễn', trigger: 'perm', type: 'perm_def', value: 0.20 } },
    { name: 'Onix', type: 'Rock', baseHp: 280, baseAtk: 21, baseDef: 55, baseSpeed: 80, baseInitMp: 20, passive: { name: 'Phản Sát Thương', desc: 'Phản lại 25% sát thương nhận vào cho đối thủ', trigger: 'take_damage', type: 'reflect_damage', value: 0.25 } },
    { name: 'Aerodactyl', type: 'Rock', baseHp: 180, baseAtk: 30, baseDef: 25, baseSpeed: 135, baseInitMp: 25, passive: { name: 'Bứt Phá Tốc Độ', desc: 'Tăng 20% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.20 } },
    { name: 'Lycanroc', type: 'Rock', baseHp: 190, baseAtk: 31, baseDef: 28, baseSpeed: 130, baseInitMp: 25, passive: { name: 'Bùng Cháy', desc: 'Tăng 25% ATK khi HP dưới 50%', trigger: 'hp_below_50', type: 'atk_buff', value: 0.25 } },
    { name: 'Garganacl', type: 'Rock', baseHp: 320, baseAtk: 24, baseDef: 60, baseSpeed: 65, baseInitMp: 15, passive: { name: 'Sức Bền Vĩnh Cửu', desc: 'Tăng 25% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.25 } },
    { name: 'Diancie', type: 'Rock', baseHp: 220, baseAtk: 28, baseDef: 50, baseSpeed: 95, baseInitMp: 30, passive: { name: 'Phòng Thủ Vĩnh Cửu', desc: 'Tăng 15% DEF vĩnh viễn', trigger: 'perm', type: 'perm_def', value: 0.15 } },
    { name: 'Rayquaza', type: 'Rock', baseHp: 250, baseAtk: 38, baseDef: 28, baseSpeed: 140, baseInitMp: 35, passive: { name: 'Long Lực Vĩnh Cửu', desc: 'Tăng 15% ATK và 15% HP vĩnh viễn', trigger: 'perm', type: 'perm_hybrid_atk_hp', value: 0.15 } },
    { name: 'Garchomp', type: 'Rock', baseHp: 210, baseAtk: 33, baseDef: 30, baseSpeed: 120, baseInitMp: 30, passive: { name: 'Long Huyết Vĩnh Cửu', desc: 'Tăng 20% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.20 } }
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
            { name: 'Phi Tiêu Nước Tầm Xa', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Greninja
            { name: 'Cú Húc Thủy Lực', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Blastoise
            { name: 'Quật Đuôi Cuồng Nộ', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Gyarados
            { name: 'Bong Bóng Nước', rarity: 'Common', basePower: 10, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Vaporeon & Mudkip
            { name: 'Sóng Xung Kích Cổ Đại', rarity: 'Common', basePower: 15, cost: 0, cd: 0, mpGain: 25, category: 'damage' } // Kyogre
        ],
        Skill1: [
            // Greninja - Vừa gây sát thương, vừa làm chậm và hồi HP
            { name: 'Phi Tiêu Nước (Water Shuriken)', rarity: 'Rare', basePower: 30, baseHeal: 15, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 25, name: 'Giảm Tốc 25%' } },
            // Blastoise - Thủy Pháo đẩy lùi, giảm sức tấn công đối thủ
            { name: 'Thủy Pháo (Hydro Pump)', rarity: 'Rare', basePower: 35, cost: 20, cd: 2, category: 'damage', effect: { type: 'debuff_atk', duration: 2, val: 20, name: 'Đẩy Lùi (Giảm 20% ATK)' } },
            // Gyarados - Cú quật gây sát thương và làm chậm
            { name: 'Đuôi Nước (Aqua Tail)', rarity: 'Rare', basePower: 40, cost: 25, cd: 2, category: 'damage', effect: { type: 'slow', duration: 2, val: 30, name: 'Giảm Tốc 30%' } },
            // Vaporeon - Nước Bùn giảm công đối phương
            { name: 'Nước Bùn (Muddy Water)', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage', effect: { type: 'debuff_atk', duration: 2, val: 25, name: 'Giảm 25% ATK' } },
            // Mudkip - Sóng Nước gây choáng/hỗn loạn
            { name: 'Sóng Nước (Water Pulse)', rarity: 'Common', basePower: 22, cost: 15, cd: 1, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Hỗn Loạn (Choáng)' } },
            // Kyogre - Sóng Nguồn Cội xuyên phá (Sát thương chuẩn)
            { name: 'Sóng Nguồn Cội (Origin Pulse)', rarity: 'Epic', basePower: 60, cost: 35, cd: 2, category: 'true_damage', isTrueDmg: true }
        ],
        Skill2: [
            // Greninja - Màn Khói/Thế Thân: Tạo khiên & Tăng tốc độ
            { name: 'Thế Thân & Màn Khói', rarity: 'Epic', baseShield: 40, cost: 30, cd: 3, category: 'shield', effect: { type: 'buff_speed', duration: 2, val: 40, name: 'Tàng Hình (+40% Tốc)' } },
            // Blastoise - Lướt Sóng gây choáng
            { name: 'Lướt Sóng (Surf)', rarity: 'Epic', basePower: 50, cost: 40, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Cuốn Sóng (Choáng)' } },
            // Gyarados - Thác Nước hất tung
            { name: 'Thác Nước (Waterfall)', rarity: 'Epic', basePower: 55, cost: 40, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Hất Tung (Choáng)' } },
            // Vaporeon - Hóa Lỏng: Tạo khiên lớn & Tăng giáp mạnh
            { name: 'Giáp Acid (Acid Armor)', rarity: 'Epic', baseShield: 60, cost: 35, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 3, val: 50, name: 'Hóa Lỏng (+50% DEF)' } },
            // Mudkip - Tạt Bùn làm chậm đối thủ
            { name: 'Tạt Bùn (Mud-Slap)', rarity: 'Rare', basePower: 35, cost: 25, cd: 2, category: 'damage', effect: { type: 'slow', duration: 2, val: 30, name: 'Giảm Tốc 30%' } },
            // Kyogre - Mưa Rào & Tâm Cảnh: Tăng mạnh sức tấn công
            { name: 'Mưa Rào & Tâm Cảnh', rarity: 'Legendary', cost: 45, cd: 3, category: 'buff', effect: { type: 'buff_atk', duration: 3, val: 45, name: 'Cơn Mưa Cổ Đại (+45% ATK)' } }
        ],
        Ultimate: [
            // Greninja - Đại Phi Tiêu Nước gây sát thương diện rộng & Choáng
            { name: 'Đại Phi Tiêu Nước', rarity: 'Legendary', basePower: 130, cost: 85, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Nổ Lớn (Choáng)' } },
            // Blastoise - Cơn Bão Thủy Lực: Sát thương + Tạo lớp giáp bảo vệ
            { name: 'Cơn Bão Thủy Lực', rarity: 'Legendary', basePower: 125, baseShield: 50, cost: 90, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Bão Nước Hất Văng' } },
            // Gyarados - Sóng Thần càn quét vô hiệu hóa đội hình
            { name: 'Cơn Thịnh Nộ Đại Dương', rarity: 'Mythic', basePower: 145, cost: 95, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Sóng Thần Vô Hiệu Hóa' } },
            // Vaporeon - Lãnh Địa Đại Dương: Hồi máu cực lớn & Làm chậm địch
            { name: 'Lãnh Địa Đại Dương', rarity: 'Legendary', baseHeal: 110, cost: 85, cd: 4, category: 'heal', effect: { type: 'slow', duration: 3, val: 35, name: 'Trầm Mặc (Giảm Tốc 35%)' } },
            // Mudkip - Trận Bão Bùn Lầy: Sát thương & Khóa tốc cực mạnh
            { name: 'Trận Bão Bùn Lầy', rarity: 'Epic', basePower: 95, cost: 75, cd: 3, category: 'damage', effect: { type: 'slow', duration: 3, val: 50, name: 'Sa Lầy (Giảm Tốc 50%)' } },
            // Kyogre - Siêu Sóng Thần Cổ Đại: Sát thương hủy diệt
            { name: 'Siêu Sóng Thần Cổ Đại', rarity: 'Mythic', basePower: 165, cost: 100, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Thức Tỉnh Nguyên Thủy' } }
        ]
    },
    Grass: {
        Basic: [
            { name: 'Roi Dây Leo Tầm Trung', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Bulbasaur
            { name: 'Chém Dao Lá', rarity: 'Common', basePower: 13, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Sceptile
            { name: 'Mũi Tên Lông Cánh', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Decidueye
            { name: 'Vuốt Móng Hoa Hồng', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Meowscarada
            { name: 'Cầu Năng Lượng Thiên Nhiên', rarity: 'Common', basePower: 10, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Celebi
            { name: 'Đuôi Lá Cây Sắc Nhọn', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' } // Leafeon
        ],
        Skill1: [
            // Bulbasaur - Roi Dây Leo quất mạnh gây sát thương & làm chậm
            { name: 'Roi Dây Leo (Vine Whip)', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 25, name: 'Trói Giữ (Giảm Tốc 25%)' } },
            // Sceptile - Lưỡi Kiếm Lá chém cực mạnh
            { name: 'Lưỡi Kiếm Lá (Leaf Blade)', rarity: 'Rare', basePower: 38, cost: 20, cd: 1, category: 'damage' },
            // Decidueye - Mũi Tên Trói Hồn khóa chân mục tiêu
            { name: 'Mũi Tên Trói Hồn (Spirit Shackle)', rarity: 'Epic', basePower: 45, cost: 25, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Khóa Chân (Choáng)' } },
            // Meowscarada - Ảo Thuật Hoa Hồng chí mạng không thể né (Sát thương chuẩn)
            { name: 'Ảo Thuật Hoa Hồng (Flower Trick)', rarity: 'Epic', basePower: 50, cost: 25, cd: 2, category: 'true_damage', isTrueDmg: true },
            // Celebi - Bom Hạt Giống gây sát thương diện rộng & làm chậm
            { name: 'Bom Hạt Giống (Seed Bomb)', rarity: 'Rare', basePower: 30, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 30, name: 'Sức Ép (Giảm Tốc 30%)' } },
            // Leafeon - Lá Cắt phóng liên tiếp đợt lá sắc bén
            { name: 'Lá Cắt (Razor Leaf)', rarity: 'Common', basePower: 26, cost: 15, cd: 1, category: 'damage' }
        ],
        Skill2: [
            // Bulbasaur - Hạt Hút Máu liên tục rút HP kẻ địch hồi cho bản thân
            { name: 'Hạt Hút Máu (Leech Seed)', rarity: 'Rare', basePower: 20, baseHeal: 35, cost: 25, cd: 2, category: 'heal', effect: { type: 'slow', duration: 2, val: 20, name: 'Hút Sinh Lực' } },
            // Sceptile - Hút Năng Lượng gây sát thương & hồi HP lớn
            { name: 'Hút Năng Lượng (Giga Drain)', rarity: 'Epic', basePower: 45, baseHeal: 30, cost: 30, cd: 2, category: 'damage' },
            // Decidueye - Bóng Ma Đột Kích lướt úp sau lưng & tăng tốc
            { name: 'Bóng Ma Đột Kích (Shadow Sneak)', rarity: 'Rare', basePower: 35, cost: 25, cd: 2, category: 'damage', effect: { type: 'buff_speed', duration: 2, val: 40, name: 'Ẩn Nấp (+40% Tốc)' } },
            // Meowscarada - Bước Nhảy Ảo Giác phân thân né sát thương & tạo giáp
            { name: 'Bước Nhảy Ảo Giác (Illusion Step)', rarity: 'Epic', baseShield: 45, cost: 30, cd: 3, category: 'shield', effect: { type: 'buff_speed', duration: 2, val: 50, name: 'Ảo Giác (+50% Tốc)' } },
            // Celebi - Chuông Hồi Phục thanh tẩy & hồi máu + tăng giáp
            { name: 'Chuông Hồi Phục (Heal Bell)', rarity: 'Rare', baseHeal: 55, cost: 30, cd: 3, category: 'heal', effect: { type: 'buff_def', duration: 2, val: 30, name: 'Thanh Tẩy (+30% DEF)' } },
            // Leafeon - Vũ Điệu Kiếm tăng mạnh sức tấn công
            { name: 'Vũ Điệu Kiếm (Swords Dance)', rarity: 'Rare', cost: 30, cd: 3, category: 'buff', effect: { type: 'buff_atk', duration: 3, val: 40, name: 'Kiếm Sĩ (+40% ATK)' } }
        ],
        Ultimate: [
            // Bulbasaur - Tia Năng Lượng Mặt Trời càn quét đường thẳng cực đại
            { name: 'Tia Năng Lượng Mặt Trời (Solar Beam)', rarity: 'Legendary', basePower: 135, cost: 90, cd: 4, category: 'damage' },
            // Sceptile - Bão Lá Cuồng Phong gây sát thương diện rộng & giảm giáp địch
            { name: 'Bão Lá Cuồng Phong (Leaf Storm)', rarity: 'Legendary', basePower: 130, cost: 85, cd: 4, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 40, name: 'Phá Giáp 40%' } },
            // Decidueye - Mưa Tên Ma Quái xả mưa tên bùng nổ sát thương cực lớn
            { name: 'Mưa Tên Ma Quái', rarity: 'Legendary', basePower: 140, cost: 90, cd: 4, category: 'damage' },
            // Meowscarada - Vũ Điệu Hoa Lệ Hủy Diệt cắt nát đội hình đối phương
            { name: 'Vũ Điệu Hoa Lệ Hủy Diệt', rarity: 'Mythic', basePower: 155, cost: 95, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Màn Ảo Thuật (Choáng)' } },
            // Celebi - Lãnh Địa Thời Gian hồi HP liên tục & làm chậm toàn bộ kẻ địch
            { name: 'Lãnh Địa Thời Gian (Time Warp)', rarity: 'Mythic', baseHeal: 120, cost: 95, cd: 4, category: 'heal', effect: { type: 'slow', duration: 3, val: 40, name: 'Ngưng Đọng Thời Gian (-40% Tốc)' } },
            // Leafeon - Đột Kích Lưỡi Kiếm Mặt Trời lao tới chém bộc phá
            { name: 'Đột Kích Lưỡi Kiếm Mặt Trời', rarity: 'Epic', basePower: 115, cost: 80, cd: 3, category: 'damage', effect: { type: 'buff_atk', duration: 2, val: 30, name: 'Quang Năng (+30% ATK)' } }
        ]
    },
    Electric: {
        Basic: [
            { name: 'Tia Điện Má Đỏ', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Pikachu
            { name: 'Vuốt Điện Cận Chiến', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Luxray
            { name: 'Cú Đập Đuôi Sét', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Raichu
            { name: 'Sóng Điện Đập Cánh', rarity: 'Common', basePower: 15, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Zapdos
            { name: 'Lông Nhọn Tích Điện', rarity: 'Common', basePower: 10, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Jolteon
            { name: 'Cào Xé Tốc Độ Cao', rarity: 'Common', basePower: 13, cost: 0, cd: 0, mpGain: 25, category: 'damage' } // Zeraora
        ],
        Skill1: [
            // Pikachu - Quả Cầu Điện gây sát thương diện rộng & làm chậm
            { name: 'Quả Cầu Điện (Electro Ball)', rarity: 'Rare', basePower: 32, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 25, name: 'Giảm Tốc 25%' } },
            // Luxray - Nanh Sét cắn mạnh gây sát thương & làm tê liệt/choáng
            { name: 'Nanh Sét (Thunder Fang)', rarity: 'Rare', basePower: 38, cost: 20, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Tê Liệt (Choáng)' } },
            // Raichu - Tia Sét cường độ cao gây sát thương & tê liệt
            { name: 'Tia Sét (Thunderbolt)', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage', effect: { type: 'shock', duration: 2, val: 20, name: 'Giật Điện Tê Liệt' } },
            // Zapdos - Pháo Điện tích tụ cực mạnh gây tê liệt nặng
            { name: 'Pháo Điện (Zap Cannon)', rarity: 'Epic', basePower: 55, cost: 30, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Tê Liệt Nặng (Choáng)' } },
            // Jolteon - Tên Lông Nhọn bắn cọc lông tích điện dồn dập
            { name: 'Tên Lông Nhọn (Pin Missile)', rarity: 'Common', basePower: 28, cost: 15, cd: 1, category: 'damage' },
            // Zeraora - Nắm Đấm Plasma gây sát thương & gia tăng sức tấn công
            { name: 'Nắm Đấm Plasma (Plasma Fists)', rarity: 'Rare', basePower: 35, cost: 20, cd: 2, category: 'damage', effect: { type: 'buff_atk', duration: 2, val: 20, name: 'Tăng 20% ATK' } }
        ],
        Skill2: [
            // Pikachu - Volt Tackle bọc điện lao càn quét hất tung & choáng
            { name: 'Cú Húc Điện Quang (Volt Tackle)', rarity: 'Epic', basePower: 50, cost: 35, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Hất Tung (Choáng)' } },
            // Luxray - Wild Charge lao tới tông mạnh gây sát thương chuẩn
            { name: 'Cú Nhảy Hoang Dại (Wild Charge)', rarity: 'Epic', basePower: 60, cost: 40, cd: 2, category: 'true_damage', isTrueDmg: true },
            // Raichu - Cưỡi Đuôi Bay tăng tốc độ & tạo giáp bảo vệ
            { name: 'Cưỡi Đuôi Bay (Surf Ride)', rarity: 'Rare', baseShield: 40, cost: 25, cd: 2, category: 'shield', effect: { type: 'buff_speed', duration: 3, val: 35, name: 'Lướt Sóng Điện (+35% Tốc)' } },
            // Zapdos - Nghỉ Nơi Cánh hồi phục HP & bứt tốc độ
            { name: 'Nghỉ Nơi Cánh & Tốc Độ (Roost)', rarity: 'Legendary', baseHeal: 60, cost: 35, cd: 3, category: 'heal', effect: { type: 'buff_speed', duration: 3, val: 40, name: 'Tăng 40% Tốc' } },
            // Jolteon - Xả Điện gây sát thương lân cận & tạo giáp hấp thụ
            { name: 'Xả Điện (Discharge)', rarity: 'Rare', basePower: 35, baseShield: 35, cost: 30, cd: 2, category: 'damage', effect: { type: 'shock', duration: 2, val: 15, name: 'Giật Điện' } },
            // Zeraora - Lướt Điện quấy rối đội hình & tăng bứt tốc
            { name: 'Lướt Điện (Volt Switch)', rarity: 'Epic', basePower: 48, cost: 30, cd: 2, category: 'damage', effect: { type: 'buff_speed', duration: 2, val: 50, name: 'Tráo Đổi (+50% Tốc)' } }
        ],
        Ultimate: [
            // Pikachu - Trận Bão Sét diện rộng cực lớn & liên tục làm chậm
            { name: 'Trận Bão Sét (Thunderstorm)', rarity: 'Legendary', basePower: 125, cost: 85, cd: 4, category: 'damage', effect: { type: 'slow', duration: 3, val: 40, name: 'Mây Dông (Giảm Tốc 40%)' } },
            // Luxray - Thiên Nhãn Sét càn quét chí mạng với tốc độ ánh sáng
            { name: 'Thiên Nhãn Sét Càn Quét', rarity: 'Mythic', basePower: 150, cost: 95, cd: 4, category: 'true_damage', isTrueDmg: true },
            // Raichu - Cơn Bão Điện Sóng giội quầng điện gây tê liệt toàn khu vực
            { name: 'Cơn Bão Điện Sóng', rarity: 'Legendary', basePower: 120, cost: 85, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Tê Liệt Diện Rộng' } },
            // Zapdos - Cơn Bão Sét Nguyên Thủy gây sát thương & giảm giáp đối thủ
            { name: 'Cơn Bão Sét Nguyên Thủy', rarity: 'Mythic', basePower: 160, cost: 100, cd: 4, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 45, name: 'Giảm 45% DEF' } },
            // Jolteon - Tốc Độ Sét Đột Kích lướt không thể chọn làm mục tiêu
            { name: 'Tốc Độ Sét Đột Kích', rarity: 'Epic', basePower: 105, cost: 75, cd: 3, category: 'damage', effect: { type: 'buff_speed', duration: 3, val: 60, name: 'Tốc Độ Sét (+60% Tốc)' } },
            // Zeraora - Cơn Bão Plasma Hủy Diệt hất tung & sát thương bùng nổ
            { name: 'Cơn Bão Plasma Hủy Diệt', rarity: 'Mythic', basePower: 155, cost: 95, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Trường Plasma (Hất Tung)' } }
        ]
    },
    Rock: {
        Basic: [
            { name: 'Cào Xé & Dậm Đất', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Tyranitar
            { name: 'Cú Quật Đuôi Đá', rarity: 'Common', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Onix
            { name: 'Đập Cánh Cổ Đại', rarity: 'Common', basePower: 13, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Aerodactyl
            { name: 'Móng Vuốt Đá Sắc Mảnh', rarity: 'Common', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Lycanroc
            { name: 'Cú Đấm Khối Đá', rarity: 'Common', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' }, // Garganacl
            { name: 'Bắn Mảnh Kim Cương', rarity: 'Common', basePower: 10, cost: 0, cd: 0, mpGain: 25, category: 'damage' } // Diancie
        ],
        Skill1: [
            // Tyranitar - Lưỡi Dao Đá dậm phiến đá sắc nhọn gây sát thương lớn
            { name: 'Lưỡi Dao Đá (Stone Edge)', rarity: 'Rare', basePower: 40, cost: 20, cd: 2, category: 'damage' },
            // Onix - Ném Đá khổng lồ làm chậm di chuyển đối thủ
            { name: 'Ném Đá (Rock Throw)', rarity: 'Common', basePower: 25, cost: 15, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 25, name: 'Giảm Tốc 25%' } },
            // Aerodactyl - Lở Đá trút mưa đá làm choáng đối thủ
            { name: 'Lở Đá (Rock Slide)', rarity: 'Rare', basePower: 35, cost: 20, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Lở Đá (Choáng)' } },
            // Lycanroc - Đột Kích Đá Nhanh lướt tốc độ cao tấn công ưu tiên
            { name: 'Đột Kích Đá Nhanh (Accelerock)', rarity: 'Rare', basePower: 32, cost: 15, cd: 1, category: 'damage', effect: { type: 'buff_speed', duration: 2, val: 35, name: 'Bứt Tốc (+35% Tốc)' } },
            // Garganacl - Thanh Tẩy Muối Đá phủ muối rút máu theo thời gian
            { name: 'Thanh Tẩy Muối Đá (Salt Cure)', rarity: 'Rare', basePower: 20, cost: 20, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 18, name: 'Xát Muối (Đốt HP)' } },
            // Diancie - Cơn Bão Kim Cương càn quét & tăng mạnh Defense
            { name: 'Cơn Bão Kim Cương (Diamond Storm)', rarity: 'Epic', basePower: 48, cost: 25, cd: 2, category: 'damage', effect: { type: 'buff_def', duration: 3, val: 35, name: 'Giáp Kim Cương (+35% DEF)' } }
        ],
        Skill2: [
            // Tyranitar - Bão Cát Thức Tỉnh gây sát thương xung quanh & tăng phòng thủ
            { name: 'Bão Cát Thức Tỉnh (Sandstorm)', rarity: 'Epic', basePower: 35, cost: 30, cd: 2, category: 'damage', effect: { type: 'buff_def', duration: 3, val: 40, name: 'Kháng Bão Cát (+40% DEF)' } },
            // Onix - Mộ Đá sụp đè nhốt & làm choáng đối thủ
            { name: 'Mộ Đá (Rock Tomb)', rarity: 'Rare', basePower: 30, cost: 25, cd: 2, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Mộ Đá Giữ Chân (Choáng)' } },
            // Aerodactyl - Sức Mạnh Cổ Đại tăng cường sức tấn công
            { name: 'Sức Mạnh Cổ Đại (Ancient Power)', rarity: 'Epic', basePower: 42, cost: 25, cd: 2, category: 'damage', effect: { type: 'buff_atk', duration: 2, val: 30, name: 'Thần Lực (+30% ATK)' } },
            // Lycanroc - Bẫy Đá Ẩn đâm đá đâm sát thương & giảm giáp đối thủ
            { name: 'Bẫy Đá Ẩn (Stealth Rock)', rarity: 'Rare', basePower: 25, cost: 20, cd: 2, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 35, name: 'Phá Giáp 35%' } },
            // Garganacl - Thạch Giáp & Hồi Phục tăng mạnh Defense & hồi HP
            { name: 'Thạch Giáp & Hồi Phục', rarity: 'Epic', baseHeal: 45, cost: 30, cd: 3, category: 'heal', effect: { type: 'buff_def', duration: 3, val: 50, name: 'Hóa Cứng (+50% DEF)' } },
            // Diancie - Gương Phản Xạ tạo lớp giáp kiên cố bảo vệ
            { name: 'Gương Phản Xạ (Reflect)', rarity: 'Epic', baseShield: 55, cost: 30, cd: 3, category: 'shield', effect: { type: 'buff_def', duration: 3, val: 40, name: 'Bức Tường Kim Cương' } }
        ],
        Ultimate: [
            // Tyranitar - Cú Dậm Bạo Chúa Hủy Diệt dậm nát đất gây địa chấn & Choáng
            { name: 'Cú Dậm Bạo Chúa Hủy Diệt', rarity: 'Mythic', basePower: 150, cost: 95, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Địa Chấn (Choáng)' } },
            // Onix - Cú Chui Đất Đại Địa trồi lên nổ tung hất văng & Choáng diện rộng
            { name: 'Cú Chui Đất Đại Địa', rarity: 'Legendary', basePower: 125, cost: 85, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Nổ Mặt Đất (Choáng)' } },
            // Aerodactyl - Cú Lao Thiên Thạch Cổ Đại giội xuống phá hủy giáp đối thủ
            { name: 'Cú Lao Thiên Thạch Cổ Đại', rarity: 'Legendary', basePower: 135, cost: 90, cd: 4, category: 'damage', effect: { type: 'debuff_def', duration: 3, val: 45, name: 'Xuyên Phá Giáp 45%' } },
            // Lycanroc - Cú Vồ Sói Đêm Báo Thù cắn xé bộc phá (Sát thương chuẩn)
            { name: 'Cú Vồ Sói Đêm Báo Thù', rarity: 'Epic', basePower: 110, cost: 80, cd: 3, category: 'true_damage', isTrueDmg: true },
            // Garganacl - Pháo Đài Muối Đá Vĩnh Cửu tạo giáp siêu dày & làm chậm địch
            { name: 'Pháo Đài Muối Đá Vĩnh Cửu', rarity: 'Legendary', baseShield: 65, cost: 85, cd: 4, category: 'shield', effect: { type: 'slow', duration: 3, val: 40, name: 'Sóng Chấn Động (-40% Tốc)' } },
            // Diancie - Hoa Kim Cương Hoàng Gia gây sát thương bộc phát, Choáng & tạo giáp ảo
            { name: 'Hoa Kim Cương Hoàng Gia', rarity: 'Mythic', basePower: 145, baseShield: 50, cost: 100, cd: 4, category: 'damage', effect: { type: 'stun', duration: 1, val: 0, name: 'Mắt Lóa (Choáng)' } }
        ]
    },
};