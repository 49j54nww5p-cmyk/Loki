// Faux serveur iNaturalist / Wikipédia / tuiles / polices pour les tests
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIST = path.join(__dirname, "..", "dist");
const GF = path.join(__dirname, "gfonts", "ofl");

const ORD = [[900001, "Passeriformes", "Passereaux"], [900002, "Charadriiformes", "Limicoles et laridés"], [900003, "Anseriformes", "Canards"], [900004, "Accipitriformes", "Rapaces"], [900005, "Strigiformes", "Chouettes"], [900006, "Piciformes", "Pics"], [900007, "Pelecaniformes", "Hérons"]];
const FAM = [
  [910001, "Muscicapidae", "Gobemouches et alliés", 900001], [910002, "Turdidae", "Grives et merles", 900001], [910003, "Paridae", "Mésanges", 900001],
  [910004, "Fringillidae", "Pinsons et alliés", 900001], [910005, "Phylloscopidae", "Pouillots", 900001], [910006, "Sylviidae", "Fauvettes", 900001],
  [910007, "Corvidae", "Corneilles et geais", 900001], [910008, "Laridae", "Mouettes, goélands et sternes", 900002], [910009, "Scolopacidae", "Bécasseaux et chevaliers", 900002],
  [910010, "Charadriidae", "Pluviers et gravelots", 900002], [910011, "Anatidae", "Canards, oies et cygnes", 900003], [910012, "Accipitridae", "Buses et éperviers", 900004],
  [910013, "Strigidae", "Chouettes et hiboux", 900005], [910014, "Picidae", "Pics", 900006], [910015, "Ardeidae", "Hérons", 900007],
  [910016, "Hirundinidae", "Hirondelles", 900001], [910017, "Motacillidae", "Bergeronnettes et pipits", 900001], [910018, "Alaudidae", "Alouettes", 900001]
];
const SP = [
  ["Rougegorge familier", "Erithacus rubecula", 910001], ["Rougequeue noir", "Phoenicurus ochruros", 910001], ["Rougequeue à front blanc", "Phoenicurus phoenicurus", 910001],
  ["Gobemouche noir", "Ficedula hypoleuca", 910001], ["Tarier pâtre", "Saxicola rubicola", 910001], ["Traquet motteux", "Oenanthe oenanthe", 910001],
  ["Merle noir", "Turdus merula", 910002], ["Grive musicienne", "Turdus philomelos", 910002], ["Grive mauvis", "Turdus iliacus", 910002],
  ["Mésange charbonnière", "Parus major", 910003], ["Mésange bleue", "Cyanistes caeruleus", 910003], ["Mésange noire", "Periparus ater", 910003], ["Mésange nonnette", "Poecile palustris", 910003],
  ["Pinson des arbres", "Fringilla coelebs", 910004], ["Chardonneret élégant", "Carduelis carduelis", 910004], ["Verdier d'Europe", "Chloris chloris", 910004], ["Serin cini", "Serinus serinus", 910004], ["Linotte mélodieuse", "Linaria cannabina", 910004],
  ["Pouillot véloce", "Phylloscopus collybita", 910005], ["Pouillot fitis", "Phylloscopus trochilus", 910005],
  ["Fauvette à tête noire", "Sylvia atricapilla", 910006], ["Fauvette des jardins", "Sylvia borin", 910006],
  ["Corneille noire", "Corvus corone", 910007], ["Corbeau freux", "Corvus frugilegus", 910007], ["Pie bavarde", "Pica pica", 910007], ["Geai des chênes", "Garrulus glandarius", 910007],
  ["Goéland argenté", "Larus argentatus", 910008], ["Goéland leucophée", "Larus michahellis", 910008], ["Mouette rieuse", "Chroicocephalus ridibundus", 910008], ["Sterne pierregarin", "Sterna hirundo", 910008],
  ["Bécasseau variable", "Calidris alpina", 910009], ["Chevalier gambette", "Tringa totanus", 910009], ["Courlis cendré", "Numenius arquata", 910009], ["Tournepierre à collier", "Arenaria interpres", 910009],
  ["Grand Gravelot", "Charadrius hiaticula", 910010], ["Pluvier argenté", "Pluvialis squatarola", 910010],
  ["Canard colvert", "Anas platyrhynchos", 910011], ["Tadorne de Belon", "Tadorna tadorna", 910011], ["Bernache cravant", "Branta bernicla", 910011],
  ["Buse variable", "Buteo buteo", 910012], ["Épervier d'Europe", "Accipiter nisus", 910012], ["Busard des roseaux", "Circus aeruginosus", 910012],
  ["Chouette hulotte", "Strix aluco", 910013], ["Chevêche d'Athéna", "Athene noctua", 910013],
  ["Pic épeiche", "Dendrocopos major", 910014], ["Pic vert", "Picus viridis", 910014],
  ["Héron cendré", "Ardea cinerea", 910015], ["Aigrette garzette", "Egretta garzetta", 910015],
  ["Hirondelle rustique", "Hirundo rustica", 910016], ["Bergeronnette grise", "Motacilla alba", 910017], ["Pipit farlouse", "Anthus pratensis", 910017], ["Alouette des champs", "Alauda arvensis", 910018]
];
const EXO = {
  97392: [["Calao trompette", "Bycanistes bucinator"], ["Touraco de Livingstone", "Tauraco livingstonii"], ["Messager sagittaire", "Sagittarius serpentarius"], ["Inséparable rosegorge", "Agapornis roseicollis"], ["Guêpier écarlate", "Merops nubicus"], ["Pintade de Numidie", "Numida meleagris"]],
  97395: [["Faisan doré", "Chrysolophus pictus"], ["Paon bleu", "Pavo cristatus"], ["Calao bicorne", "Buceros bicornis"], ["Martin triste", "Acridotheres tristis"], ["Bulbul orphée", "Pycnonotus jocosus"], ["Grue du Japon", "Grus japonensis"]],
  97394: [["Cardinal rouge", "Cardinalis cardinalis"], ["Geai bleu", "Cyanocitta cristata"], ["Merle d'Amérique", "Turdus migratorius"], ["Pygargue à tête blanche", "Haliaeetus leucocephalus"], ["Colibri à gorge rubis", "Archilochus colubris"], ["Mésange à tête noire", "Poecile atricapillus"]],
  97389: [["Toucan toco", "Ramphastos toco"], ["Ara rouge", "Ara macao"], ["Coq-de-roche orange", "Rupicola rupicola"], ["Nandou d'Amérique", "Rhea americana"], ["Hoazin huppé", "Opisthocomus hoazin"], ["Condor des Andes", "Vultur gryphus"]],
  97393: [["Martin-chasseur géant", "Dacelo novaeguineae"], ["Cacatoès à huppe jaune", "Cacatua galerita"], ["Émeu d'Australie", "Dromaius novaehollandiae"], ["Kiwi austral", "Apteryx australis"], ["Ménure superbe", "Menura novaehollandiae"], ["Méliphage à oreillons", "Lichenostomus chrysops"]]
};
const PLACES = [[6753, "France", "France", 0], [41001, "Gironde", "Gironde, FR", 20], [41002, "Finistère", "Finistère, FR", 20], [97391, "Europe", "Europe", -10], [97392, "Africa", "Africa", -10], [97395, "Asia", "Asia", -10], [97394, "North America", "North America", -10], [97389, "South America", "South America", -10], [97393, "Oceania", "Oceania", -10]];

