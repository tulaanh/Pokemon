// ==========================================
// PVP WEBSOCKET CLIENT
// Kết nối real-time đến server PvP (Node.js/Go)
// ==========================================

import { store } from '../store.js'
import { showToast } from '../../components/ui/toast.js'

// Cấu hình server - thay đổi khi deploy
const WS_URL = import.meta.env.VITE_PVP_WS_URL || 'ws://localhost:8080/pvp'

// Trạng thái kết nối
let ws = null
let connectPromise = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_MS = 3000
let heartbeatInterval = null
const HEARTBEAT_INTERVAL_MS = 15000
let manualDisconnect = false
let connectedOnce = false

// Event callbacks (được set bởi UI components)
const callbacks = {
  onOpen: null,
  onClose: null,
  onError: null,
  onMatched: null,
  onBattleStart: null,
  onTurnResult: null,
  onBattleEnd: null,
  onQueueUpdate: null,
  onOpponentDisconnected: null,
  onErrorMsg: null,
}

const worldCallbacks = {
  onWorldSnapshot: null,
  onWorldPlayerJoined: null,
  onWorldPlayerMoved: null,
  onWorldPlayerLeft: null,
  onWorldError: null,
}

// Gửi message nếu kết nối đang mở
function send(type, payload = {}) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }))
    return true
  }
  return false
}

// Xử lý message từ server
function handleMessage(event) {
  try {
    const msg = JSON.parse(event.data)
    const { type, payload } = msg

    switch (type) {
      case 'matched':
        store.pvp.matchmaking = false
        callbacks.onMatched?.(payload)
        break
      case 'battle_start':
        callbacks.onBattleStart?.(payload)
        break
      case 'turn_result':
        callbacks.onTurnResult?.(payload)
        break
      case 'battle_end':
        // Cập nhật ELO và history
        if (payload.eloChange) {
          store.pvp.elo += payload.eloChange.you
          store.pvp.wins += payload.winner === 'you' ? 1 : 0
          store.pvp.losses += payload.winner === 'opponent' ? 1 : 0
          store.pvp.draws += payload.winner === 'draw' ? 1 : 0
          if (payload.winner === 'you') {
            store.pvp.streak++
            store.pvp.bestStreak = Math.max(store.pvp.bestStreak, store.pvp.streak)
          } else {
            store.pvp.streak = 0
          }
        }
        if (payload.replayId) {
          store.pvp.history.unshift({
            id: payload.replayId,
            date: Date.now(),
            result: payload.winner,
            eloChange: payload.eloChange?.you,
            opponent: payload.opponent,
          })
          if (store.pvp.history.length > 50) store.pvp.history.pop()
        }
        callbacks.onBattleEnd?.(payload)
        break
      case 'queue_update':
        callbacks.onQueueUpdate?.(payload)
        break
      case 'opponent_disconnected':
        callbacks.onOpponentDisconnected?.(payload)
        break
      case 'error':
        callbacks.onErrorMsg?.(payload)
        showToast(`❌ ${payload.message}`, 'error')
        break
      case 'pong':
        // Heartbeat response
        break
      case 'world_snapshot':
        worldCallbacks.onWorldSnapshot?.(payload)
        break
      case 'world_player_joined':
        worldCallbacks.onWorldPlayerJoined?.(payload)
        break
      case 'world_player_moved':
        worldCallbacks.onWorldPlayerMoved?.(payload)
        break
      case 'world_player_left':
        worldCallbacks.onWorldPlayerLeft?.(payload)
        break
      case 'world_error':
        worldCallbacks.onWorldError?.(payload)
        showToast(`❌ ${payload.message || 'Không thể đồng bộ người chơi ở arena.'}`, 'error')
        break
      default:
        console.warn('[PvP WS] Unknown message type:', type)
    }
  } catch (e) {
    console.error('[PvP WS] Message parse error:', e)
  }
}

