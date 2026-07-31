// --- GAME STATE ---
var gems = 1000;
var gold = 100; // Đơn vị tiền vàng mới
var inventory = { candy: 0 }; // Kho đồ, số lượng kẹo hiện có
var team = [];

// Khởi tạo đối tượng gameState để tương thích với các yêu cầu mới
var gameState = {
    player: {
        level: 1,
        pokePoint: 1500,
        pokeGacha: 0
    },
    get myPokemons() {
        return team;
    },
    set myPokemons(val) {
        team = val;
    }
};

var activePokeIdx = 0;
var enemyPoke = null;
var currentTurnOwner = null;
var isProcessingTurn = false;
var isBattling = false; // Cờ kiểm tra trạng thái chiến đấu

// --- BATTLE TEAM STATE ---
var battleTeamIndices = [null, null, null]; // Lưu index của 3 Pokemon được chọn từ team
var currentSelectingBattleSlot = null; // Biến xác định đang chọn cho slot nào (0, 1, 2)
var battleSortBy = 'level-desc'; // Mặc định sắp xếp theo level từ cao xuống thấp khi chọn đội hình chiến dịch

// Campaign Progress State
var selectedCampaignId = 1;
var currentWaveIdx = 0;
var currentCampaignEnemies = [];
var battleRewards = { gems: 0, exp: 0, gold: 0, candy: 0 };

// Merge State
var mergeSlotMain = null;
var mergeSlotSub = null;
var currentSelectingSlot = null;
var mergeSearchQuery = '';

// Filter State
var searchQuery = '';
var sortBy = 'default';

// Gym state
var gymProgress = { Water: 0, Fire: 0, Grass: 0, Electric: 0 };
var gymBuffs = {};

// --- CẬP NHẬT THỨ TỰ SẮP XẾP ---
const RARITY_ORDER = {
    'Common': 1,
    'Rare': 2,
    'Epic': 3,
    'Legendary': 4,
    'Mythic': 5,
    'Secret': 6
};

// Hàm lưu trạng thái game vào localStorage
function saveGameState() {
    try {
        const data = {
            gems,
            gold,
            inventory,
            team,
            activePokeIdx,
            selectedCampaignId,
            currentWaveIdx,
            currentCampaignEnemies,
            battleRewards,
            mergeSlotMain,
            mergeSlotSub,
            battleTeamIndices,
            currentSelectingBattleSlot,
            battleSortBy,
            searchQuery,
            sortBy,
            gymProgress,
            gymBuffs,
            // Lưu playerState từ gameState
            playerState: {
                level: gameState.player.level,
                pokePoint: gameState.player.pokePoint,
                pokeGacha: gameState.player.pokeGacha
            }
        };
        localStorage.setItem('pokemonGameState', JSON.stringify(data));
        console.log('💾 Tiến trình game đã được lưu tự động!');
    } catch (e) {
        console.error('❌ Lỗi khi tự động lưu game:', e);
    }
}

// Hàm tải trạng thái game từ localStorage
function loadGameState() {
    try {
        const savedData = localStorage.getItem('pokemonGameState');
        if (!savedData) {
            console.log('ℹ️ Không tìm thấy tiến trình cũ. Bắt đầu game mới.');
            return;
        }
        const data = JSON.parse(savedData);
        if (data.gems !== undefined) gems = data.gems;
        if (data.gold !== undefined) gold = data.gold;
        if (data.inventory) inventory = data.inventory;
        if (data.team) team = data.team;
        if (data.activePokeIdx !== undefined) activePokeIdx = data.activePokeIdx;
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
        if (data.gymProgress) gymProgress = data.gymProgress;
        if (data.gymBuffs) gymBuffs = data.gymBuffs;
        
        // Tải thông tin người chơi vào gameState.player
        if (data.playerState) {
            gameState.player.level = data.playerState.level !== undefined ? data.playerState.level : 1;
            gameState.player.pokePoint = data.playerState.pokePoint !== undefined ? data.playerState.pokePoint : 1000;
            gameState.player.pokeGacha = data.playerState.pokeGacha !== undefined ? data.playerState.pokeGacha : 0;
        }
        
        console.log('📂 Tiến trình game đã được tải thành công!');

        // --- MIGRATION: Chuyển đổi Pokémon cũ sang hệ thống Kỹ năng Kép ---
        if (team && team.length > 0) {
            team.forEach(p => {
                // Khởi tạo mảng nếu chưa có
                if (!p.passives) p.passives = [];
                if (!p.talents) p.talents = [];
                // Nếu có passive cũ (object) mà passives[] vẫn trống → migrate
                if (p.passive && p.passives.length === 0) {
                    p.passives.push(JSON.parse(JSON.stringify(p.passive)));
                    console.log(`🔄 Migration: ${p.name} - Chuyển passive cũ [${p.passive.name}] vào passives[].`);
                }
            });
        }
    } catch (e) {
        console.error('❌ Lỗi khi tải tiến trình game:', e);
    }
}

// Hàm reset tiến trình game
function resetGameState() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ tiến trình để chơi lại từ đầu?")) {
        window.removeEventListener('beforeunload', saveGameState);
        localStorage.removeItem('pokemonGameState');
        location.reload();
    }
}

// Chạy tải dữ liệu khi khởi động
loadGameState();

// Thiết lập tự động lưu mỗi 5 giây
setInterval(saveGameState, 5000);

// Tự động lưu trước khi người dùng thoát hoặc reload trang
window.addEventListener('beforeunload', saveGameState);
