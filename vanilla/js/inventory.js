// ============================================================
// KHO POKÉMON & POKÉDEX (YÊU THÍCH)
// - Kho: tối đa 150 Pokémon (gameState.myPokemons = team)
// - Pokédex: tối đa 20 Pokémon yêu thích dùng để xuất trận
// ============================================================

// Giới hạn số lượng Pokémon trong Kho
const INVENTORY_LIMIT = 150;
// Giới hạn số lượng Pokémon trong Pokédex (Yêu thích)
const POKEDEX_LIMIT = 20;

// --- HỖ TRỢ ID DUY NHẤT ---
// Đảm bảo mỗi Pokémon có một ID duy nhất để tham chiếu trong Pokédex.
// Nếu Pokémon cũ (save cũ) chưa có id thì tự sinh thêm, KHÔNG thay đổi id gốc.
function getPokemonUniqueId(poke) {
    if (!poke.id) {
        poke.id = 'poke-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    }
    return String(poke.id);
}

// ============================================================
// YÊU CẦU 1: QUẢN LÝ KHO (TỐI ĐA 150)
// ============================================================

// Thêm 1 Pokémon vào Kho. Kiểm tra giới hạn 150 con.
// Trả về true nếu thêm thành công, false nếu Kho đã đầy.
function addPokemonToInventory(pokemon) {
    if (!pokemon) return false;

    // Kiểm tra giới hạn Kho: tối đa 150 con
    if (team.length >= INVENTORY_LIMIT) {
        alert('Kho đã đầy!');
        return false;
    }

    getPokemonUniqueId(pokemon);
    team.push(pokemon);
    return true;
}

// Trả về danh sách Pokémon trong Kho kèm chuỗi tên hiển thị đã đánh số thứ tự.
// Các Pokémon trùng (TÊN + ĐỘ HIẾM) sẽ được đánh số #1, #2, ... #n (chỉ hiển thị trên UI).
function getFormattedInventory() {
    // Đếm số lượng của từng nhóm (tên + độ hiếm) để biết nhóm nào trùng lặp
    let countMap = {};
    team.forEach(p => {
        let key = p.name + '|' + (p.rarity ? p.rarity.name : 'Common');
        countMap[key] = (countMap[key] || 0) + 1;
    });

    let seenCount = {};
    return team.map((p, index) => {
        let key = p.name + '|' + (p.rarity ? p.rarity.name : 'Common');
        seenCount[key] = (seenCount[key] || 0) + 1;

        // Chỉ đánh số thứ tự khi có NHIỀU HƠN 1 con trùng tên + trùng độ hiếm
        let isDuplicate = countMap[key] > 1;
        let displayName = isDuplicate ? `${p.name} #${seenCount[key]}` : p.name;

        return {
            pokemon: p,
            index: index,                 // Index thật trong team (dùng cho mọi thao tác khác)
            displayName: displayName,     // Tên hiển thị đã đánh số thứ tự
            duplicateNumber: isDuplicate ? seenCount[key] : null,
            isDuplicate: isDuplicate
        };
    });
}

// ============================================================
// YÊU CẦU 2: POKÉDEX (YÊU THÍCH) — TỐI ĐA 20
// ============================================================

// Kiểm tra 1 Pokémon (theo ID duy nhất) đã nằm trong Pokédex chưa
function isInPokedex(uniqueId) {
    if (!gameState.pokedex) gameState.pokedex = [];
    return gameState.pokedex.indexOf(String(uniqueId)) !== -1;
}

// Thêm / Xóa 1 Pokémon vào mảng gameState.pokedex.
// Kiểm tra giới hạn tối đa 20 con trước khi thêm mới.
function togglePokedex(pokemonUniqueId) {
    if (!gameState.pokedex) gameState.pokedex = [];
    pokemonUniqueId = String(pokemonUniqueId);

    let existingIdx = gameState.pokedex.indexOf(pokemonUniqueId);

    if (existingIdx !== -1) {
        // Đã có trong Pokédex -> Gỡ ra
        gameState.pokedex.splice(existingIdx, 1);
        let p = team.find(t => String(t.id) === pokemonUniqueId);
        if (typeof log === 'function') log(`⭐ <b>${p ? p.name : 'Pokémon'}</b> đã bị gỡ khỏi Pokédex.`);
    } else {
        // Chưa có -> Kiểm tra giới hạn 20 rồi thêm vào
        if (gameState.pokedex.length >= POKEDEX_LIMIT) {
            alert(`Pokédex đã đầy (${POKEDEX_LIMIT}/${POKEDEX_LIMIT})! Hãy bỏ bớt Pokémon yêu thích để thêm con mới.`);
            return;
        }
        gameState.pokedex.push(pokemonUniqueId);
        let p = team.find(t => String(t.id) === pokemonUniqueId);
        if (typeof log === 'function') log(`⭐ <b>${p ? p.name : 'Pokémon'}</b> đã được thêm vào Pokédex (${gameState.pokedex.length}/${POKEDEX_LIMIT})!`);
    }

    // Cập nhật lại giao diện Kho (nếu đang mở) và lưu tiến trình
    if (typeof renderInventory === 'function') renderInventory();
    // Nếu Modal Pokédex đang mở thì vẽ lại danh sách (khi gỡ yêu thích ngay trong Modal)
    let pokedexModal = document.getElementById('pokedex-modal');
    if (pokedexModal && pokedexModal.style.display === 'flex' && typeof renderPokedexList === 'function') {
        renderPokedexList();
    }
    if (typeof saveGameState === 'function') saveGameState();
}

// Lấy danh sách Pokémon trong Pokédex (kèm index thật trong team), sắp theo thứ tự team
function getPokedexPokemonList() {
    let pokedexIds = (gameState.pokedex || []).map(String);
    return team.map((p, originalIndex) => ({ pokemon: p, originalIndex }))
        .filter(item => pokedexIds.indexOf(getPokemonUniqueId(item.pokemon)) !== -1);
}

// ============================================================
// GIAO DIỆN KHO — VẼ DANH SÁCH + NÚT ⭐ YÊU THÍCH
// ============================================================

// Vẽ danh sách toàn bộ Pokémon trong Kho (tối đa 150) kèm icon ⭐.
// Click ⭐ sẽ gọi togglePokedex() để thêm/xóa khỏi Pokédex.
function renderInventory() {
    let rosterContainer = document.getElementById('roster-container');
    if (!rosterContainer) return;

    let pokedexCount = (gameState.pokedex || []).length;

    // Cập nhật số lượng hiển thị trên nút "📖 Pokédex" (nếu nút có tồn tại)
    updatePokedexButton();

    // Thanh thông tin Kho & Pokédex (đếm số lượng)
    let infoHTML = `
        <div class="pokedex-counter">
            <span>🎒 Kho Pokémon: <b>${team.length}/${INVENTORY_LIMIT}</b></span>
            <span>⭐ Pokédex: <b style="color: #f5c518;">${pokedexCount}/${POKEDEX_LIMIT}</b></span>
        </div>
    `;

    if (team.length === 0) {
        rosterContainer.innerHTML = infoHTML + '<div style="text-align:center; padding: 20px; color: #a6adc8;">Kho trống! Hãy sang mục Gacha để quay.</div>';
        return;
    }

    // Áp dụng tìm kiếm & sắp xếp hiện có (giữ index gốc của từng Pokémon)
    let processedList = filterAndSortTeam();
    if (processedList.length === 0) {
        rosterContainer.innerHTML = infoHTML + '<div style="text-align:center; padding: 20px; color: #a6adc8;">Không tìm thấy Pokémon phù hợp!</div>';
        return;
    }

    // Tính sẵn tên hiển thị (đã đánh số thứ tự) cho từng index trong team
    let displayNameByIndex = {};
    getFormattedInventory().forEach(f => { displayNameByIndex[f.index] = f.displayName; });

    rosterContainer.innerHTML = infoHTML;
    processedList.forEach(item => {
        let p = item.pokemon;
        let idx = item.originalIndex;
        let displayName = displayNameByIndex[idx] || p.name;
        let vBadge = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        let isSelected = (idx === activePokeIdx);
        let uid = getPokemonUniqueId(p);
        let inPokedex = isInPokedex(uid);

        rosterContainer.innerHTML += `
            <div class="roster-item ${inPokedex ? 'in-pokedex' : ''}" onclick="showPokeDetailModal(${idx})"
                 style="${isSelected ? 'border: 2px solid #f5c518; background: #2f2f45;' : ''}">
                <div>
                    <span class="${p.rarity.color}"><b>${displayName}</b></span> ${vBadge} (Lv.${p.level})
                    <span class="type-badge type-${p.type}">${p.type}</span>
                    ${inPokedex ? '<span class="in-pokedex-tag">In Pokédex</span>' : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <small>HP:${p.hp}/${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
                    <button class="star-btn ${inPokedex ? 'active' : ''}"
                            onclick="event.stopPropagation(); togglePokedex('${uid}')"
                            title="${inPokedex ? 'Gỡ khỏi Pokédex' : 'Thêm vào Pokédex'}">${inPokedex ? '⭐' : '☆'}</button>
                </div>
            </div>
        `;
    });
}

// ============================================================
// YÊU CẦU 3: CHỌN POKÉMON XUẤT TRẬN — CHỈ TỪ POKÉDEX
// ============================================================

// Vẽ danh sách chọn Pokémon xuất trận (Chiến dịch / PvP).
// CHỈ LOAD danh sách từ Pokédex (tối đa 20 con đã đánh dấu yêu thích).
function renderBattleSelection() {
    let modalList = document.getElementById('battle-modal-list');
    if (!modalList) return;
    modalList.innerHTML = '';

    if (team.length === 0) {
        modalList.innerHTML = '<div style="text-align:center; padding: 20px; color: #a6adc8;">Chưa có Pokémon nào!</div>';
        return;
    }

    let pokedexIds = (gameState.pokedex || []).map(String);
    if (pokedexIds.length === 0) {
        modalList.innerHTML = `
            <div style="text-align:center; padding: 20px; color: #ff4757;">
                ⭐ Pokédex trống! Vào mục <b>Đội Hình</b>, nhấn ⭐ để thêm Pokémon chủ lực vào Pokédex (tối đa 20) trước khi xuất trận.
            </div>`;
        return;
    }

    // Chỉ lấy những Pokémon nằm trong Pokédex
    let list = getPokedexPokemonList().filter(item => {
        let isAlreadyInTeam = battleTeamIndices.includes(item.originalIndex) && battleTeamIndices[currentSelectingBattleSlot] !== item.originalIndex;
        return !isAlreadyInTeam;
    });

    // Sắp xếp theo lựa chọn của người chơi
    list.sort((a, b) => {
        let pA = a.pokemon;
        let pB = b.pokemon;
        if (battleSortBy === 'level-desc') return pB.level - pA.level;
        if (battleSortBy === 'level-asc') return pA.level - pB.level;
        if (battleSortBy === 'rarity-desc') return (RARITY_ORDER[pB.rarity.name] || 0) - (RARITY_ORDER[pA.rarity.name] || 0);
        if (battleSortBy === 'rarity-asc') return (RARITY_ORDER[pA.rarity.name] || 0) - (RARITY_ORDER[pB.rarity.name] || 0);
        return 0;
    });

    // Thanh thông báo: chỉ hiển thị Pokémon trong Pokédex
    modalList.innerHTML = `
        <div style="padding: 6px 8px; margin-bottom: 8px; background: rgba(245,197,24,0.08); border: 1px dashed #f5c518; border-radius: 6px; color: #f5c518; font-size: 11px; text-align: center;">
            ⭐ Chỉ hiển thị Pokémon trong Pokédex (${pokedexIds.length}/${POKEDEX_LIMIT})
        </div>`;

    if (list.length === 0) {
        modalList.innerHTML += '<div style="text-align:center; padding: 20px; color: #a6adc8;">Không còn Pokémon nào trong Pokédex khả dụng!</div>';
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

// ============================================================
// POKÉDEX DETAILS: XEM CHI TIẾT POKÉMON & DANH SÁCH POKÉDEX
// ============================================================

// Icon đại diện theo hệ (game không có ảnh nên dùng emoji làm Avatar)
function getTypeEmoji(type) {
    const TYPE_EMOJI = { Fire: '🔥', Water: '💧', Grass: '🌿', Electric: '⚡', Rock: '🪨' };
    return TYPE_EMOJI[type] || '❓';
}

// Ngưỡng tối đa của từng chỉ số để vẽ Progress Bar (có thể tùy chỉnh lại)
const STAT_BAR_CAPS = { HP: 1500, ATK: 200, DEF: 200, SPD: 200 };

// Dựng 1 dòng chỉ số kèm Progress Bar: [Nhãn] [====] [Giá trị]
function buildStatBarHTML(label, value, color) {
    let cap = STAT_BAR_CAPS[label] || 200;
    let pct = Math.min(100, Math.max(0, (value / cap) * 100));
    return `
        <div class="poke-stat-row">
            <span class="poke-stat-label">${label}</span>
            <div class="poke-stat-bar">
                <div class="poke-stat-fill" style="width:${pct}%; background:${color};"></div>
            </div>
            <span class="poke-stat-value">${value}</span>
        </div>
    `;
}

// Tên hiển thị của trigger (thời điểm kích hoạt) — map theo dữ liệu game
const TRIGGER_NAMES = {
    'perm': 'Vĩnh viễn',
    'start_battle': 'Đầu trận',
    'start_turn': 'Đầu lượt',
    'take_damage': 'Nhận sát thương',
    'hp_below_50': 'Khi HP < 50%'
};

// Dựng HTML hiển thị Nội Tại (Passive) của 1 Pokémon
function buildPassiveHTML(p) {
    let ps = (p.passives && p.passives[0]) || p.passive || null;
    if (!ps) return '<div class="poke-empty">Không có Nội Tại.</div>';
    let triggerText = TRIGGER_NAMES[ps.trigger] || ps.trigger || '?';
    return `
        <div class="poke-passive-card">
            <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap;">
                <b style="color:#f5c518;">${ps.name || 'Nội Tại'}</b>
                <small style="color:#a6adc8;">Kích hoạt: <b>${triggerText}</b></small>
            </div>
            <div style="color:#f5c518; font-style:italic; font-size:0.9em; margin-top:4px;">${ps.desc || ''}</div>
        </div>`;
}

// Dựng HTML hiển thị danh sách Thiên Phú (Talent) của 1 Pokémon
function buildTalentsHTML(p) {
    if (!p.talents || p.talents.length === 0) {
        return '<div class="poke-empty">🔒 Chưa mở khóa Thiên Phú (yêu cầu hợp nhất đạt cấp V1).</div>';
    }
    let milestones = [1, 3, 5];
    return p.talents.map((tl, i) => {
        let triggerText = TRIGGER_NAMES[tl.trigger] || tl.trigger || '?';
        return `
            <div class="poke-talent-card">
                <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap;">
                    <b style="color:#64ffda;">[Mốc V${milestones[i] || '?'}] ${tl.name || 'Thiên Phú'}</b>
                    <small style="color:#a6adc8;">Kích hoạt: <b>${triggerText}</b></small>
                </div>
                <div style="color:#64ffda; font-style:italic; font-size:0.9em; margin-top:4px;">${tl.desc || ''}</div>
            </div>`;
    }).join('');
}

// Dựng HTML hiển thị danh sách Kỹ Năng (Skills) của 1 Pokémon
function buildSkillsHTML(p) {
    if (!p.skills || p.skills.length === 0) return '<div class="poke-empty">Không có Kỹ Năng.</div>';

    return p.skills.map(sk => {
        // Mô tả giá trị chính của kỹ năng
        let valText = '';
        if (sk.category === 'damage' || sk.category === 'true_damage') {
            valText = `Sát thương: <b style="color:#4caf50;">${sk.power || 0}</b>${sk.isTrueDmg ? ' (Chuẩn - bỏ qua DEF)' : ''}`;
        } else if (sk.category === 'shield' || sk.shield) {
            valText = `Khiên: <b style="color:#3399ff;">+${sk.shield || 0}</b>`;
        } else if (sk.category === 'heal' || sk.heal) {
            valText = `Hồi phục: <b style="color:#4caf50;">+${sk.heal || 0}</b>`;
        } else if (sk.category === 'buff') {
            valText = `Tăng viện (Buff)`;
        } else {
            valText = `Hỗ trợ`;
        }

        let effBadge = sk.effect ? ` | Hiệu ứng: <b style="color:#64ffda;">${sk.effect.name}</b>` : '';
        let cdText = sk.cd > 0 ? ` | CD: ${sk.cd}t` : '';

        return `
            <div class="poke-skill-card">
                <div class="poke-skill-header">
                    <span><b>${getTypeEmoji(p.type)} ${sk.name}</b>
                        <small style="color:#a6adc8;">[${sk.rarity || 'Common'}] (${sk.type || 'Skill'})</small></span>
                    <span style="color:#f5c518;">MP: ${sk.cost}</span>
                </div>
                <div class="poke-skill-desc">${valText}${effBadge}${cdText}</div>
            </div>`;
    }).join('');
}

// Cập nhật số lượng hiển thị trên nút "📖 Pokédex" ở tab Đội Hình
function updatePokedexButton() {
    let btn = document.getElementById('btn-open-pokedex');
    if (btn) {
        let count = (gameState.pokedex || []).length;
        btn.innerText = `📖 Pokédex (${count}/${POKEDEX_LIMIT})`;
    }
}

// ============================================================
// MỞ / ĐÓNG MODAL CHI TIẾT POKÉMON
// ============================================================

// Mở Modal chi tiết Pokémon dựa trên ID duy nhất (gọi khi click vào thẻ Pokédex).
// Có thể gắn onclick="openPokemonDetail('ID')" ở bất kỳ thẻ nào để mở modal này.
function openPokemonDetail(pokemonUniqueId) {
    let poke = team.find(t => getPokemonUniqueId(t) === String(pokemonUniqueId));
    if (!poke) {
        alert('Không tìm thấy Pokémon này trong Kho!');
        return;
    }

    let bodyEl = document.getElementById('pokemon-detail-body');
    if (!bodyEl) return;

    let vText = poke.vLevel > 0 ? `<span class="v-badge">V${poke.vLevel}</span>` : '';

    // Đổ toàn bộ dữ liệu vào Modal (Header + Chỉ số + Nội tại + Thiên Phú + Kỹ năng)
    bodyEl.innerHTML = `
        <!-- PHẦN HEADER: Avatar + Tên + Cấp độ + Hệ -->
        <div class="poke-detail-top">
            <div class="poke-avatar">${getTypeEmoji(poke.type)}</div>
            <div style="flex:1; min-width:0;">
                <div class="poke-detail-name ${poke.rarity.color}">${poke.name} ${vText}</div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:4px; flex-wrap:wrap;">
                    <span class="type-badge type-${poke.type}">${poke.type}</span>
                    <span style="color:#a6adc8; font-size:12px;">Lv.${poke.level} — ${poke.rarity.name}</span>
                </div>
                <small style="color:#a6adc8;">HP hiện tại: ${poke.hp}/${poke.maxHp} | MP: ${poke.mp}/${poke.maxMp || 100}</small>
            </div>
        </div>

        <!-- PHẦN CHỈ SỐ CƠ BẢN (CÓ PROGRESS BAR) -->
        <div class="poke-detail-section">
            <div class="poke-detail-section-title">📊 Chỉ Số Cơ Bản</div>
            ${buildStatBarHTML('HP', poke.maxHp, '#4caf50')}
            ${buildStatBarHTML('ATK', poke.atk, '#ff4757')}
            ${buildStatBarHTML('DEF', poke.def, '#3399ff')}
            ${buildStatBarHTML('SPD', poke.speed, '#e056fd')}
        </div>

        <!-- PHẦN NỘI TẠI (PASSIVE) -->
        <div class="poke-detail-section">
            <div class="poke-detail-section-title">🔥 Nội Tại (Passive)</div>
            ${buildPassiveHTML(poke)}
        </div>

        <!-- PHẦN THIÊN PHÚ (TALENT) -->
        <div class="poke-detail-section">
            <div class="poke-detail-section-title">🌟 Thiên Phú (Talent)</div>
            ${buildTalentsHTML(poke)}
        </div>

        <!-- PHẦN KỸ NĂNG (SKILLS) -->
        <div class="poke-detail-section">
            <div class="poke-detail-section-title">⚔️ Kỹ Năng (Skills)</div>
            ${buildSkillsHTML(poke)}
        </div>
    `;

    // Xóa class `hidden` và hiển thị Modal giữa màn hình
    let modal = document.getElementById('pokemon-detail-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

// Đóng Modal chi tiết Pokémon (thêm class `hidden` để ẩn đi)
function closePokemonDetail() {
    let modal = document.getElementById('pokemon-detail-modal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
}

// ============================================================
// MODAL POKÉDEX: DANH SÁCH YÊU THÍCH (ĐẦY ĐỦ THÔNG TIN)
// ============================================================

// Vẽ danh sách các Pokémon trong Pokédex, mỗi thẻ hiển thị đầy đủ:
// Tên, Chỉ số (Progress Bar), Nội tại, Thiên Phú và Kỹ năng.
function renderPokedexList() {
    let listEl = document.getElementById('pokedex-list');
    if (!listEl) return;

    let list = getPokedexPokemonList().sort((a, b) => b.pokemon.level - a.pokemon.level);

    if (list.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:24px; color:#a6adc8;">Pokédex trống! Vào mục Đội Hình, nhấn ⭐ để thêm Pokémon chủ lực.</div>';
        return;
    }

    listEl.innerHTML = '';
    list.forEach(item => {
        let p = item.pokemon;
        let uid = getPokemonUniqueId(p);
        let vText = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';

        listEl.innerHTML += `
            <div class="pokedex-card in-pokedex" onclick="openPokemonDetail('${uid}')">
                <!-- HEADER THẺ -->
                <div class="pokedex-card-header">
                    <div>
                        <span class="${p.rarity.color}" style="font-weight:bold; font-size:16px;">${p.name}</span> ${vText}
                        <span style="color:#a6adc8; font-size:12px;">Lv.${p.level} — ${p.rarity.name}</span>
                        <span class="type-badge type-${p.type}" style="margin-left:6px;">${getTypeEmoji(p.type)} ${p.type}</span>
                    </div>
                    <button class="star-btn active" title="Gỡ khỏi Pokédex"
                            onclick="event.stopPropagation(); togglePokedex('${uid}')">⭐</button>
                </div>

                <!-- CHỈ SỐ CƠ BẢN (PROGRESS BAR) -->
                <div class="pokedex-card-stats">
                    ${buildStatBarHTML('HP', p.maxHp, '#4caf50')}
                    ${buildStatBarHTML('ATK', p.atk, '#ff4757')}
                    ${buildStatBarHTML('DEF', p.def, '#3399ff')}
                    ${buildStatBarHTML('SPD', p.speed, '#e056fd')}
                </div>

                <!-- NỘI TẠI + THIÊN PHÚ | KỸ NĂNG -->
                <div class="pokedex-card-sections">
                    <div>
                        <div class="poke-detail-section-title">🔥 Nội Tại</div>
                        ${buildPassiveHTML(p)}
                        <div class="poke-detail-section-title" style="margin-top:10px;">🌟 Thiên Phú</div>
                        ${buildTalentsHTML(p)}
                    </div>
                    <div>
                        <div class="poke-detail-section-title">⚔️ Kỹ Năng</div>
                        ${buildSkillsHTML(p)}
                    </div>
                </div>

                <!-- NÚT MỞ MODAL CHI TIẾT -->
                <div style="text-align:center; margin-top:10px;">
                    <button class="gacha-btn" onclick="event.stopPropagation(); openPokemonDetail('${uid}')"
                            style="width:auto; padding:6px 16px; font-size:13px;">📋 Xem Chi Tiết</button>
                </div>
            </div>
        `;
    });
}

// Mở Modal Pokédex (danh sách yêu thích)
function openPokedexModal() {
    renderPokedexList();
    document.getElementById('pokedex-modal').style.display = 'flex';
}

// Đóng Modal Pokédex
function closePokedexModal() {
    document.getElementById('pokedex-modal').style.display = 'none';
}
