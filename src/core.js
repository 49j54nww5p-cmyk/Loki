"use strict";
/* ============================================================
   Plumage — cœur : utilitaires, stockage, API, taxonomie, médias
   ============================================================ */

/* ---------- Utilitaires ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
const sample = (a, n) => shuffle(a).slice(0, n);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DAY = 864e5;
const pad = n => String(n).padStart(2, "0");
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNum = k => { const [y, m, d] = k.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };
const todayNum = () => dayNum(dayKey());
const keyOfNum = n => { const d = new Date(n * DAY); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
const fmt = n => Math.round(n || 0).toLocaleString("fr-FR");
const ic = (id, cls = "") => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const norm = s => String(s || "").toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae").normalize("NFD")
  .replace(/[̀-ͯ]/g, "").replace(/[’'`´\-_.,;:()]/g, " ").replace(/\s+/g, " ").trim();
function lev(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const chunks = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const dateFr = (d = new Date()) => d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

/* ---------- Stockage ---------- */
const KEY = "plumage.v1";
const defaults = () => ({
  v: 2, created: Date.now(), xp: 0,
  streak: { cur: 0, best: 0, last: null, jokers: 1 },
  days: {}, sp: {}, fam: {}, stats: {}, badges: {}, counters: {},
  best: { combo: 0 }, favs: [], att: [], obs: [], trips: [], bk: { last: 0, snooze: 0 }, hint: { install: 0 }, hand: { ex: {}, sp: {} },
  set: {
    zone: { id: 6753, name: "France" }, fmt: "qcm", names: "both", k: 5, diff: "moyen", photo: "ref",
    goal: 150, sfx: true, calm: false, sono: true, inat: "", xc: "", remind: "19:30", builder: null,
    mapst: "relief", mapLab: true, mapIsl: true, slow: false, loop: false, pnum: "fr"
  }
});
function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw), d = defaults();
      return { ...d, ...o, set: { ...d.set, ...(o.set || {}) }, streak: { ...d.streak, ...(o.streak || {}) }, best: { ...d.best, ...(o.best || {}) }, counters: { ...(o.counters || {}) } };
    }
  } catch (e) { /* stockage indisponible */ }
  return defaults();
}
let S = loadState();
let saveTimer = 0;
function save(now) {
  clearTimeout(saveTimer);
  const go = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) {
      purgeCache(0);
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e2) { toast("Stockage plein : exporte ta progression dans Réglages."); }
    }
  };
  if (now) go(); else saveTimer = setTimeout(go, 300);
}
/* v2 : la maîtrise demande des photos différentes. Les anciennes réussites comptent pour 2 photos au plus. */
function migrate() {
  if ((S.v || 1) >= 2) return;
  for (const r of Object.values(S.sp)) {
    if (r.pk) continue;
    r.pk = []; r.fk = []; r.sk = [];
    r.lg = Math.min(2, r.ok || 0);
    const days = [];
    if ((r.ok || 0) >= 2 && r.first) days.push(dayNum(r.first));
    if (r.lastOk) days.push(dayNum(r.lastOk));
    r.od = [...new Set(days)];
  }
  S.v = 2;
  save();
}
migrate();
document.addEventListener("visibilitychange", () => { if (document.hidden) save(true); });
window.addEventListener("pagehide", () => save(true));

function today() { const k = dayKey(); return S.days[k] || (S.days[k] = { xp: 0, q: 0, ok: 0, serie: 0 }); }
function count(k, n = 1) { S.counters[k] = (S.counters[k] || 0) + n; }
function bump(cat, ok) { const s = S.stats[cat] || (S.stats[cat] = { n: 0, ok: 0 }); s.n++; if (ok) s.ok++; }

/* ---------- Effets sonores & vibrations ---------- */
let AC = null;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === "suspended") AC.resume().catch(() => {});
  return AC;
}
function tone(freq, t0, dur, type = "sine", vol = .1, glide) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
}
const sfx = {
  ok() { if (S.set.sfx) { tone(880, 0, .12); tone(1320, .07, .2); } buzz(12); },
  bad() { if (S.set.sfx) tone(250, 0, .24, "triangle", .09, 150); buzz([20, 40, 20]); },
  lvl() { if (S.set.sfx) [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .09, .24, "sine", .09)); buzz([15, 30, 15, 30, 40]); },
  combo() { if (S.set.sfx) tone(1568, 0, .12, "sine", .05); }
};
function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* non pris en charge */ } }

/* ---------- Cache local ---------- */
const CPRE = "pl.c:";
function cacheGet(k, ttl) {
  try { const raw = localStorage.getItem(CPRE + k); if (!raw) return null; const o = JSON.parse(raw); return Date.now() - o.t > ttl ? null : o.d; }
  catch (e) { return null; }
}
function cacheKeys() {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(CPRE)) out.push(k); } } catch (e) { /* rien */ }
  return out;
}
function purgeCache(keep = 0) {
  try {
    const ks = cacheKeys().map(k => { let t = 0; try { t = JSON.parse(localStorage.getItem(k)).t || 0; } catch (e) { /* illisible */ } return [k, t]; });
    ks.sort((a, b) => a[1] - b[1]);
    ks.slice(0, Math.max(0, ks.length - keep)).forEach(([k]) => localStorage.removeItem(k));
  } catch (e) { /* rien */ }
}
function cacheSet(k, d) {
  const v = JSON.stringify({ t: Date.now(), d });
  if (cacheKeys().length > 30) purgeCache(20);
  try { localStorage.setItem(CPRE + k, v); }
  catch (e) { purgeCache(4); try { localStorage.setItem(CPRE + k, v); } catch (e2) { /* tant pis */ } }
}
async function cached(k, ttl, producer) {
  const c = cacheGet(k, ttl);
  if (c) return c;
  const d = await producer();
  if (d) cacheSet(k, d);
  return d;
}

