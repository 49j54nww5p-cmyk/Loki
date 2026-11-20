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
  const E = o.e ? grpOf(o.e) : null, F = o.f ? grpOf(o.f) : null;
  const inner = E ? ic(E.ic) : (o.n ? esc(String(o.n).slice(0, 1).toUpperCase()) : ic("user"));
  return `<span class="pav ${F ? "fr" : ""} ${cls}"${F ? ` style="background:${PFRAME[F.id]}"` : ""}><span class="pin"${E ? ` style="background:color-mix(in srgb, ${E.c} 22%, #121212);color:${E.c}"` : ""}>${inner}</span></span>`;
}
const myAvatar = cls => avatarHtml({ n: cleanName(S.set.pseudo), e: S.set.emb, f: S.set.pfr }, cls);

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
