// Key dùng để lưu trong localStorage (đặt tên tùy ý)
const SAVE_KEY = 'POKEMON_GAME_SAVE_DATA';

// 1. OBJECT CHỨA TIẾN TRÌNH GAME
let gameState = {
    player: {
        name: 'Huấn Luyện Viên',
        gold: 500,
        diamonds: 10
    },
    // Danh sách Pokémon người chơi sở hữu
    myPokemons: [], 
    // Đội hình 3 Pokémon đang xuất chiến (lưu tên hoặc ID)
    activeTeam: [], 
    // Các chỉ số phụ khác
    stats: {
        totalBattles: 0,
        wins: 0
    }
};

// ==========================================
// 2. CÁC HÀM XỬ LÝ LƯU & TẢI
// ==========================================

/**
 * Hàm Lưu game
 */
function saveGame() {
    try {
        // Chuyển Object dữ liệu thành chuỗi JSON
        const dataString = JSON.stringify(gameState);
        // Lưu vào bộ nhớ trình duyệt
        localStorage.setItem(SAVE_KEY, dataString);
        console.log('💾 Đã lưu tiến trình game thành công!');
        return true;
    } catch (error) {
        console.error('❌ Lỗi khi lưu game:', error);
        return false;
    }
}

/**
 * Hàm Tải dữ liệu game khi vào lại
 */
function loadGame() {
    try {
        const savedData = localStorage.getItem(SAVE_KEY);
        
        // Nếu chưa có dữ liệu lưu trước đó -> Trả về false để tạo game mới
        if (!savedData) {
            console.log('ℹ️ Không tìm thấy dữ liệu cũ. Khởi tạo game mới.');
            return false;
        }

        // Giải mã chuỗi JSON thành Object
        const parsedData = JSON.parse(savedData);
        
        // Cập nhật lại gameState (gộp dữ liệu cũ để tránh mất thuộc tính nếu update game)
        gameState = { ...gameState, ...parsedData };
        
        console.log('📂 Đã tải tiến trình game thành công!', gameState);
        return true;
    } catch (error) {
        console.error('❌ Lỗi khi tải dữ liệu game:', error);
        return false;
    }
}

/**
 * Hàm Xóa dữ liệu (Chơi lại từ đầu)
 */
function resetSave() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ tiến trình để chơi lại từ đầu?")) {
        localStorage.removeItem(SAVE_KEY);
        location.reload(); // Load lại trang
    }
}