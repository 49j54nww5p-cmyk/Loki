/* ============================================================
   Plumage — interface
   ============================================================ */
let VIEW = "home", VDATA = null, OTD = null, LASTCFG = null, SILENT = "";
const OKW = ["Exact !", "Bien vu !", "Bravo !", "Parfait !", "Dans le mille !", "Yes !"];
const BADW = ["Raté…", "Pas cette fois", "Oups !", "Presque…"];
const VIEWS = {}, MOUNT = {};

function go(v, data) {
  if (VIEW === "quiz" && v !== "quiz") { sndStop(); clearQTimer(); hideFeedback(); }
  VIEW = v; VDATA = data;
  document.body.classList.toggle("inquiz", ["quiz", "loading", "result", "error", "builder"].includes(v));
  $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === v));
  if (v !== "quiz") setAmbient(null);
  if (v !== "result" && v !== "quiz") stopFx();
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
VIEWS.home = () => {
  const L = level(), st = liveStreak(), d = S.days[dayKey()], done = !!d?.serie, due = dueList().length;
  const goal = done ? 1 : clamp((d?.xp || 0) / 150, 0, 1), C = 2 * Math.PI * 66;
  const hot = !playedToday() && new Date().getHours() >= 17;
  return `<section class="view home">
  <header class="hud">
    <div class="brand"><span class="mark">${ic("bird")}</span>Plumage</div>
    <div class="pill flame ${st ? "" : "cold"} ${hot ? "hot" : ""}" title="Jours d'affilée">${ic("flame")}<span>${st}</span></div>
    <div class="pill xp" title="Points d'expérience">${ic("spark")}<span>${fmt(S.xp)}</span></div>
  </header>
  <div class="hero">
    <div class="bgimg" id="heroBg"><img alt=""></div>
    <div class="hero-top"><span class="eyebrow">Série du jour</span><span class="hero-date">${esc(dateFr())}</span></div>
    <div class="orb-wrap"><button class="orb ${done ? "done" : ""}" data-act="daily" aria-label="Lancer la série du jour">
      <svg class="ring" viewBox="0 0 148 148" aria-hidden="true"><circle class="track" cx="74" cy="74" r="66"/><circle class="prog" cx="74" cy="74" r="66" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - goal)).toFixed(1)}"/></svg>
      <span class="core">${ic(done ? "check" : "play")}</span></button></div>
    <h1>${done ? "Série bouclée !" : "12 questions, 4 minutes"}</h1>
    <div class="sub">${done ? "Rejoue quand tu veux, ou change de mode." : `Photos, chants, latin et familles · ${esc(zoneLabel(S.set.zone))}`}</div>
    <div class="mix" aria-hidden="true"><span>${ic("frame")}</span><span>${ic("wave")}</span><span>${ic("quill")}</span><span>${ic("tree")}</span><span>${ic("duel")}</span></div>
    <button class="otd" id="otd" data-act="otd" hidden><img alt=""><span><small>Oiseau du jour</small><b></b></span>${ic("arrow")}</button>
  </div>
  <div class="quick">
    <button class="qbtn" data-act="mini"><span class="ic">${ic("bolt")}</span><span><b>Mini-série</b><small>3 questions, 1 min</small></span></button>
    <button class="qbtn due ${due ? "" : "zero"}" data-act="review"><span class="ic">${ic("replay")}</span><span><b>${due ? due + " à revoir" : "Révisions"}</b><small>${due ? "Répétition espacée" : "Rien à revoir"}</small></span></button>
  </div>
  <button class="lvlbar" data-act="tab" data-tab="progress"><span class="badge">${L.n}</span><span class="meta"><b>${esc(L.rank)}</b><small>${fmt(L.cur)} / ${fmt(L.need)} XP</small><span class="bar"><i style="width:${(L.p * 100).toFixed(1)}%"></i></span></span></button>
  <div class="sec">${ic("playc")}Modes</div>
  <div class="tiles">${MODES.map((m, i) => `<button class="tile" style="--c:${m.c};animation-delay:${i * 35}ms" data-act="mode" data-mode="${m.k}"><span class="ic">${ic(m.ic)}</span><span><b>${m.n}</b><small>${m.d}</small></span></button>`).join("")}</div>
  ${S.favs.length ? `<div class="sec">${ic("star")}Mes quiz</div><div class="favs">${S.favs.map((f, i) => `<button class="fav" data-act="fav" data-i="${i}">${ic("star")}${esc(f.title)}</button>`).join("")}</div>` : ""}
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
  <button class="btn ghost" data-act="home" style="margin-top:24px">Annuler</button></div></section>`;
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
  if (q.kind === "geo") return "globe";
  if (q.kind === "root") return "root";
  if (q.level === "family" || q.level === "order") return "tree";
  return { photo: "frame", field: "eye", son: "wave", soncho: "wave", fr: "quill", la: "quill" }[q.stim] || "frame";
}
function stageHtml(q) {
  if (q.kind === "geo") return `<div class="gstrip" id="gstrip">${q.sp.map((s, i) => `<figure><img src="${esc(s.img)}" alt="Oiseau ${i + 1}"><span class="k">${i + 1}</span><figcaption>${esc(s.fr)}</figcaption></figure>`).join("")}</div>`;
  if (q.kind === "root") return `<div class="namecard"><div><span class="eyebrow">Racine latine</span><div class="big latin">${esc(q.w)}</div>${q.ex ? `<div class="ex">dans <span class="latin">${esc(q.ex.sci)}</span></div>` : ""}</div></div>`;
  const bonus = q.bonus ? `<span class="tag-bonus">${ic("spark")}Rareté ×2</span>` : "";
  if (q.stim === "son") return `<div class="sound" id="sound">${bonus}
    <div class="sono-wrap" id="sonoWrap"><canvas class="sono" id="sono" aria-label="Sonogramme"></canvas><div class="sono-head" id="sonoHead"></div></div>
    <div class="sound-ctl"><button class="playbig" id="playBtn" data-act="play" aria-label="Écouter">${ic("play")}</button><div class="scrub"><i id="scrub"></i></div><span class="stime" id="stime">0:00</span></div></div>`;
  if (q.stim === "fr") return `<div class="namecard"><div><span class="eyebrow">Nom français</span><div class="big">${esc(q.t.fr || q.t.sci)}</div></div></div>`;
  if (q.stim === "la") return `<div class="namecard"><div><span class="eyebrow">Nom latin</span><div class="big latin">${esc(q.t.sci)}</div></div></div>`;
  const p = q.photo || {};
  return `<figure class="shot" id="shot">
    <img class="blur" src="${esc(p.md)}" alt="">
    <img class="main" id="mainImg" alt="Oiseau à identifier">
    <span class="ret tl"></span><span class="ret tr"></span><span class="ret bl"></span><span class="ret br"></span>
    <div class="spinner"><div class="spin"></div></div>
    ${q.stim === "field" ? `<span class="tag-field">${ic("eye")}Terrain</span>` : ""}${bonus}
    ${q.stim === "soncho" ? `<figcaption class="credit" style="font-size:13px;font-weight:700;color:#fff">${esc(nameFr(q.t))}</figcaption>` : `<figcaption class="credit">${esc(p.attr || "")}</figcaption>`}
  </figure>`;
}
function choiceLabel(c) {
  if (c.t) {
    if (c.mode === "la") return `<span class="latin solo">${esc(c.sci)}</span>`;
    if (c.mode === "fr") return `<b>${esc(c.fr)}</b>`;
    return `<b>${esc(c.fr)}</b>${c.fr !== c.sci ? `<span class="latin">${esc(c.sci)}</span>` : ""}`;
  }
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
  if (q.format === "map") return `<div class="gmap" id="gmap"></div><button class="btn primary wide" id="gok" data-act="geook" disabled style="margin-top:10px">${ic("pin")}Touche la carte pour placer ton pin</button>`;
  if (q.format === "type") return `<form class="typer" id="typer" autocomplete="off"><input id="ans" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="${esc(typePlaceholder(q))}" aria-label="Ta réponse"><button class="btn primary" type="submit" aria-label="Valider">${ic("check")}</button></form><div class="sugg" id="sugg"></div><button class="skip" data-act="skip">Je ne sais pas</button>`;
  if (q.format === "flash") return `<div class="flashbox"><button class="btn ghost wide" data-act="reveal" style="height:62px">${ic("eye")}Voir la réponse</button></div>`;
  if (q.format === "audio") return ch.map((c, i) => `<div class="achoice" data-k="${c.key}" style="animation-delay:${i * 50}ms"><button class="pl" data-act="aplay" data-i="${i}" aria-label="Écouter l'enregistrement ${String.fromCharCode(65 + i)}">${ic("play")}</button><div class="wv" aria-hidden="true">${Array.from({ length: 14 }, (_, j) => `<i style="height:${30 + ((j * 37 + i * 11) % 60)}%"></i>`).join("")}</div><button class="pick" data-act="pick" data-k="${c.key}">${String.fromCharCode(65 + i)} · Lui</button></div>`).join("");
  if (q.format === "tiles") {
    const nm = c => q.names === "la" ? `<span class="latin">${esc(c.sci)}</span>` : esc(c.fr);
    return `<div class="tgrid">${ch.map((c, i) => `<button class="tchoice" data-act="pick" data-k="${c.key}" style="animation-delay:${i * 45}ms"><img src="${esc(c.t.img?.md || "")}" alt="${esc(c.fr)}"><span class="k">${i + 1}</span><span class="nm">${nm(c)}</span></button>`).join("")}</div>`;
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
  if (q.photo && q.stim !== "son") {
    const fig = $("#shot"), img = $("#mainImg");
    if (fig && img) {
      let tried = false;
      img.onload = () => fig.classList.add("loaded");
      img.onerror = () => { if (!tried && q.photo.md && img.src !== q.photo.md) { tried = true; img.src = q.photo.md; } else fig.classList.add("loaded"); };
      img.src = q.photo.lg || q.photo.md;
    }
    setAmbient(q.photo.md);
  } else if (q.kind === "geo") { setAmbient(q.sp[0]?.img); mountGeoMap(q); }
  else setAmbient(null);
  if (q.stim === "son" && q.snd) {
    sndLoad(q.snd.url, $("#sono")).then(mode => { if (mode && SES?.q === q && !q.done) sndPlay(true); });
  }
  if (q.format === "type") { loadLexicon(); const inp = $("#ans"); if (inp && window.matchMedia && matchMedia("(hover:hover)").matches) inp.focus(); }
  if (ses.cfg.timer === 10) startQTimer(q, 10000);
  if (ses.deadline) startChallengeBar();
}
let QT = 0, CT = 0;
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
  return `<div class="compare"><figure class="right"><img src="${esc(a)}" alt=""><figcaption><small>Bonne réponse</small>${esc(nameFr(t))}</figcaption></figure>
  <figure class="you"><img src="${esc(b)}" alt=""><figcaption><small>Ton choix</small>${esc(nameFr(c))}</figcaption></figure></div>`;
}
function fbHtml(q, res, gain) {
  const ses = SES;
  const last = ses.len && ses.results.length >= ses.len;
  const over = ses.deadline && Date.now() >= ses.deadline;
  const verdict = res.timeout ? "Temps écoulé" : res.ok ? pick(OKW) : res.partial ? "Presque !" : pick(BADW);
  const head = `<div class="grab"></div><div class="verdict"><span class="vi">${ic(res.ok ? "check" : res.partial ? "bulb" : "x")}</span><b>${verdict}</b>${gain ? `<span class="gain">+${gain} XP</span>` : ""}</div>`;
  const next = `<button class="btn primary wide next" data-act="next">${last || over ? "Voir le bilan" : "Suivant"}${ic("arrow")}</button>`;
  if (q.kind === "geo") {
    const km = res.geoKm, tier = geoTier(km);
    return `<div class="grab"></div><div class="verdict"><span class="vi">${ic(km <= 1500 ? "check" : "pin")}</span><b>${esc(tier[2])}</b><span class="gain">+${gain} XP</span></div>
    <div class="dnote" style="font-size:15px;color:var(--text)">${ic("pin", "xs")} À <b>${fmt(km)} km</b> · ${esc(q.place || "")}</div>
    <div class="chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">${q.sp.map(s => `<span class="chip">${esc(s.fr)}</span>`).join("")}</div>${next}`;
  }
  if (q.kind === "root") {
    return `${head}<div class="decode"><span class="dchip"><span class="latin">${esc(q.w)}</span>${esc(q.mean)}</span></div>${q.note ? `<div class="dnote">${esc(q.note)}</div>` : ""}${q.ex ? `<div class="dnote">Exemple : ${esc(q.ex.fr || "")} · <span class="latin">${esc(q.ex.sci)}</span></div>` : ""}${next}`;
  }
  const t = q.t, r = S.sp[t.id], f = fam(t), o = ord(t);
  const dec = decodeLatin(t.sci), note = dec.find(x => x.note);
  const chosen = res.chosen?.t && res.chosen.t.id !== t.id ? res.chosen.t : null;
  const thumb = (q.photo && q.photo.md) || imgOf(t);
  const isNew = r && r.n === 1 && ses.newSp.includes(t.id);
  return `${head}
  ${res.typed && !res.ok ? `<div class="dnote">Tu as écrit « ${esc(res.typed)} »</div>` : ""}
  <button class="spcard" data-act="fiche" data-id="${t.id}">
    <img src="${esc(thumb)}" alt="">
    <span class="t"><b>${esc(nameFr(t))}</b>${t.fr ? `<span class="latin">${esc(t.sci)}</span>` : ""}
      <span class="chips">${f ? `<span class="chip fam">${esc(famName(f))}</span>` : ""}${o ? `<span class="chip ord">${esc(ordName(o))}</span>` : ""}${isNew ? `<span class="chip warn">${ic("spark")}Nouvelle</span>` : ""}</span></span>
    ${ic("info")}
  </button>
  ${dec.length ? `<div class="decode">${dec.map(d => `<span class="dchip"><span class="latin">${esc(d.w)}</span>${esc(d.m)}</span>`).join("")}</div>${note ? `<div class="dnote">${esc(note.note)}</div>` : ""}` : ""}
  ${r?.note ? `<div class="note-own">${ic("edit", "xs")} ${esc(r.note)}</div>` : ""}
  ${chosen ? compareHtml(t, chosen, q) : ""}
  ${q.photo?.field && (q.photo.place || q.photo.date) ? `<div class="dnote">${ic("pin", "xs")} ${esc(q.photo.place || "")}${q.photo.date ? " · " + esc(dateLong(q.photo.date)) : ""}</div>` : ""}
  ${q.snd ? `<div class="dnote" style="display:flex;align-items:center;gap:8px">${ic("wave", "xs")}<span style="flex:1">${esc([q.snd.place, q.snd.attr].filter(Boolean).join(" · "))}</span><button class="chip warn" data-act="badsnd">${ic("x", "xs")}Mauvais son</button></div>` : ""}
  ${next}`;
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
let GMAP = null;
function mountGeoMap(q) {
  const el = $("#gmap");
  if (!el || !window.L) return;
  if (GMAP) { try { GMAP.remove(); } catch (e) { /* rien */ } }
  const map = GMAP = L.map(el, { worldCopyJump: true, zoomControl: false, attributionControl: true, minZoom: 1 }).setView([25, 5], 1);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 12, attribution: "© OpenStreetMap © CARTO" }).addTo(map);
  q.guessM = null;
  map.on("click", e => {
    if (q.done) return;
    q.guess = [e.latlng.lat, ((e.latlng.lng + 540) % 360) - 180];
    if (q.guessM) q.guessM.setLatLng(e.latlng);
    else q.guessM = L.circleMarker(e.latlng, { radius: 9, color: "#fff", weight: 3, fillColor: "#FF8B3D", fillOpacity: 1 }).addTo(map);
    const b = $("#gok");
    if (b) { b.disabled = false; b.innerHTML = ic("check") + "Valider"; }
  });
  setTimeout(() => map.invalidateSize(), 50);
}
function geoValidate() {
  const q = SES?.q;
  if (!q || q.done || !q.guess) return;
  const km = haversine(q.guess, [q.lat, q.lng]), tier = geoTier(km);
  $$(".gstrip").forEach(g => g.classList.add("reveal"));
  $(".view.quiz")?.classList.add("georeveal");
  if (GMAP) {
    GMAP.invalidateSize();
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
  const title = p === 1 ? "Sans faute !" : p >= .8 ? "Superbe série !" : p >= .5 ? "Belle progression" : "Chaque erreur compte";
  const lead = p === 1 ? "Rien à redire, tu peux viser plus dur." : p >= .5 ? "Les erreurs reviendront en révision au bon moment." : "Tes erreurs reviendront vite en révision : c'est comme ça qu'on retient.";
  const L = level();
  const missed = [...new Map(ses.missed.map(t => [t.id, t])).values()].slice(0, 8);
  return `<section class="view result">
  <div class="score"><svg viewBox="0 0 190 190" aria-hidden="true"><circle class="track" cx="95" cy="95" r="84"/><circle class="prog" id="scoreProg" cx="95" cy="95" r="84" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C * (1 - p)).toFixed(1)}"/></svg>
    <div class="val"><b>${ok}<span style="font-size:24px;color:var(--muted)">/${n}</span></b><small>${esc(ses.title || "")}</small></div></div>
  <h1>${title}</h1><div class="lead">${lead}</div>
  ${msgs.map(m => `<div class="chip warn" style="margin-top:12px">${ic("shield")}${esc(m)}</div>`).join("")}
  <div class="trio"><div class="xp"><b>+${fmt(ses.xp)}</b><small>XP</small></div><div><b>×${ses.maxCombo}</b><small>meilleur combo</small></div><div><b>${ses.newSp.length}</b><small>nouvelle${ses.newSp.length > 1 ? "s" : ""}</small></div></div>
  <button class="lvlbar" data-act="tab" data-tab="progress"><span class="badge">${L.n}</span><span class="meta"><b>${esc(L.rank)}</b><small>${fmt(L.cur)} / ${fmt(L.need)} XP</small><span class="bar"><i style="width:${(L.p * 100).toFixed(1)}%"></i></span></span></button>
  ${badges.length ? `<div class="sec" style="justify-content:center">${ic("trophy")}Badge${badges.length > 1 ? "s" : ""} débloqué${badges.length > 1 ? "s" : ""}</div><div class="newbadges">${badges.map(b => `<span class="chip warn">${ic(b.ic)}${esc(b.n)}</span>`).join("")}</div>` : ""}
  ${missed.length ? `<div class="sec" style="justify-content:center">${ic("replay")}À revoir</div><div class="missed">${missed.map(t => `<button class="mchip" data-act="fiche" data-id="${t.id}"><img src="${esc(imgOf(t))}" alt="">${esc(nameFr(t))}</button>`).join("")}</div>` : ""}
  <div class="actions"><button class="btn ghost" data-act="home">${ic("back")}Accueil</button><button class="btn primary" data-act="again">${ic("replay")}Rejouer</button></div>
</section>`;
};
MOUNT.result = () => {
  const c = $("#scoreProg");
  if (c) requestAnimationFrame(() => requestAnimationFrame(() => { c.style.strokeDashoffset = c.dataset.off; }));
};

/* ---------- Constructeur « Sur mesure » ---------- */
const defaultB = () => ({ zone: S.set.zone, guilds: [], fams: [], freq: "common", size: 100, stim: ["photo"], target: "species", names: S.set.names, format: "qcm", k: S.set.k, diff: S.set.diff, len: 10, timer: 0 });
const BOPT = {
  freq: [["common", "Communs", "star"], ["season", "De saison", "cal"], ["all", "Tous", "list"], ["rare", "Raretés", "spark"], ["exotic", "Exotiques", "pin"], ["mine", "Mes obs. iNat", "eye"], ["lifers", "À découvrir", "binoc"]],
  size: [[25, "Top 25"], [50, "Top 50"], [100, "Top 100"], [200, "Top 200"]],
  stim: [["photo", "Photo", "frame"], ["field", "Terrain", "eye"], ["son", "Chant", "wave"], ["soncho", "Quel chant ?", "vol"], ["fr", "Nom FR", "type"], ["la", "Nom latin", "quill"]],
  target: [["species", "Espèce", "bird"], ["genus", "Genre", "quill"], ["family", "Famille", "tree"], ["order", "Ordre", "tree"]],
  names: [["both", "FR + latin"], ["fr", "Français"], ["la", "Latin"]],
  format: [["qcm", "Choix", "list"], ["tiles", "Vignettes", "grid"], ["type", "Saisie", "keyboard"], ["flash", "Flashcard", "cards"]],
  diff: [["facile", "Facile"], ["moyen", "Moyen"], ["expert", "Expert"]],
  len: [[5, "5"], [10, "10"], [20, "20"], [0, "∞"]],
  timer: [[0, "Sans"], [10, "10 s / question"], [60, "Défi 60 s"]]
};
const getB = () => (S.set.builder = S.set.builder || defaultB());
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
  return `<section class="view builder">
  <div class="head"><button class="icon-btn" data-act="home" aria-label="Retour">${ic("back")}</button><div><h1>Sur mesure</h1><p>Règle tout, puis lance.</p></div></div>
  <div class="opt"><div class="opt-h">${ic("pin")}Zone<span class="val">${esc(zoneLabel(B.zone))}</span></div><div class="row">${zoneChips(B.zone, "bzone")}</div></div>
  <div class="opt"><div class="opt-h">${ic("tree")}Oiseaux<span class="val">${B.guilds.length || B.fams.length ? (B.guilds.length + B.fams.length) + " groupe(s)" : "Tous"}</span></div>
    <div class="row"><button class="opt-btn ${!B.guilds.length && !B.fams.length ? "on" : ""}" data-act="ball">${ic("bird")}Tous</button>${GUILDS.map(g => `<button class="opt-btn ${B.guilds.includes(g.n) ? "on" : ""}" data-act="bguild" data-g="${esc(g.n)}">${esc(g.n)}</button>`).join("")}<button class="opt-btn" data-act="bfam">${ic("search")}Une famille…</button></div>
    ${famChips ? `<div class="selfam">${famChips}</div>` : ""}</div>
  <div class="opt"><div class="opt-h">${ic("star")}Lesquels</div>${optRow("freq", BOPT.freq)}${["common", "rare", "lifers"].includes(B.freq) ? `<div style="margin-top:8px">${optRow("size", BOPT.size)}</div>` : ""}</div>
  <div class="opt"><div class="opt-h">${ic("eye")}Question<span class="val">plusieurs choix possibles</span></div>${optRow("stim", BOPT.stim, true, true)}</div>
  <div class="opt"><div class="opt-h">${ic("check")}Réponse attendue</div>${optRow("target", BOPT.target)}</div>
  <div class="opt"><div class="opt-h">${ic("type")}Noms affichés</div>${optRow("names", BOPT.names)}</div>
  <div class="opt"><div class="opt-h">${ic("list")}Format</div>${optRow("format", BOPT.format)}
    ${B.format === "qcm" || B.format === "tiles" ? `<div style="display:flex;align-items:center;gap:14px;margin-top:10px;flex-wrap:wrap"><div class="stepper"><button data-act="bk" data-d="-1" aria-label="Moins de choix">${ic("minus")}</button><output>${B.k}</output><button data-act="bk" data-d="1" aria-label="Plus de choix">${ic("plus")}</button></div><span class="muted" style="font-size:13px">choix par question</span></div>` : ""}</div>
  <div class="opt"><div class="opt-h">${ic("bolt")}Difficulté des leurres</div>${optRow("diff", BOPT.diff)}</div>
  <div class="opt"><div class="opt-h">${ic("clock")}Longueur & chrono</div>${optRow("len", BOPT.len)}<div style="margin-top:8px">${optRow("timer", BOPT.timer)}</div></div>
  <div class="launch"><button class="btn ghost" data-act="bsave" aria-label="Enregistrer ce quiz">${ic("star")}</button><button class="btn primary" data-act="blaunch">${ic("play")}Lancer</button></div>
</section>`;
};
function builderTitle(B) {
  const grp = B.guilds.length === 1 && !B.fams.length ? B.guilds[0] : B.fams.length === 1 && !B.guilds.length ? famName(B.fams[0]) : B.guilds.length + B.fams.length ? "Groupes" : "Oiseaux";
  const st = B.stim.map(s => (BOPT.stim.find(x => x[0] === s) || [])[1]).filter(Boolean).join("+");
  return `${grp} · ${st} · ${zoneLabel(B.zone)}`;
}
async function builderCfg(B) {
  let taxa = [...B.fams];
  if (B.guilds.length) {
    await loadTaxo();
    for (const g of GUILDS.filter(x => B.guilds.includes(x.n))) for (const n of g.f) { const f = TAXO.famByName.get(n); if (f) taxa.push(f.id); }
  }
  taxa = [...new Set(taxa)];
  const onlySound = B.stim.every(s => s === "son" || s === "soncho");
  return { kind: "quiz", title: builderTitle(B), icon: "sliders", zone: B.zone, taxa, freq: B.freq, size: B.size, sounds: onlySound, stim: B.stim.slice(), target: B.target, names: B.names, format: B.format, k: B.k, diff: B.diff, len: B.timer === 60 ? 0 : B.len, timer: B.timer };
}

