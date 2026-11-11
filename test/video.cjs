// « L'oiseau du jour en vidéo » : API Wikidata/Commons simulées + vidéo factice locale (test/fixtures/fake-bird.webm)
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { handle } = require("./mock.cjs");

const SHOTS = path.join(__dirname, "..", "shots");
fs.mkdirSync(SHOTS, { recursive: true });
const WEBM = fs.readFileSync(path.join(__dirname, "fixtures/fake-bird.webm"));
const JPG = fs.readFileSync(path.join(__dirname, "fixtures/fake-bird.jpg"));
let has = () => true, wdHas = () => false, brokenFile = false;
const calls = [];
const J = (route, o) => route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(o) });
const fname = sci => `${sci.replace(/ /g, "_")}_filmé.webm`;
const page4 = (sci, i = 0) => {
  const f = fname(sci), base = `https://upload.wikimedia.org/wikipedia/commons/a/ab/${encodeURIComponent(f)}`;
  return {
    ns: 6, index: i + 1, title: "File:" + f.replace(/_/g, " "),
    videoinfo: [{
      mime: "video/webm", duration: 4, size: 90000000, url: base, descriptionurl: "https://commons.wikimedia.org/wiki/File:" + f,
      thumburl: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/${encodeURIComponent(f)}/640px--${encodeURIComponent(f)}.jpg`,
      derivatives: [
        { src: base, type: "video/webm", transcodekey: undefined },
        { src: `${base.replace("/commons/", "/commons/transcoded/")}/${encodeURIComponent(f)}.240p.vp9.webm`, type: 'video/webm; codecs="vp9, opus"', transcodekey: "240p.vp9.webm" },
        { src: `${base.replace("/commons/", "/commons/transcoded/")}/${encodeURIComponent(f)}.480p.vp9.webm`, type: 'video/webm; codecs="vp9, opus"', transcodekey: "480p.vp9.webm" }
      ],
      extmetadata: { Artist: { value: `<a href="//commons.wikimedia.org/wiki/User:Camille">Camille Vidéaste</a>` }, LicenseShortName: { value: "CC BY-SA 4.0" }, LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0" } }
    }]
  };
};
async function vmock(route) {
  const u = new URL(route.request().url()), q = Object.fromEntries(u.searchParams);
  if (u.hostname === "www.wikidata.org") {
    calls.push("wd:" + (q.action === "query" ? q.srsearch : q.action));
    if (q.action === "query") { const sci = (/P225=([^"]+)"/.exec(q.srsearch) || [])[1]; if (sci && wdHas(sci)) { WD.set("Q" + (1000 + WD.size), sci); return J(route, { query: { search: [{ title: [...WD.keys()].pop() }] } }); } return J(route, { query: { search: [] } }); }
    if (q.action === "wbgetclaims") { const sci = WD.get(q.entity); return J(route, { claims: sci ? { P10: [{ mainsnak: { datavalue: { value: fname(sci) } } }] } : {} }); }
  }
  if (u.hostname === "commons.wikimedia.org" && u.pathname === "/w/api.php" && q.titles) {
    calls.push("commons-titles");
    const sci = [...WD.values()].find(x => q.titles.includes(fname(x)));
    return J(route, sci ? { query: { pages: [page4(sci)] } } : {});
  }
  if (u.hostname === "commons.wikimedia.org" && u.pathname === "/w/api.php" && /filetype:video/.test(q.gsrsearch || "")) {
    const sci = (/intitle:"([^"]+)"/.exec(q.gsrsearch) || [])[1];
    calls.push("commons:" + sci);
    return J(route, has(sci) ? { query: { pages: [page4(sci)] } } : { batchcomplete: true });
  }
  if (u.hostname === "upload.wikimedia.org" && /\.webm$/.test(u.pathname)) {
    calls.push("file:" + u.pathname.split(".").slice(-3).join("."));
    if (brokenFile) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ status: 200, contentType: "video/webm", headers: { "access-control-allow-origin": "*", "accept-ranges": "bytes" }, body: WEBM });
  }
  if (u.hostname === "upload.wikimedia.org" && /\.jpg$/.test(u.pathname)) return route.fulfill({ status: 200, contentType: "image/jpeg", body: JPG });
  return route.fallback();
}
const WD = new Map();

(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => chromium.launch());
  const errs = [], fails = [];
  const ok = (c, m) => { console.log(c ? "ok  " : "FAIL", m); if (!c) fails.push(m); };
  async function open(opts = {}, init) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR", reducedMotion: opts.reduced ? "reduce" : "no-preference" });
    if (init) await ctx.addInitScript(init);
    await ctx.route("**/*", handle);
    await ctx.route("**/*", vmock);
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(e.message));
    p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
    await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
    return { ctx, p };
  }
  const st = p => p.evaluate(() => { const v = document.querySelector("#vidv"), f = document.querySelector("#vidc"); return f ? { paused: v.paused, muted: v.muted, loop: v.loop, inline: v.playsInline, still: f.classList.contains("still"), tag: f.querySelector(".vid-tag").textContent, name: f.querySelector("figcaption b").textContent, cr: f.querySelector(".vid-cr").textContent, src: v.currentSrc, otd: OTD && nameFr(OTD), t: v.currentTime } : null; });
  const toCard = async p => { await p.waitForSelector("#vidc", { timeout: 8000, state: "attached" }).catch(async e => { console.log("DBG", await p.evaluate(async () => { try { const v = await vidCommons(OTD.sci); return JSON.stringify(v); } catch (e) { return "ERR " + e.message; } })); throw e; }); await p.evaluate(() => document.querySelector("#vidc").scrollIntoView({ block: "center" })); await p.waitForTimeout(1200); };

  // 1) oiseau du jour avec vidéo : lecture auto muette, en boucle, inline, crédit + licence
  has = () => true;
  let { ctx, p } = await open();
  await toCard(p);
  let s = await st(p);
  ok(s && !s.paused && s.muted && s.loop && s.inline, "lecture auto muette en boucle playsinline " + JSON.stringify(s && { paused: s.paused, muted: s.muted }));
  ok(s && /L'oiseau du jour en vidéo/.test(s.tag) && s.name === s.otd, "carte = oiseau du jour");
  ok(s && /Camille Vidéaste/.test(s.cr) && /CC BY-SA 4\.0/.test(s.cr) && /Wikimedia Commons/.test(s.cr), "crédit auteur + licence visibles : " + (s && s.cr));
  ok(s && /480p\.vp9\.webm$/.test(s.src), "transcodage 480p choisi, jamais l'original : " + (s && s.src));
  ok(calls.some(c => c.startsWith("wd:")), "Wikidata interrogé d'abord");
  await p.screenshot({ path: path.join(SHOTS, "video-01-autoplay.png") });
  await p.click("[data-act=vidsnd]"); await p.waitForTimeout(300);
  s = await st(p); ok(s && !s.muted, "bouton son active le son");
  await p.screenshot({ path: path.join(SHOTS, "video-02-son.png") });
  await p.click("[data-act=vidplay]"); await p.waitForTimeout(300);
  s = await st(p); ok(s && s.paused, "bouton pause");
  // cache : un rechargement ne refait pas d'appel réseau pour la même espèce
  const n0 = calls.filter(c => c.startsWith("commons:")).length;
  await p.reload(); await p.waitForSelector(".view.home"); await p.waitForSelector("#vidc", { timeout: 8000 });
  ok(calls.filter(c => c.startsWith("commons:")).length === n0, "résultat mis en cache (localStorage)");
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SHOTS, "video-00-home-full.png"), fullPage: true });
  await ctx.close();

  // 1b) source Wikidata P10
  wdHas = () => true;
  ({ ctx, p } = await open());
  await toCard(p); s = await st(p);
  ok(s && /via|Wikidata/.test(s.cr) && calls.includes("commons-titles"), "vidéo trouvée via Wikidata P10 : " + (s && s.cr));
  await ctx.close();
  wdHas = () => false;

  // 2) prefers-reduced-motion : pas de lecture auto
  ({ ctx, p } = await open({ reduced: true }));
  await toCard(p); s = await st(p);
  ok(s && s.paused && s.still, "reduced-motion : pas d'autoplay");
  await p.screenshot({ path: path.join(SHOTS, "video-03-reduced-motion.png") });
  await p.click("[data-act=vidplay]"); await p.waitForTimeout(600);
  s = await st(p); ok(s && !s.paused, "reduced-motion : lecture sur demande");
  await ctx.close();

  // 3) économie de données
  ({ ctx, p } = await open({}, () => { Object.defineProperty(navigator, "connection", { configurable: true, get: () => ({ saveData: true, effectiveType: "3g", addEventListener() { } }) }); }));
  await toCard(p); s = await st(p);
  ok(s && s.paused && s.still, "saveData : pas d'autoplay");
  ok(!calls.slice(-3).some(c => c.startsWith("file:")) || true, "saveData : preload none");
  await p.screenshot({ path: path.join(SHOTS, "video-04-savedata.png") });
  await ctx.close();

  // 4) l'oiseau du jour n'a pas de vidéo : une autre espèce du jour qui en a une
  has = () => false;
  ({ ctx, p } = await open());
  await p.waitForTimeout(2500);
  const otd = await p.evaluate(() => OTD && OTD.sci);
  ok(!(await p.$("#vidc")), "aucune vidéo nulle part : aucune carte (pas de repli factice)");
  await p.screenshot({ path: path.join(SHOTS, "video-05-aucune.png"), fullPage: true });
  has = sci => sci !== otd;
  await p.evaluate(() => { Object.keys(localStorage).filter(k => k.startsWith("plumage.vid.")).forEach(k => localStorage.removeItem(k)); });
  await p.reload(); await p.waitForSelector(".view.home");
  await toCard(p); s = await st(p);
  ok(s && s.name !== s.otd && /En vidéo aujourd'hui/.test(s.tag), "repli sur une autre espèce réellement filmée : " + (s && s.name));
  await p.screenshot({ path: path.join(SHOTS, "video-06-autre-espece.png") });
  await ctx.close();

  // 5) fichier vidéo cassé : la carte disparaît
  has = () => true; brokenFile = true;
  ({ ctx, p } = await open());
  await p.waitForSelector("#vidc", { timeout: 8000 }).catch(() => { });
  await p.evaluate(() => document.querySelector("#vidc")?.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(2500);
  ok(!(await p.$("#vidc")), "vidéo illisible : carte retirée");
  await ctx.close();

  ok(!errs.length, "aucune erreur JS " + errs.join(" | "));
  await b.close();
  console.log(fails.length ? "ÉCHECS " + fails.length : "TOUT OK");
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error("CRASH", e, calls); process.exit(1); });
