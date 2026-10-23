/* ============================================================
   Plumage — Piaf en main : entraînement au baguage
   Topographie de l'aile, score de mue, âge par les limites de mue,
   codes d'âge et stratégies de mue. Tout est dessiné en SVG (hors ligne).
   ============================================================ */

/* ---------- Couleurs ---------- */
const H_RAD = Math.PI / 180;
const hRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const hMix = (a, b, t) => { const A = hRgb(a), B = hRgb(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, "0")).join(""); };
const H_BLEACH = "#cdbf9e";
const H_VBF = "18 36 404 150", H_VBC = "150 30 276 128", H_VBN = "4 32 432 172"; /* aile entière / zoom sur les couvertures */
let H_UID = 0;

/* ---------- Géométrie : aile droite déployée, vue de dessus, corps à droite ----------
   Numérotation de mue : P1 (interne) → P10 (externe) ; S1 (externe) → S6, tertiaires S7 → S9 ;
   GC1 (externe) → GC10 (interne) ; CP1 (sur P1) → CP9 ; alule AL1 (la plus longue) → AL3. */
const WGEO = (() => {
  const F = [];
  const add = (id, g, x, y, a, L, w, sd = 1) => F.push({ id, g, x, y, a, L, w, sd });
  const PB = [[228, 76], [219, 76], [210, 75], [201, 74], [192, 73], [183, 71], [174, 69], [166, 66], [158, 63], [151, 60]];
  const PA = [106, 112, 118, 125, 132, 140, 148, 156, 163, 170];
  const PL = [104, 110, 117, 124, 131, 137, 141, 141, 133, 24];
  for (let i = 9; i >= 0; i--) add("P" + (i + 1), "RP", PB[i][0], PB[i][1], PA[i], PL[i], i === 9 ? 3.6 : i === 8 ? 8.2 : 9.6);
  for (let i = 0; i < 6; i++) add("S" + (i + 1), "RS", 240 + i * 18, 78 - i * .4, 100 - i * 3, 100 - i, 11.6);
  [[347, 74, 79, 90], [362, 71, 73, 82], [377, 67, 66, 69]].forEach(([x, y, a, L], i) => add("S" + (i + 7), "TT", x, y, a, L, 12.4));
  for (let i = 8; i >= 0; i--) add("CP" + (i + 1), "CP", PB[i][0] + 1, PB[i][1] - 10, PA[i] - 3, 37 - i * .7, 7.6);
  for (let i = 0; i < 6; i++) add("GC" + (i + 1), "GC", 238 + i * 18, 65.5, 98 - i * 3, 45 - i * .6, 11.2);
  for (let j = 0; j < 4; j++) add("GC" + (j + 7), "GC", 336 + j * 14, 63 - j * 2, 82 - j * 5, 42 - j * 2, 10.6);
  for (let k = 0; k < 9; k++) add("MC" + (k + 1), "MC", 240 + k * 18, 55 - Math.max(0, k - 5) * 1.6, 96 - k * 3.4, 27, 10.4);
  add("CC", "CC", 239, 66, 146, 15, 5.2);
  for (let i = 2; i >= 0; i--) add("AL" + (i + 1), "AL", [234, 233, 232][i], [56, 59, 62][i], [171, 164, 157][i], [45, 35, 26][i], 6.8);
  return F;
})();
const WG = Object.fromEntries(WGEO.map(f => [f.id, f]));
const WGROUPS = {
  RP: { n: "Rémiges primaires", s: "P1 à P10", ab: "RP" },
  RS: { n: "Rémiges secondaires", s: "S1 à S6", ab: "RS" },
  TT: { n: "Tertiaires", s: "S7 à S9", ab: "TT" },
  CP: { n: "Couvertures primaires", s: "sur la base des primaires", ab: "CP" },
  GC: { n: "Grandes couvertures", s: "GC1 à GC10", ab: "GC" },
  MC: { n: "Moyennes couvertures", s: "rangée au-dessus des GC", ab: "MC" },
  LC: { n: "Petites couvertures", s: "bord d'attaque du bras", ab: "" },
  AL: { n: "Alule", s: "le « pouce », 3 plumes", ab: "AL" }
};

/* Contour d'une plume. taper : -0.6 carré, 0 rond, 1 pointu. wear > .3 : pointe abîmée.
   wl / wr : demi-largeurs côté v<0 / v>0 (liseré du vexille externe), v0 : décalage latéral. */
function hOutline(f, L, w, taper, wear, v0 = 0, wr) {
  const wl = w; wr = wr ?? w;
  const c = Math.cos(f.a * H_RAD), s = Math.sin(f.a * H_RAD);
  const P = (u, v) => (f.x + c * u - s * (v + v0)).toFixed(1) + "," + (f.y + s * u + c * (v + v0)).toFixed(1);
  const t = clamp(taper || 0, -.6, 1);
  const lp = (bl, ro, po) => t < 0 ? ro + (bl - ro) * (-t / .6) : ro + (po - ro) * t;
  const su = lp(.9, .84, .72), sv = lp(.97, .9, .78), c1u = lp(.99, .96, .9), c1v = lp(.9, .72, .45), c2v = lp(.55, .38, .08);
  const side = (k, W) => k < 0
    ? `M${P(0, -W * .3)}C${P(L * .1, -W * .95)} ${P(L * .32, -W)} ${P(L * .58, -W * .99)}C${P(L * .7, -W * .98)} ${P(L * (su - .06), -W * (sv + .03))} ${P(L * su, -W * sv)}`
    : `C${P(L * (su - .06), W * (sv + .03))} ${P(L * .7, W * .98)} ${P(L * .58, W * .99)}C${P(L * .32, W)} ${P(L * .1, W * .95)} ${P(0, W * .3)}Z`;
  let d = side(-1, wl);
  if (wear > .3) {
    const n = 8, amp = .025 + wear * .045, pts = [];
    for (let i = 1; i < n; i++) {
      const fr = i / n, vv = -wl * sv + (wl + wr) * sv * fr, W = vv < 0 ? wl : wr, e = Math.sqrt(Math.max(0, 1 - (vv / (W * sv)) ** 2));
      pts.push(P(L * (su + (1 - su) * e * (1 - wear * .3) - (i % 2 ? amp : 0)), vv));
    }
    d += `L${pts.join("L")}L${P(L * su, wr * sv)}`;
  } else d += `C${P(L * c1u, -wl * c1v)} ${P(L, -wl * c2v)} ${P(L, 0)}C${P(L, wr * c2v)} ${P(L * c1u, wr * c1v)} ${P(L * su, wr * sv)}`;
  return d + side(1, wr);
}
function hPt(f, u, v) { const c = Math.cos(f.a * H_RAD), s = Math.sin(f.a * H_RAD); return [f.x + c * u - s * v, f.y + s * u + c * v]; }
const hP = (f, u, v) => hPt(f, u, v).map(n => n.toFixed(1)).join(",");

