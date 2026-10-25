/* ============================================================
   Plumage — moteur de quiz
   ============================================================ */
let SES = null;

const MODES = [
  { k: "photo", n: "Photo", d: "Qui est-ce ?", ic: "frame", c: "#1FD1F2" },
  { k: "chant", n: "Chants", d: "À l'oreille", ic: "wave", c: "#FF8B3D" },
  { k: "latin", n: "Latin", d: "Français ↔ latin", ic: "quill", c: "#A58BFF" },
  { k: "famille", n: "Familles", d: "Qui est parent ?", ic: "tree", c: "#14B8A6" },
  { k: "duel", n: "Duels", d: "Les sosies", ic: "duel", c: "#FF6FA3" },
  { k: "geo", n: "Géo", d: "Où sommes-nous ?", ic: "globe", c: "#3D7BFF" },
  { k: "racines", n: "Racines", d: "Décode le latin", ic: "root", c: "#B6F25A" },
  { k: "ecrire", n: "Écrire", d: "Tape le nom", ic: "keyboard", c: "#7DD3FC" },
  { k: "sortie", n: "Sortie", d: "Prépare-la", ic: "binoc", c: "#3BE59D" },
  { k: "main", n: "Piaf en main", d: "Mue et âge", ic: "ring", c: "#E9B872" },
  { k: "perso", n: "Sur mesure", d: "Tout régler", ic: "sliders", c: "#FFCB5C" },
  { k: "parcours", n: "Parcours", d: "Pas à pas", ic: "map", c: "#3BE59D" }
];

function photoStim() { return S.set.photo === "field" ? ["field"] : S.set.photo === "mix" ? ["photo", "field"] : ["photo"]; }
function baseCfg() {
  return { kind: "quiz", zone: S.set.zone, freq: "common", size: 120, target: "species", names: S.set.names, format: S.set.fmt || "qcm", k: S.set.k, diff: S.set.diff, len: 10, timer: 0 };
}
function modeCfg(k) {
  const b = baseCfg();
  switch (k) {
    case "photo": return { ...b, title: "Photo", icon: "frame", stim: photoStim() };
    case "chant": return { ...b, title: "Chants", icon: "wave", stim: ["son"], format: "tiles", k: 4, sounds: true, size: 80 };
    case "latin": return { ...b, title: "Latin", icon: "quill", stim: ["fr", "la"] };
    case "ecrire": return { ...b, title: "Écrire", icon: "keyboard", stim: photoStim(), format: "type" };
    case "famille": return { ...b, title: "Familles", icon: "tree", stim: photoStim(), target: "family", size: 200 };
    case "geo": return { kind: "geo", title: "Géo", icon: "globe", len: 5 };
    case "racines": return { kind: "root", title: "Racines latines", icon: "root", len: 10, k: 4 };
    default: return null;
  }
}
const dailyCfg = () => ({ kind: "serie", format: S.set.fmt || "qcm", title: "Série du jour", icon: "spark", zone: S.set.zone, len: 12, names: S.set.names, diff: S.set.diff, k: S.set.k });
const miniCfg = () => ({ kind: "mini", format: S.set.fmt || "qcm", title: "Mini-série", icon: "bolt", zone: S.set.zone, len: 3, names: S.set.names, diff: S.set.diff, k: S.set.k });
const reviewCfg = () => ({ kind: "review", format: S.set.fmt || "qcm", title: "Révisions", icon: "replay", zone: S.set.zone, names: S.set.names, diff: S.set.diff, k: S.set.k });
const duelCfg = pair => ({ kind: "duel", title: "Duel", icon: "duel", zone: S.set.zone, pair, len: 8, names: S.set.names, k: 2 });

function newSession(cfg) {
  return {
    cfg, kind: cfg.kind, title: cfg.title, zone: cfg.zone === undefined ? S.set.zone : cfg.zone,
    pool: null, plan: null, built: 0, len: cfg.len || 0, results: [], combo: 0, maxCombo: 0, xp: 0,
    newSp: [], missed: [], recent: [], q: null, nextP: null, lvl0: level().n, lvlNow: 0, deadline: 0, ended: false
  };
}

async function startSession(cfg) {
  unlockAudio();
  closeLayer();
  sndStop();
  const ses = SES = newSession(cfg);
  go("loading", { title: cfg.title, icon: cfg.icon });
  try {
    await prepare(ses);
    if (SES !== ses) return;
    const q = await buildNext(ses);
    if (SES !== ses) return;
    if (!q) { const e = new Error("EMPTY"); e.code = "EMPTY"; throw e; }
    if (cfg.timer === 60) ses.deadline = Date.now() + 60000;
    showQuestion(q);
  } catch (e) {
    if (SES === ses) showError(e, cfg);
  }
}

async function zonePool(ses, size = 150) {
  return getPool({ zone: ses.zone, freq: "common", size });
}

