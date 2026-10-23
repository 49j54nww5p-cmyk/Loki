const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home"); await p.waitForTimeout(1200);
  await p.screenshot({ path: "test/shots/70-home-tiles.png", fullPage: true });
  await p.click("[data-act=mode][data-mode=ecrire]");
  for (let i = 0; i < 3; i++) {
    await p.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector("#ans"));
    const fr = await p.evaluate(() => SES.q.t.fr);
    const part = fr.split(" ")[0].slice(0, 5).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    await p.fill("#ans", part); await p.dispatchEvent("#ans", "input"); await p.waitForTimeout(700);
    if (i === 0) await p.screenshot({ path: "test/shots/71-sugg.png" });
    const n = await p.$$eval(".sitem", x => x.length);
    console.log("q", i, fr, "typed", part, "suggestions", n);
    const btn = await p.$(`.sitem[data-k="s${await p.evaluate(() => SES.q.t.id)}"]`);
    if (btn) await btn.click(); else await p.click(".sitem");
    await p.waitForSelector(".fb.show"); if (i === 0) await p.screenshot({ path: "test/shots/72-sugg-fb.png" });
    await p.click(".fb [data-act=next]");
  }
  console.log("ERR", errs); await b.close();
})();
