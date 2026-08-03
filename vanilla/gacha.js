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
        passive: null,
        passives: [rollPassive(species.type)],
        talents: [],
        skills: [
            generateSkillInstance(species.type, 'Basic', selectedRarity, 1),
            generateSkillInstance(species.type, 'Skill1', selectedRarity, 1)
        ]
    };
    newPoke.passive = newPoke.passives[0];

    recalculatePokemonStats(newPoke);
    newPoke.hp = newPoke.maxHp;

    // Thêm vào Kho (kiểm tra giới hạn tối đa 150)
    if (typeof addPokemonToInventory === 'function') {
        addPokemonToInventory(newPoke);
    } else {
        team.push(newPoke);
    }

    return newPoke;
}

// =========================================================================
// HỆ THỐNG BANNER GACHA & MILEAGE SHOP
// =========================================================================

// Định nghĩa danh sách các Banner Gacha
const GACHA_BANNERS = [
    {
        id: 'standard',
        name: 'Banner Thường',
        cost: 100, // Giá 1 lượt roll bằng Gem
        currency: 'gems',
        featuredPokemons: ['Charizard', 'Blastoise', 'Sceptile'],
        ribbon: 'Cơ bản',
        rarityChances: {
            'Common': 58.0,
            'Rare': 30.0,
            'Epic': 10.0,
            'Legendary': 1.8,    // Giảm từ 4.0% -> 1.8%
            'Mythic': 0.199,     // Giảm từ 0.9% -> 0.199%
            'Secret': 0.001      // Giảm sâu từ 0.1% -> 0.001% (1/100,000)
        }
    },
    {
        id: 'dragon_limited',
        name: 'Banner Giới Hạn: Rồng Huyền Thoại',
        cost: 150, // Giá 1 lượt roll bằng PokePoint
        currency: 'pokePoint',
        featuredPokemons: ['Rayquaza', 'Garchomp'],
        ribbon: 'Hot!',
        rarityChances: {
            'Common': 58.0,
            'Rare': 30.0,
            'Epic': 10.0,
            'Legendary': 1.8,    // Giảm từ 4.0% -> 1.8%
            'Mythic': 0.199,     // Giảm từ 0.9% -> 0.199%
            'Secret': 0.001      // Giảm sâu từ 0.1% -> 0.001% (1/100,000)
        }
    }
];

let selectedBannerId = 'standard';

