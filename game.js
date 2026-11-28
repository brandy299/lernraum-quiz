/* ============================================================
   LERNRAUM · Live-Quiz – Warteraum-Spiel „Hürdenritt“
   Pixel-Spiel auf einem Canvas (240 × 135 Pixel, scharf skaliert): Das Pferd galoppiert von selbst, Tippen = Springen
   (Halten = höher). Über Hürden, Büsche und Kisten springen, auf Plattformen (zwei Ebenen) laufen, Abgründe überspringen, Gegnern ausweichen
   oder von oben auf sie springen (+25), Münzen (Magnet!) und Herzen sammeln, 3 Herzen. Sprünge haben Schwung (je schneller, desto weiter). Das Tempo steigt mit der
   Zeit (wie bei Unicorn Dash). Keine Töne.
   Steuerung: rechts tippen = springen, links tippen (oder nach unten wischen, Pfeil runter) = rutschen bzw. in der Luft schnell fallen.
   Level: Jede Welt endet mit einer Zielflagge (+50, +1 Herz), dann kommt die nächste Welt mit neuen Gegnern
   (Frosch, Fass, Sturzflug-Vogel), Balken zum Drunterrutschen, Sprungfedern und schwebenden Plattformen.
   Power-ups: Magnet, Schild, Stern (unbesiegbar), Doppelsprung. Bonus-Event „Goldrausch“ (Münzregen), auch von der Lehrkraft
   für alle auslösbar (stop.rush()). Je Runde drei Missionen (+100).
   Punkte = Münzen × 10 + Gegner × 25 + Meter + Boni. Läuft im Browser; nur der Spielstand (eine Zahl) geht über opts.onScore an den Raum,
   damit die Lehrkraft eine Bestenliste auf dem Beamer zeigen kann. Rekord und Pferdefarbe stehen lokal (localStorage).
   Benutzt von quiz.js: QuizGame.html() liefert den Kasten, QuizGame.mount(root, seed, opts) startet ihn und gibt stop() zurück.
   Die Pferde-Pixel kommen aus race.js (QuizRace.pix).
   ============================================================ */