async function prepare(ses) {
  const c = ses.cfg;
  await loadTaxo().catch(() => {});
  if (ses.kind === "quiz") {
    const stims = c.stim && c.stim.length ? c.stim : ["photo"];
    const onlySound = stims.every(s => s === "son" || s === "soncho");
    if (c.trip) {
      const tr = (S.trips || []).find(x => x.id === c.trip);
      const list = (tr?.sp || []).map(a => ({ id: a[0], sci: a[1], fr: a[2], img: a[3] ? { sq: a[3], md: a[4] || a[3], attr: "", lic: "" } : null, a: [], c: a[5] || 0 })).filter(t => t.img);
      list.forEach(t => { t.f = fam(t) || S.sp[t.id]?.f || 0; t.o = ord(t) || S.sp[t.id]?.o || 0; lexAdd(t); });
      ses.pool = { list, byId: new Map(list.map(t => [t.id, t])) };
    } else
    ses.pool = await getPool({ zone: ses.zone, taxa: c.taxa, freq: c.freq, size: c.size, sounds: c.sounds || onlySound, age: c.age || "" });
    if (ses.pool.list.length < 2) { const e = new Error("EMPTY"); e.code = "EMPTY"; throw e; }
    if ((c.target === "family" || c.target === "order") && !TAXO.ok) toast("Familles indisponibles hors ligne : questions par espèce.");
    if (stims.some(s => s === "photo" || s === "soncho")) photosFor(sample(ses.pool.list, 20).map(t => t.id)).catch(() => {});
  } else if (ses.kind === "serie" || ses.kind === "mini") {
    ses.pool = await zonePool(ses);
    if (ses.pool.list.length < 4) { const e = new Error("EMPTY"); e.code = "EMPTY"; throw e; }
    ses.plan = ses.kind === "serie" ? planSerie(ses, 12) : planMini(ses);
    ses.len = ses.plan.length;
    photosFor(ses.plan.filter(s => s.t).map(s => s.t.id)).catch(() => {});
  } else if (ses.kind === "review") {
    ses.pool = await zonePool(ses).catch(() => ({ list: [], byId: new Map() }));
    ses.plan = planReview(ses);
    if (!ses.plan.length) { const e = new Error("NODUE"); e.code = "NODUE"; throw e; }
    ses.len = ses.plan.length;
    if (ses.pool.list.length < 6) {
      const extra = Object.keys(S.sp).map(fromRec).filter(t => t && t.img);
      ses.pool = { list: [...ses.pool.list, ...extra], byId: new Map([...ses.pool.list, ...extra].map(t => [t.id, t])) };
    }
  } else if (ses.kind === "duel") {
    const [sa, sb, fa, fb] = c.pair;
    const pool = await zonePool(ses).catch(() => ({ list: [], byId: new Map() }));
    const find = (sci, fr, id) => (id && (pool.byId.get(id) || fromRec(id))) || pool.list.find(t => t.sci === sci) || null;
    let A = find(sa, fa, c.ids?.[0]), B = find(sb, fb, c.ids?.[1]);
    if (!A) A = await resolveTaxon(sa, fa);
    if (!B) B = await resolveTaxon(sb, fb);
    if (!A || !B) { const e = new Error("EMPTY"); e.code = "EMPTY"; throw e; }
    ses.pool = { list: [A, B], byId: new Map([[A.id, A], [B.id, B]]) };
    ses.pair = [A, B];
    ses.title = `${nameFr(A)} / ${nameFr(B)}`;
    const stims = ["photo", "photo", "field", "son", "photo", "field", "son", "photo"];
    ses.plan = stims.map(st => ({ t: pick([A, B]), stim: st, pair: [A, B], k: 2 }));
    ses.len = ses.plan.length;
    photosFor([A.id, B.id]).catch(() => {});
  } else if (ses.kind === "geo") {
    try { await ensureLeaflet(); } catch (e) { ses.geoQcm = true; }
  } else if (ses.kind === "root") {
    ses.pool = { list: Object.keys(S.sp).map(fromRec).filter(Boolean), byId: new Map() };
  } else if (ses.kind === "path") {
    await preparePath(ses);
  } else if (ses.kind === "hand") {
    ses.plan = planHand(ses);
    ses.len = ses.plan.length;
  }
}

/* ---------- Plans ---------- */
function planSerie(ses, len) {
  const P = ses.pool.list, specs = [], used = new Set();
  const take = (t, spec) => { if (!t || used.has(t.id)) return false; used.add(t.id); specs.push({ t, ...spec }); return true; };
  for (const d of dueList()) {
    if (specs.length >= 4) break;
    const t = ses.pool.byId.get(d.id) || fromRec(d.id);
    take(t, { stim: d.mod === "son" ? "son" : d.mod === "nom" ? pick(["fr", "la"]) : "photo", review: true });
  }
  let fresh = 0;
  for (const t of shuffle(P.filter(x => !S.sp[x.id] || !S.sp[x.id].n).slice(0, 30))) { if (fresh >= 3) break; if (take(t, { stim: "photo", fresh: true })) fresh++; }
  const seen = shuffle(P.filter(t => S.sp[t.id]?.n)), any = shuffle(P.slice(0, 90));
  const src = () => seen.find(t => !used.has(t.id)) || any.find(t => !used.has(t.id));
  take(src(), { stim: "son", format: "tiles", k: 4 });
  take(src(), { stim: "son" });
  take(src(), { stim: "fr" });
  take(src(), { stim: "photo", level: "family" });
  take(src(), { stim: "field" });
  const cf = topConfusions(1)[0];
  if (cf) {
    const a = ses.pool.byId.get(cf.a) || fromRec(cf.a), b = ses.pool.byId.get(cf.b) || fromRec(cf.b);
    if (a && b) take(pick([a, b]), { stim: "photo", pair: [a, b], k: 2 });
  }
  if (Math.random() < .5) specs.push({ bonusRare: true });
  let guard = 0;
  while (specs.length < len && guard++ < 50) take(any.find(x => !used.has(x.id)) || pick(P), { stim: pick(["photo", "photo", "field", "la"]) });
  return interleave(shuffle(specs).slice(0, len));
}
function planMini(ses) {
  const P = ses.pool.list.slice(0, 80), a = shuffle(P);
  return [{ t: a[0], stim: "photo" }, { t: a[1], stim: "son", format: "tiles", k: 4 }, { t: a[2], stim: "fr" }];
}
function planReview(ses) {
  return dueList().slice(0, 15).map(d => {
    const t = ses.pool.byId.get(d.id) || fromRec(d.id);
    const r = S.sp[d.id], needField = r && mastery(r).photos >= 2 && !(r.fk || []).length;
    return t ? { t, stim: d.mod === "son" ? "son" : d.mod === "nom" ? pick(["fr", "la"]) : needField ? "field" : pick(["photo", "photo", "field"]), review: true } : null;
  }).filter(Boolean);
}
function interleave(specs) {
  const out = [], rest = specs.slice();
  const kind = s => s.bonusRare ? "x" : s.stim === "field" ? "photo" : s.stim;
  while (rest.length) {
    const prev = out.length ? kind(out[out.length - 1]) : null;
    let i = rest.findIndex(s => kind(s) !== prev);
    if (i < 0) i = 0;
    out.push(rest.splice(i, 1)[0]);
  }
  return out;
}