// Kết nối WebSocket
export function connectPvP() {
  if (ws?.readyState === WebSocket.OPEN) {
    return Promise.resolve()
  }
  if (ws?.readyState === WebSocket.CONNECTING && connectPromise) {
    return connectPromise
  }

  manualDisconnect = false
  connectPromise = new Promise((resolve, reject) => {
    let settled = false
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('[PvP WS] Connected')
      reconnectAttempts = 0
      connectedOnce = true
      store.pvp.connected = true
      // Gửi authenticate (playerId từ store)
      send('auth', { playerId: store.gameState.player.playerName || 'guest' })
      startHeartbeat()
      callbacks.onOpen?.()
      settled = true
      resolve()
    }

    ws.onmessage = handleMessage

    ws.onerror = (err) => {
      console.warn(`[PvP WS] Không thể kết nối ${WS_URL}. Hãy bật PvP server hoặc thử lại sau.`, err)
      callbacks.onError?.(err)
      if (!settled && ws.readyState !== WebSocket.OPEN) {
        settled = true
        reject(new Error(`Không thể kết nối server PvP tại ${WS_URL}`))
      }
    }

    ws.onclose = () => {
      console.log('[PvP WS] Disconnected')
      store.pvp.connected = false
      store.pvp.matchmaking = false
      stopHeartbeat()
      callbacks.onClose?.()
      const shouldReconnect = !manualDisconnect && connectedOnce
      ws = null
      if (!settled) {
        settled = true
        reject(new Error(`Server PvP chưa hoạt động tại ${WS_URL}`))
      }
      if (shouldReconnect) attemptReconnect()
      connectPromise = null
    }
  })

  return connectPromise
}

// Thử kết nối lại
function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    showToast('❌ Mất kết nối server PvP. Vui lòng tải lại trang.', 'error')
    return
  }
  reconnectAttempts++
  const delay = RECONNECT_DELAY_MS * reconnectAttempts
  showToast(`🔄 Đang kết nối lại... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, 'info')
  setTimeout(() => connectPvP().catch(() => {}), delay)
}

// Heartbeat để giữ kết nối
function startHeartbeat() {
  stopHeartbeat()
  heartbeatInterval = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      send('ping')
    }
  }, HEARTBEAT_INTERVAL_MS)
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

// Đăng ký callbacks từ UI
export function setPvPCallbacks(cb) {
  Object.assign(callbacks, cb)
}

// Hủy callbacks (khi unmount component)
export function clearPvPCallbacks() {
  Object.keys(callbacks).forEach(k => { callbacks[k] = null })
}

// Đăng ký callbacks cho chế độ đi lại trong arena
export function setWorldCallbacks(cb) {
  Object.assign(worldCallbacks, cb)
}

export function clearWorldCallbacks() {
  Object.keys(worldCallbacks).forEach(k => { worldCallbacks[k] = null })
}

// === API CHO UI ===

// Tìm trận (matchmaking)
export function findMatch(format = 'standard', team) {
  store.pvp.matchmaking = true
  send('matchmake', { format, team })
}

// Hủy tìm trận
export function cancelMatch() {
  store.pvp.matchmaking = false
  send('cancel_matchmake')
}

// Gửi hành động trong trận đấu
export function sendBattleAction(battleId, action) {
  send('turn_action', { battleId, action })
}

// Xin thua (forfeit)
export function forfeitBattle(battleId) {
  send('turn_action', { battleId, action: { type: 'forfeit' } })
}

// Kết nối lại vào trận đang chơi
export function reconnectBattle(battleId) {
  send('reconnect', { battleId, playerId: store.gameState.player.playerName || 'guest' })
}

// Vào/ra arena realtime
export function joinWorldMap(mapId, position = {}) {
  return send('world_join', {
    mapId,
    x: Number(position.x || 0),
    y: Number(position.y || 0),
    facing: position.facing || 'down',
    moving: !!position.moving,
  })
}

export function sendWorldMove(mapId, position = {}) {
  return send('world_move', {
    mapId,
    x: Number(position.x || 0),
    y: Number(position.y || 0),
    facing: position.facing || 'down',
    moving: !!position.moving,
  })
}

export function leaveWorldMap(mapId) {
  return send('world_leave', { mapId })
}

// Ngắt kết nối hoàn toàn
export function disconnectPvP() {
  manualDisconnect = true
  stopHeartbeat()
  if (ws) {
    ws.close()
    ws = null
  }
  store.pvp.connected = false
  store.pvp.matchmaking = false
  clearPvPCallbacks()
}

// Kiểm tra kết nối
export function isConnected() {
  return ws?.readyState === WebSocket.OPEN
}