const famOf = id => FAM.find(f => f[0] === id);
const species = SP.map(([fr, sci, f], i) => ({ id: 1000 + i, fr, sci, f, o: famOf(f)[3], c: 5000 - i * 90 }));
let exoId = 5000;
const exotic = {};
for (const k of Object.keys(EXO)) exotic[k] = EXO[k].map(([fr, sci]) => ({ id: exoId++, fr, sci, f: 910001, o: 900001, c: 900 }));
const allSp = [...species, ...Object.values(exotic).flat()];
const byId = new Map(allSp.map(s => [s.id, s]));

const photo = (pid, sz = "square") => `https://static.inaturalist.org/photos/${pid}/${sz}.jpg`;
const taxonJson = s => ({
  id: s.id, name: s.sci, rank: "species", preferred_common_name: s.fr, iconic_taxon_name: "Aves",
  ancestor_ids: [48460, 1, 2, 355675, 3, s.o, s.f, 990000 + s.id, s.id], observations_count: s.c,
  default_photo: { id: s.id * 10, url: photo(s.id * 10), square_url: photo(s.id * 10), medium_url: photo(s.id * 10, "medium"), attribution: "(c) Observateur " + s.id + ", certains droits réservés (CC BY-NC)", license_code: "cc-by-nc" }
});

