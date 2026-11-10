/* ============================================================
   Plumage — le grand parcours (« Lancer la série du jour »)
   13 chapitres rangés logiquement (jardin → forêt → champs → villes → eaux douces →
   roselières → limicoles → laridés → mer → rapaces → montagne → Sud → raretés).
   Chaque chapitre : des étapes de 4-5 espèces, une révision toutes les 2 étapes,
   un bilan de chapitre. Le tout est rejoué en 12 tours de plus en plus durs
   (photos, terrain, chants, latin, écrire, chrono…) : 1 020 étapes.
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
  { k: "montagne", n: "La montagne", steps: [
    { n: "Les sommets", sp: [["Tichodroma muraria", "Tichodrome échelette"], ["Pyrrhocorax graculus", "Chocard à bec jaune"], ["Montifringilla nivalis", "Niverolle alpine"], ["Prunella collaris", "Accenteur alpin"], ["Lagopus muta", "Lagopède alpin"]] },
    { n: "Les forêts d'altitude", sp: [["Nucifraga caryocatactes", "Cassenoix moucheté"], ["Tetrao urogallus", "Grand Tétras"], ["Lyrurus tetrix", "Tétras lyre"], ["Glaucidium passerinum", "Chevêchette d'Europe"], ["Aegolius funereus", "Chouette de Tengmalm"]] },
    { n: "Torrents et falaises", sp: [["Cinclus cinclus", "Cincle plongeur"], ["Motacilla cinerea", "Bergeronnette des ruisseaux"], ["Monticola saxatilis", "Monticole de roche"], ["Ptyonoprogne rupestris", "Hirondelle de rochers"], ["Anthus spinoletta", "Pipit spioncelle"]] }
  ] },
  { k: "sud", n: "Le Sud", steps: [
    { n: "La garrigue", sp: [["Curruca melanocephala", "Fauvette mélanocéphale"], ["Curruca cantillans", "Fauvette passerinette"], ["Monticola solitarius", "Monticole bleu"], ["Oenanthe hispanica", "Traquet oreillard"], ["Emberiza cia", "Bruant fou"]] },
    { n: "Les couleurs du Sud", sp: [["Merops apiaster", "Guêpier d'Europe"], ["Coracias garrulus", "Rollier d'Europe"], ["Clamator glandarius", "Coucou geai"], ["Caprimulgus europaeus", "Engoulevent d'Europe"], ["Burhinus oedicnemus", "Œdicnème criard"]] }
  ] },
  { k: "rares", n: "Les visiteurs rares", steps: [
    { n: "Raretés d'automne", sp: [["Phylloscopus inornatus", "Pouillot à grands sourcils"], ["Bombycilla garrulus", "Jaseur boréal"], ["Anthus richardi", "Pipit de Richard"], ["Lanius excubitor", "Pie-grièche grise"], ["Calidris pugnax", "Combattant varié"]] }
  ] }
];
/* Les 12 tours : chaque tour garde tout ce qui précède et ajoute une difficulté (cumulatif, mélangé) */
const GTOURS = [
  { n: "Photos", d: "3 choix", stim: ["photo"], k: 3 },
  { n: "Photos", d: "4 choix", stim: ["photo"], k: 4 },
  { n: "+ Terrain et leurres", d: "photos de terrain, des oiseaux qui se ressemblent", stim: ["photo", "field"], k: 4, leurres: 1 },
  { n: "+ Chants", d: "5 choix, les chants arrivent", stim: ["photo", "field", "son"], k: 5, leurres: 1 },
  { n: "+ Noms latins", d: "latin ↔ français", stim: ["photo", "field", "son", "la", "fr"], k: 5, leurres: 1 },
  { n: "+ Lequel chante ?", d: "4 chants à comparer", stim: ["photo", "field", "son", "la", "fr", "soncho"], k: 5, leurres: 1 },
  { n: "+ Écrire", d: "6 choix, et parfois tu tapes le nom", stim: ["photo", "field", "son", "la", "fr", "soncho"], k: 6, leurres: 1, type: .2 },
  { n: "+ Jeunes et femelles", d: "les plumages qui piègent", stim: ["photo", "field", "son", "la", "fr", "soncho"], k: 6, leurres: 1, type: .25, juv: .25 },
  { n: "+ Plus d'écrit", d: "un tiers à taper, chants compris", stim: ["field", "field", "son", "son", "la", "fr", "soncho"], k: 6, leurres: 1, type: .35, juv: .3 },
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
  });
  return out;
})();
const GRAND = { id: "grand", n: "Le grand parcours", d: "Toute la France, chapitre par chapitre", ic: "bird", c: "#FFCE00", stim: ["photo"],
  steps: GTOURS.flatMap((T, ti) => GBASE.map(s => ({ ...s, tour: ti }))) };
