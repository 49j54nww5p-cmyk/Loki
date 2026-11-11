/* ---------- Dictée vocale (Web Speech API) ---------- */
const VOX_API = window.SpeechRecognition || window.webkitSpeechRecognition || null;
if (VOX_API && S.set.voice === undefined) S.set.voice = true;
const VOX = { rec: null, on: false, hold: false, timer: 0, down: 0, alts: [], live: "", q: null };
const voxIcon = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;

function voxNorm(s) {
  return " " + String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[-'’_.,;:!?«»"()]/g, " ").replace(/\s+/g, " ").trim() + " ";
}
function voxClean(s) { return voxNorm(s).replace(/ (l|le|la|les|un|une|des|du|de|d|c est|c|est|euh) /g, " ").replace(/ (l|le|la|les|un|une|des|du|de|d) /g, " ").replace(/\s+/g, " ").trim(); }
function voxLev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
/* score 0..1 entre ce qui est entendu et un nom */
function voxScore(heard, name) {
  const h = voxClean(heard), t = voxClean(name);
  if (!h || !t) return 0;
  if (h === t) return 1;
  if (t.length >= 4 && (" " + h + " ").includes(" " + t + " ")) return 0.95;
  if (h.length >= 5 && (" " + t + " ").includes(" " + h + " ")) return 0.8;
  const d = voxLev(h, t), r = 1 - d / Math.max(h.length, t.length);
  return d <= Math.max(1, Math.round(t.length * 0.3)) ? Math.max(r, 0.7) : r * 0.8;
}
function voxNames(q, c) {
  const el = document.querySelector(`#answers [data-k="${CSS.escape(c.key)}"] .lbl, #answers [data-k="${CSS.escape(c.key)}"] .nm`);
  return [c.fr, c.sci, c.label, c.t?.fr, c.t?.sci, el?.textContent].filter(x => x && typeof x === "string");
}
function voxMatch(q, alts) {
  const sc = (q.choices || []).map(c => ({ c, s: Math.max(0, ...alts.flatMap(a => voxNames(q, c).map(n => voxScore(a, n)))) })).sort((a, b) => b.s - a.s);
  if (!sc.length || sc[0].s < 0.68) return null;
  if (sc[1] && sc[0].s - sc[1].s < 0.08) return null;
  return sc[0].c;
}
const voxOk = q => VOX_API && S.set.voice !== false && q && !q.done && ["qcm", "tiles", "type"].includes(q.format) && q.kind !== "hand";

function voxApply(alts) {
  const q = SES?.q, txt = (alts[0] || "").trim();
  if (!q || q.done || q !== VOX.q) return;
  if (!txt) { toast("Je n'ai rien entendu."); return; }
  if (q.format === "type") {
    const inp = $("#ans"), f = $("#typer"); if (!inp || !f) return;
    inp.value = txt; inp.dispatchEvent(new Event("input", { bubbles: true }));
    f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    return;
  }
  const c = voxMatch(q, alts);
  const btn = c && document.querySelector(`#answers [data-act=pick][data-k="${CSS.escape(c.key)}"]`);
  if (btn) btn.click(); else toast(`Pas compris : “${txt}”`);
}

function voxUi(state) {
  const b = $("#voxBtn"), bub = $("#voxBub");
  if (b) b.classList.toggle("on", state === "on");
  if (bub) { bub.hidden = state !== "on"; if (state === "on") bub.querySelector("span").textContent = VOX.live || "J'écoute…"; }
}
function voxStart(hold) {
  if (VOX.on) return;
  const q = SES?.q; if (!voxOk(q)) return;
  let r; try { r = new VOX_API(); } catch (e) { toast("Dictée vocale indisponible."); return; }
  r.lang = "fr-FR"; r.interimResults = true; r.maxAlternatives = 5; r.continuous = !!hold;
  VOX.rec = r; VOX.on = true; VOX.hold = hold; VOX.alts = []; VOX.live = ""; VOX.q = q; VOX.err = "";
  r.onresult = e => {
    let live = "", fin = [];
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) { const a = []; for (let j = 0; j < res.length; j++) a.push(res[j].transcript); fin.push(a); }
      live += res[0].transcript + " ";
    }
    VOX.live = live.trim();
    if (fin.length) {
      /* alternatives de la dernière phrase + texte complet */
      VOX.alts = [VOX.live, ...fin[fin.length - 1]].filter((x, i, a) => x && a.indexOf(x) === i);
    }
    voxUi("on");
  };
  r.onerror = e => {
    VOX.err = e.error;
    if (e.error === "not-allowed" || e.error === "service-not-allowed") toast("Autorise le micro dans les réglages du téléphone pour dicter.", 4000);
    else if (e.error === "no-speech") toast("Je n'ai rien entendu.");
    else if (e.error !== "aborted") toast("Dictée interrompue (" + e.error + ").");
  };
  r.onend = () => {
    const alts = VOX.alts.length ? VOX.alts : VOX.live ? [VOX.live] : [];
    VOX.on = false; VOX.rec = null; voxUi("off");
    if (VOX.err && VOX.err !== "no-speech") return;
    if (alts.length) voxApply(alts); else if (!VOX.err) toast("Je n'ai rien entendu.");
  };
  voxUi("on");
  try { r.start(); } catch (e) { VOX.on = false; VOX.rec = null; voxUi("off"); }
}
function voxStop(abort) { const r = VOX.rec; if (!r) return; try { abort ? r.abort() : r.stop(); } catch (e) { /* déjà fini */ } }

