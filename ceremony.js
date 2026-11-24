/* ============================================================
   LERNRAUM · Live-Quiz – Siegerehrung
   Vollbild-Bühne mit Siegerpodest: Platz 3, Platz 2, dann der Sieger mit Pferd, Krone, Name, Konfetti und Scheinwerfer.
   Läuft nur im Browser, keine Töne, keine Daten. Wird von quiz.js benutzt (Lehrkraft und Schüler-Handys):
     QuizCeremony.html(list, o)  -> HTML-Text der Bühne
     QuizCeremony.play(box, list, o) -> startet die Show, gibt stop() zurück
   list = schon sortierte Liste { i, nick, pts, ok, bn, lt, me }, o = { hide, n, meLine }.
   Die Pferde-Pixel und -Farben kommen aus race.js (QuizRace.pix), damit jedes Pferd wie in der Rennbahn aussieht.
   ============================================================ */
(() => {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mix = (h, to, k) => {
    const x = (v) => [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    const a = x(h), b = x(to);
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join("");
  };
  const fmtT = (s) => { s = Math.round(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const nm = (p, o) => (o.hide ? `SuS ${p.i + 1}` : p.nick);

  /* Pferd + Reiter als zwei Bilder (Galopp-Phase A und B), Farben wie in der Rennbahn */
  function horseFrames(i) {
    const R = window.QuizRace, P = R && R.pix;
    if (!P) return [];
    const base = P.HORSE[i % P.HORSE.length], jc = P.JOCKEY[(i + 3) % P.JOCKEY.length];
    const pal = {
      B: base, S: mix(base, "#000000", .28), F: mix(base, "#000000", .5), L: mix(base, "#ffffff", .22),
      D: "#2e1b0e", M: "#e0bf94", W: "#ffffff", E: "#111111", K: "#f2c9a0", G: "#ffffff", T: "#222222", J: jc, H: mix(jc, "#000000", .3)
    };
    return [P.FRAME_A, P.FRAME_B].map((r1) => {
      const rows = R.epx ? R.epx(r1) : r1;
      const c = document.createElement("canvas"); c.width = rows[0].length; c.height = rows.length; c.className = "cer-hf";
      const x = c.getContext("2d");
      rows.forEach((row, y) => { for (let k = 0; k < row.length; k++) { const ch = row[k]; if (ch !== "." && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(k, y, 1, 1); } } });
      return c;
    });
  }

  const slotHtml = (p, k, o) => {
    if (!p) return `<div class="cer-slot s${k + 1} none"><div class="cer-blk"><b>${k + 1}</b></div></div>`;
    const extra = p.bn ? `${p.ok} richtig + ${p.bn} Bonus` : `${p.ok} von ${o.n} richtig`;
    return `<div class="cer-slot s${k + 1} pre" data-k="${k}" data-i="${p.i}">
      ${k === 0 ? `<svg class="cer-crown" viewBox="0 0 9 6" width="54" height="36" aria-hidden="true"><path d="M0 6V1l2 2 2.5-3L7 3l2-2v5z" fill="#FFD84D" stroke="#1E1E1E" stroke-width=".7" stroke-linejoin="round"/></svg>` : ""}
      <div class="cer-horse" aria-hidden="true"></div>
      <div class="cer-name">${esc(nm(p, o))}${p.me ? ` <span class="cer-me">Du</span>` : ""}</div>
      <div class="cer-pts"><b>${p.pts}</b> Punkte</div>
      <div class="cer-sub">${extra}${p.lt != null ? ` · ${fmtT(p.lt)} Min` : ""}</div>
      <div class="cer-blk"><b>${k + 1}</b></div></div>`;
  };

  function html(list, o) {
    const top = list.filter((p) => p.pts > 0).slice(0, 3);
    const rest = list.slice(top.length);
    const order = [1, 0, 2];
    if (!top.length) return `<div class="cer"><h2 class="cer-title">Siegerehrung</h2><p class="cer-none">Noch niemand hat einen Punkt. Dann gibt es diesmal keine Siegerinnen und Sieger.</p></div>`;
    const tie = top.some((p, k) => k > 0 && top[k - 1].pts === p.pts);
    return `<div class="cer" id="cer"><div class="cer-spot" aria-hidden="true"></div><div class="cer-fx" aria-hidden="true"></div>
      <h2 class="cer-title">Siegerehrung</h2>
      <p class="cer-drum" id="cerDrum" aria-live="polite">&nbsp;</p>
      <div class="cer-stage">${order.map((k) => slotHtml(top[k], k, o)).join("")}</div>
      ${tie ? `<p class="cer-note">Bei gleichen Punkten gewinnt, wer schneller war.</p>` : ""}
      ${o.meLine ? `<p class="cer-me-line">${esc(o.meLine)}</p>` : ""}
      ${rest.length ? `<ol class="cer-rest">${rest.map((p, k) => `<li${p.me ? ` class="me"` : ""}><span><b class="rn">${top.length + k + 1}.</b> ${esc(nm(p, o))}${p.me ? " (Du)" : ""}</span><em>${p.pts}${p.lt != null && p.pts ? ` · ${fmtT(p.lt)}` : ""}</em></li>`).join("")}</ol>` : ""}
      <div class="cer-btns"><button class="btn sm ghost" type="button" id="cerAgain">Nochmal abspielen</button></div></div>`;
  }

  function play(box, list, o) {
    const cer = box.querySelector("#cer");
    if (!cer) return () => {};
    const timers = []; let alive = true;
    const at = (ms, fn) => { timers.push(setTimeout(() => { if (alive) fn(); }, ms)); };
    const slots = [...cer.querySelectorAll(".cer-slot:not(.none)")];
    const drum = cer.querySelector("#cerDrum"), fx = cer.querySelector(".cer-fx");
    const frames = {};
    slots.forEach((s) => {
      const k = Number(s.dataset.k), i = Number(s.dataset.i), h = s.querySelector(".cer-horse");
      const f = horseFrames(i);
      if (f.length) { f[1].classList.add("b"); h.append(f[0], f[1]); }
      frames[k] = s;
    });
    const burst = (n, cx) => {
      const cols = ["#F386A1", "#FFD84D", "#5CE0A8", "#8EC5FF", "#FF8C42", "#C9A6FF", "#fff"];
      for (let k = 0; k < n; k++) {
        const c = document.createElement("i"); c.className = "cer-conf";
        c.style.cssText = `left:${cx === undefined ? Math.random() * 100 : cx + (Math.random() * 30 - 15)}%;--dx:${(Math.random() * 160 - 80).toFixed(0)}px;--rot:${(Math.random() * 900 - 450).toFixed(0)}deg;background:${cols[k % cols.length]};animation-duration:${(2.2 + Math.random() * 1.6).toFixed(2)}s;animation-delay:${(Math.random() * .5).toFixed(2)}s`;
        fx.appendChild(c); setTimeout(() => c.remove(), 4600);
      }
    };
    const show = (k) => { const s = frames[k]; if (s) { s.classList.remove("pre"); s.classList.add("in"); } };
    const reset = () => { slots.forEach((s) => { s.classList.add("pre"); s.classList.remove("in", "champ"); }); cer.classList.remove("done", "final"); fx.innerHTML = ""; drum.innerHTML = "&nbsp;"; };
    const run = () => {
      timers.splice(0).forEach(clearTimeout); reset();
      let t = 400;
      if (frames[2]) { at(t, () => { drum.textContent = "Platz 3 …"; show(2); }); t += 2000; }
      if (frames[1]) { at(t, () => { drum.textContent = "Platz 2 …"; show(1); }); t += 2200; }
      at(t, () => { drum.textContent = "Und der Sieger ist …"; cer.classList.add("drum"); });
      t += 1900;
      at(t, () => {
        cer.classList.remove("drum"); cer.classList.add("final");
        show(0); if (frames[0]) frames[0].classList.add("champ");
        drum.textContent = "🏆 Herzlichen Glückwunsch!";
        burst(90);
      });
      for (let k = 1; k < 4; k++) at(t + k * 1400, () => burst(36, 30 + Math.random() * 40));
      at(t + 3000, () => cer.classList.add("done"));
    };
    const again = cer.querySelector("#cerAgain"); if (again) again.onclick = run;
    cer.onclick = (e) => { if (e.target.closest("button")) return; if (!cer.classList.contains("final")) { timers.splice(0).forEach(clearTimeout); slots.forEach(s => { s.classList.remove("pre"); s.classList.add("in"); }); if (frames[0]) frames[0].classList.add("champ"); cer.classList.add("final", "done"); drum.textContent = "🏆 Herzlichen Glückwunsch!"; burst(70); } };
    run();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }

  window.QuizCeremony = { html, play };
})();
