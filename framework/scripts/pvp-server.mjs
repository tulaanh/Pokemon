// ==========================================
// PVP WEBSOCKET SERVER
// Chạy local: npm run pvp:server
// Endpoint: ws://localhost:8080/pvp
// Deploy Render/Railway/Fly.io: dùng process.env.PORT
// ==========================================

import { WebSocket, WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT || process.env.PVP_PORT || 8080)
const PATH = '/pvp'
const TURN_MS = 30_000
const MAX_TEAM_SIZE = 3

let nextBattleNo = 1
const clients = new Map()
const queue = []
const battles = new Map()
const worldRooms = new Map()
const invites = new Map()
const INVITE_TTL_MS = 30_000
const INVITE_DISTANCE = 64

function send(ws, type, payload = {}) {
  if (ws?.readyState !== WebSocket.OPEN) return false
  ws.send(JSON.stringify({ type, payload }))
  return true
}

function safeJson(raw) {
  try {
    return JSON.parse(raw.toString())
  } catch {
    return null
  }
}

function shortId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function publicPlayer(client) {
  return {
    id: client.playerId || client.id,
    name: client.playerName || client.playerId || 'Guest',
    level: client.level || 1,
    elo: client.elo,
  }
}

function publicWorldPlayer(client) {
  return {
    id: client.playerId || client.id,
    name: client.playerName || client.playerId || 'Guest',
    level: client.level || 1,
    elo: client.elo,
    x: client.world?.x ?? 0,
    y: client.world?.y ?? 0,
    facing: client.world?.facing || 'down',
    moving: !!client.world?.moving,
    mapId: client.world?.mapId || null,
  }
}

function normalizePokemon(p, index) {
  return {
    id: p.id || `poke_${index}`,
    speciesId: p.speciesId,
    name: p.name || p.speciesId || `Pokémon ${index + 1}`,
    level: Number(p.level || 1),
    hp: Math.max(0, Number(p.hp ?? p.maxHp ?? 100)),
    maxHp: Math.max(1, Number(p.maxHp ?? p.hp ?? 100)),
    atk: Number(p.atk || 10),
    def: Number(p.def || 5),
    spa: Number(p.spa || p.atk || 10),
    spd: Number(p.spd || p.def || 5),
    spe: Number(p.spe || 10),
    type: p.type || p.types?.[0] || 'Normal',
    types: p.types || (p.type ? [p.type] : ['Normal']),
    skills: Array.isArray(p.skills) ? p.skills : [],
  }
}

function validateTeam(team) {
  if (!Array.isArray(team) || team.length !== MAX_TEAM_SIZE) {
    return `Cần đúng ${MAX_TEAM_SIZE} Pokémon để tìm trận.`
  }
  if (team.some((p) => Number(p.hp ?? 0) <= 0)) {
    return 'Đội hình có Pokémon đã hết HP.'
  }
  return ''
}

function distanceBetween(a, b) {
  return Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0))
}

function clearInvitesFor(client, notify = false) {
  for (const [id, invite] of invites) {
    if (invite.from !== client && invite.to !== client) continue
    invites.delete(id)
    if (notify) {
      const other = invite.from === client ? invite.to : invite.from
      send(other?.ws, 'pvp_invite_result', { inviteId: id, accepted: false, code: 'INVITE_CANCELLED', message: 'Lời mời PvP đã bị hủy.' })
    }
  }
}

