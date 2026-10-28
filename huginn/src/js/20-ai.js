/* =========================================================
   IA : BirdNET+ V3.0 (direct, analyse, empreintes), géomodèle, Perch v2.
   Les modèles tournent dans un worker (onnxruntime-web, WASM) et restent
   en cache sur le téléphone après le 1er téléchargement.
   ========================================================= */
const ORTBASE="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
const MODELS={
  bn:{url:new URL("models/birdnet.onnx",location.href).href,key:"https://huginn.local/bn-3.0p3.1-c32",label:"BirdNET+ V3.0",size:67},
  geo:{url:new URL("models/geo.onnx",location.href).href,key:"https://huginn.local/geo-3.0.4-c32",label:"Géomodèle BirdNET+",size:14},
};
/* Perch v2 : deux versions au choix (Réglages › Modèles)
   - légère : int8, 131 Mo, servie par l'appli en 2 morceaux ; tient dans la mémoire de l'iPhone
   - complète : 413 Mo depuis Hugging Face, pleine précision ; peut dépasser la mémoire à l'activation */
const PERCHV={lite:{url:["models/perch/perch-int8.part0.bin","models/perch/perch-int8.part1.bin"].map(u=>new URL(u,location.href).href),sizes:[65377492,65377492],key:"https://huginn.local/perch-v2-int8-1",label:"Perch v2 légère (int8)",size:131},
  full:{url:"https://huggingface.co/justinchuby/Perch-onnx/resolve/main/perch_v2_no_dft.onnx",sizes:null,key:"https://huginn.local/perch-v2-nodft",label:"Perch v2 complète",size:413}};
Object.defineProperty(MODELS,"perch",{get:()=>PERCHV[S.perchV==="full"?"full":"lite"],enumerable:true});
const PERCH_LABELS="https://huggingface.co/cgeorgiaw/Perch/resolve/main/assets/labels.csv";
/* Le worker : charge et fait tourner les modèles.
   Stockage par morceaux de 16 Mo : l'iPhone n'a jamais tout le fichier en mémoire pendant le
   téléchargement (avant, il fermait l'appli à 411/413 Mo), et un téléchargement coupé reprend où il s'était arrêté. */
