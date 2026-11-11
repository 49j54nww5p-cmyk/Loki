/* ============================================================
   Plumage — le grand parcours (« Lancer la série du jour »)
   17 chapitres rangés logiquement (jardin → forêt → champs → villes → eaux douces →
   roselières → limicoles → laridés → mer → rapaces → nuit → montagne → Sud →
   Corse et Méditerranée → migrateurs → raretés → outre-mer).
   Chaque chapitre : des étapes de 4-5 espèces, une révision toutes les 2 étapes,
   un bilan de chapitre, puis un coffre à ouvrir. 100 étapes par tour, rejouées en
   10 tours de plus en plus durs (photos, terrain, chants, latin, écrire, chrono…) : 1 000 étapes.
   ============================================================ */
const PS = id => PATHI[id].steps;
const GCH = [
  { k: "jardin", n: "Le jardin", steps: PS("jardin") },
  { k: "foret", n: "La forêt", steps: [
    { n: "Les pics", sp: [["Dryocopus martius", "Pic noir"], ["Dendrocoptes medius", "Pic mar"], ["Dryobates minor", "Pic épeichette"], ["Jynx torquilla", "Torcol fourmilier"]] },
    { n: "Grives et merles", sp: [["Turdus philomelos", "Grive musicienne"], ["Turdus viscivorus", "Grive draine"], ["Turdus iliacus", "Grive mauvis"], ["Turdus pilaris", "Grive litorne"], ["Turdus torquatus", "Merle à plastron"]] },
    { n: "Roitelets et pouillots", sp: [["Regulus regulus", "Roitelet huppé"], ["Regulus ignicapilla", "Roitelet à triple bandeau"], ["Phylloscopus trochilus", "Pouillot fitis"], ["Phylloscopus sibilatrix", "Pouillot siffleur"], ["Phylloscopus bonelli", "Pouillot de Bonelli"]] },
    { n: "Les mésanges des bois", sp: [["Periparus ater", "Mésange noire"], ["Lophophanes cristatus", "Mésange huppée"], ["Poecile palustris", "Mésange nonnette"], ["Poecile montanus", "Mésange boréale"], ["Certhia familiaris", "Grimpereau des bois"]] },
    { n: "Gros becs", sp: [["Coccothraustes coccothraustes", "Grosbec casse-noyaux"], ["Pyrrhula pyrrhula", "Bouvreuil pivoine"], ["Spinus spinus", "Tarin des aulnes"], ["Loxia curvirostra", "Bec-croisé des sapins"], ["Fringilla montifringilla", "Pinson du Nord"]] },
    { n: "Les voix de la forêt", sp: [["Oriolus oriolus", "Loriot d'Europe"], ["Cuculus canorus", "Coucou gris"], ["Columba oenas", "Pigeon colombin"], ["Scolopax rusticola", "Bécasse des bois"], ["Ficedula hypoleuca", "Gobemouche noir"]] }
  ] },
  { k: "champs", n: "Champs et haies", steps: [
    { n: "Alouettes et pipits", sp: [["Alauda arvensis", "Alouette des champs"], ["Lullula arborea", "Alouette lulu"], ["Galerida cristata", "Cochevis huppé"], ["Anthus pratensis", "Pipit farlouse"], ["Anthus trivialis", "Pipit des arbres"]] },
    { n: "Les bruants", sp: [["Emberiza citrinella", "Bruant jaune"], ["Emberiza cirlus", "Bruant zizi"], ["Emberiza calandra", "Bruant proyer"], ["Emberiza schoeniclus", "Bruant des roseaux"], ["Emberiza hortulana", "Bruant ortolan"]] },
    { n: "Fauvettes et pies-grièches", sp: [["Curruca communis", "Fauvette grisette"], ["Curruca undata", "Fauvette pitchou"], ["Sylvia borin", "Fauvette des jardins"], ["Lanius collurio", "Pie-grièche écorcheur"], ["Lanius senator", "Pie-grièche à tête rousse"]] },
    { n: "Tariers et traquets", sp: [["Saxicola rubicola", "Tarier pâtre"], ["Saxicola rubetra", "Tarier des prés"], ["Oenanthe oenanthe", "Traquet motteux"], ["Phoenicurus phoenicurus", "Rougequeue à front blanc"], ["Linaria cannabina", "Linotte mélodieuse"]] },
    { n: "Les oiseaux des plaines", sp: [["Phasianus colchicus", "Faisan de Colchide"], ["Perdix perdix", "Perdrix grise"], ["Alectoris rufa", "Perdrix rouge"], ["Coturnix coturnix", "Caille des blés"], ["Upupa epops", "Huppe fasciée"]] }
  ] },
  { k: "villes", n: "Villes et ciel", steps: [
    { n: "Hirondelles et martinets", sp: [["Hirundo rustica", "Hirondelle rustique"], ["Delichon urbicum", "Hirondelle de fenêtre"], ["Riparia riparia", "Hirondelle de rivage"], ["Apus apus", "Martinet noir"], ["Tachymarptis melba", "Martinet à ventre blanc"]] },
    { n: "Les corvidés", sp: [["Corvus frugilegus", "Corbeau freux"], ["Corvus corax", "Grand Corbeau"], ["Corvus corone", "Corneille noire"], ["Coloeus monedula", "Choucas des tours"], ["Pica pica", "Pie bavarde"]] },
    { n: "Pigeons et tourterelles", sp: [["Columba livia", "Pigeon biset"], ["Columba palumbus", "Pigeon ramier"], ["Columba oenas", "Pigeon colombin"], ["Streptopelia decaocto", "Tourterelle turque"], ["Streptopelia turtur", "Tourterelle des bois"]] }
  ] },
  { k: "eaux", n: "Étangs et canards", steps: PS("eaux") },
  { k: "roseaux", n: "Hérons et roselières", steps: [
    { n: "Les hérons", sp: [["Ardea cinerea", "Héron cendré"], ["Ardea purpurea", "Héron pourpré"], ["Egretta garzetta", "Aigrette garzette"], ["Ardea alba", "Grande Aigrette"], ["Bubulcus ibis", "Héron garde-bœufs"]] },
    { n: "Les hérons discrets", sp: [["Nycticorax nycticorax", "Bihoreau gris"], ["Ardeola ralloides", "Crabier chevelu"], ["Ixobrychus minutus", "Blongios nain"], ["Botaurus stellaris", "Butor étoilé"]] },
    { n: "Les grands échassiers", sp: [["Ciconia ciconia", "Cigogne blanche"], ["Platalea leucorodia", "Spatule blanche"], ["Grus grus", "Grue cendrée"], ["Phoenicopterus roseus", "Flamant rose"], ["Threskiornis aethiopicus", "Ibis sacré"]] },
    { n: "Les voix des roseaux", sp: [["Acrocephalus scirpaceus", "Rousserolle effarvatte"], ["Acrocephalus arundinaceus", "Rousserolle turdoïde"], ["Acrocephalus schoenobaenus", "Phragmite des joncs"], ["Cettia cetti", "Bouscarle de Cetti"], ["Cisticola juncidis", "Cisticole des joncs"]] },
    { n: "Les bijoux du marais", sp: [["Rallus aquaticus", "Râle d'eau"], ["Alcedo atthis", "Martin-pêcheur d'Europe"], ["Panurus biarmicus", "Panure à moustaches"], ["Luscinia svecica", "Gorgebleue à miroir"], ["Remiz pendulinus", "Rémiz penduline"]] }
  ] },
  { k: "limicoles", n: "Les limicoles", steps: PS("limicoles") },
  { k: "larides", n: "Mouettes, goélands, sternes", steps: PS("larides") },
  { k: "mer", n: "Mer et côtes", steps: [
    { n: "Les oiseaux du large", sp: [["Morus bassanus", "Fou de Bassan"], ["Puffinus puffinus", "Puffin des Anglais"], ["Fulmarus glacialis", "Fulmar boréal"], ["Hydrobates pelagicus", "Océanite tempête"], ["Stercorarius skua", "Grand Labbe"]] },
    { n: "Pingouins et plongeons", sp: [["Alca torda", "Pingouin torda"], ["Uria aalge", "Guillemot de Troïl"], ["Fratercula arctica", "Macareux moine"], ["Gavia stellata", "Plongeon catmarin"], ["Gavia immer", "Plongeon imbrin"]] },
    { n: "Cormorans et canards marins", sp: [["Gulosus aristotelis", "Cormoran huppé"], ["Phalacrocorax carbo", "Grand Cormoran"], ["Melanitta nigra", "Macreuse noire"], ["Somateria mollissima", "Eider à duvet"], ["Clangula hyemalis", "Harelde boréale"]] },
    { n: "Rochers et dunes", sp: [["Anthus petrosus", "Pipit maritime"], ["Pyrrhocorax pyrrhocorax", "Crave à bec rouge"], ["Calidris maritima", "Bécasseau violet"], ["Plectrophenax nivalis", "Bruant des neiges"], ["Eremophila alpestris", "Alouette haussecol"]] }
  ] },
  { k: "rapaces", n: "Les rapaces", steps: [...PS("rapaces"),
    { n: "Aigles et vautours", sp: [["Aquila chrysaetos", "Aigle royal"], ["Hieraaetus pennatus", "Aigle botté"], ["Gyps fulvus", "Vautour fauve"], ["Neophron percnopterus", "Vautour percnoptère"], ["Haliaeetus albicilla", "Pygargue à queue blanche"]] }
  ] },
  { k: "nuit", n: "Les oiseaux de nuit", steps: [
    { n: "Les grands nocturnes", sp: [["Bubo bubo", "Grand-duc d'Europe"], ["Asio flammeus", "Hibou des marais"], ["Strix uralensis", "Chouette de l'Oural"], ["Caprimulgus ruficollis", "Engoulevent à collier roux"]] },
    { n: "Ils chantent la nuit", sp: [["Luscinia megarhynchos", "Rossignol philomèle"], ["Locustella naevia", "Locustelle tachetée"], ["Locustella luscinioides", "Locustelle luscinioïde"], ["Acrocephalus palustris", "Rousserolle verderolle"], ["Acrocephalus melanopogon", "Lusciniole à moustaches"]] },
    { n: "Râles et marouettes", sp: [["Crex crex", "Râle des genêts"], ["Porzana porzana", "Marouette ponctuée"], ["Zapornia parva", "Marouette poussin"], ["Zapornia pusilla", "Marouette de Baillon"]] }
  ] },
  { k: "montagne", n: "La montagne", steps: [
    { n: "Les sommets", sp: [["Tichodroma muraria", "Tichodrome échelette"], ["Pyrrhocorax graculus", "Chocard à bec jaune"], ["Montifringilla nivalis", "Niverolle alpine"], ["Prunella collaris", "Accenteur alpin"], ["Lagopus muta", "Lagopède alpin"]] },
    { n: "Les forêts d'altitude", sp: [["Nucifraga caryocatactes", "Cassenoix moucheté"], ["Tetrao urogallus", "Grand Tétras"], ["Lyrurus tetrix", "Tétras lyre"], ["Glaucidium passerinum", "Chevêchette d'Europe"], ["Aegolius funereus", "Chouette de Tengmalm"]] },
    { n: "Torrents et falaises", sp: [["Cinclus cinclus", "Cincle plongeur"], ["Motacilla cinerea", "Bergeronnette des ruisseaux"], ["Monticola saxatilis", "Monticole de roche"], ["Ptyonoprogne rupestris", "Hirondelle de rochers"], ["Anthus spinoletta", "Pipit spioncelle"]] }
  ] },
  { k: "sud", n: "Le Sud", steps: [
    { n: "La garrigue", sp: [["Curruca melanocephala", "Fauvette mélanocéphale"], ["Curruca cantillans", "Fauvette passerinette"], ["Monticola solitarius", "Monticole bleu"], ["Oenanthe hispanica", "Traquet oreillard"], ["Emberiza cia", "Bruant fou"]] },
    { n: "Les couleurs du Sud", sp: [["Merops apiaster", "Guêpier d'Europe"], ["Coracias garrulus", "Rollier d'Europe"], ["Clamator glandarius", "Coucou geai"], ["Caprimulgus europaeus", "Engoulevent d'Europe"], ["Burhinus oedicnemus", "Œdicnème criard"]] }
  ] },
  { k: "medit", n: "Corse et Méditerranée", steps: [
    { n: "Les oiseaux de Corse", sp: [["Sitta whiteheadi", "Sittelle corse"], ["Carduelis corsicana", "Venturon corse"], ["Curruca sarda", "Fauvette sarde"], ["Curruca conspicillata", "Fauvette à lunettes"], ["Gypaetus barbatus", "Gypaète barbu"]] },
    { n: "La grande bleue", sp: [["Calonectris diomedea", "Puffin de Scopoli"], ["Puffinus yelkouan", "Puffin yelkouan"], ["Ichthyaetus audouinii", "Goéland d'Audouin"], ["Chroicocephalus genei", "Goéland railleur"], ["Gelochelidon nilotica", "Sterne hansel"]] },
    { n: "Lagunes et salins", sp: [["Glareola pratincola", "Glaréole à collier"], ["Porphyrio porphyrio", "Talève sultane"], ["Netta rufina", "Nette rousse"], ["Plegadis falcinellus", "Ibis falcinelle"]] },
    { n: "La Crau et les steppes", sp: [["Pterocles alchata", "Ganga cata"], ["Tetrax tetrax", "Outarde canepetière"], ["Falco naumanni", "Faucon crécerellette"], ["Melanocorypha calandra", "Alouette calandre"], ["Calandrella brachydactyla", "Alouette calandrelle"]] }
  ] },
  { k: "migr", n: "Migrateurs et hivernants", steps: [
    { n: "Les passereaux de passage", sp: [["Motacilla flava", "Bergeronnette printanière"], ["Hippolais icterina", "Hypolaïs ictérine"], ["Hippolais polyglotta", "Hypolaïs polyglotte"], ["Curruca curruca", "Fauvette babillarde"], ["Muscicapa striata", "Gobemouche gris"]] },
    { n: "Les grands voyageurs", sp: [["Ciconia nigra", "Cigogne noire"], ["Anser albifrons", "Oie rieuse"], ["Branta leucopsis", "Bernache nonnette"], ["Cygnus cygnus", "Cygne chanteur"], ["Mergellus albellus", "Harle piette"]] },
    { n: "Limicoles de passage", sp: [["Tringa glareola", "Chevalier sylvain"], ["Calidris temminckii", "Bécasseau de Temminck"], ["Lymnocryptes minimus", "Bécassine sourde"], ["Eudromias morinellus", "Pluvier guignard"]] }
  ] },
  { k: "rares", n: "Les visiteurs rares", steps: [
    { n: "Raretés d'automne", sp: [["Phylloscopus inornatus", "Pouillot à grands sourcils"], ["Bombycilla garrulus", "Jaseur boréal"], ["Anthus richardi", "Pipit de Richard"], ["Lanius excubitor", "Pie-grièche grise"], ["Calidris pugnax", "Combattant varié"]] }
  ] },
  { k: "outremer", n: "L'outre-mer", steps: [
    { n: "La Réunion", sp: [["Hypsipetes borbonicus", "Bulbul de la Réunion"], ["Zosterops borbonicus", "Zostérops des Mascareignes"], ["Saxicola tectes", "Tarier de la Réunion"], ["Terpsiphone bourbonnensis", "Tchitrec des Mascareignes"], ["Phaethon lepturus", "Phaéton à bec jaune"]] },
    { n: "Les Antilles", sp: [["Coereba flaveola", "Sucrier à ventre jaune"], ["Quiscalus lugubris", "Quiscale merle"], ["Eulampis jugularis", "Colibri madère"], ["Orthorhyncus cristatus", "Colibri huppé"], ["Loxigilla noctis", "Sporophile rougegorge"]] }
  ] }
];
/* Les 10 tours : chaque tour garde tout ce qui précède et ajoute une difficulté (cumulatif, mélangé) */
const GTOURS = [
  { n: "Photos", d: "3 choix", stim: ["photo"], k: 3 },
  { n: "+ Terrain et leurres", d: "4 choix, photos de terrain, des oiseaux qui se ressemblent", stim: ["photo", "field"], k: 4, leurres: 1 },
  { n: "+ Chants", d: "5 choix, les chants arrivent", stim: ["photo", "field", "son"], k: 5, leurres: 1 },
  { n: "+ Noms latins", d: "latin ↔ français", stim: ["photo", "field", "son", "la", "fr"], k: 5, leurres: 1 },
  { n: "+ Lequel chante ?", d: "4 chants à comparer", stim: ["photo", "field", "son", "la", "fr", "soncho"], k: 5, leurres: 1 },
  { n: "+ Écrire", d: "6 choix, et parfois tu tapes le nom", stim: ["photo", "field", "son", "la", "fr", "soncho"], k: 6, leurres: 1, type: .2 },
  { n: "+ Jeunes et femelles", d: "les plumages qui piègent", stim: ["photo", "field", "son", "la", "fr", "soncho"], k: 6, leurres: 1, type: .25, juv: .25 },
  { n: "+ Chrono", d: "10 secondes par question", stim: ["field", "son", "la", "fr", "soncho"], k: 6, leurres: 1, type: .3, juv: .3, timer: 10 },
  { n: "+ Moitié à l'écrit", d: "jeunes, leurres, chrono", stim: ["field", "son", "son", "la", "fr", "soncho"], k: 6, leurres: 1, type: .5, juv: .4, timer: 10 },
  { n: "Expert", d: "tout, tout le temps", stim: ["field", "son", "son", "la", "fr", "soncho"], k: 6, leurres: 1, type: .6, juv: .5, timer: 10 }
];
/* Un tour : étapes d'apprentissage, révision toutes les 2 étapes, bilan de chapitre */
const GBASE = (() => {
  const out = [];
  GCH.forEach((ch, ci) => {
    const L = ch.steps.length;
    ch.steps.forEach((st, si) => {
      out.push({ n: st.n, sp: st.sp, ch: ci, kind: "learn" });
      if (L > 2 && si % 2 === 1 && si < L - 1) out.push({ n: "Révision", sp: [...ch.steps[si - 1].sp, ...st.sp], ch: ci, kind: "rev" });
    });
    if (L > 1) out.push({ n: `Bilan : ${ch.n}`, sp: ch.steps.flatMap(s => s.sp), ch: ci, kind: "boss" });
    out.filter(s => s.ch === ci).forEach((s, k) => { s.ck = ch.k; s.pos = k; });
  });
  return out;
})();
const GRAND = { id: "grand", n: "Le grand parcours", d: "Toute la France, chapitre par chapitre", ic: "bird", c: "#FFCE00", stim: ["photo"],
  steps: GTOURS.flatMap((T, ti) => GBASE.map(s => ({ ...s, tour: ti }))) };
