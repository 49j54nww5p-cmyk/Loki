// Duel en direct et classement, joués entre plusieurs onglets avec la base locale de test (S.set.net = "local").
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const fs = require("fs");
const D = "test/shots/";
(async () => {
  fs.mkdirSync(D, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle);
  const errs = [], fail = m => { throw new Error(m); };
  const mk = async (name, hash = "") => {
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(name + " PAGE " + e.message));
    p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(name + " " + m.text()));
    await p.addInitScript(n => { window.__pseudo = n; }, name);
    await p.goto("https://plumage.test/" + hash);
    await p.waitForSelector(".view");
    await p.evaluate(n => { S.set.net = "local"; S.set.pseudo = n; }, name);
    return p;
  };
  const A = await mk("Alice");
  await A.evaluate(() => localStorage.removeItem("plumage.netlocal"));
  const B = await mk("Bob");
  const inQ = (p, i) => p.waitForFunction(j => LIVE.st === "q" && LIVE.i === j && document.querySelector("#lans"), i, { timeout: 30000 });

  // 1) Alice crée, Bob rejoint avec le code
  await A.click("[data-act=mode][data-mode=duel]"); await A.waitForSelector(".livecta");
  await A.click(".livecta"); await A.waitForSelector(".view.live");
  await A.click("[data-act=lcreate]"); await A.waitForSelector(".lcode");
  const code = await A.evaluate(() => LIVE.code);
  if (!/^[A-Z0-9]{5}$/.test(code)) fail("code " + code);
  await B.evaluate(c => { LIVE.joinCode = c; go("live"); }, code);
  await B.waitForSelector("#lcode"); await B.click("#ljoin button[type=submit]");
  await A.waitForSelector("[data-act=llaunch]", { timeout: 10000 });
  await A.screenshot({ path: D + "95-live-ready.png" });
  await A.click("[data-act=llaunch]");

  // 2) Dix questions : Alice répond juste, Bob une fois sur trois
  for (let i = 0; i < 10; i++) {
    await inQ(A, i); await inQ(B, i);
    const k = await A.evaluate(() => liveQ().k);
    await A.click(`#lans [data-k="${k}"]`);
    const wrong = await B.evaluate(() => liveQ().c.map(c => c[0]).find(x => x !== liveQ().k));
    await B.waitForTimeout(200);
    await B.click(`#lans [data-k="${i % 3 === 0 ? k : wrong}"]`);
    await A.waitForFunction(j => LIVE.rev === j, i, { timeout: 10000 });
    await B.waitForFunction(j => LIVE.rev === j, i, { timeout: 10000 });
    if (i === 1) {
      await B.waitForTimeout(250); await B.screenshot({ path: D + "96-live-reveal.png" });
      const cls = await B.evaluate(k => [...document.querySelectorAll("#lans .choice")].map(e => (e.dataset.k === k ? "ok:" : "") + e.className).join(" | "), k);
      if (!/ok:choice ok/.test(cls) || !/choice[a-z ]* bad/.test(cls)) fail("révélation : " + cls);
    }
  }
  await A.waitForFunction(() => LIVE.st === "end", null, { timeout: 15000 }); await B.waitForFunction(() => LIVE.st === "end", null, { timeout: 15000 });
  await A.waitForTimeout(500); await A.screenshot({ path: D + "97-live-end.png" });
  const sc = await A.evaluate(() => { const s = liveScores(LIVE.room, 99); return { okh: s.okh, okg: s.okg, win: s.host > s.guest, xp: S.xp, games: S.counts?.livegames ?? null }; });
  if (sc.okh !== 10 || sc.okg !== 4 || !sc.win) fail("scores " + JSON.stringify(sc));
  const endTxt = await B.evaluate(() => document.querySelector(".lend h2").textContent);
  if (!/Alice gagne/.test(endTxt)) fail("fin côté Bob : " + endTxt);

  // 3) Revanche, puis Bob part en pleine partie : Alice revient à l'attente, même code
  await A.click("[data-act=llaunch]");
  await inQ(A, 0); await inQ(B, 0);
  await B.click("[data-act=lleave]");
  await A.waitForFunction(() => LIVE.st === "wait" && /Bob est parti/.test(LIVE.err), null, { timeout: 8000 });
  await A.waitForTimeout(300); await A.screenshot({ path: D + "98-live-left.png" });

  // 4) Carla arrive par le lien d'invitation (#duel=CODE) et rejoue ; Alice part : Carla est prévenue
  const C = await mk("Carla", "#duel=" + code);
  await C.waitForSelector("#lcode");
  if ((await C.inputValue("#lcode")) !== code) fail("code non prérempli");
  await C.click("#ljoin button[type=submit]");
  await A.waitForFunction(() => !!LIVE.room?.guest && LIVE.err === "", null, { timeout: 8000 });
  await A.click("[data-act=llaunch]");
  await inQ(A, 0); await inQ(C, 0);
  await A.click("[data-act=lleave]");
  await C.waitForFunction(() => LIVE.st === "gone", null, { timeout: 8000 });
  const gone = await C.evaluate(() => document.querySelector(".view.live .lcard p").textContent);
  if (!/Alice a quitté/.test(gone)) fail("départ de l'hôte : " + gone);
  if (await A.evaluate(c => JSON.parse(localStorage.getItem("plumage.netlocal") || "{}")?.duels?.[c] ?? null, code)) fail("salle non effacée");

  // 5) Classement : rien n'est publié sans accord, puis pseudo + XP seulement
  await A.evaluate(() => { S.xp = 1234; go("top"); });
  await A.waitForTimeout(500);
  if (await A.evaluate(() => JSON.parse(localStorage.getItem("plumage.netlocal") || "{}")?.top)) fail("XP publié sans accord");
  await A.click("[data-act=topon]");
  await A.waitForFunction(() => document.querySelectorAll(".toplist li").length === 1, null, { timeout: 8000 });
  const row = await A.evaluate(() => Object.values(JSON.parse(localStorage.getItem("plumage.netlocal")).top)[0]);
  if (Object.keys(row).sort().join() !== "n,t,xp" || row.n !== "Alice" || row.xp !== 1234) fail("ligne publiée " + JSON.stringify(row));
  await A.screenshot({ path: D + "99-top.png" });
  await A.click("[data-act=topon]"); await A.waitForTimeout(400);
  if (await A.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("plumage.netlocal") || "{}")?.top || {}).length)) fail("XP non retiré");

  console.log("live : duel, revanche, départs et classement ok", JSON.stringify(sc));
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
