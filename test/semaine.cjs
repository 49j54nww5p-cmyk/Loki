// Défi de la semaine (mêmes questions pour tous, classement) et sauvegarde en ligne chiffrée, avec la base locale de test.
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const fs = require("fs");
(async () => {
  fs.mkdirSync("test/shots", { recursive: true });
  const b = await chromium.launch();
  const errs = [], fail = m => { throw new Error(m); };
  const mkctx = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await c.route("**/*", handle); return c; };
  const page = async (ctx, name) => { const p = await ctx.newPage(); p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text())); await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home"); await p.evaluate(n => { S.set.net = "local"; S.set.pseudo = n; }, name); return p; };
  const ctx = await mkctx();
  const A = await page(ctx, "Alice");
  await A.evaluate(() => localStorage.removeItem("plumage.netlocal"));

  // 1) Le thème et les questions ne dépendent que de la semaine (on prend une semaine « jardin », jouable avec le faux serveur)
  const wk = await A.evaluate(async () => { for (let w = 1; w <= 52; w++) { const id = `2026-W${String(w).padStart(2, "0")}`; if (weekTheme(id).P.id !== "jardin") continue; try { WEEK.deck = null; WEEK.wk = ""; await weekDeck(id); return id; } catch (e) { /* semaine incomplète avec le faux serveur */ } } return ""; });
  if (!wk) fail("aucune semaine « jardin »");
  await A.evaluate(id => { window.weekId = () => id; }, wk);
  const d1 = await A.evaluate(async () => { WEEK.deck = null; WEEK.wk = ""; return (await weekDeck()).map(d => d.k + d.l).join(); });
  const d2 = await A.evaluate(async () => { WEEK.deck = null; WEEK.wk = ""; return (await weekDeck()).map(d => d.k + d.l).join(); });
  if (!d1 || d1 !== d2) fail("questions de la semaine non reproductibles");
  if (await A.evaluate(() => weekTheme("2026-W10").P.id + weekTheme("2026-W10").steps) !== await A.evaluate(() => weekTheme("2026-W10").P.id + weekTheme("2026-W10").steps)) fail("thème instable");

  // 2) Carte d'accueil → jouer → score envoyé une fois, classement
  await A.evaluate(() => go("home")); await A.waitForSelector(".weekc");
  await A.click(".weekc"); await A.waitForSelector(".view.defi [data-act=wstart]");
  await A.screenshot({ path: "test/shots/w1-week.png" });
  await A.click("[data-act=wstart]");
  for (let i = 0; ; i++) {
    await A.waitForFunction(j => (DEFI.st === "q" && DEFI.i === j && DEFI.rev !== j && document.querySelector("#dans [data-k]")) || DEFI.st === "end", i, { timeout: 20000 });
    if (await A.evaluate(() => DEFI.st === "end")) break;
    const k = await A.evaluate(j => { const q = DEFI.deck[DEFI.i]; return j % 3 ? q.k : q.c.find(c => c[0] !== q.k)[0]; }, i);
    await A.click(`#dans [data-k="${k}"]`);
  }
  await A.waitForFunction(() => document.querySelectorAll("#wrank .toplist li").length === 1, null, { timeout: 10000 });
  await A.screenshot({ path: "test/shots/w2-week-end.png", fullPage: true });
  const s1 = await A.evaluate(id => ({ week: S.week, db: JSON.parse(localStorage.getItem("plumage.netlocal")).weekly[id] }), wk);
  const row = Object.values(s1.db)[0];
  if (!s1.week || s1.week.wk !== wk || !s1.week.sent || Object.keys(row).sort().join() !== "n,p,t" || row.n !== "Alice" || row.p !== s1.week.p) fail("score de la semaine " + JSON.stringify(s1));
  // rejouer : entraînement, le score de la semaine ne bouge pas
  await A.click("[data-act=dquit]"); await A.click(".weekc"); await A.waitForSelector("[data-act=wstart]");
  if (!/entraînement/.test(await A.evaluate(() => document.querySelector("[data-act=wstart]").textContent))) fail("rejouer n'est pas un entraînement");
  await A.click("[data-act=wstart]");
  for (let i = 0; ; i++) {
    await A.waitForFunction(j => (DEFI.st === "q" && DEFI.i === j && DEFI.rev !== j && document.querySelector("#dans [data-k]")) || DEFI.st === "end", i, { timeout: 20000 });
    if (await A.evaluate(() => DEFI.st === "end")) break;
    await A.click(`#dans [data-k="${await A.evaluate(() => DEFI.deck[DEFI.i].k)}"]`);
  }
  const s2 = await A.evaluate(id => ({ p: S.week.p, rows: Object.keys(JSON.parse(localStorage.getItem("plumage.netlocal")).weekly[id]).length }), wk);
  if (s2.p !== s1.week.p || s2.rows !== 1) fail("l'entraînement a changé le score " + JSON.stringify(s2));
  // défier un ami sur ces photos
  await A.click("[data-act=wshare]");
  await A.waitForFunction(() => /#defi=/.test(DEFI.link || ""), null, { timeout: 8000 });
  const back = await A.evaluate(async () => { const r = defiParse(JSON.parse(await unpackZ(DEFI.link.split("#defi=")[1]))); return r && r.deck.map(d => d.k).join() === DEFI.deck.map(d => d.k).join(); });
  if (!back) fail("défi depuis la semaine");

  // 3) Sauvegarde en ligne : activer, rien de lisible sur le serveur, récupérer sur un autre « téléphone »
  await A.evaluate(() => { S.xp = 4321; S.set.xc = "CLE-SECRETE"; save(true); go("settings"); });
  await A.evaluate(() => closeLayer());
  await A.click("[data-act=cloudon]"); await A.waitForSelector(".panel.cloudp .ccode");
  await A.screenshot({ path: "test/shots/w3-cloud.png" });
  const code = await A.evaluate(() => S.cloud.code);
  if (!/^[A-Z2-9]{16}$/.test(code)) fail("code " + code);
  const db = await A.evaluate(() => localStorage.getItem("plumage.netlocal"));
  const saves = JSON.parse(db).saves, entry = Object.values(saves || {})[0];
  if (!entry || Object.keys(saves).length !== 1 || Object.keys(saves)[0].length !== 43 || /Rougegorge|Alice|4321|CLE-SECRETE|sp|xp/i.test(entry.d.slice(0, 0) + JSON.stringify(entry).replace(entry.d, "")) || /Rougegorge|Alice|CLE-SECRETE/.test(atob(entry.d.replace(/-/g, "+").replace(/_/g, "/")))) fail("sauvegarde lisible sur le serveur");
  const ctx2 = await mkctx();
  const B = await page(ctx2, "");
  await B.evaluate(d => { localStorage.setItem("plumage.netlocal", d); S.set.xc = "AUTRE-CLE"; save(true); go("settings"); }, db);
  await B.click("[data-act=cloudrest]"); await B.waitForSelector("#ccin");
  await B.fill("#ccin", "ABCD-EFGH-JKLM-NPQR"); await B.click("#crest button[type=submit]");
  await B.waitForTimeout(1500);
  if (await B.evaluate(() => S.xp === 4321)) fail("mauvais code accepté");
  await B.fill("#ccin", code.toLowerCase().replace(/(.{4})/g, "$1 ")); await B.click("#crest button[type=submit]");
  await B.waitForFunction(() => S.xp === 4321, null, { timeout: 15000 });
  const rb = await B.evaluate(() => ({ xc: S.set.xc, code: S.cloud?.code, pseudo: S.set.pseudo, week: S.week?.wk }));
  if (rb.xc !== "AUTRE-CLE" || rb.code !== code || rb.pseudo !== "Alice" || rb.week !== wk) fail("restauration " + JSON.stringify(rb));
  // supprimer
  await A.click("[data-act=cloudoff]");
  await A.waitForFunction(() => !S.cloud);
  if (await A.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("plumage.netlocal") || "{}").saves || {}).length)) fail("sauvegarde non supprimée");

  console.log("semaine : thème", wk, "reproductible, score envoyé une fois, entraînement, défi ami ; sauvegarde chiffrée, mauvais code refusé, restauration ok");
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
