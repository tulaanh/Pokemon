let mergeSlotMain = null;
let mergeSlotSub = null;
let currentSelectingSlot = null;

function openMergeSelectModal(slotType) {
    currentSelectingSlot = slotType;
    let modalList = document.getElementById('merge-modal-list');
    modalList.innerHTML = '';

    if (team.length === 0) {
        modalList.innerHTML = 'Chưa có Pokémon nào trong kho!';
    } else {
        team.forEach((p, idx) => {
            if ((slotType === 'main' && idx === mergeSlotSub) || (slotType === 'sub' && idx === mergeSlotMain)) return;

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
    document.getElementById('merge-modal').style.display = 'none';
}

function selectPokemonForMerge(idx) {
    if (currentSelectingSlot === 'main') mergeSlotMain = idx;
    if (currentSelectingSlot === 'sub') mergeSlotSub = idx;

    closeMergeModal();
    updateMergeUI();
}

function updateMergeUI() {
    let slotMainEl = document.getElementById('slot-main');
    let slotSubEl = document.getElementById('slot-sub');
    let previewEl = document.getElementById('merge-preview');
    let btnMerge = document.getElementById('btn-do-merge');

    if (!slotMainEl || !slotSubEl) return;

    if (mergeSlotMain !== null && team[mergeSlotMain]) {
        let p = team[mergeSlotMain];
        let vText = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        slotMainEl.className = "merge-slot filled";
        slotMainEl.innerHTML = `<div><b class="${p.rarity.color}">${p.name}</b> ${vText}<br><small>Lv.${p.level} - Hệ ${p.type}</small></div>`;
    } else {
        slotMainEl.className = "merge-slot";
        slotMainEl.innerHTML = `<div class="slot-placeholder">+ Chọn Phôi Chính</div>`;
    }

    if (mergeSlotSub !== null && team[mergeSlotSub]) {
        let p = team[mergeSlotSub];
        let vText = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        slotSubEl.className = "merge-slot filled";
        slotSubEl.innerHTML = `<div><b class="${p.rarity.color}">${p.name}</b> ${vText}<br><small>Lv.${p.level} - Hệ ${p.type}</small></div>`;
    } else {
        slotSubEl.className = "merge-slot";
        slotSubEl.innerHTML = `<div class="slot-placeholder">+ Chọn Phôi Phụ</div>`;
    }

    if (mergeSlotMain !== null && mergeSlotSub !== null) {
        let pMain = team[mergeSlotMain];
        let pSub = team[mergeSlotSub];

        if (pMain.name !== pSub.name) {
            previewEl.innerHTML = `<span style="color:#ff4757;">❌ Phải cùng loại (${pMain.name})!</span>`;
            btnMerge.disabled = true;
        } else if ((pMain.vLevel || 0) !== (pSub.vLevel || 0)) {
            previewEl.innerHTML = `<span style="color:#ff4757;">❌ Phải cùng cấp V (V${pMain.vLevel || 0} vs V${pSub.vLevel || 0})!</span>`;
            btnMerge.disabled = true;
        } else {
            let nextV = (pMain.vLevel || 0) + 1;
            previewEl.innerHTML = `<b style="color:#4caf50;">✅ HỢP NHẤT THÀNH: ${pMain.name} V${nextV}</b>`;
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

    pMain.vLevel = (pMain.vLevel || 0) + 1;
    if (pSub.level > pMain.level) {
        pMain.level = pSub.level;
        pMain.exp = pSub.exp;
        pMain.maxExp = pSub.maxExp;
    }

    recalculatePokemonStats(pMain);
    pMain.skills.forEach(s => recalculateSkillValues(s, pMain.level));

    team.splice(mergeSlotSub, 1);
    mergeSlotMain = null;
    mergeSlotSub = null;

    log(`🧬 <b>HỢP NHẤT THÀNH CÔNG!</b> Bạn nhận được <b>${pMain.name} V${pMain.vLevel}</b>!`);

    updateMergeUI();
    renderRoster();
    if (typeof updateUI === 'function') updateUI();
}