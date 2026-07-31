// --- GYM SYSTEM ---

// Biến khởi tạo an toàn
let currentGymType = 'Water';
let gymBattleTeamIndices = [null, null, null];
let currentSelectingGymSlot = 0;
let gymCurrentWaveIdx = 0;

// Thêm các biến quản lý 3 Pokémon của đối thủ
// Thêm các biến quản lý 3 Pokémon của đối thủ
let gymEnemyTeam = [];
let gymActiveEnemyIdx = 0;
let gymEnemyPoke = null; // Đã đổi lại thành gymEnemyPoke để không trùng biến global
let gymBattleRewards = { gold: 0, exp: 0 };

if (typeof gymProgress === 'undefined') {
    var gymProgress = { Water: 0, Fire: 0, Grass: 0, Electric: 0 };
}
if (typeof gymBuffs === 'undefined') {
    var gymBuffs = {};
}
if (typeof isGymBattle === 'undefined') {
    var isGymBattle = false;
}

// === DỮ LIỆU CÁC PHÒNG GYM (Đã chuyển thành 3 Pokémon mỗi ải) ===
const GYM_DATA = {
    Water: {
        name: 'Phòng Gym Nước',
        icon: '🌊',
        type: 'Water',
        waves: [
            { enemies: [ { level: 21, species: 'Squirtle', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Psyduck', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Squirtle', rarity: 'Rare', statMult: 1.5 } ] },
            { enemies: [ { level: 36, species: 'Psyduck', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Squirtle', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Psyduck', rarity: 'Epic', statMult: 1.8 } ] },
            { enemies: [ { level: 61, species: 'Squirtle', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Psyduck', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Squirtle', rarity: 'Legendary', statMult: 2.2 } ] },
            { enemies: [ { level: 76, species: 'Psyduck', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Squirtle', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Psyduck', rarity: 'Mythic', statMult: 2.8 } ] },
            { enemies: [ { level: 86, species: 'Squirtle', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Psyduck', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Squirtle', rarity: 'Mythic', statMult: 3.5 } ] }
        ]
    },
    Fire: {
        name: 'Phòng Gym Lửa',
        icon: '🔥',
        type: 'Fire',
        waves: [
            { enemies: [ { level: 21, species: 'Charmander', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Magmar', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Charmander', rarity: 'Rare', statMult: 1.5 } ] },
            { enemies: [ { level: 36, species: 'Magmar', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Charmander', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Magmar', rarity: 'Epic', statMult: 1.8 } ] },
            { enemies: [ { level: 61, species: 'Charmander', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Magmar', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Charmander', rarity: 'Legendary', statMult: 2.2 } ] },
            { enemies: [ { level: 76, species: 'Magmar', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Charmander', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Magmar', rarity: 'Mythic', statMult: 2.8 } ] },
            { enemies: [ { level: 86, species: 'Charmander', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Magmar', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Charmander', rarity: 'Mythic', statMult: 3.5 } ] }
        ]
    },
    Grass: {
        name: 'Phòng Gym Cỏ',
        icon: '🌿',
        type: 'Grass',
        waves: [
            { enemies: [ { level: 21, species: 'Bulbasaur', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Bulbasaur', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Bulbasaur', rarity: 'Rare', statMult: 1.5 } ] },
            { enemies: [ { level: 36, species: 'Bulbasaur', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Bulbasaur', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Bulbasaur', rarity: 'Epic', statMult: 1.8 } ] },
            { enemies: [ { level: 61, species: 'Bulbasaur', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Bulbasaur', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Bulbasaur', rarity: 'Legendary', statMult: 2.2 } ] },
            { enemies: [ { level: 76, species: 'Bulbasaur', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Bulbasaur', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Bulbasaur', rarity: 'Mythic', statMult: 2.8 } ] },
            { enemies: [ { level: 86, species: 'Bulbasaur', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Bulbasaur', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Bulbasaur', rarity: 'Mythic', statMult: 3.5 } ] }
        ]
    },
    Electric: {
        name: 'Phòng Gym Điện',
        icon: '⚡',
        type: 'Electric',
        waves: [
            { enemies: [ { level: 21, species: 'Pikachu', rarity: 'Common', statMult: 1.2 }, { level: 23, species: 'Pikachu', rarity: 'Rare', statMult: 1.3 }, { level: 25, species: 'Pikachu', rarity: 'Rare', statMult: 1.5 } ] },
            { enemies: [ { level: 36, species: 'Pikachu', rarity: 'Rare', statMult: 1.5 }, { level: 38, species: 'Pikachu', rarity: 'Epic', statMult: 1.6 }, { level: 40, species: 'Pikachu', rarity: 'Epic', statMult: 1.8 } ] },
            { enemies: [ { level: 61, species: 'Pikachu', rarity: 'Epic', statMult: 1.8 }, { level: 63, species: 'Pikachu', rarity: 'Epic', statMult: 2.0 }, { level: 65, species: 'Pikachu', rarity: 'Legendary', statMult: 2.2 } ] },
            { enemies: [ { level: 76, species: 'Pikachu', rarity: 'Legendary', statMult: 2.4 }, { level: 78, species: 'Pikachu', rarity: 'Legendary', statMult: 2.6 }, { level: 80, species: 'Pikachu', rarity: 'Mythic', statMult: 2.8 } ] },
            { enemies: [ { level: 86, species: 'Pikachu', rarity: 'Legendary', statMult: 3.0 }, { level: 88, species: 'Pikachu', rarity: 'Mythic', statMult: 3.2 }, { level: 90, species: 'Pikachu', rarity: 'Mythic', statMult: 3.5 } ] }
        ]
    }
};

