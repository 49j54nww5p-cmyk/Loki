/* ============================================================
   Plumage — Sosies : comprendre une confusion
   Après une erreur : les deux espèces côte à côte, des loupes dessinées sur ce qui diffère
   (tout le reste étant égal), « regarde d'abord… », un moyen mnémo, puis un duel d'entraînement.
   Dessins originaux et schématiques : sur une photo, on ne sait pas où se trouvent le bec
   ou les pattes, alors on dessine la partie, grossie, pour chaque espèce.
   ============================================================ */

/* Noms latins : anciennes et nouvelles appellations ramenées à celles de DUELS */
const SCI_ALIAS = {
  "Corvus monedula": "Coloeus monedula", "Anarhynchus alexandrinus": "Charadrius alexandrinus", "Bubulcus ibis": "Ardea ibis",
  "Larus melanocephalus": "Ichthyaetus melanocephalus", "Phalacrocorax aristotelis": "Gulosus aristotelis", "Dendrocopos minor": "Dryobates minor",
  "Carduelis chloris": "Chloris chloris", "Parus montanus": "Poecile montanus", "Parus palustris": "Poecile palustris", "Parus ater": "Periparus ater",
  "Sterna sandvicensis": "Thalasseus sandvicensis", "Egretta alba": "Ardea alba", "Casmerodius albus": "Ardea alba", "Delichon urbica": "Delichon urbicum",
  "Larus ridibundus": "Chroicocephalus ridibundus"
};
const canonSci = s => SCI_ALIAS[s] || s;

/* ---------- Gabarits par groupe d'oiseaux ---------- */
const ZGRP = {
  pass: { bs: "fin", bl: .38, bd: .78, leg: "perch", ll: .5 },
  tit: { bs: "conique", bl: .26, bd: .8, leg: "perch", ll: .45 },
  finch: { bs: "conique", bl: .4, bd: 1.15, leg: "perch", ll: .45 },
  thrush: { bs: "fin", bl: .42, bd: .9, leg: "perch", ll: .6 },
  lark: { bs: "fin", bl: .44, bd: .9, leg: "ground", ll: .5 },
  creeper: { bs: "courbe", bl: .62, bd: .55, leg: "perch", ll: .4 },
  corvid: { bs: "corvide", bl: .78, bd: 1.25, leg: "perch", ll: .7 },
  pigeon: { bs: "pigeon", bl: .3, bd: .72, leg: "perch", ll: .4 },
  gull: { bs: "fort", bl: .95, bd: 1.0, leg: "ground", ll: .72, web: 1 },
  tern: { bs: "poignard", bl: .82, bd: .8, leg: "ground", ll: .45, web: 1 },
  wader: { bs: "droit", bl: .9, bd: .65, leg: "ground", ll: .85 },
  plover: { bs: "droit", bl: .34, bd: .72, leg: "ground", ll: .65 },
  heron: { bs: "poignard", bl: 1.1, bd: .9, leg: "ground", ll: 1.1 },
  grebe: { bs: "poignard", bl: .5, bd: .65, leg: "ground", ll: .4 },
  duck: { bs: "plat", bl: .8, bd: .85, leg: "ground", ll: .45, web: 1 },
  cormorant: { bs: "cormoran", bl: .9, bd: .8, leg: "ground", ll: .45, web: 1 },
  hawk: { bs: "crochu", bl: .42, bd: 1.0, leg: "perch", ll: .75, raptor: 1 },
  falcon: { bs: "crochu", bl: .38, bd: .95, leg: "perch", ll: .6, raptor: 1 },
  swallow: { bs: "fin", bl: .18, bd: .62, leg: "perch", ll: .28 },
  woodpecker: { bs: "pic", bl: .7, bd: .9, leg: "perch", ll: .45 }
};
const ZLK0 = { hd: "#8C8471", up: "#8C8471", un: "#F0E9DA", wc: "#776F61", tc: "#6C6456", bc: "#2C2824", lc: "#8C7F6E", ey: "#15110E" };