// Hàm bổ trợ thực hiện 1 lượt quay cho Banner cụ thể
function executeBannerRoll(bannerId) {
    const banner = GACHA_BANNERS.find(b => b.id === bannerId) || GACHA_BANNERS[0];

    // 1. Quay Độ hiếm dựa trên tỷ lệ của banner
    let rand = Math.random() * 100;
    let cum = 0;
    let selectedRarity = RARITIES[0];

    for (let r of RARITIES) {
        let chance = banner.rarityChances[r.name] !== undefined ? banner.rarityChances[r.name] : r.chance;
        cum += chance;
        if (rand <= cum) {
            selectedRarity = r;
            break;
        }
    }

    // 2. Chọn Pokémon cụ thể
    let species = null;
    let featuredList = banner.featuredPokemons || [];

    // Nếu banner có Pokemon tăng tỉ lệ, có tỉ lệ cao (60% cho độ hiếm Epic+ hoặc 20% thường) để trúng Featured
    let isHighRarity = ['Epic', 'Legendary', 'Mythic', 'Secret'].includes(selectedRarity.name);
    let rateUpChance = isHighRarity ? 0.6 : 0.2;

    if (featuredList.length > 0 && Math.random() < rateUpChance) {
        let featuredSpecies = POKEMON_SPECIES.filter(s => featuredList.includes(s.name));
        if (featuredSpecies.length > 0) {
            species = featuredSpecies[Math.floor(Math.random() * featuredSpecies.length)];
        }
    }

    if (!species) {
        // Quay ngẫu nhiên trong danh sách Pokemon eligible
        let eligibleSpecies = POKEMON_SPECIES;
        // Nếu là Banner Thường, loại trừ các Pokémon Giới Hạn hiếm (như Rayquaza & Garchomp)
        if (banner.id === 'standard') {
            eligibleSpecies = POKEMON_SPECIES.filter(s => s.name !== 'Rayquaza' && s.name !== 'Garchomp');
        }
        if (eligibleSpecies.length === 0) eligibleSpecies = POKEMON_SPECIES;
        species = eligibleSpecies[Math.floor(Math.random() * eligibleSpecies.length)];
    }

    // 3. Tính toán Cấp độ (Level) Pokémon dựa trên Cấp độ Người chơi
    let playerLevel = (gameState.player && gameState.player.level) || 1;
    let minLvl = Math.floor(playerLevel / 2);
    if (minLvl < 1) minLvl = 1;
    let maxLvl = playerLevel;
    if (maxLvl < minLvl) maxLvl = minLvl;
    let pokeLevel = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;

    // 4. Tạo instance Pokémon mới
    let newPoke = {
        id: Date.now() + Math.random(),
        name: species.name,
        type: species.type,
        rarity: selectedRarity,
        vLevel: 0,
        level: pokeLevel,
        exp: 0,
        maxExp: Math.round((pokeLevel * 50) + Math.pow(pokeLevel, 1.5) * 10),
        maxHp: 0,
        hp: 0,
        shield: 0,
        mp: 0,
        initMp: Math.round(species.baseInitMp * selectedRarity.statMult),
        atk: 0,
        speed: 0,
        def: 0,
        iv: {
            hp: 0.9 + Math.random() * 0.2,
            atk: 0.9 + Math.random() * 0.2,
            def: 0.9 + Math.random() * 0.2,
            speed: 0.9 + Math.random() * 0.2
        },
        spdGauge: 0,
        effects: [],
        passive: null,
        passives: [rollPassive(species.type)],
        talents: [],
        skills: [
            generateSkillInstance(species.type, 'Basic', selectedRarity, pokeLevel),
            generateSkillInstance(species.type, 'Skill1', selectedRarity, pokeLevel)
        ]
    };
    newPoke.passive = newPoke.passives[0];

    recalculatePokemonStats(newPoke);
    newPoke.hp = newPoke.maxHp;

    // Thêm vào kho của Player (kiểm tra giới hạn tối đa 150)
    if (typeof addPokemonToInventory === 'function') {
        addPokemonToInventory(newPoke);
    } else {
        gameState.myPokemons.push(newPoke);
    }

    return newPoke;
}

/**
 * Hàm roll Gacha theo Banner và số lần roll
 * @param {string} bannerId 
 * @param {number} times 
 */
