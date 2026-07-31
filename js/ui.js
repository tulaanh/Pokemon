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
        if (sortBy === 'level-asc') return pA.level - pB.level;
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
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <small>HP:${p.hp}/${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
                </div>
            </div>
        `;
    });
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
        <div class="detail-stat-item"> Giáp (DEF): <b>${p.def}</b> </div>
        <div class="detail-stat-item">MP Ban Đầu: <b>${p.initMp}/${p.maxMp || 100}</b></div>
    `;

    let skillsContainer = document.getElementById('modal-poke-skills');
    skillsContainer.innerHTML = '';

    // --- RENDER NỘI TẠI (PASSIVE) ---
    let triggerNames = {
        'perm': 'Vĩnh viễn',
        'start_battle': 'Đầu trận',
        'start_turn': 'Đầu lượt',
        'take_damage': 'Nhận sát thương',
        'hp_below_50': 'Khi HP < 50%'
    };

    skillsContainer.innerHTML += `<div style="margin-bottom: 6px; color: #f5c518; font-weight: bold; font-size: 0.95em;">🔥 Nội Tại (Passive) — 1/1</div>`;

    if (p.passives && p.passives.length > 0) {
        let ps = p.passives[0];
        let triggerText = triggerNames[ps.trigger] || ps.trigger;
        skillsContainer.innerHTML += `
            <div style="border: 1px dashed #f5c518; background: rgba(245, 197, 24, 0.05); padding: 8px 10px; border-radius: 6px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span><b style="color: #f5c518;">${ps.name}</b></span>
                    <span style="color: #a6adc8; font-size: 0.85em;">Kích hoạt: <b>${triggerText}</b></span>
                </div>
                <div style="color: #f5c518; font-style: italic; font-size: 0.9em;">${ps.desc}</div>
            </div>`;
    } else {
        // Fallback cho Pokemon cũ chưa được migrate
        let ps = p.passive || rollPassive(p.type);
        if (!p.passives) p.passives = [];
        p.passives[0] = ps;
        p.passive = ps;
        let triggerText = triggerNames[ps.trigger] || ps.trigger;
        skillsContainer.innerHTML += `
            <div style="border: 1px dashed #f5c518; background: rgba(245, 197, 24, 0.05); padding: 8px 10px; border-radius: 6px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span><b style="color: #f5c518;">${ps.name}</b></span>
                    <span style="color: #a6adc8; font-size: 0.85em;">Kích hoạt: <b>${triggerText}</b></span>
                </div>
                <div style="color: #f5c518; font-style: italic; font-size: 0.9em;">${ps.desc}</div>
            </div>`;
    }

    // --- RENDER TÀI NĂNG (TALENTS) ---
    skillsContainer.innerHTML += `<div style="margin-top: 10px; margin-bottom: 6px; color: #64ffda; font-weight: bold; font-size: 0.95em;">⭐ Tài Năng (Talent) — ${(p.talents && p.talents.length) || 0}/3</div>`;

    if (p.talents && p.talents.length > 0) {
        let talentListHTML = '<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">';
        p.talents.forEach((tl, i) => {
            let triggerText = triggerNames[tl.trigger] || tl.trigger;
            talentListHTML += `
                <li style="border: 1px dashed #64ffda; background: rgba(100, 255, 218, 0.05); padding: 8px 10px; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span><b style="color: #64ffda;">[Mốc V${[1, 3, 5][i] || '?'}] [${i + 1}] ${tl.name}</b></span>
                        <span style="color: #a6adc8; font-size: 0.85em;">Kích hoạt: <b>${triggerText}</b></span>
                    </div>
                    <div style="color: #64ffda; font-style: italic; font-size: 0.9em;">${tl.desc}</div>
                </li>`;
        });
        
        // Hiển thị vị trí khóa nếu chưa đủ 3 tài năng
        if (p.talents.length < 3) {
            let nextMilestones = [1, 3, 5].slice(p.talents.length);
            nextMilestones.forEach(v => {
                talentListHTML += `
                    <li style="border: 1px dashed #57577d; background: rgba(87, 87, 125, 0.05); padding: 8px 10px; border-radius: 6px; opacity: 0.7;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #a6adc8;"><b>🔒 Tài Năng Vết Nứt</b></span>
                            <span style="color: #ff4757; font-size: 0.85em;">Yêu cầu: <b>Cấp V${v}</b></span>
                        </div>
                    </li>`;
            });
        }
        
        talentListHTML += '</ul>';
        skillsContainer.innerHTML += talentListHTML;
    } else {
        skillsContainer.innerHTML += `
            <div style="border: 1px dashed #57577d; background: rgba(87, 87, 125, 0.05); padding: 10px; border-radius: 6px; opacity: 0.85;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span><b style="color: #a6adc8;">[Tài Năng] Chưa Mở Khóa</b></span>
                    <span style="color: #ff4757; font-size: 0.85em;">Yêu cầu: <b>Cấp V1</b></span>
                </div>
                <div style="color: #a6adc8; font-style: italic; font-size: 0.9em;">
                    Đạt các cấp V1, V3, và V5 (Hợp nhất Pokémon cùng loài) để mở khóa tối đa 3 Kỹ năng Tài năng chung.
                </div>
            </div>`;
    }

    // --- Phân cách giữa Passive/Talent và Skills ---
    skillsContainer.innerHTML += `<hr style="border: none; border-top: 1px solid #3f3f5a; margin: 10px 0;">`;

    p.skills.forEach((sk, i) => {
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

        let effBadge = sk.effect ? `<span style="color: #64ffda;"> (Hiệu ứng: ${sk.effect.name})</span>` : '';
        let cdText = sk.cd > 0 ? `Hồi chiêu: ${sk.cd} lượt` : 'Không hồi chiêu';
        let rarityColorClass = sk.rarity ? `rarity-${sk.rarity}` : 'rarity-Common';
        let mainStatHTML = (sk.category === 'buff' && !sk.power && !sk.shield && !sk.heal) ? '' : `<b style="color: #4caf50;">${valText}</b>`;

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
