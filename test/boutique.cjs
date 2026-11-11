// Boutique : plumes gagnées avec l'XP, achat d'un joker, refus sans plumes, thème appliqué, coffre ≥ 500 XP
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle);
  const p = await ctx.newPage(); const errs = [], fail = m => { throw new Error(m); };
  p.on("pageerror", e => errs.push("PAGE " + e.message));
  try {
    await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
    await p.evaluate(() => { try { closeLayer(); } catch (e) {} S.plumes = 0; S.plumesR = 0; S.streak.jokers = 0; S.set.calm = true; addXp(25); addXp(17); save(true); });
    const pl = await p.evaluate(() => [S.plumes, S.plumesR]);
    if (pl[0] !== 4 || pl[1] !== 2) fail("plumes pour 42 XP " + pl);
    await p.evaluate(() => { S.plumes = 200; save(true); go("home"); });
    await p.waitForSelector(".hud .pill.pl"); await p.click(".hud .pill.pl"); await p.waitForSelector(".view.shop");
    await p.click(".sitem[data-k=joker] .sbuy"); await p.waitForTimeout(300);
    let s = await p.evaluate(() => ({ pl: S.plumes, j: S.streak.jokers, bal: document.querySelector("#sbal").textContent }));
    if (s.pl !== 50 || s.j !== 1 || s.bal !== "50") fail("achat joker " + JSON.stringify(s));
    if (!(await p.evaluate(() => document.querySelector(".sitem[data-k=joker] .sbuy").disabled))) fail("bouton joker devrait être désactivé");
    if (await p.evaluate(() => shopBuy("joker"))) fail("achat accepté sans assez de plumes");
    if (await p.evaluate(() => S.plumes) !== 50) fail("solde modifié par un refus");
    await p.evaluate(() => { S.plumes = 400; go("shop"); });
    await p.click(".sitem[data-k=acc-martin] .sbuy"); await p.waitForTimeout(300);
    const acc = await p.evaluate(() => ({ v: getComputedStyle(document.documentElement).getPropertyValue("--acc").trim(), set: S.set.acc, pl: S.plumes }));
    if (acc.v.toUpperCase() !== "#18C6B4" || acc.set !== "martin" || acc.pl !== 100) fail("thème " + JSON.stringify(acc));
    await p.reload(); await p.waitForSelector(".view.home");
    if ((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--acc").trim())).toUpperCase() !== "#18C6B4") fail("thème perdu au démarrage");
    // coffres
    const pz = await p.evaluate(() => { const a = []; for (let t = 0; t < GTOURS.length; t++) for (let c = 0; c < GCH.length; c++) a.push(gPrize(t, c)); return { min: Math.min(...a.map(x => x.v)), first: gPrize(0, 0).v, rare: a.filter(x => x.rare).length / a.length }; });
    if (pz.min < 500 || pz.first < 500) fail("coffre " + JSON.stringify(pz));
    if (pz.rare < .15 || pz.rare > .25) fail("proportion rare " + pz.rare);
    // ouverture d'un coffre : XP crédité une seule fois
    const r = await p.evaluate(async () => {
      S.paths = { grand: { s: Object.fromEntries(gIdx(0, 0).map(i => [i, 3])) } }; save(true); go("grand");
      const xp0 = S.xp, el = document.querySelector("[data-act=gchest][data-t='0'][data-c='0']");
      await gChestOpen(el); await gChestOpen(el);
      return { gain: S.xp - xp0, card: document.querySelector(".gprize h2")?.textContent };
    });
    if (r.gain !== (await p.evaluate(() => gPrize(0, 0).v)) || r.gain < 500) fail("ouverture coffre " + JSON.stringify(r));
    // passer une étape
    const sk = await p.evaluate(() => { document.querySelector(".gprize")?.remove(); S.paths = { grand: { s: { 0: 3 } } }; S.skips = 1; save(true); go("grand"); const btn = document.querySelector(".gskip"); if (!btn) return "pas de bouton"; btn.click(); return [stepStars("grand", 1), S.skips]; });
    if (JSON.stringify(sk) !== "[1,0]") fail("passer " + JSON.stringify(sk));
    // cosmétiques : cadre verrouillé par niveau, achat, son, défi expert 1×/jour
    const cz = await p.evaluate(() => {
      S.cos = []; S.set.frame = ""; S.plumes = 2000; const xp0 = S.xp; S.xp = 0;
      const lockOk = !cosBuy("fr-or"); S.xp = Math.max(xp0, lvlXp(61));
      const buy = cosBuy("fr-or"), cls = document.documentElement.classList.contains("fr-or");
      cosBuy("snd-pic"); cosBuy("fx-plumes");
      const pl = S.plumes, d1 = defiStart(), d2 = defiStart();
      const dx = xpFor({ cfg: { expertX: true }, combo: 0 }, { kind: "taxon", format: "type", stim: "photo", level: "species", diff: "expert" }, { ok: true }, 9000) === 2 * xpFor({ cfg: {}, combo: 0 }, { kind: "taxon", format: "type", stim: "photo", level: "species", diff: "expert" }, { ok: true }, 9000);
      try { SES.ended = true; SES = null; } catch (e) {}
      return { lockOk, buy, cls, pl, own: S.cos.length, son: S.set.okson, pluie: S.set.pluie, d1, d2, after: S.plumes, dx };
    });
    if (!cz.lockOk || !cz.buy || !cz.cls || cz.pl !== 2000 - 800 - 250 - 350 || cz.own !== 3 || cz.son !== "snd-pic" || !cz.pluie || !cz.d1 || cz.d2 || cz.after !== cz.pl - 30 || !cz.dx) fail("cosmétiques " + JSON.stringify(cz));
  } catch (e) { errs.push(e.message); }
  console.log("ERR", JSON.stringify(errs));
  await b.close();
})();
