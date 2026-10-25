// Boîte à idées : sans serveur le message attend sur le téléphone, puis part (base locale de test) ; rien de lisible pour les autres.
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route("**/*", handle);
  const p = await ctx.newPage(); const errs = [], fail = m => { throw new Error(m); };
  p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
  await p.evaluate(() => { localStorage.removeItem("plumage.netlocal"); go("settings"); });
  // 1) sans serveur : gardé en attente
  await p.click("[data-act=ideas]"); await p.waitForSelector("#ideaf");
  await p.click("[data-act=idk][data-v=oiseau]");
  await p.fill("#idtxt", "Le <b>Pouillot</b> véloce a une photo de fitis"); await p.fill("#idctc", "Piaf33");
  await p.screenshot({ path: "test/shots/i1-idees.png" });
  await p.click("#ideaf button[type=submit]");
  await p.waitForFunction(() => (S.ideas || []).length === 1);
  const a = await p.evaluate(() => S.ideas[0]);
  if (a.sent || a.k !== "oiseau" || a.c !== "Piaf33" || /<b>/.test(a.txt)) fail("attente " + JSON.stringify(a));
  // 2) serveur branché : envoyé, avec seulement type, texte, contact, version, date
  await p.evaluate(() => { S.set.net = "local"; });
  await p.evaluate(() => ideaFlush());
  const db = await p.evaluate(() => JSON.parse(localStorage.getItem("plumage.netlocal") || "{}").ideas || {});
  const row = Object.values(db)[0];
  if (Object.keys(db).length !== 1 || Object.keys(row).sort().join() !== "c,k,t,txt,v" || !(await p.evaluate(() => S.ideas[0].sent))) fail("envoi " + JSON.stringify(db));
  // 3) message trop court refusé, panneau des derniers envois
  await p.click("[data-act=ideas]"); await p.waitForSelector("#ideaf .btn");
  await p.fill("#idtxt", "a"); await p.click("#ideaf button[type=submit]");
  if ((await p.evaluate(() => S.ideas.length)) !== 1) fail("message vide accepté");
  if (!(await p.$(".idmine div"))) fail("derniers envois absents");
  // 4) depuis la fenêtre des nouveautés
  await p.evaluate(() => { closeLayer(); openNews(true); }); await p.click(".panel.news [data-act=ideas]"); await p.waitForSelector("#ideaf");
  console.log("idées : attente hors serveur, envoi, contenu limité, garde-fous ok");
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
