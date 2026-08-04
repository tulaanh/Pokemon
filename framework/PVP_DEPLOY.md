# Deploy PvP Online cho Netlify

Netlify chỉ host frontend Vue/Vite. Để nhiều người cùng chơi PvP real-time, cần deploy **PvP WebSocket server** riêng rồi trỏ frontend Netlify tới server đó.

## Kiến trúc

```txt
Người chơi A/B
  -> Frontend Netlify
  -> wss://your-pvp-server/pvp
  -> PvP WebSocket Server
```

Frontend đọc URL server từ biến môi trường:

```env
VITE_PVP_WS_URL=wss://your-pvp-server.onrender.com/pvp
```

## Chạy local

Mở 2 terminal trong thư mục `framework/`.

Terminal 1:

```powershell
npm run dev
```

Terminal 2:

```powershell
npm run pvp:server
```

Server local chạy tại:

```txt
ws://localhost:8080/pvp
```

Để test 2 người thật trên cùng máy, mở 2 trình duyệt khác nhau hoặc 1 cửa sổ ẩn danh, chọn đủ 3 Pokémon ở mỗi bên rồi bấm tìm trận.

## Deploy backend lên Render

1. Push repo lên GitHub.
2. Vào Render → New → Web Service.
3. Chọn repo.
4. Cấu hình:

```txt
Runtime: Node
Root Directory: framework
Build Command: npm install
Start Command: npm run pvp:server
```

Server tự dùng `process.env.PORT` do Render cấp.

Sau khi deploy, Render sẽ cho URL dạng:

```txt
https://your-pvp-server.onrender.com
```

WebSocket URL cần dùng trong frontend là:

```txt
wss://your-pvp-server.onrender.com/pvp
```

## Cấu hình Netlify frontend

Trong Netlify:

1. Site settings → Environment variables.
2. Thêm biến:

```env
VITE_PVP_WS_URL=wss://your-pvp-server.onrender.com/pvp
```

3. Redeploy site.

## Lưu ý production

Server hiện tại đã ghép 2 người thật và xử lý lượt/damage cơ bản ở backend, nhưng vẫn là bản khởi đầu. Để production nghiêm túc nên bổ sung:

- Database lưu ranking/history toàn server.
- Xác thực tài khoản/playerId.
- Validate đội hình theo dữ liệu server thay vì tin hoàn toàn từ client.
- Redis nếu muốn scale nhiều instance.
- Reconnect window thay vì xử thua ngay khi mất kết nối.
- Battle logic đầy đủ dùng chung công thức với `src/game/battle.js`.
