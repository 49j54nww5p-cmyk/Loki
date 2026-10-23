// Piaf en main : chaque exercice se joue de bout en bout, sans erreur de console.
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const fs = require("fs");
(async () => {
  fs.mkdirSync("test/shots", { recursive: true });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
  const ready = () => p.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector(".view.quiz"), null, { timeout: 20000 });
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
  await p.click("[data-act=mode][data-mode=main]"); await p.waitForSelector(".view.hand");
  await p.screenshot({ path: "test/shots/90-hand-hub.png", fullPage: true });
  await p.click("[data-act=hsp][data-sp=accenteur]"); await p.waitForSelector(".panel.hpanel");
  await p.screenshot({ path: "test/shots/91-hand-fiche.png" });
  await p.click("[data-act=close]");
  let n = 0;
  for (const ex of ["mix", "topo", "mue", "age", "code", "strat"]) {
    await p.evaluate(x => { LASTCFG = handCfg(x); startSession(LASTCFG); }, ex);
    for (let i = 0; i < 10; i++) {
      await ready();
      const q = await p.evaluate(() => ({ f: SES.q.format, stage: SES.q.stage, acc: SES.q.accept, ak: SES.q.answerKey, target: SES.q.target }));
      if (q.f === "tap") {
        const sel = q.stage === "tail" ? `#hplate .fe[data-f="${q.acc[0]}"]` : q.target === "zone" ? `#hplate .fe[data-g="${q.acc[0]}"]` : `#hplate .fe[data-f="${q.acc[0]}"]`;
        await p.evaluate(s => { const el = document.querySelector(s); const svg = el.closest("svg"); ACT.wtap(svg, { target: el, clientX: 0, clientY: 0 }); }, sel);
        if (!(await p.evaluate(() => !!SES.q.sel))) throw new Error("sélection impossible " + sel);
        await p.click("#hval");
      } else await p.click(`#answers [data-k="${q.ak}"]`);
      await p.waitForSelector(".fb.show");
      if (!(await p.evaluate(() => SES.results.at(-1).ok))) throw new Error(`${ex} : la bonne réponse est refusée (${JSON.stringify(q)})`);
      n++;
      await p.click(".fb [data-act=next]");
    }
    await p.waitForSelector(".view.result");
  }
  // espèces : chaque fiche s'ouvre et chaque scène d'âge se dessine
  const bad = await p.evaluate(() => {
    const out = [];
    for (const s of HSP) {
      if (!handSpPanel(s.id)) out.push("fiche " + s.id);
      if (s.look) for (const season of ["aut", "spr"]) for (const y of [true, false]) {
        const sc = hScene(s, season, y);
        if (!sc.ans || !wingSvg({ look: s.look, gen: sc.gen, wear: sc.wear }).includes("<g class=\"fe\"")) out.push(`scène ${s.id} ${season} ${y}`);
      }
    }
    return out;
  });
  console.log("hand", n, "réponses justes acceptées", bad.length ? "PROBLÈMES " + bad.join(", ") : "fiches ok");
  console.log("ERR", errs); await b.close();
  if (errs.length || bad.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