/* Une plume : liseré (couleur e), centre (c), marques (pointe, barre, rayures), rachis. */
function hFeather(f, st, o = {}) {
  const wear = clamp(Math.max(st.wear || 0, o.wear || 0), 0, 1);
  const L = f.L * (o.len ?? 1), w = f.w * (st.wm || 1), sd = f.sd || 1;
  const taper = o.taper ?? st.taper ?? 0;
  const ec = wear ? hMix(st.e, H_BLEACH, wear * .5) : st.e;
  const cc = wear ? hMix(st.c, H_BLEACH, wear * .32) : st.c;
  const fr = st.fr ?? .42; /* largeur du liseré externe, en fraction de la demi-largeur */
  const cen = (Lc, tp, wv) => sd > 0 ? hOutline(f, Lc, w * .97, tp, wv, 0, w * (1 - fr)) : hOutline(f, Lc, w * (1 - fr), tp, wv, 0, w * .97);
  let out = "";
  if (st.bar) {
    const [bc, bs] = st.bar, Lb = L * (1 - bs * (1 - wear * .45));
    out += `<path class="fo" d="${hOutline(f, L, w, taper, wear)}" fill="${wear ? hMix(bc, H_BLEACH, wear * .35) : bc}"/>`;
    out += `<path d="${hOutline(f, Lb, w * .98, taper * .4, 0)}" fill="${ec}"/><path d="${cen(Lb * .95, taper * .4, 0)}" fill="${cc}"/>`;
  } else {
    out += `<path class="fo" d="${hOutline(f, L, w, taper, wear)}" fill="${ec}"/>`;
    out += `<path d="${cen(L * (st.cl || .91), taper, Math.min(wear, .3))}" fill="${cc}"/>`;
  }
  if (st.base) out += `<path d="${hOutline(f, L * .52, w * .97, -.6, 0)}" fill="${st.base}"/>`;
  if (st.white && o.r6) out += `<path d="${hOutline(f, L * .96, w * .5, taper, wear, w * .48 * sd)}" fill="#f1efe8"/>`;
  if (st.bars) {
    const [bc, op] = st.bars, n = Math.max(3, Math.floor(L * .52 / 5.2));
    let d = "";
    for (let i = 0; i < n; i++) { const u = L * (.3 + .55 * i / (n - 1)); d += `M${hP(f, u, -w * .9)}L${hP(f, u + L * .02, w * .9)}`; }
    out += `<path d="${d}" stroke="${bc}" stroke-width="${(w * .24).toFixed(2)}" stroke-opacity="${op}" fill="none" stroke-linecap="round"/>`;
  }
  if (st.tip && !(o.len < 1)) {
    const [k, col0, sz0] = st.tip, col = wear ? hMix(col0, H_BLEACH, wear * .4) : col0, sz = sz0 * (1 - wear * .4);
    if (k === "spot") { const d = L * .22 * sz, h = w * .52 * sz; out += `<path d="M${hP(f, L * .975, -h)}Q${hP(f, L - d * .5, -h * 1.1)} ${hP(f, L - d, 0)}Q${hP(f, L - d * .5, h * 1.1)} ${hP(f, L * .975, h)}Q${hP(f, L * 1.005, 0)} ${hP(f, L * .975, -h)}Z" fill="${col}"/>`; }
    if (k === "wedge") { const d = L * .36 * sz, h = w * .55 * sz; out += `<path d="M${hP(f, L * .97, -h)}L${hP(f, L - d, 0)}L${hP(f, L * .97, h)}Q${hP(f, L * 1.005, 0)} ${hP(f, L * .97, -h)}Z" fill="${col}"/>`; }
    if (k === "oval") { const [cx, cy] = hPt(f, L * .87, 0); out += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(L * .1 * sz).toFixed(1)}" ry="${(w * .5 * sz).toFixed(1)}" transform="rotate(${f.a} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${col}"/>`; }
  }
  if (o.sheath) out += `<path d="${hOutline(f, o.sheath, w * .4, -.6, 0)}" fill="#a9bdd2" stroke="#5f7590" stroke-width=".5"/>`;
  out += `<path class="ra" d="M${hP(f, L * .05, 0)}L${hP(f, L * .88, 0)}"/>`;
  return `<g class="fe" data-f="${f.id}" data-g="${f.g}">${out}</g>`;
}

/* Bande des petites couvertures (bord d'attaque du bras) et des marginales de la main */
function hArm(look) {
  const lc = look.LC || "#6d5d44", ld = hMix(lc, "#000000", .28);
  let sc = `<path class="arm" d="M226,58C262,50 330,44 404,44C410,48 410,58 404,64C330,66 262,68 228,68Z" fill="${lc}"/>`;
  for (let r = 0; r < 3; r++) for (let x = 233 + (r % 2) * 5; x < 402; x += 10) {
    const y = 49 + r * 6 - (x - 232) * .03;
    sc += `<ellipse cx="${x}" cy="${y.toFixed(1)}" rx="5.4" ry="4.6" fill="${hMix(lc, "#ffffff", .06 - r * .03)}" stroke="${ld}" stroke-opacity=".45" stroke-width=".4"/>`;
  }
  return `<g class="fe lc" data-f="LC" data-g="LC">${sc}</g>`;
}
function hHand(look) {
  const lc = look.LC || "#6d5d44";
  return `<path class="hand" d="M236,52C212,52 182,53 150,55C147,57 148,61 151,62C182,61 210,62 238,64Z" fill="${hMix(lc, "#000000", .12)}"/>`;
}

/* Styles par zone et génération. gen : "j" juvénile, "a" adulte / post-juvénile. */
function hStyle(look, g, gen, id) {
  const key = g === "RP" || g === "RS" ? "R" : g === "CC" ? "AL" : g;
  const base = look[key] || look.R;
  const j = gen === "j" ? look[key + "j"] : null;
  const st = { ...base, ...(j || {}) };
  if (look.tune && look.tune[id]) Object.assign(st, look.tune[id]);
  return st;
}

/* Contour d'une plume entière (surbrillance, sélection, fantôme) */
function hOutlineOf(id, mo) {
  if (id === "LC") return "M226,58C262,50 330,44 404,44C410,48 410,58 404,64C330,66 262,68 228,68Z";
  const f = WG[id];
  if (!f) return "";
  const len = mo && f.g === "RP" ? ([.08, .08, .3, .56, .84, 1][mo[id] ?? 0] || 1) : 1;
  return hOutline(f, f.L * len, f.w, 0, 0);
}
function wingNums(ids) {
  return ids.map(id => {
    const f = WG[id];
    if (!f) return "";
    const [x, y] = hPt(f, f.L + (f.id === "P10" ? 7 : 9), 0);
    return `<text class="num" x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}">${f.id.replace(/^[PS]/, "")}</text>`;
  }).join("");
}
const hGroupIds = g => g === "LC" ? ["LC"] : WGEO.filter(f => f.g === g).map(f => f.id);
function wingOverlay(ids, cls, mo) {
  const all = [];
  for (const x of ids) { if (WGROUPS[x] && x !== "LC") all.push(...hGroupIds(x)); else all.push(x); }
  return all.map(id => `<path class="${cls}" d="${hOutlineOf(id, mo)}"/>`).join("");
}

/* Aile complète.
   w = { look, gen: {id: "j"}, wear: {id: n} | n, mo: {P1: 0..5}, hl: [ids|groupes], mark: [{id, t}], lim: [idA, idB], num: true, tap: true, vb, cls } */
function wingSvg(w) {
  const look = w.look, gens = w.gen || {}, wr = w.wear || 0;
  const wearOf = id => typeof wr === "number" ? wr : (wr[id] ?? wr._ ?? 0);
  let body = "";
  for (const f of WGEO) {
    const st = hStyle(look, f.g, gens[f.id] || "a", f.id);
    const o = { wear: wearOf(f.id) };
    if (w.mo && f.g === "RP") {
      const sc = w.mo[f.id] ?? 0;
      if (sc === 0) o.wear = Math.max(o.wear, .62);
      else if (sc < 5) { o.len = [0, .08, .3, .56, .84][sc]; o.sheath = f.L * Math.min(o.len * .62, .26); o.wear = 0; }
      else o.wear = 0;
      const stn = sc === 0 ? { ...st, c: hMix(st.c, "#8a7a62", .3), e: hMix(st.e, "#b9a988", .32) } : st;
      if (sc > 0 && sc < 5) body += `<path class="ghost" d="${hOutline(f, f.L, f.w, 0, 0)}"/>`;
      body += hFeather(f, stn, o);
      continue;
    }
    if (w.mo && (f.g === "CP" || f.g === "AL" || f.g === "CC")) continue;
    body += hFeather(f, st, o);
    if (f.id === "CP1") body += hHand(look);
    if (f.id === "MC9") body += hArm(look);
  }
  let over = "";
  if (w.hl && w.hl.length) over += wingOverlay(w.hl, "hlp", w.mo);
  if (w.ok && w.ok.length) over += wingOverlay(w.ok, "okp", w.mo);
  if (w.lim) {
    const [a, b] = w.lim.map(id => WG[id]);
    if (a && b) {
      const p1 = hPt(a, a.L * .25, 0), p2 = hPt(b, b.L * .25, 0), q1 = hPt(a, a.L * 1.05, 0), q2 = hPt(b, b.L * 1.05, 0);
      const x0 = (p1[0] + p2[0]) / 2, y0 = (p1[1] + p2[1]) / 2, x1 = (q1[0] + q2[0]) / 2, y1 = (q1[1] + q2[1]) / 2;
      over += `<path class="lim" d="M${x0.toFixed(1)},${y0.toFixed(1)}L${x1.toFixed(1)},${y1.toFixed(1)}"/>`;
    }
  }
  for (const m of w.mark || []) {
    const f = WG[m.id];
    if (!f) continue;
    const [x, y] = m.xy || hPt(f, f.L * (m.u ?? 1.13), 0), wd = m.t.length * 5.2 + 12;
    over += `<g class="mk ${m.c || ""}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><rect x="${(-wd / 2).toFixed(1)}" y="-7.5" width="${wd.toFixed(1)}" height="14" rx="7"/><text y="3.3">${esc(m.t)}</text></g>`;
  }
  if (w.num) over += wingNums(w.num === true ? WGEO.filter(f => f.g === "RP").map(f => f.id) : w.num);
  const vb = w.vb || H_VBF;
  return `<svg class="wing ${w.cls || ""}${vb === H_VBC ? " zc" : ""}" viewBox="${vb}" ${w.tap ? 'data-act="wtap"' : ""} role="img" aria-label="${esc(w.aria || "Aile déployée, vue de dessus")}"><g class="wb">${body}</g><g class="ov">${over}</g></svg>`;
}

/* ---------- Queue (12 rectrices, vue de dessus ; R1 au centre, R6 à l'extérieur) ---------- */
const TGEO = (() => {
  const F = [];
  for (const sd of [1, -1]) for (let i = 6; i >= 1; i--)
    F.push({ id: "R" + i, side: sd > 0 ? "g" : "d", g: "RR", x: 100 - sd * (i - .5) * 5.2, y: 18, a: 90 + sd * (i - .5) * 7.2, L: 98 - (i - 1) * 1.2, w: 9.4, sd });
  return F;
})();
const tailNums = () => TGEO.map(f => { const [x, y] = hPt(f, f.L - 9, 0); return `<text class="num tn" x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}">${f.id.slice(1)}</text>`; }).join("");
const tOutlineOf = (id, side) => TGEO.filter(f => f.id === id && (!side || f.side === side)).map(f => hOutline(f, f.L, f.w, 0, 0)).join("");
function tailSvg(t) {
  const look = t.look, st0 = look.RR || look.R;
  let body = "";
  for (const f of TGEO) {
    const g = (t.gen || {})[f.id] || t.def || "a";
    const st = { ...st0, ...(g === "j" ? look.RRj || {} : {}) };
    const taper = g === "j" ? (look.RRj?.taper ?? .75) : (st0.taper ?? -.35);
    const wv = t.wear ? (g === "j" ? t.wear : t.wear * .45) : (g === "j" ? .12 : 0);
    body += hFeather(f, st, { taper, wear: wv, r6: f.id === "R6" }).replace('data-g="RR"', `data-g="RR" data-s="${f.side}"`);
  }
  let over = "";
  for (const id of t.hl || []) over += `<path class="hlp" d="${tOutlineOf(id)}"/>`;
  for (const id of t.ok || []) over += `<path class="okp" d="${tOutlineOf(id)}"/>`;
  if (t.num) over += tailNums();
  return `<svg class="tail ${t.cls || ""}" viewBox="${t.vb || "2 0 196 122"}" ${t.tap ? 'data-act="ttap"' : ""} role="img" aria-label="Queue étalée, vue de dessus"><ellipse cx="100" cy="14" rx="24" ry="12" class="rump" fill="${look.LC || "#6d5d44"}"/><g class="wb">${body}</g><g class="ov">${over}</g></svg>`;
}

/* ---------- Œil (couleur de l'iris) ---------- */
function eyeSvg(iris, head) {
  const id = "hi" + (++H_UID);
  return `<svg class="heye" viewBox="0 0 64 64" role="img" aria-label="Iris"><defs><radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset=".35" stop-color="${hMix(iris, "#000000", .35)}"/><stop offset=".78" stop-color="${iris}"/><stop offset="1" stop-color="${hMix(iris, "#000000", .45)}"/></radialGradient></defs>
  <circle cx="32" cy="32" r="31" fill="${head || "#6d5d44"}"/><circle cx="32" cy="32" r="17.5" fill="#15110d"/><circle cx="32" cy="32" r="15" fill="url(#${id})"/><circle cx="32" cy="32" r="6.2" fill="#070605"/><circle cx="27.5" cy="27" r="3.2" fill="#fff" opacity=".85"/><circle cx="36" cy="36.5" r="1.3" fill="#fff" opacity=".35"/></svg>`;
}

/* ---------- Espèces : apparence, stratégie de mue, critères ----------
   Critères résumés d'après le Ringers' DigiGuide (station d'Ottenby) ; stratégies d'après le DigiGuide,
   le BTO et le CRBPO. Couleurs : c centre, e liseré (vexille externe), fr largeur du liseré,
   tip [spot | wedge | oval, couleur, taille], bar [couleur, part de la plume], bars [couleur, opacité]. */
const rint = (a, b) => a + rnd(b - a + 1);
const lc1 = s => s.charAt(0).toLowerCase() + s.slice(1);
const HDG = slug => `https://ringersdigiguide.ottenby.se/species/${slug}/`;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const HTOPO = {
  R: { c: "#3f3a35", e: "#8f8673", fr: .38 }, TT: { c: "#463b31", e: "#b39568", fr: .46 },
  GC: { c: "#433b33", e: "#a08b6a", fr: .46, tip: ["spot", "#dccfb2", .35] }, MC: { c: "#5a4c3e", e: "#a68d67", tip: ["spot", "#e4d8bd", .4] }, LC: "#8a7558",
  CP: { c: "#2e2a26", e: "#716b62", fr: .4 }, AL: { c: "#26231f", e: "#878071", fr: .42 }, RR: { c: "#4a4239", e: "#7d7364", taper: -.3 }, RRj: { taper: .8 }
};
const HSP = [
  { id: "rougegorge", sci: "Erithacus rubecula", fr: "Rougegorge familier", slug: "erithacus-rubecula", pj: "p", ad: "e", mode: "lim", spring: true, key: ["GC"], eye: true, tail: true,
    look: { R: { c: "#4a3a2b", e: "#7d6a45" }, TT: { c: "#4b3b2c", e: "#80704a" }, GC: { c: "#4f4030", e: "#7f7247", fr: .45 }, GCj: { c: "#5a4532", e: "#9b7646", tip: ["spot", "#e6bb7a", 1] },
      MC: { c: "#6f6043", e: "#7d6d4b" }, LC: "#74664a", CP: { c: "#463729", e: "#7a6a46" }, CPj: { c: "#4f3f30", e: "#8a7450", wear: .22 }, AL: { c: "#3f3226", e: "#6f5f40" },
      RR: { c: "#6b5236", e: "#7d6a45", taper: -.3 }, RRj: { c: "#76593a", taper: .78 }, iris: ["#6f6c64", "#5a3a21"], head: "#d47b3f" },
    y: () => ({ gc: rint(3, 6) }), ty: { gc: 4 },
    crit: ["1A : 3 à 6 GC internes renouvelées. Les GC externes, juvéniles, sont plus rousses avec une large pointe chamois : la limite de mue est au milieu des GC.",
      "+1A : GC uniformes, olive, sans pointe pâle (ou très discrète).",
      "En appoint : rectrices plus étroites et pointues chez le 1A ; iris gris-brun froid (1A), brun chaud (+1A).",
      "Au printemps, mêmes critères : les GC juvéniles du 2A sont plus usées, leur pointe peut avoir disparu."] },
  { id: "charbonniere", sci: "Parus major", fr: "Mésange charbonnière", slug: "parus-major", pj: "p", ad: "e", mode: "lim", spring: true, key: ["CP", "GC"], eye: true,
    look: { R: { c: "#353b44", e: "#8ca3b8", fr: .4 }, TT: { c: "#30363e", e: "#b9c6c8", fr: .45, tip: ["spot", "#eef0ea", .5] }, TTj: { c: "#3a3d40", e: "#a9b2ac", wear: .15 },
      GC: { c: "#2f353d", e: "#7f9dbd", fr: .5, bar: ["#f3f4ef", .2] }, GCj: { c: "#3b3f41", e: "#93a196", bar: ["#ebe5c6", .13] },
      MC: { c: "#3a4d63", e: "#7495b5", fr: .6 }, LC: "#6f8ea5", CP: { c: "#2b3139", e: "#7e9cbc", fr: .5 }, CPj: { c: "#3d4245", e: "#8f9893", fr: .42, wear: .15 },
      AL: { c: "#262b31", e: "#7d9aba", fr: .45 }, ALj: { c: "#393d40", e: "#8b948f", wear: .12 }, RR: { c: "#3d4855", e: "#7f97ae", white: 1, taper: -.3 }, iris: ["#4f5249", "#635042"], head: "#1b1b1b" },
    y: () => ({ gc: Math.random() < .9 ? 10 : rint(7, 9), al: Math.random() < .6 ? [0, 0, 1] : [1, 1, 1], tt: Math.random() < .7 ? [1, 1, 1] : [0, 1, 1] }), ty: { gc: 10, al: [0, 0, 1], tt: [1, 1, 1] },
    crit: ["1A : presque toujours toutes les GC renouvelées (bleu-gris vif), mais les couvertures primaires restent juvéniles, plus ternes et moins denses : contraste GC / CP.",
      "Souvent aussi : les 2 plumes externes de l'alule juvéniles, parfois la plus longue tertiaire.",
      "+1A : aile uniforme, CP d'un bleu-gris lustré comme les GC.",
      "Environ 8 % des 1A gardent 1 à 3 GC externes juvéniles, moins bleues, à pointe plus petite."] },
  { id: "bleue", sci: "Cyanistes caeruleus", fr: "Mésange bleue", slug: "cyanistes-caeruleus", pj: "p", ad: "e", mode: "lim", spring: true, key: ["CP", "GC"], eye: true,
    look: { R: { c: "#2f3744", e: "#4c86cc", fr: .42 }, TT: { c: "#2d3644", e: "#5c8cc4", fr: .45, tip: ["spot", "#f2f4f6", .55] }, TTj: { c: "#353e47", e: "#7391a0" },
      GC: { c: "#2b3a57", e: "#3f80d6", fr: .55, bar: ["#f5f7f8", .2] }, GCj: { c: "#34404a", e: "#6e94a2", bar: ["#eef0ea", .15] },
      MC: { c: "#2f5ea8", e: "#4a8ad8", fr: .6 }, LC: "#4d84c6", CP: { c: "#263553", e: "#3b79d2", fr: .55 }, CPj: { c: "#36414b", e: "#6f8a9c", fr: .45, wear: .12 },
      AL: { c: "#283246", e: "#3e7cd0", fr: .5 }, ALj: { c: "#36414b", e: "#6f8a9c" }, RR: { c: "#365a8e", e: "#4a7fc4", taper: -.3 }, iris: ["#4f5249", "#635042"], head: "#1d2a42" },
    y: () => ({ gc: Math.random() < .85 ? 10 : rint(6, 9), al: Math.random() < .5 ? [0, 1, 1] : [1, 1, 1], tt: Math.random() < .7 ? [1, 1, 1] : [0, 1, 1] }), ty: { gc: 10, al: [0, 1, 1], tt: [1, 1, 1] },
    crit: ["1A : GC renouvelées d'un bleu vif, contre couvertures primaires juvéniles plus ternes, gris-bleu verdâtre : contraste GC / CP.",
      "Environ 14 % gardent 1 à 5 GC externes juvéniles, plus vertes. Souvent : alule externe juvénile, R1 renouvelées.",
      "+1A : plumage uniforme, CP d'un bleu vif comme les GC."] },
  { id: "merle", sci: "Turdus merula", fr: "Merle noir", sex: "♂", slug: "turdus-merula", pj: "p", ad: "e", mode: "lim", spring: true, key: ["GC"], tail: true,
    look: { R: { c: "#141313", e: "#201e1d", fr: .3 }, Rj: { c: "#2c241d", e: "#3d3128" }, TT: { c: "#151414", e: "#211f1e" }, TTj: { c: "#2d251e", e: "#45372b" },
      GC: { c: "#161515", e: "#232120", fr: .35 }, GCj: { c: "#3a2e23", e: "#6e5539", fr: .45, tip: ["spot", "#8f6d46", .45] },
      MC: { c: "#161515", e: "#211f1e" }, LC: "#1b1a19", CP: { c: "#151414", e: "#201e1d" }, CPj: { c: "#2d251e", e: "#4d3d2f", wear: .15 },
      AL: { c: "#121111", e: "#1d1b1a" }, ALj: { c: "#2b231c", e: "#3e3229" }, RR: { c: "#131212", e: "#1d1c1b", taper: -.3 }, RRj: { c: "#2a231d", e: "#372d25", taper: .8 } },
    y: () => ({ gc: rint(4, 8) }), ty: { gc: 6 },
    crit: ["1A ♂ : 4 à 8 GC internes neuves, noires, contre GC externes juvéniles brun-roux : contraste très net.",
      "Rémiges, couvertures primaires et souvent tertiaires restent juvéniles : brunâtres, pas noires.",
      "+1A ♂ : aile entièrement noire et uniforme ; rectrices larges et arrondies.",
      "Au printemps, le jeune mâle (2A) garde ses rémiges brunes."] },
  { id: "musicienne", sci: "Turdus philomelos", fr: "Grive musicienne", slug: "turdus-philomelos", pj: "p", ad: "e", mode: "lim", spring: true, key: ["GC"], tail: true,
    look: { R: { c: "#5b4a34", e: "#7f6c49", fr: .4 }, TT: { c: "#584834", e: "#7a6a48", tip: ["spot", "#d6b67a", .35] }, TTj: { e: "#8d6b42", tip: ["wedge", "#e2c287", .7] },
      GC: { c: "#5a4a35", e: "#7a6b48", tip: ["spot", "#d9bb80", .35] }, GCj: { c: "#5d4a33", e: "#916c40", tip: ["wedge", "#ebcb8c", 1] },
      MC: { c: "#5e4e37", e: "#76663f", tip: ["spot", "#d3b37a", .5] }, LC: "#6c5d40", CP: { c: "#4e3f2d", e: "#7a6a46" }, CPj: { c: "#55432f", e: "#8a6e48", wear: .2 },
      AL: { c: "#463828", e: "#6e5e40" }, RR: { c: "#5f4d36", e: "#76653f", taper: -.3 }, RRj: { taper: .78 } },
    y: () => ({ gc: rint(2, 6) }), ty: { gc: 4 },
    crit: ["1A : 2 à 6 GC internes renouvelées. Les GC externes juvéniles, plus rousses, ont une pointe chamois large qui remonte le long du rachis, en coin.",
      "+1A : GC uniformes, olive, à petite pointe pâle ou sans pointe.",
      "Piège : la taille de la pointe varie à tout âge. Cherche surtout la différence de teinte, roux contre olive."] },
  { id: "atricapilla", sci: "Sylvia atricapilla", fr: "Fauvette à tête noire", slug: "sylvia-atricapilla", pj: "p", ad: "e", mode: "lim", spring: false, mig: 1, key: ["GC", "CP", "AL"], eye: true, tail: true,
    look: { R: { c: "#4c473f", e: "#7d796a", fr: .38 }, TT: { c: "#46423b", e: "#86816d" }, TTj: { c: "#584e43", e: "#8a7a62", wear: .15 },
      GC: { c: "#47433c", e: "#86826e", fr: .45 }, GCj: { c: "#5b4f41", e: "#8f765a", wear: .3 }, MC: { c: "#59554b", e: "#7c7866" }, LC: "#77735f",
      CP: { c: "#3e3a35", e: "#8b8875" }, CPj: { c: "#564b3f", e: "#8b7559", wear: .3 }, AL: { c: "#2f2c28", e: "#8b8875" }, ALj: { c: "#544a3f", e: "#86735b", wear: .25 },
      RR: { c: "#57524a", e: "#6f6a5d", taper: -.3 }, RRj: { c: "#5f574c", taper: .78 }, iris: ["#4f5355", "#6b4126"], head: "#8a8676" },
    y: () => ({ gc: Math.random() < .12 ? 10 : rint(6, 9), tt: Math.random() < .6 ? [0, 0, 0] : [0, 1, 1] }), ty: { gc: 8 },
    crit: ["1A : 0 à 4 GC externes juvéniles, plus brunes et plus usées ; couvertures primaires et alule juvéniles, brunâtres.",
      "+1A : plumage frais et uniforme ; alule à centre sombre lustré, CP à liseré gris-olive.",
      "Iris : gris foncé froid (1A), brun chaud (+1A). Critère d'appoint, à combiner."] },
  { id: "grisette", sn: "Beaucoup d'adultes suspendent leur mue et gardent quelques secondaires usées.",  sci: "Curruca communis", fr: "Fauvette grisette", slug: "sylvia-communis", pj: "p", ad: "e", mode: "lim", spring: false, mig: 1, key: ["GC"], eye: true, tail: true,
    look: { R: { c: "#4a3f35", e: "#a17b52", fr: .4 }, TT: { c: "#2e2823", e: "#c3875a", fr: .45 }, TTj: { c: "#584b40", e: "#b8915f", fr: .58 },
      GC: { c: "#2c2622", e: "#c48752", fr: .45 }, GCj: { c: "#564a3f", e: "#b5966b", fr: .58, wear: .22 }, MC: { c: "#6e5641", e: "#9a7552" }, LC: "#8a6e52",
      CP: { c: "#3a332e", e: "#8f8b82" }, CPj: { c: "#4f453b", e: "#a07d58", wear: .2 }, AL: { c: "#24201d", e: "#d6cebf" }, ALj: { c: "#594b3f", e: "#9a7a58" },
      RR: { c: "#4b4743", e: "#5c5751", white: 1, taper: -.3, tip: ["spot", "#f4f2ec", .7] }, RRj: { c: "#6b5c4c", e: "#78695a", taper: .78, tip: ["spot", "#a8987f", .5] },
      iris: ["#4f4431", "#a3844c"], head: "#8e8b84" },
    y: () => ({ gc: rint(1, 4) }), ty: { gc: 2 },
    crit: ["1A : les 1 à 3 GC internes neuves ont un centre noirâtre net et un liseré roux vif ; les GC juvéniles sont plus pâles, au liseré chamois-roux diffus.",
      "+1A : GC à centre noirâtre bien tranché ; rectrices larges à pointe blanc pur.",
      "Iris très utile : brun-olive sombre (1A), olive pâle à orangé (+1A)."] },
  { id: "jardins", sn: "Les adultes traversent l'Europe en plumage usé et muent en Afrique.",  sci: "Sylvia borin", fr: "Fauvette des jardins", slug: "sylvia-borin", pj: "p", ad: "h", mode: "wear", mig: 1, key: ["RP", "CP", "GC", "TT"],
    look: { R: { c: "#665a48", e: "#8c7f67", fr: .4 }, TT: { c: "#625644", e: "#8e826a" }, GC: { c: "#655947", e: "#8b7f66" }, MC: { c: "#6d614e", e: "#857961" }, LC: "#7a6e58",
      CP: { c: "#5f5342", e: "#8a7d64" }, AL: { c: "#574c3d", e: "#7f735c" }, RR: { c: "#685c4a", e: "#7e725e" } },
    crit: ["Pas de vraie limite de mue en automne : les adultes partent avec un plumage usé et muent en Afrique.",
      "1A : tout le plumage est frais. +1A : plumage usé, surtout GC, CP, pointes des primaires et queue.",
      "Au printemps, tous ont mué complètement en hiver : âge non déterminable, donc +1A."] },
  { id: "veloce", sci: "Phylloscopus collybita", fr: "Pouillot véloce", slug: "phylloscopus-collybita", pj: "p", ad: "e", mode: "lim", spring: false, mig: 1, key: ["GC"], eye: true, tail: true,
    look: { R: { c: "#4e4b3f", e: "#8d9356", fr: .36 }, TT: { c: "#3d3b33", e: "#97a059", fr: .42 }, TTj: { c: "#56523f", e: "#8f8a5e" },
      GC: { c: "#3c3a32", e: "#8f9c53", fr: .45 }, GCj: { c: "#57533f", e: "#9c9064", fr: .45 }, MC: { c: "#565541", e: "#858b51" }, LC: "#80864f",
      CP: { c: "#3e3c34", e: "#8a8f58" }, CPj: { c: "#54503f", e: "#8d8a62", wear: .25 }, AL: { c: "#3d3b33", e: "#7d8152" },
      RR: { c: "#55523f", e: "#7a7d50", taper: -.25 }, RRj: { c: "#6a6249", e: "#7c7556", taper: .78 }, iris: ["#4a4c4d", "#5e5046"], head: "#807e5b" },
    y: () => ({ gc: rint(2, 5), tt: pick([[0, 0, 0], [0, 0, 1], [1, 1, 1]]) }), ty: { gc: 3, tt: [0, 0, 1] },
    crit: ["1A : 2 à 5 GC internes neuves (centre plus sombre, liseré vert olive) contre GC juvéniles au liseré chamois-brun verdâtre.",
      "Souvent une ou toutes les tertiaires renouvelées. Rectrices juvéniles étroites, pointues, plus pâles.",
      "Iris gris foncé froid (1A), gris-brun plus chaud (+1A) : à confirmer par la mue."] },
  { id: "effarvatte", sn: "Les adultes traversent l'Europe en plumage usé et muent en Afrique.",  sci: "Acrocephalus scirpaceus", fr: "Rousserolle effarvatte", slug: "acrocephalus-scirpaceus", pj: "n", ad: "h", mode: "wear", mig: 1, key: ["RP", "TT", "CP", "GC"], eye: true,
    look: { R: { c: "#6b5a43", e: "#917855", fr: .38 }, TT: { c: "#675641", e: "#937a57" }, GC: { c: "#6a5942", e: "#907755" }, MC: { c: "#705f47", e: "#8d7553" }, LC: "#86704f",
      CP: { c: "#655540", e: "#8e7654" }, AL: { c: "#5f503c", e: "#86704f" }, RR: { c: "#6d5b43", e: "#8a7252" }, iris: ["#6e6d66", "#7c5a3a"], head: "#8e7a5c" },
    crit: ["Pas de limite de mue en automne : les jeunes partent en plumage juvénile frais, les adultes muent en Afrique.",
      "1A : tout le plumage est frais. +1A : plumage usé, surtout GC, CP, tertiaires, pointes des primaires et queue.",
      "Iris gris froid (1A), brun chaud (+1A) : critère d'appoint.", "Au printemps : mue complète en hiver pour tous, donc +1A."] },
  { id: "phragmite", sn: "Les adultes traversent l'Europe en plumage usé et muent en Afrique.",  sci: "Acrocephalus schoenobaenus", fr: "Phragmite des joncs", slug: "acrocephalus-schoenobaenus", pj: "n", ad: "h", mode: "wear", mig: 1, key: ["RP", "TT", "CP", "GC"], eye: true,
    look: { R: { c: "#4c3d2c", e: "#9d8158", fr: .4 }, TT: { c: "#2e241b", e: "#c5a474", fr: .55 }, GC: { c: "#3e3125", e: "#b49567", fr: .5 }, MC: { c: "#4d3d2c", e: "#a98b5f" }, LC: "#9c8159",
      CP: { c: "#45372a", e: "#9a7e56" }, AL: { c: "#3a2e23", e: "#94784f" }, RR: { c: "#5a4834", e: "#8a7050" }, iris: ["#706a60", "#6c4b30"], head: "#a58b62" },
    crit: ["Même logique que l'effarvatte : le 1A est tout frais, le +1A usé (pointes des primaires, tertiaires, GC, CP, queue).",
      "Iris gris-brun froid (1A), brun chaud (+1A) : en appoint.", "Au printemps : mue complète en hiver pour tous, donc +1A."] },
  { id: "accenteur", sci: "Prunella modularis", fr: "Accenteur mouchet", slug: "prunella-modularis", pj: "p", ad: "e", mode: "lim", spring: true, key: ["GC", "MC"], eye: true, tail: true,
    look: { R: { c: "#3b2f25", e: "#8a6542", fr: .38 }, TT: { c: "#3d3229", e: "#8a6e4a", tip: ["spot", "#d9d1c0", .35] }, TTj: { c: "#2a221c", e: "#9a6a3a", tip: ["oval", "#e4cd85", .75] },
      GC: { c: "#4a4038", e: "#8b7752", fr: .5, tip: ["spot", "#d8d2c4", .35] }, GCj: { c: "#29211b", e: "#9d6b3b", fr: .36, tip: ["oval", "#e8d283", 1] },
      MC: { c: "#4a3e33", e: "#8b7451", tip: ["spot", "#d5cdb8", .45] }, LC: "#7d6a50", CP: { c: "#463b31", e: "#8f7c5e", fr: .5 }, CPj: { c: "#2c241d", e: "#8a6a44", fr: .28 },
      AL: { c: "#3a3028", e: "#7e6a50" }, RR: { c: "#5d4a37", e: "#715c45", taper: -.25 }, RRj: { taper: .78 }, iris: ["#6b654b", "#7d3b24"], head: "#6f6c66" },
    y: () => ({ gc: Math.random() < .6 ? 0 : rint(1, 3) }), ty: { gc: 0 },
    crit: ["1A : souvent aucune GC renouvelée, la limite est entre les MC neuves et les GC juvéniles ; parfois 1 à 3 GC internes neuves.",
      "GC juvéniles : centre noir, liseré brun chaud net, grosse tache ovale jaunâtre à la pointe. GC adultes : plus larges, liseré olive, tache petite, blanchâtre et diffuse.",
      "Iris brun-olive froid (1A), brun chaud à rougeâtre (+1A), mais il change vite en automne."] },
  { id: "pinson", sci: "Fringilla coelebs", fr: "Pinson des arbres", sex: "♂", slug: "fringilla-coelebs", pj: "p", ad: "e", mode: "lim", spring: true, key: ["GC", "CP"], tail: true,
    look: { R: { c: "#25211f", e: "#e2dbb5", fr: .3 }, TT: { c: "#1f1b18", e: "#c38b4f", fr: .45 }, TTj: { c: "#3a2e26", e: "#b39a6e" },
      GC: { c: "#2a2724", e: "#36322e", fr: .3, bar: ["#f3ecca", .3] }, GCj: { c: "#5c5955", e: "#65625e", bar: ["#e9e7df", .13], wear: .3 },
      MC: { c: "#f1efe6", e: "#f6f4ee" }, LC: "#6f7a76", CP: { c: "#1c1a19", e: "#2a2725", fr: .3 }, CPj: { c: "#3f3a36", e: "#6e7365", wear: .35 },
      AL: { c: "#1d1a18", e: "#2b2825" }, RR: { c: "#2b2724", e: "#4a4540", white: 1, taper: -.3 }, RRj: { c: "#3a3530", taper: .8 } },
    y: () => ({ gc: rint(6, 10) }), ty: { gc: 8 },
    crit: ["1A : 6 à 10 GC renouvelées. Les GC externes juvéniles sont plus grises, usées, à pointe blanche étroite ; les neuves sont noires à large pointe blanc-jaunâtre.",
      "Si toutes les GC sont neuves : contraste avec les couvertures primaires juvéniles, plus étroites et usées.",
      "Tertiaires souvent juvéniles (centre brun) ; rectrices juvéniles étroites et pointues."] },
  { id: "gorgebleue", sci: "Luscinia svecica", fr: "Gorgebleue à miroir", slug: "luscinia-svecica", pj: "p", ad: "e", mode: "lim", spring: true, mig: 1, key: ["GC"], tail: true,
    look: { R: { c: "#4f4438", e: "#7d6b53", fr: .38 }, TT: { c: "#4a4036", e: "#88755b", fr: .5 }, TTj: { c: "#52463a", e: "#8a7254", tip: ["wedge", "#d9a464", .8] },
      GC: { c: "#49413a", e: "#806e50", fr: .45 }, GCj: { c: "#55493c", e: "#8a7254", tip: ["wedge", "#dda667", 1], wear: .15 }, MC: { c: "#5b4f42", e: "#7d6b52" }, LC: "#7a6a52",
      CP: { c: "#463d33", e: "#8a7860" }, CPj: { c: "#4c4237", e: "#86735a" }, AL: { c: "#3d352c", e: "#75644d" },
      RR: { c: "#3a302a", e: "#4a3f37", base: "#c4703a", taper: -.25 }, RRj: { taper: .7 } },
    y: () => ({ gc: rint(1, 3) }), ty: { gc: 2 },
    crit: ["1A : 1 à 3 GC internes neuves (centre gris sombre, liseré olive net, sans tache) contre GC juvéniles à tache roux pâle en coin à la pointe.",
      "Tertiaires juvéniles au même motif ; chez beaucoup de jeunes, les coins pâles touchent aussi les couvertures primaires internes.",
      "+1A : GC uniformes, brun-olive, sans tache ou presque."] },
  { id: "troglodyte", sci: "Troglodytes troglodytes", fr: "Troglodyte mignon", slug: "troglodytes-troglodytes", pj: "p", ad: "e", mode: "lim", spring: true, key: ["GC"],
    look: { R: { c: "#6b4a30", e: "#8a6440", fr: .35, bars: ["#2c1f16", .55] }, TT: { c: "#6d4c33", e: "#8a6642", bars: ["#2a1d15", .6] }, TTj: { c: "#8a5f38", e: "#946a42", bars: ["#4a3424", .35] },
      GC: { c: "#6f5a44", e: "#7f6a52", bars: ["#241a12", .72], tip: ["spot", "#ebe3d3", .55] }, GCj: { c: "#8a5f38", e: "#93683f", bars: ["#4a3424", .32], tip: ["spot", "#dbb27e", .5] },
      MC: { c: "#735a42", e: "#7f654a", tip: ["spot", "#e4dccb", .5] }, LC: "#7a5a3c", CP: { c: "#6a5743", e: "#7a6450", bars: ["#231910", .7] }, CPj: { c: "#8a5f38", e: "#93683f", bars: ["#3a2a1c", .32] },
      AL: { c: "#5f4a36", e: "#735b42", bars: ["#2a1d15", .5] }, RR: { c: "#6f4e33", e: "#7f5c3e", bars: ["#2a1d15", .6] } },
    y: () => ({ gc: rint(4, 7) }), ty: { gc: 5 },
    crit: ["1A : 4 à 7 GC internes neuves (brun plus froid, barres sombres nettes, souvent une pointe blanchâtre) contre GC juvéniles brun chaud, à barres diffuses et pointe chamois.",
      "Couvertures primaires juvéniles brun chaud peu barrées ; chez l'adulte, brun froid nettement barré.",
      "Oiseaux difficiles fréquents : dans le doute, on ne donne pas d'âge."] },
  { id: "roseaux", sci: "Emberiza schoeniclus", fr: "Bruant des roseaux", slug: "emberiza-schoeniclus", pj: "p", ad: "e", mode: "lim", spring: true, key: ["AL", "CP"], eye: true, tail: true,
    look: { R: { c: "#3a2d22", e: "#a5794b", fr: .4 }, TT: { c: "#231b15", e: "#c18b53", fr: .48 }, TTj: { c: "#3d3026", e: "#b08b62", wear: .3 },
      GC: { c: "#2c241c", e: "#b58453", fr: .45, tip: ["spot", "#d9c6a0", .5] }, MC: { c: "#3a2c20", e: "#a8774a" }, LC: "#9a7a5a",
      CP: { c: "#3a2e24", e: "#9c8a76", fr: .45 }, CPj: { c: "#5a4a3a", e: "#8f7458", wear: .35 }, AL: { c: "#1f1914", e: "#8a6a48", fr: .4 }, ALj: { c: "#4a3c30", e: "#86694c", wear: .38 },
      RR: { c: "#3a302a", e: "#4c4038", white: 1, taper: -.3 }, RRj: { taper: .8 }, iris: ["#6e7070", "#6f5c4a"], head: "#4a3b2e" },
    y: () => ({ gc: 10, al: Math.random() < .7 ? [0, 1, 1] : [0, 0, 1], tt: pick([[0, 1, 1], [0, 0, 1], [1, 1, 1], [0, 0, 0]]) }), ty: { gc: 10, al: [0, 1, 1], tt: [0, 1, 1] },
    crit: ["1A : presque toutes les GC sont renouvelées, la limite est ailleurs : alule externe juvénile (brune, usée) contre alule interne neuve ; couvertures primaires juvéniles plus pâles et usées.",
      "Tertiaires : 0 à 3 renouvelées, souvent 2. Près de la moitié des jeunes changent quelques rectrices.",
      "Rectrices juvéniles étroites et pointues ; iris gris froid (1A), gris-brun plus chaud (+1A)."] },
  { id: "moineau", sn: "Le jeune prend d'un coup le plumage adulte : impossible de l'âger sur le plumage ensuite.",  sci: "Passer domesticus", fr: "Moineau domestique", pj: "c", ad: "e", mode: "comp", spring: false, key: [], src: "https://www.bto.org/learn/skills/bird-identification/young-birds",
    look: { R: { c: "#3a2e24", e: "#a27a4c", fr: .4 }, TT: { c: "#2a211a", e: "#b98a55", fr: .5 }, GC: { c: "#2d241c", e: "#b07f4b", fr: .45, tip: ["spot", "#d9bf8a", .5] },
      MC: { c: "#3a2c22", e: "#5a4434", bar: ["#f1ede2", .35] }, LC: "#8d5a33", CP: { c: "#3a2e24", e: "#7d6046" }, AL: { c: "#2f251d", e: "#7a5c42" }, RR: { c: "#4a3b2e", e: "#6e5843" } },
    crit: ["Mue post-juvénile complète : en fin d'automne, le 1A a le même plumage que l'adulte.",
      "Sur le plumage seul : âge indéterminé en automne (EURING 2), +1A au printemps.",
      "Seule une pneumatisation incomplète du crâne peut encore trahir un 1A."] },
  { id: "longuequeue", sn: "Le jeune prend d'un coup le plumage adulte, juste après l'envol.",  sci: "Aegithalos caudatus", fr: "Mésange à longue queue", pj: "c", ad: "e", mode: "comp", spring: false, key: [], src: "https://www.bto.org/learn/skills/bird-identification/young-birds",
    look: { R: { c: "#262322", e: "#4d4744", fr: .35 }, TT: { c: "#2a2625", e: "#e9e4dd", fr: .55 }, GC: { c: "#232120", e: "#302c2a" }, MC: { c: "#262322", e: "#302c2a" }, LC: "#2c2827",
      CP: { c: "#242120", e: "#3a3533" }, AL: { c: "#201d1c", e: "#2d2927" }, RR: { c: "#1f1c1b", e: "#2a2625", white: 1 } },
    crit: ["Mue post-juvénile complète, juste après l'envol : jeunes et adultes ne se distinguent plus par le plumage.",
      "Automne : âge indéterminé sur le plumage (EURING 2). Printemps : +1A."] },
  { id: "etourneau", sn: "Le jeune prend le plumage adulte avant l'hiver.",  sci: "Sturnus vulgaris", fr: "Étourneau sansonnet", pj: "c", ad: "e", mode: "none", src: "https://www.bto.org/learn/skills/bird-identification/young-birds",
    crit: ["Mue post-juvénile complète entre l'été et l'hiver : le jeune prend le plumage adulte (parfois quelques plumes brunes à la tête)."] },
  { id: "fitis", sn: "Il renouvelle tout son plumage en été en Europe, puis encore une fois en hiver en Afrique.",  sci: "Phylloscopus trochilus", fr: "Pouillot fitis", slug: "phylloscopus-trochilus", pj: "p", ad: "2", mode: "none",
    crit: ["Deux mues complètes par an chez l'adulte : en été en Europe, puis en hiver en Afrique.",
      "Le jeune fait une mue post-juvénile limitée (corps, souvent petites et moyennes couvertures), puis une mue complète en Afrique."] }
];
const HSPI = Object.fromEntries(HSP.map(s => [s.id, s]));
const HPJ = { p: "Partielle", c: "Complète", n: "Très limitée ou nulle" };
const HPJS = { p: "corps et couvertures, rémiges gardées", c: "tout le plumage, rémiges comprises", n: "le jeune finit juste de pousser" };
const HAD = { e: "Complète, en été (ici)", h: "Complète, en hiver (Afrique)", "2": "Deux complètes par an" };
const HADS = { e: "après la reproduction, avant de partir", h: "les plumes usées traversent l'Europe", "2": "en été en Europe et en hiver en Afrique" };

/* Codes d'âge : notation CRBPO et code EURING */
const AGEC = {
  PUL: { l: "PUL", e: 1, s: "poussin au nid" }, "1A": { l: "1A", e: 3, s: "né cette année" }, "+1A": { l: "+1A", e: 4, s: "né avant cette année" },
  "2A": { l: "2A", e: 5, s: "né l'an dernier" }, "+2A": { l: "+2A", e: 6, s: "né avant l'an dernier" }, IND: { l: "Âge ?", e: 2, s: "volant, âge inconnu" }
};
const ageChoice = k => ({ key: k, label: AGEC[k].l, sub: `EURING ${AGEC[k].e} · ${AGEC[k].s}` });
const HEX = [
  { k: "topo", n: "Topographie", d: "Zones et numéros", ic: "wing", c: "#1FD1F2" },
  { k: "mue", n: "Score de mue", d: "La fiche de 0 à 5", ic: "gauge", c: "#3BE59D" },
  { k: "age", n: "Âge", d: "Lire la limite de mue", ic: "cal", c: "#FF8B3D" },
  { k: "code", n: "Codes d'âge", d: "CRBPO et EURING", ic: "tag", c: "#FFCB5C" },
  { k: "strat", n: "Stratégies", d: "Qui mue quoi, et où", ic: "cycle", c: "#A58BFF" }
];

/* ---------- Scènes d'âge ---------- */
function hScene(sp, season, young, pat) {
  const gen = {}, wr = {};
  if (sp.mode === "lim" && young) {
    const p = { gc: 10, tt: [0, 0, 0], al: [0, 0, 0], ...(pat || sp.y()) };
    for (const f of WGEO) if (f.g === "RP" || f.g === "RS" || f.g === "CP") gen[f.id] = "j";
    for (let i = 1; i <= 10 - p.gc; i++) gen["GC" + i] = "j";
    p.tt.forEach((nw, i) => { if (!nw) gen["S" + (7 + i)] = "j"; });
    p.al.forEach((nw, i) => { if (!nw) gen["AL" + (i + 1)] = "j"; });
    gen._p = p;
  }
  for (const f of WGEO) {
    const j = gen[f.id] === "j";
    if (season === "aut") wr[f.id] = sp.mode === "wear" ? (young ? 0 : .8) : j ? .1 : 0;
    else wr[f.id] = sp.mode === "lim" ? (j ? .52 : .2) : sp.mode === "comp" ? .22 : .04;
  }
  let ans;
  if (season === "aut") ans = sp.mode === "comp" ? "IND" : young ? "1A" : "+1A";
  else ans = sp.mode === "lim" && sp.spring ? (young ? "2A" : "+2A") : "+1A";
  return { gen, wear: wr, ans };
}
/* Marques pédagogiques : où est la limite, ce qui est juvénile ou neuf */
function hSceneMarks(sp, sc, young) {
  const p = sc.gen._p, out = { mark: [], lim: null, hl: [] };
  if (sp.mode === "wear") { out.mark = [{ id: "P6", t: young ? "frais" : "usé", c: young ? "n" : "" }, { id: "S8", t: young ? "frais" : "usé", c: young ? "n" : "" }]; return out; }
  if (sp.mode !== "lim" || !young || !p) return out;
  const nj = 10 - p.gc;
  if (nj > 0 && nj < 10) { out.lim = ["GC" + nj, "GC" + (nj + 1)]; out.mark.push({ id: "GC" + Math.max(1, nj - 1), t: "juv.", u: 1.16 }, { id: "GC" + Math.min(10, nj + 2), t: "neuves", c: "n", u: 1.16 }); }
  else if (nj === 10) out.mark.push({ id: "GC4", t: "GC juv.", u: 1.16 }, { id: "MC7", t: "MC neuves", c: "n", xy: [352, 37] });
  else out.mark.push({ id: "CP5", t: "CP juv.", xy: [176, 124] }, { id: "GC4", t: "GC neuves", c: "n", u: 1.16 });
  if (p.al && p.al.some(x => !x) && p.al.some(x => x)) out.mark.push({ id: "AL1", t: "alule juv.", xy: [190, 39] });
  return out;
}

/* ---------- Construction des questions ---------- */
const hZoneExpl = g => `<b>${esc(WGROUPS[g].n)}</b>${WGROUPS[g].ab ? ` (${esc(WGROUPS[g].ab)})` : ""} : ${esc(WGROUPS[g].s)}.`;
const hSpAge = () => HSP.filter(s => s.mode === "lim" || s.mode === "wear" || s.mode === "comp");
function hFresh(ses, list, keyf, tag) {
  const seen = new Set(ses.recent.filter(x => typeof x === "string" && x.startsWith(tag)));
  const fresh = list.filter(x => !seen.has(tag + keyf(x)));
  const it = pick(fresh.length ? fresh : list);
  ses.recent.push(tag + keyf(it));
  return it;
}
function hBase(ex, extra) { return { kind: "hand", ex, hintsUsed: 0, hints: [], format: "qcm", ...extra }; }

function hTopoQ(ses) {
  const r = Math.random(), zones = Object.keys(WGROUPS);
  if (r < .28) {
    const g = hFresh(ses, zones, x => x, "tz:");
    return hBase("topo", { format: "tap", target: "zone", prompt: "Touche : " + WGROUPS[g].n.toLowerCase(), icon: "wing", stage: "wing", w: { look: HTOPO, tap: true }, accept: [g],
      expl: hZoneExpl(g) });
  }
  if (r < .52) {
    const g = hFresh(ses, zones, x => x, "nz:");
    const ch = shuffle([g, ...sample(zones.filter(x => x !== g), 3)]).map(x => ({ key: x, label: WGROUPS[x].n, sub: WGROUPS[x].ab }));
    return hBase("topo", { prompt: "Comment s'appelle cette zone ?", icon: "wing", stage: "wing", w: { look: HTOPO, hl: [g] }, choices: ch, answerKey: g,
      expl: hZoneExpl(g) });
  }
  const tail = Math.random() < .2;
  if (tail) {
    const n = rint(1, 6), id = "R" + n;
    if (r < .76) return hBase("topo", { format: "tap", target: "feather", prompt: `Touche une rectrice R${n}`, icon: "wing", stage: "tail", t: { look: HTOPO, tap: true, def: "a" }, accept: [id],
      expl: `Les rectrices se numérotent du centre vers l'extérieur : <b>R1</b> au milieu, <b>R6</b> au bord, de chaque côté.` });
    const ch = shuffle([...new Set([id, "R" + (7 - n), "R" + clamp(n + (n < 6 ? 1 : -1), 1, 6), "R" + clamp(n + (n > 1 ? -1 : 2), 1, 6)])]).slice(0, 4);
    while (ch.length < 4) { const x = "R" + rint(1, 6); if (!ch.includes(x)) ch.push(x); }
    return hBase("topo", { prompt: "Quelle est cette rectrice ?", icon: "wing", stage: "tail", t: { look: HTOPO, def: "a", hl: [id] }, choices: shuffle(ch).map(x => ({ key: x, label: x })), answerKey: id,
      expl: `C'est <b>${id}</b> : on compte depuis le centre de la queue (R1) vers l'extérieur (R6).` });
  }
  const ids = [...Array.from({ length: 8 }, (_, i) => "P" + (i + 2)), ...Array.from({ length: 6 }, (_, i) => "S" + (i + 1)), "S7", "S8", "S9"];
  const id = hFresh(ses, ids, x => x, "tf:");
  const nm = x => /^S[789]$/.test(x) ? `${x} (tertiaire)` : x;
  const rule = id[0] === "P" ? "Les primaires se comptent de l'intérieur (P1, à côté des secondaires) vers l'extérieur (P10, minuscule)." : "Les secondaires se comptent de l'extérieur (S1, à côté de P1) vers le corps ; S7 à S9 sont les tertiaires.";
  if (r < .76) return hBase("topo", { format: "tap", target: "feather", prompt: `Touche la plume ${nm(id)}`, icon: "wing", stage: "wing", w: { look: HTOPO, tap: true }, accept: [id], expl: rule });
  const n = +id.slice(1), alt = new Set([id]);
  if (id[0] === "P") { alt.add("P" + (11 - n)); alt.add("P" + clamp(n + 1, 2, 9)); alt.add("P" + clamp(n - 1, 2, 9)); alt.add("S" + clamp(n, 1, 9)); }
  else { alt.add("S" + clamp(10 - n, 1, 9)); alt.add("S" + clamp(n + 1, 1, 9)); alt.add("S" + clamp(n - 1, 1, 9)); alt.add("P" + clamp(n, 2, 9)); }
  const ch = [id, ...shuffle([...alt].filter(x => x !== id)).slice(0, 3)];
  return hBase("topo", { prompt: "Quel est le numéro de cette plume ?", icon: "wing", stage: "wing", w: { look: HTOPO, hl: [id] }, choices: shuffle(ch).map(x => ({ key: x, label: nm(x) })), answerKey: id, expl: `C'est <b>${esc(nm(id))}</b>. ${rule}` });
}

function hMoultFormula() {
  const grow = pick([[4, 3, 2, 1], [4, 3, 1], [4, 2, 1], [3, 2, 1], [4, 2], [3, 1], [2, 1], [4, 3, 2], [1], [3, 2]]);
  const k = rint(0, 9 - grow.length);
  const f = [...Array(k).fill(5), ...grow];
  while (f.length < 10) f.push(0);
  return f;
}
const hMo = f => Object.fromEntries(f.map((v, i) => ["P" + (i + 1), v]));
const HSCORE = ["vieille", "tombée ou en tuyau", "jusqu'à 1/3", "1/3 à 2/3", "plus de 2/3, gaine", "neuve, sans gaine"];
function hMueQ() {
  const f = hMoultFormula(), mo = hMo(f), tot = f.reduce((a, b) => a + b, 0), r = Math.random();
  const w = { look: HTOPO, mo, vb: H_VBN };
  const fstr = f.join("");
  const expl = `Formule <b class="hform">${fstr}</b> (de P1 à P10), total <b>${tot}</b> sur 50.`;
  if (r < .5) {
    const idx = [...f.keys()].filter(i => f[i] > 0 && f[i] < 5);
    const i = Math.random() < .75 && idx.length ? pick(idx) : rint(0, 9);
    const id = "P" + (i + 1), sc = f[i];
    return hBase("mue", { format: "score", prompt: `Score de mue de ${id} ?`, icon: "gauge", stage: "wing", w: { ...w, hl: [id] }, answerKey: String(sc),
      choices: [0, 1, 2, 3, 4, 5].map(v => ({ key: String(v), label: String(v), sub: HSCORE[v] })), mo, f,
      expl: `${id} : <b>${sc}</b>, ${HSCORE[sc]}. ${expl}` });
  }
  if (r < .78) {
    const opts = new Set([tot]);
    while (opts.size < 4) { const d = pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]); const v = tot + d; if (v >= 0 && v <= 50) opts.add(v); }
    return hBase("mue", { prompt: "Score total des primaires ?", icon: "gauge", stage: "wing", w: { ...w, num: true }, answerKey: String(tot),
      choices: shuffle([...opts]).map(v => ({ key: String(v), label: String(v), sub: "sur 50" })), mo, f, expl: `On additionne les 10 notes. ${expl}` });
  }
  const rev = f.slice().reverse().join("");
  const alt = f.slice(); const j = f.findIndex(v => v > 0 && v < 5); if (j >= 0) alt[j] = clamp(alt[j] + pick([-1, 1]), 1, 4); else alt[0] = alt[0] === 5 ? 4 : 1;
  const opts = [...new Set([fstr, rev, alt.join("")])];
  for (let g = 0; opts.length < 3 && g < 20; g++) { const v = hMoultFormula().join(""); if (!opts.includes(v)) opts.push(v); }
  return hBase("mue", { prompt: "Quelle est la formule de mue ?", icon: "gauge", stage: "wing", w: { ...w, num: true }, answerKey: fstr,
    choices: shuffle(opts).map(v => ({ key: v, label: v })), mo, f,
    expl: `On note de P1 (la plus interne) à P10 (la plus externe), dans l'ordre où l'oiseau mue. ${expl}` });
}