function json(route, obj, status = 200) {
  return route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(obj) });
}
const hue = id => (id * 47) % 360;
const imgCache = new Map();
async function bird(pid, size) {
  const key = pid + size;
  if (imgCache.has(key)) return imgCache.get(key);
  const W = size === "square" ? 75 : size === "medium" ? 500 : 1024, H = size === "square" ? 75 : Math.round(W * .75);
  const h = hue(Math.floor(pid / 10)), h2 = (h + 40) % 360, v = pid % 10;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 400 300">
  <defs><radialGradient id="g" cx="${30 + v * 4}%" cy="40%" r="80%"><stop offset="0" stop-color="hsl(${h2},45%,62%)"/><stop offset="1" stop-color="hsl(${h},40%,18%)"/></radialGradient>
  <filter id="b"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <rect width="400" height="300" fill="url(#g)"/>
  <g filter="url(#b)" opacity=".5"><circle cx="70" cy="60" r="30" fill="hsl(${h2},60%,80%)"/><circle cx="330" cy="80" r="22" fill="hsl(${h},60%,75%)"/><circle cx="300" cy="250" r="40" fill="hsl(${h2},50%,40%)"/></g>
  <path d="M60 260 C 150 230, 250 240, 360 210" stroke="hsl(${h},30%,12%)" stroke-width="9" fill="none"/>
  <g transform="translate(${110 + v * 6} ${70 + v * 3}) scale(7.2)"><path fill="hsl(${h},55%,${30 + v * 3}%)" d="M3 15.5c1.8.2 3.3-.3 4.6-1.4 1.5-1.3 2.6-3.7 5.6-4.4 2.4-.6 4.3.2 5.4 1.4l2.9-.3-2.3 1.9c0 3.7-3 6.8-7.3 6.8-2.7 0-4.9-1-6.5-2.6L3 15.5z"/>
  <path fill="hsl(${h2},70%,70%)" d="M12 14c1.5 2 4 2.6 5.6 1.4-1.6 2.6-4.6 3.2-6.6 1.8z"/><circle cx="16.5" cy="12.1" r=".85" fill="#111"/></g></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
  imgCache.set(key, buf);
  return buf;
}
function wav(seed) {
  const sr = 22050, dur = 3.6, n = Math.floor(sr * dur), data = Buffer.alloc(44 + n * 2);
  data.write("RIFF", 0); data.writeUInt32LE(36 + n * 2, 4); data.write("WAVE", 8); data.write("fmt ", 12); data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(sr, 24); data.writeUInt32LE(sr * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write("data", 36); data.writeUInt32LE(n * 2, 40);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, k = Math.floor(t / .22), local = (t % .22) / .22;
    const on = local < .55 && k % 4 !== 3;
    const f0 = 2600 + ((seed * 37 + k * 523) % 2600), f1 = f0 + (k % 2 ? 1800 : -900);
    const f = f0 + (f1 - f0) * local / .55;
    ph += 2 * Math.PI * f / sr;
    const env = on ? Math.sin(Math.PI * local / .55) : 0;
    const s = env * (.55 * Math.sin(ph) + .15 * Math.sin(2 * ph)) + (Math.random() - .5) * .02;
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(s * 30000))), 44 + i * 2);
  }
  return data;
}
const wavCache = new Map();
let tilePng = null, gridPng = null;

