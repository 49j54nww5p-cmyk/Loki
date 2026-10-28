/* =========================================================
   Écoute en direct : spectro scientifique + liste qui s'allume.
   ========================================================= */
let running=false,rafId=0,SES=null,floorDb=-90,lastTrig=0;
const LIVE=new Map();                    /* espèces entendues pendant cette écoute */
const MARKS=[];                          /* cadres sur le spectro, en échantillons absolus */
const autoState={on:false,count:0,since:0};
const SECS=8;                            /* largeur du spectro, en secondes */
const liveC=$("#live"),liveX=liveC.getContext("2d"),liveO=$("#liveOv"),liveOX=liveO.getContext("2d");
const lfft=makeFFT(1024),lpw=new Float32Array(512);
const SPECT={hop:0,drawn:0,W:0,H:0,img:null};

/* ---- photos iNaturalist (gardées sur le téléphone) ---- */
const PH=LS.get("huginn.photos",{}),phPending=new Set();
function ensurePhoto(la){if(!la||PH[la]||phPending.has(la)||IN_CLAUDE)return;phPending.add(la);
  fetch("https://api.inaturalist.org/v1/taxa?rank=species&per_page=1&q="+encodeURIComponent(la)).then(r=>r.json()).then(j=>{const t=(j.results||[]).find(x=>x.name===la)||(j.results||[])[0],p=t&&t.default_photo;
    if(p){PH[la]={s:p.square_url,m:p.medium_url||p.square_url,a:p.attribution||""};LS.set("huginn.photos",PH);$$("img[data-ph]").forEach(im=>{if(im.dataset.ph===la)im.src=im.dataset.sz==="m"?PH[la].m:PH[la].s})}}).catch(()=>{}).finally(()=>phPending.delete(la))}
function imgPh(la,sz){ensurePhoto(la);const u=PH[la]?(sz==="m"?PH[la].m:PH[la].s):"";return`<img data-ph="${esc(la)}" data-sz="${sz||"s"}" alt="" ${u?`src="${esc(u)}"`:""}>`}

/* ---- démarrer / arrêter ---- */
async function startListen(){ctx();primeSpeech();
  try{const c={echoCancellation:false,noiseSuppression:false,autoGainControl:false};if(S.deviceId)c.deviceId={exact:S.deviceId};stream=await navigator.mediaDevices.getUserMedia({audio:c})}
  catch(e){showMicNote();return}
  await ensureTap();srcNode=ac.createMediaStreamSource(stream);srcNode.connect(hp);allocRing();listDevices();startGPS();beginLoop()}
function showMicNote(){const n=$("#micNote");n.hidden=false;
  n.innerHTML=`<b>${IN_CLAUDE?"Micro indisponible dans l'aperçu.":"Micro refusé."}</b> ${IN_CLAUDE?"Le micro marche dans la version GitHub Pages.":"Autorise le micro pour ce site dans Réglages iOS › Safari › Micro, puis recharge."}<div class="row" style="margin-top:8px"><button class="btn sm" id="btnLiveDemo">Lancer la démo</button></div>`;
  $("#btnLiveDemo").onclick=startDemoLive}
async function startDemoLive(){ctx();await ensureTap();const d=genDemo(),b=ac.createBuffer(1,d.samples.length,d.sr);b.copyToChannel(d.samples,0);
  demoNode=ac.createBufferSource();demoNode.buffer=b;demoNode.loop=true;demoNode.connect(hp);demoNode.start();allocRing();$("#micNote").hidden=true;beginLoop()}
function beginLoop(){running=true;document.body.classList.add("listening");$("#liveIdle").hidden=true;
  $("#btnCapture").disabled=false;$("#btnBlack").disabled=false;SPECT.drawn=AUD.total;SPECT.W=0;MARKS.length=0;
  if(!SES)SES={start:Date.now(),sp:new Map()};startAI();renderLive();cancelAnimationFrame(rafId);rafId=requestAnimationFrame(frame)}
function stopListen(){running=false;document.body.classList.remove("listening");cancelAnimationFrame(rafId);stopAI();sessionEnd();
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}if(srcNode){try{srcNode.disconnect()}catch(e){}srcNode=null}
  if(demoNode){try{demoNode.stop();demoNode.disconnect()}catch(e){}demoNode=null}
  stopGPS();$("#btnCapture").disabled=true;$("#btnBlack").disabled=true;$("#lvl i").style.width="0";renderLive()}
