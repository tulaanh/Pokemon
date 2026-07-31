// ==========================================
// KHO KỸ NĂNG KÉP: NỘI TẠI (PASSIVE) & TÀI NĂNG (TALENT)
// ==========================================

// --- KHO NỘI TẠI THEO HỆ (Passive Pool) ---
// Mỗi hệ có pool riêng. Pokémon chỉ quay ra Nội tại trong pool của hệ mình.
const PASSIVE_POOLS = {
    Fire: [
        { name: 'Bùng Cháy', desc: 'Tăng 30% ATK khi HP dưới 50%', trigger: 'hp_below_50', type: 'atk_buff', value: 0.3 },
        { name: 'Ngọn Lửa Bất Diệt', desc: 'Tăng 15% ATK vĩnh viễn', trigger: 'perm', type: 'perm_atk', value: 0.15 },
        { name: 'Nhiệt Huyết', desc: 'Tăng 25% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.25 },
        { name: 'Tro Tàn Tái Sinh', desc: 'Hồi 5% HP tối đa mỗi đầu lượt', trigger: 'start_turn', type: 'heal_self', value: 0.05 }
    ],
    Water: [
        { name: 'Dòng Chảy Hồi Phục', desc: 'Hồi 6% HP tối đa mỗi đầu lượt', trigger: 'start_turn', type: 'heal_self', value: 0.06 },
        { name: 'Giáp Nước Cứng', desc: 'Tăng 20% DEF vĩnh viễn', trigger: 'perm', type: 'perm_def', value: 0.20 },
        { name: 'Phản Lưu', desc: 'Phản lại 20% sát thương nhận vào cho đối thủ', trigger: 'take_damage', type: 'reflect_damage', value: 0.20 },
        { name: 'Sức Bền Đại Dương', desc: 'Tăng 20% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.20 }
    ],
    Grass: [
        { name: 'Quang Hợp', desc: 'Hồi 8% HP tối đa mỗi đầu lượt', trigger: 'start_turn', type: 'heal_self', value: 0.08 },
        { name: 'Rễ Cây Bền Bỉ', desc: 'Tăng 15% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.15 },
        { name: 'Mầm Sống', desc: 'Tăng 15% ATK vĩnh viễn', trigger: 'perm', type: 'perm_atk', value: 0.15 },
        { name: 'Bào Tử Độc', desc: 'Phản lại 15% sát thương nhận vào cho đối thủ', trigger: 'take_damage', type: 'reflect_damage', value: 0.15 }
    ],
    Electric: [
        { name: 'Tĩnh Điện', desc: 'Phản lại 15% sát thương nhận vào cho đối thủ', trigger: 'take_damage', type: 'reflect_damage', value: 0.15 },
        { name: 'Xung Điện', desc: 'Tăng 30% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.30 },
        { name: 'Nạp Năng Lượng', desc: 'Tăng 30 MP khi bắt đầu trận đấu', trigger: 'start_battle', type: 'mp_buff', value: 30 },
        { name: 'Sức Mạnh Sấm Sét', desc: 'Tăng 20% ATK vĩnh viễn', trigger: 'perm', type: 'perm_atk', value: 0.20 }
    ],
    Rock: [
        { name: 'Thân Đá Cứng', desc: 'Tăng 25% DEF vĩnh viễn', trigger: 'perm', type: 'perm_def', value: 0.25 },
        { name: 'Ý Chí Núi Non', desc: 'Tăng 25% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.25 },
        { name: 'Phản Chấn Đá', desc: 'Phản lại 25% sát thương nhận vào cho đối thủ', trigger: 'take_damage', type: 'reflect_damage', value: 0.25 },
        { name: 'Nham Thạch Giáp', desc: 'Tăng 30% ATK khi HP dưới 50%', trigger: 'hp_below_50', type: 'atk_buff', value: 0.30 }
    ]
};

// --- KHO TÀI NĂNG CHUNG (Talent Pool - Universal) ---
// Tất cả Pokémon bất kể hệ nào đều quay Tài năng từ kho chung này.
const TALENT_POOL = [
    { name: 'Bản Năng Chiến Đấu', desc: 'Tăng 10% ATK vĩnh viễn', trigger: 'perm', type: 'perm_atk', value: 0.10 },
    { name: 'Thể Chất Cường Hóa', desc: 'Tăng 10% HP vĩnh viễn', trigger: 'perm', type: 'perm_hp', value: 0.10 },
    { name: 'Phản Xạ Nhanh', desc: 'Tăng 15% SPD khi bắt đầu trận đấu', trigger: 'start_battle', type: 'speed_buff', value: 0.15 },
    { name: 'Tập Trung Tinh Thần', desc: 'Tăng 20 MP khi bắt đầu trận đấu', trigger: 'start_battle', type: 'mp_buff', value: 20 },
    { name: 'Tái Tạo Tế Bào', desc: 'Hồi 3% HP tối đa mỗi đầu lượt', trigger: 'start_turn', type: 'heal_self', value: 0.03 },
    { name: 'Da Thép', desc: 'Tăng 10% DEF vĩnh viễn', trigger: 'perm', type: 'perm_def', value: 0.10 },
    { name: 'Gai Phản Đòn', desc: 'Phản lại 10% sát thương nhận vào cho đối thủ', trigger: 'take_damage', type: 'reflect_damage', value: 0.10 },
    { name: 'Bùng Nổ Tiềm Năng', desc: 'Tăng 20% ATK khi HP dưới 50%', trigger: 'hp_below_50', type: 'atk_buff', value: 0.20 }
];

// --- CÁC MỐC V-LEVEL MỞ KHÓA TÀI NĂNG (TALENT) ---
const TALENT_UNLOCK_VLEVELS = [1, 3, 5];

/**
 * Quay ngẫu nhiên 1 Nội tại từ pool theo hệ (Deep Copy)
 * @param {string} pokeType - Hệ của Pokémon (Fire, Water, Grass, Electric, Rock)
 * @returns {object} Bản sao độc lập của Nội tại được chọn
 */
function rollPassive(pokeType) {
    let pool = PASSIVE_POOLS[pokeType];
    if (!pool || pool.length === 0) {
        // Fallback: dùng pool Fire nếu không tìm thấy hệ
        pool = PASSIVE_POOLS['Fire'];
    }
    let selected = pool[Math.floor(Math.random() * pool.length)];
    // Deep copy để tránh lỗi tham chiếu
    return JSON.parse(JSON.stringify(selected));
}

/**
 * Quay ngẫu nhiên 1 Tài năng từ pool chung (Deep Copy)
 * @returns {object} Bản sao độc lập của Tài năng được chọn
 */
function rollTalent() {
    let selected = TALENT_POOL[Math.floor(Math.random() * TALENT_POOL.length)];
    // Deep copy để tránh lỗi tham chiếu
    return JSON.parse(JSON.stringify(selected));
}

/**
 * Gộp tất cả Nội tại + Tài năng của Pokémon thành 1 mảng để duyệt
 * @param {object} poke - Pokémon instance
 * @returns {Array} Mảng gộp tất cả passive skills
 */
function getAllPassiveSkills(poke) {
    let allSkills = [];
    if (poke.passives && poke.passives.length > 0) {
        allSkills = allSkills.concat(poke.passives);
    }
    if (poke.talents && poke.talents.length > 0) {
        allSkills = allSkills.concat(poke.talents);
    }
    // Tương thích ngược: nếu có passive cũ mà không có trong passives[]
    if (poke.passive && (!poke.passives || poke.passives.length === 0)) {
        allSkills.push(poke.passive);
    }
    return allSkills;
}
