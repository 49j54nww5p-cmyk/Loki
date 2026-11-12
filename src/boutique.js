/* ---------- La boutique : une monnaie dépensable (les plumes), à côté des XP qui restent le niveau ---------- */
(() => {
  const sp = document.querySelector("symbol#i-flame")?.parentNode;
  if (sp && !document.getElementById("i-feather")) sp.insertAdjacentHTML("beforeend",
    `<symbol id="i-feather" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M20 4c-6.5.3-11.8 4.6-12.8 11.2L7 18h2.8C16.4 17 20.4 11.3 20 4zM4 21l9.5-10.5M9 14.5h4.2M11 11.5h4.8"/></symbol>`);
})();
S.plumes = S.plumes || 0; S.plumesR = S.plumesR || 0;
S.freeHints = S.freeHints || 0; S.skips = S.skips || 0;
S.accs = Array.isArray(S.accs) ? S.accs : ["jaune"];

/* 1 plume pour 10 XP gagnés ; le reste est gardé pour la prochaine fois */
const addXpBase = addXp;
addXp = function (n) {
  addXpBase(n);
  if (!(n > 0)) return;
  const t = (S.plumesR || 0) + n;
  S.plumes = (S.plumes || 0) + Math.floor(t / 10); S.plumesR = t % 10;
};

/* Thèmes d'accent */
const ACCS = [
  { k: "jaune", n: "Jaune Plumage", d: "La couleur d'origine", c: "#FFCE00", c2: "#FFE27A" },
  { k: "martin", n: "Martin-pêcheur", d: "Vert-bleu des berges", c: "#18C6B4", c2: "#7EE6DA" },
  { k: "rouge", n: "Rougegorge", d: "Orange-rouge du jabot", c: "#FF6A3D", c2: "#FFA27F" },
  { k: "mesange", n: "Mésange bleue", d: "Bleu de la calotte", c: "#4FA8FF", c2: "#A4D0FF" },
  /* Couleurs de saison : achetables seulement pendant leur saison (mois 1-12), gardées ensuite */
  { k: "bruyere", n: "Bruyère d'automne", d: "Violet des landes · sept. à nov.", c: "#C46BD8", c2: "#E2AEEC", m: [9, 10, 11] },
  { k: "givre", n: "Givre d'hiver", d: "Bleu glacé · déc. à févr.", c: "#9FE3FF", c2: "#D4F3FF", m: [12, 1, 2] },
  { k: "aubepine", n: "Aubépine", d: "Rose de printemps · mars à mai", c: "#FF8FB8", c2: "#FFC4DA", m: [3, 4, 5] },
  { k: "loriot", n: "Loriot d'été", d: "Or chaud · juin à août", c: "#FFB21E", c2: "#FFD480", m: [6, 7, 8] }
];
const inSeason = a => !a.m || a.m.includes(new Date().getMonth() + 1);
function applyAcc() {
  const a = ACCS.find(x => x.k === S.set.acc) || ACCS[0], r = document.documentElement.style;
  if (a.k === "jaune") ["--acc", "--acc-ink", "--acc-2", "--ter", "--pop"].forEach(v => r.removeProperty(v));
  else { r.setProperty("--acc", a.c); r.setProperty("--acc-ink", a.c); r.setProperty("--acc-2", a.c2); r.setProperty("--ter", a.c); r.setProperty("--pop", a.c); }
}
applyAcc();

const SHOP = [
  { k: "joker", ic: "flame", n: "Joker de flamme", d: "Sauve ta série un jour raté.", p: 150, have: () => `${S.streak.jokers || 0}/3`, max: () => (S.streak.jokers || 0) >= 3,
    buy: () => { S.streak.jokers = (S.streak.jokers || 0) + 1; } },

];
const plumesHtml = (n, cls = "") => `<span class="plumes ${cls}">${ic("feather")}<b data-pl>${fmt(n)}</b></span>`;