/* ---------- Réseau ---------- */
const API1 = "https://api.inaturalist.org/v1", API2 = "https://api.inaturalist.org/v2";
const MEM = new Map();
const Q = { active: 0, last: 0, list: [], timer: 0 };
function qs(p) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== "") u.set(k, Array.isArray(v) ? v.join(",") : v);
  const s = u.toString();
  return s ? "?" + s : "";
}
function schedule(fn) { return new Promise((res, rej) => { Q.list.push({ fn, res, rej }); pump(); }); }
function pump() {
  if (Q.timer) return;
  while (Q.active < 2 && Q.list.length) {
    const wait = Q.last + 330 - Date.now();
    if (wait > 0) { Q.timer = setTimeout(() => { Q.timer = 0; pump(); }, wait); return; }
    const job = Q.list.shift();
    Q.active++; Q.last = Date.now();
    job.fn().then(job.res, job.rej).finally(() => { Q.active--; pump(); });
  }
}
async function getJSON(url, { tries = 2, timeout = 15000, fresh = false } = {}) {
  let err = null;
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(url, fresh ? { signal: ctl.signal, cache: "no-store" } : { signal: ctl.signal });
      clearTimeout(tm);
      if (r.status === 429 || r.status >= 500) { err = new Error("HTTP " + r.status); err.status = r.status; await sleep(1400 * (i + 1)); continue; }
      if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return await r.json();
    } catch (e) {
      clearTimeout(tm);
      err = e;
      if (e.status && e.status < 500 && e.status !== 429) throw e;
      if (i < tries - 1) await sleep(700);
    }
  }
  throw err || new Error("Réseau");
}
function inat(path, params = {}, v = 1) {
  const url = (v === 2 ? API2 : API1) + path + qs(params);
  if (MEM.has(url)) return MEM.get(url);
  const p = schedule(() => getJSON(url));
  MEM.set(url, p);
  p.catch(() => MEM.delete(url));
  return p;
}
/* Requêtes « au hasard » : jamais servies depuis le cache du navigateur */
function inatFresh(path, params = {}, v = 1) {
  return schedule(() => getJSON((v === 2 ? API2 : API1) + path + qs(params), { fresh: true }));
}
let OBSV2 = true;
async function obsSearch(params, fresh) {
  if (OBSV2) {
    try { return await (fresh ? inatFresh("/observations", params, 2) : inat("/observations", params, 2)); }
    catch (e) { if (!e.status) throw e; OBSV2 = false; }
  }
  const p = { ...params };
  delete p.fields;
  return fresh ? inatFresh("/observations", p, 1) : inat("/observations", p, 1);
}
function memo(key, fn) {
  if (MEM.has(key)) return MEM.get(key);
  const p = fn();
  MEM.set(key, p);
  p.catch(() => MEM.delete(key));
  return p;
}

/* ---------- Taxonomie ---------- */
const TAXO = { fam: new Map(), ord: new Map(), famByName: new Map(), ready: null, ok: false };
const famFr = n => n.replace(/idae$/, "idés");
function loadTaxo() {
  if (TAXO.ready) return TAXO.ready;
  TAXO.ready = cached("taxo3", 30 * DAY, async () => {
    const [o, f] = await Promise.all([
      inat("/taxa", { taxon_id: 3, rank: "order", per_page: 200, locale: "fr" }),
      inat("/taxa", { taxon_id: 3, rank: "family", per_page: 500, locale: "fr" })
    ]);
    const ords = new Set(o.results.map(t => t.id));
    return {
      o: o.results.map(t => [t.id, t.name, cap(t.preferred_common_name || "")]),
      f: f.results.map(t => [t.id, t.name, cap(t.preferred_common_name || ""), (t.ancestor_ids || []).find(x => ords.has(x)) || 0, t.default_photo ? (t.default_photo.square_url || t.default_photo.url || "") : ""])
    };
  }).then(d => {
    for (const [id, sci, vern] of d.o) TAXO.ord.set(id, { id, sci, vern, fr: ORDER_FR[sci] || (/formes$/i.test(vern) ? vern : sci) });
    for (const [id, sci, vern, o, img] of d.f) { const fam = { id, sci, vern, o, img, fr: famFr(sci) }; TAXO.fam.set(id, fam); TAXO.famByName.set(sci, fam); }
    TAXO.ok = true;
    return true;
  }).catch(e => { TAXO.ready = null; throw e; });
  return TAXO.ready;
}
const genus = t => (t?.sci || "").split(" ")[0];
function fam(t) { if (!t) return 0; if (t.f) return t.f; for (const x of t.a || []) if (TAXO.fam.has(x)) return (t.f = x); return 0; }
function ord(t) { if (!t) return 0; if (t.o) return t.o; const f = TAXO.fam.get(fam(t)); if (f?.o) return (t.o = f.o); for (const x of t.a || []) if (TAXO.ord.has(x)) return (t.o = x); return 0; }
const famName = id => TAXO.fam.get(id)?.fr || "";
const famVern = id => TAXO.fam.get(id)?.vern || "";
const ordName = id => TAXO.ord.get(id)?.fr || "";

const sizeUrl = (u, s) => u ? u.replace(/\/(square|thumb|small|medium|large|original)(\.[a-z0-9]+)(\?|$)/i, `/${s}$2$3`) : u;
function mini(t) {
  if (!t) return null;
  const dp = t.default_photo;
  const anc = t.ancestor_ids || [];
  const i3 = anc.indexOf(3);
  const m = {
    id: t.id, sci: t.name, fr: cap(t.preferred_common_name || ""), rank: t.rank,
    a: (i3 >= 0 ? anc.slice(i3 + 1) : anc).filter(x => x !== t.id),
    img: dp ? { sq: dp.square_url || dp.url || "", md: dp.medium_url || sizeUrl(dp.url, "medium") || "", attr: dp.attribution || "", lic: dp.license_code || "" } : null
  };
  m.f = fam(m); m.o = ord(m);
  return m;
}
function fromRec(id) {
  const r = S.sp[id];
  if (!r) return null;
  return { id: +id, sci: r.sci, fr: r.fr, f: r.f || 0, o: r.o || 0, a: [], img: r.md ? { sq: r.img || r.md, md: r.md, attr: "", lic: "" } : null };
}
const nameFr = t => t?.fr || t?.sci || "";

