/* =========================================================
   Carnet : sorties, fiches, Plumage (ta collection), carte, exports
   ========================================================= */
let logPane=LS.get("huginn.logPane","ses");
function setLogPane(p){logPane=p;LS.set("huginn.logPane",p);$$("#segLog button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.v===p)));
  ["ses","ent","plu","map"].forEach(k=>$("#log"+k[0].toUpperCase()+k.slice(1)).hidden=k!==p);renderLog()}
$("#segLog").addEventListener("click",e=>{const b=e.target.closest("button");if(b)setLogPane(b.dataset.v)});

function renderLog(){if($("#tab-log").hidden)return;const ses=getSessions();
  $("#kpis").innerHTML=`<div><b>${Object.keys(LIFE).length}</b><span>liste de vie</span></div><div><b>${entries.length}</b><span>fiches</span></div><div><b>${ses.length}</b><span>sorties</span></div>`;
  if(logPane==="ses")renderSessions(ses);else if(logPane==="ent")renderEntries();else if(logPane==="plu")renderPlumage();else renderMap()}

/* sorties et nuits */
function renderSessions(ses){const el=$("#logSes"),nights=getNights();
  el.innerHTML=(nights.length?`<h3>Nuits complètes</h3><div class="sumlist">${nights.map((n,k)=>{const L=Object.values(n.sp),ok=L.filter(o=>o.max>=NIGHT_MIN).length;return`<button class="srow" data-night="${k}"><span class="tart" style="width:40px;height:40px;border-radius:10px">${svgIc("moon",20)}</span><span class="sn"><b>Nuit · ${fmtD(n.start)} ${fmtT(n.start)}</b><small>${n.end?dureeTxt(n.end-n.start):"en cours"} · ${ok} espèce${ok>1?"s":""} ≥ 80 % · ${L.length} au total</small></span><span class="sp2">›</span></button>`}).join("")}</div><h3>Sorties</h3>`:"")+(ses.length?`<div class="sumlist">${ses.slice(0,40).map((s,k)=>`<button class="srow" data-ses="${k}"><span class="tart" style="width:40px;height:40px;border-radius:10px">${svgIc(s.kind==="nocmig"?"moon":"bird",20)}</span><span class="sn"><b>${s.kind==="nocmig"?"Nuit":"Sortie"} · ${fmtD(s.start)} ${fmtT(s.start)}</b><small>${dureeTxt(s.end-s.start)} · ${s.list.length} espèce${s.list.length>1?"s":""} · ${esc(s.list.slice(0,3).map(x=>x.fr).join(", "))}${s.list.length>3?"…":""}</small></span><span class="sp2">›</span></button>`).join("")}</div>`
   :(nights.length?"":`<p class="empty">Tes sorties apparaissent ici quand tu arrêtes une écoute de plus de 15 secondes avec au moins une espèce.</p>`));
  el.querySelectorAll("[data-night]").forEach(b=>b.onclick=()=>openNight(getNights()[+b.dataset.night]));
  el.querySelectorAll("[data-ses]").forEach(b=>b.onclick=()=>openSummary(getSessions()[+b.dataset.ses]))}

/* fiches */
function entryHTML(e){const t=e.type?`<span class="tg k" style="--k:${/^chant/i.test(e.type)?"var(--song)":"var(--call)"}">${esc(e.type)}</span>`:"";
  const src=e.source==="auto"?`<span class="tg">nuit</span>`:e.source==="import"?`<span class="tg">importé</span>`:e.source==="demo"?`<span class="tg">démo</span>`:"";
  const m=e.m?`<span class="mono">${kHz(e.m.fpk)} kHz · ${e.m.dur<1?Math.round(e.m.dur*1000)+" ms":e.m.dur.toFixed(1)+" s"} · ${e.m.notes} note${e.m.notes>1?"s":""}</span>`:"";
  const g=e.lat!=null?`<a href="https://maps.apple.com/?ll=${e.lat},${e.lon}&q=Ramage" target="_blank" rel="noopener" class="mono">${e.lat.toFixed(5)}, ${e.lon.toFixed(5)}</a>`:`<span>sans GPS</span>`;
  return`<div class="entry" data-id="${e.id}"><div class="time">${fmtT(e.ts)}<br>${fmtD(e.ts)}</div>
  <div class="spn">${e.sp?esc(e.sp)+(e.la?` <span class="latin small">${esc(e.la)}</span>`:""):`<span class="muted">À identifier</span>`}</div>
  <div class="meta">${t}${src}${m}${g}</div>${e.ai?`<div class="meta">IA ${esc(e.ai.m)} : ${esc(e.ai.fr)}${e.ai.sc!=null?` ${Math.round(e.ai.sc*100)} %`:""}</div>`:""}${e.notes?`<div class="meta">${esc(e.notes)}</div>`:""}
  <div class="acts">${e.dur>0?`<button class="bplay" data-act="play" aria-label="Écouter">${PLAY}</button>`:""}<button class="btn ghost sm" data-act="star" aria-label="${e.star?"Retirer l'étoile":"Mettre une étoile"}">${e.star?"★":"☆"}</button><button class="btn sm" data-act="open">Ouvrir</button><button class="btn ghost sm" data-act="del">Supprimer</button></div></div>`}
function renderEntries(){const el=$("#logEnt");
  if(!entries.length){el.innerHTML=`<p class="empty">Ton carnet est vide. Valide une espèce en la glissant vers la droite, ou enregistre une capture depuis Analyse.</p>`;return}
  const today=new Date().toDateString(),rows=new Map();entries.filter(e=>new Date(e.ts).toDateString()===today).forEach(e=>{const k=e.sp||"À identifier";if(!rows.has(k))rows.set(k,{la:e.la,n:0,types:new Set()});const r=rows.get(k);r.n++;if(e.type)r.types.add(e.type)});
  el.innerHTML=(rows.size?`<div class="card"><h3>Aujourd'hui</h3><div class="tablewrap"><table>${Array.from(rows).sort((a,b)=>b[1].n-a[1].n).map(([k,r])=>`<tr><td><b>${esc(k)}</b>${r.la?` <span class="latin small">${esc(r.la)}</span>`:""}<div class="small muted">${Array.from(r.types).map(esc).join(" · ")||"—"}</div></td><td class="mono">${r.n}</td></tr>`).join("")}</table></div></div>`:"")
    +`<div>${entries.slice(0,200).map(entryHTML).join("")}</div>`}
$("#logEnt").addEventListener("click",async ev=>{const b=ev.target.closest("button");if(!b)return;const row=b.closest(".entry");if(!row)return;const id=row.dataset.id,e=entries.find(x=>x.id===id);if(!e)return;const act=b.dataset.act;
  if(act==="play")playEntry(id);
  if(act==="open"){const c=await getClip(id);if(!c){toast("Son introuvable sur cet appareil");return}loadClip({sr:c.sr,samples:toF32(c.pcm),title:e.sp||"À identifier",info:`${fmtD(e.ts)} ${fmtT(e.ts)} · ${e.dur.toFixed(1)} s`,source:e.source,ts:e.ts,entryId:id});showTab("analyse")}
  if(act==="del"){row.querySelector(".acts").innerHTML=`<span class="small">Supprimer cette fiche et son son ?</span><button class="btn live sm" data-act="yes">Supprimer</button><button class="btn ghost sm" data-act="no">Garder</button>`}
  if(act==="yes"){entries=entries.filter(x=>x.id!==id);saveEntries();delClip(id);if(editing===id){editing=null;$("#btnSave").textContent="Enregistrer au carnet"}renderLog();toast("Fiche supprimée")}
  if(act==="no")renderLog();
  if(act==="star"){e.star=!e.star;saveEntries();renderLog()}});
let galNode=null;
async function playEntry(id){try{if(galNode){galNode.stop();galNode=null}const c=await getClip(id);if(!c){toast("Son introuvable");return}ctx();const f=toF32(c.pcm),buf=ac.createBuffer(1,f.length,c.sr);buf.copyToChannel(f,0);galNode=ac.createBufferSource();galNode.buffer=buf;galNode.connect(ac.destination);galNode.start()}catch(err){toast("Lecture impossible")}}

/* Plumage : les espèces trouvées en couleur, celles d'ici à trouver en ombre */
const GROUPS=[["all","Tous",()=>true],["pass","Passereaux",o=>o==="Passeriformes"],["rap","Rapaces",o=>/Accipitriformes|Falconiformes/.test(o)],["eau","Eau et rivage",o=>/Charadriiformes|Anseriformes|Pelecaniformes|Gruiformes|Podicipediformes|Suliformes|Ciconiiformes|Gaviiformes|Procellariiformes|Phoenicopteriformes/.test(o)],["nuit","Nuit",o=>/Strigiformes|Caprimulgiformes/.test(o)],["autres","Autres",o=>!/Passeriformes|Accipitriformes|Falconiformes|Charadriiformes|Anseriformes|Pelecaniformes|Gruiformes|Podicipediformes|Suliformes|Ciconiiformes|Gaviiformes|Procellariiformes|Phoenicopteriformes|Strigiformes|Caprimulgiformes/.test(o)]];
const BST={g:"all",all:false};
function renderPlumage(){const el=$("#logPlu");if(!el||el.hidden||$("#tab-log").hidden)return;
  if(!AI.labels){el.innerHTML=`<p class="empty">Ton plumage apparaît quand l'IA est prête.</p>`;return}
  const order=i=>AI.labels[i][4]||"",grp=GROUPS.find(g=>g[0]===BST.g)||GROUPS[0],here=[];for(let i=0;i<AI.mask.length;i++)if(AI.mask[i])here.push(i);
  const lifeIdx=Object.keys(LIFE).map(la=>AI.sciIdx.get(la)).filter(i=>i!=null),list=Array.from(new Set(here.concat(lifeIdx))).filter(i=>grp[2](order(i)));
  const found=list.filter(i=>LIFE[AI.labels[i][0]]).sort((a,b)=>LIFE[AI.labels[b][0]].ts-LIFE[AI.labels[a][0]].ts),todo=list.filter(i=>!LIFE[AI.labels[i][0]]).sort((a,b)=>((AI.geoP&&AI.geoP[b])||0)-((AI.geoP&&AI.geoP[a])||0));
  const tot=here.filter(i=>grp[2](order(i))).length||list.length,got=found.filter(i=>AI.mask[i]).length,tiles=found.concat(todo),shown=BST.all?tiles:tiles.slice(0,45);
  el.innerHTML=`<div class="bhead"><div class="t"><b>Plumage</b><span>les espèces que tu as entendues</span></div><div class="bring"><b>${got}</b><span>/ ${tot} ici</span></div></div>
   <div class="bfil">${GROUPS.map(g=>`<button data-g="${g[0]}" aria-pressed="${g[0]===BST.g}">${g[1]}</button>`).join("")}</div>
   <div class="bgrid">${shown.map(i=>{const a=AI.labels[i],fr=a[1]||a[2],l=LIFE[a[0]];return l?`<button class="btile" data-bi="${i}">${imgPh(a[0],"s")}<span class="bt"><b>${esc(fr)}</b><small>${fmtD(l.ts)}</small></span></button>`:`<button class="btile todo" data-bi="${i}" aria-label="Espèce à trouver"><span class="bt"><b>${esc(fr)}</b><small>à trouver</small></span></button>`}).join("")}</div>
   ${tiles.length>shown.length?`<button class="btn ghost" id="bstAll">Voir les ${tiles.length} espèces</button>`:""}`;
  el.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{BST.g=b.dataset.g;BST.all=false;renderPlumage()});const ba=$("#bstAll");if(ba)ba.onclick=()=>{BST.all=true;renderPlumage()};
  el.querySelectorAll("[data-bi]").forEach(b=>b.onclick=()=>openSpecies(+b.dataset.bi))}

