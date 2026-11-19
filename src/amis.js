/* ============================================================
   Plumage — les amis (version de base)
   Chacun a un code ami (6 caractères) et un profil public minimal : pseudo, XP total, XP par groupe.
   Ajouter un ami = entrer son code (ou ouvrir son lien #ami=CODE). L'ami reçoit une demande
   et peut t'ajouter en retour d'un geste. Rien d'autre ne sort du téléphone.
   Base : prof/{uid} (profil), fcode/{CODE} → uid, fq/{uid}/{deQui} (demandes reçues).
   ============================================================ */
const FABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const AMI = { list: null, req: [], busy: false, err: "", open: "" };
const amiUid = async () => { if (!netLocal()) { await fbToken(); if (S.fb && S.fb.uid) return S.fb.uid; } return myUid(); };
const amiFmt = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

async function amiCode() {
  if (S.amiC) return S.amiC;
  const uid = await amiUid();
  for (let k = 0; k < 6; k++) {
    const c = rid(6, FABC);
    const cur = await netReq("GET", "fcode/" + c).catch(() => null);
    if (cur) continue;
    await netReq("PUT", "fcode/" + c, uid);
    S.amiC = c; save(true);
    return c;
  }
  throw new Error("CODE");
}
/* Mon profil public : publié quand j'ouvre les amis, puis à chaque fin de partie (au plus toutes les 15 s) */
let PROFT = 0;
async function profPush(force) {
  if (!netOn() || !S.amiC || !cleanName(S.set.pseudo)) return;
  if (!force && Date.now() - PROFT < 15000) return;
  PROFT = Date.now();
  const g = {};
  for (const [k, v] of Object.entries(gxpMap())) if (+v > 0) g[k] = Math.round(+v);
  try { await netReq("PUT", "prof/" + (await amiUid()), { n: cleanName(S.set.pseudo), xp: Math.round(S.xp || 0), g, c: S.amiC, t: Date.now(), on: Date.now() }); }
  catch (e) { /* hors ligne : on réessaiera */ }
}
const topPushAmi = topPush;
topPush = async (...a) => { profPush().catch(() => {}); return topPushAmi(...a); };

async function amiAdd(raw) {
  const c = amiFmt(raw);
  if (c.length !== 6) { toast("Un code ami fait 6 caractères."); return false; }
  if (c === S.amiC) { toast("C'est ton propre code !"); return false; }
  if (!amiNameOk()) return false;
  try {
    await amiCode();
    const uid = await netReq("GET", "fcode/" + c);
    if (!uid || typeof uid !== "string") { toast("Code inconnu. Vérifie-le."); return false; }
    const p = await netReq("GET", "prof/" + uid).catch(() => null);
    const me = await amiUid();
    S.amis = (S.amis || []).filter(a => a.u !== uid);
    S.amis.unshift({ u: uid, c, n: cleanName(p && p.n) || "" });
    save(true);
    netReq("PUT", `fq/${uid}/${me}`, { n: cleanName(S.set.pseudo), c: S.amiC, t: Date.now() }).catch(() => {});
    netReq("DELETE", `fq/${me}/${uid}`).catch(() => {});
    await profPush(true);
    toast(`${cleanName(p && p.n) || "Ton ami"} ajouté !`);
    return true;
  } catch (e) { toast("Connexion impossible. Vérifie ton réseau."); return false; }
}
function amiNameOk() {
  const inp = $("#apseudo") || $("#lpseudo"), v = cleanName(inp ? inp.value : S.set.pseudo);
  if (!v) { toast("Choisis d'abord un pseudo."); inp?.focus(); return false; }
  if (v !== S.set.pseudo) { S.set.pseudo = v; save(); }
  return true;
}
async function amiLoad() {
  const me = await amiUid();
  const ids = [me, ...(S.amis || []).map(a => a.u)];
  const profs = await Promise.all(ids.map(u => netReq("GET", "prof/" + u).catch(() => null)));
  AMI.list = ids.map((u, i) => {
    const p = profs[i], a = (S.amis || []).find(x => x.u === u);
    if (p && a && p.n && a.n !== cleanName(p.n)) a.n = cleanName(p.n);
    return { u, me: u === me, n: cleanName(p && p.n) || (a && a.n) || "?", xp: Math.max(0, Math.round(+(p && p.xp) || 0)), g: (p && p.g) || {}, t: Math.max(+(p && p.t) || 0, +(p && p.on) || 0), on: u === me || Date.now() - (+(p && p.on) || 0) < 150000, ok: !!p };
  });
  const rq = await netReq("GET", "fq/" + me).catch(() => null);
  AMI.req = Object.entries(rq || {}).filter(([u, v]) => v && !(S.amis || []).some(a => a.u === u)).map(([u, v]) => ({ u, n: cleanName(v.n) || "?", c: amiFmt(v.c), t: +v.t || 0 }));
  save();
}