/* ---------- Carnet ---------- */
const CARNET = { q: "", f: "all" };
function carnetList() {
  const tday = todayNum(), q = norm(CARNET.q);
  let all = Object.entries(S.sp).filter(([, r]) => r.n > 0).map(([id, r]) => ({ id: +id, r }));
  if (CARNET.f === "due") all = all.filter(x => Object.values(x.r.due || {}).some(d => d <= tday));
  if (CARNET.f === "master") all = all.filter(x => stars(x.r) === 3);
  if (CARNET.f === "weak") all = all.filter(x => x.r.n >= 2 && x.r.ok / x.r.n < .6);
  if (q) all = all.filter(x => norm(x.r.fr).includes(q) || norm(x.r.sci).includes(q));
  return all.sort((a, b) => String(b.r.last || "").localeCompare(String(a.r.last || "")) || String(a.r.fr || a.r.sci).localeCompare(String(b.r.fr || b.r.sci)));
}
function carnetGrid() {
  const list = carnetList();
  if (!list.length) return `<div class="empty">${ic("book")}<b>${Object.keys(S.sp).length ? "Rien ici" : "Ton carnet est vide"}</b><p>${Object.keys(S.sp).length ? "Change de filtre ou de recherche." : "Chaque oiseau croisé en quiz s'ajoute ici, avec sa fiche et ton niveau."}</p>${Object.keys(S.sp).length ? "" : `<button class="btn primary" data-act="daily">${ic("play")}Série du jour</button>`}</div>`;
  return `<div class="cgrid">${list.map(({ id, r }) => `<button class="ctile" data-act="fiche" data-id="${id}"><span class="av" style="--p:${(stars(r) / 3 * 100).toFixed(0)}"><img src="${esc(r.img || r.md)}" alt="" loading="lazy"></span><b>${esc(r.fr || r.sci)}</b>${starsHtml(stars(r))}</button>`).join("")}</div>`;
}
VIEWS.carnet = () => {
  const recs = Object.values(S.sp).filter(r => r.n > 0);
  const master = recs.filter(r => stars(r) === 3).length;
  const filt = [["all", "Toutes"], ["due", "À revoir"], ["weak", "Fragiles"], ["master", "Maîtrisées"]];
  return `<section class="view carnet">
  <div class="head"><div><h1 style="font:700 24px/1.1 var(--f-display);margin:0">Carnet</h1><div class="counts"><span><b>${recs.length}</b> espèces</span><span><b>${master}</b> maîtrisées</span><span><b>${dueList().length}</b> à revoir</span></div></div></div>
  <div class="search" style="margin-top:14px">${ic("search")}<input id="csearch" type="search" placeholder="Chercher une espèce" value="${esc(CARNET.q)}" aria-label="Chercher"></div>
  <div class="row" style="margin-top:10px">${filt.map(([k, l]) => `<button class="opt-btn mini ${CARNET.f === k ? "on" : ""}" data-act="cfilt" data-f="${k}">${l}</button>`).join("")}</div>
  <div id="cgrid">${carnetGrid()}</div>
</section>`;
};

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
  const master = recs.filter(r => stars(r) === 3).length;
  const tot = Object.values(S.stats).reduce((a, s) => ({ n: a.n + s.n, ok: a.ok + s.ok }), { n: 0, ok: 0 });
  const td = S.days[dayKey()] || { xp: 0, q: 0 };
  const cats = [["photo", "Photos", "frame"], ["son", "Chants", "wave"], ["nom", "Noms", "quill"], ["fam", "Familles", "tree"], ["type", "Saisie", "keyboard"], ["geo", "Géo", "globe"], ["root", "Racines", "root"]].filter(([k]) => S.stats[k]?.n);
  const conf = topConfusions(5);
  return `<section class="view progress">
  <div class="big-lvl"><div class="lring"><svg viewBox="0 0 96 96" aria-hidden="true"><circle class="track" cx="48" cy="48" r="40"/><circle class="prog" cx="48" cy="48" r="40" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - L.p)).toFixed(1)}"/></svg><b>${L.n}</b></div>
    <div><h2>${esc(L.rank)}</h2><p>${fmt(L.need - L.cur)} XP avant le niveau ${L.n + 1}${L.n < RANKS.length ? " · " + esc(RANKS[Math.min(L.n, RANKS.length - 1)]) : ""}</p><p>${fmt(S.xp)} XP au total</p></div></div>
  <div class="grid2">
    <div class="stat"><small>${ic("flame")}Jours d'affilée</small><b>${st}</b><div class="sub">Record : ${S.streak.best}</div><div class="jokers" title="Jokers : sauvent ta série si tu rates un jour">${[0, 1, 2].map(i => ic("shield", i < S.streak.jokers ? "" : "off")).join("")}</div></div>
    <div class="stat"><small>${ic("book")}Espèces</small><b>${recs.length}</b><div class="sub">${master} maîtrisée${master > 1 ? "s" : ""} · ${dueList().length} à revoir</div></div>
    <div class="stat"><small>${ic("sun")}Aujourd'hui</small><b>${fmt(td.xp)}</b><div class="sub">XP · ${td.q || 0} question${td.q > 1 ? "s" : ""}</div></div>
    <div class="stat"><small>${ic("check")}Réussite</small><b>${tot.n ? Math.round(100 * tot.ok / tot.n) : 0} %</b><div class="sub">sur ${fmt(tot.n)} réponses</div></div>
  </div>
  <div class="sec">${ic("cal")}12 dernières semaines</div><div class="card" style="padding:14px">${heatHtml()}</div>
  <div class="sec">${ic("chart")}14 derniers jours</div><div class="card" style="padding:14px">${chartHtml()}</div>
  ${cats.length ? `<div class="sec">${ic("eye")}Par type de question</div><div class="card hbars" style="padding:14px">${cats.map(([k, l, i]) => { const s = S.stats[k], p = s.ok / s.n; return `<div class="hbar"><span class="t">${ic(i)}${l}</span><span class="b"><i style="width:${(p * 100).toFixed(0)}%"></i></span><span class="v">${Math.round(p * 100)} %</span></div>`; }).join("")}</div>` : ""}
  ${conf.length ? `<div class="sec">${ic("duel")}Tes confusions</div><div style="display:flex;flex-direction:column;gap:8px">${conf.map(c => { const a = S.sp[c.a], b = S.sp[c.b]; return `<div class="conf"><img src="${esc(a.img || a.md)}" alt=""><span class="vs">VS</span><img src="${esc(b.img || b.md)}" alt=""><span class="tx">${esc(a.fr || a.sci)}<small>${esc(b.fr || b.sci)} · ${c.n}×</small></span><button class="btn primary" data-act="duelgo" data-ids="${c.a},${c.b}">Duel</button></div>`; }).join("")}</div>` : ""}
  <div class="sec">${ic("trophy")}Badges<span class="more">${Object.keys(S.badges).length} / ${BADGES.length}</span></div>
  <div class="badges">${BADGES.map(b => `<div class="bdg ${S.badges[b.id] ? "" : "off"}"><span class="md">${ic(b.ic)}</span><b>${esc(b.n)}</b><small>${esc(b.d)}</small></div>`).join("")}</div>
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
  <div class="sec">${ic("down")}Sauvegarde</div>
  <div class="group">
    <div class="set"><span class="lab"><b>Exporter</b><small>Télécharge ta progression (à garder en lieu sûr).</small></span><button class="btn ghost" data-act="export">${ic("down")}Exporter</button></div>
    <div class="set"><span class="lab"><b>Importer</b><small>Restaure une sauvegarde sur ce téléphone.</small></span><label class="btn ghost" style="cursor:pointer">${ic("up")}Importer<input type="file" id="importf" accept="application/json,.json" hidden></label></div>
    <div class="set"><span class="lab"><b>Tout effacer</b><small>Remet l'appli à zéro sur cet appareil.</small></span><button class="btn ghost" data-act="reset" id="resetBtn">${ic("trash")}Effacer</button></div>
  </div>
  <p class="foot">Photos, sons et données : <a href="https://www.inaturalist.org" target="_blank" rel="noopener">iNaturalist</a> et ses observateurs (licence indiquée sur chaque média). Descriptions : Wikipédia (CC BY-SA). Fonds de carte : © OpenStreetMap, © CARTO. Faune France n'ouvre pas ses données, d'où un simple lien depuis les fiches. Ta progression reste sur cet appareil.</p>
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
  L.hidden = true;
  L.innerHTML = "";
  document.body.style.overflow = "";
  if (FICHE.playing) { sndStop(); FICHE.playing = false; }
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
    <h2>Duels</h2><p class="muted" style="margin:6px 0 4px;font-size:14px">Deux sosies, 8 questions pour les départager.</p>
    ${conf.length ? `<div class="sec">${ic("replay")}Tes confusions</div><div style="display:flex;flex-direction:column;gap:8px">${conf.map(c => { const a = S.sp[c.a], b = S.sp[c.b]; return `<button class="conf" data-act="duelgo" data-ids="${c.a},${c.b}" style="text-align:left"><img src="${esc(a.img || a.md)}" alt=""><span class="vs">VS</span><img src="${esc(b.img || b.md)}" alt=""><span class="tx">${esc(a.fr || a.sci)}<small>${esc(b.fr || b.sci)} · ${c.n}×</small></span>${ic("arrow")}</button>`; }).join("")}</div>` : ""}
    <div class="sec">${ic("duel")}Grands classiques</div>
    <div class="plist">${DUELS.map((d, i) => `<button class="pitem" data-act="duelgo" data-i="${i}"><span style="flex:1"><b style="font-weight:650">${esc(d[2])}</b> <span class="muted">vs</span> <b style="font-weight:650">${esc(d[3])}</b></span>${ic("arrow", "s")}</button>`).join("")}</div></div></div>`);
}

