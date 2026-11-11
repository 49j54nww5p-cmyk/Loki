/* ---------- L'oiseau du jour en vidéo ----------
   Sources (appelées depuis le navigateur, sans clé, CORS « origin=* ») :
   1. Wikidata, propriété P10 « vidéo » du taxon (trouvé par P225 = nom scientifique) : choix éditorial.
   2. Recherche Wikimedia Commons : filetype:video intitle:"<nom scientifique>".
   On ne lit jamais l'original (jusqu'à 300 Mo) : seulement les transcodages 480p/240p (webm VP9) et 360p (mov, iOS ancien).
   Pas de vidéo trouvée : pas de carte (aucun repli factice). Voir NOTES.md. */
const VID_API = "https://commons.wikimedia.org/w/api.php";
const VID_WD = "https://www.wikidata.org/w/api.php";
const VID_TTL = 7 * 864e5, VID_MISS_TTL = 2 * 864e5, VID_TRIES = 4, VID_MAX = 300;
const VID_IC = {
  on: `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`,
  off: `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>`,
  play: `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>`,
  pause: `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>`
};

/* ---- cache local (best effort) ---- */
function vidCacheGet(sci) {
  try { const r = JSON.parse(localStorage.getItem("plumage.vid." + sci) || "null"); if (r && Date.now() - r.t < (r.v ? VID_TTL : VID_MISS_TTL)) return r; } catch (e) { }
  return null;
}
function vidCacheSet(sci, v) { try { localStorage.setItem("plumage.vid." + sci, JSON.stringify({ t: Date.now(), v })); } catch (e) { } }

