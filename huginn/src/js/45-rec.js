/* =========================================================
   Enregistrement continu : dès que l'écoute démarre, tout est enregistré
   (AAC ≈ 43 Mo par heure, rangé par blocs de 30 s, une pièce par heure).
   À l'arrêt, Ramage demande si on garde l'enregistrement complet.
   La nuit complète réutilise le même enregistrement.
   ========================================================= */
const REC={on:false,id:null,start:0,parts:[],r:null,t:0,err:""};
const getRecs=()=>LS.get("huginn.recs",[]);
function saveRecs(a){LS.set("huginn.recs",a.slice(0,100))}
function recMime(){if(!window.MediaRecorder)return null;for(const m of["audio/mp4;codecs=mp4a.40.2","audio/mp4","audio/aac","audio/webm;codecs=opus","audio/webm"])try{if(MediaRecorder.isTypeSupported(m))return m}catch(e){}return""}
function recStart(){if(REC.on||!stream||S.recAll===false)return;const mime=recMime();if(mime==null){REC.err="ce navigateur ne sait pas enregistrer";return}
  REC.on=true;REC.id="r"+uid();REC.start=Date.now();REC.parts=[];REC.err="";recPart();$("#recDot").hidden=false}
function recPart(){if(!REC.on||!stream)return;const mime=recMime();const part={k:REC.id+"/h"+REC.parts.length,start:Date.now(),end:Date.now(),n:0,bytes:0,mime:mime||"audio/mp4"};REC.parts.push(part);
  try{REC.r=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:96000}:{audioBitsPerSecond:96000})}catch(e){REC.parts.pop();REC.err=String(e.message||e);REC.on=false;return}
  part.mime=(REC.r.mimeType||part.mime).split(";")[0];
  REC.r.ondataavailable=ev=>{if(!ev.data||!ev.data.size)return;const i=part.n++;part.bytes+=ev.data.size;part.end=Date.now();dbPut("night",part.k+"/"+i,ev.data)};
  REC.r.start(30000);clearTimeout(REC.t);
  const d=new Date(),ms=Math.min(3600e3,(60-d.getMinutes())*60e3-d.getSeconds()*1e3)||3600e3;
  REC.t=setTimeout(()=>{if(!REC.on)return;const r=REC.r;r.onstop=()=>recPart();try{r.stop()}catch(e){recPart()}},ms)}
function recStop(){clearTimeout(REC.t);$("#recDot").hidden=true;return new Promise(res=>{const done=()=>{const out=REC.on||REC.parts.length?{id:REC.id,start:REC.start,end:Date.now(),parts:REC.parts.filter(p=>p.n>0)}:null;REC.on=false;REC.r=null;REC.parts=[];res(out)};
  if(!REC.r||REC.r.state==="inactive"){done();return}const r=REC.r;r.onstop=()=>setTimeout(done,300);try{r.stop()}catch(e){done()}})}
const recBytes=r=>r.parts.reduce((s,p)=>s+p.bytes,0);
function recDrop(rec,except){for(const p of rec.parts){if(except&&except.has(p.k))continue;for(let i=0;i<p.n;i++)dbDel("night",p.k+"/"+i)}}
/* pièces déjà prises par une nuit complète : elles ne sont jamais supprimées ici */
function recUsedByNights(){const s=new Set();getNights().forEach(n=>(n.audio||[]).forEach(a=>s.add(a.k)));return s}

/* la question à l'arrêt */
function recAsk(rec,where){if(!rec||!rec.parts.length)return"";const mb=recBytes(rec)/1e6,dur=rec.end-rec.start;
  return`<div class="card" id="recAsk" style="margin:12px 16px 0"><h3>Enregistrement complet</h3><p class="small">${dureeTxt(dur)} · ${mb<1?mb.toFixed(1):mb.toFixed(0)} Mo · ${rec.parts.length} pièce${rec.parts.length>1?"s":""}</p>
    <div class="row"><button class="btn primary" id="recKeep">Garder</button><button class="btn ghost danger" id="recDel">Supprimer</button></div>
    <p class="small muted">Gardé : dans Carnet › Sorties, à exporter en fichier (m4a). Si tu fermes sans choisir, il est gardé.</p></div>`}
