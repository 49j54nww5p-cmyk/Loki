/* ============================================================
   Plumage — personnaliser son profil (idée de Nohan)
   Emblèmes et cadres de profil, un par groupe : ils se débloquent avec le niveau
   dans le groupe, s'achètent en plumes, et se voient sur le profil, le bouton
   Profil et chez les amis.
   ============================================================ */
S.pcos = Array.isArray(S.pcos) ? S.pcos : [];
const EMB_P = 150, EMB_LV = 5, PFR_P = 400, PFR_LV = 15;
/* Motif de chaque cadre, dans la couleur du groupe */
const PFRAME = {
  3: "repeating-conic-gradient(#FFCE00 0 12deg, #7A5A00 12deg 24deg)",
  47126: "repeating-conic-gradient(#5FD068 0 18deg, #1E5A26 18deg 22deg, #9BE37F 22deg 36deg)",
  47158: "repeating-conic-gradient(#FF9A3C 0 20deg, #3A2208 20deg 30deg)",
  47170: "radial-gradient(circle at 30% 30%, #E8D3B5 0 12%, transparent 13%), radial-gradient(circle at 70% 65%, #E8D3B5 0 10%, transparent 11%), conic-gradient(#C8A27A, #7A5532, #C8A27A)",
  40151: "repeating-conic-gradient(#E9B872 0 25deg, #6E4F22 25deg 32deg)",
  26036: "repeating-conic-gradient(#9BD45F 0 10deg, #3E6219 10deg 14deg, #C3EB8F 14deg 20deg)",
  20978: "conic-gradient(#3BE59D, #13774D, #3BE59D, #9DF5CC, #3BE59D)",
  47178: "repeating-radial-gradient(circle, #3D9BFF 0 3px, #1C5BA6 3px 6px)",
  47119: "repeating-conic-gradient(#B18CFF 0 4deg, #241A3A 4deg 45deg)",
  47115: "repeating-radial-gradient(circle, #FF8FB1 0 2px, #A83C63 2px 5px, #FFD3E2 5px 7px)"
};
const pcosOwn = k => S.pcos.includes(k);
const grpOf = id => GROUPS.find(g => g.id === +id);
const gLevel = id => level(undefined, +id).n;

/* L'avatar : initiale ou emblème, avec ou sans cadre (pour moi ou pour un ami) */
function avatarHtml(o, cls = "") {
  const u = okImg(o.pu);
  if (u) { const k = Math.max(0, Math.min(3, +o.pr || 0)); return `<span class="pav fr ph r${k} ${cls}" title="${esc(o.ps || "")}"><span class="pin" style="background-image:url('${u}')"></span></span>`; }
  const E = o.e ? grpOf(o.e) : null, F = o.f ? grpOf(o.f) : null;
  const inner = E ? ic(E.ic) : (o.n ? esc(String(o.n).slice(0, 1).toUpperCase()) : ic("user"));
  return `<span class="pav ${F ? "fr" : ""} ${cls}"${F ? ` style="background:${PFRAME[F.id]}"` : ""}><span class="pin"${E ? ` style="background:color-mix(in srgb, ${E.c} 22%, #121212);color:${E.c}"` : ""}>${inner}</span></span>`;
}
function myAvatar(cls) { const p = myPh(); return avatarHtml({ n: cleanName(S.set.pseudo), e: S.set.emb, f: S.set.pfr, pu: p && p.u, pr: p && p.r, ps: p && p.s }, cls); }