(() => {
  "use strict";
  const W = 240, H = 135, S = 2, GROUND = 112, BEST_KEY = "quiz.game.best", HORSE_KEY = "quiz.game.horse";
  const GRAV = 720, JUMP = -262, HORSE_X = 34, HOLD_MAX = .2, HOLD_G = .45;
  const SPEED0 = 70, SPEED_UP = 2.6, SPEED_MAX = 205;
  const COLORS = [0, 1, 2, 6, 7];              /* wählbare Pferdefarben (Index in QuizRace.pix.HORSE) */
  const COLOR_NAMES = ["Braun", "Rosa", "Weiß", "Blau", "Grün"];

  const rnd = (a, b) => a + Math.random() * (b - a);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (h, to, k) => { const a = hex(h), b = hex(to); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join(""); };

  function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch { /* ignorieren */ } }

  /* Pferd + Reiter aus den Pixel-Bildern von race.js in zwei Offscreen-Canvas zeichnen */
  function horseSprites(idx) {
    const P = window.QuizRace && window.QuizRace.pix;
    if (!P) return null;
    const base = P.HORSE[idx % P.HORSE.length], jc = P.JOCKEY[(idx * 3 + 1) % P.JOCKEY.length];
    const pal = {
      B: base, S: mix(base, "#000000", .28), F: mix(base, "#000000", .5), L: mix(base, "#ffffff", .22),
      D: "#2e1b0e", M: "#e0bf94", W: "#ffffff", E: "#111111", K: "#f2c9a0", G: "#ffffff", T: "#222222", J: jc, H: mix(jc, "#000000", .3)
    };
    return [P.FRAME_A, P.FRAME_B].map((r1) => {
      const E = window.QuizRace.epx, rows = E ? E(r1) : r1;
      const c = document.createElement("canvas"); c.width = rows[0].length; c.height = rows.length;
      const x = c.getContext("2d");
      rows.forEach((row, y) => { for (let i = 0; i < row.length; i++) { const k = row[i]; if (k !== "." && pal[k]) { x.fillStyle = pal[k]; x.fillRect(i, y, 1, 1); } } });
      return c;
    });
  }
  const horseHex = (idx) => { const P = window.QuizRace && window.QuizRace.pix; return P ? P.HORSE[idx % P.HORSE.length] : "#8B5A2B"; };

  /* Vier Welten, wechseln alle BLEN Sekunden: Steppe → Stadt → Cyberpunk → Weltraum → von vorn */
  const BLEN = 26;
  const WORLDS = [
    { name: "STEPPE", a: "#9FD0FF", b: "#BCE0FF", gnd: "#5CC183", soil: "#D9B27C", rail1: "#ffffff", rail2: "#C1354F", post: "#6b4220", crate: "#C48A4A", crate2: "#8A5A26" },
    { name: "STADT", a: "#AFC2DA", b: "#F3DDB5", gnd: "#7A8190", soil: "#4F5766", rail1: "#FFD84D", rail2: "#1E1E1E", post: "#6B7280", crate: "#5B6577", crate2: "#3B4252" },
    { name: "CYBERPUNK", a: "#12062B", b: "#6A1B8A", gnd: "#2A0F4D", soil: "#150833", rail1: "#00E5FF", rail2: "#FF2BD6", post: "#2B0F55", crate: "#3A1580", crate2: "#FF2BD6" },
    { name: "WELTRAUM", a: "#03030D", b: "#10123F", gnd: "#9096AB", soil: "#646A7F", rail1: "#E9E9F5", rail2: "#4DA3FF", post: "#8A8FA3", crate: "#9AA0B5", crate2: "#6B7085" }
  ];
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function html() {
    return `<section class="game" aria-label="Warte-Spiel Hürdenritt">
      <div class="game-hud" aria-live="off"><span class="g-hearts" id="gHearts" aria-label="Leben"></span><span class="g-score">Punkte <b id="gScore">0</b></span><span class="g-best">Rekord <b id="gBest">0</b></span></div>
      <canvas id="gCanvas" class="game-canvas" width="${W * S}" height="${H * S}" role="img" aria-label="Pixel-Pferd, das über Hürden springt. Rechts tippen zum Springen, halten für höhere Sprünge, links tippen zum Rutschen."></canvas>
      <p class="game-hint" id="gHint">Rechts tippen = springen · links tippen = rutschen</p>
      <div class="game-colors" role="group" aria-label="Pferdefarbe">${COLORS.map((c, i) => `<button type="button" class="gc" data-c="${c}" aria-label="Pferdefarbe ${COLOR_NAMES[i]}" title="${COLOR_NAMES[i]}"><i></i></button>`).join("")}</div>
    </section>`;
  }

  function mount(root, seed, opts) {
    const cv = root.querySelector("#gCanvas");
    if (!cv) return () => {};
    opts = opts || {};
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const el = (id) => root.querySelector(id);
    const elScore = el("#gScore"), elBest = el("#gBest"), elHearts = el("#gHearts"), elHint = el("#gHint");

    /* Pferdefarbe (gemerkt) */
    let horseIdx = Number(lsGet(HORSE_KEY));
    if (!COLORS.includes(horseIdx)) horseIdx = COLORS[(seed || 0) % COLORS.length];
    let hs = horseSprites(horseIdx);
    const markColors = () => root.querySelectorAll(".gc").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.c) === horseIdx);
      b.setAttribute("aria-pressed", Number(b.dataset.c) === horseIdx ? "true" : "false");
      b.firstElementChild.style.background = horseHex(Number(b.dataset.c));
    });
    root.querySelectorAll(".gc").forEach((b) => { b.onclick = () => { horseIdx = Number(b.dataset.c); lsSet(HORSE_KEY, horseIdx); hs = horseSprites(horseIdx); markColors(); }; });
    markColors();

    let best = Number(lsGet(BEST_KEY)) || 0;
    elBest.textContent = best;

    /* Zustand */
    let mode = "ready";            /* ready | run | over */
    let t = 0, last = 0, raf = 0, alive = true, rt = 0, speed = SPEED0, dist = 0, nextAt = 150, hearts = 3, coins = 0, score = 0, level = 1, bannerT = 0, bannerTxt = "";
    let world = 0, skyA = WORLDS[0].a, skyB = WORLDS[0].b, portal = 0, sc = 0;
    let hy = 0, vy = 0, onGround = true, holding = false, holdT = 0, stun = 0, buffer = 0, shake = 0, flash = 0, newBest = false, overT = 0, heartAt = 22;
    let hyPrev = 0, riding = null, falling = false, coyote = 0, hxo = 0, landT = 0, stomps = 0, down = false;
    let slideT = 0, slideHeld = false, lvl = 1, goalAt = BLEN, goalOut = false, bonus = 0, airJumped = false, puAt = 12, rushT = 0, rushAt = 45, rushSpawn = 0;
    let fx = { magnet: 0, star: 0, dbl: 0 }, shield = false, missions = [], cnt = {}, hintT = 0, zoneT = 0;
    let things = [], dust = [], pops = [], conf = [], birds = [];
    const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 55 + rnd(0, 20), y: rnd(10, 42), w: rnd(22, 38) }));
            const stars = Array.from({ length: 40 }, () => ({ x: rnd(0, W), y: rnd(2, 96), s: Math.random() < .2 ? 2 : 1, ph: rnd(0, 6) }));
    let groundOff = 0;

    const drawHearts = () => { elHearts.textContent = "♥".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts)); };
    const setScore = () => { elScore.textContent = score; };
    const reset = () => {
      mode = "run"; rt = 0; world = 0; skyA = WORLDS[0].a; skyB = WORLDS[0].b; speed = SPEED0; dist = 0; nextAt = 160; hearts = 3; coins = 0; score = 0; level = 1; hy = 0; vy = 0; onGround = true; stun = 0; holding = false;
      newBest = false; heartAt = 22; things = []; pops = []; conf = []; hyPrev = 0; riding = null; falling = false; coyote = 0; hxo = 0; landT = 0; stomps = 0; buffer = 0;
      slideT = 0; slideHeld = false; lvl = 1; goalAt = BLEN; goalOut = false; bonus = 0; airJumped = false; puAt = 12; rushT = 0; rushAt = 45; fx = { magnet: 0, star: 0, dbl: 0 }; shield = false; zoneT = 6;
      cnt = { coins: 0, stomps: 0, bars: 0, lvl: 1, pu: 0, spring: 0 }; missions = pickMissions();
      setScore(); drawHearts(); hintMissions();
      if (t < rushPend) { rushPend = -1; startRush(); }
    };
    /* Missionen: drei pro Runde, jede +100 */
    const MISSIONS = [
      { k: "coins", n: 25, t: "25 Münzen", i: "●" }, { k: "coins", n: 50, t: "50 Münzen", i: "●" },
      { k: "stomps", n: 3, t: "3× auf Gegner", i: "▼" }, { k: "bars", n: 3, t: "3× unter Balken rutschen", i: "↓" },
      { k: "lvl", n: 3, t: "Level 3 erreichen", i: "⚑" }, { k: "pu", n: 2, t: "2 Power-ups", i: "★" }, { k: "spring", n: 2, t: "2 Sprungfedern", i: "↑" }
    ];
    function pickMissions() {
      const pool = MISSIONS.slice(), out = [], used = new Set();
      while (out.length < 3 && pool.length) { const m = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; if (used.has(m.k)) continue; used.add(m.k); out.push({ ...m, done: false }); }
      return out;
    }
    const hintMissions = () => { elHint.textContent = "Missionen: " + missions.map((m) => `${m.done ? "✓" : m.i} ${m.t}${m.done ? "" : ` (${Math.min(cnt[m.k] || 0, m.n)}/${m.n})`}`).join(" · "); };
    const bump = (k, v) => {
      cnt[k] = v === undefined ? (cnt[k] || 0) + 1 : v;
      for (const m of missions) if (!m.done && m.k === k && cnt[k] >= m.n) { m.done = true; bonus += 100; bannerT = 1.8; bannerTxt = "MISSION ✓ +100"; pops.push({ x: HORSE_X + 10, y: GROUND - 50 + hy, l: 1, s: "+100" }); }
      hintT = 0;
    };
    const scoreNow = () => coins * 10 + stomps * 25 + Math.floor(dist / 10) + bonus;
    const jumpNow = () => {
      vy = JUMP - Math.max(0, speed - SPEED0) * .25;          /* Schwung: schneller = kräftiger, weiter */
      onGround = false; riding = null; falling = false; holding = down; holdT = 0; coyote = 0; buffer = 0;
      for (let i = 0; i < 4; i++) dust.push({ x: HORSE_X + 8, y: GROUND + hy, vx: rnd(-30, -8), vy: rnd(-24, -6), l: .4 });
    };
    const startJump = () => {
      if (mode === "ready" || mode === "over") { if (mode === "over" && overT < .5) return; reset(); return; }
      if (stun > 0) return;
      slideT = 0;
      if (onGround || coyote > 0 || (falling && hy < 9)) { jumpNow(); airJumped = false; }
      else if (fx.dbl > 0 && !airJumped && !falling) {               /* Doppelsprung (Power-up) */
        airJumped = true; vy = JUMP * .92; holding = down; holdT = 0;
        for (let i = 0; i < 6; i++) dust.push({ x: HORSE_X + 16 + hxo, y: GROUND + hy, vx: rnd(-30, 30), vy: rnd(0, 30), l: .35 });
      } else buffer = .12;
    };
    /* Rutschen am Boden (unter Balken durch), in der Luft: schnell nach unten */
    const startSlide = () => {
      if (mode !== "run") { startJump(); return; }
      if (stun > 0 && !falling) return;
      slideHeld = true; buffer = 0;
      if (onGround) { slideT = Math.max(slideT, .55); for (let i = 0; i < 4; i++) dust.push({ x: HORSE_X + 20, y: GROUND + hy, vx: rnd(-50, -20), vy: rnd(-14, -2), l: .3 }); }
      else if (!falling) { vy = Math.max(vy, 330); holding = false; }
    };

    /* Hindernisse und Münzen: erst leicht, mit der Zeit mehr Abwechslung. Abstand wächst mit dem Tempo, damit alles schaffbar bleibt. */
    const hurdle = (x) => things.push({ k: "hurdle", x, w: 14, h: 15 });
    const arc = (x, n, hi) => { for (let i = 0; i < n; i++) things.push({ k: "coin", x: x + i * 7, y: GROUND - hi - (i > 0 && i < n - 1 ? 6 : 0), got: false }); };
    const row = (x, n, y) => { for (let i = 0; i < n; i++) things.push({ k: "coin", x: x + i * 9, y, got: false }); };
    /* Jedes Muster liefert seine Breite zurück, danach kommt eine Pause (wächst mit dem Tempo).
       Neue Dinge kommen mit dem Level: L1 Grundlagen + Balken + Feder, L2 Fass, Kiste, Zaun, Stachel, schwebende Plattform, L3 Frosch, Vogel, Brücke. */
    const spawn = () => {
      const x = W + 20;
      /* Zielflagge am Ende der Welt: vorher kurz frei lassen */
      if (rt >= goalAt && !goalOut) { things.push({ k: "goal", x: x + 30, w: 10 }); goalOut = true; nextAt = 150; return; }
      if (rushT > 0) { nextAt = 40; return; }
      const kinds = ["hurdle", "bush", "coins"];
      if (rt > 5) kinds.push("plat");
      if (rt > 6) kinds.push("pit");
      if (rt > 8) kinds.push("spring");
      if (rt > 10) kinds.push("walker");
      if (rt > 13) kinds.push("bar");
      if (lvl >= 2) kinds.push("crate", "stairs", "fence", "spiker", "barrel", "mover", "bar");
      if (lvl >= 3) kinds.push("bridge", "flyer", "frog", "diver", "frog");
      if (lvl >= 4 && speed > 105) kinds.push("double", "diver");
      const k = kinds[Math.floor(Math.random() * kinds.length)];
      let w = 18;
      if (k === "hurdle") { hurdle(x); arc(x + 1, 3, 32); w = 14; }
      else if (k === "bush") { things.push({ k: "bush", x, w: 18, h: 12 }); arc(x + 3, 3, 30); }
      else if (k === "crate") { things.push({ k: "crate", x, w: 16, h: 21 }); arc(x + 2, 3, 40); w = 16; }
      else if (k === "fence") { things.push({ k: "fence", x, w: 34, h: 15 }); arc(x + 8, 4, 36); w = 34; }
      else if (k === "double") { const gap = 34 + speed * .45; hurdle(x); hurdle(x + 14 + gap); arc(x + 8, 5, 38); w = 28 + gap; }
      else if (k === "plat") { things.push({ k: "plat", x, w: 54, lv: 28 }); row(x + 8, 4, GROUND - 28 - 13); w = 54; }
      else if (k === "mover") { things.push({ k: "plat", x, w: 46, lv: 34, lb: 34, mv: 14, ph: Math.random() * 6 }); row(x + 6, 4, GROUND - 62); w = 46; }
      else if (k === "stairs") { things.push({ k: "plat", x, w: 44, lv: 28 }, { k: "plat", x: x + 58, w: 50, lv: 52 }); row(x + 6, 3, GROUND - 28 - 13); row(x + 64, 4, GROUND - 52 - 13); w = 108; }
      else if (k === "pit") { const pw = Math.round(26 + speed * .1); things.push({ k: "pit", x, w: pw, filled: false }); row(x + pw / 2 - 18, 5, GROUND - 36); w = pw; }
      else if (k === "bridge") { things.push({ k: "pit", x, w: 88, filled: false }, { k: "plat", x: x + 30, w: 28, lv: 28 }); row(x + 30, 3, GROUND - 28 - 13); w = 88; }
      else if (k === "walker") { things.push({ k: "walker", x, w: 14, h: 12, v: 26, ph: Math.random() * 6 }); arc(x - 4, 3, 36); w = 14; }
      else if (k === "spiker") { things.push({ k: "spiker", x, w: 14, h: 11, v: 8, ph: Math.random() * 6 }); arc(x - 4, 3, 34); w = 14; }
      else if (k === "flyer") { things.push({ k: "flyer", x, w: 14, h: 10, lift: 34, v: 14, ph: Math.random() * 6 }); row(x - 6, 4, GROUND - 9); w = 14; }
      else if (k === "frog") { things.push({ k: "frog", x, w: 14, h: 11, v: 12, ph: Math.random() * 1.1 }); arc(x - 2, 3, 46); w = 14; }
      else if (k === "barrel") { things.push({ k: "barrel", x: x + 30, w: 12, h: 12, v: 58, ph: 0 }); arc(x + 20, 3, 32); w = 40; }
      else if (k === "diver") { things.push({ k: "diver", x, w: 14, h: 10, lift: 62, v: 18, ph: Math.random() * 6 }); w = 14; }
      else if (k === "bar") { things.push({ k: "bar", x, w: 26 }); row(x + 2, 3, GROUND - 8); w = 26; }
      else if (k === "spring") { things.push({ k: "spring", x, w: 12 }); arc(x + 18, 5, 92); w = 40; }
      else { const hi = Math.random() < .5 ? 34 : 12; row(x, 5, GROUND - hi); w = 45; }
      if (rt > heartAt && hearts < 3) { things.push({ k: "heart", x: x + w + 30, y: GROUND - 30, got: false }); heartAt = rt + 24; }
      else if (rt > puAt) { const ty = ["magnet", "shield", "star", "dbl"][Math.floor(Math.random() * 4)]; things.push({ k: "pu", ty, x: x + w + 34, y: GROUND - 34, got: false }); puAt = rt + rnd(13, 19); }
      nextAt = w + rnd(75, 120) + speed * .55;
    };
    /* Goldrausch: Münzregen für ein paar Sekunden (zufällig oder von der Lehrkraft für alle) */
    let rushPend = -1;
    const startRush = () => { if (mode !== "run") { rushPend = t + 8; elHint.textContent = "Goldrausch! Schnell aufs Spiel tippen und Münzen sammeln."; return; } rushT = 7; rushSpawn = 0; bannerT = 2; bannerTxt = "GOLDRAUSCH"; things = things.filter((o) => o.k === "coin" || o.k === "heart" || o.k === "pu" || o.k === "goal" || o.x > W + 4); };

    const finish = () => {
      mode = "over"; overT = 0;
      if (score > best) { best = score; lsSet(BEST_KEY, best); elBest.textContent = best; newBest = true; for (let i = 0; i < 46; i++) conf.push({ x: rnd(0, W), y: rnd(-30, 0), vx: rnd(-18, 18), vy: rnd(20, 70), c: ["#FFD84D", "#F386A1", "#5CE0A8", "#8EC5FF", "#fff"][i % 5], l: 2.2 }); }
      elHint.textContent = newBest ? `Neuer Rekord: ${score} Punkte! Tippe für noch eine Runde.` : `${score} Punkte. Tippe für noch eine Runde.`;
      if (opts.onScore && score > 0) { try { opts.onScore(score); } catch { /* ignorieren */ } }
    };

    const onPlat = (p) => p.x < HORSE_X + hxo + 28 && p.x + p.w > HORSE_X + hxo + 12;
    const pitUnder = () => { const cx = HORSE_X + 20; for (const o of things) if (o.k === "pit" && !o.filled && cx > o.x + 3 && cx < o.x + o.w - 3) return o; return null; };
    const platUnder = () => { for (const o of things) if (o.k === "plat" && onPlat(o) && hyPrev <= -o.lv + 1 && hy >= -o.lv) return o; return null; };
    const ENEMY = new Set(["walker", "spiker", "flyer", "frog", "barrel", "diver"]);
    const STOMP = new Set(["walker", "flyer", "frog", "diver"]);
    const frogUp = (o) => { const ph = ((t + o.ph) % 1.1) / 1.1; return ph < .45 ? Math.sin((ph / .45) * Math.PI) * 30 : 0; };
    const diveLift = (o) => { const d = o.x - (HORSE_X + 20); const k = d > 0 ? Math.max(0, Math.min(1, (120 - d) / 70)) : Math.max(0, 1 + d / 50); return o.lift - 52 * k; };
    const eb = (o) => o.k === "flyer" ? GROUND - o.lift - Math.round(Math.sin(t * 4 + o.ph) * 3)
      : o.k === "frog" ? GROUND - Math.round(frogUp(o)) : o.k === "diver" ? GROUND - Math.round(diveLift(o)) : GROUND;   /* Unterkante eines Gegners */

    function update(dt) {
      t += dt;
      const run = mode === "run";
      if (run) {
        rt += dt;
        speed = Math.min(SPEED_MAX, SPEED0 + rt * SPEED_UP);
        const lv = 1 + Math.floor((speed - SPEED0) / 18);
        if (lv > level) { level = lv; bannerT = 1.4; bannerTxt = "TEMPO " + level; }
        const sp = stun > 0 ? speed * .4 : speed;
        /* Zielflagge erreicht: nächstes Level, nächste Welt */
        for (const o of things) if (o.k === "goal" && !o.passed && o.x < HORSE_X + 22) {
          o.passed = true; lvl++; goalAt = rt + BLEN; goalOut = false; world = (world + 1) % WORLDS.length; portal = .45;
          bonus += 50; hearts = Math.min(3, hearts + 1); drawHearts(); bannerT = 2.2; bannerTxt = `LEVEL ${lvl} · ${WORLDS[world].name}`; bump("lvl", lvl);
          for (let i = 0; i < 30; i++) conf.push({ x: rnd(20, W - 20), y: rnd(-20, 10), vx: rnd(-20, 20), vy: rnd(20, 60), c: ["#FFD84D", "#F386A1", "#5CE0A8", "#8EC5FF"][i % 4], l: 1.6 });
        }
        if (rushT > 0) {
          rushT -= dt; rushSpawn -= dt;
          if (rushSpawn <= 0) { rushSpawn = .22; const y = GROUND - rnd(8, 70); for (let i = 0; i < 3; i++) things.push({ k: "coin", x: W + 6 + i * 8, y: y - Math.sin(i) * 3, got: false }); }
        } else if (rt > rushAt) { rushAt = rt + rnd(45, 70); startRush(); }
        for (const k in fx) fx[k] = Math.max(0, fx[k] - dt);
        zoneT = Math.max(0, zoneT - dt);
        hintT -= dt; if (hintT <= 0) { hintT = .5; hintMissions(); }
        dist += sp * dt;
        nextAt -= sp * dt;
        if (nextAt <= 0) spawn();
        for (const o of things) { o.x -= (sp + (o.v || 0)) * dt; if (o.dead) o.dt -= dt; if (o.squash > 0) o.squash -= dt; if (o.mv) o.lv = o.lb + Math.sin(t * 2.2 + o.ph) * o.mv; }
        things = things.filter((o) => o.x + (o.w || 14) > -20 && !(o.dead && o.dt <= 0));
      }
      /* Bewegung: Boden, Plattformen (einseitig), Abgründe. Halten dehnt den Aufstieg, am höchsten Punkt „schwebt“ das Pferd kurz. */
      hyPrev = hy; coyote = Math.max(0, coyote - dt); landT = Math.max(0, landT - dt);
      if (slideT > 0) { slideT -= dt; if (slideHeld && onGround) slideT = Math.max(slideT, .12); if (!onGround) slideT = 0; }
      const land = (top, p) => {
        hy = top; vy = 0; holding = false; riding = p || null; onGround = true; landT = .12; airJumped = false;
        if (slideHeld) slideT = .4;
        for (let i = 0; i < 5; i++) dust.push({ x: HORSE_X + 6, y: GROUND + hy, vx: rnd(-40, -8), vy: rnd(-26, -4), l: .35 });
        if (buffer > 0 && run) jumpNow();
      };
      if (riding) {
        if (!onPlat(riding)) { riding = null; onGround = false; vy = 0; coyote = .09; holding = false; }
        else hy = -riding.lv;
      } else if (onGround && run && pitUnder()) { falling = true; onGround = false; vy = 0; coyote = .09; }
      if (!onGround) {
        let g = GRAV;
        if (holding && vy < 0 && holdT < HOLD_MAX) g = GRAV * HOLD_G;
        else if (holding && !falling && Math.abs(vy) < 55) g = GRAV * .7;
        holdT += dt; vy += g * dt; hy += vy * dt;
        if (vy >= 0 && !falling) { const p = platUnder(); if (p) land(-p.lv, p); }
        if (!onGround && !falling && hy >= 0 && vy >= 0) { if (pitUnder()) falling = true; else land(0, null); }
        if (falling && hy > 36) {
          if (shield) { shield = false; pops.push({ x: HORSE_X, y: GROUND - 50, l: .9, s: "SCHILD!" }); } else hearts--;
          drawHearts(); flash = 1.2; shake = .25; stun = .5; vy = 0; hy = -44; falling = false;
          for (const o of things) if (o.k === "pit" && o.x < HORSE_X + 70 && o.x + o.w > HORSE_X - 30) o.filled = true;   /* Brett drüber, sonst fällt man gleich nochmal */
          if (hearts <= 0) { score = scoreNow(); setScore(); finish(); }
        }
      } else if (!riding) hy = 0;
      hxo += ((onGround ? 0 : 7) - hxo) * Math.min(1, dt * 9);
      buffer = Math.max(0, buffer - dt);
      stun = Math.max(0, stun - dt); shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt); bannerT = Math.max(0, bannerT - dt); overT += dt;
      /* Treffer, Gegner und Sammelstücke (großzügige Rechtecke) */
      if (run) {
        const sliding = slideT > 0 && onGround;
        const hx0 = HORSE_X + 10 + hxo, hx1 = HORSE_X + 30 + hxo, hyTop = GROUND - (sliding ? 12 : 24) + hy, hyBot = GROUND - 2 + hy, prevBot = GROUND - 2 + hyPrev;
        const cx = HORSE_X + 20 + hxo, cy = GROUND - 12 + hy;
        const hurt = (o) => {
          if (fx.star > 0) { o.hit = true; return; }
          if (shield) { o.hit = true; shield = false; stun = .7; flash = .6; shake = .15; vy = Math.min(vy, -120); onGround = false; riding = null; pops.push({ x: HORSE_X + 10, y: GROUND - 40 + hy, l: .9, s: "SCHILD!" }); return; }
          o.hit = true; hearts--; stun = .9; shake = .25; flash = .9; vy = Math.max(vy, -80); onGround = false; holding = false; riding = null; drawHearts();
          if (navigator.vibrate) { try { navigator.vibrate(40); } catch { /* ignorieren */ } }
          if (hearts <= 0) { score = scoreNow(); setScore(); finish(); }
        };
        for (const o of things) {
          if (mode !== "run") break;
          if (o.k === "coin" || o.k === "heart") {
            if (o.got) continue;
            const ox = o.x + (o.k === "heart" ? 4.5 : 2.5), oy = o.y + (o.k === "heart" ? 4 : 2.5), d = Math.hypot(cx - ox, cy - oy);
            if (d < 15) {
              o.got = true;
              if (o.k === "coin") { coins++; bump("coins", coins); pops.push({ x: o.x, y: o.y, l: .6, s: "+10" }); }
              else { hearts = Math.min(3, hearts + 1); drawHearts(); pops.push({ x: o.x, y: o.y, l: .8, s: "♥" }); }
            } else if (d < (fx.magnet > 0 ? 95 : 36)) {             /* Magnet: Münzen in der Nähe fliegen zum Pferd */
              const m = Math.min(1, (fx.magnet > 0 ? 240 : 120) * dt / d); o.x += (cx - ox) * m; o.y += (cy - oy) * m;
            }
          } else if (o.k === "pu") {
            if (o.got) continue;
            if (Math.hypot(cx - (o.x + 5), cy - (o.y + 5)) < 16) {
              o.got = true; bump("pu");
              if (o.ty === "shield") shield = true; else fx[o.ty] = o.ty === "star" ? 6 : o.ty === "magnet" ? 9 : 12;
              bannerT = 1.4; bannerTxt = { magnet: "MAGNET", shield: "SCHILD", star: "STERN", dbl: "DOPPELSPRUNG" }[o.ty];
            }
          } else if (ENEMY.has(o.k)) {
            if (o.dead || falling) continue;
            const yb = eb(o), yt = yb - o.h;
            if (o.x + o.w - 3 <= hx0 || o.x + 3 >= hx1) continue;
            if (fx.star > 0 && hyBot > yt + 2 && hyTop < yb - 2) {                     /* Stern: Gegner fliegen weg */
              o.dead = true; o.dt = .45; stomps++; bump("stomps", stomps); pops.push({ x: o.x, y: yt - 6, l: .7, s: "+25" }); continue;
            }
            if (STOMP.has(o.k) && vy > 0 && prevBot <= yt + 6 && hyBot > yt) {      /* von oben draufspringen */
              o.dead = true; o.dt = .45; stomps++; bump("stomps", stomps); pops.push({ x: o.x, y: yt - 6, l: .7, s: "+25" }); airJumped = false;
              vy = down ? -235 : -185; holding = down; holdT = 0; onGround = false; riding = null; hy = Math.min(hy, yt - GROUND + 2);
              for (let i = 0; i < 6; i++) dust.push({ x: o.x + 7, y: yb - 2, vx: rnd(-34, 34), vy: rnd(-30, -6), l: .4 });
            } else if (stun <= 0 && !o.hit && hyBot > yt + 2 && hyTop < yb - 2) hurt(o);
          } else if (o.k === "pit" || o.k === "plat" || o.k === "goal") { /* eigene Physik oben */ }
          else if (o.k === "bar") {                                                    /* Balken: nur drunter durchrutschen */
            if (o.x + o.w - 3 > hx0 && o.x + 3 < hx1) {
              if (fx.star <= 0 && stun <= 0 && !o.hit && hyTop < GROUND - 15 && hyBot > GROUND - 84) hurt(o);
            } else if (!o.cnt && o.x + o.w < hx0 && !o.hit) { o.cnt = true; bump("bars"); }
          } else if (o.k === "spring") {                                               /* Sprungfeder: hoch hinaus */
            if (!o.used && o.x + o.w - 2 > hx0 && o.x + 2 < hx1 && hyBot >= GROUND - 10 && vy >= 0 && !falling) {
              o.used = true; o.squash = .25; vy = -395; onGround = false; riding = null; holding = false; slideT = 0; airJumped = false; bump("spring");
              for (let i = 0; i < 6; i++) dust.push({ x: o.x + 6, y: GROUND, vx: rnd(-30, 30), vy: rnd(-40, -10), l: .4 });
            }
          }
          else if (fx.star > 0) { /* Stern: durch Hindernisse durch */ }
          else if (stun <= 0 && !o.hit && o.x + o.w - 4 > hx0 && o.x + 4 < hx1 && hyBot > GROUND - o.h + 3) hurt(o);
        }
        things = things.filter((o) => !((o.k === "coin" || o.k === "heart" || o.k === "pu") && o.got));
        if (mode === "run") { score = scoreNow(); setScore(); }
      }
      if (run && onGround && stun <= 0 && Math.random() < dt * 14) dust.push({ x: HORSE_X + 4, y: GROUND, vx: rnd(-40, -14), vy: rnd(-10, -2), l: .3 });
      for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.l -= dt; }
      dust = dust.filter((d) => d.l > 0);
      for (const p of pops) { p.y -= 26 * dt; p.l -= dt; }
      pops = pops.filter((p) => p.l > 0);
      for (const c of conf) { c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 40 * dt; c.l -= dt; }
      conf = conf.filter((c) => c.l > 0 && c.y < H);
      /* Vögel */
      if (Math.random() < dt * .25 && birds.length < 3) birds.push({ x: W + 10, y: rnd(14, 50), v: rnd(18, 34), ph: rnd(0, 6) });
      for (const b of birds) b.x -= b.v * dt;
      birds = birds.filter((b) => b.x > -10);
      /* Hintergrund wandert immer, im Wartezustand langsam */
      const bg = (mode === "run" ? (stun > 0 ? speed * .4 : speed) : 26) * dt;
      for (const c of clouds) { c.x -= bg * .12; if (c.x < -c.w) { c.x = W + rnd(0, 30); c.y = rnd(10, 42); } }
      sc += bg;
      portal = Math.max(0, portal - dt);
      const k = Math.min(1, dt * 4); skyA = mix(skyA, WORLDS[world].a, k); skyB = mix(skyB, WORLDS[world].b, k);
      groundOff = (groundOff + bg) % 16;
    }

    const hp = (v) => Math.round(v * 2) / 2;            /* halbe Pixel: doppelte Auflösung */
    const px = (c, x, y, w, h, al) => { if (al) ctx.globalAlpha = al; ctx.fillStyle = c; ctx.fillRect(hp(x), hp(y), w, h); if (al) ctx.globalAlpha = 1; };

    const circle = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); px(c, cx - w, cy + y, w * 2 + 1, 1); } };
    const win = (x, y, w, h, base, lit, n, th) => {   /* Fenster-Raster eines Hauses */
      for (let yy = y + 2.5; yy < y + h - 3; yy += 4.5) for (let xx = x + 2.5; xx < x + w - 3; xx += 3.5) { const on = hash(n * 31 + xx * 3.1 + yy * 7.7) > th; px(on ? lit : base, xx, yy, 1.5, 2.5); }
    };
    const OUT = () => world >= 2 ? "#FFFFFF" : "#1E1E1E";
    const WK = [["#C1354F", "#F2DDB6"], ["#8E9BB1", "#FF4D4D"], ["#FF2BD6", "#00E5FF"], ["#58B368", "#E9F4FF"]];
    const SP = [["#8A5A26", "#F2DDB6"], ["#7A8190", "#E9E9E9"], ["#2B0F55", "#FF2BD6"], ["#6B7085", "#C9CDE0"]];
    const FL = [["#FFD84D", "#1E1E1E"], ["#9AA6B8", "#FF4D4D"], ["#00E5FF", "#FF2BD6"], ["#58B368", "#E9F4FF"]];
    const FR = [["#4CB050", "#C8F08F"], ["#E8334F", "#FFD0D8"], ["#39FF88", "#14062E"], ["#9B7BFF", "#E0D4FF"]];
    const BR = [["#A0662E", "#5A3412"], ["#C1354F", "#E9E9E9"], ["#FF2BD6", "#00E5FF"], ["#8C8FA3", "#4C5063"]];
    const DV = [["#F4F4F4", "#9AA6B8"], ["#8E9BB1", "#5B677C"], ["#8A1AFF", "#00E5FF"], ["#FFB347", "#FFE9A3"]];
    function drawEnemy(o, x) {
      const f = Math.floor(t * 8 + o.ph * 3) % 2, yb = eb(o), OL = OUT();
      if (o.dead) { const c = (o.k === "walker" ? WK : o.k === "spiker" ? SP : o.k === "frog" ? FR : o.k === "barrel" ? BR : FL)[world][0]; px(OL, x, yb - 4, 14, 4); px(c, x + 1, yb - 3, 12, 2); return; }
      if (o.k === "walker") {                              /* Pilz / Roboter / Neon-Käfer / Alien */
        const [b, a] = WK[world];
        px(OL, x, yb - 10, 14, 9); px(OL, x + 2, yb - 12, 10, 2); px(b, x + 1, yb - 9, 12, 7); px(b, x + 3, yb - 11, 8, 2);
        if (world === 0) { px(a, x + 3, yb - 10, 2, 2); px(a, x + 9, yb - 10, 2, 2); }
        else { px(OL, x + 6, yb - 15, 2, 4); px(a, x + 5, yb - 16, 4, 2); }
        px("#fff", x + 3, yb - 8, 3, 3); px("#fff", x + 8, yb - 8, 3, 3); px("#1E1E1E", x + 4, yb - 7, 2, 2); px("#1E1E1E", x + 8, yb - 7, 2, 2);
        px(OL, x + (f ? 1 : 3), yb - 2, 4, 2); px(OL, x + (f ? 9 : 7), yb - 2, 4, 2);
      } else if (o.k === "spiker") {                       /* Igel / Stachelkugel / Mine / Asteroid: nicht draufspringen! */
        const [b, a] = SP[world], p = f ? 0 : 1;
        px(OL, x, yb - 9, 14, 9); px(b, x + 1, yb - 8, 12, 7);
        for (let i = 0; i < 4; i++) { px(OL, x + 1 + i * 3.5, yb - 12 - p, 2, 3); px(a, x + 1.5 + i * 3.5, yb - 11 - p, 1, 2); }
        px(a, x - 2 - p, yb - 6, 2, 2); px("#fff", x + 8, yb - 6, 3, 3); px("#E8334F", x + 9, yb - 5, 2, 2);
      } else if (o.k === "frog") {                         /* Frosch / Gummi-Frosch / Neon-Frosch / Glibber: hüpft, draufspringen geht */
        const [b, a] = FR[world], air = frogUp(o) > 1;
        px(OL, x + 1, yb - 10, 12, 8); px(b, x + 2, yb - 9, 10, 6); px(a, x + 4, yb - 5, 6, 2);
        px(OL, x + 2, yb - 13, 4, 4); px(OL, x + 8, yb - 13, 4, 4); px("#fff", x + 3, yb - 12, 2, 2); px("#fff", x + 9, yb - 12, 2, 2); px("#1E1E1E", x + 3, yb - 11, 1, 1); px("#1E1E1E", x + 9, yb - 11, 1, 1);
        if (air) { px(OL, x - 1, yb - 3, 4, 3); px(OL, x + 11, yb - 3, 4, 3); px(b, x, yb - 2, 2, 1); px(b, x + 12, yb - 2, 2, 1); }
        else { px(OL, x, yb - 3, 5, 3); px(OL, x + 9, yb - 3, 5, 3); px(b, x + 1, yb - 2, 3, 1); px(b, x + 10, yb - 2, 3, 1); }
      } else if (o.k === "barrel") {                       /* rollendes Fass / Ölfass / Neon-Rolle / Felsbrocken: drüberspringen! */
        const [b, a] = BR[world], r = Math.floor(t * 10) % 4;
        px(OL, x + 2, yb - 12, 8, 12); px(OL, x, yb - 10, 12, 8); px(b, x + 3, yb - 11, 6, 10); px(b, x + 1, yb - 9, 10, 6);
        px(a, x + 1, yb - 7 + (r % 2), 10, 1); px(a, x + 3 + r, yb - 11, 1, 10);
        px("#ffffff", x + 3, yb - 10, 2, 1, .5);
      } else if (o.k === "diver") {                        /* Möwe / Taube / Neon-Fledermaus / Komet: stürzt herab, draufspringen geht */
        const [b, a] = DV[world], dive = diveLift(o) < o.lift - 20;
        px(OL, x + 1, yb - 8, 12, 7); px(b, x + 2, yb - 7, 10, 5); px(OL, x - 2, yb - 6, 4, 3); px("#FFB347", x - 2, yb - 5, 3, 1);
        px("#fff", x + 2, yb - 6, 2, 2); px("#1E1E1E", x + 2, yb - 5, 1, 1);
        if (dive) { px(a, x + 6, yb - 10, 8, 3); px(OL, x + 6, yb - 11, 8, 1); }
        else if (f) { px(a, x + 4, yb - 14, 3, 7); px(a, x + 9, yb - 14, 3, 7); } else { px(a, x + 2, yb - 3, 4, 3); px(a, x + 9, yb - 3, 4, 3); }
      } else {                                             /* Biene / Drohne / Cyber-Drohne / UFO */
        const [b, a] = FL[world];
        px(OL, x + 2, yb - 8, 10, 8); px(b, x + 3, yb - 7, 8, 6); px(a, x + 5, yb - 7, 2, 6); px(a, x + 9, yb - 7, 2, 6);
        if (world === 3) { px(OL, x + 4, yb - 12, 6, 4); px("#9BE3FF", x + 5, yb - 11, 4, 3); }
        else if (f) { px("#E9F4FF", x + 3, yb - 13, 3, 5); px("#E9F4FF", x + 8, yb - 13, 3, 5); }
        else { px("#E9F4FF", x + 1, yb - 10, 4, 2); px("#E9F4FF", x + 9, yb - 10, 4, 2); }
        px("#fff", x + 1, yb - 5, 2, 2); px("#1E1E1E", x + 1, yb - 4, 1, 1);
      }
    }
    function drawPit(o) {
      const x = Math.round(o.x), w = Math.round(o.w), W_ = WORLDS[world], dh = H - GROUND;
      if (o.filled) {                                       /* Brett über dem Abgrund */
        px(OUT(), x - 1, GROUND - 1, w + 2, 5); px("#C48A4A", x, GROUND, w, 3);
        for (let i = 3; i < w; i += 6) px("#8A5A26", x + i, GROUND, 1, 3);
        return;
      }
      px(["#2A1A10", "#14161C", "#05010F", "#000000"][world], x, GROUND, w, dh);
      px("#1E1E1E", x - 1, GROUND, 1, dh); px("#1E1E1E", x + w, GROUND, 1, dh);
      if (world === 0) { px("#3A2616", x, GROUND + 14, w, dh); for (let i = 0; i < w; i += 7) px("#4A3220", x + i, GROUND + 6 + (i % 3) * 4, 4, 2); }
      else if (world === 1) { for (let i = 0; i < w; i += 6) { px("#FFD84D", x + i, GROUND - 1, 3, 1); px("#FFD84D", x + i, GROUND + 5, 3, 1); } px("#2B3140", x, GROUND + 24, w, dh); }
      else if (world === 2) { px("#00E5FF", x, GROUND, 1, dh); px("#00E5FF", x + w - 1, GROUND, 1, dh); for (let i = 1; i < 6; i++) px("#FF2BD6", x, GROUND + i * i * 1.2, w, 1); }
      else { for (let i = 0; i < 6; i++) px("#FFF8D6", x + (i * 11 + 3) % w, GROUND + 6 + (i * 13) % (dh - 8), 1, 1); circle(x + w / 2, GROUND + 26, 4, "#2A1B5C"); }
    }
    /* Power-up-Symbole: Magnet, Schild, Stern, Doppelsprung (in einer Blase) */
    function drawPU(ty, x, y, bubble) {
      if (bubble) { circle(x + 5, y + 5, 8, OUT()); circle(x + 5, y + 5, 7, ["#FFE3EA", "#E3F0FF", "#FFF6C9", "#E6FFF1"][["magnet", "shield", "star", "dbl"].indexOf(ty)]); px("#ffffff", x + 1, y, 3, 2); }
      if (ty === "magnet") { px("#1E1E1E", x + 1, y + 1, 9, 9); px("#E8334F", x + 2, y + 2, 7, 7); px("#FFE3EA", x + 4, y + 2, 3, 5); px("#E9E9E9", x + 2, y + 7, 2, 2); px("#E9E9E9", x + 7, y + 7, 2, 2); }
      else if (ty === "shield") { px("#1E1E1E", x + 1, y + 1, 9, 7); px("#1E1E1E", x + 3, y + 8, 5, 2); px("#3E7CD6", x + 2, y + 2, 7, 5); px("#3E7CD6", x + 4, y + 7, 3, 2); px("#9BC6FF", x + 3, y + 3, 2, 2); }
      else if (ty === "star") { px("#1E1E1E", x + 4, y, 3, 11); px("#1E1E1E", x, y + 3, 11, 4); px("#FFD84D", x + 5, y + 1, 1, 9); px("#FFD84D", x + 1, y + 4, 9, 2); px("#FFD84D", x + 3, y + 3, 5, 5); px("#FFF3B0", x + 4, y + 4, 1, 1); }
      else { px("#1E1E1E", x, y + 2, 11, 7); px("#5CE0A8", x + 1, y + 3, 4, 5); px("#5CE0A8", x + 6, y + 3, 4, 5); px("#FFFFFF", x + 2, y + 4, 2, 1); px("#FFFFFF", x + 7, y + 4, 2, 1); }
    }
    function drawThing(o) {
      const x = Math.round(o.x), W_ = WORLDS[world];
      if (o.k === "pit") return;
      if (ENEMY.has(o.k)) { drawEnemy(o, x); return; }
      if (o.k === "goal") {                                  /* Zielflagge: Stange + Schachbrett-Fahne */
        px(OUT(), x - 1, GROUND - 58, 4, 58); px("#E9E9E9", x, GROUND - 57, 2, 57); circle(x + 1, GROUND - 59, 2, "#FFD84D");
        const wv = Math.floor(t * 6) % 2;
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) px((r + c) % 2 ? "#1E1E1E" : "#FFFFFF", x + 2 + c * 3, GROUND - 56 + r * 3 + ((c + wv) % 2), 3, 3);
        px(OUT(), x + 2, GROUND - 57, 18, 1);
        return;
      }
      if (o.k === "bar") {                                   /* Balken: hängt an Ketten, nur drunter durchrutschen */
        const c1 = ["#C1354F", "#FFD84D", "#FF2BD6", "#C9CDE0"][world], c2 = world === 2 ? "#14062E" : "#FFFFFF";
        for (let y = 0; y < GROUND - 30; y += 4) { px(OUT(), x + 3, y, 2, 3); px(OUT(), x + o.w - 5, y, 2, 3); }
        px(OUT(), x - 1, GROUND - 31, o.w + 2, 16); for (let i = 0; i < o.w; i += 6) { px(c1, x + i, GROUND - 30, 3, 14); px(c2, x + i + 3, GROUND - 30, 3, 14); }
        const blink = Math.floor(t * 4) % 2;
        if (blink) { ctx.fillStyle = OUT() === "#FFFFFF" ? "#FFFFFF" : "#1E1E1E"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillText("↓", x + o.w / 2, GROUND - 42); ctx.textAlign = "left"; }
        return;
      }
      if (o.k === "spring") {                                /* Sprungfeder */
        const sq = o.squash > 0 ? 4 : 0;
        px(OUT(), x - 1, GROUND - 4, o.w + 2, 4); px("#5B6577", x, GROUND - 3, o.w, 3);
        for (let i = 0; i < 3; i++) px(i % 2 ? "#9AA6B8" : "#E9E9E9", x + 2, GROUND - 6 - i * (3 - sq / 3) , o.w - 4, 2);
        px(OUT(), x - 1, GROUND - 14 + sq, o.w + 2, 4); px("#E8334F", x, GROUND - 13 + sq, o.w, 2);
        if (!o.used && Math.floor(t * 3) % 2) { ctx.fillStyle = OUT(); ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillText("↑", x + o.w / 2, GROUND - 24); ctx.textAlign = "left"; }
        return;
      }
      if (o.k === "pu") { drawPU(o.ty, x, Math.round(o.y + Math.sin(t * 4 + o.x * .05) * 2), true); return; }
      if (o.k === "plat") {                                  /* Plattform: Holzbrett / Träger / Neon / Schwebefels */
        const y = GROUND - o.lv, TOP = ["#5CC183", "#FFD84D", "#00E5FF", "#C9CDE0"][world], BODY = ["#C48A4A", "#5B6577", "#14062E", "#7C8199"][world];
        px(OUT(), x - 1, y - 1, o.w + 2, 8); px(BODY, x, y + 1, o.w, 5); px(TOP, x, y, o.w, 2);
        for (let i = 5; i < o.w - 3; i += 8) px(mix(BODY, "#000000", .35), x + i, y + 2, 1, 4);
        return;
      }
      if (o.k === "hurdle") {
        px(W_.post, x, GROUND - 15, 2, 15); px(W_.post, x + 12, GROUND - 15, 2, 15);
        px(W_.rail1, x, GROUND - 14, 14, 3); px(W_.rail2, x + 3, GROUND - 14, 4, 3); px(W_.rail2, x + 10, GROUND - 14, 4, 3);
        px(W_.rail1, x, GROUND - 8, 14, 3); px(W_.rail2, x, GROUND - 8, 3, 3); px(W_.rail2, x + 6, GROUND - 8, 4, 3);
        px("#1E1E1E", x, GROUND - 15, 14, 1); px("#1E1E1E", x, GROUND - 11, 14, 1); px("#1E1E1E", x, GROUND - 5, 14, 1);
      } else if (o.k === "fence") {
        for (let i = 0; i < 4; i++) px(W_.post, x + i * 10, GROUND - 15, 3, 15);
        px(W_.rail1, x, GROUND - 13, 34, 3); px(W_.rail1, x, GROUND - 7, 34, 3);
        for (let i = 0; i < 6; i++) { px(W_.rail2, x + 2 + i * 6, GROUND - 13, 3, 3); px(W_.rail2, x + 5 + i * 6, GROUND - 7, 3, 3); }
        px("#1E1E1E", x, GROUND - 14, 34, 1); px("#1E1E1E", x, GROUND - 4, 34, 1);
      } else if (o.k === "crate") {
        px("#1E1E1E", x, GROUND - 21, 16, 21); px(W_.crate, x + 1, GROUND - 20, 14, 19); px(W_.crate2, x + 1, GROUND - 20, 14, 2); px(W_.crate2, x + 1, GROUND - 3, 14, 2);
        px(W_.crate2, x + 1, GROUND - 20, 2, 19); px(W_.crate2, x + 13, GROUND - 20, 2, 19);
        for (let i = 0; i < 12; i++) px(W_.crate2, x + 2 + i, GROUND - 19 + i, 1, 1);
      } else if (o.k === "bush") {                       /* niedriges Hindernis, je Welt anders */
        if (world === 0) {
          px("#0A6F43", x + 2, GROUND - 8, 14, 8); px("#0A8F57", x, GROUND - 6, 18, 6); px("#0A8F57", x + 4, GROUND - 12, 10, 6);
          px("#5CE0A8", x + 5, GROUND - 11, 3, 2); px("#5CE0A8", x + 11, GROUND - 7, 3, 2); px("#C1354F", x + 8, GROUND - 5, 2, 2); px("#C1354F", x + 3, GROUND - 3, 2, 2);
          px("#1E1E1E", x, GROUND - 1, 18, 1);
        } else if (world === 1) {                        /* Absperrung */
          px("#1E1E1E", x, GROUND - 12, 18, 12); px("#FFD84D", x + 1, GROUND - 11, 16, 10);
          for (let i = 0; i < 4; i++) px("#1E1E1E", x + 2 + i * 4, GROUND - 11, 2, 10);
          px("#1E1E1E", x + 2, GROUND - 14, 2, 3); px("#1E1E1E", x + 14, GROUND - 14, 2, 3);
        } else if (world === 2) {                        /* Neon-Block */
          const f = Math.floor(t * 8 + o.x) % 9 === 0;
          px("#FFFFFF", x - 2, GROUND - 14, 22, 15); px(f ? "#8A1AFF" : "#FF2BD6", x - 1, GROUND - 13, 20, 14); px("#14062E", x, GROUND - 12, 18, 12); px("#00E5FF", x + 2, GROUND - 10, 14, 2); px("#00E5FF", x + 2, GROUND - 5, 8, 2);
        } else {                                         /* Mondfelsen */
          px("#1E1E1E", x, GROUND - 11, 18, 11); px("#A1A6BC", x + 1, GROUND - 10, 16, 10); px("#7C8199", x + 1, GROUND - 6, 16, 6); px("#C9CDE0", x + 4, GROUND - 9, 5, 2); px("#6B7085", x + 10, GROUND - 4, 4, 2);
        }
      } else if (o.k === "heart") {
        const b = Math.round(Math.sin(t * 5 + o.x) * 1.5), y = Math.round(o.y) + b;
        px("#1E1E1E", x - 1, y - 1, 11, 10); px("#E8334F", x, y, 4, 4); px("#E8334F", x + 5, y, 4, 4); px("#E8334F", x, y + 3, 9, 3); px("#E8334F", x + 2, y + 6, 5, 2); px("#E8334F", x + 4, y + 8, 1, 1);
        px("#FFB3C0", x + 1, y + 1, 2, 1);
      } else {
        const sq = Math.abs(Math.sin(t * 6 + o.x * .1));         /* drehende Münze */
        const w = Math.max(1, Math.round(5 * (.25 + .75 * sq)));
        const cx = Math.round(o.x) + 2 - Math.floor(w / 2);
        px(world >= 2 ? "#FFFFFF" : "#1E1E1E", cx - 1, Math.round(o.y) - 1, w + 2, 7);
        px("#FFD84D", cx, Math.round(o.y), w, 5);
        if (w > 2) px("#FFF3B0", cx + 1, Math.round(o.y) + 1, 1, 2);
      }
    }

    /* Hintergrund-Ebenen je Welt: Position aus sc (gescrollte Pixel), keine Zufallsfelder nötig */
    function layerBuildings(f, tile, minH, maxH, colorFn, seedBase, winLit) {
      const k0 = Math.floor((sc * f) / tile), off = (sc * f) % tile;
      for (let i = -1; i < Math.ceil(W / tile) + 2; i++) {
        const n = k0 + i, x = Math.round(i * tile - off), h = Math.round(minH + hash(n + seedBase) * (maxH - minH)), w = tile - 2;
        colorFn(x, GROUND - h, w, h, n);
        if (winLit) win(x, GROUND - h, w, h, winLit[0], winLit[1], n, winLit[2] || .45);
      }
    }
    function drawWorld(w) {
      if (w === 0) {                                      /* Steppe: Sonne, Wolken, Hügel, Vögel */
        px("#FFE9A3", 196, 12, 14, 14); px("#FFD84D", 198, 14, 10, 10);
        for (const c of clouds) { const x = Math.round(c.x), y = Math.round(c.y); px("#fff", x + 4, y, c.w - 8, 5); px("#fff", x, y + 4, c.w, 5); px("#E4F1FF", x + 2, y + 8, c.w - 4, 2); }
        for (const b of birds) { const f = Math.floor(t * 6 + b.ph) % 2, x = Math.round(b.x), y = Math.round(b.y); px("#1E1E1E", x, y + (f ? 0 : 1), 2, 1); px("#1E1E1E", x + 2, y + (f ? 1 : 0), 2, 1); px("#1E1E1E", x + 4, y + (f ? 0 : 1), 2, 1); }
        { const tile = 56, f = .15, k0 = Math.floor(sc * f / tile), off = sc * f % tile; for (let i = -1; i < 6; i++) { const h = 8 + hash(k0 + i) * 8; px("#9FD8B8", i * tile - off, GROUND - 30 - h, 60, h + 30); px("#9FD8B8", i * tile - off + 10, GROUND - 34 - h, 40, 4); } }
        { const tile = 50, f = .3, k0 = Math.floor(sc * f / tile), off = sc * f % tile; for (let i = -1; i < 7; i++) { const h = 14 + hash(k0 + i + 99) * 16, x = i * tile - off; px("#7BD9A0", x, GROUND - h, 56, h); px("#7BD9A0", x + 6, GROUND - h - 4, 44, 4); px("#7BD9A0", x + 14, GROUND - h - 7, 28, 3); } }
      } else if (w === 1) {                               /* Stadt: Häuserzeilen, Laternen */
        for (const c of clouds) { const x = Math.round(c.x), y = Math.round(c.y); px("#E6EAF2", x + 4, y, c.w - 8, 4); px("#E6EAF2", x, y + 3, c.w, 4); }
        layerBuildings(.12, 22, 22, 56, (x, y, bw, bh) => px("#9DAAC0", x, y, bw, bh), 5, ["#8E9BB1", "#B4C0D6", .8]);
        layerBuildings(.3, 30, 28, 78, (x, y, bw, bh) => { px("#1E1E1E", x - 1, y - 1, bw + 2, bh + 1); px("#6F7C93", x, y, bw, bh); px("#5B677C", x, y, bw, 3); }, 17, ["#55607A", "#A9B6CF", .72]);
        px("#B8C4D6", 0, 0, W, GROUND, .38);               /* Hintergrund treten lassen: Hindernisse und Münzen bleiben gut sichtbar */
      } else if (w === 2) {                               /* Cyberpunk: Neon-Sonne, Türme, Schilder */
        for (let i = 0; i < 6; i++) px(i % 2 ? "#FF2BD6" : "#FF7A59", 176 + i, 12 + i * 3, 28 - i * 2, 2);
        layerBuildings(.12, 24, 28, 70, (x, y, bw, bh, n) => { px("#2B0F55", x, y, bw, bh); px(hash(n) > .5 ? "#00E5FF" : "#FF2BD6", x, y, bw, 1); px("#1D0A3C", x + bw - 3, y, 3, bh); }, 23, ["#3A1580", "#7A3FD0", .8]);
        layerBuildings(.32, 34, 36, 92, (x, y, bw, bh, n) => {
          px("#00E5FF", x - 1, y - 1, bw + 2, bh + 1); px("#12062B", x, y, bw, bh);
          const c = hash(n + 7) > .5 ? "#FF2BD6" : "#00E5FF", fl = Math.floor(t * 6 + n) % 11 === 0;
          px(fl ? "#12062B" : c, x + 4, y + 8, bw - 8, 3); px(fl ? "#12062B" : c, x + 4, y + 16, Math.round((bw - 8) / 2), 3);
        }, 41, ["#2A1058", "#6B3FB8", .75]);
        px("#0A0420", 0, 0, W, GROUND, .5);
      } else {                                            /* Weltraum: Sterne, Ringplanet, Erde */
        for (const st of stars) { const x = ((st.x - sc * (.03 + st.s * .02)) % W + W) % W; const tw = .5 + .5 * Math.sin(t * 2 + st.ph); if (tw > .3) px("#FFF8D6", x, st.y, st.s, st.s); }
        circle(54, 38, 15, "#C98A5B"); circle(54, 38, 15, "#C98A5B"); px("#A8693F", 40, 34, 28, 3); px("#E4B58A", 44, 42, 20, 2); px("#E9D9A8", 38, 40, 32, 1); px("#E9D9A8", 36, 38, 36, 1);
        circle(190, 28, 9, "#3E7CD6"); px("#58B368", 185, 25, 5, 4); px("#58B368", 192, 30, 4, 3); px("#E9F4FF", 187, 22, 6, 1);
      }
    }
    function drawGround(w) {
      const W_ = WORLDS[w];
      px(W_.gnd, -4, GROUND, W + 8, 6); px("#1E1E1E", -4, GROUND + 5, W + 8, 1);
      px(W_.soil, -4, GROUND + 6, W + 8, H - GROUND);
      if (w === 0) {
        for (let i = -1; i < 16; i++) { const x = i * 16 - groundOff; px("#C49A63", x + 4, GROUND + 12, 5, 2); px("#C49A63", x + 11, GROUND + 18, 3, 2); }
        for (let i = -1; i < 30; i++) { const x = i * 8 - (groundOff % 8); px("#3FA96B", x, GROUND - 1, 2, 1); }
        for (let i = 0; i < 6; i++) { const x = ((i * 48 + 9 - groundOff * 3) % 288 + 288) % 288 - 20; if (x > -4 && x < W) { px("#2F8F58", x + 1, GROUND + 1, 1, 3); px(["#F386A1", "#FFD84D", "#fff"][i % 3], x, GROUND - 1, 3, 2); } }
      } else if (w === 1) {
        for (let i = -1; i < 16; i++) { const x = i * 16 - groundOff; px("#E9E9E9", x + 2, GROUND + 14, 9, 2); }
        for (let i = -1; i < 30; i++) { const x = i * 8 - (groundOff % 8); px("#8C94A4", x, GROUND, 4, 1); }
        for (let i = 0; i < 3; i++) { const x = ((i * 96 + 40 - sc * .9) % 288 + 288) % 288 - 20; if (x > -6 && x < W) { px("#2B3140", x, GROUND - 38, 2, 38); px("#2B3140", x, GROUND - 38, 8, 2); px("#FFE9A3", x + 5, GROUND - 36, 5, 3); } }
      } else if (w === 2) {
        px("#00E5FF", -4, GROUND, W + 8, 1); px("#FF2BD6", -4, GROUND + 6, W + 8, 1);
        for (let i = -1; i < 16; i++) { const x = i * 16 - groundOff; px("#7B2CD6", x, GROUND + 7, 1, H); }
        for (let i = 1; i < 5; i++) px("#7B2CD6", -4, GROUND + 6 + i * i * 2, W + 8, 1);
      } else {
        for (let i = -1; i < 12; i++) { const x = ((i * 24 - groundOff * 1.5) % 288 + 288) % 288 - 20; px("#4C5063", x + 2, GROUND + 11 + (i % 3) * 5, 10, 3); px("#4C5063", x + 4, GROUND + 14 + (i % 3) * 5, 6, 1); }
        for (let i = -1; i < 30; i++) { const x = i * 8 - (groundOff % 8); px("#B5BACD", x, GROUND, 3, 1); }
      }
    }

    function draw() {
      const sx = shake > 0 ? hp(rnd(-2, 2)) : 0;
      ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.save(); ctx.translate(sx, 0);
      px(skyA, -4, 0, W + 8, 60); px(skyB, -4, 60, W + 8, 60);
      drawWorld(world);
      if (rushT > 0) px(`rgba(255,216,77,${(.18 + .08 * Math.sin(t * 8)).toFixed(2)})`, -4, 0, W + 8, GROUND);
      drawGround(world);
      for (const o of things) if (o.k === "pit" && o.x < W + 4) drawPit(o);
      for (const o of things) if (o.x < W + 4) drawThing(o);
      /* Tempolinien */
      if (mode === "run" && speed > 140) for (let i = 0; i < 5; i++) { const y = 20 + ((i * 37 + Math.floor(t * 9) * 13) % 80), x = ((i * 91 - t * speed * 1.4) % W + W) % W; px("rgba(255,255,255,.5)", x, y, 14 + (speed - 140) / 4, 1); }
      for (const d of dust) px(world === 3 ? "#C9CDE0" : "#F2DDB6", d.x, d.y - 1, 1.5, 1.5);
      /* Pferd */
      const frame = (!onGround || mode !== "run") ? 0 : (Math.floor(t * (6 + speed / 28)) % 2);
      const blink = flash > 0 && Math.floor(t * 18) % 2 === 0;
      if (hs && !blink) {
        const sliding = slideT > 0 && onGround, ang = onGround ? 0 : Math.max(-.13, Math.min(.2, vy / 1100)), sq = sliding ? .55 : landT > 0 ? 1 - landT * 1.2 : 1;
        if (fx.star > 0 && Math.floor(t * 12) % 2) ctx.globalAlpha = .55;
        ctx.save(); ctx.translate(HORSE_X + hxo + 18, hp(GROUND - 27 + hy) + 28); ctx.rotate(ang); ctx.scale(1 + (1 - sq) * .5, sq);
        ctx.drawImage(hs[frame], -18, -28, 36, 28); ctx.restore(); ctx.globalAlpha = 1;
        if (sliding && Math.random() < .6) dust.push({ x: HORSE_X + 30 + hxo, y: GROUND, vx: rnd(-60, -20), vy: rnd(-20, -4), l: .25 });
      }
      if (shield && mode === "run") { ctx.strokeStyle = `rgba(110,170,255,${(.55 + .25 * Math.sin(t * 6)).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(HORSE_X + hxo + 19, GROUND - 13 + hy, 19, 0, Math.PI * 2); ctx.stroke(); }
      if (fx.star > 0 && mode === "run") for (let i = 0; i < 4; i++) { const a = t * 5 + i * 1.57; px(["#FFD84D", "#F386A1", "#5CE0A8", "#8EC5FF"][i], HORSE_X + hxo + 19 + Math.cos(a) * 20, GROUND - 13 + hy + Math.sin(a) * 14, 2, 2); }
      if (!falling) px("rgba(30,30,30,.25)", HORSE_X + 6 + hxo / 2, GROUND + 1, Math.max(8, 24 + Math.round(Math.min(0, hy) / 4)), 2);
      ctx.font = "bold 8px monospace"; ctx.textBaseline = "top";
      for (const p of pops) { ctx.fillStyle = "#1E1E1E"; ctx.fillText(p.s, Math.round(p.x) + 1, Math.round(p.y) + 1); ctx.fillStyle = p.s === "♥" ? "#FF6B81" : "#FFD84D"; ctx.fillText(p.s, Math.round(p.x), Math.round(p.y)); }
      /* Weltwechsel: kurzer Blitz */
      if (portal > 0) px(`rgba(255,255,255,${Math.min(.85, portal * 1.6).toFixed(2)})`, -4, 0, W + 8, H);
      /* Anzeigen */
      if (mode === "run") {
        ctx.fillStyle = "rgba(30,30,30,.55)"; ctx.fillRect(4, 4, 74, 11); ctx.fillStyle = "#fff"; ctx.fillText(`LEVEL ${lvl} · T${level}`, 7, 6);
        /* Fortschritt bis zur Zielflagge */
        const gp = Math.max(0, Math.min(1, 1 - (goalAt - rt) / BLEN)); px("rgba(30,30,30,.55)", 4, 16, 74, 3); px("#5CE0A8", 4, 16, Math.round(74 * gp), 3);
        let ix = W - 16;                                  /* aktive Power-ups oben rechts */
        for (const k of ["star", "magnet", "dbl"]) if (fx[k] > 0) { const blink = fx[k] < 2 && Math.floor(t * 8) % 2; if (!blink) drawPU(k, ix, 4, false); px("#1E1E1E", ix, 16, 11, 2); px("#FFD84D", ix, 16, Math.round(11 * Math.min(1, fx[k] / (k === "star" ? 6 : k === "magnet" ? 9 : 12))), 2); ix -= 15; }
        if (shield) drawPU("shield", ix, 4, false);
      }
      /* Tipp-Zonen am Anfang: links rutschen, rechts springen */
      if (mode === "run" && zoneT > 0) {
        const al = Math.min(1, zoneT / 1.5);
        px(`rgba(255,255,255,${(.16 * al).toFixed(2)})`, 0, 22, Math.round(W * .35), GROUND - 22); px(`rgba(30,30,30,${(.35 * al).toFixed(2)})`, Math.round(W * .35), 22, 1, GROUND - 22);
        ctx.globalAlpha = al; ctx.textAlign = "center"; ctx.fillStyle = "#1E1E1E";
        ctx.fillText("↓ RUTSCHEN", W * .175 + 1, GROUND - 13); ctx.fillText("↑ SPRINGEN", W * .675 + 1, GROUND - 13);
        ctx.fillStyle = "#fff"; ctx.fillText("↓ RUTSCHEN", W * .175, GROUND - 14); ctx.fillText("↑ SPRINGEN", W * .675, GROUND - 14);
        ctx.textAlign = "left"; ctx.globalAlpha = 1;
      }
      if (bannerT > 0 && mode === "run") { ctx.textAlign = "center"; ctx.font = "bold 12px monospace"; ctx.fillStyle = "#1E1E1E"; ctx.fillText(bannerTxt + "!", W / 2 + 1, 31); ctx.fillStyle = "#FFD84D"; ctx.fillText(bannerTxt + "!", W / 2, 30); ctx.textAlign = "left"; ctx.font = "bold 8px monospace"; }
      for (const c of conf) px(c.c, c.x, c.y, 2, 2);
      if (mode !== "run") {
        px("rgba(30,30,30,.6)", 0, 36, W, 44);
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 12px monospace";
        ctx.fillText(mode === "ready" ? "HÜRDENRITT" : newBest ? "NEUER REKORD!" : "ABGEWORFEN!", W / 2, 42);
        ctx.font = "bold 8px monospace";
        ctx.fillText(mode === "ready" ? "Rechts tippen = springen · links = rutschen" : `${score} Punkte · Level ${lvl} · Rekord ${best}`, W / 2, 58);
        ctx.fillText(mode === "ready" ? "Zur Zielflagge reiten · Power-ups sammeln" : "tippen = nochmal", W / 2, 68);
        ctx.textAlign = "left";
      }
      ctx.restore();
    }

    function frameLoop(now) {
      if (!alive) return;
      if (!cv.isConnected) { stop(); return; }
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      update(dt); draw();
      raf = requestAnimationFrame(frameLoop);
    }
    /* Steuerung: rechts tippen/halten = springen, links tippen = rutschen (in der Luft: schnell runter), nach unten wischen = rutschen */
    let swipe = null;
    const onDown = (e) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect(), left = mode === "run" && r.width > 0 && (e.clientX - r.left) < r.width * .35;
      swipe = { y: e.clientY, done: left };
      if (left) startSlide(); else { down = true; startJump(); }
    };
    const onMove = (e) => { if (swipe && !swipe.done && mode === "run" && e.clientY - swipe.y > 22) { swipe.done = true; holding = false; down = false; startSlide(); } };
    const onUp = () => { holding = false; down = false; slideHeld = false; swipe = null; };
    const typing = (e) => /INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target || {}).tagName || "");
    const onKey = (e) => {
      if (!cv.isConnected || typing(e)) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); if (!e.repeat) { down = true; startJump(); } }
      else if (e.code === "ArrowDown" || e.code === "KeyS") { e.preventDefault(); if (!e.repeat) startSlide(); }
    };
    const onKeyUp = (e) => { if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { holding = false; down = false; } else if (e.code === "ArrowDown" || e.code === "KeyS") slideHeld = false; };
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKeyUp);
    drawHearts();
    raf = requestAnimationFrame(frameLoop);
    function stop() {
      alive = false; cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKeyUp);
      if (mode === "run" && score > 0 && opts.onScore) { try { opts.onScore(score); } catch { /* ignorieren */ } }
    }
    stop.rush = startRush;                                 /* Lehrkraft: „Goldrausch für alle“ */
    return stop;
  }

  window.QuizGame = { html, mount };
})();