$("#btnListen").onclick=()=>{if(running)stopListen()};$("#btnStart").onclick=()=>{if(!running)startListen()};

/* ---- spectro : une colonne par « hop » d'échantillons, calée sur le compteur ---- */
function absToRing(a){const r=AUD.ring,L=r.length;return(((AUD.pos-(AUD.total-a))%L)+L)%L}
function frame(){if(!running)return;rafId=requestAnimationFrame(frame);
  if(sizeCanvas(liveC)){paintBg(liveX,liveC);SPECT.W=0}sizeCanvas(liveO);
  const W=liveC.width,H=liveC.height,sr=ac.sampleRate;
  if(SPECT.W!==W||SPECT.H!==H){SPECT.W=W;SPECT.H=H;SPECT.hop=Math.max(32,Math.round(sr*SECS/W));SPECT.drawn=AUD.total;SPECT.img=null}
  const hop=SPECT.hop;let k=Math.floor((AUD.total-SPECT.drawn)/hop);
  if(k<=0){drawOverlay();return}
  if(k>W||AUD.total-SPECT.drawn>AUD.fill){k=Math.min(W,Math.floor(Math.min(AUD.fill,W*hop)/hop));SPECT.drawn=AUD.total-k*hop}
  const nyq=sr/2,top=-25,lo=top-S.range,gdb=S.gain,paint=!autoState.on;
  let img=null;if(paint){if(!SPECT.img||SPECT.img.width!==k)SPECT.img=liveX.createImageData(k,H);img=SPECT.img.data}
  const b1=Math.round(1500/nyq*512),b2=Math.min(511,Math.round(10000/nyq*512));let bandMax=-200,sq=0;
  for(let c=0;c<k;c++){const end=SPECT.drawn+(c+1)*hop;if(end-1024<AUD.total-AUD.fill)continue;lfft(AUD.ring,absToRing(end-1024),lpw,AUD.ring.length);
    let bm=-200;for(let b=b1;b<=b2;b++){const v=10*Math.log10(lpw[b]+1e-20)-60+gdb;if(v>bm)bm=v}if(bm>bandMax)bandMax=bm;
    if(paint)for(let y=0;y<H;y++){const f=(1-y/H)*S.fmax,b=Math.min(511,Math.round(f/nyq*512));let v=(10*Math.log10(lpw[b]+1e-20)-60+gdb-lo)/S.range;v=v<0?0:v>1?1:v;const li=Math.round(v*255)*3,o=(y*k+c)*4;img[o]=LUT[li];img[o+1]=LUT[li+1];img[o+2]=LUT[li+2];img[o+3]=255}}
  /* niveau : RMS du dernier bloc */
  {const st=absToRing(AUD.total-hop*k);for(let i=0;i<hop*k;i+=4){const v=AUD.ring[(st+i)%AUD.ring.length];sq+=v*v}const rms=10*Math.log10(sq/(hop*k/4)+1e-12)+gdb,l=$("#lvl");l.firstElementChild.style.width=Math.max(0,Math.min(100,(rms+70)/70*100))+"%";l.classList.toggle("hot",rms>-6)}
  SPECT.drawn+=k*hop;
  if(paint){liveX.drawImage(liveC,k,0,W-k,H,0,0,W-k,H);liveX.putImageData(SPECT.img,W-k,0);drawOverlay()}
  /* nuit : déclenchement quand ça dépasse le fond */
  const now=performance.now();if(autoState.on){if(bandMax>floorDb+S.thr&&now-lastTrig>4000){lastTrig=now;setTimeout(autoCapture,1500)}else if(bandMax<floorDb+S.thr)floorDb=floorDb*.995+bandMax*.005}else floorDb=floorDb*.99+bandMax*.01}

/* ---- cadres : barre du nom au-dessus du moment où l'espèce chante ---- */
function addMark(i,s0,s1,sc){const sr=ac.sampleRate;let m=null;for(let j=MARKS.length-1;j>=0;j--)if(MARKS[j].i===i){m=MARKS[j];break}
  if(m&&s0<=m.s1+sr*.6){m.s1=Math.max(m.s1,s1);m.sc=Math.max(m.sc,sc)}else MARKS.push({i,s0,s1,sc});
  while(MARKS.length>60)MARKS.shift()}