/* La section de la boutique */
function pcosHtml() {
  const row = (g, kind) => {
    const k = kind + ":" + g.id, own = pcosOwn(k), lv = kind === "emb" ? EMB_LV : PFR_LV, p = kind === "emb" ? EMB_P : PFR_P;
    const on = own && (kind === "emb" ? +S.set.emb === g.id : +S.set.pfr === g.id), lock = gLevel(g.id) < lv;
    const vis = kind === "emb" ? `<span class="pav sm"><span class="pin" style="background:color-mix(in srgb, ${g.c} 22%, #121212);color:${g.c}">${ic(g.ic)}</span></span>`
      : `<span class="pav sm fr" style="background:${PFRAME[g.id]}"><span class="pin">${esc((cleanName(S.set.pseudo) || "?").slice(0, 1).toUpperCase())}</span></span>`;
    const btn = own ? `<button class="sbuy ghost" data-act="pcosuse" data-k="${k}">${on ? "Porté" : "Porter"}</button>`
      : lock ? `<button class="sbuy" disabled>${ic("lock", "xs")}Niv. ${lv}</button>`
      : `<button class="sbuy" data-act="pcosbuy" data-k="${k}" ${S.plumes < p ? "disabled" : ""}>${ic("feather", "xs")}${p}</button>`;
    return `<div class="sitem glass ${on ? "on" : ""}" data-k="${k}">${vis}<div class="stx"><b>${kind === "emb" ? "Emblème" : "Cadre"} ${esc(g.n.toLowerCase())}</b><small>${lock && !own ? `Niveau ${lv} en ${esc(g.n.toLowerCase())} (tu es niv. ${gLevel(g.id)})` : kind === "emb" ? "Remplace ton initiale, partout" : "Autour de ton profil, vu par tes amis"}</small></div>${btn}</div>`;
  };
  /* les groupes où on a le plus d'XP d'abord */
  const G = GROUPS.slice().sort((a, b) => gxp(b.id) - gxp(a.id));
  return `<h2 class="ssec">Ton profil</h2>
  <p class="muted" style="margin:-4px 2px 10px;font-size:13px">Emblèmes et cadres de chaque groupe : monte de niveau dans le groupe pour les débloquer. Tes amis les voient.</p>
  <div class="sgrid">${G.map(g => row(g, "emb")).join("")}</div>
  <div class="sgrid" style="margin-top:10px">${G.map(g => row(g, "pfr")).join("")}</div>`;
}
const shopViewBase = VIEWS.shop;
VIEWS.shop = (...a) => shopViewBase(...a).replace('<h2 class="ssec">Défis experts</h2>', pcosHtml() + '<h2 class="ssec">Défis experts</h2>');

function pcosBuy(k) {
  const [kind, id] = k.split(":"), g = grpOf(id); if (!g || pcosOwn(k)) return;
  const p = kind === "emb" ? EMB_P : PFR_P, lv = kind === "emb" ? EMB_LV : PFR_LV;
  if (gLevel(g.id) < lv) { toast(`Niveau ${lv} en ${g.n.toLowerCase()} d'abord`); return; }
  if (S.plumes < p) { toast("Pas assez de plumes"); return; }
  S.plumes -= p; S.pcos.push(k); pcosUse(k, true); save(true);
  const y = window.scrollY; go("shop"); window.scrollTo(0, y);
  document.querySelector(`.sitem[data-k="${k}"]`)?.classList.add("pop");
  toast(`${kind === "emb" ? "Emblème" : "Cadre"} ${g.n.toLowerCase()} : acheté et porté`);
}
function pcosUse(k, force) {
  const [kind, id] = k.split(":"); if (!pcosOwn(k)) return;
  const key = kind === "emb" ? "emb" : "pfr";
  S.set[key] = +S.set[key] === +id && !force ? 0 : +id;
  if (typeof navMe === "function") navMe();
  if (typeof profPush === "function") profPush(true).catch(() => {});
}
ACT.pcosbuy = el => pcosBuy(el.dataset.k);
ACT.pcosuse = el => { pcosUse(el.dataset.k); save(true); const y = window.scrollY; go("shop"); window.scrollTo(0, y); };

/* ============================================================
   Cadres de maîtrise : chaque espèce maîtrisée (3 étoiles) donne un cadre avec
   sa photo. L'anneau dit sa rareté en France (observations iNaturalist).
   ============================================================ */
