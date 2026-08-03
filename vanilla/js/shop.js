// --- SHOP & INVENTORY SYSTEM ---
function updateResourceUI() {
    // Cập nhật tài nguyên phụ (PokeGacha hiển thị trong Gacha Shop)
    let shopPgEl = document.getElementById('shop-poke-gacha-indicator');
    if (typeof gameState !== 'undefined' && gameState.player) {
        if (shopPgEl) shopPgEl.innerText = gameState.player.pokeGacha.toLocaleString();
    }

    // Cập nhật toàn bộ Header (player info, EXP bar, tiền tệ) qua updateHeaderUI
    if (typeof updateHeaderUI === 'function') {
        let player = (typeof gameState !== 'undefined' && gameState.player) ? gameState.player : {};
        updateHeaderUI({
            name: 'Player 1',
            level: player.level || 0,
            currentExp: player.playerExp || 0,
            nextLevelExp: (typeof getPlayerNextLevelExp === 'function') ? getPlayerNextLevelExp(player.level) : 100,
            gem: gems,
            gold: gold,
            pokePoint: player.pokePoint || 0,
            pokeGacha: player.pokeGacha || 0
        });
    }
}

// === CỬA HÀNG ===
function renderShop() {
    updateResourceUI();
    let candyCountEl = document.getElementById('shop-candy-count');
    if (candyCountEl) candyCountEl.innerText = inventory.candy;
}

function buyRareCandy(amount) {
    let cost = amount * 1000;
    if (gold < cost) {
        alert(`❌ Không đủ Vàng! Bạn cần ${cost.toLocaleString()} Vàng để mua ${amount} viên kẹo.`);
        return;
    }
    gold -= cost;
    inventory.candy += amount;
    log(`🍬 Đã mua ${amount} Kẹo Kinh Nghiệm với giá ${cost.toLocaleString()} Vàng!`);
    renderShop();
    updateResourceUI();
    if (typeof saveGameState === 'function') saveGameState();
}

// === KHO ĐỒ ===
function renderItemInventory() {
    updateResourceUI();
    let candyEl = document.getElementById('inv-candy-count');
    if (candyEl) candyEl.innerText = inventory.candy;
}

function openUseCandyModal() {
    if (inventory.candy <= 0) {
        alert('❌ Bạn không có Kẹo Kinh Nghiệm nào trong kho!');
        return;
    }

    let modalList = document.getElementById('candy-use-list');
    if (!modalList) return;
    modalList.innerHTML = '';

    if (team.length === 0) {
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Chưa có Pokémon nào!</div>';
        document.getElementById('inventory-use-modal').style.display = 'flex';
        return;
    }

    // Sort by level descending
    let sorted = team.map((p, idx) => ({ pokemon: p, idx }))
        .sort((a, b) => b.pokemon.level - a.pokemon.level);

    sorted.forEach(item => {
        let p = item.pokemon;
        let idx = item.idx;
        let vBadge = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        let trainerLevel = (gameState && gameState.player && gameState.player.level) || 1;
        let isCapped = p.level >= 90 || p.level >= trainerLevel;
        let levelWarning = isCapped ? '<span style="color:#ff4757; font-size:11px;"> (TRẦN)</span>' : '';
        let isDisabled = isCapped;

        modalList.innerHTML += `
            <div class="roster-item" onclick="${isDisabled ? '' : `useCandyOnPokemon(${idx})`}" 
                 style="${isDisabled ? 'opacity: 0.5; cursor: not-allowed;' : 'cursor: pointer;'} border: 1px solid ${isDisabled ? '#ff4757' : '#4caf50'};">
                <div>
                    <span class="${p.rarity.color}"><b>${p.name}</b></span> ${vBadge} (Lv.${p.level})${levelWarning}
                    <span class="type-badge type-${p.type}">${p.type}</span>
                </div>
                <small>HP:${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
            </div>
        `;
    });

    document.getElementById('inventory-use-modal').style.display = 'flex';
}

function closeUseCandyModal() {
    document.getElementById('inventory-use-modal').style.display = 'none';
}

function useCandyOnPokemon(teamIdx) {
    let p = team[teamIdx];
    if (!p) return;

    if (inventory.candy <= 0) {
        alert('❌ Không còn Kẹo Kinh Nghiệm!');
        return;
    }

    if (p.level >= 90) {
        alert(`❌ ${p.name} đã đạt cấp ${p.level} (tối đa 90), không thể sử dụng Kẹo!`);
        return;
    }

    let trainerLevel = (gameState && gameState.player && gameState.player.level) || 1;
    if (p.level >= trainerLevel) {
        alert(`❌ ${p.name} đã đạt cấp trần Lv.${p.level} (bằng cấp Huấn luyện viên)! Hãy nâng cấp HLV trước.`);
        return;
    }

    inventory.candy--;
    p.level++;
    p.maxExp = Math.round((p.level * 50) + Math.pow(p.level, 1.5) * 10);
    recalculatePokemonStats(p);
    p.skills.forEach(s => recalculateSkillValues(s, p.level));

    log(`🍬 Đã sử dụng Kẹo Kinh Nghiệm! <b>${p.name}</b> lên cấp <b>${p.level}</b>!`);

    // Trigger skill select nếu đạt mốc level chia hết cho 5
    if (p.level % 5 === 0) {
        let targetGroup = p.level >= 10 ? 'Ultimate' : 'Skill2';
        window.skillQueue = window.skillQueue || [];
        window.skillQueue.push({
            poke: p,
            group: targetGroup,
            title: `🔥 CẤP ${p.level}: CHỌN HỌC KỸ NĂNG MỚI`
        });
        if (typeof processSkillQueue === 'function') processSkillQueue();
    }

    renderItemInventory();
    renderShop();
    if (typeof renderRoster === 'function') renderRoster();
    if (typeof updateUI === 'function') updateUI();
    updateResourceUI();
    if (typeof saveGameState === 'function') saveGameState();

    // Refresh modal list
    openUseCandyModal();
}