function rollGacha(bannerId, times) {
    const banner = GACHA_BANNERS.find(b => b.id === bannerId);
    if (!banner) {
        alert('❌ Không tìm thấy Banner này!');
        return;
    }

    let totalCost = banner.cost * times;

    // Kiểm tra dung lượng Kho trước khi trừ tiền: mỗi lượt quay nhận 1 Pokémon
    if (team.length + times > INVENTORY_LIMIT) {
        alert(`Kho đã đầy! (${team.length}/${INVENTORY_LIMIT}) Không thể quay thêm. Hãy hợp nhất hoặc giải phóng chỗ trống.`);
        return;
    }

    if (banner.currency === 'gems') {
        if (gems < totalCost) {
            alert(`❌ Không đủ Gem! Bạn cần ${totalCost} Gem để quay x${times}. Hiện tại bạn có: ${gems}`);
            return;
        }
        // Trừ Gem và Cộng điểm tích lũy Mileage
        gems -= totalCost;
        gameState.player.pokeGacha += times;
    } else {
        if (gameState.player.pokePoint < totalCost) {
            alert(`❌ Không đủ PokePoint! Bạn cần ${totalCost} PokePoint để quay x${times}. Hiện tại bạn có: ${gameState.player.pokePoint}`);
            return;
        }
        // Trừ PokePoint và Cộng điểm tích lũy Mileage
        gameState.player.pokePoint -= totalCost;
        gameState.player.pokeGacha += times;
    }

    // Thực hiện quay
    let results = [];
    for (let i = 0; i < times; i++) {
        let poke = executeBannerRoll(bannerId);
        results.push(poke);
    }

    // Hiển thị kết quả quay Gacha
    let resultEl = document.getElementById('gacha-result');
    if (resultEl) {
        if (times > 1) {
            let summaryText = `<div style="margin-bottom: 8px;">🎉 <b>Kết quả quay ${times} lần:</b></div>`;
            summaryText += `<div style="display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; text-align: left; padding: 10px; background: rgba(0,0,0,0.4); border-radius: 8px; border: 1px solid #3f3f5a;">`;
            results.forEach(p => {
                summaryText += `<div>• <span class="${p.rarity.color}"><b>[${p.rarity.name}] ${p.name}</b></span> (Lv.${p.level}) - Hệ ${p.type}</div>`;
            });
            summaryText += `</div>`;
            resultEl.innerHTML = summaryText;
        } else {
            let p = results[0];
            resultEl.innerHTML = `
                <div style="padding: 10px; background: rgba(0,0,0,0.4); border-radius: 8px; border: 1px solid #3f3f5a;">
                    🎉 Bạn nhận được: <span class="${p.rarity.color}"><b>[${p.rarity.name}] ${p.name}</b></span> (Lv.${p.level}) - Hệ ${p.type}!
                </div>
            `;
        }
    }

    // Cập nhật lại UI và tiến trình
    updateResourceUI();
    if (typeof renderRoster === 'function') renderRoster();
    renderGachaTab();

    if (typeof saveGameState === 'function') saveGameState();
}

/**
 * Hàm đổi Pokémon trong shop PokeGacha
 * @param {string} pokemonName 
 * @param {number} cost 
 */
