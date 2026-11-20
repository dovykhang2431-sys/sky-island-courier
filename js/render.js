/* Vua Sieu Thi Pho — PWA v7.0 | js/render.js
   Ve pixel art bang canvas 1280x720 (khong anh base64):
   nen theo san/tuong, ke hang, nhan vat, anh sang theo gio, bong do,
   bob, particles (toi da 60), mua/nang/le hoi, vignette — ke thua 6.2. */
(function () {
  var VST = window.VST || (window.VST = {});
  var U = VST.util;
  function px(v, total) { return v / 100 * total; }

  function drawFloor(ctx, W, H, G) {
    var f = VST.DATA.FLOORS[G.floorId - 1], w = VST.DATA.WALLS[G.wallId - 1];
    // Tuong tren
    ctx.fillStyle = w.c1; ctx.fillRect(0, 0, W, H * 0.14);
    ctx.fillStyle = w.c2; ctx.fillRect(0, H * 0.14, W, 6);
    // Cua so / bang hieu tren tuong
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(W * 0.04, H * 0.03, W * 0.2, H * 0.08);
    ctx.fillStyle = '#facc15'; ctx.font = 'bold ' + Math.round(H * 0.045) + 'px system-ui';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('★ SIEU THI PHO ★', W * 0.05, H * 0.07);
    // San gach
    var tile = 64;
    for (var y = Math.floor(H * 0.15); y < H; y += tile) {
      for (var x = 0; x < W; x += tile) {
        var odd = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = odd ? f.c1 : f.c2;
        ctx.fillRect(x, y, tile - 2, tile - 2);
      }
    }
    // Highlight bong san
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(W * 0.1, H * 0.62, W * 0.8, 4);
    ctx.fillRect(W * 0.1, H * 0.78, W * 0.8, 3);
  }

  function drawShelf(ctx, W, H, G, R, shelf, now) {
    var p = VST.DATA.PRODUCT_MAP[shelf.productId];
    var x = px(shelf.x, W), y = px(shelf.y, H), w = px(shelf.w, W), h = px(shelf.h, H);
    var stock = G.shelfStock[p.id] || 0, cap = VST.game.maxCap(p);
    var pct = cap ? stock / cap : 0;
    // Bong do
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(x + 6, y + h + 4, w, 8);
    // Than ke
    ctx.fillStyle = '#78350f'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#92400e'; ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, w, 3);
    // Hang hoa: o pixel theo so luong
    var cols = 6, rows = 2, cw = w / cols, ch = (h - 22) / rows;
    var n = Math.round(pct * cols * rows);
    for (var i = 0; i < cols * rows; i++) {
      var cx = x + (i % cols) * cw, cy = y + 8 + Math.floor(i / cols) * ch;
      if (i < n) {
        ctx.fillStyle = p.color; ctx.fillRect(cx + 3, cy + 3, cw - 6, ch - 6);
        ctx.fillStyle = p.dark; ctx.fillRect(cx + 3, cy + ch - 9, cw - 6, 4);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx + 3, cy + 3, cw - 6, ch - 6);
      }
    }
    // Nhan gia + ten
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y + h - 18, w, 18);
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
      ctx.fillStyle = '#1e3a8a'; ctx.fillRect(x - 45, y - 30, 90, 55);
      ctx.fillStyle = '#facc15'; ctx.fillRect(x - 45, y - 30, 90, 8);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('💰 POS', x, y - 8);
      ctx.fillStyle = '#93c5fd'; ctx.fillText('Tinh tien', x, y + 12);
      var q = R.customers.filter(function (c) { return c.state === 'queue'; }).length;
      if (q > 0) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x + 40, y - 28, 13, 0, 6.29); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(String(q), x + 40, y - 28); }
    } else if (kind === 'coffee') {
      ctx.fillStyle = '#78350f'; ctx.fillRect(x - 40, y - 28, 80, 52);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(x - 40, y - 28, 80, 8);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('☕ Ca Phe', x, y - 6);
      ctx.fillStyle = '#fde68a'; ctx.fillText('15k / ly', x, y + 12);
    } else if (kind === 'door') {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(x - 55, y - 14, 110, 16);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('🚪 CUA RA VAO', x, y - 4);
    }
  }

  function drawPerson(ctx, W, H, c, now, isManager) {
    var x = px(c.x, W), y = px(c.y, H);
    var moving = c.state === 'enter' || c.state === 'leave' || (isManager && c.moving);
    var bob = moving ? Math.sin(c.phase || now / 150) * 2.5 : Math.sin(now / 600) * 0.8;
    var sway = moving ? Math.sin((c.phase || 0)) * 1.5 : 0;
    // Bong
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(x, y + 24, moving ? 16 : 19, 6, 0, 0, 6.29); ctx.fill();
    var color = '#2563eb', skin = '#fcd9b8', shirt = '#2563eb';
    if (!isManager && c.type) {
      var t = VST.DATA.CUSTOMER_TYPES[c.type];
      color = t.color; shirt = t.color;
    }
    if (isManager) { shirt = '#dc2626'; }
    // Than
    ctx.fillStyle = shirt; ctx.fillRect(x - 13 + sway, y - 8 + bob, 26, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 13 + sway, y - 8 + bob, 26, 5);
    // Dau
    ctx.fillStyle = skin; ctx.fillRect(x - 10 + sway, y - 26 + bob, 20, 18);
    ctx.fillStyle = '#111827'; ctx.fillRect(x - 10 + sway, y - 26 + bob, 20, 5);
    ctx.fillStyle = '#111827'; ctx.fillRect(x - 6 + sway, y - 17 + bob, 3, 3); ctx.fillRect(x + 3 + sway, y - 17 + bob, 3, 3);
    // Chan
    ctx.fillStyle = '#111827';
    var step = moving ? Math.sin((c.phase || 0)) * 4 : 0;
    ctx.fillRect(x - 10 + sway, y + 18, 7, 8 + step * 0.3);
    ctx.fillRect(x + 3 + sway, y + 18, 7, 8 - step * 0.3);
    if (!isManager && c.type) {
      var t2 = VST.DATA.CUSTOMER_TYPES[c.type];
      ctx.font = '16px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(t2.icon, x + 16, y - 26 + bob);
      if (c.state === 'queue' || c.state === 'browse') {
        var pct = Math.max(0, c.patience / c.maxPatience);
        ctx.fillStyle = '#111827'; ctx.fillRect(x - 14, y - 36 + bob, 28, 5);
        ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#ef4444';
        ctx.fillRect(x - 14, y - 36 + bob, 28 * pct, 5);
      }
      if (c.mood === 'angry') { ctx.font = '18px system-ui'; ctx.fillText('😡', x, y - 40); }
    }
    if (isManager) {
      ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText('QUAN LY', x, y - 34 + bob);
    }
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
    else { tint = 'rgba(80,90,200,0.18)'; lamp = true; }
    ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H);
    if (lamp) {
      var g1 = ctx.createRadialGradient(W * 0.88, H * 0.76, 10, W * 0.88, H * 0.76, 220);
      g1.addColorStop(0, 'rgba(250,204,21,0.25)'); g1.addColorStop(1, 'rgba(250,204,21,0)');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    }
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
    var actors = R.customers.slice();
    actors.sort(function (a, b) { return a.y - b.y; });
    actors.forEach(function (c) { drawPerson(ctx, W, H, c, now, false); });
    drawPerson(ctx, W, H, R.manager, now, true);
    drawParticles(ctx, W, H, R);
    drawLighting(ctx, W, H, G, R, now);
    // Gio + ngay tren canvas
    ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fillRect(W - 190, 8, 182, 30);
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Ngay ' + G.day + '  •  ' + U.fmtTime(R.minuteOfDay), W - 99, 28);
  }

  VST.render = { render: render, drawShelf: drawShelf, drawPerson: drawPerson };
})();
