// --- CAMPAIGN SYSTEM & BATTLE PREP ---
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

function onBattleSortChange(val) {
    battleSortBy = val;
    renderBattleModalList();
}

function renderBattleModalList() {
    // Ủy quyền cho renderBattleSelection() (js/inventory.js):
    // Danh sách xuất trận CHỈ load từ Pokédex (tối đa 20 con yêu thích)
    if (typeof renderBattleSelection === 'function') {
        renderBattleSelection();
        return;
    }

    let modalList = document.getElementById('battle-modal-list');
    if (!modalList) return;
    modalList.innerHTML = '';

    if (team.length === 0) {
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Chưa có Pokémon nào!</div>';
        return;
    }

    let list = team.map((p, originalIndex) => ({ pokemon: p, originalIndex }))
        .filter(item => {
            let isAlreadyInTeam = battleTeamIndices.includes(item.originalIndex) && battleTeamIndices[currentSelectingBattleSlot] !== item.originalIndex;
            return !isAlreadyInTeam;
        });

    list.sort((a, b) => {
        let pA = a.pokemon;
        let pB = b.pokemon;
        if (battleSortBy === 'level-desc') return pB.level - pA.level;
        if (battleSortBy === 'level-asc') return pA.level - pB.level;
        if (battleSortBy === 'rarity-desc') return (RARITY_ORDER[pB.rarity.name] || 0) - (RARITY_ORDER[pA.rarity.name] || 0);
        if (battleSortBy === 'rarity-asc') return (RARITY_ORDER[pA.rarity.name] || 0) - (RARITY_ORDER[pB.rarity.name] || 0);
        return 0;
    });

    if (list.length === 0) {
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Không còn Pokémon nào khả dụng!</div>';
        return;
    }

    list.forEach(item => {
        let p = item.pokemon;
        let idx = item.originalIndex;
        let vBadge = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        modalList.innerHTML += `
            <div class="roster-item" onclick="selectPokemonForBattle(${idx})">
                <div>
                    <span class="${p.rarity.color}"><b>${p.name}</b></span> ${vBadge} (Lv.${p.level})
                    <span class="type-badge type-${p.type}">${p.type}</span>
                </div>
                <small>HP:${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
            </div>
        `;
    });
}

function openBattleSelectModal(slotIdx) {
    if (isBattling) {
        alert("⚔️ Đang trong trận chiến, bạn không thể đổi cấu trúc đội hình!");
        return;
    }

    currentSelectingBattleSlot = slotIdx;
    let sortSelect = document.getElementById('battle-sort');
    if (sortSelect) sortSelect.value = battleSortBy;

    renderBattleModalList();
    document.getElementById('battle-select-modal').style.display = 'flex';
}

function closeBattleSelectModal() {
    document.getElementById('battle-select-modal').style.display = 'none';
}

function selectPokemonForBattle(teamIdx) {
    battleTeamIndices[currentSelectingBattleSlot] = teamIdx;
    updateBattleSlotsUI();
    closeBattleSelectModal();
}

function clearBattleSlot() {
    battleTeamIndices[currentSelectingBattleSlot] = null;
    updateBattleSlotsUI();
    closeBattleSelectModal();
}

function updateBattleSlotsUI() {
    for (let i = 0; i < 3; i++) {
        let slotEl = document.getElementById(`battle-slot-${i}`);
        let pIdx = battleTeamIndices[i];

        if (pIdx !== null && team[pIdx]) {
            let p = team[pIdx];
            slotEl.className = "merge-slot filled";
            slotEl.innerHTML = `<div style="font-size: 12px;"><b class="${p.rarity.color}">${p.name}</b><br>Lv.${p.level}</div>`;
        } else {
            slotEl.className = "merge-slot";
            slotEl.innerHTML = `<div class="slot-placeholder">Slot ${i + 1}</div>`;
        }
    }
}