function redeemPokemon(pokemonName, cost) {
    if (gameState.player.pokeGacha < cost) {
        alert(`❌ Không đủ điểm PokeGacha! Bạn cần ${cost} điểm để đổi ${pokemonName}. Hiện có: ${gameState.player.pokeGacha}`);
        return;
    }

    // Kiểm tra dung lượng Kho trước khi trừ điểm
    if (team.length >= INVENTORY_LIMIT) {
        alert(`Kho đã đầy! (${team.length}/${INVENTORY_LIMIT}) Hãy giải phóng chỗ trống trước khi đổi Pokémon.`);
        return;
    }

    let species = POKEMON_SPECIES.find(s => s.name === pokemonName);
    if (!species) {
        alert(`❌ Không tìm thấy Pokémon có tên ${pokemonName} trong dữ liệu!`);
        return;
    }

    // Trừ điểm Gacha
    gameState.player.pokeGacha -= cost;

    // Tính level theo Cấp độ người chơi
    let playerLevel = gameState.player.level || 1;
    let minLvl = Math.floor(playerLevel / 2);
    if (minLvl < 1) minLvl = 1;
    let maxLvl = playerLevel;
    if (maxLvl < minLvl) maxLvl = minLvl;
    let pokeLevel = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;

    // Xác định Rarity cho Pokemon đổi (Legendary cho Rayquaza & Garchomp, Epic cho starter)
    let rarityName = 'Epic';
    if (pokemonName === 'Rayquaza' || pokemonName === 'Garchomp') {
        rarityName = 'Legendary';
    }
    let selectedRarity = RARITIES.find(r => r.name === rarityName) || RARITIES[2];

    // Tạo Pokemon mới
    let newPoke = {
        id: Date.now() + Math.random(),
        name: species.name,
        type: species.type,
        rarity: selectedRarity,
        vLevel: 0,
        level: pokeLevel,
        exp: 0,
        maxExp: Math.round((pokeLevel * 50) + Math.pow(pokeLevel, 1.5) * 10),
        maxHp: 0,
        hp: 0,
        shield: 0,
        mp: 0,
        initMp: Math.round(species.baseInitMp * selectedRarity.statMult),
        atk: 0,
        speed: 0,
        def: 0,
        iv: {
            hp: 0.9 + Math.random() * 0.2,
            atk: 0.9 + Math.random() * 0.2,
            def: 0.9 + Math.random() * 0.2,
            speed: 0.9 + Math.random() * 0.2
        },
        spdGauge: 0,
        effects: [],
        passive: null,
        passives: [rollPassive(species.type)],
        talents: [],
        skills: [
            generateSkillInstance(species.type, 'Basic', selectedRarity, pokeLevel),
            generateSkillInstance(species.type, 'Skill1', selectedRarity, pokeLevel)
        ]
    };
    newPoke.passive = newPoke.passives[0];

    recalculatePokemonStats(newPoke);
    newPoke.hp = newPoke.maxHp;

    // Thêm vào kho (kiểm tra giới hạn tối đa 150)
    if (typeof addPokemonToInventory === 'function') {
        addPokemonToInventory(newPoke);
    } else {
        gameState.myPokemons.push(newPoke);
    }

    alert(`🎉 Đổi thành công! Nhận được: [${selectedRarity.name}] ${newPoke.name} (Lv.${newPoke.level})!`);

    updateResourceUI();
    if (typeof renderRoster === 'function') renderRoster();
    renderGachaTab();

    if (typeof saveGameState === 'function') saveGameState();
}

// Thay đổi banner đang chọn
function selectGachaBanner(bannerId) {
    selectedBannerId = bannerId;
    renderGachaTab();
}

// Hành động khi nhấn nút Roll trên UI
function triggerRoll(times) {
    rollGacha(selectedBannerId, times);
}

