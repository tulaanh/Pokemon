// --- LOGIC GACHA & SINH CHIÊU THỨC ---

// Sinh instance kỹ năng ngẫu nhiên dựa theo hệ và độ hiếm Pokémon
function generateSkillInstance(type, skillGroup, pokeRarity, pokeLevel = 1) {
    let pool = ELEMENTAL_SKILL_TEMPLATES[type] ? ELEMENTAL_SKILL_TEMPLATES[type][skillGroup] : null;
    if (!pool || pool.length === 0) pool = ELEMENTAL_SKILL_TEMPLATES['Fire']['Basic'];

    let pokeRarityIdx = RARITY_LEVELS.indexOf(pokeRarity.name);
    if (pokeRarityIdx === -1) pokeRarityIdx = 0;

    let eligiblePool = pool.filter(template => {
        let skillRarityIdx = RARITY_LEVELS.indexOf(template.rarity || 'Common');
        return skillRarityIdx <= pokeRarityIdx;
    });

    if (eligiblePool.length === 0) eligiblePool = [pool[0]];

    // Tính Weight gacha skill với hệ số 0.65
    let weightedPool = eligiblePool.map(template => {
        let skillRarityIdx = RARITY_LEVELS.indexOf(template.rarity || 'Common');
        let diff = pokeRarityIdx - skillRarityIdx;
        let weight = Math.pow(0.55, diff) * 10;
        return { template, weight };
    });

    let totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let accumulatedWeight = 0;
    let selectedTemplate = weightedPool[0].template;

    for (let item of weightedPool) {
        accumulatedWeight += item.weight;
        if (rand <= accumulatedWeight) {
            selectedTemplate = item.template;
            break;
        }
    }

    // Skill multiplier
    let min = pokeRarity.skillMin || 1.0;
    let max = pokeRarity.skillMax || 1.0;
    let finalSkillMultiplier = min + Math.random() * (max - min);

    let skillInst = {
        name: selectedTemplate.name,
        type: skillGroup,
        rarity: selectedTemplate.rarity || 'Common',
        category: selectedTemplate.category,
        cost: selectedTemplate.cost,
        cd: selectedTemplate.cd,
        currentCd: 0,
        rollMult: finalSkillMultiplier,
        mpGain: selectedTemplate.mpGain || 0,
        effect: selectedTemplate.effect ? JSON.parse(JSON.stringify(selectedTemplate.effect)) : null,
        isTrueDmg: selectedTemplate.isTrueDmg || false,
        baseValPower: selectedTemplate.basePower || 0,
        baseValShield: selectedTemplate.baseShield || 0,
        baseValHeal: selectedTemplate.baseHeal || 0
    };

    recalculateSkillValues(skillInst, pokeLevel);
    return skillInst;
}

// Hàm bổ trợ thực hiện 1 lượt quay (Single Roll)
function executeSingleRoll() {
    let rand = Math.random() * 100;
    let cum = 0;
    let selectedRarity = RARITIES[0];
    for (let r of RARITIES) {
        cum += r.chance;
        if (rand <= cum) {
            selectedRarity = r;
            break;
        }
    }

    let species = POKEMON_SPECIES[Math.floor(Math.random() * POKEMON_SPECIES.length)];

    let newPoke = {
        id: Date.now() + Math.random(),
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
        // IV ngẫu nhiên
iv: {
    hp: 0.9 + Math.random() * 0.2,
    atk: 0.9 + Math.random() * 0.2,
    def: 0.9 + Math.random() * 0.2,
    speed: 0.9 + Math.random() * 0.2
},
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

    return newPoke;
}

// Logic thực hiện quay Multi-Gacha (1, 10, 50, 100)
function drawGachaMulti(count) {
    let cost = count * 100;
    if (gems < cost) {
        alert(`Không đủ Gem! Bạn cần ${cost} Gem để quay ${count} lần.`);
        return;
    }

    gems -= cost;
    document.getElementById('gem-count').innerText = gems;

    let results = [];
    for (let i = 0; i < count; i++) {
        let poke = executeSingleRoll();
        results.push(poke);
    }

    let resultEl = document.getElementById('gacha-result');

    // Nếu quay số lượng lớn (50, 100) -> Chỉ hiển thị từ Epic trở lên
    if (count >= 50) {
        let highRarityPokes = results.filter(p => {
            let idx = RARITY_LEVELS.indexOf(p.rarity.name);
            return idx >= RARITY_LEVELS.indexOf('Epic'); // Lọc Epic & Legendary
        });

        let summaryText = `<div style="margin-bottom: 8px;">🎉 <b>Kết quả quay ${count} lần</b> (Đã thêm vào Kho):</div>`;

        if (highRarityPokes.length === 0) {
            summaryText += `<div style="color: #a6adc8;">😔 Rất tiếc, lần này không trúng Pokémon nào từ <b>Epic</b> trở lên!</div>`;
        } else {
            summaryText += `<div style="display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; text-align: left; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 6px;">`;
            highRarityPokes.forEach(p => {
                summaryText += `<div>✨ <span class="${p.rarity.color}"><b>[${p.rarity.name}] ${p.name}</b></span> (Hệ ${p.type})</div>`;
            });
            summaryText += `</div>`;
        }

        resultEl.innerHTML = summaryText;
    } else if (count > 1) { // Quay 10 lần: Hiển thị đầy đủ
        let summaryText = `<div style="margin-bottom: 8px;">🎉 <b>Kết quả quay ${count} lần:</b></div>`;
        summaryText += `<div style="display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; text-align: left; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 6px;">`;
        results.forEach(p => {
            summaryText += `<div>• <span class="${p.rarity.color}"><b>[${p.rarity.name}] ${p.name}</b></span> (Hệ ${p.type})</div>`;
        });
        summaryText += `</div>`;
        resultEl.innerHTML = summaryText;
    } else { // Quay 1 lần
        let p = results[0];
        resultEl.innerHTML = `
            <span class="${p.rarity.color}">
                🎉 Bạn nhận được: <b>[${p.rarity.name}] ${p.name}</b> (Hệ ${p.type})!
            </span>
        `;
    }

    renderRoster();
}

// Giữ lại hàm cũ để tương thích (nếu có gọi trực tiếp)
function drawGacha() {
    drawGachaMulti(1);
}