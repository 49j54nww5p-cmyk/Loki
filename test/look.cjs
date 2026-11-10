// Captures de la refonte avec de vraies photos : l'appli est servie depuis dist/, iNaturalist répond pour de bon.
// usage : node test/look.cjs <dossier> [saison] [tenue] [écrans séparés par des virgules]
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const OUT = process.argv[2] || "test/shots-look", SEASON = process.argv[3] || "automne", THEME = process.argv[4] || "jour";
const ONLY = (process.argv[5] || "").split(",").filter(Boolean), DPR = +(process.env.DPR || 2);
const DIST = path.join(__dirname, "..", process.env.DIST || "dist");
const CT = { html: "text/html", js: "application/javascript", css: "text/css", woff: "font/woff", png: "image/png", svg: "image/svg+xml", webmanifest: "application/manifest+json", json: "application/json" };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true, locale: "fr-FR", timezoneId: "Europe/Paris", colorScheme: "dark", ...(process.env.VIDEO ? { recordVideo: { dir: OUT, size: { width: 390, height: 844 } } } : {}) });
  await ctx.route("https://plumage.test/**", route => {
    let f = new URL(route.request().url()).pathname; if (f === "/") f = "/index.html";
    const file = path.join(DIST, f);
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "" });
    route.fulfill({ status: 200, contentType: CT[file.split(".").pop()] || "application/octet-stream", body: fs.readFileSync(file) });
  });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push("PAGE " + e.message));
  const want = n => !ONLY.length || ONLY.includes(n);
  const shot = async (n, full) => { await p.waitForTimeout(350); await p.screenshot({ path: path.join(OUT, `${n}-${SEASON}-${THEME}.png`), fullPage: !!full }); console.log("shot", n); };
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
  // un compte « vécu » : niveau, flamme, quelques espèces, pas de visite guidée
  await p.evaluate(([season, theme]) => {
    S.set.plum = season; S.set.tenue = theme; S.xp = 617; S.streak = { cur: 3, best: 5, last: dayKey(), jokers: 1 };
    S.hint = { ...(S.hint || {}), tour: Date.now(), news: NEWS[0].v, install: Date.now() }; S.bk = { last: Date.now(), snooze: 0 };
    S.days[dayKey()] = { q: 14, ok: 11, xp: 96 }; save(true);
  }, [SEASON, THEME]);
  await p.reload(); await p.waitForSelector(".view.home");
  await p.evaluate(() => { try { closeLayer(); } catch (e) {} });
  if (want("home")) { await p.waitForSelector(".hero-ph.on", { timeout: 20000 }).catch(() => console.log("pas de photo du jour")); await p.waitForTimeout(1500); await shot("home"); await shot("home-full", true); }
  if (want("grand")) {
    await p.evaluate(() => { S.paths = { ...(S.paths || {}), grand: { s: { 0: 3, 1: 2, 2: 3 } } }; save(true); });
    await p.click("[data-act=chemin]"); await p.waitForSelector(".view.grand .groad li.here");
    await p.waitForTimeout(4000); await p.evaluate(() => window.scrollTo(0, 0)); await shot("grand");
    await p.evaluate(() => document.querySelector(".groad li.here").scrollIntoView({ block: "center" })); await shot("grand2");
    await p.click(".groad li.here [data-act=gstep]"); await p.waitForSelector(".shot.loaded", { timeout: 30000 }).catch(() => {}); await shot("gquiz");
    await p.evaluate(() => { ACT.quit && ACT.quit(); }); await p.evaluate(() => go("home")); await p.waitForSelector(".view.home");
  }
  for (const t of ["carnet", "progress", "settings"]) if (want(t)) {
    await p.evaluate(() => { for (const id of [12716, 13094, 7044, 4956, 13858, 9083, 14850, 2548, 10069, 14886]) { const r = rec({ id, sci: "", fr: "" }); r.n = 4; r.ok = 3; r.last = dayKey(); } save(true); }).catch(() => {});
    await p.click(`#nav [data-tab=${t}]`); await p.waitForSelector(`.view.${t}`); await p.waitForTimeout(2500); await shot(t); await shot(t + "-full", true);
    await p.click("#nav [data-tab=home]"); await p.waitForSelector(".view.home");
  }
  const ready = () => p.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector(".view.quiz #answers [data-k], .view.quiz #ans"), null, { timeout: 40000 });
  if (want("quiz") || want("fb") || want("fbbad") || want("result")) {
    await p.evaluate(() => { LASTCFG = { ...modeCfg("photo"), len: 6 }; startSession(LASTCFG); });
    await ready(); await p.waitForSelector(".shot.loaded", { timeout: 20000 }).catch(() => {});
    if (want("quiz")) await shot("quiz");
    let i = 0;
    for (; i < 6; i++) {
      await ready(); await p.waitForSelector(".shot.loaded", { timeout: 20000 }).catch(() => {});
      const q = await p.evaluate(() => ({ ak: SES.q.answerKey, keys: SES.q.choices.map(c => c.key) }));
      const wrong = i === 1 || i === 4;
      await p.click(`#answers [data-k="${wrong ? q.keys.find(k => k !== q.ak) : q.ak}"]`);
      await p.waitForSelector(".fb.show"); await p.waitForTimeout(wrong ? 2500 : 1200);
      if (i === 0 && want("fb")) { await shot("fb"); }
      if (i === 1 && want("fbbad")) { await shot("fbbad"); await p.evaluate(() => document.querySelector(".fb .why")?.scrollIntoView()); await shot("fbbad2"); }
      await p.click(".fb [data-act=next]");
    }
    await p.waitForSelector(".view.result"); await p.waitForTimeout(2600);
    if (want("result")) { await shot("result"); await shot("result-full", true); }
  }
  if (process.env.VIDEO) { for (const t of ["carnet", "progress", "settings", "home"]) { await p.click(`#nav [data-tab=${t}]`); await p.waitForTimeout(900); } }
  console.log("ERR", errs); await ctx.close(); await b.close();
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