PATHI.grand = GRAND;
const GPT = GBASE.length;   // étapes par tour
const gStep = i => GRAND.steps[i];
const gNext = () => pathNext(GRAND);

/* ---------- Ancienne progression (13 chapitres × 12 tours = 972 étapes) → nouvelle (17 × 10 = 1 000) ----------
   Les étapes sont retrouvées par (tour, chapitre, position dans le chapitre) : rien n'est perdu sauf les
   deux tours supprimés (« Photos 4 choix » et « Plus d'écrit », fondus dans leurs voisins). */
const GOLD = { ch: [["jardin", 6], ["foret", 6], ["champs", 5], ["villes", 3], ["eaux", 4], ["roseaux", 5], ["limicoles", 5], ["larides", 3], ["mer", 4], ["rapaces", 5], ["montagne", 3], ["sud", 2], ["rares", 1]],
  tours: [0, -1, 1, 2, 3, 4, 5, 6, -1, 7, 8, 9] };
function gMigrate(st) {
  const old = GOLD.ch.flatMap(([k, L]) => { const n = L + (L > 2 ? Math.floor((L - 1) / 2) : 0) + (L > 1 ? 1 : 0); return Array.from({ length: n }, (_, pos) => ({ k, pos })); });
  const s = {};
  for (const [i, v] of Object.entries(st.s || {})) {
    const t = GOLD.tours[Math.floor(+i / old.length)], o = old[+i % old.length];
    if (t == null || t < 0 || !o) continue;
    const j = GBASE.findIndex(b => b.ck === o.k && b.pos === o.pos);
    if (j >= 0) s[t * GPT + j] = Math.max(s[t * GPT + j] || 0, v);
  }
  st.s = s;
  return st;
}
if (S.gv !== 2) { if (S.paths?.grand) gMigrate(S.paths.grand); S.gv = 2; save(); }

