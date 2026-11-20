/* ============================================================
   LERNRAUM · Live-Quiz – Warteraum-Spiel „Hürdenritt“
   Pixel-Spiel auf einem Canvas (240 × 135 Pixel, scharf skaliert): Das Pferd galoppiert von selbst, Tippen = Springen
   (Halten = höher). Über Hürden, Büsche und Kisten springen, Münzen und Herzen sammeln, 3 Herzen. Das Tempo steigt mit der
   Zeit (wie bei Unicorn Dash), der Himmel wechselt von Tag zu Abend und Nacht. Keine Töne.
   Punkte = Münzen × 10 + Meter. Läuft im Browser; nur der Spielstand (eine Zahl) geht über opts.onScore an den Raum,
   damit die Lehrkraft eine Bestenliste auf dem Beamer zeigen kann. Rekord und Pferdefarbe stehen lokal (localStorage).
   Benutzt von quiz.js: QuizGame.html() liefert den Kasten, QuizGame.mount(root, seed, opts) startet ihn und gibt stop() zurück.
   Die Pferde-Pixel kommen aus race.js (QuizRace.pix).
   ============================================================ */
(() => {
  "use strict";
  const W = 240, H = 135, GROUND = 112, BEST_KEY = "quiz.game.best", HORSE_KEY = "quiz.game.horse";
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
    return [P.FRAME_A, P.FRAME_B].map((rows) => {
      const c = document.createElement("canvas"); c.width = 36; c.height = 28;
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
      <canvas id="gCanvas" class="game-canvas" width="${W}" height="${H}" role="img" aria-label="Pixel-Pferd, das über Hürden springt. Tippe auf das Bild zum Springen, halte für höhere Sprünge."></canvas>
      <p class="game-hint" id="gHint">Tippen = springen · halten = höher</p>
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
    let things = [], dust = [], pops = [], conf = [], birds = [];
    const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 55 + rnd(0, 20), y: rnd(10, 42), w: rnd(22, 38) }));
            const stars = Array.from({ length: 40 }, () => ({ x: rnd(0, W), y: rnd(2, 96), s: Math.random() < .2 ? 2 : 1, ph: rnd(0, 6) }));
    let groundOff = 0;

    const drawHearts = () => { elHearts.textContent = "♥".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts)); };
    const setScore = () => { elScore.textContent = score; };
    const reset = () => {
      mode = "run"; rt = 0; world = 0; skyA = WORLDS[0].a; skyB = WORLDS[0].b; speed = SPEED0; dist = 0; nextAt = 160; hearts = 3; coins = 0; score = 0; level = 1; hy = 0; vy = 0; onGround = true; stun = 0; holding = false;
      newBest = false; heartAt = 22; things = []; pops = []; conf = []; setScore(); drawHearts(); elHint.textContent = "Tippen = springen · halten = höher";
    };
    const startJump = () => {
      if (mode === "ready" || mode === "over") { if (mode === "over" && overT < .5) return; reset(); return; }
      if (stun > 0) return;
      if (onGround) { vy = JUMP; onGround = false; holding = true; holdT = 0; for (let i = 0; i < 4; i++) dust.push({ x: HORSE_X + 8, y: GROUND, vx: rnd(-30, -8), vy: rnd(-24, -6), l: .4 }); }
      else buffer = .12;
    };

    /* Hindernisse und Münzen: erst leicht, mit der Zeit mehr Abwechslung. Abstand wächst mit dem Tempo, damit alles schaffbar bleibt. */
    const hurdle = (x) => things.push({ k: "hurdle", x, w: 14, h: 15 });
    const arc = (x, n, hi) => { for (let i = 0; i < n; i++) things.push({ k: "coin", x: x + i * 7, y: GROUND - hi - (i > 0 && i < n - 1 ? 6 : 0), got: false }); };
    const spawn = () => {
      const x = W + 20, r = Math.random();
      let kinds = ["hurdle", "bush", "coins"];
      if (rt > 9) kinds.push("crate");
      if (rt > 16) kinds.push("fence");
      if (rt > 22 && speed > 105) kinds.push("double");
      const k = kinds[Math.floor(r * kinds.length)];
      if (k === "hurdle") { hurdle(x); arc(x + 1, 3, 32); }
      else if (k === "bush") { things.push({ k: "bush", x, w: 18, h: 12 }); arc(x + 3, 3, 30); }
      else if (k === "crate") { things.push({ k: "crate", x, w: 16, h: 21 }); arc(x + 2, 3, 40); }
      else if (k === "fence") { things.push({ k: "fence", x, w: 34, h: 15 }); arc(x + 8, 4, 36); }
      else if (k === "double") { const gap = 34 + speed * .45; hurdle(x); hurdle(x + 14 + gap); arc(x + 8, 5, 38); }
      else { const hi = Math.random() < .5 ? 34 : 12; for (let i = 0; i < 5; i++) things.push({ k: "coin", x: x + i * 9, y: GROUND - hi, got: false }); }
      if (rt > heartAt && hearts < 3) { things.push({ k: "heart", x: x + 70, y: GROUND - 30, got: false }); heartAt = rt + 24; }
      nextAt = rnd(85, 130) + speed * .6;
    };

    const finish = () => {
      mode = "over"; overT = 0;
      if (score > best) { best = score; lsSet(BEST_KEY, best); elBest.textContent = best; newBest = true; for (let i = 0; i < 46; i++) conf.push({ x: rnd(0, W), y: rnd(-30, 0), vx: rnd(-18, 18), vy: rnd(20, 70), c: ["#FFD84D", "#F386A1", "#5CE0A8", "#8EC5FF", "#fff"][i % 5], l: 2.2 }); }
      elHint.textContent = newBest ? `Neuer Rekord: ${score} Punkte! Tippe für noch eine Runde.` : `${score} Punkte. Tippe für noch eine Runde.`;
      if (opts.onScore && score > 0) { try { opts.onScore(score); } catch { /* ignorieren */ } }
    };

    function update(dt) {
      t += dt;
      const run = mode === "run";
      if (run) {
        rt += dt;
        speed = Math.min(SPEED_MAX, SPEED0 + rt * SPEED_UP);
        const lv = 1 + Math.floor((speed - SPEED0) / 18);
        if (lv > level) { level = lv; bannerT = 1.4; bannerTxt = "TEMPO " + level; }
        const wn = Math.floor(rt / BLEN) % WORLDS.length;
        if (wn !== world) { world = wn; portal = .45; bannerT = 2; bannerTxt = WORLDS[world].name; }
        const sp = stun > 0 ? speed * .4 : speed;
        dist += sp * dt;
        nextAt -= sp * dt;
        if (nextAt <= 0) spawn();
        for (const o of things) o.x -= sp * dt;
        things = things.filter((o) => o.x > -40);
      }
      /* Sprung: Halten dehnt den Aufstieg, früh loslassen = normaler Sprung */
      if (!onGround || hy !== 0) {
        const g = holding && vy < 0 && holdT < HOLD_MAX ? GRAV * HOLD_G : GRAV;
        holdT += dt; vy += g * dt; hy += vy * dt;
        if (hy >= 0) {
          hy = 0; vy = 0; holding = false;
          if (!onGround) { onGround = true; for (let i = 0; i < 5; i++) dust.push({ x: HORSE_X + 6, y: GROUND, vx: rnd(-40, -8), vy: rnd(-26, -4), l: .35 }); if (buffer > 0 && run) { vy = JUMP; onGround = false; holding = false; } }
        }
      }
      buffer = Math.max(0, buffer - dt);
      stun = Math.max(0, stun - dt); shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt); bannerT = Math.max(0, bannerT - dt); overT += dt;
      /* Treffer und Sammelstücke (großzügige Rechtecke) */
      if (run) {
        const hx0 = HORSE_X + 10, hx1 = HORSE_X + 30, hyTop = GROUND - 24 + hy, hyBot = GROUND - 2 + hy;
        for (const o of things) {
          if (o.k === "coin" || o.k === "heart") {
            if (!o.got && o.x + 5 > hx0 && o.x < hx1 && o.y + 5 > hyTop && o.y < hyBot) {
              o.got = true;
              if (o.k === "coin") { coins++; pops.push({ x: o.x, y: o.y, l: .6, s: "+10" }); }
              else { hearts = Math.min(3, hearts + 1); drawHearts(); pops.push({ x: o.x, y: o.y, l: .8, s: "♥" }); }
            }
          } else if (stun <= 0 && !o.hit && o.x + o.w - 4 > hx0 && o.x + 4 < hx1 && hyBot > GROUND - o.h + 3) {
            o.hit = true; hearts--; stun = .9; shake = .25; flash = .9; vy = Math.max(vy, -80); onGround = false; holding = false; drawHearts();
            if (navigator.vibrate) { try { navigator.vibrate(40); } catch { /* ignorieren */ } }
            if (hearts <= 0) { score = coins * 10 + Math.floor(dist / 10); setScore(); finish(); }
          }
        }
        things = things.filter((o) => !((o.k === "coin" || o.k === "heart") && o.got));
        if (mode === "run") { score = coins * 10 + Math.floor(dist / 10); setScore(); }
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

    const px = (c, x, y, w, h, al) => { if (al) ctx.globalAlpha = al; ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); if (al) ctx.globalAlpha = 1; };

    const circle = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); px(c, cx - w, cy + y, w * 2 + 1, 1); } };
    const win = (x, y, w, h, base, lit, n, th) => {   /* Fenster-Raster eines Hauses */
      for (let yy = y + 3; yy < y + h - 3; yy += 6) for (let xx = x + 3; xx < x + w - 3; xx += 5) { const on = hash(n * 31 + xx * 3.1 + yy * 7.7) > th; px(on ? lit : base, xx, yy, 2, 3); }
    };
    function drawThing(o) {
      const x = Math.round(o.x), W_ = WORLDS[world];
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
      const sx = shake > 0 ? Math.round(rnd(-2, 2)) : 0;
      ctx.save(); ctx.translate(sx, 0);
      px(skyA, -4, 0, W + 8, 60); px(skyB, -4, 60, W + 8, 60);
      drawWorld(world);
      drawGround(world);
      for (const o of things) if (o.x < W + 4) drawThing(o);
      /* Tempolinien */
      if (mode === "run" && speed > 140) for (let i = 0; i < 5; i++) { const y = 20 + ((i * 37 + Math.floor(t * 9) * 13) % 80), x = ((i * 91 - t * speed * 1.4) % W + W) % W; px("rgba(255,255,255,.5)", x, y, 14 + (speed - 140) / 4, 1); }
      for (const d of dust) px(world === 3 ? "#C9CDE0" : "#F2DDB6", d.x, d.y - 1, 2, 2);
      /* Pferd */
      const frame = (!onGround || mode !== "run") ? 0 : (Math.floor(t * (6 + speed / 28)) % 2);
      const blink = flash > 0 && Math.floor(t * 18) % 2 === 0;
      if (hs && !blink) ctx.drawImage(hs[frame], HORSE_X, Math.round(GROUND - 27 + hy));
      px("rgba(30,30,30,.25)", HORSE_X + 6, GROUND + 1, Math.max(8, 24 + Math.round(hy / 4)), 2);
      ctx.font = "bold 8px monospace"; ctx.textBaseline = "top";
      for (const p of pops) { ctx.fillStyle = "#1E1E1E"; ctx.fillText(p.s, Math.round(p.x) + 1, Math.round(p.y) + 1); ctx.fillStyle = p.s === "♥" ? "#FF6B81" : "#FFD84D"; ctx.fillText(p.s, Math.round(p.x), Math.round(p.y)); }
      /* Weltwechsel: kurzer Blitz */
      if (portal > 0) px(`rgba(255,255,255,${Math.min(.85, portal * 1.6).toFixed(2)})`, -4, 0, W + 8, H);
      /* Anzeigen */
      if (mode === "run") { ctx.fillStyle = "rgba(30,30,30,.55)"; ctx.fillRect(4, 4, 44, 11); ctx.fillStyle = "#fff"; ctx.fillText("TEMPO " + level, 7, 6); }
      if (bannerT > 0 && mode === "run") { ctx.textAlign = "center"; ctx.font = "bold 12px monospace"; ctx.fillStyle = "#1E1E1E"; ctx.fillText(bannerTxt + "!", W / 2 + 1, 31); ctx.fillStyle = "#FFD84D"; ctx.fillText(bannerTxt + "!", W / 2, 30); ctx.textAlign = "left"; ctx.font = "bold 8px monospace"; }
      for (const c of conf) px(c.c, c.x, c.y, 2, 2);
      if (mode !== "run") {
        px("rgba(30,30,30,.6)", 0, 36, W, 44);
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 12px monospace";
        ctx.fillText(mode === "ready" ? "HÜRDENRITT" : newBest ? "NEUER REKORD!" : "ABGEWORFEN!", W / 2, 42);
        ctx.font = "bold 8px monospace";
        ctx.fillText(mode === "ready" ? "Tippen = Start und Sprung" : `${score} Punkte · Rekord ${best}`, W / 2, 58);
        ctx.fillText(mode === "ready" ? "Halten = höher · 4 Welten" : "tippen = nochmal", W / 2, 68);
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
    const onDown = (e) => { e.preventDefault(); startJump(); };
    const onUp = () => { holding = false; };
    const onKey = (e) => { if ((e.code === "Space" || e.code === "ArrowUp") && cv.isConnected && !/INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target || {}).tagName || "")) { e.preventDefault(); if (!e.repeat) startJump(); } };
    const onKeyUp = (e) => { if (e.code === "Space" || e.code === "ArrowUp") holding = false; };
    cv.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKeyUp);
    drawHearts();
    raf = requestAnimationFrame(frameLoop);
    function stop() {
      alive = false; cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", onDown); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKeyUp);
      if (mode === "run" && score > 0 && opts.onScore) { try { opts.onScore(score); } catch { /* ignorieren */ } }
    }
    return stop;
  }

  window.QuizGame = { html, mount };
})();