/* ---------- Les paires : g groupe, b allure commune, z critères (a / b = ce qui change), f « regarde d'abord », x ce qu'on regarde, m moyen mnémo ---------- */
const SOSVIS = {
  "Phylloscopus collybita|Phylloscopus trochilus": { g: "pass", x: "les pattes",
    b: { hd: "#8C8A5C", up: "#848657", un: "#EEEAD3", th: "#F1EDD8", wc: "#7A7B4E", we: "#B0B072", tc: "#74754A", su: "#E9E2B8", sul: "long", es: "#6A6A42", bl: .36, bd: .7 },
    z: [{ p: "pattes", a: { lc: "#2B2622", cc: "#1E1A17" }, b: { lc: "#D7AE88", cc: "#A88066" }, t: ["sombres", "claires"] },
      { p: "aile", a: { pp: .26 }, b: { pp: .8 }, t: ["pointes courtes", "pointes longues"] },
      { p: "voix", t: ["« tchif-tchaf »", "mélodie qui descend"] }],
    m: "Véloce en bottes noires, fitis en chaussons clairs." },
  "Corvus corone|Corvus frugilegus": { g: "corvid", x: "la base du bec",
    b: { hd: "#18191C", up: "#18191C", un: "#22242A", wc: "#1C1E23", tc: "#1C1E23", bc: "#141517", lc: "#151618", cc: "#0E0F10", ey: "#2A2622" },
    z: [{ p: "bec", a: { bf: "plumes" }, b: { bf: "nue", bbc: "#D6D0C6" }, t: ["base emplumée", "base nue, blanchâtre"] },
      { p: "tete", l: "Front", a: { fh: "plat" }, b: { fh: "bombe" }, t: ["front plat", "front bombé"] },
      { p: "pattes", l: "Cuisses", a: {}, b: { cu: 1 }, t: ["lisses", "« culotte » lâche"] }],
    m: "Freux : front bombé et bec farineux. Corneille : bec couvert de plumes." },
  "Poecile palustris|Poecile montanus": { g: "tit", x: "la calotte",
    b: { hd: "#F2EFE8", up: "#9A8C78", un: "#ECE5DA", wc: "#8D8070", we: "#A99B88", tc: "#857868", cr: "#16171A", crx: "calotte", ck: "#F5F2EB", ckz: "grand", th: "#16171A", bib: "petite" },
    z: [{ p: "tete", l: "Calotte", a: { gl: 1 }, b: { cr: "#2E2D2C", crx: "nuque" }, t: ["noire brillante", "mate, descend sur la nuque"] },
      { p: "aile", a: {}, b: { pn: 1 }, t: ["aile uniforme", "panneau clair"] },
      { p: "voix", t: ["« pitchou » explosif", "« tchè-tchè » nasillard"] }],
    m: "Nonnette : bonnet verni qui brille. Boréale : bonnet de laine mat, et un panneau clair sur l'aile." },
  "Certhia brachydactyla|Certhia familiaris": { g: "creeper", x: "les flancs",
    b: { hd: "#7D6A54", up: "#7A6650", un: "#F2EEE6", wc: "#6E5C48", tc: "#6E5C48", su: "#EFE9DD", sul: "long", es: "#5E4C3A", th: "#F4F1EA", bc: "#4A3D30", dp: "strie", dpc: "#4A3A2A" },
    z: [{ p: "dessous", l: "Flancs", a: { fl: "#C2AD93" }, b: { fl: "#F5F2EC" }, t: ["lavés de gris-brun", "blancs, propres"] },
      { p: "tete", l: "Sourcil", a: { suf: "oeil", su: "#DCD3C3" }, b: { su: "#FCFAF6" }, t: ["flou devant l'œil", "net jusqu'au bec"] },
      { p: "voix", t: ["court et rythmé", "fin, qui descend"] }],
    m: "Des jardins : flancs salis par la terre du jardin. Des bois : ventre tout propre." },
  "Acrocephalus scirpaceus|Acrocephalus palustris": { g: "pass", x: "le croupion",
    b: { hd: "#94805F", up: "#94805F", un: "#F1E9D6", th: "#F6F1E6", wc: "#86735A", we: "#A38F72", tc: "#86735A", su: "#E8DCC4", sul: "court", bl: .46 },
    z: [{ p: "croupion", a: { up: "#957652", rp: "#BB8550", wc: "#8A6E50", tc: "#8A6E50" }, b: { up: "#8C8763", rp: "#8F8A66", wc: "#827D5C", tc: "#827D5C" }, t: ["brun chaud, roussâtre", "olive, sans roux"] },
      { p: "aile", a: { pp: .3 }, b: { pp: .74, ppt: 1 }, t: ["pointes courtes", "longues, bouts pâles"] },
      { p: "voix", t: ["« tiri-tiri… tchè »", "plein d'imitations"] }],
    m: "Effarvatte : rousse comme les roseaux secs. Verderolle : vert-olive comme les orties." },
  "Larus argentatus|Larus michahellis": { g: "gull", x: "les pattes",
    b: { hd: "#F8F6F1", up: "#A9B4C1", un: "#F8F6F1", wc: "#A9B4C1", tc: "#F8F6F1", pk: "#18191C", bc: "#F0C93A", gs: "#D8312B", ey: "#E8D8A0" },
    z: [{ p: "pattes", a: { lc: "#E7AFA6" }, b: { lc: "#EFCB37" }, t: ["roses", "jaunes"] },
      { p: "dos", a: { up: "#B3BECA", wc: "#B3BECA" }, b: { up: "#8D99A8", wc: "#8D99A8" }, t: ["gris pâle", "gris un peu plus foncé"] },
      { p: "tete", l: "Tête en hiver", a: { st: "fortes", er: "#F0B32E" }, b: { er: "#D8312B" }, t: ["striée, cercle jaune", "blanche, cercle rouge"] }],
    m: "Argenté : pattes roses comme des chaussettes de bébé. Leucophée : pattes jaunes comme le soleil du Midi." },
  "Calidris alpina|Calidris ferruginea": { g: "wader", x: "la courbure du bec",
    b: { hd: "#A39C90", up: "#8E877B", un: "#F8F6F1", th: "#F8F6F1", wc: "#7F786C", tc: "#6E675C", bc: "#18191C", lc: "#2B2B2B", su: "#E9E6E0", sul: "court", ll: .6 },
    z: [{ p: "bec", a: { bs: "pointe", bl: .8 }, b: { bs: "courbe", bl: .95 }, t: ["courbé au bout", "courbé tout du long"] },
      { p: "croupion", l: "Croupion en vol", a: { rp: "#F8F6F1", rpp: "cotes" }, b: { rp: "#F8F6F1" }, t: ["blanc sur les côtés", "tout blanc"] },
      { p: "dessous", l: "En été", a: { bp: "#18191C", br: "#E9E4DA" }, b: { br: "#B4472E", be: "#B4472E", th: "#B85A3E", fl: "#B4472E", uc: "#E9E4DA" }, t: ["plaque noire au ventre", "rouge brique"] }],
    m: "Cocorli : bec en courbe continue et croupion tout blanc. Variable : seul le bout du bec plie." },
  "Tringa totanus|Tringa erythropus": { g: "wader", x: "le rouge du bec",
    b: { hd: "#8E8473", up: "#8B8170", un: "#F2EFE9", th: "#F2EFE9", wc: "#857B6B", tc: "#E9E6E0", bc: "#18191C", lc: "#D9452F", ll: .85 },
    z: [{ p: "bec", a: { bl: .78, bb: "#D8312B", bbx: .45 }, b: { bl: 1.02, bd: .55, lo: "#D8312B", lox: .45 }, t: ["rouge dessus et dessous", "plus long, rouge dessous"] },
      { p: "vol", a: { tew: 1 }, b: {}, t: ["large bord blanc", "aile uniforme"] },
      { p: "voix", t: ["« tiu-hu-hu »", "« tchou-ït »"] }],
    m: "Gambette : rouge à lèvres en haut et en bas. Arlequin : seulement la lèvre du bas." },
  "Charadrius hiaticula|Charadrius dubius": { g: "plover", x: "le tour de l'œil", f: 1,
    b: { hd: "#A88F6C", up: "#A88F6C", un: "#F8F6F1", th: "#F8F6F1", wc: "#9A8262", tc: "#8B7558", es: "#18191C", fr2: "#F8F6F1", lc: "#E8913A", bc: "#18191C" },
    z: [{ p: "bec", a: { bc: "#EE8A2E", bt: "#18191C", btx: .45 }, b: {}, t: ["orange, pointe noire", "tout noir"] },
      { p: "tete", l: "Œil", a: {}, b: { er: "#F5D531" }, t: ["pas de cercle jaune", "cercle jaune vif"] },
      { p: "vol", a: { wbar: 1 }, b: {}, t: ["barre blanche", "pas de barre"] }],
    m: "Le Petit Gravelot porte des lunettes jaunes. Le Grand a un bec orange comme une carotte." },
  "Sterna hirundo|Sterna paradisaea": { g: "tern", x: "le bout du bec",
    b: { hd: "#F8F6F1", cr: "#18191C", crx: "calotte", up: "#C3CCD6", un: "#EEF0F2", wc: "#BFC8D3", tc: "#F8F6F1", lc: "#D8312B" },
    z: [{ p: "bec", a: { bc: "#E2512E", bt: "#18191C", btx: .3 }, b: { bc: "#C51F29" }, t: ["rouge-orangé, pointe noire", "rouge sang, sans noir"] },
      { p: "pattes", a: { ll: .62 }, b: { ll: .32 }, t: ["assez longues", "très courtes"] },
      { p: "vol", l: "Dessous de l'aile", zm: "main", a: { vw: "dessous", tr: "internes" }, b: { vw: "dessous", tr: "toutes", dte: 1 }, t: ["seules les internes claires", "toutes claires, liseré noir"] }],
    m: "Pierregarin : le bout du bec trempé dans l'encre. Arctique : bec tout rouge et pattes courtes, rentrées à cause du froid." },
  "Accipiter nisus|Accipiter gentilis": { g: "hawk", x: "le sourcil",
    b: { hd: "#6F7680", cr: "#59606A", crx: "calotte", up: "#6F7680", un: "#F1EBE0", wc: "#677079", tc: "#6E7580", ey: "#F0B52E", bc: "#2A2A2A", ce: "#E9C53A", lc: "#EBC43A", cc: "#18191C" },
    z: [{ p: "tete", l: "Sourcil", a: { su: "#C9C4BA", sul: "court" }, b: { su: "#FAF8F3", sul: "long", es: "#3B3F45" }, t: ["discret", "blanc, très marqué"] },
      { p: "queue", a: { ts: "carree", tl: 1, tb: 4 }, b: { ts: "arrondie", tl: .74, tb: 4 }, t: ["longue, bout carré", "plus courte, bout arrondi"] },
      { p: "taille", a: { cm: 33 }, b: { cm: 55 }, t: ["tourterelle à pigeon", "corneille à buse"] }],
    m: "Épervier = épingle : petit et fin. Autour = armoire : costaud, avec un gros sourcil blanc." },
  "Falco tinnunculus|Falco naumanni": { g: "falcon", x: "le dos",
    b: { hd: "#8C97A6", cr: "#8C97A6", up: "#BE6538", un: "#F1DCC0", wc: "#BE6538", tc: "#8C97A6", ey: "#2A1E16", bc: "#47515E", ce: "#E9C53A", lc: "#EFC23A", cc: "#18191C" },
    z: [{ p: "dos", a: { dp: "taches", dpc: "#2A1E16" }, b: { up: "#C76B3B", wc: "#C76B3B" }, t: ["roux tacheté de noir", "roux uni"] },
      { p: "tete", l: "Moustache", a: { ml: "#22262B" }, b: { hd: "#8297B3", cr: "#8297B3" }, t: ["fine moustache noire", "sans moustache"] },
      { p: "pattes", l: "Griffes", zm: "pied", a: {}, b: { cc: "#ECE3D0" }, t: ["noires", "claires"] }],
    m: "La crécerellette est coquette : dos sans une tache et vernis à ongles clair." },
  "Anthus pratensis|Anthus trivialis": { g: "pass", x: "les flancs",
    b: { hd: "#8B7E5C", up: "#8B7E5C", un: "#F1EADB", th: "#F3EEE3", wc: "#7C6F52", we: "#B5A47E", tc: "#6F6349", su: "#E7DCC2", sul: "court", lc: "#DDB394", leg: "ground", skc: "#4E4330" },
    z: [{ p: "dessous", l: "Flancs", a: { sk: "fortes", ska: "flancs" }, b: { sk: "fines", ska: "flancs", br: "#EAD3A8" }, t: ["fortement striés", "finement striés, poitrine chamois"] },
      { p: "pattes", l: "Ongle arrière", zm: "pied", a: { hcl: "long" }, b: { hcl: "court" }, t: ["long, peu courbé", "court et courbé"] },
      { p: "voix", t: ["« ist-ist-ist » fin", "« psiih » rauque"] }],
    m: "Farlouse des prés : un long ongle pour marcher dans l'herbe. Pipit des arbres : un ongle court et crochu pour se percher." },
  "Alauda arvensis|Lullula arborea": { g: "lark", x: "la tête",
    b: { hd: "#9C8766", cr: "#8E7A5A", crx: "calotte", up: "#9A8565", un: "#F1E8D6", wc: "#8E7A5C", we: "#C6B28C", tc: "#6A5A44", su: "#E8DDC4", sul: "court" },
    z: [{ p: "tete", a: { hp: "petite" }, b: { su: "#F6EEDB", sul: "nuque" }, t: ["petite huppe", "sourcils qui se rejoignent"] },
      { p: "queue", a: { tl: .95, ow: 1, ts: "echancree" }, b: { tl: .55, wcn: 1, ts: "carree" }, t: ["longue, bords blancs", "courte, coins blancs"] },
      { p: "aile", l: "Poignet", a: {}, b: { pcm: 1 }, t: ["sans marque", "marque noire et blanche"] }],
    m: "Lulu : un bandeau clair autour de la tête et une petite queue. Des champs : une petite huppe et une longue queue bordée de blanc." },
  "Apus apus|Hirundo rustica": { g: "swallow", x: "le dessous",
    b: { hd: "#2C2A2A", up: "#2C2A2A", un: "#2C2A2A", wc: "#2A2828", tc: "#2A2828" },
    z: [{ p: "dessous", a: { th: "#CFCAC2", br: "#2E2B2A", be: "#2E2B2A", fl: "#2E2B2A", uc: "#2E2B2A" }, b: { th: "#B03A2C", bnb: "#20304A", bnz: "complet", br: "#F3EADB", be: "#F3EADB", fl: "#F0E5D3", uc: "#F3EADB", wc: "#1F2B44" }, t: ["tout sombre, gorge pâle", "crème, gorge rouge"] },
      { p: "queue", a: { ts: "echancree", tl: .5 }, b: { ts: "filets", tl: .62, tc: "#1F2B44", up: "#1F2B44" }, t: ["courte, peu fourchue", "longs filets"] },
      { p: "vol", a: { ws: "faux" }, b: { ws: "pointue", wc: "#1F2B44" }, t: ["ailes en faux, raides", "plus courtes, souples"] }],
    m: "Martinet : tout en noir, ailes en faux, il ne se pose jamais. Hirondelle : cravate rouge et queue en ciseaux." },
  "Circus cyaneus|Circus pygargus": { g: "hawk", x: "le bout des ailes",
    b: { hd: "#C9CED6", up: "#B8BFC9", un: "#F8F6F1", wc: "#BCC3CC", tc: "#B8BFC9" },
    z: [{ p: "vol", l: "Aile du mâle", a: { ws: "large", fg: 5, wc: "#CDD2D9", tip: "#18191C", tipx: .26 }, b: { ws: "fine", fg: 4, wc: "#A6AFBA", tip: "#18191C", tipx: .32, band: 1 }, t: ["bout noir, 5 doigts", "bande noire, 4 doigts"] },
      { p: "croupion", l: "Croupion (femelle)", a: { up: "#8A6E50", wc: "#8A6E50", tc: "#8F7457", rp: "#F8F6F1", rpp: "large" }, b: { up: "#8A6E50", wc: "#8A6E50", tc: "#8F7457", rp: "#F8F6F1", rpp: "etroit" }, t: ["blanc, large", "blanc, étroit"] }],
    m: "Cendré : une bande noire sur l'aile et des ailes fines. Saint-Martin : juste le bout des doigts trempés dans l'encre." },
  "Buteo buteo|Pernis apivorus": { g: "hawk", x: "la queue", f: 1,
    b: { hd: "#6E5440", up: "#6B5240", un: "#E9DCC8", wc: "#6B5240", tc: "#8A6E58", ey: "#7A4A26", bc: "#2A2A2A", ce: "#E6C24A" },
    z: [{ p: "tete", a: { hs: "large" }, b: { hs: "pigeon", hd: "#7E8590", ey: "#E9B52C" }, t: ["tête large, cou court", "petite tête de pigeon"] },
      { p: "queue", a: { ts: "arrondie", fb: 1, tbd: "#3B2B20" }, b: { ts: "arrondie", tc: "#9C8C7C", bands: 1, tbd: "#2E2622" }, t: ["fines barres, bande au bout", "2 bandes en bas, 1 au bout"] },
      { p: "allure", l: "Vol plané", t: ["ailes en V léger", "ailes à plat"] }],
    m: "Bondrée : tête de pigeon et queue « 2 + 1 ». Buse : grosse tête et queue finement rayée." },
  "Turdus philomelos|Turdus iliacus": { g: "thrush", x: "le sourcil",
    b: { hd: "#8A6B4A", up: "#8A6B4A", un: "#F5EFE3", th: "#F7F2E8", br: "#F2E2C4", wc: "#7E6142", tc: "#7A5E40", sk: "taches", skc: "#3E2E20", ska: "tout", bc: "#4B3C2C", lc: "#D9B2A0" },
    z: [{ p: "tete", l: "Sourcil", a: {}, b: { su: "#F2E3C0", sul: "long" }, t: ["discret ou absent", "crème, très marqué"] },
      { p: "dessous", l: "Flancs", a: { fl: "#EBD3A8" }, b: { fl: "#C6492A" }, t: ["chamois", "roux vif"] }],
    m: "Mauvis : un gros sourcil et des flancs rouges, comme si elle avait rougi. Musicienne : un visage tout simple." },
  "Hippolais polyglotta|Hippolais icterina": { g: "pass", x: "le bout de l'aile",
    b: { hd: "#8E9150", up: "#8A8D4E", un: "#F0DE70", th: "#F2E27E", wc: "#808346", we: "#A9AC6A", tc: "#7B7E44", su: "#F0E08A", sul: "court", bl: .44, bd: .85 },
    z: [{ p: "aile", a: { pp: .26 }, b: { pp: .78, pn: 1 }, t: ["courte, uniforme", "longue, panneau clair"] },
      { p: "pattes", a: { lc: "#9C7E62" }, b: { lc: "#8B98AE" }, t: ["brunâtres", "gris-bleu"] }],
    m: "Ictérine : de longues ailes pour voyager loin, et des pattes bleutées. Polyglotte : petites ailes, elle reste bavarder chez nous." },
  "Motacilla alba|Motacilla cinerea": { g: "pass", x: "le dessous",
    b: { hd: "#8D939B", up: "#8D939B", un: "#F8F6F1", th: "#F8F6F1", wc: "#3A3D42", we: "#E8E8E8", tc: "#2A2C30", su: "#F8F6F1", sul: "long" },
    z: [{ p: "dessous", a: { fl: "#E9EAEC" }, b: { br: "#F3D33A", be: "#F2D33B", uc: "#F5CF1E", fl: "#EED649" }, t: ["blanc", "jaune vif"] },
      { p: "croupion", a: { rp: "#5F636A" }, b: { rp: "#C3CC48" }, t: ["gris à noir", "jaune-vert"] },
      { p: "queue", a: { tl: .85, ow: 1 }, b: { tl: 1.15, ow: 1 }, t: ["longue", "très longue"] }],
    m: "Des ruisseaux : le ventre jaune comme un canard en plastique au bord de l'eau. Grise : en noir et blanc, comme un vieux film." },
  "Chloris chloris|Serinus serinus": { g: "finch", x: "le bec",
    b: { hd: "#8A9150", up: "#7D8847", un: "#C9CE6C", wc: "#6E7A40", tc: "#5F6A38", bc: "#B9A898" },
    z: [{ p: "bec", a: { bl: .52, bd: 1.3, bc: "#D9C4AC" }, b: { bl: .25, bd: .68, bc: "#9A8D80" }, t: ["gros bec clair", "bec minuscule"] },
      { p: "croupion", a: { rp: "#9BA650" }, b: { up: "#A5A35E", rp: "#F3D63B", dp: "strie", dpc: "#5E5A34" }, t: ["vert olive", "jaune vif"] },
      { p: "aile", a: { pyw: 1 }, b: { wb: 2, wbc: "#E2DB97" }, t: ["bord jaune vif", "deux barres pâles"] }],
    m: "Serin : tout petit, strié, croupion jaune. Verdier : gros bec de casse-noisette et du jaune au bord des ailes." },
  "Phoenicurus ochruros|Phoenicurus phoenicurus": { g: "pass", x: "la tête du mâle",
    b: { hd: "#3B3E45", up: "#4A4D55", un: "#5C5F66", wc: "#33363C", we: "#55585E", tc: "#D0622E" },
    z: [{ p: "tete", l: "Tête du mâle", a: { hd: "#34373E", th: "#18191B", bib: "grande" }, b: { hd: "#8A929E", fr2: "#F8F6F1", th: "#151515", bib: "grande", neck: "#E06C2A" }, t: ["face toute noire", "front blanc, gorge noire"] },
      { p: "dessous", l: "Poitrine du mâle", a: { th: "#18191B", br: "#3A3D44", be: "#6A6C72", fl: "#4A4D54", uc: "#D0622E" }, b: { th: "#151515", br: "#E36F2A", be: "#F1C79B", fl: "#E8894A", uc: "#F1C79B" }, t: ["gris-noir", "orange vif"] },
      { p: "aile", a: { wp: 1 }, b: { wc: "#8A929E", we: "#9AA1AB" }, t: ["tache blanche", "aile unie"] },
      { p: "milieu", t: ["bâtiments, rochers", "vieux arbres, vergers"] }],
    m: "Front blanc : un bandeau de tennisman sur un maillot orange. Noir : un ramoneur gris-noir, avec une tache blanche sur l'aile." },
  "Chroicocephalus ridibundus|Ichthyaetus melanocephalus": { g: "gull", x: "le bout des ailes",
    b: { hd: "#F8F6F1", up: "#C3CCD6", un: "#F8F6F1", wc: "#C3CCD6", tc: "#F8F6F1", gs: null, lc: "#B4262D", bc: "#9B2A30", bs: "fin", bl: .62, bd: .7 },
    z: [{ p: "vol", l: "Bout des ailes (adulte)", zm: "main", a: { lwedge: 1, tip: "#18191C", rid: 1 }, b: { wc: "#DCE3EA" }, t: ["noir, triangle blanc devant", "tout blanc"] },
      { p: "tete", l: "Capuchon (été)", a: { cr: "#5A3A2A", crx: "face" }, b: { cr: "#121212", crx: "capuchon" }, t: ["brun, sur la face", "noir, jusqu'à la nuque"] },
      { p: "bec", a: { bd: .62 }, b: { bs: "fort", bd: .95, bc: "#D8312B", bt: "#2A2A2A", btx: .12 }, t: ["fin, rouge sombre", "épais, rouge vif"] }],
    m: "Mélanocéphale : des ailes toutes blanches comme une mariée. Rieuse : des pointes noires et une cagoule brune qui ne couvre que la face." },
  "Podiceps nigricollis|Podiceps auritus": { g: "grebe", x: "la tête", f: 1,
    b: { hd: "#151515", up: "#2A2A2A", un: "#F2EDE6", bc: "#1E1E1E", ey: "#D8312B" },
    z: [{ p: "tete", l: "Tête en été", a: { hp: "eventail", hpc: "#E3A83A", neck: "#141414", fh: "abrupt" }, b: { hp: "touffes", hpc: "#E9B23C", neck: "#B5452A" }, t: ["éventail doré, cou noir", "touffes dorées, cou roux"] },
      { p: "tete", l: "Tête en hiver", a: { hd: "#8C9096", cr: "#1D1D1D", crx: "sous_oeil", th: "#D9DADC", fh: "abrupt" }, b: { hd: "#F8F6F1", cr: "#1D1D1D", crx: "net", th: "#F8F6F1" }, t: ["joues grises", "joues blanches nettes"] },
      { p: "bec", a: { bs: "retrousse", bd: .6 }, b: { bd: .7, bt: "#E2DDD2", btx: .2 }, t: ["fin, retroussé", "droit, pointe claire"] }],
    m: "Grèbe à cou noir : bec retroussé en trompette et front abrupt. Esclavon : bec droit et cornes dorées à l'horizontale." },
  "Aythya marila|Aythya fuligula": { g: "duck", x: "le dos",
    b: { hd: "#1C2622", up: "#1B1B1D", un: "#F8F6F1", wc: "#2A2A2C", tc: "#1F1F21", bc: "#7E91A8", bt: "#18191C", btx: .14, ey: "#F2C53A" },
    z: [{ p: "dos", l: "Dos du mâle", a: { up: "#B8BBC0", wc: "#B8BBC0", dp: "vermicule", dpc: "#5A5E66" }, b: {}, t: ["gris vermiculé", "noir"] },
      { p: "tete", l: "Tête du mâle", a: {}, b: { hd: "#23203A", hp: "tombante" }, t: ["ronde, sans huppe", "petite huppe tombante"] },
      { p: "tete", l: "Femelle", a: { hd: "#5E4A3A", blz: "large" }, b: { hd: "#4A3A2E", blz: "petite" }, t: ["large tache blanche", "peu ou pas de blanc"] }],
    m: "Morillon : une petite queue de cheval derrière la tête et le dos noir. Milouinan : dos gris et tête toute ronde." },
  "Gallinago gallinago|Lymnocryptes minimus": { g: "wader", x: "la longueur du bec",
    b: { hd: "#A5845C", up: "#6E5238", un: "#F1EADB", wc: "#6A4E36", tc: "#B8743E", bc: "#6D5A48", bt: "#2A2420", btx: .3, cr: "#3A2A1E", crx: "calotte", su: "#E9D7A8", sul: "long", es: "#3A2A1E", ll: .45, lc: "#A3A07A" },
    z: [{ p: "bec", a: { bl: 2.2 }, b: { bl: 1.25 }, t: ["très long", "nettement plus court"] },
      { p: "tete", l: "Calotte", a: { cs: "#E6D3A3" }, b: { su2: 1 }, t: ["raie claire au milieu", "pas de raie, double sourcil"] },
      { p: "allure", l: "Envol", t: ["en zigzag, cri « tchèrrch »", "silencieux, se repose vite"] }],
    m: "Des marais : grand bec et une raie au milieu du crâne. Sourde : bec plus court, elle « n'entend pas » ton approche et décolle au dernier moment." },
  "Limosa limosa|Limosa lapponica": { g: "wader", x: "la forme du bec",
    b: { hd: "#A39888", up: "#8E8576", un: "#F0ECE5", wc: "#7F776A", tc: "#7F776A", bc: "#2A2420", bb: "#E39B6E", bbx: .5, ll: 1.0, lc: "#2E2E2E" },
    z: [{ p: "bec", a: { bl: 2.0 }, b: { bs: "retrousse", bl: 1.8 }, t: ["long et droit", "un peu retroussé"] },
      { p: "vol", a: { wbar: 2 }, b: {}, t: ["large barre blanche", "pas de barre"] },
      { p: "queue", a: { tc: "#1C1C1C", wb2: 1 }, b: { tc: "#E6E1D8", fb: 1, fbc: "#8B7E6C" }, t: ["noire, base blanche", "barrée"] }],
    m: "Queue noire : en vol, un drapeau blanc et noir. Rousse : bec un peu retroussé, le nez en l'air." },
  "Numenius arquata|Numenius phaeopus": { g: "wader", x: "la forme du bec",
    b: { hd: "#A38E6E", up: "#8C7558", un: "#F1E9DA", wc: "#836C50", tc: "#C9BBA4", bc: "#2E2620", bb: "#C98A6A", bbx: .28, ll: .9, lc: "#7D8A9A" },
    z: [{ p: "bec", a: { bs: "courbe", bl: 2.6 }, b: { bs: "coude", bl: 1.5 }, t: ["très long, arqué", "plus court, coudé au bout"] },
      { p: "tete", a: {}, b: { cr: "#3A2C20", crx: "calotte", cs: "#E7DAC0", su: "#E7DAC0", sul: "long" }, t: ["tête unie", "calotte rayée"] },
      { p: "voix", t: ["« cour-li » montant", "trille d'environ 7 notes"] }],
    m: "Corlieu : un chapeau rayé et un bec coudé. Cendré : le grand bec en faucille." },
  "Tringa ochropus|Tringa glareola": { g: "wader", x: "le dos",
    b: { hd: "#5A564E", up: "#4A463F", un: "#F8F6F1", wc: "#45413A", tc: "#F8F6F1", bc: "#2A2620", lc: "#8C9A7A", ll: .7 },
    z: [{ p: "dos", a: { up: "#3E3A33", wc: "#3E3A33", dp: "pointille", dpc: "#E3DCCB" }, b: { up: "#7A6850", wc: "#7A6850", dp: "tachete", dpc: "#F2EBDD" }, t: ["très sombre, fins points", "brun, gros points clairs"] },
      { p: "tete", l: "Sourcil", a: { su: "#F8F6F1", sul: "oeil", er: "#F8F6F1" }, b: { su: "#F8F6F1", sul: "long" }, t: ["seulement devant l'œil", "long, dépasse l'œil"] },
      { p: "vol", l: "Dessous de l'aile", a: { vw: "dessous", ul: "#2A2622" }, b: { vw: "dessous", ul: "#DAD3C6" }, t: ["noir", "pâle"] }],
    m: "Culblanc : costume sombre et lunettes blanches devant l'œil. Sylvain : veste brune à pois et long sourcil." },
  "Phalacrocorax carbo|Gulosus aristotelis": { g: "cormorant", x: "l'épaisseur du bec",
    b: { hd: "#1C1F1D", up: "#2A2B26", un: "#1C1F1D", wc: "#2E2F28", tc: "#1A1A1A", ey: "#3C8A5A", bc: "#3A342E" },
    z: [{ p: "bec", a: { bd: 1.05, bc: "#5A4E44", gs2: "#E5B84A" }, b: { bd: .58, bc: "#1E1E1E", gape: "#F2D23A" }, t: ["épais", "fin, base jaune vif"] },
      { p: "tete", a: { fh: "plat", wfc: 1 }, b: { fh: "abrupt", hp: "huppe_front", gape: "#F2D23A" }, t: ["front plat, joues blanches", "front abrupt, sans blanc"] },
      { p: "milieu", t: ["côtes et eaux douces", "uniquement en mer, rochers"] }],
    m: "Huppé : un bec fin comme une aiguille et le front relevé. Grand : gros bec et menton blanc, comme une barbe." },
  "Egretta garzetta|Ardea ibis": { g: "heron", x: "le bec",
    b: { hd: "#F8F6F1", up: "#F8F6F1", un: "#F8F6F1", wc: "#F3F1EC", tc: "#F8F6F1", ey: "#F0D24A" },
    z: [{ p: "bec", a: { bl: 1.25, bd: .7, bc: "#18191C" }, b: { bl: .62, bd: 1.0, bc: "#F2C53A" }, t: ["noir, long et fin", "jaune, court et épais"] },
      { p: "pattes", a: { lc: "#18191C", tc2: "#F2D23A", ll: 1.0 }, b: { lc: "#5E5A38", ll: .72 }, t: ["noires, doigts jaunes", "sombres à jaunâtres"] },
      { p: "allure", t: ["élancée, long cou", "trapue, cou rentré"] }],
    m: "Garzette : des chaussons jaunes au bout des pattes noires. Garde-bœufs : bec jaune et court, cou rentré dans les épaules." },
  "Dendrocopos major|Dryobates minor": { g: "woodpecker", x: "le dos",
    b: { hd: "#F8F6F1", up: "#141414", un: "#F2EEE6", wc: "#141414", tc: "#141414", dpc: "#F8F6F1" },
    z: [{ p: "dos", a: { dp: "ovales" }, b: { dp: "barre" }, t: ["grandes taches blanches", "barré de blanc"] },
      { p: "dessous", l: "Sous la queue", zm: "cloaque", a: { uc: "#D8312B" }, b: { uc: "#EFE9DE", sk: "fines", ska: "flancs", skc: "#3A3A3A" }, t: ["rouge vif", "sans rouge"] },
      { p: "taille", a: { cm: 23 }, b: { cm: 15 }, t: ["d'un merle", "d'un moineau"] }],
    m: "Épeiche : deux bretelles blanches et une culotte rouge. Épeichette : un petit dos zébré comme une échelle." },
  "Parus major|Periparus ater": { g: "tit", x: "la nuque",
    b: { hd: "#141414", cr: "#141414", crx: "calotte", up: "#6E7F5A", un: "#F0D43A", wc: "#5E6A72", we: "#9AA4AA", tc: "#4E5860", ck: "#F8F6F1", ckz: "grand", th: "#141414", bib: "grande" },
    z: [{ p: "tete", l: "Nuque", a: {}, b: { np: "#F8F6F1" }, t: ["noire", "tache blanche"] },
      { p: "dessous", a: { th: "#141414", br: "#F0D43A", be: "#F2DD5A", tie: "#141414" }, b: { th: "#141414", br: "#E9D6B8", be: "#EEE2CC", fl: "#E3CDA8" }, t: ["jaune, cravate noire", "chamois, sans jaune"] },
      { p: "aile", a: { wb: 1 }, b: { wb: 2 }, t: ["une barre blanche", "deux barres blanches"] }],
    m: "Mésange noire : un projecteur blanc sur la nuque et deux barres à l'aile. Charbonnière : cravate noire sur un ventre jaune." },
  "Corvus corax|Corvus corone": { g: "corvid", x: "la queue en vol",
    b: { hd: "#18191C", up: "#18191C", un: "#22242A", wc: "#1C1E23", tc: "#1C1E23", bc: "#141517", lc: "#151618", ey: "#2A2622" },
    z: [{ p: "queue", l: "Queue en vol", a: { ts: "losange" }, b: { ts: "arrondie", tl: .8 }, t: ["en losange", "carrée à arrondie"] },
      { p: "bec", a: { bl: .95, bd: 1.5, hk: 1 }, b: { bl: .78, bd: 1.2 }, t: ["massif, gorge hérissée", "plus fin"] },
      { p: "taille", a: { cm: 64 }, b: { cm: 47 }, t: ["comme une buse", "nettement plus petite"] },
      { p: "voix", t: ["« krok » grave", "« kraa » rauque"] }],
    m: "Grand corbeau : queue en losange comme un cerf-volant et « krok » grave. Corneille : queue en éventail et « kraa »." },
  "Sylvia atricapilla|Sylvia borin": { g: "pass", x: "la calotte",
    b: { hd: "#8E8A80", up: "#8A8478", un: "#E9E6DE", th: "#EDEAE2", wc: "#827C70", tc: "#7A7468", bl: .4 },
    z: [{ p: "tete", l: "Calotte", a: { cr: "#141414", crx: "haut" }, b: { hd: "#8E8778" }, t: ["noire (♂) ou rousse (♀)", "pas de calotte"] },
      { p: "bec", a: { bl: .4, bd: .78 }, b: { bl: .3, bd: 1.0 }, t: ["fin", "court et épais"] },
      { p: "voix", t: ["finit en strophe flûtée", "long gazouillis sans finale"] }],
    m: "Tête noire : elle porte un béret, noir pour monsieur, roux pour madame. Des jardins : tête nue et l'air doux." },
  "Emberiza citrinella|Emberiza cirlus": { g: "finch", x: "la tête du mâle",
    b: { hd: "#EED33A", cr: "#E5C934", crx: "calotte", up: "#9A6E48", un: "#F0D43A", wc: "#86603E", we: "#B98A5E", tc: "#6E5240", bl: .36, bd: 1.0, bc: "#7C7A86", dp: "strie", dpc: "#4A3624" },
    z: [{ p: "tete", l: "Tête du mâle", a: {}, b: { es: "#141414", th: "#141414", bib: "petite", cr: "#6E7448", ck: "#EED33A" }, t: ["jaune vif", "gorge et trait de l'œil noirs"] },
      { p: "croupion", a: { rp: "#B9653A" }, b: { rp: "#8E8A62" }, t: ["roux", "gris-olive"] },
      { p: "voix", t: ["« ti-ti-ti-tiiii »", "trille sec et monotone"] }],
    m: "Zizi : un masque de Zorro noir sur l'œil et la gorge. Jaune : tête toute jaune et croupion roux comme la rouille." },
  /* --- Les grands classiques du débutant et du littoral --- */
  "Passer domesticus|Passer montanus": { g: "finch", x: "la joue", f: 1,
    b: { hd: "#9A8C7E", cr: "#8A7058", crx: "calotte", ck: "#D9D3C8", up: "#8A6A4A", un: "#E4DDD0", wc: "#7A5A3C", we: "#C9A57E", tc: "#6C5640", bl: .38, bd: 1.05, bc: "#2A2522", th: "#1A1A1A", bib: "petite", dp: "strie", dpc: "#3A2A1E" },
    z: [{ p: "tete", l: "Calotte", a: { cr: "#8C9198" }, b: { cr: "#8B4E2E" }, t: ["grise (mâle)", "brun chocolat"] },
      { p: "tete", l: "Joue", a: { ck: "#C9C7C0" }, b: { ck: "#F8F6F1", ckz: "grand", mk: "joue" }, t: ["grise, sans tache", "blanche, tache noire"] },
      { p: "milieu", t: ["villes et villages", "campagne, haies"] }],
    m: "Friquet : une joue blanche avec un grain de beauté noir et une calotte chocolat. Domestique : calotte grise chez le mâle." },
  "Fringilla coelebs|Fringilla montifringilla": { g: "finch", x: "le croupion",
    b: { hd: "#7E8FA6", up: "#7A5A44", un: "#D9A88C", wc: "#2A2A2A", we: "#E8E4DA", tc: "#3A3A3A", bl: .36, bd: .95, bc: "#7F8A99" },
    z: [{ p: "croupion", a: { rp: "#8DA05A" }, b: { up: "#2A2420", rp: "#F8F6F1" }, t: ["vert-olive", "blanc"] },
      { p: "dessous", l: "Poitrine", a: { th: "#C98C70", br: "#C98C70", be: "#E8D6C8", fl: "#D9A88C" }, b: { th: "#E8913E", br: "#E8913E", be: "#F8F6F1", fl: "#E6B888", sk: "rondes", ska: "flancs", skc: "#2A2420" }, t: ["rose-saumon", "orange, ventre blanc"] },
      { p: "aile", a: { wb: 2, shc: "#F4F2EC" }, b: { wb: 2, wbc: "#EDB067", shc: "#E8913E" }, t: ["épaule blanche", "épaule orange"] }],
    m: "Pinson du Nord : orange comme un coucher de soleil sur la neige, et un croupion blanc. Pinson des arbres : poitrine rose saumon." },
  "Streptopelia decaocto|Streptopelia turtur": { g: "pigeon", x: "le cou",
    b: { hd: "#CDBFAF", up: "#C3B3A0", un: "#DCCFC2", wc: "#BFAF9B", tc: "#B9A994", bc: "#2A2522", lc: "#C98A86", ey: "#A3262A" },
    z: [{ p: "tete", l: "Cou", a: { col: "demi" }, b: { col: "rayures" }, t: ["fin demi-collier noir", "plaque rayée noir et blanc"] },
      { p: "dos", a: { up: "#C7B8A5", wc: "#C7B8A5" }, b: { up: "#B5764A", wc: "#B5764A", dp: "ecailles", dpc: "#2A2420" }, t: ["beige uni", "écailles rousses et noires"] },
      { p: "voix", t: ["« dou-dou-dou » en 3 temps", "« turrr turrr » ronronnant"] }],
    m: "Turque : un fin collier noir, comme un ras-de-cou. Des bois : un code-barres sur le cou et un dos en écailles de tortue." },
  "Columba palumbus|Columba oenas": { g: "pigeon", x: "le cou",
    b: { hd: "#8C93A0", up: "#8E95A2", un: "#B9A9B6", wc: "#8E95A2", tc: "#7C8390", bc: "#E9C14A", lc: "#C9707A", ey: "#E9D9A6" },
    z: [{ p: "tete", l: "Cou", a: { col: "blanc" }, b: { col: "vert", ey: "#2A2420" }, t: ["tache blanche", "reflet vert, sans blanc"] },
      { p: "vol", a: { cres: 1 }, b: { tip: "#3A3E46", tipx: .34, dte: 1 }, t: ["croissant blanc", "pas de blanc, bord sombre"] }],
    m: "Ramier : une écharpe blanche au cou et une barre blanche sur l'aile en vol. Colombin : pas un gramme de blanc." },
  "Corvus corone|Coloeus monedula": { g: "corvid", x: "la nuque et l'œil",
    b: { hd: "#18191C", up: "#18191C", un: "#22242A", wc: "#1C1E23", tc: "#1C1E23", bc: "#141517", lc: "#151618", ey: "#2A2622" },
    z: [{ p: "tete", l: "Nuque et œil", a: {}, b: { np2: "#9BA0A8", ey: "#E6E9EE", bl: .42 }, t: ["toute noire, œil sombre", "nuque grise, œil blanc"] },
      { p: "taille", a: { cm: 47 }, b: { cm: 33 }, t: ["grande", "d'un pigeon"] },
      { p: "voix", t: ["« kraa » rauque", "« tchak » sec"] }],
    m: "Choucas : une capuche grise et des yeux blancs de fantôme. Corneille : tout en noir, l'œil sombre." },
  "Larus argentatus|Larus fuscus": { g: "gull", x: "le dos",
    b: { hd: "#F8F6F1", up: "#A9B4C1", un: "#F8F6F1", wc: "#A9B4C1", tc: "#F8F6F1", pk: "#18191C", bc: "#F0C93A", gs: "#D8312B", ey: "#E8D8A0" },
    z: [{ p: "dos", a: { up: "#AFBAC6", wc: "#AFBAC6" }, b: { up: "#4D545E", wc: "#4D545E" }, t: ["gris pâle", "gris ardoise foncé"] },
      { p: "pattes", a: { lc: "#E7AFA6" }, b: { lc: "#F0CB37" }, t: ["roses", "jaunes"] }],
    m: "Brun : un manteau d'ardoise et des bottes jaunes. Argenté : manteau gris clair et pieds roses." },
  "Chroicocephalus ridibundus|Larus canus": { g: "gull", x: "la couleur du bec",
    b: { hd: "#F8F6F1", up: "#B6C0CC", un: "#F8F6F1", wc: "#B6C0CC", tc: "#F8F6F1", pk: "#18191C", gs: null, ey: "#2A2420" },
    z: [{ p: "bec", a: { bs: "fin", bl: .62, bd: .62, bc: "#9B2A30" }, b: { bl: .62, bd: .8, bc: "#E1D04C", bnd: 1 }, t: ["fin, rouge sombre", "jaune-vert, plus fort"] },
      { p: "pattes", a: { lc: "#A8262E" }, b: { lc: "#D8CB4A" }, t: ["rouge sombre", "jaune-vert"] },
      { p: "tete", l: "Tête en hiver", a: { mk: "tache" }, b: { st: "douces" }, t: ["tache noire derrière l'œil", "tachetée, regard doux"] }],
    m: "Goéland cendré : bec et pattes vert-jaune, un air doux de pigeon. Mouette rieuse : bec et pattes rouge sombre, une tache derrière l'œil en hiver." },
  "Calidris alpina|Calidris alba": { g: "wader", x: "le bec",
    b: { hd: "#B9B3A8", up: "#9E978A", un: "#F8F6F1", th: "#F8F6F1", wc: "#8E8779", tc: "#7A7366", bc: "#18191C", lc: "#2B2B2B", ll: .55 },
    z: [{ p: "bec", a: { bs: "pointe", bl: .8 }, b: { bl: .55, bd: .82 }, t: ["long, courbé au bout", "court, droit, épais"] },
      { p: "dos", l: "Plumage d'hiver", a: { up: "#958E80", wc: "#958E80" }, b: { up: "#D3D6D9", wc: "#D3D6D9", hd: "#E9EAEC", shp: "#2A2A2A" }, t: ["gris-brun", "très pâle, épaule noire"] },
      { p: "allure", t: ["fouille la vase", "court comme un jouet mécanique"] }],
    m: "Sanderling : tout pâle, une tache noire à l'épaule, il court comme un jouet à ressort au bord des vagues. Variable : plus sombre, bec courbé au bout." },
  "Charadrius hiaticula|Charadrius alexandrinus": { g: "plover", x: "le collier",
    b: { hd: "#A88F6C", up: "#A88F6C", un: "#F8F6F1", th: "#F8F6F1", wc: "#9A8262", tc: "#8B7558", es: "#18191C", fr2: "#F8F6F1", bc: "#18191C" },
    z: [{ p: "dessous", l: "Collier", a: { bnb: "#18191C", bnz: "complet" }, b: { bnb: "#3E3328", bnz: "interrompu" }, t: ["noir et complet", "juste une tache de chaque côté"] },
      { p: "pattes", a: { lc: "#E8913A" }, b: { lc: "#3A3632" }, t: ["orange", "sombres"] },
      { p: "bec", a: { bc: "#EE8A2E", bt: "#18191C", btx: .45 }, b: { bl: .3, bd: .6 }, t: ["orange, pointe noire", "tout noir, fin"] }],
    m: "Collier interrompu : son collier n'est pas fini, juste une tache de chaque côté, et des pattes sombres. Grand Gravelot : collier complet et pattes orange." },
  "Egretta garzetta|Ardea alba": { g: "heron", x: "le bec et les pattes", f: 1,
    b: { hd: "#F8F6F1", up: "#F8F6F1", un: "#F8F6F1", wc: "#F3F1EC", tc: "#F8F6F1", ey: "#F0D24A" },
    z: [{ p: "taille", a: { cm: 60 }, b: { cm: 95 }, t: ["moyenne", "très grande"] },
      { p: "bec", a: { bl: 1.2, bd: .7, bc: "#18191C" }, b: { bl: 1.32, bd: .9, bc: "#F2C53A", gl2: 1 }, t: ["noir", "jaune (hors noces)"] },
      { p: "pattes", a: { lc: "#18191C", tc2: "#F2D23A", ll: 1.0 }, b: { lc: "#18191C", ll: 1.15 }, t: ["doigts jaunes", "toutes noires"] }],
    m: "Garzette : bec noir et chaussons jaunes. Grande Aigrette : bec jaune, taille de héron et pattes toutes noires." },
  "Buteo buteo|Milvus migrans": { g: "hawk", x: "la queue",
    b: { hd: "#6E5440", up: "#5E4A3A", un: "#9A7A5E", wc: "#5E4A3A", tc: "#6B5442", bc: "#2A2A2A", ce: "#E6C24A", ey: "#7A4A26" },
    z: [{ p: "queue", a: { ts: "arrondie", fb: 1, tbd: "#3B2B20", tc: "#8A6E58" }, b: { ts: "echancree", tl: 1.05, tc: "#6E5A48", fb: 1, fbc: "#5A4636" }, t: ["ronde, en éventail", "fourchue (échancrée)"] },
      { p: "tete", a: { hs: "large" }, b: { hd: "#B9A898", st: "fines", ey: "#E9C64A" }, t: ["tête brune", "tête pâle, striée"] },
      { p: "allure", l: "En vol", t: ["tourne en cercles, ailes en V", "queue qui pivote comme un gouvernail"] }],
    m: "Milan : une queue en V qui pivote comme un gouvernail. Buse : une queue ronde en éventail." },
  "Turdus viscivorus|Turdus philomelos": { g: "thrush", x: "la forme des taches",
    b: { hd: "#8C7A62", up: "#8C7A62", un: "#F3EEE4", th: "#F5F1E8", br: "#F1E6D2", wc: "#7E6C55", we: "#C9B89C", tc: "#7A6852", bc: "#4B3C2C", lc: "#D9B2A0" },
    z: [{ p: "dessous", l: "Taches", a: { sk: "rondes", skc: "#2E241A", ska: "tout" }, b: { sk: "taches", skc: "#3E2E20", ska: "tout", br: "#F0DCB8", fl: "#EBD3A8" }, t: ["grosses taches rondes", "petites flèches, fond chamois"] },
      { p: "vol", l: "Dessous de l'aile", a: { vw: "dessous", ul: "#F8F6F1" }, b: { vw: "dessous", ul: "#E9C38E" }, t: ["blanc", "chamois-orangé"] },
      { p: "taille", a: { cm: 28 }, b: { cm: 22 }, t: ["grande, gris-brun pâle", "plus petite"] }],
    m: "Draine : des pois ronds comme une coccinelle, et des ailes blanches dessous. Musicienne : de petites flèches sur fond chamois." },
  "Regulus regulus|Regulus ignicapilla": { g: "pass", x: "la face",
    b: { hd: "#8E9B5E", up: "#8A9A54", un: "#E9E6D0", wc: "#5E6A3E", we: "#C9CC8E", tc: "#6B7444", cr: "#F2C62E", crx: "haut", cs2: "#141414", bl: .28, bd: .6, wb: 2 },
    z: [{ p: "tete", l: "Face", a: { er: "#E9E6D0", ck: "#9AA068" }, b: { su: "#F8F6F1", sul: "long", es: "#141414", cr: "#F07A2A" }, t: ["unie, œil cerclé", "sourcil blanc, trait noir"] },
      { p: "voix", t: ["très aigu, en cascade", "aigu, en crescendo"] }],
    m: "Triple bandeau : trois bandes sur le visage, noire, blanche, noire, comme un super-héros. Huppé : un visage tout simple d'où l'œil ressort." },
  "Hirundo rustica|Delichon urbicum": { g: "swallow", x: "le croupion",
    b: { hd: "#1F2B44", up: "#1F2B44", un: "#F3EADB", wc: "#1E2638", tc: "#1E2638" },
    z: [{ p: "croupion", a: {}, b: { rp: "#F8F6F1" }, t: ["sombre", "blanc"] },
      { p: "dessous", l: "Gorge", a: { th: "#B03A2C", bnb: "#20304A", bnz: "complet" }, b: { th: "#F8F6F1", br: "#F8F6F1", be: "#F8F6F1", fl: "#F8F6F1", uc: "#F8F6F1" }, t: ["rouge, bande bleue", "toute blanche"] },
      { p: "queue", a: { ts: "filets", tl: .62 }, b: { ts: "fourchue", tl: .42 }, t: ["longs filets", "courte, sans filets"] }],
    m: "Hirondelle de fenêtre : un croupion blanc comme un short et le ventre tout blanc. Rustique : gorge rouge et longs filets à la queue." },
  "Thalasseus sandvicensis|Sterna hirundo": { g: "tern", x: "le bec",
    b: { hd: "#F8F6F1", cr: "#18191C", crx: "calotte", up: "#C9D1DA", un: "#F8F6F1", wc: "#C3CCD6", tc: "#F8F6F1", lc: "#18191C" },
    z: [{ p: "bec", a: { bc: "#18191C", bt: "#F2D23A", btx: .14, bl: .95 }, b: { bc: "#E2512E", bt: "#18191C", btx: .3, bl: .8 }, t: ["noir, pointe jaune", "rouge-orangé, pointe noire"] },
      { p: "tete", l: "Calotte", a: { hp: "ebouriffee" }, b: {}, t: ["huppe ébouriffée", "calotte lisse"] },
      { p: "pattes", a: {}, b: { lc: "#D8312B" }, t: ["noires", "rouges"] }],
    m: "Caugek : le bout du bec trempé dans la moutarde et une coiffure en bataille. Pierregarin : bec rouge au bout noir." },
  "Falco tinnunculus|Accipiter nisus": { g: "hawk", x: "la forme des ailes",
    b: { hd: "#8C8070", up: "#8C7A66", un: "#F1E2CC", wc: "#7E6E5C", tc: "#8A7D6E", bc: "#2A2A2A", ce: "#E9C53A", lc: "#EFC23A", cc: "#18191C" },
    z: [{ p: "vol", a: { ws: "pointue", wc: "#B5683E", tip: "#2A2420", tipx: .32 }, b: { ws: "large", fg: 5, wc: "#6F7680" }, t: ["ailes pointues", "ailes rondes, doigts écartés"] },
      { p: "dos", a: { up: "#B9603A", wc: "#B9603A", dp: "taches", dpc: "#2A1E16" }, b: { up: "#6F7680", wc: "#6F7680" }, t: ["roux tacheté", "gris-bleu uni"] },
      { p: "tete", a: { ey: "#2A1E16", ml: "#22262B", hd: "#8C97A6" }, b: { ey: "#F0B52E", hd: "#6F7680", su: "#D9D3C8", sul: "court" }, t: ["œil noir, moustache", "œil jaune perçant"] },
      { p: "allure", t: ["fait du surplace", "fonce en rase-mottes"] }],
    m: "Crécerelle : ailes pointues, dos roux et vol sur place. Épervier : ailes rondes, œil jaune et attaque surprise." }
};

