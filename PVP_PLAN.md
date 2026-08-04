# Kế Hoạch Triển Khai PvP Online (Đấu Trường Arena)

## 🎯 **Luồng Người Chơi (Flow)**
```
Thị trấn (Town) 
  → Đi đến cửa Arena (ô io 56,46 / 57,46) 
  → Chuyển map sang **Arena** (mapId: 'arena')
  → Tại Arena: Tìm NPC **James** (🌐) 
  → Mở menu James → Chọn: 
      • ⚔️ Tìm Trận PvP (Mở PvpLobbyView)
      • 🏆 Bảng Xếp Hạng (Mở PvpRankingView)
      • 📜 Lịch Sử Đấu (Mở PvpHistoryView)
```

---

## ✅ **Đã Hoàn Thành**

| File | Mô Tả |
|------|-------|
| `src/game/maps.js` | Đăng ký map `arena` (20×20 tiles, zoom 2), transition từ town, spots (James NPC + cửa ra) |
| `src/game/quests.js` | Thêm NPC `James` với `actions: ['pvp_lobby', 'pvp_ranking', 'pvp_history']` |
| `src/game/store.js` | State `pvp: { elo, wins, losses, draws, streak, bestStreak, history[], seasonRewards }` |
| `src/game/pvp/wsClient.js` | WebSocket client: connect, auth, matchmake, battle actions, heartbeat, reconnect |
| `src/views/PvpLobbyView.vue` | UI đầy đủ: chọn team 3 Pokémon, queue, match found, history gần đây |
| `src/components/map/WorldMap.vue` | Menu James xử lý 3 action PvP |
| `src/App.vue` | Category "Đấu Trường Trực Tuyến" + routes cho 3 mode PvP |

---

## 📋 **Cần Làm Tiếp (Theo Thứ Tự Ưu Tiên)**

### 1. **PvpRankingView.vue** (UI - Mock Data)
- Bảng xếp hạng ELO (Top 100)
- Tab: Toàn cầu / Tuần / Mùa
- Hiển thị: Rank, Tên, ELO, Thắng/Thua, Tỷ lệ %, Chuỗi thắng
- Phần "Thông tin của bạn" (rank hiện tại, ELO, phần thưởng mùa)

### 2. **PvpHistoryView.vue** (UI - Từ `store.pvp.history`)
- Danh sách trận đấu (replay ID, ngày, kết quả, ELO thay đổi, đối thủ)
- Nút "Xem lại" (chờ backend replay system)
- Filter: Tất cả / Thắng / Thua / Hòa

### 3. **PvpBattleView.vue** (Core - Kế thừa BattleArena)
- Kết nối WebSocket battle session
- Server-authoritative turns (client gửi action, server broadcast state)
- Hiển thị timer lượt, trạng thái kết nối đối thủ
- Xử lý disconnect/reconnect (30s window)
- Forfeit button

### 4. **Node.js WebSocket Server** (`server/`)
```
server/
├── package.json
├── src/
│   ├── index.ts           # Entry point
│   ├── ws.ts              # WebSocket handler
│   ├── matchmaking.ts     # Queue + ELO pairing
│   ├── battle/
│   │   ├── session.ts     # Battle state machine
│   │   ├── engine.ts      # Damage, status, turn logic (sync client)
│   │   └── rng.ts         # Shared seed RNG (xorshift128+)
│   ├── player/
│   │   ├── profile.ts     # ELO, stats, team validation
│   │   └── repository.ts  # In-memory / Redis
│   └── replay/
│       └── store.ts       # Battle log storage
└── tsconfig.json
```

**Message Protocol:**
```
C→S: {type: 'matchmake', payload: {format, team[]}}
S→C: {type: 'matched', payload: {battleId, opponent, seed}}
C→S: {type: 'turn_action', payload: {battleId, action}}
S→C: {type: 'turn_result', payload: {battleId, state, nextActor, deadline}}
S→C: {type: 'battle_end', payload: {winner, eloChange, replayId}}
```

### 5. **Arena Map - Tiled Objects** (Cần chỉnh trong Tiled → Export lại arena.json)
- **Objectgroup `doors`**: 2 object rect ở bottom (col 9-10, row 19) → `to: 'town', toSpawn: TOWN_HOUSE_DOOR_SPAWN`
- **Objectgroup `spawns`**: object `start` tại (160, 160), object `james_npc` tại (160, 80)
- **Objectgroup `npc`**: object `James` tại (160, 80) - để worldScene buildNpcPoints detect

### 6. **src/game/pvp/battleSync.js**
- Client-side prediction (optimistic UI)
- Server reconciliation (rollbacks nếu state khác)
- Interpolation cho smooth HP/MP animation

### 7. **Config & Deploy**
- `.env`: `VITE_PVP_WS_URL=ws://localhost:8080/pvp`
- Dockerfile cho server
- Railway/Render/Fly.io deploy config

---

## 🔧 **Build Verification**
```bash
cd framework
npm run build
```

---

## 📝 **Ghi Chú Quan Trọng**
- **Arena là map online duy nhất** - mọi tính năng PvP đều truy cập qua James tại Arena
- **Backend server-authoritative** - client không tự tính damage, chỉ gửi action
- **Shared RNG seed** - đảm bảo replay deterministic
- **ELO system**: Base 1000, K-factor 32, season reset hàng tháng
- **Team validation**: 3 Pokémon, HP > 0, species clause (optional)