/* ---------- Décodage du latin ---------- */
const PRE_KEYS = Object.keys(PRE).sort((a, b) => b.length - a.length);
function splitRoot(w) {
  for (const p of PRE_KEYS) {
    if (!w.startsWith(p)) continue;
    let rest = w.slice(p.length), link = "";
    if (!SUF[rest] && /^[oi]/.test(rest) && SUF[rest.slice(1)]) { link = rest[0]; rest = rest.slice(1); }
    if (SUF[rest]) return [{ w: p + link, m: PRE[p] }, { w: rest, m: SUF[rest] }];
  }
  return null;
}
function decodeLatin(sci) {
  const out = [];
  for (const w of String(sci || "").toLowerCase().split(/\s+/).filter(Boolean)) {
    const r = ROOTS[w];
    if (r) { const [m, note] = r.split("|"); out.push({ w, m, note: note || "" }); continue; }
    const c = splitRoot(w);
    if (c) c.forEach(x => out.push({ w: x.w, m: x.m, note: "" }));
  }
  return out;
}

/* ---------- Lieux ---------- */
const LVL = { "-10": "Continent", "0": "Pays", "10": "Région", "20": "Département", "30": "Commune", "100": "Parc" };
async function placeSearch(q) {
  const d = await inat("/places/autocomplete", { q, per_page: 15 });
  return (d.results || []).map(p => ({ id: p.id, name: p.name, full: p.display_name || p.name, lvl: p.admin_level }));
}
async function namedPlace(q, lvl, fallbackId) {
  const c = cacheGet("place:" + q, 90 * DAY);
  if (c) return c;
  try {
    const r = await placeSearch(q);
    const m = r.find(p => p.lvl === lvl) || r.find(p => norm(p.name) === norm(q));
    if (m) { const v = { id: m.id, name: m.name }; cacheSet("place:" + q, v); return v; }
  } catch (e) { /* hors ligne */ }
  return fallbackId ? { id: fallbackId, name: q } : null;
}
function zoneParams(z) {
  if (!z) return {};
  if (z.lat != null) return { lat: (+z.lat).toFixed(3), lng: (+z.lng).toFixed(3), radius: z.r || 25 };
  return z.id ? { place_id: z.id } : {};
}
const zoneLabel = z => z ? (z.name || "Ma zone") : "Monde";
function seasonMonths() { const m = new Date().getMonth() + 1; return [((m + 10) % 12) + 1, m, (m % 12) + 1]; }

/* ---------- Groupes d'espèces (pools) ---------- */
async function getPool(p) {
  await loadTaxo().catch(() => {});
  const params = { taxon_id: p.taxa && p.taxa.length ? p.taxa.join(",") : 3, quality_grade: "research", locale: "fr", preferred_place_id: 6753, ...zoneParams(p.zone) };
  if (p.freq === "season") params.month = seasonMonths().join(",");
  if (p.freq === "rare") params.order = "asc";
  if (p.freq === "exotic") params.introduced = "true";
  if ((p.freq === "mine" || p.freq === "lifers") && !S.set.inat) { const e = new Error("NOINAT"); e.code = "NOINAT"; throw e; }
  if (p.freq === "mine") params.user_login = S.set.inat;
  if (p.sounds) params.sounds = "true";
  if (p.age) { params.term_id = 1; params.term_value_id = AGEV[p.age]; }
  const size = clamp(p.size || 120, 10, 500);
  params.per_page = (p.freq === "all" || p.freq === "lifers") ? 500 : Math.min(500, p.freq === "rare" ? Math.max(size, 150) : size);
  const key = "pool:" + qs(params);
  let list = await cached(key, 3 * DAY, async () => {
    const d = await inat("/observations/species_counts", params);
    return (d.results || []).filter(r => r.taxon && r.taxon.rank === "species" && r.taxon.default_photo).map(r => ({ ...mini(r.taxon), c: r.count }));
  });
  list = (list || []).map(t => { t.f = fam(t); t.o = ord(t); return t; });
  if (p.freq === "lifers") {
    const mine = await cached("mine:" + S.set.inat, DAY, async () => {
      const d = await inat("/observations/species_counts", { taxon_id: 3, user_login: S.set.inat, per_page: 500 });
      return (d.results || []).map(r => r.taxon?.id).filter(Boolean);
    });
    const seen = new Set(mine || []);
    list = list.filter(t => !seen.has(t.id)).slice(0, size);
  }
  if (p.freq === "rare") list = list.slice(0, size);
  list.forEach(lexAdd);
  return { list, byId: new Map(list.map(t => [t.id, t])) };
}

/* ---------- Sorties : espèces attendues ---------- */
async function tripSpecies(zone, month, recent) {
  const base = { taxon_id: 3, quality_grade: "research", locale: "fr", preferred_place_id: 6753, per_page: 200, ...zoneParams(zone) };
  const key = "trip:" + qs({ ...base, m: month, r: recent ? 1 : 0, d: recent ? dayKey() : "" });
  const list = await cached(key, recent ? DAY / 2 : 7 * DAY, async () => {
    const conv = d => (d.results || []).filter(r => r.taxon && r.taxon.rank === "species").map(r => ({ ...mini(r.taxon), c: r.count }));
    if (recent) return conv(await inat("/observations/species_counts", { ...base, d1: dayKey(new Date(Date.now() - 30 * DAY)) }));
    let out = conv(await inat("/observations/species_counts", { ...base, month }));
    if (out.length < 25) out = conv(await inat("/observations/species_counts", { ...base, month: [((month + 10) % 12) + 1, month, (month % 12) + 1].join(",") }));
    return out;
  });
  (list || []).forEach(t => { t.f = fam(t); t.o = ord(t); lexAdd(t); });
  return list || [];
}

