/* ============================================================
   Plumage — en ligne : classement XP et duel en direct
   Base Firebase Realtime Database, appelée par son API REST (aucune bibliothèque).
   Rien ne part tant que le joueur n'a pas choisi de publier son XP ou lancé un duel.
   ============================================================ */
const NET_URL = ""; /* adresse de la base, ex. https://plumage-xxxx-default-rtdb.europe-west1.firebasedatabase.app */
const netBase = () => String(S.set.net || NET_URL || "").replace(/\/+$/, "");
const netOn = () => !!netBase();
const netLocal = () => netBase() === "local"; /* tests : base partagée entre onglets du même navigateur */

/* ---------- Petite base locale (tests) ---------- */
const NETLS = "plumage.netlocal", NETL = new Set();
const pParts = p => String(p || "").split("/").filter(Boolean);
function getAt(o, parts) { for (const k of parts) { if (o == null || typeof o !== "object") return null; o = o[k]; } return o === undefined ? null : o; }
function setAt(root, parts, v) {
  if (!parts.length) return v === undefined ? null : v;
  const r = root && typeof root === "object" ? { ...root } : {};
  const [k, ...rest] = parts;
  const child = setAt(r[k], rest, v);
  if (child === null || child === undefined || (typeof child === "object" && !Object.keys(child).length)) delete r[k]; else r[k] = child;
  return Object.keys(r).length ? r : null;
}
function patchAt(root, parts, obj) { let r = root; for (const [k, v] of Object.entries(obj || {})) r = setAt(r, [...parts, ...pParts(k)], v); return r; }
const lsDb = () => { try { return JSON.parse(localStorage.getItem(NETLS) || "null"); } catch (e) { return null; } };
async function lsReq(method, path, body) {
  await sleep(15);
  const parts = pParts(path);
  let db = lsDb();
  if (method === "GET") return getAt(db, parts);
  if (method === "PUT") db = setAt(db, parts, body);
  if (method === "PATCH") db = patchAt(db, parts, body);
  if (method === "DELETE") db = setAt(db, parts, null);
  localStorage.setItem(NETLS, JSON.stringify(db));
  setTimeout(() => NETL.forEach(f => f()), 5);
  return method === "DELETE" ? null : body;
}
function lsListen(path, cb) {
  const parts = pParts(path), emit = () => cb(getAt(lsDb(), parts));
  const on = e => { if (e.key === NETLS) emit(); };
  window.addEventListener("storage", on);
  NETL.add(emit);
  setTimeout(emit, 0);
  return () => { window.removeEventListener("storage", on); NETL.delete(emit); };
}

/* ---------- Firebase : requêtes REST et flux en direct ---------- */
async function netReq(method, path, body, query) {
  if (netLocal()) return lsReq(method, path, body);
  const q = Object.entries(query || {}).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(`${netBase()}/${path}.json${q ? "?" + q : ""}`, { method, cache: "no-store", signal: ctl.signal, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!r.ok) { const e = new Error("NET " + r.status); e.status = r.status; throw e; }
    return await r.json();
  } finally { clearTimeout(tm); }
}
/* Écoute un nœud : renvoie à chaque changement la copie à jour (événements « put » et « patch » de Firebase) */
function netListen(path, cb) {
  if (netLocal()) return lsListen(path, cb);
  let mirror = null, es = null;
  const on = patch => e => {
    try { const d = JSON.parse(e.data); const parts = pParts(d.path); mirror = patch ? patchAt(mirror, parts, d.data) : setAt(mirror, parts, d.data); cb(mirror); }
    catch (err) { /* événement illisible : ignoré */ }
  };
  es = new EventSource(`${netBase()}/${path}.json`);
  es.addEventListener("put", on(false));
  es.addEventListener("patch", on(true));
  es.addEventListener("cancel", () => cb(mirror, "cancel"));
  es.onerror = () => cb(mirror, "err");
  return () => { try { es.close(); } catch (e) { /* rien */ } };
}
const rid = (n, abc = "abcdefghijkmnpqrstuvwxyz23456789") => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => abc[b % abc.length]).join("");
const myUid = () => { if (!S.uid) { S.uid = rid(20); save(); } return S.uid; };
const cleanName = s => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 16);

