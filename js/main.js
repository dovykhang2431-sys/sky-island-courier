/* Vua Sieu Thi Pho — PWA v7.1 | js/main.js
   Khoi tao, game loop, input (phim giu / joystick / D-pad / pointer), resize/DPR,
   dang ky Service Worker, install prompt, luu khi tat tab. */
(function () {
  var VST = window.VST || (window.VST = {});
  var canvas, ctx, lastT = 0, lastHudT = 0, lastPointer = 0;
  var deferredPrompt = null;
  var heldKeys = {}; // phim dang giu (WASD / mui ten)

  function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('click', function (e) {
      // Chong double-fire pointerdown + click
      if (Date.now() - lastPointer < 400) return;
      onPointer(e);
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  function resize() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    canvas.width = 1280; canvas.height = 720;
    // Giu do net tren man hinh DPR cao bang cach scale ctx theo ti le hien thi
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    void dpr; void rect;
  }
  function canvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    var cx = (e.clientX - rect.left) / rect.width * 100;
    var cy = (e.clientY - rect.top) / rect.height * 100;
    return { x: cx, y: cy };
  }
  function onPointer(e) {
    lastPointer = Date.now();
    var R = VST.game.R, G = VST.state.G;
    if (!R || !G || R.paused || R.openModal) return;
    e.preventDefault();
    var p = canvasPos(e);
    var D = VST.DATA;
    // Bim vao ke gan nhat (ban kinh 11% — fix 6.1)
    var best = null, bestD = 11;
    D.SHELVES.forEach(function (s) {
      var cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      var d = Math.hypot(p.x - cx, p.y - cy);
      if (d < bestD) { bestD = d; best = s; }
    });
    if (best) {
      var pid = best.productId;
      if (G.events.fridgeFrost && pid === 'milk') { VST.game.managerGoTo(p.x + 9, p.y + 18, 'frost'); return; }
      VST.game.managerGoTo(best.x + 9, best.y + best.h + 5, 'shelf', pid);
      return;
    }
    // Quay POS
    if (Math.hypot(p.x - 88, p.y - 76) < 11) { VST.game.managerGoTo(80, 76, 'pos'); return; }
    // May ca phe
    if (Math.hypot(p.x - 8, p.y - 76) < 11) { VST.game.managerGoTo(16, 76, 'coffee'); return; }
    // Vet nuoc
    if (G.events.spill && Math.hypot(p.x - 50, p.y - 82) < 12) { VST.game.managerGoTo(50, 82, 'spill'); return; }
    // Di chuyen tu do
    VST.game.managerGoTo(p.x, p.y, null);
  }

  function setupKeyboard() {
    window.addEventListener('keydown', function (e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      heldKeys[e.key.toLowerCase()] = true;
      var R = VST.game.R, G = VST.state.G;
      if (!R || !G) return;
      if (e.repeat) return; // chi xu ly 1 lan cho cac phim bam 1 lan
      if (e.key === ' ') VST.game.managerGoTo(80, 76, 'pos'); // Space: den POS tinh tien
      else if (e.key.toLowerCase() === 'p') VST.game.togglePause();
      else if (e.key === 'Escape') VST.ui.closeModal();
    });
    window.addEventListener('keyup', function (e) { heldKeys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', function () { heldKeys = {}; VST.game.setMoveDir(0, 0); });
  }
  function heldDir() {
    var dx = 0, dy = 0;
    if (heldKeys['w'] || heldKeys['arrowup']) dy -= 1;
    if (heldKeys['s'] || heldKeys['arrowdown']) dy += 1;
    if (heldKeys['a'] || heldKeys['arrowleft']) dx -= 1;
    if (heldKeys['d'] || heldKeys['arrowright']) dx += 1;
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    return { x: dx, y: dy };
  }
  function syncControlsVisibility() {
    var g = VST.state.G, touch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
    document.body.classList.toggle('touch', !!touch);
    document.body.classList.toggle('joystick-on', !!g && !!g.settings && g.settings.joystick !== false);
    document.body.classList.toggle('dpad-on', !!g && !!g.settings && !!g.settings.dpad);
  }
  function setupControls() {
    syncControlsVisibility();
    // --- Joystick ao (keo vong tron o goc trai duoi) ---
    var joy = document.getElementById('joystick'), knob = document.getElementById('joyKnob');
    if (joy && knob) {
      var joyId = null;
      var joyMove = function (e) {
        var r = joy.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
        var len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; len = 1; }
        knob.style.transform = 'translate(' + (dx * 36) + 'px,' + (dy * 36) + 'px)';
        VST.game.setJoystick(dx, dy);
      };
      joy.addEventListener('pointerdown', function (e) { e.preventDefault(); joyId = e.pointerId; try { joy.setPointerCapture(joyId); } catch (err) {} joyMove(e); });
      joy.addEventListener('pointermove', function (e) { if (e.pointerId === joyId) joyMove(e); });
      var joyEnd = function (e) { if (joyId !== null && e.pointerId !== joyId) return; joyId = null; knob.style.transform = ''; VST.game.setJoystick(0, 0); };
      joy.addEventListener('pointerup', joyEnd);
      joy.addEventListener('pointercancel', joyEnd);
    }
    // --- D-pad du phong (4 nut mui ten) ---
    var dpadDirs = {};
    document.querySelectorAll('.dpad-btn').forEach(function (b) {
      var dir = b.getAttribute('data-dir');
      var apply = function () {
        var dx = (dpadDirs['right'] ? 1 : 0) - (dpadDirs['left'] ? 1 : 0);
        var dy = (dpadDirs['down'] ? 1 : 0) - (dpadDirs['up'] ? 1 : 0);
        VST.game.setMoveDir(dx, dy);
      };
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); dpadDirs[dir] = true; apply(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        b.addEventListener(ev, function () { dpadDirs[dir] = false; apply(); });
      });
    });
    // --- Nut nhanh am thanh / nhac tren HUD ---
    var bsfx = document.getElementById('btnSfx');
    if (bsfx) bsfx.addEventListener('click', function () { VST.ui.toggleSetting('sfx'); });
    var bmus = document.getElementById('btnMusic');
    if (bmus) bmus.addEventListener('click', function () { VST.ui.toggleSetting('music'); });
    var bhelp = document.getElementById('btnHelp');
    if (bhelp) bhelp.addEventListener('click', function () { VST.ui.showTutorial(); });
  }
  function requestInstall() {
    if (!deferredPrompt) { VST.ui.toast('Trinh duyet chua ho tro cai dat, ban co the them vao man hinh chinh thu cong (menu trinh duyet > Them vao man hinh chinh)'); return; }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () { deferredPrompt = null; var bi = document.getElementById('btnInstall'); if (bi) bi.style.display = 'none'; });
  }

  function loop(t) {
    requestAnimationFrame(loop);
    var dt = Math.min((t - lastT) / 1000 || 0.016, 0.1);
    lastT = t;
    if (!VST.state.G) return;
    var hd = heldDir();
    VST.game.setMoveDir(hd.x, hd.y);
    VST.game.updateGame(dt);
    if (ctx) {
      try { VST.render.render(ctx, VST.state.G, VST.game.R, t); } catch (e) { console.warn('[VST] render error', e); }
    }
    if (t - lastHudT > 200) { lastHudT = t; VST.ui.updateHud(); }
  }

  function setupPWA() {
    // Service Worker: chi https / localhost
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js').then(function () {
        console.log('[VST] SW registered');
      }).catch(function (e) { console.warn('[VST] SW failed', e); });
    }
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      var b = document.getElementById('btnInstall');
      if (b) b.style.display = 'inline-block';
    });
    var bi = document.getElementById('btnInstall');
    if (bi) bi.addEventListener('click', function () { requestInstall(); });
    window.addEventListener('online', function () { setOffline(false); });
    window.addEventListener('offline', function () { setOffline(true); });
    setOffline(!navigator.onLine);
    window.addEventListener('beforeunload', function () { VST.state.saveGame(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) VST.state.saveGame();
    });
  }
  function setOffline(off) {
    var b = document.getElementById('offlineBanner');
    if (b) b.style.display = off ? 'block' : 'none';
  }

  function setupStartScreen() {
    var play = document.getElementById('btnPlay');
    var cont = document.getElementById('btnContinue');
    var diffSel = document.getElementById('selDifficulty');
    if (play) play.addEventListener('click', function () {
      var diff = diffSel ? diffSel.value : 'vua';
      VST.game.newGame(diff);
      VST.ui.hideStartScreen();
      VST.audio.init(); VST.audio.musicStart();
      VST.ui.toast('Chao mung den Sieu Thi Pho! Cham vao ke de len hang, cham POS de tinh tien.');
    });
    if (cont) cont.addEventListener('click', function () {
      VST.game.resumeDay(); // FIX 7.1.3: giu gio trong ngay da luu, khong reset ve 7:00
      VST.game.R.paused = false;
      VST.ui.hideStartScreen();
      VST.audio.init(); VST.audio.musicStart();
    });
    var tut = document.getElementById('btnTutorial');
    if (tut) tut.addEventListener('click', function () { VST.ui.showTutorial(); });
  }

  function init() {
    var saved = VST.state.loadGame();
    VST.state.G = saved || VST.state.createInitialState('vua');
    setupCanvas();
    setupKeyboard();
    setupControls();
    VST.ui.bind();
    setupPWA();
    setupStartScreen();
    // Nut dung / toc do tren HUD
    var bp = document.getElementById('btnPause');
    if (bp) bp.addEventListener('click', function () { VST.game.togglePause(); VST.ui.updateHud(); });
    var bs = document.getElementById('btnSpeed');
    if (bs) bs.addEventListener('click', function () {
      var g = VST.state.G; VST.game.setSpeed(g.speed === 1 ? 2 : 1);
      bs.textContent = '⏩ x' + g.speed;
    });
    var bw = document.getElementById('btnWeather');
    if (bw) bw.addEventListener('click', function () {
      var g = VST.state.G;
      var order = ['sun', 'rain', 'fest'];
      var next = order[(order.indexOf(g.weather) + 1) % order.length];
      VST.game.changeWeather(next);
      VST.ui.updateHud();
    });
    var bc = document.getElementById('btnCoffee');
    if (bc) bc.addEventListener('click', function () { VST.game.brewCoffee(); });
    var bsh = document.getElementById('btnShipper');
    if (bsh) bsh.addEventListener('click', function () {
      if (VST.game.R.shipperOrder) VST.game.deliverShipper();
      else VST.game.createShipperOrder();
    });
    VST.ui.showStartScreen(!!saved);
    VST.ui.updateHud();
    requestAnimationFrame(loop);
  }

  VST.main = { init: init, syncControlsVisibility: syncControlsVisibility, requestInstall: requestInstall, heldDir: heldDir };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
