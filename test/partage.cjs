// Sur mesure : recettes, réglages repliés ; partage d'un quiz par lien et QR code ; lien reçu (y compris piégé).
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const fs = require("fs");
(async () => {
  fs.mkdirSync("test/shots", { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
  await ctx.route("**/*", handle);
  const errs = [], fail = m => { throw new Error(m); };
  const page = async (url = "https://plumage.test/") => { const p = await ctx.newPage(); p.on("pageerror", e => errs.push("PAGE " + e.message)); p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text())); await p.goto(url); await p.waitForSelector(".view"); return p; };
  const p = await page();
  const ready = pg => pg.waitForFunction(() => SES && SES.q && !SES.q.done && document.querySelector(".view.quiz"), null, { timeout: 20000 });

  // 1) Sur mesure : recettes en haut, réglages repliés
  await p.click("[data-act=mode][data-mode=perso]"); await p.waitForSelector(".view.builder .recipes");
  const n = await p.evaluate(() => document.querySelectorAll(".recipe").length);
  if (n < 8) fail("recettes " + n);
  if (await p.evaluate(() => document.querySelector("details.bset").open)) fail("réglages ouverts par défaut");
  await p.screenshot({ path: "test/shots/p1-builder.png", fullPage: true });
  await p.click("details.bset > summary");
  if (!(await p.evaluate(() => document.querySelector("details.bset").open && S.pv.bset === true))) fail("réglages : ouverture non retenue");
  await p.click("details.bset > summary");

  // 2) Une recette : un geste, un quiz
  await p.click("[data-act=recipe][data-r=jardin]");
  await ready(p);
  const rc = await p.evaluate(() => ({ t: SES.cfg.title, taxa: SES.cfg.taxa.length, size: SES.cfg.size, r: SES.cfg.recipe }));
  if (!/^Oiseaux du jardin · /.test(rc.t) || rc.taxa < 5 || rc.size !== 50 || rc.r !== "jardin") fail("recette " + JSON.stringify(rc));
  await p.evaluate(() => ACT.quit()); await p.waitForSelector(".view.result, .view.home");
  if (await p.$(".view.result")) { if (!(await p.$("[data-act=qshare]"))) fail("bilan sans bouton partager"); }

  // 3) Partager le quiz réglé : lien + QR, rien de personnel dedans
  await p.evaluate(() => { const B = getB(); B.zone = { k: "near", lat: 44.7351, lng: -1.0412, r: 25, name: "Autour de moi" }; B.stim = ["photo", "son"]; B.freq = "season"; B.len = 20; B.guilds = ["Limicoles"]; save(); go("builder"); });
  await p.click("details.bset > summary");
  await p.click("[data-act=bshare]"); await p.waitForSelector(".panel.sharep .qrbox svg.qr");
  await p.screenshot({ path: "test/shots/p2-share.png" });
  const link = await p.evaluate(() => SHARE.link);
  if (!link.startsWith("https://plumage.test/#q=") || /44\.7|1\.04/.test(atob(link.split("#q=")[1].replace(/-/g, "+").replace(/_/g, "/")))) fail("lien : " + link);
  const back = await p.evaluate(l => { const r = quizUnpack(l.split("#q=")[1]); return { z: r.cfg.zone, stim: r.cfg.stim, freq: r.cfg.freq, len: r.cfg.len, taxa: r.cfg.taxa.length }; }, link);
  if (back.z?.k !== "near" || back.z.lat != null || back.stim.join() !== "photo,son" || back.freq !== "season" || back.len !== 20 || !back.taxa) fail("relu : " + JSON.stringify(back));
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 8000 }), p.click("[data-act=shpng]")]);
  if (!/^plumage-.*\.png$/.test(dl.suggestedFilename())) fail("QR téléchargé : " + dl.suggestedFilename());
  console.log("lien", link.length, "caractères");

  // 4) Le lien d'une recette reste court
  const rlink = await p.evaluate(async () => quizLink(await recipeCfg(RECIPES[0], { k: "gi", id: 12345, name: "Gironde" })));
  if (rlink.length > 140) fail("lien de recette trop long " + rlink.length);

  // 5) Ouvrir un lien reçu, jouer
  const q = await page(rlink);
  await q.waitForSelector(".panel.inq");
  await q.screenshot({ path: "test/shots/p3-incoming.png" });
  if (!/Oiseaux du jardin/.test(await q.evaluate(() => document.querySelector(".panel.inq h2").textContent))) fail("titre du lien reçu");
  if ((await q.evaluate(() => location.hash))) fail("le lien reste dans l'adresse");
  await q.click("[data-act=inqplay]"); await ready(q);
  const qc = await q.evaluate(() => ({ t: SES.cfg.title, z: SES.cfg.zone?.id }));
  if (!/^Oiseaux du jardin · Gironde/.test(qc.t) || qc.z !== 12345) fail("quiz reçu " + JSON.stringify(qc));
  await q.close();

  // 6) Garder un quiz reçu
  const q2 = await page(link);
  await q2.waitForSelector(".panel.inq");
  await q2.click("[data-act=inqsave]");
  await q2.waitForFunction(() => S.favs.length > 0);
  await q2.close();

  // 7) Lien piégé : texte neutralisé, valeurs inconnues ignorées
  const evil = await p.evaluate(() => b64e(JSON.stringify({ v: 1, t: "<img src=x onerror=window.PWNED=1>Salut", x: ["a", 5, -2, 3.5, 7], f: "evil", m: "photo,hack", z: { i: 99, n: "<b>Nulle</b> part" }, o: "boom", l: 999 })));
  const e = await page("https://plumage.test/#q=" + evil);
  await e.waitForSelector(".panel.inq");
  const ev = await e.evaluate(() => ({ img: !!document.querySelector(".panel.inq img"), b: !!document.querySelector(".panel.inq b:not(.x)") && [...document.querySelectorAll(".panel.inq b")].some(x => /Nulle/.test(x.textContent)), pw: !!window.PWNED, cfg: INQ.r.cfg }));
  if (ev.img || ev.pw || ev.b) fail("lien piégé : balises interprétées");
  if (ev.cfg.freq !== "common" || ev.cfg.taxa.join() !== "5,7" || ev.cfg.stim.join() !== "photo" || ev.cfg.format !== "qcm" || ev.cfg.len !== 10) fail("lien piégé : valeurs " + JSON.stringify(ev.cfg));
  await e.close();
  const bad = await page("https://plumage.test/#q=@@@@");
  await bad.waitForTimeout(600);
  if (await bad.$(".panel.inq")) fail("lien illisible ouvert");

  console.log("partage : recettes, réglages repliés, lien + QR, lien reçu, lien piégé ok");
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