function hAgeQ(ses, spId) {
  const pool = spId ? [HSPI[spId]] : hSpAge();
  const sp = spId ? HSPI[spId] : hFresh(ses, pool, s => s.id, "ag:");
  if (sp.mode === "lim" && sp.key.length && Math.random() < (spId ? .2 : .18)) return hWhereQ(sp);
  const season = sp.mode === "lim" ? (sp.spring && Math.random() < .3 ? "spr" : "aut") : Math.random() < .3 ? "spr" : "aut";
  const young = Math.random() < .56;
  const sc = hScene(sp, season, young);
  const m = season === "aut" ? (sp.mode === "comp" ? rint(10, 11) : sp.mig ? rint(8, 9) : rint(8, 11)) : sp.mig ? rint(4, 5) : rint(3, 5);
  const opts = season === "aut" ? ["1A", "+1A", "IND"] : ["2A", "+2A", "+1A"];
  const marks = hSceneMarks(sp, sc, young);
  const eye = season === "aut" && sp.eye && sp.look.iris ? sp.look.iris[young && sp.mode !== "comp" ? 0 : 1] : null;
  const tailg = sp.tail && sp.mode === "lim" ? (young ? "j" : "a") : null;
  let why = "";
  if (sc.ans === "IND") why = "Mue post-juvénile complète : sur le plumage seul, jeune et adulte sont identiques. Âge indéterminé, EURING 2.";
  else if (season === "spr" && sc.ans === "+1A") why = sp.mode === "comp" ? "Mue post-juvénile complète : au printemps on sait seulement qu'il est né avant cette année. +1A, EURING 4." : "Mue complète en hiver pour tous les âges : plus aucune plume juvénile. On sait seulement qu'il est né avant cette année : +1A, EURING 4.";
  else if (sp.mode === "wear") why = young ? "Plumage entièrement frais, sans usure : jeune de l'année, 1A." : "Plumage usé (pointes des primaires, tertiaires, couvertures) : adulte qui muera en Afrique, +1A.";
  else if (young) why = (season === "aut" ? "Limite de mue : plumes juvéniles et neuves côte à côte, c'est un jeune de l'année, 1A." : "Plumes juvéniles usées encore présentes : né l'an dernier, 2A.");
  else why = season === "aut" ? "Aile uniforme, sans limite de mue : adulte après sa mue complète, +1A." : "Aucune plume juvénile, plumage uniforme : né avant l'an dernier, +2A.";
  return hBase("age", { prompt: "Quel âge ?", icon: "cal", stage: "wing", sp: sp.id, season, young, month: m,
    w: { look: sp.look, gen: sc.gen, wear: sc.wear, aria: `Aile de ${sp.fr}`, vb: sp.mode === "lim" ? H_VBC : undefined }, zoom: sp.mode === "lim", fbw: { look: sp.look, gen: sc.gen, wear: sc.wear, ...marks, vb: sp.mode === "lim" ? H_VBC : H_VBF },
    eye, tailg, tailWear: season === "spr" ? .5 : 0, choices: opts.map(ageChoice), answerKey: sc.ans,
    hints: sp.key.length && sp.mode === "lim" ? [{ ic: "eye", tx: "Regarde : " + sp.key.map(k => WGROUPS[k].n.toLowerCase()).join(", ") }] : sp.mode === "wear" ? [{ ic: "eye", tx: "Compare l'usure des pointes des primaires et des tertiaires." }] : [],
    expl: esc(why) });
}
function hWhereQ(sp) {
  return hBase("age", { sub: "where", format: "tap", target: "zone", prompt: `${sp.fr}${sp.sex ? " " + sp.sex : ""} 1A : où regarder d'abord ?`, icon: "eye", stage: "wing", sp: sp.id,
    w: { look: sp.look, tap: true, aria: `Aile de ${sp.fr}` }, accept: sp.key, tapHint: "Touche la zone où chercher la limite de mue, puis valide.",
    expl: `${sp.key.map((k, i) => `<b>${esc(i ? lc1(WGROUPS[k].n) : WGROUPS[k].n)}</b>`).join(" ou ")}. ${esc(sp.crit[0])}` });
}