/* ---------- Les coffres : un par chapitre et par tour, à ouvrir une fois le bilan réussi ---------- */
const gKey = (ti, ci) => `${GCH[ci].k}.${ti}`;
const gIdx = (ti, ci) => GBASE.map((s, k) => s.ch === ci ? ti * GPT + k : -1).filter(k => k >= 0);
const gFull = (ti, ci) => gIdx(ti, ci).every(i => stepStars("grand", i) > 0);
const gOpened = (ti, ci) => !!(pathSt("grand").c || {})[gKey(ti, ci)];
/* La récompense : 500 XP au 1er chapitre, +100 par chapitre, × (1 + 0,5 × tour) ; 1 coffre sur 5 « rare » (doré, double) ;
   un coffre sur trois ajoute un joker de flamme (s'il reste de la place) ou des plumes */
const gRare = (ti, ci) => (ti * 7 + ci * 3 + 2) % 5 === 0;
function gPrize(ti, ci) {
  const n = ti * GCH.length + ci, rare = gRare(ti, ci), m = rare ? 2 : 1;
  const xp = Math.round((500 + 100 * ci) * (1 + 0.5 * ti)) * m;
  const pz = { kind: "xp", v: xp, rare, joker: 0, pl: 0, t: `+${fmt(xp)} XP`, d: `Bonus du chapitre « ${GCH[ci].n} ».` };
  if (n % 3 === 2) {
    if ((S.streak.jokers || 0) < 3) { pz.joker = 1; pz.x = "+1 joker de flamme"; }
    else { pz.pl = (40 + 20 * ti) * m; pz.x = `+${pz.pl} plumes bonus`; }
  }
  return pz;
}
const CHEST = `<svg class="chest" viewBox="0 0 64 56" aria-hidden="true">
  <g class="lid"><path d="M8 24V16a14 10 0 0 1 14-10h20a14 10 0 0 1 14 10v8z" fill="#FFCE00"/><path d="M8 24V16a14 10 0 0 1 14-10h20a14 10 0 0 1 14 10v8z" fill="none" stroke="#7A5A00" stroke-width="3"/><path d="M24 6v18M40 6v18" stroke="#B89400" stroke-width="5"/></g>
  <rect x="8" y="24" width="48" height="26" rx="4" fill="#E0B000" stroke="#7A5A00" stroke-width="3"/><path d="M24 24v26M40 24v26" stroke="#B89400" stroke-width="5"/>
  <rect x="27" y="20" width="10" height="13" rx="3" fill="#2A1F00"/><circle cx="32" cy="26" r="2.2" fill="#FFCE00"/></svg>`;