S.rar = S.rar && typeof S.rar === "object" ? S.rar : {};
const RTIERS = [
  { k: 3, n: "Légendaire", max: 300 },
  { k: 2, n: "Rare", max: 2000 },
  { k: 1, n: "Peu commune", max: 15000 },
  { k: 0, n: "Commune", max: Infinity }
];
const rTier = c => c == null ? null : RTIERS.find(t => c < t.max);
const okImg = u => typeof u === "string" && /^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\/[\w\/.-]+$/.test(u) ? u : "";
const mastersList = () => Object.entries(S.sp).filter(([, r]) => stars(r) === 3 && r.img).map(([id, r]) => ({ id: +id, r, c: S.rar[id] ? S.rar[id].c : null }));
let RARP = null;
/* Va chercher le nombre d'observations en France des espèces maîtrisées (rafraîchi chaque semaine) */
function rarLoad() {
  const old = Date.now() - 7 * 864e5;
  const ids = mastersList().filter(m => !S.rar[m.id] || S.rar[m.id].t < old).map(m => m.id);
  if (!ids.length || RARP) return RARP || Promise.resolve(false);
  RARP = (async () => {
    for (let i = 0; i < ids.length; i += 30) {
      const ch = ids.slice(i, i + 30);
      try {
        const d = await inat("/observations/species_counts", { taxon_id: ch.join(","), place_id: 6753, verifiable: "true", per_page: 200 });
        const got = new Map((d.results || []).map(x => [x.taxon && x.taxon.id, x.count]));
        for (const id of ch) S.rar[id] = { c: got.get(id) || 0, t: Date.now() };
      } catch (e) { break; }
    }
    save(); RARP = null; return true;
  })();
  return RARP;
}
function myPh() {
  const id = +S.set.pph, r = id && S.sp[id];
  if (!r || stars(r) !== 3 || !r.img) return null;
  const t = rTier(S.rar[id] ? S.rar[id].c : null);
  return { u: okImg(r.img), s: r.fr || r.sci, r: t ? t.k : 0 };
}
function mcadHtml() {
  const L = mastersList().sort((a, b) => (a.c ?? 1e9) - (b.c ?? 1e9));
  const on = +S.set.pph;
  const rare = L.filter(m => m.c != null && m.c < 2000).length;
  if (!L.length) return `<h2 class="ssec">Cadres de maîtrise</h2>
  <div class="mcempty glass">${avatarHtml({ pu: "", n: "?" }, "sm")}<p>Maîtrise une espèce (3 étoiles) pour gagner un cadre avec sa photo. Plus l'espèce est rare en France, plus le cadre brille.</p></div>`;
  return `<h2 class="ssec">Cadres de maîtrise</h2>
  <p class="muted" style="margin:-4px 2px 10px;font-size:13px">Une espèce maîtrisée, un cadre avec sa photo. Plus elle est rare en France, plus il brille${rare ? ` · tu en as ${rare} rare${rare > 1 ? "s" : ""}` : ""}.</p>
  <div class="mcgrid">${L.map(m => {
    const t = rTier(m.c);
    return `<button class="mcad ${on === m.id ? "on" : ""}" data-act="mcaduse" data-id="${m.id}">${avatarHtml({ pu: m.r.img, pr: t ? t.k : 0, ps: m.r.fr || m.r.sci })}<b>${esc(m.r.fr || m.r.sci)}</b><small class="rt r${t ? t.k : 0}">${t ? t.n : "…"}</small></button>`;
  }).join("")}</div>
  ${on ? `<button class="sbuy ghost mcoff" data-act="mcadoff">Retirer le cadre de maîtrise</button>` : ""}`;
}
const shopViewPc = VIEWS.shop;
VIEWS.shop = (...a) => shopViewPc(...a).replace('<h2 class="ssec">Ton profil</h2>', mcadHtml() + '<h2 class="ssec">Ton profil</h2>');
function mcadRefresh() {
  const y = window.scrollY;
  if (VIEW === "shop") { go("shop"); window.scrollTo(0, y); }
}
const goPc = go;
go = function (v, ...a) { const r = goPc(v, ...a); if (v === "shop") rarLoad().then(ch => { if (ch) mcadRefresh(); }); return r; };
ACT.mcaduse = el => {
  const id = +el.dataset.id; S.set.pph = +S.set.pph === id ? 0 : id; save(true);
  if (typeof navMe === "function") navMe();
  if (typeof profPush === "function") profPush(true).catch(() => {});
  const r = S.sp[id]; mcadRefresh();
  if (S.set.pph) toast(`Cadre ${r ? (r.fr || r.sci) : ""} porté`);
};
ACT.mcadoff = () => { S.set.pph = 0; save(true); if (typeof navMe === "function") navMe(); if (typeof profPush === "function") profPush(true).catch(() => {}); mcadRefresh(); };
