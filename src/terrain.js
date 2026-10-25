/* ============================================================
   Plumage — hors ligne : l'appli s'ouvre sans réseau (service worker, voir sw.js)
   et un « pack terrain » garde la liste d'une sortie et ses photos sur le téléphone.
   ============================================================ */
const PACKC = "plumage-pack";
const PK = { run: false, done: 0, total: 0, tok: 0 };
const packKey = (z, m, rec) => `${zoneKey(z)}|${rec ? "r" : m}`;
const packOf = () => S.pack || null;
const packMatches = () => { const p = packOf(); return !!p && p.k === packKey(tripZone(), TRIP.m, TRIP.rec); };
const packExpand = p => (p?.list || []).map(([id, sci, fr, sq, md, c]) => ({ id, sci, fr, a: [], c, img: sq || md ? { sq, md, attr: "", lic: "" } : null }));
/* Télécharge les photos de la liste (vignette + taille moyenne) dans le cache du téléphone */
async function packDownload() {
  const T = TRIP;
  if (PK.run || !T.list || !T.list.length) return;
  if (!("caches" in window)) { toast("Ce navigateur ne sait pas garder les photos hors ligne."); return; }
  const list = T.list.slice(0, 150), tok = ++PK.tok;
  const urls = [...new Set(list.flatMap(t => [t.img?.sq, t.img?.md].filter(Boolean)))];
  Object.assign(PK, { run: true, done: 0, total: urls.length });
  packUi();
  let fail = 0;
  try {
    const cache = await caches.open(PACKC);
    const one = async u => {
      try {
        let res = await fetch(u, { mode: "cors", cache: "no-store" }).catch(() => null);
        if (!res || !res.ok) res = await fetch(u, { mode: "no-cors", cache: "no-store" });
        await cache.put(u, res);
      } catch (e) { fail++; }
      PK.done++; if (PK.done % 4 === 0 || PK.done === PK.total) packUi();
    };
    const q = urls.slice();
    await Promise.all(Array.from({ length: 4 }, async () => { while (q.length && tok === PK.tok) await one(q.shift()); }));
  } catch (e) { fail = urls.length; }
  if (tok !== PK.tok) return;
  PK.run = false;
  if (fail > urls.length / 2) { toast("Téléchargement interrompu (réseau ?). Réessaie avec une meilleure connexion."); packUi(); return; }
  const z = tripZone();
  S.pack = { k: packKey(z, T.m, T.rec), z, place: zoneLabel(z), m: T.m, rec: T.rec, at: Date.now(), n: list.length, list: list.map(t => [t.id, t.sci, t.fr || "", t.img?.sq || "", t.img?.md || "", t.c || 0]) };
  save(true);
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch (e) { /* rien */ }
  toast(`Prêt hors ligne : ${list.length} espèces et leurs photos.`);
  packUi();
}
async function packDelete() {
  PK.tok++; PK.run = false;
  try { await caches.delete(PACKC); } catch (e) { /* rien */ }
  S.pack = null; save(true);
  toast("Pack terrain supprimé.");
  rerender();
}
function packBtnHtml() {
  if (PK.run) return `<button class="btn ghost pkbtn run" data-act="tpack" disabled><span class="spin"></span>${PK.done}/${PK.total}</button>`;
  if (packMatches()) return `<button class="btn ghost pkbtn ok" data-act="tpack" aria-label="Pack hors ligne prêt">${ic("check")}Hors ligne</button>`;
  return `<button class="btn ghost pkbtn" data-act="tpack" aria-label="Garder pour le terrain, sans réseau">${ic("down")}Hors ligne</button>`;
}
function packUi() { const b = $(".pkbtn"); if (b) b.outerHTML = packBtnHtml(); }
/* Sans réseau : la liste du pack, si c'est la même sortie (ou sur demande) */
function packFallback(force) {
  const p = packOf();
  if (!p || (!force && !packMatches())) return false;
  TRIP.list = packExpand(p); TRIP.err = ""; TRIP.recent = null; TRIP.offline = true;
  return true;
}
function packSettingsHtml() {
  const p = packOf();
  return `<div class="sec">${ic("down")}Hors ligne</div>
  <div class="group">
    <div class="set"><span class="lab"><b>${p ? `Pack terrain : ${esc(p.place)}` : "Aucun pack terrain"}</b><small>${p ? `${p.n} espèces avec photos · ${p.rec ? "en ce moment" : MONTHS_LONG[p.m - 1]} · ${esc(ago(p.at))}. Sans réseau : liste « Sur place » et quiz de sortie.` : "Dans « Préparer une sortie », touche « Hors ligne » pour garder la liste et ses photos avant de partir."}</small></span>${p ? `<button class="icon-btn" data-act="pkdel" aria-label="Supprimer le pack">${ic("trash")}</button>` : ""}</div>
    <div class="set"><span class="lab"><b>L'appli s'ouvre sans réseau</b><small>Une fois ouverte une première fois, elle reste disponible hors ligne. Photos et sons des autres quiz demandent du réseau.</small></span></div>
  </div>`;
}
