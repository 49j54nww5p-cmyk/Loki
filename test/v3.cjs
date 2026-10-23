// Sauvegarde, maîtrise, rétention, sosies, sorties, spectrogrammes, confidentialité
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const MODE = process.argv[2] || "main";
const IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: MODE === "main" ? IOS : undefined, acceptDownloads: true });
  await ctx.route("**/*", handle);
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/404|ERR_FAILED|Failed to load resource|CORS|Access-Control/.test(m.text()) && errs.push(m.text()));
  const ready = () => p.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector(".view.quiz"), null, { timeout: 25000 });
  const shot = n => p.screenshot({ path: `test/shots/${n}.png` });
  const answer = async ok => { const k = await p.evaluate(() => SES.q.answerKey), keys = await p.evaluate(() => (SES.q.choices || []).map(c => c.key)); await p.click(`#answers [data-k="${ok ? k : keys.find(x => x !== k)}"]`); await p.waitForSelector(".fb.show"); };
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
  if (MODE === "main") {
    console.log("fonts", await p.evaluate(async () => { await document.fonts.ready; return [document.fonts.check("700 16px Unbounded"), document.fonts.check("16px Figtree")]; }));
    // 1) progression simulée pour faire apparaître le rappel de sauvegarde
    await p.evaluate(() => { for (let i = 0; i < 10; i++) S.sp[1000 + i] = { fr: "Test " + i, sci: "Testus " + i, f: 910001, o: 900001, img: "", md: "", n: 3, ok: 2, box: { photo: 2 }, due: {}, conf: {}, first: "2026-10-20", lastOk: "2026-10-22" }; S.v = 1; migrate(); S.xp = 400; save(true); go("home"); });
    await p.waitForTimeout(900);
    await shot("110-home-notices");
    console.log("notices", await p.$$eval(".notice", ns => ns.map(n => n.className)), "groups", await p.$$eval(".view.home .sec", s => s.map(x => x.textContent.trim())));
    console.log("legacy stars", await p.evaluate(() => [stars(S.sp[1000]), JSON.stringify(mastery(S.sp[1000]))]));
    const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 8000 }), p.click(".notice.bk [data-act=backup]")]);
    const txt = require("fs").readFileSync(await dl.path(), "utf8");
    console.log("backup", dl.suggestedFilename(), txt.length, "xc in file:", JSON.parse(txt).set.xc === "", "bk", await p.evaluate(() => !!S.bk.last), "card gone", !(await p.$(".notice.bk")));
    // 2) Duel : critères après la réponse
    await p.evaluate(() => { LASTCFG = duelCfg(DUELS[0]); startSession(LASTCFG); });
    await ready(); await p.waitForTimeout(700);
    await answer(false); await p.waitForTimeout(900);
    console.log("duel tip rows", await p.$$eval(".fb .tg3 span.c", x => x.length));
    await p.evaluate(() => { document.querySelector("#fb").scrollTop = 520; }); await p.waitForTimeout(300);
    await shot("111-duel-tip");
    await p.evaluate(() => ACT.home()); await p.waitForTimeout(300);
    // 3) Maîtrise : réponses justes en Photo, puis test de transfert sur photo de terrain
    await p.click("[data-act=mode][data-mode=photo]");
    for (let i = 0; i < 6; i++) { await ready(); await p.waitForTimeout(250); await answer(true); await p.click(".fb [data-act=next]"); }
    const rec = await p.evaluate(() => { const r = Object.values(S.sp).find(x => (x.pk || []).length); return r ? { pk: r.pk.length, od: r.od.length, att: S.att.length, m: mastery(r) } : null; });
    console.log("mastery after photos", JSON.stringify(rec));
    console.log("transfer", await p.evaluate(async () => { const t = SES.pool.list[0], r = rec(t); r.pk = [1, 2]; r.fk = []; r.od = [1, 2]; let f = 0; for (let i = 0; i < 6; i++) { const q = await buildQ(SES, { t, stim: "photo" }); if (q && q.stim === "field") f++; } return f; }));
    await p.evaluate(() => ACT.quit()); await p.waitForSelector(".view.result");
    // 4) rétention : journal synthétique
    await p.evaluate(() => { const now = Math.floor(Date.now() / 60000); S.att = []; for (let i = 0; i < 8; i++) { S.att.push([now - 12 * 1440, 2000 + i, 1, "p", 0]); S.att.push([now - 2 * 1440, 2000 + i, i < 6 ? 1 : 0, "p", 0]); } save(true); go("progress"); });
    await p.waitForTimeout(500);
    console.log("retention", await p.evaluate(() => JSON.stringify(retention(7, 30))));
    await p.evaluate(() => { const s = [...document.querySelectorAll(".sec")].find(x => /Mémoire/.test(x.textContent)); s.scrollIntoView(); window.scrollBy(0, -80); }); await p.waitForTimeout(300);
    await shot("112-retention");
    // 5) Sortie : liste, quiz, sur place
    await p.evaluate(() => ACT.home()); await p.waitForTimeout(300);
    await p.click("[data-act=mode][data-mode=sortie]"); await p.waitForSelector(".trow", { timeout: 15000 }); await p.waitForTimeout(500);
    await shot("113-trip");
    console.log("trip rows", await p.$$eval(".trow", x => x.length), await p.textContent(".tsum"));
    await p.click("[data-act=tmap]"); await p.waitForSelector("#pmap .leaflet-tile", { timeout: 10000 }); await p.waitForTimeout(600);
    const pm = await (await p.$("#pmap")).boundingBox(); await p.mouse.click(pm.x + pm.width * .4, pm.y + pm.height * .5); await p.waitForTimeout(300);
    await shot("114-mappick");
    await p.click("[data-act=pmapok]"); await p.waitForSelector(".trow", { timeout: 15000 });
    console.log("trip zone", await p.evaluate(() => JSON.stringify(tripZone())));
    await p.click("[data-act=tquiz]"); await ready(); await p.waitForTimeout(500);
    console.log("trip quiz", await p.evaluate(() => [SES.title, SES.pool.list.length]));
    await answer(true); await p.click(".fb [data-act=next]"); await ready();
    await p.evaluate(() => ACT.quit()); await p.waitForSelector(".view.result");
    await p.evaluate(() => { TRIP.mode = "prep"; go("trip"); }); await p.waitForSelector(".trow", { timeout: 15000 });
    await p.click("[data-act=tfield]"); await p.waitForSelector(".crow");
    await p.click(".crow:nth-child(1)"); await p.click(".crow:nth-child(3)"); await p.fill("#tsearch", "pie"); await p.waitForTimeout(300);
    await shot("115-field");
    await p.click("[data-act=tdone]"); await p.waitForSelector(".view.carnet");
    console.log("observed", await p.$$eval(".ctile", x => x.length), await p.evaluate(() => S.obs.length));
    await shot("116-carnet-observed");
    // 6) Chants : spectrogrammes (Commons), ralenti, fiche avec xeno-canto
    await p.evaluate(() => { S.set.xc = "cle-test"; save(true); ACT.home(); });
    await p.click("[data-act=mode][data-mode=chant]"); await ready();
    await p.waitForSelector("#sonoWrap.has canvas", { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(600);
    console.log("main sono", await p.evaluate(() => [document.querySelector("#sonoWrap").className, SES.q.snd.src || "inat"]));
    await p.click("[data-act=sslow]"); await p.click("#playBtn"); await p.waitForTimeout(700);
    console.log("rate", await p.evaluate(() => [SND.el.playbackRate, SND.el.paused]));
    await shot("117-chant-sono");
    await answer(true); await p.waitForTimeout(800);
    await p.click(".fb .spcard"); await p.waitForSelector(".panel"); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelector("#fsnd").scrollIntoView({ block: "center" })); await p.waitForTimeout(800);
    console.log("fiche sounds", await p.evaluate(() => [FICHE.snds.map(s => s.src + ":" + (s.kind || "-")).join(" | "), document.querySelectorAll("#fsnd canvas.sc").length, document.querySelectorAll("#fsnd img.sc.xc").length]));
    await shot("118-fiche-sons");
    await p.click("[data-act=fkind][data-k=cri]"); await p.waitForTimeout(400);
    console.log("filter cri", await p.$$eval("#fsnd .srow", x => x.length));
    await p.click("#fsnd .srow .pl"); await p.waitForTimeout(600);
    console.log("row playing", await p.evaluate(() => [!!SND.row, SND.el.paused]));
    await p.click("[data-act=close]"); await p.waitForTimeout(300);
    await p.evaluate(() => ACT.home());
    // 7) Confidentialité et sources
    await p.click("[data-act=tab][data-tab=settings]"); await p.waitForTimeout(300);
    await p.click("[data-act=tab][data-tab=about]"); await p.waitForSelector(".view.about");
    await shot("119-about");
    console.log("sources", await p.$$eval(".src", x => x.length));
    await p.evaluate(() => window.scrollTo(0, 99999)); await p.waitForTimeout(200); await shot("119-about-2");
    // 8) Fiche : critères des sosies et maîtrise
    await p.evaluate(async () => { const t = await resolveTaxon("Phylloscopus collybita", "Pouillot véloce"); openFiche(t); });
    await p.waitForSelector(".panel"); await p.waitForTimeout(1200);
    console.log("fiche tips", await p.$$eval(".panel .tip", x => x.length));
  } else if (MODE === "nocommons") {
    // Sans Commons : sons iNaturalist sans CORS → pas de spectrogramme mais lecture OK
    await p.click("[data-act=mode][data-mode=chant]"); await ready(); await p.waitForTimeout(2500);
    console.log("fallback", await p.evaluate(() => [document.querySelector("#sonoWrap").className, !!document.querySelector("#sonoWrap .sono-fallback small")]));
    await shot("120-sono-fallback");
    await p.click("#playBtn"); await p.waitForTimeout(500);
    console.log("plays", await p.evaluate(() => !SND.el.paused));
  }
  console.log("ERR", errs); await b.close();
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
