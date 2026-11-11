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
  { k: "mesange", n: "Mésange bleue", d: "Bleu de la calotte", c: "#4FA8FF", c2: "#A4D0FF" }
];
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
  <h2 class="ssec">Couleur de l'appli</h2>
  <div class="sgrid">${ACCS.map(a => { const own = S.accs.includes(a.k), on = (S.set.acc || "jaune") === a.k;
    return `<div class="sitem glass ${on ? "on" : ""}" data-k="acc-${a.k}"><span class="sdot" style="background:${a.c}"></span><div class="stx"><b>${esc(a.n)}</b><small>${esc(a.d)}</small></div>
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
  if (acc && S.accs.includes(acc.k)) return false;
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
