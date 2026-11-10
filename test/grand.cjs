// Grand parcours : « Lancer la série du jour » ouvre le parcours ; étape 1 réussie → étoiles, étape 2 ouverte, série du jour cochée
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle);
  const p = await ctx.newPage(); const errs = [], fail = m => { throw new Error(m); };
  p.on("pageerror", e => errs.push("PAGE " + e.message));
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
  const info = await p.evaluate(() => ({ n: GRAND.steps.length, per: GPT, tours: GTOURS.length }));
  if (info.n < 900) fail("trop peu d'étapes " + JSON.stringify(info));
  await p.click("[data-act=chemin]"); await p.waitForSelector(".view.grand .groad li.here");
  await p.screenshot({ path: "test/shots/g1-parcours.png" });
  await p.click(".groad li.here [data-act=gstep]");
  for (let i = 0; i < 8; i++) {
    await p.waitForFunction(() => SES && SES.q && !SES.q.done && document.querySelector("#answers [data-k]"), null, { timeout: 20000 });
    if (i === 0 && (await p.evaluate(() => SES.q.choices.length)) !== 3) fail("tour 1 : 3 choix attendus");
    await p.click(`#answers [data-k="${await p.evaluate(() => SES.q.answerKey)}"]`); await p.waitForSelector(".fb.show"); await p.click(".fb [data-act=next]");
  }
  await p.waitForSelector(".view.result");
  const st = await p.evaluate(() => ({ s0: stepStars("grand", 0), open1: stepOpen(GRAND, 1), serie: !!today().serie }));
  if (st.s0 !== 3 || !st.open1 || !st.serie) fail("après l'étape 1 " + JSON.stringify(st));
  await p.click("[data-act=chemin]"); await p.waitForSelector(".view.grand");
  if ((await p.evaluate(() => [...document.querySelectorAll(".groad li")].findIndex(li => li.classList.contains("here")))) !== 1) fail("étape 2 pas mise en avant");
  // Tour « Écrire » : pas de choix, on tape
  await p.evaluate(() => { const i = GTOURS.findIndex(t => t.format === "type") * GPT; LASTCFG = pathCfg(GRAND, i); startSession(LASTCFG); });
  await p.waitForSelector("#ans", { timeout: 20000 });
  console.log("grand parcours :", info.n, "étapes (", info.per, "par tour ×", info.tours, ") ; étape 1 → 3 étoiles, étape 2 ouverte, série du jour cochée ; tour Écrire ok");
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
