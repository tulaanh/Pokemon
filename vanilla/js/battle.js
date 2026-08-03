// --- BATTLE SYSTEM ---
function startBattle() {
    isBattling = true; // Khóa đội hình
    let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
    if (!campData) return;

    currentWaveIdx = 0;
    currentCampaignEnemies = campData.enemies;

    // Hồi phục toàn bộ đội hình 3 Pokemon
    battleTeamIndices.forEach(idx => {
        if (idx !== null && team[idx]) {
            let p = team[idx];
            p.hp = p.maxHp;
            p.shield = 0;
            p.mp = p.initMp;
            p.spdGauge = p.speed;
            p.effects = [];
            p.skills.forEach(s => s.currentCd = 0);
        }
    });

    // Gọi Pokemon đầu tiên ra sân
    switchToNextAlivePokemon();
    loadCampaignWave(currentWaveIdx);
}

function switchToNextAlivePokemon() {
    for (let i = 0; i < 3; i++) {
        let idx = battleTeamIndices[i];
        if (idx !== null && team[idx] && team[idx].hp > 0) {
            activePokeIdx = idx;
            log(`🔄 <b>${team[idx].name}</b> được tung vào sân!`);
            applyStartBattlePassive(team[idx]);
            updateUI();
            return true;
        }
    }
    return false; // Toàn bộ đội hình đã bay màu
}