/* ---------- Petits outils de dessin ---------- */
let ZID = 0;
const ZOL = "#2B2520";
const r1 = x => Math.round(x * 10) / 10;
const zS = (d, f, w = 1.3, x = "") => `<path d="${d}" fill="${f}" stroke="${ZOL}" stroke-width="${r1(w * 10) / 10}" stroke-linejoin="round"${x}/>`;
const zF = (d, f, o) => `<path d="${d}" fill="${f}"${o != null ? ` fill-opacity="${o}"` : ""}/>`;
const zL = (d, c, w, o, x = "") => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${r1(w * 10) / 10}" stroke-linecap="round" stroke-linejoin="round"${o != null ? ` stroke-opacity="${o}"` : ""}${x}/>`;
const zE = (cx, cy, rx, ry, f, rot, x = "") => `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${f}"${rot ? ` transform="rotate(${rot} ${r1(cx)} ${r1(cy)})"` : ""}${x}/>`;
const zPts = a => a.map(p => r1(p[0]) + " " + r1(p[1])).join(" L ");
function zShade(h, a) {
  if (!h || h[0] !== "#" || h.length !== 7) return h;
  const n = parseInt(h.slice(1), 16), c = v => Math.max(0, Math.min(255, v + a));
  return "#" + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map(v => v.toString(16).padStart(2, "0")).join("");
}

