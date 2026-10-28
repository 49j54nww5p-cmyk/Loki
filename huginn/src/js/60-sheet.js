/* =========================================================
   Feuilles : fiche d'une espèce entendue, résumé de sortie, rapport de nuit
   ========================================================= */
function openSheet(html,cls){const sh=$("#sheet");sh.className="sheet "+(cls||"");$("#sheetBody").innerHTML=html;sh.hidden=false;requestAnimationFrame(()=>sh.classList.add("open"));$("#sheetBody").scrollTop=0}
function closeSheet(){const sh=$("#sheet");sh.classList.remove("open");setTimeout(()=>{sh.hidden=true;$("#sheetBody").innerHTML=""},220)}
$("#sheetClose").onclick=closeSheet;$("#sheet").addEventListener("click",e=>{if(e.target.id==="sheet")closeSheet()});

function kindLine(k){if(!k)return`<p class="small muted">Type de son : pas encore déterminé.</p>`;
  return`<p class="small"><span class="tg k${k.sure?"":" unsure"}" style="--k:${kindVar(k.k)}">${esc(k.k.toUpperCase())}${k.sure?"":" ?"}</span> ${k.src==="réf"?`d'après les ${k.n} références les plus proches${k.sure?"":", sans accord net"}`:"d'après la forme du son (notes, durée) : à confirmer"}</p>`}
async function openFocus(i){const r=LIVE.get(i);if(!r)return;const rk=rarity(i),thr=thrNow();
  const perchTxt=AI.ready.perch?(r.perch?Math.round(r.perch*100)+" %":"pas confirmé"):"non chargé";
  const agree=r.perch>=.3&&r.bn>=thr*.9?`<div class="agreeb">${svgIc("two",18)} Les deux IA sont d'accord</div>`:AI.ready.perch&&!r.viaPerch?`<div class="agreeb" style="color:var(--muted)">Perch v2 ne l'a pas (encore) confirmé</div>`:"";
  openSheet(`<div class="hero">${imgPh(r.la,"m")}<div class="shade"></div><div class="hd"><div class="tags">${r.lifer?`<span class="tg new">NOUVEAU</span>`:""}${rk?`<span class="tg rare">${rk[1]}</span>`:""}</div><h2 class="fname">${esc(r.fr)}</h2><p class="latin">${esc(r.la)}</p></div></div>
    <div class="fbody">
      <div class="duo"><div><b>${r.bn?Math.round(r.bn*100)+" %":"—"}</b><span>BirdNET+</span></div><div><b>${perchTxt.endsWith("%")?perchTxt:"—"}</b><span>Perch v2${perchTxt.endsWith("%")?"":" · "+perchTxt}</span></div>${agree}</div>
      <div id="fKind">${kindLine(r.kind)}</div>${isRareOut(i)?`<div class="trapbox"><b>Rareté possible</b><span>Cette espèce n'est pas attendue ici cette semaine d'après le géomodèle BirdNET+. Ramage l'affiche parce que BirdNET+ est très sûr de lui. Capture le son, vérifie la référence et documente l'observation (enregistrement, photo) avant de la valider.</span></div>`:""}
      <div class="pair"><figure><canvas class="sono" id="fMe"></canvas><figcaption>Ton meilleur passage · ×${r.n} · ${ago(Date.now()-r.last)}</figcaption></figure><figure><canvas class="sono" id="fRef"></canvas><figcaption id="fRefCap">Référence : préparation…</figcaption></figure></div>
      <div class="vchips" id="fVar"></div><p class="honest" id="fHonest" hidden></p>
      ${traps(r.la).map(t=>`<div class="trapbox"><b>${t.kind==="imit"?"Imitation possible":"Sosie : "+esc(t.alt)}</b><span>${esc(t.txt)}</span></div>`).join("")}
      <div class="acts3"><button class="btn ghost" id="fNo">← Écarter</button><button class="bplay" id="fPlay" aria-label="Écouter la référence">${PLAY}</button><button class="btn primary" id="fOk">${r.validated?"Au carnet ✓":"Valider →"}</button></div>
      <button class="btn ghost" id="fAn">Capturer et analyser en détail</button>
      <p class="credit">${PH[r.la]&&PH[r.la].a?"Photo "+esc(PH[r.la].a)+" · iNaturalist":""}</p></div>`,"focus");
  $("#fPlay").onclick=()=>playRefSp(r.la);$("#fOk").onclick=()=>{if(!r.validated){validateLive(i);closeSheet()}};
  $("#fNo").onclick=()=>{rejectLive(i);closeSheet();renderLive()};
  $("#fAn").onclick=()=>{closeSheet();if(running)capture({fr:r.fr,la:r.la,sc:r.max,m:"BirdNET+"});else toast("Lance l'écoute pour capturer")};
  if(r.seg)requestAnimationFrame(()=>drawSono($("#fMe"),miniSono(r.seg)));
  try{const rec=await refsFor(r.la,(k,n)=>{const c=$("#fRefCap");if(c)c.textContent=`Référence : ${k}/${n}…`}),cap=$("#fRefCap");if(!cap)return;
    if(!rec.items.length){cap.textContent="Pas de référence libre sur Wikimedia Commons";return}
    let best=rec.items.slice().sort((a,b)=>b.sc-a.sc)[0],sim=null;if(r.emb){const s=rec.items.map(it=>({it,s:dot(r.emb,it.e)})).sort((a,b)=>b.s-a.s);best=s[0].it;sim=s[0].s}
    updateKind(r);$("#fKind").innerHTML=kindLine(r.kind);renderLive();
    cap.textContent=`Réf. ${best.kind||"type ?"}${sim!=null?" · ressemblance "+Math.round(Math.max(0,sim)*100)+" %":""}`;drawSono($("#fRef"),best.sono);
    const mine=r.seg?measure(stftOf(r.seg,32000),null):null,same=r.kind?rec.items.filter(it=>it.kind===r.kind.k):[],pool=same.length>=3?same:rec.items;
    $("#fVar").innerHTML=varianceChips(mine&&!mine.empty?mine:null,pool);const h=$("#fHonest");h.hidden=false;h.textContent=honestNote(pool.length)+(same.length>=3?` (${r.kind.k} seulement)`:"")}
  catch(e){const c=$("#fRefCap");if(c)c.textContent="Références indisponibles (réseau ?)"}}

/* ---- résumé de sortie ---- */
function summaryText(rec){return`Ramage · ${rec.kind==="nocmig"?"nuit":"sortie"} du ${fmtD(rec.start)} ${fmtT(rec.start)} (${dureeTxt(rec.end-rec.start)})\n${rec.list.length} espèce${rec.list.length>1?"s":""} :\n`+rec.list.map(s=>`- ${s.fr}${s.kind?" ("+s.kind+")":""}${s.n>1?" ×"+s.n:""}`).join("\n")}
function openSummary(rec){if(!rec)return;const newc=rec.list.filter(s=>s.lifer).length;
  openSheet(`<div class="sumhead"><span class="eyebrow">${rec.kind==="nocmig"?"Rapport de la nuit":"Sortie terminée"}</span><h2>${fmtD(rec.start)} · ${fmtT(rec.start)}</h2>
    <div class="kpis"><div><b>${dureeTxt(rec.end-rec.start)}</b><span>durée</span></div><div><b>${rec.list.length}</b><span>espèces</span></div><div><b>${newc}</b><span>nouvelles</span></div></div></div>
    ${rec.hours?nightChart(rec.hours):""}<div class="sumlist">${rec.list.map(s=>`<div class="srow">${imgPh(s.la,"s")}<span class="sn"><b>${esc(s.fr)}${s.lifer?` <span class="tg new">NOUVEAU</span>`:""}</b><small>${[s.kind,s.times].filter(Boolean).map(esc).join(" · ")}</small></span><span class="sp2">${s.n>1?"×"+s.n:""} ${s.max!=null?Math.round(s.max*100)+" %":""}</span></div>`).join("")}</div>
    <div class="row" style="margin-top:12px"><button class="btn primary" id="sumShare">Partager</button><button class="btn" id="sumVal">Valider ≥ 70 % au carnet</button></div>`,"summary");
  $("#sumShare").onclick=async()=>{const t=summaryText(rec);try{if(navigator.share){await navigator.share({text:t});return}}catch(e){if(e&&e.name==="AbortError")return}try{await navigator.clipboard.writeText(t);toast("Résumé copié")}catch(e){toast("Partage indisponible")}};
  $("#sumVal").onclick=()=>{let k=0;rec.list.filter(s=>s.max>=.7&&s.la).forEach(s=>{if(entries.some(e=>e.la===s.la&&e.ts>=rec.start))return;entries.unshift({id:uid(),ts:rec.start,lat:rec.lat,lon:rec.lon,acc:null,sp:s.fr,la:s.la,type:KIND_TYPE[s.kind]||"",notes:"",source:rec.kind==="nocmig"?"auto":"micro",dur:0,m:null,ai:{m:"BirdNET+",fr:s.fr,la:s.la,sc:s.max}});addLife(s.fr,s.la);k++});
    saveEntries();renderLog();toast(k?`${k} espèce${k>1?"s":""} ajoutée${k>1?"s":""} au carnet`:"Rien de nouveau à ajouter")}}

/* ---- rapport de la nuit ---- */
function hoursOf(ev,start,end){const out=[],t0=new Date(start);t0.setMinutes(0,0,0);for(let t=t0.getTime();t<=end;t+=3600e3){const d=new Date(t);out.push({h:d.getHours(),n:ev.filter(e=>e.ts>=t&&e.ts<t+3600e3).length})}return out.slice(0,24)}
function nightChart(hours){const W=340,H=110,n=hours.length,mx=Math.max(1,...hours.map(h=>h.n)),bw=(W-30)/n;
  return`<div class="chartwrap"><svg viewBox="0 0 ${W} ${H+22}" class="nchart" role="img" aria-label="Passages par heure"><line x1="24" y1="${H}" x2="${W}" y2="${H}" class="ax"></line><text x="20" y="10" class="tl" text-anchor="end">${mx}</text>${hours.map((h,k)=>{const bh=h.n/mx*(H-14),x=26+k*bw;return`<rect x="${(x+1).toFixed(1)}" y="${(H-bh).toFixed(1)}" width="${Math.max(2,bw-3).toFixed(1)}" height="${bh.toFixed(1)}" rx="2" class="${h.n===mx?"bar top":"bar"}"></rect>${k%2===0?`<text x="${(x+bw/2).toFixed(1)}" y="${H+15}" class="tl" text-anchor="middle">${h.h}h</text>`:""}`}).join("")}</svg></div>`}
function nocmigReport(since){const ev=entries.filter(e=>e.source==="auto"&&e.ts>=since);if(!ev.length){toast("Nuit calme : aucun événement");return}
  const g=new Map();ev.forEach(e=>{const k=e.ai?e.ai.la:"?",o=g.get(k)||{fr:e.ai?e.ai.fr:"Non identifié",la:e.ai?e.ai.la:"",n:0,max:0,t:[]};o.n++;o.max=Math.max(o.max,e.ai?e.ai.sc:0);o.t.push(fmtT(e.ts));g.set(k,o)});
  const rec={id:uid(),kind:"nocmig",start:since,end:Date.now(),hours:hoursOf(ev,since,Date.now()),lat:lastFix?lastFix.lat:null,lon:lastFix?lastFix.lon:null,
    list:Array.from(g.values()).sort((a,b)=>b.n-a.n).map(o=>({fr:o.fr,la:o.la,n:o.n,max:o.max||null,kind:"",times:o.t.slice(0,6).join(", ")+(o.t.length>6?"…":""),lifer:isLifer(o.la)}))};
  saveSession(rec);openSummary(rec)}

/* ---- fiche d'une espèce de ta collection ---- */
function openSpecies(i){const a=AI.labels[i],fr=a[1]||a[2],la=a[0],l=LIFE[la],rk=rarity(i),mine=entries.filter(e=>e.la===la);
  openSheet(`<div class="hero">${imgPh(la,"m")}<div class="shade"></div><div class="hd"><div class="tags">${l?`<span class="tg ok">TROUVÉ</span>`:`<span class="tg">À TROUVER</span>`}${rk?`<span class="tg rare">${rk[1]}</span>`:""}</div><h2 class="fname">${esc(fr)}</h2><p class="latin">${esc(la)}</p></div></div>
    <div class="fbody"><div class="kpis"><div><b>${mine.length}</b><span>fiches</span></div><div><b style="font-size:15px">${l?fmtD(l.ts):"—"}</b><span>1re fois</span></div><div><b>${AI.geoP&&AI.geoP[i]!=null?Math.round(AI.geoP[i]*100)+"%":"—"}</b><span>présence ici</span></div></div>
      ${traps(la).map(t=>`<div class="trapbox"><b>${t.kind==="imit"?"Imitation possible":"Sosie : "+esc(t.alt)}</b><span>${esc(t.txt)}</span></div>`).join("")}
      <div class="row"><button class="btn primary" id="spRef">▶ Écouter la référence</button>${mine.some(e=>e.dur>0)?`<button class="btn" id="spMine">▶ Ton meilleur son</button>`:""}</div>
      <p class="credit">${PH[la]&&PH[la].a?"Photo "+esc(PH[la].a)+" · iNaturalist":""}</p></div>`,"focus");
  $("#spRef").onclick=()=>playRefSp(la);const m=$("#spMine");if(m)m.onclick=()=>{const best=mine.filter(e=>e.dur>0).sort((x,y)=>(y.star?1:0)-(x.star?1:0)||((y.ai&&y.ai.sc)||0)-((x.ai&&x.ai.sc)||0))[0];playEntry(best.id)}}
