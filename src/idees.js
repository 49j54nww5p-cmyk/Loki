/* ============================================================
   Plumage — boîte à idées : suggestions, bugs, erreurs sur un oiseau
   Les messages partent vers la base de l'appli, où seul le responsable peut les lire
   (personne ne peut lire les idées des autres). Sans serveur branché, ils attendent sur le téléphone.
   ============================================================ */
const IDK = [["idee", "Une idée", "bulb"], ["bug", "Un bug", "x"], ["oiseau", "Une erreur sur un oiseau", "bird"], ["autre", "Autre chose", "edit"]];
const IDEA = { k: "idee" };
function openIdeas(k) {
  IDEA.k = k || IDEA.k || "idee";
  const mine = (S.ideas || []).slice(0, 5);
  openLayer(`<div class="panel ideap" role="dialog" aria-label="Boîte à idées"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="in" style="padding-top:22px"><span class="eyebrow">${ic("bulb", "xs")} Boîte à idées</span><h2 style="margin-top:8px">Aide à améliorer Plumage</h2>
  <p class="muted" style="font-size:14px;margin:4px 0 0">Une envie, un bug, un oiseau mal nommé : tout est lu.</p>
  <div class="idk">${IDK.map(([v, l, i]) => `<button class="opt-btn ${IDEA.k === v ? "on" : ""}" data-act="idk" data-v="${v}">${ic(i)}${l}</button>`).join("")}</div>
  <form id="ideaf" autocomplete="off">
    <textarea id="idtxt" maxlength="1000" rows="5" placeholder="${IDEA.k === "bug" ? "Ce qui s'est passé, et sur quel écran…" : IDEA.k === "oiseau" ? "Quel oiseau, et qu'est-ce qui cloche (nom, photo, son, critère)…" : "Ton idée, en quelques mots…"}"></textarea>
    <label class="fld"><span>Pour te répondre (facultatif)</span><input id="idctc" type="text" maxlength="80" placeholder="pseudo, mail… ou rien"></label>
    <button class="btn primary wide" type="submit" style="margin-top:12px">${ic("arrow")}Envoyer</button>
  </form>
  <p class="muted note">Partent avec ton message : son type, la version de l'appli (v${esc(APP_VERSION)}) et ce que tu mets dans « Pour te répondre ». Rien d'autre.</p>
  ${mine.length ? `<div class="sec">${ic("check")}Tes derniers envois</div><div class="idmine">${mine.map(x => `<div><b>${esc((IDK.find(k => k[0] === x.k) || IDK[0])[1])}</b><span>${esc(clip(x.txt, 90))}</span><small>${esc(ago(x.t))}${x.sent ? "" : " · en attente d'envoi"}</small></div>`).join("")}</div>` : ""}
  <div style="height:18px"></div></div></div>`, "ideal");
}
async function ideaSend() {
  const txt = cleanTxt($("#idtxt")?.value, 1000), ctc = cleanTxt($("#idctc")?.value, 80);
  if (txt.length < 3) { toast("Écris quelques mots d'abord."); $("#idtxt")?.focus(); return; }
  const today = (S.ideas || []).filter(x => Date.now() - x.t < DAY).length;
  if (today >= 6) { toast("Merci ! Ça fait déjà beaucoup aujourd'hui : reviens demain."); return; }
  const it = { id: Date.now().toString(36) + rid(6), k: IDEA.k, txt, c: ctc, t: Date.now(), v: APP_VERSION, sent: false };
  S.ideas = [it, ...(S.ideas || [])].slice(0, 30); save(true);
  closeLayer();
  const ok = await ideaFlush();
  toast(ok ? "Merci ! C'est bien arrivé." : "Merci ! Ton message partira dès que le serveur de l'appli sera branché.");
}
/* Envoie ce qui attend (au lancement et après chaque envoi) */
async function ideaFlush() {
  if (!netOn()) return false;
  let all = true;
  for (const it of (S.ideas || []).filter(x => !x.sent)) {
    try { await netReq("PUT", "ideas/" + it.id, { k: it.k, txt: it.txt, c: it.c || "", v: it.v, t: it.t }); it.sent = true; }
    catch (e) { all = false; break; }
  }
  save();
  return all;
}