async function vidJson(base, params, ms = 9000) {
  const u = new URL(base);
  Object.entries({ format: "json", formatversion: "2", origin: "*", ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(u, { signal: ac.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
  finally { clearTimeout(tm); }
}
const vidStrip = h => { const d = document.createElement("div"); d.innerHTML = String(h || ""); return (d.textContent || "").replace(/\s+/g, " ").trim(); };

/* une page Commons (prop=videoinfo) -> vidéo exploitable ou null */
function vidPick(page) {
  const v = page?.videoinfo?.[0] || page?.imageinfo?.[0];
  if (!v) return null;
  if (!/^video\/|^application\/ogg/.test(v.mime || "")) return null;
  const dur = +v.duration || 0;
  if (dur && (dur < 3 || dur > VID_MAX)) return null;
  const der = (v.derivatives || []).filter(d => d && d.src && /^video\//.test(d.type || ""));
  const key = d => d.transcodekey || (d.src.match(/\.(\d+p\.[\w.]+)$/) || [])[1] || "";
  const rank = ["480p.vp9.webm", "360p.vp9.webm", "240p.vp9.webm", "360p.webm", "480p.webm", "360p.mpeg4.mov"];
  const srcs = der.filter(d => rank.includes(key(d))).sort((a, b) => rank.indexOf(key(a)) - rank.indexOf(key(b)))
    .map(d => ({ src: d.src, type: d.type || "" }));
  if (!srcs.length) return null; /* pas de transcodage léger : on ne charge pas un original de plusieurs dizaines de Mo */
  const md = v.extmetadata || {};
  const lic = vidStrip(md.LicenseShortName?.value);
  if (!lic) return null; /* crédit + licence obligatoires */
  return {
    title: (page.title || "").replace(/^File:/, ""),
    srcs,
    poster: v.thumburl || "",
    author: vidStrip(md.Artist?.value) || "Auteur inconnu",
    license: lic,
    licenseUrl: md.LicenseUrl?.value || "",
    page: v.descriptionurl || "",
    dur
  };
}
const VID_PROPS = { prop: "videoinfo", viprop: "url|mime|size|derivatives|extmetadata", viextmetadatafilter: "Artist|LicenseShortName|LicenseUrl", viurlwidth: "640" };

/* 1. Wikidata P10 : vidéo choisie pour le taxon */
async function vidWikidata(sci) {
  const s = await vidJson(VID_WD, { action: "query", list: "search", srsearch: `haswbstatement:"P225=${sci}"`, srlimit: "1", srprop: "" });
  const qid = s?.query?.search?.[0]?.title;
  if (!/^Q\d+$/.test(qid || "")) return null;
  const e = await vidJson(VID_WD, { action: "wbgetclaims", entity: qid, property: "P10" });
  const files = (e?.claims?.P10 || []).map(c => c?.mainsnak?.datavalue?.value).filter(x => typeof x === "string").slice(0, 5);
  if (!files.length) return null;
  const d = await vidJson(VID_API, { action: "query", titles: files.map(f => "File:" + f).join("|"), ...VID_PROPS });
  for (const p of d?.query?.pages || []) { const v = vidPick(p); if (v) return { ...v, via: "Wikidata" }; }
  return null;
}
/* 2. recherche Commons */
async function vidCommons(sci) {
  const d = await vidJson(VID_API, { action: "query", generator: "search", gsrsearch: `filetype:video intitle:"${sci}"`, gsrnamespace: "6", gsrlimit: "12", ...VID_PROPS });
  const pages = (d?.query?.pages || []).slice().sort((a, b) => (a.index || 0) - (b.index || 0));
  const ok = pages.map(vidPick).filter(Boolean);
  /* les plans courts bouclent mieux */
  ok.sort((a, b) => ((a.dur || 60) > 90) - ((b.dur || 60) > 90));
  return ok[0] ? { ...ok[0], via: "Wikimedia Commons" } : null;
}
const VID_SOURCES = [vidWikidata, vidCommons];

async function vidFind(t) {
  const sci = t?.sci;
  if (!sci) return null;
  const c = vidCacheGet(sci);
  if (c) return c.v;
  let v = null, failed = false;
  for (const src of VID_SOURCES) {
    try { v = await src(sci); } catch (e) { failed = true; }
    if (v) break;
  }
  if (v || !failed) vidCacheSet(sci, v); /* une panne réseau ne doit pas être mémorisée comme « pas de vidéo » */
  return v;
}

/* lecture auto seulement si rien ne s'y oppose */
function vidAutoOk() {
  try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false; } catch (e) { }
  if (navigator.connection?.saveData) return false;
  return true;
}

function vidCard(t, v, own) {
  return `<figure class="vidc" id="vidc" aria-label="Vidéo : ${esc(nameFr(t))}">
  <div class="vid-box">
    <video id="vidv" muted loop playsinline webkit-playsinline preload="none" disablepictureinpicture ${v.poster ? `poster="${esc(v.poster)}"` : ""}>${v.srcs.map(s => `<source src="${esc(s.src)}" type="${esc(s.type)}">`).join("")}</video>
    <span class="vid-tag">${own ? "L'oiseau du jour en vidéo" : "En vidéo aujourd'hui"}</span>
    <button class="vid-play" data-act="vidplay" aria-label="Lire la vidéo">${VID_IC.play}</button>
    <button class="vid-snd" data-act="vidsnd" aria-pressed="false" aria-label="Activer le son">${VID_IC.off}</button>
  </div>
  <figcaption><b>${esc(nameFr(t))}</b>${t.fr ? ` <em>${esc(t.sci)}</em>` : ""}
    <small class="vid-cr">Vidéo : ${esc(v.author)} · ${v.licenseUrl ? `<a href="${esc(v.licenseUrl)}" target="_blank" rel="noopener">${esc(v.license)}</a>` : esc(v.license)} · ${v.page ? `<a href="${esc(v.page)}" target="_blank" rel="noopener">${esc(v.via)}</a>` : esc(v.via)}</small></figcaption>
</figure>`;
}

const VIDST = { io: null, want: false };
function vidState() {
  const f = $("#vidc"), el = $("#vidv");
  if (!f || !el) return;
  const playing = !el.paused;
  f.classList.toggle("playing", playing);
  const p = f.querySelector(".vid-play");
  if (p) { p.innerHTML = playing ? VID_IC.pause : VID_IC.play; p.setAttribute("aria-label", playing ? "Mettre en pause" : "Lire la vidéo"); }
  const s = f.querySelector(".vid-snd");
  if (s) { s.innerHTML = el.muted ? VID_IC.off : VID_IC.on; s.setAttribute("aria-pressed", String(!el.muted)); s.setAttribute("aria-label", el.muted ? "Activer le son" : "Couper le son"); }
}
function vidPlay(el) { const p = el.play(); if (p && p.catch) p.catch(() => vidState()); }

/* t = oiseau du jour, pool = espèces candidates (même ordre pour tout le monde ce jour-là) */
async function vidOtd(t, pool) {
  const anchor = $(".view.home .story");
  if (!anchor || $("#vidc")) return;
  const seen = new Set([t.sci]), rest = [];
  const start = hashStr("vid" + dayKey()) % Math.max(1, pool.length);
  for (let i = 0; i < pool.length && rest.length < VID_TRIES - 1; i++) { const c = pool[(start + i) % pool.length]; if (c?.sci && !seen.has(c.sci)) { seen.add(c.sci); rest.push(c); } }
  let got = null;
  for (const c of [t, ...rest]) {
    const v = await vidFind(c);
    if (VIEW !== "home" || !anchor.isConnected) return;
    if (v) { got = { t: c, v }; break; }
  }
  if (!got) return; /* aucune vidéo réelle : rien à afficher */
  anchor.insertAdjacentHTML("afterend", vidCard(got.t, got.v, got.t === t));
  const f = $("#vidc"), el = $("#vidv");
  let fails = 0;
  const srcN = el.querySelectorAll("source").length;
  el.querySelectorAll("source").forEach(s => s.addEventListener("error", () => { if (++fails >= srcN) f.remove(); }));
  el.addEventListener("error", () => f.remove());
  ["play", "pause", "volumechange"].forEach(ev => el.addEventListener(ev, vidState));
  VIDST.want = vidAutoOk();
  f.classList.toggle("still", !VIDST.want);
  if (VIDST.io) VIDST.io.disconnect();
  if ("IntersectionObserver" in window) {
    VIDST.io = new IntersectionObserver(es => es.forEach(e => {
      if (!el.isConnected) return VIDST.io.disconnect();
      if (e.isIntersecting && VIDST.want) { el.preload = "auto"; vidPlay(el); }
      else if (!e.isIntersecting && !el.paused) el.pause();
    }), { threshold: 0.35 });
    VIDST.io.observe(f);
  } else if (VIDST.want) { el.preload = "auto"; vidPlay(el); }
  vidState();
}
document.addEventListener("visibilitychange", () => { const el = $("#vidv"); if (el && document.hidden && !el.paused) el.pause(); });

Object.assign(ACT, {
  vidplay: () => {
    const el = $("#vidv"); if (!el) return;
    if (el.paused) { VIDST.want = true; el.preload = "auto"; vidPlay(el); $("#vidc")?.classList.remove("still"); }
    else { VIDST.want = false; el.pause(); }
  },
  vidsnd: () => {
    const el = $("#vidv"); if (!el) return;
    el.muted = !el.muted;
    if (!el.muted && el.paused) { VIDST.want = true; el.preload = "auto"; vidPlay(el); $("#vidc")?.classList.remove("still"); }
    vidState();
  }
});
