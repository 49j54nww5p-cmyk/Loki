/* ============================================================
   Plumage — partager un quiz (lien et QR code) et recettes Sur mesure
   Le QR code est calculé ici, sans service extérieur
   (mode octet, correction d'erreur M ou L, d'après l'algorithme de référence de Project Nayuki, MIT).
   ============================================================ */

/* ---------- QR code ---------- */
const QR_ECC = { L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28] };
const QR_BLK = { L: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49] };
const QR_FMT = { L: 1, M: 0 };
function qrRawModules(v) {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
  return r;
}
const qrDataCodewords = (v, e) => Math.floor(qrRawModules(v) / 8) - QR_ECC[e][v - 1] * QR_BLK[e][v - 1];
function qrMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; }
function qrDivisor(deg) {
  const r = new Array(deg).fill(0); r[deg - 1] = 1;
  let root = 1;
  for (let i = 0; i < deg; i++) {
    for (let j = 0; j < deg; j++) { r[j] = qrMul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
    root = qrMul(root, 2);
  }
  return r;
}
function qrRemainder(data, div) {
  const r = div.map(() => 0);
  for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= qrMul(c, f); }); }
  return r;
}
/* Renvoie une matrice de booléens (true = module sombre) */
function qrEncode(text, ecl = "M") {
  const bytes = Array.from(new TextEncoder().encode(text));
  let v = 1, e = ecl;
  for (;; v++) {
    if (v > 40) { if (e === "M") { e = "L"; v = 0; continue; } throw new Error("QR trop long"); }
    const cc = v < 10 ? 8 : 16;
    if (4 + cc + bytes.length * 8 <= qrDataCodewords(v, e) * 8) break;
  }
  const cap = qrDataCodewords(v, e), bits = [];
  const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
  put(0, Math.min(4, cap * 8 - bits.length));
  put(0, (8 - bits.length % 8) % 8);
  for (let p = 0xEC; bits.length < cap * 8; p ^= 0xEC ^ 0x11) put(p, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a << 1 | b, 0));
  /* blocs, correction d'erreur, entrelacement */
  const nb = QR_BLK[e][v - 1], el = QR_ECC[e][v - 1], raw = Math.floor(qrRawModules(v) / 8);
  const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = qrDivisor(el), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const dat = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += dat.length;
    const ecc = qrRemainder(dat, div);
    if (i < nShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const cw = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= nShort) cw.push(b[i]); });
  /* motifs fixes */
  const size = v * 4 + 17, M = Array.from({ length: size }, () => new Array(size).fill(false)), F = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (x, y) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy; if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = [];
  if (v > 1) { const n = Math.floor(v / 7) + 2, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2; al.push(6); for (let p = size - 7; al.length < n; p -= step) al.splice(1, 0, p); }
  al.forEach((ax, i) => al.forEach((ay, j) => { if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
  const fmt = mask => {
    const d = QR_FMT[e] << 3 | mask; let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = (d << 10 | r) ^ 0x5412, g = i => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, g(i));
    set(8, 7, g(6)); set(8, 8, g(7)); set(7, 8, g(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, g(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, g(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, g(i));
    set(8, size - 8, true);
  };
  fmt(0);
  if (v >= 7) {
    let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
    const b = v << 12 | r;
    for (let i = 0; i < 18; i++) { const c = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, bb = Math.floor(i / 3); set(a, bb, c); set(bb, a, c); }
  }
  /* données en zigzag */
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!F[y][x] && i < cw.length * 8) { M[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
    }
  }
  /* masque : on garde celui qui pénalise le moins */
  const inv = (m, x, y) => [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, x * y % 2 + x * y % 3 === 0, (x * y % 2 + x * y % 3) % 2 === 0, ((x + y) % 2 + x * y % 3) % 2 === 0][m];
  const apply = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y][x] && inv(m, x, y)) M[y][x] = !M[y][x]; };
  /* pénalités de la norme (N1 séries, N2 blocs 2×2, N3 faux motifs de repérage, N4 équilibre) */
  const penalty = () => {
    let p = 0;
    const addH = (len, h) => { if (h[0] === 0) len += size; h.pop(); h.unshift(len); };
    const count = h => { const n = h[1], core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n; return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0); };
    const line = get => {
      let color = false, run = 0, r = 0;
      const h = [0, 0, 0, 0, 0, 0, 0];
      for (let k = 0; k < size; k++) {
        if (get(k) === color) { run++; if (run === 5) r += 3; else if (run > 5) r++; }
        else { addH(run, h); if (!color) r += count(h) * 40; color = get(k); run = 1; }
      }
      if (color) { addH(run, h); run = 0; }
      addH(run + size, h);
      return r + count(h) * 40;
    };
    for (let y = 0; y < size; y++) p += line(x => M[y][x]);
    for (let x = 0; x < size; x++) p += line(y => M[y][x]);
    let dark = 0;
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
    for (const row of M) for (const b of row) if (b) dark++;
    const tot = size * size;
    return p + (Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1) * 10;
  };
  let best = 0, bp = Infinity;
  for (let m = 0; m < 8; m++) { apply(m); fmt(m); const pp = penalty(); if (pp < bp) { bp = pp; best = m; } apply(m); }
  apply(best); fmt(best);
  return M;
}
function qrSvg(text, px = 4) {
  const M = qrEncode(text), n = M.length, q = 4, w = n + q * 2;
  let d = "";
  M.forEach((row, y) => row.forEach((b, x) => { if (b) d += `M${x + q} ${y + q}h1v1h-1z`; }));
  return `<svg class="qr" viewBox="0 0 ${w} ${w}" width="${w * px}" height="${w * px}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${w}" height="${w}" fill="#fff"/><path d="${d}" fill="#0B111F"/></svg>`;
}
function qrPng(text, title) {
  const M = qrEncode(text), n = M.length, q = 4, s = 14, w = (n + q * 2) * s, foot = title ? 70 : 0;
  const c = document.createElement("canvas"); c.width = w; c.height = w + foot;
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#0B111F";
  M.forEach((row, y) => row.forEach((b, x) => { if (b) g.fillRect((x + q) * s, (y + q) * s, s, s); }));
  if (title) { g.font = "600 30px system-ui, sans-serif"; g.textAlign = "center"; g.fillText(("Plumage · " + title).slice(0, 48), w / 2, w + 30); }
  return c.toDataURL("image/png");
}