const WSRC=`import * as ort from "${ORTBASE}ort.wasm.bundle.min.mjs";
ort.env.wasm.wasmPaths="${ORTBASE}";ort.env.wasm.numThreads=1;
const S={},CH=16*1024*1024;
const cache=()=>caches.open("huginn-models");
async function meta(c,key){const r=await c.match(key+"/meta");return r?await r.json():null}
async function stored(c,key){if(await c.match(key))return true;const m=await meta(c,key);return!!(m&&m.done)}
async function store(url,key,name,sizes){const c=await cache();if(await stored(c,key))return;
  const urls=Array.isArray(url)?url:[url],id=urls.join("|"),tot0=sizes?sizes.reduce((a,b)=>a+b,0):0;
  let m=await meta(c,key);if(!m||m.url!==id)m={url:id,n:0,size:0,total:tot0,done:false};
  let parts=[],plen=0,last=0;
  const putMeta=()=>c.put(key+"/meta",new Response(JSON.stringify(m),{headers:{"content-type":"application/json"}}));
  const flush=async()=>{if(!plen)return;await c.put(key+"/p"+m.n,new Response(new Blob(parts),{headers:{"x-len":String(plen)}}));m.n++;m.size+=plen;parts=[];plen=0;await putMeta()};
  for(let restart=0;restart<2;restart++){let cum=0,ok=true;
    for(let p=0;p<urls.length;p++){const psz=sizes?sizes[p]:0;if(psz&&m.size>=cum+psz){cum+=psz;continue}
      const off=m.size-cum;let res=null;
      if(off>0){try{res=await fetch(urls[p],{headers:{Range:"bytes="+off+"-"}});if(res.status!==206)res=null}catch(e){res=null}
        if(!res){m.n=0;m.size=0;await putMeta();ok=false;break}}
      else res=await fetch(urls[p]);
      if(!res.ok)throw new Error("téléchargement refusé (HTTP "+res.status+")");
      if(!m.total){const cl=+res.headers.get("content-length")||0;m.total=cl}
      const rd=res.body.getReader();
      for(;;){const x=await rd.read();if(x.done)break;parts.push(x.value);plen+=x.value.length;if(plen>=CH)await flush();
        const now=Date.now();if(now-last>300){last=now;postMessage({t:"progress",name,got:m.size+plen,total:m.total})}}
      cum+=psz||0}
    if(ok)break}
  await flush();
  if(m.total&&m.size!==m.total)throw new Error("téléchargement coupé à "+Math.round(m.size/1e6)+" / "+Math.round(m.total/1e6)+" Mo : touche à nouveau, il reprendra");
  m.done=true;await putMeta()}
async function getBuf(url,key,name,sizes){let c=null;try{c=await cache()}catch(e){}
  if(!c){const r=await fetch(Array.isArray(url)?url[0]:url);if(!r.ok)throw new Error("HTTP "+r.status);return new Uint8Array(await r.arrayBuffer())}
  const old=await c.match(key);if(old)return new Uint8Array(await old.arrayBuffer());
  await store(url,key,name,sizes);const m=await meta(c,key);postMessage({t:"progress",name,phase:"read"});
  const b=new Uint8Array(m.size);let o=0;for(let i=0;i<m.n;i++){const r=await c.match(key+"/p"+i);if(!r){await drop(c,key);throw new Error("morceau manquant sur le téléphone : à retélécharger")}const u=new Uint8Array(await r.arrayBuffer());b.set(u,o);o+=u.length}
  if(o!==m.size){await drop(c,key);throw new Error("fichier incomplet sur le téléphone : à retélécharger")}return b}
async function drop(c,key){await c.delete(key);const m=await meta(c,key);if(m)for(let i=0;i<m.n+2;i++)await c.delete(key+"/p"+i);await c.delete(key+"/meta")}
self.onmessage=async e=>{const m=e.data;try{
 if(m.t==="load"){if(!S[m.name]){let b=await getBuf(m.url,m.key,m.name,m.sizes);postMessage({t:"progress",name:m.name,phase:"init"});
   const big=b.length>150e6,opt=big?{executionProviders:["wasm"],graphOptimizationLevel:"basic",enableCpuMemArena:false,enableMemPattern:false}:{executionProviders:["wasm"],graphOptimizationLevel:"all"};
   S[m.name]=await ort.InferenceSession.create(b,opt);b=null}postMessage({t:"ok",id:m.id})}
 else if(m.t==="run"){const s=S[m.name];if(!s)throw new Error("modèle non chargé");const feeds={};feeds[s.inputNames[0]]=new ort.Tensor("float32",m.data,m.dims);const out=await s.run(feeds,[m.output]);const d=new Float32Array(out[m.output].data);postMessage({t:"ok",id:m.id,data:d},[d.buffer])}
 else if(m.t==="run2"){const s=S[m.name];if(!s)throw new Error("modèle non chargé");const feeds={};feeds[s.inputNames[0]]=new ort.Tensor("float32",m.data,m.dims);const out=await s.run(feeds,m.outputs);const r=m.outputs.map(k=>new Float32Array(out[k].data));postMessage({t:"ok",id:m.id,data:r},r.map(a=>a.buffer))}
 else if(m.t==="dl"){if(m.old)try{await drop(await cache(),m.old)}catch(e){}await store(m.url,m.key,m.name,m.sizes);postMessage({t:"ok",id:m.id})}
 else if(m.t==="has"){let ok=false;try{ok=await stored(await cache(),m.key)}catch(e){}postMessage({t:"ok",id:m.id,ok})}
 else if(m.t==="unload"){if(S[m.name]){try{await S[m.name].release()}catch(e){}delete S[m.name]}postMessage({t:"ok",id:m.id})}
 else if(m.t==="drop"){try{await drop(await cache(),m.key)}catch(e){}if(S[m.name]){try{await S[m.name].release()}catch(e){}delete S[m.name]}postMessage({t:"ok",id:m.id})}
}catch(err){const msg=typeof err==="number"?"erreur interne du moteur n°"+err:String(err&&err.message||err);postMessage({t:"error",id:m.id,msg})}};`;

