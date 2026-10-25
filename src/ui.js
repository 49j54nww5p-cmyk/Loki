/* ============================================================
   Plumage — interface
   ============================================================ */
let VIEW = "home", VDATA = null, OTD = null, LASTCFG = null, SILENT = "";
const OKW = ["Exact !", "Bien vu !", "Bravo !", "Parfait !", "Dans le mille !", "Yes !"];
const BADW = ["Raté…", "Pas cette fois", "Oups !", "Raté, retiens-la !"];
const VIEWS = {}, MOUNT = {};

function go(v, data) {
  if (VIEW === "quiz" && v !== "quiz") { sndStop(); clearQTimer(); hideFeedback(); }
  closeViewer(true);
  document.body.classList.remove("gfull");
  VIEW = v; VDATA = data;
  document.body.classList.toggle("inquiz", ["quiz", "loading", "result", "error", "builder", "trip", "hand", "handsp", "live", "defi", "paths", "path"].includes(v));
  const tabv = v === "about" ? "settings" : v;
  $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === tabv));
  if (v !== "quiz") setAmbient(null);
  if (v !== "result" && v !== "quiz" && v !== "live" && v !== "defi") stopFx();
  const app = $("#app");
  app.classList.remove("waiting");
  app.innerHTML = (VIEWS[v] || VIEWS.home)(data);
  window.scrollTo(0, 0);
  if (MOUNT[v]) MOUNT[v](data);
}
function setAmbient(url) {
  const a = $("#ambient");
  if (!a) return;
  if (!url) { a.classList.remove("on"); return; }
  const im = a.querySelector("img");
  im.onload = () => a.classList.add("on");
  if (im.src !== url) im.src = url; else a.classList.add("on");
}
function toast(msg, ms = 2800) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, ms);
}
function floatXp(n) {
  if (!n) return;
  const st = $(".stage"), r = st ? st.getBoundingClientRect() : { left: innerWidth / 2, top: 120, width: 0, height: 0 };
  const el = document.createElement("div");
  el.className = "floatxp";
  el.textContent = "+" + n + " XP";
  el.style.left = (r.left + r.width / 2) + "px";
  el.style.top = (r.top + Math.min(r.height / 2, 160)) + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}
let FXID = 0;
function stopFx() { FXID++; const cv = $("#fx"); if (cv) cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); }
function confetti(n = 90) {
  if (VIEW !== "result" && VIEW !== "quiz" && VIEW !== "live" && VIEW !== "defi") return;
  if (S.set.calm || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  const id = ++FXID;
  const cv = $("#fx"), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  const g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ["#1FD1F2", "#3D7BFF", "#14B8A6", "#FF8B3D", "#FFCB5C", "#FF6FA3"];
  const P = Array.from({ length: n }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .38, vx: (Math.random() - .5) * 10, vy: -Math.random() * 12 - 4, r: Math.random() * 6, vr: (Math.random() - .5) * .35, w: 4 + Math.random() * 5, h: 9 + Math.random() * 12, c: pick(cols) }));
  let last = performance.now();
  const frame = t => {
    const dt = Math.min(34, t - last) / 16; last = t;
    g.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of P) {
      p.vy += .3 * dt; p.vx *= .992; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.y < innerHeight + 30) alive++;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
      g.beginPath(); g.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(-.5, -p.h / 2, 1, p.h);
      g.restore();
    }
    if (id !== FXID) { g.clearRect(0, 0, innerWidth, innerHeight); return; }
    if (alive) requestAnimationFrame(frame); else g.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(frame);
}
const starsHtml = (n, max = 3) => `<span class="stars" aria-label="${n} sur ${max}">${Array.from({ length: max }, (_, i) => ic("star", i < n ? "" : "off")).join("")}</span>`;
const imgOf = t => t?.img?.md || S.sp[t?.id]?.md || "";
function dateLong(s) { try { return new Date(s + (s.length <= 10 ? "T12:00:00" : "")).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return s; } }
const fmtT = s => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

/* ---------- Zones ---------- */
const ZONES = [
  { k: "fr", n: "France", get: async () => ({ k: "fr", id: 6753, name: "France" }) },
  { k: "gi", n: "Gironde", get: async () => { const p = await namedPlace("Gironde", 20); if (!p) throw new Error("lieu"); return { k: "gi", ...p, name: "Gironde" }; } },
  { k: "near", n: "Autour de moi", get: () => geoloc() },
  { k: "eu", n: "Europe", get: async () => ({ k: "eu", ...(await namedPlace("Europe", -10, 97391)), name: "Europe" }) },
  { k: "w", n: "Monde", get: async () => null }
];
const zoneKey = z => z ? (z.k || (z.lat != null ? "near" : z.id === 6753 ? "fr" : "p" + z.id)) : "w";
function geoloc() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error("geo"));
    navigator.geolocation.getCurrentPosition(
      p => res({ k: "near", lat: +p.coords.latitude.toFixed(3), lng: +p.coords.longitude.toFixed(3), r: 25, name: "Autour de moi" }),
      e => rej(e), { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
  });
}
function zoneChips(cur, act) {
  const k = zoneKey(cur);
  const custom = !ZONES.some(z => z.k === k) && cur ? `<button class="opt-btn on" data-act="${act}" data-z="keep">${ic("pin")}${esc(cur.name)}</button>` : "";
  return `${ZONES.map(z => `<button class="opt-btn ${z.k === k ? "on" : ""}" data-act="${act}" data-z="${z.k}">${ic(z.k === "near" ? "locate" : z.k === "w" ? "globe" : "pin")}${z.n}</button>`).join("")}${custom}<button class="opt-btn" data-act="${act}" data-z="search">${ic("search")}Autre lieu</button>`;
}
async function pickZone(zk, apply) {
  if (zk === "keep") return;
  if (zk === "search") { openPlacePicker(apply); return; }
  const z = ZONES.find(x => x.k === zk);
  if (!z) return;
  try { apply(await z.get()); }
  catch (e) { toast(zk === "near" ? "Localisation refusée ou indisponible." : "Lieu introuvable pour l'instant (réseau ?)."); }
}

/* ---------- Accueil ---------- */
const MODEGROUPS = [["Reconnaître", "eye", ["photo", "chant", "ecrire", "duel"]], ["Comprendre", "book", ["latin", "famille", "racines", "main"]], ["Explorer", "globe", ["parcours", "geo", "sortie"]]];
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.navigator.standalone === true || !!(window.matchMedia && matchMedia("(display-mode: standalone)").matches);
const installCard = () => isIOS() && !isStandalone() && Date.now() - (S.hint?.install || 0) > 30 * DAY
  ? `<div class="notice inst"><span class="ic">${ic("down")}</span><span class="tx"><b>Installe l'appli sur ton écran d'accueil</b><small>Dans Safari : Partager, puis « Sur l'écran d'accueil ». Sinon Safari peut effacer ta progression après 7 jours sans visite.</small></span><button class="icon-btn" data-act="insthide" aria-label="Masquer">${ic("x")}</button></div>` : "";
function needBackup() {
  const n = Object.values(S.sp).filter(r => r.n > 0 || r.nobs > 0).length, now = Date.now();
  if (n < 8 && S.xp < 300) return false;
  if (now - (S.bk?.snooze || 0) < 3 * DAY) return false;
  return !S.bk?.last || now - S.bk.last > 14 * DAY;
}
const backupCard = () => needBackup()
  ? `<div class="notice bk"><span class="ic">${ic("shield")}</span><span class="tx"><b>Mets ta progression à l'abri</b><small>${S.bk?.last ? "Dernière sauvegarde " + esc(ago(S.bk.last)) + ". " : "Elle n'existe que sur ce téléphone. "}Envoie-toi une copie : Fichiers, iCloud, mail…</small><span class="acts"><button class="btn primary sm" data-act="backup">${ic("down")}Sauvegarder</button><button class="lnk" data-act="bklater">Plus tard</button></span></span></div>` : "";