/* ---------- Classement XP ---------- */
const TOPN = 100;
let TOPT = 0;
async function topPush(force) {
  if (!netOn() || !S.set.topOn || !cleanName(S.set.pseudo)) return;
  const xp = Math.round(S.xp || 0);
  if (!force && (xp === S.topXp || Date.now() - TOPT < 15000)) return;
  TOPT = Date.now();
  try { await netReq("PUT", "top/" + myUid(), { n: cleanName(S.set.pseudo), xp, t: Date.now() }); S.topXp = xp; save(); }
  catch (e) { /* hors ligne : on réessaiera */ }
}
async function topRemove() { if (!netOn()) return; try { await netReq("DELETE", "top/" + myUid()); } catch (e) { /* rien */ } S.topXp = null; save(); }
async function topFetch() {
  const d = await netReq("GET", "top", undefined, { orderBy: '"xp"', limitToLast: TOPN });
  return Object.entries(d || {}).filter(([, v]) => v && typeof v === "object")
    .map(([uid, v]) => ({ uid, n: cleanName(v.n) || "?", xp: Math.max(0, Math.round(+v.xp || 0)), t: +v.t || 0 }))
    .sort((a, b) => b.xp - a.xp || a.t - b.t);
}
function topRowsHtml(list) {
  const me = S.uid;
  if (!list.length) return `<div class="empty">${ic("trophy")}<b>Personne pour l'instant</b><p>Active le classement ci-dessus : tu seras le premier !</p></div>`;
  return `<ol class="toplist">${list.map((r, i) => { const L = level(r.xp); return `<li class="${r.uid === me ? "me" : ""} ${i < 3 ? "p" + (i + 1) : ""}"><span class="rk">${i < 3 ? ic("trophy") : i + 1}</span><span class="nm"><b>${esc(r.n)}${r.uid === me ? " <small>(toi)</small>" : ""}</b><small>Niveau ${L.n} · ${esc(L.rank)}</small></span><span class="xp">${fmt(r.xp)}<small>XP</small></span></li>`; }).join("")}</ol>`;
}
function topViewHtml() {
  const on = !!S.set.topOn, nm = esc(S.set.pseudo || "");
  return `<section class="view top">
  <div class="head"><button class="icon-btn" data-act="tab" data-tab="progress" aria-label="Retour">${ic("back")}</button><h1 class="h1" style="flex:1">Classement</h1></div>
  ${netOn() ? "" : `<div class="notice"><span class="ic">${ic("info")}</span><span class="tx"><b>Bientôt en ligne</b><small>Le classement s'allume dès que le serveur de l'appli est branché.</small></span></div>`}
  <div class="card topme">
    <div class="tmrow"><span class="lvb">${level().n}</span><span class="tx"><b>${fmt(S.xp)} XP</b><small>${esc(level().rank)}</small></span></div>
    <label class="fld"><span>Ton pseudo</span><input id="pseudo" type="text" maxlength="16" autocomplete="nickname" placeholder="ex. Piaf33" value="${nm}"></label>
    <div class="tmrow sw"><span class="tx"><b>Apparaître dans le classement</b><small>Seuls ton pseudo et ton XP sont publiés.</small></span><button class="switch ${on ? "on" : ""}" data-act="topon" role="switch" aria-checked="${on}" aria-label="Apparaître dans le classement"></button></div>
  </div>
  <div class="sec">${ic("trophy")}Meilleurs joueurs<span class="more">Top ${TOPN}</span></div>
  <div id="toplist">${netOn() ? `<div class="sono-ph" style="height:120px"><div class="spin"></div></div>` : ""}</div>
</section>`;
}
async function topMount() {
  if (!netOn()) return;
  const box = $("#toplist");
  try { await topPush(); const list = await topFetch(); if (VIEW === "top" && box) box.innerHTML = topRowsHtml(list); }
  catch (e) { if (VIEW === "top" && box) box.innerHTML = `<div class="empty">${ic("wave")}<b>Classement injoignable</b><p>Vérifie ta connexion, puis reviens ici.</p></div>`; }
}

