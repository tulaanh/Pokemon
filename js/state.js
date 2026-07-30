// --- GAME STATE ---
let gems = 10000000;
let gold = 100000; // Đơn vị tiền vàng mới
let inventory = { candy: 0 }; // Kho đồ, số lượng kẹo hiện có
let team = [];
let activePokeIdx = 0;
let enemyPoke = null;
let currentTurnOwner = null;
let isProcessingTurn = false;
let isBattling = false; // Cờ kiểm tra trạng thái chiến đấu

// Hàm lưu trạng thái game vào localStorage
function saveGameState() {
    const data = {
        gems,
        gold,
        inventory,
        team,
        activePokeIdx,
        // Các biến trạng thái khác quan trọng
        selectedCampaignId,
        currentWaveIdx,
        currentCampaignEnemies,
        battleRewards,
        mergeSlotMain,
        mergeSlotSub,
        battleTeamIndices,
        currentSelectingBattleSlot,
        battleSortBy,
        // Thứ tự sắp xếp hiện tại
        searchQuery,
        sortBy,
        // Gym state
        gymProgress,
        gymBuffs,
    };
    localStorage.setItem('pokemonGameState', JSON.stringify(data));
}

// Hàm tải trạng thái game từ localStorage
function loadGameState() {
    const data = JSON.parse(localStorage.getItem('pokemonGameState') || '{}');
    if (data.gems !== undefined) gems = data.gems;
    if (data.gold !== undefined) gold = data.gold;
    if (data.inventory) inventory = data.inventory;
    if (data.team) team = data.team;
    if (data.activePokeIdx !== undefined) activePokeIdx = data.activePokeIdx;
    // Các trạng thái phụ khác (nếu có)
    if (data.selectedCampaignId !== undefined) selectedCampaignId = data.selectedCampaignId;
    if (data.currentWaveIdx !== undefined) currentWaveIdx = data.currentWaveIdx;
    if (data.currentCampaignEnemies) currentCampaignEnemies = data.currentCampaignEnemies;
    if (data.battleRewards) battleRewards = data.battleRewards;
    if (data.mergeSlotMain !== undefined) mergeSlotMain = data.mergeSlotMain;
    if (data.mergeSlotSub !== undefined) mergeSlotSub = data.mergeSlotSub;
    if (data.battleTeamIndices) battleTeamIndices = data.battleTeamIndices;
    if (data.currentSelectingBattleSlot !== undefined) currentSelectingBattleSlot = data.currentSelectingBattleSlot;
    if (data.battleSortBy) battleSortBy = data.battleSortBy;
    if (data.searchQuery) searchQuery = data.searchQuery;
    if (data.sortBy) sortBy = data.sortBy;
    // Gym state
    if (data.gymProgress) gymProgress = data.gymProgress;
    if (data.gymBuffs) gymBuffs = data.gymBuffs;
}

// Load state ngay khi script được tải
loadGameState();

// --- BATTLE TEAM STATE ---
let battleTeamIndices = [null, null, null]; // Lưu index của 3 Pokemon được chọn từ team
let currentSelectingBattleSlot = null; // Biến xác định đang chọn cho slot nào (0, 1, 2)
let battleSortBy = 'level-desc'; // Mặc định sắp xếp theo level từ cao xuống thấp khi chọn đội hình chiến dịch

// Campaign Progress State
let selectedCampaignId = 1;
let currentWaveIdx = 0;
let currentCampaignEnemies = [];
let battleRewards = { gems: 0, exp: 0, gold: 0, candy: 0 };

// Merge State
let mergeSlotMain = null;
let mergeSlotSub = null;
let currentSelectingSlot = null;
let mergeSearchQuery = '';

// Filter State
let searchQuery = '';
let sortBy = 'default';

// --- CẬP NHẬT THỨ TỰ SẮP XẾP ---
const RARITY_ORDER = {
    'Common': 1,
    'Rare': 2,
    'Epic': 3,
    'Legendary': 4,
    'Mythic': 5,
    'Secret': 6
};