async function backupNow() {
  const name = `plumage-sauvegarde-${dayKey()}.json`, text = JSON.stringify({ ...S, set: { ...S.set, xc: "" } });
  let file = null;
  try { file = new File([text], name, { type: "application/json" }); } catch (e) { /* rien */ }
  if (file && navigator.share && navigator.canShare) {
    let ok = false;
    try { ok = navigator.canShare({ files: [file] }); } catch (e) { ok = false; }
    if (ok) {
      try { await navigator.share({ files: [file], title: "Sauvegarde Plumage" }); markBackup(); toast("Sauvegarde envoyée."); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
  }
  download(name, text, "application/json");
  markBackup();
  toast("Sauvegarde téléchargée (dossier Téléchargements).");
}
function markBackup() { S.bk = { ...(S.bk || {}), last: Date.now() }; save(true); $$(".notice.bk").forEach(x => x.remove()); const l = $("#bklast"); if (l) l.textContent = "Dernière : " + ago(S.bk.last) + "."; }
VIEWS.home = () => {
  const L = level(), st = liveStreak(), d = S.days[dayKey()], done = !!d?.serie, due = dueList().length;
  const goal = done ? 1 : clamp((d?.xp || 0) / (S.set.goal || 150), 0, 1), C = 2 * Math.PI * 66;
  const last = (S.hist || [])[0];
  const hot = !playedToday() && new Date().getHours() >= 17;
  return `<section class="view home">
  <header class="hud">
    <div class="brand"><span class="mark">${ic("bird")}</span>Plumage</div>
    <div class="pill flame ${st ? "" : "cold"} ${hot ? "hot" : ""}" title="Jours d'affilée">${ic("flame")}<span>${st}</span></div>
    <button class="pill xp" data-act="tab" data-tab="top" title="Classement">${ic("spark")}<span>${fmt(S.xp)}</span></button>
  </header>
  <div class="hero">
    <div class="bgimg" id="heroBg"><img alt=""></div>
    <div class="hero-top"><span class="eyebrow">Série du jour</span><span class="hero-date">${esc(dateFr())}</span></div>
    <div class="orb-wrap"><button class="orb ${done ? "done" : ""}" data-act="daily" aria-label="Lancer la série du jour">
      <svg class="ring" viewBox="0 0 148 148" aria-hidden="true"><circle class="track" cx="74" cy="74" r="66"/><circle class="prog" cx="74" cy="74" r="66" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - goal)).toFixed(1)}"/></svg>
      <span class="core">${ic(done ? "check" : "play")}</span></button></div>
    <h1>${done ? "Série bouclée !" : "12 questions, sans chrono"}</h1>
    <div class="sub">${done ? "Rejoue quand tu veux, ou change de mode." : `Environ 4 min · photos, chants, latin, familles · ${esc(zoneLabel(S.set.zone))}`}</div>
    <div class="mix" aria-hidden="true"><span>${ic("frame")}</span><span>${ic("wave")}</span><span>${ic("quill")}</span><span>${ic("tree")}</span><span>${ic("duel")}</span></div>
    <button class="otd" id="otd" data-act="otd" hidden><img alt=""><span><small>Oiseau du jour</small><b></b></span>${ic("arrow")}</button>
  </div>
  <button class="perso-cta" data-act="mode" data-mode="perso">
    <span class="ic">${ic("sliders")}</span>
    <span class="tx"><b>Sur mesure</b><small>Une recette en un geste, ou tout régler toi-même</small>
      <span class="pills"><span>${ic("spark", "xs")}10 recettes</span><span>${ic("pin", "xs")}Lieu</span><span>${ic("tree", "xs")}Familles</span><span>${ic("wave", "xs")}Chants</span><span>${ic("clock", "xs")}Chrono</span></span></span>
    <span class="go">${ic("arrow")}</span>
  </button>
  ${pathHomeCard()}
  ${weekCard()}
  ${S.favs.length ? `<div class="favs top" aria-label="Mes quiz">${S.favs.map((f, i) => `<button class="fav" data-act="fav" data-i="${i}">${ic("star")}${esc(f.title)}</button>`).join("")}</div>` : ""}
  ${installCard()}${backupCard()}
  <div class="quick">
    <button class="qbtn" data-act="mini"><span class="ic">${ic("bolt")}</span><span><b>Mini-série</b><small>3 questions, 1 min</small></span></button>
    <button class="qbtn due ${due ? "" : "zero"}" data-act="review"><span class="ic">${ic("replay")}</span><span><b>${due ? due + " à revoir" : "Révisions"}</b><small>${due ? "Répétition espacée" : "Rien à revoir"}</small></span></button>
  </div>
  ${last ? `<button class="lastp" data-act="histplay" data-i="0"><span class="ic">${ic(last.cfg?.icon || "replay")}</span><span class="tx"><small>Dernière partie · ${esc(ago(last.t))}</small><b>${esc(last.title || "Partie")}</b><span>${last.ok}/${last.n} bonnes réponses · +${fmt(last.xp)} XP</span></span><span class="go">${ic("replay")}Rejouer</span></button>` : ""}
  <button class="lvlbar" data-act="tab" data-tab="progress"><span class="badge">${L.n}</span><span class="meta"><b>${esc(L.rank)}</b><small>${fmt(L.cur)} / ${fmt(L.need)} XP</small><span class="bar"><i style="width:${(L.p * 100).toFixed(1)}%"></i></span></span></button>
  ${MODEGROUPS.map(([g, icn, ks], gi) => `<div class="sec">${ic(icn)}${g}</div>
  <div class="tiles">${ks.map(k => MODES.find(m => m.k === k)).filter(Boolean).map((m, i) => `<button class="tile" style="--c:${m.c};animation-delay:${(gi * 4 + i) * 35}ms" data-act="mode" data-mode="${m.k}"><span class="ic">${ic(m.ic)}</span><span><b>${m.n}</b><small>${m.d}</small></span></button>`).join("")}</div>`).join("")}
</section>`;
};
MOUNT.home = async () => {
  try {
    const pool = await getPool({ zone: S.set.zone, freq: "common", size: 150 });
    if (VIEW !== "home") return;
    const top = pool.list.filter(t => t.img).slice(0, 80);
    if (!top.length) return;
    const t = OTD = top[hashStr(dayKey() + zoneKey(S.set.zone)) % top.length];
    const b = $("#otd");
    if (!b) return;
    b.querySelector("img").src = t.img.sq;
    b.querySelector("b").textContent = nameFr(t);
    b.hidden = false;
    const bg = $("#heroBg");
    if (bg) { const im = bg.querySelector("img"); im.onload = () => bg.classList.add("on"); im.src = t.img.md; }
  } catch (e) { /* hors ligne */ }
};

/* ---------- Chargement & erreurs ---------- */
VIEWS.loading = d => `<section class="view loading"><div>
  <div class="lens"><span></span><span></span><span></span>${ic(d?.icon || "binoc")}</div>
  <b>${esc(d?.title || "Mise au point…")}</b><small>Mise au point sur iNaturalist…</small>
  <div id="slow" hidden><small style="margin-top:14px;color:var(--gold)">Ça prend plus de temps que prévu (réseau lent ou iNaturalist chargé).</small><button class="btn primary" data-act="retry" style="margin-top:12px">${ic("replay")}Réessayer</button></div>
  <button class="btn ghost" data-act="home" style="margin-top:14px">Annuler</button></div></section>`;
MOUNT.loading = () => { const v = VDATA; setTimeout(() => { if (VIEW === "loading" && VDATA === v) { const s = $("#slow"); if (s) s.hidden = false; } }, 12000); };
function showError(e, cfg, mid) { LASTCFG = cfg; go("error", { e, cfg, mid }); }
VIEWS.error = ({ e }) => {
  const code = e?.code || e?.message;
  let t = "Connexion impossible", s = "iNaturalist ne répond pas. Vérifie ton réseau puis réessaie.", ico = "wave";
  let btn = `<button class="btn primary" data-act="retry">${ic("replay")}Réessayer</button>`;
  if (code === "EMPTY") { t = "Aucun oiseau trouvé"; s = "Élargis la zone ou change de filtre."; ico = "binoc"; btn = `<button class="btn primary" data-act="tab" data-tab="home">${ic("back")}Retour</button>`; }
  if (code === "NODUE") { t = "Rien à réviser"; s = "Tout est à jour. Lance plutôt la série du jour !"; ico = "check"; btn = `<button class="btn primary" data-act="daily">${ic("play")}Série du jour</button>`; }
  if (code === "NOINAT") { t = "Pseudo iNaturalist manquant"; s = "Ajoute-le dans Réglages pour jouer avec tes observations."; ico = "eye"; btn = `<button class="btn primary" data-act="tab" data-tab="settings">${ic("sliders")}Réglages</button>`; }
  return `<section class="view loading"><div><div class="lens">${ic(ico)}</div><b>${t}</b><small>${s}</small>
  <div style="display:flex;gap:10px;justify-content:center;margin-top:24px;flex-wrap:wrap">${btn}<button class="btn ghost" data-act="home">Accueil</button></div></div></section>`;
};

/* ---------- Quiz ---------- */
function promptText(q) {
  if (q.kind === "hand") return q.prompt;
  if (q.kind === "geo") return "Où sommes-nous ?";
  if (q.kind === "root") return "Que veut dire ce mot ?";
  if (q.stim === "soncho") return "Lequel est son chant ?";
  if (q.level === "genus") return "Quel genre ?";
  if (q.level === "family") return "Quelle famille ?";
  if (q.level === "order") return "Quel ordre ?";
  if (q.stim === "fr") return "Son nom latin ?";
  if (q.stim === "la") return "Son nom français ?";
  return "Quelle espèce ?";
}
function promptIcon(q) {
  if (q.kind === "hand") return q.icon || "ring";
  if (q.kind === "geo") return "globe";
  if (q.kind === "root") return "root";
  if (q.level === "family" || q.level === "order") return "tree";
  return { photo: "frame", field: "eye", son: "wave", soncho: "wave", fr: "quill", la: "quill" }[q.stim] || "frame";
}
function stageHtml(q) {
  if (q.kind === "hand") return handStage(q);
  if (q.kind === "geo") return `<div class="gstrip" id="gstrip">${q.sp.map((s, i) => `<figure data-act="zoom" data-grp="gs" data-src="${esc(s.lg || s.img)}" data-hd="${esc(s.hd || "")}" data-cap="Oiseau ${i + 1} / ${q.sp.length}" data-attr="${esc(s.attr || "")}"><img src="${esc(s.lg || s.img)}" data-alt="${esc(s.img)}" alt="Oiseau ${i + 1}" draggable="false"><span class="k">${i + 1}</span><span class="zb">${ic("zoom")}</span><figcaption>${esc(s.fr)}</figcaption></figure>`).join("")}</div>`;
  if (q.kind === "root") return `<div class="namecard"><div><span class="eyebrow">Racine latine</span><div class="big latin">${esc(q.w)}</div>${q.ex ? `<div class="ex">dans <span class="latin">${esc(q.ex.sci)}</span></div>` : ""}</div></div>`;
  const bonus = q.bonus ? `<span class="tag-bonus">${ic("spark")}Rareté ×2</span>` : "";
  if (q.stim === "son") return `<div class="sound" id="sound">${bonus}
    <div class="sono-wrap" id="sonoWrap" data-act="seek" aria-label="Spectrogramme : touche pour te placer"><div class="sono-ph"><div class="spin"></div></div></div>
    <div class="sound-ctl"><button class="playbig" id="playBtn" data-act="play" aria-label="Écouter">${ic("play")}</button><div class="scrub"><i id="scrub"></i></div><span class="stime" id="stime">0:00</span></div>
    <div class="sopts">${sndOpts()}</div></div>`;
  if (q.stim === "fr") return `<div class="namecard"><div><span class="eyebrow">Nom français</span><div class="big">${esc(q.t.fr || q.t.sci)}</div></div></div>`;
  if (q.stim === "la") return `<div class="namecard"><div><span class="eyebrow">Nom latin</span><div class="big latin">${esc(q.t.sci)}</div></div></div>`;
  const p = q.photo || {};
  return `<figure class="shot" id="shot" data-act="zoom" data-grp="q" data-src="${esc(p.lg || p.md)}" data-hd="${esc(hdOf(p.lg || p.md))}" data-attr="${esc(p.attr || "")}">
    <img class="blur" src="${esc(p.md)}" alt="">
    <img class="main" id="mainImg" alt="Oiseau à identifier" draggable="false">
    <span class="ret tl"></span><span class="ret tr"></span><span class="ret bl"></span><span class="ret br"></span>
    <span class="zb">${ic("zoom")}</span>
    <div class="spinner"><div class="spin"></div></div>
    ${q.photo?.age ? `<span class="tag-field age">${ic("spark")}${AGEN[q.photo.age]}</span>` : q.stim === "field" ? `<span class="tag-field">${ic("eye")}Terrain</span>` : ""}${bonus}
    ${q.stim === "soncho" ? `<figcaption class="credit" style="font-size:13px;font-weight:700;color:#fff">${esc(nameFr(q.t))}</figcaption>` : `<figcaption class="credit">${esc(p.attr || "")}</figcaption>`}
  </figure>`;
}
function choiceLabel(c) {
  if (c.t) {
    if (c.mode === "la") return `<span class="latin solo">${esc(c.sci)}</span>`;
    if (c.mode === "fr") return `<b>${esc(c.fr)}</b>`;
    return `<b>${esc(c.fr)}</b>${c.fr !== c.sci ? `<span class="latin">${esc(c.sci)}</span>` : ""}`;
  }
  if (/^[0-5]{10}$/.test(c.label || "")) return `<b class="mono">${esc(c.label)}</b>`;
  if (c.latin) return `<span class="latin solo">${esc(c.label)}</span>${c.sub ? `<small class="muted">${esc(c.sub)}</small>` : ""}`;
  return `<b>${esc(c.label)}</b>${c.sub ? `<small class="muted">${esc(c.sub)}</small>` : ""}`;
}
function typePlaceholder(q) {
  if (q.level === "genus") return "Genre (en latin)…";
  if (q.level === "family") return "Famille, ex. Laridés…";
  if (q.level === "order") return "Ordre, ex. Passériformes…";
  if (q.stim === "fr") return "Nom latin…";
  if (q.stim === "la") return "Nom français…";
  return q.names === "fr" ? "Nom français…" : q.names === "la" ? "Nom latin…" : "Nom français ou latin…";
}
function answersHtml(q) {
  const ch = q.choices || [];
  if (q.kind === "hand") { const h = handAnswers(q); if (h) return h; }
  if (q.format === "map") return window.L ? `<div class="gwrap" id="gwrap"><div class="gmap" id="gmap"></div>
    <div class="gctl"><button class="mbtn" data-act="mapfull" aria-label="Agrandir la carte">${ic("expand")}</button><button class="mbtn" data-act="mapmenu" aria-label="Fond de carte">${ic("layers")}</button></div>
    <div class="gthumbs">${q.sp.map((s, i) => `<button data-act="zoom" data-grp="gt" data-src="${esc(s.lg || s.img)}" data-hd="${esc(s.hd || "")}" data-cap="Oiseau ${i + 1} / ${q.sp.length}" data-attr="${esc(s.attr || "")}" aria-label="Photo ${i + 1}"><img src="${esc(s.img)}" alt="" draggable="false"></button>`).join("")}</div>
    <div class="mmenu" id="mmenu" hidden>${mapMenuHtml()}</div></div>
    <button class="btn primary wide" id="gok" data-act="geook" disabled style="margin-top:10px">${ic("pin")}<span>Place ton pin</span></button>` : `<p class="muted">Carte indisponible.</p><button class="btn primary wide" data-act="replaceq">${ic("shuffle")}Autre question</button>`;
  if (q.format === "type") return `<form class="typer" id="typer" autocomplete="off"><input id="ans" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="${esc(typePlaceholder(q))}" aria-label="Ta réponse"><button class="btn primary" type="submit" aria-label="Valider">${ic("check")}</button></form><div class="sugg" id="sugg"></div><button class="skip" data-act="skip">Je ne sais pas</button>`;
  if (q.format === "flash") return `<div class="flashbox"><button class="btn ghost wide" data-act="reveal" style="height:62px">${ic("eye")}Voir la réponse</button></div>`;
  if (q.format === "audio") return ch.map((c, i) => `<div class="achoice" data-k="${c.key}" data-i="${i}" style="animation-delay:${i * 50}ms"><button class="pl" data-act="aplay" data-i="${i}" aria-label="Écouter l'enregistrement ${String.fromCharCode(65 + i)}">${ic("play")}</button><div class="msono" data-act="rseek" data-sl="a" data-i="${i}"><div class="wv" aria-hidden="true">${Array.from({ length: 14 }, (_, j) => `<i style="height:${30 + ((j * 37 + i * 11) % 60)}%"></i>`).join("")}</div></div><button class="pick" data-act="pick" data-k="${c.key}">${String.fromCharCode(65 + i)} · Lui</button></div>`).join("") + `<div class="sopts">${sndOpts()}</div>`;
  if (q.format === "tiles") {
    const nm = c => q.names === "la" ? `<span class="latin">${esc(c.sci)}</span>` : esc(c.fr);
    return `<div class="tgrid">${ch.map((c, i) => `<button class="tchoice" data-act="pick" data-k="${c.key}" style="animation-delay:${i * 45}ms"><img src="${esc(c.t.img?.md || "")}" alt="${esc(c.fr)}" data-fit draggable="false"><span class="k">${i + 1}</span><span class="nm">${nm(c)}</span></button>`).join("")}</div>`;
  }
  return ch.map((c, i) => `<button class="choice" data-act="pick" data-k="${c.key}" style="animation-delay:${i * 40}ms"><span class="k">${i + 1}</span><span class="lbl">${choiceLabel(c)}</span><svg class="i mark" aria-hidden="true"><use href="#i-check"/></svg></button>`).join("");
}
VIEWS.quiz = q => {
  const ses = SES, n = ses.len;
  const dots = n && n <= 20
    ? `<div class="dots" aria-label="Progression">${Array.from({ length: n }, (_, i) => { const r = ses.results[i]; return `<i class="${r ? (r.ok ? "ok" : r.part ? "part" : "bad") : i === ses.results.length ? "cur" : ""}"></i>`; }).join("")}</div>`
    : `<div class="counter">${ses.deadline ? "Défi 60 s · " : ""}${ses.results.filter(r => r.ok).length} / ${ses.results.length}</div>`;
  return `<section class="view quiz">
  <header class="qbar"><button class="icon-btn" data-act="quit" aria-label="Quitter">${ic("x")}</button>${dots}<div class="combo ${ses.combo ? "" : "zero"}" id="combo" title="Combo">${ic("flame")}<span>${ses.combo}</span></div></header>
  ${(ses.cfg.timer === 10 || ses.deadline) ? `<div class="timer"><i id="tbar"></i></div>` : ""}
  <div class="stage">${stageHtml(q)}</div>
  <div class="prompt"><div class="q">${ic(promptIcon(q))}<span>${promptText(q)}</span></div>${q.hints && q.hints.length ? `<button class="hintbtn" data-act="hint">${ic("bulb")}<span>Indice</span></button>` : ""}</div>
  <div class="hints" id="hints"></div>
  <div class="answers" id="answers">${answersHtml(q)}</div>
</section>`;
};
function mountQuestion(q) {
  const ses = SES;
  if (!(q.stim === "son" && q.snd)) SND.main = null;
  if (q.photo && q.stim !== "son") {
    const fig = $("#shot"), img = $("#mainImg");
    if (fig && img) {
      let tried = false;
      img.onload = () => fig.classList.add("loaded");
      img.onerror = () => { if (!tried && q.photo.md && img.src !== q.photo.md) { tried = true; img.src = q.photo.md; fig.dataset.src = q.photo.md; fig.dataset.hd = ""; } else { img.style.visibility = "hidden"; fig.classList.add("loaded"); mediaFail(q, "Photo indisponible"); } };
      img.src = q.photo.lg || q.photo.md;
    }
    setAmbient(q.photo.md);
  } else if (q.kind === "geo") { setAmbient(q.sp[0]?.img); fitStrip(); mountGeoMap(q); }
  else setAmbient(null);
  if (q.format === "tiles") fitImgs($("#answers"));
  if (q.stim === "son" && q.snd) {
    sndLoad(q.snd, $("#sonoWrap")).then(mode => { if (mode && SES?.q === q && !q.done) sndPlay(true); });
  }
  if (q.format === "audio") { SND.main = null; sonoRows($("#answers"), (q.choices || []).map(c => c.snd)); }
  if (q.format === "type") { loadLexicon(); const inp = $("#ans"); if (inp && window.matchMedia && matchMedia("(hover:hover)").matches) inp.focus(); }
  if (ses.cfg.timer === 10) startQTimer(q, 10000);
  if (ses.deadline) startChallengeBar();
}
let QT = 0, CT = 0;
function mediaFail(q, msg) {
  if (!q || q.done || SES?.q !== q) return;
  const host = $("#shot") || $("#sound");
  if (!host || host.querySelector(".mfail")) return;
  host.insertAdjacentHTML("beforeend", `<div class="mfail">${ic(q.stim === "son" ? "wave" : "frame")}<b>${esc(msg)}</b><button class="btn primary" data-act="replaceq">${ic("shuffle")}Autre question</button></div>`);
}
async function replaceQuestion() {
  const ses = SES, q = ses?.q;
  if (!q || q.done) return;
  q.done = true;
  clearQTimer();
  sndStop();
  $("#app").classList.add("waiting");
  let q2 = null;
  for (let i = 0; i < 4 && !q2; i++) { try { q2 = await buildQ(ses, randomSpec(ses)); } catch (e) { /* suivant */ } }
  $("#app").classList.remove("waiting");
  if (SES !== ses) return;
  if (!q2) { q.done = false; toast("Impossible de charger une autre question. Vérifie ta connexion."); return; }
  q2.idx = q.idx;
  showQuestion(q2);
}
function startQTimer(q, ms) {
  clearQTimer();
  const bar = $("#tbar");
  if (bar) { bar.style.transition = "none"; bar.style.transform = "scaleX(1)"; void bar.offsetWidth; bar.style.transition = `transform ${ms}ms linear`; bar.style.transform = "scaleX(0)"; }
  QT = setTimeout(() => { if (SES?.q === q && !q.done) { markChoices(null, q.answerKey); settle({ ok: false, timeout: true }); } }, ms);
}
function startChallengeBar() {
  const ses = SES, bar = $("#tbar");
  const left = Math.max(0, ses.deadline - Date.now());
  if (bar) { bar.style.transition = "none"; bar.style.transform = `scaleX(${left / 60000})`; void bar.offsetWidth; bar.style.transition = `transform ${left}ms linear`; bar.style.transform = "scaleX(0)"; }
  clearTimeout(CT);
  CT = setTimeout(() => { if (SES === ses && !ses.ended && ses.q && !ses.q.done) { toast("Temps écoulé !"); endSession(); } }, left);
}
function clearQTimer() { clearTimeout(QT); QT = 0; }

function markChoices(chosen, answer) {
  const box = $("#answers");
  if (!box) return;
  box.classList.add("locked");
  const hosts = new Set($$("[data-k]", box).map(b => b.closest(".achoice") || b));
  hosts.forEach(h => {
    const k = h.dataset.k;
    if (k === answer) h.classList.add("ok");
    else if (k === chosen) { h.classList.add("bad"); const u = h.querySelector(".mark use"); if (u) u.setAttribute("href", "#i-x"); }
    else h.classList.add("dim");
  });
  $$(".geo-grid").forEach(g => g.classList.add("reveal"));
}
function onPick(key) {
  const q = SES?.q;
  if (!q || q.done) return;
  const chosen = (q.choices || []).find(c => c.key === key);
  markChoices(key, q.answerKey);
  settle({ ok: key === q.answerKey, chosen, key });
}
function revealHtml(q) {
  const t = q.t;
  let main = nameFr(t), sub = t.fr ? t.sci : "";
  if (q.level === "genus") { main = genus(t); sub = ""; }
  else if (q.level === "family") { main = famName(fam(t)); sub = famVern(fam(t)); }
  else if (q.level === "order") { main = ordName(ord(t)); sub = ""; }
  else if (q.stim === "fr") { main = t.sci; sub = t.fr; }
  const latinMain = q.level === "genus" || q.stim === "fr";
  return `<div class="reveal-card">${latinMain ? `<span class="latin" style="font-size:28px;color:var(--text)">${esc(main)}</span>` : `<b>${esc(main)}</b>`}${sub ? `<div class="latin">${esc(sub)}</div>` : ""}</div>
  <div class="grade"><button class="btn nok" data-act="self" data-v="0">${ic("x")}Raté</button><button class="btn yes" data-act="self" data-v="1">${ic("check")}Je savais</button></div>`;
}

function compareHtml(t, c, q) {
  const a = (q.photo && q.stim !== "soncho" ? q.photo.md : "") || imgOf(t), b = imgOf(c);
  if (!b) return "";
  const big = u => sizeUrl(u, "large");
  return `<div class="compare"><figure class="right" data-act="zoom" data-grp="cmp" data-src="${esc(big(a))}" data-cap="Bonne réponse · ${esc(nameFr(t))}" data-sci="${esc(t.fr ? t.sci : "")}" data-id="${t.id}"><img src="${esc(a)}" alt="" data-fit draggable="false"><figcaption><small>Bonne réponse</small>${esc(nameFr(t))}</figcaption></figure>
  <figure class="you" data-act="zoom" data-grp="cmp" data-src="${esc(big(b))}" data-cap="Ton choix · ${esc(nameFr(c))}" data-sci="${esc(c.fr ? c.sci : "")}" data-id="${c.id}"><img src="${esc(b)}" alt="" data-fit draggable="false"><figcaption><small>Ton choix</small>${esc(nameFr(c))}</figcaption></figure></div>`;
}
function fbHtml(q, res, gain) {
  const ses = SES;
  const last = ses.len && ses.results.length >= ses.len;
  const over = ses.deadline && Date.now() >= ses.deadline;
  const verdict = res.timeout ? "Temps écoulé" : res.ok ? pick(OKW) : res.partial ? "Presque !" : pick(BADW);
  const head = `<div class="grab"></div><div class="verdict"><span class="vi">${ic(res.ok ? "check" : res.partial ? "bulb" : "x")}</span><b>${verdict}</b>${gain ? `<span class="gain">+${gain} XP</span>` : ""}</div>`;
  const next = `<button class="btn primary wide next" data-act="next">${last || over ? "Voir le bilan" : "Suivant"}${ic("arrow")}</button>`;
  if (q.kind === "geo" && q.format !== "map") {
    const c = CONTINENTS.find(x => x.k === q.cont);
    return `${head}<div class="dnote" style="font-size:15px;color:var(--text)">${ic("globe", "xs")} ${esc(c ? c.n : "")} · ${esc(q.place || "")}</div>
    ${geoSpHtml(q)}${next}`;
  }
  if (q.kind === "geo") {
    const km = res.geoKm, tier = geoTier(km);
    return `<div class="grab"></div><div class="verdict"><span class="vi">${ic(km <= 1500 ? "check" : "pin")}</span><b>${esc(tier[2])}</b><span class="gain">+${gain} XP</span></div>
    <div class="dnote" style="font-size:15px;color:var(--text)">${ic("pin", "xs")} À <b>${fmt(km)} km</b> · ${esc(q.place || "")}${q.guessName ? ` <small class="muted">(pin sur ${esc(q.guessName)})</small>` : ""}</div>
    ${geoSpHtml(q)}${next}`;
  }
  if (q.kind === "hand") return `${head}${handFb(q, res)}${next}`;
  if (q.kind === "root") {
    return `${head}<div class="decode"><span class="dchip"><span class="latin">${esc(q.w)}</span>${esc(q.mean)}</span></div>${q.note ? `<div class="dnote">${esc(q.note)}</div>` : ""}${q.ex ? `<div class="dnote">Exemple : ${esc(q.ex.fr || "")} · <span class="latin">${esc(q.ex.sci)}</span></div>` : ""}${next}`;
  }
  const t = q.t, r = S.sp[t.id], f = fam(t), o = ord(t);
  const dec = decodeLatin(t.sci), note = dec.find(x => x.note);
  const chosen = res.chosen?.t && res.chosen.t.id !== t.id ? res.chosen.t : null;
  const thumb = (q.photo && q.photo.md) || imgOf(t);
  const isNew = r && r.n === 1 && ses.newSp.includes(t.id);
  const decH = dec.length ? `<div class="decode">${dec.map(d => `<span class="dchip"><span class="latin">${esc(d.w)}</span>${esc(d.m)}</span>`).join("")}</div>${note ? `<div class="dnote">${esc(note.note)}</div>` : ""}` : "";
  return `${head}
  ${res.typed && !res.ok ? `<div class="dnote">Tu as écrit « ${esc(res.typed)} »</div>` : ""}
  <button class="spcard" data-act="fiche" data-id="${t.id}">
    <img src="${esc(thumb)}" alt="">
    <span class="t"><b>${esc(nameFr(t))}</b>${t.fr ? `<span class="latin">${esc(t.sci)}</span>` : ""}
      <span class="chips">${f ? `<span class="chip fam">${esc(famName(f))}</span>` : ""}${o ? `<span class="chip ord">${esc(ordName(o))}</span>` : ""}${isNew ? `<span class="chip warn">${ic("spark")}Nouvelle</span>` : ""}</span></span>
    ${ic("info")}
  </button>
  ${chosen ? "" : decH}
  ${r?.note ? `<div class="note-own">${ic("edit", "xs")} ${esc(r.note)}</div>` : ""}
  ${chosen ? compareHtml(t, chosen, q) + whyHtml(t, chosen, ses.kind !== "duel" && q.level === "species" && drillWorthy(t.id, chosen.id) > 0, q.stim === "son" || q.stim === "soncho") + decH : ""}
  ${(() => { if (chosen) { q.tipShown = true; return ""; } const other = q.pair ? q.pair.find(x => x.id !== t.id) : null; const h = other ? sosiesHtml(t, other, "ok") || (duelTip(t.sci, other.sci) ? `<div class="lsec tipbox">${tipHtml(t, other, "Comment les distinguer")}</div>` : "") : ""; if (h) q.tipShown = true; return h; })()}
  ${q.photo?.field && (q.photo.place || q.photo.date || q.photo.age) ? `<div class="dnote">${ic("pin", "xs")} ${q.photo.age ? `<b>${AGEN[q.photo.age]}</b> · ` : ""}${esc(q.photo.place || "")}${q.photo.date ? " · " + esc(dateLong(q.photo.date)) : ""}${q.photo.uri ? ` · <a href="${esc(q.photo.uri)}" target="_blank" rel="noopener">voir l'observation</a>` : ""}</div>` : ""}
  ${q.snd ? `<div class="dnote" style="display:flex;align-items:center;gap:8px">${ic("wave", "xs")}<span style="flex:1">${esc([q.snd.place, q.snd.attr].filter(Boolean).join(" · "))}</span><button class="chip warn" data-act="badsnd">${ic("x", "xs")}Mauvais son</button></div>` : ""}
  <div class="learn" id="learn" data-id="${t.id}"><div class="lsec"><div class="lh">${ic("book", "xs")}Pour la reconnaître</div><div class="lsk"></div><div class="lsk short"></div></div></div>
  ${next}`;
}
let LEARNSIM = [];
let LEARNSND = [];
async function learnSound(t) {
  const [x, c] = await Promise.all([S.set.xc ? xcList(t).catch(() => null) : null, commonsSounds(t).catch(() => [])]);
  const all = [...(x || []), ...c];
  return all.find(s => /chant/.test(s.kind || "")) || all[0] || null;
}
async function fillLearn(t, q) {
  const ear = q && (q.stim === "son" || q.stim === "soncho");
  const [d, w, sim, snd] = await Promise.all([wikiDesc(t).catch(() => null), wiki(t).catch(() => null), similar(t, null).catch(() => []), ear ? null : learnSound(t).catch(() => null)]);
  const box = $("#learn");
  if (!box || +box.dataset.id !== t.id) return;
  const txt = d ? d.text : w ? w.text : "";
  LEARNSIM = sim.filter(x => x.id !== t.id).slice(0, 3);
  const parts = [];
  if (txt) parts.push(`<div class="lsec"><div class="lh">${ic("book", "xs")}${d ? "Pour la reconnaître" : "En bref"}</div><p class="clamp" data-act="lexp">${esc(clip(txt, 280))}</p><div class="lfoot"><button class="lmore2" data-act="lexp">Lire la suite</button><small>Wikipédia</small><button class="lmore" data-act="fiche" data-id="${t.id}">Fiche${ic("arrow", "xs")}</button></div></div>`);
  LEARNSND = snd ? [snd] : [];
  if (snd) parts.push(`<div class="lsec"><div class="lh">${ic("wave", "xs")}${/chant/.test(snd.kind || "") ? "Son chant" : "Sa voix"}</div><div class="srow" data-i="0"><button class="pl" data-act="lplay" data-i="0" aria-label="Écouter">${ic("play")}</button><div class="sbody"><div class="msono" data-act="rseek" data-sl="l" data-i="0"><span class="nosono">${ic("wave")}</span></div><span class="tx">${esc(snd.attr || "")}</span></div></div></div>`);
  const partner = !q?.tipShown && duelPartners(t.sci)[0];
  if (partner) parts.push(sosiesHtml(t, partner, "ok") || `<div class="lsec">${tipHtml(t, partner, "À ne pas confondre avec " + partner.fr)}</div>`);
  if (LEARNSIM.length) parts.push(`<div class="lsec"><div class="lh">${ic("duel", "xs")}${partner ? "Ressemble aussi à" : "À ne pas confondre avec"}</div><div class="lsim">${LEARNSIM.map(s => `<button data-act="fiche" data-id="${s.id}"><img src="${esc(s.img?.sq || "")}" alt=""><span>${esc(nameFr(s))}</span></button>`).join("")}</div></div>`);
  box.innerHTML = parts.join("");
  if (LEARNSND.length) sonoRows(box, LEARNSND);
}
/* ---------- Critères des sosies ---------- */
function duelTip(sa, sb) {
  sa = canonSci(sa); sb = canonSci(sb);
  const k1 = DUELTIPS[sa + "|" + sb], k2 = DUELTIPS[sb + "|" + sa];
  if (k1) return { rows: k1.r, note: k1.n };
  if (k2) return { rows: k2.r.map(([c, x, y]) => [c, y, x]), note: k2.n };
  return null;
}
const duelPartners = sci => { sci = canonSci(sci); return DUELS.filter(d => d[0] === sci || d[1] === sci).map(d => d[0] === sci ? { sci: d[1], fr: d[3] } : { sci: d[0], fr: d[2] }); };
function tipHtml(a, b, title) {
  const tp = a && b ? duelTip(a.sci, b.sci) : null;
  if (!tp) return "";
  return `<div class="tip">${title === "" ? "" : `<div class="lh">${ic("duel", "xs")}${esc(title || "Comment les distinguer")}</div>`}
  <div class="tg3"><span class="c"></span><b>${esc(nameFr(a))}</b><b>${esc(nameFr(b))}</b>${tp.rows.map(([c, x, y]) => `<span class="c">${esc(c)}</span><span>${esc(x)}</span><span>${esc(y)}</span>`).join("")}</div>
  ${tp.note ? `<p class="tnote">${esc(tp.note)}</p>` : ""}<small class="tsrc">Critères simplifiés, d'après les guides de terrain.</small></div>`;
}
function showFeedback(q, res, gain) {
  hideFeedback();
  const ses = SES;
  const el = document.createElement("div");
  el.className = "fb " + (res.ok ? "ok" : res.partial ? "part" : "bad");
  el.id = "fb";
  el.setAttribute("role", "dialog");
  el.style.maxHeight = "82vh";
  el.style.overflowY = "auto";
  el.innerHTML = fbHtml(q, res, gain);
  document.body.appendChild(el);
  fitImgs(el);
  if (q.kind === "taxon") fillLearn(q.t, q);
  const ch = res.chosen?.t;
  if (q.kind === "taxon" && ch && ch.id !== q.t.id && !sosVis(q.t.sci, ch.sci)) fillWhy(q.t, ch, q.stim === "son" || q.stim === "soncho");
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
  const cb = $("#combo");
  if (cb) {
    cb.classList.toggle("zero", !ses.combo);
    cb.querySelector("span").textContent = ses.combo;
    if (ses.combo) { cb.classList.add("bump"); setTimeout(() => cb.classList.remove("bump"), 300); }
  }
  const dots = $$(".dots i");
  const i = ses.results.length - 1;
  if (dots[i]) dots[i].className = res.ok ? "ok" : res.partial ? "part" : "bad";
  floatXp(gain);
  const nb = el.querySelector("[data-act=next]");
  if (nb && window.matchMedia && matchMedia("(hover:hover)").matches) nb.focus({ preventScroll: true });
}
function hideFeedback() { const f = $("#fb"); if (f) f.remove(); }
const geoSpHtml = q => `<div class="gsp">${q.sp.map(s => `<button data-act="zoom" data-grp="gr" data-src="${esc(s.lg || s.img)}" data-hd="${esc(s.hd || "")}" data-cap="${esc(s.fr)}" data-sci="${esc(s.fr !== s.sci ? s.sci : "")}" data-attr="${esc(s.attr || "")}" data-id="${s.id}"><img src="${esc(s.img)}" alt="" draggable="false"><span>${esc(s.fr)}</span></button>`).join("")}</div>`;
function geoTaxon(id) {
  const s = (SES?.q?.sp || []).find(x => x.id === id);
  return s ? { id: s.id, sci: s.sci, fr: s.fr !== s.sci ? s.fr : "", a: [], img: { sq: s.img, md: s.img, attr: s.attr || "", lic: "" } } : null;
}

/* ---------- Photos : cadrage adaptatif ---------- */
// Si le format de la photo est trop différent du cadre, on l'affiche entière (fond flouté) au lieu de la rogner.
function fitImgs(root) {
  $$("img[data-fit]", root || document).forEach(img => {
    if (img.dataset.fitted) return;
    const f = () => {
      const box = img.parentElement;
      if (!box || !img.naturalWidth || !box.clientHeight) return;
      img.dataset.fitted = "1";
      const r = img.naturalWidth / img.naturalHeight, rb = box.clientWidth / box.clientHeight;
      const c = Math.abs(Math.log(r / rb)) > .3;
      box.classList.toggle("fitc", c);
      if (c) box.style.setProperty("--bgi", `url("${String(img.currentSrc || img.src).replace(/"/g, "%22")}")`);
    };
    if (img.complete && img.naturalWidth) f(); else img.addEventListener("load", f, { once: true });
  });
}
// Bandeau Géo : chaque carte prend le format de sa photo (plus de têtes coupées)
function fitStrip() {
  $$("#gstrip img").forEach(img => {
    const fig = img.closest("figure");
    const f = () => { if (fig && img.naturalWidth) { fig.style.aspectRatio = String(clamp(img.naturalWidth / img.naturalHeight, .62, 1.9)); fig.classList.remove("ld"); } };
    img.addEventListener("error", () => {
      const alt = img.dataset.alt;
      if (alt && img.src !== alt) { img.dataset.alt = ""; img.src = alt; if (fig) { fig.dataset.src = alt; fig.dataset.hd = ""; } }
      else if (fig) { fig.classList.remove("ld"); fig.classList.add("broken"); }
    });
    if (img.complete && img.naturalWidth) f(); else { fig?.classList.add("ld"); img.addEventListener("load", f); }
  });
}

/* ---------- Visionneuse HD (toucher une photo) ---------- */
let VW = null;
const hdOf = u => u ? sizeUrl(u, "original") : "";
function zoomItems(el) {
  const g = el.dataset.grp;
  const els = g ? $$(`[data-act=zoom][data-grp="${g}"]`) : [el];
  return {
    items: els.map(x => ({ src: x.dataset.src, hd: x.dataset.hd || hdOf(x.dataset.src), cap: x.dataset.cap || "", sci: x.dataset.sci || "", attr: x.dataset.attr || "", id: +x.dataset.id || 0 })),
    i: Math.max(0, els.indexOf(el))
  };
}
function openViewer(items, i = 0) {
  closeViewer(true);
  if (!items.length || !items[i]?.src) return;
  const el = document.createElement("div");
  el.className = "viewer loading";
  el.id = "viewer";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Photo en grand");
  el.innerHTML = `<div class="vw-stage" id="vwStage"><img class="vw-img" id="vwImg" alt="" draggable="false"><div class="spin vw-spin"></div></div>
  <div class="vw-top"><span class="vw-n" id="vwN"></span><span class="vw-hd" id="vwHd">HD</span><span class="sp"></span><button class="icon-btn" data-act="vclose" aria-label="Fermer">${ic("x")}</button></div>
  ${items.length > 1 ? `<button class="vw-nav prev" data-act="vgo" data-d="-1" aria-label="Photo précédente">${ic("back")}</button><button class="vw-nav next" data-act="vgo" data-d="1" aria-label="Photo suivante">${ic("arrow")}</button>` : ""}
  <div class="vw-cap" id="vwCap"></div>`;
  document.body.appendChild(el);
  document.body.classList.add("vwopen");
  VW = { el, items, i, s: 1, x: 0, y: 0, ptr: new Map() };
  vwBind(el);
  vwShow(i, 0);
  requestAnimationFrame(() => el.classList.add("on"));
}
function closeViewer(now) {
  const V = VW;
  if (!V) return;
  VW = null;
  document.body.classList.remove("vwopen");
  if (now) { V.el.remove(); return; }
  V.el.classList.remove("on");
  setTimeout(() => V.el.remove(), 230);
}
function vwShow(i, dir) {
  const V = VW;
  if (!V) return;
  const n = V.items.length;
  V.i = ((i % n) + n) % n;
  const it = V.items[V.i], img = $("#vwImg", V.el);
  V.s = 1; V.x = 0; V.y = 0;
  V.el.classList.remove("hd", "zoomed");
  V.el.classList.add("loading");
  V.el.style.setProperty("--vbg", 1);
  img.style.transition = "none";
  img.style.transform = "";
  img.onload = () => { if (VW === V && V.items[V.i] === it) V.el.classList.remove("loading"); };
  img.onerror = () => { if (VW === V) V.el.classList.remove("loading"); };
  img.src = it.src;
  if (dir && img.animate) { try { img.animate([{ opacity: 0, transform: `translate3d(${dir * 46}px,0,0)` }, { opacity: 1, transform: "none" }], { duration: 230, easing: "cubic-bezier(.2,.8,.2,1)" }); } catch (e) { /* rien */ } }
  $("#vwN", V.el).textContent = n > 1 ? `${V.i + 1} / ${n}` : "";
  $("#vwCap", V.el).innerHTML = `${it.cap ? `<b>${esc(it.cap)}</b>` : ""}${it.sci ? `<span class="latin">${esc(it.sci)}</span>` : ""}${it.id ? `<button class="chip" data-act="vfiche" data-id="${it.id}">${ic("info")}Fiche</button>` : ""}${it.attr ? `<small>${esc(it.attr)}</small>` : ""}`;
  if (it.hd && it.hd !== it.src) {
    const hi = new Image();
    hi.onload = async () => {
      try { if (hi.decode) await hi.decode(); } catch (e) { /* rien */ }
      if (VW === V && V.items[V.i] === it) { img.src = it.hd; V.el.classList.add("hd"); V.el.classList.remove("loading"); }
    };
    hi.src = it.hd;
  }
  if (n > 1) [1, -1].forEach(d => { const nb = V.items[(V.i + d + n) % n]; if (nb?.src) preload(nb.src); });
}
function vwBox() {
  const V = VW, st = $("#vwStage", V.el), img = $("#vwImg", V.el);
  const W = st.clientWidth, H = st.clientHeight, r = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : W / H;
  const w = W / H > r ? H * r : W, h = W / H > r ? H : W / r;
  const b = st.getBoundingClientRect();
  return { W, H, w, h, cx: b.left + W / 2, cy: b.top + H / 2 };
}
function vwApply(anim) {
  const V = VW;
  if (!V) return;
  const img = $("#vwImg", V.el), B = vwBox();
  const mx = Math.max(0, (B.w * V.s - B.W) / 2), my = Math.max(0, (B.h * V.s - B.H) / 2), e = anim ? 0 : 50;
  V.x = clamp(V.x, -mx - e, mx + e);
  V.y = clamp(V.y, -my - e, my + e);
  img.style.transition = anim ? "transform .28s cubic-bezier(.2,.8,.2,1)" : "none";
  img.style.transform = `translate3d(${V.x}px,${V.y}px,0) scale(${V.s})`;
  V.el.classList.toggle("zoomed", V.s > 1.02);
}
function vwZoomAt(px, py, s2) {
  const V = VW;
  if (!V) return;
  const B = vwBox(), s = clamp(s2, 1, 6), k = s / V.s;
  V.x = (px - B.cx) - ((px - B.cx) - V.x) * k;
  V.y = (py - B.cy) - ((py - B.cy) - V.y) * k;
  V.s = s;
  if (s <= 1.02) { V.s = 1; V.x = 0; V.y = 0; }
  vwApply(true);
}
function vwDrag(dx, dy, release) {
  const V = VW;
  if (!V) return;
  const img = $("#vwImg", V.el), vert = Math.abs(dy) > Math.abs(dx);
  img.style.transition = release ? "transform .26s cubic-bezier(.2,.8,.2,1)" : "none";
  img.style.transform = release ? "" : vert ? `translate3d(0,${Math.max(0, dy)}px,0) scale(${1 - Math.min(.18, Math.max(0, dy) / 1400)})` : `translate3d(${dx}px,0,0)`;
  V.el.style.setProperty("--vbg", release || !vert ? 1 : Math.max(.3, 1 - Math.max(0, dy) / 360));
}
function vwBind(el) {
  const st = $("#vwStage", el);
  let pinch = null, pan = null, lastTap = 0, tapT = 0;
  const pts = () => [...VW.ptr.values()];
  st.addEventListener("pointerdown", e => {
    const V = VW;
    if (!V) return;
    try { st.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
    V.ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (V.ptr.size === 2) {
      const [a, b] = pts();
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s: V.s, x: V.x, y: V.y };
      pan = null;
    } else if (V.ptr.size === 1) pan = { cx: e.clientX, cy: e.clientY, x: V.x, y: V.y, moved: false };
  });
  st.addEventListener("pointermove", e => {
    const V = VW;
    if (!V || !V.ptr.has(e.pointerId)) return;
    V.ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && V.ptr.size >= 2) {
      const [a, b] = pts(), B = vwBox(), d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const s = clamp(pinch.s * d / pinch.d, 1, 6), k = s / pinch.s;
      V.x = (m[0] - B.cx) - ((pinch.m[0] - B.cx) - pinch.x) * k;
      V.y = (m[1] - B.cy) - ((pinch.m[1] - B.cy) - pinch.y) * k;
      V.s = s;
      vwApply(false);
    } else if (pan) {
      const dx = e.clientX - pan.cx, dy = e.clientY - pan.cy;
      if (Math.abs(dx) + Math.abs(dy) > 8) pan.moved = true;
      if (V.s > 1.02) { V.x = pan.x + dx; V.y = pan.y + dy; vwApply(false); }
      else if (pan.moved) vwDrag(dx, dy);
    }
  });
  const end = e => {
    const V = VW;
    if (!V || !V.ptr.has(e.pointerId)) return;
    V.ptr.delete(e.pointerId);
    if (pinch) {
      if (V.ptr.size < 2) {
        pinch = null;
        if (V.s < 1.08) { V.s = 1; V.x = 0; V.y = 0; }
        vwApply(true);
        if (V.ptr.size === 1) { const [a] = pts(); pan = { cx: a[0], cy: a[1], x: V.x, y: V.y, moved: true }; }
      }
      return;
    }
    if (!pan) return;
    const P = pan, dx = e.clientX - P.cx, dy = e.clientY - P.cy;
    pan = null;
    if (e.type === "pointercancel") { if (V.s <= 1.02) vwDrag(0, 0, true); else vwApply(true); return; }
    if (P.moved) {
      if (V.s > 1.02) { vwApply(true); return; }
      if (dy > 90 && dy > Math.abs(dx)) { closeViewer(); return; }
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && V.items.length > 1) { const d = dx < 0 ? 1 : -1; vwDrag(0, 0, true); vwShow(V.i + d, d); return; }
      vwDrag(0, 0, true);
      return;
    }
    const now = Date.now();
    if (now - lastTap < 320) { clearTimeout(tapT); lastTap = 0; vwZoomAt(e.clientX, e.clientY, V.s > 1.02 ? 1 : 2.6); return; }
    lastTap = now;
    const B = vwBox(), inside = Math.abs(e.clientX - B.cx - V.x) <= B.w * V.s / 2 && Math.abs(e.clientY - B.cy - V.y) <= B.h * V.s / 2;
    if (!inside && V.s <= 1.02) tapT = setTimeout(() => { if (VW === V) closeViewer(); }, 330);
  };
  st.addEventListener("pointerup", end);
  st.addEventListener("pointercancel", end);
  st.addEventListener("wheel", e => { if (!VW) return; e.preventDefault(); vwZoomAt(e.clientX, e.clientY, VW.s * (e.deltaY < 0 ? 1.25 : 0.8)); }, { passive: false });
  el.addEventListener("gesturestart", e => e.preventDefault());
}