const AI={labels:null,mask:null,birdMask:null,mult:null,geoP:null,ready:{},loading:{},progress:{},maskKey:"",maskInfo:"",nHere:0,err:"",rejected:new Set()};
let Wk=null,wid=0;const wp=new Map();
function wk(){if(Wk)return Wk;Wk=new Worker(URL.createObjectURL(new Blob([WSRC],{type:"text/javascript"})),{type:"module"});
  Wk.onmessage=e=>{const m=e.data;if(m.t==="progress"){AI.progress[m.name]=m;onProgress(m);return}const p=wp.get(m.id);if(!p)return;wp.delete(m.id);m.t==="error"?p.rej(new Error(m.msg)):p.res(m)};
  Wk.onerror=e=>{const msg=(e&&e.message)||"le moteur IA n'a pas démarré";wp.forEach(p=>p.rej(new Error(msg)));wp.clear();AI.err=msg;setAiChip()};return Wk}
function wcall(msg,transfer){return new Promise((res,rej)=>{const id=++wid;wp.set(id,{res,rej});wk().postMessage(Object.assign({id},msg),transfer||[])})}

function loadModel(name){if(AI.ready[name])return Promise.resolve();if(AI.loading[name])return AI.loading[name];const M=MODELS[name];
  const p=wcall({t:"load",name,url:M.url,key:M.key,sizes:M.sizes}).then(()=>{AI.ready[name]=true;delete AI.loading[name];setAiChip()},e=>{delete AI.loading[name];throw e});AI.loading[name]=p;setAiChip();return p}
async function loadLabels(){if(AI.labels)return;const r=await fetch("labels.json?v=2");if(!r.ok)throw new Error("liste des espèces introuvable");const j=await r.json();
  AI.labels=j.audio;AI.geoMap=j.geo;const n=j.audio.length;AI.mult=new Float32Array(n).fill(1);for(const k in j.mult)AI.mult[+k]=j.mult[k];
  AI.birdMask=new Uint8Array(n);j.audio.forEach((a,i)=>AI.birdMask[i]=a[3]);AI.mask=AI.birdMask.slice();AI.sciIdx=new Map(j.audio.map((a,i)=>[a[0],i]))}
const nameOf=i=>{const a=AI.labels[i];return{fr:a[1]||a[2],la:a[0]}};
async function ensureAI(){if(IN_CLAUDE)return;try{await loadLabels();await loadModel("bn");await loadModel("geo");await updateMask(true)}
  catch(e){AI.err=String(e.message||e);setAiChip();toast("IA indisponible : "+AI.err)}}

/* filtre géographique : espèces probables autour de toi cette semaine */
const FR_PTS=[[48.85,2.35],[47.22,-1.55],[44.84,-.58],[43.6,1.44],[43.3,5.37],[45.76,4.84],[48.58,7.75],[50.63,3.06],[48.39,-4.49],[42.69,2.89],[45.9,6.12],[46.58,.34],[47.32,5.04],[42.15,9.1]];
const weekNow=(d=new Date())=>d.getMonth()*4+Math.min(4,Math.floor((d.getDate()-1)/7.75)+1);
async function updateMask(force){if(!AI.labels||!AI.ready.geo)return;const mode=S.geo|0,w=weekNow();let pts,key,label;
  if(mode===2){key="none";label="toutes les espèces"}else if(mode===0&&lastFix){pts=[[lastFix.lat,lastFix.lon]];key=`gps:${lastFix.lat.toFixed(1)},${lastFix.lon.toFixed(1)}:${w}`;label="autour de toi"}else{pts=FR_PTS;key="fr:"+w;label="France"}
  if(!force&&key===AI.maskKey)return;AI.maskKey=key;
  if(mode===2)AI.mask=AI.birdMask.slice();
  else{const m=new Uint8Array(AI.labels.length),gp=new Float32Array(AI.labels.length);
    for(const[la,lo]of pts){const r=await wcall({t:"run",name:"geo",output:"probabilities",data:new Float32Array([la,lo,w]),dims:[1,3]});const p=r.data;for(let g=0;g<p.length;g++){const k=AI.geoMap[g];if(p[g]>gp[k])gp[k]=p[g];if(p[g]>=.03)m[k]=1}}
    for(let i=0;i<m.length;i++)m[i]&=AI.birdMask[i];AI.mask=m;AI.geoP=gp}
  let n=0;for(let i=0;i<AI.mask.length;i++)n+=AI.mask[i];AI.nHere=n;AI.maskInfo=`${n} espèces · ${label}`;setAiChip();refreshSpeciesList();renderPlumage()}
