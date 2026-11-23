/* ============================================================
   Nachdenk-Musik: ruhige, sphärische Klangflächen (Ambient), live im Browser erzeugt.
   Keine Audiodateien, keine Fremdlizenzen: alles entsteht aus Sinus-/Dreieckswellen (Web Audio).
   Standardmäßig AUS, nur die Lehrkraft schaltet zu (z. B. am Beamer). Schüler-Handys bleiben stumm.
   ============================================================ */
(() => {
  "use strict";
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);          /* MIDI-Nummer → Hz */
  /* Akkordfolge in a-Moll/C-Dur, sanft und offen (MIDI-Noten) */
  const CHORDS = [[45, 57, 64, 72], [41, 57, 65, 69], [48, 55, 64, 71], [43, 55, 62, 69], [45, 55, 64, 71], [41, 53, 60, 69]];
  const BELLS = [72, 74, 76, 79, 81, 84];                         /* Pentatonik für leise Glöckchen */
  let ctx = null, master = null, verb = null, running = false, timers = [], voices = [], chordIdx = 0;

  const later = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

  function impulse(c, secs, decay) {
    const len = Math.floor(c.sampleRate * secs), buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }

  function pad(freq, t0, dur) {
    const g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 700; lp.Q.value = .3;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(.04, t0 + 4.5);
    g.gain.setValueAtTime(.04, t0 + dur - 5);
    g.gain.linearRampToValueAtTime(0, t0 + dur + 1);
    [["sine", 0], ["triangle", 5], ["sine", -6]].forEach(([type, cents]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = cents;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .08 + Math.random() * .12; lg.gain.value = 3;
      lfo.connect(lg); lg.connect(o.detune);
      o.connect(lp); o.start(t0); lfo.start(t0); o.stop(t0 + dur + 1.2); lfo.stop(t0 + dur + 1.2);
      voices.push(o, lfo);
    });
    lp.connect(g); g.connect(master); g.connect(verb);
  }

  function bell() {
    if (!running) return;
    const f = NOTE(BELLS[Math.floor(Math.random() * BELLS.length)]), t0 = ctx.currentTime + .05;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.05, t0 + .03); g.gain.exponentialRampToValueAtTime(.0005, t0 + 4.5);
    o.connect(g); g.connect(verb); g.connect(master); o.start(t0); o.stop(t0 + 4.6); voices.push(o);
    later(5000 + Math.random() * 7000, bell);
  }

  function nextChord() {
    if (!running) return;
    const dur = 16, t0 = ctx.currentTime + .1;
    CHORDS[chordIdx % CHORDS.length].forEach((n, i) => pad(NOTE(n), t0 + i * .6, dur));
    chordIdx++;
    later((dur - 4) * 1000, nextChord);
  }

  function start() {
    if (running) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
        verb = ctx.createConvolver(); verb.buffer = impulse(ctx, 3.2, 2.4);
        const vg = ctx.createGain(); vg.gain.value = .9; verb.connect(vg); vg.connect(master);
      }
      if (ctx.state === "suspended") ctx.resume();
    } catch { return false; }
    running = true; chordIdx = Math.floor(Math.random() * CHORDS.length);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(.7, ctx.currentTime + 3);
    nextChord(); later(3000, bell);
    return true;
  }

  function stop() {
    if (!running) return;
    running = false;
    timers.forEach(clearTimeout); timers = [];
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    } catch { /* ignorieren */ }
    const vs = voices; voices = [];
    setTimeout(() => { vs.forEach((o) => { try { o.stop(); } catch { /* schon beendet */ } }); try { ctx.suspend(); } catch { /* ignorieren */ } }, 1800);
  }

  window.QuizMusic = { start, stop, toggle() { return running ? (stop(), false) : start(); }, get on() { return running; } };
})();