/* ---------- Lexique (suggestions de saisie) ---------- */
const LEX = new Map();
function lexAdd(t) {
  if (!t || !t.id || !t.sci) return;
  if (!LEX.has(t.id)) LEX.set(t.id, { id: t.id, sci: t.sci, fr: t.fr || "", img: t.img?.sq || t.img || "", f: t.f || 0, n: norm((t.fr || "") + " " + t.sci) });
}
/* Espèce dont le nom tapé correspond (à une faute près) */
function lexExact(v) {
  const a = norm(v);
  if (a.length < 4) return null;
  let best = null, bd = 9;
  for (const e of LEX.values()) for (const n of [norm(e.fr), norm(e.sci)]) {
    if (!n) continue;
    const d = n === a ? 0 : Math.abs(n.length - a.length) > 2 ? 9 : lev(a, n);
    if (d < bd && d <= (n.length <= 7 ? 0 : 1)) { bd = d; best = e; }
  }
  if (!best) return null;
  const img = best.img ? { sq: best.img, md: sizeUrl(best.img, "medium"), attr: "", lic: "" } : null;
  return { id: best.id, sci: best.sci, fr: best.fr, f: best.f || 0, a: [], img };
}
let LEXP = null;
function loadLexicon() {
  for (const [id, r] of Object.entries(S.sp)) lexAdd({ id: +id, sci: r.sci, fr: r.fr, img: r.img, f: r.f });
  if (LEXP) return LEXP;
  LEXP = cached("lex1", 30 * DAY, async () => {
    const out = [];
    for (const page of [1, 2]) {
      const d = await inat("/observations/species_counts", { taxon_id: 3, place_id: 6753, locale: "fr", preferred_place_id: 6753, per_page: 500, page });
      for (const r of d.results || []) if (r.taxon && r.taxon.rank === "species") out.push([r.taxon.id, r.taxon.name, cap(r.taxon.preferred_common_name || ""), r.taxon.default_photo?.square_url || ""]);
      if ((d.results || []).length < 500) break;
    }
    return out;
  }).then(list => { for (const [id, sci, fr, img] of list || []) lexAdd({ id, sci, fr, img }); return true; })
    .catch(() => { LEXP = null; return false; });
  return LEXP;
}
function lexSearch(qs_, n = 8) {
  const toks = norm(qs_).split(" ").filter(Boolean);
  if (!toks.length) return [];
  const res = [];
  for (const e of LEX.values()) {
    const words = e.n.split(" ");
    let score = 0, ok = true;
    for (const tk of toks) {
      const i = words.findIndex(w => w.startsWith(tk));
      if (i < 0) { if (e.n.includes(tk)) score += 1; else { ok = false; break; } }
      else score += i === 0 ? 4 : 2;
    }
    if (ok) res.push([score - e.n.length / 100, e]);
  }
  return res.sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
}
async function lexRemote(q) {
  const d = await inat("/taxa/autocomplete", { q, taxon_id: 3, rank: "species", per_page: 8, locale: "fr", preferred_place_id: 6753 });
  const out = (d.results || []).filter(r => r.rank === "species").map(r => mini(r));
  out.forEach(lexAdd);
  return out;
}

/* ---------- Espèces vues sur le terrain (observations iNaturalist de l'utilisateur) ---------- */
const FIELD = { ids: new Set(), who: "" };
async function loadField() {
  const who = S.set.inat;
  if (!who) { FIELD.ids = new Set(); FIELD.who = ""; return FIELD.ids; }
  if (FIELD.who === who) return FIELD.ids;
  const list = await cached("mine:" + who, DAY, async () => {
    const d = await inat("/observations/species_counts", { taxon_id: 3, user_login: who, per_page: 500 });
    return (d.results || []).map(r => r.taxon?.id).filter(Boolean);
  });
  FIELD.ids = new Set(list || []); FIELD.who = who;
  return FIELD.ids;
}
function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "hier" : `il y a ${d} j`;
}
function periodStats(days) {
  const tn = todayNum(), o = { xp: 0, q: 0, ok: 0, active: 0 };
  for (let n = tn - days + 1; n <= tn; n++) { const d = S.days[keyOfNum(n)]; if (d) { o.xp += d.xp || 0; o.q += d.q || 0; o.ok += d.ok || 0; if (d.q) o.active++; } }
  return o;
}
function familyStats() {
  const m = new Map();
  for (const r of Object.values(S.sp)) {
    if (!r.n || !r.f) continue;
    const x = m.get(r.f) || { f: r.f, n: 0, ok: 0, sp: 0 };
    x.n += r.n; x.ok += r.ok; x.sp++;
    m.set(r.f, x);
  }
  return [...m.values()].filter(x => x.n >= 4).map(x => ({ ...x, p: x.ok / x.n }));
}
function carnetCsv() {
  const rows = [["Nom français", "Nom latin", "Famille", "Ordre", "Fois vue en quiz", "Réussite (%)", "Étoiles", "Photos reconnues", "Dont terrain", "Jours de réussite", "Première rencontre", "Dernière réussite", "Observée (date)", "Observée (lieu)", "Vue sur iNaturalist", "Mon astuce"]];
  for (const [id, r] of Object.entries(S.sp)) {
    if (!(r.n > 0 || r.nobs > 0)) continue;
    const m = mastery(r);
    rows.push([r.fr, r.sci, famName(r.f), ordName(r.o), r.n || 0, r.n ? Math.round(100 * r.ok / r.n) : "", m.lvl, m.photos, m.field, m.days, r.first || "", r.lastOk || "", r.seen?.[0] || "", r.seen?.[1] || "", FIELD.ids.has(+id) ? "oui" : "", r.note || ""]);
  }
  return "\ufeff" + rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
}