function loadCampaignWave(waveIdx) {
    let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
    let enemyConfig = currentCampaignEnemies[waveIdx];

    let eSpecies = POKEMON_SPECIES.find(s => s.name === enemyConfig.species) || POKEMON_SPECIES[0];
    let eRarity = RARITIES.find(r => r.name === enemyConfig.rarity) || RARITIES[0];
    let eLevel = enemyConfig.level;
    let sMult = enemyConfig.statMult;

    let eMpStep = Math.floor((eLevel - 1) / 10);
    let eMaxMp = 100 + eMpStep * 10;
    let eInitMp = Math.min(eMaxMp, Math.round((eSpecies.baseInitMp + eMpStep * 5) * eRarity.statMult));

    enemyPoke = {
        name: eSpecies.name,
        type: eSpecies.type,
        rarity: eRarity,
        vLevel: 0,
        level: eLevel,
        maxHp: Math.round((eSpecies.baseHp + eLevel * 25) * eRarity.statMult * sMult),
        hp: Math.round((eSpecies.baseHp + eLevel * 25) * eRarity.statMult * sMult),
        shield: 0,
        maxMp: eMaxMp,
        initMp: eInitMp,
        mp: eInitMp,
        atk: Math.round((eSpecies.baseAtk + eLevel * 5) * eRarity.statMult * sMult),
        def: Math.round((eSpecies.baseDef + eLevel * 3) * eRarity.statMult * sMult),
        speed: Math.round((eSpecies.baseSpeed + eLevel * 2) * eRarity.statMult),
        spdGauge: Math.round((eSpecies.baseSpeed + eLevel * 2) * eRarity.statMult),
        effects: [],
        passive: eSpecies.passive ? JSON.parse(JSON.stringify(eSpecies.passive)) : null,
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

    log(`⚔️ [Wave ${waveIdx + 1}] Bắt đầu! <b>${team[activePokeIdx].name}</b> VS <b>${enemyPoke.name}</b>`);
    checkStartBattlePassives();
    determineNextTurn();
}

function getEffectiveAtk(poke) {
    let mult = 1.0;
    if (poke.effects) {
        poke.effects.forEach(e => {
            if (e.type === 'debuff_atk') mult -= (e.val / 100);
            if (e.type === 'buff_atk') mult += (e.val / 100);
        });
    }
    return Math.max(1, Math.round(poke.atk * Math.max(0.1, mult)));
}

function getEffectiveDef(poke) {
    let mult = 1.0;
    if (poke.effects) {
        poke.effects.forEach(e => {
            if (e.type === 'debuff_def') mult -= (e.val / 100);
            if (e.type === 'buff_def') mult += (e.val / 100);
        });
    }
    return Math.max(0, Math.round(poke.def * Math.max(0.1, mult)));
}

function applyStartBattlePassive(poke) {
    let allSkills = (typeof getAllPassiveSkills === 'function') ? getAllPassiveSkills(poke) : (poke.passive ? [poke.passive] : []);
    allSkills.forEach(skill => {
        if (skill && skill.trigger === 'start_battle') {
            if (skill.type === 'mp_buff') {
                poke.mp = Math.min(poke.maxMp || 100, poke.mp + skill.value);
                log(`⭐ <b>[${skill.name}]</b> của ${poke.name} kích hoạt! Nhận thêm +${skill.value} MP ban đầu.`);
            } else if (skill.type === 'speed_buff') {
                let valPct = Math.round(skill.value * 100);
                if (!poke.effects) poke.effects = [];
                poke.effects.push({
                    type: 'buff_speed',
                    duration: 5,
                    val: valPct,
                    name: `${skill.name}: +${valPct}% Tốc`
                });
                log(`⭐ <b>[${skill.name}]</b> của ${poke.name} kích hoạt! Tăng +${valPct}% Tốc Độ trong 5 lượt.`);
            }
        }
    });
}

function checkStartBattlePassives() {
    let playerPoke = team[activePokeIdx];
    if (playerPoke) {
        applyStartBattlePassive(playerPoke);
    }
    if (enemyPoke) {
        applyStartBattlePassive(enemyPoke);
    }
}

function applyStartTurnPassive(poke) {
    if (poke.hp <= 0) return;
    let allSkills = (typeof getAllPassiveSkills === 'function') ? getAllPassiveSkills(poke) : (poke.passive ? [poke.passive] : []);
    allSkills.forEach(skill => {
        if (skill && skill.trigger === 'start_turn') {
            if (skill.type === 'heal_self') {
                let healAmt = Math.round(poke.maxHp * skill.value);
                poke.hp = Math.min(poke.maxHp, poke.hp + healAmt);
                log(`⭐ <b>[${skill.name}]</b> của ${poke.name} kích hoạt! Tự hồi phục <b>+${healAmt}</b> HP.`);
            } else if (skill.type === 'cleanse_cc') {
                let cleaned = false;
                if (poke.effects) {
                    for (let i = poke.effects.length - 1; i >= 0; i--) {
                        if (poke.effects[i].type === 'stun') {
                            poke.effects.splice(i, 1);
                            cleaned = true;
                        }
                    }
                }
                if (cleaned) {
                    log(`⭐ <b>[${skill.name}]</b> của ${poke.name} kích hoạt! Hóa giải hiệu ứng khống chế (choáng).`);
                }
            }
        }
    });
}

function checkTakeDamagePassives(target, dmg, attacker) {
    if (!target || target.hp <= 0) return;
    let allSkills = (typeof getAllPassiveSkills === 'function') ? getAllPassiveSkills(target) : (target.passive ? [target.passive] : []);
    
    allSkills.forEach(skill => {
        if (!skill) return;

        // 1. Phản sát thương
        if (skill.trigger === 'take_damage' && skill.type === 'reflect_damage' && dmg > 0) {
            let reflectDmg = Math.round(dmg * skill.value);
            attacker.hp = Math.max(0, attacker.hp - reflectDmg);
            log(`⭐ <b>[${skill.name}]</b> của ${target.name} phản lại <b>${reflectDmg}</b> sát thương lên ${attacker.name}!`);
        }

        // 2. Buff công khi HP dưới 50%
        if (skill.trigger === 'hp_below_50' && target.hp < target.maxHp * 0.5) {
            if (skill.type === 'atk_buff') {
                if (!target.effects) target.effects = [];
                let buffName = `${skill.name}: +${Math.round(skill.value * 100)}% ATK`;
                let alreadyHas = target.effects.some(e => e.name === buffName);
                if (!alreadyHas) {
                    target.effects.push({
                        type: 'buff_atk',
                        duration: 3,
                        val: Math.round(skill.value * 100),
                        name: buffName
                    });
                    log(`⭐ <b>[${skill.name}]</b> của ${target.name} kích hoạt! Tăng ${Math.round(skill.value * 100)}% ATK khi dưới 50% HP (3 lượt).`);
                }
            }
        }
    });
}

function getEffectiveSpeed(poke) {
    let speedMult = 1.0;
    if (poke.effects) {
        poke.effects.forEach(e => {
            if (e.type === 'slow') speedMult -= (e.val / 100);
            if (e.type === 'buff_speed') speedMult += (e.val / 100);
        });
    }
    return Math.max(10, Math.round(poke.speed * Math.max(0.2, speedMult)));
}

function determineNextTurn() {
    let p = team[activePokeIdx];
    if (p.hp <= 0 || enemyPoke.hp <= 0) return;

    while (p.spdGauge < 100 && enemyPoke.spdGauge < 100) {
        p.spdGauge += getEffectiveSpeed(p) * 0.05;
        enemyPoke.spdGauge += getEffectiveSpeed(enemyPoke) * 0.05;
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

    // Áp dụng nội tại đầu lượt
    applyStartTurnPassive(poke);

    // Danh sách các loại hiệu ứng DoT (Sát thương theo thời gian)
    const dotEffectTypes = ['burn', 'shock', 'poison', 'bleed'];

    for (let i = poke.effects.length - 1; i >= 0; i--) {
        let eff = poke.effects[i];

        // --- XỬ LÝ TẤT CẢ CÁC HIỆU ỨNG DOT THEO % MÁU HIỆN TẠI ---
        if (dotEffectTypes.includes(eff.type)) {
            // eff.val đóng vai trò là phần trăm (Ví dụ: eff.val = 5 tương ứng 5% máu hiện tại)
            let percent = eff.val / 100;
            
            // Tính sát thương dựa trên MÁU HIỆN TẠI của Pokémon
            let dmg = Math.round(poke.hp * percent);
            
            // Đảm bảo nếu Pokémon còn sống thì đòn DoT tối thiểu vẫn rút 1 HP
            if (poke.hp > 0) dmg = Math.max(1, dmg);

            poke.hp = Math.max(0, poke.hp - dmg);
            log(`🔥 ${pokeTitle} chịu <b>${dmg}</b> sát thương từ [${eff.name}] (${eff.val}% máu hiện tại)!`);
        }

        // Trừ số lượt tồn tại của hiệu ứng
        eff.duration--;
        if (eff.duration <= 0) {
            log(`✨ Hiệu ứng [${eff.name}] trên ${pokeTitle} đã hết hạn.`);
            poke.effects.splice(i, 1);
        }
    }

    // Kiểm tra xem Pokémon có gục ngã do sát thương DoT đầu lượt không
    if (poke.hp <= 0) {
        if (isPlayer) {
            log(`💀 <b>${poke.name}</b> đã gục ngã vì mất máu đầu lượt!`);
            if (!switchToNextAlivePokemon()) {
                showBattleResultModal(false);
            }
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

    // === DROP VÀNG ===
    let goldDrop = Math.floor(Math.random() * (enemyPoke.level * 5 + 10)) + (10 + enemyPoke.level * 5);
    gold += goldDrop;
    battleRewards.gold = (battleRewards.gold || 0) + goldDrop;

    log(`🏆 Hạ gục thành công ${enemyPoke.name}! Nhận +${earnedExp} EXP, +${goldDrop} 🪙`);

    // === DROP KẸO (10-15% tỷ lệ) ===
    let candyChance = 0.10 + Math.random() * 0.05; // 10% - 15%
    if (Math.random() < candyChance) {
        inventory.candy++;
        battleRewards.candy = (battleRewards.candy || 0) + 1;
        log(`🍬 <b>RớT ĐỒ!</b> Bạn nhặt được 1 Kẹo Kinh Nghiệm!`);
    }

    gainExp(p, earnedExp);
    if (typeof updateResourceUI === 'function') updateResourceUI();

    currentWaveIdx++;
    if (currentWaveIdx < currentCampaignEnemies.length) {
        log(`➡️ Chuẩn bị bước vào Wave ${currentWaveIdx + 1}...`);
        setTimeout(() => loadCampaignWave(currentWaveIdx), 1200);
    } else {
        let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
        gems += campData.rewardGems;
        battleRewards.gems = campData.rewardGems;
        battleRewards.exp += campData.rewardExp;

        document.getElementById('gem-count').innerText = gems.toLocaleString();
        gainExp(p, campData.rewardExp);
        if (typeof addPlayerExp === 'function') addPlayerExp(campData.rewardExp);
        if (typeof updateResourceUI === 'function') updateResourceUI();
        showBattleResultModal(true);
    }
}

function executeBotTurn() {
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
            log(`💀 <b>${p.name}</b> đã gục ngã!`);
            if (!switchToNextAlivePokemon()) {
                log(`💀 Toàn bộ đội hình đã gục ngã! Chiến dịch thất bại.`);
                isProcessingTurn = false;
                updateUI();
                showBattleResultModal(false);
                return;
            }
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
        
        // --- TÍNH SÁT THƯƠNG CÓ TÍNH ĐẾN CHI SỐ DEF ---
        let baseDmg = getEffectiveAtk(caster) + (skill.power || 0);
        let targetDef = getEffectiveDef(target); 
        
        // Hệ số giảm sát thương theo DEF (Ví dụ: DEF = 100 -> giảm 50% sát thương)
        let defReduction = 100 / (100 + targetDef); 
        
        let rawDmg = Math.round(baseDmg * defReduction * mult * critMult * (0.9 + Math.random() * 0.2));
        // Đảm bảo kỹ năng đánh ra tối thiểu gây 1 sát thương
        rawDmg = Math.max(1, rawDmg);

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

        // Kích hoạt nội tại khi nhận sát thương
        checkTakeDamagePassives(target, actualDmgToTarget, caster);

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
        let isCrit = Math.random() < 0.15;
        let critMult = isCrit ? 1.5 : 1.0;
        
        // Sát thương chuẩn BỎ QUA DEF của mục tiêu
        let rawDmg = Math.round((getEffectiveAtk(caster) + (skill.power || 0)) * critMult * (0.9 + Math.random() * 0.2));
        rawDmg = Math.max(1, rawDmg);
        
        target.hp = Math.max(0, target.hp - rawDmg);
        log(`${prefix} dùng [${skill.name}] gây ${rawDmg} SÁT THƯƠNG CHUẨN (Bỏ qua DEF)!`);

        // Kích hoạt nội tại khi nhận sát thương
        checkTakeDamagePassives(target, rawDmg, caster);
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

function openInBattleSwitchModal() {
    let p = team[activePokeIdx];
    if (isProcessingTurn || p.spdGauge < 100) {
        alert("Chưa đến lượt của bạn, không thể đổi Pokémon!");
        return;
    }

    let modalList = document.getElementById('in-battle-switch-list');
    modalList.innerHTML = '';
    let hasOtherAlive = false;

    for (let i = 0; i < 3; i++) {
        let idx = battleTeamIndices[i];
        if (idx !== null && team[idx] && idx !== activePokeIdx) {
            let poke = team[idx];
            if (poke.hp > 0) {
                hasOtherAlive = true;
                let hpPercent = (poke.hp / poke.maxHp * 100).toFixed(1);

                modalList.innerHTML += `
                    <div class="roster-item" onclick="performInBattleSwitch(${idx})" style="border: 1px solid #00b4d8; cursor: pointer;">
                        <div>
                            <b class="${poke.rarity.color}">${poke.name}</b> (Lv.${poke.level})
                        </div>
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
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #ff4757;">Không còn Pokémon nào khác còn sống để thay thế!</div>';
    }
    document.getElementById('in-battle-switch-modal').style.display = 'flex';
}

function closeInBattleSwitchModal() {
    document.getElementById('in-battle-switch-modal').style.display = 'none';
}

function performInBattleSwitch(targetIdx) {
    closeInBattleSwitchModal();
    let oldPoke = team[activePokeIdx];
    activePokeIdx = targetIdx;
    let newPoke = team[activePokeIdx];

    log(`🔄 Bạn đã thu hồi <b>${oldPoke.name}</b> và tung <b>${newPoke.name}</b> ra sân!`);
    oldPoke.spdGauge -= 100;

    applyStartBattlePassive(newPoke);
    updateUI();
    determineNextTurn();
}

function showBattleResultModal(isWin) {
    let titleEl = document.getElementById('result-title');
    let bodyEl = document.getElementById('result-body');
    let p = team[activePokeIdx];
    let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);

    if (isWin) {
        titleEl.innerText = "🏆 CHIẾN THẮNG!";
        titleEl.className = "result-victory";

        let candyText = battleRewards.candy ? `<div class="reward-item">🍬 <b>Kẹo Kinh Nghiệm:</b> <span style="color:#e056fd;">+${battleRewards.candy} viên</span></div>` : '';

        bodyEl.innerHTML = `
            <p style="text-align:center;">Chúc mừng! Bạn đã chinh phục thành công <b>${campData.name}</b>!</p>
            <div class="reward-item">💎 <b>Gem Thưởng:</b> <span style="color:#f5c518;">+${battleRewards.gems} Gem</span></div>
            <div class="reward-item">⭐ <b>Kinh Nghiệm:</b> <span style="color:#4caf50;">+${battleRewards.exp} EXP</span></div>
            <div class="reward-item">🪙 <b>Vàng:</b> <span style="color:#ffd700;">+${battleRewards.gold || 0} Vàng</span></div>
            ${candyText}
            <div class="reward-item">🐉 <b>Trạng Thái:</b> ${p.name} (Lv.${p.level})</div>
        `;
    } else {
        titleEl.innerText = "💀 THẤT BẠI!";
        titleEl.className = "result-defeat";
        bodyEl.innerHTML = `
            <p style="text-align:center;">Toàn bộ đội hình đã gục ngã tại Wave ${currentWaveIdx + 1}/${currentCampaignEnemies.length}!</p>
            <div class="reward-item">💡 <b>Gợi ý nâng cấp:</b>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Vào mục <b>Gacha</b> quay thêm Pokémon mạnh hơn.</li>
                    <li>Vào mục <b>Hợp Nhất (Merge)</b> để nâng cấp <b>V-Level</b>.</li>
                </ul>
            </div>
        `;
    }
    document.getElementById('result-modal').style.display = 'flex';
    if (typeof saveGameState === 'function') saveGameState();
}

function closeResultModal() {
    isBattling = false; // Mở khóa cho phép đổi lại đội hình
    document.getElementById('result-modal').style.display = 'none';
    
    // Đưa người chơi quay về màn hình chọn map
    switchCampaignScene('scene-campaign-list');
}

// --- EXP & LEVEL UP ---
window.skillQueue = [];

function gainExp(p, amount) {
    p.exp += amount;

    // Cấp Pokémon không bao giờ được vượt quá cấp Huấn luyện viên (HLV)
    let trainerLevel = (gameState && gameState.player && gameState.player.level) || 1;

    // Nếu đã đạt/đang vượt cấp trần: giữ nguyên thanh EXP đầy để không bị mất kinh nghiệm
    if (p.level >= trainerLevel) {
        p.exp = Math.min(p.exp, p.maxExp);
        log(`✨ ${p.name} nhận +${amount} EXP!`);
        log(`🔒 ${p.name} đã đạt cấp trần Lv.${p.level} (bằng cấp Huấn luyện viên) - không thể lên cấp thêm.`);
        renderRoster();
        updateUI();
        return;
    }

    log(`✨ ${p.name} nhận +${amount} EXP!`);

    while (p.exp >= p.maxExp && p.level < trainerLevel) {
        p.level++;
        p.exp -= p.maxExp;
        p.maxExp = Math.round((p.level * 50) + Math.pow(p.level, 1.5) * 10);
        recalculatePokemonStats(p);
        p.skills.forEach(s => recalculateSkillValues(s, p.level));

        log(`🎉 <b>${p.name} LÊN CẤP ${p.level}!</b> (Chỉ số đã được gia tăng!)`);

        if (p.level % 5 === 0) {
            let targetGroup = p.level >= 10 ? 'Ultimate' : 'Skill2';
            window.skillQueue.push({
                poke: p,
                group: targetGroup,
                title: `🔥 THĂNG CẤP LEVEL ${p.level}: CHỌN HỌC KỸ NĂNG MỚI`
            });
        }
    }

    // Vừa chạm cấp trần trong lần lên cấp này: giữ EXP thừa thành thanh đầy
    if (p.level >= trainerLevel && p.exp > p.maxExp) {
        p.exp = p.maxExp;
    }

    renderRoster();
    updateUI();
    processSkillQueue();
}

function processSkillQueue() {
    if (!window.skillQueue || window.skillQueue.length === 0) return;
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
        let valText = sk.power ? `Sát thương: ${sk.power}` : sk.shield ? `Khiên: +${sk.shield}` : sk.heal ? `Hồi máu: +${sk.heal}` : `Kỹ năng Buff`;
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

    if (p.skills.length < 4) {
        window.skillQueue.shift();
        p.skills.push(sk);
        log(`🔥 ${p.name} đã học kỹ năng mới thành công: <b>${sk.name}</b>!`);
        document.getElementById('skill-modal').style.display = 'none';
        updateUI();

        if (window.skillQueue.length > 0) {
            setTimeout(() => processSkillQueue(), 500);
        }
    } else {
        window.pendingNewSkill = sk;
        showReplaceSkillUI(p, sk);
    }
}

function showReplaceSkillUI(p, newSkill) {
    document.getElementById('modal-title').innerText = `🔄 THAY THẾ KỸ NĂNG BẰNG [${newSkill.name}]`;
    let choicesContainer = document.getElementById('skill-choices');
    choicesContainer.innerHTML = `<p style="text-align:center; color:#a6adc8; margin-bottom:10px; width:100%;">Pokémon đã có đủ 4 kỹ năng. Chọn 1 kỹ năng cũ để quên đi:</p>`;

    p.skills.forEach((oldSk, idx) => {
        let valText = oldSk.power ? `Sát thương: ${oldSk.power}` : oldSk.shield ? `Khiên: +${oldSk.shield}` : oldSk.heal ? `Hồi: +${oldSk.heal}` : `Kỹ năng Buff`;
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
    let currentEvent = window.skillQueue.shift();
    let p = currentEvent.poke;
    let newSk = window.pendingNewSkill;
    let oldSkName = p.skills[replaceIdx].name;

    p.skills[replaceIdx] = newSk;
    log(`🔄 <b>${p.name}</b> đã quên <b>[${oldSkName}]</b> và học kỹ năng mới: <b>[${newSk.name}]</b>!`);
    document.getElementById('skill-modal').style.display = 'none';
    updateUI();

    if (window.skillQueue.length > 0) {
        setTimeout(() => { processSkillQueue(); }, 500);
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

    let vText = p.vLevel > 0 ? ` <span class="v-badge">V${p.vLevel}</span>` : '';
    
    document.getElementById('player-name').innerHTML = `${p.name}${vText} (Lv.${p.level})`;
    document.getElementById('player-stats').innerText = `HP:${Math.max(0, p.hp)}/${p.maxHp} | MP:${p.mp}/100\nSPD:${getEffectiveSpeed(p)} (${p.speed}) | Gauge:${Math.round(p.spdGauge)}`;
    document.getElementById('player-hp').style.width = `${(Math.max(0, p.hp) / p.maxHp) * 100}%`;
    document.getElementById('player-shield').style.width = `${Math.min(100, (p.shield / p.maxHp) * 100)}%`;
    document.getElementById('player-mp').style.width = `${p.mp}%`;
    document.getElementById('player-spd').style.width = `${Math.min(100, (p.spdGauge / 100) * 100)}%`;

    let pBadge = document.getElementById('player-type-badge');
    pBadge.innerText = p.type;
    pBadge.className = `type-badge type-${p.type}`;
    renderEffectsUI('player-effects', p);

    if (enemyPoke) {
        document.getElementById('enemy-name').innerText = `${enemyPoke.name} (Lv.${enemyPoke.level})`;
        document.getElementById('enemy-stats').innerText = `HP:${Math.max(0, enemyPoke.hp)}/${enemyPoke.maxHp} | MP:${enemyPoke.mp}/100\nSPD:${getEffectiveSpeed(enemyPoke)} (${enemyPoke.speed}) | Gauge:${Math.round(enemyPoke.spdGauge)}`;
        document.getElementById('enemy-hp').style.width = `${(Math.max(0, enemyPoke.hp) / enemyPoke.maxHp) * 100}%`;
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

            let valText = sk.power ? `Dame: ${estimatedDmg}` : sk.shield ? `Khiên: +${sk.shield}` : sk.heal ? `Hồi: +${sk.heal}` : `Buff`;
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