const HCODES = [
  { m: [8, 11], t: "Jeune de l'année, limite de mue nette", ic: "bird", a: "1A", why: "Né cette année : 1A (EURING 3)." },
  { m: [8, 11], t: "Plumage uniforme d'adulte, mue complète finie", ic: "check", a: "+1A", why: "En automne, un adulte est « né avant cette année » : +1A (EURING 4). On ne peut pas dire s'il a 1 an ou 5." },
  { m: [10, 12], t: "Âge impossible à déterminer", ic: "info", a: "IND", why: "En automne, un oiseau volant d'âge inconnu peut être né cette année : EURING 2." },
  { m: [1, 3], t: "Âge impossible à déterminer", ic: "info", a: "+1A", why: "Avant l'envol des premiers jeunes, tout oiseau volant est forcément né avant cette année : +1A (EURING 4)." },
  { m: [3, 6], t: "Rémiges juvéniles gardées depuis l'an dernier", ic: "bird", a: "2A", why: "Né l'année dernière, il est dans sa 2e année civile : 2A (EURING 5)." },
  { m: [3, 6], t: "Aucune plume juvénile (espèce à mue post-juvénile partielle)", ic: "check", a: "+2A", why: "Sans plume juvénile au printemps, il est né avant l'an dernier : +2A (EURING 6)." },
  { m: [1, 1], d: 3, t: "Bagué 1A en décembre, contrôlé le 3 janvier", ic: "replay", a: "2A", why: "Tous les codes avancent le 1er janvier : le 1A de décembre devient 2A (EURING 3 → 5)." },
  { m: [5, 7], t: "Poussin au nid, ne vole pas encore", ic: "bird", a: "PUL", why: "Poussin : PUL (EURING 1)." },
  { m: [6, 8], t: "Plumage entièrement juvénile, vole", ic: "bird", a: "1A", why: "Plumage juvénile : né cette année, 1A (EURING 3)." },
  { m: [1, 2], t: "Mésange 1A baguée en octobre, contrôlée en février", ic: "replay", a: "2A", why: "Née l'an dernier, elle est en 2e année civile : 2A (EURING 5)." }
];
function hCodeQ(ses) {
  const c = hFresh(ses, HCODES, x => HCODES.indexOf(x), "cd:");
  const m = rint(c.m[0], c.m[1]);
  const pool = ["PUL", "1A", "+1A", "2A", "+2A", "IND"].filter(k => k !== c.a);
  const opts = [c.a, ...shuffle(pool).slice(0, 3)];
  const order = ["PUL", "1A", "+1A", "2A", "+2A", "IND"];
  return hBase("code", { prompt: "Quel code d'âge ?", icon: "tag", stage: "code", code: c, month: m, day: c.d || 0,
    choices: opts.sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(ageChoice), answerKey: c.a, expl: esc(c.why) });
}