function updateGymUI() {
    renderGymList();
}

// === RENDER DANH SÁCH GYM ===
function renderGymList() {
    let container = document.getElementById('gym-list-container');
    if (!container) return;
    container.innerHTML = '';

    let playerLevel = (gameState && gameState.player && gameState.player.level) || 1;
    let gymLocked = playerLevel < 25;

    Object.keys(GYM_DATA).forEach(gymType => {
        let gym = GYM_DATA[gymType];
        let progress = gymProgress[gymType] || 0;
        let isComplete = progress >= 5;
        let progressPercent = (progress / 5) * 100;

        let statusText = isComplete
            ? '<span class="gym-badge-complete">✅ ĐÃ HOÀN THÀNH — BUFF 10%</span>'
            : `<span style="color: #a6adc8;">Ải ${progress}/5</span>`;

        let nextLevel = !isComplete && gym.waves[progress] ? gym.waves[progress].enemies[2].level : '--';

        container.innerHTML += `
            <div class="gym-card gym-${gymType}" onclick="${isComplete || gymLocked ? '' : `selectGym('${gymType}')`}" 
                 style="${isComplete ? 'cursor: default; opacity: 0.8;' : (gymLocked ? 'cursor: not-allowed; opacity: 0.6;' : '')}">
                <div class="gym-icon">${gym.icon}</div>
                <div class="gym-name">${gym.name}</div>
                <div class="gym-status">${statusText}</div>
                ${gymLocked && !isComplete ? `<div style="color: #ff4757; font-size: 11px; font-weight: bold; margin: 4px 0;">🔒 Yêu cầu: Cấp HLV từ 25</div>` : ''}
                ${!isComplete && !gymLocked ? `<small style="color: #a6adc8;">HLV tiếp theo: Trùm Lv.${nextLevel}</small>` : ''}
                <div class="gym-progress-bar">
                    <div class="gym-progress-fill ${gymType}" style="width: ${progressPercent}%"></div>
                </div>
            </div>
        `;
    });
}

// === CHỌN GYM & CHUẨN BỊ ===
function selectGym(gymType) {
    let playerLevel = (gameState && gameState.player && gameState.player.level) || 1;
    if (playerLevel < 25) {
        alert(`🔒 Cấp HLV hiện tại của bạn là ${playerLevel}. Cần đạt cấp 25 mới mở khóa Phòng Gym!`);
        return;
    }

    currentGymType = gymType;
    let gym = GYM_DATA[gymType];
    let progress = gymProgress[gymType] || 0;

    if (progress >= 5) {
        alert(`${gym.name} đã hoàn thành! Bạn đã nhận buff 10%.`);
        return;
    }

    let waveInfo = gym.waves[progress];
    let bossPoke = waveInfo.enemies[2];
    document.getElementById('gym-prep-title').innerHTML = `${gym.icon} ${gym.name} — Ải ${progress + 1}/5`;
    document.getElementById('gym-prep-desc').innerHTML = `Đối thủ: <b>Đội hình 3 Pokémon</b> (Trùm: ${bossPoke.species} Lv.${bossPoke.level})`;
    document.getElementById('gym-type-requirement').innerHTML = `⚠️ Yêu cầu: Cấp HLV từ 25 — Toàn bộ đội hình phải là hệ <span class="type-badge type-${gymType}">${gymType}</span> và cấp Pokémon không được vượt quá cấp HLV (${playerLevel})`;

    // Reset gym battle slots
    gymBattleTeamIndices = [null, null, null];
    updateGymBattleSlotsUI();

    switchGymScene('gym-scene-prep');
}