VIEWS.shop = () => `<section class="view shop">
  <header class="shead"><button class="icon-btn" data-act="shopback" aria-label="Retour">${ic("back")}</button></header>
  <h1 class="stitle">Boutique</h1>
  <div class="sbal"><span class="sbal-n">${ic("feather")}<b id="sbal">${fmt(S.plumes)}</b></span><small>plumes · 1 plume pour 10 XP gagnés, et des bonus dans les coffres</small></div>
  <h2 class="ssec">Bonus</h2>
  <div class="sgrid">${SHOP.map(it => { const full = it.max && it.max(), poor = S.plumes < it.p;
    return `<div class="sitem glass" data-k="${it.k}"><span class="sic">${ic(it.ic)}</span><div class="stx"><b>${esc(it.n)}</b><small>${esc(it.d)}</small><em>${esc(it.have())}</em></div>
      <button class="sbuy" data-act="shopbuy" data-k="${it.k}" ${full || poor ? "disabled" : ""}>${full ? "Max" : `${ic("feather", "xs")}${it.p}`}</button></div>`; }).join("")}</div>
  ${cosmHtml()}
  <h2 class="ssec">Couleur de l'appli</h2>
  <div class="sgrid">${ACCS.filter(a => inSeason(a) || S.accs.includes(a.k)).map(a => { const own = S.accs.includes(a.k), on = (S.set.acc || "jaune") === a.k;
    return `<div class="sitem glass ${on ? "on" : ""}" data-k="acc-${a.k}"><span class="sdot" style="background:${a.c}"></span><div class="stx"><b>${esc(a.n)}</b><small>${esc(a.d)}</small>${a.m ? `<em>Saison</em>` : ""}</div>
      ${own ? `<button class="sbuy ghost" data-act="shopacc" data-k="${a.k}" ${on ? "disabled" : ""}>${on ? "Active" : "Choisir"}</button>`
        : `<button class="sbuy" data-act="shopbuy" data-k="acc-${a.k}" ${S.plumes < 300 ? "disabled" : ""}>${ic("feather", "xs")}300</button>`}</div>`; }).join("")}</div>
</section>`;

