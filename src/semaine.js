/* ============================================================
   Plumage — défi de la semaine : les mêmes 10 photos pour tout le monde, un thème par semaine
   Les questions sont tirées au sort à partir du numéro de la semaine (pas de serveur pour ça) ;
   le classement de la semaine passe par la base en ligne : pseudo et points, premier essai seulement.
   ============================================================ */
function weekId(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const sPick = (r, a) => a[Math.floor(r() * a.length)];
const sShuffle = (r, a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
/* Le thème de la semaine : un parcours (photos), deux de ses étapes */
function weekTheme(wk = weekId()) {
  const r = seeded(hashStr("plumage-semaine:" + wk)), P = sPick(r, PATHS.filter(p => !p.stim.includes("son")));
  const steps = sShuffle(r, P.steps.map((_, i) => i)).slice(0, 2).sort((a, b) => a - b);
  return { wk, P, steps, r };
}
const WEEK = { wk: "", deck: null, theme: null, list: null, err: "", load: 0, rload: 0 };
async function weekDeck(wk = weekId()) {
  if (WEEK.wk === wk && WEEK.deck) return WEEK.deck;
  const th = weekTheme(wk), r = th.r;
  const sp = (await Promise.all(th.steps.map(i => stepTaxa(th.P, i).catch(() => null)))).flat().filter(Boolean);
  const uniq = [...new Map(sp.map(t => [t.id, t])).values()].sort((a, b) => a.id - b.id);
  if (uniq.length < 5) throw new Error("EMPTY");
  const det = await photosFor(uniq.map(t => t.id)).catch(() => uniq.map(() => []));
  const targets = sShuffle(r, [...uniq, ...uniq]).slice(0, 10), used = new Map(), deck = [];
  for (const t of targets) {
    const i = uniq.findIndex(x => x.id === t.id), list = (det[i] || []).filter(ph => photoRef(ph.lg || ph.md));
    const fall = t.img?.md && photoRef(t.img.md) ? [{ md: t.img.md, lg: sizeUrl(t.img.md, "large"), attr: t.img.attr }] : [];
    const cands = (list.length ? list : fall).slice(0, 6), u = used.get(t.id) || new Set();
    let k = Math.floor(r() * Math.max(1, cands.length)); for (let n = 0; n < cands.length && u.has(k); n++) k = (k + 1) % cands.length;
    const ph = cands[k]; if (!ph) continue;
    u.add(k); used.set(t.id, u);
    const others = sShuffle(r, uniq.filter(x => x.id !== t.id)).slice(0, 3), ch = sShuffle(r, [t, ...others]);
    const ref = photoRef(ph.lg || ph.md);
    deck.push({ ref, p: photoUrl(ref, "medium"), l: photoUrl(ref, "large"), a: ph.attr || "", c: ch.map(x => ["s" + x.id, x.fr || x.sci, x.sci]), k: "s" + t.id });
  }
  if (deck.length < 6) throw new Error("EMPTY");
  Object.assign(WEEK, { wk, deck, theme: th });
  return deck;
}
const weekMine = () => S.week && S.week.wk === weekId() ? S.week : null;
async function weekStart() {
  const n = livePseudo(); if (!n) return;
  const tok = ++WEEK.load;
  clearTimeout(DEFI.tmr);
  Object.assign(DEFI, { st: "prep", role: "week", err: "", opp: null, link: "", xp: !!weekMine(), T: 10 }); go("defi");
  let deck = null;
  try { deck = await weekDeck(); } catch (e) { deck = null; }
  if (tok !== WEEK.load || VIEW !== "defi") return;
  if (!deck) { Object.assign(DEFI, { st: "intro", err: "Impossible de préparer les photos (réseau ?)." }); go("defi"); return; }
  deck.forEach(d => preload(d.l));
  Object.assign(DEFI, { deck: deck.map(d => ({ ...d })), i: 0, ans: [], rev: -1, st: "q" }); go("defi");
}
/* Fin : le premier essai compte (et part au classement si tu l'as activé) */
async function weekFinish() {
  const sc = defiScore(DEFI.deck, DEFI.ans, DEFI.T), wk = weekId();
  if (!weekMine()) {
    S.week = { wk, p: sc.pts, ok: sc.ok, n: DEFI.deck.length, at: Date.now(), sent: false }; save(true);
    if (netOn() && cleanName(S.set.pseudo)) {
      try { await netReq("PUT", `weekly/${wk}/${myUid()}`, { n: cleanName(S.set.pseudo), p: sc.pts, t: Date.now() }); S.week.sent = true; save(); } catch (e) { /* hors ligne */ }
    }
  }
  weekRank();
}
async function weekRank() {
  if (!netOn()) return;
  const wk = weekId(), tok = ++WEEK.rload;
  try {
    const d = await netReq("GET", `weekly/${wk}`, undefined, { orderBy: '"p"', limitToLast: 50 });
    if (tok !== WEEK.rload) return;
    WEEK.list = Object.entries(d || {}).filter(([, v]) => v && typeof v === "object").map(([uid, v]) => ({ uid, n: cleanName(v.n) || "?", p: Math.max(0, Math.round(+v.p || 0)), t: +v.t || 0 })).sort((a, b) => b.p - a.p || a.t - b.t);
  } catch (e) { WEEK.list = null; }
  if (VIEW === "defi" && DEFI.role === "week") { const b = $("#wrank"); if (b) b.innerHTML = weekRankHtml(); }
}
function weekRankHtml() {
  if (!netOn()) return `<p class="muted note">Le classement de la semaine s'allume dès que le serveur de l'appli est branché.</p>`;
  if (!WEEK.list) return `<div class="sono-ph" style="height:80px"><div class="spin"></div></div>`;
  if (!WEEK.list.length) return `<p class="muted note">Personne d'autre pour l'instant : partage le défi !</p>`;
  return `<ol class="toplist wk">${WEEK.list.slice(0, 20).map((r, i) => `<li class="${r.uid === S.uid ? "me" : ""} ${i < 3 ? "p" + (i + 1) : ""}"><span class="rk">${i < 3 ? ic("trophy") : i + 1}</span><span class="nm"><b>${esc(r.n)}${r.uid === S.uid ? " <small>(toi)</small>" : ""}</b></span><span class="xp">${fmt(r.p)}<small>pts</small></span></li>`).join("")}</ol>`;
}
function weekIntroHtml() {
  const th = weekTheme(), mine = weekMine();
  return `<section class="view live defi">
  <div class="head"><button class="icon-btn" data-act="tab" data-tab="home" aria-label="Retour">${ic("back")}</button><h1 class="h1" style="flex:1">Défi de la semaine</h1></div>
  <div class="lhero wkhero" style="--c:${th.P.c}"><span class="vs">${ic(th.P.ic)}</span><p><b>${esc(th.P.n)}</b><br>${th.steps.map(i => esc(th.P.steps[i].n)).join(" · ")}</p></div>
  ${DEFI.err ? `<p class="lerr">${esc(DEFI.err)}</p>` : ""}
  <div class="card lbox"><p style="margin:0 0 10px;font-size:14px;line-height:1.45">Les mêmes 10 photos pour tout le monde, 10 s par photo. ${mine ? `Ton essai de la semaine : <b>${fmt(mine.p)} points</b> (${mine.ok}/${mine.n}). Tu peux rejouer pour t'entraîner, sans changer ton score.` : "Seul ton premier essai compte : concentre-toi !"}</p>
    <label class="fld"><span>Ton pseudo</span><input id="lpseudo" type="text" maxlength="16" autocomplete="nickname" placeholder="ex. Piaf33" value="${esc(S.set.pseudo || "")}"></label>
    <button class="btn primary wide" data-act="wstart" style="margin-top:12px">${ic("play")}${mine ? "Rejouer (entraînement)" : "Jouer"}</button></div>
  ${mine ? `<div class="sec">${ic("trophy")}Classement de la semaine</div><div id="wrank">${weekRankHtml()}</div>` : ""}
  <p class="muted note">Nouveau thème chaque lundi. ${netOn() ? "Au classement : ton pseudo et tes points, rien d'autre." : ""}</p>
</section>`;
}
function weekEndHtml() {
  const D = DEFI, me = defiScore(D.deck, D.ans, D.T), N = D.deck.length, mine = weekMine();
  const dots = `<span class="ddots">${D.deck.map((q, i) => `<i class="${livePts(D.ans[i], q, D.T) ? "ok" : "bad"}"></i>`).join("")}</span>`;
  const training = mine && mine.at < Date.now() - 5000 && D.xp;
  return `<section class="view live defi"><header class="qbar"><button class="icon-btn" data-act="dquit" aria-label="Quitter">${ic("x")}</button><div class="ltitle">Défi de la semaine</div><span style="width:44px"></span></header>
  <div class="lcard lend"><div class="lbig dchal">${ic("trophy")}</div><h2>${fmt(me.pts)} points</h2><p class="muted">${me.ok}/${N} bonnes réponses${training ? " · entraînement" : ""}</p>${dots}
  ${mine ? `<p class="muted note">Ton score de la semaine : <b>${fmt(mine.p)}</b>.</p>` : ""}
  <div class="sec" style="justify-content:center">${ic("trophy")}Classement de la semaine</div><div id="wrank" style="width:100%">${weekRankHtml()}</div>
  <button class="btn primary wide" data-act="wshare" style="margin-top:14px">${ic("duel")}Défier un ami sur ces photos</button>
  <button class="btn ghost wide" data-act="dquit" style="margin-top:10px">${ic("back")}Accueil</button></div></section>`;
}
/* Carte de l'accueil */
function weekCard() {
  const th = weekTheme(), mine = weekMine();
  return `<button class="weekc" data-act="week" style="--c:${th.P.c}"><span class="ic">${ic("trophy")}</span><span class="tx"><small>Défi de la semaine</small><b>${esc(th.P.n)}</b><span class="wsub">${mine ? `Ton score : ${fmt(mine.p)} pts${netOn() ? " · voir le classement" : ""}` : "10 photos, les mêmes pour tout le monde"}</span></span>${ic(mine ? "arrow" : "play")}</button>`;
}
