# Vua Siêu Thị Phố — PWA v7.2

## Mới trong 7.2 — Màn hình ngang + kệ sắc nét (theo ảnh xem trước màn ngang đã chốt, chưa đẩy GitHub)

- **Chơi màn hình ngang:** game giờ chơi ở màn hình ngang cho rộng rãi. Trên điện thoại dọc hiện lời nhắc thân thiện "Xoay ngang điện thoại để chơi" (có nút "Chơi dọc vẫn được" để tắt nhắc), màn dọc không bị vỡ. HUD và dock gọn lại khi màn ngang thấp để sân chơi 16:9 được cao nhất. App cài đặt (manifest) mở ở hướng ngang.
- **Kệ vẽ lại sắc nét:** kệ gỗ 4 tầng rõ ràng, mỗi món vẽ hình riêng — rau xanh, táo/cam, gói mì, ổ bánh mì, hộp sữa, chai nước, kẹo bọc giấy, túi snack — thay cho ô màu chung chung. Sàn gỗ có mối nối ván so le, cửa kính rộng 3 ô phía sau nhìn ra phố, có chậu cây 2 bên.
- **Quầy rau củ tròn giữa sàn** vẽ tay hoàn toàn (táo, cam, chuối, nho, súp lơ, cà rốt trên bàn gỗ tròn) và **có va chạm thật** như kệ — quản lý và khách đi vòng quanh, không đi xuyên qua, không bị kẹt khi chạm vào giữa quầy.
- **Quầy POS gỗ** chi tiết hơn: băng chuyền có vạch, máy tính tiền có màn hình và nút bấm. Nhân vật to hơn 15% (90px, vẫn sheet đi bộ 8 khung).
- **Màn hình bắt đầu** dùng ảnh xem trước màn ngang `assets/img/preview-landscape.webp` làm nền.
- Phiên bản: `SAVE_VERSION 7.2`, cùng `SAVE_KEY vua-sieu-thi-pwa-v7` nên save 7.0/7.1/7.1.2/7.1.3 vẫn load được. Lối chơi, nhiệm vụ, chương, ngân hàng, cài đặt, joystick/D-pad, sửa lỗi tính tiền (7.1.2) và giữ giờ trong ngày (7.1.3) giữ nguyên.
- Lưu ý thật: engine vẫn là canvas 2D (không phải 3D thật như ảnh xem trước). Bản này chưa chơi thử bằng trình duyệt thật trên điện thoại.

## Sửa lỗi 7.1.3 (3 lỗi nhỏ còn lại sau 7.1.2, chưa đẩy GitHub)
- Giờ trong ngày được lưu vào save (`minuteOfDay` 420–1320): nút Tiếp tục dùng `resumeDay()` thay vì `startDay()`, nên tải lại game không còn về 7:00; ngày mới / phá sản vẫn bắt đầu 7:00. Save 7.0/7.1/7.1.2 vẫn load được (thiếu trường thì mặc định 7:00).
- Màn dọc: bỏ `aspect-ratio: 4/3` ở `#stageWrap`, stage giãn hết chiều cao còn lại; canvas 16:9 vẫn giữ tỉ lệ nhưng khoảng thừa dùng màu nền ấm `#f3e2b8` thay cho 2 dải đen. Lưu ý thật: cảnh chơi vẫn là 16:9, chưa vẽ lại cảnh dọc.
- Modal Kho: `.modal-head` cố định (`flex-shrink: 0`), `.modal-body` co đúng trong card (`flex: 1; min-height: 0`), mở modal luôn cuộn về đầu — món đầu không còn bị tiêu đề che.

Game quản lý siêu thị pixel art, chơi offline hoàn toàn, cài được như app trên điện thoại / máy tính. Từ tạp hóa hẻm nhỏ lên đế chế bán lẻ qua 10 chương, rồi mở **Chế Độ Tự Do**.

## Sửa lỗi 7.1.2 (chơi thử bản live 21/11/2026, trước khi đẩy GitHub)