/* ---------- Duel en direct ---------- */
const LCODE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LIVE = { st: "lobby", code: "", role: "", room: null, stop: null, i: -1, t0: 0, ans: {}, tmr: 0, ping: 0, chk: 0, seen: 0, otherA: 0, shown: -1, rev: -1, err: "", T: 10, N: 10, xpDone: false, joinCode: "" };
const otherRole = r => r === "host" ? "guest" : "host";
const liveOther = () => LIVE.room?.[otherRole(LIVE.role)] || null;
const livePts = (a, q, T) => a && q && a.k && a.k === q.k ? 100 + Math.round(50 * Math.max(0, 1 - (+a.ms || 0) / (T * 1000))) : 0;
function liveScores(room, upto) {
  const sc = { host: 0, guest: 0, okh: 0, okg: 0 }, deck = room?.deck || [], T = room?.T || 10;
  for (let i = 0; i <= upto && i < deck.length; i++) {
    const ah = room.ans?.host?.[i], ag = room.ans?.guest?.[i];
    const ph = livePts(ah, deck[i], T), pg = livePts(ag, deck[i], T);
    sc.host += ph; sc.guest += pg; if (ph) sc.okh++; if (pg) sc.okg++;
  }
  return sc;
}
function liveReset() {
  if (LIVE.stop) LIVE.stop();
  clearTimeout(LIVE.tmr); clearInterval(LIVE.ping); clearInterval(LIVE.chk);
  Object.assign(LIVE, { st: "lobby", code: "", role: "", room: null, stop: null, i: -1, t0: 0, ans: {}, tmr: 0, ping: 0, chk: 0, seen: 0, otherA: 0, shown: -1, rev: -1, err: "", xpDone: false, rm: 0, sig: "" });
}
function livePseudo() {
  const inp = $("#lpseudo"), v = cleanName(inp ? inp.value : S.set.pseudo);
  if (!v) { toast("Choisis d'abord un pseudo."); inp?.focus(); return ""; }
  S.set.pseudo = v; save();
  return v;
}
function liveStartPresence() {
  clearInterval(LIVE.ping); clearInterval(LIVE.chk);
  LIVE.seen = Date.now();
  LIVE.ping = setInterval(() => { if (LIVE.code) netReq("PATCH", `duels/${LIVE.code}/${LIVE.role}`, { a: Date.now() }).catch(() => {}); }, 5000);
  LIVE.chk = setInterval(() => {
    const away = liveOther() && Date.now() - LIVE.seen > 16000;
    const b = $("#lwarn");
    if (b) b.hidden = !away;
    if (LIVE.role === "host" && LIVE.room?.st === "play") liveHostTick();
  }, 2000);
}
async function liveCreate() {
  if (!netOn()) { toast("Le duel arrive bientôt."); return; }
  const n = livePseudo(); if (!n) return;
  liveReset();
  const T = +(S.set.liveT || 10), code = rid(5, LCODE);
  try {
    await netReq("PUT", "duels/" + code, { t: Date.now(), v: 1, st: "wait", T, N: 10, host: { n, a: Date.now() } });
    Object.assign(LIVE, { code, role: "host", st: "wait", T });
    LIVE.stop = netListen("duels/" + code, liveOnRoom);
    liveStartPresence();
    go("live");
  } catch (e) { toast("Connexion impossible. Vérifie ton réseau."); }
}
async function liveJoin(code) {
  if (!netOn()) { toast("Le duel arrive bientôt."); return; }
  code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  if (code.length !== 5) { toast("Le code fait 5 caractères."); return; }
  const n = livePseudo(); if (!n) return;
  liveReset();
  try {
    const r = await netReq("GET", "duels/" + code);
    if (!r) { toast("Partie introuvable. Vérifie le code."); return; }
    if (r.guest && r.guest.n) { toast("Cette partie a déjà deux joueurs."); return; }
    if (r.st !== "wait") { toast("Cette partie a déjà commencé."); return; }
    await netReq("PATCH", "duels/" + code, { guest: { n, a: Date.now() } });
    Object.assign(LIVE, { code, role: "guest", st: "wait", T: r.T || 10 });
    LIVE.stop = netListen("duels/" + code, liveOnRoom);
    liveStartPresence();
    go("live");
  } catch (e) { toast("Connexion impossible. Vérifie ton réseau."); }
}
async function liveLeave() {
  const { code, role } = LIVE;
  liveReset();
  if (code) {
    if (role === "host") netReq("DELETE", "duels/" + code).catch(() => {});
    else netReq("PATCH", "duels/" + code, { guest: null, gone: Date.now() }).catch(() => {});
  }
  go("home");
}
/* L'hôte prépare les questions : photos d'espèces communes de sa zone, 4 choix */
async function liveDeck(N) {
  const ses = newSession({ kind: "quiz", zone: S.set.zone, freq: "common", size: 120, stim: ["photo"], target: "species", format: "qcm", k: 4, diff: S.set.diff || "moyen", len: N + 6, names: "both", timer: 0 });
  await prepare(ses);
  const out = [];
  for (let g = 0; g < N + 6 && out.length < N; g++) {
    const q = await buildNext(ses).catch(() => null);
    if (!q || !q.photo || !q.choices || q.choices.length < 2 || q.level !== "species") continue;
    out.push({ p: q.photo.md, l: q.photo.lg || q.photo.md, a: q.photo.attr || "", c: q.choices.map(c => [c.key, c.fr || c.sci || "", c.sci || ""]), k: q.answerKey });
  }
  return out;
}
async function liveLaunch() {
  if (LIVE.role !== "host" || !LIVE.room?.guest) return;
  LIVE.err = "";
  await netReq("PATCH", "duels/" + LIVE.code, { st: "prep" }).catch(() => {});
  let deck = [];
  try { deck = await liveDeck(LIVE.room.N || 10); } catch (e) { deck = []; }
  if (deck.length < 5) { LIVE.err = "Impossible de préparer les questions (réseau ?)."; await netReq("PATCH", "duels/" + LIVE.code, { st: "wait" }).catch(() => {}); go("live"); return; }
  if (!LIVE.room?.guest) { await netReq("PATCH", "duels/" + LIVE.code, { st: "wait" }).catch(() => {}); return; }
  deck.forEach(q => preload(q.l));
  Object.assign(LIVE, { i: -1, shown: -1, rev: -1, ans: {}, xpDone: false });
  await netReq("PATCH", "duels/" + LIVE.code, { deck, N: deck.length, ans: null, st: "play", cur: { i: 0, at: Date.now() }, rm: (LIVE.room.rm || 0) + 1 }).catch(() => toast("Connexion perdue."));
}
function liveOnRoom(room) {
  const prev = LIVE.room;
  if (room && (room.rm || 0) !== (LIVE.rm || 0)) { LIVE.rm = room.rm || 0; LIVE.ans = {}; LIVE.xpDone = false; LIVE.shown = -1; LIVE.rev = -1; }
  if (!room) {
    if (LIVE.code && prev) { const who = liveOther()?.n || "L'autre joueur"; liveReset(); LIVE.st = "gone"; LIVE.err = who + " a quitté la partie."; if (VIEW === "live") go("live"); }
    return;
  }
  LIVE.room = room;
  const o = room[otherRole(LIVE.role)];
  if (o && o.a !== LIVE.otherA) { LIVE.otherA = o.a; LIVE.seen = Date.now(); }
  if (LIVE.role === "host" && !prev?.guest && room.guest) LIVE.err = "";
  if (LIVE.role === "host" && prev?.guest && !room.guest) {
    LIVE.err = (prev.guest.n || "Ton adversaire") + " est parti.";
    if (room.st === "play" || room.st === "prep") {
      clearTimeout(LIVE.tmr);
      Object.assign(LIVE, { i: -1, shown: -1, rev: -1, ans: {} });
      room = { ...room, st: "wait", deck: null, cur: null, ans: null };
      LIVE.room = room;
      netReq("PATCH", "duels/" + LIVE.code, { st: "wait", deck: null, cur: null, ans: null }).catch(() => {});
    }
  }
  if (room.deck) room.deck.forEach(q => preload(q.l));
  const st = room.st;
  if (st === "play" && room.cur && room.deck) {
    const i = room.cur.i;
    if (i !== LIVE.shown) { LIVE.shown = i; LIVE.i = i; LIVE.rev = -1; LIVE.st = "q"; if (VIEW === "live") go("live"); return; }
    liveCheckReveal();
    liveUpdBar();
    return;
  }
  const map = { wait: "wait", prep: "prep", end: "end" };
  const nst = map[st] || LIVE.st;
  if (nst === "end" && LIVE.st !== "end") liveFinish();
  const sig = [nst, room.host?.n, room.guest?.n, LIVE.err, room.rm].join("|");
  if (nst !== LIVE.st || sig !== LIVE.sig) { LIVE.st = nst; LIVE.sig = sig; if (VIEW === "live") go("live"); }
}
function liveQ() { return LIVE.room?.deck?.[LIVE.i] || null; }
function liveMount() {
  if (LIVE.st !== "q") return;
  const q = liveQ(), img = $("#limg");
  if (!q) return;
  LIVE.t0 = 0;
  const idx = LIVE.i;
  const start = () => {
    if (LIVE.t0 || LIVE.st !== "q" || LIVE.i !== idx) return;
    LIVE.t0 = performance.now();
    const bar = $("#ltbar"), T = (LIVE.room?.T || 10) * 1000;
    if (bar) { bar.style.transition = "none"; bar.style.transform = "scaleX(1)"; void bar.offsetWidth; bar.style.transition = `transform ${T}ms linear`; bar.style.transform = "scaleX(0)"; }
    clearTimeout(LIVE.tmr);
    LIVE.tmr = setTimeout(() => liveAnswer(""), T);
  };
  if (img) { img.onload = () => { img.parentElement.classList.add("loaded"); start(); }; img.onerror = start; img.src = q.l; }
  setTimeout(start, 3500);
  liveCheckReveal();
}
function liveAnswer(k) {
  const i = LIVE.i, q = liveQ();
  if (!q || LIVE.ans[i] || LIVE.rev === i) return;
  clearTimeout(LIVE.tmr);
  const ms = LIVE.t0 ? Math.round(performance.now() - LIVE.t0) : (LIVE.room?.T || 10) * 1000;
  const a = { k: k || "", ms: Math.min(ms, (LIVE.room?.T || 10) * 1000) };
  LIVE.ans[i] = a;
  $$("#lans [data-k]").forEach(b => { b.disabled = true; if (b.dataset.k === k) b.classList.add("sel"); });
  const bar = $("#ltbar"); if (bar) { const m = getComputedStyle(bar).transform; bar.style.transition = "none"; bar.style.transform = m === "none" ? "scaleX(0)" : m; }
  netReq("PUT", `duels/${LIVE.code}/ans/${LIVE.role}/${i}`, a).catch(() => toast("Réponse non envoyée (réseau ?)."));
  if (LIVE.room) { LIVE.room = { ...LIVE.room, ans: { ...(LIVE.room.ans || {}), [LIVE.role]: { ...(LIVE.room.ans?.[LIVE.role] || {}), [i]: a } } }; }
  liveUpdBar();
  liveCheckReveal();
}
function liveUpdBar() {
  const r = LIVE.room; if (!r) return;
  const sc = liveScores(r, LIVE.rev >= LIVE.i ? LIVE.i : LIVE.i - 1), me = LIVE.role, ot = otherRole(me);
  const a = $("#lsme"), b = $("#lsot");
  if (a) a.textContent = fmt(sc[me]);
  if (b) b.textContent = fmt(sc[ot]);
  const w = $("#lwait"), oa = r.ans?.[ot]?.[LIVE.i];
  if (w) w.textContent = LIVE.rev === LIVE.i ? "" : LIVE.ans[LIVE.i] ? (oa ? "" : `${r[ot]?.n || "L'adversaire"} réfléchit…`) : oa ? `${r[ot]?.n || "L'adversaire"} a répondu !` : "";
}
function liveCheckReveal() {
  const r = LIVE.room, i = LIVE.i, q = liveQ();
  if (!r || !q || LIVE.rev === i) return;
  const ah = r.ans?.host?.[i], ag = r.ans?.guest?.[i];
  if (!(ah && ag)) return;
  liveReveal();
}
function liveReveal() {
  const r = LIVE.room, i = LIVE.i, q = liveQ();
  if (!r || !q || LIVE.rev === i) return;
  LIVE.rev = i;
  clearTimeout(LIVE.tmr);
  const me = LIVE.role, ot = otherRole(me), am = r.ans?.[me]?.[i] || LIVE.ans[i], ao = r.ans?.[ot]?.[i];
  const box = $("#lans");
  if (box) {
    box.classList.add("locked");
    $$("[data-k]", box).forEach(b => {
      const k = b.dataset.k;
      b.disabled = true;
      if (k === q.k) b.classList.add("ok"); else if (am && k === am.k) b.classList.add("bad"); else b.classList.add("dim");
      if (ao && ao.k === k) b.insertAdjacentHTML("beforeend", `<span class="lop" title="${esc(r[ot]?.n || "")}">${esc((r[ot]?.n || "?").slice(0, 1).toUpperCase())}</span>`);
    });
  }
  const pm = livePts(am, q, r.T || 10), po = livePts(ao, q, r.T || 10);
  const res = $("#lres");
  if (res) { res.hidden = false; res.innerHTML = `<span class="${pm ? "g" : "b"}">${pm ? "+" + pm : "0"}<small>toi</small></span><span class="${po ? "g" : "b"}">${po ? "+" + po : "0"}<small>${esc(r[ot]?.n || "")}</small></span>`; }
  if (pm) sfx.ok(); else sfx.bad();
  liveUpdBar();
  if (LIVE.role === "host") {
    const last = i >= (r.deck.length - 1);
    setTimeout(() => {
      if (LIVE.code && LIVE.room && LIVE.i === i) netReq("PATCH", "duels/" + LIVE.code, last ? { st: "end" } : { cur: { i: i + 1, at: Date.now() } }).catch(() => {});
    }, 2600);
  }
}
/* L'hôte fait avancer la partie si l'autre joueur ne répond plus */
function liveHostTick() {
  const r = LIVE.room, i = LIVE.i;
  if (!r || LIVE.st !== "q" || LIVE.rev === i || !LIVE.ans[i]) return;
  if (r.ans?.guest?.[i]) return;
  const at = r.cur?.at || 0;
  if (Date.now() - at > ((r.T || 10) + 6) * 1000) {
    netReq("PUT", `duels/${LIVE.code}/ans/guest/${i}`, { k: "", ms: (r.T || 10) * 1000 }).catch(() => {});
  }
}
function liveFinish() {
  const r = LIVE.room;
  if (!r || LIVE.xpDone) return;
  LIVE.xpDone = true;
  const sc = liveScores(r, (r.deck || []).length), me = LIVE.role, ot = otherRole(me);
  const ok = me === "host" ? sc.okh : sc.okg, win = sc[me] > sc[ot];
  const gain = ok * 6 + (win ? 25 : 0);
  if (gain) addXp(gain);
  count("livegames"); if (win) count("livewin");
  const m = markPlayed();
  if (m) toast(m);
  checkBadges();
  save(true);
  topPush();
  setTimeout(() => { if (win) { sfx.lvl(); confetti(); } }, 300);
}
/* L'hôte rouvre la partie (même code) pour un nouvel adversaire */
function liveRewait() {
  if (LIVE.role !== "host" || !LIVE.code) return;
  clearTimeout(LIVE.tmr);
  Object.assign(LIVE, { err: "", i: -1, shown: -1, rev: -1, ans: {} });
  netReq("PATCH", "duels/" + LIVE.code, { st: "wait", deck: null, cur: null, ans: null }).catch(() => toast("Connexion perdue."));
}
function liveShare() {
  const url = location.href.split("#")[0] + "#duel=" + LIVE.code;
  const text = `Viens me défier sur Plumage ! Code ${LIVE.code}`;
  if (navigator.share) navigator.share({ title: "Duel Plumage", text, url }).catch(() => {});
  else copyText(text + " " + url, "Lien copié !");
}
function liveViewHtml() {
  const r = LIVE.room, me = LIVE.role, ot = otherRole(me), o = r?.[ot], my = r?.[me];
  const head = (t, back = "lleave") => `<header class="qbar"><button class="icon-btn" data-act="${back}" aria-label="Quitter">${ic("x")}</button><div class="ltitle">${t}</div><span style="width:44px"></span></header>`;
  if (LIVE.st === "gone") return `<section class="view live">${head("Duel", "lleave")}<div class="lcard"><div class="lbig">${ic("x")}</div><h2>Partie terminée</h2><p class="muted">${esc(LIVE.err || "")}</p><button class="btn primary wide" data-act="lleave">${ic("back")}Accueil</button></div></section>`;
  if (LIVE.st === "lobby" || !LIVE.code) {
    const jc = esc(LIVE.joinCode || "");
    return `<section class="view live">
  <div class="head"><button class="icon-btn" data-act="tab" data-tab="home" aria-label="Retour">${ic("back")}</button><h1 class="h1" style="flex:1">Duel en direct</h1></div>
  <div class="lhero"><span class="vs">${ic("bolt")}</span><p>1 contre 1, chacun son téléphone : mêmes photos, même chrono. Le plus juste et le plus rapide gagne.</p></div>
  ${netOn() ? "" : `<div class="notice"><span class="ic">${ic("info")}</span><span class="tx"><b>Bientôt en ligne</b><small>Le duel s'allume dès que le serveur de l'appli est branché.</small></span></div>`}
  <label class="fld"><span>Ton pseudo</span><input id="lpseudo" type="text" maxlength="16" autocomplete="nickname" placeholder="ex. Piaf33" value="${esc(S.set.pseudo || "")}"></label>
  <div class="sec">${ic("play")}Créer une partie</div>
  <div class="card lbox"><div class="lrow"><span class="lab">Chrono par question</span><div class="seg">${[5, 10, 15].map(v => `<button class="${+(S.set.liveT || 10) === v ? "on" : ""}" data-act="liveT" data-v="${v}">${v} s</button>`).join("")}</div></div>
    <p class="muted" style="font-size:13px;margin:8px 0 12px">10 photos d'oiseaux communs de ta zone (${esc(zoneLabel(S.set.zone))}), 4 choix.</p>
    <button class="btn primary wide" data-act="lcreate">${ic("bolt")}Créer et inviter</button></div>
  <div class="sec">${ic("arrow")}Rejoindre</div>
  <form class="card lbox ljoin" id="ljoin" autocomplete="off"><input id="lcode" type="text" inputmode="text" autocapitalize="characters" maxlength="5" placeholder="CODE" value="${jc}" aria-label="Code de la partie"><button class="btn primary" type="submit">${ic("check")}Rejoindre</button></form>
  <p class="muted note">Pendant un duel, la partie (pseudos, questions, réponses) passe par le serveur de l'appli et elle est effacée à la fin.</p>
</section>`;
  }
  if (LIVE.st === "wait" || LIVE.st === "prep") {
    const both = !!(r?.host && r?.guest);
    return `<section class="view live">${head("Duel en direct")}
  <div class="lcard">
    <span class="eyebrow">Code de la partie</span><div class="lcode">${esc(LIVE.code)}</div>
    <div class="lplayers"><div class="pl me"><span class="av">${esc((my?.n || "?").slice(0, 1).toUpperCase())}</span><b>${esc(my?.n || "")}</b><small>toi</small></div><span class="vs">VS</span>
      <div class="pl ${o ? "" : "wait"}"><span class="av">${o ? esc(o.n.slice(0, 1).toUpperCase()) : `<i class="dotp"></i>`}</span><b>${o ? esc(o.n) : "En attente…"}</b><small>${o ? "prêt" : "partage le code"}</small></div></div>
    ${LIVE.err ? `<p class="lerr">${esc(LIVE.err)}</p>` : ""}
    ${LIVE.st === "prep" ? `<div class="lprep"><div class="spin"></div><b>${me === "host" ? "Je prépare les questions…" : esc(r?.host?.n || "") + " prépare les questions…"}</b></div>`
      : me === "host" ? (both ? `<button class="btn primary wide" data-act="llaunch">${ic("play")}C'est parti !</button>` : `<button class="btn ghost wide" data-act="lshare">${ic("arrow")}Inviter un ami</button>`)
      : `<p class="muted">En attente que ${esc(r?.host?.n || "l'hôte")} lance la partie…</p>`}
    <p class="muted note">Chrono : ${r?.T || LIVE.T} s par question.</p>
  </div></section>`;
  }
  if (LIVE.st === "q") {
    const q = liveQ(), N = r?.deck?.length || 10, sc = liveScores(r, LIVE.i - 1);
    if (!q) return `<section class="view live">${head("Duel")}<div class="lcard"><div class="spin"></div></div></section>`;
    return `<section class="view live quiz">
  <header class="qbar"><button class="icon-btn" data-act="lleave" aria-label="Quitter">${ic("x")}</button>
    <div class="lscore"><span class="me"><b id="lsme">${fmt(sc[me])}</b><small>${esc(my?.n || "Toi")}</small></span><span class="qn">${LIVE.i + 1}/${N}</span><span class="ot"><b id="lsot">${fmt(sc[ot])}</b><small>${esc(o?.n || "")}</small></span></div>
    <span style="width:44px"></span></header>
  <div class="timer"><i id="ltbar"></i></div>
  <div class="lwarn" id="lwarn" hidden>${ic("wave", "xs")}${esc(o?.n || "L'adversaire")} ne répond plus…</div>
  <div class="stage"><figure class="shot" id="lshot"><img class="main" id="limg" alt="Oiseau à identifier" draggable="false"><span class="ret tl"></span><span class="ret tr"></span><span class="ret bl"></span><span class="ret br"></span><div class="spinner"><div class="spin"></div></div><figcaption class="credit">${esc(q.a || "")}</figcaption></figure></div>
  <div class="prompt"><div class="q">${ic("frame")}<span>Quelle espèce ?</span></div><span class="lwait" id="lwait"></span></div>
  <div class="answers" id="lans">${q.c.map(([k, fr, sci], j) => `<button class="choice" data-act="lpick" data-k="${esc(k)}"><span class="k">${j + 1}</span><span class="lbl"><b>${esc(fr)}</b>${sci && sci !== fr ? `<span class="latin">${esc(sci)}</span>` : ""}</span></button>`).join("")}</div>
  <div class="lres" id="lres" hidden></div>
</section>`;
  }
  if (LIVE.st === "end") {
    const sc = liveScores(r, (r?.deck || []).length), win = sc[me] > sc[ot], tie = sc[me] === sc[ot];
    const okm = me === "host" ? sc.okh : sc.okg, oko = me === "host" ? sc.okg : sc.okh, N = r?.deck?.length || 10;
    return `<section class="view live">${head("Duel terminé")}
  <div class="lcard lend ${win ? "win" : tie ? "tie" : "lose"}">
    <div class="lbig">${ic(win ? "trophy" : tie ? "duel" : "flame")}</div>
    <h2>${win ? "Victoire !" : tie ? "Égalité parfaite" : esc(o?.n || "L'adversaire") + " gagne"}</h2>
    <div class="lfinal"><div class="${sc[me] >= sc[ot] ? "lead" : ""}"><b>${fmt(sc[me])}</b><small>${esc(my?.n || "Toi")} · ${okm}/${N}</small></div><div class="${sc[ot] >= sc[me] ? "lead" : ""}"><b>${fmt(sc[ot])}</b><small>${esc(o?.n || "")} · ${oko}/${N}</small></div></div>
    <p class="muted note">100 points par bonne réponse, jusqu'à 50 de bonus selon la rapidité.</p>
    ${LIVE.err ? `<p class="lerr">${esc(LIVE.err)}</p>` : ""}
    ${me === "host" ? (r?.guest ? `<button class="btn primary wide" data-act="llaunch">${ic("replay")}Revanche</button>` : `<button class="btn primary wide" data-act="lrewait">${ic("plus")}Nouvel adversaire</button>`) : `<p class="muted">${esc(r?.host?.n || "")} peut lancer une revanche.</p>`}
    <button class="btn ghost wide" data-act="lleave" style="margin-top:10px">${ic("back")}Quitter</button>
  </div></section>`;
  }
  return `<section class="view live"><div class="lcard"><div class="spin"></div></div></section>`;
}