function sendInvite(client, payload = {}) {
  const target = [...clients.values()].find((candidate) => candidate.playerId === payload.targetId)
  const error = (code, message) => send(client.ws, 'error', { code, message })
  if (!target || target === client) return error('INVITE_TARGET_INVALID', 'Không tìm thấy người chơi này.')
  if (!client.world || !target.world || client.world.mapId !== target.world.mapId || distanceBetween(client.world, target.world) > INVITE_DISTANCE) {
    return error('INVITE_TOO_FAR', 'Hai người chơi phải ở gần nhau trong cùng bản đồ.')
  }
  if (client.battleId || target.battleId || queue.some((item) => item.client === client || item.client === target)) {
    return error('INVITE_BUSY', 'Một trong hai người chơi đang bận.')
  }
  const teamError = validateTeam(payload.team)
  if (teamError) return error('TEAM_INVALID', teamError)
  client.team = payload.team.map(normalizePokemon)
  const existing = [...invites.values()].find((invite) => invite.from === client || invite.to === client || invite.from === target || invite.to === target)
  if (existing) return error('INVITE_PENDING', 'Một trong hai người chơi đang có lời mời chờ xử lý.')

  const inviteId = shortId('invite')
  const invite = { id: inviteId, from: client, to: target, expiresAt: Date.now() + INVITE_TTL_MS }
  invites.set(inviteId, invite)
  send(target.ws, 'pvp_invite_received', {
    inviteId,
    from: publicWorldPlayer(client),
    expiresAt: invite.expiresAt,
  })
  send(client.ws, 'pvp_invite_sent', { inviteId, target: publicWorldPlayer(target), expiresAt: invite.expiresAt })
  setTimeout(() => {
    if (invites.get(inviteId) !== invite) return
    invites.delete(inviteId)
    send(client.ws, 'pvp_invite_result', { inviteId, accepted: false, code: 'INVITE_EXPIRED', message: 'Lời mời PvP đã hết hạn.' })
    send(target.ws, 'pvp_invite_result', { inviteId, accepted: false, code: 'INVITE_EXPIRED', message: 'Lời mời PvP đã hết hạn.' })
  }, INVITE_TTL_MS)
}

function respondInvite(client, payload = {}) {
  const invite = invites.get(payload.inviteId)
  if (!invite || invite.to !== client) return send(client.ws, 'error', { code: 'INVITE_INVALID', message: 'Lời mời không còn hiệu lực.' })
  invites.delete(invite.id)
  const from = invite.from
  if (!payload.accepted) {
    send(from.ws, 'pvp_invite_result', { inviteId: invite.id, accepted: false, code: 'INVITE_DECLINED', message: `${publicPlayer(client).name} đã từ chối lời mời PvP.` })
    return send(client.ws, 'pvp_invite_result', { inviteId: invite.id, accepted: false, code: 'INVITE_DECLINED', message: 'Bạn đã từ chối lời mời PvP.' })
  }
  const teamError = validateTeam(payload.team)
  if (teamError) {
    send(from.ws, 'pvp_invite_result', { inviteId: invite.id, accepted: false, code: 'TEAM_INVALID', message: 'Đối thủ chưa có đội hình hợp lệ.' })
    return send(client.ws, 'error', { code: 'TEAM_INVALID', message: teamError })
  }
  client.team = payload.team.map(normalizePokemon)
  if (!from.world || !client.world || from.world.mapId !== client.world.mapId || distanceBetween(from.world, client.world) > INVITE_DISTANCE || from.battleId || client.battleId) {
    send(from.ws, 'pvp_invite_result', { inviteId: invite.id, accepted: false, code: 'INVITE_INVALID', message: 'Lời mời không còn hợp lệ.' })
    return send(client.ws, 'pvp_invite_result', { inviteId: invite.id, accepted: false, code: 'INVITE_INVALID', message: 'Lời mời không còn hợp lệ.' })
  }
  send(from.ws, 'pvp_invite_result', { inviteId: invite.id, accepted: true, code: 'INVITE_ACCEPTED', message: `${publicPlayer(client).name} đã đồng ý lời mời PvP.` })
  send(client.ws, 'pvp_invite_result', { inviteId: invite.id, accepted: true, code: 'INVITE_ACCEPTED', message: 'Bạn đã đồng ý lời mời PvP.' })
  startBattle(from, client)
}

function removeFromQueue(client) {
  const idx = queue.findIndex((item) => item.client === client)
  if (idx >= 0) queue.splice(idx, 1)
  broadcastQueue()
}

function broadcastQueue() {
  queue.forEach((item, idx) => {
    send(item.client.ws, 'queue_update', {
      position: idx + 1,
      estimatedWaitMs: Math.max(1000, idx * 1500),
    })
  })
}

function enqueue(client, format, team) {
  removeFromQueue(client)
  client.format = format || 'standard'
  client.team = team.map(normalizePokemon)
  queue.push({ client, joinedAt: Date.now() })
  broadcastQueue()
  tryMatchmaking()
}

function tryMatchmaking() {
  while (queue.length >= 2) {
    const a = queue.shift().client
    const b = queue.shift().client
    if (!clients.has(a.ws) || !clients.has(b.ws)) continue
    if (a.battleId || b.battleId) continue
    startBattle(a, b)
  }
  broadcastQueue()
}