/* ---------- Bec ---------- */
function zBillGeom(s, bx, by, l, d) {
  const T = (x, y) => r1(x) + " " + r1(y);
  if (s === "fort") return { d: `M ${T(bx, by - d * .5)} L ${T(bx + l * .74, by - d * .42)} Q ${T(bx + l * .98, by - d * .46)} ${T(bx + l, by - d * .02)} Q ${T(bx + l * .9, by + d * .2)} ${T(bx + l * .72, by + d * .62)} L ${T(bx, by + d * .5)} Z`, mid: [[bx, by], [bx + l * .9, by - d * .04]], gon: [bx + l * .76, by + d * .4] };
  if (s === "crochu") return { d: `M ${T(bx, by - d * .5)} C ${T(bx + l * .55, by - d * .68)} ${T(bx + l * 1.04, by - d * .34)} ${T(bx + l * .94, by + d * .64)} Q ${T(bx + l * .8, by + d * .28)} ${T(bx + l * .58, by + d * .24)} L ${T(bx, by + d * .42)} Z`, mid: [[bx, by + d * .02], [bx + l * .62, by + d * .16]], cere: .3 };
  if (s === "corvide") return { d: `M ${T(bx, by - d * .5)} Q ${T(bx + l * .55, by - d * .64)} ${T(bx + l, by + d * .1)} Q ${T(bx + l * .6, by + d * .38)} ${T(bx, by + d * .5)} Z`, mid: [[bx, by + d * .02], [bx + l * .9, by + d * .1]] };
  if (s === "plat") return { d: `M ${T(bx, by - d * .55)} Q ${T(bx + l * .5, by - d * .34)} ${T(bx + l * .92, by - d * .2)} Q ${T(bx + l * 1.03, by - d * .12)} ${T(bx + l, by + d * .14)} Q ${T(bx + l * .96, by + d * .42)} ${T(bx + l * .8, by + d * .4)} L ${T(bx, by + d * .46)} Z`, mid: [[bx, by + d * .08], [bx + l * .95, by + d * .12]], nail: [bx + l * .95, by - d * .08] };
  if (s === "cormoran") return { d: `M ${T(bx, by - d * .5)} L ${T(bx + l * .88, by - d * .3)} Q ${T(bx + l * 1.02, by - d * .3)} ${T(bx + l * .99, by + d * .1)} Q ${T(bx + l * .93, by + d * .06)} ${T(bx + l * .86, by + d * .12)} L ${T(bx, by + d * .5)} Z`, mid: [[bx, by], [bx + l * .86, by - d * .06]] };
  if (s === "pic") return { d: `M ${T(bx, by - d * .5)} L ${T(bx + l * .95, by - d * .14)} L ${T(bx + l, by + d * .04)} L ${T(bx + l * .95, by + d * .2)} L ${T(bx, by + d * .5)} Z`, mid: [[bx, by], [bx + l * .97, by + d * .04]] };
  if (s === "pigeon") return { d: `M ${T(bx, by - d * .5)} Q ${T(bx + l * .6, by - d * .5)} ${T(bx + l, by + d * .12)} Q ${T(bx + l * .55, by + d * .45)} ${T(bx, by + d * .45)} Z`, mid: [[bx, by + d * .02], [bx + l * .9, by + d * .1]], cereP: [bx + l * .22, by - d * .3] };
  /* formes tracées le long d'une ligne médiane : fines, droites, courbes */
  const drop = u => s === "courbe" ? l * .3 * Math.pow(u, 1.7) : s === "pointe" ? (u > .6 ? l * .15 * Math.pow((u - .6) / .4, 2) : 0) : s === "coude" ? (u < .55 ? l * .035 * u : l * .02 + l * .22 * Math.pow((u - .55) / .45, 1.5)) : s === "retrousse" ? -l * .1 * Math.pow(u, 1.8) : s === "conique" ? l * .08 * u * u : l * .02 * u;
  const hu = u => s === "conique" ? d * .5 * Math.pow(1 - u, .78) + .2 : s === "poignard" ? d * .5 * Math.pow(1 - u, .85) + .15 : s === "fin" ? d * .5 * Math.pow(1 - u, .9) + .2 : d * .5 * (1 - u * .82) + .1;
  const hl = u => s === "conique" ? d * .5 * Math.pow(1 - u, .86) + .2 : hu(u) * .95;
  const N = 16, up = [], lo = [], mid = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = bx + u * l, y = by + drop(u);
    const ua = Math.max(0, u - .03), ub = Math.min(1, u + .03);
    const tx = (ub - ua) * l, ty = drop(ub) - drop(ua), n = Math.hypot(tx, ty) || 1, nx = -ty / n, ny = tx / n;
    up.push([x - nx * hu(u), y - ny * hu(u)]); lo.push([x + nx * hl(u), y + ny * hl(u)]); mid.push([x, y]);
  }
  return { d: `M ${zPts(up)} L ${zPts(lo.slice().reverse())} Z`, mid };
}
function zBill(L, bx, by, l, d, w) {
  const g = zBillGeom(L.bs || "fin", bx, by, l, d), id = "zb" + (++ZID);
  const y0 = by - d * 2 - l * .2, y1 = by + d * 2 + l * .4, R = (x, wd, f) => `<rect x="${r1(x)}" y="${r1(y0)}" width="${r1(wd)}" height="${r1(y1 - y0)}" fill="${f}"/>`;
  let col = "";
  if (g.cere && L.ce) col += R(bx - 3, l * g.cere + 3, L.ce);
  if (L.bb) col += R(bx - 3, l * (L.bbx || .4) + 3, L.bb);
  if (L.lo) {
    const m0 = g.mid[0], m1 = g.mid[g.mid.length - 1], xm = bx + l * (L.lox || .45), ym = m0[1] + (m1[1] - m0[1]) * ((xm - m0[0]) / ((m1[0] - m0[0]) || 1));
    col += zF(`M ${r1(bx - 3)} ${r1(m0[1])} L ${r1(xm)} ${r1(ym)} L ${r1(xm)} ${r1(y1)} L ${r1(bx - 3)} ${r1(y1)} Z`, L.lo);
  }
  if (L.bnd) col += R(bx + l * .68, l * .1, "#2A2420");
  if (L.bt) col += R(bx + l * (1 - (L.btx || .3)), l * (L.btx || .3) + 8, L.bt);
  if (g.gon && L.gs) col += zE(g.gon[0], g.gon[1], d * .22, d * .15, L.gs);
  if (g.nail) col += zE(g.nail[0], g.nail[1], d * .13, d * .2, "#2A2420");
  if (g.cereP) col += zE(g.cereP[0], g.cereP[1], l * .24, d * .3, "#ECE6DC");
  const mid = g.mid.length > 3 ? g.mid.slice(0, -2) : g.mid;
  return `<defs><clipPath id="${id}"><path d="${g.d}"/></clipPath></defs><path d="${g.d}" fill="${L.bc}"/>${col ? `<g clip-path="url(#${id})">${col}</g>` : ""}${zL("M " + zPts(mid), ZOL, w * .65, .55)}<path d="${g.d}" fill="none" stroke="${ZOL}" stroke-width="${r1(w * 10) / 10}" stroke-linejoin="round"/>`;
}