// === KIỂM TRA ĐỘI HÌNH GYM ===
function validateGymTeam(gymType) {
    let selectedIndices = gymBattleTeamIndices.filter(idx => idx !== null && team[idx]);
    if (selectedIndices.length === 0) {
        return { valid: false, message: 'Bạn phải chọn ít nhất 1 Pokémon để xuất trận!' };
    }

    let playerLevel = (gameState && gameState.player && gameState.player.level) || 1;

    for (let idx of selectedIndices) {
        let p = team[idx];
        if (p.type !== gymType) {
            return {
                valid: false,
                message: `❌ ${p.name} là hệ ${p.type}, không phải hệ ${gymType}! Toàn bộ đội hình phải là hệ ${gymType}.`
            };
        }
        if (p.level > playerLevel) {
            return {
                valid: false,
                message: `❌ ${p.name} đang ở cấp ${p.level}, cao hơn cấp HLV (${playerLevel})! Pokémon xuất trận không được vượt quá cấp của người chơi.`
            };
        }
    }

    return { valid: true, message: '' };
}

// === BẮT ĐẦU TRẬN GYM ===
function confirmAndStartGymBattle() {
    let validation = validateGymTeam(currentGymType);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    isGymBattle = true;
    isBattling = true;
    gymCurrentWaveIdx = 0;
    gymBattleRewards = { gold: 0, exp: 0 };

    // Hồi phục toàn bộ đội hình gym
    gymBattleTeamIndices.forEach(idx => {
        if (idx !== null && team[idx]) {
            let p = team[idx];
            p.hp = p.maxHp;
            p.shield = 0;
            p.mp = p.initMp;
            p.spdGauge = p.speed;
            p.effects = [];
            if (p.skills) p.skills.forEach(s => s.currentCd = 0);
        }
    });

    if (!gymSwitchToNextAlive()) {
        alert("Không có Pokémon nào còn sống để xuất trận!");
        return;
    }

    switchGymScene('gym-scene-battle');
    loadGymWave();
}

function gymSwitchToNextAlive() {
    for (let i = 0; i < 3; i++) {
        let idx = gymBattleTeamIndices[i];
        if (idx !== null && team[idx] && team[idx].hp > 0) {
            activePokeIdx = idx;
            if (typeof log === 'function') log(`🔄 <b>${team[idx].name}</b> được tung vào sân Gym!`);
            if (typeof applyStartBattlePassive === 'function') applyStartBattlePassive(team[idx]);
            updateGymBattleUI();
            return true;
        }
    }
    return false;
}

// === LOAD WAVE GYM (3 POKÉMON) ===
function loadGymWave() {
    let gym = GYM_DATA[currentGymType];
    let progress = gymProgress[currentGymType] || 0;
    let waveConfig = gym.waves[progress];

    gymEnemyTeam = waveConfig.enemies.map(eConfig => {
        let eSpecies = POKEMON_SPECIES.find(s => s.name === eConfig.species) || POKEMON_SPECIES[0];
        let eRarity = RARITIES.find(r => r.name === eConfig.rarity) || RARITIES[0];
        let eLevel = eConfig.level;
        let sMult = eConfig.statMult;

        let eMpStep = Math.floor((eLevel - 1) / 10);
        let eMaxMp = 100 + eMpStep * 10;
        let eInitMp = Math.min(eMaxMp, Math.round((eSpecies.baseInitMp + eMpStep * 5) * eRarity.statMult));

        let hpGrowthRate = (eSpecies.type === 'Rock') ? 0.09 : 0.075;
        let hpMult = Math.pow(1 + hpGrowthRate, eLevel - 1);
        let atkMult = Math.pow(1 + 0.07, eLevel - 1);
        let defMult = Math.pow(1 + 0.06, eLevel - 1);
        let speedStep = Math.floor((eLevel - 1) / 5);

        let poke = {
            name: eSpecies.name,
            type: eSpecies.type,
            rarity: eRarity,
            vLevel: 0,
            level: eLevel,
            maxHp: Math.round(eSpecies.baseHp * hpMult * eRarity.statMult * sMult),
            hp: Math.round(eSpecies.baseHp * hpMult * eRarity.statMult * sMult),
            shield: 0,
            maxMp: eMaxMp,
            initMp: eInitMp,
            mp: eInitMp,
            atk: Math.round(eSpecies.baseAtk * atkMult * eRarity.statMult * sMult),
            def: Math.round(eSpecies.baseDef * defMult * eRarity.statMult * sMult),
            speed: Math.round(eSpecies.baseSpeed * eRarity.statMult) + speedStep,
            spdGauge: Math.round(eSpecies.baseSpeed * eRarity.statMult) + speedStep,
            effects: [],
            passive: eSpecies.passive ? JSON.parse(JSON.stringify(eSpecies.passive)) : null,
            skills: [
                generateSkillInstance(eSpecies.type, 'Basic', eRarity, eLevel),
                generateSkillInstance(eSpecies.type, 'Skill1', eRarity, eLevel)
            ]
        };

        if (eLevel >= 5) poke.skills.push(generateSkillInstance(eSpecies.type, 'Skill2', eRarity, eLevel));
        if (eLevel >= 10) poke.skills.push(generateSkillInstance(eSpecies.type, 'Ultimate', eRarity, eLevel));

        return poke;
    });

    gymActiveEnemyIdx = 0;
    enemyPoke = gymEnemyTeam[0];
    isProcessingTurn = false;

    document.getElementById('gym-battle-title').innerText = `${gym.icon} ${gym.name} — Ải ${progress + 1}/5`;
    document.getElementById('gym-wave-indicator').innerText = `HLV (3 Pokémon)`;

    if (typeof log === 'function') {
        log(`🏟️ [Gym ${currentGymType}] Ải ${progress + 1}: <b>${team[activePokeIdx].name}</b> VS Đội HLV Gym (3 Pokémon)!`);
    }
    if (typeof checkStartBattlePassives === 'function') checkStartBattlePassives();
    gymDetermineNextTurn();
}

