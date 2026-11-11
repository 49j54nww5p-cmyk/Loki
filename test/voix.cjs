const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
const FAKE = () => {
  window.__say = ""; window.__started = 0; delete window.SpeechRecognition; window.SpeechRecognition = undefined;
  window.webkitSpeechRecognition = class { start() { window.__started++; const t = window.__say; if (window.__hang) { setTimeout(() => { const a = [{ transcript: t }]; a.isFinal = false; this.onresult({ results: [a] }); }, 100); return; } setTimeout(() => { const alt = [{ transcript: t }, { transcript: t + " euh" }]; alt.isFinal = true; const res = [alt]; this.onresult && this.onresult({ results: res }); setTimeout(() => this.onend && this.onend(), 30); }, 120); } stop() {} abort() {} };
};
(async () => {
  const b = await chromium.launch(); const errs = []; const fails = [];
  const ok = (c, m) => { console.log(c ? "ok  " : "FAIL", m); if (!c) fails.push(m); };
  async function open(fake) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (fake) await ctx.addInitScript(FAKE); else await ctx.addInitScript(() => { delete window.webkitSpeechRecognition; delete window.SpeechRecognition; window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; });
    await ctx.route("**/*", handle); const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
    await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home"); await p.waitForTimeout(800);
    return { ctx, p };
  }
  const start = (p, fmt) => p.evaluate(f => { LASTCFG = { ...modeCfg(f === "type" ? "ecrire" : "photo"), len: 8, format: f }; startSession(LASTCFG); }, fmt);
  const ready = p => p.waitForFunction(() => SES && SES.q && !SES.q.done && document.querySelector("#voxBtn"));
  const say = async (p, t) => { await p.evaluate(t => { window.__say = t; }, t); await p.click("#voxBtn"); await p.waitForTimeout(500); };
  const next = async p => { await p.click(".fb [data-act=next]"); };

  const { ctx, p } = await open(true);
  await start(p, "qcm"); await ready(p);
  // 1) nom français avec article
  let q = await p.evaluate(() => ({ fr: SES.q.t.fr, sci: SES.q.t.sci, f: SES.q.format }));
  await p.evaluate(() => { window.__say = "mésange bleue"; window.__hang = true; }); await p.dispatchEvent("#voxBtn", "pointerdown"); await p.waitForTimeout(600);
  await p.screenshot({ path: "/tmp/claude-0/-home-claude/35b8c473-105f-5723-b8fe-b114a1ce5c6a/scratchpad/voix/ecoute.png" });
  await p.evaluate(() => { window.__hang = false; voxKill(); voxUi("off"); });
  q = await p.evaluate(() => ({ fr: SES.q.t.fr, sci: SES.q.t.sci }));
  await p.waitForTimeout(800);   await p.screenshot({ path: "/tmp/claude-0/-home-claude/35b8c473-105f-5723-b8fe-b114a1ce5c6a/scratchpad/voix/bouton.png" });
  await say(p, "c'est la " + q.fr.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
  ok(await p.evaluate(() => SES.results[SES.results.length - 1]?.ok === true && SES.q.done), "fr dicté → bonne réponse (" + q.fr + ")");
  await next(p); await ready(p);
  // 2) latin
  q = await p.evaluate(() => ({ sci: SES.q.t.sci }));
  await say(p, q.sci.toLowerCase());
  ok(await p.evaluate(() => SES.q.done && SES.results[SES.results.length - 1]?.ok), "latin dicté → ok (" + q.sci + ")");
  await next(p); await ready(p);
  // 3) absurde
  const n0 = await p.evaluate(() => SES.results.length);
  await say(p, "patate volante");
  ok(await p.evaluate(n => !SES.q.done && SES.results.length === n && !document.querySelector("#answers .ok,#answers .bad"), n0), "absurde → rien cliqué");
  ok(/Pas compris/.test(await p.textContent("#toast")), "toast Pas compris");
  // 3b) mésange bleue précise si présente : test unitaire de correspondance
  const mb = await p.evaluate(() => { const q = { choices: [{ key: "a", fr: "Mésange bleue", sci: "Cyanistes caeruleus" }, { key: "b", fr: "Mésange charbonnière", sci: "Parus major" }, { key: "c", fr: "Mésange noire", sci: "Periparus ater" }] }; return [voxMatch(q, ["la mésange bleue"])?.key, voxMatch(q, ["cyanistes caeruleus"])?.key, voxMatch(q, ["mes ange bleu"])?.key, voxMatch(q, ["mésange"])?.key || null]; });
  ok(JSON.stringify(mb) === '["a","a","a",null]', "correspondance mésange bleue " + JSON.stringify(mb));
  // 4) format type
  await p.evaluate(() => { SES.ended = true; SES = null; }); await start(p, "type"); await ready(p);
  q = await p.evaluate(() => ({ fr: SES.q.t.fr, f: SES.q.format }));
  await say(p, q.fr);
  ok(await p.evaluate(fr => SES.q.done && SES.results[SES.results.length - 1]?.ok && document.querySelector("#ans")?.value === fr, q.fr), "type → #ans rempli et soumis (" + q.fr + ")");
  // 5) réglage
  await p.evaluate(() => { SES.ended = true; SES = null; go("settings"); });
  ok(await p.$("[data-act=toggle][data-k=voice].on") !== null, "interrupteur Dictée vocale présent et activé");
  await ctx.close();
  // 6) sans API
  const o = await open(false); await start(o.p, "qcm");
  await o.p.waitForFunction(() => SES && SES.q && document.querySelector("#answers .choice")); await o.p.waitForTimeout(300);
  ok(await o.p.$("#voxBtn") === null, "sans API → pas de bouton");
  await o.p.evaluate(() => { SES.ended = true; SES = null; go("settings"); });
  ok(/Non disponible sur ce navigateur/.test(await o.p.textContent(".view.settings")), "réglages : non disponible");
  await o.ctx.close(); await b.close();
  if (fails.length) errs.push("FAILS " + fails.join(" | "));
  console.log("ERR", errs);
})();