PATHI.grand = GRAND;
const GPT = GBASE.length;   // étapes par tour
const gStep = i => GRAND.steps[i];
const gNext = () => pathNext(GRAND);

/* ---------- L'écran du parcours ---------- */
const GV = { tour: -1, ch: -1 };
function chHtml(ti, ci, nx) {
  const idx = GBASE.map((s, k) => s.ch === ci ? ti * GPT + k : -1).filter(k => k >= 0);
  const done = idx.filter(i => stepStars("grand", i) > 0).length, open = stepOpen(GRAND, idx[0]);
  const cur = idx.includes(nx), exp = GV.ch === ci || (GV.ch === -1 && cur);
  const ch = GCH[ci], cover = ch.steps[0].sp[0];
  return `<div class="gch ${open ? "" : "lock"} ${cur ? "cur" : ""} ${done === idx.length ? "full" : ""}">
    <button class="gcov" data-act="gch" data-c="${ci}" data-sci="${esc(cover[0])}" ${open ? "" : "disabled"}>
      <span class="gtx"><small>Chapitre ${ci + 1} · ${done}/${idx.length}</small><b>${esc(ch.n)}</b></span>
      <span class="gst">${open ? (done === idx.length ? ic("check") : cur ? ic("play") : "") : ic("lock")}</span></button>
    ${exp && open ? `<ol class="groad">${idx.map((i, k) => { const st = stepStars("grand", i), ok = stepOpen(GRAND, i), s = gStep(i), here = i === nx;
      return `<li class="${st ? "done" : ""} ${ok ? "" : "lock"} ${here ? "here" : ""} k-${s.kind}" style="--x:${[0, 1, 2, 1][k % 4]}">
        <button class="gnode" data-act="gstep" data-i="${i}" ${ok ? "" : "disabled"} aria-label="Étape ${i + 1}">${st ? ic("check") : here ? ic("play") : s.kind === "boss" ? ic("trophy") : s.kind === "rev" ? ic("replay") : ok ? i + 1 : ic("lock")}</button>
        <span class="glab"><b>${esc(s.n)}</b><small>Étape ${i + 1}${st ? " · " + "★".repeat(st) : ""}</small></span></li>`; }).join("")}</ol>` : ""}
  </div>`;
}
function grandHtml() {
  const nx = gNext(), curT = nx < 0 ? GTOURS.length - 1 : Math.floor(nx / GPT);
  const ti = GV.tour >= 0 ? Math.min(GV.tour, curT) : curT, T = GTOURS[ti];
  const done = GRAND.steps.filter((_, i) => stepStars("grand", i) > 0).length;
  return `<section class="view grand">
  <header class="ghead"><button class="icon-btn" data-act="home" aria-label="Retour">${ic("x")}</button><h1>Ton parcours</h1><span class="gcount">${done} / ${GRAND.steps.length}</span></header>
  <div class="gtours">${GTOURS.map((t, k) => `<button class="${k === ti ? "on" : ""}" data-act="gtour" data-t="${k}" ${k > curT ? "disabled" : ""}>${k > curT ? ic("lock", "xs") : ""}Tour ${k + 1}</button>`).join("")}</div>
  <p class="gtour-d"><b>Tour ${ti + 1} · ${esc(T.n)}</b> ${esc(T.d)}. Chaque tour garde tout ce qui précède. Dans un chapitre : un choix de plus aux révisions, deux au bilan. ${PASS} bonnes réponses sur ${PLEN} pour avancer.</p>
  <div class="gchs">${GCH.map((_, ci) => chHtml(ti, ci, nx)).join("")}</div>
  <button class="glink" data-act="daily">${ic("shuffle", "xs")}Série du jour classique : 12 questions mélangées</button>
</section>`;
}
async function grandMount() {
  const here = $(".groad li.here");
  if (here) setTimeout(() => here.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
  for (const b of $$(".gcov[data-sci]")) {
    const ch = GCH[+b.dataset.c], sp = ch.steps[0].sp[0];
    resolveTaxon(sp[0], sp[1]).then(t => { if (t?.img?.md && b.isConnected) { b.style.backgroundImage = `url("${t.img.md}")`; b.classList.add("ph"); } }).catch(() => {});
  }
}
