/* Vua Sieu Thi Pho — PWA v7.3 | js/render.js
   Visual 7.2 (theo anh xem truoc man ngang da chot): sieu thi ngang rong,
   ke go 4 tang sac net, moi mon ve hinh dang rieng; san go co moi noi van;
   cua kinh rong phia sau, quay rau cu tron ve tay o giua san (co va cham),
   quay POS go co may tinh tien; nhan vat 90px. Engine van 2D. */
/* Vua Sieu Thi Pho — PWA v7.3 | js/render.js
   Ve bang sprite sheet dang di 4x2 (quan ly / thu ngan / khach), doi khung 120ms;
   neu anh chua tai xong thi dung fallback pixel + chan gia lap.
   Goc: ve pixel art bang canvas 1280x720, nen theo san/tuong, ke hang,
   anh sang theo gio, bong do, particles (toi da 60), mua/nang/le hoi, vignette. */
(function () {
  var VST = window.VST || (window.VST = {});
  var U = VST.util;
  function px(v, total) { return v / 100 * total; }
  // --- Sprite sheet dang di (load luoi, khong block game) ---
  var sprites = {}, spritesTried = false;
  var extras = {}; // anh phu 7.3 (xe day...), load luoi nhu sprite
  function loadSprites() {
    if (spritesTried || typeof Image === 'undefined' || !VST.DATA || !VST.DATA.SPRITES) return;
    spritesTried = true;
    Object.keys(VST.DATA.SPRITES).forEach(function (k) {
      var cfg = VST.DATA.SPRITES[k];
      var img = new Image(); img.src = cfg.src; sprites[k] = img;
      var idl = new Image(); idl.src = cfg.idle; sprites[k + '_idle'] = idl;
    });
    // 7.3: xe day cho khach dang mua
    if (VST.DATA.IMAGES && VST.DATA.IMAGES.cart && !extras.cart) {
      var cart = new Image(); cart.src = VST.DATA.IMAGES.cart; extras.cart = cart;
    }
  }
  function spriteReady(img) { return !!(img && img.complete && img.naturalWidth > 0); }
  function drawSpriteFrame(ctx, img, frame, row, x, y, w, h) {
    try { ctx.drawImage(img, frame * 256, row * 256, 256, 256, x - w / 2, y - h, w, h); return true; }
    catch (e) { return false; }
  }

  function drawFloor(ctx, W, H, G) {
    var f = VST.DATA.FLOORS[G.floorId - 1], w = VST.DATA.WALLS[G.wallId - 1];
    // Tuong kem am + vien go (anh xem truoc man ngang: tuong kem, tran go)
    ctx.fillStyle = '#fdf3d8'; ctx.fillRect(0, 0, W, H * 0.14);
    ctx.fillStyle = '#d97706'; ctx.fillRect(0, H * 0.14, W, 6);
    ctx.fillStyle = '#92400e'; ctx.fillRect(0, H * 0.155, W, 3);
    // 7.2: mat tien kinh rong phia sau — 3 o cua kinh nhin ra pho, khung go nau
    var dg = ctx.createLinearGradient(0, H * 0.015, 0, H * 0.135);
    try { dg.addColorStop(0, '#7dd3fc'); dg.addColorStop(0.55, '#bae6fd'); dg.addColorStop(1, '#fef3c7'); } catch (e) {}
    ctx.fillStyle = dg; ctx.fillRect(W * 0.30, H * 0.015, W * 0.40, H * 0.12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(W * 0.30, H * 0.015, W * 0.40, 4);
    ctx.fillRect(W * 0.30, H * 0.125, W * 0.40, 4);
    ctx.fillRect(W * 0.433, H * 0.015, 5, H * 0.12);
    ctx.fillRect(W * 0.562, H * 0.015, 5, H * 0.12);
    ctx.fillRect(W * 0.497, H * 0.015, 6, H * 0.12);
    // Bong troi + duong pho ngoai cua kinh
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(W * 0.33, H * 0.035, W * 0.06, H * 0.02);
    ctx.fillRect(W * 0.58, H * 0.05, W * 0.05, H * 0.015);
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(W * 0.30, H * 0.10, W * 0.40, H * 0.035);
    ctx.fillStyle = '#fde68a'; ctx.fillRect(W * 0.30, H * 0.105, W * 0.40, 3);
    // Chau cay 2 ben cua kinh
    [[0.27, 0.10], [0.73, 0.10]].forEach(function (pt) {
      var px0 = W * pt[0], py0 = H * pt[1];
      ctx.fillStyle = '#b45309'; ctx.fillRect(px0 - 9, py0 - 2, 18, 14);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath(); ctx.arc(px0 - 6, py0 - 10, 8, 0, 6.29); ctx.arc(px0 + 6, py0 - 12, 9, 0, 6.29); ctx.arc(px0, py0 - 18, 8, 0, 6.29); ctx.fill();
    });
    // Bang go ten sieu thi o giua tuong (treo tren cua kinh)
    ctx.fillStyle = '#92400e'; ctx.fillRect(W * 0.36, H * 0.045, W * 0.28, H * 0.06);
    ctx.fillStyle = '#78350f'; ctx.fillRect(W * 0.36, H * 0.105, W * 0.28, 4);
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold ' + Math.round(H * 0.04) + 'px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★ VUA SIEU THI PHO ★', W * 0.50, H * 0.075);
    // 7.2: san go sac net — van ngang xen ke + moi noi van so le + van go
    var plankH = 34;
    var y0 = Math.floor(H * 0.16);
    for (var y = y0; y < H; y += plankH) {
      var row = Math.floor((y - y0) / plankH);
      ctx.fillStyle = row % 2 === 0 ? '#f0c98a' : '#e6b46c';
      ctx.fillRect(0, y, W, plankH - 2);
      ctx.fillStyle = 'rgba(146,64,14,0.22)';
      ctx.fillRect(0, y + plankH - 2, W, 2);
      // Moi noi van so le nhau
      var jointX = (row % 2 === 0) ? W * 0.32 : W * 0.68;
      ctx.fillRect(jointX, y, 2, plankH - 2);
      ctx.fillRect((jointX + W * 0.5) % W, y, 2, plankH - 2);
      // Van go nhe
      ctx.fillStyle = 'rgba(146,64,14,0.10)';
      ctx.fillRect((row * 211) % W, y + 8, W * 0.22, 3);
      ctx.fillRect(((row * 211 + 500) % W), y + 22, W * 0.18, 3);
    }
    // Anh den vang am tren san
    ctx.fillStyle = 'rgba(253,230,138,0.14)';
    ctx.fillRect(W * 0.1, H * 0.62, W * 0.8, 4);
    ctx.fillRect(W * 0.1, H * 0.78, W * 0.8, 3);
  }

  // 7.2: moi mon ve hinh dang rieng, sac net — khong con o mau chung chung.
  function drawProductItem(ctx, p, i, cx, cy, w, h) {
    var c = p.color, d = p.dark;
    ctx.save();
    ctx.translate(cx, cy);
    if (p.id === 'veggie') { // bap cai xanh + la
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(0, 1, h * 0.42, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.arc(-2, -1, h * 0.28, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#166534'; ctx.fillRect(-1, -h * 0.5, 2, 4);
    } else if (p.id === 'fruit') { // tao / cam xen ke
      ctx.fillStyle = (i % 2 === 0) ? '#ef4444' : '#f97316';
      ctx.beginPath(); ctx.arc(0, 1, h * 0.42, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(-3, -2, 2, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#78350f'; ctx.fillRect(-1, -h * 0.5, 2, 4);
    } else if (p.id === 'noodle') { // goi mi vang, soc do
      ctx.fillStyle = '#facc15'; ctx.fillRect(-w * 0.42, -h * 0.38, w * 0.84, h * 0.76);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(-w * 0.42, -2, w * 0.84, 4);
      ctx.fillStyle = '#854d0e'; ctx.fillRect(-w * 0.42, h * 0.38 - 2, w * 0.84, 2);
    } else if (p.id === 'bread') { // o banh mi nau
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.42, h * 0.36, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(5, -4); ctx.moveTo(-5, 1); ctx.lineTo(5, 1); ctx.stroke();
    } else if (p.id === 'milk') { // hop sua trang, mai xanh
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-w * 0.34, -h * 0.3, w * 0.68, h * 0.68);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath(); ctx.moveTo(-w * 0.34, -h * 0.3); ctx.lineTo(0, -h * 0.5); ctx.lineTo(w * 0.34, -h * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillRect(-w * 0.34, h * 0.1, w * 0.68, 3);
    } else if (p.id === 'drink') { // chai nuoc ngot
      ctx.fillStyle = (i % 2 === 0) ? '#38bdf8' : '#22c55e';
      ctx.fillRect(-w * 0.26, -h * 0.2, w * 0.52, h * 0.58);
      ctx.fillRect(-w * 0.12, -h * 0.48, w * 0.24, h * 0.3);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(-w * 0.14, -h * 0.52, w * 0.28, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-w * 0.2, -h * 0.12, 2, h * 0.4);
    } else if (p.id === 'candy') { // keo boc giay hong / tim
      ctx.fillStyle = (i % 2 === 0) ? '#f472b6' : '#a78bfa';
      ctx.beginPath(); ctx.arc(0, 0, h * 0.34, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-h * 0.34, 0); ctx.lineTo(-h * 0.55, -4); ctx.lineTo(-h * 0.55, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(h * 0.34, 0); ctx.lineTo(h * 0.55, -4); ctx.lineTo(h * 0.55, 4); ctx.closePath(); ctx.fill();
    } else { // snack: tui tim, nhan vang
      ctx.fillStyle = '#a78bfa'; ctx.fillRect(-w * 0.36, -h * 0.4, w * 0.72, h * 0.8);
      ctx.fillStyle = '#facc15'; ctx.fillRect(-w * 0.22, -h * 0.14, w * 0.44, h * 0.3);
      ctx.fillStyle = '#4c1d95'; ctx.fillRect(-w * 0.36, -h * 0.4, w * 0.72, 3);
    }
    ctx.restore();
    void c; void d;
  }

  function drawShelf(ctx, W, H, G, R, shelf, now) {
    var p = VST.DATA.PRODUCT_MAP[shelf.productId];
    var x = px(shelf.x, W), y = px(shelf.y, H), w = px(shelf.w, W), h = px(shelf.h, H);
    var stock = G.shelfStock[p.id] || 0, cap = VST.game.maxCap(p);
    var pct = cap ? stock / cap : 0;
    // Bong do
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(x + 6, y + h + 4, w, 8);
    // 7.2: khung ke go sac net — cot 2 ben, vien tren vang, 4 tang ro rang
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6b4226'; ctx.fillRect(x, y, 6, h); ctx.fillRect(x + w - 6, y, 6, h);
    ctx.fillStyle = '#a16207'; ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = '#d97706'; ctx.fillRect(x, y + 6, w, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, w, 3);
    // Hang hoa: 4 tang x 8 cot, moi mon ve hinh rieng theo so luong
    var cols = 8, rows = 4, cw = (w - 12) / cols, ch = (h - 28) / rows;
    var n = Math.round(pct * cols * rows);
    for (var i = 0; i < cols * rows; i++) {
      var col = i % cols, r = Math.floor(i / cols);
      var cx = x + 6 + col * cw + cw / 2, cy = y + 10 + r * ch + ch / 2;
      if (i < n) {
        drawProductItem(ctx, p, i, cx, cy, cw - 5, ch - 4);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(cx - (cw - 6) / 2, cy - (ch - 5) / 2, cw - 6, ch - 5);
      }
      // Van go ngan tang (chi ve sau hang cuoi moi tang)
      if (col === cols - 1) {
        ctx.fillStyle = '#a16207'; ctx.fillRect(x + 6, y + 10 + (r + 1) * ch - 2, w - 12, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 6, y + 10 + (r + 1) * ch - 2, w - 12, 1);
      }
    }
    // 7.3: ke lanh (sua / nuoc ngot) co lop kinh mo + vien trang + bong tuyet
    if (p.fridge) {
      ctx.fillStyle = 'rgba(186,230,253,0.20)';
      ctx.fillRect(x + 6, y + 10, w - 12, h - 28);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, y + 10, w - 12, h - 28);
      ctx.fillStyle = '#0c4a6e'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'right';
      ctx.fillText('❄', x + w - 10, y + 24);
    }
    // Nhan gia + ten
    ctx.fillStyle = '#fff8e7'; ctx.fillRect(x, y + h - 18, w, 18);
    ctx.fillStyle = '#111827'; ctx.font = 'bold ' + Math.round(H * 0.018) + 'px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.icon + ' ' + p.name + ' ' + U.fmt(VST.game.sellPrice(p)) + 'd  (' + stock + '/' + cap + ')', x + w / 2, y + h - 9);
    // Canh bao het / sap het
    if (pct < 0.2) {
      var blink = Math.floor(now / 400) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(x + w - 12, y - 6, 11, 0, 6.29); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui';
        ctx.fillText('!', x + w - 12, y - 6);
      }
    }
    if (pct >= 0.85 && G.settings.particles) {
      ctx.fillStyle = 'rgba(250,204,21,0.9)';
      var sx = x + ((now / 300) % w);
      ctx.fillRect(sx, y + 4, 4, 4);
    }
    // Tuyet tu dong (ke sua)
    if (p.id === 'milk' && G.events.fridgeFrost) {
      ctx.fillStyle = 'rgba(224,242,254,0.75)';
      ctx.fillRect(x, y, w, h * 0.5);
      ctx.fillStyle = '#0c4a6e'; ctx.font = 'bold 14px system-ui';
      ctx.fillText('❄ ' + Math.ceil(G.events.frostTimer) + 's', x + w / 2, y + h / 2);
    }
  }

  function drawStation(ctx, W, H, G, R, kind, now) {
    var st = VST.DATA.STATIONS[kind];
    var x = px(st.x, W), y = px(st.y, H);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath(); ctx.ellipse(x, y + 26, 46, 10, 0, 0, 6.29); ctx.fill();
    if (kind === 'pos') {
      // 7.2: quay tinh tien go sac net — mat quay, bang chuyen, may tinh tien co man hinh
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 52, y - 30, 104, 55);
      ctx.fillStyle = '#6b4226'; ctx.fillRect(x - 52, y + 18, 104, 7);
      ctx.fillStyle = '#d97706'; ctx.fillRect(x - 52, y - 30, 104, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 52, y - 30, 104, 3);
      // Bang chuyen den co vach trang
      ctx.fillStyle = '#334155'; ctx.fillRect(x - 48, y - 20, 96, 10);
      ctx.fillStyle = '#e2e8f0';
      for (var bi = 0; bi < 6; bi++) ctx.fillRect(x - 44 + bi * 16, y - 18, 6, 6);
      // May tinh tien: than + man hinh xanh + nut
      ctx.fillStyle = '#1f2937'; ctx.fillRect(x + 14, y - 46, 30, 22);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(x + 17, y - 43, 24, 11);
      ctx.fillStyle = '#facc15'; ctx.fillRect(x + 17, y - 29, 6, 4);
      ctx.fillStyle = '#4ade80'; ctx.fillRect(x + 26, y - 29, 6, 4);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(x + 35, y - 29, 6, 4);
      // Tui hang + bien
      ctx.fillStyle = '#fff7e6'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('💰 POS', x - 22, y - 6);
      ctx.fillStyle = '#fde68a'; ctx.fillText('Tinh tien', x - 22, y + 12);
      var q = R.customers.filter(function (c) { return c.state === 'queue'; }).length;
      if (q > 0) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x + 40, y - 28, 13, 0, 6.29); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(String(q), x + 40, y - 28); }
    } else if (kind === 'coffee') {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 40, y - 28, 80, 52);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(x - 40, y - 28, 80, 8);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('☕ Ca Phe', x, y - 6);
      ctx.fillStyle = '#fde68a'; ctx.fillText('15k / ly', x, y + 12);
    } else if (kind === 'door') {
      // Cua kinh sang o duoi giua
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(x - 55, y - 14, 110, 16);
      ctx.fillStyle = '#92400e'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('🚪 CUA RA VAO', x, y - 4);
    }
  }

  function drawPerson(ctx, W, H, c, now, isManager, G) {
    var x = px(c.x, W), y = px(c.y, H);
    loadSprites();
    var moving = !!c.moving;
    var bob = moving ? Math.sin((c.walkTimer || 0) * 12) * 2 : Math.sin(now / 600) * 0.8;
    // Bong chan (co lai khi dang buoc)
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(x, y + 28, moving ? 20 : 24, 7, 0, 0, 6.29); ctx.fill();
    // --- Duong sprite sheet that (uu tien) ---
    var useSprite = G && G.settings && G.settings.walkAnim !== false;
    // 7.3: khach tre em / nguoi gia dung sprite rieng, con lai dung khach 1
    var key = isManager ? 'manager' : ((VST.DATA.CUSTOMER_SPRITE_BY_TYPE || {})[c.type] || 'customer');
    var img = sprites[key];
    if (useSprite && spriteReady(img)) {
      var row = (c.dir === 'left') ? 1 : 0; // len/xuong dung hang phai
      var col = moving ? (c.walkFrame || 0) : 1; // khung 1 = dung yen
      // Sheet khach nu: khung 3 hang trai bi ve nham sang phai -> dung khung 2 thay the
      // (chi ap dung khach 1; sheet khach 2/3 ve dung huong)
      if (key === 'customer' && row === 1 && col === 3) col = 2;
      // 7.3: xe day cho khach dang mua / xep hang — ve truoc nguoi, lech ve huong di
      if (!isManager && (c.state === 'browse' || c.state === 'queue') && spriteReady(extras.cart)) {
        var cdx = (c.dir === 'left') ? -36 : 36;
        ctx.drawImage(extras.cart, x + cdx - 28, y - 4 + bob, 56, 41);
      }
      if (drawSpriteFrame(ctx, img, col, row, x, y + 26 + bob, 90, 90)) { // 7.2: to hon 15% so voi 7.1.3 (78px), man ngang rong hon
        // Nhan / thanh kien nhan / cam xuc van ve them ben tren sprite
        if (!isManager && c.type) {
          var t2 = VST.DATA.CUSTOMER_TYPES[c.type];
          ctx.font = '16px system-ui'; ctx.textAlign = 'center';
          ctx.fillText(t2.icon, x + 30, y - 42 + bob);
          if (c.state === 'queue' || c.state === 'browse') {
            var pct = Math.max(0, c.patience / c.maxPatience);
            ctx.fillStyle = '#111827'; ctx.fillRect(x - 17, y - 54 + bob, 34, 6);
            ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#ef4444';
            ctx.fillRect(x - 17, y - 54 + bob, 34 * pct, 6);
          }
          if (c.mood === 'angry') { ctx.font = '18px system-ui'; ctx.fillText('😡', x, y - 58); }
        }
        if (isManager) {
          ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
          ctx.fillText('QUAN LY', x, y - 52 + bob);
        }
        return;
      }
    }
    // --- Fallback pixel art + chan gia lap (khi anh chua tai / tat walkAnim) ---
    var sway = moving ? Math.sin((c.phase || 0)) * 1.5 : 0;
    var color = '#2563eb', skin = '#fcd9b8', shirt = '#2563eb';
    if (!isManager && c.type) { var t = VST.DATA.CUSTOMER_TYPES[c.type]; color = t.color; shirt = t.color; }
    if (isManager) { shirt = '#dc2626'; }
    ctx.fillStyle = shirt; ctx.fillRect(x - 13 + sway, y - 8 + bob, 26, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 13 + sway, y - 8 + bob, 26, 5);
    ctx.fillStyle = skin; ctx.fillRect(x - 10 + sway, y - 26 + bob, 20, 18);
    ctx.fillStyle = '#111827'; ctx.fillRect(x - 10 + sway, y - 26 + bob, 20, 5);
    ctx.fillRect(x - 6 + sway, y - 17 + bob, 3, 3); ctx.fillRect(x + 3 + sway, y - 17 + bob, 3, 3);
    // Chan gia lap: 2 ellipse den dao nguoc pha khi dang di
    ctx.fillStyle = '#111827';
    var step = moving ? Math.sin((c.phase || 0)) * 4 : 0;
    ctx.beginPath(); ctx.ellipse(x - 6 + sway, y + 22 + Math.max(0, step), 5, 3.5, 0, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 6 + sway, y + 22 + Math.max(0, -step), 5, 3.5, 0, 0, 6.29); ctx.fill();
    if (!isManager && c.type) {
      var t2b = VST.DATA.CUSTOMER_TYPES[c.type];
      ctx.font = '16px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(t2b.icon, x + 16, y - 26 + bob);
      if (c.state === 'queue' || c.state === 'browse') {
        var pct2 = Math.max(0, c.patience / c.maxPatience);
        ctx.fillStyle = '#111827'; ctx.fillRect(x - 14, y - 36 + bob, 28, 5);
        ctx.fillStyle = pct2 > 0.5 ? '#4ade80' : pct2 > 0.25 ? '#facc15' : '#ef4444';
        ctx.fillRect(x - 14, y - 36 + bob, 28 * pct2, 5);
      }
      if (c.mood === 'angry') { ctx.font = '18px system-ui'; ctx.fillText('😡', x, y - 40); }
    }
    if (isManager) {
      ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText('QUAN LY', x, y - 34 + bob);
    }
  }

  function drawFruitPile(ctx, cx, cy, r, color, kind) {
    // 1 dong trai cay: hinh dang rieng theo loai (tron / chuoi / ca rot / sup lo)
    var i, a;
    if (kind === 'banana') {
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(cx, cy + 4, r - 2, Math.PI * (1.15 + i * 0.12), Math.PI * (1.85 - i * 0.12)); ctx.stroke();
      }
      return;
    }
    if (kind === 'carrot') {
      for (i = 0; i < 3; i++) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.moveTo(cx - 8 + i * 8, cy - 6); ctx.lineTo(cx - 4 + i * 8, cy + 8); ctx.lineTo(cx + i * 8, cy - 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#22c55e'; ctx.fillRect(cx - 6 + i * 8, cy - 12, 5, 6);
      }
      return;
    }
    if (kind === 'broccoli') {
      ctx.fillStyle = '#16a34a';
      for (i = 0; i < 5; i++) {
        a = i * 1.256;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.3, r * 0.34, 0, 6.29); ctx.fill();
      }
      ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.arc(cx, cy - 2, r * 0.3, 0, 6.29); ctx.fill();
      return;
    }
    // Tao / cam / nho: chum tron co diem sang
    for (i = 0; i < 7; i++) {
      a = i * 0.9;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.32, r * 0.3, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.5 - 2, cy + Math.sin(a) * r * 0.32 - 2, r * 0.1, 0, 6.29); ctx.fill();
    }
  }

  function drawFruitStall(ctx, W, H, G, now) {
    // 7.2: quay rau cu tron ve tay, sac net — ban go tron, 6 dong trai cay rieng biet.
    // Hinh hoc khop va cham ellipse o game.js (hitsStall): tam (50%, 68%), rong 210, cao 118.
    var cx = W * 0.50, cy = H * 0.68, rw = 210, rh = 118;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(cx, cy + rh / 2 + 6, rw / 2 + 8, 12, 0, 0, 6.29); ctx.fill();
    // Ban go tron 2 lop + vien vang
    ctx.fillStyle = '#6b4226'; ctx.beginPath(); ctx.ellipse(cx, cy + 6, rw / 2 + 4, rh / 2 + 4, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.ellipse(cx, cy, rw / 2, rh / 2, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#a16207'; ctx.beginPath(); ctx.ellipse(cx, cy, rw / 2 - 8, rh / 2 - 8, 0, 0, 6.29); ctx.fill();
    // 6 dong: tao do, cam, chuoi, nho tim, sup lo xanh, ca rot
    var piles = [
      { dx: -68, dy: -22, r: 17, color: '#ef4444', kind: 'round' },
      { dx: -24, dy: -30, r: 17, color: '#f97316', kind: 'round' },
      { dx: 20, dy: -30, r: 17, color: '#facc15', kind: 'banana' },
      { dx: 66, dy: -22, r: 16, color: '#7c3aed', kind: 'round' },
      { dx: -46, dy: 16, r: 18, color: '#16a34a', kind: 'broccoli' },
      { dx: 8, dy: 14, r: 18, color: '#f97316', kind: 'carrot' },
      { dx: 58, dy: 14, r: 15, color: '#facc15', kind: 'round' }
    ];
    piles.forEach(function (pl) { drawFruitPile(ctx, cx + pl.dx, cy + pl.dy, pl.r, pl.color, pl.kind); });
    // Bien go nho phia truoc quay
    ctx.fillStyle = '#92400e'; ctx.fillRect(cx - 62, cy + rh / 2 - 2, 124, 20);
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('🍎 Quay rau cu 🥕', cx, cy + rh / 2 + 12);
  }

  function drawTruck(ctx, W, H, G, now) {
    if (!G.truck || G.truck.stage === 0) return;
    var x = W * 0.5, y = H * 0.07;
    var wob = Math.sin(now / 200) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 26, 60, 8, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(x - 60, y - 22 + wob, 90, 40);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(x + 30, y - 18 + wob, 30, 32);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('🚚 ' + Math.ceil(G.truck.timer) + 's', x - 15, y - 2 + wob);
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.arc(x - 40, y + 20, 9, 0, 6.29); ctx.arc(x + 40, y + 20, 9, 0, 6.29); ctx.fill();
  }

  function drawParticles(ctx, W, H, R) {
    R.particles.forEach(function (p) {
      var a = 1 - p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      ctx.fillRect(px(p.x, W), px(p.y, H), p.size, p.size);
    });
    ctx.globalAlpha = 1;
    R.floatTexts.forEach(function (f) {
      var a = 1 - f.life / 1.2;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = f.color; ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(f.text, px(f.x, W), px(f.y, H));
    });
    ctx.globalAlpha = 1;
  }

  function drawLighting(ctx, W, H, G, R, now) {
    var m = R.minuteOfDay;
    var tint = 'rgba(255,214,120,0.05)', lamp = false;
    if (m >= 420 && m < 660) tint = 'rgba(255,220,150,0.06)';
    else if (m >= 660 && m < 900) tint = 'rgba(255,255,255,0.02)';
    else if (m >= 900 && m < 1080) { tint = 'rgba(255,150,60,0.12)'; lamp = true; }
    else { tint = 'rgba(146,64,14,0.12)'; lamp = true; } // 7.1.1: toi van am, khong xanh lanh
    ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H);
    if (lamp) {
      var g1 = ctx.createRadialGradient(W * 0.88, H * 0.76, 10, W * 0.88, H * 0.76, 220);
      g1.addColorStop(0, 'rgba(250,204,21,0.25)'); g1.addColorStop(1, 'rgba(250,204,21,0)');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    }
    // 7.2: 2 vung sang am tu den tran roi xuong san (kieu anh xem truoc man ngang)
    [[0.30, 0.30], [0.70, 0.30]].forEach(function (pt) {
      var lg = ctx.createRadialGradient(W * pt[0], H * pt[1], 10, W * pt[0], H * pt[1], 240);
      lg.addColorStop(0, 'rgba(253,230,138,0.10)'); lg.addColorStop(1, 'rgba(253,230,138,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    });
    // Vet nang tu cua
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(W * 0.42, H * 0.9); ctx.lineTo(W * 0.5, H * 0.9); ctx.lineTo(W * 0.62, H * 0.2); ctx.lineTo(W * 0.54, H * 0.2);
    ctx.closePath(); ctx.fill();
    // Vignette
    try {
      var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.85);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.26)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    } catch (e) { /* stub ctx */ }
    // Thoi tiet
    if (G.weather === 'rain') {
      ctx.strokeStyle = 'rgba(147,197,253,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i < 30; i++) {
        var rx = ((i * 97 + now / 12) % W), ry = ((i * 53 + now / 6) % H);
        ctx.moveTo(rx, ry); ctx.lineTo(rx - 8, ry + 18);
      }
      ctx.stroke();
    } else if (G.weather === 'fest') {
      ctx.fillStyle = '#facc15'; ctx.font = '18px system-ui'; ctx.textAlign = 'center';
      var cols = ['#ef4444', '#facc15', '#4ade80', '#38bdf8', '#f472b6'];
      for (var f = 0; f < 16; f++) {
        ctx.fillStyle = cols[f % cols.length];
        ctx.fillRect(W * 0.05 + f * (W * 0.9 / 16), H * 0.145, 14, 18);
      }
    }
    if (G.events.blackout) { ctx.fillStyle = 'rgba(15,23,42,0.35)'; ctx.fillRect(0, 0, W, H); }
    if (G.events.spill) {
      ctx.fillStyle = 'rgba(56,189,248,0.45)';
      ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.82, 70, 16, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('💧 Vet nuoc — cham de don (' + Math.ceil(G.events.spillTimer) + 's)', W * 0.5, H * 0.78);
    }
    if (G.events.flashSale) {
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('🔥 FLASH SALE ' + Math.ceil(G.events.flashTimer) + 's 🔥', W * 0.5, H * 0.12);
    }
  }

  function render(ctx, G, R, now) {
    if (!ctx || !G || !R) return;
    var W = 1280, H = 720;
    drawFloor(ctx, W, H, G);
    VST.DATA.SHELVES.forEach(function (s) { drawShelf(ctx, W, H, G, R, s, now); });
    drawFruitStall(ctx, W, H, G, now);
    drawStation(ctx, W, H, G, R, 'pos', now);
    drawStation(ctx, W, H, G, R, 'coffee', now);
    drawStation(ctx, W, H, G, R, 'door', now);
    drawTruck(ctx, W, H, G, now);
    // Shipper don
    if (R.shipperOrder) {
      ctx.fillStyle = '#0ea5e9'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('🛵 Don shipper: ' + R.shipperOrder.qty + 'x ' + VST.DATA.PRODUCT_MAP[R.shipperOrder.pid].name + ' — ' + U.fmt(R.shipperOrder.reward) + 'd (' + Math.ceil(R.shipperTimer) + 's)', W * 0.5, H * 0.05);
    }
    // Nhan vat: sap xep theo y de co chieu sau
    // Thu ngan dung o POS khi da thue (anh idle)
    if (G.staff && G.staff.cashier && G.staff.cashier.hired) {
      loadSprites();
      var cimg = sprites['cashier_idle'];
      if (spriteReady(cimg)) { ctx.drawImage(cimg, W * 0.82 - 34, H * 0.70 - 68, 68, 68); }
    }
    var actors = R.customers.slice();
    actors.sort(function (a, b) { return a.y - b.y; });
    actors.forEach(function (c) { drawPerson(ctx, W, H, c, now, false, G); });
    drawPerson(ctx, W, H, R.manager, now, true, G);
    drawParticles(ctx, W, H, R);
    drawLighting(ctx, W, H, G, R, now);
    // Gio + ngay tren canvas
    ctx.fillStyle = 'rgba(146,64,14,0.88)'; ctx.fillRect(W - 190, 8, 182, 30);
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Ngay ' + G.day + '  •  ' + U.fmtTime(R.minuteOfDay), W - 99, 28);
  }

  VST.render = { render: render, drawShelf: drawShelf, drawPerson: drawPerson, loadSprites: loadSprites, sprites: sprites, extras: extras, spriteReady: spriteReady };
})();