let SHOPFROM = "home";
function shopBuy(k) {
  const acc = k.startsWith("acc-") ? ACCS.find(a => "acc-" + a.k === k) : null, it = SHOP.find(x => x.k === k);
  const price = acc ? 300 : it?.p;
  if (!price || (!acc && !it)) return false;
  if (S.plumes < price) { toast("Pas assez de plumes"); return false; }
  if (it?.max && it.max()) return false;
  if (acc && (S.accs.includes(acc.k) || !inSeason(acc))) return false;
  const from = S.plumes;
  S.plumes -= price;
  if (acc) { S.accs.push(acc.k); S.set.acc = acc.k; applyAcc(); } else it.buy();
  save(true);
  const card = document.querySelector(`.sitem[data-k="${k}"]`);
  const calm = S.set.calm || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const done = () => { const y = window.scrollY; go("shop"); window.scrollTo(0, y); toast(acc ? `Couleur « ${acc.n} » activée` : `${it.n} : acheté`); };
  if (calm || !card) { done(); return true; }
  card.classList.add("pop");
  const el = $("#sbal"), t0 = performance.now(), dur = 600;
  const step = t => { const p = Math.min(1, (t - t0) / dur); if (el) el.textContent = fmt(Math.round(from - price * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); else setTimeout(done, 120); };
  requestAnimationFrame(step);
  return true;
}
Object.assign(ACT, {
  shop: () => { if (VIEW !== "shop") SHOPFROM = VIEW || "home"; go("shop"); },
  shopback: () => go(SHOPFROM === "shop" ? "home" : SHOPFROM),
  shopbuy: el => shopBuy(el.dataset.k),
  shopacc: el => { if (!S.accs.includes(el.dataset.k)) return; S.set.acc = el.dataset.k; applyAcc(); save(true); const y = window.scrollY; go("shop"); window.scrollTo(0, y); },
  /* Indices : un indice gratuit en stock est consommé d'abord, sans pénalité d'XP */
  hint: (orig => el => {
    const q = SES?.q, can = q && !q.done && q.hints && q.hintsUsed < q.hints.length;
    orig(el);
    if (can && S.freeHints > 0) { S.freeHints--; q.freeHints = (q.freeHints || 0) + 1; save(); }
  })(ACT.hint),
  /* Passer une étape : valide l'étape en cours avec 1 étoile */
  gskip: el => {
    const i = +el.dataset.i;
    if (!(S.skips > 0) || stepStars("grand", i) > 0 || !stepOpen(GRAND, i)) return;
    const st = (S.paths = S.paths || {}).grand = S.paths.grand || { s: {} };
    st.s[i] = 1; S.skips--; save(true);
    toast("Étape passée · 1 étoile"); rerender();
  }
});

/* En-tête de l'accueil : la pastille de plumes à côté des XP */
function homePlumes() {
  const xp = document.querySelector(".view.home .hud .pill.xp");
  if (xp && !document.querySelector(".hud .pill.pl")) xp.insertAdjacentHTML("afterend", `<button class="pill pl" data-act="shop" title="Boutique" aria-label="Boutique, ${S.plumes} plumes">${ic("feather")}<span>${fmt(S.plumes)}</span></button>`);
}
const homeMountBase = MOUNT.home;
MOUNT.home = (...a) => { homePlumes(); return homeMountBase ? homeMountBase(...a) : undefined; };
homePlumes();   /* le premier accueil est affiché avant le chargement de ce fichier */
/* Progrès : une carte vers la boutique */
const progMountBase = MOUNT.progress;
MOUNT.progress = (...a) => {
  const head = document.querySelector(".view.progress .psum");
  if (head && !document.querySelector(".pshop")) head.insertAdjacentHTML("afterend", `<button class="pshop glass" data-act="shop"><span class="sic">${ic("feather")}</span><span class="stx"><b>Boutique</b><small>${fmt(S.plumes)} plumes à dépenser</small></span>${ic("chev")}</button>`);
  return progMountBase ? progMountBase(...a) : undefined;
};
/* Parcours : sur le nœud verrouillé qui suit l'étape en cours, un bouton « Passer » si on en a */
const grandMountBase = MOUNT.grand;
MOUNT.grand = (...a) => {
  const r = grandMountBase ? grandMountBase(...a) : undefined;
  if (S.skips > 0) {
    const here = document.querySelector(".groad li.here"), nxt = here?.nextElementSibling;
    const i = +(here?.querySelector("[data-act=gstep]")?.dataset.i);
    if (nxt && nxt.classList.contains("lock") && !nxt.classList.contains("k-chest") && i >= 0)
      nxt.querySelector(".glab")?.insertAdjacentHTML("beforeend", `<button class="gskip" data-act="gskip" data-i="${i}">${ic("arrow", "xs")}Passer l'étape en cours (${S.skips})</button>`);
  }
  return r;
};

/* ---------- Cosmétiques et défi (aucun ne facilite les réponses) ---------- */
S.cos = Array.isArray(S.cos) ? S.cos : [];
const COSM = [
  /* Cadres du badge de niveau : se débloquent par palier, puis s'achètent */
  { k: "fr-bronze", g: "frame", n: "Cadre Bronze", d: "Anneau cuivré autour du niveau", p: 200, lv: 10, sw: "linear-gradient(135deg,#C9773A,#F3B27A,#8A4A1E)" },
  { k: "fr-argent", g: "frame", n: "Cadre Argent", d: "Anneau d'argent poli", p: 400, lv: 30, sw: "linear-gradient(135deg,#9AA6B2,#F4F7FA,#6B7783)" },
  { k: "fr-or", g: "frame", n: "Cadre Or", d: "Anneau d'or qui scintille", p: 800, lv: 60, sw: "conic-gradient(from 0deg,#FFCE00,#FFF4B0,#C99A00,#FFE27A,#FFCE00)" },
  /* Sons de bonne réponse */
  { k: "snd-carillon", g: "snd", n: "Carillon", d: "Trois notes de cloche claires", p: 250, ic: "wave" },
  { k: "snd-pic", g: "snd", n: "Tambour du pic", d: "Un roulement sec sur le bois", p: 250, ic: "wave" },
  { k: "snd-mesange", g: "snd", n: "Sifflet de mésange", d: "« Ti-tu, ti-tu » en sourdine", p: 250, ic: "wave" },
  /* Effet visuel */
  { k: "fx-plumes", g: "fx", n: "Pluie de plumes", d: "Des plumes s'envolent à chaque bonne réponse", p: 350, ic: "feather" }
];
const OKSND = {
  "snd-carillon": () => [1047, 1319, 1568].forEach((f, i) => tone(f, i * .08, .45, "sine", .07)),
  "snd-pic": () => [0, .06, .11, .15, .19, .22].forEach(t => tone(1900, t, .035, "square", .035, 900)),
  "snd-mesange": () => { tone(4200, 0, .11, "sine", .05, 3900); tone(3100, .14, .13, "sine", .05, 3000); tone(4200, .32, .11, "sine", .05, 3900); tone(3100, .46, .13, "sine", .05, 3000); }
};
const cosOwn = k => S.cos.includes(k);
const cosOn = it => it.g === "fx" ? !!S.set.pluie : (it.g === "frame" ? S.set.frame : S.set.okson) === it.k;
function applyFrame() {
  const h = document.documentElement;
  COSM.filter(c => c.g === "frame").forEach(c => h.classList.toggle(c.k, S.set.frame === c.k));
}
applyFrame();

/* Son de réussite : remplace les deux notes d'origine, la vibration reste */
const sfxOkBase = sfx.ok;
sfx.ok = function () {
  const f = OKSND[S.set.okson];
  if (f && S.set.sfx) { f(); buzz(12); } else sfxOkBase();
  if (S.set.pluie) featherRain();
};
function featherRain(n = 14) {
  if (S.set.calm || document.body.classList.contains("lite") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  const box = document.createElement("div"); box.className = "frain"; box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.innerHTML = ic("feather");
    s.style.cssText = `--x:${(Math.random() * 100).toFixed(1)}%;--dx:${((Math.random() - .5) * 120).toFixed(0)}px;--r:${((Math.random() - .5) * 140).toFixed(0)}deg;--d:${(Math.random() * 260).toFixed(0)}ms;--s:${(.7 + Math.random() * .7).toFixed(2)}`;
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1800);
}

/* Défis experts : 4 paliers payants, plus durs, jamais plus faciles. XP multipliée sur les bonnes réponses.
   Équilibre : une bonne réponse « écrite, expert » vaut ~25 à 35 XP ; 1 plume = 10 XP.
   Chaque palier se rembourse à peu près à mi-parcours ; un sans-faute rapporte 3 à 2 fois la mise. */
const DEFIS = [
  { t: 1, n: "Expert", m: 2, p: 20, max: 15, len: 10, timer: 10, stim: ["photo"], d: "10 oiseaux à écrire, 10 s chacun." },
  { t: 2, n: "Maître", m: 3, p: 40, max: 10, len: 15, timer: 8, stim: ["photo", "field"], d: "15 oiseaux à écrire, 8 s chacun, photos de terrain." },
  { t: 3, n: "Extrême", m: 5, p: 100, max: 5, len: 20, timer: 6, stim: ["photo", "field", "son"], d: "20 oiseaux à écrire, 6 s chacun, photos et chants." },
  { t: 4, n: "Impossible", m: 10, p: 200, max: 1, len: 20, timer: 5, stim: ["son", "field"], d: "20 oiseaux à écrire, 5 s chacun, chants et photos de terrain, toutes espèces." }
];
const DEFI_P = DEFIS[0].p;
const defiTier = t => DEFIS.find(d => d.t === +t) || DEFIS[0];
const defiN = t => { const x = S.defiX; return x && typeof x === "object" && x.day === dayKey() ? +(x.n?.[t] || 0) : 0; };
const defiLeft = t => defiTier(t).max - defiN(t);
const defiDone = (t = 1) => defiLeft(t) <= 0;
const xpForBase = xpFor;
xpFor = function (ses, q, res, ms) { const x = xpForBase(ses, q, res, ms), m = ses?.cfg?.expertX; return m && res.ok ? x * (m === true ? 2 : +m || 1) : x; };
function defiStart(t = 1) {
  const D = defiTier(t);
  if (defiDone(D.t) || S.plumes < D.p) return false;
  const x = S.defiX && typeof S.defiX === "object" && S.defiX.day === dayKey() ? S.defiX : { day: dayKey(), n: {} };
  x.n[D.t] = (x.n[D.t] || 0) + 1; S.defiX = x;
  S.plumes -= D.p; save(true);
  startSession({ kind: "quiz", expertX: D.m, title: "Défi " + D.n.toLowerCase() + " ×" + D.m, icon: "bolt", zone: S.set.zone, freq: D.t >= 4 ? "all" : D.t === 3 ? "rare" : "common", size: 150 + 100 * D.t,
    stim: D.stim, target: "species", names: S.set.names, format: "type", k: S.set.k, diff: "expert", len: D.len, timer: D.timer });
  return true;
}

function cosmHtml() {
  const L = level().n, row = it => {
    const own = cosOwn(it.k), on = own && cosOn(it), lock = it.lv && L < it.lv;
    const vis = it.g === "frame" ? `<span class="sframe ${it.k}" style="--sw:${it.sw}"><b>${L}</b></span>` : `<span class="sic">${ic(it.ic)}</span>`;
    const btn = own ? `<button class="sbuy ghost" data-act="cosuse" data-k="${it.k}">${on ? (it.g === "fx" ? "Activé" : "Actif") : (it.g === "snd" ? "Choisir" : "Activer")}</button>`
      : lock ? `<button class="sbuy" disabled>${ic("lock", "xs")}Niv. ${it.lv}</button>`
      : `<button class="sbuy" data-act="cosbuy" data-k="${it.k}" ${S.plumes < it.p ? "disabled" : ""}>${ic("feather", "xs")}${it.p}</button>`;
    return `<div class="sitem glass ${on ? "on" : ""}" data-k="${it.k}">${vis}<div class="stx"><b>${esc(it.n)}</b><small>${esc(it.d)}</small>${it.g === "snd" && own ? `<em data-act="costry" data-k="${it.k}" role="button">Écouter</em>` : ""}</div>${btn}</div>`;
  }, grp = g => COSM.filter(c => c.g === g).map(row).join("");
  const dfi = DEFIS.map(D => { const left = defiLeft(D.t), dd = left <= 0;
    return `<div class="sitem glass sdefi t${D.t} ${dd ? "done" : ""}" data-k="defi${D.t}"><span class="sic">${ic("bolt")}</span><div class="stx"><b>${D.n} <span class="xm">×${D.m} XP</span></b><small>${esc(D.d)}</small><em>${dd ? "Plus d'essai aujourd'hui" : `Encore ${left} essai${left > 1 ? "s" : ""} aujourd'hui (${D.max} par jour)`}</em></div>
    <button class="sbuy" data-act="shopdefi" data-t="${D.t}" ${dd || S.plumes < D.p ? "disabled" : ""}>${dd ? "Fait" : `${ic("feather", "xs")}${D.p}`}</button></div>`; }).join("");
  return `<h2 class="ssec">Défis experts</h2>
  <div class="sgrid">${dfi}</div>
  <h2 class="ssec">Cadres de niveau</h2><div class="sgrid">${grp("frame")}</div>
  <h2 class="ssec">Sons et effets</h2><div class="sgrid">${grp("snd")}${grp("fx")}</div>`;
}
function cosBuy(k) {
  const it = COSM.find(c => c.k === k);
  if (!it || cosOwn(k) || (it.lv && level().n < it.lv)) return false;
  if (S.plumes < it.p) { toast("Pas assez de plumes"); return false; }
  S.plumes -= it.p; S.cos.push(k); cosUse(k, true); save(true);
  const y = window.scrollY; go("shop"); window.scrollTo(0, y);
  document.querySelector(`.sitem[data-k="${k}"]`)?.classList.add("pop");
  toast(`${it.n} : acheté`);
  return true;
}
function cosUse(k, force) {
  const it = COSM.find(c => c.k === k); if (!it || !cosOwn(k)) return;
  if (it.g === "frame") S.set.frame = S.set.frame === k && !force ? "" : k;
  else if (it.g === "snd") { S.set.okson = S.set.okson === k && !force ? "" : k; if (S.set.okson && S.set.sfx) OKSND[k](); }
  else S.set.pluie = force ? true : !S.set.pluie;
  applyFrame();
  if (it.g === "fx" && S.set.pluie) featherRain();
}
Object.assign(ACT, {
  cosbuy: el => cosBuy(el.dataset.k),
  cosuse: el => { cosUse(el.dataset.k); save(true); const y = window.scrollY; go("shop"); window.scrollTo(0, y); },
  costry: el => { unlockAudio(); OKSND[el.dataset.k]?.(); },
  shopdefi: el => { const t = +el.dataset.t || 1; if (!defiStart(t)) toast(defiDone(t) ? "Plus d'essai aujourd'hui pour ce défi" : "Pas assez de plumes"); }
});
