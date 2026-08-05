// ==========================================
// DANH SÁCH CÁC CHẾ ĐỘ TRONG GAME (DÙNG CHUNG)
// Nguồn dữ liệu cho App.vue (activeModeInfo) và ModesIntro.vue
// ==========================================

export const categories = [
  {
    id: 'collection',
    icon: '🎮',
    label: 'Thu Thập & Đội Hình',
    desc: 'Quay Gacha, quản lý đội hình và hợp nhất',
    modes: [
      { id: 'gacha', icon: '🎁', label: 'Gacha' },
      { id: 'roster', icon: '🎒', label: 'Đội Hình' },
      { id: 'merge', icon: '🧬', label: 'Hợp Nhất' },
    ],
  },
  {
    id: 'battle',
    icon: '⚔️',
    label: 'Chiến Đấu',
    desc: 'Chiến dịch, Story, Gym và leo tháp',
    modes: [
      { id: 'campaign', icon: '⚔️', label: 'Chiến Dịch' },
      { id: 'story', icon: '📖', label: 'Story' },
      { id: 'gym', icon: '🏟️', label: 'Phòng Gym' },
      { id: 'tower', icon: '🗼', label: 'Leo Tháp' },
    ],
  },
  {
    id: 'pvp',
    icon: '🌐',
    label: 'Đấu Trường Trực Tuyến',
    desc: 'PvP Multiplayer, xếp hạng và lịch sử',
    modes: [
      { id: 'pvp_lobby', icon: '⚔️', label: 'Tìm Trận' },
      { id: 'pvp_ranking', icon: '🏆', label: 'Bảng Xếp Hạng' },
      { id: 'pvp_history', icon: '📜', label: 'Lịch Sử Đấu' },
    ],
  },
  {
    id: 'items',
    icon: '🛒',
    label: 'Vật Phẩm',
    desc: 'Mua sắm và quản lý vật phẩm',
    modes: [
      { id: 'shop', icon: '🛒', label: 'Cửa Hàng' },
      { id: 'inventory', icon: '📦', label: 'Kho Đồ' },
    ],
  },
  {
    id: 'events',
    icon: '📅',
    label: 'Sự Kiện',
    desc: 'Điểm danh và nhiệm vụ hằng ngày',
    modes: [
      { id: 'daily', icon: '📅', label: 'Hằng Ngày' },
    ],
  },
]
