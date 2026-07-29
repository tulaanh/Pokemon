// --- GAME STATE ---
let gems = 10000;
let team = [];
let activePokeIdx = 0;
let enemyPoke = null;
let currentTurnOwner = null;
let isProcessingTurn = false;

// Campaign Progress State
let selectedCampaignId = 1;
let currentWaveIdx = 0;
let currentCampaignEnemies = [];
let battleRewards = { gems: 0, exp: 0 };

// Merge State
let mergeSlotMain = null;
let mergeSlotSub = null;
let currentSelectingSlot = null;

// Filter State
let searchQuery = '';
let sortBy = 'default';

const RARITY_ORDER = { 'Common': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4 };

// --- INITIALIZATION ---
window.onload = function () {
    if (typeof renderCampaignSelector === 'function') renderCampaignSelector();
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabId === 'gacha-tab') {
        tabButtons[0].classList.add('active');
    } else if (tabId === 'roster-tab') {
        tabButtons[1].classList.add('active');
        renderRoster();
    } else if (tabId === 'merge-tab') {
        tabButtons[2].classList.add('active');
        updateMergeUI();
    } else if (tabId === 'campaign-tab') {
        tabButtons[3].classList.add('active');
        selectCampaign(selectedCampaignId);
    }

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    updateUI();
}

// --- V-LEVEL BUFF MATH & STATS ---
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
    if (!p.iv) {
        p.iv = {
            hp: 1,
            atk: 1,
            def: 1,
            speed: 1
        };
    }
    let levelHpBonus = (p.level - 1) * (p.type === 'Rock' ? 35 : 20);
    let levelAtkBonus = (p.level - 1) * 6;
    let levelSpeedBonus = (p.level - 1) * 4;
    let levelDefBonus = (p.level - 1) * 5;

    let rawMaxHp = Math.round(
        (species.baseHp + levelHpBonus) *
        p.rarity.statMult *
        p.iv.hp
    );

    let rawAtk = Math.round(
        (species.baseAtk + levelAtkBonus) *
        p.rarity.statMult *
        p.iv.atk
    );

    let rawDef = Math.round(
        (species.baseDef + levelDefBonus) *
        p.rarity.statMult *
        p.iv.def
    );

    let rawSpeed = Math.round(
        (species.baseSpeed + levelSpeedBonus) *
        p.rarity.statMult *
        p.iv.speed
    );

    let vBuff = getVLevelBuffRatio(p.vLevel || 0);

    let oldMaxHp = p.maxHp;
    p.maxHp = Math.round(rawMaxHp * (1 + vBuff.hpRatio));
    p.atk = Math.round(rawAtk * (1 + vBuff.atkRatio));
    p.speed = Math.round(rawSpeed * (1 + vBuff.spdRatio));
    p.def = Math.round(rawDef * (1 + vBuff.atkRatio));
    if (!oldMaxHp) p.hp = p.maxHp;
    else p.hp = Math.min(p.maxHp, p.hp + (p.maxHp - oldMaxHp));
}

function recalculateSkillValues(skill, level) {
    let levelMult = 1 + (level - 1) * 0.12;
    let mult = (skill.rollMult || 1) * levelMult;

    if (skill.baseValPower) skill.power = Math.round(skill.baseValPower * mult);
    if (skill.baseValShield) skill.shield = Math.round(skill.baseValShield * mult);
    if (skill.baseValHeal) skill.heal = Math.round(skill.baseValHeal * mult);
}

// --- ROSTER & FILTER ---
function onSearchChange(val) {
    searchQuery = val.trim().toLowerCase();
    renderRoster();
}

function onSortChange(val) {
    sortBy = val;
    renderRoster();
}

function filterAndSortTeam() {
    let filtered = team.map((p, originalIndex) => ({ pokemon: p, originalIndex }))
        .filter(item => item.pokemon.name.toLowerCase().includes(searchQuery));

    filtered.sort((a, b) => {
        let pA = a.pokemon;
        let pB = b.pokemon;

        if (sortBy === 'rarity-desc') return (RARITY_ORDER[pB.rarity.name] || 0) - (RARITY_ORDER[pA.rarity.name] || 0);
        if (sortBy === 'rarity-asc') return (RARITY_ORDER[pA.rarity.name] || 0) - (RARITY_ORDER[pB.rarity.name] || 0);
        if (sortBy === 'type') return pA.type.localeCompare(pB.type);
        if (sortBy === 'level-desc') return pB.level - pA.level;
        return 0;
    });

    return filtered;
}

