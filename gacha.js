// Tạo Skill Instance
function generateSkillInstance(type, slot, rarity, pokeLevel) {
    let pool = ELEMENTAL_SKILL_TEMPLATES[type][slot];
    let template = pool[Math.floor(Math.random() * pool.length)];

    let sk = JSON.parse(JSON.stringify(template));
    sk.slot = slot;
    sk.currentCd = 0;

    let rollMult = (Math.random() * (rarity.skillMax - rarity.skillMin) + rarity.skillMin);
    sk.rollMult = rollMult;

    recalculateSkillValues(sk, pokeLevel);
    return sk;
}

function recalculateSkillValues(sk, pokeLevel) {
    let levelMult = 1 + (pokeLevel - 1) * 0.12;
    let finalMult = sk.rollMult * levelMult;

    if (sk.basePower) sk.power = Math.round(sk.basePower * finalMult);
    if (sk.baseShield) sk.shield = Math.round(sk.baseShield * finalMult);
    if (sk.baseHeal) sk.heal = Math.round(sk.baseHeal * finalMult);
}

// Quay Gacha
function drawGacha() {
    if (gems < 100) { alert("Không đủ Gem!"); return; }
    gems -= 100;
    document.getElementById('gem-count').innerText = gems;

    let rand = Math.random() * 100;
    let cum = 0;
    let selectedRarity = RARITIES[0];
    for (let r of RARITIES) {
        cum += r.chance;
        if (rand <= cum) { selectedRarity = r; break; }
    }

    let species = POKEMON_SPECIES[Math.floor(Math.random() * POKEMON_SPECIES.length)];

    let newPoke = {
        id: Date.now() + Math.random(),
        name: species.name,
        type: species.type,
        rarity: selectedRarity,
        level: 1,
        vLevel: 0,
        exp: 0,
        maxExp: 50,
        maxHp: 0,
        hp: 0,
        shield: 0,
        mp: 0,
        initMp: Math.round(species.baseInitMp * selectedRarity.statMult),
        atk: 0,
        speed: 0,
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

    document.getElementById('gacha-result').innerHTML = `
        <span class="${selectedRarity.color}">
            🎉 Nhận: <b>[${selectedRarity.name}] ${newPoke.name}</b> (Hệ ${newPoke.type})!
        </span>
    `;

    renderRoster();
}

// Render danh sách Roster
function renderRoster() {
    let rosterContainer = document.getElementById('roster-container');
    if (!rosterContainer) return;
    if (team.length === 0) { rosterContainer.innerHTML = "Chưa có Pokémon nào!"; return; }

    rosterContainer.innerHTML = '';
    team.forEach((p, idx) => {
        let vBadge = p.vLevel > 0 ? `<span class="v-badge">V${p.vLevel}</span>` : '';
        rosterContainer.innerHTML += `
            <div class="roster-item" onclick="switchPokemon(${idx})" style="${idx === activePokeIdx ? 'border: 2px solid #f5c518; background: #2f2f45;' : ''}">
                <div>
                    <span class="${p.rarity.color}"><b>${p.name}</b></span> ${vBadge} (Lv.${p.level})
                    <span class="type-badge type-${p.type}">${p.type}</span>
                    ${idx === activePokeIdx ? ' <small style="color:#f5c518;">[Đang chọn]</small>' : ''}
                </div>
                <small>HP:${p.hp}/${p.maxHp} | ATK:${p.atk} | SPD:${p.speed}</small>
            </div>
        `;
    });
}

function switchPokemon(idx) {
    activePokeIdx = idx;
    renderRoster();
    if (typeof updateUI === 'function') updateUI();
}