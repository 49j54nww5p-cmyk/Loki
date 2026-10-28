/* =========================================================
   Références (Wikimedia Commons, sans clé).
   Pour chaque espèce : jusqu'à 6 enregistrements libres ; dans chacun, les
   fenêtres de 3 s où BirdNET+ reconnaît le mieux l'espèce. On garde
   l'empreinte, les mesures, un mini-spectro et le type annoncé par l'auteur.
   Tout est stocké sur le téléphone, rien n'est envoyé.
   ========================================================= */
const REFV=1,REF_FILES=6,REF_SEC=30;
const SNDKIND=[[/nocturnal flight|nfc|migration nocturne/i,"cri de vol nocturne"],[/flight ?call|cri en vol|cri de vol|flugruf/i,"cri de vol"],[/alarm|alarme|warn|scold/i,"cri d'alarme"],[/begging|quémande/i,"cri de quémande"],[/drum|tambour/i,"tambourinage"],[/subsong|babil/i,"babil"],[/song|chant|singing|gesang|canto/i,"chant"],[/\bcalls?\b|\bcri|\bruf\b|contact/i,"cri"]];
const kindOf=s=>{s=String(s||"").replace(/[_-]+/g," ");for(const[re,k]of SNDKIND)if(re.test(s))return k;return""};
const strip=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/\s+/g," ").trim();
const REF={building:new Map(),mem:new Map(),bg:false,bgStop:false,queue:[],qBusy:false};

async function commonsList(sci){const q=`intitle:"${sci}" filetype:audio`;
  const url="https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch="+encodeURIComponent(q)+"&prop=videoinfo&viprop=url|mime|size|derivatives|extmetadata&viextmetadatafilter=Artist|LicenseShortName|ImageDescription";
  const r=await fetch(url);if(!r.ok)throw new Error("Commons ne répond pas (HTTP "+r.status+")");const d=await r.json(),[g,sp]=sci.toLowerCase().split(" "),out=[];
  for(const pg of(d.query&&d.query.pages)||[]){const vi=(pg.videoinfo||[])[0],title=String(pg.title||"").replace(/^File:/i,"");if(!vi||!vi.url||(vi.size||0)>15e6)continue;
    const tl=title.toLowerCase().replace(/_/g," ");if(!tl.includes(g)||!tl.includes(sp))continue;
    const c=[{src:vi.url,type:String(vi.mime||"").split(";")[0]},...(vi.derivatives||[]).map(x=>({src:x.src,type:String(x.type||"").split(";")[0]}))];
    if(!(vi.derivatives||[]).length&&/\.(ogg|oga|opus|flac|wav)$/i.test(vi.url)){const fn=vi.url.split("/").pop();c.push({src:vi.url.replace("/wikipedia/commons/","/wikipedia/commons/transcoded/")+"/"+fn+".mp3",type:"audio/mpeg"})}
    const order=["audio/mpeg","audio/mp3","audio/mp4","audio/x-m4a","audio/aac","audio/wav","audio/x-wav","audio/wave","audio/flac"];
    const best=c.filter(x=>x.src&&order.includes(x.type)).sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type))[0];if(!best)continue;
    const em=vi.extmetadata||{},who=strip(em.Artist&&em.Artist.value).slice(0,60),lic=strip(em.LicenseShortName&&em.LicenseShortName.value),desc=strip(em.ImageDescription&&em.ImageDescription.value).slice(0,300);
    out.push({url:best.src,page:vi.descriptionurl||("https://commons.wikimedia.org/wiki/"+encodeURIComponent(pg.title||"")),attr:[who?"© "+who:"",lic].filter(Boolean).join(" · "),title,kind:kindOf(title+" "+desc)})}
  const seen=new Set(),a=[],b=[];out.forEach(o=>{(seen.has(o.kind)?b:a).push(o);seen.add(o.kind)});return a.concat(b)}