function voxKill() {
  const r = VOX.rec; VOX.on = false; VOX.rec = null; VOX.pressed = false;
  if (r) { r.onresult = r.onerror = r.onend = null; try { r.abort(); } catch (e) { /* déjà fini */ } }
}
function voxOff() { voxKill(); $("#voxWrap")?.remove(); document.body.classList.remove("voxon"); }
function voxMount(q) {
  voxOff();
  voxKill();
  if (!voxOk(q)) return;
  if (!$(".view.quiz")) return;
  document.body.classList.add("voxon");
  document.body.insertAdjacentHTML("beforeend", `<div class="voxwrap" id="voxWrap"><div class="voxbub glass" id="voxBub" hidden><i class="voxwave" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i><span>J'écoute…</span></div><button class="voxbtn glass" id="voxBtn" type="button" aria-label="Dicter la réponse (maintenir pour parler)">${voxIcon}</button></div>`);
  const b = $("#voxBtn");
  b.addEventListener("pointerdown", e => {
    e.preventDefault();
    if (VOX.on) { voxStop(); return; }
    VOX.down = Date.now(); VOX.pressed = true;
    voxStart(false);
    clearTimeout(VOX.timer);
    VOX.timer = setTimeout(() => { if (VOX.pressed) { VOX.hold = true; b.classList.add("hold"); } }, 350);
  });
  const up = () => {
    if (!VOX.pressed) return; VOX.pressed = false; clearTimeout(VOX.timer); b.classList.remove("hold");
    if (VOX.hold && VOX.on) voxStop(); /* maintenu : relâcher = valider ; appui court : jusqu'au silence */
  };
  b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("pointerleave", up);
  b.addEventListener("contextmenu", e => e.preventDefault());
  b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); VOX.on ? voxStop() : voxStart(false); } });
}
{
  const _mq = mountQuestion;
  mountQuestion = function (q) { _mq(q); try { voxMount(q); } catch (e) { /* la dictée ne doit jamais casser le quiz */ } };
  const _st = settle;
  if (typeof settle === "function") settle = function (...a) { voxOff(); return _st.apply(this, a); };
  const _go = go;
  go = function (...a) { voxOff(); return _go.apply(this, a); };
  const _vs = VIEWS.settings;
  VIEWS.settings = d => {
    const html = _vs(d);
    const row = VOX_API
      ? `<div class="set"><span class="lab"><b>Dictée vocale</b><small>Un bouton micro pendant le quiz : maintiens pour parler, ou touche une fois et dis le nom.</small></span>${sw("voice")}</div>`
      : `<div class="set"><span class="lab"><b>Dictée vocale</b><small>Non disponible sur ce navigateur.</small></span></div>`;
    return html.replace(/(<div class="set"><span class="lab"><b>Animations réduites<\/b>.*?<\/div>)/, `$1\n    ${row}`);
  };
}