function drawOverlay(){const W=liveO.width,H=liveO.height,d=dprOf();liveOX.clearRect(0,0,W,H);{const step=S.fmax>9000?2000:1000;liveOX.strokeStyle="rgba(255,255,255,.09)";liveOX.lineWidth=1;liveOX.beginPath();for(let f=step;f<S.fmax;f+=step){const y=Math.round((1-f/S.fmax)*H)+.5;liveOX.moveTo(36*d,y);liveOX.lineTo(W-14*d,y)}for(let t=2;t<SECS;t+=2){const x=Math.round(W*(1-t/SECS))+.5;liveOX.moveTo(x,0);liveOX.lineTo(x,H)}liveOX.stroke()}if(!SPECT.hop)return;
  const xOf=s=>W-(SPECT.drawn-s)/SPECT.hop,vis=MARKS.filter(m=>xOf(m.s1)>0),slot=new Map();
  for(let j=MARKS.length-1;j>=0;j--)if(xOf(MARKS[j].s1)<-W)MARKS.splice(j,1);
  vis.forEach(m=>{if(!slot.has(m.i))slot.set(m.i,slot.size%4)});
  liveOX.font=`600 ${11*d}px "IBM Plex Sans",system-ui,sans-serif`;liveOX.textBaseline="middle";const C={song:cssVar("--song"),call:cssVar("--call"),fg:cssVar("--fg"),bg:cssVar("--spec0")};
  vis.forEach(m=>{const r=LIVE.get(m.i);if(!r||AI.rejected.has(m.i))return;const col=r.kind?(isSong(r.kind.k)?C.song:C.call):C.fg,x0=xOf(m.s0),x1=xOf(m.s1),y=(8+slot.get(m.i)*20)*d;
    liveOX.globalAlpha=.35;liveOX.strokeStyle=col;liveOX.lineWidth=1*d;liveOX.setLineDash([3*d,4*d]);liveOX.beginPath();liveOX.moveTo(x0,y);liveOX.lineTo(x0,H);liveOX.stroke();liveOX.setLineDash([]);
    liveOX.globalAlpha=.95;liveOX.lineWidth=2*d;liveOX.beginPath();liveOX.moveTo(x0,y+6*d);liveOX.lineTo(x0,y);liveOX.lineTo(x1,y);liveOX.lineTo(x1,y+6*d);liveOX.stroke();
    const t=`${r.fr} ${Math.round(m.sc*100)} %`,tw=liveOX.measureText(t).width,lx=Math.max(4*d,Math.min(x0+4*d,W-tw-6*d)),ly=y+11*d;
    liveOX.globalAlpha=1;liveOX.lineWidth=3*d;liveOX.strokeStyle="rgba(0,0,0,.85)";liveOX.strokeText(t,lx,ly);liveOX.fillStyle="#fff";liveOX.fillText(t,lx,ly)});
  liveOX.globalAlpha=1}
new ResizeObserver(()=>{drawAxis($("#liveAxis"),0,S.fmax);if(!running){sizeCanvas(liveC);paintBg(liveX,liveC);sizeCanvas(liveO);drawOverlay()}}).observe(liveC);

/* ---- IA en direct ---- */
let aiTimer=0,perchTimer=0,aiBusy=false,perchBusy=false;
function startAI(){clearInterval(aiTimer);clearInterval(perchTimer);aiTimer=setInterval(liveTick,1500);perchTimer=setInterval(perchTick,5000);if(!AI.ready.bn&&!IN_CLAUDE)ensureAI()}
function stopAI(){clearInterval(aiTimer);clearInterval(perchTimer)}
function liveRec(i,now){let r=LIVE.get(i);if(!r){const n=nameOf(i);r={i,fr:n.fr,la:n.la,first:now,last:now,max:0,bn:0,perch:0,n:0,lifer:isLifer(n.la),kind:null};LIVE.set(i,r);r.isNew=true;
    if(!REF.mem.get(n.la))refGet(n.la).then(rec=>{if(rec&&rec.v===REFV){REF.mem.set(n.la,rec);updateKind(r);renderLive()}else refQueue(n.la)})}return r}
