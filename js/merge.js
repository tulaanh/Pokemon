// --- MERGE LOGIC ---
function onMergeSearchChange(val) {
    mergeSearchQuery = val.trim().toLowerCase();
    openMergeSelectModal(currentSelectingSlot);
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

    let eligibleList = team.map((p, originalIndex) => ({ pokemon: p, originalIndex }))
        .filter(item => {
            if (slotType === 'main' && item.originalIndex === mergeSlotSub) return false;
            if (slotType === 'sub' && item.originalIndex === mergeSlotMain) return false;
            if (mergeSearchQuery && !item.pokemon.name.toLowerCase().includes(mergeSearchQuery)) return false;
            return true;
        });

    eligibleList.sort((a, b) => {
        let pA = a.pokemon;
        let pB = b.pokemon;
        let nameCompare = pA.name.localeCompare(pB.name);
        if (nameCompare === 0) {
            return (RARITY_ORDER[pB.rarity.name] || 0) - (RARITY_ORDER[pA.rarity.name] || 0);
        }
        return nameCompare;
    });

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

function closeMergeModal() {
    mergeSearchQuery = '';
    let searchInput = document.getElementById('merge-search-input');
    if (searchInput) searchInput.value = '';
    document.getElementById('merge-modal').style.display = 'none';
}

function selectPokemonForMerge(idx) {
    if (currentSelectingSlot === 'main') mergeSlotMain = idx;
    if (currentSelectingSlot === 'sub') mergeSlotSub = idx;
    closeMergeModal();
    updateMergeUI();
}
// --- MERGE LOGIC (ĐÃ CẬP NHẬT) ---

function updateMergeUI() {
    let slotMainEl = document.getElementById('slot-main');
    let slotSubEl = document.getElementById('slot-sub');
    let previewEl = document.getElementById('merge-preview');
    let btnMerge = document.getElementById('btn-do-merge');

    if (!slotMainEl || !slotSubEl) return;

    // Hiển thị Ô Phôi Chính
    if (mergeSlotMain !== null && team[mergeSlotMain]) {
        let p = team[mergeSlotMain];
        let vText = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        slotMainEl.className = "merge-slot filled";
        slotMainEl.innerHTML = `<div><b class="${p.rarity.color}">${p.name}</b> ${vText}<br><small>Lv.${p.level} - ${p.rarity.name}</small></div>`;
    } else {
        slotMainEl.className = "merge-slot";
        slotMainEl.innerHTML = `<div class="slot-placeholder">+ Chọn Phôi Chính</div>`;
    }

    // Hiển thị Ô Phôi Phụ
    if (mergeSlotSub !== null && team[mergeSlotSub]) {
        let p = team[mergeSlotSub];
        let vText = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        slotSubEl.className = "merge-slot filled";
        slotSubEl.innerHTML = `<div><b class="${p.rarity.color}">${p.name}</b> ${vText}<br><small>Lv.${p.level} - ${p.rarity.name}</small></div>`;
    } else {
        slotSubEl.className = "merge-slot";
        slotSubEl.innerHTML = `<div class="slot-placeholder">+ Chọn Phôi Phụ</div>`;
    }

    // Kiếm tra điều kiện & Hiển thị chỉ số Preview
    if (mergeSlotMain !== null && mergeSlotSub !== null) {
        let pMain = team[mergeSlotMain];
        let pSub = team[mergeSlotSub];

        if (pMain.name !== pSub.name) {
            previewEl.innerHTML = `<span style="color:#ff4757;">❌ Phải cùng loài (${pMain.name})!</span>`;
            btnMerge.disabled = true;
        } else if (pMain.rarity.name !== pSub.rarity.name) { // CẤM KHÁC ĐỘ HIẾM
            previewEl.innerHTML = `<span style="color:#ff4757;">❌ Phải cùng độ hiếm (${pMain.rarity.name} vs ${pSub.rarity.name})!</span>`;
            btnMerge.disabled = true;
        } else if ((pMain.vLevel || 0) !== (pSub.vLevel || 0)) {
            previewEl.innerHTML = `<span style="color:#ff4757;">❌ Phải cùng cấp V (V${pMain.vLevel || 0} vs V${pSub.vLevel || 0})!</span>`;
            btnMerge.disabled = true;
        } else {
            // Giả lập chỉ số sau khi Hợp Nhất
            let tempPoke = JSON.parse(JSON.stringify(pMain));
            tempPoke.vLevel = (tempPoke.vLevel || 0) + 1;
            if (pSub.level > tempPoke.level) tempPoke.level = pSub.level;

            recalculatePokemonStats(tempPoke); // Tính toán chỉ số V-Level mới

            // Tính chênh lệch chỉ số
            let diffHp = tempPoke.maxHp - pMain.maxHp;
            let diffAtk = tempPoke.atk - pMain.atk;
            let diffDef = tempPoke.def - pMain.def;
            let diffSpd = tempPoke.speed - pMain.speed;

            previewEl.innerHTML = `
                <div style="text-align: left; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin-top: 5px;">
                    <div style="text-align: center; color: #4caf50; font-weight: bold; margin-bottom: 5px;">
                        ✅ HỢP NHẤT THÀNH: ${pMain.name} V${tempPoke.vLevel}
                    </div>
                    <small style="display: block; color: #a6adc8;">📊 Chỉ số sau khi nâng cấp:</small>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px; margin-top: 4px;">
                        <div>HP: <b>${tempPoke.maxHp}</b> <span style="color:#4caf50;">(+${diffHp})</span></div>
                        <div>ATK: <b>${tempPoke.atk}</b> <span style="color:#4caf50;">(+${diffAtk})</span></div>
                        <div>DEF: <b>${tempPoke.def}</b> <span style="color:#4caf50;">(+${diffDef})</span></div>
                        <div>SPD: <b>${tempPoke.speed}</b> <span style="color:#4caf50;">(+${diffSpd})</span></div>
                    </div>
                </div>
            `;
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

    // Chặn an toàn 1 lần nữa ở logic
    if (pMain.name !== pSub.name || pMain.rarity.name !== pSub.rarity.name || (pMain.vLevel || 0) !== (pSub.vLevel || 0)) {
        alert("Không đủ điều kiện hợp nhất!");
        return;
    }

    // Tăng cấp V
    pMain.vLevel = (pMain.vLevel || 0) + 1;

    // --- HỆ THỐNG TÀI NĂNG: Mở khóa tại V1, V3, V5 ---
    if (!pMain.talents) pMain.talents = [];
    if (!pMain.passives) {
        // Fallback phòng hờ trường hợp Pokemon cũ không có passives
        pMain.passives = pMain.passive ? [JSON.parse(JSON.stringify(pMain.passive))] : [rollPassive(pMain.type)];
        pMain.passive = pMain.passives[0];
    }

    // Chỉ mở khóa Talent mới tại các mốc V1, V3, V5
    if (TALENT_UNLOCK_VLEVELS && TALENT_UNLOCK_VLEVELS.includes(pMain.vLevel)) {
        // Quay 1 Tài năng từ pool chung
        let newTalent = rollTalent();
        pMain.talents.push(newTalent);
        log(`🌟 <b>[TÀI NĂNG MỞ KHÓA]</b> <b>${pMain.name} V${pMain.vLevel}</b> khai phá tài năng: <span style="color: #64ffda;">[${newTalent.name}]</span> - <i>${newTalent.desc}</i>!`);
    }

    // Giữ level cao hơn nếu phôi phụ level cao hơn
    if (pSub.level > pMain.level) {
        pMain.level = pSub.level;
        pMain.exp = pSub.exp;
        pMain.maxExp = pSub.maxExp;
    }

    // TÍNH LẠI CHỈ SỐ & DAME KỸ NĂNG THEO V-LEVEL MỚI
    recalculatePokemonStats(pMain);
    pMain.skills.forEach(s => recalculateSkillValues(s, pMain.level));

    // Xóa phôi phụ
    team.splice(mergeSlotSub, 1);
    mergeSlotMain = null;
    mergeSlotSub = null;

    log(`🧬 <b>HỢP NHẤT THÀNH CÔNG!</b> Bạn nhận được <b>${pMain.name} V${pMain.vLevel}</b> với chỉ số được gia tăng!`);

    updateMergeUI();
    renderRoster();
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGameState === 'function') saveGameState();
}
