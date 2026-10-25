// Hors ligne : le service worker garde l'appli et sert les photos du pack terrain sans réseau.
// L'appli est servie par un petit serveur local (localhost compte comme sécurisé pour un service worker).
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
(async () => {
  const PORT = 8000 + Math.floor(Math.random() * 900);
  const srv = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", path.join(__dirname, "..", "dist")], { stdio: "ignore" });
  const fail = m => { throw new Error(m); };
  let b;
  try {
    await new Promise(r => setTimeout(r, 900));
    b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    /* le vrai réseau (iNaturalist…) n'est pas joignable ici : on coupe tout sauf le serveur local */
    await ctx.route(/^https?:\/\/(?!localhost)/, route => route.abort());
    const p = await ctx.newPage();
    const url = `http://localhost:${PORT}/`;
    await p.goto(url); await p.waitForSelector(".view");
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload(); await p.waitForSelector(".view");
    if (!(await p.evaluate(() => !!navigator.serviceWorker.controller))) fail("service worker inactif");
    const shell = await p.evaluate(async () => { const ks = await caches.keys(); const v = ks.find(k => /^plumage-[0-9a-f]{10}$/.test(k)); return v ? (await (await caches.open(v)).keys()).length : 0; });
    if (shell < 10) fail("coquille en cache : " + shell);
    // une photo « du pack » (taille moyenne), comme après « Hors ligne » dans Préparer une sortie
    await p.evaluate(async () => {
      const c = document.createElement("canvas"); c.width = 40; c.height = 30; c.getContext("2d").fillRect(0, 0, 40, 30);
      const blob = await new Promise(r => c.toBlob(r, "image/png"));
      await (await caches.open("plumage-pack")).put("https://static.inaturalist.org/photos/123/medium.jpg", new Response(blob, { headers: { "content-type": "image/png" } }));
    });
    // sans réseau : l'appli s'ouvre, la photo du pack s'affiche (y compris quand la page demande la grande taille)
    await ctx.setOffline(true);
    await p.reload(); await p.waitForSelector(".view.home", { timeout: 10000 });
    const img = await p.evaluate(() => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(-1); i.src = "https://static.inaturalist.org/photos/123/large.jpg"; }));
    if (img !== 40) fail("photo du pack hors ligne : " + img);
    const miss = await p.evaluate(() => new Promise(res => { const i = new Image(); i.onload = () => res("chargée"); i.onerror = () => res("absente"); i.src = "https://static.inaturalist.org/photos/999/large.jpg"; }));
    if (miss !== "absente") fail("photo hors pack : " + miss);
    const font = await p.evaluate(async () => { await document.fonts.ready; return document.fonts.check("16px Figtree"); });
    console.log("hors ligne : coquille", shell, "fichiers, appli ouverte sans réseau, photo du pack ok, police", font ? "ok" : "absente");
    await ctx.setOffline(false);

    // Pack terrain (réseau simulé) : télécharger, puis sans iNaturalist, liste et quiz de sortie depuis le pack
    const { handle } = require("./mock.cjs");
    const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await ctx2.route("**/*", handle);
    const q = await ctx2.newPage(); const errs = [];
    q.on("pageerror", e => errs.push("PAGE " + e.message));
    await q.goto("https://plumage.test/"); await q.waitForSelector(".view.home");
    await q.click("[data-act=mode][data-mode=sortie]"); await q.waitForSelector(".trow", { timeout: 15000 });
    await q.click("[data-act=tpack]");
    await q.waitForFunction(() => !!S.pack && !PK.run, null, { timeout: 30000 });
    const pk = await q.evaluate(async () => ({ n: S.pack.n, cached: (await (await caches.open("plumage-pack")).keys()).length, btn: document.querySelector(".pkbtn")?.className }));
    if (!pk.n || pk.cached < pk.n || !/ok/.test(pk.btn)) fail("pack " + JSON.stringify(pk));
    await q.screenshot({ path: "test/shots/o1-pack.png" });
    await ctx2.route(/api\.inaturalist\.org/, r => r.abort());
    await q.evaluate(() => { localStorage.clear(); MEM.clear(); save(true); });
    await q.evaluate(() => loadTrip());
    await q.waitForSelector(".pkoff", { timeout: 15000 });
    const n2 = await q.evaluate(() => document.querySelectorAll(".trow").length);
    if (n2 < 5) fail("liste du pack : " + n2);
    await q.screenshot({ path: "test/shots/o2-pack-offline.png" });
    await q.click("[data-act=tquiz]");
    await q.waitForFunction(() => SES && SES.q && !SES.q.done && document.querySelector("#answers [data-k]"), null, { timeout: 20000 });
    for (let i = 0; i < 3; i++) {
      await q.waitForFunction(() => SES.q && !SES.q.done && document.querySelector("#answers [data-k]"), null, { timeout: 20000 });
      if (await q.evaluate(() => SES.q.stim !== "photo")) fail("question non photo hors ligne");
      await q.click(`#answers [data-k="${await q.evaluate(() => SES.q.answerKey)}"]`); await q.waitForSelector(".fb.show"); await q.click(".fb [data-act=next]");
    }
    await q.evaluate(() => ACT.quit());
    await q.evaluate(() => go("settings")); await q.waitForSelector("[data-act=pkdel]");
    await q.click("[data-act=pkdel]");
    await q.waitForFunction(async () => !S.pack && !(await caches.keys()).includes("plumage-pack"), null, { timeout: 8000 }).catch(() => fail("pack non supprimé"));
    console.log("pack terrain :", pk.n, "espèces,", pk.cached, "photos ; liste et quiz sans iNaturalist ok ; suppression ok");
    if (errs.length) fail("erreurs " + errs.join(" | "));
  } finally {
    if (b) await b.close();
    srv.kill();
  }
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
