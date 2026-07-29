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

const POKEMON_SPECIES = [
    { name: 'Charmander', type: 'Fire', baseHp: 110, baseAtk: 22, baseSpeed: 115, baseInitMp: 30 },
    { name: 'Magmar', type: 'Fire', baseHp: 125, baseAtk: 25, baseSpeed: 105, baseInitMp: 25 },
    { name: 'Squirtle', type: 'Water', baseHp: 130, baseAtk: 18, baseSpeed: 95, baseInitMp: 20 },
    { name: 'Psyduck', type: 'Water', baseHp: 120, baseAtk: 21, baseSpeed: 100, baseInitMp: 30 },
    { name: 'Bulbasaur', type: 'Grass', baseHp: 120, baseAtk: 20, baseSpeed: 100, baseInitMp: 25 },
    { name: 'Oddish', type: 'Grass', baseHp: 115, baseAtk: 19, baseSpeed: 90, baseInitMp: 20 },
    { name: 'Pikachu', type: 'Electric', baseHp: 95, baseAtk: 26, baseSpeed: 140, baseInitMp: 40 },
    { name: 'Voltorb', type: 'Electric', baseHp: 90, baseAtk: 23, baseSpeed: 150, baseInitMp: 35 },
    { name: 'Geodude', type: 'Rock', baseHp: 210, baseAtk: 17, baseSpeed: 75, baseInitMp: 15 },
    { name: 'Onix', type: 'Rock', baseHp: 280, baseAtk: 21, baseSpeed: 80, baseInitMp: 20 },
    { name: 'Rattata', type: 'Grass', baseHp: 90, baseAtk: 16, baseSpeed: 110, baseInitMp: 20 },
    { name: 'Pidgey', type: 'Electric', baseHp: 100, baseAtk: 18, baseSpeed: 120, baseInitMp: 20 },
    { name: 'Machop', type: 'Fire', baseHp: 140, baseAtk: 24, baseSpeed: 85, baseInitMp: 20 }
];