/* carte des contacts et des sorties */
let map=null,layer=null;const SEASONS={0:null,1:[3,4,5],2:[6,7,8],3:[9,10,11],4:[12,1,2]};
function mapPts(){const sp=$("#mapSp").value,se=SEASONS[S.mapSeason|0],ok=ts=>!se||se.includes(new Date(ts).getMonth()+1);
  const pts=entries.filter(e=>e.lat!=null&&ok(e.ts)&&(!sp||e.la===sp||e.sp===sp));
  const ses=sp?[]:getSessions().filter(s=>s.lat!=null&&ok(s.start)).map(s=>({lat:s.lat,lon:s.lon,sp:(s.kind==="nocmig"?"Nuit":"Sortie")+" · "+s.list.length+" espèces",type:"",ts:s.start,ses:true}));return pts.concat(ses)}
function renderMap(){const all=entries.filter(e=>e.lat!=null),sps=Array.from(new Map(all.filter(e=>e.sp).map(e=>[e.la||e.sp,e.sp])).entries()).sort((a,b)=>a[1].localeCompare(b[1],"fr")),cur=$("#mapSp").value;
  $("#mapSp").innerHTML=`<option value="">Toutes les espèces + sorties</option>`+sps.map(([k,v])=>`<option value="${esc(k)}">${esc(v)}</option>`).join("");$("#mapSp").value=cur;
  $$("#mapSeason button").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.v===(S.mapSeason|0))));
  const pts=mapPts(),el=$("#map");$("#mapEmpty").hidden=!!pts.length;el.hidden=!pts.length||!window.L;if(el.hidden||$("#logMap").hidden)return;
  if(!map){map=L.map(el,{zoomControl:true,attributionControl:true});L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);layer=L.layerGroup().addTo(map)}
  layer.clearLayers();const a=cssVar("--accent"),c=cssVar("--call");
  pts.forEach(e=>L.circleMarker([e.lat,e.lon],{radius:e.ses?10:7,color:e.ses?c:a,weight:2,fillColor:e.ses?c:a,fillOpacity:e.ses?.12:.45}).bindPopup(`<b>${esc(e.sp||"À identifier")}</b><br>${esc(e.type||"")} · ${fmtT(e.ts)}`).addTo(layer));
  setTimeout(()=>{map.invalidateSize();map.fitBounds(L.latLngBounds(pts.map(e=>[e.lat,e.lon])).pad(.3),{maxZoom:17})},50)}