/* ---------- Tête de profil (repère local : centre de la tête en 0,0, base du bec en 21,1) ---------- */
const ZTOP = {
  rond: "C 19 -13 12 -23 1 -24.5 C -10 -25 -21 -15 -24 -2",
  plat: "C 20.5 -9 15 -20.5 3 -22.5 C -10 -24 -21 -15 -24 -2",
  bombe: "C 18 -16 11 -27.5 -1 -28 C -11 -27.5 -21 -16 -24 -2",
  abrupt: "C 23.5 -12 19 -25 5 -26 C -9 -26.5 -21 -16 -24 -2"
};
const ZCROWN = {
  haut: "M 23 -6 C 15 -10 5 -12 -5 -11 C -14 -10 -21 -6 -28 0 L -28 -32 L 23 -32 Z",
  calotte: "M 23 -4.5 C 15 -7.5 6 -8.5 -4 -7.5 C -14 -6.5 -21 -2 -28 4 L -28 -32 L 23 -32 Z",
  nuque: "M 23 -4.5 C 15 -7.5 6 -8.5 -4 -6.5 C -12 -3 -19 6 -28 18 L -28 -32 L 23 -32 Z",
  sous_oeil: "M 23 1 C 15 3 8 4.5 -2 3 C -12 3 -20 7 -28 13 L -28 -32 L 23 -32 Z",
  net: "M 23 -3 C 15 -5 8 -6.5 -2 -6.5 C -12 -6.5 -20 -3.5 -28 2 L -28 -32 L 23 -32 Z",
  capuchon: "M 23 12 C 14 19 0 23 -28 23 L -28 -32 L 23 -32 Z",
  face: "M 23 15 C 16 21 8 22 1 18 C -5 12 -7 1 -5 -10 C -4 -18 -1 -25 2 -32 L 23 -32 Z"
};
const ZTH = {
  "": "M 22 4 C 16 6 9 10 4 14 C 2 22 3 32 4 46 L 16 46 C 14 30 16 16 22 6 Z",
  petite: "M 22 4 C 16 6 9 10 5 13 C 6 16 9 17 12 16 C 16 14 19 10 22 6 Z",
  grande: "M 22 4 C 15 6 7 10 1 15 C 1 21 5 25 11 24 C 16 22 19 14 22 6 Z"
};
const ZSU = [[20, -6.5], [13, -9.5], [7, -10], [0, -9.5], [-8, -8.5], [-15, -6], [-21, -1], [-24, 5]];
const ZSTK = [[-16, -14, -12, -12], [-9, -18, -5, -16], [-2, -20, 2, -18], [-19, -6, -15, -5], [-12, -9, -8, -8], [-4, -12, 0, -11], [-20, 3, -16, 4], [-14, 0, -10, 1], [-22, 12, -18, 13], [-16, 9, -12, 10], [-8, 4, -4, 6], [-20, 20, -16, 22], [-12, 16, -8, 18], [2, -16, 6, -15], [-25, 28, -21, 30], [-17, 26, -13, 28]];
function zHead(L, w, blen, nn) {
  const sil = nn ? `M 21 -3.5 ${ZTOP[L.fh] || ZTOP.rond} C -25 6 -22 14 -12 18 C -2 21 12 16 21 6 Z` : `M 21 -3.5 ${ZTOP[L.fh] || ZTOP.rond} C -25 8 -24 18 -27 46 L 7 46 C 9 26 14 14 21 6 Z`, cid = "zh" + (++ZID);
  const hk = L.hs === "large" ? 1.08 : L.hs === "pigeon" ? .78 : 1;
  let o = nn ? "" : zS("M -25 4 C -25 20 -26 33 -28 46 L 9 46 C 8 32 10 20 15 8 Z", L.neck || L.hd, w);
  let f = "";
  if (L.neck) f += zF("M -28 16 C -25 26 -26 36 -28 46 L 9 46 C 8 32 9 22 7 14 C -5 17 -17 18 -28 16 Z", L.neck);
  if (L.np2) f += zF("M -1 -26 C -7 -16 -8 -4 -3 8 C 1 17 4 28 5 46 L -30 46 L -30 -30 Z", L.np2);
  if (L.ck) f += zE(-1, 6, L.ckz === "grand" ? 13.5 : 9, L.ckz === "grand" ? 8.5 : 6, L.ck);
  if (L.cr) f += zF(ZCROWN[L.crx || "calotte"] || ZCROWN.calotte, L.cr);
  if (L.cs2) f += zL("M 21 -7 C 14 -11 4 -13 -6 -12 C -15 -11 -21 -7 -27 -1", L.cs2, 2.6);
  if (L.cs) f += zL("M 17 -14 C 10 -23 -4 -27 -18 -16", L.cs, 3.2);
  if (L.th) f += zF(ZTH[L.bib || ""] || ZTH[""], L.th);
  if (L.wfc) f += zF("M 21 5 C 14 5 8 9 3 15 C 6 22 15 22 21 13 Z", "#F6F4EF");
  if (L.blz === "large") f += zF("M 21.5 -5 C 16 -6 14 -1 15 3 C 16 7 18 9 21.5 9 Z", "#F6F4EF");
  if (L.blz === "petite") f += zL("M 20.5 -4 C 18.5 -1 18.5 4 20.5 7", "#F6F4EF", 1.2);
  if (L.fr2) f += zF("M 21 -3 C 19 -10 13 -14 3 -15 C 7 -12 12 -9 15 -6 C 17 -4.5 19 -3 21 -1 Z", L.fr2);
  if (L.es) f += zL("M 20 -1.5 L 14 -3.5 L 8 -5 L 0 -4.5 L -8 -3", L.es, 2.8);
  if (L.su) {
    const a = L.suf === "oeil" ? 2 : 0, b = { oeil: 2, court: 3, long: 5, nuque: 7 }[L.sul || "court"] ?? 3, p = ZSU.slice(a, b + 1);
    if (p.length > 1) { f += zL("M " + zPts(p), L.su, L.su2 ? 4.6 : 3.2); if (L.su2) f += zL("M " + zPts(p), zShade(L.hd, -40), 1.1); }
  } else if (L.su2) { const p = ZSU.slice(0, 6); f += zL("M " + zPts(p), "#E9D7A8", 4.6) + zL("M " + zPts(p), "#3A2A1E", 1.1); }
  if (L.mk === "tache") f += zE(-8, -1, 2.9, 3.5, "#3A3A3C");
  if (L.mk === "masque") f += zF("M 7 -4 C -1 -8.5 -10 -6.5 -17 -2 C -10 4 -2 4 7 2 Z", "#2A2A2A");
  if (L.mk === "joue") f += zE(-2, 6, 3.6, 3.1, "#1A1A1A");
  if (L.ml) f += zF("M 6.5 -1 C 4 4 3.5 9 5 13 C 7.5 9 8.5 4 8.6 -1 Z", L.ml);
  if (L.np) f += zE(-21, -3, 4.2, 7, L.np);
  if (L.col === "demi") f += zF("M -17 18 C -11 15 -5 15 0 18 L -.6 21 C -5.5 18.5 -11 18.5 -17 21.6 Z", "#16171A") + zL("M -16.6 17 C -11 14 -5 14 -.4 16.8", "#F4F2EC", 1.2);
  if (L.col === "rayures") { f += `<rect x="-16" y="12" width="14" height="11" rx="3" fill="#F4F2EC"/>`; for (let j = 0; j < 4; j++) f += `<rect x="-16" y="${12.6 + j * 2.7}" width="14" height="1.4" fill="#16171A"/>`; }
  if (L.col === "blanc") f += zE(-9, 12, 8, 4, "#7FB59A", 0, ` fill-opacity=".5"`) + zE(-9, 17, 7.5, 4, "#F6F4EE");
  if (L.col === "vert") f += zE(-9, 15, 8, 5, "#5FA383", 0, ` fill-opacity=".65"`);
  if (L.st) { const c = L.st === "fines" ? "#5A4636" : L.st === "douces" ? "#9C8E80" : "#8A7765", sw = L.st === "fines" ? 1.1 : L.st === "douces" ? 1.8 : 2.2, op = L.st === "douces" ? .55 : .92; ZSTK.forEach(([a, b, c2, d2]) => { f += zL(`M ${a} ${b} L ${c2} ${d2}`, c, sw, op); }); }
  if (L.gl) f += zL("M 13 -18 C 5 -23 -5 -23 -13 -18", "#FFFFFF", 2.2, .65);
  let h = `<defs><clipPath id="${cid}"><path d="${sil}"/></clipPath></defs><path d="${sil}" fill="${L.hd}"/><g clip-path="url(#${cid})">${f}</g><path d="${sil}" fill="none" stroke="${ZOL}" stroke-width="${r1(w * 10) / 10}" stroke-linejoin="round"/>`;
  const cf = L.hpc || L.cr || L.hd;
  if (L.hp === "petite") h += zS("M -4 -23 L -11 -33 L 2 -24.5 Z", L.cr || L.hd, w * .8);
  if (L.hp === "tombante") h += zS("M -19 -12 C -29 -10 -35 -2 -35 9 C -29 1 -25 -3 -19 -4 Z", L.hd, w * .8);
  if (L.hp === "eventail") h += zS("M 4 -2 C -4 -8 -14 -9 -22 -5 C -18 1 -18 8 -22 15 C -12 11 -2 6 4 2 Z", cf, w * .6) + zL("M 2 0 L -16 -3 M 2 1 L -15 5 M 1 2 L -14 11", zShade(cf, -40), .9, .7);
  if (L.hp === "touffes") h += zS("M 6 -6.5 C -6 -10.5 -18 -12.5 -33 -15 C -23 -7 -10 -2.5 6 -2.5 Z", cf, w * .6);
  if (L.hp === "huppe_front") h += zS("M 13 -17 C 18 -27 12 -33 7 -31 C 11 -27 10 -21 8 -17 Z", L.hd, w * .7);
  if (L.hp === "ebouriffee") h += zS("M -6 -24 L -14 -29 L -13 -23 L -22 -25 L -19 -18 L -27 -16 L -21 -12 L -24 -5 L -17 -9 L -12 -16 Z", L.cr || L.hd, w * .6);
  h += `<circle cx="8" cy="-5" r="3.3" fill="${L.ey}"/>`;
  if (L.er) h += `<circle cx="8" cy="-5" r="4.8" fill="none" stroke="${L.er}" stroke-width="1.9"/>`;
  h += `<circle cx="9.1" cy="-6.1" r=".9" fill="#FFFFFF" fill-opacity=".85"/>`;
  if (L.gl2) h += zL("M 21 1.6 L 4 -.2", ZOL, w * .9);
  if (L.bf === "nue") h += zF("M 13 -7 C 20 -9.5 26 -6 28 -1 C 28 6 24 11 18 13 C 12 13 9.5 7 10 1 C 10.5 -3 11.5 -5.5 13 -7 Z", L.bbc || "#D6D0C6");
  if (L.gs2) h += zS("M 20 4 C 24 8 23 13 21 14 C 16 14.5 13 11 13 9 C 15.5 7 18 5.5 20 4 Z", L.gs2, w * .6);
  if (L.hk) h += zS("M 21 5 L 16.5 13 L 14 9 L 10.5 16.5 L 8 11.5 L 5 18.5 L 3 13.5 L 1.5 21 L 5 31 L 16 31 Z", L.hd, w * .7);
  if (L.gape) h += zF("M 21.5 -.5 L 14.5 2.2 L 21.5 5 Z", L.gape);
  h += zBill(L, 21, 1, blen, (L.bd || .8) * 10, w);
  if (L.bf === "plumes") h += zS("M 17 -4.5 C 22 -6.5 27 -5 29.5 -1.5 C 26 -.5 22 0 17 1 Z", L.hd, w * .5) + zL("M 19 -3.5 L 25 -2.5 M 19 -1.5 L 24 -.8", "#3A3C40", .7, .8);
  o += hk === 1 ? h : `<g transform="translate(0 12) scale(${hk}) translate(0 -12)">${h}</g>`;
  return o;
}
function zTete(L) { return `<g transform="translate(46 54) scale(1.26)">${zHead(L, 1.3 / 1.26, Math.min((L.bl || .4) * 40, 34))}</g>`; }
function zBec(L, sc) { return `<g transform="translate(${r1(sc.tx)} 52) scale(${Math.round(sc.k * 1000) / 1000})">${zHead(L, 1.3 / sc.k, (L.bl || .4) * 40)}</g>`; }
function zBecScale(LA, LB) { const m = Math.max(LA.bl || .4, LB.bl || .4) * 40, k = clamp(84 / (41 + m), .4, 1.6); return { k, tx: 4 + 18 * k }; }

/* ---------- Forme d'une aile ouverte (racine à gauche, pointe à droite) ---------- */
function zWingPath(ws, fg) {
  if (ws === "faux") return "M 4 49 C 24 41 44 37 62 38.5 C 78 40 92 46 99 56 C 86 52.5 72 50.5 58 50.5 C 40 52 22 56 4 58 Z";
  if (ws === "large" || ws === "fine") {
    const narrow = ws === "fine", y0 = narrow ? 39 : 36, y1 = narrow ? 55 : 59.5, n = fg || 5, h = (y1 - y0) / n;
    let d = narrow ? "M 4 43 C 22 38 42 35 60 36 C 70 36.5 78 37.5 84 39" : "M 4 41 C 20 35 40 32 60 33 C 70 33.5 78 34.5 84 36";
    for (let j = 0; j < n; j++) {
      const a = y0 + j * h, b = a + h * .74, xe = 97.5 - Math.abs(j - (n - 1) * .35) * (narrow ? 1.4 : 1.8);
      d += ` L ${r1(xe)} ${r1(a + .4)} Q ${r1(xe + 2.6)} ${r1((a + b) / 2)} ${r1(xe)} ${r1(b)} L 85 ${r1(b + h * .2)}`;
    }
    return d + (narrow ? " C 70 58 50 61 30 61.5 C 18 61.5 10 60.5 4 59.5 Z" : " C 70 62 50 65.5 30 65.5 C 18 65.5 10 64.5 4 63 Z");
  }
  return "M 4 45 C 22 39 36 35 46 35.5 C 62 36.5 82 38.5 98 42 C 84 46 68 50 54 54 C 40 59.5 22 62 4 60.5 Z";
}
/* ---------- Oiseau entier de profil (posé), qu'on agrandit sur une partie : pattes, aile, dessous, dos ----------
   Repère : 200 × 170, oiseau tourné vers la droite, tête vers (136, 46), ventre vers (110, 104). */