/* ---------- Suggestions de saisie ---------- */
let SUGT = 0, SUGQ = "";
function suggItems(q, v) {
  if (q.level === "family") {
    const n = norm(v);
    return [...TAXO.fam.values()].filter(f => norm(f.fr + " " + f.vern + " " + f.sci).split(" ").some(w => w.startsWith(n)) || norm(f.fr).includes(n)).slice(0, 8)
      .map(f => ({ key: "f" + f.id, main: f.fr, sub: f.vern }));
  }
  if (q.level === "order" || q.level === "genus") return [];
  const mode = q.stim === "fr" ? "la" : q.stim === "la" ? "fr" : q.names;
  return lexSearch(v, 8).map(e => ({ key: "s" + e.id, img: e.img, main: mode === "la" ? e.sci : (e.fr || e.sci), sub: mode === "both" && e.fr ? e.sci : "", latin: mode === "la", t: e }));
}
function renderSugg(q, v) {
  const box = $("#sugg");
  if (!box) return;
  const items = v.trim().length < 2 ? [] : suggItems(q, v);
  box.innerHTML = items.map(it => `<button type="button" class="sitem" data-act="sugg" data-k="${it.key}">${it.img ? `<img src="${esc(it.img)}" alt="">` : `<span class="noimg">${ic("tree", "s")}</span>`}<span class="tx">${it.latin ? `<span class="latin" style="font-size:18px">${esc(it.main)}</span>` : `<b>${esc(it.main)}</b>`}${it.sub ? `<small class="latin">${esc(it.sub)}</small>` : ""}</span></button>`).join("");
  return items.length;
}
function suggest(v) {
  const q = SES?.q;
  if (!q || q.done) return;
  SUGQ = v;
  const n = renderSugg(q, v);
  clearTimeout(SUGT);
  if (q.level === "species" && v.trim().length >= 3 && n < 5) {
    SUGT = setTimeout(() => lexRemote(v.trim()).then(() => { if (SUGQ === v && SES?.q === q && !q.done) renderSugg(q, v); }).catch(() => {}), 350);
  }
}

