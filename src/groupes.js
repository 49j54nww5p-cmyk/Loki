/* ============================================================
   Plumage — les autres groupes du vivant
   Le sélecteur en haut à gauche de l'accueil change de groupe.
   Oiseaux : l'appli complète. Autres groupes : un quiz simple
   (sessions de base + quiz sur mesure taxon par taxon), sans parcours ni coffres.
   ============================================================ */
const RANK_FR = { kingdom: "règne", phylum: "embranchement", subphylum: "sous-embr.", class: "classe", subclass: "sous-classe", superorder: "super-ordre", order: "ordre", suborder: "sous-ordre", infraorder: "infra-ordre", superfamily: "super-famille", family: "famille", subfamily: "sous-famille", tribe: "tribu", subtribe: "sous-tribu", genus: "genre", subgenus: "sous-genre", section: "section", complex: "complexe", species: "espèce", hybrid: "hybride", subspecies: "sous-espèce", variety: "variété", form: "forme" };
const rankFr = r => RANK_FR[r] || r || "";

/* Le bouton du sélecteur, en tête de l'accueil */
const grpBtn = () => { const G = GRP(); return `<button class="gsw" data-act="grp" style="--gc:${G.c}" aria-label="Groupe : ${esc(G.n)}. Changer">${ic(G.ic)}</button>`; };

function openGroupPicker() {
  openLayer(`<div class="panel"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button><div class="in" style="padding-top:22px">
    <h2>Que veux-tu apprendre ?</h2><p class="muted" style="margin:6px 0 14px;font-size:14px">Les oiseaux ont toute l'appli. Les autres groupes ont un quiz simple, réglable taxon par taxon.</p>
    <div class="grplist">${GROUPS.map(g => `<button class="grpit ${g.id === ROOT() ? "on" : ""}" data-act="grpset" data-id="${g.id}" style="--gc:${g.c}"><span class="gi">${ic(g.ic)}</span><b>${esc(g.n)}</b>${g.id === 3 ? `<small>Parcours, coffres, chants…</small>` : ""}${g.id === ROOT() ? ic("check", "s") : ""}</button>`).join("")}</div></div></div>`);
}

/* Choisir n'importe quel taxon du groupe : espèce, genre, famille, ordre… */
let TXQ = { q: "", t: 0, res: [] };
function openTaxPicker() {
  TXQ = { q: "", t: 0, res: [] };
  openLayer(`<div class="panel"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button><div class="in" style="padding-top:22px">
    <h2>${esc(GRP().n)} : choisir</h2><p class="muted" style="margin:6px 0 14px;font-size:14px">Cherche une espèce, un genre, une famille ou un ordre, en français ou en latin. Coche autant que tu veux.</p>
    <div class="search">${ic("search")}<input id="txsearch" type="search" placeholder="${esc(isBirds() ? "Ex. Larus, sternes, mésange bleue…" : "Ex. orchidées, Quercus, coccinelle…")}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    <div class="plist" id="txlist">${txListHtml()}</div>
    <button class="btn primary wide" data-act="txdone" style="margin-top:14px;position:sticky;bottom:12px">${ic("check")}Valider</button></div></div>`);
  setTimeout(() => $("#txsearch")?.focus(), 60);
}
function txListHtml() {
  const B = getB(), on = new Set((B.tx || []).map(x => x.id));
  if (!TXQ.q) {
    const sel = B.tx || [];
    return sel.length ? sel.map(x => `<button class="pitem on" data-act="txtog" data-id="${x.id}" data-n="${esc(x.n)}" data-r="${esc(x.r)}"><b style="font-weight:650">${esc(x.n)}</b><small>${esc(rankFr(x.r))}</small></button>`).join("") : `<p class="muted" style="font-size:14px;padding:8px 2px">Tape au moins 2 lettres.</p>`;
  }
  if (!TXQ.res.length) return `<p class="muted" style="font-size:14px;padding:8px 2px">${TXQ.busy ? "Recherche…" : "Rien trouvé dans ce groupe."}</p>`;
  return TXQ.res.map(t => { const n = t.fr ? `${t.fr} (${t.sci})` : t.sci; return `<button class="pitem ${on.has(t.id) ? "on" : ""}" data-act="txtog" data-id="${t.id}" data-n="${esc(t.fr || t.sci)}" data-r="${esc(t.rank)}">${t.img ? `<img src="${esc(t.img)}" alt="" style="width:36px;height:36px;border-radius:8px;object-fit:cover;flex:none">` : ""}<span style="flex:1;min-width:0"><b style="font-weight:650">${esc(n)}</b></span><small>${esc(rankFr(t.rank))}${t.n ? " · " + fmt(t.n) + " obs." : ""}</small></button>`; }).join("");
}
async function txSearch(q) {
  TXQ.q = q.trim();
  const my = ++TXQ.t;
  if (TXQ.q.length < 2) { TXQ.res = []; TXQ.busy = false; const l = $("#txlist"); if (l) l.innerHTML = txListHtml(); return; }
  TXQ.busy = true;
  await new Promise(r => setTimeout(r, 250));
  if (my !== TXQ.t) return;
  try {
    const d = await inat("/taxa/autocomplete", { q: TXQ.q, taxon_id: ROOT(), per_page: 15, locale: "fr", preferred_place_id: 6753, is_active: "true" });
    if (my !== TXQ.t) return;
    TXQ.res = (d.results || []).filter(t => t.id !== ROOT()).map(t => ({ id: t.id, sci: t.name, fr: cap(t.preferred_common_name || ""), rank: t.rank, n: t.observations_count || 0, img: t.default_photo?.square_url || "" }));
  } catch (e) { TXQ.res = []; }
  TXQ.busy = false;
  const l = $("#txlist"); if (l) l.innerHTML = txListHtml();
}
document.addEventListener("input", e => { if (e.target && e.target.id === "txsearch") txSearch(e.target.value); });

