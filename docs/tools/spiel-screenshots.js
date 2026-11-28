// Screenshots und Test für das Warte-Spiel (Level, Gegner, Power-ups, Goldrausch) im Demo-Modus.
// Start: im Repo-Ordner 'python3 -m http.server 8081', dann 'node docs/tools/spiel-screenshots.js' (Playwright nötig).
// Die PNGs landen in /tmp/shots/; danach als JPG nach docs/img/ kopieren (siehe beipackzettel-screenshots.js).
// Für feste Bilder wird game.js mit einem kleinen Test-Haken geladen (nur in diesem Skript, nicht im Repo).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = '/tmp/shots/'; fs.mkdirSync(OUT, { recursive: true });
const GAME = fs.readFileSync(path.join(__dirname, '../../game.js'), 'utf8').replace('function frameLoop(now) {', 'window.__e=(f)=>eval(f);function frameLoop(now) {');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 1.5, hasTouch: true });
  await ctx.route('**/config.js*', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.QUIZ_CONFIG={}' }));
  await ctx.route('**/game.js*', (r) => r.fulfill({ contentType: 'text/javascript', body: GAME }));
  const errs = []; const fail = (m) => { console.error('FEHLER: ' + m); process.exitCode = 1; };
  const t = await ctx.newPage(); t.on('dialog', (d) => d.accept()); t.on('pageerror', (e) => errs.push(e.message));
  await t.goto('http://localhost:8081/#/lehrer'); await t.click('#demoQ'); await t.waitForTimeout(300);
  await t.click('#go'); await t.waitForURL(/raum/); const code = t.url().match(/raum\/(\d+)/)[1];
  const s = await ctx.newPage(); s.on('pageerror', (e) => errs.push(e.message));
  await s.goto('http://localhost:8081/'); await s.evaluate((c) => localStorage.removeItem('quiz.player.' + c), code);
  await s.goto('http://localhost:8081/#/' + code); await s.reload(); await s.fill('#nick', 'Anna'); await s.click('#join button'); await s.waitForSelector('#gCanvas');
  const cv = s.locator('#gCanvas'); const E = (x) => s.evaluate((x) => window.__e(x), x);
  await cv.scrollIntoViewIfNeeded(); await s.waitForTimeout(400); await cv.screenshot({ path: OUT + '19-spiel-start.png' });
  await cv.tap({ position: { x: 300, y: 80 } }); await s.evaluate(() => document.activeElement && document.activeElement.blur());
  await s.waitForTimeout(900); await s.screenshot({ path: OUT + '20-spiel-zonen.png' });
  /* feste Szenen: je Welt die neuen Dinge */
  const scene = (w) => `world=${w};skyA=WORLDS[${w}].a;skyB=WORLDS[${w}].b;lvl=${w + 1};hearts=3;zoneT=0;shield=${w % 2 === 0};fx.magnet=${w === 1 ? 6 : 0};fx.star=0;fx.dbl=${w === 3 ? 8 : 0};speed=0;stun=9;flash=0;rushAt=1e9;nextAt=1e9;
    things=[{k:"bar",x:100,w:26},{k:"barrel",x:136,w:12,h:12,v:0,ph:0},{k:"spring",x:156,w:12},{k:"frog",x:178,w:14,h:11,v:0,ph:0},{k:"goal",x:205,w:10},{k:"diver",x:222,w:14,h:10,lift:62,v:0,ph:0},
    {k:"pu",ty:"${['magnet', 'star', 'shield', 'dbl'][w]}",x:76,y:GROUND-46}]`;
  for (let w = 0; w < 4; w++) { await E(scene(w)); await s.waitForTimeout(150); await cv.screenshot({ path: OUT + `21-spiel-welt-${w + 1}.png` }); }
  /* Mechanik prüfen */
  const base = 'rushAt=1e9;puAt=1e9;heartAt=1e9;nextAt=1e9;goalAt=1e9;hearts=3;stun=0;flash=0;speed=SPEED0;shield=false;fx.star=0;fx.dbl=0;fx.magnet=0;';
  await E(base + 'things=[{k:"bar",x:110,w:26}]'); await s.keyboard.down('ArrowDown'); await s.waitForTimeout(1500); await s.keyboard.up('ArrowDown');
  if (await E('hearts') !== 3) fail('Rutschen unter dem Balken kostet ein Leben');
  await E(base + 'things=[{k:"bar",x:90,w:26}]'); await s.waitForTimeout(900); if (await E('hearts') !== 2) fail('Balken trifft im Stehen nicht');
  await E(base + 'things=[{k:"spring",x:80,w:12}]'); let mn = 0; for (let i = 0; i < 20; i++) { await s.waitForTimeout(50); mn = Math.min(mn, await E('hy')); } if (mn > -80) fail('Sprungfeder zu schwach: ' + mn);
  await s.waitForTimeout(1500); const l0 = await E('lvl'); await E(base + 'things=[{k:"goal",x:80,w:10}]'); await s.waitForTimeout(600); if (await E('lvl') !== l0 + 1) fail('Zielflagge zählt nicht');
  await E(base + 'things=[{k:"crate",x:80,w:16,h:21}];shield=true'); await s.waitForTimeout(800); if (await E('hearts') !== 3 || await E('shield')) fail('Schild fängt Treffer nicht ab');
  await E(base + 'fx.dbl=10;things=[]'); await s.waitForTimeout(300); await s.keyboard.press('Space'); await s.waitForTimeout(150); await s.keyboard.press('Space'); await s.waitForTimeout(50); if (!await E('airJumped')) fail('Doppelsprung geht nicht');
  /* Goldrausch für alle: Lehrkraft drückt, Handy startet Münzregen */
  await E(base + 'things=[]');
  await t.bringToFront(); await t.waitForSelector('#bRush'); await t.evaluate(() => window.scrollTo(0, 0)); await t.click('#bRush'); await t.waitForTimeout(400);
  await t.locator('#bRush').scrollIntoViewIfNeeded(); await t.screenshot({ path: OUT + '22-lehrer-goldrausch.png' });
  if (!(await t.locator('#bRush').isDisabled())) fail('Goldrausch-Knopf hat keine Pause');
  let ok = false; for (let i = 0; i < 12 && !ok; i++) { await s.waitForTimeout(500); ok = (await E('rushT')) > 0; }
  if (!ok) fail('Goldrausch kommt auf dem Handy nicht an');
  await s.waitForTimeout(900); await cv.screenshot({ path: OUT + '23-spiel-goldrausch.png' });
  if (errs.length) fail(errs.join(' | '));
  console.log(process.exitCode ? 'mit Fehlern' : 'alles ok'); await b.close();
})();