function activePokemon(client) {
  return client.team?.[client.activeIndex || 0] || null
}

function makePublicTeam(client) {
  return (client.team || []).map((p, index) => ({
    index,
    id: p.id,
    name: p.name,
    level: p.level,
    hp: p.hp,
    maxHp: p.maxHp,
    type: p.type,
    types: p.types,
  }))
}

function makeBattleStateFor(battle, viewer) {
  const opponent = battle.players.find((p) => p !== viewer)
  return {
    battleId: battle.id,
    mode: 'online',
    turn: battle.turn,
    you: publicPlayer(viewer),
    opponent: publicPlayer(opponent),
    yourTeam: makePublicTeam(viewer),
    opponentTeam: makePublicTeam(opponent),
    yourActive: activePokemon(viewer),
    opponentActive: activePokemon(opponent),
    log: battle.log.slice(0, 20),
  }
}

function getWorldRoom(mapId) {
  if (!worldRooms.has(mapId)) {
    worldRooms.set(mapId, new Set())
  }
  return worldRooms.get(mapId)
}

function removeFromWorldRoom(client) {
  const mapId = client.world?.mapId
  if (!mapId) return
  const room = worldRooms.get(mapId)
  if (!room) return
  room.delete(client)
  if (room.size === 0) {
    worldRooms.delete(mapId)
  }
}

function broadcastWorld(mapId, type, payload, exceptClient = null) {
  const room = worldRooms.get(mapId)
  if (!room) return
  for (const client of room) {
    if (client === exceptClient) continue
    send(client.ws, type, payload)
  }
}

function sendWorldSnapshot(client, mapId) {
  const room = worldRooms.get(mapId)
  const players = [...(room || [])]
    .filter((other) => other !== client)
    .map((other) => publicWorldPlayer(other))
  send(client.ws, 'world_snapshot', {
    mapId,
    players,
  })
}

function joinWorld(client, payload = {}) {
  const mapId = payload.mapId
  if (!mapId) {
    send(client.ws, 'world_error', { code: 'WORLD_INVALID', message: 'Thiếu mapId khi vào arena.' })
    return
  }

  if (client.world?.mapId && client.world.mapId !== mapId) {
    removeFromWorldRoom(client)
    broadcastWorld(client.world.mapId, 'world_player_left', { player: publicWorldPlayer(client) }, client)
  }

  client.world = {
    mapId,
    x: Number(payload.x || 0),
    y: Number(payload.y || 0),
    facing: payload.facing || 'down',
    moving: !!payload.moving,
    lastSeen: Date.now(),
  }

  const room = getWorldRoom(mapId)
  const isNew = !room.has(client)
  room.add(client)

  sendWorldSnapshot(client, mapId)
  if (isNew) {
    broadcastWorld(mapId, 'world_player_joined', { player: publicWorldPlayer(client) }, client)
  }
}

function moveWorld(client, payload = {}) {
  const mapId = payload.mapId || client.world?.mapId
  if (!mapId) return
  if (client.world?.mapId && client.world.mapId !== mapId) {
    joinWorld(client, payload)
    return
  }

  client.world = {
    mapId,
    x: Number(payload.x || 0),
    y: Number(payload.y || 0),
    facing: payload.facing || 'down',
    moving: !!payload.moving,
    lastSeen: Date.now(),
  }

  broadcastWorld(mapId, 'world_player_moved', { player: publicWorldPlayer(client) }, client)
}

function leaveWorld(client, payload = {}) {
  const mapId = payload.mapId || client.world?.mapId
  if (!mapId) return
  const wasInRoom = client.world?.mapId === mapId
  if (wasInRoom) {
    removeFromWorldRoom(client)
    broadcastWorld(mapId, 'world_player_left', { player: publicWorldPlayer(client) }, client)
  }
  if (!payload.keepWorldState) client.world = null
}

function nextActorFor(battle, viewer) {
  return battle.current === viewer ? 'you' : 'opponent'
}

function broadcastBattle(battle, type = 'turn_result') {
  for (const player of battle.players) {
    send(player.ws, type, {
      battleId: battle.id,
      state: makeBattleStateFor(battle, player),
      nextActor: nextActorFor(battle, player),
      deadline: battle.deadline,
    })
  }
}