/* ---------- Carte Géo ---------- */
/* Fonds de carte : relief (NASA Blue Marble, montagnes et fonds marins) puis satellite en zoomant,
   satellite, topo, océans (bathymétrie : les îles ressortent), nuit (OSM assombri). Aucun n'exige de clé. */
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/";
const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/";
const MAPST = {
  relief: { n: "Relief", lab: true, cap: "NASA Blue Marble · Esri", layers: [
    { u: GIBS + "GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg", max: 8, a: "NASA Blue Marble",
      alt: [GIBS + "/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg", "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/BlueMarble_ShadedRelief_Bathymetry/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg", ESRI + "World_Physical_Map/MapServer/tile/{z}/{y}/{x}"] },
    { u: ESRI + "World_Imagery/MapServer/tile/{z}/{y}/{x}", min: 9, a: "Esri, Maxar, Earthstar Geographics" }] },
  sat: { n: "Satellite", lab: true, cap: "Esri World Imagery", layers: [{ u: ESRI + "World_Imagery/MapServer/tile/{z}/{y}/{x}", a: "Esri, Maxar, Earthstar Geographics" }] },
  topo: { n: "Topo", light: true, cap: "Esri Topographic", layers: [{ u: ESRI + "World_Topo_Map/MapServer/tile/{z}/{y}/{x}", a: "Esri, HERE, Garmin, USGS, FAO, NPS" }] },
  ocean: { n: "Océans", light: true, cap: "Esri Ocean · GEBCO, NOAA", layers: [{ u: ESRI + "Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}", nat: 13, a: "Esri, GEBCO, NOAA" }, { u: ESRI + "Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}", nat: 13, ov: true, a: "" }] },
  nuit: { n: "Nuit", inv: true, cap: "© OpenStreetMap", layers: [{ u: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", a: "© OpenStreetMap" }] }
};
const MAPLAB = { u: ESRI + "Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", a: "Esri" };
const curStyle = () => MAPST[S.set.mapst] ? S.set.mapst : "relief";
const tileUrl = (u, z, x, y) => u.replace("{z}", z).replace("{x}", x).replace("{y}", y);
const layerAt = (st, z) => st.layers.find(l => !l.ov && (l.min ?? 0) <= z && z <= (l.max ?? 19)) || st.layers[0];
function mapStylesHtml() {
  const cur = curStyle();
  return `<div class="mst">${Object.entries(MAPST).map(([k, st]) => `<button class="${k === cur ? "on" : ""}" data-act="mapset" data-s="${k}" aria-label="Fond ${esc(st.n)}"><span class="th${st.inv ? " inv" : ""}" style="background-image:url('${esc(tileUrl(layerAt(st, 2).u, 2, 2, 1))}')"></span><small>${esc(st.n)}</small></button>`).join("")}</div>`;
}
const mapTog = (k, icn, label) => `<button class="chip${S.set[k] ? " on" : ""}" data-act="toggle" data-k="${k}" role="switch" aria-checked="${S.set[k] ? "true" : "false"}">${ic(icn)}${label}</button>`;
const mapMenuHtml = () => `${mapStylesHtml()}<div class="mtg">${mapTog("mapLab", "type", "Noms")}${mapTog("mapIsl", "isle", "Îles")}</div>`;
function tileL(sp, extra, onDead) {
  const alts = (sp.alt || []).slice();
  const o = { attribution: sp.a || "", minZoom: sp.min ?? 0, maxZoom: sp.max ?? 19, ...extra };
  if (sp.max != null) o.maxNativeZoom = sp.max;
  if (sp.nat) o.maxNativeZoom = sp.nat;
  const l = L.tileLayer(sp.u, o);
  let ok = 0, bad = 0;
  l.on("tileload", () => { ok++; });
  l.on("tileerror", () => {
    if (ok || ++bad < 4) return;
    bad = 0;
    if (alts.length) l.setUrl(alts.shift());
    else if (onDead) { const f = onDead; onDead = null; f(); }
  });
  return l;
}
function setMapStyle(map, id) {
  const st = MAPST[id] || MAPST.relief;
  (map._plum || []).forEach(l => map.removeLayer(l));
  map._plum = [];
  const dead = () => {
    if (map !== GMAP || id === "nuit") return;
    toast(`Fond « ${st.n} » indisponible pour l'instant : fond Nuit à la place.`);
    setMapStyle(map, "nuit");
  };
  st.layers.forEach((sp, i) => {
    if (sp.ov && !S.set.mapLab) return;
    const l = tileL(sp, { className: st.inv ? "tl-inv" : "", pane: sp.ov ? "labels" : "tilePane" }, i === 0 ? dead : null);
    l.addTo(map);
    map._plum.push(l);
  });
  if (st.lab && S.set.mapLab) { const l = tileL(MAPLAB, { pane: "labels" }); l.addTo(map); map._plum.push(l); }
  map._plumSt = id;
  map.getContainer().classList.toggle("light", !!st.light);
  islStyle(map);
}
/* Îles : un anneau tant que l'île est trop petite pour être vue ; le toucher pose le pin dessus */
function addIslands(map) {
  const rd = L.canvas({ padding: .3, tolerance: 9 });
  map._isl = ISLANDS.map(isl => {
    const m = L.circleMarker([isl[1], isl[2]], { renderer: rd, radius: 6, weight: 1.4, opacity: .9, fillOpacity: .14, bubblingMouseEvents: false });
    m.isl = isl;
    m.bindTooltip(isl[0], { permanent: true, direction: "right", offset: [7, 0], className: "isl-lbl", opacity: 1 });
    m.on("click", () => { const q = SES?.q; if (q && q.kind === "geo" && !q.done) placePin(q, m.getLatLng(), isl[0]); });
    return m;
  });
  map.on("zoomend", () => islUpdate(map));
  islStyle(map);
  islUpdate(map);
}
function islStyle(map) {
  const c = (MAPST[map._plumSt] || {}).light ? "#05627F" : "#8AF4FF";
  (map._isl || []).forEach(m => m.setStyle({ color: c, fillColor: c }));
}
function islUpdate(map) {
  if (!map._isl) return;
  const z = map.getZoom(), on = S.set.mapIsl && !map._revealed, rings = [], labs = [];
  const r = z < 1.5 ? 3.5 : z < 3 ? 5 : 6.5, gap = z < 3 ? 13 : 16;
  map.getContainer().classList.toggle("zlo", z < 3.5);
  map._isl.forEach(m => {
    const [name, la, ln, d] = m.isl;
    let vis = on && z <= 10 && d / (156.543 * Math.cos(la * Math.PI / 180) / 2 ** z) < 12, lab = false;
    if (vis) {
      const p = map.project([la, ln], z);
      vis = !rings.some(s => Math.abs(s.x - p.x) < gap && Math.abs(s.y - p.y) < gap);
      if (vis) {
        const w = 8 + name.length * 6.4, box = [p.x + 5, p.y - 8, p.x + 5 + w, p.y + 8];
        lab = z >= 3.5 && !labs.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]) && !rings.some(s => s.x > box[0] - 4 && s.x < box[2] && Math.abs(s.y - p.y) < 10);
        rings.push(p);
        if (lab) labs.push(box);
      }
    }
    if (vis) { m.setRadius(r); if (!map.hasLayer(m)) m.addTo(map); }
    else if (map.hasLayer(m)) map.removeLayer(m);
    const te = m.getTooltip()?.getElement();
    if (te) te.classList.toggle("hid", !lab);
  });
}
function mapExtras() {
  if (!GMAP) return;
  setMapStyle(GMAP, GMAP._plumSt || curStyle());
  islUpdate(GMAP);
}
function placePin(q, ll, name) {
  if (!GMAP || q.done) return;
  q.guess = [ll.lat, ((ll.lng + 540) % 360) - 180];
  q.guessName = name || "";
  if (q.guessM) q.guessM.setLatLng(ll);
  else q.guessM = L.circleMarker(ll, { pane: "markerPane", radius: 9, color: "#fff", weight: 3, fillColor: "#FF8B3D", fillOpacity: 1, interactive: false }).addTo(GMAP);
  const b = $("#gok");
  if (b) { b.disabled = false; b.innerHTML = ic("check") + `<span>Valider${name ? " · " + esc(name) : ""}</span>`; }
}
function setMapFull(on) {
  const w = $("#gwrap");
  if (!w) { document.body.classList.remove("gfull"); return; }
  on = on ?? !w.classList.contains("full");
  w.classList.toggle("full", on);
  document.body.classList.toggle("gfull", on);
  const b = w.querySelector("[data-act=mapfull]");
  if (b) { b.innerHTML = ic(on ? "shrink" : "expand"); b.setAttribute("aria-label", on ? "Réduire la carte" : "Agrandir la carte"); }
  if (GMAP) {
    const m = GMAP, fill = () => { m.invalidateSize(); const zf = Math.floor(Math.log2(m.getSize().y / 256) * 2) / 2; if (on && m.getZoom() < zf) m.setZoom(zf); };
    requestAnimationFrame(() => m.invalidateSize());
    setTimeout(() => { if (GMAP === m) fill(); }, 280);
  }
}
let GMAP = null;
function mountGeoMap(q) {
  const el = $("#gmap");
  document.body.classList.remove("gfull");
  if (!el || !window.L) return;
  if (GMAP) { try { GMAP.remove(); } catch (e) { /* rien */ } }
  const z0 = clamp(Math.floor(Math.log2(Math.max(256, el.clientWidth) / 256) * 2) / 2, .5, 3);
  const map = GMAP = L.map(el, { worldCopyJump: true, zoomControl: false, attributionControl: true, minZoom: .5, maxZoom: 14, zoomSnap: .5 }).setView([22, 8], z0);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  const lp = map.createPane("labels");
  lp.style.zIndex = 350;
  lp.style.pointerEvents = "none";
  setMapStyle(map, curStyle());
  addIslands(map);
  q.guessM = null;
  map.on("click", e => placePin(q, e.latlng));
  setTimeout(() => map.invalidateSize(), 50);
}
function geoValidate() {
  const q = SES?.q;
  if (!q || q.done || !q.guess) return;
  const km = haversine(q.guess, [q.lat, q.lng]), tier = geoTier(km);
  setMapFull(false);
  const mm = $("#mmenu");
  if (mm) mm.hidden = true;
  $$(".gstrip").forEach(g => g.classList.add("reveal"));
  $(".view.quiz")?.classList.add("georeveal");
  if (GMAP) {
    GMAP.invalidateSize();
    GMAP._revealed = true;
    islUpdate(GMAP);
    const t = [q.lat, q.lng];
    L.circleMarker(t, { radius: 10, color: "#fff", weight: 3, fillColor: "#1FD1F2", fillOpacity: 1 }).addTo(GMAP);
    L.circle(t, { radius: 10000, color: "#1FD1F2", weight: 1, fillOpacity: .12 }).addTo(GMAP);
    L.polyline([q.guess, t], { color: "#FFCB5C", weight: 2, dashArray: "6 6" }).addTo(GMAP);
    GMAP.fitBounds(L.latLngBounds([q.guess, t]).pad(.35), { maxZoom: 8 });
  }
  $("#gok")?.remove();
  settle({ ok: km <= 1500, geoKm: km, geoPts: tier[1] });
  window.scrollTo(0, 0);
}

/* ---------- Bilan ---------- */
VIEWS.result = ({ ses, n, ok, badges, msgs }) => {
  const C = 2 * Math.PI * 84, p = n ? ok / n : 0;
  const PP = ses.kind === "path" ? PATHI[ses.cfg.path] : null, pnext = PP && ses.pathStars && ses.cfg.step + 1 < PP.steps.length ? ses.cfg.step + 1 : -1;
  const title = PP ? (ses.pathStars ? (ses.pathDoneNow ? "Parcours terminé !" : "Étape validée !") : "Presque !") : p === 1 ? "Sans faute !" : p >= .8 ? "Superbe série !" : p >= .5 ? "Belle progression" : "Chaque erreur compte";
  const lead = PP ? (ses.pathStars ? (pnext >= 0 ? `Prochaine étape : ${PP.steps[pnext].n}.` : "Bravo, tu as bouclé ce parcours.") : `Il faut ${PASS} bonnes réponses sur ${PLEN} pour avancer. Relance l'étape : les erreurs t'aident à retenir.`) : ses.kind === "hand" ? (p === 1 ? "Rien à redire : tu peux passer à la station !" : "Ouvre les fiches des espèces ratées, puis rejoue.") : p === 1 ? "Rien à redire, tu peux viser plus dur." : p >= .5 ? "Les erreurs reviendront en révision au bon moment." : "Tes erreurs reviendront vite en révision : c'est comme ça qu'on retient.";
  const L = level();
  const missed = [...new Map(ses.missed.map(t => [t.id, t])).values()].slice(0, 8);
  const confs = ses.kind === "duel" ? [] : [...new Map((ses.confs || []).map(([a, b]) => [Math.min(a, b) + "," + Math.max(a, b), [a, b]])).values()]
    .map(x => [x, drillWorthy(x[0], x[1])]).filter(([, w]) => w > 0).sort((x, y) => y[1] - x[1]).map(([x]) => x).slice(0, 3);
  return `<section class="view result">
  <div class="score"><svg viewBox="0 0 190 190" aria-hidden="true"><circle class="track" cx="95" cy="95" r="84"/><circle class="prog" id="scoreProg" cx="95" cy="95" r="84" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C * (1 - p)).toFixed(1)}"/></svg>
    <div class="val"><b>${ok}<span style="font-size:24px;color:var(--muted)">/${n}</span></b><small>${esc(ses.title || "")}</small></div></div>
  <h1>${title}</h1>${PP && ses.pathStars ? `<div class="rstars">${starsRow(ses.pathStars)}</div>` : ""}<div class="lead">${esc(lead)}</div>
  ${msgs.map(m => `<div class="chip warn" style="margin-top:12px">${ic("shield")}${esc(m)}</div>`).join("")}
  <div class="trio"><div class="xp"><b>+${fmt(ses.xp)}</b><small>XP</small></div><div><b>×${ses.maxCombo}</b><small>meilleur combo</small></div>${ses.kind === "hand" ? `<div><b>${Math.round(p * 100)} %</b><small>réussite</small></div>` : `<div><b>${ses.newSp.length}</b><small>nouvelle${ses.newSp.length > 1 ? "s" : ""}</small></div>`}</div>
  <button class="lvlbar" data-act="tab" data-tab="progress"><span class="badge">${L.n}</span><span class="meta"><b>${esc(L.rank)}</b><small>${fmt(L.cur)} / ${fmt(L.need)} XP</small><span class="bar"><i style="width:${(L.p * 100).toFixed(1)}%"></i></span></span></button>
  ${badges.length ? `<div class="sec" style="justify-content:center">${ic("trophy")}Badge${badges.length > 1 ? "s" : ""} débloqué${badges.length > 1 ? "s" : ""}</div><div class="newbadges">${badges.map(b => `<span class="chip warn">${ic(b.ic)}${esc(b.n)}</span>`).join("")}</div>` : ""}
  ${ses.kind === "hand" && ses.hmiss?.length ? `<div class="sec" style="justify-content:center">${ic("replay")}Fiches à revoir</div><div class="missed">${[...new Set(ses.hmiss)].slice(0, 8).map(id => `<button class="mchip" data-act="hsp" data-sp="${id}">${featherPair(HSPI[id])}${esc(HSPI[id].fr)}</button>`).join("")}</div>` : ""}
  ${confs.length ? `<div class="sec" style="justify-content:center">${ic("duel")}Envie de t'entraîner ?</div><p class="muted" style="margin:-4px 0 10px;font-size:13px">Si tu veux : un petit duel sur les oiseaux que tu as confondus.</p><div class="drills">${confs.map(([a, b]) => { const A = taxonById(a), B = taxonById(b); if (!A || !B) return ""; const m = sosVis(A.sci, B.sci)?.v.m; return `<button class="conf drill" data-act="duelgo" data-ids="${a},${b}"><img src="${esc(imgOf(A))}" alt=""><span class="vs">VS</span><img src="${esc(imgOf(B))}" alt=""><span class="tx">${esc(nameFr(A))}<small>${esc(nameFr(B))}</small>${m ? `<em>${esc(m)}</em>` : ""}</span><span class="go">Duel${ic("arrow", "xs")}</span></button>`; }).join("")}</div>` : ""}
  ${missed.length ? `<div class="sec" style="justify-content:center">${ic("replay")}À revoir</div><div class="missed">${missed.map(t => `<button class="mchip" data-act="fiche" data-id="${t.id}"><img src="${esc(imgOf(t))}" alt="">${esc(nameFr(t))}</button>`).join("")}</div>` : ""}
  ${PP ? `<div class="actions"><button class="btn ghost" data-act="path" data-p="${PP.id}">${ic("map")}Parcours</button>${pnext >= 0 ? `<button class="btn primary" data-act="pgo" data-p="${PP.id}" data-i="${pnext}">${ic("play")}Étape suivante</button>` : `<button class="btn primary" data-act="again">${ic("replay")}${ses.pathStars ? "Refaire" : "Recommencer"}</button>`}</div>` : `<div class="actions">${ses.kind === "hand" ? `<button class="btn ghost" data-act="hhub">${ic("back")}Piaf en main</button>` : `<button class="btn ghost" data-act="home">${ic("back")}Accueil</button>`}${shareable(ses.cfg) ? `<button class="btn ghost sq" data-act="qshare" aria-label="Partager ce quiz">${ic("ext")}</button>` : ""}<button class="btn primary" data-act="again">${ic("replay")}Rejouer</button></div>`}
</section>`;
};
MOUNT.result = () => {
  const c = $("#scoreProg");
  if (c) requestAnimationFrame(() => requestAnimationFrame(() => { c.style.strokeDashoffset = c.dataset.off; }));
};

/* ---------- Présentation (premier lancement) et nouveautés ---------- */
const TOUR = [
  { ic: "bird", c: "#1FD1F2", t: "Bienvenue sur Plumage", d: "Apprends à reconnaître les oiseaux avec de vraies photos et de vrais chants, en direct d'iNaturalist." },
  { ic: "spark", c: "#FFCB5C", t: "La série du jour", d: "12 questions, environ 4 minutes. Joue chaque jour : la flamme compte tes jours d'affilée." },
  { ic: "sliders", c: "#FF8B3D", t: "Plein de façons de jouer", d: "Photos, chants, latin, familles, sosies, géo, baguage, parcours pas à pas… Sur mesure pour régler ton propre quiz, et des défis contre tes amis." },
  { ic: "replay", c: "#3BE59D", t: "Tu retiens pour de bon", d: "Après une erreur, des loupes te montrent ce qui diffère. Tes erreurs reviennent ensuite en révision, au bon moment." },
  { ic: "book", c: "#A58BFF", t: "Ton carnet", d: "Chaque oiseau rencontré rejoint ton carnet. Touche une photo pour l'agrandir, ouvre la fiche pour son chant, sa carte et ses sosies." },
  { ic: "shield", c: "#14B8A6", t: "Tout reste chez toi", d: "Pas de compte : ta progression vit sur ce téléphone. Sauvegarde-la de temps en temps (Réglages) et installe l'appli sur l'écran d'accueil." }
];
/* Numéro de version : 2.x = mises à jour d'octobre 2026 ; chaque mise en ligne ajoute une ligne en haut */
const NEWS = [
  { v: "2026-10-25.6", n: "2.5", items: [
    { ic: "zoom", t: "Les vrais critères, pour tous les oiseaux", d: "Après une erreur, quelle que soit la paire : taille, tête, bec, dessous, ailes, queue, pattes de chacun, et la phrase qui fait la différence." },
    { ic: "duel", t: "Le duel d'entraînement est proposé", d: "En fin de partie, seulement si tu en as envie." },
    { ic: "tag", t: "Numéros de version", d: "Chaque mise à jour a son numéro : tu le retrouves en bas des Réglages, avec toutes les nouveautés." }
  ] },
  { v: "2026-10-25.5", n: "2.4", items: [
    { ic: "down", t: "Hors ligne", d: "L'appli s'ouvre sans réseau. Dans « Préparer une sortie », « Hors ligne » garde la liste et ses photos pour le terrain." },
    { ic: "trophy", t: "Défi de la semaine", d: "Un thème par semaine, les mêmes 10 photos pour tout le monde. Seul ton premier essai compte." },
    { ic: "shield", t: "Sauvegarde en ligne", d: "Facultative et chiffrée : un code de 16 caractères pour tout retrouver sur un autre téléphone." }
  ] },
  { v: "2026-10-25.4", n: "2.3", items: [
    { ic: "duel", t: "Défi à distance", d: "Joue 10 photos, envoie le lien : ton ami tente de battre ton score, quand il veut. Ça marche tout de suite, sans serveur." },
    { ic: "map", t: "Parcours guidés", d: "Jardin, limicoles, rapaces, canards, goélands et sternes, chants : quelques oiseaux à la fois, étape par étape." }
  ] },
  { v: "2026-10-25.3", n: "2.2", items: [
    { ic: "spark", t: "Recettes Sur mesure", d: "10 quiz tout prêts en un geste : jardin, limicoles, goélands, chants de saison, rapaces…" },
    { ic: "ext", t: "Partage un quiz", d: "Par lien ou QR code : un ami, une sortie ou un panneau sur un site lance exactement le même quiz." },
    { ic: "chart", t: "Progrès plus clair", d: "L'essentiel en haut, le détail replié." }
  ] },
  { v: "2026-10-25.2", n: "2.1", items: [
    { ic: "zoom", t: "Pourquoi tu t'es trompé", d: "Après une erreur : des loupes sur ce qui diffère entre les deux oiseaux, et par quoi commencer." },
    { ic: "bulb", t: "Moyens mnémo", d: "Une phrase pour retenir chaque paire de sosies : garde-la dans ta fiche, ou écris la tienne." },
    { ic: "duel", t: "Duels d'entraînement", d: "En fin de série, un duel sur les oiseaux que tu viens de confondre." },
    { ic: "replay", t: "Tes confusions reviennent", d: "Les oiseaux que tu confonds réapparaissent parmi les choix, jusqu'à ce que tu les sépares." },
    { ic: "duel", t: "16 nouveaux sosies", d: "Moineaux, pinsons, tourterelles, pigeons, goélands, gravelots, aigrettes, grives, roitelets, hirondelles…" }
  ] },
  { v: "2026-10-25", n: "2.0", items: [
    { ic: "sliders", t: "Sur mesure mis en avant", d: "Ton quiz à toi en un geste, juste sous la série du jour, avec tes quiz enregistrés." },
    { ic: "ring", t: "Piaf en main", d: "Entraînement au baguage : topographie de l'aile, score de mue, âge par la mue, codes d'âge." },
    { ic: "spark", t: "Âge des oiseaux", d: "Dans Sur mesure : un quiz rien que sur les juvéniles, ou les adultes." },
    { ic: "globe", t: "Géo réparé", d: "Fini les mêmes photos qui reviennent en boucle." },
    { ic: "info", t: "Présentation de l'appli", d: "À revoir quand tu veux dans Réglages." }
  ] }
];
const TOURST = { i: 0 };
function tourHtml() {
  const i = TOURST.i, s = TOUR[i], last = i === TOUR.length - 1;
  return `<div class="panel tour" role="dialog" aria-label="Présentation de l'appli">
  <div class="tour-in" style="--c:${s.c}">
    <div class="tour-art"><span>${ic(s.ic)}</span></div>
    <span class="eyebrow">${i + 1} / ${TOUR.length}</span>
    <h2>${esc(s.t)}</h2><p>${esc(s.d)}</p>
    <div class="tour-dots">${TOUR.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
    <div class="tour-act">${last ? "" : `<button class="btn ghost" data-act="tskip">Passer</button>`}<button class="btn primary" data-act="tnext">${last ? "C'est parti !" : "Suivant"}${ic(last ? "play" : "arrow")}</button></div>
  </div></div>`;
}
function openTour(i = 0) { TOURST.i = i; openLayer(tourHtml(), "tourl"); }
function endTour() { S.hint = { ...(S.hint || {}), tour: Date.now(), news: NEWS[0].v }; save(); closeLayer(); }
const APP_VERSION = NEWS[0].n;
const vDate = v => { const [y, m, d] = v.split(".")[0].split("-").map(Number); return `${d} ${MONTHS_LONG[m - 1]} ${y}`; };
function newsHtml(all) {
  const seen = all ? "" : (S.hint?.news || "");
  const list = NEWS.filter(n => n.v > seen);
  let k = 0;
  return `<div class="panel news" role="dialog" aria-label="Nouveautés"><button class="icon-btn close" data-act="newsok" aria-label="Fermer">${ic("x")}</button>
  <div class="in" style="padding-top:22px"><span class="eyebrow">${ic("spark", "xs")} Mise à jour · version ${esc(APP_VERSION)}</span><h2 style="margin-top:8px">${all ? "Toutes les versions" : "Quoi de neuf ?"}</h2>
  <div class="news-list">${list.map(n => `${list.length > 1 ? `<div class="news-v"><b>v${esc(n.n)}</b><span>${esc(vDate(n.v))}</span></div>` : ""}${n.items.map(x => `<div class="news-it" style="animation-delay:${(k++) * 50}ms"><span class="ic">${ic(x.ic)}</span><span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></span></div>`).join("")}`).join("")}</div>
  <button class="btn primary wide" data-act="newsok" style="margin:18px 0 22px">${ic("check")}Super !</button></div></div>`;
}
function openNews(all) { openLayer(newsHtml(all), "newsl"); }
/* Au lancement : la présentation pour un nouveau joueur, sinon les nouveautés pas encore vues */
function maybeIntro() {
  if (VIEW !== "home" || !$("#layer").hidden || navigator.webdriver) return;
  const h = S.hint || {};
  const fresh = !h.tour && (S.xp || 0) < 40 && !Object.keys(S.sp).length;
  if (fresh) { openTour(0); return; }
  if (!h.tour) S.hint = { ...h, tour: Date.now() };
  if ((S.hint.news || "") < NEWS[0].v) openNews();
}

/* ---------- Piaf en main ---------- */
VIEWS.hand = () => handHubHtml();
VIEWS.top = () => topViewHtml();
MOUNT.top = () => topMount();
VIEWS.live = () => liveViewHtml();
MOUNT.live = () => liveMount();
VIEWS.defi = () => defiViewHtml();
MOUNT.defi = () => defiMount();
VIEWS.paths = () => pathsListHtml();
VIEWS.path = () => pathHtml();
MOUNT.path = () => pathMount();

/* ---------- Constructeur « Sur mesure » ---------- */
const defaultB = () => ({ zone: S.set.zone, guilds: [], fams: [], freq: "common", size: 100, stim: ["photo"], age: "all", target: "species", names: S.set.names, format: "qcm", k: S.set.k, diff: S.set.diff, len: 10, timer: 0 });
const BOPT = {
  freq: [["common", "Communs", "star"], ["season", "De saison", "cal"], ["all", "Tous", "list"], ["rare", "Raretés", "spark"], ["exotic", "Exotiques", "pin"], ["mine", "Mes obs. iNat", "eye"], ["lifers", "À découvrir", "binoc"]],
  size: [[25, "Top 25"], [50, "Top 50"], [100, "Top 100"], [200, "Top 200"]],
  stim: [["photo", "Photo", "frame"], ["field", "Terrain", "eye"], ["son", "Chant", "wave"], ["soncho", "Quel chant ?", "vol"], ["fr", "Nom FR", "type"], ["la", "Nom latin", "quill"]],
  age: [["all", "Tous les âges", "bird"], ["juv", "Juvéniles", "spark"], ["adult", "Adultes", "star"]],
  target: [["species", "Espèce", "bird"], ["genus", "Genre", "quill"], ["family", "Famille", "tree"], ["order", "Ordre", "tree"]],
  names: [["both", "FR + latin"], ["fr", "Français"], ["la", "Latin"]],
  format: [["qcm", "Choix", "list"], ["tiles", "Vignettes", "grid"], ["type", "Saisie", "keyboard"], ["flash", "Flashcard", "cards"]],
  diff: [["facile", "Facile"], ["moyen", "Moyen"], ["expert", "Expert"]],
  len: [[5, "5"], [10, "10"], [20, "20"], [0, "∞"]],
  timer: [[0, "Sans"], [10, "10 s / question"], [60, "Défi 60 s"]]
};
const getB = () => { const B = S.set.builder = S.set.builder || defaultB(); if (!B.age) B.age = "all"; return B; };
function optRow(field, list, multi, wrap) {
  const B = getB();
  return `<div class="row ${wrap ? "wrap" : ""}">${list.map(([v, l, i]) => {
    const on = multi ? B[field].includes(v) : B[field] === v;
    return `<button class="opt-btn ${on ? "on" : ""}" data-act="b" data-f="${field}" data-v="${v}">${i ? ic(i) : ""}${l}</button>`;
  }).join("")}</div>`;
}
VIEWS.builder = () => {
  const B = getB();
  const famChips = B.fams.map(id => { const f = TAXO.fam.get(id); return f ? `<button class="chip fam" data-act="bfamdel" data-id="${id}">${esc(f.fr)} ${ic("x", "xs")}</button>` : ""; }).join("");
  const bopen = (S.pv || {}).bset ?? false;
  return `<section class="view builder">
  <div class="head"><button class="icon-btn" data-act="home" aria-label="Retour">${ic("back")}</button><div><h1>Sur mesure</h1><p>Une recette en un geste, ou règle tout toi-même.</p></div></div>
  <div class="opt"><div class="opt-h">${ic("pin")}Zone<span class="val">${esc(zoneLabel(B.zone))}</span></div><div class="row">${zoneChips(B.zone, "bzone")}</div></div>
  <div class="sec">${ic("spark")}Recettes</div>
  ${recipesHtml()}
  <details class="bset"${bopen ? " open" : ""} data-k="bset"><summary data-act="pvt"><span class="pvi">${ic("sliders")}</span><span class="pvt"><b>Régler moi-même</b><small>${esc(builderTitle(B))}</small></span><span class="pvc">${ic("chev")}</span></summary>
  <div class="opt"><div class="opt-h">${ic("tree")}Oiseaux<span class="val">${B.guilds.length || B.fams.length ? (B.guilds.length + B.fams.length) + " groupe(s)" : "Tous"}</span></div>
    <div class="row"><button class="opt-btn ${!B.guilds.length && !B.fams.length ? "on" : ""}" data-act="ball">${ic("bird")}Tous</button>${GUILDS.map(g => `<button class="opt-btn ${B.guilds.includes(g.n) ? "on" : ""}" data-act="bguild" data-g="${esc(g.n)}">${esc(g.n)}</button>`).join("")}<button class="opt-btn" data-act="bfam">${ic("search")}Une famille…</button></div>
    ${famChips ? `<div class="selfam">${famChips}</div>` : ""}</div>
  <div class="opt"><div class="opt-h">${ic("star")}Lesquels</div>${optRow("freq", BOPT.freq)}${["common", "rare", "lifers"].includes(B.freq) ? `<div style="margin-top:8px">${optRow("size", BOPT.size)}</div>` : ""}</div>
  <div class="opt"><div class="opt-h">${ic("eye")}Question<span class="val">plusieurs choix possibles</span></div>${optRow("stim", BOPT.stim, true, true)}</div>
  <div class="opt"><div class="opt-h">${ic("cal")}Âge des oiseaux<span class="val">${B.age === "juv" ? "juvéniles" : B.age === "adult" ? "adultes" : "tous"}</span></div>${optRow("age", BOPT.age)}
    ${B.age !== "all" ? `<p class="muted note" style="margin-top:6px">Photos d'observations iNaturalist annotées « ${B.age === "juv" ? "juvénile" : "adulte"} » par les observateurs : seules les espèces qui en ont dans la zone sont proposées. S'applique aux questions avec photo.</p>` : ""}</div>
  <div class="opt"><div class="opt-h">${ic("check")}Réponse attendue</div>${optRow("target", BOPT.target)}</div>
  <div class="opt"><div class="opt-h">${ic("type")}Noms affichés</div>${optRow("names", BOPT.names)}</div>
  <div class="opt"><div class="opt-h">${ic("list")}Format</div>${optRow("format", BOPT.format)}
    ${B.format === "qcm" || B.format === "tiles" ? `<div style="display:flex;align-items:center;gap:14px;margin-top:10px;flex-wrap:wrap"><div class="stepper"><button data-act="bk" data-d="-1" aria-label="Moins de choix">${ic("minus")}</button><output>${B.k}</output><button data-act="bk" data-d="1" aria-label="Plus de choix">${ic("plus")}</button></div><span class="muted" style="font-size:13px">choix par question</span></div>` : ""}</div>
  <div class="opt"><div class="opt-h">${ic("bolt")}Difficulté des leurres</div>${optRow("diff", BOPT.diff)}</div>
  <div class="opt"><div class="opt-h">${ic("clock")}Longueur & chrono</div>${optRow("len", BOPT.len)}<div style="margin-top:8px">${optRow("timer", BOPT.timer)}</div></div>
  <div class="launch"><button class="btn ghost" data-act="bsave" aria-label="Enregistrer ce quiz">${ic("star")}</button><button class="btn ghost" data-act="bshare" aria-label="Partager ce quiz">${ic("ext")}</button><button class="btn primary" data-act="blaunch">${ic("play")}Lancer</button></div>
  </details>
</section>`;
};
function builderTitle(B) {
  const grp = B.guilds.length === 1 && !B.fams.length ? B.guilds[0] : B.fams.length === 1 && !B.guilds.length ? famName(B.fams[0]) : B.guilds.length + B.fams.length ? "Groupes" : "Oiseaux";
  const st = B.stim.map(s => (BOPT.stim.find(x => x[0] === s) || [])[1]).filter(Boolean).join("+");
  return `${grp}${B.age && B.age !== "all" ? " · " + (B.age === "juv" ? "Juvéniles" : "Adultes") : ""} · ${st} · ${zoneLabel(B.zone)}`;
}
async function builderCfg(B) {
  let taxa = [...B.fams];
  if (B.fnames?.length) { await loadTaxo(); for (const n of B.fnames) { const f = TAXO.famByName.get(n); if (f) taxa.push(f.id); } }
  if (B.guilds.length) {
    await loadTaxo();
    for (const g of GUILDS.filter(x => B.guilds.includes(x.n))) for (const n of g.f) { const f = TAXO.famByName.get(n); if (f) taxa.push(f.id); }
  }
  taxa = [...new Set(taxa)];
  const onlySound = B.stim.every(s => s === "son" || s === "soncho");
  return { kind: "quiz", title: builderTitle(B), icon: "sliders", zone: B.zone, taxa, freq: B.freq, size: B.size, sounds: onlySound, stim: B.stim.slice(), age: B.age && B.age !== "all" ? B.age : "", target: B.target, names: B.names, format: B.format, k: B.k, diff: B.diff, len: B.timer === 60 ? 0 : B.len, timer: B.timer };
}

/* ---------- Préparer une sortie ---------- */
const TRIP = { z: null, m: new Date().getMonth() + 1, rec: false, list: null, recent: null, mode: "prep", q: "", load: 0, err: "" };
const tripZone = () => TRIP.z || S.set.tripZ || S.set.zone;
const tripPlace = () => zoneLabel(tripZone());
VIEWS.trip = () => {
  const T = TRIP, z = tripZone();
  if (T.mode === "field") return tripFieldHtml();
  return `<section class="view trip">
  <div class="head"><button class="icon-btn" data-act="home" aria-label="Retour">${ic("back")}</button><div style="flex:1"><h1 class="h1">Préparer une sortie</h1><small class="muted">Les oiseaux qui t'attendent, à réviser avant de partir.</small></div></div>
  <div class="sec">${ic("pin")}Où ?</div>
  <div class="row">${zoneChips(z, "tzone")}<button class="opt-btn" data-act="tmap">${ic("map")}Sur la carte</button></div>
  <div class="sec">${ic("cal")}Quand ?</div>
  <div class="mrow">${MONTHS_SHORT.map((m, i) => `<button class="opt-btn mini ${!T.rec && T.m === i + 1 ? "on" : ""}" data-act="tmonth" data-m="${i + 1}">${m}</button>`).join("")}</div>
  <div class="seg" style="margin-top:10px"><button class="${T.rec ? "" : "on"}" data-act="trec" data-v="0">Saison, toutes années</button><button class="${T.rec ? "on" : ""}" data-act="trec" data-v="1">En ce moment (30 j)</button></div>
  <div id="tlist">${tripListHtml()}</div>
</section>`;
};
MOUNT.trip = () => { if (TRIP.mode === "prep") loadTrip(); else $("#tsearch")?.focus({ preventScroll: true }); };
async function loadTrip() {
  const T = TRIP, z = tripZone(), m = T.m, rec = T.rec, tok = ++T.load, now = m === new Date().getMonth() + 1;
  T.list = null; T.err = ""; T.recent = null; T.offline = false;
  const box = $("#tlist"); if (box) box.innerHTML = tripListHtml();
  try {
    const [list, recent] = await Promise.all([tripSpecies(z, m, rec), !rec && now ? tripSpecies(z, m, true).catch(() => null) : null]);
    if (tok !== T.load) return;
    T.list = list; T.recent = recent ? new Set(recent.map(t => t.id)) : null;
  } catch (e) { if (tok !== T.load) return; if (packFallback()) toast("Hors ligne : la liste de ton pack terrain."); else T.err = "Liste indisponible pour l'instant (réseau ?)."; }
  const b = $("#tlist"); if (b && VIEW === "trip") b.innerHTML = tripListHtml();
}
function tripListHtml() {
  const T = TRIP;
  if (T.err) return `<div class="empty">${ic("binoc")}<b>${esc(T.err)}</b><button class="btn primary" data-act="tload">${ic("replay")}Réessayer</button>${packOf() ? `<button class="btn ghost" data-act="tpackopen" style="margin-top:8px">${ic("down")}Ouvrir mon pack hors ligne (${esc(packOf().place)})</button>` : ""}</div>`;
  if (!T.list) return `<div class="tload"><div class="spin"></div><small>Recherche des oiseaux observés dans la zone…</small></div>`;
  if (!T.list.length) return `<div class="empty">${ic("binoc")}<b>Aucune observation trouvée</b><p>Élargis la zone ou change de période.</p></div>`;
  const max = T.list[0].c || 1, known = T.list.filter(t => S.sp[t.id]?.n).length, rec = T.recent ? T.list.filter(t => T.recent.has(t.id)).length : 0;
  return `<div class="tsum"><b>${T.list.length} espèces</b> observées ${T.rec ? "ces 30 derniers jours" : "en " + MONTHS_LONG[T.m - 1]} · ${known} déjà dans ton carnet${rec ? ` · <span class="dot"></span>${rec} vues ces 30 derniers jours` : ""}</div>
  ${T.offline ? `<p class="pkoff">${ic("down", "xs")}Sans réseau : liste du pack terrain (${esc(packOf()?.place || "")}).</p>` : ""}
  <div class="tacts"><button class="btn primary" data-act="tquiz">${ic("play")}Réviser</button><button class="btn ghost" data-act="tfield">${ic("check")}Sur place</button>${packBtnHtml()}</div>
  <div class="tl">${T.list.slice(0, 150).map(t => { const r = S.sp[t.id], p = Math.max(.04, (t.c || 0) / max); return `<button class="trow" data-act="fiche" data-id="${t.id}"><img src="${esc(t.img?.sq || "")}" alt="" loading="lazy"><span class="tx"><b>${esc(nameFr(t))}</b><small class="latin">${esc(t.sci)}</small></span><span class="fq" title="${t.c || 0} observations"><i style="width:${(p * 100).toFixed(0)}%"></i></span>${T.recent?.has(t.id) ? `<span class="dot" title="Vue ces 30 derniers jours"></span>` : ""}${r?.n ? starsHtml(stars(r)) : ""}</button>`; }).join("")}</div>
  <p class="muted note">La barre montre le nombre d'observations iNaturalist validées dans la zone. Une espèce discrète peut être sous-représentée.</p>`;
}
function tripQuiz() {
  const T = TRIP;
  if (!T.list || !T.list.length) return;
  const z = tripZone(), id = Date.now();
  const sp = T.list.filter(t => t.img).slice(0, 60).map(t => [t.id, t.sci, t.fr, t.img.sq, t.img.md, t.c || 0]);
  if (sp.length < 4) { toast("Pas assez d'espèces avec photo pour un quiz."); return; }
  S.trips = [{ id, z, m: T.m, rec: T.rec, at: Date.now(), sp }, ...(S.trips || [])].slice(0, 4);
  save();
  LASTCFG = { kind: "quiz", title: `Sortie · ${zoneLabel(z)} · ${T.rec ? "en ce moment" : MONTHS_LONG[T.m - 1]}`, icon: "binoc", trip: id, zone: z, stim: T.offline || !navigator.onLine ? ["photo"] : ["photo", "photo", "son", "field"], target: "species", names: S.set.names, format: S.set.fmt || "qcm", k: S.set.k, diff: S.set.diff, len: 12, timer: 0 };
  startSession(LASTCFG);
}
function tripSeen() { const d = dayKey(), p = tripPlace(); return new Set((S.obs || []).filter(o => o.d === d && o.p === p).map(o => o.id)); }
function tripFieldHtml() {
  const n = tripSeen().size;
  return `<section class="view trip field">
  <div class="head"><button class="icon-btn" data-act="tprep" aria-label="Retour">${ic("back")}</button><div style="flex:1"><h1 class="h1">Sur place</h1><small class="muted">${esc(tripPlace())} · ${esc(dateLong(dayKey()))}</small></div><span class="tcount" id="tcount">${n}</span></div>
  <p class="muted note" style="margin-top:0">Coche ce que tu vois ou entends : ça part dans ton carnet, rubrique « Observées ».</p>
  <div class="search">${ic("search")}<input id="tsearch" type="search" placeholder="Chercher ou ajouter une espèce" value="${esc(TRIP.q)}" autocomplete="off" aria-label="Chercher une espèce"></div>
  <div class="tl chk" id="tchk">${tripChkHtml()}</div>
  <div class="tbar"><button class="btn primary wide" data-act="tdone" id="tdone">${ic("check")}Terminer${n ? ` · ${n}` : ""}</button></div>
</section>`;
}
function tripChkHtml() {
  const seen = tripSeen(), q = norm(TRIP.q), all = TRIP.list || [];
  const list = all.filter(t => !q || norm(nameFr(t) + " " + t.sci).includes(q)).slice(0, 150);
  const extra = q.length >= 2 && list.length < 4 ? lexSearch(TRIP.q, 6).filter(e => !all.some(t => t.id === e.id)) : [];
  const row = (id, name, sci, img, on) => `<button class="crow ${on ? "on" : ""}" data-act="tobs" data-id="${id}" aria-pressed="${on ? "true" : "false"}"><span class="cb">${ic("check")}</span><img src="${esc(img || "")}" alt="" loading="lazy"><span class="tx"><b>${esc(name)}</b><small class="latin">${esc(sci)}</small></span></button>`;
  const html = list.map(t => row(t.id, nameFr(t), t.sci, t.img?.sq, seen.has(t.id))).join("") + extra.map(e => row(e.id, e.fr || e.sci, e.sci, e.img, seen.has(e.id))).join("");
  return html || `<p class="muted" style="padding:10px 4px">Aucune espèce ne correspond. Essaie le nom latin ou une autre orthographe.</p>`;
}
function tripObs(id) {
  const z = tripZone(), place = zoneLabel(z), d = dayKey();
  let t = (TRIP.list || []).find(x => x.id === id);
  if (!t) {
    const e = LEX.get(id);
    if (!e) return;
    t = { id: e.id, sci: e.sci, fr: e.fr, img: e.img ? { sq: e.img, md: sizeUrl(e.img, "medium"), attr: "", lic: "" } : null, a: [], f: e.f || 0, c: 0 };
    (TRIP.list || (TRIP.list = [])).unshift(t);
  }
  const obs = S.obs || (S.obs = []), i = obs.findIndex(o => o.id === id && o.d === d && o.p === place), r = rec(t);
  if (i >= 0) {
    obs.splice(i, 1);
    r.nobs = Math.max(0, (r.nobs || 1) - 1);
    const prev = obs.filter(o => o.id === id).pop();
    r.seen = prev ? [prev.d, prev.p] : null;
  } else {
    obs.push({ id, d, p: place, la: z?.lat ?? null, ln: z?.lng ?? null });
    if (obs.length > 3000) obs.splice(0, obs.length - 3000);
    r.nobs = (r.nobs || 0) + 1; r.seen = [d, place];
    buzz(12);
  }
  save();
  const b = $("#tchk"); if (b) b.innerHTML = tripChkHtml();
  const n = tripSeen().size, c = $("#tcount"), dn = $("#tdone");
  if (c) c.textContent = n;
  if (dn) dn.innerHTML = ic("check") + "Terminer" + (n ? " · " + n : "");
}
/* Choix d'un point sur la carte (centre d'une sortie) */
let PMAP = null, PCB = null;
async function openMapPicker(cb) {
  try { await ensureLeaflet(); } catch (e) { toast("Carte indisponible pour l'instant."); return; }
  PCB = cb;
  const z0 = tripZone();
  openLayer(`<div class="panel mpick"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button><div class="in" style="padding-top:22px">
    <h2>Choisir sur la carte</h2><p class="muted" style="margin:6px 0 12px;font-size:14px">Touche la carte pour placer le centre de ta sortie, puis choisis le rayon.</p>
    <div class="pmap" id="pmap"></div>
    <div class="seg" style="margin-top:10px">${[2, 5, 10, 25].map(r => `<button class="${r === 5 ? "on" : ""}" data-act="prad" data-r="${r}">${r} km</button>`).join("")}</div>
    <button class="btn primary wide" id="pok" data-act="pmapok" disabled style="margin:12px 0 16px">${ic("check")}Valider ce point</button></div></div>`);
  if (PMAP) { try { PMAP.remove(); } catch (e) { /* rien */ } }
  const has = z0 && z0.lat != null;
  const map = PMAP = L.map($("#pmap"), { zoomControl: false, attributionControl: true, minZoom: 2, maxZoom: 16, zoomSnap: .5 }).setView(has ? [z0.lat, z0.lng] : [46.6, 2.4], has ? 10 : 5);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  const lp = map.createPane("labels"); lp.style.zIndex = 350; lp.style.pointerEvents = "none";
  setMapStyle(map, curStyle());
  PMAP._r = 5;
  if (has) { PMAP._c = L.latLng(z0.lat, z0.lng); drawPick(); $("#pok").disabled = false; }
  map.on("click", e => { PMAP._c = e.latlng; drawPick(); const b = $("#pok"); if (b) b.disabled = false; });
  setTimeout(() => map.invalidateSize(), 80);
}
function drawPick() {
  const m = PMAP;
  if (!m || !m._c) return;
  if (m._mk) { m._mk.setLatLng(m._c); m._ci.setLatLng(m._c); m._ci.setRadius(m._r * 1000); }
  else { m._ci = L.circle(m._c, { radius: m._r * 1000, color: "#1FD1F2", weight: 1.5, fillOpacity: .12, interactive: false }).addTo(m); m._mk = L.circleMarker(m._c, { radius: 8, color: "#fff", weight: 3, fillColor: "#FF8B3D", fillOpacity: 1, interactive: false }).addTo(m); }
}

/* ---------- Confidentialité et sources ---------- */
const SOURCES = [
  ["iNaturalist", "https://www.inaturalist.org", "Les espèces observées par zone et par mois, les photos (de référence et de terrain), les sons, les espèces souvent confondues, la présence par mois, les cartes d'observations et les lieux.", "Chaque photo et chaque son garde sa licence (CC0, CC BY, CC BY-NC…) et son auteur, affichés dans l'appli."],
  ["Wikipédia (français)", "https://fr.wikipedia.org", "Les résumés des espèces et la section « Description » utilisée pour les critères de reconnaissance.", "Textes sous licence CC BY-SA 4.0."],
  ["Wikimedia Commons", "https://commons.wikimedia.org", "Des enregistrements de chants et de cris, dont l'appli peut calculer le spectrogramme.", "Licence libre propre à chaque fichier (souvent CC BY-SA), affichée avec l'auteur."],
  ["xeno-canto (facultatif)", "https://xeno-canto.org", "Avec ta clé : chants et cris classés (chant, cri, alarme…) et leurs sonogrammes.", "Licences Creative Commons propres à chaque enregistrement."],
  ["NASA GIBS · Blue Marble", "https://earthdata.nasa.gov/gibs", "Le fond de carte « Relief » (montagnes et fonds marins).", "Imagerie de la NASA, libre d'utilisation avec crédit."],
  ["Esri", "https://www.esri.com", "Les fonds « Satellite », « Topo » et « Océans », et les noms de lieux par-dessus le relief.", "Conditions d'utilisation d'Esri ; crédits affichés en bas de la carte."],
  ["OpenStreetMap", "https://www.openstreetmap.org/copyright", "Le fond « Nuit », et le fond de secours quand un autre ne répond pas.", "© contributeurs OpenStreetMap, licence ODbL."],
  ["Leaflet", "https://leafletjs.com", "L'affichage des cartes interactives (hébergé avec l'appli).", "Licence BSD-2-Clause."],
  ["Polices Unbounded, Figtree, Instrument Serif", "https://fonts.google.com", "La typographie de l'appli (hébergée avec l'appli, sans appel à Google).", "SIL Open Font License 1.1."],
  ["Ringers' DigiGuide (station d'Ottenby)", "https://ringersdigiguide.ottenby.se", "Piaf en main : les critères d'âge par espèce (limites de mue, usure, iris, rectrices) et l'étendue des mues, résumés et redessinés pour l'appli.", "Contenus de la station ornithologique d'Ottenby ; les dessins de l'appli sont originaux et schématiques."],
  ["EURING", "https://euring.org", "Piaf en main : les codes d'âge (1 à 6…) et l'échelle du score de mue des primaires (0 à 5).", "Code d'échange EURING 2000+."],
  ["BTO", "https://www.bto.org", "Piaf en main : la notation de la mue des primaires et les espèces à mue post-juvénile complète.", "British Trust for Ornithology."],
  ["CRBPO (MNHN)", "https://crbpo.mnhn.fr", "Piaf en main : la notation française des âges (1A, +1A, 2A…) et les stratégies de mue présentées en formation.", "Centre de Recherches sur la Biologie des Populations d'Oiseaux."],
  ["Firebase Realtime Database (Google)", "https://firebase.google.com/docs/database", "Le classement XP, le duel en direct, le classement du défi de la semaine et la sauvegarde en ligne, seulement quand tu les utilises.", "Données réduites au pseudo, à l'XP, aux points de la semaine, aux parties en cours et à ta sauvegarde chiffrée."],
  ["Critères des sosies", "", "Les tableaux « Comment les distinguer » des Duels : résumé simplifié des critères classiques des guides de terrain, rédigé pour l'appli.", "En cas de doute, ton guide de terrain fait foi."],
  ["Racines latines", "", "Le petit dictionnaire qui décode les noms scientifiques, rédigé pour l'appli.", "—"],
  ["Faune France", "https://www.faune-france.org", "Un simple lien depuis les fiches : ses données ne sont pas ouvertes.", "—"],
  ["GitHub Pages", "https://pages.github.com", "L'hébergement de l'appli.", "Voir la section confidentialité ci-dessus."]
];
VIEWS.about = () => `<section class="view about">
  <div class="head"><button class="icon-btn" data-act="tab" data-tab="settings" aria-label="Retour">${ic("back")}</button><h1 class="h1" style="flex:1">Confidentialité et sources</h1></div>
  <div class="sec">${ic("shield")}Confidentialité</div>
  <div class="card prose">
    <p class="lead2">Pas de compte, pas de publicité, pas de traceur, pas de mesure d'audience. Ce que tu fais dans l'appli reste sur ton appareil.</p>
    <h3>Ce qui reste sur ton appareil</h3>
    <ul><li>Ta progression (XP, séries, révisions), ton carnet, tes astuces, tes sorties et observations, tes réglages.</li>
    <li>Une mémoire temporaire des réponses d'iNaturalist et de Wikipédia, pour aller plus vite.</li>
    <li>Tout est rangé dans le stockage du navigateur. Réglages, puis « Tout effacer », supprime tout.</li></ul>
    <h3>Ce qui sort de ton appareil</h3>
    <ul><li>L'appli interroge directement les services de la liste ci-dessous. Comme pour toute page web, ils voient l'adresse IP de ton appareil et ce qui est demandé (par exemple l'espèce affichée ou la zone de la carte).</li>
    <li><b>Ta position</b> n'est utilisée que si tu choisis « Autour de moi ». Elle est arrondie à environ 100 m et envoyée à iNaturalist pour trouver les oiseaux proches.</li>
    <li><b>Ton pseudo iNaturalist</b> (facultatif) est envoyé à iNaturalist pour retrouver les espèces que tu as observées, une information déjà publique.</li>
    <li><b>Ta clé xeno-canto</b> (facultative) reste sur ton appareil et n'est envoyée qu'à xeno-canto. Elle n'est pas incluse dans tes sauvegardes.</li>
    <li><b>Tes sauvegardes</b> ne partent que là où tu les envoies (Fichiers, iCloud, mail…).</li>
    <li><b>Classement (facultatif)</b> : seulement si tu l'actives, ton pseudo, ton XP et la date sont publiés sur le serveur de l'appli (Firebase, de Google). Le désactiver efface ta ligne.</li>
    <li><b>Duel en direct (facultatif)</b> : pendant une partie, les pseudos, les questions et les réponses passent par ce même serveur, puis la partie est effacée.</li>
    <li><b>Défi de la semaine</b> : ton premier essai de la semaine (pseudo et points) rejoint le classement de la semaine, si tu as choisi un pseudo.</li>
    <li><b>Sauvegarde en ligne (facultative)</b> : ta progression est chiffrée sur ton téléphone avec un code de 16 caractères que toi seul connais ; le serveur ne reçoit qu'un bloc illisible. Sans le code, personne ne peut la lire, ni la retrouver.</li>
    <li><b>Défi à distance et quiz partagés</b> : rien ne passe par un serveur ; le lien que tu envoies contient les questions (ou les réglages du quiz), ton pseudo et tes réponses.</li></ul>
    <h3>Hébergement</h3>
    <ul><li>L'appli est hébergée par GitHub Pages. GitHub enregistre l'adresse IP des visiteurs pour des raisons de sécurité.</li>
    <li>Les polices et la bibliothèque de cartes sont hébergées avec l'appli : aucun appel à Google Fonts ni à un CDN.</li></ul>
    <h3>Tes données, tes choix</h3>
    <ul><li>Tu peux tout exporter (sauvegarde complète ou carnet en CSV) et tout effacer à tout moment, sans rien demander à personne.</li></ul>
    <small class="muted">Mise à jour : 25 octobre 2026.</small>
  </div>
  <div class="sec">${ic("book")}Sources et leur utilité</div>
  <div class="srcs">${SOURCES.map(([n, u, d, l]) => `<div class="src"><div class="sh"><b>${esc(n)}</b>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener" aria-label="Ouvrir ${esc(n)}">${ic("ext", "xs")}</a>` : ""}</div><p>${esc(d)}</p><small>${esc(l)}</small></div>`).join("")}</div>
</section>`;

/* ---------- Carnet ---------- */
const CARNET = { q: "", f: "all" };
function carnetList() {
  const tday = todayNum(), q = norm(CARNET.q);
  let all = Object.entries(S.sp).filter(([, r]) => r.n > 0 || r.nobs > 0).map(([id, r]) => ({ id: +id, r }));
  if (CARNET.f === "due") all = all.filter(x => Object.values(x.r.due || {}).some(d => d <= tday));
  if (CARNET.f === "master") all = all.filter(x => stars(x.r) === 3);
  if (CARNET.f === "weak") all = all.filter(x => x.r.n >= 2 && x.r.ok / x.r.n < .6);
  if (CARNET.f === "field") all = all.filter(x => FIELD.ids.has(x.id) || x.r.nobs > 0);
  if (q) all = all.filter(x => norm(x.r.fr).includes(q) || norm(x.r.sci).includes(q));
  return all.sort((a, b) => String(b.r.last || "").localeCompare(String(a.r.last || "")) || String(a.r.fr || a.r.sci).localeCompare(String(b.r.fr || b.r.sci)));
}
function carnetGrid() {
  const list = carnetList();
  if (!list.length) return `<div class="empty">${ic("book")}<b>${Object.keys(S.sp).length ? "Rien ici" : "Ton carnet est vide"}</b><p>${Object.keys(S.sp).length ? "Change de filtre ou de recherche." : "Chaque oiseau croisé en quiz s'ajoute ici, avec sa fiche et ton niveau."}</p>${Object.keys(S.sp).length ? "" : `<button class="btn primary" data-act="daily">${ic("play")}Série du jour</button>`}</div>`;
  return `<div class="cgrid">${list.map(({ id, r }) => `<button class="ctile" data-act="fiche" data-id="${id}"><span class="av" style="--p:${(stars(r) / 3 * 100).toFixed(0)}"><img src="${esc(r.img || r.md)}" alt="" loading="lazy">${FIELD.ids.has(id) || r.nobs > 0 ? `<span class="fld" title="Vue sur le terrain">${ic("eye", "xs")}</span>` : ""}</span><b>${esc(r.fr || r.sci)}</b>${starsHtml(stars(r))}</button>`).join("")}</div>`;
}
VIEWS.carnet = () => {
  const recs = Object.values(S.sp).filter(r => r.n > 0 || r.nobs > 0);
  const master = recs.filter(r => stars(r) === 3).length, seenN = Object.entries(S.sp).filter(([id, r]) => r.nobs > 0 || FIELD.ids.has(+id)).length;
  const filt = [["all", "Toutes"], ["due", "À revoir"], ["weak", "Fragiles"], ["master", "Maîtrisées"], ["field", "Observées"]];
  return `<section class="view carnet">
  <div class="head"><div style="flex:1"><h1 style="font:700 24px/1.1 var(--f-display);margin:0">Carnet</h1><div class="counts"><span><b>${recs.length}</b> espèces</span><span><b>${master}</b> maîtrisées</span><span><b>${seenN}</b> observées</span><span><b>${dueList().length}</b> à revoir</span></div><small class="cexpl">${ic("star", "xs")}Maîtrisée = reconnue sur 3 photos différentes, dont 1 de terrain, sur 3 jours.</small></div>${recs.length ? `<button class="icon-btn" data-act="csv" aria-label="Exporter le carnet">${ic("down")}</button>` : ""}</div>
  <div class="search" style="margin-top:14px">${ic("search")}<input id="csearch" type="search" placeholder="Chercher une espèce" value="${esc(CARNET.q)}" aria-label="Chercher"></div>
  <div class="row" style="margin-top:10px">${filt.map(([k, l]) => `<button class="opt-btn mini ${CARNET.f === k ? "on" : ""}" data-act="cfilt" data-f="${k}">${l}</button>`).join("")}</div>
  <div id="cgrid">${carnetGrid()}</div>
</section>`;
};

MOUNT.carnet = () => { if (S.set.inat) loadField().then(() => { if (VIEW === "carnet") $("#cgrid").innerHTML = carnetGrid(); }).catch(() => {}); };

/* ---------- Progrès ---------- */
function heatHtml() {
  const tn = todayNum(), start = tn - 83 - ((new Date().getDay() + 6) % 7);
  const cells = [];
  for (let n = start; n <= tn; n++) {
    const d = S.days[keyOfNum(n)], xp = d?.xp || 0;
    const l = !xp ? "" : xp < 40 ? "l1" : xp < 100 ? "l2" : xp < 200 ? "l3" : "l4";
    cells.push(`<i class="${l} ${n === tn ? "today" : ""}" title="${keyOfNum(n)} : ${xp} XP"></i>`);
  }
  return `<div class="heat">${cells.join("")}</div>`;
}
function chartHtml() {
  const tn = todayNum(), days = Array.from({ length: 14 }, (_, i) => { const k = keyOfNum(tn - 13 + i); return { k, d: S.days[k] }; });
  const max = Math.max(60, ...days.map(x => x.d?.xp || 0));
  const W = 340, H = 150, bw = 16, gap = (W - 20 - bw * 14) / 13;
  const bars = days.map((x, i) => {
    const xp = x.d?.xp || 0, h = Math.max(2, (xp / max) * (H - 40)), X = 10 + i * (bw + gap), Y = H - 22 - h;
    const wd = "LMMJVSD"[(new Date(x.k + "T12:00:00").getDay() + 6) % 7];
    return `<rect x="${X.toFixed(1)}" y="${Y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="4" style="fill:${xp ? "var(--gold)" : "rgba(255,255,255,.08)"}"><title>${x.k} : ${xp} XP</title></rect><text x="${(X + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${wd}</text>`;
  }).join("");
  const pts = days.map((x, i) => x.d?.q ? [10 + i * (bw + gap) + bw / 2, 8 + (1 - x.d.ok / x.d.q) * (H - 40)] : null);
  const line = pts.filter(Boolean).map(p => p.map(v => v.toFixed(1)).join(",")).join(" ");
  const dots = pts.filter(Boolean).map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" style="fill:var(--cyan);stroke:var(--card);stroke-width:2"/>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="XP et réussite sur 14 jours">${bars}${line ? `<polyline points="${line}" style="fill:none;stroke:var(--cyan);stroke-width:2;stroke-linejoin:round;opacity:.9"/>` : ""}${dots}</svg>
  <div style="display:flex;gap:14px;font-size:12px;color:var(--muted);margin-top:4px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--gold);margin-right:6px"></i>XP du jour</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--cyan);margin-right:6px"></i>Taux de réussite</span></div>`;
}
VIEWS.progress = () => {
  const L = level(), C = 2 * Math.PI * 40, st = liveStreak();
  const recs = Object.values(S.sp).filter(r => r.n > 0);
  const master = recs.filter(r => stars(r) === 3).length, due = dueList().length;
  const tot = Object.values(S.stats).reduce((a, s) => ({ n: a.n + s.n, ok: a.ok + s.ok }), { n: 0, ok: 0 });
  const td = S.days[dayKey()] || { xp: 0, q: 0 };
  const cats = [["photo", "Photos", "frame"], ["son", "Chants", "wave"], ["nom", "Noms", "quill"], ["fam", "Familles", "tree"], ["type", "Saisie", "keyboard"], ["geo", "Géo", "globe"], ["root", "Racines", "root"], ["hand", "Piaf en main", "ring"]].filter(([k]) => S.stats[k]?.n);
  const conf = topConfusions(5);
  const goal = S.set.goal || 150, gp = clamp(td.xp / goal, 0, 1);
  const w7 = periodStats(7), w30 = periodStats(30), prev7 = (() => { const a = periodStats(14); return { xp: a.xp - w7.xp, q: a.q - w7.q, ok: a.ok - w7.ok }; })();
  const pct = o => o.q ? Math.round(100 * o.ok / o.q) : null;
  const trend = pct(w7) != null && pct(prev7) != null ? pct(w7) - pct(prev7) : null;
  const fs = familyStats(), best = fs.slice().sort((a, b) => b.p - a.p || b.n - a.n).slice(0, 3), bestIds = new Set(best.map(x => x.f));
  const weak = fs.filter(x => !bestIds.has(x.f) && x.p < .8).sort((a, b) => a.p - b.p).slice(0, 3);
  const famRow = (x, train) => `<div class="hbar fam"><span class="t">${esc(famName(x.f))}<small>${x.sp} esp. · ${x.n} rép.</small></span><span class="b"><i style="width:${(x.p * 100).toFixed(0)}%"></i></span><span class="v">${Math.round(x.p * 100)} %</span>${train ? `<button class="chip warn" data-act="ftrain" data-f="${x.f}">${ic("play", "xs")}Revoir</button>` : ""}</div>`;
  const hist = (S.hist || []).slice(0, 10);
  const r7 = retention(7, 30), r30 = retention(30, 1e6), rv = x => x.n >= 3 ? Math.round(x.p * 100) + " %" : "–", rsub = x => x.n ? `${x.n} retour${x.n > 1 ? "s" : ""} mesuré${x.n > 1 ? "s" : ""}` : "pas encore de données";
  const catP = cats.map(([k, l, i]) => ({ k, l, i, p: S.stats[k].ok / S.stats[k].n })), catBest = catP.slice().sort((a, b) => b.p - a.p)[0];
  const pv = S.pv || {}, nb = Object.keys(S.badges).length;
  /* Un bloc repliable : titre, une ligne de résumé, le détail au toucher */
  const box = (k, icon, title, sum, body, def) => `<details class="pv"${(pv[k] ?? def) ? " open" : ""} data-k="${k}"><summary data-act="pvt"><span class="pvi">${ic(icon)}</span><span class="pvt"><b>${title}</b><small>${sum}</small></span><span class="pvc">${ic("chev")}</span></summary><div class="pvb">${body}</div></details>`;
  return `<section class="view progress">
  <div class="psum">
    <div class="psh"><div class="lring"><svg viewBox="0 0 96 96" aria-hidden="true"><circle class="track" cx="48" cy="48" r="40"/><circle class="prog" cx="48" cy="48" r="40" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - L.p)).toFixed(1)}"/></svg><b>${L.n}</b></div>
      <div class="pst"><h2>${esc(L.rank)}</h2><p>${fmt(S.xp)} XP · encore ${fmt(L.need - L.cur)} pour le niveau ${L.n + 1}</p></div></div>
    <div class="pnums">
      <div><b>${ic("flame")}${st}</b><small>jour${st > 1 ? "s" : ""} d'affilée</small></div>
      <div><b>${recs.length}</b><small>espèce${recs.length > 1 ? "s" : ""}</small></div>
      <div><b>${ic("star")}${master}</b><small>maîtrisée${master > 1 ? "s" : ""}</small></div>
      <div><b>${tot.n ? Math.round(100 * tot.ok / tot.n) : 0}<i>%</i></b><small>réussite</small></div>
    </div>
    <div class="pgoal"><span class="lab">${ic("sun", "xs")}Aujourd'hui</span><span class="bar"><i style="width:${(gp * 100).toFixed(1)}%"></i></span><span class="v">${fmt(td.xp)} / ${fmt(goal)} XP</span></div>
    <div class="pact">${due ? `<button class="btn warm" data-act="review" aria-label="Réviser ${due} espèce${due > 1 ? "s" : ""}">${ic("replay")}Réviser<span class="pn">${due}</span></button>` : `<button class="btn ghost" data-act="daily">${ic("spark")}Série du jour</button>`}<button class="btn ghost" data-act="tab" data-tab="top">${ic("trophy")}Classement</button></div>
  </div>
  ${conf.length ? box("conf", "duel", "Tes confusions", `${conf.length} paire${conf.length > 1 ? "s" : ""} à départager`, `<div class="pconf">${conf.map(c => { const a = S.sp[c.a], b = S.sp[c.b]; return `<div class="conf"><img src="${esc(a.img || a.md)}" alt=""><span class="vs">VS</span><img src="${esc(b.img || b.md)}" alt=""><span class="tx">${esc(a.fr || a.sci)}<small>${esc(b.fr || b.sci)} · ${c.n}×</small></span><button class="btn primary" data-act="duelgo" data-ids="${c.a},${c.b}">Duel</button></div>`; }).join("")}</div>`, true) : ""}
  ${box("mem", "clock", "Mémoire à long terme", `1 semaine : ${rv(r7)} · 1 mois : ${rv(r30)}`, `<div class="grid2"><div class="stat"><small>${ic("cal")}Après 1 semaine</small><b>${rv(r7)}</b><div class="sub">${rsub(r7)}</div></div><div class="stat"><small>${ic("cal")}Après 1 mois</small><b>${rv(r30)}</b><div class="sub">${rsub(r30)}</div></div></div>
  <p class="muted note">Part des espèces encore reconnues quand elles reviennent une semaine (ou un mois) après une réussite. Maîtrisée = reconnue sur 3 photos différentes, dont 1 de terrain, sur 3 jours différents.</p>`)}
  ${box("time", "chart", "Sur la durée", `7 jours : ${fmt(w7.xp)} XP · ${pct(w7) ?? "–"} % bonnes${trend != null ? ` · <span style="color:${trend >= 0 ? "var(--good)" : "var(--bad)"}">${trend >= 0 ? "+" : ""}${trend} pts</span>` : ""}`, `<div class="grid2">
    <div class="stat"><small>${ic("cal")}7 derniers jours</small><b>${fmt(w7.xp)} XP</b><div class="sub">${w7.q} réponses · ${pct(w7) ?? "–"} % bonnes</div><div class="sub">${w7.active} jour${w7.active > 1 ? "s" : ""} joué${w7.active > 1 ? "s" : ""} sur 7</div></div>
    <div class="stat"><small>${ic("cal")}30 derniers jours</small><b>${fmt(w30.xp)} XP</b><div class="sub">${w30.q} réponses · ${pct(w30) ?? "–"} % bonnes</div><div class="sub">${w30.active} jour${w30.active > 1 ? "s" : ""} joué${w30.active > 1 ? "s" : ""} sur 30</div></div>
  </div>
  <div class="sec">${ic("cal")}12 dernières semaines</div><div class="card" style="padding:14px">${heatHtml()}</div>
  <div class="sec">${ic("chart")}14 derniers jours</div><div class="card" style="padding:14px">${chartHtml()}</div>`)}
  ${cats.length ? box("cats", "eye", "Par type de question", `Le plus fort : ${esc(catBest.l)} ${Math.round(catBest.p * 100)} %`, `<div class="hbars">${catP.map(x => `<div class="hbar"><span class="t">${ic(x.i)}${x.l}</span><span class="b"><i style="width:${(x.p * 100).toFixed(0)}%"></i></span><span class="v">${Math.round(x.p * 100)} %</span></div>`).join("")}</div>`) : ""}
  ${box("fam", "tree", "Familles", weak.length ? `${weak.length} à retravailler` : best.length ? `Point fort : ${esc(famName(best[0].f))}` : "Après quelques parties", `${best.length ? `<div class="sec">${ic("star")}Les mieux maîtrisées</div><div class="hbars">${best.map(x => famRow(x)).join("")}</div>` : ""}
  ${weak.length ? `<div class="sec">${ic("replay")}À retravailler</div><div class="hbars">${weak.map(x => famRow(x, true)).join("")}</div>` : ""}
  ${!fs.length ? `<p class="muted note">Elles apparaîtront après quelques parties (4 réponses par famille minimum).</p>` : ""}`)}
  ${hist.length ? box("hist", "clock", "Historique", `${hist.length} dernière${hist.length > 1 ? "s" : ""} partie${hist.length > 1 ? "s" : ""}`, `<div class="group">${hist.map((h, i) => `<div class="set"><span class="lab"><b>${esc(h.title || "Partie")}</b><small>${esc(ago(h.t))} · ${h.ok}/${h.n} bonnes · +${fmt(h.xp)} XP</small></span><button class="icon-btn" data-act="histplay" data-i="${i}" aria-label="Rejouer">${ic("replay")}</button></div>`).join("")}</div>`) : ""}
  ${box("bdg", "trophy", "Badges", `${nb} / ${BADGES.length} débloqués`, `<div class="badges">${BADGES.map(b => `<div class="bdg ${S.badges[b.id] ? "" : "off"}"><span class="md">${ic(b.ic)}</span><b>${esc(b.n)}</b><small>${esc(b.d)}</small></div>`).join("")}</div>`)}
</section>`;
};

/* ---------- Réglages ---------- */
const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(S.set[k]) === String(v) ? "on" : ""}" data-act="set" data-k="${k}" data-v="${v}">${l}</button>`).join("")}</div>`;
const sw = k => `<button class="switch ${S.set[k] ? "on" : ""}" data-act="toggle" data-k="${k}" role="switch" aria-checked="${S.set[k] ? "true" : "false"}" aria-label="${k}"></button>`;
VIEWS.settings = () => `<section class="view settings">
  <div class="head"><div><h1 style="font:700 24px/1.1 var(--f-display);margin:0">Réglages</h1></div></div>
  <div class="sec">${ic("pin")}Ma zone<span class="more">${esc(zoneLabel(S.set.zone))}</span></div>
  <div class="row">${zoneChips(S.set.zone, "szone")}</div>
  <div class="sec">${ic("eye")}Questions</div>
  <div class="group">
    <div class="set"><span class="lab"><b>Noms affichés</b><small>Le latin en petit aide à le retenir sans effort.</small></span></div>
    <div class="set" style="border-top:0;padding-top:0">${seg("names", [["both", "FR + latin"], ["fr", "Français"], ["la", "Latin"]])}</div>
    <div class="set"><span class="lab"><b>Objectif quotidien</b><small>XP à gagner chaque jour pour remplir l'anneau de l'accueil.</small></span></div>
    <div class="set" style="border-top:0;padding-top:0">${seg("goal", [["50", "50 XP"], ["100", "100"], ["150", "150"], ["250", "250"]])}</div>
    <div class="set"><span class="lab"><b>Réponse par défaut</b><small>Saisie : tu tapes le nom, avec suggestions.</small></span></div>
    <div class="set" style="border-top:0;padding-top:0">${seg("fmt", [["qcm", "Choix multiple"], ["type", "Saisie"]])}</div>
    <div class="set"><span class="lab"><b>Choix par question</b><small>De 2 (facile) à 6.</small></span><div class="stepper"><button data-act="setk" data-d="-1" aria-label="Moins">${ic("minus")}</button><output>${S.set.k}</output><button data-act="setk" data-d="1" aria-label="Plus">${ic("plus")}</button></div></div>
    <div class="set"><span class="lab"><b>Leurres</b><small>Expert : les espèces que les gens confondent vraiment sur iNaturalist.</small></span></div>
    <div class="set" style="border-top:0;padding-top:0">${seg("diff", [["facile", "Facile"], ["moyen", "Moyen"], ["expert", "Expert"]])}</div>
    <div class="set"><span class="lab"><b>Photos</b><small>Référence : belles photos choisies. Terrain : vraies observations, plus dur.</small></span></div>
    <div class="set" style="border-top:0;padding-top:0">${seg("photo", [["ref", "Référence"], ["mix", "Mélange"], ["field", "Terrain"]])}</div>
  </div>
  <div class="sec">${ic("vol")}Confort</div>
  <div class="group">
    <div class="set"><span class="lab"><b>Sonogramme</b><small>Voir le chant pendant l'écoute (si le son le permet).</small></span>${sw("sono")}</div>
    <div class="set"><span class="lab"><b>Effets sonores</b><small>Petits sons de réussite et d'erreur.</small></span>${sw("sfx")}</div>
    <div class="set"><span class="lab"><b>Animations réduites</b><small>Pour un affichage plus calme.</small></span>${sw("calm")}</div>
  </div>
  <div class="sec">${ic("map")}Cartes</div>
  <div class="group">
    <div class="set"><span class="lab"><b>Fond de carte</b><small>Relief : montagnes et fonds marins, puis vue satellite quand tu zoomes. Aussi changeable depuis la carte Géo.</small></span></div>
    <div class="set" style="border-top:0;padding-top:0;display:block">${mapStylesHtml()}</div>
    <div class="set"><span class="lab"><b>Noms des lieux</b><small>Pays, villes et repères par-dessus le relief et le satellite.</small></span>${sw("mapLab")}</div>
    <div class="set"><span class="lab"><b>Îles en évidence</b><small>Un anneau sur les petites îles, touche-le pour y poser ton pin.</small></span>${sw("mapIsl")}</div>
  </div>
  <div class="sec">${ic("bell")}Rappel quotidien</div>
  <div class="group">
    <div class="set">${ic("clock")}<span class="lab"><b>Heure</b><small>Ajoute un rappel qui revient chaque jour dans ton calendrier.</small></span><input type="time" id="remind" value="${esc(S.set.remind)}" data-set="remind" aria-label="Heure du rappel"></div>
    <div class="set"><button class="btn primary" data-act="ics" style="width:100%">${ic("cal")}Ajouter au calendrier</button></div>
  </div>
  <div class="sec">${ic("eye")}Comptes</div>
  <div class="group">
    <div class="set"><span class="lab"><b>Pseudo iNaturalist</b><small>Pour jouer avec tes propres observations.</small></span><input type="text" id="inat" value="${esc(S.set.inat)}" data-set="inat" placeholder="pseudo" autocapitalize="off" spellcheck="false" aria-label="Pseudo iNaturalist"></div>
    <div class="set"><span class="lab"><b>Clé xeno-canto</b><small>Optionnelle : ajoute les chants xeno-canto aux fiches. <a href="https://xeno-canto.org/account" target="_blank" rel="noopener">Obtenir une clé</a></small></span><input type="password" id="xckey" value="${esc(S.set.xc)}" data-set="xc" placeholder="clé" autocomplete="off" aria-label="Clé xeno-canto"></div>
  </div>
  ${S.favs.length ? `<div class="sec">${ic("star")}Mes quiz</div><div class="group">${S.favs.map((f, i) => `<div class="set"><span class="lab"><b>${esc(f.title)}</b></span><button class="icon-btn" data-act="favdel" data-i="${i}" aria-label="Supprimer">${ic("trash")}</button></div>`).join("")}</div>` : ""}
  <div class="sec">${ic("down")}Mes données</div>
  <p class="muted" style="font-size:13px;line-height:1.5;margin:-4px 2px 10px">Ta progression, ton carnet et tes astuces restent sur ce téléphone, dans l'appli : pas de compte, rien n'est envoyé ailleurs. L'appli interroge seulement iNaturalist, Wikipédia et xeno-canto pour les photos, les sons et les textes. Exporte de temps en temps pour ne rien perdre.</p>
  <div class="group">
    <div class="set"><span class="lab"><b>Carnet en tableau</b><small>Toutes tes espèces avec dates et réussite (CSV pour Excel).</small></span><button class="btn ghost" data-act="csv">${ic("down")}CSV</button></div>
    <div class="set"><span class="lab"><b>Envoyer ma sauvegarde</b><small><span id="bklast">${S.bk?.last ? "Dernière : " + esc(ago(S.bk.last)) + "." : "Jamais faite."}</span> Vers Fichiers, iCloud ou un mail (ta clé xeno-canto n'y est pas).</small></span><button class="btn ghost" data-act="backup">${ic("down")}Sauvegarder</button></div>
    ${cloudSettingsHtml()}
    <div class="set"><span class="lab"><b>Importer</b><small>Restaure une sauvegarde sur ce téléphone.</small></span><label class="btn ghost" style="cursor:pointer">${ic("up")}Importer<input type="file" id="importf" accept="application/json,.json" hidden></label></div>
    <div class="set"><span class="lab"><b>Tout effacer</b><small>Remet l'appli à zéro sur cet appareil.</small></span><button class="btn ghost" data-act="reset" id="resetBtn">${ic("trash")}Effacer</button></div>
  </div>
  ${packSettingsHtml()}
  <div class="group" style="margin-top:18px"><button class="set link" data-act="tour">${ic("info")}<span class="lab"><b>Revoir la présentation</b><small>Le tour de l'appli en 6 écrans.</small></span>${ic("arrow")}</button><button class="set link" data-act="news">${ic("spark")}<span class="lab"><b>Nouveautés · v${esc(APP_VERSION)}</b><small>Toutes les versions et ce qu'elles ont apporté.</small></span>${ic("arrow")}</button></div>
  <div class="group" style="margin-top:18px"><button class="set link" data-act="tab" data-tab="about">${ic("shield")}<span class="lab"><b>Confidentialité et sources</b><small>Ce qui reste sur ton téléphone, ce qui en sort, et d'où viennent les données.</small></span>${ic("arrow", "s")}</button></div>
  <p class="foot vfoot"><b>Plumage v${esc(APP_VERSION)}</b> · ${esc(vDate(NEWS[0].v))} · <button class="lnk" data-act="news">toutes les versions</button></p>
  <p class="foot">Photos, sons et données : iNaturalist, Wikipédia, Wikimedia Commons et xeno-canto, avec l'auteur et la licence de chaque média. Ta progression reste sur cet appareil.</p>
</section>`;

/* ---------- Calques ---------- */
function openLayer(html, cls = "") {
  const L = $("#layer");
  L.innerHTML = html;
  L.className = "layer " + cls;
  L.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeLayer() {
  const L = $("#layer");
  if (!L || L.hidden) return;
  if (L.classList.contains("tourl") || L.classList.contains("newsl")) { S.hint = { ...(S.hint || {}), tour: S.hint?.tour || Date.now(), news: NEWS[0].v }; save(); }
  L.hidden = true;
  L.innerHTML = "";
  document.body.style.overflow = "";
  if (FICHE.playing) { sndStop(); FICHE.playing = false; }
  if (PMAP) { try { PMAP.remove(); } catch (e) { /* rien */ } PMAP = null; }
}
let PLACECB = null, PLACET = 0;
function openPlacePicker(cb) {
  PLACECB = cb;
  openLayer(`<div class="panel"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button><div class="in" style="padding-top:22px">
    <h2>Choisir un lieu</h2><p class="muted" style="margin:6px 0 14px;font-size:14px">Pays, région, département, commune, parc… tout lieu connu d'iNaturalist.</p>
    <div class="search">${ic("search")}<input id="psearch" type="search" placeholder="Ex. Finistère, Camargue, Maroc…" autocomplete="off" aria-label="Lieu"></div>
    <div class="plist" id="plist"></div></div></div>`);
  setTimeout(() => $("#psearch")?.focus(), 80);
}
async function runPlaceSearch(qv) {
  const box = $("#plist");
  if (!box) return;
  if (qv.trim().length < 2) { box.innerHTML = ""; return; }
  box.innerHTML = `<div class="spin" style="margin:16px auto"></div>`;
  try {
    const r = await placeSearch(qv.trim());
    if ($("#psearch")?.value !== qv) return;
    box.innerHTML = r.length ? r.map(p => `<button class="pitem" data-act="placepick" data-id="${p.id}" data-name="${esc(p.name)}">${ic("pin", "s")}<span>${esc(p.full)}</span><small>${esc(LVL[String(p.lvl)] || "Lieu")}</small></button>`).join("") : `<p class="muted">Aucun lieu trouvé.</p>`;
  } catch (e) { box.innerHTML = `<p class="muted">Recherche impossible (réseau ?).</p>`; }
}
function openFamPicker() {
  loadTaxo().then(() => renderFamPicker("")).catch(() => toast("Liste des familles indisponible (réseau ?)."));
}
function renderFamPicker(qv) {
  const B = getB(), n = norm(qv);
  const fams = [...TAXO.fam.values()].filter(f => !n || norm(f.fr + " " + f.vern + " " + f.sci).includes(n)).sort((a, b) => a.fr.localeCompare(b.fr));
  const html = `<div class="panel"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button><div class="in" style="padding-top:22px">
    <h2>Familles</h2><p class="muted" style="margin:6px 0 14px;font-size:14px">Coche une ou plusieurs familles.</p>
    <div class="search">${ic("search")}<input id="fsearch" type="search" placeholder="Ex. Laridés, mésanges…" value="${esc(qv)}" autocomplete="off"></div>
    <div class="plist" id="flist">${fams.slice(0, 120).map(f => `<button class="pitem ${B.fams.includes(f.id) ? "on" : ""}" data-act="famtoggle" data-id="${f.id}"><b style="font-weight:650">${esc(f.fr)}</b><span class="muted" style="font-size:13px">${esc(f.vern)}</span><small>${esc(ordName(f.o))}</small></button>`).join("")}</div>
    <button class="btn primary wide" data-act="famdone" style="margin-top:14px;position:sticky;bottom:12px">${ic("check")}Valider</button></div></div>`;
  if ($("#flist") && $("#layer").hidden === false) { $("#flist").outerHTML = `<div class="plist" id="flist">${fams.slice(0, 120).map(f => `<button class="pitem ${B.fams.includes(f.id) ? "on" : ""}" data-act="famtoggle" data-id="${f.id}"><b style="font-weight:650">${esc(f.fr)}</b><span class="muted" style="font-size:13px">${esc(f.vern)}</span><small>${esc(ordName(f.o))}</small></button>`).join("")}</div>`; }
  else openLayer(html);
}
function openDuelPicker() {
  const conf = topConfusions(6);
  openLayer(`<div class="panel"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button><div class="in" style="padding-top:22px">
    <h2>Duels</h2>
    <button class="livecta" data-act="live"><span class="ic">${ic("bolt")}</span><span class="tx"><b>Duel en direct, à deux</b><small>1 contre 1, chacun son téléphone, chrono à chaque question</small></span>${ic("arrow")}</button>
    <button class="livecta defic" data-act="defi"><span class="ic">${ic("duel")}</span><span class="tx"><b>Défi à distance</b><small>Tu joues 10 photos, tu envoies le lien : ton ami tente de battre ton score, quand il veut</small></span>${ic("arrow")}</button>
    <div class="sec">${ic("duel")}Les sosies</div><p class="muted" style="margin:-4px 0 4px;font-size:14px">Deux sosies, 8 questions pour les départager.</p>
    ${conf.length ? `<div class="sec">${ic("replay")}Tes confusions</div><div style="display:flex;flex-direction:column;gap:8px">${conf.map(c => { const a = S.sp[c.a], b = S.sp[c.b]; return `<button class="conf" data-act="duelgo" data-ids="${c.a},${c.b}" style="text-align:left"><img src="${esc(a.img || a.md)}" alt=""><span class="vs">VS</span><img src="${esc(b.img || b.md)}" alt=""><span class="tx">${esc(a.fr || a.sci)}<small>${esc(b.fr || b.sci)} · ${c.n}×</small></span>${ic("arrow")}</button>`; }).join("")}</div>` : ""}
    <div class="sec">${ic("duel")}Grands classiques</div>
    <div class="plist">${DUELS.map((d, i) => `<button class="pitem" data-act="duelgo" data-i="${i}"><span style="flex:1"><b style="font-weight:650">${esc(d[2])}</b> <span class="muted">vs</span> <b style="font-weight:650">${esc(d[3])}</b></span>${ic("arrow", "s")}</button>`).join("")}</div></div></div>`);
}

/* ---------- Fiche espèce ---------- */
const FICHE = { t: null, playing: false };
function taxonById(id) {
  id = +id;
  const fromSes = SES?.pool?.byId?.get(id) || (SES?.q?.t?.id === id ? SES.q.t : null) || (SES?.missed || []).find(t => t.id === id) || (SES?.q?.choices || []).map(c => c.t).find(t => t && t.id === id);
  return fromSes || (OTD && OTD.id === id ? OTD : null) || (FICHE.sim || []).find(t => t.id === id) || LEARNSIM.find(t => t.id === id) || (TRIP.list || []).find(t => t.id === id) || fromRec(id) || geoTaxon(id);
}
function openFiche(t) {
  if (!t) return;
  FICHE.t = t;
  if (S.sp[t.id]) { S.sp[t.id].views = (S.sp[t.id].views || 0) + 1; save(); }
  const r = S.sp[t.id], f = fam(t) || r?.f || 0, o = ord(t) || r?.o || 0, dec = decodeLatin(t.sci), note = dec.find(x => x.note);
  const s = r ? stars(r) : 0;
  openLayer(`<div class="panel" role="dialog" aria-label="Fiche ${esc(nameFr(t))}">
  <button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="gallery" id="gal"><figure data-act="zoom" data-grp="fg" data-src="${esc(imgOf(t))}" data-cap="${esc(nameFr(t))}" data-sci="${esc(t.fr ? t.sci : "")}" data-attr="${esc(t.img?.attr || "")}"><img src="${esc(imgOf(t))}" alt="" data-fit draggable="false"><span class="zb">${ic("zoom")}</span><figcaption>${esc(t.img?.attr || "")}</figcaption></figure></div><div class="gdots" id="gdots"></div>
  <div class="in">
    <div class="ftitle"><h2>${esc(nameFr(t))}</h2>${t.fr ? `<span class="latin">${esc(t.sci)}</span>` : ""}
      <div class="chips">${f ? `<span class="chip fam">${ic("tree")}${esc(famName(f))}${famVern(f) ? " · " + esc(famVern(f)) : ""}</span>` : ""}${o ? `<span class="chip ord">${esc(ordName(o))}</span>` : ""}${r?.n ? starsHtml(s) : ""}</div></div>
    ${dec.length ? `<div class="decode">${dec.map(d => `<span class="dchip"><span class="latin">${esc(d.w)}</span>${esc(d.m)}</span>`).join("")}</div>${note ? `<div class="dnote">${esc(note.note)}</div>` : ""}` : ""}
    <div class="fsec"><h3>${ic("edit")}Mon astuce</h3><textarea class="mynote" id="mynote" data-id="${t.id}" placeholder="Un moyen mnémotechnique, un détail qui t'aide à la reconnaître…">${esc(r?.note || "")}</textarea></div>
    ${r?.n ? `<div class="fsec"><h3>${ic("chart")}Mon historique</h3><div class="stats4"><div><b>${r.n}</b><small>fois vue</small></div><div><b>${Math.round(100 * r.ok / r.n)} %</b><small>réussite</small></div><div><b>${s}/3</b><small>étoiles</small></div></div>${mastHtml(r)}
      <div class="hist">${r.first ? `<span>${ic("spark", "xs")}Rencontrée le ${esc(dateLong(r.first))}</span>` : ""}${r.lastOk ? `<span>${ic("check", "xs")}Dernière réussite : ${esc(dateLong(r.lastOk))}</span>` : ""}${FIELD.ids.has(t.id) ? `<span class="fieldok">${ic("eye", "xs")}Vue sur le terrain (iNaturalist)</span>` : ""}${r.seen ? `<span class="fieldok">${ic("binoc", "xs")}Observée le ${esc(dateLong(r.seen[0]))}${r.seen[1] ? " · " + esc(r.seen[1]) : ""}</span>` : ""}</div>
      ${Object.keys(r.conf || {}).length ? `<div class="hist">${Object.entries(r.conf).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => `<button class="chip" data-act="fiche" data-id="${id}">${ic("duel", "xs")}Confondue avec ${esc(S.sp[id]?.fr || S.sp[id]?.sci || "?")} · ${n}×</button>`).join("")}</div>` : ""}</div>` : ""}
    <div class="fsec"><h3>${ic("cal")}Présence par mois<span class="seg"><button class="on" data-act="phz" data-z="fr">France</button><button data-act="phz" data-z="zone">Ma zone</button></span></h3><div class="pheno" id="pheno"></div></div>
    <div class="fsec"><h3>${ic("map")}Observations<span class="seg"><button class="on" data-act="mapz" data-v="fr">France</button><button data-act="mapz" data-v="eu">Europe</button><button data-act="mapz" data-v="w">Monde</button></span></h3><div id="fmap"></div><div class="mapcap" id="mapcap"></div></div>
    <div class="fsec"><h3>${ic("wave")}Chants & cris</h3><div class="sbar" id="fsbar"></div><div class="slist" id="fsnd"><div class="spin" style="margin:6px auto"></div></div></div>
    <div class="fsec" id="fwiki" hidden><h3>${ic("book")}<span id="fwikiH">Description</span></h3><p id="fwikiTx"></p></div>
    ${duelPartners(t.sci).length ? `<div class="fsec"><h3>${ic("duel")}Ne pas confondre</h3>${duelPartners(t.sci).map(p => sosiesHtml(t, p, "fiche") || tipHtml(t, p, "Avec " + p.fr)).join("")}</div>` : ""}
    ${!r?.n && r?.seen ? `<div class="fsec"><h3>${ic("binoc")}Sur le terrain</h3><div class="hist"><span class="fieldok">${ic("binoc", "xs")}Observée le ${esc(dateLong(r.seen[0]))}${r.seen[1] ? " · " + esc(r.seen[1]) : ""}</span></div></div>` : ""}
    <div class="fsec"><h3>${ic("duel")}Ressemble à</h3><div class="simil" id="fsim"><div class="spin" style="margin:6px auto"></div></div></div>
    <div class="fsec"><h3>${ic("ext")}En savoir plus</h3><div class="links">
      <a href="https://www.inaturalist.org/taxa/${t.id}" target="_blank" rel="noopener">iNaturalist${ic("ext")}</a>
      <a href="https://fr.wikipedia.org/wiki/${encodeURIComponent(t.sci.replace(/ /g, "_"))}" target="_blank" rel="noopener">Wikipédia${ic("ext")}</a>
      <a href="https://xeno-canto.org/species/${encodeURIComponent(t.sci.replace(/ /g, "-"))}" target="_blank" rel="noopener">xeno-canto${ic("ext")}</a>
      <a href="https://www.faune-france.org/" target="_blank" rel="noopener">Faune France${ic("ext")}</a></div></div>
  </div></div>`);
  ficheFill(t);
}
async function ficheFill(t) {
  const alive = () => FICHE.t === t && !$("#layer").hidden;
  if (S.set.inat && FIELD.who !== S.set.inat) loadField().then(() => { if (alive() && FIELD.ids.has(t.id) && !$(".fieldok")) { const h = $(".hist"); if (h) h.insertAdjacentHTML("beforeend", `<span class="fieldok">${ic("eye", "xs")}Vue sur le terrain (iNaturalist)</span>`); } }).catch(() => {});
  renderPheno(t, { id: 6753 });
  renderMap(t, "fr");
  photosFor([t.id]).then(([ph]) => {
    if (!alive() || !ph.length) return;
    const g = $("#gal");
    g.innerHTML = ph.slice(0, 10).map((p, i) => `<figure data-act="zoom" data-grp="fg" data-src="${esc(p.lg || p.md)}" data-hd="${esc(hdOf(p.lg || p.md))}" data-cap="${esc(nameFr(t))}" data-sci="${esc(t.fr ? t.sci : "")}" data-attr="${esc(p.attr)}"><img src="${esc(p.lg || p.md)}" alt="" ${i ? 'loading="lazy" ' : ""}data-fit draggable="false"><span class="zb">${ic("zoom")}</span><figcaption>${esc(p.attr)}</figcaption></figure>`).join("");
    fitImgs(g);
    const dots = $("#gdots");
    dots.innerHTML = ph.slice(0, 10).map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("");
    g.onscroll = () => { const i = Math.round(g.scrollLeft / g.clientWidth); $$("i", dots).forEach((d, j) => d.classList.toggle("on", i === j)); };
  }).catch(() => {});
  Promise.all([commonsSounds(t).catch(() => []), xcList(t).catch(() => null), soundsList(t).catch(() => [])]).then(([c, x, a]) => {
    if (!alive()) return;
    FICHE.snds = [...(x || []), ...c.slice(0, 6), ...a.map(s => ({ ...s, src: "iNaturalist" }))];
    FICHE.kf = "all";
    renderFicheSnds();
  });
  Promise.all([wikiDesc(t).catch(() => null), wiki(t).catch(() => null)]).then(([d, w]) => {
    if (!alive() || (!d && !w)) return;
    $("#fwiki").hidden = false;
    $("#fwikiH").textContent = d ? "Pour la reconnaître" : "Description";
    const src = d || w;
    $("#fwikiTx").innerHTML = `${esc(clip(src.text, d ? 900 : 520))} ${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener">Lire sur Wikipédia</a>` : ""}`;
  });
  similar(t, null).then(list => {
    if (!alive()) return;
    FICHE.sim = list.slice(0, 10);
    $("#fsim").innerHTML = FICHE.sim.length ? FICHE.sim.map(s => `<button data-act="fiche" data-id="${s.id}"><img src="${esc(s.img?.md || "")}" alt="" loading="lazy"><b>${esc(nameFr(s))}</b></button>`).join("") : `<p class="muted" style="font-size:14px">Aucune confusion connue.</p>`;
  }).catch(() => { if (alive()) $("#fsim").innerHTML = `<p class="muted" style="font-size:14px">Indisponible hors ligne.</p>`; });
}
const KINDF = [["all", "Tous"], ["chant", "Chants"], ["cri", "Cris"], ["alarme", "Alarmes"]];
const kindMatch = (s, k) => k === "all" || (k === "cri" ? /(^|, )cri/.test(s.kind || "") : (s.kind || "").includes(k));
function renderFicheSnds() {
  const list = FICHE.snds || [], box = $("#fsnd"), bar = $("#fsbar");
  if (!box) return;
  const typed = list.filter(s => s.kind).length;
  if (bar) bar.innerHTML = list.length ? `${typed ? `<div class="row kinds">${KINDF.map(([k, l]) => { const n = list.filter(s => kindMatch(s, k)).length; return n ? `<button class="opt-btn mini ${FICHE.kf === k ? "on" : ""}" data-act="fkind" data-k="${k}">${l} · ${n}</button>` : ""; }).join("")}</div>` : ""}<div class="sopts">${sndOpts()}</div>` : "";
  const rows = list.map((s, i) => ({ s, i })).filter(x => kindMatch(x.s, FICHE.kf || "all"));
  box.innerHTML = rows.length ? rows.map(({ s, i }) => `<div class="srow" data-i="${i}"><button class="pl" data-act="fplay" data-i="${i}" aria-label="Écouter">${ic("play")}</button><div class="sbody"><div class="msono" data-act="rseek" data-sl="f" data-i="${i}"><span class="nosono">${ic("wave")}</span></div><span class="tx"><b>${esc(s.kind ? cap(s.kind) : "Enregistrement")}${s.len ? " · " + esc(s.len) : ""}<em class="src">${esc(s.src || "")}</em></b>${esc([s.place, s.attr].filter(Boolean).join(" · "))}</span></div>${s.page || s.uri ? `<a href="${esc(s.page || s.uri)}" target="_blank" rel="noopener" class="icon-btn" aria-label="Source">${ic("ext")}</a>` : ""}</div>`).join("")
    : `<p class="muted" style="font-size:14px">Pas d'enregistrement trouvé.${S.set.xc ? "" : " Ajoute une clé xeno-canto dans Réglages pour en avoir plus."}</p>`;
  sonoRows(box, list);
}
function mastHtml(r) {
  const m = mastery(r);
  const it = (ok, icn, label) => `<span class="mi ${ok ? "ok" : ""}">${ic(ok ? "check" : icn, "xs")}${label}</span>`;
  return `<div class="mast">${it(m.photos >= 3, "frame", `${Math.min(m.photos, 3)}/3 photos`)}${it(m.field >= 1, "eye", `${Math.min(m.field, 1)}/1 terrain`)}${it(m.days >= 3, "cal", `${Math.min(m.days, 3)}/3 jours`)}${it(m.sounds >= 1, "wave", "chant (bonus)")}</div>
  <p class="mtodo ${m.lvl === 3 ? "ok" : ""}">${m.lvl === 3 ? "Maîtrisée : reconnue dans des situations variées." : esc(masteryTodo(m))}</p>`;
}
function renderPheno(t, zone) {
  const box = $("#pheno");
  if (!box) return;
  const cur = new Date().getMonth();
  box.innerHTML = MONTHS.map((m, i) => `<div class="${i === cur ? "now" : ""}"><i style="height:3px"></i><span>${m}</span></div>`).join("");
  pheno(t, zone).then(v => {
    if (FICHE.t !== t || !$("#pheno")) return;
    const max = Math.max(1, ...v);
    $("#pheno").innerHTML = v.map((x, i) => `<div class="${i === cur ? "now" : ""}" title="${MONTHS_LONG[i]} : ${x} obs."><i style="height:${Math.max(3, (x / max) * 70).toFixed(0)}px"></i><span>${MONTHS[i]}</span></div>`).join("");
  }).catch(() => { if ($("#pheno")) $("#pheno").insertAdjacentHTML("beforeend", ""); });
}
function renderMap(t, view) {
  const V = { fr: { z: 5, xs: [15, 16], ys: [10, 11] }, eu: { z: 3, xs: [3, 4, 5], ys: [1, 2, 3] }, w: { z: 1, xs: [0, 1], ys: [0, 1] } }[view];
  const st = MAPST[curStyle()], ly = layerAt(st, V.z), lab = st.lab && S.set.mapLab;
  let cells = "";
  V.ys.forEach((y, ry) => V.xs.forEach((x, rx) => {
    const area = `${ry + 1}/${rx + 1}`;
    cells += `<img class="base${st.inv ? " inv" : ""}" src="${esc(tileUrl(ly.u, V.z, x, y))}" data-alt="${esc(tileUrl(MAPST.nuit.layers[0].u, V.z, x, y))}" alt="" style="grid-area:${area}" loading="lazy" onerror="if(this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt='';this.classList.add('inv')}">`;
    if (lab) cells += `<img class="lab" src="${esc(tileUrl(MAPLAB.u, V.z, x, y))}" alt="" style="grid-area:${area}" loading="lazy" onerror="this.remove()">`;
    cells += `<img class="ov" src="https://api.inaturalist.org/v1/grid/${V.z}/${x}/${y}.png?taxon_id=${t.id}&color=%231FD1F2&quality_grade=research" alt="" style="grid-area:${area}" loading="lazy" onerror="this.remove()">`;
  }));
  const box = $("#fmap");
  if (box) box.innerHTML = `<div class="tilemap${st.light ? " light" : ""}" style="grid-template-columns:repeat(${V.xs.length},1fr)">${cells}</div>`;
  const cap = $("#mapcap");
  if (cap) cap.textContent = `Fond : ${st.cap} — points : observations iNaturalist`;
}

/* ---------- Son ---------- */
/* Une seule lecture audio (élément <audio>, fiable sur iPhone). Les spectrogrammes sont calculés sur place quand le
   fichier l'autorise (Wikimedia Commons, xeno-canto…) ; sinon on montre le sonogramme fourni par xeno-canto. */
const SND = { el: null, playing: false, raf: 0, url: "", main: null, row: null, view: null, rowView: null, unlocked: false };
function makeSilent() {
  const sr = 8000, n = 400, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
  try { return URL.createObjectURL(new Blob([b], { type: "audio/wav" })); } catch (e) { return ""; }
}
function audioEl() {
  if (!SND.el) {
    const el = SND.el = new Audio();
    el.preload = "auto";
    el.setAttribute("playsinline", "");
    el.addEventListener("ended", () => { SND.playing = false; setSndUI(); rowUI(); });
    el.addEventListener("pause", () => { SND.playing = false; setSndUI(); rowUI(); });
    el.addEventListener("playing", () => { SND.playing = true; setSndUI(); rowUI(); loop(); });
    el.addEventListener("loadedmetadata", () => updSnd());
    el.addEventListener("error", () => {
      if (!SND.url || (SILENT && el.src === SILENT)) return;
      if (!SND.row && SES?.q?.snd?.url === SND.url) mediaFail(SES.q, "Son indisponible");
      else if (SND.row) toast("Ce son ne se lance pas.");
    });
  }
  return SND.el;
}
function applyRate() {
  const el = audioEl(), r = S.set.slow ? .5 : 1;
  try { el.defaultPlaybackRate = r; el.playbackRate = r; } catch (e) { /* rien */ }
  try { el.preservesPitch = false; el.mozPreservesPitch = false; el.webkitPreservesPitch = false; } catch (e) { /* rien */ }
  el.loop = !!S.set.loop;
}
function unlockAudio() {
  ac();
  const el = audioEl();
  if (SND.unlocked || !SILENT) return;
  try {
    el.src = SILENT;
    const p = el.play();
    if (p && p.then) p.then(() => { if (el.src === SILENT) el.pause(); SND.unlocked = true; }).catch(() => {});
  } catch (e) { /* rien */ }
}
function srcIs(el, url) { return !!url && (el.src === url || el.src.indexOf(url) !== -1); }
function sndLoad(snd, box) {
  sndStop();
  SND.main = snd; SND.url = snd.url; SND.row = null; SND.view = null;
  const el = audioEl();
  el.src = snd.url;
  applyRate();
  try { el.load(); } catch (e) { /* rien */ }
  setSndUI();
  if (box) {
    if (!S.set.sono) sonoNone(box, true);
    else sonoInto(box, snd, { big: true }).then(v => { if (SND.main === snd) { SND.view = v; updSnd(); } });
  }
  return Promise.resolve("el");
}
function sndPlay(auto) {
  const el = audioEl(), url = SND.main?.url;
  if (!url) return;
  if (SND.row || !srcIs(el, url)) { SND.row = null; SND.url = url; el.src = url; applyRate(); rowUI(); }
  else if (!el.paused && !el.ended) { el.pause(); return; }
  applyRate();
  const p = el.play();
  if (p && p.catch) p.catch(() => { SND.playing = false; setSndUI(true); if (!auto) toast("Son bloqué : touche encore ▶."); });
}
function sndPause() { if (SND.el) SND.el.pause(); setSndUI(); }
function sndStop() {
  cancelAnimationFrame(SND.raf);
  if (SND.el) { try { SND.el.pause(); } catch (e) { /* rien */ } }
  SND.playing = false;
  rowUI();
}
function seekTo(f, row, snd) {
  const el = audioEl();
  const go = () => {
    const d = isFinite(el.duration) ? el.duration : 0, view = row ? SND.rowView : SND.view, span = view?.dur || d;
    if (span) { try { el.currentTime = Math.min(f * span, Math.max(0, d - .05)); } catch (e) { /* rien */ } }
    if (el.paused) { const p = el.play(); if (p && p.catch) p.catch(() => {}); }
    updSnd();
  };
  if (row) { if (SND.row !== row || !srcIs(el, snd.url)) playRow(snd, row); }
  else if (SND.row || !srcIs(el, SND.main?.url)) { SND.row = null; SND.url = SND.main?.url || ""; el.src = SND.url; applyRate(); rowUI(); }
  if (el.readyState >= 1) go(); else el.addEventListener("loadedmetadata", go, { once: true });
}
function loop() {
  cancelAnimationFrame(SND.raf);
  const step = () => { updSnd(); if (SND.playing) SND.raf = requestAnimationFrame(step); };
  SND.raf = requestAnimationFrame(step);
}
function headAt(box, view, p, d) {
  if (!box) return;
  const head = box.querySelector(".head");
  if (!head) return;
  const span = view?.dur || d, f = span ? p / span : 0;
  head.style.left = (clamp(f, 0, 1) * 100).toFixed(2) + "%";
  box.classList.toggle("on", (SND.playing || p > 0) && f <= 1.001);
}
function updSnd() {
  const el = SND.el, p = el ? el.currentTime || 0 : 0, d = el && isFinite(el.duration) ? el.duration : 0;
  if (!SND.row) {
    const mine = !!SND.main && !!el && srcIs(el, SND.main.url), f = d && mine ? clamp(p / d, 0, 1) : 0;
    const sc = $("#scrub"); if (sc) sc.style.width = (f * 100).toFixed(2) + "%";
    const st = $("#stime"); if (st) st.textContent = fmtT(mine ? p : 0);
    headAt($("#sonoWrap"), SND.view, mine ? p : 0, d);
  } else headAt(SND.row.querySelector(".msono"), SND.rowView, p, d);
}
function setSndUI(idle) {
  const playingMain = SND.playing && !SND.row;
  const b = $("#playBtn");
  if (b) { b.innerHTML = ic(playingMain ? "pause" : "play"); b.classList.toggle("idle", !!idle && !playingMain); }
  const s = $("#sound"); if (s) s.classList.toggle("playing", playingMain);
  updSnd();
}
function rowUI() {
  $$(".achoice.playing, .srow.playing").forEach(x => { if (x !== SND.row || !SND.playing) { x.classList.remove("playing"); const pl = x.querySelector(".pl"); if (pl) pl.innerHTML = ic("play"); const m = x.querySelector(".msono"); if (m) m.classList.remove("on"); } });
  if (SND.row && SND.playing) { SND.row.classList.add("playing"); const pl = SND.row.querySelector(".pl"); if (pl) pl.innerHTML = ic("pause"); }
}
function playRow(snd, row) {
  if (!snd || !row) return;
  const el = audioEl();
  if (SND.row === row && srcIs(el, snd.url)) {
    if (!el.paused && !el.ended) { el.pause(); return; }
    applyRate();
    const p = el.play(); if (p && p.catch) p.catch(() => toast("Lecture impossible pour ce son."));
    return;
  }
  sndStop();
  SND.url = snd.url; SND.row = row; SND.rowView = row.__view || null;
  el.src = snd.url;
  applyRate();
  const p = el.play();
  if (p && p.catch) p.catch(() => toast("Lecture impossible pour ce son."));
  rowUI();
  const box = row.querySelector(".msono");
  if (box && !row.__view && !box.classList.contains("has") && S.set.sono) sonoInto(box, snd, { keep: true }).then(v => { row.__view = v; if (SND.row === row) SND.rowView = v; });
}
const sndOpts = () => `<button class="chip tgl ${S.set.slow ? "on" : ""}" data-act="sslow" aria-pressed="${S.set.slow ? "true" : "false"}" title="Ralenti : une octave plus grave, pour entendre les détails">${ic("slow")}Ralenti ×0,5</button><button class="chip tgl ${S.set.loop ? "on" : ""}" data-act="sloop" aria-pressed="${S.set.loop ? "true" : "false"}">${ic("replay")}En boucle</button>`;

/* ---------- Spectrogrammes ---------- */
const PAL = (() => {
  const stops = [[0, [7, 12, 24]], [.3, [27, 44, 107]], [.52, [61, 123, 255]], [.72, [31, 209, 242]], [.9, [255, 203, 92]], [1, [255, 255, 255]]];
  const out = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    let j = 0;
    while (j < stops.length - 2 && v > stops[j + 1][0]) j++;
    const [a, ca] = stops[j], [b, cb] = stops[j + 1], f = (v - a) / (b - a);
    for (let c = 0; c < 3; c++) out[i * 3 + c] = ca[c] + (cb[c] - ca[c]) * f;
  }
  return out;
})();
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < h; k++) {
        const a = i + k, b = a + h;
        const br = re[b] * cr - im[b] * ci, bi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - br; im[b] = im[a] - bi; re[a] += br; im[a] += bi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const NOCORS = new Set(), SONO = new Map();
function sonoCalc(url) {
  if (!url) return Promise.resolve(null);
  let host = "";
  try { host = new URL(url, location.href).host; } catch (e) { /* rien */ }
  if (NOCORS.has(host)) return Promise.resolve(null);
  if (SONO.has(url)) return SONO.get(url);
  const p = (async () => {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 15000);
    let ab;
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) return null;
      if (+(r.headers.get("content-length") || 0) > 8e6) { ctl.abort(); return null; }
      ab = await r.arrayBuffer();
      if (ab.byteLength > 8e6) return null;
    } catch (e) { if (e.name !== "AbortError" && host) NOCORS.add(host); return null; }
    finally { clearTimeout(tm); }
    const a = ac();
    if (!a) return null;
    try {
      const buf = await new Promise((res, rej) => { try { const pr = a.decodeAudioData(ab, res, rej); if (pr && pr.catch) pr.catch(rej); } catch (e) { rej(e); } });
      return renderSono(buf);
    } catch (e) { return null; }
  })();
  SONO.set(url, p);
  if (SONO.size > 30) SONO.delete(SONO.keys().next().value);
  return p;
}
function renderSono(buf) {
  const dur = Math.min(buf.duration, 30), sr = buf.sampleRate;
  const ch0 = buf.getChannelData(0), ch1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
  const total = Math.min(ch0.length, Math.floor(sr * dur));
  const N = 1024, cols = clamp(Math.round(dur * 45), 120, 900), hop = Math.max(1, Math.floor((total - N) / cols));
  const binHz = sr / N, bins = Math.min(N / 2, Math.floor(11000 / binHz));
  const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = .5 - .5 * Math.cos(2 * Math.PI * i / (N - 1));
  const re = new Float32Array(N), im = new Float32Array(N), mags = new Float32Array(cols * bins);
  let max = -Infinity;
  for (let c = 0; c < cols; c++) {
    const s0 = c * hop;
    for (let i = 0; i < N; i++) { const k = s0 + i; const v = k < total ? (ch1 ? (ch0[k] + ch1[k]) * .5 : ch0[k]) : 0; re[i] = v * win[i]; im[i] = 0; }
    fft(re, im);
    for (let b = 0; b < bins; b++) { const db = 10 * Math.log10(re[b] * re[b] + im[b] * im[b] + 1e-12); mags[c * bins + b] = db; if (db > max) max = db; }
  }
  const floor = max - 68, off = document.createElement("canvas");
  off.width = cols; off.height = bins;
  const og = off.getContext("2d"), img = og.createImageData(cols, bins), D = img.data;
  for (let c = 0; c < cols; c++) for (let b = 0; b < bins; b++) {
    const v = clamp((mags[c * bins + b] - floor) / 68, 0, 1), idx = Math.round(Math.pow(v, 1.6) * 255) * 3, p = ((bins - 1 - b) * cols + c) * 4;
    D[p] = PAL[idx]; D[p + 1] = PAL[idx + 1]; D[p + 2] = PAL[idx + 2]; D[p + 3] = 255;
  }
  og.putImageData(img, 0, 0);
  return { cv: off, dur, binHz, bins };
}
function paintSono(cv, r, axis) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.max(120, Math.round((cv.clientWidth || 320) * dpr)), H = Math.max(36, Math.round((cv.clientHeight || 120) * dpr));
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.imageSmoothingEnabled = true;
  g.drawImage(r.cv, 0, 0, W, H);
  if (!axis) return;
  g.fillStyle = "rgba(255,255,255,.5)";
  g.font = `${11 * dpr}px Figtree, system-ui, sans-serif`;
  [2, 4, 6, 8, 10].forEach(k => { const y = H - (k * 1000 / r.binHz / r.bins) * H; g.fillRect(0, y, 6 * dpr, 1); if (k % 4 === 2) g.fillText(k + " kHz", 9 * dpr, y + 4 * dpr); });
}
function sonoNone(box, big) {
  box.classList.remove("ld");
  box.classList.add("none");
  box.innerHTML = big ? `<div class="sono-fallback"><span class="ripple"></span><span class="ripple"></span><span class="ripple"></span>${ic("wave")}${S.set.sono ? `<small>Spectrogramme indisponible pour cet enregistrement</small>` : ""}</div>` : `<span class="nosono">${ic("wave")}</span>`;
}
async function sonoInto(box, snd, opts = {}) {
  if (!box || !snd) return null;
  box.classList.add("ld");
  const r = await sonoCalc(snd.url).catch(() => null);
  if (!box.isConnected) return null;
  box.classList.remove("ld");
  if (r) {
    box.innerHTML = `<canvas class="sc" aria-label="Spectrogramme"></canvas><i class="head"></i>`;
    box.classList.add("has");
    requestAnimationFrame(() => paintSono(box.querySelector("canvas"), r, !!opts.big));
    return { dur: r.dur, kind: "calc" };
  }
  if (snd.sono) {
    box.innerHTML = `<img class="sc xc" src="${esc(snd.sono)}" alt="Sonogramme xeno-canto" draggable="false"><i class="head"></i>`;
    box.classList.add("has");
    return { dur: 0, kind: "img" };
  }
  if (!opts.keep) sonoNone(box, !!opts.big);
  return null;
}
/* Remplit les mini-spectrogrammes d'une liste, un par un pour ne pas tout télécharger d'un coup */
async function sonoRows(root, list) {
  if (!S.set.sono || !root) return;
  for (const row of $$("[data-i]", root).filter(x => x.querySelector(".msono"))) {
    const snd = list[+row.dataset.i], box = row.querySelector(".msono");
    if (!snd || !box || box.classList.contains("has") || !row.isConnected) continue;
    row.__view = await sonoInto(box, snd, { keep: true });
    if (SND.row === row) SND.rowView = row.__view;
  }
}
/* ---------- Divers ---------- */
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
function icsFile() {
  const [h, m] = String(S.set.remind || "19:30").split(":").map(Number);
  const d = new Date();
  if (d.getHours() * 60 + d.getMinutes() >= h * 60 + m) d.setDate(d.getDate() + 1);
  const dt = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
  const url = location.href.split("#")[0];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Plumage//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    "UID:plumage-serie-du-jour-" + Date.now() + "@plumage", "DTSTAMP:" + stamp, "DTSTART:" + dt, "DURATION:PT10M", "RRULE:FREQ=DAILY",
    "SUMMARY:Plumage · Série du jour", "DESCRIPTION:12 questions\\, 4 minutes : " + url, "URL:" + url,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Plumage · Série du jour", "TRIGGER:PT0M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  download("plumage-rappel.ics", ics, "text/calendar");
}
function rerender() { const y = window.scrollY; go(VIEW, VDATA); window.scrollTo(0, y); }