function updateKind(r){const k=kindGuess(REF.mem.get(r.la),r.emb,r.seg);if(k)r.kind=k}
async function liveTick(){if(!running||aiBusy||!AI.ready.bn||!AI.labels||!ac)return;const s=grab(3);if(!s||s.length<ac.sampleRate*2)return;aiBusy=true;
  try{const x=await to32k(s,ac.sampleRate),[o]=await runBN2([x]),sc=postBN(o.raw),now=Date.now(),thr=thrNow();
    const cand=topK(sc,8,thr*.6);cand.forEach(i=>{sc[i]=learnAdjust(nameOf(i).la,o.emb,sc[i])});
    const hits=cand.filter(i=>sc[i]>=thr&&!AI.rejected.has(i)).sort((a,b)=>sc[b]-sc[a]).slice(0,4);let alert=null;
    for(const i of hits){const r=liveRec(i,now);if(r.isNew){r.isNew=false;if(!alert||r.lifer)alert=r}
      r.n++;r.last=now;r.cur=sc[i];r.bn=Math.max(r.bn,sc[i]);if(sc[i]>r.max){r.max=sc[i];r.emb=o.emb;r.seg=fit(x,96000).slice();updateKind(r)}
      addMark(i,s.end-s.length,s.end,sc[i]);
      if(SES){const sp=SES.sp.get(i)||{fr:r.fr,la:r.la,n:0,max:0,lifer:r.lifer};sp.n++;sp.max=Math.max(sp.max,sc[i]);sp.kind=r.kind?r.kind.k:sp.kind;SES.sp.set(i,sp)}}
    if(alert&&!autoState.on)alertNew(alert.lifer,alert.fr);
    $("#aiState").textContent=`${AI.nHere?AI.nHere+" esp. possibles · ":""}seuil ${Math.round(thr*100)} %`;renderLive()}
  catch(e){AI.err=String(e.message||e)}finally{aiBusy=false}}
async function perchTick(){if(!running||!AI.ready.perch||perchBusy||!AI.perchIdx||S.perchLive===false||!ac)return;const s=grab(5);if(!s||s.length<ac.sampleRate*4)return;perchBusy=true;
  try{const x=await to32k(s,ac.sampleRate),[sc]=await runPerch([x]),now=Date.now();
    topK(sc,3,.4).forEach(i=>{if(AI.rejected.has(i))return;let r=LIVE.get(i);if(!r){if(sc[i]<.6)return;r=liveRec(i,now);r.isNew=false;r.viaPerch=true;r.max=sc[i]*.9;r.n=1;if(!autoState.on)alertNew(r.lifer,r.fr)}
      r.perch=Math.max(r.perch||0,sc[i]);r.lastP=now;if(r.viaPerch){r.last=now;addMark(i,s.end-s.length,s.end,sc[i])}});renderLive()}catch(e){}finally{perchBusy=false}}

