/* =========================================================
   La nuit complète.
   - Toute la nuit est enregistrée en AAC (≈ 40 Mo par heure), une pièce par heure.
   - Chaque espèce reconnue garde ses 5 meilleurs extraits de 10 s (WAV 32 kHz).
   - Au réveil : export d'un dossier trié (ZIP) : nuit > espèce > extraits, plus un
     tableau des observations ≥ 80 % prêt à être mis en forme pour Faune-France.
   ========================================================= */
const NIGHT_MIN=.8,NIGHT_KEEP=5,NIGHT_SEC=10;
let NIGHT=null,nRec=null,nHourT=0;
const getNights=()=>LS.get("huginn.nights",[]);
function saveNight(n){const a=getNights().filter(x=>x.id!==n.id);a.unshift(n);LS.set("huginn.nights",a.slice(0,30))}

/* --- enregistrement complet, une pièce par heure --- */
function recMime(){if(!window.MediaRecorder)return null;for(const m of["audio/mp4;codecs=mp4a.40.2","audio/mp4","audio/aac","audio/webm;codecs=opus","audio/webm"])try{if(MediaRecorder.isTypeSupported(m))return m}catch(e){}return""}
function nightRecStart(){if(!stream||!NIGHT)return;const mime=recMime();if(mime==null)return;
  const part={k:NIGHT.id+"/h"+NIGHT.audio.length,start:Date.now(),n:0,bytes:0,mime:mime||"audio/mp4"};NIGHT.audio.push(part);
  try{nRec=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:96000}:{audioBitsPerSecond:96000})}catch(e){NIGHT.audio.pop();NIGHT.recErr=String(e.message||e);return}
  part.mime=(nRec.mimeType||part.mime).split(";")[0];
  nRec.ondataavailable=ev=>{if(!ev.data||!ev.data.size)return;const i=part.n++;part.bytes+=ev.data.size;dbPut("night",part.k+"/"+i,ev.data);part.end=Date.now();saveNight(NIGHT)};
  nRec.start(30000);clearTimeout(nHourT);
  /* nouvelle pièce à chaque heure ronde (ou après 60 min) */
  const d=new Date(),ms=Math.min(3600e3,(60-d.getMinutes())*60e3-d.getSeconds()*1e3)||3600e3;
  nHourT=setTimeout(()=>{if(!NIGHT)return;const r=nRec;r.onstop=()=>nightRecStart();try{r.stop()}catch(e){nightRecStart()}},ms)}
function nightRecStop(){clearTimeout(nHourT);return new Promise(res=>{if(!nRec||nRec.state==="inactive"){res();return}const r=nRec;nRec=null;r.onstop=()=>setTimeout(res,300);try{r.stop()}catch(e){res()}})}

/* --- détections : on garde les meilleurs passages de chaque espèce --- */
function nightStart(){NIGHT={id:"n"+uid(),start:Date.now(),end:null,lat:lastFix?lastFix.lat:null,lon:lastFix?lastFix.lon:null,acc:lastFix?lastFix.acc:null,sp:{},audio:[],mic:S.deviceId?"externe":"téléphone"};
  saveNight(NIGHT);nightRecStart()}
function nightHit(i,sc,end){if(!NIGHT||sc<.1)return;const n=nameOf(i),r=LIVE.get(i),now=Date.now(),h=new Date(now).getHours();
  const o=NIGHT.sp[n.la]||(NIGHT.sp[n.la]={fr:n.fr,la:n.la,n:0,max:0,first:now,last:now,hours:{},clips:[],kind:""});
  o.n++;o.last=now;o.max=Math.max(o.max,sc);o.hours[h]=(o.hours[h]||0)+1;if(r&&r.kind)o.kind=r.kind.k;if(r&&r.perch)o.perch=Math.max(o.perch||0,r.perch);
  /* un passage proche d'un extrait déjà gardé : on ne garde que le meilleur des deux */
  const near=o.clips.find(c=>Math.abs(c.ts-now)<NIGHT_SEC*1e3);
  if(near){if(sc<=near.sc)return}else if(o.clips.length>=NIGHT_KEEP&&sc<=Math.min(...o.clips.map(c=>c.sc)))return;
  const slot={id:NIGHT.id+"_"+uid(),ts:now,sc,pending:true};o.clips.push(slot);
  if(near){o.clips.splice(o.clips.indexOf(near),1);delClip(near.id)}
  if(o.clips.length>NIGHT_KEEP){o.clips.sort((a,b)=>a.sc-b.sc);const out=o.clips.shift();delClip(out.id)}
  /* l'extrait est centré sur le cri : on attend 4 s pour avoir aussi l'après */
  setTimeout(async()=>{const s=grab(NIGHT_SEC);if(!s){o.clips.splice(o.clips.indexOf(slot),1);return}if(!o.clips.includes(slot))return;const x=await to32k(s,ac.sampleRate);
    await putClip(slot.id,{sr:32000,pcm:toI16(x)});slot.pending=false;if(NIGHT)saveNight(NIGHT)},4000);
  saveNight(NIGHT)}
