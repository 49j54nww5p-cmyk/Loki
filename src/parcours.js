/* ============================================================
   Plumage — parcours guidés : quelques oiseaux à la fois, étape par étape
   Chaque étape : on découvre 4 ou 5 espèces, puis 8 questions où l'on choisit parmi elles
   (et une de l'étape d'avant, pour réviser). 6 bonnes réponses sur 8 ouvrent l'étape suivante.
   ============================================================ */
const PATHS = [
  { id: "jardin", n: "Les 30 oiseaux du jardin", d: "Des plus faciles aux plus discrets", ic: "bird", c: "#3BE59D", stim: ["photo", "photo", "field"], steps: [
    { n: "Les incontournables", sp: [["Turdus merula", "Merle noir"], ["Erithacus rubecula", "Rougegorge familier"], ["Parus major", "Mésange charbonnière"], ["Cyanistes caeruleus", "Mésange bleue"], ["Passer domesticus", "Moineau domestique"]] },
    { n: "Pinsons et compagnie", sp: [["Fringilla coelebs", "Pinson des arbres"], ["Carduelis carduelis", "Chardonneret élégant"], ["Chloris chloris", "Verdier d'Europe"], ["Serinus serinus", "Serin cini"], ["Passer montanus", "Moineau friquet"]] },
    { n: "Les noirs et les gris", sp: [["Sturnus vulgaris", "Étourneau sansonnet"], ["Corvus corone", "Corneille noire"], ["Pica pica", "Pie bavarde"], ["Coloeus monedula", "Choucas des tours"], ["Phoenicurus ochruros", "Rougequeue noir"]] },
    { n: "Les plus grands", sp: [["Columba palumbus", "Pigeon ramier"], ["Streptopelia decaocto", "Tourterelle turque"], ["Garrulus glandarius", "Geai des chênes"], ["Dendrocopos major", "Pic épeiche"], ["Picus viridis", "Pic vert"]] },
    { n: "Les petits discrets", sp: [["Troglodytes troglodytes", "Troglodyte mignon"], ["Prunella modularis", "Accenteur mouchet"], ["Aegithalos caudatus", "Mésange à longue queue"], ["Sitta europaea", "Sittelle torchepot"], ["Certhia brachydactyla", "Grimpereau des jardins"]] },
    { n: "Les visiteurs d'été", sp: [["Sylvia atricapilla", "Fauvette à tête noire"], ["Phylloscopus collybita", "Pouillot véloce"], ["Hirundo rustica", "Hirondelle rustique"], ["Apus apus", "Martinet noir"], ["Motacilla alba", "Bergeronnette grise"]] }
  ] },
  { id: "limicoles", n: "Les limicoles en 5 étapes", d: "Vasières, plages et marais", ic: "binoc", c: "#FF8B3D", stim: ["photo", "field"], steps: [
    { n: "Les inratables", sp: [["Haematopus ostralegus", "Huîtrier pie"], ["Recurvirostra avosetta", "Avocette élégante"], ["Himantopus himantopus", "Échasse blanche"], ["Vanellus vanellus", "Vanneau huppé"], ["Arenaria interpres", "Tournepierre à collier"]] },
    { n: "Les bécasseaux", sp: [["Calidris alpina", "Bécasseau variable"], ["Calidris alba", "Bécasseau sanderling"], ["Calidris canutus", "Bécasseau maubèche"], ["Calidris minuta", "Bécasseau minute"], ["Calidris ferruginea", "Bécasseau cocorli"]] },
    { n: "Pluviers et gravelots", sp: [["Pluvialis squatarola", "Pluvier argenté"], ["Pluvialis apricaria", "Pluvier doré"], ["Charadrius hiaticula", "Grand Gravelot"], ["Charadrius dubius", "Petit Gravelot"], ["Charadrius alexandrinus", "Gravelot à collier interrompu"]] },
    { n: "Les chevaliers", sp: [["Tringa totanus", "Chevalier gambette"], ["Tringa nebularia", "Chevalier aboyeur"], ["Actitis hypoleucos", "Chevalier guignette"], ["Tringa ochropus", "Chevalier culblanc"], ["Tringa erythropus", "Chevalier arlequin"]] },
    { n: "Barges, courlis, bécassine", sp: [["Limosa lapponica", "Barge rousse"], ["Limosa limosa", "Barge à queue noire"], ["Numenius arquata", "Courlis cendré"], ["Numenius phaeopus", "Courlis corlieu"], ["Gallinago gallinago", "Bécassine des marais"]] }
  ] },
  { id: "rapaces", n: "Les rapaces de France", d: "De jour comme de nuit", ic: "eye", c: "#FF6FA3", stim: ["photo", "field"], steps: [
    { n: "Les plus courants", sp: [["Buteo buteo", "Buse variable"], ["Falco tinnunculus", "Faucon crécerelle"], ["Accipiter nisus", "Épervier d'Europe"], ["Milvus migrans", "Milan noir"]] },
    { n: "Les grands planeurs", sp: [["Milvus milvus", "Milan royal"], ["Pernis apivorus", "Bondrée apivore"], ["Circaetus gallicus", "Circaète Jean-le-Blanc"], ["Pandion haliaetus", "Balbuzard pêcheur"]] },
    { n: "Busards et faucons", sp: [["Circus aeruginosus", "Busard des roseaux"], ["Circus cyaneus", "Busard Saint-Martin"], ["Circus pygargus", "Busard cendré"], ["Falco peregrinus", "Faucon pèlerin"], ["Falco subbuteo", "Faucon hobereau"]] },
    { n: "Les rapaces nocturnes", sp: [["Strix aluco", "Chouette hulotte"], ["Athene noctua", "Chevêche d'Athéna"], ["Tyto alba", "Effraie des clochers"], ["Asio otus", "Hibou moyen-duc"], ["Otus scops", "Petit-duc scops"]] }
  ] },
  { id: "eaux", n: "Canards et oiseaux d'eau", d: "Étangs, lacs et lagunes", ic: "isle", c: "#14B8A6", stim: ["photo", "field"], steps: [
    { n: "Les plus connus", sp: [["Anas platyrhynchos", "Canard colvert"], ["Cygnus olor", "Cygne tuberculé"], ["Tadorna tadorna", "Tadorne de Belon"], ["Branta bernicla", "Bernache cravant"], ["Anser anser", "Oie cendrée"]] },
    { n: "Les canards de surface", sp: [["Mareca strepera", "Canard chipeau"], ["Mareca penelope", "Canard siffleur"], ["Spatula clypeata", "Canard souchet"], ["Anas crecca", "Sarcelle d'hiver"], ["Anas acuta", "Canard pilet"]] },
    { n: "Les plongeurs", sp: [["Aythya ferina", "Fuligule milouin"], ["Aythya fuligula", "Fuligule morillon"], ["Aythya marila", "Fuligule milouinan"], ["Bucephala clangula", "Garrot à œil d'or"], ["Mergus serrator", "Harle huppé"]] },
    { n: "Grèbes, foulques et cie", sp: [["Podiceps cristatus", "Grèbe huppé"], ["Tachybaptus ruficollis", "Grèbe castagneux"], ["Fulica atra", "Foulque macroule"], ["Gallinula chloropus", "Gallinule poule-d'eau"], ["Phalacrocorax carbo", "Grand Cormoran"]] }
  ] },
  { id: "larides", n: "Mouettes, goélands, sternes", d: "Pour ne plus dire « une mouette »", ic: "wing", c: "#7DD3FC", stim: ["photo", "field"], steps: [
    { n: "Les plus courants", sp: [["Chroicocephalus ridibundus", "Mouette rieuse"], ["Larus argentatus", "Goéland argenté"], ["Larus fuscus", "Goéland brun"], ["Larus marinus", "Goéland marin"]] },
    { n: "Les autres goélands et mouettes", sp: [["Larus michahellis", "Goéland leucophée"], ["Larus canus", "Goéland cendré"], ["Ichthyaetus melanocephalus", "Mouette mélanocéphale"], ["Rissa tridactyla", "Mouette tridactyle"]] },
    { n: "Les sternes", sp: [["Sterna hirundo", "Sterne pierregarin"], ["Thalasseus sandvicensis", "Sterne caugek"], ["Sternula albifrons", "Sterne naine"], ["Chlidonias niger", "Guifette noire"]] }
  ] },
  { id: "chants", n: "Les chants du printemps", d: "Reconnaître à l'oreille", ic: "wave", c: "#FFCB5C", stim: ["son"], steps: [
    { n: "Les voix du jardin", sp: [["Turdus merula", "Merle noir"], ["Erithacus rubecula", "Rougegorge familier"], ["Parus major", "Mésange charbonnière"], ["Fringilla coelebs", "Pinson des arbres"], ["Troglodytes troglodytes", "Troglodyte mignon"]] },
    { n: "Les chanteurs des haies", sp: [["Sylvia atricapilla", "Fauvette à tête noire"], ["Phylloscopus collybita", "Pouillot véloce"], ["Turdus philomelos", "Grive musicienne"], ["Phoenicurus ochruros", "Rougequeue noir"], ["Cuculus canorus", "Coucou gris"]] },
    { n: "Les voix du bois", sp: [["Luscinia megarhynchos", "Rossignol philomèle"], ["Oriolus oriolus", "Loriot d'Europe"], ["Picus viridis", "Pic vert"], ["Streptopelia decaocto", "Tourterelle turque"], ["Columba palumbus", "Pigeon ramier"]] },
    { n: "Champs et friches", sp: [["Emberiza cirlus", "Bruant zizi"], ["Chloris chloris", "Verdier d'Europe"], ["Serinus serinus", "Serin cini"], ["Hippolais polyglotta", "Hypolaïs polyglotte"], ["Alauda arvensis", "Alouette des champs"]] }
  ] }
];
const PATHI = Object.fromEntries(PATHS.map(p => [p.id, p]));
const PASS = 6, PLEN = 8;
const pathSt = id => (S.paths || {})[id] || { s: {} };
const stepStars = (id, i) => pathSt(id).s[i] || 0;
const stepOpen = (P, i) => i === 0 || stepStars(P.id, i - 1) > 0;
const pathDone = P => P.steps.filter((_, i) => stepStars(P.id, i) > 0).length;
const pathNext = P => { const i = P.steps.findIndex((_, k) => !stepStars(P.id, k)); return i < 0 ? -1 : i; };
async function stepTaxa(P, i) {
  return cached(`path1:${P.id}:${i}`, 30 * DAY, async () => {
    const out = [];
    for (const [sci, fr] of P.steps[i].sp) { const t = await resolveTaxon(sci, fr).catch(() => null); if (t) out.push({ ...t, fr: t.fr || fr }); }
    return out.length >= 3 ? out : null;
  });
}
const pathCfg = (P, i) => ({ kind: "path", title: `${P.n} · ${P.steps[i].n}`, icon: P.ic, path: P.id, step: i, zone: { k: "fr", id: 6753, name: "France" }, len: PLEN, names: S.set.names });
/* Le plan : chaque espèce de l'étape au moins une fois, une de l'étape d'avant ; les choix viennent d'abord de l'étape */
async function preparePath(ses) {
  const c = ses.cfg, P = PATHI[c.path];
  const cur = P ? await stepTaxa(P, c.step).catch(() => null) : null;
  if (!cur || cur.length < 3) { const e = new Error("EMPTY"); e.code = "EMPTY"; throw e; }
  const prev = c.step > 0 ? (await stepTaxa(P, c.step - 1).catch(() => null)) || [] : [];
  const all = [...cur, ...prev.filter(t => !cur.some(x => x.id === t.id))];
  all.forEach(t => lexAdd(t));
  ses.pool = { list: all, byId: new Map(all.map(t => [t.id, t])) };
  const extra = PLEN - cur.length - (prev.length ? 1 : 0);
  const targets = shuffle([...cur, ...shuffle(cur).slice(0, Math.max(0, extra)), ...(prev.length ? [pick(prev)] : [])]).slice(0, PLEN);
  ses.plan = targets.map(t => {
    const others = [...shuffle(cur.filter(x => x.id !== t.id)), ...shuffle(prev.filter(x => x.id !== t.id))].slice(0, 3);
    return { t, stim: pick(P.stim), pair: shuffle([t, ...others]), k: others.length + 1 };
  });
  ses.len = ses.plan.length;
  ses.title = c.title;
  photosFor(cur.map(t => t.id)).catch(() => {});
}
/* Fin d'étape : étoiles et déblocage */
function pathSettle(ses, n, ok, aborted) {
  const c = ses.cfg, P = PATHI[c.path];
  if (!P || aborted || n < ses.len) return;
  const stars = ok >= PLEN ? 3 : ok >= PLEN - 1 ? 2 : ok >= PASS ? 1 : 0;
  ses.pathStars = stars;
  if (!stars) return;
  const st = (S.paths = S.paths || {})[P.id] = S.paths[P.id] || { s: {} };
  const first = !st.s[c.step];
  if ((st.s[c.step] || 0) < stars) st.s[c.step] = stars;
  if (first) { count("pathsteps"); addXp(30); ses.xp += 30; }
  if (pathDone(P) === P.steps.length && first) { count("paths"); ses.pathDoneNow = true; }
}