function rarity(i){const p=AI.geoP?AI.geoP[i]:null;if(p==null)return null;if(p>=.3)return null;if(p>=.1)return["p","peu commun ici"];if(p>=.03)return["r","rare ici"];return["x","inattendu ici"]}

/* BirdNET+ : sigmoïdes -> filtre oiseaux/géo, liste noire, sensibilité */
function postBN(p){const n=AI.labels.length,o=new Float32Array(n),bias=((S.sens||1)-1)*5;
  for(let i=0;i<n;i++){if(!AI.mask[i])continue;let v=p[i]*AI.mult[i];if(bias){v=Math.min(Math.max(v,1e-6),1-1e-6);v=1/(1+Math.exp(-(Math.log(v/(1-v))+bias)))}o[i]=v}return o}
/* prédictions + empreintes normalisées (1280 valeurs) par fenêtre de 3 s */
async function runBN2(wins){const L=96000,out=[];for(let k=0;k<wins.length;k+=6){const part=wins.slice(k,k+6),d=new Float32Array(part.length*L);part.forEach((w,j)=>d.set(fit(w,L),j*L));
    const r=await wcall({t:"run2",name:"bn",outputs:["predictions","embeddings_out"],data:d,dims:[part.length,L]},[d.buffer]);const n=AI.labels.length,P=r.data[0],E=r.data[1],ed=E.length/part.length;
    for(let j=0;j<part.length;j++){const e=E.slice(j*ed,(j+1)*ed);let s=0;for(let q=0;q<ed;q++)s+=e[q]*e[q];s=Math.sqrt(s)||1;for(let q=0;q<ed;q++)e[q]/=s;out.push({raw:P.slice(j*n,(j+1)*n),emb:e})}}return out}
function topK(sc,k,min){const idx=[];for(let i=0;i<sc.length;i++)if(sc[i]>=min)idx.push(i);idx.sort((a,b)=>sc[b]-sc[a]);return idx.slice(0,k)}

/* Perch v2 : 2e avis, fenêtres de 5 s */
async function perchCached(){try{const c=await caches.open("huginn-models"),k=MODELS.perch.key;if(await c.match(k))return true;const r=await c.match(k+"/meta");return!!(r&&(await r.json()).done)}catch(e){return false}}
async function perchLabels(){if(AI.perchIdx)return;let txt=null,c=null;try{c=await caches.open("huginn-models");const h=await c.match("https://huginn.local/perch-labels");if(h)txt=await h.text()}catch(e){}
  if(!txt){const r=await fetch(PERCH_LABELS);if(!r.ok)throw new Error("liste Perch introuvable (HTTP "+r.status+")");txt=await r.text();if(c)try{await c.put("https://huginn.local/perch-labels",new Response(txt))}catch(e){}}
  const lines=txt.split(/\r?\n/).slice(1).filter(Boolean);AI.perchIdx=Int32Array.from(lines.map(l=>{const k=AI.sciIdx.get(l.replace(/^"|"$/g,"").trim());return k==null?-1:k}))}
async function runPerch(wins){const L=160000,res=[];for(const w of wins){const d=new Float32Array(L);d.set(fit(w,L));const r=await wcall({t:"run",name:"perch",output:"label",data:d,dims:[1,L]},[d.buffer]);
    const lg=r.data,n=AI.labels.length,sc=new Float32Array(n);let mx=-1e9;for(let j=0;j<lg.length;j++){const k=AI.perchIdx[j];if(k>=0&&AI.mask[k]&&lg[j]>mx)mx=lg[j]}
    let sum=0;for(let j=0;j<lg.length;j++){const k=AI.perchIdx[j];if(k>=0&&AI.mask[k])sum+=Math.exp(lg[j]-mx)}
    for(let j=0;j<lg.length;j++){const k=AI.perchIdx[j];if(k>=0&&AI.mask[k])sc[k]=Math.max(sc[k],Math.exp(lg[j]-mx)/sum)}res.push(sc)}return res}
/* téléchargement seul (gardé sur le téléphone), puis activation à part : si l'activation fait fermer l'appli
   faute de mémoire, le fichier reste là et l'appli ne réessaie pas toute seule au lancement suivant */