/* ---------- Actions ---------- */
const ACT = {
  tab: el => { SES = null; go(el.dataset.tab); },
  home: () => { if (SES) { SES.ended = true; SES = null; } sndStop(); go("home"); },
  daily: () => { LASTCFG = dailyCfg(); startSession(LASTCFG); },
  mini: () => { LASTCFG = miniCfg(); startSession(LASTCFG); },
  review: () => { if (!dueList().length) { toast("Rien à revoir pour l'instant. Joue, et les erreurs reviendront ici."); return; } LASTCFG = reviewCfg(); startSession(LASTCFG); },
  mode: el => {
    const k = el.dataset.mode;
    if (k === "perso") { go("builder"); return; }
    if (k === "sortie") { TRIP.mode = "prep"; go("trip"); return; }
    if (k === "duel") { openDuelPicker(); return; }
    if (k === "main") { go("hand"); return; }
    if (k === "parcours") { go("paths"); return; }
    LASTCFG = modeCfg(k); startSession(LASTCFG);
  },
  histplay: el => { const h = (S.hist || [])[+el.dataset.i]; if (h?.cfg) { LASTCFG = { ...h.cfg }; startSession(LASTCFG); } },
  ftrain: el => { const f = +el.dataset.f; LASTCFG = { ...baseCfg(), title: famName(f) || "Famille", icon: "tree", taxa: [f], stim: photoStim(), size: 60 }; startSession(LASTCFG); },
  csv: () => { download(`plumage-carnet-${dayKey()}.csv`, carnetCsv(), "text/csv;charset=utf-8"); toast("Carnet exporté (fichier CSV, ouvrable dans Excel)."); },
  fav: el => { const f = S.favs[+el.dataset.i]; if (f) { LASTCFG = { ...f.cfg }; startSession(LASTCFG); } },
  favdel: el => { S.favs.splice(+el.dataset.i, 1); save(); rerender(); },
  otd: () => openFiche(OTD),
  again: () => { if (LASTCFG) startSession(LASTCFG); else go("home"); },
  retry: () => { if (LASTCFG) startSession(LASTCFG); else go("home"); },
  quit: () => { if (SES && SES.results.length) endSession(true); else if (SES?.kind === "hand") { SES.ended = true; SES = null; go("hand"); } else ACT.home(); },
  pick: el => onPick(el.dataset.k),
  hint: el => {
    const q = SES?.q;
    if (!q || q.done || !q.hints || q.hintsUsed >= q.hints.length) return;
    const h = q.hints[q.hintsUsed++];
    $("#hints").insertAdjacentHTML("beforeend", `<span class="hint">${ic(h.ic, "xs")}${esc(h.tx)}</span>`);
    if (q.hintsUsed >= q.hints.length) el.disabled = true;
  },
  play: () => { unlockAudio(); sndPlay(); },
  aplay: el => { const q = SES?.q; const c = q?.choices?.[+el.dataset.i]; if (c?.snd) playRow(c.snd, el.closest(".achoice")); },
  fplay: el => { const s = FICHE.snds?.[+el.dataset.i]; if (s) { FICHE.playing = true; playRow(s, el.closest(".srow")); } },
  lplay: el => { const s = LEARNSND[+el.dataset.i]; if (s) playRow(s, el.closest(".srow")); },
  seek: (el, e) => { const b = el.getBoundingClientRect(); unlockAudio(); seekTo(clamp((e.clientX - b.left) / b.width, 0, 1)); },
  rseek: (el, e) => {
    const sl = el.dataset.sl, i = +el.dataset.i, b = el.getBoundingClientRect();
    const snd = sl === "a" ? SES?.q?.choices?.[i]?.snd : sl === "f" ? FICHE.snds?.[i] : sl === "l" ? LEARNSND[i] : null;
    const row = el.closest(".achoice, .srow");
    if (!snd || !row) return;
    if (sl === "f") FICHE.playing = true;
    seekTo(clamp((e.clientX - b.left) / b.width, 0, 1), row, snd);
  },
  sslow: () => { S.set.slow = !S.set.slow; save(); applyRate(); $$("[data-act=sslow]").forEach(b => { b.classList.toggle("on", S.set.slow); b.setAttribute("aria-pressed", S.set.slow ? "true" : "false"); }); toast(S.set.slow ? "Ralenti : moitié moins vite, une octave plus grave." : "Vitesse normale."); },
  sloop: () => { S.set.loop = !S.set.loop; save(); applyRate(); $$("[data-act=sloop]").forEach(b => { b.classList.toggle("on", S.set.loop); b.setAttribute("aria-pressed", S.set.loop ? "true" : "false"); }); },
  fkind: el => { FICHE.kf = el.dataset.k; renderFicheSnds(); },
  next: () => nextQuestion(),
  replaceq: () => replaceQuestion(),
  geook: () => geoValidate(),
  zoom: el => { if (el.querySelector(".mfail") || el.classList.contains("broken")) return; const z = zoomItems(el); openViewer(z.items, z.i); },
  vclose: () => closeViewer(),
  vgo: el => { if (VW) { const d = +el.dataset.d; vwShow(VW.i + d, d); } },
  vfiche: el => { const t = taxonById(el.dataset.id); closeViewer(true); if (t) openFiche(t); },
  mapfull: () => setMapFull(),
  mapmenu: () => { const m = $("#mmenu"); if (m) m.hidden = !m.hidden; },
  mapset: el => {
    S.set.mapst = el.dataset.s; save();
    $$("[data-act=mapset]").forEach(b => b.classList.toggle("on", b.dataset.s === S.set.mapst));
    if (GMAP) setMapStyle(GMAP, S.set.mapst);
    if (FICHE.t && $("#fmap") && !$("#layer").hidden) renderMap(FICHE.t, $("[data-act=mapz].on")?.dataset.v || "fr");
    const mm = el.closest("#mmenu");
    if (mm) mm.hidden = true;
  },
  sugg: el => {
    const q = SES?.q;
    if (!q || q.done) return;
    const k = el.dataset.k, ok = k === q.answerKey;
    const e = LEX.get(+k.slice(1));
    const chosen = k[0] === "s" && e ? { t: { id: e.id, sci: e.sci, fr: e.fr, f: e.f, img: e.img ? { sq: e.img, md: sizeUrl(e.img, "medium") } : null } } : null;
    $("#ans")?.blur();
    settle({ ok, chosen, typed: el.textContent.trim() });
  },
  badsnd: el => {
    const u = SES?.q?.snd?.url;
    if (!u) return;
    S.badSnd = [...(S.badSnd || []).filter(x => x !== u), u].slice(-500);
    save();
    el.disabled = true; el.innerHTML = ic("check", "xs") + "Écarté";
    toast("Ce son ne reviendra plus.");
  },
  skip: () => { const q = SES?.q; if (q && !q.done) { if (q.kind === "hand") handSkipReveal(q); settle({ ok: false, typed: "" }); } },
  hgo: el => { LASTCFG = handCfg(el.dataset.ex, el.dataset.sp); startSession(LASTCFG); },
  hsp: el => { const h = handSpPanel(el.dataset.sp); if (h) openLayer(h); },
  hhub: () => { if (SES) { SES.ended = true; SES = null; } go("hand"); },
  wtap: (el, e) => handTap(el, e),
  ttap: (el, e) => handTap(el, e),
  hval: () => handValidate(),
  hzoom: el => handZoom(el),
  topon: async el => {
    const inp = $("#pseudo"), n = cleanName(inp ? inp.value : S.set.pseudo);
    if (!S.set.topOn && !n) { toast("Choisis d'abord un pseudo."); inp?.focus(); return; }
    if (n) S.set.pseudo = n;
    S.set.topOn = !S.set.topOn; save();
    el.classList.toggle("on", S.set.topOn); el.setAttribute("aria-checked", S.set.topOn ? "true" : "false");
    if (S.set.topOn) { await topPush(true); toast("Tu apparais dans le classement."); } else { await topRemove(); toast("Tu n'apparais plus dans le classement."); }
    if (VIEW === "top") topMount();
  },
  live: () => { closeLayer(); if (!LIVE.code) liveReset(); go("live"); },
  liveT: el => { S.set.liveT = +el.dataset.v; save(); $$("[data-act=liveT]").forEach(b => b.classList.toggle("on", b === el)); },
  lcreate: () => liveCreate(),
  lshare: () => liveShare(),
  lrewait: () => liveRewait(),
  llaunch: el => { el.disabled = true; liveLaunch(); },
  lleave: () => liveLeave(),
  lpick: el => liveAnswer(el.dataset.k),
  tnext: () => { if (TOURST.i >= TOUR.length - 1) endTour(); else { TOURST.i++; const L = $("#layer"); if (L) L.innerHTML = tourHtml(); } },
  tskip: () => endTour(),
  tour: () => openTour(0),
  newsok: () => { S.hint = { ...(S.hint || {}), news: NEWS[0].v }; save(); closeLayer(); },
  news: () => openNews(true),
  hpnum: el => { S.set.pnum = el.dataset.v; save(); rerender(); toast(el.dataset.v === "fr" ? "Primaires à la française : P1 est la petite plume externe." : "Primaires à l'anglaise : P1 est la plus interne, contre les secondaires."); },
  reveal: () => { const q = SES?.q; if (!q || q.done) return; $("#answers").innerHTML = revealHtml(q); },
  self: el => settle({ ok: el.dataset.v === "1", self: true }),
  fiche: el => { const t = taxonById(el.dataset.id); if (t) openFiche(t); },
  close: () => closeLayer(),
  phz: el => { $$("[data-act=phz]").forEach(b => b.classList.toggle("on", b === el)); renderPheno(FICHE.t, el.dataset.z === "fr" ? { id: 6753 } : S.set.zone); },
  mapz: el => { $$("[data-act=mapz]").forEach(b => b.classList.toggle("on", b === el)); renderMap(FICHE.t, el.dataset.v); },
  memokeep: el => {
    const t = taxonById(el.dataset.id); if (!t) return;
    const r = rec(t), m = (el.dataset.m || "").trim(); if (!m) return;
    r.note = !r.note ? m.slice(0, 280) : r.note.includes(m) ? r.note : (r.note + " · " + m).slice(0, 280);
    save(); el.innerHTML = ic("check", "xs") + "Gardé !"; el.disabled = true;
    toast("Gardé dans « Mon astuce » : il reviendra en indice.");
  },
  memoown: el => { const box = el.closest(".why")?.querySelector(".memoin"); if (!box) return; box.hidden = !box.hidden; if (!box.hidden) box.querySelector("textarea")?.focus(); },
  memosave: el => {
    const box = el.closest(".memoin"), ta = box?.querySelector("textarea"), v = (ta?.value || "").trim();
    if (!v) { ta?.focus(); return; }
    const t = taxonById(el.dataset.id); if (!t) return;
    const r = rec(t);
    r.note = !r.note ? v.slice(0, 280) : r.note.includes(v) ? r.note : (r.note + " · " + v).slice(0, 280);
    save(); box.outerHTML = `<div class="note-own">${ic("edit", "xs")} ${esc(r.note)}</div>`;
    toast("Ton moyen mnémo est gardé : il reviendra en indice.");
  },
  lexp: el => { const sec = el.closest(".lsec"); const p = sec?.querySelector("p.clamp"); if (!p) return; p.classList.remove("clamp"); sec.querySelector(".lmore2")?.remove(); },
  pvt: el => { const d = el.closest("details"); if (!d) return; d.open = !d.open; S.pv = { ...(S.pv || {}), [d.dataset.k]: d.open }; save(); },
  recipe: async el => { const r = RECIPES.find(x => x.id === el.dataset.r); if (!r) return; try { const cfg = await recipeCfg(r); LASTCFG = cfg; startSession(cfg); } catch (e) { toast("Familles indisponibles (réseau ?)."); } },
  bshare: async () => { try { openShare(await builderCfg(getB())); } catch (e) { toast("Partage impossible pour l'instant."); } },
  qshare: () => openShare(SES?.cfg || LASTCFG),
  shlink: () => shareLinkNow(),
  shcopy: () => copyLink(),
  shpng: () => downloadQr(),
  inqplay: async () => { const cfg = await incomingCfg().catch(() => null); if (!cfg) { toast("Quiz illisible."); return; } LASTCFG = cfg; startSession(cfg); },
  inqsave: async () => { const cfg = await incomingCfg().catch(() => null); if (!cfg) return; S.favs.unshift({ title: cfg.title, cfg }); S.favs = S.favs.slice(0, 12); save(); closeLayer(); if (VIEW === "home") rerender(); toast("Gardé dans « Mes quiz » sur l'accueil."); },
  defi: () => { closeLayer(); defiNew(); go("defi"); },
  dT: el => { DEFI.T = +el.dataset.v; S.set.liveT = DEFI.T; save(); $$("[data-act=dT]").forEach(b => b.classList.toggle("on", b === el)); },
  dstart: () => defiPrepare(),
  daccept: () => { if (livePseudo()) defiAccept(); },
  dpick: el => defiAnswer(el.dataset.k),
  dshare: () => defiShare(),
  dagain: () => { defiNew(); defiPrepare(); },
  dback: () => { defiNew(); go("defi"); },
  dquit: () => { clearTimeout(DEFI.tmr); DEFI.load++; DEFI.st = ""; go("home"); },
  paths: () => go("paths"),
  path: el => { PATHV.id = el.dataset.p; PATHV.open = -1; go("path"); },
  pstep: el => { const i = +el.dataset.i, P = PATHI[PATHV.id], cur = PATHV.open === -1 ? pathNext(P) : PATHV.open; PATHV.open = cur === i ? -2 : i; go("path"); },
  pgo: el => { const P = PATHI[el.dataset.p || PATHV.id], i = +el.dataset.i; if (!P || !(i >= 0) || !stepOpen(P, i)) return; PATHV.id = P.id; LASTCFG = pathCfg(P, i); startSession(LASTCFG); },
  week: () => { closeLayer(); clearTimeout(DEFI.tmr); Object.assign(DEFI, { role: "week", st: "intro", err: "", opp: null }); go("defi"); if (weekMine()) weekRank(); },
  wstart: () => weekStart(),
  wshare: async () => { try { DEFI.link = location.origin + location.pathname + "#defi=" + await packZ(JSON.stringify(defiPack())); defiShare(); } catch (e) { toast("Lien impossible à créer."); } },
  cloudon: () => cloudEnable(),
  cloudnow: () => cloudNow(),
  cloudcode: () => openCloudCode(false),
  cloudrest: () => openCloudRestore(),
  cloudoff: () => cloudOff(),
  ccopy: () => { const c = cloudFmt(S.cloud?.code || ""); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(() => toast("Code copié."), () => toast("Sélectionne le code pour le copier.")); else toast("Sélectionne le code pour le copier."); },
  duelgo: el => {
    let cfg;
    if (el.dataset.ids) { const [a, b] = el.dataset.ids.split(",").map(Number); const ra = S.sp[a], rb = S.sp[b]; cfg = duelCfg([ra.sci, rb.sci, ra.fr, rb.fr]); cfg.ids = [a, b]; }
    else cfg = duelCfg(DUELS[+el.dataset.i]);
    LASTCFG = cfg; startSession(cfg);
  },
  placepick: el => { const cb = PLACECB; closeLayer(); if (cb) cb({ k: "p" + el.dataset.id, id: +el.dataset.id, name: el.dataset.name }); },
  szone: el => pickZone(el.dataset.z, z => { S.set.zone = z; save(); if (VIEW === "settings") rerender(); toast("Zone : " + zoneLabel(z)); }),
  bzone: el => pickZone(el.dataset.z, z => { getB().zone = z; save(); if (VIEW === "builder") rerender(); }),
  b: el => {
    const B = getB(), f = el.dataset.f;
    let v = el.dataset.v;
    if (["size", "len", "timer", "k"].includes(f)) v = +v;
    if (f === "stim") { const i = B.stim.indexOf(v); if (i >= 0) { if (B.stim.length > 1) B.stim.splice(i, 1); } else B.stim.push(v); }
    else B[f] = v;
    if (f === "freq" && (v === "mine" || v === "lifers") && !S.set.inat) toast("Pense à mettre ton pseudo iNaturalist dans Réglages.");
    save(); rerender();
  },
  bk: el => { const B = getB(); B.k = clamp(B.k + +el.dataset.d, 2, 6); save(); rerender(); },
  ball: () => { const B = getB(); B.guilds = []; B.fams = []; save(); rerender(); },
  bguild: el => { const B = getB(), g = el.dataset.g, i = B.guilds.indexOf(g); if (i >= 0) B.guilds.splice(i, 1); else B.guilds.push(g); save(); rerender(); },
  bfam: () => openFamPicker(),
  bfamdel: el => { const B = getB(); B.fams = B.fams.filter(x => x !== +el.dataset.id); save(); rerender(); },
  famtoggle: el => { const B = getB(), id = +el.dataset.id, i = B.fams.indexOf(id); if (i >= 0) B.fams.splice(i, 1); else B.fams.push(id); el.classList.toggle("on", i < 0); save(); },
  famdone: () => { closeLayer(); if (VIEW === "builder") rerender(); },
  blaunch: async () => { try { const cfg = await builderCfg(getB()); LASTCFG = cfg; startSession(cfg); } catch (e) { toast("Familles indisponibles (réseau ?)."); } },
  bsave: async () => { try { const B = getB(), cfg = await builderCfg(B); S.favs.unshift({ title: cfg.title, cfg }); S.favs = S.favs.slice(0, 12); save(); toast("Enregistré dans « Mes quiz » sur l'accueil."); } catch (e) { toast("Enregistrement impossible."); } },
  cfilt: el => { CARNET.f = el.dataset.f; $$("[data-act=cfilt]").forEach(b => b.classList.toggle("on", b === el)); $("#cgrid").innerHTML = carnetGrid(); },
  set: el => { const k = el.dataset.k; S.set[k] = k === "goal" ? +el.dataset.v : el.dataset.v; save(); $$(`[data-act=set][data-k=${k}]`).forEach(b => b.classList.toggle("on", b === el)); },
  setk: el => { S.set.k = clamp(S.set.k + +el.dataset.d, 2, 6); save(); rerender(); },
  toggle: el => {
    const k = el.dataset.k; S.set[k] = !S.set[k]; save();
    $$(`[data-act=toggle][data-k=${k}]`).forEach(b => { b.classList.toggle("on", S.set[k]); b.setAttribute("aria-checked", S.set[k] ? "true" : "false"); });
    if (k === "calm") document.body.classList.toggle("calm", S.set.calm);
    if (k === "mapLab" || k === "mapIsl") mapExtras();
  },
  ics: () => { icsFile(); toast("Ouvre le fichier pour ajouter le rappel quotidien à ton calendrier."); },
  export: () => backupNow(),
  backup: () => backupNow(),
  bklater: el => { S.bk = { ...(S.bk || {}), snooze: Date.now() }; save(); el.closest(".notice")?.remove(); },
  insthide: el => { S.hint = { ...(S.hint || {}), install: Date.now() }; save(); el.closest(".notice")?.remove(); },
  tzone: el => pickZone(el.dataset.z, z => { TRIP.z = z; S.set.tripZ = z; save(); go("trip"); }),
  tmap: () => openMapPicker(z => { TRIP.z = z; S.set.tripZ = z; save(); go("trip"); }),
  tmonth: el => { TRIP.m = +el.dataset.m; TRIP.rec = false; go("trip"); },
  trec: el => { TRIP.rec = el.dataset.v === "1"; if (TRIP.rec) TRIP.m = new Date().getMonth() + 1; go("trip"); },
  tload: () => loadTrip(),
  tpack: () => { if (PK.run) return; if (packMatches()) { toast(`Déjà prêt hors ligne : ${packOf().n} espèces. Pour l'effacer : Réglages, Hors ligne.`); return; } packDownload(); },
  tpackopen: () => { const p = packOf(); if (!p) return; if (p.z !== undefined) { TRIP.z = p.z; } TRIP.m = p.m; TRIP.rec = p.rec; packFallback(true); const b = $("#tlist"); if (b) b.innerHTML = tripListHtml(); },
  pkdel: () => packDelete(),
  tquiz: () => tripQuiz(),
  tfield: () => { TRIP.mode = "field"; TRIP.q = ""; go("trip"); },
  tprep: () => { TRIP.mode = "prep"; go("trip"); },
  tobs: el => tripObs(+el.dataset.id),
  tdone: () => {
    const n = tripSeen().size;
    TRIP.mode = "prep";
    toast(n ? `${n} espèce${n > 1 ? "s" : ""} notée${n > 1 ? "s" : ""} dans ton carnet.` : "Sortie terminée.");
    if (n) { CARNET.f = "field"; go("carnet"); } else go("trip");
  },
  prad: el => { if (!PMAP) return; PMAP._r = +el.dataset.r; $$("[data-act=prad]").forEach(b => b.classList.toggle("on", b === el)); drawPick(); },
  pmapok: () => { const m = PMAP; if (!m || !m._c) return; const z = { k: "pt", lat: +m._c.lat.toFixed(3), lng: +((((m._c.lng + 540) % 360) - 180).toFixed(3)), r: m._r, name: `Point choisi · ${m._r} km` }; const cb = PCB; closeLayer(); if (cb) cb(z); },
  reset: el => {
    if (el.dataset.armed) { try { localStorage.removeItem(KEY); purgeCache(0); } catch (e) { /* rien */ } S = defaults(); save(true); toast("Tout est remis à zéro."); go("home"); return; }
    el.dataset.armed = "1"; el.innerHTML = ic("trash") + "Confirmer ?"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.innerHTML = ic("trash") + "Effacer"; } }, 4000);
  }
};