function firstActor(a, b) {
  const aSpe = activePokemon(a)?.spe || 0
  const bSpe = activePokemon(b)?.spe || 0
  if (aSpe > bSpe) return a
  if (bSpe > aSpe) return b
  return Math.random() < 0.5 ? a : b
}

function startBattle(a, b) {
  const battleId = shortId(`battle_${nextBattleNo++}`)
  a.activeIndex = 0
  b.activeIndex = 0

  const battle = {
    id: battleId,
    players: [a, b],
    current: firstActor(a, b),
    turn: 1,
    deadline: Date.now() + TURN_MS,
    log: [`Trận đấu giữa ${publicPlayer(a).name} và ${publicPlayer(b).name} bắt đầu!`],
  }

  a.battleId = battleId
  b.battleId = battleId
  battles.set(battleId, battle)

  send(a.ws, 'matched', { opponent: publicPlayer(b), format: a.format })
  send(b.ws, 'matched', { opponent: publicPlayer(a), format: b.format })

  for (const player of battle.players) {
    send(player.ws, 'battle_start', {
      battleId,
      opponent: publicPlayer(battle.players.find((p) => p !== player)),
      state: makeBattleStateFor(battle, player),
      nextActor: nextActorFor(battle, player),
      deadline: battle.deadline,
    })
  }
}

function getAliveIndex(client) {
  return client.team.findIndex((p) => p.hp > 0)
}

function calcDamage(attacker, defender, action) {
  const atk = action.type === 'skill' && Number(action.skillIndex || 0) % 2 === 1 ? attacker.spa : attacker.atk
  const def = action.type === 'skill' && Number(action.skillIndex || 0) % 2 === 1 ? defender.spd : defender.def
  const base = Math.max(5, Math.round(atk * 1.25 - def * 0.55))
  const variance = 0.85 + Math.random() * 0.3
  return Math.max(1, Math.round(base * variance))
}

function endBattle(battle, winner, reason) {
  const loser = battle.players.find((p) => p !== winner)
  winner.elo += 16
  loser.elo = Math.max(0, loser.elo - 16)

  send(winner.ws, 'battle_end', {
    battleId: battle.id,
    winner: 'you',
    eloChange: { you: 16, opponent: -16 },
    replayId: shortId('replay'),
    opponent: publicPlayer(loser),
    reason,
  })
  send(loser.ws, 'battle_end', {
    battleId: battle.id,
    winner: 'opponent',
    eloChange: { you: -16, opponent: 16 },
    replayId: shortId('replay'),
    opponent: publicPlayer(winner),
    reason,
  })

  for (const player of battle.players) player.battleId = null
  battles.delete(battle.id)
}

function handleTurnAction(client, payload) {
  const battle = battles.get(payload?.battleId || client.battleId)
  if (!battle) {
    send(client.ws, 'error', { code: 'NO_BATTLE', message: 'Chưa có trận PvP đang chạy.' })
    return
  }
  if (battle.current !== client) {
    send(client.ws, 'error', { code: 'NOT_YOUR_TURN', message: 'Chưa tới lượt của bạn.' })
    return
  }

  const opponent = battle.players.find((p) => p !== client)
  const action = payload?.action || {}
  if (action.type === 'forfeit') {
    battle.log.unshift(`${publicPlayer(client).name} xin thua.`)
    endBattle(battle, opponent, 'forfeit')
    return
  }

  if (action.type === 'switch') {
    const nextIndex = getAliveIndex(client)
    if (nextIndex >= 0) client.activeIndex = nextIndex
    battle.log.unshift(`${publicPlayer(client).name} đổi Pokémon.`)
  } else {
    const attacker = activePokemon(client)
    const defender = activePokemon(opponent)
    const damage = calcDamage(attacker, defender, action)
    defender.hp = Math.max(0, defender.hp - damage)
    battle.log.unshift(`${attacker.name} gây ${damage} sát thương lên ${defender.name}.`)

    if (defender.hp <= 0) {
      battle.log.unshift(`${defender.name} đã gục ngã.`)
      const nextIdx = getAliveIndex(opponent)
      if (nextIdx < 0) {
        endBattle(battle, client, 'all_fainted')
        return
      }
      opponent.activeIndex = nextIdx
      battle.log.unshift(`${publicPlayer(opponent).name} đưa ${activePokemon(opponent).name} ra sân.`)
    }
  }

  battle.turn += 1
  battle.current = opponent
  battle.deadline = Date.now() + TURN_MS
  broadcastBattle(battle)
}