/* ---------- Médias ---------- */
const DET = new Map();
const photoKey = u => { const m = String(u || "").match(/\/photos\/(\d+)\//); return m ? +m[1] : (u ? hashStr(String(u)) : 0); };
const sndKey = u => u ? hashStr(String(u).split("?")[0]) : 0;
const pushU = (a, v, max = 12) => { a = a || []; if (v != null && v !== 0 && !a.includes(v)) { a.push(v); if (a.length > max) a.shift(); } return a; };
let V2 = true;
function photoObj(ph) {
  const base = ph.url || ph.medium_url || ph.square_url || "";
  return { lg: ph.large_url || sizeUrl(base, "large"), md: ph.medium_url || sizeUrl(base, "medium"), attr: ph.attribution || "", lic: ph.license_code || "" };
}
async function photosFor(ids) {
  const need = [...new Set(ids)].filter(id => id && !DET.has(id));
  for (const ch of chunks(need, V2 ? 20 : 6)) {
    let res = null;
    if (V2) {
      try {
        const d = await inat("/taxa/" + ch.join(","), { fields: "id,taxon_photos.photo.url,taxon_photos.photo.medium_url,taxon_photos.photo.large_url,taxon_photos.photo.attribution,taxon_photos.photo.license_code" }, 2);
        res = d.results;
      } catch (e) { if (!e.status) throw e; V2 = false; }
    }
    if (!res) { const d = await inat("/taxa/" + ch.join(","), {}, 1); res = d.results; }
    for (const t of res || []) DET.set(t.id, (t.taxon_photos || []).map(tp => tp && tp.photo).filter(ph => ph && (ph.url || ph.medium_url)).map(photoObj));
    for (const id of ch) if (!DET.has(id)) DET.set(id, []);
  }
  return ids.map(id => DET.get(id) || []);
}
const LASTPH = new Map();
async function refPhoto(t) {
  let list = [];
  try { list = (await photosFor([t.id]))[0]; } catch (e) { if (!t.img) throw e; }
  if (!list.length && t.img) list = [{ lg: sizeUrl(t.img.md, "large"), md: t.img.md, attr: t.img.attr, lic: t.img.lic }];
  if (!list.length) return null;
  const r = S.sp[t.id], seen = new Set(r?.ps || []), won = new Set([...(r?.pk || []), ...(r?.fk || [])]);
  const cands = list.slice(0, 14).filter(p => p.lg !== LASTPH.get(t.id));
  const unseen = cands.filter(p => !seen.has(photoKey(p.lg || p.md))), notWon = cands.filter(p => !won.has(photoKey(p.lg || p.md)));
  const pool = unseen.length ? unseen : notWon.length ? notWon : cands;
  const ph = pick(pool.length ? pool : list);
  LASTPH.set(t.id, ph.lg);
  return ph;
}
/* Classes d'âge : annotation iNaturalist « Life Stage » (terme 1) : adulte = 2, juvénile = 8 */
const AGEV = { adult: 2, juv: 8 };
const AGEN = { adult: "Adulte", juv: "Juvénile" };
async function agePhoto(t, zone, age) {
  const fields = "id,uri,place_guess,observed_on,photos.url,photos.attribution,photos.license_code";
  const base = { taxon_id: t.id, photos: "true", quality_grade: "research", term_id: 1, term_value_id: AGEV[age], order_by: "random", per_page: 10, fields };
  const tries = zone && (zone.id || zone.lat != null) ? [{ ...base, ...zoneParams(zone) }, base] : [base];
  const seen = new Set(S.sp[t.id]?.ps || []);
  for (const p of tries) {
    const d = await obsSearch(p, true).catch(() => null);
    const cands = [];
    for (const o of d?.results || []) {
      const ph = (o.photos || []).find(x => x && x.url);
      if (ph) cands.push({ ...photoObj(ph), field: true, age, place: o.place_guess || "", date: o.observed_on || "", uri: o.uri || "" });
    }
    if (cands.length) { const fresh = cands.filter(c => !seen.has(photoKey(c.lg || c.md))); return pick(fresh.length ? fresh : cands); }
  }
  return null;
}
async function fieldPhoto(t, zone) {
  const fields = "id,uri,place_guess,observed_on,photos.url,photos.attribution,photos.license_code";
  const base = { taxon_id: t.id, photos: "true", quality_grade: "research", order_by: "random", per_page: 5 + rnd(5), fields };
  const tries = zone && (zone.id || zone.lat != null) ? [{ ...base, ...zoneParams(zone) }, base] : [base];
  for (const p of tries) {
    const d = await obsSearch(p, true).catch(() => null);
    for (const o of d?.results || []) {
      const ph = (o.photos || []).find(x => x && x.url);
      if (ph) return { ...photoObj(ph), field: true, place: o.place_guess || "", date: o.observed_on || "", uri: o.uri || "" };
    }
  }
  return null;
}
const AUDTEST = document.createElement("audio");
function canPlay(s) {
  let ty = String(s.file_content_type || "").toLowerCase();
  if (!ty) {
    const ext = String(s.file_url || "").split("?")[0].split(".").pop().toLowerCase();
    ty = { mp3: "audio/mpeg", m4a: "audio/mp4", mp4: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg", oga: "audio/ogg", flac: "audio/flac", webm: "audio/webm" }[ext] || "";
  }
  ty = { "audio/x-wav": "audio/wav", "audio/wave": "audio/wav", "audio/x-m4a": "audio/mp4", "audio/m4a": "audio/mp4", "audio/mp3": "audio/mpeg", "audio/x-flac": "audio/flac" }[ty] || ty;
  if (!ty) return true;
  try { return AUDTEST.canPlayType(ty) !== ""; } catch (e) { return true; }
}
const SNDFIELDS = "id,uri,place_guess,observed_on,num_identification_agreements,num_identification_disagreements,sounds.id,sounds.file_url,sounds.file_content_type,sounds.attribution,sounds.license_code,sounds.hidden,sounds.flags";
function sndObj(o, s) {
  return { url: s.file_url, type: s.file_content_type || "", attr: s.attribution || "", lic: s.license_code || "", place: o.place_guess || "", date: o.observed_on || "", uri: o.uri || ("https://www.inaturalist.org/observations/" + o.id), agree: o.num_identification_agreements || 0 };
}
const badSnd = u => (S.badSnd || []).includes(u);
/* Filtre des sons : identification confirmée par plusieurs personnes, aucun désaccord,
   un seul enregistrement dans l'observation, ni masqué ni signalé, ni rejeté par toi. */
function goodSounds(results, minAgree) {
  const out = [];
  for (const o of results || []) {
    const snds = (o.sounds || []).filter(s => s && s.file_url);
    if (snds.length !== 1) continue;
    const s = snds[0];
    if (s.hidden || (s.flags || []).length) continue;
    if ((o.num_identification_agreements || 0) < minAgree || (o.num_identification_disagreements || 0) > 0) continue;
    if (!canPlay(s) || badSnd(s.file_url)) continue;
    out.push(sndObj(o, s));
  }
  return out.sort((a, b) => b.agree - a.agree);
}
async function xcSound(t) {
  if (!S.set.xc) return null;
  try {
    const url = "https://xeno-canto.org/api/3/recordings?query=" + encodeURIComponent(`sp:"${t.sci}" q:A`) + "&key=" + encodeURIComponent(S.set.xc);
    const d = await getJSON(url, { tries: 1, timeout: 10000 });
    const fix = u => u ? (u.startsWith("//") ? "https:" + u : u) : "";
    const ok = (d.recordings || []).filter(r => r.file && !(r.also || []).filter(Boolean).length && !badSnd(fix(r.file)));
    if (!ok.length) return null;
    const r = pick(ok.slice(0, 25));
    return { url: fix(r.file), type: "audio/mpeg", attr: "© " + (r.rec || "") + " · xeno-canto", lic: r.lic || "", place: [r.loc, r.cnt].filter(Boolean).join(", "), date: r.date || "", uri: fix(r.url), agree: 9, src: "xeno-canto", kind: xcKind(r.type), sono: fix(r.sono?.full || r.sono?.large || r.sono?.med || "") };
  } catch (e) { return null; }
}
/* Wikimedia Commons : enregistrements libres, servis avec CORS → spectrogramme calculable sur place */
const SNDKIND = [[/flight ?call|cri en vol|flugruf/i, "cri en vol"], [/alarm|alarme|warn/i, "alarme"], [/drum|tambour/i, "tambourinage"], [/song|chant|singing|gesang|canto/i, "chant"], [/\bcalls?\b|\bcri|\bruf\b|contact/i, "cri"]];
const kindOf = s => { for (const [re, k] of SNDKIND) if (re.test(s || "")) return k; return ""; };
const stripHtml = s => String(s || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
function commonsSounds(t) {
  return memo("cms:" + t.id, async () => cached("cms:" + t.sci, 7 * DAY, async () => {
    const q = `intitle:"${t.sci}" filetype:audio`;
    const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=search&gsrnamespace=6&gsrlimit=16&gsrsearch=" + encodeURIComponent(q)
      + "&prop=videoinfo&viprop=url|mime|size|derivatives|extmetadata&viextmetadatafilter=Artist|LicenseShortName|ImageDescription";
    const d = await getJSON(url, { tries: 1, timeout: 12000 });
    const [g, sp] = t.sci.toLowerCase().split(" ");
    const out = [];
    for (const pg of d?.query?.pages || []) {
      const vi = (pg.videoinfo || [])[0], title = String(pg.title || "").replace(/^File:/i, "");
      if (!vi || !vi.url || (vi.size || 0) > 3e6) continue;
      const tl = title.toLowerCase().replace(/_/g, " ");
      if (!tl.includes(g) || !tl.includes(sp)) continue;
      const cands = [{ src: vi.url, type: String(vi.mime || "").split(";")[0], size: vi.size || 0 }, ...(vi.derivatives || []).map(x => ({ src: x.src, type: String(x.type || "").split(";")[0], size: 0 }))];
      if (!(vi.derivatives || []).length && /\.(ogg|oga|opus|flac|wav)$/i.test(vi.url)) {
        const fn = vi.url.split("/").pop();
        cands.push({ src: vi.url.replace("/wikipedia/commons/", "/wikipedia/commons/transcoded/") + "/" + fn + ".mp3", type: "audio/mpeg", size: 0 });
      }
      const order = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/wave", "audio/ogg", "application/ogg", "audio/webm", "audio/flac"];
      const best = cands.filter(c => c.src && order.includes(c.type) && canPlay({ file_content_type: c.type }) && !(c.size > 6e6))
        .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))[0];
      if (!best || badSnd(best.src)) continue;
      const em = vi.extmetadata || {}, who = stripHtml(em.Artist?.value).slice(0, 60), lic = stripHtml(em.LicenseShortName?.value);
      const desc = stripHtml(em.ImageDescription?.value).slice(0, 200);
      out.push({ url: best.src, type: best.type, attr: [who ? "© " + who : "", lic, "Wikimedia Commons"].filter(Boolean).join(" · "), lic, place: "", date: "", uri: vi.descriptionurl || ("https://commons.wikimedia.org/wiki/" + encodeURIComponent(pg.title || "")), page: vi.descriptionurl || "", agree: 5, src: "Wikimédia", kind: kindOf(title + " " + desc), title });
    }
    return out;
  })).then(x => (x || []).filter(s => !badSnd(s.url)));
}
async function soundFor(t, zone) {
  const x = await xcSound(t);
  if (x) return x;
  if (S.set.sono) {
    const c = await commonsSounds(t).catch(() => []);
    if (c.length) return pick(c.slice(0, 8));
  }
  const base = { taxon_id: t.id, sounds: "true", quality_grade: "research", order_by: "random", per_page: 25 + rnd(6), fields: SNDFIELDS };
  const tries = zone && (zone.id || zone.lat != null) ? [{ ...base, ...zoneParams(zone) }, base] : [base];
  let loose = [];
  for (const p of tries) {
    const d = await obsSearch(p, true).catch(() => null);
    const strict = goodSounds(d?.results, 2);
    if (strict.length) return pick(strict.slice(0, 5));
    if (!loose.length) loose = goodSounds(d?.results, 1);
  }
  if (loose.length) return pick(loose.slice(0, 3));
  if (!S.set.sono) { const c = await commonsSounds(t).catch(() => []); if (c.length) return pick(c.slice(0, 8)); }
  return null;
}
async function soundsList(t, n = 4) {
  const d = await obsSearch({ taxon_id: t.id, sounds: "true", quality_grade: "research", per_page: 30, fields: SNDFIELDS });
  let out = goodSounds(d?.results, 2);
  if (out.length < 2) out = goodSounds(d?.results, 1);
  return out.slice(0, n);
}
async function similar(t, zone) {
  const go = async withZone => {
    const p = { taxon_id: t.id, locale: "fr", preferred_place_id: 6753, ...(withZone ? zoneParams(zone) : {}) };
    const d = await inat("/identifications/similar_species", p);
    return (d.results || []).filter(r => r.taxon && r.taxon.rank === "species" && r.taxon.default_photo).map(r => ({ ...mini(r.taxon), c: r.count }));
  };
  let r = [];
  if (zone && (zone.id || zone.lat != null)) r = await go(true).catch(() => []);
  if (r.length < 3) r = await go(false).catch(() => r);
  return r;
}
async function pheno(t, zone) {
  const d = await inat("/observations/histogram", { taxon_id: t.id, interval: "month_of_year", date_field: "observed", quality_grade: "research", ...zoneParams(zone) });
  const m = d?.results?.month_of_year || {};
  return Array.from({ length: 12 }, (_, i) => +m[i + 1] || 0);
}
function wiki(t) {
  return memo("wiki:" + t.id, async () => {
    const one = async title => {
      const d = await getJSON("https://fr.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")), { tries: 1, timeout: 9000 });
      if (!d || d.type === "disambiguation" || !d.extract) throw new Error("vide");
      return { text: d.extract, url: d.content_urls?.mobile?.page || d.content_urls?.desktop?.page || "", title: d.title };
    };
    try { return await one(t.sci); } catch (e) { if (t.fr) { try { return await one(t.fr); } catch (e2) { /* rien */ } } }
    return null;
  });
}
/* Section « Description / Identification » de l'article Wikipédia (critères de reconnaissance) */
function pickSection(txt, names) {
  const re = /\n(==+)\s*([^=\n]+?)\s*==+\n/g, heads = [];
  let m;
  while ((m = re.exec(txt))) heads.push({ lvl: m[1].length, name: m[2].trim(), start: m.index, body: re.lastIndex });
  for (const nm of names) {
    const h = heads.find(x => norm(x.name).startsWith(norm(nm)));
    if (!h) continue;
    const next = heads.find(x => x.start > h.start && x.lvl <= h.lvl);
    const body = txt.slice(h.body, next ? next.start : undefined).replace(/\n==+\s*[^=\n]+?\s*==+\n/g, "\n").replace(/\n{2,}/g, "\n").trim();
    if (body.length > 60) return body;
  }
  return null;
}
function wikiDesc(t) {
  return memo("wdesc:" + t.id, async () => {
    const one = async title => {
      const d = await getJSON("https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&origin=*&titles=" + encodeURIComponent(title), { tries: 1, timeout: 10000 });
      const pg = Object.values(d?.query?.pages || {})[0];
      if (!pg || pg.missing !== undefined || !pg.extract) throw new Error("vide");
      return pg;
    };
    let pg = null;
    try { pg = await one(t.sci); } catch (e) { if (t.fr) { try { pg = await one(t.fr); } catch (e2) { /* rien */ } } }
    if (!pg) return null;
    const sec = pickSection(pg.extract, ["Description", "Identification", "Morphologie", "Caractéristiques", "Aspect"]);
    const voice = pickSection(pg.extract, ["Voix", "Chant", "Vocalisation", "Cri"]);
    return sec ? { text: sec, voice, full: String(pg.extract).slice(0, 80000), url: "https://fr.m.wikipedia.org/wiki/" + encodeURIComponent(pg.title.replace(/ /g, "_")), title: pg.title } : null;
  });
}
const clip = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); if (s.length <= n) return s; const cut = s.slice(0, n); const dot = cut.lastIndexOf(". "); return (dot > n * .5 ? cut.slice(0, dot + 1) : cut.replace(/\s\S*$/, "") + "…"); };
const xcKind = ty => String(ty || "").split(",").map(x => XCTYPE[x.trim().toLowerCase()] || x.trim()).filter(Boolean).join(", ");
const XCTYPE = { song: "chant", call: "cri", "flight call": "cri en vol", "alarm call": "alarme", drumming: "tambourinage", "begging call": "quémande", subsong: "babil", "nocturnal flight call": "cri nocturne" };
async function xcList(t) {
  if (!S.set.xc) return null;
  const url = "https://xeno-canto.org/api/3/recordings?query=" + encodeURIComponent(`sp:"${t.sci}"`) + "&key=" + encodeURIComponent(S.set.xc);
  const d = await getJSON(url, { tries: 1, timeout: 12000 });
  const fix = u => u ? (u.startsWith("//") ? "https:" + u : u) : "";
  return (d.recordings || []).filter(r => r.file).sort((a, b) => String(a.q || "E").localeCompare(String(b.q || "E"))).slice(0, 6)
    .map(r => ({ url: fix(r.file), kind: xcKind(r.type), place: [r.loc, r.cnt].filter(Boolean).join(", "), attr: r.rec ? "© " + r.rec + " · xeno-canto" : "xeno-canto", len: r.length || "", page: fix(r.url), q: r.q || "", src: "xeno-canto", sono: fix(r.sono?.full || r.sono?.large || r.sono?.med || "") }));
}
async function resolveTaxon(sci, fr) {
  return memo("res:" + sci, async () => {
    for (const q of [sci, fr].filter(Boolean)) {
      try {
        const d = await inat("/taxa/autocomplete", { q, per_page: 5, locale: "fr", preferred_place_id: 6753 });
        const r = (d.results || []).find(x => x.rank === "species" && (x.iconic_taxon_name === "Aves" || (x.ancestor_ids || []).includes(3)));
        if (r) return mini(r);
      } catch (e) { /* suivant */ }
    }
    return null;
  });
}
function preload(url) {
  return new Promise(res => {
    if (!url) return res(false);
    const im = new Image();
    im.decoding = "async";
    im.onload = () => res(true);
    im.onerror = () => res(false);
    im.src = url;
  });
}