function renderRoster() {
    let rosterContainer = document.getElementById('roster-container');
    if (!rosterContainer) return;

    if (team.length === 0) {
        rosterContainer.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Chưa có Pokémon nào! Hãy sang mục Gacha để quay.</div>';
        return;
    }

    let processedList = filterAndSortTeam();

    if (processedList.length === 0) {
        rosterContainer.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Không tìm thấy Pokémon phù hợp!</div>';
        return;
    }

    rosterContainer.innerHTML = '';
    processedList.forEach(item => {
        let p = item.pokemon;
        let idx = item.originalIndex;
        let vBadge = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        let isSelected = (idx === activePokeIdx);

        rosterContainer.innerHTML += `
            <div class="roster-item" onclick="showPokeDetailModal(${idx})" style="${isSelected ? 'border: 2px solid #f5c518; background: #2f2f45;' : ''}">
                <div>
                    <span class="${p.rarity.color}"><b>${p.name}</b></span> ${vBadge} (Lv.${p.level})
                    <span class="type-badge type-${p.type}">${p.type}</span>
                    ${isSelected ? ' <small style="color:#f5c518; font-weight:bold;">[Đang Chọn xuất trận]</small>' : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <small>HP:${p.hp}/${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
                    <button class="choice-btn" style="padding: 4px 8px; margin: 0; font-size: 11px; width: auto;" onclick="event.stopPropagation(); switchPokemon(${idx});">Xuất Trận</button>
                </div>
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

function showPokeDetailModal(idx) {
    let p = team[idx];
    if (!p) return;

    let vText = p.vLevel > 0 ? ` <span class="v-badge">V${p.vLevel}</span>` : '';
    document.getElementById('modal-poke-name').innerHTML = `<span class="${p.rarity.color}">${p.name}</span>${vText} (Lv.${p.level})`;

    let badgeEl = document.getElementById('modal-poke-type');
    badgeEl.innerText = p.type;
    badgeEl.className = `type-badge type-${p.type}`;

    let statsContainer = document.getElementById('modal-poke-stats');
    statsContainer.innerHTML = `
        <div class="detail-stat-item">Độ Hiếm: <b class="${p.rarity.color}">${p.rarity.name}</b></div>
        <div class="detail-stat-item">Kinh Nghiệm: <b>${p.exp}/${p.maxExp} EXP</b></div>
        <div class="detail-stat-item">Máu (HP): <b>${p.hp}/${p.maxHp}</b></div>
        <div class="detail-stat-item">Công (ATK): <b>${p.atk}</b></div>
        <div class="detail-stat-item">Tốc Độ (SPD): <b>${p.speed}</b></div>
        <div class="detail-stat-item"> Giáp (DEF): <b>${p.def}</b> </div>s
        <div class="detail-stat-item">MP Ban Đầu: <b>${p.initMp}/100</b></div>
    `;

    let skillsContainer = document.getElementById('modal-poke-skills');
    skillsContainer.innerHTML = '';

    p.skills.forEach((sk, i) => {
        // 1. Xử lý hiển thị valText chuẩn xác theo category và thuộc tính của Skill
        let valText = '';
        if (sk.category === 'damage' || sk.category === 'true_damage') {
            valText = `Sát thương: ${sk.power || 0}${sk.isTrueDmg ? ' (Chuẩn)' : ''}`;
        } else if (sk.category === 'shield' || sk.shield) {
            valText = `Khiên: +${sk.shield || 0}`;
        } else if (sk.category === 'heal' || sk.heal) {
            valText = `Hồi phục: +${sk.heal || 0}`;
        } else if (sk.category === 'buff') {
            valText = `Tăng viện`;
        } else {
            valText = `Hỗ trợ`;
        }

        // 2. Xử lý Badge hiệu ứng đi kèm (nếu có)
        let effBadge = sk.effect ? `<span style="color: #64ffda;"> (Hiệu ứng: ${sk.effect.name})</span>` : '';

        // 3. Xử lý thời gian hồi chiêu
        let cdText = sk.cd > 0 ? `Hồi chiêu: ${sk.cd} lượt` : 'Không hồi chiêu';

        // 4. Class màu sắc Độ hiếm
        let rarityColorClass = sk.rarity ? `rarity-${sk.rarity}` : 'rarity-Common';

        // 5. Nếu kỹ năng là dạng Buff thuần (không có sát thương/khiên/hồi máu), giấu valText để tránh dư thừa
        let mainStatHTML = (sk.category === 'buff' && !sk.power && !sk.shield && !sk.heal)
            ? ''
            : `<b style="color: #4caf50;">${valText}</b>`;

        skillsContainer.innerHTML += `
            <div class="detail-skill-card">
                <div class="skill-header">
                    <span>Ô ${i + 1}: <b class="${rarityColorClass}">[${sk.rarity || 'Common'}] ${sk.name}</b></span>
                    <span>MP: ${sk.cost}</span>
                </div>
                <div class="skill-desc">
                    ${mainStatHTML}${effBadge} | <small>${cdText}</small>
                </div>
            </div>
        `;
    });

    document.getElementById('poke-detail-modal').style.display = 'flex';
}

function closePokeDetailModal() {
    document.getElementById('poke-detail-modal').style.display = 'none';
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

    let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
    if (!campData) return;

    document.getElementById('preview-title').innerText = `⚔️ ${campData.name}`;
    document.getElementById('preview-desc').innerText = campData.description;
    document.getElementById('preview-rewards').innerText = `Thưởng: +${campData.rewardGems} Gem | +${campData.rewardExp} EXP`;

    let enemyListContainer = document.getElementById('preview-enemy-list');
    enemyListContainer.innerHTML = '';

    campData.enemies.forEach((enemy, idx) => {
        let species = POKEMON_SPECIES.find(s => s.name === enemy.speciesName);
        let rarity = RARITIES.find(r => r.name === enemy.rarityName);

        enemyListContainer.innerHTML += `
            <div class="enemy-preview-card">
                <div><b>Wave ${idx + 1}:</b> <span class="${rarity ? rarity.color : ''}">${enemy.speciesName}</span></div>
                <small>Cấp ${enemy.level} | Hệ: <span class="type-badge type-${species ? species.type : 'Fire'}">${species ? species.type : ''}</span></small>
            </div>
        `;
    });

    document.getElementById('battle-section').style.display = 'none';
}

function confirmAndStartBattle() {
    if (team.length === 0) {
        alert("Bạn chưa có Pokémon nào! Hãy sang mục Gacha để quay trước.");
        switchTab('gacha-tab');
        return;
    }

    document.getElementById('battle-section').style.display = 'block';
    document.getElementById('battle-section').scrollIntoView({ behavior: 'smooth' });

    battleRewards = { gems: 0, exp: 0 };
    startBattle();
}

function startBattle() {
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

        if (eff.type === 'burn' || eff.type === 'shock') {
            let dmg = eff.val;
            poke.hp = Math.max(0, poke.hp - dmg);
            log(`🔥 ${pokeTitle} chịu <b>${dmg}</b> sát thương từ [${eff.name}]!`);
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
            showBattleResultModal(false);
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
    let earnedExp = 30 + enemyPoke.level * 10;
    battleRewards.exp += earnedExp;

    log(`🏆 Hạ gục thành công ${enemyPoke.name}! Nhận +${earnedExp} EXP`);
    gainExp(p, earnedExp);

    currentWaveIdx++;
    if (currentWaveIdx < currentCampaignEnemies.length) {
        log(`➡️ Chuẩn bị bước vào Wave ${currentWaveIdx + 1}...`);
        setTimeout(() => loadCampaignWave(currentWaveIdx), 1200);
    } else {
        let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
        gems += campData.rewardGems;
        battleRewards.gems = campData.rewardGems;
        battleRewards.exp += campData.rewardExp;

        document.getElementById('gem-count').innerText = gems;
        gainExp(p, campData.rewardExp);

        showBattleResultModal(true);
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
            dmgSkills.sort((a, b) => (b.power || 0) - (a.power || 0));
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
            showBattleResultModal(false);
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
        let rawDmg = Math.round((caster.atk + (skill.power || 0)) * mult * critMult * (0.9 + Math.random() * 0.2));

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

        if (skill.effect) applyStatusEffect(target, skill.effect);

        let thornEff = target.effects.find(e => e.type === 'thorn');
        if (thornEff && rawDmg > 0) {
            let reflectDmg = Math.round(rawDmg * (thornEff.val / 100));
            caster.hp = Math.max(0, caster.hp - reflectDmg);
            log(`🌵 <b>[Giáp Gai]</b> của ${target.name} phản lại <b>${reflectDmg}</b> sát thương lên ${caster.name}!`);
        }
    } else if (skill.category === 'shield') {
        caster.shield += (skill.shield || 0);
        log(`🛡️ ${prefix} dùng [${skill.name}] nhận <b>+${skill.shield || 0} Khiên</b>!`);
        if (skill.effect) applyStatusEffect(caster, skill.effect);
    } else if (skill.category === 'heal') {
        let healAmount = skill.heal || 0;
        caster.hp = Math.min(caster.maxHp, caster.hp + healAmount);
        log(`💚 ${prefix} dùng [${skill.name}] hồi <b>+${healAmount} HP</b>!`);
    } else if (skill.category === "true_damage") {

        // Không tính hệ
        let isCrit = Math.random() < 0.15;
        let critMult = isCrit ? 1.5 : 1.0;

        rawDmg = Math.round(
            (caster.atk + (skill.power || 0))
            * critMult
            * (0.9 + Math.random() * 0.2)
        );

        // Bỏ qua khiên
        target.hp = Math.max(0, target.hp - rawDmg);

        log(`${prefix} dùng [${skill.name}] gây ${rawDmg} SÁT THƯƠNG CHUẨN!`);
    }
}

function showBattleResultModal(isWin) {
    let titleEl = document.getElementById('result-title');
    let bodyEl = document.getElementById('result-body');
    let p = team[activePokeIdx];
    let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);

    if (isWin) {
        titleEl.innerText = "🏆 CHIẾN THẮNG!";
        titleEl.className = "result-victory";
        bodyEl.innerHTML = `
            <p style="text-align:center;">Chúc mừng! Bạn đã chinh phục thành công <b>${campData.name}</b>!</p>
            <div class="reward-item">💎 <b>Gem Thưởng:</b> <span style="color:#f5c518;">+${battleRewards.gems} Gem</span></div>
            <div class="reward-item">⭐ <b>Kinh Nghiệm:</b> <span style="color:#4caf50;">+${battleRewards.exp} EXP</span></div>
            <div class="reward-item">🐉 <b>Trạng Thái:</b> ${p.name} (Lv.${p.level})</div>
        `;
    } else {
        titleEl.innerText = "💀 THẤT BẠI!";
        titleEl.className = "result-defeat";
        bodyEl.innerHTML = `
            <p style="text-align:center;"><b>${p.name}</b> đã gục ngã tại Wave ${currentWaveIdx + 1}/${currentCampaignEnemies.length}!</p>
            <div class="reward-item">💡 <b>Gợi ý nâng cấp:</b>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Vào mục <b>Gacha</b> quay thêm Pokémon mạnh hơn.</li>
                    <li>Vào mục <b>Hợp Nhất (Merge)</b> để nâng cấp <b>V-Level</b>.</li>
                </ul>
            </div>
        `;
    }

    document.getElementById('result-modal').style.display = 'flex';
}

function closeResultModal() {
    document.getElementById('result-modal').style.display = 'none';
    document.getElementById('battle-section').style.display = 'none';
}

// --- EXP & LEVEL UP ---
// Khởi tạo hàng đợi kỹ năng
window.skillQueue = [];

function gainExp(p, amount) {
    p.exp += amount;
    log(`✨ ${p.name} nhận +${amount} EXP!`);

    while (p.exp >= p.maxExp) {
        p.level++;
        p.exp -= p.maxExp;
        p.maxExp = Math.round(p.maxExp * 1.5);

        recalculatePokemonStats(p);
        p.skills.forEach(s => recalculateSkillValues(s, p.level));

        log(`🎉 <b>${p.name} LÊN CẤP ${p.level}!</b> (Chỉ số đã được gia tăng!)`);

        // Đẩy việc chọn kỹ năng vào hàng đợi thay vì mở UI ngay lập tức
        if (p.level % 5 === 0) {
            let targetGroup = p.level >= 10 ? 'Ultimate' : 'Skill2';
            window.skillQueue.push({
                poke: p,
                group: targetGroup,
                title: `🔥 THĂNG CẤP LEVEL ${p.level}: CHỌN HỌC KỸ NĂNG MỚI`
            });
        }
    }

    renderRoster();
    updateUI();

    // Bắt đầu xử lý hàng đợi kỹ năng nếu có
    processSkillQueue();
}
function processSkillQueue() {
    // Nếu không có kỹ năng nào đang đợi, bỏ qua
    if (!window.skillQueue || window.skillQueue.length === 0) return;
    
    // Lấy thông tin thăng cấp đầu tiên trong danh sách đợi
    let nextEvent = window.skillQueue[0]; 
    triggerSkillSelect(nextEvent.poke, nextEvent.group, nextEvent.title);
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
        let rarityClass = `rarity-${sk.rarity}`;

        choicesHtml += `
            <button class="choice-btn" onclick="learnSkillDirectly(${idx})">
                <b class="${rarityClass}">[${sk.rarity}] ${sk.name}</b> (${group} - Hệ ${p.type})<br>
                <small style="color: #f5c518;">${valText}</small>${effText} | <small>MP: ${sk.cost} | CD: ${sk.cd}t</small>
            </button>
        `;
    });

    window.pendingChoices = choices;
    document.getElementById('skill-choices').innerHTML = choicesHtml;
    document.getElementById('skill-modal').style.display = 'flex';
}

function learnSkillDirectly(choiceIdx) {
    let currentEvent = window.skillQueue[0];
    let p = currentEvent.poke;
    let sk = window.pendingChoices[choiceIdx];

    // Nếu chưa đủ 4 kỹ năng (Level dưới 20/dưới 4 skill): Thêm thẳng vào slot trống
    if (p.skills.length < 4) {
        window.skillQueue.shift(); // Xóa khỏi hàng đợi
        p.skills.push(sk);
        log(`🔥 ${p.name} đã học kỹ năng mới thành công: <b>${sk.name}</b>!`);
        document.getElementById('skill-modal').style.display = 'none';
        updateUI();

        // Xử lý kỹ năng tiếp theo trong hàng đợi nếu có
        if (window.skillQueue.length > 0) {
            setTimeout(() => processSkillQueue(), 500);
        }
    } else {
        // Đã đủ 4 kỹ năng (Level 20+): Lưu skill mới chọn và mở UI chọn skill cũ để thay thế
        window.pendingNewSkill = sk;
        showReplaceSkillUI(p, sk);
    }
}
function showReplaceSkillUI(p, newSkill) {
    document.getElementById('modal-title').innerText = `🔄 THAY THẾ KỸ NĂNG BẰNG [${newSkill.name}]`;

    let choicesContainer = document.getElementById('skill-choices');
    choicesContainer.innerHTML = `<p style="text-align:center; color:#a6adc8; margin-bottom:10px; width:100%;">Pokémon đã có đủ 4 kỹ năng. Chọn 1 kỹ năng cũ để quên đi:</p>`;

    p.skills.forEach((oldSk, idx) => {
        let valText = oldSk.power ? `Sát thương: ${oldSk.power}` : oldSk.shield ? `Khiên: +${oldSk.shield}` : `Hồi: +${oldSk.heal}`;
        let rarityClass = `rarity-${oldSk.rarity || 'Common'}`;

        choicesContainer.innerHTML += `
            <button class="choice-btn" style="border: 1px solid #ff4757;" onclick="confirmReplaceSkill(${idx})">
                <b style="color:#ff4757;">❌ Ô ${idx + 1}:</b> <span class="${rarityClass}">[${oldSk.rarity || 'Common'}] ${oldSk.name}</span><br>
                <small style="color: #f5c518;">${valText}</small> | <small>MP: ${oldSk.cost} | CD: ${oldSk.cd}t</small>
            </button>
        `;
    });
}
function confirmReplaceSkill(replaceIdx) {
    let currentEvent = window.skillQueue.shift(); // Xóa sự kiện khỏi hàng đợi
    let p = currentEvent.poke;
    let newSk = window.pendingNewSkill;
    let oldSkName = p.skills[replaceIdx].name;

    // Thay thế kỹ năng cũ bằng kỹ năng mới tại vị trí người chơi chọn
    p.skills[replaceIdx] = newSk;

    log(`🔄 <b>${p.name}</b> đã quên <b>[${oldSkName}]</b> và học kỹ năng mới: <b>[${newSk.name}]</b>!`);
    document.getElementById('skill-modal').style.display = 'none';
    updateUI();

    // Mở bảng chọn tiếp theo nếu còn trong hàng đợi
    if (window.skillQueue.length > 0) {
        setTimeout(() => {
            processSkillQueue();
        }, 500);
    }
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

    let container = document.getElementById('skills-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 4; i++) {
        if (i < p.skills.length) {
            let sk = p.skills[i];
            let isDisabled = currentTurnOwner !== 'player' || isProcessingTurn || p.hp <= 0 || (enemyPoke && enemyPoke.hp <= 0) || p.mp < sk.cost || sk.currentCd > 0;
            let cdTag = sk.currentCd > 0 ? `<span class="cd-tag">CD: ${sk.currentCd}</span>` : '';
            let estimatedDmg = p.atk + (sk.power || 0);

            let valText = sk.power ? `Dame: ${estimatedDmg}` : sk.shield ? `Khiên: +${sk.shield}` : `Hồi: +${sk.heal}`;
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
                    🔒 Ô Kỹ Năng ${i + 1}<br><small>${i === 2 ? 'Lvl 5' : 'Lvl 10'}</small>
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
let mergeSearchQuery = '';

function onMergeSearchChange(val) {
    mergeSearchQuery = val.trim().toLowerCase();
    openMergeSelectModal(currentSelectingSlot); // Render lại danh sách khi gõ
}

function openMergeSelectModal(slotType) {
    currentSelectingSlot = slotType;
    let modalList = document.getElementById('merge-modal-list');
    if (!modalList) return;

    modalList.innerHTML = '';

    if (team.length === 0) {
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Chưa có Pokémon nào trong kho!</div>';
        document.getElementById('merge-modal').style.display = 'flex';
        return;
    }

    // 1. Lọc ra danh sách phôi hợp lệ & áp dụng TÌM KIẾM THEO TÊN
    let eligibleList = team.map((p, originalIndex) => ({ pokemon: p, originalIndex }))
        .filter(item => {
            // Loại bỏ Pokémon đã được chọn ở slot còn lại
            if (slotType === 'main' && item.originalIndex === mergeSlotSub) return false;
            if (slotType === 'sub' && item.originalIndex === mergeSlotMain) return false;

            // Lọc theo từ khóa tìm kiếm (không phân biệt hoa/thường)
            if (mergeSearchQuery && !item.pokemon.name.toLowerCase().includes(mergeSearchQuery)) {
                return false;
            }

            return true;
        });

    // 2. AUTO SẮP XẾP TỰ ĐỘNG THEO BẢNG CHỮ CÁI A - Z
    eligibleList.sort((a, b) => {
        let pA = a.pokemon;
        let pB = b.pokemon;

        let nameCompare = pA.name.localeCompare(pB.name);
        if (nameCompare === 0) {
            return (RARITY_ORDER[pB.rarity.name] || 0) - (RARITY_ORDER[pA.rarity.name] || 0);
        }
        return nameCompare;
    });

    // 3. Render danh sách ra Modal
    if (eligibleList.length === 0) {
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Không tìm thấy Pokémon phù hợp!</div>';
    } else {
        eligibleList.forEach(item => {
            let p = item.pokemon;
            let idx = item.originalIndex;
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

// Reset thanh tìm kiếm khi đóng Modal
function closeMergeModal() {
    mergeSearchQuery = '';
    let searchInput = document.getElementById('merge-search-input');
    if (searchInput) searchInput.value = '';
    document.getElementById('merge-modal').style.display = 'none';
}