let dctx=null;
function decodeAB(ab){if(!dctx){const AC=window.AudioContext||window.webkitAudioContext;dctx=new AC()}return new Promise((res,rej)=>dctx.decodeAudioData(ab,res,rej))}
const refGet=sci=>dbGet("refs",sci);
async function refsFor(sci,onStep){const c=await refGet(sci);if(c&&c.v===REFV){REF.mem.set(sci,c);return c}if(REF.building.has(sci))return REF.building.get(sci);
  const p=(async()=>{const idx=AI.sciIdx.get(sci),files=(await commonsList(sci)).slice(0,REF_FILES),items=[];let k=0;
    for(const f of files){k++;onStep&&onStep(k,files.length);try{const r=await fetch(f.url);if(!r.ok)continue;const buf=await decodeAB(await r.arrayBuffer());
        let x=buf.getChannelData(0);x=await to32k(x.subarray(0,Math.min(x.length,Math.round(buf.sampleRate*REF_SEC))),buf.sampleRate);
        const starts=[];for(let t=0;t===0||t+2<=x.length/32000;t+=3)starts.push(t);
        const res=await runBN2(starts.map(t=>x.subarray(Math.round(t*32000),Math.round(t*32000)+96000)));
        const ranked=res.map((o,i)=>({i,s:idx!=null?o.raw[idx]:0,o})).sort((a,b)=>b.s-a.s),keep=ranked.filter(z=>z.s>=.25).slice(0,2);if(!keep.length&&ranked[0]&&ranked[0].s>=.1)keep.push(ranked[0]);
        for(const z of keep){const t=starts[z.i],seg=fit(x.subarray(Math.round(t*32000),Math.round(t*32000)+96000),96000),m=measure(stftOf(seg,32000),null);
          items.push({url:f.url,page:f.page,attr:f.attr,title:f.title,kind:f.kind,t,sc:z.s,e:z.o.emb,m:m&&!m.empty?m:null,sono:miniSono(seg)})}}catch(e){}}
    const rec={sci,v:REFV,ts:Date.now(),files:files.length,items};await dbPut("refs",sci,rec);REF.mem.set(sci,rec);return rec})();
  REF.building.set(sci,p);try{return await p}finally{REF.building.delete(sci)}}

/* file d'attente : prépare en arrière-plan les références des espèces entendues */
function refQueue(sci){if(IN_CLAUDE||S.autoRef===false||REF.mem.get(sci)||REF.queue.includes(sci)||REF.building.has(sci))return;REF.queue.push(sci);refPump()}
async function refPump(){if(REF.qBusy||!REF.queue.length||!navigator.onLine)return;REF.qBusy=true;const sci=REF.queue.shift();
  try{await refsFor(sci);LIVE.forEach(r=>{if(r.la===sci)updateKind(r)});renderLive()}catch(e){}finally{REF.qBusy=false;setTimeout(refPump,500)}}

/* chant ou cri ?
   1) vote des références les plus proches (type annoncé par leurs auteurs) ;
   2) sinon, forme du son : phrase de plusieurs notes = chant probable, notes isolées = cri probable.
   « sure » est faux tant que les preuves sont minces : on l'affiche avec un « ? ». */
function kindGuess(rec,emb,seg){let v=null;
  if(rec&&rec.items&&rec.items.length&&emb){const sims=rec.items.map(it=>({k:it.kind,s:dot(emb,it.e)})).sort((a,b)=>b.s-a.s).slice(0,5),votes={};let tot=0,nk=0;
    sims.forEach(z=>{if(z.k){const w=Math.max(0,z.s);votes[z.k]=(votes[z.k]||0)+w;tot+=w;nk++}});const best=Object.entries(votes).sort((a,b)=>b[1]-a[1])[0];
    if(best&&nk>=2)v={k:best[0],sure:nk>=3&&best[1]/(tot||1)>=.6,src:"réf",n:nk}}
  if((!v||!v.sure)&&seg){const m=measure(stftOf(seg,32000),null);if(m&&!m.empty){const song=(m.notes>=4&&m.dur>=.8)||m.dur>=1.6,h=song?"chant":"cri";if(!v)v={k:h,sure:false,src:"forme",n:0}}}
  return v}

/* variance : où tombe ton son par rapport aux références ? */
const MKEYS=[["fpk","fréq. pic",v=>kHz(v)+" k"],["fmin","fréq. min",v=>kHz(v)+" k"],["fmax","fréq. max",v=>kHz(v)+" k"],["dur","durée",v=>v<1?Math.round(v*1000)+" ms":v.toFixed(1)+" s"],["notes","notes",v=>Math.round(v)],["rate","rythme",v=>v.toFixed(1)+"/s"]];
function varStats(mine,refs){return MKEYS.map(([k,lab,fmt])=>{const vals=refs.map(r=>r.m&&r.m[k]).filter(v=>v!=null&&isFinite(v));if(vals.length<2||!mine||mine[k]==null)return null;
  const lo=quant(vals,.1),hi=quant(vals,.9),mn=Math.min(...vals),mx=Math.max(...vals),v=mine[k];
  return{k,lab,fmt,v,lo,hi,n:vals.length,st:v>=lo&&v<=hi?"ok":v>=mn&&v<=mx?"mid":"out",low:v<mn}}).filter(Boolean)}