function disconnectClient(client) {
  removeFromQueue(client)
  clearInvitesFor(client, true)
  leaveWorld(client, { mapId: client.world?.mapId, keepWorldState: false })
  if (!client.battleId) return

  const battle = battles.get(client.battleId)
  if (!battle) return
  const opponent = battle.players.find((p) => p !== client)
  if (opponent?.ws?.readyState === WebSocket.OPEN) {
    send(opponent.ws, 'opponent_disconnected', { battleId: battle.id })
    endBattle(battle, opponent, 'disconnect')
  } else {
    battles.delete(battle.id)
  }
}

const wss = new WebSocketServer({ port: PORT, path: PATH })

wss.on('connection', (ws, req) => {
  const client = {
    id: shortId('client'),
    ws,
    playerId: 'guest',
    playerName: 'Guest',
    level: 1,
    elo: 1000,
    team: [],
    format: 'standard',
    activeIndex: 0,
    battleId: null,
    world: null,
  }
  clients.set(ws, client)
  console.log(`[PvP] Client connected: ${client.id} from ${req.socket.remoteAddress}`)

  ws.on('message', (raw) => {
    const msg = safeJson(raw)
    if (!msg?.type) return

    const { type, payload = {} } = msg
    switch (type) {
       case 'auth':
         client.playerId = payload.playerId || 'guest'
         client.playerName = String(payload.playerName || payload.playerId || 'Guest').slice(0, 24)
         client.level = Math.max(1, Number(payload.level) || 1)
         send(ws, 'queue_update', { position: 0, estimatedWaitMs: 0 })
         console.log(`[PvP] Auth: ${client.playerId}`)
         break
       case 'update_level':
         client.level = Math.max(1, Number(payload.level) || 1)
         console.log(`[PvP] Level updated: ${client.playerId} -> ${client.level}`)
         break
       case 'ping':
        send(ws, 'pong')
        break
      case 'matchmake': {
        const error = validateTeam(payload.team)
        if (error) {
          send(ws, 'error', { code: 'TEAM_INVALID', message: error })
          return
        }
        if (client.battleId) {
          send(ws, 'error', { code: 'ALREADY_IN_BATTLE', message: 'Bạn đang trong một trận PvP.' })
          return
        }
        enqueue(client, payload.format, payload.team)
        break
      }
      case 'cancel_matchmake':
        removeFromQueue(client)
        send(ws, 'queue_update', { position: 0, estimatedWaitMs: 0 })
        break
      case 'pvp_invite':
        sendInvite(client, payload)
        break
      case 'pvp_invite_response':
        respondInvite(client, payload)
        break
      case 'turn_action':
        handleTurnAction(client, payload)
        break
      case 'reconnect':
        if (client.battleId) {
          const battle = battles.get(client.battleId)
          if (battle) broadcastBattle(battle)
        }
        break
      case 'world_join':
        joinWorld(client, payload)
        break
      case 'world_move':
        moveWorld(client, payload)
        break
      case 'world_leave':
        leaveWorld(client, payload)
        break
      default:
        send(ws, 'error', { code: 'UNKNOWN_MESSAGE', message: `Server chưa hỗ trợ message: ${type}` })
    }
  })

  ws.on('close', () => {
    disconnectClient(client)
    clients.delete(ws)
    console.log(`[PvP] Client disconnected: ${client.id}`)
  })
})

wss.on('listening', () => {
  console.log(`[PvP] Server đang chạy tại ws://localhost:${PORT}${PATH}`)
  console.log('[PvP] Local: mở 2 tab/trình duyệt, chọn 3 Pokémon ở mỗi bên rồi tìm trận.')
})

wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[PvP] Port ${PORT} đang được dùng. Hãy tắt process cũ hoặc chạy: $env:PVP_PORT=8081; npm run pvp:server`)
  } else {
    console.error('[PvP] Server error:', err)
  }
  process.exitCode = 1
})

function shutdown() {
  console.log('\n[PvP] Đang tắt server...')
  for (const ws of clients.keys()) ws.close()
  wss.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