/* ---------- Recettes Sur mesure : un geste, un quiz ---------- */
const RECIPES = [
  { id: "jardin", n: "Oiseaux du jardin", d: "Les 50 plus communs", ic: "bird", c: "#3BE59D", b: { fnames: ["Paridae", "Aegithalidae", "Sittidae", "Certhiidae", "Fringillidae", "Passeridae", "Turdidae", "Muscicapidae", "Prunellidae", "Troglodytidae", "Sturnidae", "Columbidae", "Picidae", "Corvidae", "Sylviidae", "Phylloscopidae", "Regulidae", "Emberizidae"], size: 50 } },
  { id: "limi", n: "Limicoles", d: "Bécasseaux, chevaliers, gravelots", ic: "binoc", c: "#FF8B3D", b: { guilds: ["Limicoles"], stim: ["photo", "field"] } },
  { id: "laro", n: "Mouettes & goélands", d: "Sternes comprises", ic: "wing", c: "#7DD3FC", b: { guilds: ["Mouettes & sternes"], stim: ["photo", "field"], diff: "expert" } },
  { id: "chants", n: "Chants de saison", d: "Ceux qu'on entend en ce moment", ic: "wave", c: "#FFCB5C", b: { freq: "season", size: 50, stim: ["son"] } },
  { id: "rapaces", n: "Rapaces", d: "De jour comme de nuit", ic: "eye", c: "#FF6FA3", b: { guilds: ["Rapaces", "Chouettes & hiboux"], stim: ["photo", "field"] } },
  { id: "canards", n: "Canards & oies", d: "Mâles, femelles, éclipse", ic: "isle", c: "#14B8A6", b: { guilds: ["Canards & oies"], stim: ["photo", "field"] } },
  { id: "bruns", n: "Petits oiseaux bruns", d: "Fauvettes, pipits, alouettes…", ic: "zoom", c: "#B6F25A", b: { guilds: ["Fauvettes & pouillots", "Alouettes & pipits"], stim: ["photo", "field"], diff: "expert" } },
  { id: "jeunes", n: "Les jeunes", d: "Juvéniles de ta zone", ic: "spark", c: "#A58BFF", b: { age: "juv" } },
  { id: "familles", n: "Quelle famille ?", d: "La famille, pas l'espèce", ic: "tree", c: "#3D7BFF", b: { target: "family", freq: "all", size: 200 } },
  { id: "chrono", n: "Défi 60 secondes", d: "Le plus de bonnes réponses", ic: "clock", c: "#FF5C7A", b: { timer: 60 } }
];
const recipeB = (r, zone) => ({ ...defaultB(), zone: zone === undefined ? getB().zone : zone, ...JSON.parse(JSON.stringify(r.b)) });
async function recipeCfg(r, zone) {
  const cfg = await builderCfg(recipeB(r, zone));
  cfg.title = `${r.n} · ${zoneLabel(cfg.zone)}`; cfg.recipe = r.id; cfg.icon = r.ic;
  return cfg;
}
function recipesHtml() {
  return `<div class="recipes">${RECIPES.map(r => `<button class="recipe" data-act="recipe" data-r="${r.id}" style="--c:${r.c}"><span class="ic">${ic(r.ic)}</span><span class="tx"><b>${esc(r.n)}</b><small>${esc(r.d)}</small></span></button>`).join("")}</div>`;
}