// Render tab Gacha và Cửa hàng đổi điểm
function renderGachaTab() {
    // 1. Render Banners
    let bannersContainer = document.getElementById('gacha-banners-list');
    if (bannersContainer) {
        bannersContainer.innerHTML = '';
        GACHA_BANNERS.forEach(banner => {
            let isActive = (banner.id === selectedBannerId);
            let ribbonHTML = banner.ribbon ? `<div class="banner-ribbon">${banner.ribbon}</div>` : '';
            let featuredNames = banner.featuredPokemons.join(', ');
            let currencyIcon = banner.currency === 'gems' ? '💎' : '🎟️';
            let currencyName = banner.currency === 'gems' ? 'Gem' : 'PokePoint';

            bannersContainer.innerHTML += `
                <div class="gacha-banner-card ${isActive ? 'active' : ''}" onclick="selectGachaBanner('${banner.id}')">
                    ${ribbonHTML}
                    <div class="banner-title">${banner.name}</div>
                    <div class="banner-featured">🔥 Đặc trưng: <b style="color: #f9e2af;">${featuredNames}</b></div>
                    <div class="banner-cost">Giá: ${currencyIcon} ${banner.cost} ${currencyName} / Lượt</div>
                </div>
            `;
        });
    }

    // 2. Cập nhật Banner hành động hiện tại
    const activeBanner = GACHA_BANNERS.find(b => b.id === selectedBannerId) || GACHA_BANNERS[0];

    let activeTitleEl = document.getElementById('active-banner-title');
    let activeDetailsEl = document.getElementById('active-banner-details');
    let btnRollX1 = document.getElementById('btn-roll-x1');
    let btnRollX10 = document.getElementById('btn-roll-x10');

    if (activeTitleEl) {
        activeTitleEl.innerHTML = `🔮 Đang Triệu Hoán: <span style="color:#f5c518; font-weight:bold;">${activeBanner.name}</span>`;
    }

        if (activeDetailsEl) {
            let details = 'Tỷ lệ roll: ';
            // Combine Legendary, Mythic, and Secret into a single Legendary value
            let combinedLegendary = (activeBanner.rarityChances['Legendary'] || 0) +
                                 (activeBanner.rarityChances['Mythic'] || 0) +
                                 (activeBanner.rarityChances['Secret'] || 0);
            for (let rName in activeBanner.rarityChances) {
                if (rName === 'Legendary' || rName === 'Mythic' || rName === 'Secret') continue;
                let chance = activeBanner.rarityChances[rName];
                let rObj = RARITIES.find(r => r.name === rName) || { color: '' };
                details += `<span class="${rObj.color}"><b>${rName} (${chance}%)</b></span> | `;
            }
            if (combinedLegendary > 0) {
                let legendaryColor = (RARITIES.find(r => r.name === 'Legendary') || { color: '' }).color;
                details += `<span class="${legendaryColor}"><b>Legendary (${combinedLegendary.toFixed(3)}%)</b></span> | `;
            }
            activeDetailsEl.innerHTML = details.substring(0, details.length - 3);
        }

    let activeCurrencyIcon = activeBanner.currency === 'gems' ? '💎' : '🎟️';
    if (btnRollX1) {
        btnRollX1.innerHTML = `Quay x1 <br><small>(${activeCurrencyIcon} ${activeBanner.cost})</small>`;
    }
    if (btnRollX10) {
        btnRollX10.innerHTML = `Quay x10 <br><small>(${activeCurrencyIcon} ${activeBanner.cost * 10})</small>`;
    }

    // 3. Render các item trong PokeGacha Shop (Chỉ hiển thị Pokemon đặc trưng của Banner được chọn)
    let shopContainer = document.getElementById('gacha-shop-items');
    if (shopContainer) {
        shopContainer.innerHTML = '';

        // Danh sách toàn bộ Pokemon đổi trực tiếp phân theo banner
        const allShopItems = [
            { name: 'Rayquaza', cost: 200, rarityName: 'Legendary', bannerId: 'dragon_limited' },
            { name: 'Garchomp', cost: 120, rarityName: 'Legendary', bannerId: 'dragon_limited' },
            { name: 'Charizard', cost: 80, rarityName: 'Epic', bannerId: 'standard' },
            { name: 'Blastoise', cost: 80, rarityName: 'Epic', bannerId: 'standard' },
            { name: 'Sceptile', cost: 80, rarityName: 'Epic', bannerId: 'standard' }
        ];

        // Lọc các item thuộc về banner đang được chọn
        const shopItems = allShopItems.filter(item => item.bannerId === selectedBannerId);
        let playerGachaPoints = (gameState && gameState.player && gameState.player.pokeGacha) || 0;

        shopItems.forEach(item => {
            let rObj = RARITIES.find(r => r.name === item.rarityName) || { color: '' };
            let canAfford = playerGachaPoints >= item.cost;

            shopContainer.innerHTML += `
                <div class="gacha-shop-card">
                    <div class="gacha-shop-name ${rObj.color}"><b>${item.name}</b></div>
                    <div style="font-size:11px; color:#a6adc8; margin-bottom: 5px;">Độ hiếm: ${item.rarityName}</div>
                    <div class="gacha-shop-cost">🎫 ${item.cost} Điểm</div>
                    <button class="gacha-shop-btn" ${canAfford ? '' : 'disabled'} onclick="redeemPokemon('${item.name}', ${item.cost})">
                        ${canAfford ? 'Đổi Pokémon' : 'Chưa đủ điểm'}
                    </button>
                </div>
            `;
        });

        if (shopItems.length === 0) {
            shopContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #a6adc8; padding: 15px;">Banner này không có Pokémon đổi thưởng!</div>`;
        }
    }

    // 4. Đồng bộ giá trị input Cấp độ trong Cheat Panel
    let cheatLevelInput = document.getElementById('input-cheat-level');
    if (cheatLevelInput && gameState && gameState.player) {
        cheatLevelInput.value = gameState.player.level;
    }

    updateResourceUI();
}

