/* ============================================================
   Plumage — sauvegarde en ligne, facultative et chiffrée
   Un code de 16 caractères, créé sur ton téléphone, sert à la fois d'adresse et de clé :
   le serveur ne reçoit qu'un bloc chiffré (AES-GCM) rangé sous l'empreinte du code.
   Sans le code, personne ne peut lire la sauvegarde, ni la retrouver.
   ============================================================ */
const CABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const cloudFmt = c => c.replace(/(.{4})(?=.)/g, "$1-");
const cloudClean = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
const cloudOk = () => !!(window.crypto && crypto.subtle);
async function cloudKeys(code) {
  const enc = new TextEncoder(), raw = enc.encode(cloudClean(code));
  const id = bytesB64(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode("plumage-save:" + cloudClean(code)))));
  const base = await crypto.subtle.importKey("raw", raw, "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode("plumage-save-v1"), iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  return { id, key };
}
const cloudPayload = () => JSON.stringify({ ...S, set: { ...S.set, xc: "" }, cloud: null, pack: null });
async function cloudPut(code) {
  const { id, key } = await cloudKeys(code);
  const zipped = await packZ(cloudPayload()), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(zipped)));
  const blob = new Uint8Array(iv.length + ct.length); blob.set(iv); blob.set(ct, iv.length);
  await netReq("PUT", "saves/" + id, { v: 1, t: Date.now(), d: bytesB64(blob) });
}
async function cloudGet(code) {
  const { id, key } = await cloudKeys(code);
  const r = await netReq("GET", "saves/" + id);
  if (!r || typeof r.d !== "string") return null;
  const blob = b64Bytes(r.d);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: blob.slice(0, 12) }, key, blob.slice(12));
  return { t: r.t, data: JSON.parse(await unpackZ(new TextDecoder().decode(plain))) };
}
let CLT = 0;
/* Après chaque partie : mise à jour discrète (au plus toutes les 2 minutes) */
function cloudAuto() {
  if (!S.cloud?.code || !netOn() || !cloudOk() || Date.now() - (S.cloud.last || 0) < 120000) return;
  clearTimeout(CLT);
  CLT = setTimeout(async () => { try { await cloudPut(S.cloud.code); S.cloud.last = Date.now(); save(); } catch (e) { /* hors ligne : plus tard */ } }, 1500);
}
async function cloudEnable() {
  if (!netOn()) { toast("La sauvegarde en ligne arrive bientôt."); return; }
  if (!cloudOk()) { toast("Ce navigateur ne sait pas chiffrer : sauvegarde en ligne impossible."); return; }
  const code = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => CABC[b % 32]).join("");
  try {
    await cloudPut(code);
    S.cloud = { code, last: Date.now() }; save(true);
    openCloudCode(true);
  } catch (e) { toast("Connexion impossible. Réessaie plus tard."); }
}
async function cloudNow() {
  if (!S.cloud?.code) return;
  try { await cloudPut(S.cloud.code); S.cloud.last = Date.now(); save(true); toast("Sauvegardé en ligne."); rerender(); }
  catch (e) { toast("Connexion impossible. Réessaie plus tard."); }
}
async function cloudOff() {
  const c = S.cloud?.code;
  if (c && netOn()) { try { const { id } = await cloudKeys(c); await netReq("DELETE", "saves/" + id); } catch (e) { /* rien */ } }
  S.cloud = null; save(true); closeLayer(); toast("Sauvegarde en ligne supprimée."); rerender();
}
function openCloudCode(fresh) {
  const c = S.cloud?.code; if (!c) return;
  openLayer(`<div class="panel cloudp" role="dialog" aria-label="Code de sauvegarde"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="in" style="padding-top:22px;text-align:center"><span class="inqic" style="--c:#14B8A6">${ic("shield")}</span>
  <h2 style="margin-top:12px">${fresh ? "Sauvegarde en ligne activée" : "Ton code de sauvegarde"}</h2>
  <p class="muted" style="font-size:14px">Note ce code quelque part (ou fais une capture d'écran). Sur un autre téléphone, il suffit de le taper pour tout récupérer.</p>
  <div class="ccode" id="ccode">${cloudFmt(c)}</div>
  <p class="cwarn">${ic("lock", "xs")} C'est la seule clé : sans lui, personne ne peut lire ta sauvegarde. Ne le donne à personne.</p>
  <button class="btn primary wide" data-act="ccopy">${ic("copy")}Copier le code</button>
  <button class="btn ghost wide" data-act="cloudoff" style="margin:10px 0 22px">${ic("trash")}Supprimer la sauvegarde en ligne</button></div></div>`, "cloudl");
}
function openCloudRestore() {
  openLayer(`<div class="panel cloudp" role="dialog" aria-label="Récupérer ma progression"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="in" style="padding-top:22px"><h2>Récupérer ma progression</h2>
  <p class="muted" style="font-size:14px">Tape le code de 16 caractères noté sur ton ancien téléphone. La progression de ce téléphone sera remplacée.</p>
  <form id="crest" autocomplete="off"><input id="ccin" class="ccin" type="text" inputmode="text" autocapitalize="characters" spellcheck="false" maxlength="19" placeholder="XXXX-XXXX-XXXX-XXXX" aria-label="Code de sauvegarde">
  <button class="btn primary wide" type="submit" style="margin:12px 0 22px">${ic("down")}Récupérer</button></form></div></div>`, "cloudl");
  setTimeout(() => $("#ccin")?.focus(), 200);
}
async function cloudRestore(input) {
  const code = cloudClean(input);
  if (code.length !== 16) { toast("Le code fait 16 caractères."); return; }
  if (!netOn()) { toast("La sauvegarde en ligne arrive bientôt."); return; }
  try {
    const r = await cloudGet(code);
    if (!r) { toast("Aucune sauvegarde pour ce code. Vérifie-le."); return; }
    if (!restoreFrom(r.data)) { toast("Sauvegarde illisible."); return; }
    S.cloud = { code, last: Date.now() }; save(true);
    closeLayer(); toast("Progression récupérée !"); go("home");
  } catch (e) { toast(e && e.name === "OperationError" ? "Code incorrect." : "Connexion impossible. Réessaie plus tard."); }
}
function cloudSettingsHtml() {
  const c = S.cloud;
  return c
    ? `<div class="set"><span class="lab"><b>Sauvegarde en ligne</b><small>Activée, chiffrée. Dernière : ${esc(ago(c.last))}. Mise à jour après tes parties.</small></span><button class="btn ghost" data-act="cloudcode">${ic("lock")}Code</button></div>
    <div class="set"><span class="lab"><b>Sauvegarder maintenant</b></span><button class="btn ghost" data-act="cloudnow">${ic("up")}Envoyer</button></div>`
    : `<div class="set"><span class="lab"><b>Sauvegarde en ligne</b><small>${netOn() ? "Facultative et chiffrée : un code de 16 caractères suffit pour tout retrouver sur un autre téléphone." : "Bientôt : un code de 16 caractères pour tout retrouver sur un autre téléphone."}</small></span><button class="btn ghost" data-act="cloudon">${ic("shield")}Activer</button></div>
    <div class="set"><span class="lab"><b>J'ai déjà un code</b><small>Récupère ta progression depuis un autre téléphone.</small></span><button class="btn ghost" data-act="cloudrest">${ic("down")}Récupérer</button></div>`;
}
