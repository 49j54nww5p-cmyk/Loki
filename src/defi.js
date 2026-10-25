/* ============================================================
   Plumage — défi à distance (duel en différé), sans serveur
   Tu joues 10 photos ; le lien que tu envoies contient les mêmes questions et tes réponses.
   Ton ami rejoue les mêmes photos, puis voit qui a gagné. Les photos restent celles d'iNaturalist :
   le lien ne garde que leur numéro, leur crédit et les noms des espèces proposées.
   ============================================================ */
const DEFI = { st: "", role: "", deck: [], i: 0, ans: [], t0: 0, tmr: 0, rev: -1, opp: null, link: "", err: "", T: 10, xp: false, load: 0 };
const DHOST = ["inaturalist-open-data.s3.amazonaws.com", "static.inaturalist.org"];
function photoRef(u) {
  const m = String(u || "").match(/^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\/(\d+)\/(?:square|small|medium|large|original)\.(jpe?g|png|gif)(?:\?.*)?$/i);
  return m ? [DHOST.indexOf(m[1].toLowerCase()), +m[2], m[3].toLowerCase()] : null;
}
const photoUrl = (r, size = "large") => `https://${DHOST[r[0]]}/photos/${r[1]}/${size}.${r[2]}`;

/* ---------- Lien : compacté (deflate quand le navigateur sait le faire) ---------- */
const bytesB64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 4096) s += String.fromCharCode(...u8.subarray(i, i + 4096)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const b64Bytes = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
async function packZ(str) {
  if (typeof CompressionStream === "undefined") return "j" + b64e(str);
  const buf = await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer();
  return "z" + bytesB64(new Uint8Array(buf));
}
async function unpackZ(s) {
  if (s[0] === "j") return b64d(s.slice(1));
  if (s[0] !== "z" || typeof DecompressionStream === "undefined") throw new Error("format");
  const txt = await new Response(new Blob([b64Bytes(s.slice(1))]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
  if (txt.length > 40000) throw new Error("trop long");
  return txt;
}
function defiPack() {
  const x = [], xi = new Map();
  const tix = c => { const id = +String(c[0]).slice(1); if (!xi.has(id)) { xi.set(id, x.length); x.push([id, String(c[1] || "").slice(0, 60), String(c[2] || "").slice(0, 80)]); } return xi.get(id); };
  const q = DEFI.deck.map(d => [...d.ref, String(d.a || "").slice(0, 120), d.c.map(tix), d.c.findIndex(c => c[0] === d.k)]);
  const a = DEFI.deck.map((d, i) => { const r = DEFI.ans[i] || { k: "", ms: DEFI.T * 1000 }; return [d.c.findIndex(c => c[0] === r.k), Math.round(r.ms)]; });
  return { v: 1, n: cleanName(S.set.pseudo) || "Un ami", T: DEFI.T, x, q, a };
}
/* Lecture d'un défi reçu : chaque valeur est vérifiée ; les photos sont reconstruites (iNaturalist seulement) */
function defiParse(o) {
  if (!o || o.v !== 1 || !Array.isArray(o.x) || !Array.isArray(o.q) || !Array.isArray(o.a)) return null;
  const T = [5, 10, 15].includes(o.T) ? o.T : 10;
  const x = o.x.slice(0, 80).map(e => Array.isArray(e) && Number.isInteger(e[0]) && e[0] > 0 ? [e[0], cleanTxt(e[1], 60), cleanTxt(e[2], 80)] : null);
  if (o.q.length < 5 || o.q.length > 15 || o.a.length !== o.q.length) return null;
  const deck = [], ans = [];
  for (let i = 0; i < o.q.length; i++) {
    const e = o.q[i], r = o.a[i];
    if (!Array.isArray(e) || e.length !== 6 || ![0, 1].includes(e[0]) || !Number.isInteger(e[1]) || e[1] <= 0 || !/^(jpe?g|png|gif)$/.test(e[2])) return null;
    const ch = Array.isArray(e[4]) ? e[4] : [];
    if (ch.length < 2 || ch.length > 6 || !ch.every(t => Number.isInteger(t) && x[t]) || !Number.isInteger(e[5]) || e[5] < 0 || e[5] >= ch.length) return null;
    const c = ch.map(t => ["s" + x[t][0], x[t][1] || x[t][2], x[t][2]]), ref = [e[0], e[1], e[2]];
    deck.push({ ref, p: photoUrl(ref, "medium"), l: photoUrl(ref, "large"), a: cleanTxt(e[3], 120), c, k: c[e[5]][0] });
    const pos = Array.isArray(r) && Number.isInteger(r[0]) && r[0] >= -1 && r[0] < ch.length ? r[0] : -1;
    const ms = Array.isArray(r) && Number.isFinite(r[1]) ? clamp(Math.round(r[1]), 0, T * 1000) : T * 1000;
    ans.push({ k: pos >= 0 ? c[pos][0] : "", ms });
  }
  return { T, deck, opp: { n: cleanName(o.n) || "Un ami", ans } };
}
const defiScore = (deck, ans, T) => deck.reduce((s, q, i) => { const p = livePts(ans[i], q, T); return { pts: s.pts + p, ok: s.ok + (p ? 1 : 0) }; }, { pts: 0, ok: 0 });

/* ---------- Déroulé ---------- */
function defiNew() {
  clearTimeout(DEFI.tmr);
  Object.assign(DEFI, { st: "intro", role: "host", deck: [], i: 0, ans: [], rev: -1, opp: null, link: "", err: "", T: +(S.set.liveT || 10), xp: false });
}
async function defiPrepare() {
  const n = livePseudo(); if (!n) return;
  const tok = ++DEFI.load;
  Object.assign(DEFI, { st: "prep", err: "" }); go("defi");
  let deck = [];
  try { deck = (await liveDeck(10)).map(d => ({ ...d, ref: photoRef(d.l) || photoRef(d.p) })).filter(d => d.ref); } catch (e) { deck = []; }
  if (tok !== DEFI.load || VIEW !== "defi") return;
  if (deck.length < 6) { Object.assign(DEFI, { st: "intro", err: "Impossible de préparer les photos (réseau ?)." }); go("defi"); return; }
  deck.forEach(d => { d.l = photoUrl(d.ref, "large"); d.p = photoUrl(d.ref, "medium"); preload(d.l); });
  Object.assign(DEFI, { deck, i: 0, ans: [], rev: -1, st: "q" }); go("defi");
}
function defiAccept() { Object.assign(DEFI, { st: "q", i: 0, ans: [], rev: -1, xp: false }); go("defi"); }
function defiMount() {
  if (DEFI.st !== "q") return;
  const q = DEFI.deck[DEFI.i], img = $("#dimg");
  if (!q) return;
  DEFI.t0 = 0;
  const idx = DEFI.i;
  const start = () => {
    if (DEFI.t0 || DEFI.st !== "q" || DEFI.i !== idx || DEFI.rev === DEFI.i) return;
    DEFI.t0 = performance.now();
    const bar = $("#dtbar"), T = DEFI.T * 1000;
    if (bar) { bar.style.transition = "none"; bar.style.transform = "scaleX(1)"; void bar.offsetWidth; bar.style.transition = `transform ${T}ms linear`; bar.style.transform = "scaleX(0)"; }
    clearTimeout(DEFI.tmr);
    DEFI.tmr = setTimeout(() => defiAnswer(""), T);
  };
  if (img) { img.onload = () => { img.parentElement.classList.add("loaded"); start(); }; img.onerror = start; img.src = q.l; }
  setTimeout(start, 3500);
}
function defiAnswer(k) {
  const i = DEFI.i, q = DEFI.deck[i];
  if (!q || DEFI.rev === i || DEFI.st !== "q") return;
  clearTimeout(DEFI.tmr);
  DEFI.rev = i;
  const ms = DEFI.t0 ? Math.min(Math.round(performance.now() - DEFI.t0), DEFI.T * 1000) : DEFI.T * 1000;
  const a = DEFI.ans[i] = { k: k || "", ms };
  const bar = $("#dtbar"); if (bar) { const m = getComputedStyle(bar).transform; bar.style.transition = "none"; bar.style.transform = m === "none" ? "scaleX(0)" : m; }
  $("#dans")?.classList.add("locked");
  $$("#dans [data-k]").forEach(b => { b.disabled = true; const kk = b.dataset.k; b.classList.add(kk === q.k ? "ok" : kk === a.k ? "bad" : "dim"); });
  const p = livePts(a, q, DEFI.T);
  const res = $("#dres"); if (res) { res.hidden = false; res.innerHTML = `<span class="${p ? "g" : "b"}">${p ? "+" + p : a.k ? "0" : "Temps écoulé"}<small>${p ? (p > 100 ? "dont " + (p - 100) + " de vitesse" : "juste") : a.k ? "raté" : ""}</small></span>`; }
  const sc = $("#dsc"); if (sc) sc.textContent = fmt(defiScore(DEFI.deck.slice(0, i + 1), DEFI.ans, DEFI.T).pts);
  if (p) sfx.ok(); else sfx.bad();
  setTimeout(() => {
    if (DEFI.st !== "q" || DEFI.rev !== i || VIEW !== "defi") return;
    if (i + 1 < DEFI.deck.length) { DEFI.i = i + 1; go("defi"); } else defiFinish();
  }, p ? 1100 : 1900);
}
async function defiFinish() {
  DEFI.st = "end";
  const me = defiScore(DEFI.deck, DEFI.ans, DEFI.T), opp = DEFI.opp ? defiScore(DEFI.deck, DEFI.opp.ans, DEFI.T) : null;
  if (!DEFI.xp) {
    DEFI.xp = true;
    const win = opp && me.pts > opp.pts, gain = me.ok * 6 + (win ? 25 : 0);
    if (gain) addXp(gain);
    count(DEFI.role === "week" ? "weeks" : "defis"); if (win) count("defiwin");
    const m = markPlayed(); if (m) toast(m);
    checkBadges(); save(true); topPush();
    if (win) setTimeout(() => { sfx.lvl(); confetti(); }, 300);
    cloudAuto();
  }
  go("defi");
  if (DEFI.role === "week") { weekFinish(); return; }
  if (DEFI.role === "host") {
    try { DEFI.link = location.origin + location.pathname + "#defi=" + await packZ(JSON.stringify(defiPack())); }
    catch (e) { DEFI.link = ""; DEFI.err = "Lien impossible à créer."; }
    if (VIEW === "defi" && DEFI.st === "end") go("defi");
  }
}
function defiShare() {
  if (!DEFI.link) return;
  const me = defiScore(DEFI.deck, DEFI.ans, DEFI.T);
  const text = `Je te défie sur Plumage : ${DEFI.deck.length} photos d'oiseaux, ${DEFI.T} s par photo. J'ai fait ${fmt(me.pts)} points, à toi de me battre !`;
  if (navigator.share) navigator.share({ title: "Défi Plumage", text, url: DEFI.link }).catch(() => {});
  else copyText(text + " " + DEFI.link, "Défi copié : colle-le dans un message.");
}
async function openDefiLink(raw) {
  try {
    const r = defiParse(JSON.parse(await unpackZ(raw)));
    if (!r) throw new Error("défi");
    clearTimeout(DEFI.tmr);
    Object.assign(DEFI, { st: "intro", role: "guest", deck: r.deck, T: r.T, opp: r.opp, i: 0, ans: [], rev: -1, link: "", err: "", xp: false });
    r.deck.forEach(d => preload(d.l));
    go("defi");
  } catch (e) { toast(typeof DecompressionStream === "undefined" ? "Ce défi demande un navigateur plus récent." : "Ce lien de défi est illisible."); go("home"); }
}

/* ---------- Écrans ---------- */
function defiViewHtml() {
  if (DEFI.role === "week" && DEFI.st === "intro") return weekIntroHtml();
  if (DEFI.role === "week" && DEFI.st === "end") return weekEndHtml();
  const D = DEFI, head = t => `<header class="qbar"><button class="icon-btn" data-act="dquit" aria-label="Quitter">${ic("x")}</button><div class="ltitle">${t}</div><span style="width:44px"></span></header>`;
  if (D.st === "prep") return `<section class="view live defi">${head("Défi à distance")}<div class="lcard"><div class="lprep"><div class="spin"></div><b>Je choisis 10 photos d'oiseaux de ta zone…</b></div></div></section>`;
  if (D.st === "intro" && D.role === "guest") return `<section class="view live defi">${head("Défi reçu")}
  <div class="lcard"><div class="lbig dchal">${ic("duel")}</div><span class="eyebrow">Défi à distance</span><h2>${esc(D.opp.n)} te défie !</h2>
  <p class="muted">${D.deck.length} photos d'oiseaux, ${D.T} s par photo : les mêmes que ${esc(D.opp.n)}. Son score reste caché jusqu'à la fin.</p>
  <label class="fld" style="text-align:left"><span>Ton pseudo</span><input id="lpseudo" type="text" maxlength="16" autocomplete="nickname" placeholder="ex. Piaf33" value="${esc(S.set.pseudo || "")}"></label>
  <button class="btn primary wide" data-act="daccept" style="margin-top:14px">${ic("play")}Relever le défi</button></div></section>`;
  if (D.st === "intro") return `<section class="view live defi">
  <div class="head"><button class="icon-btn" data-act="tab" data-tab="home" aria-label="Retour">${ic("back")}</button><h1 class="h1" style="flex:1">Défi à distance</h1></div>
  <div class="lhero"><span class="vs">${ic("duel")}</span><p>Tu joues 10 photos, puis tu envoies le lien. Ton ami rejoue les mêmes, quand il veut, et tente de battre ton score. Pas besoin d'être connectés en même temps.</p></div>
  ${D.err ? `<p class="lerr">${esc(D.err)}</p>` : ""}
  <label class="fld"><span>Ton pseudo</span><input id="lpseudo" type="text" maxlength="16" autocomplete="nickname" placeholder="ex. Piaf33" value="${esc(S.set.pseudo || "")}"></label>
  <div class="card lbox"><div class="lrow"><span class="lab">Chrono par photo</span><div class="seg">${[5, 10, 15].map(v => `<button class="${D.T === v ? "on" : ""}" data-act="dT" data-v="${v}">${v} s</button>`).join("")}</div></div>
    <p class="muted" style="font-size:13px;margin:8px 0 12px">Oiseaux communs de ta zone (${esc(zoneLabel(S.set.zone))}), 4 choix. 100 points par bonne réponse, jusqu'à 50 de plus si tu es rapide.</p>
    <button class="btn primary wide" data-act="dstart">${ic("play")}C'est parti</button></div>
  <p class="muted note">Le lien contient les questions (numéros des photos iNaturalist, noms des espèces), ton pseudo et tes réponses. Rien ne passe par un serveur.</p>
</section>`;
  if (D.st === "q") {
    const q = D.deck[D.i], sc = defiScore(D.deck.slice(0, D.i), D.ans, D.T);
    return `<section class="view live quiz defi">
  <header class="qbar"><button class="icon-btn" data-act="dquit" aria-label="Quitter">${ic("x")}</button>
    <div class="lscore"><span class="me"><b id="dsc">${fmt(sc.pts)}</b><small>${esc(S.set.pseudo || "Toi")}</small></span><span class="qn">${D.i + 1}/${D.deck.length}</span>${D.opp ? `<span class="ot"><b>?</b><small>${esc(D.opp.n)}</small></span>` : `<span class="ot"><b>${ic(D.role === "week" ? "trophy" : "duel", "xs")}</b><small>${D.role === "week" ? "semaine" : "défi"}</small></span>`}</div>
    <span style="width:44px"></span></header>
  <div class="timer"><i id="dtbar"></i></div>
  <div class="stage"><figure class="shot"><img class="main" id="dimg" alt="Oiseau à identifier" draggable="false"><span class="ret tl"></span><span class="ret tr"></span><span class="ret bl"></span><span class="ret br"></span><div class="spinner"><div class="spin"></div></div><figcaption class="credit">${esc(q.a || "")}</figcaption></figure></div>
  <div class="prompt"><div class="q">${ic("frame")}<span>Quelle espèce ?</span></div></div>
  <div class="answers" id="dans">${q.c.map(([k, fr, sci], j) => `<button class="choice" data-act="dpick" data-k="${esc(k)}"><span class="k">${j + 1}</span><span class="lbl"><b>${esc(fr)}</b>${sci && sci !== fr && S.set.names !== "fr" ? `<span class="latin">${esc(sci)}</span>` : ""}</span></button>`).join("")}</div>
  <div class="lres" id="dres" hidden></div>
</section>`;
  }
  if (D.st === "end") {
    const me = defiScore(D.deck, D.ans, D.T), N = D.deck.length;
    const dots = ans => `<span class="ddots">${D.deck.map((q, i) => { const p = livePts(ans[i], q, D.T); return `<i class="${p ? "ok" : "bad"}" title="${i + 1}"></i>`; }).join("")}</span>`;
    if (!D.opp) return `<section class="view live defi">${head("Défi prêt")}
  <div class="lcard lend"><div class="lbig dchal">${ic("duel")}</div><h2>${fmt(me.pts)} points</h2><p class="muted">${me.ok}/${N} bonnes réponses</p>${dots(D.ans)}
  ${D.err ? `<p class="lerr">${esc(D.err)}</p>` : ""}
  ${D.link ? `<button class="btn primary wide" data-act="dshare" style="margin-top:16px">${ic("ext")}Envoyer le défi</button>` : `<div class="lprep"><div class="spin"></div><b>Je prépare le lien…</b></div>`}
  <p class="muted note">Ton ami ouvre le lien, joue les mêmes photos, et découvre qui a gagné.</p>
  <button class="btn ghost wide" data-act="dagain" style="margin-top:6px">${ic("replay")}Nouvelles photos</button>
  <button class="btn ghost wide" data-act="dquit" style="margin-top:10px">${ic("back")}Accueil</button></div></section>`;
    const op = defiScore(D.deck, D.opp.ans, D.T), win = me.pts > op.pts, tie = me.pts === op.pts;
    return `<section class="view live defi">${head("Défi terminé")}
  <div class="lcard lend ${win ? "win" : tie ? "tie" : "lose"}"><div class="lbig">${ic(win ? "trophy" : tie ? "duel" : "flame")}</div>
  <h2>${win ? "Tu gagnes !" : tie ? "Égalité parfaite" : esc(D.opp.n) + " gagne"}</h2>
  <div class="lfinal"><div class="${me.pts >= op.pts ? "lead" : ""}"><b>${fmt(me.pts)}</b><small>${esc(S.set.pseudo || "Toi")} · ${me.ok}/${N}</small>${dots(D.ans)}</div><div class="${op.pts >= me.pts ? "lead" : ""}"><b>${fmt(op.pts)}</b><small>${esc(D.opp.n)} · ${op.ok}/${N}</small>${dots(D.opp.ans)}</div></div>
  <p class="muted note">100 points par bonne réponse, jusqu'à 50 de bonus selon la rapidité.</p>
  <button class="btn primary wide" data-act="dback">${ic("duel")}Défier ${esc(D.opp.n)} à ton tour</button>
  <button class="btn ghost wide" data-act="dquit" style="margin-top:10px">${ic("back")}Accueil</button></div></section>`;
  }
  return `<section class="view live defi"><div class="lcard"><div class="spin"></div></div></section>`;
}
