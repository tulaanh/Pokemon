// ==========================================
// NHÂN VẬT NGƯỜI CHƠI (Nam / Nữ)
// Sprite sheet 144×32, 9 frame 16×32 (layout giống player_red.png:
// 0=đứng xuống, 1=đứng lên, 2=đứng trái/phải flip, 3-8=walk cycles).
// ==========================================

export const CHARACTERS = {
  red: {
    id: 'red',
    name: 'Red',
    gender: 'male',
    label: 'Nam',
    emoji: '👦',
    sprite: '/images/map/player_red.png',
  },
  leaf: {
    id: 'leaf',
    name: 'Leaf',
    gender: 'female',
    label: 'Nữ',
    emoji: '👧',
    sprite: '/images/map/player_leaf.png',
  },
}

export function getCharacter(id) {
  return CHARACTERS[id] || CHARACTERS.red
}

// Texture key duy nhất theo nhân vật → tránh cache chéo khi đổi nhân vật giữa phiên
export function getCharacterTextureKey(id) {
  return `player_${getCharacter(id).id}`
}