/* Les sessions de base des autres groupes */
const GSESS = [
  { k: "photo", n: "Photo", d: "Qui est-ce ?", ic: "frame" },
  { k: "terrain", n: "Terrain", d: "Photos d'observateurs", ic: "eye" },
  { k: "latin", n: "Latin", d: "Français ↔ latin", ic: "quill" },
  { k: "famille", n: "Familles", d: "Qui est parent ?", ic: "tree" },
  { k: "genre", n: "Genres", d: "Le bon genre", ic: "root" },
  { k: "ecrire", n: "Écrire", d: "Tape le nom", ic: "keyboard" },
  { k: "duel", n: "Duel", d: "Contre un ami, en direct", ic: "duel" }
];
function gsessCfg(k) {
  const b = { ...baseCfg(), grp: ROOT(), size: 150 };
  const s = GSESS.find(x => x.k === k) || GSESS[0];
  const c = { ...b, title: `${s.n} · ${GRP().n}`, icon: s.ic, stim: ["photo"] };
  if (k === "terrain") c.stim = ["field"];
  if (k === "latin") c.stim = ["fr", "la"];
  if (k === "famille") { c.target = "family"; c.size = 250; }
  if (k === "genre") { c.target = "genus"; c.size = 250; }
  if (k === "ecrire") c.format = "type";
  return c;
}
ACT.gplay = el => { if (el.dataset.k === "duel") { ACT.live(el); return; } LASTCFG = gsessCfg(el.dataset.k); startSession(LASTCFG); };
ACT.lgrp = el => { setGroup(+el.dataset.id); OTD = null; rerender(); };
ACT.gzone = el => pickZone(el.dataset.z, z => { S.set.gzone = z; save(); OTD = null; if (VIEW === "home") rerender(); });

