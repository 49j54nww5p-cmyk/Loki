/* ============================================================
   Plumage — niveaux : 100 oiseaux, paliers de 10, roue de titre
   Le joueur choisit son titre parmi les oiseaux déjà atteints ;
   au-delà du niveau 100, il peut écrire un titre libre.
   ============================================================ */
function titreSetHtml() {
  const L = level();
  return `<div class="sec">${ic("trophy")}Niveau</div>
  <div class="group"><div class="set"><span class="lvb">${L.n}</span><span class="lab"><b>${esc(L.title)}</b><small>Palier ${esc(L.tier)} · ${fmt(L.cur)} / ${fmt(L.need)} XP vers le niveau ${L.n + 1}</small></span><button class="btn ghost" data-act="titre">Changer</button></div></div>`;
}
function openTitre() {
  const L = level(), max = Math.min(L.n, 100), cur = Number.isInteger(S.set.titre) ? S.set.titre : max;
  const rows = NIV.map((b, i) => { const n = i + 1, ok = n <= max; return `<li data-n="${n}" class="${ok ? "" : "lk"}${n === cur ? " on" : ""}"><span class="wn">${n}</span><span class="wb">${ok ? esc(b) : "???"}</span>${n % 10 === 1 ? `<small>${esc(TIERS[(n - 1) / 10])}</small>` : ""}</li>`; }).join("");
  openLayer(`<div class="panel titp" role="dialog" aria-label="Choisir mon titre"><button class="icon-btn close" data-act="close" aria-label="Fermer">${ic("x")}</button>
  <div class="in" style="padding-top:22px"><h2>Mon titre</h2><p class="muted">Fais tourner la roue : tu peux porter le nom de n'importe quel oiseau déjà atteint.</p>
  <div class="wheel"><ul id="wheel">${rows}</ul><div class="wsel"></div></div>
  ${L.n >= 100 ? `<label class="fld"><span>Titre libre (niveau 100 atteint)</span><input id="titrelib" maxlength="24" value="${typeof S.set.titre === "string" ? esc(S.set.titre) : ""}" placeholder="ex. Roi du Bassin"></label>` : `<p class="muted" style="font-size:13px">Au niveau 100, tu pourras écrire ton propre titre.</p>`}
  <button class="btn primary wide" data-act="titreok" style="margin:12px 0 22px">Garder ce titre</button></div></div>`, "titl");
  const w = $("#wheel"), it = w && w.querySelector(`li[data-n="${cur}"]`);
  if (it) w.scrollTop = it.offsetTop - w.clientHeight / 2 + it.offsetHeight / 2;
  w && w.addEventListener("scroll", () => {
    clearTimeout(w._t); w._t = setTimeout(() => {
      const mid = w.scrollTop + w.clientHeight / 2; let best = null, d = 1e9;
      w.querySelectorAll("li").forEach(li => { const x = Math.abs(li.offsetTop + li.offsetHeight / 2 - mid); if (x < d) { d = x; best = li; } });
      w.querySelectorAll("li.on").forEach(li => li.classList.remove("on")); best && best.classList.add("on");
    }, 60);
  }, { passive: true });
}
ACT.titre = () => openTitre();
ACT.titreok = () => {
  const lib = $("#titrelib"), v = lib ? cleanName(lib.value).slice(0, 24) : "";
  const on = $("#wheel li.on"), n = on ? +on.dataset.n : 0, max = Math.min(level().n, 100);
  if (v) S.set.titre = v;
  else if (n >= 1 && n <= max) S.set.titre = n;
  else { toast("Cet oiseau n'est pas encore atteint."); return; }
  save(); closeLayer(); rerender(); toast("Titre : " + level().title);
};