- **Tính tiền (lỗi nặng nhất):** vòng lặp game gọi `setMoveDir(0,0)` mỗi khung hình nên lệnh chạm POS / chạm kệ / bấm Space bị hủy ngay — quản lý không bao giờ đi tới quầy, tiền không tăng, khách xếp hàng rồi bỏ đi giận dữ. Đã sửa `js/game.js` (`setMoveDir` giữ lại điểm chạm đang chờ) — kiểm chứng bằng mô phỏng Node với file thật: quản lý đi tới POS và tính tiền 1 khách xếp hàng (tiền tăng đúng giá bán).
- **Nút Cài Đặt bị cắt:** 6 nút dock × min-width 64px vượt quá màn hình 390px. Đã sửa `css/style.css` cho nút co lại vừa đủ 6 nút trên điện thoại dọc.
- **Kệ hết hàng:** khách hết hàng mua vẫn xếp hàng tay không rồi bị tính tiền 1 món không mua. Giờ khách bỏ về giận dữ (mất khách, trừ sao) như khi hết kiên nhẫn.
- **Nhiệm vụ "Không để mất khách":** hiển thị "18 / 0" trông như lỗi — giờ hiển thị "Đã mất 18 khách / tối đa 0".
- Save 7.0/7.1 vẫn load được (cùng SAVE_KEY `vua-sieu-thi-pwa-v7`).
- Còn biết chưa sửa: tải lại save thì giờ trong game về đầu ngày (giờ chơi không lưu trong save); trên điện thoại dọc sân chơi vẫn là dải ngang 16:9 với khoảng đen trên/dưới; món đầu trong Kho bị tiêu đề che một phần.

## Visual 7.1.1 (theo ảnh xem trước 2 đã chốt)

- Màn hình bắt đầu dùng ảnh `assets/img/preview-store-2.jpg` (ảnh xem trước 2, nén 1280px/227KB) làm nền, tiêu đề bảng gỗ vàng nâu, nút Bắt đầu vàng cam to tròn.
- Tông ấm toàn game: sàn gỗ sáng, tường kem, cửa kính sáng phía sau, HUD/dock/nút gỗ nâu + vàng cam, chữ nâu đậm — bỏ tông xanh navy lạnh của 7.1.
- Trong game: quầy rau củ tròn ở giữa sàn (ảnh `stall-fruit.jpg`), kệ 3 tầng nhiều màu hơn, quầy POS gỗ ở góc phải, nhân vật to hơn 25% (78px, vẫn sheet đi bộ 8 khung).
- Lưu ý thật: engine vẫn là canvas 2D (không phải 3D thật như ảnh xem trước) — kệ/quầy/nhân vật vẫn vẽ/xếp trên mặt phẳng 2D, chỉ đổi góc nhìn/màu sắc/bố cục cho ấm và giống ảnh hơn. Lối chơi, số liệu, cài đặt, joystick, save giữ nguyên 7.1.

## Cách chơi

1. **Lên kệ:** chạm vào kệ hàng (hoặc vào Kho → Lên kệ) để đưa hàng từ kho sau lên kệ.
2. **Tính tiền:** khách tự vào mua, đi ra quầy POS xếp hàng. Chạm vào POS (hoặc phím `Space`) để tính tiền hết hàng đợi. Thuê Thu Ngân thì tự tính tiền.
3. **Đặt sỉ:** hết hàng trong kho sau thì vào Kho → Đặt 1/2 lô, xe tải về sau 18 giây.
4. **Thể lực:** đi lại, lên kệ tốn thể lực. Pha cà phê (☕, 15.000đ) để hồi.
5. **Cuối ngày 22:00:** xem báo cáo P&L (doanh thu, giá vốn, tiền điện, lương, hỏng hóc) rồi sang ngày mới.
6. **Lên chương:** đủ **tài sản ròng** (tiền mặt + tiết kiệm − nợ) và đủ sao thì vào Chương → Lên chương.
7. **Phá sản:** tiền mặt âm và tài sản ròng âm → chơi lại từ chương hiện tại với 2.250.000đ.

Điều khiển: chạm / chuột, `WASD` hoặc mũi tên để di chuyển, `Space` tính tiền, `P` dừng game, `Esc` đóng menu.

## Tính năng

