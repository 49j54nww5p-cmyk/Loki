/* ============================================================
   Plumage — compteur de visites anonyme (GoatCounter)
   Pas de cookie, pas d'identifiant : juste « une page vue » ou « un événement ».
   Désactivable dans les Réglages (S.set.stats). Rien n'est envoyé hors du vrai site.
   ============================================================ */
const GC_URL = "https://plumage.goatcounter.com/count";
const gcOn = () => S.set.stats !== false && /github\.io$/.test(location.hostname) && !navigator.webdriver && navigator.onLine !== false;
function gcSend(path, title, ev) {
  if (!gcOn()) return;
  try {
    const q = new URLSearchParams({ p: path, t: title || path, s: `${screen.width},${screen.height},${Math.round(devicePixelRatio || 1)}`, rnd: Math.random().toString(36).slice(2) });
    if (ev) q.set("e", "true");
    if (!ev && document.referrer && !document.referrer.includes(location.host)) q.set("r", document.referrer);
    const img = new Image(); img.referrerPolicy = "no-referrer-when-downgrade"; img.src = `${GC_URL}?${q}`;
  } catch (e) { /* rien */ }
}
/* Une visite à l'ouverture, puis les onglets visités, une fois par session */
const GC_SEEN = new Set();
const _gcGo = go;
go = function (v, data) {
  _gcGo(v, data);
  if (["home", "carnet", "progress", "settings", "grand", "shop", "builder"].includes(v) && !GC_SEEN.has(v)) { GC_SEEN.add(v); gcSend(v === "home" ? "/" : "/" + v, { home: "Accueil", carnet: "Carnet", progress: "Progrès", settings: "Réglages", grand: "Parcours", shop: "Boutique", builder: "Sur mesure" }[v]); }
};
/* Événements de jeu : partie terminée (par type), étape du parcours réussie */
if (typeof endSession === "function") {
  const _gcFin = endSession;
  endSession = function (...a) {
    const ses = SES, r = _gcFin.apply(this, a);
    try { if (ses && ses.results && ses.results.length >= 3) gcSend("partie-" + (ses.kind || "quiz"), "Partie : " + (ses.kind || "quiz"), true); } catch (e) { /* rien */ }
    return r;
  };
}
/* Réglage : interrupteur dans le groupe Confort */
{
  const _gcVs = VIEWS.settings;
  VIEWS.settings = d => _gcVs(d).replace(/(<div class="set"><span class="lab"><b>Animations réduites<\/b>.*?<\/div>)/, `$1
    <div class="set"><span class="lab"><b>Compter ma visite</b><small>Compteur anonyme, sans cookie ni identifiant : aide à savoir combien de gens utilisent l'appli.</small></span><button class="switch ${S.set.stats !== false ? "on" : ""}" data-act="gcstat" role="switch" aria-checked="${S.set.stats !== false}" aria-label="Compter ma visite"></button></div>`);
  ACT.gcstat = () => { S.set.stats = S.set.stats === false; save(true); rerender(); };
}