function gChestHtml(ti, ci, full, opened) {
  const st = opened ? "open" : full ? "ready" : "lock";
  return `<li class="k-chest c-${st}" style="--x:1"><button class="gnode gchest" data-act="gchest" data-t="${ti}" data-c="${ci}" ${st === "ready" ? "" : "disabled"} aria-label="Coffre du chapitre">${CHEST}</button>
    <span class="glab"><b>${opened ? "Coffre ouvert" : full ? "Coffre à ouvrir !" : "Coffre du chapitre"}</b><small>${opened ? "Récompense récupérée" : full ? "Touche-le" : "Réussis le bilan pour l'ouvrir"}</small></span></li>`;
}
async function gChestOpen(el) {
  const ti = +el.dataset.t, ci = +el.dataset.c;
  if (!gFull(ti, ci) || gOpened(ti, ci)) return;
  const pz = gPrize(ti, ci), st = (S.paths = S.paths || {}).grand = S.paths.grand || { s: {} };
  (st.c = st.c || {})[gKey(ti, ci)] = 1;   /* enregistré avant l'animation : une seule récompense, même en tapant deux fois */
  addXp(pz.v);
  if (pz.joker) S.streak.jokers = (S.streak.jokers || 0) + 1;
  if (pz.pl) S.plumes = (S.plumes || 0) + pz.pl;
  save(true);
  try { sfx.lvl(); } catch (e) { /* son facultatif */ }
  const node = el.closest(".k-chest, .gchest-bar") || el;
  node.classList.add("opening");
  const calm = S.set.calm || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  await new Promise(r => setTimeout(r, calm ? 50 : 900));
  const box = document.createElement("div");
  box.className = "gprize" + (pz.rare ? " rare" : ""); box.setAttribute("role", "dialog");
  box.innerHTML = `<div class="gprize-card"><div class="gprize-ch">${CHEST}<i class="rays"></i></div>
    <small>Coffre · ${esc(GCH[ci].n)} · tour ${ti + 1}</small>${pz.rare ? `<span class="gprize-rare">Coffre rare · double</span>` : ""}<h2>${esc(pz.t)}</h2>${pz.x ? `<p class="gprize-x">${pz.joker ? ic("flame", "xs") : ic("feather", "xs")}${esc(pz.x)}</p>` : ""}<p>${esc(pz.d)}</p>
    <button class="btn primary wide gprize-ok">${ic("spark")}Récupérer</button></div>`;
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add("on"));
  const close = () => { box.remove(); if (VIEW === "grand") rerender(); };
  box.querySelector(".gprize-ok").addEventListener("click", close);
  box.addEventListener("click", e => { if (e.target === box) close(); });
}

