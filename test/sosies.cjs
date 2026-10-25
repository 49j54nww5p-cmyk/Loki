// Aide après une erreur : loupes sur ce qui diffère, moyen mnémo gardé dans la fiche, indice « regarde d'abord »,
// duels d'entraînement proposés au bilan, loupes dans la fiche espèce.
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const fs = require("fs");
(async () => {
  fs.mkdirSync("test/shots", { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle);
  const p = await ctx.newPage(); const errs = [], fail = m => { throw new Error(m); };
  p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
  const ready = () => p.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector(".view.quiz #answers [data-k]"), null, { timeout: 20000 });
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");

  // 1) Duel pouillots : indice, erreur, loupes, moyen mnémo
  await p.click("[data-act=mode][data-mode=duel]"); await p.waitForSelector("[data-act=duelgo][data-i='0']");
  await p.click("[data-act=duelgo][data-i='0']");
  await ready();
  const hints = await p.evaluate(() => SES.q.hints.map(h => h.tx));
  if (!hints.some(h => /Regarde d'abord les pattes/.test(h))) fail("indice absent : " + hints.join(" | "));
  const wrong = await p.evaluate(() => SES.q.choices.find(c => c.key !== SES.q.answerKey).key);
  await p.click(`#answers [data-k="${wrong}"]`);
  await p.waitForSelector(".fb.show .why.err");
  const info = await p.evaluate(() => ({ rows: document.querySelectorAll(".fb .why .zrow").length, lenses: document.querySelectorAll(".fb .why .zlens").length, memo: !!document.querySelector(".fb .why .memo"), first: document.querySelector(".fb .why .zfirst")?.closest(".zrow")?.querySelector(".zlab b")?.textContent, sub: document.querySelector(".fb .whyh small")?.textContent }));
  if (info.rows < 3 || info.lenses < 4 || !info.memo || info.first !== "Pattes" || !/pattes/.test(info.sub)) fail("bloc erreur " + JSON.stringify(info));
  await p.evaluate(() => document.querySelector(".fb .why").scrollIntoView());
  await p.waitForTimeout(300);
  await p.screenshot({ path: "test/shots/s1-why.png" });
  const tid = await p.evaluate(() => SES.q.t.id);
  await p.click(".fb [data-act=memokeep]");
  if (!/bottes/.test(await p.evaluate(id => S.sp[id].note || "", tid))) fail("moyen mnémo non gardé");
  await p.click(".fb [data-act=memoown]");
  await p.fill(".fb .memoin textarea", "le véloce hoche la queue");
  await p.click(".fb [data-act=memosave]");
  if (!/hoche la queue/.test(await p.evaluate(id => S.sp[id].note || "", tid))) fail("astuce perso non gardée");
  await p.click(".fb [data-act=next]");
  for (let i = 1; i < 8; i++) { await ready(); await p.click(`#answers [data-k="${await p.evaluate(() => SES.q.answerKey)}"]`); await p.waitForSelector(".fb.show"); await p.click(".fb [data-act=next]"); }
  await p.waitForSelector(".view.result");
  if (await p.$(".drills")) fail("un duel ne doit pas proposer de duel au bilan");

  // 2) Série du jour : réponses fausses → bloc « pourquoi » (paire connue ou conseil général), duels au bilan
  await p.evaluate(() => { LASTCFG = dailyCfg(); startSession(LASTCFG); });
  let whys = 0, gens = 0, nearClicked = 0;
  for (let i = 0; i < 12; i++) {
    await p.waitForFunction(() => SES && SES.q && !SES.q.done && document.querySelector(".view.quiz"), null, { timeout: 20000 });
    const q = await p.evaluate(() => ({ f: SES.q.format, lvl: SES.q.level, kind: SES.q.kind, keys: (SES.q.choices || []).map(c => c.key), ak: SES.q.answerKey, near: (SES.q.choices || []).filter(c => c.key !== SES.q.answerKey && c.t && fam(c.t) && fam(c.t) === fam(SES.q.t)).map(c => c.key) }));
    const bad = q.near[0] || q.keys.find(k => k !== q.ak);
    if (q.near.length && q.lvl === "species" && q.kind === "taxon" && q.f !== "type" && q.f !== "flash") nearClicked++;
    if (q.kind === "taxon" && bad && (q.f === "qcm" || q.f === "tiles" || q.f === "audio")) {
      await p.click(`[data-k="${bad}"]`);
      await p.waitForSelector(".fb.show");
      if (q.lvl === "species") {
        const w = await p.evaluate(() => ({ any: !!document.querySelector(".fb .why"), gen: !!document.querySelector(".fb .why.gen") }));
        if (!w.any) fail("pas d'aide après une erreur d'espèce");
        whys++;
        if (w.gen) {
          gens++;
          await p.waitForSelector(".fb #wcrit .zrow, .fb #wcrit .wvs", { timeout: 10000 }).catch(() => fail("pas de critères pour une paire quelconque"));
          const rows = await p.evaluate(() => document.querySelectorAll(".fb #wcrit .zrow").length);
          if (rows < 3) fail("trop peu de critères : " + rows);
          if (gens === 1) { await p.waitForTimeout(300); await p.evaluate(() => document.querySelector(".fb .why.gen").scrollIntoView()); await p.screenshot({ path: "test/shots/s2-why-gen.png" }); }
        }
        if (await p.$(".fb .zdrill")) fail("le duel ne doit plus être annoncé comme obligatoire");
      }
    } else if (q.f === "type") { await p.fill("#ans", "zzz"); await p.keyboard.press("Enter"); await p.waitForSelector(".fb.show"); }
    else if (q.f === "flash") { await p.click("[data-act=reveal]"); await p.click("[data-act=self][data-v='0']"); await p.waitForSelector(".fb.show"); }
    else { await p.click(`[data-k="${q.ak}"]`).catch(() => {}); await p.waitForSelector(".fb.show"); }
    await p.click(".fb [data-act=next]");
  }
  await p.waitForSelector(".view.result");
  const drills = await p.evaluate(() => document.querySelectorAll(".drills .conf.drill").length);
  if (nearClicked && !drills) fail("aucun duel d'entraînement au bilan");
  const silly = await p.evaluate(() => [...document.querySelectorAll(".drills .conf.drill")].map(b => b.dataset.ids.split(",").map(Number)).filter(([a, b]) => !drillWorthy(a, b)).length);
  if (silly) fail("duel proposé pour une paire sans rapport");
  await p.screenshot({ path: "test/shots/s3-drills.png", fullPage: true });

  // 3) Fiche du pouillot véloce : loupes « comment les distinguer »
  await p.evaluate(id => openFiche(taxonById(id)), tid);
  await p.waitForSelector(".panel .why.neu .zlens");
  // 4) Écrire : taper le nom d'une autre espèce montre aussi ce qui les sépare
  await p.evaluate(() => { LASTCFG = modeCfg("ecrire"); startSession(LASTCFG); });
  await p.waitForFunction(() => SES && SES.q && !SES.q.done && document.querySelector("#ans"), null, { timeout: 20000 });
  const other = await p.evaluate(() => SES.pool.list.find(x => x.id !== SES.q.t.id && x.fr).fr);
  await p.fill("#ans", other); await p.keyboard.press("Enter");
  await p.waitForSelector(".fb.show .why", { timeout: 5000 }).catch(() => fail("pas d'aide quand on tape le nom d'une autre espèce"));
  console.log("sosies : indice, loupes, moyen mnémo, astuce, duels au bilan (" + drills + "), fiche ok · erreurs d'espèce", whys, "dont générales", Math.min(gens, 1) ? "≥1" : 0);
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