/* ---------- Lien de partage : le réglage du quiz, compacté dans l'adresse ---------- */
const QOPT = {
  freq: ["common", "season", "all", "rare", "exotic", "lifers"], stim: ["photo", "field", "son", "soncho", "fr", "la"], age: ["", "juv", "adult"],
  target: ["species", "genus", "family", "order"], names: ["both", "fr", "la"], format: ["qcm", "tiles", "type", "flash"], diff: ["facile", "moyen", "expert"]
};
const b64e = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)));
/* Partageable : quiz réglé (Sur mesure, recette, mode), pas une sortie (liste locale) ni « mes observations » (compte de l'autre) */
const shareable = cfg => !!cfg && cfg.kind === "quiz" && !cfg.trip && cfg.freq !== "mine";
function zonePack(z) {
  if (!z) return 0;
  if (z.k === "near" || (z.lat != null && z.id == null)) return "near"; /* jamais tes coordonnées : chez l'autre, ce sera autour de lui */
  return z.id ? { i: z.id, n: String(z.name || "").slice(0, 40), ...(z.k ? { k: z.k } : {}) } : 0;
}
function quizPack(cfg) {
  const o = { v: 1, z: zonePack(cfg.zone) };
  if (cfg.recipe) o.r = cfg.recipe;
  else {
    o.t = String(cfg.title || "").replace(/ · [^·]*$/, "").slice(0, 50);
    if (cfg.taxa?.length) o.x = cfg.taxa.slice(0, 60);
    if (cfg.freq && cfg.freq !== "common") o.f = cfg.freq;
    if (cfg.size && cfg.size !== 100) o.s = cfg.size;
    const st = (cfg.stim || ["photo"]).join(","); if (st !== "photo") o.m = st;
    if (cfg.age) o.a = cfg.age;
    if (cfg.target && cfg.target !== "species") o.g = cfg.target;
    if (cfg.format && cfg.format !== "qcm") o.o = cfg.format;
    if (cfg.k && cfg.k !== 4) o.k = cfg.k;
    if (cfg.diff && cfg.diff !== "moyen") o.d = cfg.diff;
    if (cfg.len !== 10) o.l = cfg.len;
    if (cfg.timer) o.c = cfg.timer;
  }
  return b64e(JSON.stringify(o));
}
const quizLink = cfg => location.origin + location.pathname + "#q=" + quizPack(cfg);
/* Lecture d'un lien reçu : tout est vérifié, rien n'est pris tel quel */
function quizUnpack(s) {
  let o;
  try { o = JSON.parse(b64d(String(s).slice(0, 2000))); } catch (e) { return null; }
  if (!o || typeof o !== "object" || o.v !== 1) return null;
  const pick = (v, list, def) => list.includes(v) ? v : def, int = (v, a, b, def) => Number.isInteger(v) && v >= a && v <= b ? v : def;
  let zone = null;
  if (o.z === "near") zone = { k: "near" };
  else if (o.z && typeof o.z === "object" && Number.isInteger(o.z.i) && o.z.i > 0) zone = { id: o.z.i, name: cleanTxt(o.z.n, 40) || "Lieu partagé", ...(["fr", "gi", "eu"].includes(o.z.k) ? { k: o.z.k } : {}) };
  if (o.r) { const r = RECIPES.find(x => x.id === o.r); return r ? { recipe: r, zone } : null; }
  const stim = String(o.m || "photo").split(",").filter(x => QOPT.stim.includes(x));
  const cfg = {
    kind: "quiz", icon: "sliders", zone, taxa: Array.isArray(o.x) ? o.x.filter(x => Number.isInteger(x) && x > 0).slice(0, 60) : [],
    freq: pick(o.f, QOPT.freq, "common"), size: pick(o.s, [25, 50, 100, 200], 100), stim: stim.length ? stim : ["photo"], age: pick(o.a || "", QOPT.age, ""),
    target: pick(o.g, QOPT.target, "species"), names: S.set.names, format: pick(o.o, QOPT.format, "qcm"), k: int(o.k, 2, 6, 4), diff: pick(o.d, QOPT.diff, "moyen"),
    len: pick(o.l, [5, 10, 20, 0], 10), timer: pick(o.c, [0, 10, 60], 0)
  };
  cfg.sounds = cfg.stim.every(x => x === "son" || x === "soncho");
  if (cfg.timer === 60) cfg.len = 0;
  cfg.title = (cleanTxt(o.t, 50) || "Quiz partagé") + " · " + zoneLabel(zone && zone.k === "near" ? { name: "Autour de moi" } : zone);
  return { cfg, zone };
}
const cleanTxt = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);