function hStratQ(ses, spId) {
  const sp = spId ? HSPI[spId] : hFresh(ses, HSP, s => s.id, "st:");
  const adult = Math.random() < .5;
  const expl = `Jeune : mue post-juvénile <b>${esc(lc1(HPJ[sp.pj]))}</b> (${esc(HPJS[sp.pj])}). Adulte : <b>${esc(lc1(HAD[sp.ad]))}</b>.${sp.sn ? " " + esc(sp.sn) : ""}`;
  if (adult) return hBase("strat", { prompt: "Sa mue complète d'adulte ?", icon: "cycle", stage: "sp", sp: sp.id, q2: "adulte",
    choices: ["e", "h", "2"].map(k => ({ key: k, label: HAD[k], sub: HADS[k] })), answerKey: sp.ad, expl });
  return hBase("strat", { prompt: "Sa mue post-juvénile ?", icon: "cycle", stage: "sp", sp: sp.id, q2: "jeune",
    choices: ["p", "c", "n"].map(k => ({ key: k, label: HPJ[k], sub: HPJS[k] })), answerKey: sp.pj, expl });
}

function buildHand(ses, spec) {
  const ex = spec.ex;
  if (ex === "topo") return hTopoQ(ses);
  if (ex === "mue") return hMueQ(ses);
  if (ex === "age") return hAgeQ(ses, spec.sp);
  if (ex === "code") return hCodeQ(ses);
  return hStratQ(ses, spec.sp);
}
function planHand(ses) {
  const c = ses.cfg, len = c.len || 10;
  if (c.sp) {
    const sp = HSPI[c.sp];
    return Array.from({ length: len }, (_, i) => ({ kind: "hand", ex: sp.mode === "none" || i % 5 === 4 ? "strat" : "age", sp: c.sp }));
  }
  const ex = c.ex && c.ex.length ? c.ex : HEX.map(e => e.k);
  if (ex.length === 1) return Array.from({ length: len }, () => ({ kind: "hand", ex: ex[0] }));
  const wt = { topo: 2, mue: 2, age: 3, code: 2, strat: 1 };
  const bag = [];
  for (const k of ex) for (let i = 0; i < (wt[k] || 1); i++) bag.push(k);
  const out = [];
  while (out.length < len) out.push(...shuffle(bag));
  const specs = out.slice(0, len).map(k => ({ kind: "hand", ex: k }));
  for (let i = 1; i < specs.length; i++) if (specs[i].ex === specs[i - 1].ex) { const j = specs.findIndex((s, k) => k > i && s.ex !== specs[i].ex); if (j > 0) [specs[i], specs[j]] = [specs[j], specs[i]]; }
  return specs;
}
const handCfg = (ex, sp) => ({ kind: "hand", title: sp ? HSPI[sp].fr : ex === "mix" ? "Piaf en main" : HEX.find(e => e.k === ex)?.n || "Piaf en main", icon: "ring", len: 10, ex: ex === "mix" || !ex ? null : [ex], sp: sp || null });