/* ---- liste : chaque espèce garde sa place, elle s'allume quand elle chante ---- */
function rowHTML(r,now){const on=running&&now-r.last<4500,k=r.kind,rk=rarity(r.i),tr=traps(r.la),two=r.perch>=.3&&r.bn>=thrNow()*.9;
  const kt=k?`<span class="tg k${k.sure?"":" unsure"}" style="--k:${kindVar(k.k)}" title="${k.src==="réf"?`d'après ${k.n} références proches`:"d'après la forme du son"}">${esc(k.k.toUpperCase())}${k.sure?"":" ?"}</span>`:`<span class="tg">TYPE ?</span>`;
  const at=two?`<span class="tg ai2" title="BirdNET+ ${Math.round(r.bn*100)} % · Perch ${Math.round(r.perch*100)} %">2 IA ✓</span>`:r.viaPerch?`<span class="tg" title="trouvé par Perch v2">PERCH</span>`:"";
  return`<div class="ph">${imgPh(r.la,"s")}</div><div class="mid"><div class="nm">${esc(r.fr)}</div><div class="la">${esc(r.la)}</div>
    <div class="tags">${kt}${at}${r.lifer?`<span class="tg new">NOUVEAU</span>`:""}${rk?`<span class="tg rare">${rk[1]}</span>`:""}${tr.length?`<span class="tg trap">⚠ ${tr[0].kind==="imit"?"imitation ?":"sosie"}</span>`:""}${r.validated?`<span class="tg ok">✓ carnet</span>`:""}</div></div>
    <div class="rt"><span class="pct">${Math.round(r.max*100)}<small>%</small></span>${on?`<span class="eq" aria-label="en train de chanter"><i></i><i></i><i></i></span>`:`<span class="ago">${ago(now-r.last)}</span>`}<button class="bplay" data-play-sp="${esc(r.la)}" aria-label="Écouter la référence">${PLAY}</button></div>`}
let dragging=null,pendingRender=false;
function renderLive(){if(dragging){pendingRender=true;return}const el=$("#liveList"),now=Date.now();
  const rows=Array.from(LIVE.values()).filter(r=>!AI.rejected.has(r.i)).sort((a,b)=>b.first-a.first);$("#liveCount").textContent=rows.length;
  if(!rows.length){el.innerHTML=`<p class="empty">${running?(AI.ready.bn?"J'écoute…":AI.err?"IA indisponible : "+esc(AI.err):"Chargement de l'IA…"):"Les espèces entendues s'affichent ici et s'allument quand elles chantent."}</p>`;return}
  const em=el.querySelector(".empty");if(em)em.remove();const have=new Map(Array.from(el.children).map(c=>[c.dataset.i,c]));
  rows.forEach((r,idx)=>{let c=have.get(String(r.i));if(!c){c=document.createElement("div");c.className="sp enter";c.dataset.i=r.i;c.addEventListener("animationend",()=>c.classList.remove("enter"),{once:true})}
    have.delete(String(r.i));const h=rowHTML(r,now);if(c._h!==h){c.innerHTML=h;c._h=h}
    c.classList.toggle("on",running&&now-r.last<4500);c.classList.toggle("done",!!r.validated);c.style.setProperty("--k",r.kind?kindVar(r.kind.k):"var(--muted)");
    if(el.children[idx]!==c)el.insertBefore(c,el.children[idx]||null)});
  have.forEach(c=>c.remove())}
setInterval(()=>{if(running)renderLive()},1000);
const live=$("#liveList");
live.addEventListener("pointerdown",e=>{const c=e.target.closest(".sp");if(!c||e.target.closest("button"))return;dragging={c,x:e.clientX,y:e.clientY,dx:0,id:e.pointerId,lock:null}});
live.addEventListener("pointermove",e=>{if(!dragging||e.pointerId!==dragging.id)return;const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
  if(dragging.lock==null&&(Math.abs(dx)>8||Math.abs(dy)>8))dragging.lock=Math.abs(dx)>Math.abs(dy)?"x":"y";
  if(dragging.lock==="x"){e.preventDefault();dragging.dx=dx;dragging.c.style.transform=`translateX(${dx}px)`;dragging.c.classList.toggle("go-ok",dx>90);dragging.c.classList.toggle("go-no",dx<-90)}});
function endDrag(e){if(!dragging)return;const d=dragging;dragging=null;const i=+d.c.dataset.i;
  if(d.lock==="x"&&d.dx>90){d.c.style.transform="";d.c.classList.remove("go-ok");validateLive(i)}
  else if(d.lock==="x"&&d.dx<-90){d.c.style.transform="translateX(-110%)";setTimeout(()=>{rejectLive(i);renderLive()},160)}
  else{d.c.style.transform="";d.c.classList.remove("go-ok","go-no");if(d.lock==null&&e&&e.type==="pointerup")openFocus(i)}
  if(pendingRender){pendingRender=false;setTimeout(renderLive,200)}}
live.addEventListener("pointerup",endDrag);live.addEventListener("pointercancel",endDrag);
live.addEventListener("click",e=>{const b=e.target.closest("[data-play-sp]");if(b){e.stopPropagation();playRefSp(b.dataset.playSp)}});

async function validateLive(i){const r=LIVE.get(i);if(!r||r.validated)return;const s=running?grab(Math.min(S.capSec,10)):null,id=uid(),fx=lastFix;
  const e={id,ts:r.last||Date.now(),lat:fx?fx.lat:null,lon:fx?fx.lon:null,acc:fx?fx.acc:null,sp:r.fr,la:r.la,type:r.kind?KIND_TYPE[r.kind.k]||"":"",notes:"",source:demoNode?"demo":"micro",dur:s?s.length/ac.sampleRate:0,m:null,ai:{m:r.viaPerch?"Perch v2":"BirdNET+",fr:r.fr,la:r.la,sc:r.max}};
  if(s){await putClip(id,{sr:ac.sampleRate,pcm:toI16(s)});const m=measure(stftOf(s,ac.sampleRate),null);if(m&&!m.empty)e.m=m}
  entries.unshift(e);saveEntries();const nw=addLife(r.fr,r.la);r.validated=true;learnAdd(r.la,r.emb,true);r.lifer=false;renderLive();renderLog();toast(nw?`${r.fr} : nouvelle espèce sur ta liste de vie !`:`${r.fr} validé au carnet`)}
function rejectLive(i){AI.rejected.add(i);const r=LIVE.get(i);if(r&&r.emb)learnAdd(r.la,r.emb,false)}

/* ---- spectro plein écran (double toucher) ---- */
let lastTapSpec=0;
$("#liveWrap").addEventListener("pointerup",()=>{const n=Date.now();if(n-lastTapSpec<350){$("#liveWrap").classList.toggle("full");lastTapSpec=0}else lastTapSpec=n});

/* ---- sortie : chrono et résumé à l'arrêt ---- */
setInterval(()=>{const t=$("#timer");if(!running||!SES){t.textContent="";return}const s=Math.floor((Date.now()-SES.start)/1000);t.textContent=`· ${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`},500);
function sessionEnd(){if(!SES)return;const s=SES;SES=null;s.end=Date.now();if(s.end-s.start<15000||!s.sp.size)return;
  const rec={id:uid(),kind:"sortie",start:s.start,end:s.end,lat:lastFix?lastFix.lat:null,lon:lastFix?lastFix.lon:null,
    list:Array.from(s.sp.values()).filter(r=>{const i=AI.sciIdx&&AI.sciIdx.get(r.la);return!(i!=null&&AI.rejected.has(i))}).sort((a,b)=>b.max-a.max).map(r=>({fr:r.fr,la:r.la,n:r.n,max:r.max,kind:r.kind||"",lifer:r.lifer}))};
  if(!rec.list.length)return;saveSession(rec);openSummary(rec)}

/* ---- capture rétro ---- */
$("#btnCapture").onclick=()=>capture();
$("#capLbl").textContent=S.capSec+" s";

/* ---- la nuit : écran noir, l'appli garde 4 s autour de chaque son ---- */
let wakeLock=null;
async function lockScreen(){try{if(navigator.wakeLock)wakeLock=await navigator.wakeLock.request("screen")}catch(e){wakeLock=null}}
function updateBlack(){$("#blackTxt").textContent=`écoute nocturne · ${autoState.count} événement${autoState.count>1?"s":""} · touche 2 fois pour sortir`;$("#autoCount").textContent=autoState.count?String(autoState.count):""}
$("#btnBlack").onclick=()=>{autoState.on=true;autoState.since=Date.now();$("#black").hidden=false;updateBlack();lockScreen()};
let tapT=0;$("#black").addEventListener("pointerup",()=>{const n=Date.now();if(n-tapT<450){autoState.on=false;$("#black").hidden=true;if(wakeLock){wakeLock.release().catch(()=>{});wakeLock=null}paintBg(liveX,liveC);renderLog();nocmigReport(autoState.since||0)}tapT=n});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&autoState.on)lockScreen()});
async function autoCapture(){const s=grab(4);if(!s)return;const id=uid(),m=measure(stftOf(s,ac.sampleRate),null);
  const e={id,ts:Date.now(),lat:lastFix?lastFix.lat:null,lon:lastFix?lastFix.lon:null,acc:lastFix?lastFix.acc:null,sp:"",la:"",type:"",notes:"",source:"auto",dur:s.length/ac.sampleRate,m};
  if(AI.ready.bn&&AI.labels){try{const[o]=await runBN2([await to32k(s.subarray(Math.max(0,s.length-ac.sampleRate*3)),ac.sampleRate)]),sc=postBN(o.raw),t=topK(sc,1,.1)[0];if(t!=null){const n=nameOf(t);e.ai={m:"BirdNET+",fr:n.fr,la:n.la,sc:sc[t]}}}catch(err){}}
  await putClip(id,{sr:ac.sampleRate,pcm:toI16(s)});entries.unshift(e);saveEntries();autoState.count++;updateBlack()}