let perchWake=null;
async function perchDownload(){if(await perchCached())return;try{if(navigator.storage&&navigator.storage.persist)await navigator.storage.persist()}catch(e){}
  try{if(navigator.wakeLock)perchWake=await navigator.wakeLock.request("screen")}catch(e){}
  try{await wcall({t:"dl",name:"perch",url:MODELS.perch.url,key:MODELS.perch.key,sizes:MODELS.perch.sizes})}finally{if(perchWake){perchWake.release().catch(()=>{});perchWake=null}}}
async function perchActivate(){if(AI.ready.perch)return;if(!AI.labels)await ensureAI();await perchLabels();LS.set("huginn.perchLoading",Date.now());
  try{await loadModel("perch")}finally{try{localStorage.removeItem("huginn.perchLoading")}catch(e){}}}
const perchCrashed=()=>!!LS.get("huginn.perchLoading",0);
async function autoPerch(){if(IN_CLAUDE||S.perchLive===false||AI.ready.perch||perchCrashed())return;if(!(await perchCached()))return;try{await perchActivate();return}catch(e){}}

/* Ramage apprend de toi : empreintes des espèces validées et écartées */
const LEARN=new Map();
function learnLoad(){if(!idb)return;try{const r=idb.transaction("learn").objectStore("learn").openCursor();r.onsuccess=()=>{const c=r.result;if(c){LEARN.set(c.key,{pos:c.value.pos||[],neg:c.value.neg||[]});c.continue()}else renderLearnInfo()}}catch(e){}}
function learnAdd(la,emb,pos){if(!la||!emb)return;const o=LEARN.get(la)||{pos:[],neg:[]},arr=pos?o.pos:o.neg;arr.unshift(Float32Array.from(emb));if(arr.length>25)arr.length=25;LEARN.set(la,o);dbPut("learn",la,{pos:o.pos,neg:o.neg});renderLearnInfo()}
function learnAdjust(la,emb,v){const o=LEARN.get(la);if(!o||!emb)return v;let sp=0,sn=0;for(const e of o.pos)sp=Math.max(sp,dot(e,emb));for(const e of o.neg)sn=Math.max(sn,dot(e,emb));
  if(sn>sp&&sn>.85)return v*.4;if(sn>sp&&sn>.75)return v*.7;if(sp>=sn&&sp>.85)return Math.min(1,v+.12);return v}

/* seuil : de base le réglage, il monte quand le bruit de fond monte */
function thrNow(){const base=S.conf||.35;if(S.autoThr===false)return base;const k=Math.max(0,Math.min(1,(floorDb+90)/40));return Math.min(.9,base+k*.2)}

/* pièges sonores : sosies et imitations */
const PAIRS=[["Phylloscopus collybita","Phylloscopus trochilus","Chant : le véloce répète un « tchif-tchaf » régulier, le fitis fait une phrase douce qui descend. Les cris « houit » se ressemblent beaucoup."],
 ["Certhia brachydactyla","Certhia familiaris","Le grimpereau des jardins fait une phrase courte et rythmée, celui des bois un trille fin et plus long qui descend."],
 ["Sylvia atricapilla","Sylvia borin","La tête noire finit par des notes flûtées fortes, la des jardins gazouille longtemps sans finale flûtée."],
 ["Regulus regulus","Regulus ignicapilla","Le huppé répète un motif aigu et finit par une fioriture, le triple bandeau accélère et s'intensifie sans fioriture."],
 ["Turdus merula","Turdus philomelos","La musicienne répète chaque motif 2 à 4 fois, le merle enchaîne des phrases flûtées sans les répéter."],
 ["Tringa totanus","Tringa erythropus","Le gambette lance des « tiu-hu-hu » en série, l'arlequin un « tchu-it » sifflé qui monte."],
 ["Numenius arquata","Numenius phaeopus","Le cendré crie « cour-li » en montant, le corlieu une série rapide de 6 ou 7 notes égales."],
 ["Anthus pratensis","Anthus trivialis","La farlouse lance des « ist-ist » fins et répétés, le pipit des arbres un « pssiit » rauque et isolé."],
 ["Larus argentatus","Larus michahellis","Cris très proches à l'oreille : à confirmer à vue."]];