/* ---------- Affichage des questions ---------- */
function handStage(q) {
  const sp = q.sp ? HSPI[q.sp] : null;
  if (q.stage === "code") {
    const c = q.code;
    return `<div class="hcard hcode"><div class="hcal"><small>${q.day ? q.day + " " : ""}</small><b>${esc(MOIS[q.month - 1])}</b></div><div class="hsit">${ic(c.ic)}<span>${esc(c.t)}</span></div></div>`;
  }
  if (q.stage === "sp") {
    return `<div class="hcard hspc"><span class="eyebrow">${q.q2 === "adulte" ? "L'adulte" : "Le jeune de l'année"}</span><div class="big">${esc(sp.fr)}</div><div class="latin">${esc(sp.sci)}</div>
    <div class="hmini">${sp.look ? wingSvg({ look: sp.look, aria: `Aile de ${sp.fr}` }) : ""}</div></div>`;
  }
  const ctx = sp && q.ex === "age" && q.sub !== "where" ? `<div class="hctx"><b>${esc(sp.fr)}${sp.sex ? " " + sp.sex : ""}</b><span>${ic("cal", "xs")}${esc(MOIS[q.month - 1])}</span></div>` : "";
  const extras = [];
  if (q.eye) extras.push(`<figure class="hx">${eyeSvg(q.eye, sp.look.head)}<figcaption>Iris</figcaption></figure>`);
  if (q.tailg) extras.push(`<figure class="hx tl">${tailSvg({ look: sp.look, def: q.tailg, wear: q.tailWear })}<figcaption>Rectrices</figcaption></figure>`);
  const main = q.stage === "tail" ? tailSvg(q.t) : wingSvg(q.w);
  const zb = q.zoom ? `<button class="hzb" data-act="hzoom" aria-label="Aile entière ou zoom">${ic("expand", "xs")}</button>` : "";
  return `<div class="hplate ${q.stage === "tail" ? "istail" : ""}" id="hplate">${ctx}${zb}${main}${extras.length ? `<div class="hxs">${extras.join("")}</div>` : ""}${(q.ex === "topo" || q.ex === "mue") && q.stage === "wing" ? `<span class="hori">${ic("arrow", "xs")}corps</span>` : ""}</div>`;
}
function handAnswers(q) {
  if (q.format === "tap") return `<div class="htap"><p>${ic("bulb", "xs")}${esc(q.tapHint || "Touche la plume ou la zone sur le dessin, puis valide.")}</p><button class="btn primary wide" id="hval" data-act="hval" disabled>${ic("check")}Valider</button><button class="skip" data-act="skip">Je ne sais pas</button></div>`;
  if (q.format === "score") return `<div class="hscore">${q.choices.map(c => `<button class="choice hsc" data-act="pick" data-k="${c.key}"><b>${c.label}</b><small>${esc(c.sub)}</small></button>`).join("")}</div>`;
  return "";
}
function handTap(el, e) {
  const q = SES?.q;
  if (!q || q.done || q.format !== "tap") return;
  let fe = e.target.closest ? e.target.closest(".fe") : null;
  if (!fe || !el.contains(fe)) {
    try {
      const pt = el.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(el.getScreenCTM().inverse());
      let best = null, bd = 16;
      for (const f of (q.stage === "tail" ? TGEO : WGEO)) {
        const [x1, y1] = hPt(f, f.L * .35, 0), [x2, y2] = hPt(f, f.L * .95, 0);
        const dx = x2 - x1, dy = y2 - y1, t = clamp(((p.x - x1) * dx + (p.y - y1) * dy) / (dx * dx + dy * dy), 0, 1);
        const d = Math.hypot(p.x - x1 - t * dx, p.y - y1 - t * dy);
        if (d < bd) { bd = d; best = f; }
      }
      if (best) fe = el.querySelector(`.fe[data-f="${best.id}"]${best.side ? `[data-s="${best.side}"]` : ""}`);
    } catch (err) { fe = null; }
  }
  if (!fe) return;
  const id = fe.dataset.f, g = fe.dataset.g === "CC" ? "AL" : fe.dataset.g, side = fe.dataset.s || "";
  q.sel = q.target === "zone" ? g : id;
  q.selSide = side;
  const ov = el.querySelector(".ov");
  if (ov) ov.innerHTML = q.stage === "tail" ? `<path class="selp" d="${tOutlineOf(id, side)}"/>` : q.target === "zone" ? wingOverlay([g], "selp") : `<path class="selp" d="${hOutlineOf(id)}"/>`;
  const b = $("#hval");
  if (b) b.disabled = false;
  if (S.set.sfx) try { navigator.vibrate && navigator.vibrate(8); } catch (err) { /* rien */ }
}
function handValidate() {
  const q = SES?.q;
  if (!q || q.done || !q.sel) return;
  const ok = q.accept.includes(q.sel);
  const svg = $("#hplate svg[data-act]");
  if (svg) {
    const ov = svg.querySelector(".ov");
    const good = q.stage === "tail" ? q.accept.map(id => `<path class="okp" d="${tOutlineOf(id)}"/>`).join("") : wingOverlay(q.accept, "okp");
    const bad = ok ? "" : q.stage === "tail" ? `<path class="badp" d="${tOutlineOf(q.sel, q.selSide)}"/>` : q.target === "zone" ? wingOverlay([q.sel], "badp") : `<path class="badp" d="${hOutlineOf(q.sel)}"/>`;
    if (ov) ov.innerHTML = bad + good;
    svg.removeAttribute("data-act");
  }
  const b = $("#hval");
  if (b) b.disabled = true;
  settle({ ok, key: q.sel });
}
function handZoom(btn) {
  const svg = $("#hplate svg.wing");
  if (!svg) return;
  const full = svg.getAttribute("viewBox") === H_VBC;
  svg.setAttribute("viewBox", full ? H_VBF : H_VBC);
  svg.classList.toggle("zc", !full);
  btn.innerHTML = ic(full ? "zoom" : "expand", "xs");
}
function handSkipReveal(q) {
  const svg = $("#hplate svg[data-act]");
  if (!svg || q.format !== "tap") return;
  const ov = svg.querySelector(".ov");
  if (ov) ov.innerHTML = q.stage === "tail" ? q.accept.map(id => `<path class="okp" d="${tOutlineOf(id)}"/>`).join("") : wingOverlay(q.accept, "okp");
  svg.removeAttribute("data-act");
}
/* Après la réponse : numéros sur la planche pour les questions de numérotation et de mue */
function handReveal(q) {
  const ov = $("#hplate svg .ov");
  if (!ov || ov.dataset.rev) return;
  ov.dataset.rev = "1";
  let ids = null;
  const id = q.target === "feather" ? q.accept[0] : q.answerKey;
  if (q.ex === "topo" && q.stage === "tail") { ov.insertAdjacentHTML("beforeend", tailNums()); return; }
  if (q.ex === "topo" && /^[PS]\d+$/.test(id || "")) ids = id[0] === "P" ? WGEO.filter(f => f.g === "RP" && f.id !== "P10").map(f => f.id) : WGEO.filter(f => f.g === "RS" || f.g === "TT").map(f => f.id);
  if (q.ex === "mue" && q.format === "score") ids = WGEO.filter(f => f.g === "RP").map(f => f.id);
  if (ids) {
    ov.insertAdjacentHTML("beforeend", wingNums(ids));
    const svg = ov.closest("svg");
    if (svg && svg.getAttribute("viewBox") === H_VBF) svg.setAttribute("viewBox", H_VBN);
    $("#hplate")?.classList.add("rev");
  }
}
function handFb(q, res) {
  const sp = q.sp ? HSPI[q.sp] : null;
  try { handReveal(q); } catch (e) { /* planche absente */ }
  let h = `<div class="hexp">${q.expl || ""}</div>`;
  if (q.ex === "age" && q.sub !== "where") {
    h += `<div class="hplate sm">${wingSvg(q.fbw)}</div>`;
    const bits = [];
    if (q.eye) bits.push(`<span class="hirow">${eyeSvg(q.eye, sp.look.head)}<span>Iris ${q.young ? "plutôt froid, de jeune" : "plus chaud, d'adulte"}</span></span>`);
    if (q.tailg) bits.push(`<span class="hirow">${ic("wing", "xs")}<span>Rectrices ${q.tailg === "j" ? "étroites et pointues (juvéniles)" : "larges et arrondies (adulte)"}</span></span>`);
    if (bits.length && q.season === "aut") h += `<div class="hbits">${bits.join("")}</div>`;
  }
  if (q.ex === "mue") h += `<div class="hform-row">${q.f.map((v, i) => `<span class="s${v}"><small>P${i + 1}</small>${v}</span>`).join("")}</div>`;
  if (sp && sp.mode !== "none") h += `<button class="spcard hsplink" data-act="hsp" data-sp="${sp.id}"><span class="t"><b>${esc(sp.fr)}</b><span class="latin">${esc(sp.sci)}</span><span class="chips"><span class="chip fam">Post-juv. : ${esc(lc1(HPJ[sp.pj]))}</span><span class="chip ord">Adulte : ${esc(lc1(HAD[sp.ad]))}</span></span></span>${ic("info")}</button>`;
  return h;
}
function handRecord(q, ok) {
  const H = S.hand || (S.hand = { ex: {}, sp: {} });
  const e = H.ex[q.ex] || (H.ex[q.ex] = { n: 0, ok: 0 });
  e.n++; if (ok) e.ok++;
  if (q.sp) { const s = H.sp[q.sp] || (H.sp[q.sp] = { n: 0, ok: 0 }); s.n++; if (ok) s.ok++; }
}