/* ---------- Fiche espèce ---------- */
const FICHE = { t: null, playing: false };
function taxonById(id) {
  id = +id;
  const fromSes = SES?.pool?.byId?.get(id) || (SES?.q?.t?.id === id ? SES.q.t : null) || (SES?.missed || []).find(t => t.id === id) || (SES?.q?.choices || []).map(c => c.t).find(t => t && t.id === id);
  return fromSes || (OTD && OTD.id === id ? OTD : null) || (FICHE.sim || []).find(t => t.id === id) || fromRec(id);
}
function openFiche(t) {
  if (!t) return;
  FICHE.t = t;
  const r = S.sp[t.id], f = fam(t) || r?.f || 0, o = ord(t) || r?.o || 0, dec = decodeLatin(t.sci), note = dec.find(x => x.note);
  const s = r ? stars(r) : 0;
  openLayer(`<div class="panel" role="dialog" aria-label="Fiche ${esc(nameFr(t))}">
  <button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="gallery" id="gal"><figure><img src="${esc(imgOf(t))}" alt=""><figcaption>${esc(t.img?.attr || "")}</figcaption></figure></div><div class="gdots" id="gdots"></div>
  <div class="in">
    <div class="ftitle"><h2>${esc(nameFr(t))}</h2>${t.fr ? `<span class="latin">${esc(t.sci)}</span>` : ""}
      <div class="chips">${f ? `<span class="chip fam">${ic("tree")}${esc(famName(f))}${famVern(f) ? " · " + esc(famVern(f)) : ""}</span>` : ""}${o ? `<span class="chip ord">${esc(ordName(o))}</span>` : ""}${r?.n ? starsHtml(s) : ""}</div></div>
    ${dec.length ? `<div class="decode">${dec.map(d => `<span class="dchip"><span class="latin">${esc(d.w)}</span>${esc(d.m)}</span>`).join("")}</div>${note ? `<div class="dnote">${esc(note.note)}</div>` : ""}` : ""}
    <div class="fsec"><h3>${ic("edit")}Mon astuce</h3><textarea class="mynote" id="mynote" data-id="${t.id}" placeholder="Un moyen mnémotechnique, un détail qui t'aide à la reconnaître…">${esc(r?.note || "")}</textarea></div>
    ${r?.n ? `<div class="fsec"><h3>${ic("chart")}Ma maîtrise</h3><div class="stats4"><div><b>${r.n}</b><small>fois vue</small></div><div><b>${Math.round(100 * r.ok / r.n)} %</b><small>réussite</small></div><div><b>${s}/3</b><small>étoiles</small></div></div></div>` : ""}
    <div class="fsec"><h3>${ic("cal")}Présence par mois<span class="seg"><button class="on" data-act="phz" data-z="fr">France</button><button data-act="phz" data-z="zone">Ma zone</button></span></h3><div class="pheno" id="pheno"></div></div>
    <div class="fsec"><h3>${ic("map")}Observations<span class="seg"><button class="on" data-act="mapz" data-v="fr">France</button><button data-act="mapz" data-v="eu">Europe</button><button data-act="mapz" data-v="w">Monde</button></span></h3><div id="fmap"></div><div class="mapcap">Fond © OpenStreetMap · © CARTO — points : observations iNaturalist</div></div>
    <div class="fsec"><h3>${ic("wave")}Chants & cris</h3><div class="slist" id="fsnd"><div class="spin" style="margin:6px auto"></div></div></div>
    <div class="fsec" id="fwiki" hidden><h3>${ic("book")}Description</h3><p id="fwikiTx"></p></div>
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
  renderPheno(t, { id: 6753 });
  renderMap(t, "fr");
  photosFor([t.id]).then(([ph]) => {
    if (!alive() || !ph.length) return;
    const g = $("#gal");
    g.innerHTML = ph.slice(0, 10).map(p => `<figure><img src="${esc(p.md)}" alt="" loading="lazy"><figcaption>${esc(p.attr)}</figcaption></figure>`).join("");
    const dots = $("#gdots");
    dots.innerHTML = ph.slice(0, 10).map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("");
    g.onscroll = () => { const i = Math.round(g.scrollLeft / g.clientWidth); $$("i", dots).forEach((d, j) => d.classList.toggle("on", i === j)); };
  }).catch(() => {});
  Promise.all([soundsList(t).catch(() => []), xcList(t).catch(() => null)]).then(([a, x]) => {
    if (!alive()) return;
    const list = [...a.map(s => ({ ...s, src: "iNaturalist" })), ...(x || []).map(s => ({ ...s, src: "xeno-canto" }))];
    FICHE.snds = list;
    $("#fsnd").innerHTML = list.length ? list.map((s, i) => `<div class="srow"><button class="pl" data-act="fplay" data-i="${i}" aria-label="Écouter">${ic("play")}</button><span class="tx"><b>${esc(s.kind ? cap(s.kind) : "Enregistrement " + (i + 1))}${s.len ? " · " + esc(s.len) : ""}</b>${esc([s.place, s.attr].filter(Boolean).join(" · "))}</span>${s.page || s.uri ? `<a href="${esc(s.page || s.uri)}" target="_blank" rel="noopener" class="icon-btn" aria-label="Source">${ic("ext")}</a>` : ""}</div>`).join("") : `<p class="muted" style="font-size:14px">Pas d'enregistrement trouvé.${S.set.xc ? "" : " Ajoute une clé xeno-canto dans Réglages pour en avoir plus."}</p>`;
  });
  wiki(t).then(w => {
    if (!alive() || !w) return;
    $("#fwiki").hidden = false;
    $("#fwikiTx").innerHTML = `${esc(w.text.length > 520 ? w.text.slice(0, 500).replace(/\s\S*$/, "") + "…" : w.text)} ${w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">Wikipédia</a>` : ""}`;
  }).catch(() => {});
  similar(t, null).then(list => {
    if (!alive()) return;
    FICHE.sim = list.slice(0, 10);
    $("#fsim").innerHTML = FICHE.sim.length ? FICHE.sim.map(s => `<button data-act="fiche" data-id="${s.id}"><img src="${esc(s.img?.md || "")}" alt="" loading="lazy"><b>${esc(nameFr(s))}</b></button>`).join("") : `<p class="muted" style="font-size:14px">Aucune confusion connue.</p>`;
  }).catch(() => { if (alive()) $("#fsim").innerHTML = `<p class="muted" style="font-size:14px">Indisponible hors ligne.</p>`; });
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
  const r2 = (window.devicePixelRatio || 1) > 1 ? "@2x" : "";
  let cells = "";
  V.ys.forEach((y, ry) => V.xs.forEach((x, rx) => {
    const area = `${ry + 1}/${rx + 1}`;
    cells += `<img src="https://${"abcd"[(x + y) % 4]}.basemaps.cartocdn.com/dark_nolabels/${V.z}/${x}/${y}${r2}.png" alt="" style="grid-area:${area}" loading="lazy">`;
    cells += `<img class="ov" src="https://api.inaturalist.org/v1/grid/${V.z}/${x}/${y}.png?taxon_id=${t.id}&color=%231FD1F2&quality_grade=research" alt="" style="grid-area:${area}" loading="lazy" onerror="this.remove()">`;
  }));
  const box = $("#fmap");
  if (box) box.innerHTML = `<div class="tilemap" style="grid-template-columns:repeat(${V.xs.length},1fr)">${cells}</div>`;
}

/* ---------- Son ---------- */
const SND = { el: null, buf: null, src: null, startAt: 0, offset: 0, playing: false, raf: 0, url: "", mode: "", dur: 0, unlocked: false, row: null };
function makeSilent() {
  const sr = 8000, n = 400, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
  try { return URL.createObjectURL(new Blob([b], { type: "audio/wav" })); } catch (e) { return ""; }
}
function audioEl() {
  if (!SND.el) {
    SND.el = new Audio();
    SND.el.preload = "auto";
    SND.el.setAttribute("playsinline", "");
    SND.el.addEventListener("ended", () => { SND.playing = false; setSndUI(); rowUI(); });
    SND.el.addEventListener("pause", () => { SND.playing = false; setSndUI(); rowUI(); });
    SND.el.addEventListener("playing", () => { SND.playing = true; setSndUI(); rowUI(); loop(); });
  }
  return SND.el;
}
function unlockAudio() {
  ac();
  const el = audioEl();
  if (SND.unlocked || !SILENT) return;
  try {
    el.src = SILENT;
    const p = el.play();
    if (p && p.then) p.then(() => { el.pause(); SND.unlocked = true; }).catch(() => {});
  } catch (e) { /* rien */ }
}
async function sndLoad(url, cv) {
  sndStop();
  SND.url = url; SND.buf = null; SND.mode = "el"; SND.offset = 0; SND.dur = 0; SND.row = null; SND.loading = true; SND.want = false;
  setSndUI();
  const done = mode => { if (SND.url === url) { SND.loading = false; if (SND.want) { SND.want = false; sndPlay(); } } return mode; };
  if (S.set.sono && cv) {
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(url, { signal: ctl.signal });
      clearTimeout(tm);
      if (!r.ok) throw new Error("http");
      const ab = await r.arrayBuffer();
      if (SND.url !== url) return null;
      const a = ac();
      if (!a) throw new Error("ctx");
      const buf = await new Promise((res, rej) => { try { const p = a.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); } catch (e) { rej(e); } });
      if (SND.url !== url) return null;
      SND.buf = buf; SND.mode = "buf"; SND.dur = Math.min(buf.duration, 30);
      drawSono(cv, buf);
      cv.onclick = e => { const b = cv.getBoundingClientRect(), f = clamp((e.clientX - b.left) / b.width, 0, 1); if (SND.playing) sndPause(); SND.offset = f * SND.dur; sndPlay(); };
      return done("buf");
    } catch (e) { /* CORS ou décodage : lecture simple */ }
  }
  if (SND.url !== url) return null;
  const el = audioEl();
  el.src = url;
  try { el.load(); } catch (e) { /* rien */ }
  if (cv && cv.parentNode) {
    const d = document.createElement("div");
    d.className = "sono-fallback";
    d.innerHTML = `<span class="ripple"></span><span class="ripple"></span><span class="ripple"></span>${ic("wave")}`;
    d.querySelector(".i").style.cssText = "width:54px;height:54px;color:var(--orange)";
    cv.replaceWith(d);
  }
  return done("el");
}
/* Bascule sur la lecture simple si l'audio Web reste bloqué (iPhone) */
function sndToElement() {
  const el = audioEl();
  if (SND.src) { const s = SND.src; SND.src = null; try { s.stop(); } catch (e) { /* rien */ } }
  SND.playing = false; SND.mode = "el";
  el.src = SND.url;
  try { el.load(); } catch (e) { /* rien */ }
  const p = el.play();
  if (p && p.catch) p.catch(() => { SND.playing = false; setSndUI(true); toast("Son bloqué : touche encore ▶."); });
}
function sndPlay(auto) {
  if (SND.loading) { SND.want = true; setSndUI(true); return; }
  const a = ac();
  if (SND.mode === "buf" && SND.buf && a) {
    if (SND.playing) { sndPause(); return; }
    if (a.state !== "running") {
      const r = a.resume ? a.resume() : null;
      Promise.resolve(r).catch(() => {}).then(() => sleep(250)).then(() => {
        if (a.state === "running") { if (!SND.playing) sndPlay(auto); }
        else if (!auto) sndToElement();
        else setSndUI(true);
      });
      return;
    }
    const src = a.createBufferSource();
    src.buffer = SND.buf;
    src.connect(a.destination);
    let off = SND.offset;
    if (off >= SND.dur - .05) off = 0;
    try { src.start(0, off, Math.max(.05, SND.dur - off)); } catch (e) { return; }
    SND.src = src; SND.startAt = a.currentTime - off; SND.playing = true;
    src.onended = () => { if (SND.src === src) { SND.playing = false; SND.offset = 0; SND.src = null; setSndUI(); } };
    loop(); setSndUI();
    if (a.state !== "running" && auto) setSndUI(true);
    return;
  }
  const el = audioEl();
  if (!SND.url) return;
  if (!el.paused && !el.ended) { el.pause(); return; }
  if (!el.src || el.src.indexOf(SND.url) === -1) el.src = SND.url;
  const p = el.play();
  if (p && p.catch) p.catch(() => { SND.playing = false; setSndUI(true); });
}
function sndPause() {
  if (SND.mode === "buf" && SND.src) {
    const a = ac();
    SND.offset = a.currentTime - SND.startAt;
    const s = SND.src; SND.src = null;
    try { s.stop(); } catch (e) { /* rien */ }
    SND.playing = false;
  } else if (SND.el) SND.el.pause();
  setSndUI();
}
function sndStop() {
  cancelAnimationFrame(SND.raf);
  if (SND.src) { const s = SND.src; SND.src = null; try { s.stop(); } catch (e) { /* rien */ } }
  if (SND.el) { try { SND.el.pause(); } catch (e) { /* rien */ } }
  SND.playing = false; SND.offset = 0;
  rowUI();
}
function sndPos() {
  if (SND.mode === "buf") return SND.playing && AC ? AC.currentTime - SND.startAt : SND.offset;
  return SND.el ? SND.el.currentTime || 0 : 0;
}
function sndDur() { if (SND.mode === "buf") return SND.dur; const el = SND.el; return el && isFinite(el.duration) ? el.duration : 0; }
function loop() {
  cancelAnimationFrame(SND.raf);
  const step = () => { updSnd(); if (SND.playing) SND.raf = requestAnimationFrame(step); };
  SND.raf = requestAnimationFrame(step);
}
function updSnd() {
  const p = sndPos(), d = sndDur(), f = d ? clamp(p / d, 0, 1) : 0;
  const sc = $("#scrub"); if (sc) sc.style.width = (f * 100).toFixed(2) + "%";
  const st = $("#stime"); if (st) st.textContent = fmtT(p);
  const head = $("#sonoHead"), wrap = $("#sonoWrap");
  if (head && wrap) { head.style.left = (f * 100).toFixed(2) + "%"; wrap.classList.toggle("on", SND.playing || p > 0); }
}
function setSndUI(idle) {
  const b = $("#playBtn");
  if (b) { b.innerHTML = ic(SND.playing ? "pause" : "play"); b.classList.toggle("idle", !!idle && !SND.playing); }
  const s = $("#sound"); if (s) s.classList.toggle("playing", SND.playing);
  updSnd();
}
function rowUI() {
  $$(".achoice.playing, .srow.playing").forEach(x => { if (x !== SND.row || !SND.playing) { x.classList.remove("playing"); const pl = x.querySelector(".pl"); if (pl) pl.innerHTML = ic("play"); } });
  if (SND.row && SND.playing) { SND.row.classList.add("playing"); const pl = SND.row.querySelector(".pl"); if (pl) pl.innerHTML = ic("pause"); }
}
function playRow(url, row) {
  const el = audioEl();
  if (SND.row === row && SND.playing) { el.pause(); return; }
  sndStop();
  SND.mode = "el"; SND.url = url; SND.row = row;
  el.src = url;
  const p = el.play();
  if (p && p.catch) p.catch(() => toast("Lecture impossible pour ce son."));
}
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
function drawSono(cv, buf) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.max(200, Math.round((cv.clientWidth || 340) * dpr)), H = Math.max(100, Math.round((cv.clientHeight || 150) * dpr));
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const sr = buf.sampleRate, ch0 = buf.getChannelData(0), ch1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
  const total = Math.min(ch0.length, Math.floor(sr * SND.dur));
  const N = 1024, cols = Math.min(W, 900), hop = Math.max(1, Math.floor((total - N) / cols));
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
  const floor = max - 68;
  const off = document.createElement("canvas");
  off.width = cols; off.height = bins;
  const og = off.getContext("2d"), img = og.createImageData(cols, bins), D = img.data;
  for (let c = 0; c < cols; c++) for (let b = 0; b < bins; b++) {
    const v = clamp((mags[c * bins + b] - floor) / 68, 0, 1), idx = Math.round(Math.pow(v, 1.6) * 255) * 3, p = ((bins - 1 - b) * cols + c) * 4;
    D[p] = PAL[idx]; D[p + 1] = PAL[idx + 1]; D[p + 2] = PAL[idx + 2]; D[p + 3] = 255;
  }
  og.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(off, 0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,.45)";
  g.font = `${11 * dpr}px Figtree, system-ui, sans-serif`;
  [2, 4, 6, 8, 10].forEach(k => { const y = H - (k * 1000 / binHz / bins) * H; g.fillRect(0, y, 6 * dpr, 1); if (k % 4 === 2) g.fillText(k + " kHz", 9 * dpr, y + 4 * dpr); });
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
    if (k === "duel") { openDuelPicker(); return; }
    LASTCFG = modeCfg(k); startSession(LASTCFG);
  },
  fav: el => { const f = S.favs[+el.dataset.i]; if (f) { LASTCFG = { ...f.cfg }; startSession(LASTCFG); } },
  favdel: el => { S.favs.splice(+el.dataset.i, 1); save(); rerender(); },
  otd: () => openFiche(OTD),
  again: () => { if (LASTCFG) startSession(LASTCFG); else go("home"); },
  retry: () => { if (LASTCFG) startSession(LASTCFG); else go("home"); },
  quit: () => { if (SES && SES.results.length) endSession(true); else ACT.home(); },
  pick: el => onPick(el.dataset.k),
  hint: el => {
    const q = SES?.q;
    if (!q || q.done || !q.hints || q.hintsUsed >= q.hints.length) return;
    const h = q.hints[q.hintsUsed++];
    $("#hints").insertAdjacentHTML("beforeend", `<span class="hint">${ic(h.ic, "xs")}${esc(h.tx)}</span>`);
    if (q.hintsUsed >= q.hints.length) el.disabled = true;
  },
  play: () => { unlockAudio(); sndPlay(); },
  aplay: el => { const q = SES?.q; const c = q?.choices?.[+el.dataset.i]; if (c?.snd) playRow(c.snd.url, el.closest(".achoice")); },
  fplay: el => { const s = FICHE.snds?.[+el.dataset.i]; if (s) { FICHE.playing = true; playRow(s.url, el.closest(".srow")); } },
  next: () => nextQuestion(),
  geook: () => geoValidate(),
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
  skip: () => { const q = SES?.q; if (q && !q.done) settle({ ok: false, typed: "" }); },
  reveal: () => { const q = SES?.q; if (!q || q.done) return; $("#answers").innerHTML = revealHtml(q); },
  self: el => settle({ ok: el.dataset.v === "1", self: true }),
  fiche: el => { const t = taxonById(el.dataset.id); if (t) openFiche(t); },
  close: () => closeLayer(),
  phz: el => { $$("[data-act=phz]").forEach(b => b.classList.toggle("on", b === el)); renderPheno(FICHE.t, el.dataset.z === "fr" ? { id: 6753 } : S.set.zone); },
  mapz: el => { $$("[data-act=mapz]").forEach(b => b.classList.toggle("on", b === el)); renderMap(FICHE.t, el.dataset.v); },
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
  set: el => { const k = el.dataset.k; S.set[k] = el.dataset.v; save(); $$(`[data-act=set][data-k=${k}]`).forEach(b => b.classList.toggle("on", b === el)); },
  setk: el => { S.set.k = clamp(S.set.k + +el.dataset.d, 2, 6); save(); rerender(); },
  toggle: el => { const k = el.dataset.k; S.set[k] = !S.set[k]; save(); el.classList.toggle("on", S.set[k]); el.setAttribute("aria-checked", S.set[k] ? "true" : "false"); if (k === "calm") document.body.classList.toggle("calm", S.set.calm); },
  ics: () => { icsFile(); toast("Ouvre le fichier pour ajouter le rappel quotidien à ton calendrier."); },
  export: () => { download(`plumage-sauvegarde-${dayKey()}.json`, JSON.stringify(S), "application/json"); toast("Sauvegarde téléchargée."); },
  reset: el => {
    if (el.dataset.armed) { try { localStorage.removeItem(KEY); purgeCache(0); } catch (e) { /* rien */ } S = defaults(); save(true); toast("Tout est remis à zéro."); go("home"); return; }
    el.dataset.armed = "1"; el.innerHTML = ic("trash") + "Confirmer ?"; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.innerHTML = ic("trash") + "Effacer"; } }, 4000);
  }
};

function onClick(e) {
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
  const tg = e.target;
  if (tg && tg.matches && tg.matches("input, textarea")) { if (e.key === "Escape") tg.blur(); return; }
  if (e.key === "Escape") { if (!$("#layer").hidden) closeLayer(); return; }
  if (VIEW !== "quiz" || !$("#layer").hidden) return;
  const fbOpen = $("#fb");
  if (/^[1-6]$/.test(e.key) && !fbOpen) { const btns = $$("#answers [data-act=pick]"); btns[+e.key - 1]?.click(); }
  else if ((e.key === "Enter" || e.key === " ") && fbOpen) { e.preventDefault(); nextQuestion(); }
  else if (e.key.toLowerCase() === "h" && !fbOpen) $("[data-act=hint]")?.click();
  else if (e.key.toLowerCase() === "r") { unlockAudio(); sndPlay(); }
}
function onSubmit(e) {
  if (e.target.id === "typer") {
    e.preventDefault();
    const q = SES?.q;
    if (!q || q.done) return;
    const v = $("#ans").value;
    if (!v.trim()) return;
    $("#ans").blur();
    const r = checkTyped(v, q);
    settle({ ...r, typed: v });
  }
}
let NOTET = 0;
function onInput(e) {
  const t = e.target;
  if (t.id === "csearch") { CARNET.q = t.value; $("#cgrid").innerHTML = carnetGrid(); }
  else if (t.id === "ans") suggest(t.value);
  else if (t.id === "psearch") { clearTimeout(PLACET); const v = t.value; PLACET = setTimeout(() => runPlaceSearch(v), 350); }
  else if (t.id === "fsearch") renderFamPicker(t.value);
  else if (t.id === "mynote") {
    clearTimeout(NOTET);
    NOTET = setTimeout(() => { const tx = FICHE.t; if (!tx) return; const r = rec(tx); r.note = t.value.trim().slice(0, 280); save(); }, 400);
  }
}
function onChange(e) {
  const t = e.target;
  if (t.dataset && t.dataset.set) { S.set[t.dataset.set] = t.value.trim(); save(); toast("Enregistré."); }
  if (t.id === "importf" && t.files && t.files[0]) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const o = JSON.parse(fr.result);
        if (!o || typeof o !== "object" || !o.sp || !o.set) throw new Error("format");
        const d = defaults();
        S = { ...d, ...o, set: { ...d.set, ...o.set }, streak: { ...d.streak, ...(o.streak || {}) }, best: { ...d.best, ...(o.best || {}) } };
        save(true); toast("Progression restaurée !"); go("home");
      } catch (err) { toast("Fichier non reconnu."); }
    };
    fr.readAsText(t.files[0]);
  }
}

/* ---------- Démarrage ---------- */
function init() {
  SILENT = makeSilent();
  if (S.set.calm) document.body.classList.add("calm");
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("input", onInput);
  document.addEventListener("change", onChange);
  const h = location.hash.replace("#", "");
  go(["carnet", "progress", "settings"].includes(h) ? h : "home");
  loadTaxo().catch(() => {});
}
init();
