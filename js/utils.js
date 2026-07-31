// --- V-LEVEL BUFF MATH & STATS ---
function getVLevelBuffRatio(vLevel) {
    if (!vLevel || vLevel <= 0) return { hpRatio: 0, atkRatio: 0, defRatio: 0, spdRatio: 0 };
    if (vLevel === 1) return { hpRatio: 0.75, atkRatio: 0.75, defRatio: 0.75, spdRatio: 0.10 };
    if (vLevel === 2) return { hpRatio: 1.1, atkRatio: 1.2, defRatio: 1, spdRatio: 0.20 };
    if (vLevel === 3) return { hpRatio: 1.65, atkRatio: 1.60, defRatio: 1.30, spdRatio: 0.40 };
    if (vLevel == 4 ) return { hpRatio: 2.1, atkRatio: 2.10, defRatio: 1.60, spdRatio: 0.45 };

    let extra = vLevel - 4;
    return {
        hpRatio: 2.1 + extra * 0.30,
        atkRatio: 2.10 + extra * 0.30,
        defRatio: 1.60 + extra * 0.30,
        spdRatio: 0.45 + extra * 0.05
    };
}

// --- V-LEVEL BUFF MATH & STATS (CẬP NHẬT TĂNG TRƯỞNG THEO % LEVEL TRƯỚC) ---
function recalculatePokemonStats(p) {
    let species = POKEMON_SPECIES.find(s => s.name === p.name);
    if (!species) return;
    if (!p.iv) {
        p.iv = { hp: 1, atk: 1, def: 1, speed: 1 };
    }
   
    // Tỷ lệ tăng trưởng % chỉ số mỗi level
    let hpGrowthRate = (p.type === 'Rock') ? 0.09 : 0.075;
    let atkGrowthRate = 0.07;
    let defGrowthRate = 0.06;

    // Lũy thừa tăng trưởng HP, ATK, DEF
    let hpMult = Math.pow(1 + hpGrowthRate, p.level - 1);
    let atkMult = Math.pow(1 + atkGrowthRate, p.level - 1);
    let defMult = Math.pow(1 + defGrowthRate, p.level - 1);

    // Chỉ số thô theo Level mới
    let rawMaxHp = Math.round(species.baseHp * hpMult * p.rarity.statMult * p.iv.hp);
    let rawAtk = Math.round(species.baseAtk * atkMult * p.rarity.statMult * p.iv.atk);
    let rawDef = Math.round(species.baseDef * defMult * p.rarity.statMult * p.iv.def);

    // --- ⚡ 1. TỐC ĐỘ (SPEED): CỨ 5 CẤP TĂNG 1 LẦN ---
    // Tính số lần chạm mốc 5 cấp (Ví dụ: Lv 1-4 = 0 lần; Lv 5-9 = 1 lần; Lv 10-14 = 2 lần...)
    let speedStep = Math.floor((p.level - 1) / 5);
    // Tốc độ tăng cộng thẳng (+1 Speed mỗi 5 cấp) thay vì tăng theo tỷ lệ % để tránh quá nhanh
    let rawSpeed = Math.round(species.baseSpeed * p.rarity.statMult * p.iv.speed) + speedStep;

    // --- 💧 2. MP BAN ĐẦU & MP TỐI ĐA: CỨ 10 CẤP TĂNG 1 LẦN ---
    // Tính số lần chạm mốc 10 cấp
    let mpStep = Math.floor((p.level - 1) / 10);
    p.maxMp = 100 + mpStep * 10; // MP tối đa tăng thêm 10 mỗi 10 cấp
    // Mỗi 10 cấp tăng thêm +5 MP ban đầu gốc
    let bonusBaseMp = mpStep * 5;
    // Tính MP ban đầu thô (Giới hạn tối đa bằng MP tối đa của Pokémon)
    let rawInitMp = Math.min(p.maxMp, Math.round((species.baseInitMp + bonusBaseMp) * p.rarity.statMult));

    // Cộng thêm % Buff từ V-Level
    let vBuff = getVLevelBuffRatio(p.vLevel || 0);
    let oldMaxHp = p.maxHp;

    p.maxHp = Math.round(rawMaxHp * (1 + vBuff.hpRatio));
    p.atk = Math.round(rawAtk * (1 + vBuff.atkRatio));
    p.speed = Math.round(rawSpeed * (1 + vBuff.spdRatio));
    p.def = Math.round(rawDef * (1 + vBuff.defRatio));
    p.initMp = rawInitMp; // Cập nhật initMp mới

    // --- PASSIVE PERMANENT BUFF (Duyệt tất cả Nội tại + Tài năng) ---
    let allPermSkills = (typeof getAllPassiveSkills === 'function') ? getAllPassiveSkills(p) : (p.passive ? [p.passive] : []);
    allPermSkills.forEach(skill => {
        if (skill && skill.trigger === 'perm') {
            let val = skill.value || 0;
            if (skill.type === 'perm_hp') {
                p.maxHp = Math.round(p.maxHp * (1 + val));
            } else if (skill.type === 'perm_atk') {
                p.atk = Math.round(p.atk * (1 + val));
            } else if (skill.type === 'perm_def') {
                p.def = Math.round(p.def * (1 + val));
            } else if (skill.type === 'perm_hybrid_atk_hp') {
                p.maxHp = Math.round(p.maxHp * (1 + val));
                p.atk = Math.round(p.atk * (1 + val));
            }
        }
    });

    // --- GYM BUFF: Tăng 10% chỉ số nếu đã hoàn thành Gym hệ tương ứng ---
    let gymBuff = (typeof gymBuffs !== 'undefined' && gymBuffs[p.type]) ? gymBuffs[p.type] : 0;
    if (gymBuff > 0) {
        p.maxHp = Math.round(p.maxHp * (1 + gymBuff));
        p.atk = Math.round(p.atk * (1 + gymBuff));
        p.def = Math.round(p.def * (1 + gymBuff));
        p.speed = Math.round(p.speed * (1 + gymBuff));
    }

    // Cập nhật Máu hiện tại tương ứng khi MaxHP thay đổi
    if (!oldMaxHp) {
        p.hp = p.maxHp;
    } else {
        let hpRatio = p.hp / oldMaxHp;
        p.hp = Math.round(p.maxHp * hpRatio);
    }
}

function recalculateSkillValues(skill, level) {
    let levelMult = 1 + (level - 1) * 0.12;
    let mult = (skill.rollMult || 1) * levelMult;

    if (skill.baseValPower) skill.power = Math.round(skill.baseValPower * mult);
    if (skill.baseValShield) skill.shield = Math.round(skill.baseValShield * mult);
    if (skill.baseValHeal) skill.heal = Math.round(skill.baseValHeal * mult);
}
