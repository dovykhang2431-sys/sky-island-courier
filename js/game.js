/* Vua Sieu Thi Pho — PWA v7.1 | js/game.js
   Vong choi: ngay 7:00-22:00, khach, checkout, len ke, dat si, shipper,
   ca phe, su co, thoi tiet, sao, tien dien, cuoi ngay P&L.
   Ke thua fix 6.1: pause khi mo modal, checkout het hang doi o POS,
   len chuong theo tai san rong, thoi tiet 1 lan/ngay, dien 100k+50k/chuong. */
(function () {
  var VST = window.VST || (window.VST = {});
  var U = VST.util, D = null; // D = VST.DATA (gan luc chay, de test Node)
  function data() { return VST.DATA; }
  function G() { return VST.state.G; }
  function toast(m) { if (VST.ui && VST.ui.toast) VST.ui.toast(m); }
  function sfx(n) { if (VST.audio) VST.audio.sfx(n); }

  var R = null; // runtime volatile
  function resetRunState() {
    R = {
      minuteOfDay: 420, paused: false, openModal: null,
      manager: { x: 35, y: 40, tx: 35, ty: 40, moving: false, targetAction: null, targetPid: null, face: 1, dir: 'right', walkTimer: 0, walkFrame: 1, moveDir: { x: 0, y: 0 } },
      joy: { active: false, dx: 0, dy: 0 },
      customers: [], floatTexts: [], particles: [],
      spawnTimer: 2, eventTimer: 35, cashierTimer: 0, stockerTimer: 8, cleanerTimer: 0,
      shipperOrder: null, shipperTimer: 0,
      truckTimer: 0, custId: 1, lastHud: 0, influencerBoost: 0, gameOver: false
    };
    if (VST.game) VST.game.R = R; // VST.game chua ton tai luc file moi load
    return R;
  }
  resetRunState();

  function sellPrice(p) { var g = G(); return Math.round(p.basePrice * (1 + (g.markupPct || 30) / 100) / 1000) * 1000; }
  function buyPrice(p) { return Math.round(p.basePrice * p.cogsPct / 100 / 1000) * 1000; }
  function maxCap(p) { var g = G(); var m = g.shelfLevel >= 3 ? 2 : g.shelfLevel >= 2 ? 1.5 : 1; return Math.floor(p.maxCap * m); }
  function appeal() {
    var g = G(), d = data();
    var f = d.FLOORS[g.floorId - 1], w = d.WALLS[g.wallId - 1];
    var s = g.shelfLevel >= 3 ? 1.15 : g.shelfLevel >= 2 ? 1.08 : 1;
    return f.appeal * w.appeal * s;
  }
  function spawnInterval() {
    var g = G(), d = data(), ch = d.CHAPTER_MAP[g.chapterId];
    var iv = ch.spawnSec / d.DIFFICULTIES[g.difficulty].spawnMult;
    iv /= d.WEATHERS[g.weather].spawnMult;
    var sign = d.UPGRADES.sign.levels[g.signLevel] || {};
    if (sign.spawnMult) iv /= sign.spawnMult;
    if (g.events.flashSale) iv *= 0.66;
    if (R.influencerBoost > 0) iv *= 0.8;
    iv /= appeal();
    return Math.max(0.9, iv);
  }
  function burst(x, y, color, n) {
    var g = G(); if (g && g.settings && g.settings.particles === false) return;
    for (var i = 0; i < (n || 6); i++) {
      if (R.particles.length >= 60) return;
      R.particles.push({ x: x, y: y, vx: U.rand(-6, 6), vy: U.rand(-14, -4), life: 0, maxLife: U.rand(0.5, 1.1), color: color, size: U.rand(2, 4) });
    }
  }
  function floatText(x, y, text, color) {
    R.floatTexts.push({ x: x, y: y, text: text, color: color || '#facc15', life: 0 });
    if (R.floatTexts.length > 20) R.floatTexts.shift();
  }

  // ---- Khach ----
  function spawnCustomer(forceType) {
    var g = G(), d = data(), ch = d.CHAPTER_MAP[g.chapterId];
    if (R.customers.length >= ch.maxCust) return null;
    var keys = Object.keys(d.CUSTOMER_TYPES);
    var typeKey = forceType || U.pick(keys);
    var t = d.CUSTOMER_TYPES[typeKey];
    var patience = 22 * t.patience / 22 * d.DIFFICULTIES[g.difficulty].patienceMult;
    patience = t.patience * d.DIFFICULTIES[g.difficulty].patienceMult;
    var c = {
      id: R.custId++, type: typeKey, x: 50, y: 92, tx: 50, ty: 92,
      state: 'enter', patience: patience, maxPatience: patience,
      basket: [], targetShelf: null, waitTimer: U.rand(3, 6), phase: Math.random() * 6.28,
      speed: 9 * t.speed, spent: 0, mood: 'ok', dir: 'right', walkTimer: Math.random() * 0.4, walkFrame: 1, moving: false
    };
    // Chon ke: tre em chi keo/snack, con lai ngau nhien 1-2 ke
    var pool = typeKey === 'kid' ? ['candy', 'snack'] : VST.DATA.PRODUCTS.map(function (p) { return p.id; });
    c.targetShelf = U.pick(pool);
    R.customers.push(c);
    return c;
  }
  function shelfPos(pid) {
    var s = data().SHELVES.find(function (x) { return x.productId === pid; });
    return s || { x: 50, y: 40, w: 18, h: 15 };
  }
  function hitsShelf(x, y) {
    var d = data(); if (!d || !d.SHELVES) return false;
    for (var i = 0; i < d.SHELVES.length; i++) {
      var s = d.SHELVES[i];
      if (x > s.x - 1.5 && x < s.x + s.w + 1.5 && y > s.y - 1.5 && y < s.y + s.h + 1.5) return true;
    }
    return false;
  }
  function moveToward(c, tx, ty, speed, dt) {
    var dx = tx - c.x, dy = ty - c.y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.6) { c.x = tx; c.y = ty; return true; }
    var step = speed * dt;
    if (step >= dist) {
      if (!hitsShelf(tx, ty)) { c.x = tx; c.y = ty; return true; }
      // Dich den nam trong ke: dung ngay truoc ke
      return false;
    }
    var nx = c.x + dx / dist * step, ny = c.y + dy / dist * step;
    if (!hitsShelf(nx, ny)) { c.x = nx; c.y = ny; return false; }
    // Truot doc canh ke: thu di rieng theo truc X roi truc Y
    if (!hitsShelf(nx, c.y)) { c.x = nx; return false; }
    if (!hitsShelf(c.x, ny)) { c.y = ny; return false; }
    return false;
  }
  function updateWalk(c, dt, moving, dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) c.dir = dx >= 0 ? 'right' : 'left';
    else if (dy !== 0) c.dir = dy > 0 ? 'down' : 'up';
    c.moving = !!moving;
    if (moving) { c.walkTimer += dt; c.walkFrame = Math.floor(c.walkTimer * 1000 / 120) % 4; }
    else { c.walkFrame = 1; }
  }
  function managerSpeed() {
    var g = G();
    var base = 16 * (1 + (g.floorId - 1) * 0.04);
    if (g.stamina < 30) base *= 0.7; else if (g.stamina < 60) base *= 0.85;
    return base;
  }

  function customerPick(c) {
    var g = G(), d = data();
    var pid = c.targetShelf, p = d.PRODUCT_MAP[pid];
    if (g.shelfStock[pid] > 0) {
      var qty = c.type === 'vip' ? 3 : c.type === 'kid' ? 1 : U.randInt(1, 2);
      qty = Math.min(qty, g.shelfStock[pid]);
      g.shelfStock[pid] -= qty;
      c.basket.push({ pid: pid, qty: qty });
      c.spent += qty * sellPrice(p);
      return true;
    }
    return false;
  }

  function checkoutNextCustomer() {
    var g = G();
    var q = R.customers.find(function (c) { return c.state === 'queue'; });
    if (!q) return false;
    var total = q.basket.reduce(function (s, b) { return s + b.qty * sellPrice(data().PRODUCT_MAP[b.pid]); }, 0);
    if (total <= 0) total = sellPrice(data().PRODUCT_MAP[q.targetShelf]);
    var t = data().CUSTOMER_TYPES[q.type];
    var tip = 0;
    if (g.stars >= 4) tip = Math.round(total * 0.05 * t.tip);
    var gain = total + tip;
    g.cash += gain;
    g.dayStats.revenue += total; g.dayStats.tips += tip;
    g.dayStats.served++; g.totalStats.served++; g.totalStats.revenue += total;
    g.stars = U.clamp(g.stars + 0.04, 1, 5);
    if (q.type === 'influencer') { R.influencerBoost = 1; toast('Influencer khen sieu thi! Mai se dong khach hon 📱'); }
    if (q.type === 'vip') burst(88, 76, '#facc15', 8);
    else burst(88, 76, '#facc15', 5);
    floatText(88, 70, '+' + U.fmt(gain) + 'd', '#facc15');
    sfx('coin');
    q.state = 'leave'; q.tx = 50; q.ty = 92;
    VST.state.saveGame();
    return true;
  }
  function checkoutAll() { var n = 0; while (checkoutNextCustomer()) n++; return n; }

  // ---- Len ke / dat si / ca phe ----
  function restockShelf(pid) {
    var g = G(), p = data().PRODUCT_MAP[pid];
    if (!p) return false;
    var cap = maxCap(p);
    if (g.shelfStock[pid] >= cap) { toast('Ke ' + p.name + ' da day'); return false; }
    if ((g.backStock[pid] || 0) <= 0) { toast('Het hang trong kho, hay dat si ' + p.name); sfx('error'); return false; }
    var n = Math.min(p.batchQty, cap - g.shelfStock[pid], g.backStock[pid]);
    g.backStock[pid] -= n; g.shelfStock[pid] += n;
    g.dayStats.restocks++;
    g.stamina = U.clamp(g.stamina - 2, 0, 100);
    var s = shelfPos(pid);
    burst(s.x + s.w / 2, s.y + 4, '#facc15', 8);
    floatText(s.x + s.w / 2, s.y - 2, '+' + n + ' ' + p.name, '#4ade80');
    sfx('restock');
    VST.state.saveGame();
    return true;
  }
  function orderWholesale(pid, batches) {
    var g = G(), p = data().PRODUCT_MAP[pid];
    if (!p) return false;
    batches = Math.max(1, Math.floor(batches || 1));
    if (g.truck.stage !== 0) { toast('Xe tai dang chay, doi chut nhe'); return false; }
    var cost = buyPrice(p) * p.batchQty * batches;
    if (g.cash < cost) { toast('Khong du tien dat si (' + U.fmtMoney(cost) + ')'); sfx('error'); return false; }
    g.cash -= cost; g.dayStats.cogs += cost; g.dayStats.orders++;
    g.truck = { stage: 1, timer: 18, order: { pid: pid, qty: p.batchQty * batches, batches: batches } };
    toast('Da dat ' + batches + ' lo ' + p.name + ' — xe tai dang den 🚚');
    sfx('pop');
    VST.state.saveGame();
    return true;
  }
  function brewCoffee() {
    var g = G();
    if (g.cash < 15000) { toast('Khong du 15.000d pha ca phe'); sfx('error'); return false; }
    if (g.stamina >= 98) { toast('The luc da day, khong can ca phe'); return false; }
    g.cash -= 15000;
    var gain = g.coffeeLevel >= 2 ? 60 : 40;
    g.stamina = U.clamp(g.stamina + gain, 0, 100);
    g.dayStats.coffees++;
    burst(8, 76, '#fff7ed', 6);
    toast('Ca phe phin xong! +' + gain + ' the luc ☕');
    sfx('pop');
    VST.state.saveGame();
    return true;
  }

  // ---- Nhan vien / nang cap ----
  function hireStaff(id) {
    var g = G(), t = data().STAFF_TYPES[id];
    if (!t) return false;
    if (g.chapterId < t.unlockChapter) { toast(t.name + ' mo o chuong ' + t.unlockChapter); return false; }
    if (g.staff[id].hired) { toast(t.name + ' da lam viec roi'); return false; }
    if (g.cash < t.wage) { toast('Can ' + U.fmtMoney(t.wage) + ' de tra luong ngay dau'); sfx('error'); return false; }
    g.cash -= t.wage;
    g.staff[id].hired = true; g.staff[id].level = 1;
    toast('Da thue ' + t.name + ' 🎉'); sfx('levelup');
    VST.state.saveGame(); return true;
  }
  function fireStaff(id) {
    var g = G();
    if (!g.staff[id] || !g.staff[id].hired) return false;
    g.staff[id].hired = false; toast('Da cho nghi viec'); VST.state.saveGame(); return true;
  }
  function levelStaff(id) {
    var g = G(), t = data().STAFF_TYPES[id];
    if (!g.staff[id].hired || g.staff[id].level >= 3) return false;
    var cost = t.wage * 2 * g.staff[id].level;
    if (g.cash < cost) { toast('Can ' + U.fmtMoney(cost) + ' de tang cap'); sfx('error'); return false; }
    g.cash -= cost; g.staff[id].level++;
    toast(t.name + ' len cap ' + g.staff[id].level + '!'); sfx('levelup');
    VST.state.saveGame(); return true;
  }
  function buyFloor(id) {
    var g = G(), f = data().FLOORS[id - 1];
    if (!f || g.ownedFloors.includes(id)) return false;
    if (g.cash < f.price) { toast('Can ' + U.fmtMoney(f.price)); sfx('error'); return false; }
    g.cash -= f.price; g.ownedFloors.push(id); g.floorId = id;
    toast('Da lat san ' + f.name); sfx('levelup'); VST.state.saveGame(); return true;
  }
  function buyWall(id) {
    var g = G(), w = data().WALLS[id - 1];
    if (!w || g.ownedWalls.includes(id)) return false;
    if (g.cash < w.price) { toast('Can ' + U.fmtMoney(w.price)); sfx('error'); return false; }
    g.cash -= w.price; g.ownedWalls.push(id); g.wallId = id;
    toast('Da son tuong ' + w.name); sfx('levelup'); VST.state.saveGame(); return true;
  }
  function buyUpgrade(kind) {
    var g = G(), up = data().UPGRADES[kind];
    if (!up) return false;
    var cur = kind === 'sign' ? g.signLevel : g[kind + 'Level'];
    var next = up.levels.find(function (l) { return l.level === cur + 1; });
    if (!next) { toast(up.name + ' da max cap'); return false; }
    if (g.cash < next.price) { toast('Can ' + U.fmtMoney(next.price)); sfx('error'); return false; }
    g.cash -= next.price;
    if (kind === 'sign') g.signLevel = next.level; else g[kind + 'Level'] = next.level;
    toast(up.name + ' len cap ' + next.level + '!'); sfx('levelup');
    VST.state.saveGame(); return true;
  }

  // ---- Thoi tiet / ngan hang ----
  function changeWeather(w) {
    var g = G();
    if (!data().WEATHERS[w]) return false;
    if (g.weatherChangesToday >= 1) { toast('Hom nay chi doi thoi tiet 1 lan thoi'); sfx('error'); return false; }
    if (g.weather === w) { toast('Dang la thoi tiet ' + data().WEATHERS[w].name + ' roi'); return false; }
    g.weather = w; g.weatherChangesToday++;
    toast('Thoi tiet: ' + data().WEATHERS[w].name + ' ' + data().WEATHERS[w].icon);
    VST.state.saveGame(); return true;
  }
  function takeLoan(amount) {
    var g = G(), ch = data().CHAPTER_MAP[g.chapterId];
    amount = Math.floor(amount);
    if (amount <= 0 || amount > ch.loanCap) { toast('Han muc vay chuong nay: ' + U.fmtMoney(ch.loanCap)); return false; }
    if (totalDebt0() + amount > ch.loanCap * 2) { toast('No qua nhieu roi!'); return false; }
    g.loans.push({ amount: amount, remaining: Math.round(amount * 1.1), rate: 0.1 });
    g.cash += amount; toast('Da vay ' + U.fmtMoney(amount)); VST.state.saveGame(); return true;
    function totalDebt0() { return VST.state.totalDebt(g); }
  }
  function repayLoan(idx, amount) {
    var g = G(), l = g.loans[idx];
    if (!l) return false;
    amount = Math.min(Math.floor(amount || l.remaining), l.remaining, g.cash);
    if (amount <= 0) { toast('Khong du tien tra no'); sfx('error'); return false; }
    g.cash -= amount; l.remaining -= amount;
    if (l.remaining <= 0) g.loans.splice(idx, 1);
    toast('Da tra ' + U.fmtMoney(amount) + ' tien no'); VST.state.saveGame(); return true;
  }
  function deposit(amount) {
    var g = G(); amount = Math.min(Math.floor(amount), g.cash);
    if (amount <= 0) { toast('Khong du tien gui'); return false; }
    g.cash -= amount; g.savings += amount; VST.state.saveGame(); return true;
  }
  function withdraw(amount) {
    var g = G(); amount = Math.min(Math.floor(amount), g.savings);
    if (amount <= 0) { toast('Tiet kiem dang 0'); return false; }
    g.savings -= amount; g.cash += amount; VST.state.saveGame(); return true;
  }

  // ---- Nhiem vu / thanh tuu ----
  function genDailyMissions() {
    var g = G();
    var pool = data().MISSION_POOL.slice();
    var chosen = [];
    while (chosen.length < 3 && pool.length) chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    g.missions = chosen.map(function (m) { return { id: m.id, done: false, claimed: false }; });
    g.missionsDone = [];
  }
  function missionProgress(m) {
    var g = G(), def = data().MISSION_POOL.find(function (x) { return x.id === m.id; });
    if (!def) return 0;
    var s = g.dayStats;
    if (def.metric === 'served') return s.served;
    if (def.metric === 'revenue') return s.revenue;
    if (def.metric === 'lostMax') return s.lost;
    if (def.metric === 'restocks') return s.restocks;
    if (def.metric === 'coffees') return s.coffees;
    if (def.metric === 'starsEnd') return g.stars;
    return 0;
  }
  function missionMet(m) {
    var def = data().MISSION_POOL.find(function (x) { return x.id === m.id; });
    if (!def) return false;
    if (def.metric === 'lostMax') return missionProgress(m) <= def.target;
    return missionProgress(m) >= def.target;
  }
  function claimMission(id) {
    var g = G(), m = (g.missions || []).find(function (x) { return x.id === id; });
    if (!m || m.claimed) return false;
    var def = data().MISSION_POOL.find(function (x) { return x.id === id; });
    if (!def) return false;
    // Nhiem vu starsEnd / lostMax chi nhan duoc o cuoi ngay; con lai nhan ngay khi dat
    if (!missionMet(m)) { toast('Chua hoan thanh nhiem vu nay'); sfx('error'); return false; }
    m.claimed = true; m.done = true;
    g.cash += def.rewardCash; g.coins += def.rewardCoins;
    toast('Nhan thuong nhiem vu: +' + U.fmtMoney(def.rewardCash) + ' +' + def.rewardCoins + ' xu 🎁');
    sfx('levelup'); VST.state.saveGame(); return true;
  }
  function checkAchievements() {
    var g = G();
    data().ACHIEVEMENTS.forEach(function (a) {
      if (g.achievements.includes(a.id)) return;
      var ok = false;
      if (a.id === 'serve100') ok = g.totalStats.served >= 100;
      if (a.id === 'serve500') ok = g.totalStats.served >= 500;
      if (a.id === 'rev10m') ok = g.totalStats.revenue >= 10000000;
      if (a.id === 'star5') ok = g.stars >= 5;
      if (a.id === 'chap5') ok = g.chapterId >= 5;
      if (a.id === 'chap10') ok = g.chapterId >= 10 && g.freeMode;
      if (a.id === 'rich') ok = VST.state.netWorth(g) >= 100000000;
      if (ok) {
        g.achievements.push(a.id); g.coins += a.rewardCoins;
        toast('Thanh tuu: ' + a.name + ' +' + a.rewardCoins + ' xu 🏆');
        sfx('levelup');
      }
    });
  }

  // ---- Su co ----
  function triggerEvent() {
    var g = G(), d = data();
    var roll = Math.random();
    if (roll < 0.22 && !g.events.fridgeFrost) {
      g.events.fridgeFrost = true; g.events.frostTimer = 25;
      toast('❄️ Tu dong tuyet! Sua se hong nhanh, cham vao tu de xu ly'); sfx('event');
    } else if (roll < 0.42 && !g.events.spill) {
      g.events.spill = true; g.events.spillTimer = 30;
      toast('💧 Co nguoi lam do nuoc! Khach se truot nga neu khong don'); sfx('event');
    } else if (roll < 0.54 && !g.events.blackout) {
      g.events.blackout = true; g.events.blackoutTimer = 30;
      toast('⚡ Mat dien 30s! Khach di cham lai'); sfx('event');
    } else if (roll < 0.68 && !g.events.flashSale) {
      g.events.flashSale = true; g.events.flashTimer = 60;
      toast('🔥 FLASH SALE 1 phut! Khach do ve gap 1.5 lan'); sfx('event');
    } else if (roll < 0.84) {
      spawnCustomer('vip');
      toast('👑 Khach VIP vua den!');
    } else {
      toast('🧑‍💼 Thanh tra ghe tham — giu sao tren 4.0 nhe!');
      if (g.stars >= 4) { g.coins += 3; toast('Thanh tra hai long +3 xu'); }
    }
  }
  function clearEvent(kind) {
    var g = G();
    if (kind === 'frost' && g.events.fridgeFrost) { g.events.fridgeFrost = false; g.events.frostTimer = 0; toast('Da cao tuyet tu dong ❄️'); }
    if (kind === 'spill' && g.events.spill) { g.events.spill = false; g.events.spillTimer = 0; toast('Da lau sach vet nuoc'); }
    VST.state.saveGame();
  }

  // ---- Shipper ----
  function createShipperOrder() {
    var g = G();
    var pid = U.pick(data().PRODUCTS.map(function (p) { return p.id; }));
    var qty = U.randInt(3, 6);
    var p = data().PRODUCT_MAP[pid];
    var reward = Math.round(qty * sellPrice(p) * 1.2 * (g.weather === 'rain' ? 1.5 : 1));
    R.shipperOrder = { pid: pid, qty: qty, reward: reward };
    R.shipperTimer = g.staff.shipper.hired ? 25 : 50;
    toast('🛵 Don shipper: giao ' + qty + ' ' + p.name + ' — thuong ' + U.fmtMoney(reward));
  }
  function deliverShipper() {
    var g = G(), o = R.shipperOrder;
    if (!o) return false;
    if ((g.shelfStock[o.pid] || 0) < o.qty && (g.backStock[o.pid] || 0) < o.qty) {
      // Lay tu kho sau neu du, khong thi bao thieu
      toast('Thieu hang de giao shipper!'); sfx('error'); return false;
    }
    if (g.shelfStock[o.pid] >= o.qty) g.shelfStock[o.pid] -= o.qty;
    else { var need = o.qty - g.shelfStock[o.pid]; g.shelfStock[o.pid] = 0; g.backStock[o.pid] -= need; }
    g.cash += o.reward; g.dayStats.revenue += o.reward;
    burst(50, 10, '#38bdf8', 8);
    toast('Giao shipper xong +' + U.fmtMoney(o.reward));
    sfx('coin');
    R.shipperOrder = null;
    VST.state.saveGame();
    return true;
  }

  // ---- Vong ngay ----
  function startDay() {
    var g = G();
    resetRunState();
    genDailyMissions();
    g.weather = 'sun'; g.weatherChangesToday = 0;
    g.dayStats = { served: 0, lost: 0, revenue: 0, cogs: 0, tips: 0, restocks: 0, coffees: 0, orders: 0 };
    g.stamina = 100;
    if (VST.ui) VST.ui.updateHud();
  }
  function endDay() {
    var g = G(), d = data(), ch = d.CHAPTER_MAP[g.chapterId];
    var elecBase = 100000 + g.chapterId * 50000;
    var elec = Math.round(elecBase * d.DIFFICULTIES[g.difficulty].elecMult * (1 - (g.floorId - 1) * 0.05 - (g.wallId - 1) * 0.03) * (g.weather === 'fest' ? 1.1 : 1));
    // Hong rau cuoi ngay
    var spoilRate = g.fridgeLevel >= 3 ? 0.05 : g.fridgeLevel >= 2 ? 0.1 : 0.2;
    if (g.weather === 'fest') spoilRate += 0.1;
    var spoilValue = 0;
    data().PRODUCTS.forEach(function (p) {
      if (!p.perishable) return;
      var lost = Math.floor(g.shelfStock[p.id] * spoilRate);
      if (lost > 0) { g.shelfStock[p.id] -= lost; spoilValue += lost * buyPrice(p); }
    });
    if (g.events.fridgeFrost) {
      var mlost = Math.floor(g.shelfStock.milk * 0.3);
      g.shelfStock.milk -= mlost; spoilValue += mlost * buyPrice(data().PRODUCT_MAP.milk);
      g.events.fridgeFrost = false; g.events.frostTimer = 0;
    }
    var wages = 0;
    Object.keys(d.STAFF_TYPES).forEach(function (k) {
      if (g.staff[k].hired) wages += d.STAFF_TYPES[k].wage * g.staff[k].level;
    });
    var loanInterest = Math.round(VST.state.totalDebt(g) * 0.02);
    var saveInterest = Math.round(g.savings * 0.005);
    var gross = g.dayStats.revenue - g.dayStats.cogs;
    var netCash = -elec - wages - spoilValue - loanInterest + saveInterest;
    g.cash += netCash;
    g.savings += saveInterest;
    g.loans.forEach(function (l) { l.remaining += Math.round(l.remaining * 0.02); });
    g.totalStats.days++;
    // Nhiem vu cuoi ngay
    (g.missions || []).forEach(function (m) {
      if (!m.done && missionMet(m)) { m.done = true; }
    });
    checkAchievements();
    var stats = { revenue: g.dayStats.revenue, cogs: g.dayStats.cogs, gross: gross, elec: elec, wages: wages, spoilValue: spoilValue, loanInterest: loanInterest, saveInterest: saveInterest, netCash: netCash, served: g.dayStats.served, lost: g.dayStats.lost, tips: g.dayStats.tips };
    R.paused = true;
    VST.state.saveGame();
    return stats;
  }
  function startNextDay() {
    var g = G();
    g.day++;
    // Lai tiet kiem da tinh o endDay; tra no tu dong neu du? khong.
    startDay();
    R.paused = false;
    if (VST.ui) { VST.ui.closeModal(); VST.ui.updateHud(); }
    VST.state.saveGame();
  }
  function tryUpgradeChapter() {
    var g = G(), d = data();
    if (g.freeMode) { toast('Dang o Che Do Tu Do roi'); return false; }
    var ch = d.CHAPTER_MAP[g.chapterId];
    var next = d.CHAPTER_MAP[g.chapterId + 1];
    var worth = VST.state.netWorth(g);
    if (worth < ch.targetCash || g.stars < ch.targetStar) {
      toast('Can tai san rong ' + U.fmtMoney(ch.targetCash) + ' va ' + ch.targetStar + ' sao (hien ' + U.fmtMoney(worth) + ' / ' + g.stars.toFixed(1) + '★)');
      sfx('error'); return false;
    }
    if (!next) {
      g.freeMode = true;
      toast('🎉 PHA DAO! Mo Che Do Tu Do!'); sfx('levelup');
      checkAchievements(); VST.state.saveGame(); return true;
    }
    g.chapterId = next.id;
    burst(50, 40, '#facc15', 20);
    toast('🎉 Len chuong ' + next.id + ': ' + next.name + '! Mo: ' + next.unlock);
    sfx('levelup');
    checkAchievements(); VST.state.saveGame(); return true;
  }
  function applyBankrupt() {
    var g = G();
    g.cash = 2250000; g.savings = 0; g.loans = [];
    g.stars = 3.6; g.stamina = 100;
    g.events = { fridgeFrost: false, frostTimer: 0, spill: false, spillTimer: 0, blackout: false, blackoutTimer: 0, flashSale: false, flashTimer: 0 };
    g.truck = { stage: 0, timer: 0, order: null };
    resetRunState(); R.paused = false;
    toast('Pha san! Choi lai tu chuong hien tai voi 50% tien khoi diem');
    VST.state.saveGame();
  }
  function newGame(diff) {
    VST.state.G = VST.state.createInitialState(diff || 'vua');
    startDay();
    R.paused = false;
    VST.state.saveGame();
  }

  // ---- Update chinh ----
  function updateGame(dt) {
    var g = G(); if (!g) return;
    dt = Math.min(dt, 0.1) * (g.speed || 1);
    // Particles + float text luon chay (ke ca khi pause nhe)
    R.particles.forEach(function (p) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 8 * dt; });
    R.particles = R.particles.filter(function (p) { return p.life < p.maxLife; });
    R.floatTexts.forEach(function (f) { f.life += dt; f.y -= 6 * dt; });
    R.floatTexts = R.floatTexts.filter(function (f) { return f.life < 1.2; });
    if (R.paused || R.openModal || R.gameOver) return;
    // Dong ho: 0.35s thuc = 1 phut game o toc do 1x
    R.minuteOfDay += dt / 0.35;
    if (R.minuteOfDay >= 1320) {
      R.minuteOfDay = 1320;
      var stats = endDay();
      if (g.cash < 0 && VST.state.netWorth(g) < 0) {
        if (VST.ui) VST.ui.showBankrupt(stats);
      } else if (VST.ui) {
        VST.ui.showEndDay(stats);
      }
      return;
    }
    // Spawn khach
    R.spawnTimer -= dt;
    if (R.spawnTimer <= 0) { spawnCustomer(); R.spawnTimer = spawnInterval(); }
    // Su co ngau nhien
    R.eventTimer -= dt;
    if (R.eventTimer <= 0) { triggerEvent(); R.eventTimer = U.rand(40, 70); }
    // Timer su co
    var ev = g.events;
    if (ev.fridgeFrost) { ev.frostTimer -= dt; if (ev.frostTimer <= 0) { ev.fridgeFrost = false; ev.frostTimer = 0; toast('Tu het tuyet (tu dong)'); } }
    if (ev.spill) { ev.spillTimer -= dt; if (ev.spillTimer <= 0) { ev.spill = false; ev.spillTimer = 0; } }
    if (ev.blackout) { ev.blackoutTimer -= dt; if (ev.blackoutTimer <= 0) { ev.blackout = false; ev.blackoutTimer = 0; toast('Co dien tro lai ⚡'); } }
    if (ev.flashSale) { ev.flashTimer -= dt; if (ev.flashTimer <= 0) { ev.flashSale = false; ev.flashTimer = 0; } }
    // Xe tai
    if (g.truck.stage === 1) {
      g.truck.timer -= dt;
      if (g.truck.timer <= 0) {
        var o = g.truck.order;
        if (o) { g.backStock[o.pid] = (g.backStock[o.pid] || 0) + o.qty; toast('🚚 Hang si da ve kho: +' + o.qty + ' ' + data().PRODUCT_MAP[o.pid].name); }
        g.truck = { stage: 0, timer: 0, order: null };
        sfx('pop'); VST.state.saveGame();
      }
    }
    // Shipper
    if (!R.shipperOrder && Math.random() < dt / 90) createShipperOrder();
    if (R.shipperOrder) {
      R.shipperTimer -= dt;
      if (R.shipperTimer <= 0) { toast('Don shipper het han (khach huy)'); R.shipperOrder = null; }
    }
    // Nhan vien tu dong
    if (g.staff.cashier.hired) { R.cashierTimer -= dt; if (R.cashierTimer <= 0) { checkoutNextCustomer(); R.cashierTimer = 1.4 * (g.posLevel >= 3 ? 0.6 : g.posLevel >= 2 ? 0.8 : 1); } }
    if (g.staff.stocker.hired) {
      R.stockerTimer -= dt;
      if (R.stockerTimer <= 0) {
        var low = data().PRODUCTS.find(function (p) { return g.shelfStock[p.id] < maxCap(p) * 0.5 && (g.backStock[p.id] || 0) > 0; });
        if (low) restockShelf(low.id);
        R.stockerTimer = 8;
      }
    }
    if (g.staff.cleaner.hired && ev.spill) { R.cleanerTimer -= dt; if (R.cleanerTimer <= 0) { clearEvent('spill'); R.cleanerTimer = 20; } }
    // Quan ly di chuyen: uu tien joystick / phim giu (di lien tuc), sau do click-to-go
    var m = R.manager;
    var held = { x: 0, y: 0 };
    if (R.joy && R.joy.active) { held.x = R.joy.dx; held.y = R.joy.dy; }
    else if (m.moveDir && (m.moveDir.x || m.moveDir.y)) { held.x = m.moveDir.x; held.y = m.moveDir.y; }
    if (held.x || held.y) {
      var hl = Math.hypot(held.x, held.y) || 1;
      var hx = held.x / hl, hy = held.y / hl;
      var ox = m.x, oy = m.y;
      var nx2 = U.clamp(m.x + hx * managerSpeed() * dt, 4, 96), ny2 = U.clamp(m.y + hy * managerSpeed() * dt, 12, 94);
      if (!hitsShelf(nx2, ny2)) { m.x = nx2; m.y = ny2; }
      else if (!hitsShelf(nx2, m.y)) m.x = nx2;
      else if (!hitsShelf(m.x, ny2)) m.y = ny2;
      m.moving = true; m.targetAction = null; m.targetPid = null;
      updateWalk(m, dt, true, m.x - ox, m.y - oy);
      m.face = hx >= 0 ? 1 : -1;
      g.stamina = U.clamp(g.stamina - dt * 1.0, 0, 100);
    } else if (m.moving && m.clickTarget) {
      var arrived = moveToward(m, m.tx, m.ty, managerSpeed(), dt);
      updateWalk(m, dt, !arrived, m.tx - m.x, m.ty - m.y);
      m.face = m.tx >= m.x ? 1 : -1;
      if (arrived) {
        m.moving = false; updateWalk(m, dt, false, 0, 0);
        if (m.targetAction === 'pos') checkoutAll();
        else if (m.targetAction === 'coffee') brewCoffee();
        else if (m.targetAction === 'shelf' && m.targetPid) restockShelf(m.targetPid);
        else if (m.targetAction === 'frost') clearEvent('frost');
        else if (m.targetAction === 'spill') clearEvent('spill');
        m.targetAction = null; m.targetPid = null;
      }
      g.stamina = U.clamp(g.stamina + dt * 0.4, 0, 100);
    } else {
      updateWalk(m, dt, false, 0, 0);
      g.stamina = U.clamp(g.stamina + dt * 0.4, 0, 100);
    }
    // Khach
    var blackoutSlow = ev.blackout ? 0.5 : 1;
    R.customers.forEach(function (c) {
      c.phase += dt * 6;
      var _cx = c.x, _cy = c.y;
      c.patience -= dt;
      if (c.patience <= 0 && c.state !== 'leave') {
        c.state = 'leave'; c.tx = 50; c.ty = 92; c.mood = 'angry';
        g.dayStats.lost++;
        var t = data().CUSTOMER_TYPES[c.type];
        g.stars = U.clamp(g.stars - t.starLoss, 1, 5);
        floatText(c.x, c.y - 6, '😡', '#ef4444');
        return;
      }
      if (c.state === 'enter') {
        var s = shelfPos(c.targetShelf);
        if (moveToward(c, s.x + s.w / 2, s.y + s.h + 4, c.speed * blackoutSlow, dt)) { c.state = 'browse'; c.waitTimer = U.rand(3, 6); }
      } else if (c.state === 'browse') {
        c.waitTimer -= dt;
        if (c.waitTimer <= 0) {
          customerPick(c);
          c.state = 'queue'; c.tx = 88; c.ty = 68 + R.customers.filter(function (x) { return x.state === 'queue'; }).length * 3;
        }
      } else if (c.state === 'queue') {
        var qi = R.customers.filter(function (x) { return x.state === 'queue'; }).indexOf(c);
        moveToward(c, 86, 66 + qi * 4, c.speed * blackoutSlow, dt);
      } else if (c.state === 'leave') {
        if (moveToward(c, 50, 96, c.speed * 1.2, dt)) c.gone = true;
      }
      updateWalk(c, dt, (c.x !== _cx || c.y !== _cy), c.x - _cx, c.y - _cy);
    });
    R.customers = R.customers.filter(function (c) { return !c.gone; });
  }

  function setMoveDir(dx, dy) {
    var m = R.manager; if (!m) return;
    m.moveDir = { x: dx || 0, y: dy || 0 };
    if (dx || dy) { m.moving = true; m.clickTarget = false; }
    else { m.moving = false; m.clickTarget = false; m.targetAction = null; m.targetPid = null; }
  }
  function setJoystick(dx, dy) {
    if (!R.joy) R.joy = { active: false, dx: 0, dy: 0 };
    if (dx || dy) { R.joy.active = true; R.joy.dx = dx; R.joy.dy = dy; }
    else { R.joy.active = false; R.joy.dx = 0; R.joy.dy = 0; }
  }
  function managerGoTo(x, y, action, pid) {
    var m = R.manager;
    m.tx = U.clamp(x, 4, 96); m.ty = U.clamp(y, 12, 94);
    m.moving = true; m.clickTarget = true; m.targetAction = action || null; m.targetPid = pid || null;
  }
  function togglePause() {
    R.paused = !R.paused;
    if (VST.ui) VST.ui.updateHud();
    return R.paused;
  }
  function setSpeed(n) { var g = G(); g.speed = n === 2 ? 2 : 1; VST.state.saveGame(); }
  function setMarkup(p) { var g = G(); g.markupPct = U.clamp(Math.round(p), 0, 100); VST.state.saveGame(); }

  VST.game = {
    R: R, resetRunState: resetRunState, newGame: newGame, startDay: startDay,
    updateGame: updateGame, spawnCustomer: spawnCustomer, checkoutNextCustomer: checkoutNextCustomer,
    checkoutAll: checkoutAll, restockShelf: restockShelf, orderWholesale: orderWholesale,
    brewCoffee: brewCoffee, hireStaff: hireStaff, fireStaff: fireStaff, levelStaff: levelStaff,
    buyFloor: buyFloor, buyWall: buyWall, buyUpgrade: buyUpgrade,
    changeWeather: changeWeather, takeLoan: takeLoan, repayLoan: repayLoan,
    deposit: deposit, withdraw: withdraw,
    genDailyMissions: genDailyMissions, missionProgress: missionProgress, missionMet: missionMet,
    claimMission: claimMission, checkAchievements: checkAchievements,
    triggerEvent: triggerEvent, clearEvent: clearEvent,
    createShipperOrder: createShipperOrder, deliverShipper: deliverShipper,
    endDay: endDay, startNextDay: startNextDay, tryUpgradeChapter: tryUpgradeChapter,
    applyBankrupt: applyBankrupt, managerGoTo: managerGoTo, togglePause: togglePause,
    setSpeed: setSpeed, setMarkup: setMarkup, setMoveDir: setMoveDir, setJoystick: setJoystick,
    managerSpeed: managerSpeed, hitsShelf: hitsShelf, updateWalk: updateWalk,
    sellPrice: sellPrice, buyPrice: buyPrice,
    maxCap: maxCap, appeal: appeal, burst: burst, floatText: floatText
  };
})();
