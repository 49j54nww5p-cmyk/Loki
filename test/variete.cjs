// Variété : dans une série « Sur mesure », pas d'oiseau en double tant qu'il en reste d'autres,
// des oiseaux jamais vus à chaque série (même avec des faiblesses en mémoire), et des photos qui changent.
const { chromium } = require("playwright");
const { handle } = require("./mock.cjs");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route("**/*", handle);
  const p = await ctx.newPage(); const errs = [], fail = m => { throw new Error(m); };
  p.on("pageerror", e => errs.push("PAGE " + e.message));
  await p.goto("https://plumage.test/"); await p.waitForSelector(".view.home");
  const run = async () => {
    await p.evaluate(() => { LASTCFG = { ...baseCfg(), len: 20, format: "qcm", stim: ["photo"] }; startSession(LASTCFG); });
    const ids = [], phs = [];
    for (let i = 0; i < 20; i++) {
      await p.waitForFunction(() => SES && SES.q && !SES.q.done && document.querySelector("#answers [data-k]"), null, { timeout: 20000 });
      const q = await p.evaluate(() => ({ id: SES.q.t.id, ph: SES.q.photo ? photoKey(SES.q.photo.lg || SES.q.photo.md) : 0, ak: SES.q.answerKey, pool: SES.pool.list.length }));
      ids.push(q.id); phs.push(q.ph);
      await p.click(`#answers [data-k="${q.ak}"]`); await p.waitForSelector(".fb.show"); await p.click(".fb [data-act=next]");
    }
    await p.waitForSelector(".view.result");
    return { ids, phs };
  };
  // 10 oiseaux « ratés » en mémoire : avant, ils revenaient en boucle
  await p.evaluate(async () => {
    const cfg = { ...baseCfg() }; const pool = await getPool(cfg);
    for (const t of pool.list.slice(0, 10)) { const r = rec(t); r.n = 6; r.ok = 1; r.last = "2026-01-01"; r.due = { photo: 1 }; }
    save(true);
  });
  const weak = await p.evaluate(async () => (await getPool(baseCfg())).list.slice(0, 10).map(t => t.id));
  const pool = await p.evaluate(async () => (await getPool(baseCfg())).list.length);
  const a = await run(), c = await run();
  const dup = x => x.length - new Set(x).size;
  if (pool >= 20 && dup(a.ids)) fail("doublons dans la série 1 : " + dup(a.ids));
  if (pool >= 20 && dup(c.ids)) fail("doublons dans la série 2 : " + dup(c.ids));
  const weakIn = a.ids.filter(id => weak.includes(id)).length;
  if (weakIn > 10) fail("trop de ratés en boucle : " + weakIn);
  const newIn2 = c.ids.filter(id => !a.ids.includes(id) && !weak.includes(id)).length;
  if (pool >= 40 && newIn2 < 6) fail("trop peu d'oiseaux nouveaux en série 2 : " + newIn2);
  const both = [...a.phs, ...c.phs].filter(Boolean);
  if (dup(both) > both.length / 4) fail("photos répétées : " + dup(both) + "/" + both.length);
  console.log("variété : pool", pool, "· série 1", new Set(a.ids).size, "oiseaux dont", weakIn, "ratés · série 2", newIn2, "nouveaux · photos répétées", dup(both), "/", both.length);
  console.log("ERR", errs); await b.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error("CRASH", e.message); process.exit(1); });