// === TỰ ĐỘNG ĐỔI POKÉMON ĐỐI THỦ KHI BỊ HẠ GỤC ===
function gymCheckEnemyDefeatedOrSwitch() {
    if (enemyPoke.hp <= 0) {
        let nextEnemyIdx = gymEnemyTeam.findIndex((e, idx) => idx > gymActiveEnemyIdx && e.hp > 0);
        
        if (nextEnemyIdx !== -1) {
            gymActiveEnemyIdx = nextEnemyIdx;
            enemyPoke = gymEnemyTeam[gymActiveEnemyIdx];
            if (typeof log === 'function') {
                log(`🔄 HLV Gym tung <b>${enemyPoke.name}</b> (Lv.${enemyPoke.level}) ra sân [${gymActiveEnemyIdx + 1}/3]!`);
            }
            if (typeof applyStartBattlePassive === 'function') applyStartBattlePassive(enemyPoke);
            return false; // Chưa tiêu diệt hết đội hình
        } else {
            handleGymEnemyDefeated(); // Đã diệt đủ 3 pokemon
            return true;
        }
    }
    return false;
}

// === XỬ LÝ LƯỢT ĐẤU GYM ===
function gymDetermineNextTurn() {
    let p = team[activePokeIdx];
    if (!p || p.hp <= 0 || enemyPoke.hp <= 0) return;

    while (p.spdGauge < 100 && enemyPoke.spdGauge < 100) {
        p.spdGauge += getEffectiveSpeed(p) * 0.2;
        enemyPoke.spdGauge += getEffectiveSpeed(enemyPoke) * 0.2;
    }
    updateGymBattleUI();

    if (p.spdGauge >= enemyPoke.spdGauge) {
        currentTurnOwner = 'player';
        gymProcessStartOfTurnEffects(p);
        if (p.hp <= 0) return;
        if (typeof log === 'function') log(`⚡ Lượt của <b>${p.name}</b>!`);
        updateGymBattleUI();
    } else {
        currentTurnOwner = 'bot';
        gymProcessStartOfTurnEffects(enemyPoke);
        if (enemyPoke.hp <= 0) return;
        if (typeof log === 'function') log(`🤖 Lượt của <b>${enemyPoke.name} (HLV Gym)</b>!`);
        updateGymBattleUI();
        gymExecuteBotTurn();
    }
}