const ZBODY = "M 118 54 C 104 54 88 60 76 70 C 66 78 60 86 58 92 L 70 100 C 82 108 102 110 116 104 C 130 98 140 86 142 72 C 143 62 138 56 132 54 Z";
const ZUPR = "M 118 54 C 104 54 88 60 76 70 C 66 78 60 86 58 92 L 82 84 C 96 74 112 66 134 60 C 132 56 126 54 118 54 Z";
const ZSK2 = {
  poitrine: [[134, 66], [128, 72], [138, 76], [132, 82], [124, 79], [137, 88], [129, 90], [121, 86], [140, 70], [131, 96]],
  flancs: [[113, 90], [105, 94], [97, 92], [89, 96], [117, 97], [109, 100], [101, 99], [93, 101], [121, 92], [85, 92]]
};
const ZPAT = Array.from({ length: 64 }, (_, i) => [60 + (i * 37) % 78, 52 + (i * 23) % 50]);
function zBird(L) {
  const ll = clamp(L.ll || .5, .2, 1.3), legLen = 10 + 40 * ll, gy = 106 + legLen, tl = clamp(L.tl || .8, .3, 1.3), ttx = 62 - 46 * tl;
  const gull = !!L.pk, pp = clamp(L.pp ?? .45, 0, 1), px = gull ? 22 : 72 - pp * 38, py = gull ? 93 : 98;
  const perch = !L.web && (L.leg || "perch") === "perch", lc = L.lc, tcol = L.tc2 || lc, cc = L.cc || zShade(lc, -70);
  const wc = L.wc, we = L.we || zShade(wc, 34), bar = L.wbc || "#F4F2EC";
  const claw = (x, y) => zL(`M ${r1(x)} ${r1(y)} C ${r1(x + 2)} ${r1(y + .2)} ${r1(x + 2.9)} ${r1(y + 1.2)} ${r1(x + 2.5)} ${r1(y + 2.6)}`, cc, 1.3);
  const leg = (x, back) => {
    const fx = x - 3, fy = gy, long = ll >= .72, hy = 104, kx = x + (long ? 5 : 2), ky = long ? hy + legLen * .46 : hy + 3;
    const path = long ? `M ${x} ${hy} L ${r1(kx)} ${r1(ky)} L ${fx} ${r1(fy)}` : `M ${x} ${hy} L ${fx} ${r1(fy)}`;
    const lw = L.raptor ? 4.6 : 3.3;
    let s = zL(path, ZOL, lw + 2) + zL(path, back ? zShade(lc, -30) : lc, lw);
    const toes = perch ? [[fx + 10, fy + 3], [fx + 7, fy + 5]] : [[fx + 12, fy + .8], [fx + 8.5, fy + 2.2]];
    if (L.web && !back) s += zF(`M ${fx} ${r1(fy)} L ${r1(toes[0][0])} ${r1(toes[0][1])} L ${r1(toes[1][0])} ${r1(toes[1][1])} Z`, lc, .9);
    toes.forEach(([tx, ty]) => { s += zL(`M ${fx} ${r1(fy)} L ${r1(tx)} ${r1(ty)}`, ZOL, 3.3) + zL(`M ${fx} ${r1(fy)} L ${r1(tx)} ${r1(ty)}`, tcol, 2) + claw(tx, ty); });
    const bx = fx - 6, by = fy + (perch ? 1.4 : .6);
    s += zL(`M ${fx} ${r1(fy)} L ${r1(bx)} ${r1(by)}`, ZOL, 3.3) + zL(`M ${fx} ${r1(fy)} L ${r1(bx)} ${r1(by)}`, tcol, 2);
    if (L.hcl === "long") s += zL(`M ${r1(bx)} ${r1(by)} C ${r1(bx - 4)} ${r1(by + .5)} ${r1(bx - 8)} ${r1(by + .6)} ${r1(bx - 11)} ${r1(by)}`, cc, 1.9);
    else s += zL(`M ${r1(bx)} ${r1(by)} C ${r1(bx - 1.8)} ${r1(by - .3)} ${r1(bx - 3)} ${r1(by + 1)} ${r1(bx - 2.6)} ${r1(by + 2.4)}`, cc, 1.8);
    return back ? `<g opacity=".55">${s}</g>` : s;
  };
  let o = perch ? zS(`M 30 ${r1(gy + 1)} C 80 ${r1(gy - 2)} 120 ${r1(gy - 2)} 175 ${r1(gy - 5)} L 175 ${r1(gy + 6)} C 120 ${r1(gy + 7)} 80 ${r1(gy + 8)} 30 ${r1(gy + 11)} Z`, "#6E5038", 1.2)
    : zF(`M 20 ${r1(gy + 1)} L 185 ${r1(gy + 1)} L 185 ${r1(gy + 50)} L 20 ${r1(gy + 50)} Z`, "#DCCFAE") + zL(`M 20 ${r1(gy + 1)} L 185 ${r1(gy + 1)}`, "#BCAE88", 1.2);
  o += leg(96, true);
  o += zS(`M 64 88 L ${r1(ttx)} ${r1(101 + tl * 4)} L ${r1(ttx + 3)} ${r1(109 + tl * 4)} L 72 100 Z`, L.tc, 1.2);
  /* corps : dessus, dessous, flancs, bavette… */
  const bid = "zbd" + (++ZID);
  let bf = zF(ZBODY, L.un) + zF(ZUPR, L.up);
  if (L.be) bf += zE(110, 100, 26, 12, L.be);
  if (L.br) bf += zE(132, 80, 16, 17, L.br);
  if (L.fl) bf += zF("M 80 86 C 96 90 112 90 128 84 C 122 98 104 104 86 102 Z", L.fl);
  if (L.th && L.bib !== "petite") bf += zE(137, 58, 8, L.bib === "grande" ? 8 : 11, L.th);
  if (L.uc) bf += zE(70, 101, 14, 6.5, L.uc);
  if (L.bnb) bf += L.bnz === "interrompu" ? zE(124, 66, 6, 5, L.bnb) : zF("M 126 60 C 134 62 140 66 143 70 L 142 77 C 137 73 130 71 122 71 Z", L.bnb);
  if (L.bp) bf += zE(114, 96, 14, 8, L.bp);
  if (L.tie) bf += zL("M 140 60 C 143 72 138 88 126 100", L.tie, 6);
  if (L.sk && L.sk !== "aucune") {
    const c = L.skc || "#3E2E20", pts = L.ska === "poitrine" ? ZSK2.poitrine : L.ska === "flancs" ? ZSK2.flancs : [...ZSK2.poitrine, ...ZSK2.flancs];
    pts.forEach(([x, y]) => {
      if (L.sk === "fines") bf += zL(`M ${x - 1} ${y - 1.8} L ${x + .3} ${y + 2}`, c, 1, .85);
      else if (L.sk === "fortes") bf += zL(`M ${x - 1.8} ${y - 3} L ${x + .5} ${y + 3}`, c, 2.2, .9);
      else if (L.sk === "rondes") bf += `<circle cx="${x}" cy="${y}" r="2.2" fill="${c}"/>`;
      else bf += zF(`M ${x} ${y - 2.3} L ${x + 1.9} ${y + 1.7} L ${x - 1.9} ${y + 1.7} Z`, c);
    });
  }
  if (L.rp) bf += zF("M 58 92 C 62 84 68 78 76 72 L 84 78 C 76 84 70 90 66 96 Z", L.rp);
  o += `<defs><clipPath id="${bid}"><path d="${ZBODY}"/></clipPath></defs><g clip-path="url(#${bid})">${bf}</g><path d="${ZBODY}" fill="none" stroke="${ZOL}" stroke-width="1.3" stroke-linejoin="round"/>`;
  /* aile repliée */
  const W = `M 122 62 C 112 59 98 62 88 68 C 80 74 72 82 ${r1(px + 10)} ${r1(py - 6)} L ${r1(px)} ${r1(py)} C ${r1(px + 14)} ${r1(py + 2)} 92 98 104 94 C 114 90 122 84 125 76 C 126 70 125 65 122 62 Z`;
  let w = zS(`M 104 84 C 94 88 84 92 ${r1(px + 12)} ${r1(py - 3)} L ${r1(px)} ${r1(py)} C ${r1(px + 14)} ${r1(py + 2)} 92 98 104 94 Z`, gull ? L.pk : zShade(wc, -16), 1.1);
  const tt = 78;
  for (let j = 1; j <= 4; j++) { const x = px + j * (tt - px) / 5; w += zL(`M ${r1(x + 7)} ${r1(py - 4.4 + j * .5)} L ${r1(x)} ${r1(py - .4 + j * .2)}`, gull ? "#555" : ZOL, .8, .55); if (L.ppt) w += zE(x + 1, py - .6 + j * .2, 1.7, .9, "#ECE6D6"); }
  if (L.ppt) w += zE(px + 1.6, py - .4, 1.9, 1, "#ECE6D6");
  if (gull) w += zE(px + 5, py - 1.2, 2.4, 1.3, "#F8F6F1") + zE(px + 14, py - 2.6, 1.8, 1, "#F8F6F1");
  if (L.pyw) w += zL(`M 102 86 C 92 90 82 94 ${r1(px + 4)} ${r1(py - 1)}`, "#E8D73A", 2);
  w += zS("M 122 78 C 112 82 102 86 92 90 L 94 94 C 104 92 114 88 124 83 Z", zShade(wc, -6), 1);
  if (L.pn) w += zL("M 121 81.5 C 112 84.5 103 88 95 91.5", "#EFE9D8", 1.9, .95) + zL("M 120 79.6 C 111 82.4 102 85.6 94 89", "#EFE9D8", 1.2, .8);
  if (L.wp) w += zF("M 121 79.6 C 112 82.6 102 86.6 94 90 L 95 92.4 C 104 89.4 114 85.8 122 82.6 Z", "#F3F2EC");
  [[88, 88, 12.5, 4.2, -15], [93.5, 83.5, 12.5, 4.2, -17], [99, 79, 12, 4, -19]].forEach(([cx, cy, rx, ry, rot]) => { w += zE(cx, cy, rx, ry, gull ? L.wc : zShade(wc, -4), rot, ` stroke="${ZOL}" stroke-width=".9"`) + zE(cx - 1, cy - .6, rx - 2.4, ry - 1.6, gull ? L.wc : zShade(wc, -18), rot) + zL(`M ${cx - rx * .9} ${cy + 1.4} C ${cx - rx * .3} ${cy + ry} ${cx + rx * .4} ${cy + ry * .6} ${cx + rx * .8} ${cy - .4}`, we, 1.3, .9, ` transform="rotate(${rot} ${cx} ${cy})"`); });
  w += zS("M 123 70 C 114 72 104 75 96 79 L 98 83 C 106 80 116 77 125 75 Z", L.bbd || zShade(wc, 6), 1);
  if (L.wb >= 1) w += zL("M 98 83 C 106 80 116 77 125 75", bar, 2.4);
  w += zS("M 122 64 C 116 65 108 68 102 72 L 104 75.5 C 110 72.5 117 70 124 69 Z", zShade(wc, 10), 1);
  if (L.wb >= 2) w += zL("M 104 75.5 C 110 72.5 117 70 124 69", bar, 2.2);
  w += zS("M 123 60.5 C 118 61 112 63 108 66 C 112 68 118 68 126 66 Z", L.shc || zShade(wc, 14), 1);
  if (L.pcm) w += `<g transform="rotate(-28 122 71)"><rect x="118" y="68.6" width="8" height="1.8" fill="#16171A"/><rect x="118" y="70.4" width="8" height="1.5" fill="#F4F2EC"/><rect x="118" y="71.9" width="8" height="1.8" fill="#16171A"/></g>`;
  o += w + `<path d="${W}" fill="none" stroke="${ZOL}" stroke-width="1.3" stroke-linejoin="round"/>`;
  /* motif du dos et des couvertures */
  const dp = L.dp || "uni", dpc = L.dpc || "#2A2420";
  if (dp !== "uni" || L.sh) {
    const pid = "zbp" + (++ZID);
    let f = "";
    if (dp === "taches") ZPAT.forEach(([x, y], i) => { if (i % 3) f += zF(`M ${x} ${y - 1.6} L ${x + 2.1} ${y + 1.4} L ${x - 2.1} ${y + 1.4} Z`, dpc); });
    if (dp === "vermicule") for (let y = 54; y <= 100; y += 3.6) { let d = `M 56 ${r1(y)}`; for (let x = 58; x <= 140; x += 3) d += ` L ${x} ${r1(y + ((x / 3) % 2 ? .7 : -.7))}`; f += zL(d, dpc, .7, .75); }
    if (dp === "pointille") ZPAT.forEach(([x, y]) => { f += `<circle cx="${x}" cy="${y}" r=".8" fill="${dpc}"/>`; });
    if (dp === "tachete") ZPAT.forEach(([x, y], i) => { if (i % 2 === 0) f += zE(x, y, 1.8, 1.3, dpc); });
    if (dp === "barre") for (let y = 58; y <= 100; y += 5.5) f += `<rect x="56" y="${r1(y)}" width="90" height="2.2" fill="${dpc}"/>`;
    if (dp === "ovales") f += zE(110, 64, 15, 5, dpc, -14, ` stroke="${ZOL}" stroke-width=".8"`);
    if (dp === "strie") ZPAT.forEach(([x, y], i) => { if (i % 2) f += zL(`M ${x + 2.4} ${y - 1.6} L ${x - 2.4} ${y + 1}`, dpc, 1.3, .85); });
    if (dp === "ecailles") ZPAT.forEach(([x, y], i) => { if (i % 3 !== 2) f += zE(x, y, 2.8, 1.9, dpc, -14); });
    o += `<defs><clipPath id="${pid}"><path d="${ZUPR} ${W}"/></clipPath></defs><g clip-path="url(#${pid})">${f}</g>`;
  }
  if (L.shp) o += zE(122, 66, 6, 4, L.shp);
  o += leg(104, false);
  o += L.cu ? zS("M 98 98 L 99 113 L 102 108 L 105 116 L 108 109 L 111 115 L 113 107 L 114 98 Z", L.hd, 1)
    : L.raptor ? zF("M 96.5 99 C 96 108 99 114.5 105 115 C 111 114.5 114 108 113.5 99 Z", L.thc || L.un) + zL("M 96.6 104 C 97.5 110 100.5 114.3 105 114.6 C 109.5 114.3 112.5 110 113.4 104", ZOL, 1) + zL("M 100 108 L 101 113 M 104 109 L 105 114 M 108 108 L 109 113", zShade(L.thc || L.un, -30), .8, .7)
    : zE(105, 103.5, 6.5, 5.5, L.un);
  o += `<g transform="translate(136 46) scale(.8)">${zHead(L, 1.3 / .8, Math.min((L.bl || .4) * 40, 40), true)}</g>`;
  return o;
}
const zZoom = (inner, cx, cy, s) => `<g transform="translate(50 50) scale(${r1(s * 100) / 100}) translate(${-cx} ${-cy})">${inner}</g>`;
function zSide(L, p, zm) {
  const b = zBird(L), legLen = 10 + 40 * clamp(L.ll || .5, .2, 1.3);
  if (zm === "pied") return zZoom(b, 99, r1(106 + legLen), 2.3);
  if (zm === "cloaque") return zZoom(b, 82, 98, 1.45);
  if (p === "pattes") return zZoom(b, 100, r1(108 + legLen * .5), clamp(66 / (legLen + 28), .82, 1.5));
  if (p === "aile") return L.pk ? zZoom(b, 80, 82, .78) : zZoom(b, 96, 82, 1);
  if (p === "dessous") return zZoom(b, 124, 84, 1.12);
  return zZoom(b, 106, 73, 1.05);
}

