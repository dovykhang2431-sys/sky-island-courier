/* Vua Sieu Thi Pho — PWA v7.1 | js/audio.js
   Am thanh tu sinh bang WebAudio, khong file ngoai. Nhac nen nhe (vong hop am). */
(function () {
  var VST = window.VST || (window.VST = {});
  var ctx = null, musicTimer = null, musicOn = false, masterGain = null;

  function ac() {
    if (!ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(ctx.destination);
      } catch (e) { return null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(function () {});
    return ctx;
  }
  function enabled() {
    var G = VST.state && VST.state.G;
    return !!(G && G.settings && G.settings.sfx);
  }
  function tone(freq, dur, type, vol, delay) {
    if (!enabled()) return;
    var c = ac(); if (!c) return;
    try {
      var t = c.currentTime + (delay || 0);
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(masterGain || c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* ignore */ }
  }
  var SFX = {
    click: function () { tone(660, 0.06, 'square', 0.08); },
    coin: function () { tone(880, 0.08, 'sine', 0.14); tone(1320, 0.12, 'sine', 0.12, 0.07); },
    error: function () { tone(160, 0.18, 'sawtooth', 0.1); },
    restock: function () { tone(440, 0.07, 'triangle', 0.1); tone(660, 0.07, 'triangle', 0.1, 0.06); },
    levelup: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.14, 'triangle', 0.12, i * 0.09); }); },
    pop: function () { tone(520, 0.05, 'sine', 0.1); tone(780, 0.06, 'sine', 0.08, 0.04); },
    event: function () { tone(220, 0.15, 'sawtooth', 0.08); tone(180, 0.2, 'sawtooth', 0.08, 0.12); }
  };
  function sfx(name) { if (SFX[name]) SFX[name](); }

  // Nhac nen: vong C - Am - F - G, moi not 0.35s, am luong rat nho.
  var CHORDS = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]];
  function musicStart() {
    if (musicOn) return;
    var G = VST.state && VST.state.G;
    if (!G || !G.settings.music) return;
    musicOn = true;
    var step = 0;
    musicTimer = setInterval(function () {
      var G2 = VST.state && VST.state.G;
      if (!G2 || !G2.settings.music || !musicOn) { musicStop(); return; }
      var c = ac(); if (!c) return;
      var chord = CHORDS[Math.floor(step / 4) % CHORDS.length];
      try {
        chord.forEach(function (f) {
          var o = c.createOscillator(), g = c.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.025, c.currentTime + 0.1);
          g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.4);
          o.connect(g); g.connect(masterGain || c.destination);
          o.start(); o.stop(c.currentTime + 1.5);
        });
      } catch (e) { /* ignore */ }
      step++;
    }, 350);
  }
  function musicStop() {
    musicOn = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }
  function toggleMusic() {
    var G = VST.state && VST.state.G; if (!G) return false;
    G.settings.music = !G.settings.music;
    if (G.settings.music) musicStart(); else musicStop();
    VST.state.saveGame();
    return G.settings.music;
  }

  VST.audio = { init: ac, tone: tone, sfx: sfx, musicStart: musicStart, musicStop: musicStop, toggleMusic: toggleMusic };
})();
