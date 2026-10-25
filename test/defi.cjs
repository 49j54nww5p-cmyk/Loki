// Défi à distance (sans serveur) et parcours guidés.
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const fs = require("fs");
(async () => {
  fs.mkdirSync("test/shots", { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle);
  const errs = [], fail = m => { throw new Error(m); };
  const page = async (url = "https://plumage.test/") => { const p = await ctx.newPage(); p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text())); await p.goto(url); await p.waitForSelector(".view"); return p; };
  const play = async (p, pick) => {
    for (let i = 0; ; i++) {
      await p.waitForFunction(j => (DEFI.st === "q" && DEFI.i === j && DEFI.rev !== j && document.querySelector("#dans [data-k]")) || DEFI.st === "end", i, { timeout: 20000 });
      if (await p.evaluate(() => DEFI.st === "end")) return i;
      const k = await p.evaluate(ok => { const q = DEFI.deck[DEFI.i]; return ok ? q.k : q.c.find(c => c[0] !== q.k)[0]; }, pick(i));
      await p.click(`#dans [data-k="${k}"]`);
    }
  };

  // 1) Alice prépare un défi et le joue
  const A = await page();
  await A.click("[data-act=mode][data-mode=duel]"); await A.waitForSelector(".livecta.defic");
  await A.click(".livecta.defic"); await A.waitForSelector(".view.defi");
  await A.fill("#lpseudo", "Alice");
  await A.click("[data-act=dstart]");
  await A.waitForFunction(() => DEFI.st === "q", null, { timeout: 20000 });
  await A.waitForTimeout(500); await A.screenshot({ path: "test/shots/d1-defi-q.png" });
  const nA = await play(A, i => i % 2 === 0);
  await A.waitForFunction(() => !!DEFI.link, null, { timeout: 10000 });
  await A.screenshot({ path: "test/shots/d2-defi-ready.png" });
  const link = await A.evaluate(() => DEFI.link), scA = await A.evaluate(() => defiScore(DEFI.deck, DEFI.ans, DEFI.T));
  if (!/^https:\/\/plumage\.test\/#defi=[zj][A-Za-z0-9_-]+$/.test(link)) fail("lien " + link.slice(0, 80));
  console.log("défi :", nA, "photos, lien", link.length, "caractères, score Alice", scA.pts, "(" + scA.ok + " justes)");

  // 2) Bob ouvre le lien, joue les mêmes photos, gagne
  const B = await page(link);
  await B.waitForSelector(".view.defi .lcard h2");
  if (!/Alice te défie/.test(await B.evaluate(() => document.querySelector(".view.defi h2").textContent))) fail("intro du défi reçu");
  if (await B.evaluate(() => location.hash)) fail("le lien reste dans l'adresse");
  await B.fill("#lpseudo", "Bob");
  await B.click("[data-act=daccept]");
  await B.waitForFunction(() => DEFI.st === "q", null, { timeout: 10000 });
  const same = await B.evaluate(l => DEFI.deck.map(d => d.k).join(), link) === await A.evaluate(() => DEFI.deck.map(d => d.k).join());
  if (!same) fail("pas les mêmes questions");
  if (!(await B.evaluate(() => document.querySelector(".lscore .ot b").textContent === "?"))) fail("score de l'autre visible avant la fin");
  const xp0 = await B.evaluate(() => S.xp);
  await play(B, () => true);
  await B.waitForSelector(".lend.win");
  await B.waitForTimeout(400); await B.screenshot({ path: "test/shots/d3-defi-end.png" });
  const r = await B.evaluate(() => ({ me: defiScore(DEFI.deck, DEFI.ans, DEFI.T).pts, op: defiScore(DEFI.deck, DEFI.opp.ans, DEFI.T).pts, xp: S.xp, win: S.counters.defiwin }));
  if (r.op !== scA.pts || !(r.me > r.op) || !(r.xp > xp0) || r.win !== 1) fail("fin du défi " + JSON.stringify(r));
  if (!(await B.$("[data-act=dback]"))) fail("pas de revanche proposée");

  // 3) Liens piégés : hôte de photo inconnu refusé, noms neutralisés
  const evil = await B.evaluate(async () => {
    const base = { v: 1, n: "<img src=x onerror=window.PWNED=1>Eve", T: 10, x: [[1, "<b>Bec</b>", "A a"], [2, "Deux", "B b"]], q: [], a: [] };
    for (let i = 0; i < 6; i++) { base.q.push([1, 100 + i, "jpg", "(c) x", [0, 1], 0]); base.a.push([0, 1200]); }
    const ok = "https://plumage.test/#defi=" + await packZ(JSON.stringify(base));
    const bad = JSON.parse(JSON.stringify(base)); bad.q[0][0] = 7;
    return { ok, bad: "https://plumage.test/#defi=" + await packZ(JSON.stringify(bad)) };
  });
  const E = await page(evil.ok);
  await E.waitForSelector(".view.defi h2");
  const ev = await E.evaluate(() => ({ img: !!document.querySelector(".view.defi h2 img, .view.defi .lcard img"), pw: !!window.PWNED, url: DEFI.deck[0].l }));
  if (ev.img || ev.pw || !/^https:\/\/static\.inaturalist\.org\/photos\/100\/large\.jpg$/.test(ev.url)) fail("défi piégé " + JSON.stringify(ev));
  await E.close();
  const E2 = await page(evil.bad);
  await E2.waitForTimeout(800);
  if (await E2.evaluate(() => VIEW === "defi")) fail("défi invalide ouvert");
  await E2.close();

  // 4) Parcours : liste, étape 1 réussie (étoiles, déblocage), étape 2 ratée
  const P = await page();
  await P.click("[data-act=mode][data-mode=parcours]"); await P.waitForSelector(".view.paths .pathc");
  if ((await P.evaluate(() => document.querySelectorAll(".pathc").length)) < 6) fail("parcours manquants");
  await P.screenshot({ path: "test/shots/d4-paths.png", fullPage: true });
  await P.click("[data-act=path][data-p=jardin]"); await P.waitForSelector(".view.path .trail");
  await P.waitForSelector("#tsp img", { timeout: 15000 });
  const lock = await P.evaluate(() => [...document.querySelectorAll(".trail li")].map(li => li.classList.contains("lock")));
  if (lock[0] || !lock[1]) fail("verrouillage " + lock);
  await P.screenshot({ path: "test/shots/d5-path.png", fullPage: true });
  const step = async correct => {
    await P.waitForFunction(() => SES && SES.kind === "path" && SES.q && !SES.q.done && document.querySelector("#answers [data-k]"), null, { timeout: 20000 });
    for (let i = 0; i < 8; i++) {
      await P.waitForFunction(() => SES.q && !SES.q.done && document.querySelector("#answers [data-k]"), null, { timeout: 20000 });
      const q = await P.evaluate(() => ({ ak: SES.q.answerKey, keys: SES.q.choices.map(c => c.key), inPool: SES.q.choices.every(c => SES.pool.byId.has(c.t.id)) }));
      if (!q.inPool) fail("choix hors de l'étape");
      await P.click(`#answers [data-k="${correct(i) ? q.ak : q.keys.find(k => k !== q.ak)}"]`);
      await P.waitForSelector(".fb.show"); await P.click(".fb [data-act=next]");
    }
    await P.waitForSelector(".view.result");
  };
  await P.click("[data-act=pgo][data-i='0']");
  await step(() => true);
  const r1 = await P.evaluate(() => ({ h: document.querySelector(".view.result h1").textContent, s: S.paths?.jardin?.s?.[0], next: !!document.querySelector("[data-act=pgo][data-i='1']") }));
  if (r1.h !== "Étape validée !" || r1.s !== 3 || !r1.next) fail("étape 1 " + JSON.stringify(r1));
  await P.screenshot({ path: "test/shots/d6-step-ok.png" });
  await P.click("[data-act=pgo][data-i='1']");
  await step(i => i < 5);
  const r2 = await P.evaluate(() => ({ h: document.querySelector(".view.result h1").textContent, s: S.paths?.jardin?.s?.[1] || 0 }));
  if (r2.h !== "Presque !" || r2.s) fail("étape 2 " + JSON.stringify(r2));
  await P.evaluate(() => ACT.home()); await P.waitForSelector(".pathhome");
  if (!/étape 2\/6/.test(await P.evaluate(() => document.querySelector(".pathhome small").textContent))) fail("carte d'accueil");

  console.log("défi à distance + parcours ok");
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