/* ---------- Progression : SRS, XP, série, badges ---------- */
const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
function rec(t) {
  let r = S.sp[t.id];
  if (!r) r = S.sp[t.id] = { fr: t.fr || "", sci: t.sci, f: fam(t) || 0, o: ord(t) || 0, img: t.img?.sq || "", md: t.img?.md || "", n: 0, ok: 0, box: {}, due: {}, conf: {}, first: dayKey() };
  else {
    if (t.fr && !r.fr) r.fr = t.fr;
    if (t.img?.md && !r.md) { r.md = t.img.md; r.img = t.img.sq; }
    if (!r.f && fam(t)) r.f = fam(t);
    if (!r.o && ord(t)) r.o = ord(t);
  }
  return r;
}
/* Maîtrise = reconnaître l'espèce dans des situations différentes, pas mémoriser une image :
   3 photos différentes dont 1 de terrain, sur 3 jours différents, sans échec récent. */
function mastery(r) {
  const m = { photos: 0, field: 0, sounds: 0, days: 0, lvl: 0 };
  if (!r) return m;
  m.field = (r.fk || []).length;
  m.photos = Math.max((r.pk || []).length + m.field, r.lg || 0);
  m.sounds = (r.sk || []).length;
  m.days = (r.od || []).length;
  const box = r.box ? (r.box.photo ?? Math.max(0, ...Object.values(r.box))) : 0;
  if (m.photos >= 3 && m.field >= 1 && m.days >= 3 && box >= 3) m.lvl = 3;
  else if (m.photos >= 2 && m.days >= 2) m.lvl = 2;
  else if ((r.ok || 0) >= 1) m.lvl = 1;
  return m;
}
function stars(r) { return r ? mastery(r).lvl : 0; }
function masteryTodo(m) {
  if (m.lvl === 3) return "";
  const need = [];
  if (m.photos < 3) need.push(`${3 - m.photos} photo${3 - m.photos > 1 ? "s" : ""} de plus`);
  if (m.field < 1) need.push("1 photo de terrain");
  if (m.days < 3) need.push(`${3 - m.days} jour${3 - m.days > 1 ? "s" : ""} de plus`);
  return need.length ? "Pour la maîtriser : " + need.join(", ") + "." : "Presque : reconnais-la encore une fois sans erreur.";
}
/* Journal compact de chaque tentative : [minute, espèce, réussite, type (p photo, f terrain, s son, n nom), clé du média] */
function logAttempt(id, ok, m, k) {
  const a = S.att || (S.att = []);
  a.push([Math.floor(Date.now() / 60000), id, ok ? 1 : 0, m, k || 0]);
  if (a.length > 6000) a.splice(0, a.length - 6000);
}
/* Rétention différée : après une réussite, l'espèce est-elle encore reconnue quand elle revient lo à hi jours plus tard ? */
function retention(lo, hi) {
  const last = new Map();
  let n = 0, ok = 0;
  for (const [t, id, o, m] of S.att || []) {
    const key = id + (m === "s" ? "s" : m === "n" ? "n" : "p");
    const prev = last.get(key);
    if (prev && prev[1]) { const gap = (t - prev[0]) / 1440; if (gap >= lo && gap < hi) { n++; if (o) ok++; } }
    last.set(key, [t, o]);
  }
  return { n, p: n ? ok / n : null };
}
function srsUpdate(r, mod, ok, soft) {
  let b = r.box[mod] ?? 0;
  if (ok) b = Math.min(6, b + (soft ? 0 : 1)); else b = b >= 3 ? 1 : 0;
  r.box[mod] = b;
  r.due[mod] = todayNum() + INTERVALS[b];
}
function dueList() {
  const t = todayNum(), out = [];
  for (const [id, r] of Object.entries(S.sp)) for (const [mod, d] of Object.entries(r.due || {})) if (d <= t) out.push({ id: +id, mod, d, box: r.box?.[mod] ?? 0 });
  return out.sort((a, b) => a.d - b.d || a.box - b.box);
}
const lvlXp = n => 60 * (n - 1) * n;
function level(xp = S.xp) {
  let n = 1;
  while (xp >= lvlXp(n + 1)) n++;
  const a = lvlXp(n), b = lvlXp(n + 1);
  return { n, rank: RANKS[Math.min(n - 1, RANKS.length - 1)], cur: xp - a, need: b - a, p: (xp - a) / (b - a) };
}
function addXp(n) { S.xp += n; today().xp += n; }
function liveStreak() {
  const st = S.streak;
  if (!st.last) return 0;
  const gap = todayNum() - dayNum(st.last);
  if (gap <= 1) return st.cur;
  return gap - 1 <= st.jokers ? st.cur : 0;
}
const playedToday = () => S.streak.last === dayKey();
function markPlayed() {
  const st = S.streak, k = dayKey();
  if (st.last === k) return null;
  let msg = null;
  if (!st.last) st.cur = 1;
  else {
    const gap = todayNum() - dayNum(st.last);
    if (gap === 1) st.cur++;
    else if (gap > 1 && gap - 1 <= st.jokers) { st.jokers -= gap - 1; st.cur++; msg = `Joker utilisé : tes ${st.cur} jours sont sauvés !`; }
    else st.cur = 1;
  }
  st.last = k;
  st.best = Math.max(st.best, st.cur);
  if (st.cur % 7 === 0 && st.jokers < 3) { st.jokers++; msg = (msg ? msg + " " : "") + "+1 joker gagné !"; }
  return msg;
}
function topConfusions(n = 6) {
  const m = new Map();
  for (const [id, r] of Object.entries(S.sp)) for (const [o, c] of Object.entries(r.conf || {})) {
    const a = Math.min(+id, +o), b = Math.max(+id, +o), k = a + ":" + b;
    m.set(k, { a, b, n: (m.get(k)?.n || 0) + c });
  }
  return [...m.values()].filter(x => S.sp[x.a] && S.sp[x.b]).sort((x, y) => y.n - x.n).slice(0, n);
}
function checkBadges() {
  const c = S.counters, st = S.streak, recs = Object.values(S.sp);
  const n = recs.length, mastered = recs.filter(r => stars(r) === 3).length;
  const test = {
    first: (c.sessions || 0) >= 1, streak3: st.best >= 3, streak7: st.best >= 7, streak30: st.best >= 30,
    perfect: (c.perfect || 0) >= 1, combo10: S.best.combo >= 10, combo25: S.best.combo >= 25,
    ear50: (c.ear || 0) >= 50, latin100: (c.latin || 0) >= 100, fam50: (c.famok || 0) >= 50,
    col50: n >= 50, col150: n >= 150, col300: n >= 300, master25: mastered >= 25,
    duel10: (c.duelwin || 0) >= 10, geo20: (c.geook || 0) >= 20, rare: (c.rare || 0) >= 1,
    roots50: (c.rootok || 0) >= 50, typing25: (c.typeok || 0) >= 25, early: (c.early || 0) >= 1, night: (c.night || 0) >= 1, bague50: (c.handok || 0) >= 50,
    path1: (c.paths || 0) >= 1, defi3: (c.defiwin || 0) >= 3
  };
  const got = [];
  for (const b of BADGES) if (!S.badges[b.id] && test[b.id]) { S.badges[b.id] = dayKey(); got.push(b); }
  return got;
}