function gymProcessStartOfTurnEffects(poke) {
    let isPlayer = (poke === team[activePokeIdx]);
    let pokeTitle = isPlayer ? `<b>${poke.name}</b>` : `<b>${poke.name} (HLV)</b>`;

    if (typeof applyStartTurnPassive === 'function') applyStartTurnPassive(poke);

    for (let i = poke.effects.length - 1; i >= 0; i--) {
        let eff = poke.effects[i];
        if (eff.type === 'burn' || eff.type === 'shock') {
            let dmg = eff.val;
            poke.hp = Math.max(0, poke.hp - dmg);
            if (typeof log === 'function') log(`🔥 ${pokeTitle} chịu <b>${dmg}</b> sát thương từ [${eff.name}]!`);
        }
        eff.duration--;
        if (eff.duration <= 0) {
            if (typeof log === 'function') log(`✨ Hiệu ứng [${eff.name}] trên ${pokeTitle} đã hết hạn.`);
            poke.effects.splice(i, 1);
        }
    }

    if (poke.hp <= 0) {
        if (isPlayer) {
            if (typeof log === 'function') log(`💀 <b>${poke.name}</b> đã gục ngã vì mất máu đầu lượt!`);
            if (!gymSwitchToNextAlive()) {
                showGymResultModal(false);
            }
        } else {
            if (!gymCheckEnemyDefeatedOrSwitch()) {
                gymDetermineNextTurn(); 
            }
        }
        updateGymBattleUI();
    }
}

function gymExecuteBotTurn() {
    isProcessingTurn = true;
    setTimeout(() => {
        if (enemyPoke.hp <= 0) return;

        let p = team[activePokeIdx];
        let usableSkills = enemyPoke.skills.filter(s => s.currentCd === 0 && enemyPoke.mp >= s.cost);
        let chosenSkill = usableSkills.find(s => s.category === 'heal') && (enemyPoke.hp / enemyPoke.maxHp < 0.4)
            ? usableSkills.find(s => s.category === 'heal')
            : usableSkills.sort((a, b) => (b.power || 0) - (a.power || 0))[0] || enemyPoke.skills[0];

        executeSkillAction(enemyPoke, p, chosenSkill, false);

        enemyPoke.spdGauge -= 100;
        enemyPoke.skills.forEach(s => { if (s.currentCd > 0) s.currentCd--; });

        if (p.hp <= 0) {
            if (typeof log === 'function') log(`💀 <b>${p.name}</b> đã gục ngã!`);
            if (!gymSwitchToNextAlive()) {
                if (typeof log === 'function') log(`💀 Toàn bộ đội hình đã gục ngã! Gym thất bại.`);
                isProcessingTurn = false;
                updateGymBattleUI();
                showGymResultModal(false);
                return;
            }
        }

        isProcessingTurn = false;
        gymDetermineNextTurn();
    }, 800);
}

function useGymSkill(skillIdx) {
    if (currentTurnOwner !== 'player' || isProcessingTurn) return;

    let p = team[activePokeIdx];
    let skill = p.skills[skillIdx];

    if (p.mp < skill.cost) { if (typeof log === 'function') log(`❌ Không đủ MP để dùng ${skill.name}!`); return; }
    if (skill.currentCd > 0) { if (typeof log === 'function') log(`⏳ ${skill.name} đang hồi chiêu (${skill.currentCd} lượt)!`); return; }

    isProcessingTurn = true;
    executeSkillAction(p, enemyPoke, skill, true);

    p.spdGauge -= 100;
    p.skills.forEach(s => { if (s.currentCd > 0) s.currentCd--; });

    if (enemyPoke.hp <= 0) {
        let allDefeated = gymCheckEnemyDefeatedOrSwitch();
        isProcessingTurn = false;
        updateGymBattleUI();
        if (!allDefeated) {
            gymDetermineNextTurn();
        }
        return;
    }

    isProcessingTurn = false;
    gymDetermineNextTurn();
}

// === XỬ LÝ THẮNG GYM ===
function handleGymEnemyDefeated() {
    let p = team[activePokeIdx];
    let totalLevel = gymEnemyTeam.reduce((acc, e) => acc + e.level, 0); // Cộng tổng level của cả 3 pokemon đối thủ
    let earnedExp = 50 + totalLevel * 15;
    let earnedGold = Math.floor(Math.random() * (totalLevel * 10)) + totalLevel * 5;

    gymBattleRewards.exp += earnedExp;
    gymBattleRewards.gold += earnedGold;
    gold += earnedGold;

    if (typeof log === 'function') log(`🏆 Hạ gục HLV Gym thành công! Nhận +${earnedExp} EXP, +${earnedGold} 🪙`);
    if (typeof gainExp === 'function') gainExp(p, earnedExp);

    gymProgress[currentGymType] = (gymProgress[currentGymType] || 0) + 1;

    // Kiểm tra hoàn thành Gym (ải 5)
    if (gymProgress[currentGymType] >= 5) {
        gymBuffs[currentGymType] = 0.1;
        if (typeof log === 'function') {
            log(`🏅 <b>HOÀN THÀNH ${GYM_DATA[currentGymType].name}!</b> Tất cả Pokémon hệ ${currentGymType} được BUFF 10% chỉ số!`);
        }

        // Tái tính toán lại chỉ số cho tất cả Pokémon hệ tương ứng
        team.forEach(poke => {
            if (poke.type === currentGymType && typeof recalculatePokemonStats === 'function') {
                recalculatePokemonStats(poke);
            }
        });
    }

    showGymResultModal(true);
    if (typeof updateResourceUI === 'function') updateResourceUI();
}