/* ---------- Oiseau en vol vu de dessus (ou de dessous) : ailes, croupion, queue ---------- */
function zTailPath(ts, y0, len) {
  const e = y0 + len, cx = 50;
  return {
    carree: `M 46 ${y0} L 43 ${e} L 57 ${e} L 54 ${y0} Z`,
    arrondie: `M 46 ${y0} L 42 ${e - 4} Q ${cx} ${e + 4} 58 ${e - 4} L 54 ${y0} Z`,
    echancree: `M 46 ${y0} L 42.5 ${e} L ${cx} ${e - 2.6} L 57.5 ${e} L 54 ${y0} Z`,
    fourchue: `M 46 ${y0} L 41.5 ${e} L ${cx} ${e - 7} L 58.5 ${e} L 54 ${y0} Z`,
    filets: `M 46 ${y0} L 43 ${e - 3} L 41.2 ${e + 9} L 42.6 ${e + 9} L 46.4 ${e - 4} L ${cx} ${e - 6} L 53.6 ${e - 4} L 57.4 ${e + 9} L 58.8 ${e + 9} L 57 ${e - 3} L 54 ${y0} Z`,
    losange: `M 46 ${y0} L 41.5 ${e - 6} L ${cx} ${e + 2} L 58.5 ${e - 6} L 54 ${y0} Z`
  }[ts] || `M 46 ${y0} L 43 ${e} L 57 ${e} L 54 ${y0} Z`;
}
function zFly(L, focus, zm) {
  const under = L.vw === "dessous", ws = L.ws || (L.raptor ? "large" : "pointue"), W = zWingPath(ws, L.fg);
  const id = ++ZID, wid = "zfw" + id, cid = "zfc" + id;
  /* une aile (repère de zWingPath : racine à gauche, pointe à droite), dessinée deux fois en miroir */
  let f = zF(W, under && L.tr ? zShade(L.wc, -46) : L.wc);
  if (under) f += zF("M 4 45 C 22 39 40 35 58 36 L 60 45 C 40 47 22 51 4 54 Z", L.ul || zShade(L.wc, 30));
  if (under && L.tr) f += L.tr === "toutes" ? zF("M 44 40 C 62 40 80 40 99 42 C 84 46 68 50 54 54 L 44 53 Z", "#FFFFFF", .95) : zF("M 44 40 C 52 40 58 40 66 40.6 L 66 49.6 C 58 51.4 52 53 44 54 Z", "#FFFFFF", .95);
  if (L.band) f += zL("M 6 54 C 22 52 38 49.5 54 47.5", "#1E1E1E", 3);
  if (L.wbar) f += zL("M 6 54 C 26 51.5 46 47.5 74 44.5", "#F8F6F1", L.wbar === 2 ? 6 : 3.6);
  if (L.cres) f += zL("M 43 36.5 C 47 41 47.5 46 44.5 50.5", "#F8F6F1", 4.4);
  if (L.tew) f += zL("M 2 58.5 C 20 60 38 57.5 56 52.5", "#F8F6F1", 7.5);
  if (L.lwedge) f += zF("M 46 35.5 L 98 42 L 90 43.6 L 52 40.6 Z", "#F8F6F1");
  if (L.tip) f += L.rid ? zF("M 68 48.5 C 80 45.5 90 43.2 98 42 L 92 46.4 C 84 48.2 76 50.4 70 52 Z", L.tip) : `<rect x="${r1(99 - (L.tipx || .3) * 60)}" y="20" width="70" height="60" fill="${L.tip}"/>`;
  if (L.dte) f += zL(ws === "large" || ws === "fine" ? "M 30 65 C 50 65 70 62 86 58" : "M 54 54 C 70 50 86 46 98 42", "#1E1E1E", 4.2);
  [[52, 37, 58, 52], [62, 37.5, 67, 50], [72, 38.5, 75, 48.5], [82, 39.8, 84, 46.4]].forEach(([a, b, c, d]) => { f += zL(`M ${a} ${b} L ${c} ${d}`, ZOL, 1.2, .3); });
  const wing = `<g id="${wid}"><g clip-path="url(#${cid})">${f}</g><path d="${W}" fill="none" stroke="${ZOL}" stroke-width="2.4" stroke-linejoin="round"/></g>`;
  /* queue */
  const tl = clamp(L.tl || .8, .3, 1.3), y0 = 58, len = 13 + 15 * tl, T = zTailPath(L.ts || "carree", y0, len), tid = "zft" + id, e = y0 + len;
  let tf = zF(T, L.tc);
  if (L.wb2) tf += `<rect x="36" y="${y0}" width="28" height="${r1(len * .45)}" fill="#F8F6F1"/>`;
  if (L.fb) for (let j = 0; j < 6; j++) tf += `<rect x="36" y="${r1(y0 + 3 + j * (len - 5) / 6)}" width="28" height="1" fill="${L.fbc || zShade(L.tc, -36)}"/>`;
  if (L.tb) for (let j = 0; j < L.tb; j++) tf += `<rect x="36" y="${r1(y0 + 3 + j * (len - 5) / L.tb)}" width="28" height="2" fill="${zShade(L.tc, -40)}"/>`;
  if (L.bands) tf += `<rect x="36" y="${y0 + 3}" width="28" height="2.4" fill="${L.tbd || "#2A2420"}"/><rect x="36" y="${y0 + 7.5}" width="28" height="2.4" fill="${L.tbd || "#2A2420"}"/>`;
  if (L.tbd) tf += `<rect x="36" y="${r1(e - 5)}" width="28" height="12" fill="${L.tbd}"/>`;
  if (L.ow) tf += zL(`M 46.2 ${y0} L ${L.ts === "filets" ? 41.9 : 43.4} ${r1(e + (L.ts === "filets" ? 8 : 0))}`, "#F8F6F1", 2.6) + zL(`M 53.8 ${y0} L ${L.ts === "filets" ? 58.1 : 56.6} ${r1(e + (L.ts === "filets" ? 8 : 0))}`, "#F8F6F1", 2.6);
  if (L.wcn) tf += zF(`M 42.4 ${r1(e - 4)} L 42.4 ${r1(e + 1)} L 46.5 ${r1(e + 1)} Z`, "#F8F6F1") + zF(`M 57.6 ${r1(e - 4)} L 57.6 ${r1(e + 1)} L 53.5 ${r1(e + 1)} Z`, "#F8F6F1");
  let o = `<defs><clipPath id="${cid}"><path d="${W}"/></clipPath><clipPath id="${tid}"><path d="${T}"/></clipPath></defs>`;
  o += `<g clip-path="url(#${tid})">${tf}</g><path d="${T}" fill="none" stroke="${ZOL}" stroke-width="1" stroke-linejoin="round"/>`;
  o += `<g transform="translate(53 23) scale(.48)">${wing}</g><use href="#${wid}" transform="translate(47 23) scale(-.48 .48)"/>`;
  /* corps, croupion, tête */
  o += zE(50, 44, 6.8, 16, under ? L.un : L.up, 0, ` stroke="${ZOL}" stroke-width="1"`);
  if (!under && L.rp) {
    const rpp = L.rpp || "plein", h = rpp === "large" ? 9 : rpp === "etroit" ? 3.4 : 6, top = 58.5 - h;
    o += `<path d="M 44 ${r1(top)} L 56 ${r1(top)} L 55.4 ${r1(top + h)} L 44.6 ${r1(top + h)} Z" fill="${L.rp}" stroke="${ZOL}" stroke-width=".8"/>`;
    if (rpp === "cotes") o += `<rect x="48.4" y="${r1(top - .5)}" width="3.2" height="${r1(h + 1)}" fill="${L.up}"/>`;
  }
  o += `<circle cx="50" cy="26" r="6.4" fill="${under ? (L.th || L.un) : L.hd}" stroke="${ZOL}" stroke-width="1"/>`;
  o += zS(`M 48.7 21 L 50 ${r1(21 - 3 - (L.bl || .4) * 6)} L 51.3 21 Z`, L.bc, .7);
  if (focus === "croupion") return zZoom(o, 50, 60, 1.75);
  if (focus === "queue") { const ext = len + (L.ts === "filets" ? 9 : 2); return zZoom(o, 50, r1(57 + ext / 2), clamp(78 / (ext + 10), 1.5, 2.3)); }
  return zm === "main" ? zZoom(o, 80, 44, 2.05) : zZoom(o, 60, 45, 1.12);
}

/* ---------- Taille : deux silhouettes à la même échelle ---------- */
function zSil(g, cx, base, h, cls) {
  const s = h / 100, tr = `translate(${r1(cx - 50 * s)} ${r1(base - 100 * s)}) scale(${Math.round(s * 1000) / 1000})`;
  let d;
  if (g === "hawk" || g === "falcon") d = `<path d="M 61 9 C 66 9 70 12 71 16 L 74 19 L 71 22.5 L 70 20.5 C 70 24 68 27 66 29 C 70 38 71 50 67 60 C 65 66 61 71 58 74 L 59 100 L 45 100 L 47 74 C 42 67 40 56 42 44 C 43 34 47 27 51 22 C 51 15 55 9 61 9 Z"/>`;
  else if (g === "heron") d = `<circle cx="66" cy="12" r="6"/><path d="M 71 10.5 L 92 13 L 71 15 Z"/><path d="M 63 15 C 55 24 63 32 54 42" fill="none" stroke-width="7" stroke-linecap="round"/><ellipse cx="46" cy="50" rx="21" ry="11" transform="rotate(-18 46 50)"/><path d="M 44 58 L 42 100 M 50 58 L 52 100" fill="none" stroke-width="3"/>`;
  else d = `<path d="M 72 13 C 77 13 80 16 81 20 L 93 24.5 L 80.5 28 C 82 37 80 47 74 55 C 70 61 63 67 56 70 L 31 93 L 24 88 L 42 64 C 45 52 50 40 57 29 C 59 19 65 13 72 13 Z"/><path d="M 58 68 L 56 100 M 65 66 L 65 100" fill="none" stroke-width="3.4"/>`;
  return `<g class="${cls}" transform="${tr}">${d}</g>`;
}
function zTaille(A, B, g) {
  const mx = Math.max(A.cm, B.cm), h = cm => 76 * cm / mx;
  return `<svg class="zsize" viewBox="0 0 220 100" aria-hidden="true"><path d="M 10 90 L 210 90" class="gr"/>${zSil(g, 62, 90, h(A.cm), "zsa")}${zSil(g, 160, 90, h(B.cm), "zsb")}</svg>`;
}

/* ---------- Loupe ---------- */
function zLens(inner) {
  const id = ++ZID;
  return `<svg class="zlens" viewBox="0 0 112 112" aria-hidden="true"><defs><clipPath id="zc${id}"><circle cx="50" cy="50" r="45"/></clipPath><radialGradient id="zg${id}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FDFEFE"/><stop offset="1" stop-color="#D5DFE9"/></radialGradient></defs><path class="hdl" d="M 82 82 L 103 103"/><circle cx="50" cy="50" r="45" fill="url(#zg${id})"/><g clip-path="url(#zc${id})">${inner}</g><path d="M 19 31 A 34 34 0 0 1 40 13" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="3.2" stroke-linecap="round"/><circle class="rim" cx="50" cy="50" r="45"/></svg>`;
}
const ZPART = { bec: "Bec", tete: "Tête", pattes: "Pattes", aile: "Aile repliée", vol: "Aile en vol", queue: "Queue", croupion: "Croupion", dessous: "Dessous", dos: "Dos", taille: "Taille", voix: "Voix", milieu: "Milieu", allure: "Allure" };
const ZDOTS = { bec: [26.4, 7.6], tete: [20.6, 6.4], pattes: [13.2, 19.6], aile: [12, 11], queue: [3.4, 15.8], croupion: [6.8, 10.6], dessous: [16.4, 15.4], dos: [11.5, 7.8], vol: [17, 5.2] };
function zMap(p) {
  if (p === "voix") return ic("wave", "xs");
  if (p === "milieu") return ic("pin", "xs");
  if (p === "allure") return ic("eye", "xs");
  if (p === "taille") return `<svg class="zmap" viewBox="0 0 30 22" aria-hidden="true"><g fill="currentColor" opacity=".5"><circle cx="9" cy="10" r="2.6"/><ellipse cx="7" cy="15" rx="4" ry="3"/><circle cx="21" cy="6" r="3.4"/><ellipse cx="19" cy="13" rx="6" ry="4.6"/></g><path d="M 2 20.5 L 28 20.5" stroke="var(--gold)" stroke-width="1.6"/></svg>`;
  const fly = p === "vol", [cx, cy] = ZDOTS[p] || [14, 12];
  const body = fly ? `<path d="M 8 13 C 12 11 19 11 23 13 C 19 14.6 12 14.6 8 13 Z"/><path d="M 13 12 L 9 3 L 13 3 L 18 11.4 Z"/><circle cx="24.5" cy="12.6" r="2.4"/><path d="M 8.5 13 L 3 11 L 3 15 Z"/>` : `<ellipse cx="13" cy="12" rx="8" ry="5.3" transform="rotate(-12 13 12)"/><circle cx="20.8" cy="6.8" r="3.6"/><path d="M 24 6.4 L 27.8 7.5 L 24 8.4 Z"/><path d="M 6.5 12.5 L 1 16 L 2 17.6 L 8 15.4 Z"/><path d="M 12 16.5 L 11.4 20.8 M 15 16.5 L 15 20.8" fill="none" stroke="currentColor" stroke-width="1.2"/>`;
  return `<svg class="zmap" viewBox="0 0 30 22" aria-hidden="true"><g fill="currentColor" opacity=".5">${body}</g><circle cx="${cx}" cy="${cy}" r="3.1" fill="var(--gold)" stroke="#0B111F" stroke-width="1.2"/></svg>`;
}

