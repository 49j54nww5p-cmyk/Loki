/* ============================================================
   anim.js : mouvement scripté dans les pages. Chargé en dernier :
   emballe go, MOUNT, ACT, closeLayer sans changer leur effet.
   Rien de scripté en mode calme, téléphone lent, mouvement réduit,
   ni sous pilote automatique (tests) : l'appli se comporte alors
   exactement comme avant.
   ============================================================ */
(() => {
  const B = () => document.body.classList;
  const calmish = () => B().contains("calm") || B().contains("lite") || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const scripted = () => !calmish() && !navigator.webdriver;
  const entering = () => { const a = $("#app"); return a && a.dataset.tr !== "none"; };
  const ease = t => 1 - Math.pow(1 - t, 3);
  const after = (view, fn) => { const o = MOUNT[view]; MOUNT[view] = d => { const r = o ? o(d) : undefined; try { fn(d); } catch (e) { /* jamais bloquant */ } return r; }; };
  const index = (sel, root) => $$(sel, root).forEach((el, i) => el.style.setProperty("--ai", i));

  /* Compteur : chaque nombre d'un élément part de 0 ; le texte d'origine est remis à la fin */
  function countUp(el, ms = 700) {
    const nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const m = n.nodeValue.match(/\d[\d\s  ]*/); if (m) nodes.push({ n, orig: n.nodeValue, m: m[0].replace(/[\s  ]+$/, ""), v: +m[0].replace(/\D/g, "") }); }
    const todo = nodes.filter(x => x.v > 0 && x.v < 1e7);
    if (!todo.length) return;
    const t0 = performance.now(), show = (x, v) => { x.n.nodeValue = x.orig.replace(x.m, v >= 1000 ? fmt(v) : String(v)); };
    todo.forEach(x => show(x, 0));
    const tick = now => {
      const p = Math.min(1, (now - t0) / ms);
      if (!el.isConnected) return;
      if (p >= 1) { todo.forEach(x => { x.n.nodeValue = x.orig; }); return; }
      todo.forEach(x => show(x, Math.round(x.v * ease(p))));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Barre d'onglets : l'indicateur glisse ---------- */
  const nav = $("#nav");
  let ind = null;
  function placeInd() {
    if (!nav) return;
    if (!ind) { ind = document.createElement("span"); ind.className = "navind"; ind.setAttribute("aria-hidden", "true"); nav.appendChild(ind); }
    const on = nav.querySelector("button.on");
    if (!on) { ind.classList.remove("on"); return; }
    const x = on.offsetLeft + on.offsetWidth / 2 - 13;
    if (!ind.classList.contains("on")) { ind.style.transition = "none"; ind.style.transform = `translateX(${x}px)`; void ind.offsetWidth; ind.style.transition = ""; ind.classList.add("on"); }
    else ind.style.transform = `translateX(${x}px)`;
  }
  window.addEventListener("resize", () => { if (ind) { ind.classList.remove("on"); placeInd(); } });

  /* ---------- Navigation ---------- */
  const goOrig = go;
  go = function (v, data) {
    const r = goOrig.apply(this, arguments);
    try { placeInd(); } catch (e) { /* rien */ }
    return r;
  };
  try { placeInd(); } catch (e) { /* rien */ }

  /* ---------- Carnet ---------- */
  after("carnet", () => {
    const g = $("#cgrid");
    if (!g) return;
    delete g.dataset.anim;
    setTimeout(() => { if (g.isConnected && !g.dataset.anim) g.dataset.anim = "quiet"; }, 700);
  });
  const cfiltOrig = ACT.cfilt;
  if (cfiltOrig) ACT.cfilt = (el, e) => { const g = $("#cgrid"); if (g) g.dataset.anim = "filt"; const r = cfiltOrig(el, e); index("#cgrid .ctile"); return r; };
  document.addEventListener("input", e => { if (e.target && e.target.id === "csearch") { const g = $("#cgrid"); if (g) g.dataset.anim = "search"; } }, true);
  document.addEventListener("input", e => { if (e.target && e.target.id === "csearch") index("#cgrid .ctile"); });

  /* ---------- Progrès ---------- */
  after("progress", () => {
    index(".view.progress .chart rect");
    index(".view.progress .heat i");
    index(".view.progress .bdg:not(.off) .md");
    if (!scripted() || !entering()) return;
    $$(".view.progress .lring b, .view.progress .pnums b").forEach(el => countUp(el));
    $$(".view.progress details.pv[open] .stat b").forEach(el => countUp(el, 600));
  });
  const pvOrig = ACT.pvt;
  if (pvOrig) ACT.pvt = (el, e) => {
    const d = el.closest("details"), b = d && d.querySelector(":scope > .pvb");
    if (!d || !b || !scripted()) return pvOrig(el, e);
    if (d._anim) { d._anim.cancel(); d._anim = null; d.classList.remove("aclosing"); d.open = false; }
    if (!d.open) {
      const r = pvOrig(el, e);
      if (d.open) {
        const h = b.scrollHeight;
        b.style.overflow = "hidden";
        const a = b.animate([{ height: "0px" }, { height: h + "px" }], { duration: 380, easing: "cubic-bezier(.34,1.3,.64,1)" });
        a.onfinish = a.oncancel = () => { b.style.overflow = ""; };
        $$(".stat b", b).forEach(x => countUp(x, 600));
      }
      return r;
    }
    const h = b.scrollHeight, r = pvOrig(el, e);
    if (d.open) return r;
    /* état déjà enregistré « fermé » ; on garde le contenu visible le temps de le replier */
    d.open = true; d.classList.add("aclosing"); b.style.overflow = "hidden";
    const a = b.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 240, easing: "cubic-bezier(.4,0,.2,1)" });
    d._anim = a;
    a.onfinish = () => { d._anim = null; d.classList.remove("aclosing"); b.style.overflow = ""; d.open = false; };
    return r;
  };

  /* ---------- Réglages ---------- */
  const togOrig = ACT.toggle;
  if (togOrig) ACT.toggle = (el, e) => {
    const r = togOrig(el, e);
    el.classList.remove("abump"); void el.offsetWidth; el.classList.add("abump");
    el.addEventListener("animationend", () => el.classList.remove("abump"), { once: true });
    return r;
  };
  /* pastille glissante des boutons segmentés (data-act=set et tous les .seg du même genre) */
  function slideSeg(el, run) {
    const seg = el.parentElement;
    if (!scripted() || !seg || !seg.classList.contains("seg")) return run();
    const old = seg.querySelector("button.on");
    if (!old || old === el) return run();
    const r = run();
    const now = seg.querySelector("button.on");
    if (!now || now === old || !seg.isConnected) return r;
    seg.classList.add("amove");
    const pill = document.createElement("i");
    pill.className = "segpill";
    const br = getComputedStyle(now).borderRadius;
    pill.style.cssText = `top:${old.offsetTop}px;left:0;height:${old.offsetHeight}px;width:${old.offsetWidth}px;transform:translateX(${old.offsetLeft}px);border-radius:${br}`;
    seg.insertBefore(pill, seg.firstChild);
    void pill.offsetWidth;
    pill.style.width = now.offsetWidth + "px";
    pill.style.transform = `translateX(${now.offsetLeft}px)`;
    let done = false;
    const end = () => { if (done) return; done = true; pill.remove(); seg.classList.remove("amove"); };
    pill.addEventListener("transitionend", e => { if (e.propertyName === "transform") end(); });
    setTimeout(end, 520);
    return r;
  }
  const setOrig = ACT.set;
  if (setOrig) ACT.set = (el, e) => slideSeg(el, () => setOrig(el, e));

  /* ---------- Fenêtres : fermeture animée ---------- */
  const closeOrig = closeLayer;
  closeLayer = function () {
    const L = $("#layer");
    let ghost = null;
    if (L && !L.hidden && L.firstElementChild && scripted()) {
      try {
        ghost = L.cloneNode(true);
        ghost.classList.add("lghost");
        ghost.setAttribute("aria-hidden", "true");
        ghost.inert = true;
        $$("[id]", ghost).forEach(x => x.removeAttribute("id"));
        $$("audio,video", ghost).forEach(x => x.remove());
        const p = L.querySelector(".panel"), gp = ghost.querySelector(".panel");
        L.after(ghost);
        if (p && gp) gp.scrollTop = p.scrollTop;
      } catch (e) { ghost = null; }
    }
    const r = closeOrig.apply(this, arguments);
    if (ghost) {
      let gone = false;
      const kill = () => { if (!gone) { gone = true; ghost.remove(); } };
      ghost.addEventListener("animationend", e => { if (e.target === ghost) kill(); });
      setTimeout(kill, 320);
    }
    return r;
  };

  /* ---------- Parcours ---------- */
  let lastHere = null;
  after("grand", () => {
    const nx = typeof gNext === "function" ? gNext() : -1;
    if (lastHere != null && nx !== lastHere && scripted()) {
      const here = $(".groad li.here");
      if (here && nx > lastHere) here.classList.add("anew");
      const prev = $(`.groad .gnode[data-i="${lastHere}"]`)?.closest("li");
      if (prev && prev.classList.contains("done")) prev.classList.add("ajust");
    }
    lastHere = nx;
  });
  document.addEventListener("pointerdown", e => {
    const li = e.target.closest && e.target.closest(".groad li.lock, .gch.lock");
    if (!li || calmish()) return;
    li.classList.remove("anope"); void li.offsetWidth; li.classList.add("anope");
    setTimeout(() => li.classList.remove("anope"), 420);
    try { if (navigator.vibrate && !S.set.calm) navigator.vibrate([6, 30, 6]); } catch (err) { /* pas de vibreur */ }
  }, { passive: true });
})();