function varianceRows(mine,refs){return varStats(mine,refs).map(s=>`<tr><td>${s.lab}</td><td class="mono">${s.fmt(s.v)}</td><td class="mono">${s.fmt(s.lo)} – ${s.fmt(s.hi)}</td><td><span class="st st-${s.st}">${s.st==="ok"?"habituel":s.st==="mid"?"rare mais vu":s.low?"plus bas que toutes":"plus haut que toutes"}</span></td></tr>`).join("")}
function varianceChips(mine,refs){return varStats(mine,refs).slice(0,5).map(s=>`<span class="vchip v-${s.st}" title="habituel ${s.fmt(s.lo)} – ${s.fmt(s.hi)}">${s.lab} <b>${s.fmt(s.v)}</b> <i>${s.st==="ok"?"✓":s.st==="mid"?"rare":"hors plage"}</i></span>`).join("")}
const honestNote=n=>n<3?`Basé sur ${n} référence${n>1?"s":""} seulement : la variance ne veut pas encore dire grand-chose.`:n<6?`Basé sur ${n} références : indication, pas une preuve.`:`Basé sur ${n} références.`;

/* lecture d'une référence */
let refAudio=null;
function playUrl(url,t0,ms){try{if(refAudio)refAudio.pause();refAudio=new Audio(url);refAudio.addEventListener("loadedmetadata",()=>{try{refAudio.currentTime=t0||0}catch(e){}},{once:true});
  refAudio.play().catch(()=>toast("Lecture impossible"));const a=refAudio;setTimeout(()=>{if(refAudio===a)a.pause()},ms||3600)}catch(e){toast("Lecture impossible")}}
async function playRefSp(la){try{let rec=REF.mem.get(la)||await refGet(la);
    if(rec&&rec.items&&rec.items.length){const it=rec.items.slice().sort((a,b)=>b.sc-a.sc)[0];playUrl(it.url,it.t,6000)}
    else{const l=await commonsList(la);if(!l.length){toast("Pas de son libre trouvé pour cette espèce");return}playUrl(l[0].url,0,6000)}}catch(e){toast("Lecture impossible")}}

/* réglages : préchargement */
async function renderRefInfo(){const keys=await dbKeys("refs");$("#refInfo").textContent=`${keys.length} espèce${keys.length>1?"s":""} en bibliothèque${REF.bg?" · construction en cours…":""}`;$("#btnRefBuild").hidden=REF.bg;$("#btnRefStop").hidden=!REF.bg}
$("#btnRefBuild").onclick=async()=>{if(IN_CLAUDE){toast("Disponible dans la version GitHub Pages");return}if(!AI.ready.bn){toast("Attends que l'IA soit prête");return}
  const todo=[];for(let i=0;i<AI.mask.length;i++)if(AI.mask[i])todo.push(nameOf(i));const have=new Set(await dbKeys("refs")),list=todo.filter(n=>!have.has(n.la));
  REF.bg=true;REF.bgStop=false;renderRefInfo();let k=0;
  for(const n of list){if(REF.bgStop)break;k++;$("#refProg").textContent=`${k}/${list.length} · ${n.fr}`;try{await refsFor(n.la)}catch(e){$("#refProg").textContent=`${k}/${list.length} · ${n.fr} : ${e.message||e}`}}
  REF.bg=false;$("#refProg").textContent=REF.bgStop?"Arrêté. Ce qui est fait reste en mémoire.":"Bibliothèque à jour pour la liste actuelle.";renderRefInfo()};
$("#btnRefStop").onclick=()=>{REF.bgStop=true;$("#refProg").textContent="Arrêt après l'espèce en cours…"};
$("#btnRefClear").onclick=async()=>{await dbClear("refs");REF.mem.clear();toast("Bibliothèque vidée");renderRefInfo()};
