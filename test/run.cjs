// Parcours complet de l'appli dans Chromium avec l'API simulée
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { handle } = require("./mock.cjs");

const OUT = path.join(__dirname, "shots");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.argv[2] || "all";

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "fr-FR", isMobile: true, hasTouch: true, timezoneId: "Europe/Paris" });
  await ctx.route("**/*", handle);
  const page = await ctx.newPage();
  const errors = [], log = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message + "\n" + (e.stack || "").split("\n").slice(0, 3).join("\n")));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
  const shot = async (name, full) => { await page.screenshot({ path: path.join(OUT, name + ".png"), fullPage: !!full }); log.push("shot " + name); };
  const wait = ms => page.waitForTimeout(ms);
  const qinfo = () => page.evaluate(() => { const q = SES && SES.q; if (!q) return null; return { kind: q.kind, stim: q.stim, format: q.format, level: q.level, key: q.answerKey, keys: (q.choices || []).map(c => c.key), done: q.done, typed: q.kind === "taxon" ? typedTargets(q)[0] : "" }; });
  const waitQ = () => page.waitForFunction(() => typeof SES !== "undefined" && SES && SES.q && !SES.q.done && document.querySelector(".view.quiz"), null, { timeout: 20000 });
  async function answer(info, good) {
    if (info.format === "type") {
      await page.fill("#ans", good ? info.typed : "zzz");
      await page.press("#ans", "Enter");
    } else if (info.format === "flash") {
      await page.click("[data-act=reveal]");
      await wait(200);
      await page.click(`[data-act=self][data-v="${good ? 1 : 0}"]`);
    } else {
      const k = good ? info.key : (info.keys.find(x => x !== info.key) || info.key);
      await page.click(`#answers [data-act=pick][data-k="${k}"]`);
    }
    await page.waitForSelector(".fb.show", { timeout: 8000 });
  }
  async function home() { await page.evaluate(() => ACT.home()); await page.waitForSelector(".view.home"); }
  async function play(n, prefix, shotsN = 1, goodPattern = i => i % 3 !== 1) {
    for (let i = 0; i < n; i++) {
      await waitQ();
      await wait(900);
      const info = await qinfo();
      log.push(`${prefix} q${i}: ${info.kind}/${info.stim}/${info.format}/${info.level}`);
      if (i < shotsN) await shot(`${prefix}-q${i}-${info.stim || info.kind}-${info.format}`);
      await answer(info, goodPattern(i));
      await wait(500);
      if (i < shotsN) await shot(`${prefix}-fb${i}`);
      const last = await page.evaluate(() => /bilan/i.test(document.querySelector(".fb [data-act=next]").textContent));
      await page.click(".fb [data-act=next]");
      if (last) break;
    }
  }

  await page.goto("https://plumage.test/");
  await page.waitForSelector(".view.home");
  await wait(1800);
  await shot("01-home");
  await shot("01-home-full", true);

  if (ONLY === "all" || ONLY === "serie") {
    await page.click("[data-act=daily]");
    await play(14, "02-serie", 6);
    await page.waitForSelector(".view.result", { timeout: 10000 });
    await wait(1600);
    await shot("03-result");
    await shot("03-result-full", true);
  }
  const modes = ONLY === "all" ? ["chant", "latin", "famille", "racines", "photo", "ecrire"] : ONLY === "serie" ? [] : [ONLY];
  for (const m of modes) {
    if (!["chant", "latin", "famille", "racines", "photo", "ecrire"].includes(m)) continue;
    await home();
    await page.click(`[data-act=mode][data-mode=${m}]`);
    await play(3, "10-" + m, m === "chant" ? 2 : 1);
    await page.evaluate(() => { if (SES && !SES.ended) ACT.quit(); });
    await wait(400);
  }
  if (ONLY === "all" || ONLY === "duel") {
    await home();
    await page.click("[data-act=mode][data-mode=duel]");
    await page.waitForSelector(".panel");
    await wait(400);
    await shot("20-duel-picker");
    await page.click("[data-act=duelgo][data-i='0']");
    await play(8, "21-duel", 1, i => i % 2 === 0);
    await page.waitForSelector(".view.result", { timeout: 10000 });
    await wait(800);
    await shot("22-duel-result");
  }
  if (ONLY === "all" || ONLY === "builder") {
    await home();
    await page.click("[data-act=mode][data-mode=perso]");
    await page.waitForSelector(".view.builder");
    await shot("30-builder", true);
    await page.click("[data-act=bguild][data-g='Limicoles']");
    await page.click("[data-act=b][data-f=stim][data-v=la]");
    await page.click("[data-act=b][data-f=stim][data-v=photo]");
    await page.click("[data-act=b][data-f=format][data-v=type]");
    await page.click("[data-act=b][data-f=len][data-v='5']");
    await shot("31-builder-set", true);
    await page.click("[data-act=blaunch]");
    await play(5, "32-type", 2);
    await page.waitForSelector(".view.result", { timeout: 10000 });
    await home();
    await page.click("[data-act=mode][data-mode=perso]");
    await page.click("[data-act=ball]");
    await page.click("[data-act=b][data-f=format][data-v=flash]");
    await page.click("[data-act=b][data-f=target][data-v=family]");
    await page.click("[data-act=b][data-f=stim][data-v=photo]");
    await page.click("[data-act=b][data-f=stim][data-v=la]");
    await page.click("[data-act=b][data-f=timer][data-v='10']");
    await page.click("[data-act=blaunch]");
    await play(2, "33-flash", 1);
    await page.evaluate(() => { if (SES && !SES.ended) ACT.quit(); });
    await home();
    await page.click("[data-act=mode][data-mode=perso]");
    await page.click("[data-act=b][data-f=format][data-v=qcm]");
    await page.click("[data-act=b][data-f=stim][data-v=soncho]");
    await page.click("[data-act=b][data-f=stim][data-v=photo]");
    await page.click("[data-act=b][data-f=target][data-v=species]");
    await page.click("[data-act=b][data-f=timer][data-v='0']");
    await page.click("[data-act=blaunch]");
    await waitQ(); await wait(800);
    await shot("34-soncho");
    const info = await qinfo();
    log.push("soncho: " + JSON.stringify(info));
    if (info.format === "audio") { await page.click(".achoice [data-act=aplay]"); await wait(500); await shot("34-soncho-play"); }
    await answer(info, true);
    await wait(400);
    await shot("34-soncho-fb");
    await page.evaluate(() => { if (SES && !SES.ended) ACT.quit(); });
  }
  if (ONLY === "all" || ONLY === "pages") {
    await home();
    await page.click("[data-act=tab][data-tab=carnet]");
    await page.waitForSelector(".view.carnet");
    await wait(600);
    await shot("40-carnet", true);
    const tile = await page.$(".ctile");
    if (tile) {
      await tile.click();
      await page.waitForSelector(".panel");
      await wait(1800);
      await shot("41-fiche");
      await page.evaluate(() => { document.querySelector(".panel").scrollTop = 620; });
      await wait(500);
      await shot("42-fiche-2");
      await page.evaluate(() => { document.querySelector(".panel").scrollTop = 1400; });
      await wait(500);
      await shot("43-fiche-3");
      await page.click("[data-act=close]");
    }
    await page.click("[data-act=tab][data-tab=progress]");
    await page.waitForSelector(".view.progress");
    await wait(500);
    await shot("50-progress", true);
    await page.click("[data-act=tab][data-tab=settings]");
    await page.waitForSelector(".view.settings");
    await shot("60-settings", true);
    await page.click("[data-act=szone][data-z=search]");
    await page.waitForSelector("#psearch");
    await page.fill("#psearch", "Gir");
    await wait(900);
    await shot("61-place");
    await page.click("[data-act=placepick]");
    await wait(300);
    await shot("62-settings-zone");
    await home();
    await wait(1500);
    await shot("63-home-after");
  }
  const state = await page.evaluate(() => ({ xp: S.xp, sp: Object.keys(S.sp).length, streak: S.streak, badges: Object.keys(S.badges), due: dueList().length, conf: topConfusions(3), stats: S.stats }));
  fs.writeFileSync(path.join(OUT, "log.txt"), log.join("\n") + "\n\nSTATE " + JSON.stringify(state, null, 1) + "\n\nERRORS\n" + errors.join("\n"));
  console.log(log.slice(-40).join("\n"));
  console.log("STATE", JSON.stringify(state));
  console.log("ERRORS", errors.length ? "\n" + errors.join("\n") : "none");
  await browser.close();
})().catch(e => { console.error("TEST CRASH", e); process.exit(1); });
