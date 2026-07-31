// --- SHOP & INVENTORY SYSTEM ---
function updateResourceUI() {
    let gemEl = document.getElementById('gem-count');
    let goldEl = document.getElementById('gold-count');
    if (gemEl) gemEl.innerText = gems.toLocaleString();
    if (goldEl) goldEl.innerText = gold.toLocaleString();

    // Cập nhật các tài nguyên mới cho hệ thống Gacha
    let plLvlEl = document.getElementById('player-level');
    let ppEl = document.getElementById('poke-point-count');
    let pgEl = document.getElementById('poke-gacha-count');
    let shopPgEl = document.getElementById('shop-poke-gacha-indicator');
    
    if (typeof gameState !== 'undefined' && gameState.player) {
        if (plLvlEl) plLvlEl.innerText = gameState.player.level;
        if (ppEl) ppEl.innerText = gameState.player.pokePoint.toLocaleString();
        if (pgEl) pgEl.innerText = gameState.player.pokeGacha.toLocaleString();
        if (shopPgEl) shopPgEl.innerText = gameState.player.pokeGacha.toLocaleString();
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
function renderInventory() {
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
        let levelWarning = p.level >= 90 ? '<span style="color:#ff4757; font-size:11px;"> (MAX)</span>' : '';
        let isDisabled = p.level >= 90;

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

    renderInventory();
    renderShop();
    if (typeof renderRoster === 'function') renderRoster();
    if (typeof updateUI === 'function') updateUI();
    updateResourceUI();
    if (typeof saveGameState === 'function') saveGameState();

    // Refresh modal list
    openUseCandyModal();
}
