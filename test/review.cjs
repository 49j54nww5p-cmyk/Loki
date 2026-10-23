// Tests des ajouts : fiche d'apprentissage, dernière partie, progrès, carnet, médias en échec, Géo de secours
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const MODE = process.argv[2] || "main";
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/404|ERR_FAILED/.test(m.text()) && errs.push(m.text()));
  const ready = () => p.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector(".view.quiz"), null, { timeout: 25000 });
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
  if (MODE === "main") {
    await p.evaluate(() => { S.set.inat = "moi"; save(true); });
    await p.click("[data-act=mode][data-mode=photo]");
    for (let i = 0; i < 4; i++) {
      await ready(); await p.waitForTimeout(600);
      const k = await p.evaluate(() => SES.q.answerKey), keys = await p.evaluate(() => SES.q.choices.map(c => c.key));
      await p.click(`#answers [data-k="${i % 2 ? keys.find(x => x !== k) : k}"]`);
      await p.waitForSelector(".fb.show"); await p.waitForTimeout(1500);
      if (i < 2) await p.screenshot({ path: `test/shots/80-learn-${i}.png` });
      if (i === 1) { await p.evaluate(() => { document.querySelector("#fb").scrollTop = 9999; }); await p.waitForTimeout(300); await p.screenshot({ path: "test/shots/80-learn-scroll.png" }); }
      await p.click(".fb [data-act=next]");
    }
    await p.evaluate(() => ACT.quit()); await p.waitForSelector(".view.result");
    await p.evaluate(() => ACT.home()); await p.waitForTimeout(1200);
    await p.screenshot({ path: "test/shots/81-home-last.png" });
    await p.click("[data-act=tab][data-tab=progress]"); await p.waitForTimeout(400);
    await p.screenshot({ path: "test/shots/82-progress.png", fullPage: true });
    await p.click("[data-act=tab][data-tab=carnet]"); await p.waitForTimeout(1200);
    await p.screenshot({ path: "test/shots/83-carnet.png" });
    const csv = await p.evaluate(() => carnetCsv()); console.log("CSV lines", csv.split("\r\n").length, csv.split("\r\n")[1]);
    await p.click(".ctile"); await p.waitForSelector(".panel"); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelector(".panel").scrollTop = 560; }); await p.waitForTimeout(300);
    await p.screenshot({ path: "test/shots/84-fiche-hist.png" });
    await p.evaluate(() => { const h = document.querySelector("#fwiki"); h.scrollIntoView(); }); await p.waitForTimeout(300);
    await p.screenshot({ path: "test/shots/85-fiche-ident.png" });
    await p.click("[data-act=close]");
    await p.click("[data-act=tab][data-tab=settings]"); await p.waitForTimeout(300);
    await p.screenshot({ path: "test/shots/86-settings.png", fullPage: true });
    await p.click("[data-act=set][data-k=goal][data-v='50']");
    console.log("goal", await p.evaluate(() => S.set.goal), "hist", await p.evaluate(() => S.hist.length));
    await p.evaluate(() => ACT.home()); await p.click("[data-act=histplay]"); await ready(); console.log("replay ok", await p.evaluate(() => SES.title));
  } else if (MODE === "badimg") {
    await p.click("[data-act=mode][data-mode=photo]");
    let replaced = 0;
    for (let i = 0; i < 6; i++) {
      await ready(); await p.waitForTimeout(1200);
      if (await p.$(".mfail")) { if (!replaced) await p.screenshot({ path: "test/shots/87-mediafail.png" }); replaced++; await p.click("[data-act=replaceq]"); continue; }
      const k = await p.evaluate(() => SES.q.answerKey); await p.click(`#answers [data-k="${k}"]`); await p.waitForSelector(".fb.show"); await p.click(".fb [data-act=next]");
    }
    console.log("replaced", replaced, "results", await p.evaluate(() => SES.results.length));
  } else if (MODE === "nocdn") {
    await p.click("[data-act=mode][data-mode=geo]");
    await ready(); await p.waitForTimeout(800);
    console.log("geo format", await p.evaluate(() => SES.q.format));
    await p.screenshot({ path: "test/shots/88-geo-fallback.png" });
    const k = await p.evaluate(() => SES.q.answerKey); await p.click(`#answers [data-k="${k}"]`); await p.waitForSelector(".fb.show"); await p.waitForTimeout(400);
    await p.screenshot({ path: "test/shots/89-geo-fallback-fb.png" });
  }
  console.log("ERR", errs); await b.close();
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