async function nightStop(){if(!NIGHT)return null;await nightRecStop();await new Promise(r=>setTimeout(r,4500));NIGHT.end=Date.now();const n=NIGHT;NIGHT=null;
  Object.values(n.sp).forEach(o=>{o.clips=o.clips.filter(c=>!c.pending)});saveNight(n);return n}

/* --- rapport et exports --- */
const pad2=v=>String(v).padStart(2,"0");
const stamp=ts=>{const d=new Date(ts);return`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}_${pad2(d.getHours())}h${pad2(d.getMinutes())}m${pad2(d.getSeconds())}`};
const safe=s=>String(s||"").replace(/[\/\\:*?"<>|]+/g,"-").trim();
function nightList(n){return Object.values(n.sp).sort((a,b)=>b.max-a.max)}
function openNight(n){if(!n)return;const L=nightList(n),ok=L.filter(o=>o.max>=NIGHT_MIN),dur=(n.end||Date.now())-n.start,mb=n.audio.reduce((s,a)=>s+a.bytes,0)/1e6;
  openSheet(`<div class="sumhead"><span class="eyebrow">Nuit complète</span><h2>${fmtD(n.start)} · ${fmtT(n.start)} → ${n.end?fmtT(n.end):"…"}</h2>
    <div class="kpis"><div><b>${dureeTxt(dur)}</b><span>durée</span></div><div><b>${ok.length}</b><span>espèces ≥ 80 %</span></div><div><b>${L.length-ok.length}</b><span>sous 80 %</span></div></div></div>
    <div class="sumlist">${L.map(o=>`<div class="srow">${imgPh(o.la,"s")}<span class="sn"><b>${esc(o.fr)}${o.max<NIGHT_MIN?` <span class="tg">sous 80 %</span>`:""}</b><small>${o.n} contact${o.n>1?"s":""} · ${fmtT(o.first)}–${fmtT(o.last)}${o.kind?" · "+esc(o.kind):""} · ${o.clips.length} extrait${o.clips.length>1?"s":""}</small></span><span class="sp2">${Math.round(o.max*100)} %${o.clips.length?` <button class="bplay" data-nplay="${o.clips.slice().sort((a,b)=>b.sc-a.sc)[0].id}" aria-label="Écouter">${PLAY}</button>`:""}</span></div>`).join("")||`<p class="empty">Aucune espèce reconnue cette nuit.</p>`}</div>
    <div class="row" style="margin-top:12px"><button class="btn primary" id="nZip">Dossier trié (ZIP)</button><button class="btn" id="nCsv">Tableau ≥ 80 %</button></div>
    ${n.audio.length?`<div class="sumhead"><h3>Enregistrement complet · ${n.audio.length} pièce${n.audio.length>1?"s":""} · ${mb.toFixed(0)} Mo</h3></div><div class="row">${n.audio.map((a,k)=>`<button class="btn sm" data-nh="${k}">${fmtT(a.start)}–${a.end?fmtT(a.end):"…"}</button>`).join("")}</div>
      <div class="row" style="margin-top:8px"><button class="btn ghost sm danger" id="nDropAudio">Supprimer l'enregistrement complet (garde les extraits)</button></div>`:`<p class="small muted" style="padding:0 16px">${n.recErr?"Enregistrement complet impossible : "+esc(n.recErr):"Pas d'enregistrement complet pour cette nuit."}</p>`}
    <p class="small muted" style="padding:12px 16px 0">Envoie-moi le dossier ZIP dans la conversation : je te prépare les données pour Faune-France. Seules les espèces à 80 % et plus sont dans le tableau ; les autres restent ici pour que tu les écoutes.</p>`,"summary");
  $("#sheetBody").querySelectorAll("[data-nplay]").forEach(b=>b.onclick=()=>playEntry(b.dataset.nplay));
  $("#nZip").onclick=()=>exportNightZip(n);$("#nCsv").onclick=()=>saveFile(`ramage_nuit_${stamp(n.start).slice(0,10)}.csv`,new Blob(["﻿"+nightCSV(n)],{type:"text/csv"}));
  $("#sheetBody").querySelectorAll("[data-nh]").forEach(b=>b.onclick=()=>exportNightAudio(n,+b.dataset.nh));
  const dr=$("#nDropAudio");if(dr)dr.onclick=async()=>{if(dr.dataset.c!=="1"){dr.dataset.c="1";dr.textContent="Toucher encore pour supprimer";return}
    for(const a of n.audio)for(let i=0;i<a.n;i++)dbDel("night",a.k+"/"+i);n.audio=[];saveNight(n);toast("Enregistrement complet supprimé");openNight(n)}}

/* une ligne par espèce et par heure : c'est la forme habituelle des comptages nocturnes */
function nightCSV(n){const h=["date","heure_debut","heure_fin","espece","nom_latin","nombre_contacts","type_contact","score_birdnet","score_perch","latitude","longitude","precision_m","micro","fichier_son","remarque"],rows=[];
  nightList(n).filter(o=>o.max>=NIGHT_MIN).forEach(o=>{const best=o.clips.slice().sort((a,b)=>b.sc-a.sc)[0];
    Object.keys(o.hours).map(Number).sort((a,b)=>((a+12)%24)-((b+12)%24)).forEach(hr=>{const d=new Date(n.start);if(hr<d.getHours())d.setDate(d.getDate()+1);
      rows.push([`${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`,`${pad2(hr)}:00`,`${pad2((hr+1)%24)}:00`,o.fr,o.la,o.hours[hr],o.kind||"cri nocturne",o.max.toFixed(2),o.perch?o.perch.toFixed(2):"",n.lat!=null?n.lat.toFixed(5):"",n.lon!=null?n.lon.toFixed(5):"",n.acc!=null?Math.round(n.acc):"",n.mic,
        best?`${safe(o.fr)} - ${safe(o.la)}/${stamp(best.ts)}_${Math.round(best.sc*100)}pc.wav`:"","Contact sonore nocturne, identifié par Ramage (BirdNET+ V3.0), score ≥ 80 %, nombre d'individus inconnu"].map(csvCell).join(","))})});
  return h.join(",")+"\n"+rows.join("\n")}

/* ZIP sans compression (les WAV ne se compressent pas) : nuit/espèce/extraits */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xffffffff;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return(c^0xffffffff)>>>0}
function zipBlob(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;const d=new Date(),dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1)),dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate());
  for(const f of files){const name=enc.encode(f.name),data=f.data,crc=crc32(data),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(8,0,true);h.setUint16(10,dt,true);h.setUint16(12,dd,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
    parts.push(h.buffer,name,data);const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(10,0,true);c.setUint16(12,dt,true);c.setUint16(14,dd,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);
    cen.push(c.buffer,name);off+=30+name.length+data.length}
  const csz=cen.reduce((s,p)=>s+(p.byteLength!=null?p.byteLength:p.length),0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csz,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,e.buffer],{type:"application/zip"})}
async function wavBytes(id){const c=await getClip(id);if(!c)return null;return new Uint8Array(await encodeWav(toF32(c.pcm),c.sr).arrayBuffer())}
async function exportNightZip(n){const b=$("#nZip");b.disabled=true;b.textContent="Préparation…";try{const enc=new TextEncoder(),root=`Ramage_nuit_${stamp(n.start).slice(0,10)}`,files=[],L=nightList(n),ok=L.filter(o=>o.max>=NIGHT_MIN);
    for(const o of ok){const dir=`${root}/${safe(o.fr)} - ${safe(o.la)}`;for(const c of o.clips.slice().sort((a,b)=>b.sc-a.sc)){const w=await wavBytes(c.id);if(w)files.push({name:`${dir}/${stamp(c.ts)}_${Math.round(c.sc*100)}pc.wav`,data:w})}}
    files.push({name:`${root}/observations_80pc.csv`,data:enc.encode("﻿"+nightCSV(n))});
    const rep=[`Ramage · nuit du ${new Date(n.start).toLocaleString("fr-FR")} au ${new Date(n.end||Date.now()).toLocaleString("fr-FR")}`,`Lieu : ${n.lat!=null?n.lat.toFixed(5)+", "+n.lon.toFixed(5)+(n.acc!=null?" ±"+Math.round(n.acc)+" m":""):"sans GPS"} · micro ${n.mic}`,
      `Méthode : BirdNET+ V3.0 en continu (fenêtres de 3 s), ${AI.ready.perch?"Perch v2 en 2e avis, ":""}filtre géographique ${["autour de moi","France","aucun"][S.geo|0]}. Extraits de ${NIGHT_SEC} s centrés sur le contact, ${NIGHT_KEEP} meilleurs par espèce.`,"",
      `Espèces à 80 % et plus (${ok.length}) :`,...ok.map(o=>`- ${o.fr} (${o.la}) · ${o.n} contacts · max ${Math.round(o.max*100)} % · ${fmtT(o.first)}–${fmtT(o.last)}${o.kind?" · "+o.kind:""}`),"",
      `Sous 80 %, non exportées, à écouter dans l'appli (${L.length-ok.length}) :`,...L.filter(o=>o.max<NIGHT_MIN).map(o=>`- ${o.fr} (${o.la}) · max ${Math.round(o.max*100)} %`),"",
      "Rappel : une identification par IA reste à confirmer à l'écoute avant toute saisie dans une base de données."].join("\n");
    files.push({name:`${root}/LISEZ-MOI.txt`,data:enc.encode(rep)});
    await saveFile(root+".zip",zipBlob(files))}catch(e){toast("Export impossible : "+(e.message||e))}finally{b.disabled=false;b.textContent="Dossier trié (ZIP)"}}
async function exportNightAudio(n,k){const a=n.audio[k];if(!a)return;const parts=[];for(let i=0;i<a.n;i++){const p=await dbGet("night",a.k+"/"+i);if(p)parts.push(p)}
  if(!parts.length){toast("Cette pièce n'est plus sur le téléphone");return}const ext=/webm/.test(a.mime)?"webm":"m4a";
  await saveFile(`ramage_nuit_${stamp(a.start)}.${ext}`,new Blob(parts,{type:a.mime}))}