// === MODAL KẾT QUẢ GYM ===
function showGymResultModal(isWin) {
    let titleEl = document.getElementById('gym-result-title');
    let bodyEl = document.getElementById('gym-result-body');
    let gym = GYM_DATA[currentGymType];
    let progress = gymProgress[currentGymType] || 0;

    if (isWin) {
        titleEl.innerText = '🏆 THẮNG GYM!';
        titleEl.style.color = '#2ed573';

        let buffMsg = progress >= 5
            ? `<div class="reward-item" style="margin-top:10px;">🏅 <b>BUFF GYM:</b> <span style="color:#2ed573;">Tất cả Pokémon hệ ${currentGymType} +10% chỉ số!</span></div>`
            : `<div class="reward-item" style="margin-top:10px;">📊 <b>Tiến độ:</b> <span style="color:#f5c518;">Ải ${progress}/5</span></div>`;

        bodyEl.innerHTML = `
            <p style="text-align:center;">Chinh phục thành công ải Gym <b>${gym.name}</b>!</p>
            <div class="reward-item">🪙 <b>Vàng:</b> <span style="color:#ffd700;">+${gymBattleRewards.gold}</span></div>
            <div class="reward-item">⭐ <b>Kinh Nghiệm:</b> <span style="color:#4caf50;">+${gymBattleRewards.exp} EXP</span></div>
            ${buffMsg}
        `;
    } else {
        titleEl.innerText = '💀 THẤT BẠI!';
        titleEl.style.color = '#ff4757';
        bodyEl.innerHTML = `
            <p style="text-align:center;">Đội hình đã gục ngã tại ải ${progress + 1}/5 của ${gym.name}!</p>
            <div class="reward-item">💡 <b>Gợi ý:</b>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Nâng cấp Pokémon hệ <b>${currentGymType}</b> lên level cao hơn.</li>
                    <li>Dùng <b>Kẹo Kinh Nghiệm</b> để tăng cấp nhanh.</li>
                    <li>Hợp nhất (Merge) để tăng V-Level.</li>
                </ul>
            </div>
        `;
    }

    document.getElementById('gym-result-modal').style.display = 'flex';
    if (typeof saveGameState === 'function') saveGameState();
}

function closeGymResultModal() {
    isGymBattle = false;
    isBattling = false;
    document.getElementById('gym-result-modal').style.display = 'none';
    switchGymScene('gym-scene-list');
    renderGymList();
}

// === SCENE SWITCHING ===
function switchGymScene(sceneId) {
    document.querySelectorAll('#gym-tab .gym-scene').forEach(scene => {
        scene.classList.remove('active');
    });
    let el = document.getElementById(sceneId);
    if (el) el.classList.add('active');
}

// === CỬA SỔ CHỌN ĐỘI HÌNH GYM ===
function openGymBattleSelectModal(slotIdx) {
    currentSelectingGymSlot = slotIdx;
    let modalList = document.getElementById('gym-battle-modal-list');
    if (!modalList) return;
    modalList.innerHTML = '';

    if (team.length === 0) {
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Chưa có Pokémon nào!</div>';
        document.getElementById('gym-battle-select-modal').style.display = 'flex';
        return;
    }

    let playerLevel = (gameState && gameState.player && gameState.player.level) || 1;

    let list = team.map((p, originalIndex) => ({ pokemon: p, originalIndex }))
        .filter(item => {
            if (item.pokemon.type !== currentGymType) return false;
            if (item.pokemon.level > playerLevel) return false;
            let isAlreadyInTeam = gymBattleTeamIndices.includes(item.originalIndex) && gymBattleTeamIndices[currentSelectingGymSlot] !== item.originalIndex;
            return !isAlreadyInTeam;
        })
        .sort((a, b) => b.pokemon.level - a.pokemon.level);

    if (list.length === 0) {
        modalList.innerHTML = `<div style="text-align:center; padding: 20px; color: #ff4757;">Không có Pokémon hệ ${currentGymType} khả dụng! (Cấp Pokémon không được vượt quá cấp HLV ${playerLevel})</div>`;
    } else {
        list.forEach(item => {
            let p = item.pokemon;
            let idx = item.originalIndex;
            let vBadge = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
            modalList.innerHTML += `
                <div class="roster-item" onclick="selectPokemonForGymBattle(${idx})" style="cursor:pointer; background:#181825; padding:8px; margin-bottom:6px; border-radius:6px;">
                    <div>
                        <span class="${p.rarity.color}"><b>${p.name}</b></span> ${vBadge} (Lv.${p.level})
                        <span class="type-badge type-${p.type}">${p.type}</span>
                    </div>
                    <small style="color:#aaa;">HP:${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
                </div>
            `;
        });
    }

    document.getElementById('gym-battle-select-modal').style.display = 'flex';
}