/* ---------- Écrans ---------- */
const PATHV = { id: "", open: -1 };
const starsRow = n => `<span class="pstars">${[1, 2, 3].map(k => ic("star", k <= n ? "on" : "off")).join("")}</span>`;
function pathsListHtml() {
  return `<section class="view paths">
  <div class="head"><button class="icon-btn" data-act="home" aria-label="Retour">${ic("back")}</button><div><h1>Parcours</h1><p>Quelques oiseaux à la fois, étape par étape.</p></div></div>
  <div class="plist2">${PATHS.map(P => { const d = pathDone(P), n = P.steps.length; return `<button class="pathc" data-act="path" data-p="${P.id}" style="--c:${P.c}"><span class="ic">${ic(P.ic)}</span><span class="tx"><b>${esc(P.n)}</b><small>${esc(P.d)} · ${n} étapes</small><span class="pbar"><i style="width:${(100 * d / n).toFixed(0)}%"></i></span></span><span class="pn">${d === n ? ic("check") : `${d}/${n}`}</span></button>`; }).join("")}</div>
</section>`;
}
function pathHtml() {
  const P = PATHI[PATHV.id]; if (!P) return pathsListHtml();
  const nx = pathNext(P), open = PATHV.open === -1 ? nx : PATHV.open;
  return `<section class="view path" style="--c:${P.c}">
  <div class="head"><button class="icon-btn" data-act="paths" aria-label="Retour">${ic("back")}</button><div><h1>${esc(P.n)}</h1><p>${pathDone(P)} / ${P.steps.length} étapes · ${PASS} bonnes réponses sur ${PLEN} pour avancer</p></div></div>
  <ol class="trail">${P.steps.map((s, i) => { const st = stepStars(P.id, i), ok = stepOpen(P, i), on = i === open && ok; return `<li class="${st ? "done" : ""} ${ok ? "" : "lock"} ${on ? "on" : ""}">
    <button class="tnode" data-act="pstep" data-i="${i}" ${ok ? "" : "disabled"}><span class="num">${st ? ic("check") : ok ? i + 1 : ic("lock")}</span><span class="tx"><b>${esc(s.n)}</b><small>${s.sp.length} espèces${st ? "" : ok ? " · à faire" : " · verrouillée"}</small></span>${st ? starsRow(st) : ""}</button>
    ${on ? `<div class="tbody"><div class="tsp" id="tsp">${s.sp.map(([, fr]) => `<span class="spch"><i></i>${esc(fr)}</span>`).join("")}</div>
      <p class="muted note">Touche un oiseau pour voir sa fiche avant de te lancer.</p>
      <button class="btn primary wide" data-act="pgo" data-i="${i}">${ic("play")}${st ? "Refaire l'étape" : "C'est parti"}</button></div>` : ""}</li>`; }).join("")}</ol>
</section>`;
}
async function pathMount() {
  const P = PATHI[PATHV.id], box = $("#tsp"); if (!P || !box) return;
  const i = PATHV.open === -1 ? pathNext(P) : PATHV.open; if (i < 0) return;
  const list = await stepTaxa(P, i).catch(() => null);
  if (!list || VIEW !== "path" || $("#tsp") !== box) return;
  box.innerHTML = list.map(t => `<button class="spch" data-act="fiche" data-id="${t.id}"><img src="${esc(t.img?.sq || "")}" alt="">${esc(nameFr(t))}</button>`).join("");
}
/* Carte « Ton parcours » de l'accueil : la prochaine étape du parcours entamé le plus récemment */
function pathHomeCard() {
  const started = PATHS.filter(P => pathDone(P) > 0 && pathNext(P) >= 0);
  if (!started.length) return "";
  const P = started.find(x => x.id === S.lastPath) || started[0], i = pathNext(P), d = pathDone(P), n = P.steps.length;
  return `<button class="pathhome" data-act="pgo" data-p="${P.id}" data-i="${i}" style="--c:${P.c}"><span class="ic">${ic(P.ic)}</span><span class="tx"><small>Ton parcours · étape ${i + 1}/${n}</small><b>${esc(P.steps[i].n)}</b><span class="pbar"><i style="width:${(100 * d / n).toFixed(0)}%"></i></span></span>${ic("play")}</button>`;
}