- **8 sản phẩm:** Rau Củ, Trái Cây, Mì Gói, Bánh Mì, Sữa Tươi, Nước Ngọt, Bánh Kẹo, Snack — mỗi món có giá vốn, giá bán, hạn hỏng, kệ riêng.
- **6 loại khách:** Vội Vã (tip cao), Khó Tính (trừ sao nhiều), VIP (mua nhiều), Trẻ Em (chỉ mua kẹo/snack), Người Già (đi chậm), Influencer (hài lòng thì mai đông khách).
- **4 nhân viên thuê được:** Thu Ngân, Nhân Viên Kho, Lao Công, Shipper — có lương/ngày, tăng cấp, sa thải.
- **Nhiệm vụ ngày + thành tựu:** thưởng tiền và xu (🪙).
- **Sự kiện ngẫu nhiên:** tủ đông đóng tuyết, đổ nước, mất điện 30s, thanh tra, khách VIP, Flash Sale 1 phút.
- **Nâng cấp:** sàn/tường 6 cấp, kệ, quầy POS, tủ lạnh, máy cà phê, biển quảng cáo.
- **Kinh tế:** vay ngân hàng, gửi tiết kiệm lấy lãi, đặt sỉ theo lô, đơn shipper, cà phê, kéo giá markup, thời tiết 1 lần/ngày (Nắng / Mưa / Lễ hội — mỗi loại có đánh đổi).
- **Chế độ:** chơi theo chương 1–10, phá đảo chương 10 mở Chế Độ Tự Do. Độ khó Dễ / Vừa / Khó, tốc độ x1/x2, nhạc + hiệu ứng WebAudio tự sinh (không file ngoài), xuất/nhập save JSON.
- **Đồ họa:** pixel art vẽ bằng canvas — ánh sáng đổi theo giờ trong ngày, bóng đổ, nhân vật nhún theo bước đi, hạt hiệu ứng (tối đa 60), mưa/nắng/lễ hội, vignette.
- **PWA:** manifest, service worker cache-first, chạy offline thật, không CDN, không font ngoài, không ảnh ngoài.

## Chạy thử trên máy

```bash
cd Vua-Sieu-Thi-PWA
python3 -m http.server 8000
# mở http://localhost:8000
```

Mở bằng `file://` thì game vẫn chạy, nhưng Service Worker (PWA/offline) chỉ chạy trên `http://localhost` hoặc `https://`.

## Up GitHub Pages (từng bước)

1. Tạo repo mới trên GitHub, ví dụ tên `vua-sieu-thi-pho` (để trống, không tick README).
2. Upload toàn bộ nội dung thư mục `Vua-Sieu-Thi-PWA` lên repo (kéo-thả trên web GitHub, hoặc):
   ```bash
   cd Vua-Sieu-Thi-PWA
   git init
   git add .
   git commit -m "Vua Sieu Thi Pho PWA v7.1"
   git branch -M main
   git remote add origin https://github.com/<ten-ban>/vua-sieu-thi-pho.git
   git push -u origin main
   ```
3. Trên GitHub: repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, Folder: `/ (root)` → Save.
4. Đợi 1–2 phút, mở `https://<ten-ban>.github.io/vua-sieu-thi-pho/` — xong. Lần đầu mở sẽ thấy nút **📲 Cài đặt app** (Chrome/Edge/Android).
5. Cập nhật bản mới: sửa file, `git add . && git commit -m "..." && git push`, Pages tự deploy lại. Nhớ đổi `CACHE` trong `sw.js` (ví dụ `vua-sieu-thi-v8`) khi đổi file, để app cũ cập nhật cache.

> Lưu ý: file `.nojekyll` đã có sẵn để GitHub Pages không bỏ qua file bắt đầu bằng `_` (nếu có).

## Cấu trúc file

```
index.html              Khung game, HUD, bottom-nav, modal, màn hình bắt đầu
manifest.webmanifest    PWA: tên, icon, màu, standalone
sw.js                   Service worker, cache-first v7, offline fallback
css/style.css           Layout, HUD, canvas, dock, responsive mobile/desktop
css/ui.css              Modal, toast, màn hình bắt đầu, báo cáo P&L
js/data.js              Sản phẩm, chương, nâng cấp, khách, nhân viên, nhiệm vụ
js/state.js             State + save/load deep-merge, version 7.2, export/import
js/audio.js             WebAudio tự sinh: click, tiền, level-up, nhạc nền
js/game.js              Vòng chơi: ngày, khách, checkout, kho, shipper, sự cố, P&L
js/render.js            Vẽ canvas 1280x720: nền, kệ, nhân vật, ánh sáng, hạt — 7.2: màn ngang, kệ 4 tầng sắc nét, quầy rau củ vẽ tay có va chạm, nhân vật 90px
js/ui.js                HUD, modal, toast, P&L cuối ngày, phá sản
js/main.js              Khởi tạo, game loop, input, resize, SW, install prompt
assets/icons/icon-192.png / icon-512.png
assets/favicon.svg
.nojekyll
README.md
```

## Ghi chú cân bằng (kế thừa bản 6.1/6.2)

- Điện: 100.000đ + chương × 50.000đ/ngày. Hỏng rau: 20% (tủ lạnh tốt giảm còn 5%).
- Sao: phục vụ +0,04; mất khách −0,02 → −0,08 tùy loại khách.
- Chương 1: mục tiêu tài sản ròng 4.800.000đ, 3,5 sao. Sàn/tường bắt đầu cấp 1.
- Mở modal thì game dừng (đồng hồ, khách, sự cố đều đứng yên). Thanh kéo giá chỉ lưu khi thả tay.