async function handle(route) {
  const req = route.request(), u = new URL(req.url()), host = u.hostname, p = u.pathname, q = Object.fromEntries(u.searchParams);
  if (host === "plumage.test") {
    let f = p === "/" ? "/index.html" : p;
    const file = path.join(DIST, f);
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "nope" });
    const ct = f.endsWith(".html") ? "text/html; charset=utf-8" : f.endsWith(".png") ? "image/png" : f.endsWith(".svg") ? "image/svg+xml" : f.endsWith(".webmanifest") ? "application/manifest+json" : "application/octet-stream";
    return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(file) });
  }
  if (host === "fonts.googleapis.com") {
    const css = `@font-face{font-family:"Unbounded";font-weight:200 900;src:url(https://fonts.gstatic.com/x/unb.ttf) format("truetype")}
@font-face{font-family:"Figtree";font-weight:300 900;src:url(https://fonts.gstatic.com/x/fig.ttf) format("truetype")}
@font-face{font-family:"Instrument Serif";font-style:italic;font-weight:400;src:url(https://fonts.gstatic.com/x/isi.ttf) format("truetype")}
@font-face{font-family:"Instrument Serif";font-style:normal;font-weight:400;src:url(https://fonts.gstatic.com/x/isr.ttf) format("truetype")}`;
    return route.fulfill({ status: 200, contentType: "text/css", body: css });
  }
  if (host === "fonts.gstatic.com") {
    const map = { "/x/unb.ttf": "unbounded/Unbounded[wght].ttf", "/x/fig.ttf": "figtree/Figtree[wght].ttf", "/x/isi.ttf": "instrumentserif/InstrumentSerif-Italic.ttf", "/x/isr.ttf": "instrumentserif/InstrumentSerif-Regular.ttf" };
    const f = map[p];
    if (!f) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ status: 200, contentType: "font/ttf", headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(path.join(GF, f)) });
  }
  if (host === "static.inaturalist.org") {
    let m = p.match(/^\/photos\/(\d+)\/(square|medium|large|small|original)\.jpg$/);
    if (m) return route.fulfill({ status: 200, contentType: "image/jpeg", headers: { "access-control-allow-origin": "*" }, body: await bird(+m[1], m[2] === "large" || m[2] === "original" ? "large" : m[2] === "square" ? "square" : "medium") });
    m = p.match(/^\/sounds\/(\d+)\.wav$/);
    if (m) { if (!wavCache.has(m[1])) wavCache.set(m[1], wav(+m[1])); return route.fulfill({ status: 200, contentType: "audio/wav", headers: { "access-control-allow-origin": "*" }, body: wavCache.get(m[1]) }); }
    return route.fulfill({ status: 404, body: "" });
  }
  if (host.endsWith("basemaps.cartocdn.com")) {
    tilePng = tilePng || await sharp({ create: { width: 256, height: 256, channels: 3, background: { r: 18, g: 22, b: 33 } } }).png().toBuffer();
    return route.fulfill({ status: 200, contentType: "image/png", body: tilePng });
  }
  if (host === "fr.wikipedia.org") {
    const title = decodeURIComponent(p.split("/").pop()).replace(/_/g, " ");
    const s = allSp.find(x => x.sci === title || x.fr === title);
    if (!s) return json(route, { type: "https://mediawiki.org/wiki/HyperSwitch/errors/not_found" }, 404);
    return json(route, { type: "standard", title: s.fr, extract: `Le ${s.fr.toLowerCase()} (${s.sci}) est une espèce d'oiseaux de la famille des ${famOf(s.f)[1].replace(/idae$/, "idés")}. Texte de test qui imite un résumé Wikipédia pour vérifier la mise en page sur plusieurs lignes.`, content_urls: { mobile: { page: "https://fr.m.wikipedia.org/wiki/" + encodeURIComponent(s.fr) } } });
  }
  if (host !== "api.inaturalist.org") return route.abort();

  // ----- iNaturalist -----
  if (/^\/v1\/(grid|points|heatmap)\//.test(p)) {
    gridPng = gridPng || await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">${Array.from({ length: 40 }, (_, i) => `<rect x="${(i * 53) % 240}" y="${(i * 97) % 240}" width="10" height="10" fill="#1FD1F2" opacity=".8"/>`).join("")}</svg>`), top: 0, left: 0 }]).png().toBuffer();
    return route.fulfill({ status: 200, contentType: "image/png", headers: { "access-control-allow-origin": "*" }, body: gridPng });
  }
  await new Promise(r => setTimeout(r, 40));
  if (p === "/v1/taxa" && q.rank === "order") return json(route, { total_results: ORD.length, results: ORD.map(([id, name, v]) => ({ id, name, rank: "order", preferred_common_name: v, ancestor_ids: [48460, 1, 2, 355675, 3, id] })) });
  if (p === "/v1/taxa" && q.rank === "family") return json(route, { total_results: FAM.length, results: FAM.map(([id, name, v, o]) => ({ id, name, rank: "family", preferred_common_name: v, ancestor_ids: [48460, 1, 2, 355675, 3, o, id], default_photo: { square_url: photo(id) } })) });
  if (p === "/v1/taxa/autocomplete") {
    const n = (q.q || "").toLowerCase();
    const r = allSp.filter(s => s.sci.toLowerCase() === n || s.fr.toLowerCase() === n).map(taxonJson);
    return json(route, { total_results: r.length, results: r });
  }
  if (p === "/v1/places/autocomplete") {
    const n = (q.q || "").toLowerCase();
    const r = PLACES.filter(x => x[1].toLowerCase().includes(n) || x[2].toLowerCase().includes(n)).map(([id, name, display_name, admin_level]) => ({ id, name, display_name, admin_level }));
    return json(route, { total_results: r.length, results: r });
  }
  if (p === "/v1/observations/species_counts") {
    let list = species;
    if (q.place_id && exotic[q.place_id]) list = exotic[q.place_id];
    if (q.taxon_id && q.taxon_id !== "3") { const ids = q.taxon_id.split(",").map(Number); list = list.filter(s => ids.includes(s.f) || ids.includes(s.o)); }
    if (q.user_login) list = list.slice(0, 15);
    if (q.introduced) list = list.slice(36, 39);
    let res = list.map(s => ({ count: s.c, taxon: taxonJson(s) }));
    if (q.order === "asc") res = res.reverse();
    return json(route, { total_results: res.length, page: 1, per_page: +q.per_page || 500, results: res.slice(0, +q.per_page || 500) });
  }
  if (process.env.MOCK_NO_V2 && p.startsWith("/v2/")) return json(route, { error: "Unprocessable" }, 422);
  if (p.startsWith("/v2/taxa/") || /^\/v1\/taxa\/[\d,]+$/.test(p)) {
    const ids = p.split("/").pop().split(",").map(Number);
    return json(route, { total_results: ids.length, results: ids.map(id => ({ id, taxon_photos: [0, 1, 2, 3].map(k => ({ photo: { id: id * 10 + k, url: photo(id * 10 + k), medium_url: photo(id * 10 + k, "medium"), large_url: photo(id * 10 + k, "large"), attribution: "(c) Photographe " + (id + k) + ", certains droits réservés (CC BY)", license_code: "cc-by" } })) })) });
  }
  if (p === "/v2/observations" || p === "/v1/observations") {
    const id = +q.taxon_id, n = Math.min(+q.per_page || 5, 4);
    const results = Array.from({ length: n }, (_, k) => ({
      id: id * 100 + k, uri: "https://www.inaturalist.org/observations/" + (id * 100 + k), num_identification_agreements: k === 0 ? 0 : 3, num_identification_disagreements: 0, place_guess: ["Lanton, Gironde", "Ouessant, Finistère", "Camargue", "Baie de Somme"][k % 4], observed_on: "2025-0" + (k + 4) + "-1" + k,
      photos: q.photos ? [{ id: id * 10 + 5 + k, url: photo(id * 10 + 5 + (k % 4)), attribution: "(c) Naturaliste " + k + " (CC BY-NC)", license_code: "cc-by-nc" }] : undefined,
      sounds: q.sounds ? [{ id: k, file_url: `https://static.inaturalist.org/sounds/${id * 10 + k}.wav`, file_content_type: "audio/wav", attribution: "(c) Audio " + k + " (CC BY)", license_code: "cc-by" }] : undefined
    }));
    return json(route, { total_results: n, page: 1, per_page: n, results });
  }
  if (p === "/v1/identifications/similar_species") {
    const s = byId.get(+q.taxon_id);
    const r = s ? species.filter(x => x.f === s.f && x.id !== s.id).slice(0, 5).map((x, i) => ({ count: 40 - i * 5, taxon: taxonJson(x) })) : [];
    return json(route, { total_results: r.length, results: r });
  }
  if (p === "/v1/observations/histogram") {
    const id = +q.taxon_id, m = {};
    for (let i = 1; i <= 12; i++) m[i] = Math.round(50 + 45 * Math.sin((i + id % 7) / 1.9) + (id % 5) * 8);
    return json(route, { total_results: 12, results: { month_of_year: m } });
  }
  return json(route, { error: "non simulé : " + p }, 404);
}
module.exports = { handle, species };
