/* Vua Sieu Thi Pho — PWA v7.2 | js/state.js
   State ben vung + save/load an toan (deep-merge, validate, version).
   Ke thua fix 6.1: khong dung Object.assign nong, save thieu truong long
   nhau thi dien mac dinh, frostTimer NaN thi sua ve 25. */
(function () {
  var VST = window.VST || (window.VST = {});
  var SAVE_KEY = 'vua-sieu-thi-pwa-v7';
  var SAVE_VERSION = '7.2'; // SAVE_KEY giu 'vua-sieu-thi-pwa-v7' de doc save 7.0/7.1/7.1.2/7.1.3

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function num(v, d) { return isNum(v) ? v : d; }

  function createInitialState(difficulty) {
    var diff = (difficulty && VST.DATA.DIFFICULTIES[difficulty]) ? difficulty : 'vua';
    var startCash = VST.DATA.DIFFICULTIES[diff].startCash;
    var shelfStock = {}, backStock = {};
    VST.DATA.PRODUCTS.forEach(function (p) { shelfStock[p.id] = 6; backStock[p.id] = 12; });
    return {
      version: SAVE_VERSION,
      cash: startCash, savings: 0, coins: 0,
      loans: [], // {amount, remaining, rate}
      stars: 3.6, day: 1, minuteOfDay: 420, chapterId: 1, freeMode: false,
      difficulty: diff, speed: 1, markupPct: 30,
      weather: 'sun', weatherChangesToday: 0,
      stamina: 100,
      floorId: 1, wallId: 1, ownedFloors: [1], ownedWalls: [1],
      shelfLevel: 1, posLevel: 1, fridgeLevel: 1, coffeeLevel: 1, signLevel: 0,
      shelfStock: shelfStock, backStock: backStock,
      staff: {
        cashier: { hired: false, level: 1 },
        stocker: { hired: false, level: 1 },
        cleaner: { hired: false, level: 1 },
        shipper: { hired: false, level: 1 }
      },
      missions: [], missionsDone: [], achievements: [],
      dayStats: { served: 0, lost: 0, revenue: 0, cogs: 0, tips: 0, restocks: 0, coffees: 0, orders: 0 },
      totalStats: { served: 0, revenue: 0, days: 0 },
      events: { fridgeFrost: false, frostTimer: 0, spill: false, spillTimer: 0, blackout: false, blackoutTimer: 0, flashSale: false, flashTimer: 0 },
      truck: { stage: 0, timer: 0, order: null },
      settings: { music: true, sfx: true, particles: true, showTutorial: true, joystick: true, dpad: false, walkAnim: true },
      tutorialSeen: false, createdAt: Date.now()
    };
  }

  function deepMerge(base, src) {
    if (!src || typeof src !== 'object') return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(src).forEach(function (k) {
      var sv = src[k], bv = base ? base[k] : undefined;
      if (sv && typeof sv === 'object' && !Array.isArray(sv) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
        out[k] = deepMerge(bv, sv);
      } else if (sv !== undefined) {
        out[k] = sv;
      }
    });
    return out;
  }

  function validateState(G) {
    if (!G || typeof G !== 'object') return createInitialState('vua');
    G.version = SAVE_VERSION;
    G.cash = num(G.cash, 4500000);
    G.savings = num(G.savings, 0);
    G.coins = num(G.coins, 0);
    G.stars = VST.util.clamp(num(G.stars, 3.6), 1, 5);
    G.day = Math.max(1, Math.floor(num(G.day, 1)));
    G.minuteOfDay = VST.util.clamp(num(G.minuteOfDay, 420), 420, 1320); // 7:00-22:00, luu de tiep tuc dung gio sau khi tai lai
    G.chapterId = VST.util.clamp(Math.floor(num(G.chapterId, 1)), 1, 10);
    G.markupPct = VST.util.clamp(num(G.markupPct, 30), 0, 100);
    G.stamina = VST.util.clamp(num(G.stamina, 100), 0, 100);
    G.floorId = VST.util.clamp(Math.floor(num(G.floorId, 1)), 1, 6);
    G.wallId = VST.util.clamp(Math.floor(num(G.wallId, 1)), 1, 6);
    if (!Array.isArray(G.ownedFloors) || !G.ownedFloors.length) G.ownedFloors = [1];
    if (!Array.isArray(G.ownedWalls) || !G.ownedWalls.length) G.ownedWalls = [1];
    if (!Array.isArray(G.loans)) G.loans = [];
    G.loans = G.loans.filter(function (l) { return l && isNum(l.remaining) && l.remaining > 0; });
    // Kho hang: dien du mon, so luong hop le
    if (!G.shelfStock || typeof G.shelfStock !== 'object') G.shelfStock = {};
    if (!G.backStock || typeof G.backStock !== 'object') G.backStock = {};
    VST.DATA.PRODUCTS.forEach(function (p) {
      G.shelfStock[p.id] = VST.util.clamp(Math.floor(num(G.shelfStock[p.id], 6)), 0, 99);
      G.backStock[p.id] = VST.util.clamp(Math.floor(num(G.backStock[p.id], 12)), 0, 999);
    });
    // Su co: sua NaN / am thanh mac dinh (fix 6.1)
    if (!G.events || typeof G.events !== 'object') G.events = {};
    G.events.fridgeFrost = !!G.events.fridgeFrost;
    if (G.events.fridgeFrost && (!isNum(G.events.frostTimer) || G.events.frostTimer <= 0)) G.events.frostTimer = 25;
    G.events.frostTimer = num(G.events.frostTimer, 0);
    G.events.spillTimer = num(G.events.spillTimer, 0);
    G.events.blackoutTimer = num(G.events.blackoutTimer, 0);
    G.events.flashTimer = num(G.events.flashTimer, 0);
    if (!G.truck || typeof G.truck !== 'object') G.truck = { stage: 0, timer: 0, order: null };
    if (![0, 1, 2, 3, 4].includes(G.truck.stage)) G.truck.stage = 0;
    if (!G.staff || typeof G.staff !== 'object') G.staff = {};
    Object.keys(VST.DATA.STAFF_TYPES).forEach(function (k) {
      if (!G.staff[k]) G.staff[k] = { hired: false, level: 1 };
      G.staff[k].hired = !!G.staff[k].hired;
      G.staff[k].level = VST.util.clamp(Math.floor(num(G.staff[k].level, 1)), 1, 3);
    });
    if (!G.settings || typeof G.settings !== 'object') G.settings = {};
    G.settings.music = G.settings.music !== false;
    G.settings.sfx = G.settings.sfx !== false;
    G.settings.particles = G.settings.particles !== false;
    G.settings.joystick = G.settings.joystick !== false;
    G.settings.dpad = !!G.settings.dpad;
    G.settings.walkAnim = G.settings.walkAnim !== false;
    if (!Array.isArray(G.missions)) G.missions = [];
    if (!Array.isArray(G.missionsDone)) G.missionsDone = [];
    if (!Array.isArray(G.achievements)) G.achievements = [];
    if (!G.dayStats) G.dayStats = { served: 0, lost: 0, revenue: 0, cogs: 0, tips: 0, restocks: 0, coffees: 0, orders: 0 };
    if (!G.totalStats) G.totalStats = { served: 0, revenue: 0, days: 0 };
    return G;
  }

  function totalDebt(G) {
    return (G.loans || []).reduce(function (s, l) { return s + (l.remaining || 0); }, 0);
  }
  function netWorth(G) { return G.cash + G.savings - totalDebt(G); }

  function saveGame() {
    try {
      var G = VST.state.G;
      if (!G) return false;
      G.version = SAVE_VERSION;
      localStorage.setItem(SAVE_KEY, JSON.stringify(G));
      return true;
    } catch (e) {
      console.warn('[VST] saveGame failed:', e);
      if (VST.ui && VST.ui.toast) VST.ui.toast('Khong luu duoc game (bo nho day?)');
      return false;
    }
  }

  function loadGame() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      var merged = deepMerge(createInitialState(parsed.difficulty || 'vua'), parsed);
      return validateState(merged);
    } catch (e) {
      console.warn('[VST] loadGame failed, using fresh state:', e);
      return null;
    }
  }

  function exportSave() {
    try { return JSON.stringify(VST.state.G || createInitialState('vua')); }
    catch (e) { return ''; }
  }
  function importSave(jsonStr) {
    try {
      var parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return false;
      var merged = deepMerge(createInitialState(parsed.difficulty || 'vua'), parsed);
      VST.state.G = validateState(merged);
      saveGame();
      return true;
    } catch (e) { console.warn('[VST] importSave failed:', e); return false; }
  }
  function wipeSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    VST.state.G = createInitialState('vua');
  }

  VST.state = {
    G: null, SAVE_KEY: SAVE_KEY, SAVE_VERSION: SAVE_VERSION,
    createInitialState: createInitialState, deepMerge: deepMerge, validateState: validateState,
    saveGame: saveGame, loadGame: loadGame, exportSave: exportSave, importSave: importSave,
    wipeSave: wipeSave, totalDebt: totalDebt, netWorth: netWorth
  };
})();
