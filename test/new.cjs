const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home"); await p.waitForTimeout(1200);
  await p.screenshot({ path: "test/shots/70-home-tiles.png", fullPage: true });
  const ready = () => p.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector(".view.quiz"), null, { timeout: 20000 });
  await p.click("[data-act=mode][data-mode=ecrire]");
  for (let i = 0; i < 2; i++) {
    await ready();
    const fr = await p.evaluate(() => SES.q.t.fr);
    const part = fr.split(" ")[0].slice(0, 5).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    await p.fill("#ans", part); await p.waitForTimeout(800);
    if (i === 0) await p.screenshot({ path: "test/shots/71-sugg.png" });
    console.log("ecrire", fr, part, await p.$$eval(".sitem", x => x.length));
    const id = await p.evaluate(() => SES.q.t.id);
    const btn = await p.$(`.sitem[data-k="s${id}"]`); await (btn || await p.$(".sitem")).click();
    await p.waitForSelector(".fb.show"); if (i === 0) await p.screenshot({ path: "test/shots/72-sugg-fb.png" });
    await p.click(".fb [data-act=next]");
  }
  await p.evaluate(() => ACT.home());
  await p.click("[data-act=mode][data-mode=geo]");
  for (let i = 0; i < 2; i++) {
    await ready(); await p.waitForTimeout(1500);
    if (i === 0) await p.screenshot({ path: "test/shots/73-geo.png" });
    const box = await (await p.$("#gmap")).boundingBox();
    await p.mouse.click(box.x + box.width * .52, box.y + box.height * .35);
    await p.waitForTimeout(300); await p.click("#gok");
    await p.waitForSelector(".fb.show"); await p.waitForTimeout(1200);
    if (i === 0) await p.screenshot({ path: "test/shots/74-geo-fb.png" });
    console.log("geo", await p.evaluate(() => SES.results.at(-1)));
    await p.click(".fb [data-act=next]");
  }
  console.log("ERR", errs); await b.close();
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