/* ---------- Construction des questions ---------- */
function pickTarget(ses) {
  const P = ses.pool?.list || [];
  if (!P.length) return null;
  const recent = new Set(ses.recent.slice(-Math.min(12, Math.floor(P.length / 2))));
  const tday = todayNum();
  let best = null, bw = -Infinity;
  for (const t of sample(P, Math.min(P.length, 40))) {
    if (recent.has(t.id)) continue;
    const r = S.sp[t.id];
    let w = Math.random();
    if (!r || !r.n) w += .3;
    else {
      if (Object.values(r.due || {}).some(d => d <= tday)) w += .7;
      w += (1 - r.ok / r.n) * .8;
      if (stars(r) === 3) w -= .25;
    }
    if (w > bw) { bw = w; best = t; }
  }
  return best || pick(P);
}
function randomSpec(ses) {
  const c = ses.cfg;
  if (ses.kind === "geo") return { kind: "geo" };
  if (ses.kind === "root") return { kind: "root" };
  if (ses.kind === "hand") return { kind: "hand", ex: pick(ses.cfg.ex || HEX.map(e => e.k)), sp: ses.cfg.sp || null };
  const t = pickTarget(ses);
  if (!t) return null;
  if (ses.kind === "quiz") return { t, stim: pick(c.stim && c.stim.length ? c.stim : ["photo"]), level: c.target, format: c.format, k: c.k, diff: c.diff };
  if (ses.kind === "duel") return { t: pick(ses.pair), stim: "photo", pair: ses.pair, k: 2 };
  return { t, stim: "photo" };
}
async function buildNext(ses) {
  if (ses.ended || (ses.len && ses.built >= ses.len)) return null;
  const idx = ses.built;
  let spec = (ses.plan && ses.plan[idx]) || randomSpec(ses);
  for (let attempt = 0; attempt < 5 && spec; attempt++) {
    const q = await buildQ(ses, spec);
    if (q) { q.idx = idx; ses.built = idx + 1; warm(q); return q; }
    spec = randomSpec(ses);
  }
  return null;
}
const keyOf = (t, level) => level === "genus" ? "g" + genus(t) : level === "family" ? "f" + fam(t) : level === "order" ? "o" + ord(t) : "s" + t.id;

