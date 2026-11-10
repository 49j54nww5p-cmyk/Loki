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
  const info = await p.evaluate(() => ({ n: GRAND.steps.length, per: GPT, tours: GTOURS.length, ch: GCH.length,
    dup: (() => { const m = {}; GCH.forEach(c => c.steps.forEach(st => st.sp.forEach(([la]) => (m[la] = m[la] || new Set()).add(c.k)))); return Object.entries(m).filter(([, v]) => v.size > 1).map(([k]) => k); })() }));
  if (info.n !== 1000 || info.per * info.tours !== 1000) fail("il faut 1000 étapes " + JSON.stringify(info));
  if (info.ch < 17) fail("chapitres manquants " + JSON.stringify(info));
  // l'ancienne progression (13 chapitres × 12 tours, 81 étapes par tour) est retrouvée chapitre par chapitre
  const mig = await p.evaluate(() => gMigrate({ s: { 0: 3, 5: 2, 72: 1, 80: 3, 81: 3, 162: 2, 241: 1 } }).s);
  if (JSON.stringify(mig) !== JSON.stringify({ 0: 3, 5: 2, 77: 1, 96: 3, 100: 2, 184: 1 })) fail("migration " + JSON.stringify(mig));
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
  // Difficulté qui monte : bilan du chapitre = 2 choix de plus ; tour 3 = 5 choix avec leurres ; tour jeunes = photos d'âge
  const ks = await p.evaluate(() => { const bi = GRAND.steps.findIndex(s => s.kind === "boss"), c5 = pathCfg(GRAND, 4 * GPT), c12 = pathCfg(GRAND, (GTOURS.length - 1) * GPT);
    return { boss: pathCfg(GRAND, bi).k, t5: c5.stim.join(), l5: c5.leurres, juv12: c12.juv, type12: c12.type, k12: c12.k }; });
  if (ks.boss !== 5 || !/photo/.test(ks.t5) || !/son/.test(ks.t5) || !/la/.test(ks.t5) || !ks.l5 || !(ks.juv12 > 0) || !(ks.type12 > 0) || ks.k12 !== 6) fail("difficulté " + JSON.stringify(ks));
  await p.evaluate(() => { LASTCFG = pathCfg(GRAND, 1 * GPT); startSession(LASTCFG); });
  await p.waitForFunction(() => SES && SES.q && !SES.q.done && document.querySelector("#answers [data-k]"), null, { timeout: 20000 });
  if ((await p.evaluate(() => SES.q.choices.length)) !== 4) fail("tour 2 : 4 choix attendus");
  await p.evaluate(() => ACT.quit());
  // Expert : plan mélangé (écrit, choix, plusieurs types) sur une étape
  const mix = await p.evaluate(async () => { const c = pathCfg(GRAND, (GTOURS.length - 1) * GPT); const ses = { cfg: c, kind: "path" }; await preparePath(ses); return { n: ses.plan.length, stims: new Set(ses.plan.map(s => s.stim)).size }; });
  if (mix.n !== 8 || mix.stims < 2) fail("expert pas mélangé " + JSON.stringify(mix));
  // Coffre : chapitre 1 fini → coffre prêt, ouvert une seule fois, récompense enregistrée
  await p.evaluate(() => { ACT.home(); gIdx(0, 0).forEach(i => S.paths.grand.s[i] = 3); save(true); ACT.chemin(); });
  await p.waitForSelector(".view.grand .gchest-bar");
  const before = await p.evaluate(() => ({ xp: S.xp, j: S.streak.jokers }));
  await p.click(".gchest-bar"); await p.waitForSelector(".gprize.on .gprize-ok");
  await p.screenshot({ path: "test/shots/g2-coffre.png" });
  await p.click(".gprize-ok"); await p.waitForFunction(() => !document.querySelector(".gprize") && !document.querySelector(".gchest-bar"));
  const after = await p.evaluate(() => ({ xp: S.xp, j: S.streak.jokers, c: S.paths.grand.c }));
  if (!after.c || after.c["jardin.0"] !== 1 || (after.xp <= before.xp && after.j <= before.j)) fail("coffre " + JSON.stringify({ before, after }));
  await p.evaluate(() => gChestOpen({ dataset: { t: 0, c: 0 }, closest: () => null, classList: { add() {} } }));
  const again = await p.evaluate(() => ({ xp: S.xp, j: S.streak.jokers }));
  if (again.xp !== after.xp || again.j !== after.j) fail("coffre ouvert deux fois");
  console.log("coffre :", JSON.stringify(before), "→", JSON.stringify({ xp: after.xp, j: after.j }), "doublons entre chapitres :", info.dup.join(", ") || "aucun");
  console.log("grand parcours :", info.n, "étapes (", info.per, "par tour ×", info.tours, ") ; étape 1 → 3 étoiles, étape 2 ouverte, série du jour cochée ; tours cumulatifs ok");
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