// --- QUẢN LÝ SCENE CHIẾN DỊCH ---
function switchCampaignScene(sceneId) {
    // Ẩn tất cả các scene trong campaign-tab
    document.querySelectorAll('#campaign-tab .game-scene').forEach(scene => {
        scene.classList.remove('active');
    });
    // Hiển thị scene được gọi
    document.getElementById(sceneId).classList.add('active');
}

// 1. Khi bấm chọn 1 màn ở Bản Đồ -> Chuyển sang Scene 2 (Chuẩn bị)
function selectCampaign(id) {
    selectedCampaignId = id;
    renderCampaignSelector(); // Cập nhật lại UI bản đồ (highlight màn đang chọn)

    let campData = CAMPAIGN_LEVELS.find(c => c.id === selectedCampaignId);
    if (!campData) return;

    // Đổ dữ liệu thông tin màn
    document.getElementById('preview-title').innerText = `⚔️ ${campData.name}`;
    document.getElementById('preview-desc').innerText = campData.description;
    document.getElementById('preview-rewards').innerText = `Thưởng: +${campData.rewardGems} Gem | +${campData.rewardExp} EXP`;

    // Render quái
    let enemyListContainer = document.getElementById('preview-enemy-list');
    enemyListContainer.innerHTML = '';
    campData.enemies.forEach((enemy, idx) => {
        let species = POKEMON_SPECIES.find(s => s.name === enemy.species);
        let rarity = RARITIES.find(r => r.name === enemy.rarity);
        enemyListContainer.innerHTML += `
            <div class="enemy-preview-card">
                <div><b>Wave ${idx + 1}:</b> <span class="${rarity ? rarity.color : ''}">${enemy.species}</span></div>
                <small>Cấp ${enemy.level} | Hệ: <span class="type-badge type-${species ? species.type : 'Fire'}">${species ? species.type : ''}</span></small>
            </div>
        `;
    });

    // Chuyển cảnh sang màn hình chọn đội hình
    switchCampaignScene('scene-campaign-prep');
}

// 2. Khi bấm "Bắt Đầu Chiến Đấu" -> Chuyển sang Scene 3 (Sàn Đấu)
function confirmAndStartBattle() {
    let hasPokemon = battleTeamIndices.some(idx => idx !== null && team[idx]);
    if (!hasPokemon) {
        alert("Bạn phải chọn ít nhất 1 Pokémon để xuất trận!");
        return;
    }

    // Chuyển thẳng sang giao diện chiến đấu, không dùng display: block thủ công nữa
    switchCampaignScene('scene-campaign-battle');

    battleRewards = { gems: 0, exp: 0 };
    startBattle();
}
function createCampaignEnemy(enemyData) {
    const species = POKEMON_SPECIES.find(p => p.name === enemyData.species);
    const rarity = RARITIES.find(r => r.name === enemyData.rarity);

    let enemy = {
        id: Date.now() + Math.random(),
        name: species.name,
        type: species.type,
        rarity: rarity,
        level: enemyData.level,
        exp: 0,
        maxExp: 100,

        maxHp: 0,
        hp: 0,
        shield: 0,
        mp: 0,

        atk: 0,
        def: 0,
        speed: 0,

        iv: { hp: 1, atk: 1, def: 1, speed: 1 },

        spdGauge: 0,
        effects: [],
        passive: species.passive,
        passives: [species.passive],
        talents: [],
        skills: [
            generateSkillInstance(species.type, 'Basic', rarity, enemyData.level),
            generateSkillInstance(species.type, 'Skill1', rarity, enemyData.level)
        ]
    };

    // Tính chỉ số
    recalculatePokemonStats(enemy);

    // Nhân thêm hệ số màn chơi
    enemy.maxHp = Math.round(enemy.maxHp * enemyData.statMult);
    enemy.hp = enemy.maxHp;
    enemy.atk = Math.round(enemy.atk * enemyData.statMult);
    enemy.def = Math.round(enemy.def * enemyData.statMult);
    enemy.speed = Math.round(enemy.speed * enemyData.statMult);

    return enemy;
}