// =========================================================================
// CÁC HÀM THỬ NGHIỆM (CHEAT / TEST CONTROLS)
// =========================================================================

function cheatAddResource(resource, val) {
    if (gameState && gameState.player && gameState.player[resource] !== undefined) {
        gameState.player[resource] += val;
        updateResourceUI();
        renderGachaTab();
        if (typeof saveGameState === 'function') saveGameState();
    }
}

function cheatSetLevel() {
    let inputEl = document.getElementById('input-cheat-level');
    if (inputEl && gameState && gameState.player) {
        let val = parseInt(inputEl.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 100) val = 100;
        gameState.player.level = val;
        updateResourceUI();
        renderGachaTab();
        if (typeof saveGameState === 'function') saveGameState();
        alert(`⚡ Đã điều chỉnh Cấp người chơi thành công: Lv.${val}`);
    }
}

function cheatResetAllResources() {
    if (confirm('Xác nhận đặt lại tất cả tài nguyên Gacha về mặc định (PokePoint: 1000, PokeGacha: 0, Cấp người chơi: 1)?')) {
        if (gameState && gameState.player) {
            gameState.player.level = 1;
            gameState.player.playerExp = 0;
            gameState.player.playerExpToNext = 100;
            gameState.player.pokePoint = 1000;
            gameState.player.pokeGacha = 0;
            updateResourceUI();
            renderGachaTab();
            if (typeof saveGameState === 'function') saveGameState();
        }
    }
}

// Logic thực hiện quay Gacha bằng Gem cũ để tương thích
function drawGachaMulti(count) {
    let cost = count * 100;
    if (gems < cost) {
        alert(`Không đủ Gem! Bạn cần ${cost} Gem để quay ${count} lần.`);
        return;
    }

    // Kiểm tra dung lượng Kho trước khi trừ Gem
    if (team.length + count > INVENTORY_LIMIT) {
        alert(`Kho đã đầy! (${team.length}/${INVENTORY_LIMIT}) Không thể quay thêm. Hãy hợp nhất hoặc giải phóng chỗ trống.`);
        return;
    }

    gems -= cost;
    document.getElementById('gem-count').innerText = gems.toLocaleString();

    let results = [];
    for (let i = 0; i < count; i++) {
        let poke = executeSingleRoll();
        results.push(poke);
    }

    let resultEl = document.getElementById('gacha-result');

    if (count >= 50) {
        let highRarityPokes = results.filter(p => {
            let idx = RARITY_LEVELS.indexOf(p.rarity.name);
            return idx >= RARITY_LEVELS.indexOf('Epic');
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
    } else if (count > 1) {
        let summaryText = `<div style="margin-bottom: 8px;">🎉 <b>Kết quả quay ${count} lần:</b></div>`;
        summaryText += `<div style="display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; text-align: left; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 6px;">`;
        results.forEach(p => {
            summaryText += `<div>• <span class="${p.rarity.color}"><b>[${p.rarity.name}] ${p.name}</b></span> (Hệ ${p.type})</div>`;
        });
        summaryText += `</div>`;
        resultEl.innerHTML = summaryText;
    } else {
        let p = results[0];
        resultEl.innerHTML = `
            <span class="${p.rarity.color}">
                🎉 Bạn nhận được: <b>[${p.rarity.name}] ${p.name}</b> (Hệ ${p.type})!
            </span>
        `;
    }

    renderRoster();
    if (typeof saveGameState === 'function') saveGameState();
}

function drawGacha() {
    drawGachaMulti(1);
}