/* L'accueil */
const homeBirds = VIEWS.home;
VIEWS.home = (...a) => {
  if (isBirds()) return homeBirds(...a).replace('<header class="hud">', '<header class="hud">' + grpBtn());
  const G = GRP(), L = level(), st = liveStreak(), due = dueList().length;
  const mine = x => +((x && x.cfg && x.cfg.grp) || 3) === ROOT();
  const favs = S.favs.map((f, i) => [f, i]).filter(([f]) => mine(f));
  const hi = (S.hist || []).findIndex(mine), last = hi >= 0 ? S.hist[hi] : null;
  const known = Object.values(S.sp).filter(r => inGrp(r) && r.n > 0).length;
  return `<section class="view home ghome" style="--gc:${G.c}">
  <header class="hud">${grpBtn()}
    <button class="hlvl" id="hlvl" data-act="tab" data-tab="progress" aria-label="Niveau ${L.n}, ${esc(L.rank)}"><span class="badge">${L.n}</span><span class="meta"><b>${esc(L.rank)}</b><span class="bar"><i style="width:${(L.p * 100).toFixed(1)}%"></i></span></span></button>
    <div class="pill flame ${st ? "" : "cold"}" title="Jours d'affilée">${ic("flame")}<span>${st}</span></div>
    ${xpPill()}
  </header>
  <div class="story">
    <button class="story-ph" id="otd" data-act="otd" aria-label="${esc(G.one)} du jour" disabled><img alt=""></button>
    <div class="story-low">
      <span class="k" id="otdK">${esc(dateFr())} · ${esc(zoneLabel(curZone()))}</span>
      <h1 id="otdName">${esc(G.n)}</h1><em class="latin" id="otdLa"></em>
      <div class="schips">
        <button class="glass" data-act="mini">${ic("bolt")}Mini quiz</button>
        <button class="glass" data-act="mode" data-mode="perso">${ic("sliders")}Quiz sur mesure</button>
      </div>
      <button class="hero-go" data-act="gplay" data-k="photo">${ic("play")}<span>Quiz photo <small class="hgs">${esc(G.n.toLowerCase())}</small></span></button>
    </div>
  </div>
  <div class="opt gz"><div class="opt-h">${ic("pin")}Zone<span class="val">${esc(zoneLabel(curZone()))}</span></div><div class="row">${zoneChips(curZone(), "gzone")}</div></div>
  ${due ? `<button class="lastp" data-act="review"><span class="ic">${ic("replay")}</span><span class="tx"><small>À revoir</small><b>${due} révision${due > 1 ? "s" : ""}</b><span>Les ${esc(G.n.toLowerCase())} qui t'échappent</span></span><span class="go">${ic("play")}Réviser</span></button>` : ""}
  ${favs.length ? `<div class="favs top" aria-label="Mes quiz">${favs.map(([f, i]) => `<button class="fav" data-act="fav" data-i="${i}">${ic("star")}${esc(f.title)}</button>`).join("")}</div>` : ""}
  ${last ? `<button class="lastp" data-act="histplay" data-i="${hi}"><span class="ic">${ic(last.cfg?.icon || "replay")}</span><span class="tx"><small>Dernière partie, ${esc(ago(last.t))}</small><b>${esc(last.title || "Partie")}</b><span>${last.ok}/${last.n} bonnes réponses, +${fmt(last.xp)} XP</span></span><span class="go">${ic("replay")}Rejouer</span></button>` : ""}
  <div class="sec">${ic("grid")}Sessions</div>
  <div class="mgrid">${GSESS.map((m, i) => `<button class="mtile g${i % 3}" data-act="gplay" data-k="${m.k}" title="${esc(m.d)}" style="--d:${i * 40}ms"><span class="ic">${ic(m.ic)}</span><b>${m.n}</b></button>`).join("")}</div>
  <p class="muted note gnote">${known ? `${known} espèce${known > 1 ? "s" : ""} déjà croisée${known > 1 ? "s" : ""} dans ce groupe. ` : ""}Parcours, coffres et chants restent réservés aux oiseaux.</p>
</section>`;
};
/* Le premier affichage de l'accueil a lieu avant le chargement de ce fichier : on y glisse le sélecteur */
(() => { const h = document.querySelector(".view.home .hud"); if (h && !h.querySelector(".gsw")) h.insertAdjacentHTML("afterbegin", grpBtn()); })();

/* ---------- XP par groupe : le panneau ouvert en touchant l'XP de l'accueil ---------- */
function openXpPanel() {
  const rows = GROUPS.map(g => ({ g, xp: gxp(g.id), L: level(undefined, g.id) })).sort((a, b) => b.xp - a.xp || (a.g.id === 3 ? -1 : 1));
  openLayer(`<div class="panel"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button><div class="in" style="padding-top:22px">
    <h2>Ton XP</h2><p class="muted" style="margin:6px 0 14px;font-size:14px">Chaque groupe a son XP, ses niveaux et ses titres. Touche un groupe pour y aller.</p>
    <div class="xplist">${rows.map(({ g, xp, L }) => `<button class="xprow ${g.id === ROOT() ? "on" : ""}" data-act="grpset" data-id="${g.id}" style="--gc:${g.c}"><span class="gi">${ic(g.ic)}</span><span class="tx"><b>${esc(g.n)}</b><small>${xp ? `Niveau ${L.n} · ${esc(L.rank)}` : "Pas encore joué"}</small>${xp ? `<span class="xb"><i style="width:${(L.p * 100).toFixed(1)}%"></i></span>` : ""}</span><span class="xv">${fmt(xp)}<small>XP</small></span></button>`).join("")}</div>
    <div class="xptot"><span>Total, tous groupes</span><b>${fmt(S.xp)} XP</b></div>
    <div class="xpact"><button class="btn ghost" data-act="amis">${ic("duel")}Amis</button><button class="btn ghost" data-act="xptop">${ic("trophy")}Classement</button></div></div></div>`);
  GROUPS.forEach(g => { if (g.id !== 3 && gxp(g.id) > 0 && !namesOf(g.id)) ensureNames(g.id).catch(() => {}); });
}
ACT.xpall = () => openXpPanel();
ACT.xptop = () => { closeLayer(); SES = null; go("top"); };
/* Au démarrage dans un groupe sans noms de niveau : on les récupère */
if (!isBirds() && !namesOf(ROOT())) ensureNames().then(() => { if (VIEW === "home") rerender(); }).catch(() => {});
