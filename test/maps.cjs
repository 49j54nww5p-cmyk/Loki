// Cartes (fonds, îles, plein écran), cadrage des photos et visionneuse HD
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const MODE = process.argv[2] || "main";
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/404|ERR_FAILED|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  const ready = () => p.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector(".view.quiz"), null, { timeout: 25000 });
  const shot = n => p.screenshot({ path: `test/shots/${n}.png` });
  p.on("framenavigated", f => { if (f === p.mainFrame()) console.log("NAV", f.url()); });
  p.on("crash", () => console.log("PAGE CRASHED"));
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
  if (MODE === "main") {
    await p.click("[data-act=mode][data-mode=geo]");
    await ready(); await p.waitForTimeout(1800);
    await shot("90-geo-relief");
    console.log("strip", await p.$$eval("#gstrip figure", fs => fs.map(f => Math.round(f.getBoundingClientRect().width) + "x" + Math.round(f.getBoundingClientRect().height) + (f.classList.contains("ld") ? "!" : ""))));
    console.log("layers", await p.evaluate(() => GMAP._plum.map(l => l._url.split("/").slice(2, 8).join("/"))));
    await p.click("[data-act=mapmenu]"); await p.waitForTimeout(600);
    await shot("91-geo-menu");
    for (const s of ["sat", "topo", "ocean", "nuit"]) {
      if (await p.$("#mmenu[hidden]")) await p.click("[data-act=mapmenu]");
      await p.click(`#mmenu [data-act=mapset][data-s=${s}]`); await p.waitForTimeout(700);
      await shot("92-geo-" + s);
    }
    await p.click("[data-act=mapmenu]"); await p.click("#mmenu [data-act=mapset][data-s=relief]"); await p.waitForTimeout(300);
    console.log("style saved", await p.evaluate(() => S.set.mapst));
    await p.evaluate(() => { GMAP.setView([28.4, -15.8], 4, { animate: false }); }); await p.waitForTimeout(900);
    await shot("93-geo-islands");
    console.log("rings", await p.evaluate(() => GMAP._isl.filter(m => GMAP.hasLayer(m)).length));
    const pt = await p.evaluate(() => { const pp = GMAP.latLngToContainerPoint([28.27, -16.6]); const r = GMAP.getContainer().getBoundingClientRect(); return [r.left + pp.x, r.top + pp.y]; });
    await p.mouse.click(pt[0] + 5, pt[1] + 4); await p.waitForTimeout(300);
    console.log("pin", JSON.stringify(await p.evaluate(() => [SES.q.guess, SES.q.guessName, document.querySelector("#gok").textContent])));
    await p.evaluate(() => { GMAP.setView([22, 8], 1, { animate: false }); }); await p.waitForTimeout(500);
    await p.click("[data-act=mapfull]"); await p.waitForTimeout(700);
    await shot("94-geo-full");
    await p.click(".gthumbs button:nth-child(2)"); await p.waitForSelector(".viewer.on"); await p.waitForTimeout(1000);
    await shot("95-viewer-geo");
    console.log("viewer", JSON.stringify(await p.evaluate(() => [VW.i, VW.items.length, document.querySelector("#vwImg").src.split("/").slice(-2).join("/"), document.querySelector(".viewer").className])));
    // glisser vers la gauche → photo suivante
    const vb = await (await p.$("#vwStage")).boundingBox(), cx = vb.x + vb.width / 2, cy = vb.y + vb.height / 2;
    await p.mouse.move(cx + 120, cy); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(cx + 120 - i * 25, cy); await p.mouse.up(); await p.waitForTimeout(500);
    console.log("after swipe", await p.evaluate(() => VW && VW.i));
    await p.click("[data-act=vclose]"); await p.waitForTimeout(400);
    await p.click("[data-act=mapfull]"); await p.waitForTimeout(400);
    await p.click("#gok"); await p.waitForSelector(".fb.show"); await p.waitForTimeout(1300);
    await shot("96-geo-fb");
    await p.click(".gsp button:nth-child(1)"); await p.waitForSelector(".viewer.on"); await p.waitForTimeout(800);
    await shot("97-viewer-names");
    await p.click("[data-act=vfiche]"); await p.waitForSelector(".panel"); await p.waitForTimeout(1500);
    await shot("98-fiche-from-geo");
    await p.click("#gal figure"); await p.waitForSelector(".viewer.on"); await p.waitForTimeout(800);
    const vb2 = await (await p.$("#vwStage")).boundingBox(), c2 = [vb2.x + vb2.width / 2, vb2.y + vb2.height / 2];
    await p.mouse.click(c2[0], c2[1] - 40); await p.waitForTimeout(90); await p.mouse.click(c2[0], c2[1] - 40); await p.waitForTimeout(500);
    console.log("double tap zoom", await p.evaluate(() => VW && VW.s));
    await shot("99-viewer-zoom");
    await p.keyboard.press("Escape"); await p.waitForTimeout(300);
    console.log("viewer closed", await p.evaluate(() => !VW && !document.querySelector(".viewer")));
    await p.evaluate(() => { document.querySelector(".panel").scrollTop = 900; }); await p.waitForTimeout(500);
    await shot("100-fiche-map");
    console.log("mapcap", await p.textContent("#mapcap"));
    await p.click("[data-act=close]"); await p.click(".fb [data-act=next]");
    await ready(); await p.waitForTimeout(800);
    await p.evaluate(() => ACT.home());
    // Photo : tap → HD, glisser vers le bas pour fermer
    await p.click("[data-act=mode][data-mode=photo]");
    await ready(); await p.waitForSelector(".shot.loaded"); await p.waitForTimeout(700);
    await shot("101-photo");
    await p.click("#shot"); await p.waitForSelector(".viewer.on"); await p.waitForTimeout(900);
    await shot("102-photo-hd");
    console.log("hd", await p.evaluate(() => [document.querySelector("#vwImg").src.split("/").slice(-2).join("/"), document.querySelector(".viewer").classList.contains("hd")]));
    const vb3 = await (await p.$("#vwStage")).boundingBox(), c3 = [vb3.x + vb3.width / 2, vb3.y + vb3.height / 2];
    await p.mouse.move(c3[0], c3[1]); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(c3[0], c3[1] + i * 22); await p.mouse.up(); await p.waitForTimeout(400);
    console.log("swipe-down closed", await p.evaluate(() => !VW));
    const k = await p.evaluate(() => SES.q.answerKey), keys = await p.evaluate(() => SES.q.choices.map(c => c.key));
    await p.click(`#answers [data-k="${keys.find(x => x !== k)}"]`); await p.waitForSelector(".fb.show"); await p.waitForTimeout(1200);
    await shot("103-compare");
    await p.evaluate(() => ACT.home());
    // Vignettes : cadrage adaptatif
    await p.evaluate(() => { LASTCFG = { ...baseCfg(), format: "tiles", title: "Vignettes" }; startSession(LASTCFG); });
    await ready(); await p.waitForTimeout(1500);
    await shot("104-tiles");
    console.log("tiles fit", await p.$$eval(".tchoice", ts => ts.map(t => t.classList.contains("fitc") ? "C" : "c").join("")));
    await p.evaluate(() => ACT.home());
    await p.click("[data-act=tab][data-tab=settings]"); await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelector(".mst").scrollIntoView({ block: "center" })); await p.waitForTimeout(400);
    await shot("105-settings-maps");
  } else if (MODE === "nogibs" || MODE === "notiles") {
    await p.click("[data-act=mode][data-mode=geo]");
    await ready(); await p.waitForTimeout(4500);
    console.log(MODE, JSON.stringify(await p.evaluate(() => [GMAP._plumSt, GMAP._plum.map(l => l._url.split("/").slice(2, 7).join("/")), document.querySelector("#toast").hidden ? "" : document.querySelector("#toast").textContent])));
    await shot("106-" + MODE);
  }
  console.log("ERR", errs); await b.close();
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