/* ---------- Fenêtre « Partager ce quiz » ---------- */
const SHARE = { cfg: null, link: "" };
function openShare(cfg) {
  if (!shareable(cfg)) { toast("Ce quiz ne se partage pas (il dépend de tes données)."); return; }
  SHARE.cfg = cfg; SHARE.link = quizLink(cfg);
  let qr = "";
  try { qr = qrSvg(SHARE.link, 3); } catch (e) { qr = ""; }
  const name = String(cfg.title || "Quiz").replace(/ · [^·]*$/, "");
  openLayer(`<div class="panel sharep" role="dialog" aria-label="Partager ce quiz"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="in" style="padding-top:22px"><span class="eyebrow">${ic("ext", "xs")} Partager</span><h2 style="margin-top:8px">${esc(name)}</h2>
  <p class="muted" style="margin:4px 0 0;font-size:14px">${esc(zoneLabel(cfg.zone))} · le même quiz, chez qui ouvre le lien${cfg.zone && (cfg.zone.k === "near" || cfg.zone.lat != null) ? " (autour de lui : ta position n'est pas envoyée)" : ""}.</p>
  ${qr ? `<div class="qrbox">${qr}</div><p class="muted note" style="text-align:center">À scanner avec l'appareil photo, ou à imprimer pour un panneau, une sortie, un club.</p>` : ""}
  <button class="btn primary wide" data-act="shlink" style="margin-top:14px">${ic("ext")}Envoyer le lien</button>
  <div class="shact"><button class="btn ghost" data-act="shcopy">${ic("copy")}Copier le lien</button>${qr ? `<button class="btn ghost" data-act="shpng">${ic("down")}Image du QR</button>` : ""}</div>
  </div></div>`, "sharel");
}
function shareLinkNow() {
  const name = String(SHARE.cfg?.title || "Quiz").replace(/ · [^·]*$/, ""), text = `Un quiz d'oiseaux sur Plumage : ${name}`;
  if (navigator.share) navigator.share({ title: "Plumage", text, url: SHARE.link }).catch(() => {});
  else copyLink();
}
function copyLink() {
  if (navigator.clipboard) navigator.clipboard.writeText(SHARE.link).then(() => toast("Lien copié !"), () => toast(SHARE.link));
  else toast(SHARE.link);
}
function downloadQr() {
  try {
    const name = String(SHARE.cfg?.title || "quiz").replace(/ · [^·]*$/, "");
    const a = document.createElement("a"); a.href = qrPng(SHARE.link, name); a.download = "plumage-" + name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { toast("Téléchargement impossible."); }
}

/* ---------- Ouvrir un lien reçu ---------- */
const INQ = { r: null };
function openIncoming(raw) {
  const r = quizUnpack(raw);
  if (!r) { toast("Ce lien de quiz est illisible."); return false; }
  INQ.r = r;
  const name = r.recipe ? r.recipe.n : String(r.cfg.title).replace(/ · [^·]*$/, "");
  const where = r.zone?.k === "near" ? "Autour de toi" : zoneLabel(r.zone);
  const bits = r.recipe ? [r.recipe.d] : [
    r.cfg.taxa.length ? `${r.cfg.taxa.length} famille${r.cfg.taxa.length > 1 ? "s" : ""}` : "Tous les oiseaux",
    r.cfg.stim.map(s => (BOPT.stim.find(x => x[0] === s) || [])[1]).filter(Boolean).join(" + "),
    r.cfg.timer === 60 ? "Défi 60 s" : r.cfg.len ? r.cfg.len + " questions" : "Sans fin"
  ];
  openLayer(`<div class="panel inq" role="dialog" aria-label="Quiz partagé"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="in" style="padding-top:22px;text-align:center"><span class="inqic" style="--c:${r.recipe ? r.recipe.c : "#FFCB5C"}">${ic(r.recipe ? r.recipe.ic : "sliders")}</span>
  <span class="eyebrow" style="display:block;margin-top:12px">On t'a envoyé un quiz</span><h2 style="margin-top:8px">${esc(name)}</h2>
  <div class="inqchips"><span class="chip">${ic("pin", "xs")}${esc(where)}</span>${bits.filter(Boolean).map(b => `<span class="chip">${esc(b)}</span>`).join("")}</div>
  <button class="btn primary wide" data-act="inqplay" style="margin-top:18px">${ic("play")}Jouer</button>
  <button class="btn ghost wide" data-act="inqsave" style="margin:10px 0 22px">${ic("star")}Garder dans mes quiz</button></div></div>`, "inql");
  return true;
}
async function incomingCfg() {
  const r = INQ.r; if (!r) return null;
  let zone = r.zone;
  if (zone && zone.k === "near") zone = await geoloc().catch(() => null);
  if (r.zone && r.zone.k === "near" && !zone) toast("Position indisponible : quiz sur la France.");
  if (r.zone && r.zone.k === "near" && !zone) zone = { k: "fr", id: 6753, name: "France" };
  if (r.recipe) return recipeCfg(r.recipe, zone);
  return { ...r.cfg, zone, title: String(r.cfg.title).replace(/ · [^·]*$/, "") + " · " + zoneLabel(zone) };
}