async function buildQ(ses, spec) {
  if (spec.kind === "geo") return buildGeo(ses);
  if (spec.kind === "root") return buildRoot(ses);
  if (spec.kind === "hand") return buildHand(ses, spec);
  if (spec.bonusRare) return buildRare(ses);
  const c = ses.cfg;
  const q = {
    kind: "taxon", t: spec.t, stim: spec.stim || "photo", level: spec.level || c.target || "species",
    format: spec.format || c.format || "qcm", k: spec.k || c.k || S.set.k, diff: spec.diff || c.diff || S.set.diff,
    names: c.names || S.set.names, bonus: !!spec.bonus, pair: spec.pair || null, review: !!spec.review, fresh: !!spec.fresh, hintsUsed: 0
  };
  if (!q.t) return null;
  if ((q.level === "family" || q.level === "order") && !(TAXO.ok && fam(q.t))) q.level = "species";
  if (q.pair) { q.level = "species"; q.format = "qcm"; }
  if (q.stim === "photo" && q.level === "species" && !q.pair) {
    const r = S.sp[q.t.id];
    if (r && mastery(r).photos >= 2 && !(r.fk || []).length && Math.random() < .7) { q.stim = "field"; q.transfer = true; }
  }
  if (q.stim === "son") { q.snd = await soundFor(q.t, ses.zone); if (!q.snd) q.stim = "photo"; }
  if (c.age && (q.stim === "photo" || q.stim === "field" || q.stim === "soncho")) {
    q.photo = await agePhoto(q.t, ses.zone, c.age);
    if (!q.photo) return null;
    if (q.stim === "photo") q.stim = "field";
  }
  if (q.stim === "field" && !q.photo) { q.photo = await fieldPhoto(q.t, ses.zone); if (!q.photo) q.stim = "photo"; }
  if ((q.stim === "photo" || q.stim === "soncho") && !q.photo) { q.photo = await refPhoto(q.t); if (!q.photo) return null; }
  if ((q.stim === "fr" || q.stim === "la") && q.format === "tiles") q.format = "qcm";
  if (q.level !== "species" && q.format === "tiles") q.format = "qcm";
  if (q.stim === "soncho") {
    const others = await speciesDistractors(ses, q.t, 2, q.diff, false);
    const all = shuffle([q.t, ...others]);
    const snds = await Promise.all(all.map(t => soundFor(t, null).catch(() => null)));
    q.choices = all.map((t, i) => ({ key: "s" + t.id, t, snd: snds[i] })).filter(x => x.snd);
    if (q.choices.length < 2 || !q.choices.some(x => x.t.id === q.t.id)) { q.stim = "photo"; q.choices = null; }
    else q.format = "audio";
  }
  if (!q.choices && (q.format === "qcm" || q.format === "tiles")) q.choices = await makeChoices(ses, q);
  if (c.age && q.format === "tiles" && q.choices) {
    /* Vignettes : chaque choix montre aussi un oiseau de la bonne classe d'âge */
    const phs = await Promise.all(q.choices.map(ch => ch.t ? agePhoto(ch.t, ses.zone, c.age).catch(() => null) : null));
    if (phs.every(Boolean)) q.choices = q.choices.map((ch, i) => ({ ...ch, t: { ...ch.t, img: { ...(ch.t.img || {}), sq: phs[i].md, md: phs[i].md } } }));
    else q.format = "qcm";
  }
  q.answerKey = keyOf(q.t, q.level);
  q.hints = hintsFor(q);
  return q;
}
async function buildRare(ses) {
  const pool = await getPool({ zone: { id: 6753, name: "France" }, freq: "rare", size: 120 }).catch(() => null);
  if (!pool || pool.list.length < 5) return buildQ(ses, { t: pickTarget(ses), stim: "photo" });
  const t = pick(pool.list.filter(x => x.img));
  const q = { kind: "taxon", t, stim: "photo", level: "species", format: "qcm", k: 4, diff: "facile", names: ses.cfg.names || S.set.names, bonus: true, hintsUsed: 0 };
  q.photo = await refPhoto(t);
  if (!q.photo) return null;
  q.choices = await makeChoices({ ...ses, pool }, q);
  q.answerKey = keyOf(t, "species");
  q.hints = hintsFor(q);
  return q;
}

async function speciesDistractors(ses, t, n, diff, needImg) {
  const P = ses.pool ? ses.pool.list : [];
  const out = [], used = new Set([t.id]);
  const add = x => { if (x && x.id && !used.has(x.id) && out.length < n && (!needImg || x.img)) { used.add(x.id); out.push(x); } };
  const cf = S.sp[t.id]?.conf || {};
  if (diff !== "facile") Object.keys(cf).sort((a, b) => cf[b] - cf[a]).slice(0, 2).forEach(id => { if (Math.random() < .55) add(P.find(x => x.id === +id) || fromRec(id)); });
  if (diff === "expert") (await similar(t, ses.zone).catch(() => [])).slice(0, 10).forEach(add);
  if (diff !== "facile") {
    const lim = diff === "expert" ? n : Math.ceil(n / 2);
    const near = [...shuffle(P.filter(x => genus(x) === genus(t))), ...shuffle(P.filter(x => fam(x) && fam(x) === fam(t)))];
    for (const x of near) { if (out.length >= lim) break; add(x); }
    if (diff === "expert") shuffle(P.filter(x => ord(x) && ord(x) === ord(t))).forEach(add);
  }
  shuffle(P).forEach(add);
  return out;
}
function choiceFor(x, q) {
  const mode = q.stim === "fr" ? "la" : q.stim === "la" ? "fr" : q.names;
  return { key: "s" + x.id, t: x, fr: x.fr || x.sci, sci: x.sci, mode };
}
async function makeChoices(ses, q) {
  const k = clamp(q.k || 5, 2, 6), t = q.t, P = ses.pool ? ses.pool.list : [];
  if (q.pair) return shuffle(q.pair).map(x => choiceFor(x, q));
  if (q.level === "species") {
    const d = await speciesDistractors(ses, t, k - 1, q.diff, q.format === "tiles");
    return shuffle([t, ...d]).map(x => choiceFor(x, q));
  }
  const near = (list, same) => {
    let c = shuffle(list);
    if (q.diff !== "facile") c = [...shuffle(list.filter(same)).slice(0, q.diff === "expert" ? k : Math.ceil((k - 1) / 2)), ...c];
    return [...new Set(c)].slice(0, k - 1);
  };
  if (q.level === "genus") {
    const g = genus(t), ex = new Map();
    for (const x of P) if (!ex.has(genus(x))) ex.set(genus(x), x);
    ex.set(g, t);
    const others = near([...ex.keys()].filter(x => x !== g), x => fam(ex.get(x)) === fam(t));
    return shuffle([g, ...others]).map(x => ({ key: "g" + x, label: x, latin: true, sub: "ex. " + nameFr(ex.get(x)) }));
  }
  if (q.level === "family") {
    const f = fam(t);
    let list = [...new Set(P.map(fam).filter(Boolean))].filter(x => x !== f);
    if (list.length < k - 1) list = [...new Set([...list, ...[...TAXO.fam.keys()].filter(x => x !== f)])];
    const others = near(list, x => TAXO.fam.get(x)?.o === ord(t));
    return shuffle([f, ...others]).map(x => ({ key: "f" + x, label: famName(x), sub: famVern(x) }));
  }
  const o = ord(t);
  let list = [...new Set(P.map(ord).filter(Boolean))].filter(x => x !== o);
  if (list.length < k - 1) list = [...new Set([...list, ...[...TAXO.ord.keys()].filter(x => x !== o)])];
  return shuffle([o, ...shuffle(list).slice(0, k - 1)]).map(x => ({ key: "o" + x, label: ordName(x), sub: TAXO.ord.get(x)?.vern || "" }));
}