function closeGymBattleSelectModal() {
    document.getElementById('gym-battle-select-modal').style.display = 'none';
}

function selectPokemonForGymBattle(teamIdx) {
    gymBattleTeamIndices[currentSelectingGymSlot] = teamIdx;
    updateGymBattleSlotsUI();
    closeGymBattleSelectModal();
}

function clearGymBattleSlot() {
    gymBattleTeamIndices[currentSelectingGymSlot] = null;
    updateGymBattleSlotsUI();
    closeGymBattleSelectModal();
}

function updateGymBattleSlotsUI() {
    for (let i = 0; i < 3; i++) {
        let slotEl = document.getElementById(`gym-battle-slot-${i}`);
        if (!slotEl) continue;
        let pIdx = gymBattleTeamIndices[i];

        if (pIdx !== null && team[pIdx]) {
            let p = team[pIdx];
            slotEl.className = 'merge-slot filled';
            slotEl.innerHTML = `<div style="font-size: 12px;"><b class="${p.rarity.color}">${p.name}</b><br>Lv.${p.level}</div>`;
        } else {
            slotEl.className = 'merge-slot';
            slotEl.innerHTML = `<div class="slot-placeholder">Slot ${i + 1}</div>`;
        }
    }
}

// === ĐỔI POKÉMON TRONG TRẬN GYM ===
function openGymInBattleSwitchModal() {
    let p = team[activePokeIdx];
    if (isProcessingTurn || p.spdGauge < 100) {
        alert('Chưa đến lượt của bạn!');
        return;
    }

    let modalList = document.getElementById('gym-in-battle-switch-list');
    modalList.innerHTML = '';
    let hasOtherAlive = false;

    for (let i = 0; i < 3; i++) {
        let idx = gymBattleTeamIndices[i];
        if (idx !== null && team[idx] && idx !== activePokeIdx) {
            let poke = team[idx];
            if (poke.hp > 0) {
                hasOtherAlive = true;
                let hpPercent = (poke.hp / poke.maxHp * 100).toFixed(1);
                modalList.innerHTML += `
                    <div class="roster-item" onclick="performGymInBattleSwitch(${idx})" style="border: 1px solid #00b4d8; cursor: pointer; padding:8px; margin-bottom:6px; background:#181825; border-radius:6px;">
                        <div><b class="${poke.rarity.color}">${poke.name}</b> (Lv.${poke.level})</div>
                        <div style="margin-top: 5px; background: #1a1a2e; border-radius: 4px; overflow: hidden; height: 8px;">
                            <div style="width: ${hpPercent}%; background: #4caf50; height: 100%;"></div>
                        </div>
                        <small style="color: #aaa;">HP: ${Math.floor(poke.hp)}/${poke.maxHp}</small>
                    </div>
                `;
            }
        }
    }

    if (!hasOtherAlive) {
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #ff4757;">Không còn Pokémon nào khác còn sống!</div>';
    }
    document.getElementById('gym-in-battle-switch-modal').style.display = 'flex';
}

function closeGymInBattleSwitchModal() {
    document.getElementById('gym-in-battle-switch-modal').style.display = 'none';
}

function performGymInBattleSwitch(targetIdx) {
    closeGymInBattleSwitchModal();
    let oldPoke = team[activePokeIdx];
    activePokeIdx = targetIdx;
    let newPoke = team[activePokeIdx];

    if (typeof log === 'function') log(`🔄 Thu hồi <b>${oldPoke.name}</b>, tung <b>${newPoke.name}</b> vào sân Gym!`);
    oldPoke.spdGauge -= 100;

    if (typeof applyStartBattlePassive === 'function') applyStartBattlePassive(newPoke);
    updateGymBattleUI();
    gymDetermineNextTurn();
}