/* ---------- Écrans : accueil du mode et fiches âge ---------- */
/* Paire de plumes : grande couverture juvénile, puis adulte (ou primaire fraîche / usée) */
function featherPair(s) {
  const L = 46, W = 11, f1 = { id: "a", g: "GC", x: 16, y: 6, a: 90, L, w: W, sd: 1 }, f2 = { ...f1, x: 44 };
  let a, b;
  if (s.mode === "wear") { const st = hStyle(s.look, "RP", "a"); a = hFeather(f1, st, {}); b = hFeather(f2, st, { wear: .8 }); }
  else { a = hFeather(f1, hStyle(s.look, "GC", "j"), {}); b = hFeather(f2, hStyle(s.look, "GC", "a"), {}); }
  return `<svg class="fpair" viewBox="0 0 60 56" aria-hidden="true">${a}${b}</svg>`;
}
const hPct = s => s && s.n ? Math.round(s.ok / s.n * 100) : null;
function handHubHtml() {
  const H = S.hand || { ex: {}, sp: {} };
  const spl = HSP.filter(s => s.mode !== "none");
  return `<section class="view hand">
  <div class="head"><button class="icon-btn" data-act="tab" data-tab="home" aria-label="Retour">${ic("back")}</button><h1 class="h1" style="flex:1">Piaf en main</h1></div>
  <div class="hhero"><div class="hplate hero">${wingSvg({ look: HSPI.bleue.look, gen: hScene(HSPI.bleue, "aut", true, HSPI.bleue.ty).gen, aria: "Aile de Mésange bleue" })}</div>
    <p>Prépare ton permis de baguage : nomme les plumes, note la mue, donne l'âge.</p></div>
  <button class="hmix" data-act="hgo" data-ex="mix"><span class="ic">${ic("shuffle")}</span><span class="tx"><b>Série mélangée</b><small>10 questions sur tout le programme</small></span>${ic("play")}</button>
  <div class="tiles">${HEX.map((m, i) => { const p = hPct(H.ex[m.k]); return `<button class="tile" style="--c:${m.c};animation-delay:${i * 35}ms" data-act="hgo" data-ex="${m.k}"><span class="ic">${ic(m.ic)}</span><span><b>${m.n}</b><small>${p == null ? m.d : p + " % de réussite"}</small></span></button>`; }).join("")}</div>
  <div class="sec">${ic("book")}Fiches âge<span class="more">${spl.length} espèces</span></div>
  <div class="hspl">${spl.map(s => { const p = hPct(H.sp[s.id]); return `<button class="hspb" data-act="hsp" data-sp="${s.id}"><span class="mw">${featherPair(s)}</span><span class="tx"><b>${esc(s.fr)}</b><small>${s.mode === "wear" ? "frais ou usé" : s.mode === "comp" ? "mue complète" : "limite : " + s.key.map(k => WGROUPS[k].ab).join(", ")}${p == null ? "" : " · " + p + " %"}</small></span></button>`; }).join("")}</div>
  <p class="hsrc">${ic("info", "xs")} Critères simplifiés d'après le Ringers' DigiGuide (station d'Ottenby), EURING, le BTO et le CRBPO. Ils ne remplacent ni les guides (Svensson, Demongin…) ni ton formateur.</p>
</section>`;
}
function handSpPanel(id) {
  const s = HSPI[id];
  if (!s) return "";
  const H = S.hand?.sp?.[id], p = hPct(H);
  let cmp = "";
  if (s.look && s.mode !== "none") {
    const yA = hScene(s, "aut", true, s.ty), aA = hScene(s, "aut", false);
    const mk = hSceneMarks(s, yA, true);
    const ya = s.mode === "comp" ? "Jeune après sa mue" : "1A · automne", aa = s.mode === "comp" ? "Adulte" : "+1A · automne";
    const vb = s.mode === "lim" ? H_VBC : H_VBF;
    cmp = `<div class="hcmp"><figure><figcaption>${ya}</figcaption><div class="hplate sm">${wingSvg({ look: s.look, gen: yA.gen, wear: yA.wear, ...mk, vb })}</div></figure>
    <figure><figcaption>${aa}</figcaption><div class="hplate sm">${wingSvg({ look: s.look, gen: aA.gen, wear: aA.wear, vb })}</div></figure></div>`;
    const ex = [];
    if (s.eye && s.look.iris) ex.push(`<div class="hirow">${eyeSvg(s.look.iris[0], s.look.head)}${eyeSvg(s.look.iris[1], s.look.head)}<span>Iris : 1A, puis +1A</span></div>`);
    if (s.tail && s.mode === "lim") ex.push(`<div class="htails">${tailSvg({ look: s.look, def: "j" })}${tailSvg({ look: s.look, def: "a" })}<span>Rectrices : 1A pointues, +1A arrondies</span></div>`);
    if (ex.length) cmp += `<div class="hextra">${ex.join("")}</div>`;
  }
  const src = s.slug ? HDG(s.slug) : s.src;
  return `<div class="panel hpanel" role="dialog" aria-label="Fiche âge ${esc(s.fr)}">
  <button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="in">
  <div class="ftitle"><span class="eyebrow">${ic("ring", "xs")} Fiche âge</span><h2>${esc(s.fr)}${s.sex ? " " + s.sex : ""}</h2><span class="latin">${esc(s.sci)}</span></div>
  <div class="hstrat"><div><small>Mue post-juvénile</small><b>${esc(HPJ[s.pj])}</b><span>${esc(HPJS[s.pj])}</span></div><div><small>Mue de l'adulte</small><b>${esc(HAD[s.ad])}</b><span>${esc(HADS[s.ad])}</span></div></div>
  ${cmp}
  <div class="fsec"><h3>${ic("bulb")}Critères${p == null ? "" : `<span class="seg muted">${p} % de réussite</span>`}</h3>
  <ul class="hcrit">${s.crit.map(c => `<li>${esc(c)}</li>`).join("")}</ul>${s.sn ? `<p class="hsn">${esc(s.sn)}</p>` : ""}
  ${src ? `<a class="hsrcl" href="${esc(src)}" target="_blank" rel="noopener">${ic("ext", "xs")}${s.slug ? "Photos et détails : Ringers' DigiGuide (Ottenby)" : "BTO : la mue des jeunes oiseaux"}</a>` : ""}</div>
  ${s.mode !== "none" ? `<button class="btn primary wide" data-act="hgo" data-sp="${s.id}" style="margin:16px 0 8px">${ic("play")}S'entraîner sur cette espèce</button>` : ""}
  <div style="height:18px"></div></div></div>`;
}
