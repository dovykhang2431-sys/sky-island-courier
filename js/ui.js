/* Vua Sieu Thi Pho — PWA v7.3 | js/ui.js
   HUD, bottom-nav, modal, toast, man hinh bat dau, P&L cuoi ngay.
   Them: cai dat day du (joystick/D-pad/dang di), confirm modal, huong dan 3 buoc. */
(function () {
  var VST = window.VST || (window.VST = {});
  var U = VST.util;
  var toastTimer = null;
  function el(id) { return document.getElementById(id); }
  function G() { return VST.state.G; }
  function R() { return VST.game.R; }

  function toast(msg) {
    var t = el('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  function updateHud() {
    var g = G(); if (!g) return;
    var set = function (id, v) { var e = el(id); if (e) e.textContent = v; };
    set('hudCash', U.fmtMoney(g.cash));
    // 7.3: sao/xu hien bang anh (hudStarsNum/hudCoinsNum); giu fallback text neu HTML cu
    if (el('hudStarsNum')) set('hudStarsNum', g.stars.toFixed(1)); else set('hudStars', '★ ' + g.stars.toFixed(1));
    set('hudDay', 'Ngay ' + g.day + ' • Chuong ' + g.chapterId + (g.freeMode ? ' • Tu Do' : ''));
    set('hudStamina', '⚡ ' + Math.round(g.stamina) + '%');
    if (el('hudCoinsNum')) set('hudCoinsNum', String(g.coins)); else set('hudCoins', '🪙 ' + g.coins);
    set('hudWeather', (VST.DATA.WEATHERS[g.weather] || {}).icon + ' ' + (VST.DATA.WEATHERS[g.weather] || {}).name);
    var bar = el('staminaBar'); if (bar) { bar.style.width = g.stamina + '%'; bar.style.background = g.stamina < 30 ? '#ef4444' : g.stamina < 60 ? '#facc15' : '#4ade80'; }
    var sb = el('shipperBadge');
    if (sb) {
      var r = R();
      if (r && r.shipperOrder) { sb.style.display = 'inline-block'; sb.textContent = '🛵 ' + Math.ceil(r.shipperTimer) + 's'; }
      else sb.style.display = 'none';
    }
    var mb = el('missionBadge');
    if (mb) {
      var done = (g.missions || []).filter(function (m) { return VST.game.missionMet(m) && !m.claimed; }).length;
      mb.style.display = done ? 'inline-block' : 'none';
      mb.textContent = done;
    }
    var pauseBtn = el('btnPause'); if (pauseBtn) pauseBtn.textContent = R() && R().paused ? '▶️' : '⏸️';
    var sfxBtn = el('btnSfx'); if (sfxBtn) sfxBtn.textContent = g.settings.sfx ? '🔊' : '🔇';
    var musBtn = el('btnMusic'); if (musBtn) musBtn.textContent = g.settings.music ? '🎵' : '🔇';
    var spBtn = el('btnSpeed'); if (spBtn) spBtn.textContent = '⏩ x' + g.speed;
  }

  function openModal(name) {
    var r = R(); if (!r) return;
    r.openModal = name;
    var m = el('modal'), body = el('modalBody'), title = el('modalTitle');
    if (!m || !body) return;
    m.classList.add('show');
    renderModal(name);
    if (body) body.scrollTop = 0; // FIX 7.1.3: mo modal luon ve dau danh sach
    if (title) title.textContent = modalTitle(name);
    // Danh dau nut dock dang mo
    document.querySelectorAll('.dock-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-modal') === name);
    });
  }
  function closeModal() {
    var r = R(); if (r) r.openModal = null;
    var m = el('modal'); if (m) m.classList.remove('show');
    document.querySelectorAll('.dock-btn').forEach(function (b) { b.classList.remove('active'); });
  }
  function modalTitle(n) {
    return { stock: '📦 Kho Hang & Dat Si', chapters: '🏆 Chuong & Nang Cap', bank: '🏦 Ngan Hang', missions: '🎯 Nhiem Vu & Thanh Tuu', staff: '👥 Nhan Vien', upgrades: '⬆️ Nang Cap Cua Hang', settings: '⚙️ Cai Dat', tutorial: '📖 Huong Dan Choi', pnl: '📊 Tong Ket Ngay', bankrupt: '💥 Pha San!' }[n] || 'Menu';
  }

  function bar(label, value, max, color) {
    var pct = Math.max(0, Math.min(100, max ? value / max * 100 : 0));
    return '<div class="pnl-row"><span>' + label + '</span><div class="pnl-bar"><div style="width:' + pct + '%;background:' + color + '"></div></div><b>' + U.fmt(value) + 'd</b></div>';
  }

  function renderModal(name) {
    var g = G(), body = el('modalBody'); if (!g || !body) return;
    var d = VST.DATA, h = '';
    if (name === 'stock') {
      h += '<label class="lbl">Gia ban tang them (markup): <b id="markupLabel">' + g.markupPct + '%</b></label>';
      h += '<input id="inpMarkup" type="range" min="0" max="100" value="' + g.markupPct + '" style="width:100%">';
      h += '<p class="hint">Keo de xem gia thay doi, tha tay moi luu. Gia ban = gia goc x (1 + markup).</p>';
      h += '<div class="stock-list">';
      d.PRODUCTS.forEach(function (p) {
        var cap = VST.game.maxCap(p);
        var pIcon = (d.PRODUCT_ICONS && d.PRODUCT_ICONS[p.id]) ? '<img class="product-img" src="' + d.PRODUCT_ICONS[p.id] + '" alt=""> ' : p.icon + ' ';
        h += '<div class="stock-row"><div><b>' + pIcon + p.full + '</b><br><small>Ke ' + g.shelfStock[p.id] + '/' + cap + ' • Kho sau ' + g.backStock[p.id] + ' • Von ' + U.fmtMoney(VST.game.buyPrice(p)) + ' • Ban ' + U.fmtMoney(VST.game.sellPrice(p)) + '</small></div>'
          + '<div class="row-btns"><button class="btn small" onclick="VST.game.restockShelf(\'' + p.id + '\');VST.ui.renderModal(\'stock\')">Len ke</button>'
          + '<button class="btn small gold" onclick="VST.game.orderWholesale(\'' + p.id + '\',1);VST.ui.renderModal(\'stock\')">Dat 1 lo</button>'
          + '<button class="btn small" onclick="VST.game.orderWholesale(\'' + p.id + '\',2);VST.ui.renderModal(\'stock\')">Dat 2 lo</button></div></div>';
      });
      h += '</div><p class="hint">Xe tai ve sau 18s. Hang ve kho sau, bam Len ke de dua len ke.</p>';
      // Gan slider: input chi doi nhan, change moi render lai (fix 6.1)
      setTimeout(function () {
        var inp = el('inpMarkup');
        if (inp) {
          inp.addEventListener('input', function () {
            VST.game.setMarkup(parseInt(inp.value, 10));
            var lb = el('markupLabel'); if (lb) lb.textContent = inp.value + '%';
          });
          inp.addEventListener('change', function () { renderModal('stock'); });
        }
      }, 0);
    } else if (name === 'chapters') {
      var ch = d.CHAPTER_MAP[g.chapterId];
      h += '<p>Tai san rong: <b>' + U.fmtMoney(VST.state.netWorth(g)) + '</b> / muc tieu ' + U.fmtMoney(ch.targetCash) + ' • Sao: <b>' + g.stars.toFixed(1) + '</b> / ' + ch.targetStar + '</p>';
      h += '<button class="btn gold" style="width:100%" onclick="VST.game.tryUpgradeChapter();VST.ui.renderModal(\'chapters\')">⬆️ Len chuong ' + (g.chapterId + 1) + '</button>';
      h += '<div class="chapter-list">';
      d.CHAPTERS.forEach(function (c) {
        h += '<div class="chapter-row' + (c.id === g.chapterId ? ' current' : '') + '"><b>Chuong ' + c.id + ' — ' + c.name + '</b><br><small>' + c.area + ' • Muc tieu ' + U.fmtMoney(c.targetCash) + ' • ' + c.targetStar + '★ • Mo: ' + c.unlock + '</small></div>';
      });
      h += '</div>';
      h += '<h3>⬆️ Nang cap cua hang</h3><div id="upg"></div>';
      setTimeout(function () { var u = el('upg'); if (u) u.innerHTML = upgradesHtml(); }, 0);
    } else if (name === 'bank') {
      h += '<p>Tien mat: <b>' + U.fmtMoney(g.cash) + '</b><br>Tiet kiem: <b>' + U.fmtMoney(g.savings) + '</b> (lai 0.5%/ngay)<br>No: <b>' + U.fmtMoney(VST.state.totalDebt(g)) + '</b> (lai 2%/ngay)<br>Tai san rong: <b>' + U.fmtMoney(VST.state.netWorth(g)) + '</b></p>';
      h += '<div class="row-btns"><input id="bankAmt" type="number" value="1000000" min="100000" step="100000" style="flex:1">'
        + '<button class="btn small" onclick="VST.game.deposit(parseInt(document.getElementById(\'bankAmt\').value,10)||0);VST.ui.renderModal(\'bank\')">Gui</button>'
        + '<button class="btn small" onclick="VST.game.withdraw(parseInt(document.getElementById(\'bankAmt\').value,10)||0);VST.ui.renderModal(\'bank\')">Rut</button></div>';
      h += '<h3>Vay tien (han muc chuong ' + g.chapterId + ': ' + U.fmtMoney(d.CHAPTER_MAP[g.chapterId].loanCap) + ')</h3><div class="row-btns">'
        + '<button class="btn small gold" onclick="VST.game.takeLoan(1000000);VST.ui.renderModal(\'bank\')">Vay 1tr</button>'
        + '<button class="btn small gold" onclick="VST.game.takeLoan(3000000);VST.ui.renderModal(\'bank\')">Vay 3tr</button>'
        + '<button class="btn small gold" onclick="VST.game.takeLoan(5000000);VST.ui.renderModal(\'bank\')">Vay 5tr</button></div>';
      if (g.loans.length) {
        h += '<h3>Khoan no</h3>';
        g.loans.forEach(function (l, i) {
          h += '<div class="stock-row"><span>No con ' + U.fmtMoney(l.remaining) + ' (goc ' + U.fmtMoney(l.amount) + ')</span><button class="btn small" onclick="VST.game.repayLoan(' + i + ',1000000);VST.ui.renderModal(\'bank\')">Tra 1tr</button></div>';
        });
      } else h += '<p class="hint">Chua co khoan vay nao.</p>';
    } else if (name === 'missions') {
      h += '<h3>Nhiem vu ngay ' + g.day + '</h3>';
      (g.missions || []).forEach(function (m) {
        var def = d.MISSION_POOL.find(function (x) { return x.id === m.id; });
        if (!def) return;
        var prog = VST.game.missionProgress(m);
        var met = VST.game.missionMet(m);
        // FIX 7.1.2: nhiem vu 'Khong de mat khach' hien '18 / 0' trong nhu loi;
        // hien ro la so khach da mat / toi da cho phep (0).
        var progText = def.metric === 'starsEnd' ? prog.toFixed(1) + ' / ' + def.target
          : def.metric === 'lostMax' ? 'Da mat ' + U.fmt(prog) + ' khach / toi da 0'
          : U.fmt(prog) + ' / ' + U.fmt(def.target);
        h += '<div class="stock-row"><div><b>' + def.text + '</b><br><small>Tien do: ' + progText + ' • Thuong ' + U.fmtMoney(def.rewardCash) + ' +' + def.rewardCoins + ' xu</small></div>'
          + (m.claimed ? '<span>✅ Da nhan</span>' : met ? '<button class="btn small gold" onclick="VST.game.claimMission(\'' + m.id + '\');VST.ui.renderModal(\'missions\')">Nhan</button>' : '<span>⏳</span>') + '</div>';
      });
      h += '<h3>🏆 Thanh tuu</h3>';
      d.ACHIEVEMENTS.forEach(function (a) {
        var got = g.achievements.includes(a.id);
        h += '<div class="stock-row"><span>' + (got ? '✅' : '🔒') + ' <b>' + a.name + '</b> — ' + a.desc + ' (+' + a.rewardCoins + ' xu)</span></div>';
      });
    } else if (name === 'staff') {
      Object.keys(d.STAFF_TYPES).forEach(function (k) {
        var t = d.STAFF_TYPES[k], s = g.staff[k];
        h += '<div class="stock-row"><div><b>' + t.icon + ' ' + t.name + '</b><br><small>' + t.desc + ' • Luong ' + U.fmtMoney(t.wage) + '/ngay • Mo chuong ' + t.unlockChapter + '</small></div>'
          + (!s.hired ? '<button class="btn small gold" onclick="VST.game.hireStaff(\'' + k + '\');VST.ui.renderModal(\'staff\')">Thue</button>'
            : '<span>Cap ' + s.level + '</span><button class="btn small" onclick="VST.game.levelStaff(\'' + k + '\');VST.ui.renderModal(\'staff\')">Tang cap</button><button class="btn small danger" onclick="VST.game.fireStaff(\'' + k + '\');VST.ui.renderModal(\'staff\')">Nghi viec</button>') + '</div>';
      });
      h += '<p class="hint">Thu ngan tu tinh tien, Nhan vien kho tu len ke, Lao cong tu don vet nuoc, Shipper giao nhanh gap doi.</p>';
    } else if (name === 'upgrades') {
      h += '<div id="upg2"></div>';
      setTimeout(function () { var u = el('upg2'); if (u) u.innerHTML = upgradesHtml(); }, 0);
    } else if (name === 'settings') {
      var s = g.settings;
      h += '<div class="settings-section"><h4>🎮 Do kho</h4><div class="row-btns">'
        + Object.keys(d.DIFFICULTIES).map(function (k) { return '<button class="btn small' + (g.difficulty === k ? ' gold' : '') + '" onclick="VST.ui.setDifficulty(\'' + k + '\')">' + d.DIFFICULTIES[k].name + '</button>'; }).join('') + '</div></div>';
      h += '<div class="settings-section"><h4>⏩ Toc do choi</h4><div class="row-btns"><button class="btn small' + (g.speed === 1 ? ' gold' : '') + '" onclick="VST.game.setSpeed(1);VST.ui.renderModal(\'settings\')">x1</button><button class="btn small' + (g.speed === 2 ? ' gold' : '') + '" onclick="VST.game.setSpeed(2);VST.ui.renderModal(\'settings\')">x2</button></div></div>';
      h += '<div class="settings-section"><h4>🔊 Am thanh</h4><div class="row-btns">'
        + '<button class="btn small btn-toggle' + (s.music ? ' on' : '') + '" onclick="VST.ui.toggleSetting(\'music\')">🎵 Nhac: ' + (s.music ? 'Bat' : 'Tat') + '</button>'
        + '<button class="btn small btn-toggle' + (s.sfx ? ' on' : '') + '" onclick="VST.ui.toggleSetting(\'sfx\')">🔔 Hieu ung: ' + (s.sfx ? 'Bat' : 'Tat') + '</button>'
        + '<button class="btn small btn-toggle' + (s.particles ? ' on' : '') + '" onclick="VST.ui.toggleSetting(\'particles\')">✨ Hat: ' + (s.particles ? 'Bat' : 'Tat') + '</button></div></div>';
      h += '<div class="settings-section"><h4>🕹️ Dieu khien di chuyen</h4><div class="row-btns">'
        + '<button class="btn small btn-toggle' + (s.joystick ? ' on' : '') + '" onclick="VST.ui.toggleSetting(\'joystick\')">🕹️ Joystick ao: ' + (s.joystick ? 'Bat' : 'Tat') + '</button>'
        + '<button class="btn small btn-toggle' + (s.dpad ? ' on' : '') + '" onclick="VST.ui.toggleSetting(\'dpad\')">🔢 D-pad: ' + (s.dpad ? 'Bat' : 'Tat') + '</button>'
        + '<button class="btn small btn-toggle' + (s.walkAnim ? ' on' : '') + '" onclick="VST.ui.toggleSetting(\'walkAnim\')">🚶 Dang di: ' + (s.walkAnim ? 'Bat' : 'Tat') + '</button></div>'
        + '<p class="hint">Joystick chi hien tren man hinh cam ung. Tat Dang di se ve lai kieu pixel cu.</p></div>';
      h += '<div class="settings-section"><h4>🌤️ Thoi tiet hom nay (1 lan/ngay)</h4><div class="row-btns">'
        + Object.keys(d.WEATHERS).map(function (k) { return '<button class="btn small' + (g.weather === k ? ' gold' : '') + '" onclick="VST.game.changeWeather(\'' + k + '\');VST.ui.renderModal(\'settings\')">' + d.WEATHERS[k].icon + ' ' + d.WEATHERS[k].name + '</button>'; }).join('') + '</div>'
        + '<p class="hint">' + d.WEATHERS[g.weather].desc + ' • Da doi ' + g.weatherChangesToday + '/1 lan</p></div>';
      h += '<div class="settings-section"><h4>📖 Che do & Huong dan</h4><p>' + (g.freeMode ? 'Che Do Tu Do — khong gioi han ngay.' : 'Choi theo chuong 1-10. Pha dao chuong 10 de mo Che Do Tu Do.') + '</p>'
        + '<div class="row-btns"><button class="btn small" onclick="VST.ui.showTutorial()">📖 Huong dan 3 buoc</button>'
        + '<button class="btn small" onclick="VST.main.requestInstall()">📲 Cai dat app PWA</button></div></div>';
      h += '<div class="settings-section"><h4>💾 Luu game</h4><div class="row-btns"><button class="btn small gold" onclick="VST.ui.saveNow()">💾 Luu ngay</button><button class="btn small" onclick="VST.ui.exportSave()">📤 Xuat save</button><button class="btn small" onclick="VST.ui.importSavePrompt()">📥 Nhap save</button></div><textarea id="saveBox" rows="3" style="width:100%" placeholder="Save JSON hien o day..."></textarea></div>';
      h += '<div class="settings-section"><h4>⚠️ Nguy hiem</h4><div class="row-btns"><button class="btn small" onclick="VST.ui.newGameConfirm()">🔄 Choi moi</button><button class="btn small danger" onclick="VST.ui.wipeSaveConfirm()">🗑️ Xoa save</button></div></div>';
    } else if (name === 'tutorial') {
      h += '<h3>Buoc 1 — Len hang cho ke</h3><p>Cham vao ke hang (hoac mo Kho) de dua hang tu kho sau len ke. Ke trong thi khach bo di, mat sao.</p>';
      h += '<h3>Buoc 2 — Don khach & tinh tien</h3><p>Khach tu vao cua → di den ke → xep hang o POS. Cham vao POS hoac bam Space de quan ly den tinh tien. Thu ngan (neu da thue) se tu tinh.</p>';
      h += '<h3>Buoc 3 — Mo rong & len chuong</h3><p>Het hang thi Dat si trong Kho, doi xe tai 18s. Dung tien mua san/tuong/thiet bi, vuot muc tieu tai san & sao de len chuong. Het ngay 22:00 xem P&L.</p>';
      h += '<h3>⌨️ Phim tat</h3><table class="kbd-table"><tr><td>WASD / Mui ten</td><td>Di chuyen quan ly (giu phim)</td></tr><tr><td>Chuột / Cham</td><td>Quan ly tu di toi diem cham</td></tr><tr><td>Joystick / D-pad</td><td>Di chuyen tren dien thoai</td></tr><tr><td>Space</td><td>Den POS tinh tien</td></tr><tr><td>P</td><td>Tam dung / Tiep tuc</td></tr><tr><td>Esc</td><td>Dong menu</td></tr></table>';
      h += '<div class="row-btns" style="margin-top:10px"><button class="btn gold" onclick="VST.ui.closeModal()">✅ Hieu roi, choi thoi!</button></div>';
    } else if (name === 'pnl') {    } else if (name === 'pnl') {
      h = '<p class="hint">Ket thuc ngay ' + g.day + '. Bam "Sang ngay moi" de tiep tuc.</p>';
    } else if (name === 'bankrupt') {
      h = '<p>Ban da pha san! Tien mat am va tai san rong am.</p><button class="btn gold" style="width:100%" onclick="VST.game.applyBankrupt();VST.ui.closeModal()">🔄 Choi lai tu chuong hien tai (giu 2.250.000d)</button>';
    }
    body.innerHTML = h;
    updateHud();
  }

  function upgradesHtml() {
    var g = G(), d = VST.DATA, h = '';
    h += '<h4>San nha (hien cap ' + g.floorId + ')</h4>';
    d.FLOORS.forEach(function (f) {
      var owned = g.ownedFloors.includes(f.id);
      h += '<div class="stock-row"><span>' + f.name + ' • Appeal x' + f.appeal + (owned ? ' ✅' : ' • ' + U.fmtMoney(f.price)) + '</span>'
        + (owned ? '<button class="btn small" onclick="VST.state.G.floorId=' + f.id + ';VST.state.saveGame();VST.ui.renderModal(\'chapters\')">Dung</button>' : '<button class="btn small gold" onclick="VST.game.buyFloor(' + f.id + ');VST.ui.renderModal(\'chapters\')">Mua</button>') + '</div>';
    });
    h += '<h4>Tuong (hien cap ' + g.wallId + ')</h4>';
    d.WALLS.forEach(function (w) {
      var owned = g.ownedWalls.includes(w.id);
      h += '<div class="stock-row"><span>' + w.name + ' • Appeal x' + w.appeal + (owned ? ' ✅' : ' • ' + U.fmtMoney(w.price)) + '</span>'
        + (owned ? '<button class="btn small" onclick="VST.state.G.wallId=' + w.id + ';VST.state.saveGame();VST.ui.renderModal(\'chapters\')">Dung</button>' : '<button class="btn small gold" onclick="VST.game.buyWall(' + w.id + ');VST.ui.renderModal(\'chapters\')">Mua</button>') + '</div>';
    });
    h += '<h4>Thiet bi</h4>';
    Object.keys(d.UPGRADES).forEach(function (k) {
      var up = d.UPGRADES[k];
      var cur = k === 'sign' ? g.signLevel : g[k + 'Level'];
      var next = up.levels.find(function (l) { return l.level === cur + 1; });
      // 7.3: the Tu Lanh co anh tu lanh that
      var upImg = (k === 'fridge' && d.IMAGES && d.IMAGES.fridge) ? '<img class="upg-img" src="' + d.IMAGES.fridge + '" alt=""> ' : '';
      h += '<div class="stock-row"><span>' + upImg + '<b>' + up.name + '</b> — cap ' + cur + '</span>'
        + (next ? '<button class="btn small gold" onclick="VST.game.buyUpgrade(\'' + k + '\');VST.ui.renderModal(\'chapters\')">Len cap ' + next.level + ' (' + U.fmtMoney(next.price) + ')</button>' : '<span>MAX</span>') + '</div>';
    });
    return h;
  }

  function showEndDay(stats) {
    var g = G();
    openModal('pnl');
    var body = el('modalBody'); if (!body) return;
    var max = Math.max(stats.revenue, stats.cogs, stats.elec, 1);
    body.innerHTML = '<h3>📊 Ngay ' + g.day + ' ket thuc — ' + (stats.netCash >= 0 ? 'Lai ' : 'Lo ') + U.fmtMoney(Math.abs(stats.netCash)) + '</h3>'
      + bar('Doanh thu', stats.revenue, max, '#4ade80')
      + bar('Gia von', stats.cogs, max, '#f97316')
      + bar('Tien dien', stats.elec, max, '#facc15')
      + bar('Luong NV', stats.wages, max, '#38bdf8')
      + bar('Hong / mat', stats.spoilValue, max, '#ef4444')
      + '<p>Phuc vu <b>' + stats.served + '</b> khach • Mat <b>' + stats.lost + '</b> khach • Tip <b>' + U.fmtMoney(stats.tips) + '</b><br>'
      + 'Lai gop: <b>' + U.fmtMoney(stats.gross) + '</b> • Lai vay: -' + U.fmtMoney(stats.loanInterest) + ' • Lai gui: +' + U.fmtMoney(stats.saveInterest) + '<br>'
      + 'Tien mat hien: <b>' + U.fmtMoney(g.cash) + '</b> • Sao: <b>' + g.stars.toFixed(1) + '★</b></p>'
      + '<button class="btn gold" style="width:100%" onclick="VST.game.startNextDay()">🌅 Sang ngay moi</button>'
      + '<button class="btn" style="width:100%;margin-top:8px" onclick="VST.game.tryUpgradeChapter();VST.ui.showEndDay(window.__vstLastStats||{revenue:0,cogs:0,elec:0,wages:0,spoilValue:0,loanInterest:0,saveInterest:0,netCash:0,served:0,lost:0,tips:0,gross:0})">⬆️ Thu len chuong</button>';
    window.__vstLastStats = stats;
  }
  function showBankrupt(stats) {
    openModal('bankrupt');
    var body = el('modalBody');
    if (body) body.innerHTML = '<p>Ngay ' + G().day + ' ket thuc voi tien mat am. Ban da pha san!</p><p>Tien mat: <b>' + U.fmtMoney(G().cash) + '</b> • Tai san rong: <b>' + U.fmtMoney(VST.state.netWorth(G())) + '</b></p><button class="btn gold" style="width:100%" onclick="VST.game.applyBankrupt();VST.ui.closeModal()">🔄 Choi lai tu chuong hien tai (giu 2.250.000d)</button>';
  }

  function showStartScreen(hasSave) {
    var s = el('startScreen'); if (!s) return;
    s.classList.remove('hidden');
    var cont = el('btnContinue'); if (cont) cont.style.display = hasSave ? 'inline-block' : 'none';
  }
  function hideStartScreen() { var s = el('startScreen'); if (s) s.classList.add('hidden'); }
  function exportSave() {
    var b = el('saveBox'); var j = VST.state.exportSave();
    if (b) b.value = j;
    if (navigator.clipboard) navigator.clipboard.writeText(j).catch(function () {});
    toast('Da copy save JSON (neu trinh duyet cho phep)');
  }
  function importSavePrompt() {
    var b = el('saveBox');
    if (!b || !b.value) { toast('Dan save JSON vao o tren roi bam Nhap save'); return; }
    if (VST.state.importSave(b.value)) { toast('Nhap save thanh cong!'); location.reload(); }
    else toast('Save khong hop le');
  }

  var confirmCallback = null;
  function confirmDlg(title, text, onYes) {
    confirmCallback = onYes;
    var t = el('confirmTitle'), x = el('confirmText'), m = el('confirmModal');
    if (t) t.textContent = title;
    if (x) x.textContent = text;
    if (m) m.classList.add('show');
  }
  function closeConfirm() {
    var m = el('confirmModal'); if (m) m.classList.remove('show');
    confirmCallback = null;
  }
  function toggleSetting(key) {
    var g = G(); if (!g) return;
    if (key === 'music') { VST.audio.toggleMusic(); }
    else {
      g.settings[key] = !g.settings[key];
      if (key === 'sfx') VST.audio.sfx('click');
    }
    VST.state.saveGame();
    if (key === 'joystick' || key === 'dpad') VST.main.syncControlsVisibility();
    if (R() && R().openModal === 'settings') renderModal('settings');
    updateHud();
    toast({ music: 'Nhac: ' + (g.settings.music ? 'Bat' : 'Tat'), sfx: 'Am thanh: ' + (g.settings.sfx ? 'Bat' : 'Tat'), particles: 'Hieu ung hat: ' + (g.settings.particles ? 'Bat' : 'Tat'), joystick: 'Joystick ao: ' + (g.settings.joystick ? 'Bat' : 'Tat'), dpad: 'D-pad: ' + (g.settings.dpad ? 'Bat' : 'Tat'), walkAnim: 'Dang di: ' + (g.settings.walkAnim ? 'Bat' : 'Tat') }[key] || 'Da luu cai dat');
  }
  function setDifficulty(k) {
    var g = G(); if (!g) return;
    g.difficulty = k;
    VST.state.saveGame();
    if (R() && R().openModal === 'settings') renderModal('settings');
    updateHud();
    toast('Do kho: ' + (VST.DATA.DIFFICULTIES[k] || {}).name);
  }
  function saveNow() { VST.state.saveGame(); toast('Da luu game!'); }
  function newGameConfirm() {
    confirmDlg('Choi moi?', 'Tien do hien tai se bi xoa het va choi lai tu Chuong 1. Ban co chac khong?', function () {
      VST.state.wipeSave(); location.reload();
    });
  }
  function wipeSaveConfirm() {
    confirmDlg('Xoa save?', 'Toan bo tien do, tien va thanh tich se bi xoa vinh vien. Ban co chac khong?', function () {
      VST.state.wipeSave(); location.reload();
    });
  }
  function showTutorial() { openModal('tutorial'); }

  function bind() {
    document.querySelectorAll('[data-modal]').forEach(function (b) {
      b.addEventListener('click', function () {
        VST.audio.sfx('click');
        var m = b.getAttribute('data-modal');
        if (R() && R().openModal === m) closeModal(); else openModal(m);
      });
    });
    var closeBtn = el('btnCloseModal');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      // Pha san thi khong cho dong modal
      if (R() && R().openModal === 'bankrupt') { toast('Da pha san, bam Choi Lai!'); return; }
      closeModal();
    });
    var m = el('modal');
    if (m) m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
    var by = el('btnConfirmYes');
    if (by) by.addEventListener('click', function () { var cb = confirmCallback; closeConfirm(); if (cb) cb(); });
    var bn = el('btnConfirmNo');
    if (bn) bn.addEventListener('click', function () { closeConfirm(); });
    var cm = el('confirmModal');
    if (cm) cm.addEventListener('click', function (e) { if (e.target === cm) closeConfirm(); });
  }

  VST.ui = {
    toast: toast, updateHud: updateHud, openModal: openModal, closeModal: closeModal,
    renderModal: renderModal, showEndDay: showEndDay, showBankrupt: showBankrupt,
    showStartScreen: showStartScreen, hideStartScreen: hideStartScreen,
    exportSave: exportSave, importSavePrompt: importSavePrompt, bind: bind,
    toggleSetting: toggleSetting, setDifficulty: setDifficulty, saveNow: saveNow,
    confirmDlg: confirmDlg, closeConfirm: closeConfirm, newGameConfirm: newGameConfirm,
    wipeSaveConfirm: wipeSaveConfirm, showTutorial: showTutorial
  };
})();