// === CẬP NHẬT GIAO DIỆN SÀN ĐẤU GYM ===
function updateGymBattleUI() {
    let p = team[activePokeIdx];
    if (!p) return;

    let vText = p.vLevel > 0 ? ` <span class="v-badge">V${p.vLevel}</span>` : '';

    document.getElementById('gym-player-name').innerHTML = `${p.name}${vText} (Lv.${p.level})`;
    document.getElementById('gym-player-stats').innerText = `HP:${Math.max(0, p.hp)}/${p.maxHp} | MP:${p.mp}/100\nSPD:${typeof getEffectiveSpeed === 'function' ? getEffectiveSpeed(p) : p.speed} (${p.speed}) | Gauge:${Math.round(p.spdGauge)}`;
    document.getElementById('gym-player-hp').style.width = `${(Math.max(0, p.hp) / p.maxHp) * 100}%`;
    document.getElementById('gym-player-shield').style.width = `${Math.min(100, (p.shield / p.maxHp) * 100)}%`;
    document.getElementById('gym-player-mp').style.width = `${p.mp}%`;
    document.getElementById('gym-player-spd').style.width = `${Math.min(100, (p.spdGauge / 100) * 100)}%`;

    let pBadge = document.getElementById('gym-player-type-badge');
    pBadge.innerText = p.type;
    pBadge.className = `type-badge type-${p.type}`;
    if (typeof renderEffectsUI === 'function') renderEffectsUI('gym-player-effects', p);

    if (enemyPoke) {
        // Cập nhật tag [1/3] để biết đang đánh con thứ mấy của đối thủ
        document.getElementById('gym-enemy-name').innerText = `${enemyPoke.name} (Lv.${enemyPoke.level}) [${gymActiveEnemyIdx + 1}/3]`;
        document.getElementById('gym-enemy-stats').innerText = `HP:${Math.max(0, enemyPoke.hp)}/${enemyPoke.maxHp} | MP:${enemyPoke.mp}/100\nSPD:${typeof getEffectiveSpeed === 'function' ? getEffectiveSpeed(enemyPoke) : enemyPoke.speed} (${enemyPoke.speed}) | Gauge:${Math.round(enemyPoke.spdGauge)}`;
        document.getElementById('gym-enemy-hp').style.width = `${(Math.max(0, enemyPoke.hp) / enemyPoke.maxHp) * 100}%`;
        document.getElementById('gym-enemy-shield').style.width = `${Math.min(100, (enemyPoke.shield / enemyPoke.maxHp) * 100)}%`;
        document.getElementById('gym-enemy-mp').style.width = `${enemyPoke.mp}%`;
        document.getElementById('gym-enemy-spd').style.width = `${Math.min(100, (enemyPoke.spdGauge / 100) * 100)}%`;

        let eBadge = document.getElementById('gym-enemy-type-badge');
        eBadge.innerText = enemyPoke.type;
        eBadge.className = `type-badge type-${enemyPoke.type}`;
        if (typeof renderEffectsUI === 'function') renderEffectsUI('gym-enemy-effects', enemyPoke);
    }

    let turnText = currentTurnOwner === 'player' ? '⚡ Lượt: BẠN' : '🤖 Lượt: HLV GYM';
    document.getElementById('gym-turn-indicator').innerText = turnText;

    let container = document.getElementById('gym-skills-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 4; i++) {
        if (p.skills && i < p.skills.length) {
            let sk = p.skills[i];
            let isDisabled = currentTurnOwner !== 'player' || isProcessingTurn || p.hp <= 0 || (enemyPoke && enemyPoke.hp <= 0) || p.mp < sk.cost || sk.currentCd > 0;
            let cdTag = sk.currentCd > 0 ? `<span class="cd-tag">CD: ${sk.currentCd}</span>` : '';
            let estimatedDmg = p.atk + (sk.power || 0);
            let valText = sk.power ? `Dame: ${estimatedDmg}` : sk.shield ? `Khiên: +${sk.shield}` : sk.heal ? `Hồi: +${sk.heal}` : `Buff`;
            let effBadge = sk.effect ? `<small style="color: #64ffda;"> [${sk.effect.name}]</small>` : '';

            container.innerHTML += `
                <button class="skill-btn" onclick="useGymSkill(${i})" ${isDisabled ? 'disabled' : ''}>
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