/* ---------- Assemblage ---------- */
function sosVis(sa, sb) {
  if (!sa || !sb) return null;
  const a = canonSci(sa), b = canonSci(sb);
  if (SOSVIS[a + "|" + b]) return { v: SOSVIS[a + "|" + b], sw: false };
  if (SOSVIS[b + "|" + a]) return { v: SOSVIS[b + "|" + a], sw: true };
  return null;
}
/* Ce qu'il faut regarder en premier pour départager deux espèces (pour les indices) */
function sosFirst(sa, sb) { const s = sosVis(sa, sb); return s ? s.v.x || ZPART[s.v.z[s.v.f || 0].p].toLowerCase() : ""; }
function zLooks(v, c, sw) {
  const base = { ...ZLK0, ...(ZGRP[v.g] || ZGRP.pass), ...(v.b || {}) };
  const A = { ...base, ...(c.a || {}) }, B = { ...base, ...(c.b || {}) };
  return sw ? [B, A] : [A, B];
}
function zRow(v, c, first, sw) {
  const t = sw ? [c.t[1], c.t[0]] : c.t, lab = c.l || ZPART[c.p] || "";
  const head = `<div class="zlab">${zMap(c.p)}<b>${esc(lab)}</b>${first ? `<span class="zfirst">${ic("eye", "xs")}Regarde d'abord</span>` : ""}</div>`;
  if (c.p === "voix" || c.p === "milieu" || c.p === "allure") return `<div class="zrow ztxt">${head}<div class="zpair"><span class="zsa">${esc(t[0])}</span><span class="zsb">${esc(t[1])}</span></div></div>`;
  const [A, B] = zLooks(v, c, sw);
  if (c.p === "taille") return `<div class="zrow">${head}${zTaille(A, B, v.g)}<div class="zpair zcap"><span class="zsa"><b>${A.cm} cm</b> ${esc(t[0])}</span><span class="zsb"><b>${B.cm} cm</b> ${esc(t[1])}</span></div></div>`;
  const sc = c.p === "bec" ? zBecScale(A, B) : null;
  const draw = L => c.p === "bec" ? zBec(L, sc) : c.p === "tete" ? zTete(L) : c.p === "vol" || c.p === "queue" || c.p === "croupion" ? zFly(L, c.p, c.zm) : zSide(L, c.p, c.zm);
  return `<div class="zrow">${head}<div class="zpair"><figure class="zl zsa">${zLens(draw(A))}<figcaption>${esc(t[0])}</figcaption></figure><figure class="zl zsb">${zLens(draw(B))}<figcaption>${esc(t[1])}</figcaption></figure></div></div>`;
}
/* mode : « err » après une erreur (a = bonne réponse, b = ton choix), « ok » rappel court, « fiche » complet */
function sosiesHtml(a, b, mode = "fiche", ear) {
  const s = sosVis(a?.sci, b?.sci);
  if (!s) return "";
  const { v, sw } = s, vi = ear ? v.z.findIndex(c => c.p === "voix") : -1, f = vi >= 0 ? vi : v.f || 0;
  let order = v.z.map((c, i) => ({ c, i })).sort((x, y) => (y.i === f) - (x.i === f));
  if (mode === "ok") order = order.slice(0, 1);
  const rows = order.map(({ c, i }) => zRow(v, c, i === f, sw)).join("");
  const err = mode === "err";
  const head = err
    ? `<div class="whyh"><span class="wi">${ic(vi >= 0 ? "wave" : "zoom")}</span><span class="wt"><b>Pourquoi tu t'es trompé</b><small>${vi >= 0 ? "Écoute d'abord la voix, puis regarde " + esc(v.x || "") : "Regarde d'abord " + esc(v.x || "")}.</small></span></div>`
    : `<div class="whyh"><span class="wi">${ic("duel")}</span><span class="wt"><b>${mode === "ok" ? "Ne la confonds pas avec" : "Comment les distinguer"}</b><small>${esc(nameFr(b))}</small></span></div>`;
  const leg = `<div class="zleg"><span class="zsa">${esc(nameFr(a))}${err ? " <em>c'était</em>" : ""}</span><span class="zsb">${esc(nameFr(b))}${err ? " <em>ton choix</em>" : ""}</span></div>`;
  const tp = typeof duelTip === "function" ? duelTip(a.sci, b.sci) : null;
  const memo = v.m ? `<div class="memo"><span class="mi">${ic("bulb")}</span><div class="mt"><small>Moyen mnémo</small><p>${esc(v.m)}</p></div></div>` : "";
  const act = mode !== "fiche" && a.id ? `<div class="memo-act"><button class="chip" data-act="memokeep" data-id="${a.id}" data-m="${esc(v.m || "")}">${ic("check", "xs")}Garder dans ma fiche</button><button class="chip" data-act="memoown">${ic("edit", "xs")}Écrire le mien</button></div><div class="memoin" hidden><textarea maxlength="280" placeholder="Ce qui les sépare, pour toi…"></textarea><button class="btn ghost" data-act="memosave" data-id="${a.id}">${ic("check")}Garder</button></div>` : "";
  const all = mode !== "ok" && tp ? `<details class="zall"><summary>${ic("list", "xs")}Tous les critères</summary>${tipHtml(a, b, "")}</details>` : "";
  return `<div class="why ${err ? "err" : "neu"}">${head}${leg}${rows}${memo}${act}${all}</div>`;
}
/* Paire inconnue : le lien de parenté dit où chercher, et on invite à écrire son propre moyen mnémo */
/* ---------- Toutes les autres paires : les critères décrits pour chacun (Wikipédia), partie par partie ---------- */
const WGRP = [
  ["tete", "têtes?|calottes?|sourcils?|joues?|face|nuque|capuchons?|masques?|front|lores|iris|yeux|œil|oeil|cercles? oculaires?|huppes?|moustaches?|auriculaires?"],
  ["bec", "becs?|mandibules?|cires?"],
  ["dessous", "gorges?|poitrines?|ventres?|flancs?|dessous|parties inférieures|abdomen|plastron|bavettes?"],
  ["dos", "dos|manteau|dessus|parties supérieures|scapulaires|croupions?"],
  ["aile", "ailes?|alaires?|rémiges|primaires|secondaires|couvertures|miroirs?"],
  ["queue", "queues?|rectrices|sus-caudales|sous-caudales|caudales?"],
  ["pattes", "pattes?|tarses?|doigts|serres"]
].map(([k, w]) => [k, new RegExp("(^|[^\\p{L}])(" + w + ")(?=[^\\p{L}]|$)", "iu")]);
const WVOX = /(^|[^\p{L}])(chants?|cris?|voix|strophes?|notes?)(?=[^\p{L}]|$)/iu;
const WCOL = /(^|[^\p{L}])((?:noir|blanc|gris|brun|roux|rousse|jaune|orang[ée]|rouge|vert|bleu|chamois|crème|olive|ocre|fauve|beige|rose|violet|pourpre|marron|cuivré|doré|argenté|ardoise|sombre|clair|pâle|strié|tacheté|barré|rayé|moucheté|uniforme)(?:e|s|es|che|ches)?)(?=[^\p{L}]|$)/giu;
const WJUV = /(^|[^\p{L}])(juvéniles?|jeunes?|immatures?|poussins?)(?=[^\p{L}]|$)/iu;
const wSentences = txt => (String(txt || "").replace(/\s+/g, " ").match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || []).map(x => x.trim()).filter(x => x.length > 12);
/* La proposition qui parle de la partie (« la poitrine et la face sont orange »), pas toute la phrase */
function wClause(sent, re) {
  const parts = sent.split(/;\s+|,\s+(?=(?:la|le|les|l'|son|sa|ses|il|elle|mais|et|alors|tandis|chez)\b)/i);
  if (parts.length < 2) return sent;
  const p = parts.find(x => re.test(x));
  if (!p || p.trim().length < 22) return sent;
  let c = p.trim(); c = c[0].toUpperCase() + c.slice(1);
  return /[.!?]$/.test(c) ? c : c + ".";
}
function wPick(sents, re, used) {
  const cands = [];
  sents.forEach((x, i) => {
    if (!re.test(x) || /distingu|confon/i.test(x)) return;
    const sc = (new RegExp(WCOL.source, "iu").test(x) ? 2 : 0) + (/\bplus\b|\bmoins\b/i.test(x) ? 1 : 0) - (WJUV.test(x) ? 2 : 0) - i * .05;
    cands.push({ x, sc });
  });
  cands.sort((a, b) => b.sc - a.sc);
  for (const { x } of cands) { const c = clip(wClause(x, re), 190); if (used && used.has(c)) continue; used?.add(c); return c; }
  return "";
}
/* Longueur du corps en cm : « 60 à 70 cm », « mesure 33 cm »… (pas l'envergure) */
function wSize(txt) {
  const t = String(txt || "").replace(/\s+/g, " "), re = /(\d+(?:[,.]\d+)?)\s*(?:(?:à|-|–)\s*(\d+(?:[,.]\d+)?)\s*)?cm\b/g;
  let m, best = null;
  while ((m = re.exec(t))) {
    const before = t.slice(Math.max(0, m.index - 70), m.index).toLowerCase();
    if (/envergure|aile|queue|bec|tarse|œuf|oeuf/.test(before.slice(-35))) continue;
    const a = parseFloat(m[1].replace(",", ".")), b = m[2] ? parseFloat(m[2].replace(",", ".")) : a, v = (a + b) / 2;
    if (v < 7 || v > 200) continue;
    const good = /longueur|mesure|long|taille|corps/.test(before);
    if (!best || (good && !best.good)) best = { v, txt: m[2] ? `${m[1]} à ${m[2]} cm` : `${m[1]} cm`, good };
    if (good) break;
  }
  return best;
}
/* Une phrase de l'article de l'un qui parle de l'autre (« se distingue du… », « contrairement au… ») */
function wVersus(full, other) {
  const names = [nameFr(other), other.sci].filter(Boolean).map(norm).filter(n => n.length > 3);
  if (!full || !names.length) return "";
  let best = "", bs = -1;
  for (const x of wSentences(String(full).replace(/={2,}[^=\n]*={2,}/g, ". "))) {
    const n = norm(x);
    if (!names.some(nm => n.includes(nm))) continue;
    const sc = (/distingu|confon|contrairement|diff[èe]r|plus (petit|grand|sombre|clair|court|long)|alors que|tandis que|s[ée]par/i.test(x) ? 3 : 0) + (new RegExp(WCOL.source, "iu").test(x) ? 1 : 0) - (x.length > 260 ? 1 : 0);
    if (sc > bs) { bs = sc; best = x; }
  }
  return best ? clip(best, 260) : "";
}
const wBold = s => esc(s).replace(new RegExp(WCOL.source, "giu"), (x, p, w) => `${p}<b>${w}</b>`);
const silGroup = t => { const f = famName(fam(t)) || ""; return /Accipitr|Falcon|Pandion|Strig|Tyton/.test(f) ? "hawk" : /Ardeid|Ciconi|Threskiorn|Gruid/.test(f) ? "heron" : "pass"; };
async function fillWhy(t, c, ear) {
  const box = $("#wcrit"); if (!box) return;
  const get = async x => { const d = await wikiDesc(x).catch(() => null); if (d) return d; const w = await wiki(x).catch(() => null); return w ? { text: w.text, voice: null, url: w.url } : null; };
  const [A, B] = await Promise.all([get(t), get(c)]);
  if (!$("#wcrit") || $("#wcrit") !== box) return;
  if (!A && !B) { box.innerHTML = box.dataset.fb ? decodeURIComponent(box.dataset.fb) : ""; return; }
  const sa = wSentences(A?.text), sb = wSentences(B?.text), rows = [];
  const za = wSize(A?.text), zb = wSize(B?.text);
  const sizeRow = za && zb && Math.abs(za.v - zb.v) / Math.min(za.v, zb.v) >= .12;
  const ua = new Set(), ub = new Set();
  for (const [k, re] of WGRP) { const x = wPick(sa, re, ua), y = wPick(sb, re, ub); if (x || y) rows.push({ k, x, y, both: !!(x && y) }); }
  const vx = wPick(wSentences(A?.voice), WVOX), vy = wPick(wSentences(B?.voice), WVOX);
  if (vx || vy) rows[ear ? "unshift" : "push"]({ k: "voix", x: vx, y: vy, both: !!(vx && vy) });
  const order = [...rows.filter(r => r.both), ...rows.filter(r => !r.both)].slice(0, sizeRow ? 4 : 5);
  const vs = wVersus(A?.full, c) || wVersus(B?.full, t);
  if (ear) { const v = order.findIndex(r => r.k === "voix"); if (v > 0) order.unshift(...order.splice(v, 1)); }
  if (!order.length && !sizeRow && !wVersus(A?.full, c) && !wVersus(B?.full, t)) { box.innerHTML = box.dataset.fb ? decodeURIComponent(box.dataset.fb) : ""; return; }
  const firstK = sizeRow && !ear ? "taille" : (order.find(r => r.both) || order[0])?.k;
  const cell = (s, cls) => `<span class="${cls}">${s ? wBold(s) : `<em>Pas décrit</em>`}</span>`;
  let h = vs ? `<div class="wvs">${ic("bulb", "xs")}<span><small>La différence, d'après Wikipédia</small>${wBold(vs)}</span></div>` : "";
  if (sizeRow) {
    const g = silGroup(t), lab = `<div class="zlab">${zMap("taille")}<b>Taille</b>${firstK === "taille" ? `<span class="zfirst">${ic("eye", "xs")}Regarde d'abord</span>` : ""}</div>`;
    h += `<div class="zrow">${lab}${zTaille({ cm: Math.round(za.v) }, { cm: Math.round(zb.v) }, g)}<div class="zpair zcap"><span class="zsa"><b>${esc(za.txt)}</b></span><span class="zsb"><b>${esc(zb.txt)}</b></span></div></div>`;
  }
  h += order.map(r => `<div class="zrow ztxt zlong"><div class="zlab">${zMap(r.k)}<b>${esc(ZPART[r.k] === "Dos" ? "Dessus" : ZPART[r.k] === "Aile repliée" ? "Ailes" : ZPART[r.k])}</b>${r.k === firstK ? `<span class="zfirst">${ic("eye", "xs")}Regarde d'abord</span>` : ""}</div><div class="zpair">${cell(r.x, "zsa")}${cell(r.y, "zsb")}</div></div>`).join("");
  h += `<p class="zsrc">D'après les descriptions de Wikipédia. ${A?.url ? `<a href="${esc(A.url)}" target="_blank" rel="noopener">${esc(nameFr(t))}</a>` : ""}${A?.url && B?.url ? " · " : ""}${B?.url ? `<a href="${esc(B.url)}" target="_blank" rel="noopener">${esc(nameFr(c))}</a>` : ""}</p>`;
  box.innerHTML = h;
}
function relHtml(t, c, ear) {
  const gt = genus(t), gc = genus(c), ft = fam(t), fc = fam(c), ot = ord(t), oc = ord(c);
  let msg, parts;
  if (gt && gt === gc) { msg = `Même genre (<i>${esc(gt)}</i>) : tout se joue sur les détails.`; parts = ["tete", "bec", "dessous", "pattes", "voix"]; }
  else if (ft && ft === fc) { msg = `Même famille (${esc(famName(ft))}) : voici ce qui les sépare.`; parts = ["tete", "bec", "dessous", "aile"]; }
  else if (ot && ot === oc) { msg = `Même grand groupe (${esc(ordName(ot))}) : voici ce qui les sépare.`; parts = ["bec", "taille", "queue", "pattes"]; }
  else { msg = ft && fc ? `Deux familles éloignées (${esc(famName(ft))} et ${esc(famName(fc))}).` : "Deux oiseaux bien différents."; parts = ["taille", "bec", "pattes", "milieu"]; }
  if (ear) { msg = "Écoute les deux chants l'un après l'autre : rythme, hauteur, notes répétées ou non. " + msg; parts = ["voix", ...parts.filter(x => x !== "voix")].slice(0, 4); }
  const fb = `<div class="zlook">${parts.map(p => `<span class="zchip">${zMap(p)}${esc(ZPART[p])}</span>`).join("")}</div><p class="zhint">${ear ? "Ouvre leurs fiches pour réécouter leurs chants." : "Touche les deux photos pour les comparer en grand."}</p>`;
  return `<div class="why err gen"><div class="whyh"><span class="wi">${ic(ear ? "wave" : "zoom")}</span><span class="wt"><b>Pourquoi tu t'es trompé</b><small>${msg}</small></span></div>
  <div class="zleg"><span class="zsa">${esc(nameFr(t))} <em>c'était</em></span><span class="zsb">${esc(nameFr(c))} <em>ton choix</em></span></div>
  <div id="wcrit" data-fb="${encodeURIComponent(fb)}"><div class="lsk"></div><div class="lsk short"></div><div class="lsk"></div></div>
  <div class="memo-act"><button class="chip" data-act="memoown">${ic("edit", "xs")}Écrire mon moyen mnémo</button></div><div class="memoin" hidden><textarea maxlength="280" placeholder="Ce qui les sépare, pour toi…"></textarea><button class="btn ghost" data-act="memosave" data-id="${t.id}">${ic("check")}Garder</button></div></div>`;
}
function whyHtml(t, c, drill, ear) {
  const h = sosiesHtml(t, c, "err", ear) || relHtml(t, c, ear);
  return h;
}

function drillWorthy(a, b) {
  const A = S.sp[a], B = S.sp[b];
  if (!A || !B) return 0;
  if (sosVis(A.sci, B.sci)) return 3;
  if (A.f && A.f === B.f) return 2;
  return ((A.conf?.[b] || 0) + (B.conf?.[a] || 0)) >= 2 ? 1 : 0;
}