const MIMICS=new Set(["Garrulus glandarius","Sturnus vulgaris","Hippolais polyglotta","Acrocephalus palustris"]);
const OFTEN_IMITATED=new Set(["Buteo buteo","Oriolus oriolus","Numenius arquata","Accipiter nisus","Pluvialis squatarola","Tringa totanus","Falco tinnunculus","Strix aluco"]);
function traps(la){const out=[];PAIRS.forEach(([a,b,t])=>{if(la===a||la===b){const o=la===a?b:a,i=AI.sciIdx&&AI.sciIdx.get(o);out.push({kind:"sosie",alt:i!=null?nameOf(i).fr:o,txt:t})}});
  if(OFTEN_IMITATED.has(la)){const m=Array.from(LIVE.values()).find(r=>MIMICS.has(r.la)&&Date.now()-r.last<600000);out.push({kind:"imit",alt:m?m.fr:"",txt:m?`${m.fr} entendu aussi : c'est peut-être une imitation.`:"Espèce souvent imitée par le Geai des chênes ou l'Étourneau."})}return out}

/* état affiché */
function setAiChip(){const c=$("#chipAi"),t=c.lastElementChild;c.classList.remove("ok","load","err");
  if(IN_CLAUDE)t.textContent="IA off";
  else if(AI.err&&!AI.ready.bn){c.classList.add("err");t.textContent="IA"}
  else if(AI.ready.bn){c.classList.add("ok");t.textContent=AI.ready.perch?"IA ×2":"IA"}
  else if(AI.loading.bn){c.classList.add("load");const p=AI.progress.bn;t.textContent=p&&p.total?`IA ${Math.round(p.got/p.total*100)} %`:"IA"}
  else t.textContent="IA";
  c.title=AI.ready.bn?`BirdNET+ prêt${AI.ready.perch?" · Perch v2 prêt":""} · ${AI.maskInfo}`:AI.err||"chargement";renderModelInfo()}
function onProgress(m){if(m.name!=="perch"){setAiChip();return}const pct=m.phase==="init"?100:m.total?m.got/m.total*100:5;
  ["#perchBar","#perchBar2"].forEach(id=>{const b=$(id);b.hidden=false;b.firstElementChild.style.width=pct+"%"});
  const txt=m.phase==="init"?"Perch v2 : préparation (20 à 60 s)…":m.phase==="read"?"Perch v2 : lecture depuis le téléphone…":`Perch v2 : ${Math.round(m.got/1e6)} / ${Math.round((m.total||MODELS.perch.size*1e6)/1e6)} Mo · garde l'appli ouverte`;
  const gp=$("#btnGetPerch");gp.disabled=true;gp.textContent=txt;const a=$("#perchAsk");a.hidden=false;a.innerHTML=`<p class="small muted">${txt}</p>`}
async function renderModelInfo(){const el=$("#modelInfo");if(!el)return;if(IN_CLAUDE){el.textContent="Les modèles ne se chargent pas dans l'aperçu : ouvre la version GitHub Pages.";return}
  const pc=AI.ready.perch||await perchCached(),gp=$("#btnGetPerch"),ap=$("#btnActPerch"),cr=perchCrashed();gp.hidden=!!pc;if(!gp.disabled)gp.textContent="Télécharger "+MODELS.perch.label+" ("+MODELS.perch.size+" Mo)";ap.hidden=!pc||!!AI.ready.perch||!!AI.loading.perch;$("#btnDropPerch").hidden=!pc;
  const pn=$("#perchNote");pn.hidden=!(pc&&!AI.ready.perch&&cr);pn.textContent="La dernière activation de Perch a fermé l'appli : l'iPhone a manqué de mémoire. Le fichier est bien gardé sur le téléphone. Ferme les autres applis puis réessaie ; sinon BirdNET+ seul marche très bien.";
  el.innerHTML=`<div>BirdNET+ V3.0 · ${MODELS.bn.size} Mo : <b>${AI.ready.bn?"prêt":AI.loading.bn?"chargement":"non chargé"}</b></div><div>Géomodèle · ${MODELS.geo.size} Mo : <b>${AI.ready.geo?"prêt":"non chargé"}</b>${AI.maskInfo?` · ${esc(AI.maskInfo)}`:""}</div><div>${esc(MODELS.perch.label)} · ${MODELS.perch.size} Mo : <b>${AI.ready.perch?"prêt":AI.loading.perch?"activation…":pc?"sur le téléphone ✓ (pas encore activé)":"pas téléchargé"}</b></div>${AI.err?`<div class="muted">Dernière erreur : ${esc(AI.err)}</div>`:""}`}
