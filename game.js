/* ============================================================
   LERNRAUM · Live-Quiz – Warteraum-Spiel „Hürdenritt“
   Pixel-Spiel auf einem Canvas (240 × 135 Pixel, scharf skaliert): Das Pferd galoppiert von selbst,
   Tippen = Springen. Über Hürden und Büsche springen, Münzen sammeln, 3 Herzen.
   Läuft nur im Browser. Kein Server, keine Daten außer dem eigenen Rekord (localStorage, nur Zahl).
   Benutzt von quiz.js: QuizGame.html() liefert den Kasten, QuizGame.mount(root, seed) startet ihn und gibt stop() zurück.
   Die Pferde-Pixel kommen aus race.js (QuizRace.pix).
   ============================================================ */
(() => {
  "use strict";
  const W = 240, H = 135, GROUND = 112, BEST_KEY = "quiz.game.best";
  const GRAV = 720, JUMP = -262, HORSE_X = 34;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (h, to, k) => { const a = hex(h), b = hex(to); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join(""); };

  function bestGet() { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } }
  function bestSet(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* ignorieren */ } }

  /* Pferd + Reiter aus den Pixel-Bildern von race.js in zwei Offscreen-Canvas zeichnen */
  function horseSprites(seed) {
    const P = window.QuizRace && window.QuizRace.pix;
    if (!P) return null;
    const base = P.HORSE[seed % P.HORSE.length], jc = P.JOCKEY[(seed * 3 + 1) % P.JOCKEY.length];
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

  function html() {
    return `<section class="game" aria-label="Warte-Spiel Hürdenritt">
      <div class="game-hud" aria-live="off"><span class="g-hearts" id="gHearts" aria-label="Leben"></span><span class="g-score">Münzen <b id="gScore">0</b></span><span class="g-best">Rekord <b id="gBest">0</b></span></div>
      <canvas id="gCanvas" class="game-canvas" width="${W}" height="${H}" role="img" aria-label="Pixel-Pferd, das über Hürden springt. Tippe auf das Bild zum Springen."></canvas>
      <p class="game-hint" id="gHint">Tippe aufs Bild zum Springen</p>
    </section>`;
  }

  function mount(root, seed) {
    const cv = root.querySelector("#gCanvas");
    if (!cv) return () => {};
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const hs = horseSprites(seed || 0);
    const elScore = root.querySelector("#gScore"), elBest = root.querySelector("#gBest"), elHearts = root.querySelector("#gHearts"), elHint = root.querySelector("#gHint");
    let best = bestGet();
    elBest.textContent = best;

    /* Zustand */
    let mode = "ready";            /* ready | run | over */
    let t = 0, last = 0, raf = 0, alive = true, speed = 78, dist = 0, nextAt = 120, hearts = 3, coins = 0;
    let hy = 0, vy = 0, onGround = true, stun = 0, buffer = 0, shake = 0, flash = 0;
    let things = [], dust = [], pops = [];
    const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 55 + rnd(0, 20), y: rnd(10, 42), w: rnd(22, 38) }));
    const hills = Array.from({ length: 6 }, (_, i) => ({ x: i * 50, h: rnd(14, 30) }));

    const drawHearts = () => { elHearts.textContent = "♥".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts)); };
    const reset = () => {
      mode = "run"; speed = 78; dist = 0; nextAt = 150; hearts = 3; coins = 0; hy = 0; vy = 0; onGround = true; stun = 0;
      things = []; pops = []; elScore.textContent = "0"; drawHearts(); elHint.textContent = "Tippe zum Springen";
    };
    const jump = () => {
      if (mode === "ready" || mode === "over") { reset(); return; }
      if (stun > 0) return;
      if (onGround) { vy = JUMP; onGround = false; for (let i = 0; i < 4; i++) dust.push({ x: HORSE_X + 8, y: GROUND, vx: rnd(-30, -8), vy: rnd(-24, -6), l: .4 }); }
      else buffer = .12;
    };

    const spawn = () => {
      const kind = Math.random();
      const x = W + 20;
      if (kind < .38) {                       /* Hürde mit Münzbogen */
        things.push({ k: "hurdle", x, w: 14, h: 15 });
        for (let i = 0; i < 3; i++) things.push({ k: "coin", x: x + 1 + i * 6, y: GROUND - 32 - (i === 1 ? 6 : 0), got: false });
      } else if (kind < .64) {                /* Busch */
        things.push({ k: "bush", x, w: 18, h: 12 });
        for (let i = 0; i < 3; i++) things.push({ k: "coin", x: x + 3 + i * 6, y: GROUND - 30 - (i === 1 ? 6 : 0), got: false });
      } else if (kind < .84) {                /* Münzreihe zum Einsammeln */
        const hi = Math.random() < .5;
        for (let i = 0; i < 5; i++) things.push({ k: "coin", x: x + i * 9, y: GROUND - (hi ? 34 : 12), got: false });
      } else {                                /* doppelte Hürde */
        things.push({ k: "hurdle", x, w: 14, h: 15 });
        things.push({ k: "hurdle", x: x + 44, w: 14, h: 15 });
        for (let i = 0; i < 4; i++) things.push({ k: "coin", x: x + 14 + i * 9, y: GROUND - 36 - (i === 1 || i === 2 ? 6 : 0), got: false });
      }
      nextAt = rnd(95, 165) + speed * .25;
    };

    function update(dt) {
      t += dt;
      const run = mode === "run";
      if (run) {
        speed = Math.min(150, 78 + dist * .012);
        const sp = stun > 0 ? speed * .35 : speed;
        dist += sp * dt;
        nextAt -= sp * dt;
        if (nextAt <= 0) spawn();
        for (const o of things) o.x -= sp * dt;
        things = things.filter((o) => o.x > -30);
      }
      /* Sprung */
      if (!onGround || hy !== 0) {
        vy += GRAV * dt; hy += vy * dt;
        if (hy >= 0) {
          hy = 0; vy = 0;
          if (!onGround) { onGround = true; for (let i = 0; i < 4; i++) dust.push({ x: HORSE_X + 6, y: GROUND, vx: rnd(-34, -8), vy: rnd(-22, -4), l: .35 }); if (buffer > 0 && run) { vy = JUMP; onGround = false; } }
        }
      }
      buffer = Math.max(0, buffer - dt);
      stun = Math.max(0, stun - dt); shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
      /* Treffer und Münzen (Rechteck-Test, großzügig) */
      if (run) {
        const hx0 = HORSE_X + 10, hx1 = HORSE_X + 30, hyTop = GROUND - 24 + hy, hyBot = GROUND - 2 + hy;
        for (const o of things) {
          if (o.k === "coin") {
            if (!o.got && o.x + 5 > hx0 && o.x < hx1 && o.y + 5 > hyTop && o.y < hyBot) {
              o.got = true; coins++; elScore.textContent = coins;
              pops.push({ x: o.x, y: o.y, l: .6 });
            }
          } else if (stun <= 0 && !o.hit && o.x + o.w - 3 > hx0 && o.x + 3 < hx1 && hyBot > GROUND - o.h + 2) {
            o.hit = true; hearts--; stun = .9; shake = .25; flash = .9; vy = Math.max(vy, -80); onGround = false; drawHearts();
            if (navigator.vibrate) { try { navigator.vibrate(40); } catch { /* ignorieren */ } }
            if (hearts <= 0) {
              mode = "over";
              if (coins > best) { best = coins; bestSet(best); elBest.textContent = best; elHint.textContent = `Neuer Rekord: ${coins} Münzen! Tippe für noch eine Runde.`; }
              else elHint.textContent = `${coins} Münzen. Tippe für noch eine Runde.`;
            }
          }
        }
        things = things.filter((o) => !(o.k === "coin" && o.got));
      }
      if (run && onGround && stun <= 0 && Math.random() < dt * 14) dust.push({ x: HORSE_X + 4, y: GROUND, vx: rnd(-40, -14), vy: rnd(-10, -2), l: .3 });
      for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.l -= dt; }
      dust = dust.filter((d) => d.l > 0);
      for (const p of pops) { p.y -= 26 * dt; p.l -= dt; }
      pops = pops.filter((p) => p.l > 0);
      /* Hintergrund wandert immer, im Wartezustand langsam */
      const bg = (mode === "run" ? speed : 26) * dt;
      for (const c of clouds) { c.x -= bg * .12; if (c.x < -c.w) { c.x = W + rnd(0, 30); c.y = rnd(10, 42); } }
      for (const h of hills) { h.x -= bg * .3; if (h.x < -60) { h.x += 300; h.h = rnd(14, 30); } }
      groundOff = (groundOff + bg) % 16;
    }
    let groundOff = 0;

    const px = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

    function drawThing(o) {
      const x = Math.round(o.x);
      if (o.k === "hurdle") {
        px("#6b4220", x, GROUND - 15, 2, 15); px("#6b4220", x + 12, GROUND - 15, 2, 15);
        px("#fff", x, GROUND - 14, 14, 3); px("#C1354F", x + 3, GROUND - 14, 4, 3); px("#C1354F", x + 10, GROUND - 14, 4, 3);
        px("#fff", x, GROUND - 8, 14, 3); px("#C1354F", x, GROUND - 8, 3, 3); px("#C1354F", x + 6, GROUND - 8, 4, 3);
        px("#1E1E1E", x, GROUND - 15, 14, 1); px("#1E1E1E", x, GROUND - 11, 14, 1); px("#1E1E1E", x, GROUND - 5, 14, 1);
      } else if (o.k === "bush") {
        px("#0A6F43", x + 2, GROUND - 8, 14, 8); px("#0A8F57", x, GROUND - 6, 18, 6); px("#0A8F57", x + 4, GROUND - 12, 10, 6);
        px("#5CE0A8", x + 5, GROUND - 11, 3, 2); px("#5CE0A8", x + 11, GROUND - 7, 3, 2); px("#C1354F", x + 8, GROUND - 5, 2, 2); px("#C1354F", x + 3, GROUND - 3, 2, 2);
        px("#1E1E1E", x, GROUND - 1, 18, 1);
      } else {
        const sq = Math.abs(Math.sin(t * 6 + o.x * .1));         /* drehende Münze */
        const w = Math.max(1, Math.round(5 * (.25 + .75 * sq)));
        const cx = Math.round(o.x) + 2 - Math.floor(w / 2);
        px("#1E1E1E", cx - 1, Math.round(o.y) - 1, w + 2, 7);
        px("#FFD84D", cx, Math.round(o.y), w, 5);
        if (w > 2) px("#FFF3B0", cx + 1, Math.round(o.y) + 1, 1, 2);
      }
    }

    function draw() {
      const sx = shake > 0 ? Math.round(rnd(-2, 2)) : 0;
      ctx.save(); ctx.translate(sx, 0);
      /* Himmel (zwei Töne) */
      px("#9FD0FF", -4, 0, W + 8, 60); px("#BCE0FF", -4, 60, W + 8, 40);
      px("#FFE9A3", 196, 12, 14, 14); px("#FFD84D", 198, 14, 10, 10);
      for (const c of clouds) { const x = Math.round(c.x), y = Math.round(c.y); px("#fff", x + 4, y, c.w - 8, 5); px("#fff", x, y + 4, c.w, 5); px("#E4F1FF", x + 2, y + 8, c.w - 4, 2); }
      /* Hügel */
      for (const h of hills) { px("#7BD9A0", h.x, GROUND - h.h, 56, h.h); px("#7BD9A0", h.x + 6, GROUND - h.h - 4, 44, 4); px("#7BD9A0", h.x + 14, GROUND - h.h - 7, 28, 3); }
      /* Boden */
      px("#5CC183", -4, GROUND, W + 8, 6); px("#1E1E1E", -4, GROUND + 5, W + 8, 1);
      px("#D9B27C", -4, GROUND + 6, W + 8, H - GROUND);
      for (let i = -1; i < 16; i++) { const x = i * 16 - groundOff; px("#C49A63", x + 4, GROUND + 12, 5, 2); px("#C49A63", x + 11, GROUND + 18, 3, 2); }
      for (let i = -1; i < 30; i++) { const x = i * 8 - (groundOff % 8); px("#3FA96B", x, GROUND - 1, 2, 1); }
      /* Dinge */
      for (const o of things) if (o.x < W + 4) drawThing(o);
      /* Staub */
      for (const d of dust) { px("#F2DDB6", d.x, d.y - 1, 2, 2); }
      /* Pferd */
      const frame = (!onGround || mode !== "run") ? 0 : (Math.floor(t * 9) % 2);
      const blink = flash > 0 && Math.floor(t * 18) % 2 === 0;
      if (hs && !blink) ctx.drawImage(hs[frame], HORSE_X, Math.round(GROUND - 27 + hy));
      /* Schatten */
      px("rgba(30,30,30,.25)", HORSE_X + 6, GROUND + 1, Math.max(8, 24 + Math.round(hy / 4)), 2);
      /* „+1“ */
      ctx.font = "bold 8px monospace"; ctx.textBaseline = "top";
      for (const p of pops) { ctx.fillStyle = "#1E1E1E"; ctx.fillText("+1", Math.round(p.x) + 1, Math.round(p.y) + 1); ctx.fillStyle = "#FFD84D"; ctx.fillText("+1", Math.round(p.x), Math.round(p.y)); }
      /* Meldungen */
      if (mode !== "run") {
        px("rgba(30,30,30,.55)", 0, 40, W, 34);
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 12px monospace";
        ctx.fillText(mode === "ready" ? "HÜRDENRITT" : "ABGEWORFEN!", W / 2, 46);
        ctx.font = "bold 8px monospace";
        ctx.fillText(mode === "ready" ? "Tippen = Start und Sprung" : `${coins} Münzen · tippen = nochmal`, W / 2, 62);
        ctx.textAlign = "left";
      }
      ctx.restore();
    }

    function frame(now) {
      if (!alive) return;
      if (!cv.isConnected) { stop(); return; }
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    const onDown = (e) => { e.preventDefault(); jump(); };
    const onKey = (e) => { if ((e.code === "Space" || e.code === "ArrowUp") && cv.isConnected && !/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) { e.preventDefault(); jump(); } };
    cv.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    drawHearts();
    raf = requestAnimationFrame(frame);
    function stop() { alive = false; cancelAnimationFrame(raf); cv.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); }
    return stop;
  }

  window.QuizGame = { html, mount };
})();