function hintsFor(q) {
  const t = q.t, out = [], r = S.sp[t.id], f = fam(t), o = ord(t);
  if (r?.note) out.push({ ic: "edit", tx: "Ton astuce : " + r.note });
  if (q.level === "species" && (q.stim === "photo" || q.stim === "field") && typeof sosFirst === "function") {
    for (const c of q.choices || []) { const x = c.t && c.t.id !== t.id ? sosFirst(t.sci, c.t.sci) : ""; if (x) { out.push({ ic: "eye", tx: "Regarde d'abord " + x }); break; } }
  }
  const meanings = decodeLatin(t.sci).filter(d => !(q.stim === "fr" && d.w === genus(t).toLowerCase())).map(d => "« " + d.m + " »");
  if (q.level === "species") {
    if (q.stim === "la") {
      if (meanings.length) out.push({ ic: "quill", tx: "Le latin dit : " + meanings.join(" + ") });
      if (f) out.push({ ic: "tree", tx: famName(f) + (famVern(f) ? " · " + famVern(f) : "") });
      if (t.fr) out.push({ ic: "type", tx: `Commence par « ${t.fr.charAt(0)} » · ${t.fr.length} lettres` });
    } else if (q.stim === "fr") {
      if (f) out.push({ ic: "tree", tx: famName(f) + (famVern(f) ? " · " + famVern(f) : "") });
      out.push({ ic: "quill", tx: `Le genre commence par « ${genus(t).charAt(0)} »` });
      if (meanings.length) out.push({ ic: "quill", tx: "Sens : " + meanings.join(" + ") });
    } else {
      if (f) out.push({ ic: "tree", tx: famName(f) + (famVern(f) ? " · " + famVern(f) : "") });
      if (meanings.length) out.push({ ic: "quill", tx: "Son nom latin évoque " + meanings.join(" + ") });
      const nm = q.names === "la" ? t.sci : (t.fr || t.sci);
      out.push({ ic: "type", tx: `Commence par « ${nm.charAt(0)} » · ${nm.length} lettres` });
    }
  } else if (q.level === "genus") {
    if (f) out.push({ ic: "tree", tx: famName(f) + (famVern(f) ? " · " + famVern(f) : "") });
    const gm = ROOTS[genus(t).toLowerCase()];
    if (gm) out.push({ ic: "quill", tx: "Sens du genre : « " + gm.split("|")[0] + " »" });
    out.push({ ic: "type", tx: `Commence par « ${genus(t).charAt(0)} »` });
  } else if (q.level === "family") {
    if (o) out.push({ ic: "tree", tx: "Ordre : " + ordName(o) });
    out.push({ ic: "type", tx: `Commence par « ${famName(f).charAt(0)} »` });
  } else if (q.level === "order") {
    out.push({ ic: "type", tx: `Commence par « ${ordName(o).charAt(0)} »` });
  }
  return out.slice(0, 3);
}

/* ---------- Géo ---------- */
async function geoData() {
  return cached("geo2", 30 * DAY, async () => {
    const out = {};
    await Promise.all(CONTINENTS.map(async c => {
      const pl = await namedPlace(c.q, -10, c.id);
      const d = await inat("/observations/species_counts", { taxon_id: 3, place_id: pl.id, quality_grade: "research", per_page: 200, locale: "fr" });
      out[c.k] = (d.results || []).filter(r => r.taxon && r.taxon.rank === "species" && r.taxon.default_photo)
        .map(r => [r.taxon.id, cap(r.taxon.preferred_common_name || r.taxon.name), r.taxon.name, r.taxon.default_photo.medium_url || sizeUrl(r.taxon.default_photo.url, "medium"), r.taxon.default_photo.attribution || ""]);
    }));
    const n = new Map();
    for (const k in out) for (const s of out[k]) n.set(s[0], (n.get(s[0]) || 0) + 1);
    for (const k in out) out[k] = out[k].filter(s => n.get(s[0]) === 1).slice(0, 120);
    return out;
  });
}
const GEOFIELDS = "id,location,place_guess,taxon.id,taxon.name,taxon.rank,taxon.preferred_common_name,photos.url,photos.attribution";
function parseLoc(o) {
  if (o.location) { const [la, ln] = String(o.location).split(",").map(Number); if (isFinite(la) && isFinite(ln)) return [la, ln]; }
  const c = o.geojson?.coordinates;
  return c ? [c[1], c[0]] : null;
}
/* Point de départ tiré au hasard : un identifiant d'observation au hasard, puis la première observation
   d'oiseau qui suit. Chaque requête a donc une adresse différente : pas de résultat « au hasard »
   resservi par un cache. Les lieux déjà joués récemment sont évités. */
