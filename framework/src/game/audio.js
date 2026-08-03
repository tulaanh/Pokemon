// ==========================================
// AUDIO MANAGER — NHẠC NỀN THEO NGỮ CẢNH
// Dùng 1 Audio element duy nhất (mỗi lúc chỉ tải 1 bản).
// Hỗ trợ PLAYLISTS: phát tuần tự, lặp vô hạn (hết bài quay lại đầu).
// Setting đọc/ghi qua store.settings (musicEnabled / musicVolume).
// Lưu ý: trình duyệt chặn autoplay → App phải gọi playMusic()
// từ thao tác đầu tiên của người dùng (pointerdown/keydown).
// ==========================================
import { store } from './store.js'

export const TRACKS = {
  map: '/music/map.mp3',
  battle: '/music/battle.mp3',
  gacha: '/music/gacha.mp3',
}

// Playlist nhạc map (file do người dùng tự đưa vào public/music/ngot/).
// Nếu thư mục/chưa có file → tự fallback về TRACKS.map.
// Đặt tên file không dấu để tránh lỗi URL encoding.
export const PLAYLISTS = {
  map: ['/music/ngot/thay_chua.mp3', '/music/ngot/lan_cuoi.mp3', '/music/ngot/hay_la.mp3'],
}

let audio = null
let current = null
let resolvedPlaylist = null
let playlistIdx = 0
let sourceCache = {} // key -> [urls] đã kiểm tra tồn tại

function ensureAudio() {
  if (audio) return audio
  audio = new Audio()
  audio.loop = false
  audio.preload = 'auto'
  audio.volume = store.settings.musicVolume ?? 0.5
  // Hết bài → chuyển bài kế tiếp (playlist) hoặc lặp lại (bài đơn);
  // loop=false để sự kiện 'ended' được phát, tự quản lý vòng lặp ở đây
  audio.addEventListener('ended', () => {
    if (!current) return
    if (resolvedPlaylist && resolvedPlaylist.length > 1) {
      playlistIdx = (playlistIdx + 1) % resolvedPlaylist.length
    }
    audio.src = resolvedPlaylist ? resolvedPlaylist[playlistIdx] : TRACKS[current]
    if (musicEnabled()) audio.play().catch(() => {})
  })
  // File hỏng / bị chặn tải → dừng im lặng, không spam lỗi
  audio.addEventListener('error', () => {
    audio.pause()
    current = null
    resolvedPlaylist = null
  })
  return audio
}

async function fileExists(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' })
    return r.ok
  } catch {
    return false
  }
}

// Lấy danh sách URL thực tế của một track: playlist nếu có file, ngược lại track đơn
async function resolveSource(key) {
  if (sourceCache[key]) return sourceCache[key]
  const pl = PLAYLISTS[key]
  let urls = null
  if (pl && pl.length) {
    const results = await Promise.all(pl.map(fileExists))
    urls = pl.filter((_, i) => results[i])
  }
  sourceCache[key] = urls && urls.length ? urls : [TRACKS[key]]
  return sourceCache[key]
}

export function musicEnabled() {
  return !!store.settings.musicEnabled
}

// Chuyển nhạc theo key ('map' | 'battle' | 'gacha'); cùng key & đang phát thì giữ nguyên
export async function playMusic(key) {
  if (!key || !TRACKS[key]) return
  const a = ensureAudio()
  const same = current === key
  current = key
  if (!musicEnabled()) return
  if (same && !a.paused) return
  const urls = await resolveSource(key)
  resolvedPlaylist = urls
  playlistIdx = 0
  a.src = urls[0]
  a.play().catch(() => {})
}

export function stopMusic() {
  if (!audio) return
  audio.pause()
}

// Đồng bộ theo trạng thái bật/tắt hiện tại
export function syncMusic() {
  if (musicEnabled()) {
    if (current) playMusic(current)
  } else {
    stopMusic()
  }
}

export function setMusicEnabled(on) {
  store.settings.musicEnabled = !!on
  syncMusic()
}

export function toggleMusic() {
  setMusicEnabled(!musicEnabled())
  return musicEnabled()
}

export function setMusicVolume(v) {
  store.settings.musicVolume = Math.max(0, Math.min(1, Number(v) || 0))
  if (audio) audio.volume = store.settings.musicVolume
}