function onClick(e) {
  const mm = $("#mmenu");
  if (mm && !mm.hidden && !e.target.closest("#mmenu,[data-act=mapmenu]")) mm.hidden = true;
  const el = e.target.closest("[data-act]");
  if (el) {
    if (el.disabled) return;
    const f = ACT[el.dataset.act];
    if (f) { e.preventDefault(); f(el, e); }
    return;
  }
  if (e.target.id === "layer") closeLayer();
}
function onKey(e) {
  if (VW) {
    if (e.key === "Escape") closeViewer();
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const d = e.key === "ArrowRight" ? 1 : -1; vwShow(VW.i + d, d); }
    return;
  }
  const tg = e.target;
  if (tg && tg.matches && tg.matches("input, textarea")) { if (e.key === "Escape") tg.blur(); return; }
  if (e.key === "Escape") { if (!$("#layer").hidden) closeLayer(); return; }
  if (VIEW === "live" && LIVE.st === "q" && /^[1-6]$/.test(e.key)) { $$("#lans [data-act=lpick]")[+e.key - 1]?.click(); return; }
  if (VIEW === "defi" && DEFI.st === "q" && /^[1-6]$/.test(e.key)) { $$("#dans [data-act=dpick]")[+e.key - 1]?.click(); return; }
  if (VIEW !== "quiz" || !$("#layer").hidden) return;
  const fbOpen = $("#fb");
  const hq = SES?.q;
  if (hq && hq.kind === "hand" && !fbOpen && hq.format === "score" && /^[0-5]$/.test(e.key)) { $(`#answers [data-act=pick][data-k="${e.key}"]`)?.click(); return; }
  if (hq && hq.kind === "hand" && !fbOpen && hq.format === "tap" && e.key === "Enter") { e.preventDefault(); handValidate(); return; }
  if (/^[1-6]$/.test(e.key) && !fbOpen) { const btns = $$("#answers [data-act=pick]"); btns[+e.key - 1]?.click(); }
  else if ((e.key === "Enter" || e.key === " ") && fbOpen) { e.preventDefault(); nextQuestion(); }
  else if (e.key.toLowerCase() === "h" && !fbOpen) $("[data-act=hint]")?.click();
  else if (e.key.toLowerCase() === "r") { unlockAudio(); sndPlay(); }
}
function onSubmit(e) {
  if (e.target.id === "crest") { e.preventDefault(); cloudRestore($("#ccin")?.value || ""); return; }
  if (e.target.id === "ljoin") { e.preventDefault(); $("#lcode")?.blur(); liveJoin($("#lcode")?.value || ""); return; }
  if (e.target.id === "typer") {
    e.preventDefault();
    const q = SES?.q;
    if (!q || q.done) return;
    const v = $("#ans").value;
    if (!v.trim()) return;
    $("#ans").blur();
    const r = checkTyped(v, q);
    /* Nom d'une autre espèce : on montre ce qui les sépare, comme pour un QCM */
    if (!r.ok && q.level === "species") { const m = lexExact(v); if (m && m.id !== q.t.id) r.chosen = { t: m }; }
    settle({ ...r, typed: v });
  }
}
let NOTET = 0;
function onInput(e) {
  const t = e.target;
  if (t.id === "csearch") { CARNET.q = t.value; $("#cgrid").innerHTML = carnetGrid(); }
  else if (t.id === "ans") suggest(t.value);
  else if (t.id === "tsearch") { TRIP.q = t.value; const b = $("#tchk"); if (b) b.innerHTML = tripChkHtml(); }
  else if (t.id === "psearch") { clearTimeout(PLACET); const v = t.value; PLACET = setTimeout(() => runPlaceSearch(v), 350); }
  else if (t.id === "fsearch") renderFamPicker(t.value);
  else if (t.id === "mynote") {
    clearTimeout(NOTET);
    NOTET = setTimeout(() => { const tx = FICHE.t; if (!tx) return; const r = rec(tx); r.note = t.value.trim().slice(0, 280); save(); }, 400);
  }
}
function onChange(e) {
  const t = e.target;
  if (t.id === "pseudo" || t.id === "lpseudo") {
    const n = cleanName(t.value);
    t.value = n;
    if (n && n !== S.set.pseudo) { S.set.pseudo = n; save(); if (S.set.topOn) topPush(true); toast("Pseudo enregistré."); }
    return;
  }
  if (t.dataset && t.dataset.set) { S.set[t.dataset.set] = t.value.trim(); save(); toast("Enregistré."); }
  if (t.id === "importf" && t.files && t.files[0]) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        if (!restoreFrom(JSON.parse(fr.result))) throw new Error("format");
        toast("Progression restaurée !"); go("home");
      } catch (err) { toast("Fichier non reconnu."); }
    };
    fr.readAsText(t.files[0]);
  }
}