/* ---------- L'écran ---------- */
function amiRowHtml(r) {
  const L = level(r.xp, 3), gs = Object.entries(r.g || {}).map(([g, x]) => [+g, +x]).filter(([, x]) => x > 0).sort((a, b) => b[1] - a[1]);
  const open = AMI.open === r.u;
  return `<li class="ami ${r.me ? "me" : ""} ${open ? "open" : ""}">
    <button class="amih" data-act="amiopen" data-u="${esc(r.u)}"><span class="av">${esc(r.n.slice(0, 1).toUpperCase())}<i class="dot ${r.on ? "on" : ""}" title="${r.on ? "En ligne" : "Hors ligne"}"></i></span>
      <span class="tx"><b>${esc(r.n)}${r.me ? " <small>(toi)</small>" : ""}</b><small>${r.ok ? `Niveau ${L.n} · ${esc(L.tier)}${r.me ? "" : r.on ? " · en ligne" : r.t ? " · vu " + esc(ago(r.t)) : ""}` : "Profil pas encore publié"}</small>
      <span class="agrp">${gs.slice(0, 5).map(([g, x]) => { const G = GROUPS.find(y => y.id === g); return G ? `<span style="--gc:${G.c}" title="${esc(G.n)}">${ic(G.ic)}${level(x, g).n}</span>` : ""; }).join("")}</span></span>
      <span class="xv">${fmt(r.xp)}<small>XP</small></span></button>
    ${open ? `<div class="amid">${gs.length ? gs.map(([g, x]) => { const G = GROUPS.find(y => y.id === g); if (!G) return ""; const Lg = level(x, g); return `<div class="amig" style="--gc:${G.c}"><span class="gi">${ic(G.ic)}</span><span><b>${esc(G.n)}</b><small>Niveau ${Lg.n} · ${esc(Lg.tier)}</small></span><span class="xv">${fmt(x)}<small>XP</small></span></div>`; }).join("") : `<p class="muted" style="font-size:13px">Pas encore d'XP.</p>`}
      ${r.me ? "" : `<button class="btn primary wide" data-act="amiduel" data-u="${esc(r.u)}" style="margin-top:8px">${ic("bolt")}Défier en duel</button><button class="btn ghost wide" data-act="amidel" data-u="${esc(r.u)}" style="margin-top:8px">${ic("trash")}Retirer de mes amis</button>`}</div>` : ""}
  </li>`;
}
/* ---------- Le profil (bouton rond au milieu de la barre) : tout, tous groupes confondus, puis les amis ---------- */
function amisBlockHtml() {
  const nm = esc(S.set.pseudo || ""), list = AMI.list ? AMI.list.slice().sort((a, b) => b.xp - a.xp) : null;
  return `${netOn() ? "" : `<div class="notice"><span class="ic">${ic("info")}</span><span class="tx"><b>Hors ligne</b><small>Les amis ont besoin du serveur de l'appli.</small></span></div>`}
  <div class="card amime">
    <label class="fld"><span>Ton pseudo</span><input id="apseudo" type="text" maxlength="16" autocomplete="nickname" placeholder="ex. Piaf33" value="${nm}"></label>
    <div class="acode"><span class="muted">Ton code ami</span><b id="amicode">${S.amiC ? esc(S.amiC) : "······"}</b></div>
    <div class="arow"><button class="btn primary" data-act="amishare">${ic("ext")}Inviter un ami</button><button class="btn ghost" data-act="amicopy">${ic("copy")}Copier</button></div>
    <p class="muted note">Tes amis voient ton pseudo, ton niveau et ton XP par groupe. Rien d'autre.</p>
  </div>
  <form class="card lbox ljoin" id="amiadd" autocomplete="off"><input id="amiin" type="text" autocapitalize="characters" maxlength="6" placeholder="CODE AMI" aria-label="Code ami"><button class="btn primary" type="submit">${ic("plus")}Ajouter</button></form>
  ${AMI.req.length ? `<div class="sec">${ic("bell")}Ils t'ont ajouté</div><div class="areq">${AMI.req.map(q => `<div class="aq"><span class="av">${esc(q.n.slice(0, 1).toUpperCase())}</span><b>${esc(q.n)}</b><button class="btn primary sm" data-act="amiback" data-c="${esc(q.c)}">${ic("plus")}Ajouter aussi</button><button class="icon-btn" data-act="amino" data-u="${esc(q.u)}" aria-label="Ignorer">${ic("x")}</button></div>`).join("")}</div>` : ""}
  <div class="sec">${ic("trophy")}Entre amis</div>
  <div id="amilist">${AMI.err ? `<div class="empty">${ic("wave")}<b>Amis injoignables</b><p>${esc(AMI.err)}</p></div>` : !netOn() ? "" : !list ? `<div class="sono-ph" style="height:120px"><div class="spin"></div></div>` : `<ol class="amilist">${list.map(amiRowHtml).join("")}</ol>${list.length < 2 ? `<p class="muted note">Pas encore d'ami : envoie ton code ou ton lien, ou entre le code d'un ami ci-dessus.</p>` : ""}`}</div>`;
}
const navInitial = () => { const n = cleanName(S.set.pseudo); return n ? esc(n.slice(0, 1).toUpperCase()) : ic("user"); };
function profilHtml() {
  const nm = cleanName(S.set.pseudo), L = level(S.xp, 3), st = liveStreak();
  const recs = Object.values(S.sp).filter(r => r.n > 0), master = recs.filter(r => stars(r) === 3).length;
  const tot = Object.values(S.stats).reduce((a, x) => ({ n: a.n + x.n, ok: a.ok + x.ok }), { n: 0, ok: 0 });
  const since = new Date(S.created || Date.now()).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const groups = GROUPS.map(g => ({ g, xp: gxp(g.id), L: level(undefined, g.id), sp: recs.filter(r => +(r.g || 3) === g.id).length })).sort((a, b) => b.xp - a.xp || (a.g.id === 3 ? -1 : 1));
  const played = groups.filter(x => x.xp > 0), rest = groups.filter(x => !x.xp);
  const grow = x => `<button class="xprow ${x.g.id === ROOT() ? "on" : ""}" data-act="grpset" data-id="${x.g.id}" style="--gc:${x.g.c}"><span class="gi">${ic(x.g.ic)}</span><span class="tx"><b>${esc(x.g.n)}</b><small>Niveau ${x.L.n} · ${esc(x.L.rank)}</small><span class="xb"><i style="width:${(x.L.p * 100).toFixed(1)}%"></i></span><small>${x.sp} espèce${x.sp > 1 ? "s" : ""} rencontrée${x.sp > 1 ? "s" : ""}</small></span><span class="xv">${fmt(x.xp)}<small>XP</small></span></button>`;
  return `<section class="view profil">
  <div class="pfhead"><span class="pfav">${nm ? esc(nm.slice(0, 1).toUpperCase()) : ic("user")}</span>
    <div class="pfid"><h1>${nm ? esc(nm) : "Ton profil"}</h1><small>Naturaliste depuis ${esc(since)}${S.amiC ? " · code ami " + esc(S.amiC) : ""}</small></div></div>
  <div class="card pflvl"><div class="pfl"><span class="lvb">${L.n}</span><span class="tx"><b>Niveau global ${L.n}</b><small>${fmt(S.xp)} XP, tous groupes · encore ${fmt(L.need - L.cur)} pour le niveau ${L.n + 1}</small></span></div><span class="lbar"><i style="width:${(L.p * 100).toFixed(1)}%"></i></span></div>
  <div class="pfstats">
    <div><b>${ic("flame")}${st}</b><small>jour${st > 1 ? "s" : ""} d'affilée<br>record ${S.streak?.best || st}</small></div>
    <div><b>${recs.length}</b><small>espèce${recs.length > 1 ? "s" : ""}<br>rencontrée${recs.length > 1 ? "s" : ""}</small></div>
    <div><b>${ic("star")}${master}</b><small>maîtrisée${master > 1 ? "s" : ""}</small></div>
    <div><b>${tot.n ? Math.round(100 * tot.ok / tot.n) : 0}<i>%</i></b><small>de bonnes<br>réponses</small></div>
  </div>
  <div class="sec">${ic("grid")}Mes groupes</div>
  <div class="xplist">${played.map(grow).join("") || `<p class="muted note">Joue une partie pour commencer.</p>`}</div>
  ${rest.length ? `<details class="pfmore"><summary>${rest.length} groupe${rest.length > 1 ? "s" : ""} pas encore joué${rest.length > 1 ? "s" : ""}</summary><div class="xplist">${rest.map(grow).join("")}</div></details>` : ""}
  <div class="sec" id="pfamis">${ic("duel")}Amis</div>
  <div id="pfab">${amisBlockHtml()}</div>
  <div class="pfend"><button class="btn ghost" data-act="tab" data-tab="top">${ic("trophy")}Classement</button><button class="btn ghost" data-act="tab" data-tab="progress">${ic("chart")}Mes progrès</button></div>
</section>`;
}
async function amisMount() {
  if (!netOn()) return;
  if (AMI.busy) { AMI.again = true; return; }   /* déjà en cours : on relancera une fois à la fin */
  AMI.busy = true; AMI.err = ""; AMI.again = false;
  try {
    if (cleanName(S.set.pseudo)) { await amiCode(); await profPush(true); }
    const c = $("#amicode"); if (c && S.amiC) c.textContent = S.amiC;
    await amiLoad();
  } catch (e) { AMI.err = "Vérifie ta connexion, puis reviens ici."; }
  AMI.busy = false;
  const box = $("#pfab");
  if (VIEW === "profil" && box) {
    const a = document.activeElement, keep = a && a.id === "apseudo" ? a.value : null;
    box.innerHTML = amisBlockHtml();
    if (keep !== null) { const i = $("#apseudo"); if (i) { i.value = keep; i.focus(); } }
  }
  if (AMI.scroll) { AMI.scroll = false; setTimeout(() => $("#pfamis")?.scrollIntoView({ block: "start", behavior: "smooth" }), 80); }
  if (AMI.again && VIEW === "profil") { AMI.again = false; amisMount(); }
}
VIEWS.profil = () => profilHtml();
MOUNT.profil = () => { navMe(); if (AMI.scroll) setTimeout(() => $("#pfamis")?.scrollIntoView({ block: "start" }), 30); return amisMount(); };
VIEWS.amis = VIEWS.profil; MOUNT.amis = MOUNT.profil;
ACT.amis = () => { closeLayer(); SES = null; AMI.list = null; AMI.scroll = true; go("profil"); };
/* L'initiale du pseudo dans le bouton rond */
function navMe() { const b = $("#navav"); if (b) b.innerHTML = navInitial(); }
document.addEventListener("change", e => { if (e.target && e.target.id === "apseudo") { const v = cleanName(e.target.value); if (v && v !== S.set.pseudo) { S.set.pseudo = v; save(); navMe(); profPush(true).catch(() => {}); } } });
navMe();
ACT.amiopen = el => { AMI.open = AMI.open === el.dataset.u ? "" : el.dataset.u; $("#amilist").innerHTML = `<ol class="amilist">${AMI.list.slice().sort((a, b) => b.xp - a.xp).map(amiRowHtml).join("")}</ol>`; };
ACT.amidel = el => {
  if (!el.dataset.armed) { el.dataset.armed = "1"; el.innerHTML = ic("trash") + "Confirmer ?"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.innerHTML = ic("trash") + "Retirer de mes amis"; } }, 4000); return; }
  const u = el.dataset.u; S.amis = (S.amis || []).filter(a => a.u !== u); save(true);
  AMI.list = (AMI.list || []).filter(r => r.u !== u); AMI.open = ""; toast("Retiré de tes amis."); rerender();
};
ACT.amiback = async el => { el.disabled = true; if (await amiAdd(el.dataset.c)) { AMI.list = null; rerender(); } else el.disabled = false; };
ACT.amino = async el => { const u = el.dataset.u; AMI.req = AMI.req.filter(q => q.u !== u); netReq("DELETE", `fq/${await amiUid()}/${u}`).catch(() => {}); rerender(); };
async function amiPrep() { if (!amiNameOk()) return null; try { const c = await amiCode(); profPush(true).catch(() => {}); const b = $("#amicode"); if (b) b.textContent = c; return c; } catch (e) { toast("Connexion impossible. Vérifie ton réseau."); return null; } }
ACT.amishare = async () => {
  const c = await amiPrep(); if (!c) return;
  const url = location.href.split("#")[0] + "#ami=" + c, text = `Ajoute-moi en ami sur Plumage ! Mon code : ${c}`;
  if (navigator.share) navigator.share({ title: "Plumage", text, url }).catch(() => {}); else copyText(text + " " + url, "Lien copié !");
};
ACT.amicopy = async () => { const c = await amiPrep(); if (c) copyText(c, "Code copié !"); };
document.addEventListener("submit", async e => {
  if (e.target.id !== "amiadd") return;
  e.preventDefault();
  const inp = $("#amiin"); inp?.blur();
  if (await amiAdd(inp ? inp.value : "")) { AMI.list = null; rerender(); }
});
/* Lien reçu : #ami=CODE → on ouvre les amis et on propose l'ajout */
function amiLinkHash() {
  const m = location.hash.replace("#", "").match(/^ami=([A-Za-z0-9]{6})$/);
  if (!m) return false;
  history.replaceState(null, "", location.pathname + location.search);
  AMI.pending = amiFmt(m[1]);
  /* iPhone : le lien s'ouvre dans Safari, qui est un « autre téléphone » que l'appli de l'écran d'accueil.
     Si Safari est vierge (on joue sûrement dans l'appli), on donne le code à entrer dans l'appli. */
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  if (ios && !standalone && !(S.xp > 0) && !Object.keys(S.sp || {}).length) {
    go("home");
    setTimeout(() => openLayer(`<div class="panel"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button><div class="in" style="padding-top:22px">
      <h2>Ajouter cet ami</h2>
      <p class="muted" style="font-size:14px;margin:6px 0 12px">Tu joues depuis l'icône Plumage de ton écran d'accueil ? Ouvre-la, touche le rond <b>Profil</b> en bas, et entre ce code :</p>
      <div class="acode" style="justify-content:center"><b style="font:400 40px/1 var(--f-display,serif);letter-spacing:.14em">${esc(AMI.pending)}</b></div>
      <button class="btn primary wide" data-act="amicopyp" style="margin-top:14px">${ic("copy")}Copier le code</button>
      <button class="btn ghost wide" data-act="amihere" style="margin:10px 0 22px">Non, je joue ici dans Safari</button></div></div>`), 300);
    return true;
  }
  AMI.list = null; AMI.scroll = true; go("profil");
  setTimeout(() => { const i = $("#amiin"); if (i) { i.value = AMI.pending; if (cleanName(S.set.pseudo)) $("#amiadd")?.requestSubmit(); else { toast("Choisis un pseudo, puis touche Ajouter."); $("#apseudo")?.focus(); } } }, 400);
  return true;
}
amiLinkHash();
window.addEventListener("hashchange", () => { if (!SES || SES.ended) amiLinkHash(); });


/* ---------- Défier un ami : un geste, sans retaper de code ----------
   Je crée la partie, puis je dépose une invitation dans dv/{ami}/{moi} : son téléphone l'affiche
   aussitôt (écoute en direct) avec « Rejoindre ». Une invitation vit 15 minutes. */
const DV = { stop: null, seen: {}, card: null };
async function amiDuel(u) {
  const a = (S.amis || []).find(x => x.u === u);
  if (!a) return;
  if (!amiNameOk()) return;
  closeLayer();
  await liveCreate();
  if (!LIVE.code || LIVE.role !== "host") return;
  try {
    const me = await amiUid();
    await netReq("PUT", `dv/${u}/${me}`, { n: cleanName(S.set.pseudo), code: LIVE.code, g: GRP().n, t: Date.now() });
    LIVE.invited = a.n || "ton ami";
    toast(`Invitation envoyée à ${LIVE.invited} !`);
  } catch (e) { toast("Invitation impossible : partage le code à la main."); }
}
ACT.amiduel = el => amiDuel(el.dataset.u);
ACT.lfriend = el => amiDuel(el.dataset.u);
function dvShow(from, v) {
  if (DV.card || !v || !v.code) return;
  if (VIEW === "live" && LIVE.code && ["wait", "prep", "q"].includes(LIVE.st)) return;   /* déjà en pleine partie */
  const box = document.createElement("div");
  box.className = "dvcard"; box.setAttribute("role", "alertdialog");
  box.innerHTML = `<span class="av">${esc(cleanName(v.n).slice(0, 1).toUpperCase() || "?")}</span><span class="tx"><b>${esc(cleanName(v.n) || "Un ami")} te défie !</b><small>Duel en direct${v.g ? " · " + esc(String(v.g).slice(0, 24)) : ""}</small></span><button class="btn primary sm" data-dv="go">${ic("bolt")}Rejoindre</button><button class="icon-btn" data-dv="no" aria-label="Plus tard">${ic("x")}</button>`;
  document.body.appendChild(box);
  DV.card = box;
  try { sfx.lvl(); } catch (e) { /* son facultatif */ }
  requestAnimationFrame(() => box.classList.add("on"));
  const done = async join => {
    box.remove(); DV.card = null; DV.seen[from] = v.t;
    try { netReq("DELETE", `dv/${await amiUid()}/${from}`).catch(() => {}); } catch (e) { /* rien */ }
    if (join) { if (cleanName(S.set.pseudo)) liveJoin(v.code); else { LIVE.joinCode = v.code; go("live"); } }
  };
  box.querySelector('[data-dv="go"]').addEventListener("click", () => done(true));
  box.querySelector('[data-dv="no"]').addEventListener("click", () => done(false));
}
function dvOnData(d) {
  const now = Date.now();
  for (const [from, v] of Object.entries(d || {})) {
    if (!v || typeof v !== "object") continue;
    if (now - (+v.t || 0) > 15 * 60000) { amiUid().then(me => netReq("DELETE", `dv/${me}/${from}`)).catch(() => {}); continue; }
    if (DV.seen[from] === v.t) continue;
    dvShow(from, v);
    break;
  }
}
async function dvListen(restart) {
  if (!netOn() || !S.amiC) return;
  if (DV.stop && !restart) return;
  if (DV.stop) { DV.stop(); DV.stop = null; }
  try { const me = await amiUid(); DV.stop = netListen("dv/" + me, dvOnData); } catch (e) { /* hors ligne : au prochain lancement */ }
}
/* Filet de sécurité : on relit aussi les invitations toutes les 20 s quand l'appli est à l'écran,
   et tout de suite quand on revient dessus (iOS coupe les connexions en arrière-plan) */
async function dvPoll() {
  if (!netOn() || !S.amiC || document.visibilityState !== "visible") return;
  try { dvOnData(await netReq("GET", "dv/" + (await amiUid()))); } catch (e) { /* hors ligne */ }
}
dvListen();
setInterval(dvPoll, 20000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { dvPoll(); dvListen(true); } });
window.addEventListener("online", () => { dvPoll(); dvListen(true); });
const amiCodeBase = amiCode;
amiCode = async (...a) => { const c = await amiCodeBase(...a); dvListen(); return c; };


/* ---------- En ligne / hors ligne : un signe de vie par minute tant que l'appli est à l'écran ---------- */
let PRESP = 0;
async function presencePing() {
  if (!netOn() || !S.amiC || !cleanName(S.set.pseudo) || document.visibilityState !== "visible") return;
  if (Date.now() - PRESP < 50000) return;
  PRESP = Date.now();
  try { await netReq("PATCH", "prof/" + (await amiUid()), { on: Date.now() }); } catch (e) { /* hors ligne */ }
}
setInterval(() => {
  presencePing();
  if (VIEW === "profil" && !AMI.busy && document.visibilityState === "visible") amisMount();   /* les pastilles des amis se mettent à jour */
}, 60000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { PRESP = 0; presencePing(); } });
setTimeout(presencePing, 3000);

ACT.amicopyp = () => copyText(AMI.pending || "", "Code copié ! Colle-le dans l'appli.");
ACT.amihere = () => { closeLayer(); AMI.list = null; AMI.scroll = true; go("profil"); setTimeout(() => { const i = $("#amiin"); if (i) { i.value = AMI.pending || ""; if (cleanName(S.set.pseudo)) $("#amiadd")?.requestSubmit(); else { toast("Choisis un pseudo, puis touche Ajouter."); $("#apseudo")?.focus(); } } }, 400); };