const GEO_MAXID = 230e6;
async function buildGeo(ses) {
  const recent = new Set([...(S.geoSeen || []), ...(ses.geoSeen || [])]);
  for (let attempt = 0; attempt < 7; attempt++) {
    const c = Math.random() < .55 ? pick(CONTINENTS) : null;
    const seed = await obsSearch({ taxon_id: 3, photos: "true", quality_grade: "research", id_above: 1 + rnd(GEO_MAXID), order_by: "id", order: "asc", per_page: 1, ...(c ? { place_id: c.id } : {}), fields: GEOFIELDS }, true).catch(() => null);
    const o = seed?.results?.[0];
    const loc = o && parseLoc(o);
    if (!loc) continue;
    const gkey = loc[0].toFixed(1) + "," + loc[1].toFixed(1);
    if (recent.has(gkey) && attempt < 5) continue;
    (ses.geoSeen || (ses.geoSeen = [])).push(gkey);
    S.geoSeen = [...(S.geoSeen || []).filter(k => k !== gkey), gkey].slice(-60);
    const near = await obsSearch({ taxon_id: 3, photos: "true", quality_grade: "research", lat: loc[0].toFixed(4), lng: loc[1].toFixed(4), radius: 10, order_by: "random", per_page: 60, locale: "fr", fields: GEOFIELDS }, true).catch(() => null);
    const seen = new Set(), sp = [], pts = [];
    for (const n of near?.results || []) {
      const t = n.taxon, ph = (n.photos || []).find(p => p && p.url);
      if (!t || !ph || t.rank !== "species" || seen.has(t.id)) continue;
      seen.add(t.id);
      sp.push({ id: t.id, fr: cap(t.preferred_common_name || t.name), sci: t.name, img: sizeUrl(ph.url, "medium"), lg: sizeUrl(ph.url, "large"), hd: sizeUrl(ph.url, "original"), attr: ph.attribution || "" });
      const l = parseLoc(n); if (l) pts.push(l);
      if (sp.length >= 5) break;
    }
    if (sp.length < 5) continue;
    sp.forEach(s => preload(s.lg));
    const lat = pts.reduce((a, p) => a + p[0], 0) / pts.length || loc[0], lng = pts.reduce((a, p) => a + p[1], 0) / pts.length || loc[1];
    const place = (near.results.find(n => n.place_guess) || o).place_guess || "";
    const country = place.split(",").pop().trim();
    const hints = [{ ic: "globe", tx: lat >= 0 ? "Hémisphère nord" : "Hémisphère sud" }];
    if (country) hints.push({ ic: "pin", tx: "Pays : " + country });
    if (ses.geoQcm) {
      const k = continentOf(lat, lng);
      return { kind: "geo", lat, lng, place, sp, cont: k, format: "qcm", level: "geo", hintsUsed: 0, hints, k: 6,
        choices: CONTINENTS.map(c => ({ key: "c" + c.k, label: c.n })), answerKey: "c" + k };
    }
    return { kind: "geo", lat, lng, place, sp, format: "map", level: "geo", hintsUsed: 0, hints, answerKey: "map" };
  }
  return null;
}
function continentOf(la, ln) {
  if (ln < -25 && ln > -170) return la > 12 ? "na" : "sa";
  if (ln <= -170 || (ln >= 110 && la < -10) || (ln >= 130 && la < 0)) return "oc";
  if (la > 36 && ln >= -25 && ln < 45) return "eu";
  if (la <= 36 && la > -40 && ln >= -25 && ln < 52) return (la > 29 && ln > 34) ? "as" : "af";
  return "as";
}
function haversine(a, b) {
  const R = 6371, r = x => x * Math.PI / 180;
  const dLa = r(b[0] - a[0]), dLn = r(b[1] - a[1]);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const GEOTIERS = [[25, 100, "Pile dessus !"], [100, 80, "Tout près !"], [300, 60, "Bien vu !"], [750, 40, "Pas mal !"], [1500, 25, "Bonne région"], [3000, 15, "Bon continent"], [6000, 8, "C'est loin…"], [Infinity, 3, "À l'autre bout du monde"]];
const geoTier = km => GEOTIERS.find(t => km <= t[0]);
let LEAFP = null;
function ensureLeaflet() {
  if (window.L) return Promise.resolve();
  if (LEAFP) return LEAFP;
  LEAFP = new Promise((res, rej) => {
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "vendor/leaflet/leaflet.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "vendor/leaflet/leaflet.js";
    js.onload = () => res(); js.onerror = () => { LEAFP = null; rej(new Error("carte")); };
    document.head.appendChild(js);
  });
  return LEAFP;
}

/* ---------- Racines ---------- */
function findExample(w) {
  const re = new RegExp("(^|\\s)" + w + "(\\s|$)", "i");
  const recs = Object.values(S.sp).filter(r => re.test(r.sci || ""));
  if (recs.length) { const r = pick(recs); return { sci: r.sci, fr: r.fr }; }
  for (const d of DUELS) { if (re.test(d[0])) return { sci: d[0], fr: d[2] }; if (re.test(d[1])) return { sci: d[1], fr: d[3] }; }
  return null;
}
function buildRoot(ses) {
  const entries = Object.entries(ROOTS).filter(([, m]) => !/^(dédié|imitation|ancien nom)/.test(m));
  const recent = new Set(ses.recent);
  const pool = entries.filter(([w]) => !recent.has(w));
  const [w, m] = pick(pool.length ? pool : entries);
  ses.recent.push(w);
  const [mean, note] = m.split("|");
  const k = clamp(ses.cfg.k || 4, 3, 6);
  const others = [...new Set(shuffle(entries.map(([, x]) => x.split("|")[0])).filter(x => norm(x) !== norm(mean)))].slice(0, k - 1);
  const choices = shuffle([mean, ...others]).map((x, i) => ({ key: "r" + i, label: x }));
  const ex = findExample(w);
  return { kind: "root", w, mean, note: note || "", ex, choices, answerKey: choices.find(c => c.label === mean).key, format: "qcm", level: "root", k, hintsUsed: 0,
    hints: ex ? [{ ic: "bird", tx: `On le trouve chez : ${ex.fr} (${ex.sci})` }] : [] };
}

function warm(q) {
  if (q.photo) { preload(q.photo.lg); preload(q.photo.md); }
  if (q.format === "tiles") (q.choices || []).forEach(c => c.t?.img && preload(c.t.img.md));
}

/* ---------- Réponses ---------- */
function typedTargets(q) {
  const t = q.t;
  if (q.level === "family") { const f = TAXO.fam.get(fam(t)); return [f?.fr, f?.vern, f?.sci].filter(Boolean); }
  if (q.level === "order") { const o = TAXO.ord.get(ord(t)); return [o?.fr, o?.sci, o?.vern].filter(Boolean); }
  if (q.level === "genus") return [genus(t)];
  if (q.stim === "fr") return [t.sci];
  if (q.stim === "la") return [t.fr || t.sci];
  return q.names === "fr" ? [t.fr || t.sci] : q.names === "la" ? [t.sci] : [t.fr, t.sci].filter(Boolean);
}
function checkTyped(str, q) {
  const a = norm(str);
  if (!a) return { ok: false };
  for (const c of typedTargets(q)) {
    const n = norm(c);
    if (!n) continue;
    const tol = n.length <= 5 ? 0 : n.length <= 11 ? 1 : 2;
    if (a === n || lev(a, n) <= tol) return { ok: true, exact: a === n };
  }
  if (q.level === "species") {
    const g = norm(genus(q.t)), first = norm(q.t.fr || "").split(" ")[0];
    if (a.split(" ")[0] === g || (first && a === first)) return { ok: false, partial: true };
  }
  return { ok: false };
}
function xpFor(ses, q, res, ms) {
  if (q.kind === "geo") return q.format === "map" ? (res.geoPts || 0) : (res.ok ? 40 : 0);
  if (!res.ok) return res.partial ? 3 : 0;
  let x = q.kind === "root" ? 7 : q.kind === "hand" ? 9 : 10;
  const nC = q.choices?.length || q.k || 5;
  const fm = { qcm: .6 + .1 * nC, tiles: .6 + .1 * nC, audio: 1.3, type: 1.8, flash: .7 }[q.format] || 1;
  const sm = { photo: 1, field: 1.2, son: 1.4, soncho: 1, fr: 1, la: .9 }[q.stim] || 1;
  const lm = { species: 1, genus: .9, family: .85, order: .65 }[q.level] || 1;
  const dm = { facile: .8, moyen: 1, expert: 1.3 }[q.diff] || 1;
  x *= fm * sm * lm * dm;
  x *= Math.max(.3, 1 - .3 * (q.hintsUsed || 0));
  if (ms < 4000) x += 2;
  x += Math.min(10, ses.combo);
  if (q.bonus) x *= 2;
  return Math.max(1, Math.round(x));
}

function settle(res) {
  const ses = SES, q = ses?.q;
  if (!q || q.done) return;
  q.done = true;
  clearQTimer();
  const ms = Date.now() - (q.t0 || Date.now());
  const ok = !!res.ok;
  if (ok) { ses.combo++; ses.maxCombo = Math.max(ses.maxCombo, ses.combo); S.best.combo = Math.max(S.best.combo, ses.combo); }
  else ses.combo = 0;
  const gain = xpFor(ses, q, res, ms);
  if (gain) { addXp(gain); ses.xp += gain; }
  const d = today(); d.q++; if (ok) d.ok++;
  if (q.kind === "taxon") {
    const r = rec(q.t);
    if (!r.n) ses.newSp.push(q.t.id);
    r.n++; if (ok) { r.ok++; r.lastOk = dayKey(); }
    r.last = dayKey();
    const mod = (q.stim === "son" || q.stim === "soncho") ? "son" : (q.stim === "fr" || q.stim === "la") ? "nom" : "photo";
    if (q.level === "species") {
      srsUpdate(r, mod, ok, (q.hintsUsed || 0) > 0);
      const pk = q.photo && (q.stim === "photo" || q.stim === "field") ? photoKey(q.photo.lg || q.photo.md) : 0;
      const su = q.stim === "son" ? q.snd?.url : q.stim === "soncho" ? (q.choices || []).find(c => c.t?.id === q.t.id)?.snd?.url : "";
      if (pk) r.ps = pushU(r.ps, pk, 20);
      if (ok && !(q.hintsUsed > 0)) {
        if (q.stim === "field" && pk) r.fk = pushU(r.fk, pk);
        else if (pk) r.pk = pushU(r.pk, pk);
        if (su) r.sk = pushU(r.sk, sndKey(su));
        if (pk || su) r.od = pushU(r.od, todayNum(), 8);
      }
      logAttempt(q.t.id, ok, q.stim === "field" ? "f" : mod === "son" ? "s" : mod === "nom" ? "n" : "p", pk || (su ? sndKey(su) : 0));
    }
    else { const f = fam(q.t); if (f) { const s = S.fam[f] || (S.fam[f] = { n: 0, ok: 0 }); s.n++; if (ok) s.ok++; } }
    bump(q.level === "family" ? "fam" : q.level === "genus" ? "genre" : q.level === "order" ? "ordre" : mod, ok);
    if (q.format === "type") bump("type", ok);
    if (ok && mod === "son") count("ear");
    if (ok && (q.stim === "fr" || (q.names === "la" && q.level === "species"))) count("latin");
    if (ok && q.level === "family") count("famok");
    if (ok && q.format === "type") count("typeok");
    if (ok && q.bonus) count("rare");
    if (!ok && res.chosen?.t && q.level === "species" && res.chosen.t.id !== q.t.id) {
      rec(res.chosen.t);
      r.conf[res.chosen.t.id] = (r.conf[res.chosen.t.id] || 0) + 1;
      (ses.confs || (ses.confs = [])).push([q.t.id, res.chosen.t.id]);
    }
    if (!ok) ses.missed.push(q.t);
  } else if (q.kind === "geo") { bump("geo", ok); if (ok) count("geook"); }
  else if (q.kind === "root") { bump("root", ok); if (ok) count("rootok"); }
  else if (q.kind === "hand") { bump("hand", ok); if (ok) count("handok"); handRecord(q, ok); if (!ok && q.sp) (ses.hmiss || (ses.hmiss = [])).push(q.sp); }
  ses.results.push({ ok, part: !!res.partial, xp: gain, id: q.t?.id || null, kind: q.kind });
  const L = level();
  if (L.n > (ses.lvlNow || ses.lvl0)) {
    ses.lvlNow = L.n;
    setTimeout(() => { sfx.lvl(); confetti(); toast(`Niveau ${L.n} : ${L.rank} !`); }, 650);
  }
  save();
  if (ok) { sfx.ok(); if (ses.combo >= 5 && ses.combo % 5 === 0) setTimeout(sfx.combo, 250); } else sfx.bad();
  showFeedback(q, res, gain);
}

async function nextQuestion() {
  const ses = SES;
  if (!ses || ses.ended) return;
  hideFeedback();
  if ((ses.deadline && Date.now() >= ses.deadline) || (ses.len && ses.results.length >= ses.len)) return endSession();
  let p = ses.nextP;
  ses.nextP = null;
  let q = null;
  const slow = setTimeout(() => { if (SES === ses) $("#app").classList.add("waiting"); }, 250);
  try {
    q = p ? await p : await buildNext(ses);
    if (q && q.err) q = await buildNext(ses);
  } catch (e) {
    clearTimeout(slow);
    if (SES === ses) showError(e, ses.cfg, true);
    return;
  }
  clearTimeout(slow);
  $("#app").classList.remove("waiting");
  if (SES !== ses) return;
  if (!q) return endSession();
  showQuestion(q);
}

function showQuestion(q) {
  const ses = SES;
  sndStop();
  ses.q = q;
  q.done = false;
  if (q.t) ses.recent.push(q.t.id);
  go("quiz", q);
  mountQuestion(q);
  q.t0 = Date.now();
  const more = !(ses.len && ses.built >= ses.len);
  if (!ses.nextP && more) ses.nextP = buildNext(ses).catch(e => ({ err: e }));
}

function endSession(aborted) {
  const ses = SES;
  if (!ses || ses.ended) return;
  ses.ended = true;
  clearQTimer();
  sndStop();
  hideFeedback();
  const n = ses.results.length, ok = ses.results.filter(r => r.ok).length;
  let msgs = [];
  if (n) {
    count("sessions");
    if (n >= 10 && ok === n) count("perfect");
    const h = new Date().getHours();
    if (h < 8) count("early");
    if (h >= 22) count("night");
    if (ses.kind === "duel" && n >= 6 && ok >= n - 1) count("duelwin");
    S.hist = [{ t: Date.now(), title: ses.title || "", kind: ses.kind, n, ok, xp: ses.xp, cfg: ses.cfg }, ...(S.hist || [])].slice(0, 30);
    if (n >= 3) {
      const m = markPlayed();
      if (m) msgs.push(m);
      addXp(15); ses.xp += 15;
    }
    if (ses.kind === "serie" && !aborted && n >= ses.len) {
      if (!today().serie) { addXp(50); ses.xp += 50; }
      today().serie = 1;
    }
    if (ses.kind === "path") { S.lastPath = ses.cfg.path; pathSettle(ses, n, ok, aborted); }
  }
  if (n && S.hist && S.hist[0]) S.hist[0].xp = ses.xp;
  const badges = checkBadges();
  const L = level();
  if (L.n > ses.lvl0 && !ses.lvlNow) { setTimeout(() => { sfx.lvl(); confetti(); }, 500); }
  save(true);
  topPush();
  if (!n) { SES = null; go("home"); return; }
  go("result", { ses, n, ok, badges, msgs });
  if (ok / n >= .8 || badges.length) setTimeout(() => confetti(), 450);
}