/* Remplace la progression par une sauvegarde (fichier ou en ligne) ; garde la clé xeno-canto et le pack de ce téléphone */
function restoreFrom(o) {
  if (!o || typeof o !== "object" || !o.sp || !o.set || typeof o.sp !== "object") return false;
  const d = defaults(), xc = S.set.xc, pack = S.pack || null, cloud = S.cloud || null;
  S = { ...d, ...o, set: { ...d.set, ...o.set, xc: o.set.xc || xc }, streak: { ...d.streak, ...(o.streak || {}) }, best: { ...d.best, ...(o.best || {}) }, pack, cloud: o.cloud || cloud };
  if (!o.v) S.v = 1;
  migrate();
  save(true);
  return true;
}

/* ---------- Démarrage ---------- */
/* Liens reçus : #duel=CODE (duel en direct), #q=… (quiz partagé) */
function openLinkHash() {
  const h = location.hash.replace("#", "");
  const dm = h.match(/^duel=([A-Za-z0-9]{5})$/), qm = h.match(/^q=([A-Za-z0-9_-]{4,2000})$/), fm = h.match(/^defi=([A-Za-z0-9_-]{8,9000})$/);
  if (!dm && !qm && !fm) return false;
  history.replaceState(null, "", location.pathname + location.search);
  if (dm) { LIVE.joinCode = dm[1].toUpperCase(); go("live"); }
  else if (fm) { go("home"); openDefiLink(fm[1]); }
  else { go("home"); openIncoming(qm[1]); }
  return true;
}
function init() {
  SILENT = makeSilent();
  /* Service worker : l'appli s'ouvre sans réseau (pas pendant les tests automatiques, qui simulent le réseau) */
  if ("serviceWorker" in navigator && location.hostname !== "plumage.test" && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
  if (S.set.calm) document.body.classList.add("calm");
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("input", onInput);
  document.addEventListener("change", onChange);
  if (!openLinkHash()) { const h = location.hash.replace("#", ""); go(["carnet", "progress", "settings", "about", "top"].includes(h) ? h : "home"); }
  window.addEventListener("hashchange", () => { if (!SES || SES.ended) openLinkHash(); });
  setTimeout(maybeIntro, 900);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* rien */ }
  loadTaxo().catch(() => {});
}
init();