function recBind(rec,meta){if(!rec)return;let decided=false;const keep=()=>{if(decided)return;decided=true;const a=getRecs();a.unshift(Object.assign({id:rec.id,start:rec.start,end:rec.end,parts:rec.parts,lat:lastFix?lastFix.lat:null,lon:lastFix?lastFix.lon:null,mic:S.deviceId?"externe":"téléphone"},meta||{}));saveRecs(a);renderLog()};
  const k=$("#recKeep"),d=$("#recDel");if(!k)return;
  k.onclick=()=>{keep();$("#recAsk").innerHTML=`<h3>Enregistrement gardé ✓</h3><p class="small muted">Carnet › Sorties › Enregistrements.</p>`;toast("Enregistrement gardé")};
  d.onclick=()=>{if(d.dataset.c!=="1"){d.dataset.c="1";d.textContent="Toucher encore pour supprimer";return}decided=true;recDrop(rec,recUsedByNights());$("#recAsk").innerHTML=`<p class="small muted">Enregistrement supprimé.</p>`;toast("Enregistrement supprimé")};
  /* fermé sans choisir : on garde */
  const sh=$("#sheet"),obs=new MutationObserver(()=>{if(sh.hidden){obs.disconnect();keep()}});obs.observe(sh,{attributes:true,attributeFilter:["hidden"]})}
function openRecOnly(rec){if(!rec||!rec.parts.length)return;openSheet(`<div class="sumhead"><span class="eyebrow">Écoute terminée</span><h2>${fmtD(rec.start)} · ${fmtT(rec.start)} → ${fmtT(rec.end)}</h2><p class="small muted">Aucune espèce retenue pendant cette écoute.</p></div>${recAsk(rec)}`,"summary");recBind(rec)}

/* export d'une pièce */
async function exportRecPart(p){const parts=[];for(let i=0;i<p.n;i++){const b=await dbGet("night",p.k+"/"+i);if(b)parts.push(b)}
  if(!parts.length){toast("Cette pièce n'est plus sur le téléphone");return}const ext=/webm/.test(p.mime)?"webm":"m4a";
  await saveFile(`ramage_${stamp(p.start)}.${ext}`,new Blob(parts,{type:p.mime}))}
function openRec(r){if(!r)return;const mb=recBytes(r)/1e6;
  openSheet(`<div class="sumhead"><span class="eyebrow">Enregistrement complet</span><h2>${fmtD(r.start)} · ${fmtT(r.start)} → ${fmtT(r.end)}</h2><p class="small muted">${dureeTxt(r.end-r.start)} · ${mb.toFixed(0)} Mo · micro ${esc(r.mic||"")}${r.lat!=null?` · ${r.lat.toFixed(5)}, ${r.lon.toFixed(5)}`:""}</p></div>
    <div class="row">${r.parts.map((p,k)=>`<button class="btn sm" data-rp="${k}">⤓ ${fmtT(p.start)}–${fmtT(p.end)}</button>`).join("")}</div>
    <div class="row" style="margin-top:12px"><button class="btn ghost danger sm" id="recDrop">Supprimer cet enregistrement</button></div>`,"summary");
  $("#sheetBody").querySelectorAll("[data-rp]").forEach(b=>b.onclick=()=>exportRecPart(r.parts[+b.dataset.rp]));
  const d=$("#recDrop");d.onclick=()=>{if(d.dataset.c!=="1"){d.dataset.c="1";d.textContent="Toucher encore pour supprimer";return}recDrop(r,recUsedByNights());saveRecs(getRecs().filter(x=>x.id!==r.id));closeSheet();renderLog();toast("Enregistrement supprimé")}}