// --- SKILL TEMPLATES ---
const ELEMENTAL_SKILL_TEMPLATES = {
    Fire: {
        Basic: [{ name: 'Cào Xé Lửa', basePower: 12, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Tia Lửa Đốt Bỏng', basePower: 22, cost: 20, cd: 1, category: 'damage', effect: { type: 'burn', duration: 3, val: 10, name: 'Thiêu Đốt' } },
            { name: 'Lớp Giáp Nhiệt', baseShield: 25, cost: 20, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Phun Lửa Lớn', basePower: 45, cost: 45, cd: 2, category: 'damage', effect: { type: 'burn', duration: 3, val: 16, name: 'Thiêu Đốt' } },
            { name: 'Vòng Lửa Hồi Phục', baseHeal: 35, cost: 40, cd: 3, category: 'heal' }
        ],
        Ultimate: [{ name: 'Rồng Lửa Hủy Diệt', basePower: 90, cost: 80, cd: 3, category: 'damage', effect: { type: 'burn', duration: 4, val: 25, name: 'Thiêu Đốt Cuồng Nổ' } }]
    },
    Water: {
        Basic: [{ name: 'Đòn Nước Nhẹ', basePower: 10, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Bóng Nước Làm Chậm', basePower: 22, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 30, name: 'Giảm Tốc 30%' } },
            { name: 'Khiên Bong Bóng', baseShield: 30, cost: 20, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Thủy Pháo Làm Băng', basePower: 42, cost: 40, cd: 2, category: 'damage', effect: { type: 'slow', duration: 3, val: 40, name: 'Giảm Tốc 40%' } },
            { name: 'Dòng Sống Hồi Sinh', baseHeal: 40, cost: 45, cd: 3, category: 'heal' }
        ],
        Ultimate: [{ name: 'Sóng Thần Cuồng Nổ', basePower: 95, cost: 80, cd: 3, category: 'damage', effect: { type: 'slow', duration: 3, val: 50, name: 'Giảm Tốc 50%' } }]
    },
    Grass: {
        Basic: [{ name: 'Roi Gai Cơ Bản', basePower: 11, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Lá Sắc Nhọn', basePower: 26, cost: 20, cd: 1, category: 'damage' },
            { name: 'Áo Giáp Gai Phản Đòn', baseShield: 25, cost: 25, cd: 2, category: 'shield', effect: { type: 'thorn', duration: 3, val: 30, name: 'Giáp Gai (30% Reflect)' } }
        ],
        Skill2: [
            { name: 'Bão Lá Tấn Công', basePower: 48, cost: 40, cd: 2, category: 'damage' },
            { name: 'Vỏ Cây Giáp Gai Cổ Thụ', baseShield: 35, cost: 35, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 45, name: 'Giáp Gai (45% Reflect)' } }
        ],
        Ultimate: [{ name: 'Cuồng Phong Thực Vật', basePower: 98, cost: 80, cd: 3, category: 'damage' }]
    },
    Electric: {
        Basic: [{ name: 'Chớp Điện', basePower: 14, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Sốc Điện Tê Liệt', basePower: 25, cost: 25, cd: 1, category: 'damage', effect: { type: 'shock', duration: 2, val: 12, name: 'Nhiễm Điện' } },
            { name: 'Trường Điện Từ', baseShield: 22, cost: 20, cd: 2, category: 'shield' }
        ],
        Skill2: [
            { name: 'Sấm Sét Liên Hoàn', basePower: 50, cost: 50, cd: 2, category: 'damage', effect: { type: 'shock', duration: 3, val: 18, name: 'Nhiễm Điện' } },
            { name: 'Nạp Năng Lượng', baseHeal: 30, cost: 35, cd: 3, category: 'heal' }
        ],
        Ultimate: [{ name: 'Thiên Lôi Hủy Diệt', basePower: 100, cost: 85, cd: 3, category: 'damage', effect: { type: 'shock', duration: 3, val: 28, name: 'Sốc Điện Nặng' } }]
    },
    Rock: {
        Basic: [{ name: 'Ném Đá Cổ Đại', basePower: 15, cost: 0, cd: 0, mpGain: 25, category: 'damage' }],
        Skill1: [
            { name: 'Vạn Lý Thạch Giáp', baseShield: 45, cost: 20, cd: 2, category: 'shield' },
            { name: 'Đá Lăn Giảm Tốc', basePower: 20, cost: 20, cd: 1, category: 'damage', effect: { type: 'slow', duration: 2, val: 25, name: 'Giảm Tốc 25%' } }
        ],
        Skill2: [
            { name: 'Giáp Đá Thạch Anh', baseShield: 65, cost: 35, cd: 3, category: 'shield', effect: { type: 'thorn', duration: 3, val: 35, name: 'Giáp Gai (35% Reflect)' } },
            { name: 'Mưa Đá Đè Chắn', basePower: 52, cost: 45, cd: 2, category: 'damage' }
        ],
        Ultimate: [{ name: 'Địa Shaking Hủy Diệt', basePower: 110, cost: 85, cd: 3, category: 'damage' }]
    }
};

// --- GAME STATE ---
let gems = 1000;
let team = [];
let activePokeIdx = 0;
let enemyPoke = null;
let currentTurnOwner = null;
let isProcessingTurn = false;

// Campaign Progress State
let selectedCampaignId = 1;
let currentWaveIdx = 0;
let currentCampaignEnemies = [];

// Merge State
let mergeSlotMain = null;
let mergeSlotSub = null;
let currentSelectingSlot = null;

// --- INITIALIZATION ---
window.onload = function() {
    if (typeof renderCampaignSelector === 'function') renderCampaignSelector();
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tabId === 'gacha-tab') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else if (tabId === 'merge-tab') {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        updateMergeUI();
    } else if (tabId === 'campaign-tab') {
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
        if (team.length > 0 && !enemyPoke) startBattle();
    }
    document.getElementById(tabId).classList.add('active');
    updateUI();
}

// --- V-LEVEL BUFF MATH ---
function getVLevelBuffRatio(vLevel) {
    if (!vLevel || vLevel <= 0) return { hpRatio: 0, atkRatio: 0, spdRatio: 0 };
    if (vLevel === 1) return { hpRatio: 0.15, atkRatio: 0.15, spdRatio: 0.10 };
    if (vLevel === 2) return { hpRatio: 0.35, atkRatio: 0.35, spdRatio: 0.20 };
    if (vLevel === 3) return { hpRatio: 0.60, atkRatio: 0.60, spdRatio: 0.30 };
    
    let extra = vLevel - 3;
    return {
        hpRatio: 0.60 + extra * 0.30,
        atkRatio: 0.60 + extra * 0.30,
        spdRatio: 0.30 + extra * 0.10
    };
}

function recalculatePokemonStats(p) {
    let species = POKEMON_SPECIES.find(s => s.name === p.name);
    if (!species) return;

    let levelHpBonus = (p.level - 1) * (p.type === 'Rock' ? 35 : 20);
    let levelAtkBonus = (p.level - 1) * 6;
    let levelSpeedBonus = (p.level - 1) * 4;

    let rawMaxHp = Math.round((species.baseHp + levelHpBonus) * p.rarity.statMult);
    let rawAtk = Math.round((species.baseAtk + levelAtkBonus) * p.rarity.statMult);
    let rawSpeed = Math.round((species.baseSpeed + levelSpeedBonus) * p.rarity.statMult);

    let vBuff = getVLevelBuffRatio(p.vLevel || 0);

    let oldMaxHp = p.maxHp;
    p.maxHp = Math.round(rawMaxHp * (1 + vBuff.hpRatio));
    p.atk = Math.round(rawAtk * (1 + vBuff.atkRatio));
    p.speed = Math.round(rawSpeed * (1 + vBuff.spdRatio));

    if (!oldMaxHp) p.hp = p.maxHp;
    else p.hp = Math.min(p.maxHp, p.hp + (p.maxHp - oldMaxHp));
}

// --- GENERATE SKILLS ---
function generateSkillInstance(type, skillGroup, rarity, pokeLevel = 1) {
    let pool = ELEMENTAL_SKILL_TEMPLATES[type][skillGroup];
    let template = pool[Math.floor(Math.random() * pool.length)];
    let randMultiplier = rarity.skillMin + Math.random() * (rarity.skillMax - rarity.skillMin);
    
    let skillInst = {
        name: template.name,
        type: skillGroup,
        category: template.category,
        cost: template.cost,
        cd: template.cd,
        currentCd: 0,
        mpGain: template.mpGain || 0,
        effect: template.effect ? JSON.parse(JSON.stringify(template.effect)) : null,
        baseValPower: template.basePower ? Math.round(template.basePower * randMultiplier) : 0,
        baseValShield: template.baseShield ? Math.round(template.baseShield * randMultiplier) : 0,
        baseValHeal: template.baseHeal ? Math.round(template.baseHeal * randMultiplier) : 0
    };

    recalculateSkillValues(skillInst, pokeLevel);
    return skillInst;
}

function recalculateSkillValues(skill, level) {
    let levelMult = 1 + (level - 1) * 0.12; 
    if (skill.baseValPower) skill.power = Math.round(skill.baseValPower * levelMult);
    if (skill.baseValShield) skill.shield = Math.round(skill.baseValShield * levelMult);
    if (skill.baseValHeal) skill.heal = Math.round(skill.baseValHeal * levelMult);
}

// --- GACHA & ROSTER ---
function drawGacha() {
    if (gems < 100) { alert("Không đủ Gem!"); return; }
    gems -= 100;
    document.getElementById('gem-count').innerText = gems;

    let rand = Math.random() * 100;
    let cum = 0;
    let selectedRarity = RARITIES[0];
    for (let r of RARITIES) {
        cum += r.chance;
        if (rand <= cum) { selectedRarity = r; break; }
    }

    let species = POKEMON_SPECIES[Math.floor(Math.random() * POKEMON_SPECIES.length)];

    let newPoke = {
        id: Date.now(),
        name: species.name,
        type: species.type,
        rarity: selectedRarity,
        vLevel: 0,
        level: 1,
        exp: 0,
        maxExp: 50,
        maxHp: 0,
        hp: 0,
        shield: 0,
        mp: 0,
        initMp: Math.round(species.baseInitMp * selectedRarity.statMult),
        atk: 0,
        speed: 0,
        spdGauge: 0,
        effects: [],
        skills: [
            generateSkillInstance(species.type, 'Basic', selectedRarity, 1),
            generateSkillInstance(species.type, 'Skill1', selectedRarity, 1)
        ]
    };

    recalculatePokemonStats(newPoke);
    newPoke.hp = newPoke.maxHp;

    team.push(newPoke);

    document.getElementById('gacha-result').innerHTML = `
        <span class="${selectedRarity.color}">
            🎉 Bạn nhận được: <b>[${selectedRarity.name}] ${newPoke.name}</b> (Hệ ${newPoke.type})!
        </span>
    `;

    renderRoster();
}

function renderRoster() {
    let rosterContainer = document.getElementById('roster-container');
    if (!rosterContainer) return;
    if (team.length === 0) { rosterContainer.innerHTML = "Chưa có Pokémon nào!"; return; }

    rosterContainer.innerHTML = '';
    team.forEach((p, idx) => {
        let vBadge = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        rosterContainer.innerHTML += `
            <div class="roster-item" onclick="switchPokemon(${idx})" style="${idx === activePokeIdx ? 'border: 2px solid #f5c518; background: #2f2f45;' : ''}">
                <div>
                    <span class="${p.rarity.color}"><b>${p.name}</b></span> ${vBadge} (Lv.${p.level})
                    <span class="type-badge type-${p.type}">${p.type}</span>
                    ${idx === activePokeIdx ? ' <small style="color:#f5c518;">[Đang chọn]</small>' : ''}
                </div>
                <small>HP:${p.hp}/${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
            </div>
        `;
    });
}

function switchPokemon(idx) {
    activePokeIdx = idx;
    log(`🔄 Đã chọn <b>${team[activePokeIdx].name}</b> làm Pokémon xuất trận!`);
    renderRoster();
    updateUI();
}

// --- MERGE LOGIC ---
function openMergeSelectModal(slotType) {
    currentSelectingSlot = slotType;
    let modalList = document.getElementById('merge-modal-list');
    modalList.innerHTML = '';

    if (team.length === 0) {
        modalList.innerHTML = 'Chưa có Pokémon nào trong kho!';
    } else {
        team.forEach((p, idx) => {
            if ((slotType === 'main' && idx === mergeSlotSub) || (slotType === 'sub' && idx === mergeSlotMain)) return;

            let vBadge = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
            modalList.innerHTML += `
                <div class="roster-item" onclick="selectPokemonForMerge(${idx})">
                    <div>
                        <span class="${p.rarity.color}"><b>${p.name}</b></span> ${vBadge} (Lv.${p.level})
                        <span class="type-badge type-${p.type}">${p.type}</span>
                    </div>
                    <small>HP:${p.hp}/${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
                </div>
            `;
        });
    }

    document.getElementById('merge-modal').style.display = 'flex';
}

function closeMergeModal() {
    document.getElementById('merge-modal').style.display = 'none';
}

function selectPokemonForMerge(idx) {
    if (currentSelectingSlot === 'main') mergeSlotMain = idx;
    if (currentSelectingSlot === 'sub') mergeSlotSub = idx;

    closeMergeModal();
    updateMergeUI();
}

function updateMergeUI() {
    let slotMainEl = document.getElementById('slot-main');
    let slotSubEl = document.getElementById('slot-sub');
    let previewEl = document.getElementById('merge-preview');
    let btnMerge = document.getElementById('btn-do-merge');

    if (!slotMainEl || !slotSubEl) return;

    if (mergeSlotMain !== null && team[mergeSlotMain]) {
        let p = team[mergeSlotMain];
        let vText = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        slotMainEl.className = "merge-slot filled";
        slotMainEl.innerHTML = `<div><b class="${p.rarity.color}">${p.name}</b> ${vText}<br><small>Lv.${p.level} - Hệ ${p.type}</small></div>`;
    } else {
        slotMainEl.className = "merge-slot";
        slotMainEl.innerHTML = `<div class="slot-placeholder">+ Chọn Phôi Chính</div>`;
    }

    if (mergeSlotSub !== null && team[mergeSlotSub]) {
        let p = team[mergeSlotSub];
        let vText = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        slotSubEl.className = "merge-slot filled";
        slotSubEl.innerHTML = `<div><b class="${p.rarity.color}">${p.name}</b> ${vText}<br><small>Lv.${p.level} - Hệ ${p.type}</small></div>`;
    } else {
        slotSubEl.className = "merge-slot";
        slotSubEl.innerHTML = `<div class="slot-placeholder">+ Chọn Phôi Phụ</div>`;
    }

    if (mergeSlotMain !== null && mergeSlotSub !== null) {
        let pMain = team[mergeSlotMain];
        let pSub = team[mergeSlotSub];

        if (pMain.name !== pSub.name) {
            previewEl.innerHTML = `<span style="color:#ff4757;">❌ Phải cùng loại (${pMain.name})!</span>`;
            btnMerge.disabled = true;
        } else if ((pMain.vLevel || 0) !== (pSub.vLevel || 0)) {
            previewEl.innerHTML = `<span style="color:#ff4757;">❌ Phải cùng cấp V (V${pMain.vLevel || 0} vs V${pSub.vLevel || 0})!</span>`;
            btnMerge.disabled = true;
        } else {
            let nextV = (pMain.vLevel || 0) + 1;
            previewEl.innerHTML = `<b style="color:#4caf50;">✅ HỢP NHẤT THÀNH: ${pMain.name} V${nextV}</b>`;
            btnMerge.disabled = false;
        }
    } else {
        previewEl.innerHTML = `<i>Vui lòng chọn đủ 2 Pokémon...</i>`;
        btnMerge.disabled = true;
    }
}

function executeMerge() {
    if (mergeSlotMain === null || mergeSlotSub === null) return;

    let pMain = team[mergeSlotMain];
    let pSub = team[mergeSlotSub];

    pMain.vLevel = (pMain.vLevel || 0) + 1;
    if (pSub.level > pMain.level) {
        pMain.level = pSub.level;
        pMain.exp = pSub.exp;
        pMain.maxExp = pSub.maxExp;
    }

    recalculatePokemonStats(pMain);
    pMain.skills.forEach(s => recalculateSkillValues(s, pMain.level));

    team.splice(mergeSlotSub, 1);
    mergeSlotMain = null;
    mergeSlotSub = null;

    log(`🧬 <b>HỢP NHẤT THÀNH CÔNG!</b> Bạn nhận được <b>${pMain.name} V${pMain.vLevel}</b>!`);

    updateMergeUI();
    renderRoster();
    if (typeof updateUI === 'function') updateUI();
}

// --- CAMPAIGN BATTLE ENGINE ---
function renderCampaignSelector() {
    let container = document.getElementById('campaign-selector');
    if (!container || typeof CAMPAIGN_LEVELS === 'undefined') return;
    container.innerHTML = '';
    CAMPAIGN_LEVELS.forEach(lvl => {
        container.innerHTML += `
            <div class="campaign-card ${lvl.id === selectedCampaignId ? 'active' : ''}" onclick="selectCampaign(${lvl.id})">
                <b style="color: #f5c518;">${lvl.name}</b><br>
                <small style="color: #aaa;">${lvl.description}</small><br>
                <small style="color: #4caf50;">Thưởng: ${lvl.rewardGems} Gem | Số ải: ${lvl.enemies.length}</small>
            </div>
        `;
    });
}

function selectCampaign(id) {
    selectedCampaignId = id;
    renderCampaignSelector();
    startBattle();
}

function startBattle() {
    if (team.length === 0) {
        alert("Bạn chưa có Pokémon nào! Hãy sang mục Gacha để quay trước.");
        switchTab('gacha-tab');
        return;
    }

    let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
    if (!campData) return;

    currentWaveIdx = 0;
    currentCampaignEnemies = campData.enemies;

    let playerP = team[activePokeIdx];
    playerP.hp = playerP.maxHp;
    playerP.shield = 0;
    playerP.mp = playerP.initMp; 
    playerP.spdGauge = playerP.speed; 
    playerP.effects = [];
    playerP.skills.forEach(s => s.currentCd = 0);

    loadCampaignWave(currentWaveIdx);
}

function loadCampaignWave(waveIdx) {
    let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
    let enemyConfig = currentCampaignEnemies[waveIdx];

    let eSpecies = POKEMON_SPECIES.find(s => s.name === enemyConfig.speciesName) || POKEMON_SPECIES[0];
    let eRarity = RARITIES.find(r => r.name === enemyConfig.rarityName) || RARITIES[0];
    let eLevel = enemyConfig.level;
    let sMult = enemyConfig.statMult;

    enemyPoke = {
        name: eSpecies.name,
        type: eSpecies.type,
        rarity: eRarity,
        vLevel: 0,
        level: eLevel,
        maxHp: Math.round((eSpecies.baseHp + eLevel * 25) * eRarity.statMult * sMult),
        hp: Math.round((eSpecies.baseHp + eLevel * 25) * eRarity.statMult * sMult),
        shield: 0,
        initMp: Math.round(eSpecies.baseInitMp * eRarity.statMult),
        mp: Math.round(eSpecies.baseInitMp * eRarity.statMult),
        atk: Math.round((eSpecies.baseAtk + eLevel * 5) * eRarity.statMult * sMult),
        speed: Math.round((eSpecies.baseSpeed + eLevel * 2) * eRarity.statMult),
        spdGauge: Math.round((eSpecies.baseSpeed + eLevel * 2) * eRarity.statMult),
        effects: [],
        skills: [
            generateSkillInstance(eSpecies.type, 'Basic', eRarity, eLevel),
            generateSkillInstance(eSpecies.type, 'Skill1', eRarity, eLevel)
        ]
    };

    if (eLevel >= 5) enemyPoke.skills.push(generateSkillInstance(eSpecies.type, 'Skill2', eRarity, eLevel));
    if (eLevel >= 10) enemyPoke.skills.push(generateSkillInstance(eSpecies.type, 'Ultimate', eRarity, eLevel));

    isProcessingTurn = false;

    document.getElementById('campaign-title').innerText = `⚔️ ${campData.name}`;
    document.getElementById('wave-indicator').innerText = `Wave: ${waveIdx + 1}/${currentCampaignEnemies.length}`;

    log(`⚔️ [Wave ${waveIdx + 1}] Bắt đầu! <b>${team[activePokeIdx].name}</b> VS <b>${enemyPoke.name}</b> (HP: ${enemyPoke.hp}, Hệ: ${enemyPoke.type})`);
    determineNextTurn();
}

function getEffectiveSpeed(poke) {
    let speedMult = 1.0;
    poke.effects.forEach(e => {
        if (e.type === 'slow') speedMult -= (e.val / 100);
    });
    return Math.max(10, Math.round(poke.speed * Math.max(0.2, speedMult)));
}

function determineNextTurn() {
    let p = team[activePokeIdx];
    if (p.hp <= 0 || enemyPoke.hp <= 0) return;

    while (p.spdGauge < 100 && enemyPoke.spdGauge < 100) {
        p.spdGauge += getEffectiveSpeed(p) * 0.2;
        enemyPoke.spdGauge += getEffectiveSpeed(enemyPoke) * 0.2;
    }

    updateUI();

    if (p.spdGauge >= enemyPoke.spdGauge) {
        currentTurnOwner = 'player';
        processStartOfTurnEffects(p);
        if (p.hp <= 0) return;
        log(`⚡ Lượt của <b>${p.name}</b>!`);
        updateUI();
    } else {
        currentTurnOwner = 'bot';
        processStartOfTurnEffects(enemyPoke);
        if (enemyPoke.hp <= 0) return;
        log(`🤖 Lượt của <b>${enemyPoke.name} (Bot)</b>!`);
        updateUI();
        executeBotTurn();
    }
}

function processStartOfTurnEffects(poke) {
    let isPlayer = (poke === team[activePokeIdx]);
    let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} (Bot)</b>`;

    for (let i = poke.effects.length - 1; i >= 0; i--) {
        let eff = poke.effects[i];

        if (eff.type === 'burn') {
            let dmg = eff.val;
            poke.hp = Math.max(0, poke.hp - dmg);
            log(`🔥 ${pokeTitle} chịu <b>${dmg}</b> sát thương từ [${eff.name}]!`);
        } else if (eff.type === 'shock') {
            let dmg = eff.val;
            poke.hp = Math.max(0, poke.hp - dmg);
            log(`⚡ ${pokeTitle} bị giật chịu <b>${dmg}</b> sát thương từ [${eff.name}]!`);
        }

        eff.duration--;
        if (eff.duration <= 0) {
            log(`✨ Hiệu ứng [${eff.name}] trên ${pokeTitle} đã hết hạn.`);
            poke.effects.splice(i, 1);
        }
    }

    if (poke.hp <= 0) {
        if (isPlayer) {
            log(`💀 <b>${poke.name}</b> đã gục ngã vì mất máu đầu lượt!`);
        } else {
            handleEnemyDefeated();
        }
        updateUI();
    }
}

function applyStatusEffect(target, effectObj) {
    if (!effectObj) return;
    let existing = target.effects.find(e => e.type === effectObj.type);
    if (existing) {
        existing.duration = effectObj.duration;
        existing.val = effectObj.val;
    } else {
        target.effects.push(JSON.parse(JSON.stringify(effectObj)));
    }
    log(`✨ ${target.name} dính hiệu ứng: <b>[${effectObj.name}]</b> (${effectObj.duration} lượt)!`);
}

function handleEnemyDefeated() {
    let p = team[activePokeIdx];
    log(`🏆 Hạ gục thành công ${enemyPoke.name}!`);
    gainExp(p, 30 + enemyPoke.level * 10);

    currentWaveIdx++;
    if (currentWaveIdx < currentCampaignEnemies.length) {
        log(`➡️ Chuẩn bị bước vào Wave ${currentWaveIdx + 1}...`);
        setTimeout(() => loadCampaignWave(currentWaveIdx), 1200);
    } else {
        let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
        gems += campData.rewardGems;
        document.getElementById('gem-count').innerText = gems;
        log(`🎉 <b>HOÀN THÀNH MÀN CHIẾN DỊCH!</b> Nhận thưởng +${campData.rewardGems} Gem & +${campData.rewardExp} EXP!`);
        gainExp(p, campData.rewardExp);
    }
}

function useSkill(skillIdx) {
    if (currentTurnOwner !== 'player' || isProcessingTurn) return;

    let p = team[activePokeIdx];
    let skill = p.skills[skillIdx];

    if (p.mp < skill.cost) { log(`❌ Không đủ MP để dùng ${skill.name}!`); return; }
    if (skill.currentCd > 0) { log(`⏳ ${skill.name} đang hồi chiêu (${skill.currentCd} lượt)!`); return; }

    isProcessingTurn = true;
    executeSkillAction(p, enemyPoke, skill, true);

    p.spdGauge -= 100;
    p.skills.forEach(s => { if (s.currentCd > 0) s.currentCd--; });

    if (enemyPoke.hp <= 0) {
        handleEnemyDefeated();
        isProcessingTurn = false;
        updateUI();
        return;
    }

    isProcessingTurn = false;
    determineNextTurn();
}

function executeBotTurn() {
    isProcessingTurn = true;
    setTimeout(() => {
        if (enemyPoke.hp <= 0) return;

        let p = team[activePokeIdx];
        
        let usableSkills = enemyPoke.skills.filter(s => s.currentCd === 0 && enemyPoke.mp >= s.cost);
        let chosenSkill = null;

        if (enemyPoke.hp / enemyPoke.maxHp < 0.4) {
            chosenSkill = usableSkills.find(s => s.category === 'heal');
        }

        if (!chosenSkill) {
            let dmgSkills = usableSkills.filter(s => s.category === 'damage');
            dmgSkills.sort((a, b) => b.power - a.power);
            if (dmgSkills.length > 0) chosenSkill = dmgSkills[0];
        }

        if (!chosenSkill) chosenSkill = enemyPoke.skills[0];

        executeSkillAction(enemyPoke, p, chosenSkill, false);

        enemyPoke.spdGauge -= 100;
        enemyPoke.skills.forEach(s => { if (s.currentCd > 0) s.currentCd--; });

        if (p.hp <= 0) {
            log(`💀 <b>${p.name}</b> đã gục ngã! Chiến dịch thất bại.`);
            isProcessingTurn = false;
            updateUI();
            return;
        }

        isProcessingTurn = false;
        determineNextTurn();
    }, 800);
}

function executeSkillAction(caster, target, skill, isPlayer) {
    caster.mp -= skill.cost;
    if (skill.mpGain) caster.mp = Math.min(100, caster.mp + skill.mpGain);
    skill.currentCd = skill.cd + 1;

    let prefix = isPlayer ? `🥊 <b>${caster.name}</b>` : `🤖 <b>${caster.name} (Bot)</b>`;

    if (skill.category === 'damage') {
        let mult = (TYPE_CHART[caster.type] && TYPE_CHART[caster.type][target.type]) ? TYPE_CHART[caster.type][target.type] : 1.0;
        let isCrit = Math.random() < 0.15;
        let critMult = isCrit ? 1.5 : 1.0;
        let rawDmg = Math.round((caster.atk + skill.power) * mult * critMult * (0.9 + Math.random() * 0.2));

        let actualDmgToTarget = rawDmg;
        if (target.shield > 0) {
            if (target.shield >= actualDmgToTarget) {
                target.shield -= actualDmgToTarget;
                actualDmgToTarget = 0;
            } else {
                actualDmgToTarget -= target.shield;
                target.shield = 0;
            }
        }
        target.hp = Math.max(0, target.hp - actualDmgToTarget);

        let critText = isCrit ? "🔥 <b>BẠO KÍCH!</b> " : "";
        let typeText = mult > 1 ? " (Xung khắc!)" : mult < 1 ? " (Kháng...)" : "";
        log(`${critText}${prefix} dùng [${skill.name}] gây <b>${rawDmg}</b> sát thương${typeText}!`);

        if (skill.effect) {
            applyStatusEffect(target, skill.effect);
        }

        let thornEff = target.effects.find(e => e.type === 'thorn');
        if (thornEff && rawDmg > 0) {
            let reflectDmg = Math.round(rawDmg * (thornEff.val / 100));
            caster.hp = Math.max(0, caster.hp - reflectDmg);
            log(`🌵 <b>[Giáp Gai]</b> của ${target.name} phản lại <b>${reflectDmg}</b> sát thương lên ${caster.name}!`);
        }
    } 
    else if (skill.category === 'shield') {
        caster.shield += skill.shield;
        log(`🛡️ ${prefix} dùng [${skill.name}] nhận <b>+${skill.shield} Khiên</b>!`);
        if (skill.effect) {
            applyStatusEffect(caster, skill.effect);
        }
    } 
    else if (skill.category === 'heal') {
        let healAmount = skill.heal;
        caster.hp = Math.min(caster.maxHp, caster.hp + healAmount);
        log(`💚 ${prefix} dùng [${skill.name}] hồi <b>+${healAmount} HP</b>!`);
    }
}

// --- EXP & LEVEL UP ---
function gainExp(p, amount) {
    p.exp += amount;
    log(`✨ ${p.name} nhận +${amount} EXP!`);

    if (p.exp >= p.maxExp) {
        p.level++;
        p.exp -= p.maxExp;
        p.maxExp = Math.round(p.maxExp * 1.5);

        recalculatePokemonStats(p);
        p.skills.forEach(s => recalculateSkillValues(s, p.level));

        log(`🎉 <b>${p.name} LÊN CẤP ${p.level}!</b> (Chỉ số đã được gia tăng!)`);

        if (p.level === 5) triggerSkillSelect(p, 'Skill2', 'MỞ KHÓA CHIÊU 2 (LEVEL 5)');
        else if (p.level === 10) triggerSkillSelect(p, 'Ultimate', 'MỞ KHÓA CHIÊU CUỐI (LEVEL 10)');
        else if (p.level > 10 && p.level % 5 === 0) triggerSkillSelect(p, 'Ultimate', `THAY THẾ KỸ NĂNG (LEVEL ${p.level})`);
    }

    renderRoster();
    updateUI();
}

function triggerSkillSelect(p, group, title) {
    document.getElementById('modal-title').innerText = title;
    
    let opt1 = generateSkillInstance(p.type, group, p.rarity, p.level);
    let opt2 = generateSkillInstance(p.type, group, p.rarity, p.level);
    let choices = [opt1, opt2];

    let choicesHtml = '';
    choices.forEach((sk, idx) => {
        let valText = sk.power ? `Sát thương: ${sk.power}` : sk.shield ? `Khiên: +${sk.shield}` : `Hồi máu: +${sk.heal}`;
        let effText = sk.effect ? ` | Hiệu ứng: ${sk.effect.name}` : '';
        choicesHtml += `
            <button class="choice-btn" onclick="learnSkillDirectly(${idx})">
                <b>${sk.name}</b> (${sk.type} - Hệ ${p.type}) | ${valText}${effText} | MP: ${sk.cost}<br>
                <small>Chỉ số đã scale theo Lv.${p.level}</small>
            </button>
        `;
    });

    window.pendingChoices = choices;
    document.getElementById('skill-choices').innerHTML = choicesHtml;
    document.getElementById('skill-modal').style.display = 'flex';
}

function learnSkillDirectly(choiceIdx) {
    let p = team[activePokeIdx];
    let sk = window.pendingChoices[choiceIdx];

    if (p.skills.length < 4) p.skills.push(sk);
    else p.skills[3] = sk;

    log(`🔥 ${p.name} học kỹ năng mới: <b>${sk.name}</b>!`);
    document.getElementById('skill-modal').style.display = 'none';
    updateUI();
}

// --- REALTIME UI RENDER ---
function renderEffectsUI(containerId, poke) {
    let el = document.getElementById(containerId);
    if (!el || !poke || !poke.effects) return;

    el.innerHTML = '';
    poke.effects.forEach(eff => {
        let cssClass = `effect-${eff.type}`;
        el.innerHTML += `<span class="effect-badge ${cssClass}">${eff.name} (${eff.duration}t)</span>`;
    });
}

function updateUI() {
    let p = team[activePokeIdx];
    if (!p) return;

    // Player Box
    let vText = p.vLevel > 0 ? ` V${p.vLevel}` : '';
    document.getElementById('player-name').innerText = `${p.name}${vText} (Lv.${p.level})`;
    document.getElementById('player-stats').innerText = `HP:${p.hp}/${p.maxHp} | MP:${p.mp}/100\nSPD:${getEffectiveSpeed(p)} (${p.speed}) | Gauge:${Math.round(p.spdGauge)}`;
    document.getElementById('player-hp').style.width = `${(p.hp / p.maxHp) * 100}%`;
    document.getElementById('player-shield').style.width = `${Math.min(100, (p.shield / p.maxHp) * 100)}%`;
    document.getElementById('player-mp').style.width = `${p.mp}%`;
    document.getElementById('player-spd').style.width = `${Math.min(100, (p.spdGauge / 100) * 100)}%`;
    
    let pBadge = document.getElementById('player-type-badge');
    pBadge.innerText = p.type;
    pBadge.className = `type-badge type-${p.type}`;
    renderEffectsUI('player-effects', p);

    // Enemy Box
    if (enemyPoke) {
        document.getElementById('enemy-name').innerText = `${enemyPoke.name} (Lv.${enemyPoke.level})`;
        document.getElementById('enemy-stats').innerText = `HP:${enemyPoke.hp}/${enemyPoke.maxHp} | MP:${enemyPoke.mp}/100\nSPD:${getEffectiveSpeed(enemyPoke)} (${enemyPoke.speed}) | Gauge:${Math.round(enemyPoke.spdGauge)}`;
        document.getElementById('enemy-hp').style.width = `${(enemyPoke.hp / enemyPoke.maxHp) * 100}%`;
        document.getElementById('enemy-shield').style.width = `${Math.min(100, (enemyPoke.shield / enemyPoke.maxHp) * 100)}%`;
        document.getElementById('enemy-mp').style.width = `${enemyPoke.mp}%`;
        document.getElementById('enemy-spd').style.width = `${Math.min(100, (enemyPoke.spdGauge / 100) * 100)}%`;

        let eBadge = document.getElementById('enemy-type-badge');
        eBadge.innerText = enemyPoke.type;
        eBadge.className = `type-badge type-${enemyPoke.type}`;
        renderEffectsUI('enemy-effects', enemyPoke);
    }

    let turnText = currentTurnOwner === 'player' ? "⚡ Lượt: BẠN" : "🤖 Lượt: ĐỐI THỦ";
    document.getElementById('turn-indicator').innerText = turnText;

    // Render Skill Buttons
    let container = document.getElementById('skills-container');
    if (!container) return;
    container.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        if (i < p.skills.length) {
            let sk = p.skills[i];
            let isDisabled = currentTurnOwner !== 'player' || isProcessingTurn || p.hp <= 0 || (enemyPoke && enemyPoke.hp <= 0) || p.mp < sk.cost || sk.currentCd > 0;
            let cdTag = sk.currentCd > 0 ? `<span class="cd-tag">CD: ${sk.currentCd}</span>` : '';
            let valText = sk.power ? `Dame: ${sk.power}` : sk.shield ? `Khiên: +${sk.shield}` : `Hồi: +${sk.heal}`;
            let effBadge = sk.effect ? `<small style="color: #64ffda;"> [${sk.effect.name}]</small>` : '';

            container.innerHTML += `
                <button class="skill-btn" onclick="useSkill(${i})" ${isDisabled ? 'disabled' : ''}>
                    ${cdTag}
                    <b>${sk.name}</b> (${sk.type})<br>
                    <small style="color: #f5c518; font-weight: bold;">${valText}</small>${effBadge} | <small>MP: ${sk.cost}</small>
                </button>
            `;
        } else {
            container.innerHTML += `
                <button class="skill-btn" disabled style="opacity: 0.3;">
                    🔒 Ô Kỹ Năng ${i+1}<br><small>${i === 2 ? 'Lvl 5' : 'Lvl 10'}</small>
                </button>
            `;
        }
    }
}

function log(msg) {
    let logBox = document.getElementById('log');
    if (logBox) {
        logBox.innerHTML += `<div>${msg}</div>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}