$("#mapSp").onchange=renderMap;$("#mapSeason").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;S.mapSeason=+b.dataset.v;saveS();renderMap()});

/* exports */
function csvCell(v){v=v==null?"":String(v);return/[",;\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v}
$("#btnCsv").onclick=()=>{if(!entries.length){toast("Carnet vide");return}const h=["id","date","heure","latitude","longitude","precision_m","espece","nom_latin","type_vocalise","notes","source","duree_s","freq_pic_hz","freq_min_hz","freq_max_hz","duree_son_s","nb_notes","ia_modele","ia_espece","ia_score"];
  const rows=entries.map(e=>{const d=new Date(e.ts);return[e.id,d.toISOString().slice(0,10),d.toTimeString().slice(0,8),e.lat,e.lon,e.acc!=null?Math.round(e.acc):"",e.sp,e.la,e.type,e.notes,e.source,e.dur!=null?e.dur.toFixed(2):"",e.m?Math.round(e.m.fpk):"",e.m?Math.round(e.m.fmin):"",e.m?Math.round(e.m.fmax):"",e.m?e.m.dur.toFixed(3):"",e.m?e.m.notes:"",e.ai?e.ai.m:"",e.ai?e.ai.fr:"",e.ai&&e.ai.sc!=null?e.ai.sc.toFixed(2):""].map(csvCell).join(",")});
  saveFile(`ramage_carnet_${new Date().toISOString().slice(0,10)}.csv`,new Blob(["﻿"+h.join(",")+"\n"+rows.join("\n")],{type:"text/csv"}))};
$("#btnGeo").onclick=()=>{const pts=entries.filter(e=>e.lat!=null);if(!pts.length){toast("Aucune fiche géolocalisée");return}
  const gj={type:"FeatureCollection",features:pts.map(e=>({type:"Feature",geometry:{type:"Point",coordinates:[e.lon,e.lat]},properties:{id:e.id,date:new Date(e.ts).toISOString(),espece:e.sp,nom_latin:e.la,type_vocalise:e.type,notes:e.notes,source:e.source,precision_m:e.acc!=null?Math.round(e.acc):null,freq_pic_hz:e.m?Math.round(e.m.fpk):null}}))};
  saveFile(`ramage_carnet_${new Date().toISOString().slice(0,10)}.geojson`,new Blob([JSON.stringify(gj,null,1)],{type:"application/geo+json"}))};
