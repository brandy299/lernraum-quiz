// Erzeugt die Screenshots für docs/BEIPACKZETTEL-LIVE-QUIZ.md im Demo-Modus.
// Start: im Repo-Ordner 'python3 -m http.server 8081', dann 'node docs/tools/beipackzettel-screenshots.js' (Playwright nötig).
// Die PNGs landen in /tmp/shots/; danach als JPG (Qualität 80, Breite max. 1100) nach docs/img/ kopieren.
const { chromium } = require('playwright');
const OUT='/tmp/shots/';require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:800},deviceScaleFactor:1.5,hasTouch:true});
await ctx.route('**/config.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.QUIZ_CONFIG={}'}));
const t=await ctx.newPage();t.on('dialog',d=>d.accept());
const shot=async(p,n,opt={})=>{await p.screenshot({path:OUT+n+'.png',...opt});};
await t.goto('http://localhost:8081/#/lehrer');await t.click('#demoQ');await t.waitForTimeout(400);
await shot(t,'01-neues-quiz');
await t.click('#gameDemo');await t.waitForSelector('#qzOv #gCanvas');await t.waitForTimeout(600);await t.tap('#qzOv #gCanvas');await t.waitForTimeout(1500);await shot(t,'02-spiel-demo');await t.click('#ovX');
await t.click('#go');await t.waitForURL(/raum/);const code=t.url().match(/raum\/(\d+)/)[1];await t.waitForTimeout(800);
await t.selectOption('#tlSel','300');await t.waitForTimeout(2300);
const names=['Anna','Ben','Cleo','Dino','Emma','Farid'];const ss=[];
for(const n of names){const s=await ctx.newPage();await s.goto('http://localhost:8081/');await s.evaluate(c=>localStorage.removeItem('quiz.player.'+c),code);await s.goto('http://localhost:8081/#/'+code);await s.reload();await s.fill('#nick',n);if(n==='Anna')await shot(s,'03-beitreten');await s.click('#join button');await s.waitForSelector('#tlInfo');ss.push(s);}
await ss[0].waitForTimeout(800);await shot(ss[0],'04-schueler-warteraum');
await t.waitForTimeout(2500);await t.evaluate(()=>window.scrollTo(0,0));await shot(t,'05-lehrer-warteraum');
await t.click('#bQr');await t.waitForTimeout(500);await shot(t,'06-qr-gross');await t.click('#qzOv');
await t.click('#bStart');await t.waitForTimeout(3600);
const ans=async(s,k,correct)=>{const q=await s.evaluate(([code,k])=>{const d=JSON.parse(localStorage.getItem('quiz.demo'));return d.rooms[code].questions[k]},[code,k]);
  await s.waitForSelector('.option',{timeout:8000});const i=correct?q.a:(q.a===0?1:0);await s.click(`.option[data-i="${i}"]`);await s.waitForSelector('#next');if(k===4&&s===ss[2]){await s.waitForTimeout(800);await shot(s,'07-schueler-frage');}await s.click('#next');};
const plan=[[10,10],[10,10],[6,10],[8,10],[4,10],[3,10]];
for(let p=0;p<ss.length;p++){const [ok,n]=plan[p];for(let k=0;k<n;k++){ if(p===2&&k===4){} await ans(ss[p],k,k<ok);} await ss[p].waitForTimeout(700);}
// mid-answer Cleo shot: new student page still mid-quiz isn't possible post-fact; take finished shot
await shot(ss[0],'08-schueler-fertig');
await t.waitForTimeout(2500);
await t.setViewportSize({width:1280,height:720});await t.waitForTimeout(600);
await t.evaluate(()=>window.scrollTo(0,0));await t.click('#bBeam');await t.waitForTimeout(1500);
await shot(t,'09-lehrer-rennen-beamer');await t.click('#bOff');await t.waitForTimeout(500);
await t.setViewportSize({width:390,height:800});
await t.evaluate((code)=>{const d=JSON.parse(localStorage.getItem('quiz.demo'));d.rooms[code].started=Date.now()-400*1000;localStorage.setItem('quiz.demo',JSON.stringify(d))},code);
await t.waitForTimeout(6500);
await ss[3].waitForSelector('#cer',{timeout:7000});await ss[3].waitForTimeout(9800);await shot(ss[3],'10-siegerehrung-handy');await ss[3].click('#ovX');await ss[3].waitForTimeout(400);await shot(ss[3],'11-schueler-ende');
await t.setViewportSize({width:1280,height:720});await t.click('#bCer');await t.waitForTimeout(2600);await shot(t,'12-siegerehrung-beamer-platz3');await t.waitForTimeout(9000);await shot(t,'13-siegerehrung-beamer-sieger');
await b.close();})();