/* ---------- L'écran du parcours ---------- */
const GV = { tour: -1, ch: -1 };
function chHtml(ti, ci, nx) {
  const idx = gIdx(ti, ci);
  const done = idx.filter(i => stepStars("grand", i) > 0).length, open = stepOpen(GRAND, idx[0]);
  const full = done === idx.length, opened = gOpened(ti, ci), ready = full && !opened;
  const cur = idx.includes(nx), exp = GV.ch === ci || (GV.ch === -1 && cur);
  const ch = GCH[ci], cover = ch.steps[0].sp[0];
  return `<div class="gch ${open ? "" : "lock"} ${cur ? "cur" : ""} ${full ? "full" : ""} ${ready ? "chest-ready" : ""}">
    <button class="gcov" data-act="gch" data-c="${ci}" data-sci="${esc(cover[0])}" ${open ? "" : "disabled"}>
      <span class="gtx"><small>Chapitre ${ci + 1} · ${done}/${idx.length}</small><b>${esc(ch.n)}</b></span>
      <span class="gst">${open ? (full ? ic("check") : cur ? ic("play") : "") : ic("lock")}</span></button>
    ${ready && !exp ? `<button class="gchest-bar" data-act="gchest" data-t="${ti}" data-c="${ci}">${CHEST}<span><b>Coffre à ouvrir</b><small>Chapitre terminé : ta récompense t'attend</small></span>${ic("chev")}</button>` : ""}
    ${exp && open ? `<ol class="groad">${idx.map((i, k) => { const st = stepStars("grand", i), ok = stepOpen(GRAND, i), s = gStep(i), here = i === nx;
      return `<li class="${st ? "done" : ""} ${ok ? "" : "lock"} ${here ? "here" : ""} k-${s.kind}" style="--x:${[0, 1, 2, 1][k % 4]}">
        <button class="gnode" data-act="gstep" data-i="${i}" ${ok ? "" : "disabled"} aria-label="Étape ${i + 1}">${st ? ic("check") : here ? ic("play") : s.kind === "boss" ? ic("trophy") : s.kind === "rev" ? ic("replay") : ok ? i + 1 : ic("lock")}</button>
        <span class="glab"><b>${esc(s.n)}</b><small>Étape ${i + 1}${st ? " · " + "★".repeat(st) : ""}</small></span></li>`; }).join("")}${gChestHtml(ti, ci, full, opened)}</ol>` : ""}
  </div>`;
}
function grandHtml() {
  if (S.gv !== 2) { if (S.paths?.grand) gMigrate(S.paths.grand); S.gv = 2; save(); }
  const nx = gNext(), curT = nx < 0 ? GTOURS.length - 1 : Math.floor(nx / GPT);
  const ti = GV.tour >= 0 ? Math.min(GV.tour, curT) : curT, T = GTOURS[ti];
  const done = GRAND.steps.filter((_, i) => stepStars("grand", i) > 0).length, tot = GRAND.steps.length;
  const chests = GTOURS.reduce((a, _, t) => a + GCH.filter((_, c) => gOpened(t, c)).length, 0);
  return `<section class="view grand">
  <header class="ghead"><button class="icon-btn" data-act="home" aria-label="Retour">${ic("x")}</button><h1>Ton parcours</h1><span class="gcount">Tour ${curT + 1}/${GTOURS.length}</span></header>
  <div class="gtotal"><div class="gtotal-n"><b>${done}</b><span>/ ${fmt(tot)} étapes</span><small>${CHEST}${chests} coffre${chests > 1 ? "s" : ""}</small></div><span class="gbar"><i style="width:${(100 * done / tot).toFixed(1)}%"></i></span></div>
  <div class="gtours">${GTOURS.map((t, k) => `<button class="${k === ti ? "on" : ""}" data-act="gtour" data-t="${k}" ${k > curT ? "disabled" : ""}>${k > curT ? ic("lock", "xs") : ""}Tour ${k + 1}</button>`).join("")}</div>
  <p class="gtour-d"><b>Tour ${ti + 1} · ${esc(T.n)}</b> ${esc(T.d)}. Chaque tour garde tout ce qui précède. Dans un chapitre : un choix de plus aux révisions, deux au bilan (16 questions), et un coffre à la fin. ${PASS} bonnes réponses sur ${PLEN} pour avancer.</p>
  <div class="gchs">${GCH.map((_, ci) => chHtml(ti, ci, nx)).join("")}</div>
  <button class="glink" data-act="daily">${ic("shuffle", "xs")}Série du jour classique : 12 questions mélangées</button>
</section>`;
}
async function grandMount() {
  if (typeof ACT === "object" && !ACT.gchest) ACT.gchest = gChestOpen;   /* ACT (ui.js) n'existe qu'une fois tout le script chargé */
  const here = $(".gchest-bar") || $(".groad li.here");
  if (here) setTimeout(() => here.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
  for (const b of $$(".gcov[data-sci]")) {
    const ch = GCH[+b.dataset.c], sp = ch.steps[0].sp[0];
    resolveTaxon(sp[0], sp[1]).then(t => { if (t?.img?.md && b.isConnected) { b.style.backgroundImage = `url("${t.img.md}")`; b.classList.add("ph"); } }).catch(() => {});
  }
}
