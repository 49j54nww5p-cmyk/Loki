/* =========================================================
   Analyse d'un extrait : spectro zoomable, cadre au doigt, mesures,
   ralenti, nettoyage, identification BirdNET+ / Perch, comparaison aux références, fiche.
   ========================================================= */
const SPECIES=`/*@SPECIES@*/`.split(";").map(s=>{const[a,b]=s.split("|");return{fr:a,la:b}});
const spByFr=new Map(SPECIES.map(s=>[s.fr.toLowerCase(),s]));
function refreshSpeciesList(){const seen=new Set(SPECIES.map(s=>s.fr)),extra=[];
  if(AI.mask)for(let i=0;i<AI.mask.length;i++)if(AI.mask[i]){const n=nameOf(i);if(!seen.has(n.fr)){seen.add(n.fr);extra.push(n)}}
  extra.forEach(n=>spByFr.set(n.fr.toLowerCase(),n));$("#spList").innerHTML=SPECIES.concat(extra).map(s=>`<option value="${esc(s.fr)}">${esc(s.la)}</option>`).join("")}
$("#typeIn").innerHTML=`<option value="">— choisir —</option>`+TYPES.map(t=>`<option>${t}</option>`).join("");
$("#spIn").addEventListener("input",()=>{const s=spByFr.get($("#spIn").value.trim().toLowerCase());$("#spLatin").textContent=s?s.la:""});

const clipC=$("#clipc"),clipX=clipC.getContext("2d");
let clip=null,spec=null,off=null,view=null,sel=null,drag=null,player=null,playRaf=0,editing=null,speed=1,aiResults={bn:null,perch:null},hitsC=[],cmpToken=0;

function renderOff(){if(!spec)return;const fTop=Math.min(S.fmax,spec.sr/2),bMax=Math.max(2,Math.round(fTop/spec.binHz));off=document.createElement("canvas");off.width=spec.frames;off.height=bMax;
  const ox=off.getContext("2d"),img=ox.createImageData(spec.frames,bMax),d=img.data,lo=spec.max-S.range;
  for(let f=0;f<spec.frames;f++)for(let y=0;y<bMax;y++){const b=bMax-1-y;let v=(spec.db[f*spec.bins+b]-lo)/S.range;v=v<0?0:v>1?1:v;const li=Math.round(v*255)*3,o=(y*spec.frames+f)*4;d[o]=LUT[li];d[o+1]=LUT[li+1];d[o+2]=LUT[li+2];d[o+3]=255}
  ox.putImageData(img,0,0);off.fTop=bMax*spec.binHz}
function drawClip(){if($("#tab-analyse").hidden)return;sizeCanvas(clipC);const W=clipC.width,H=clipC.height;paintBg(clipX,clipC);if(!spec||!off)return;
  const sx=view.t0/spec.frameDt,sw=(view.t1-view.t0)/spec.frameDt,fT=off.fTop,sy=(1-view.f1/fT)*off.height,sh=(view.f1-view.f0)/fT*off.height;
  clipX.imageSmoothingEnabled=sw<W;clipX.drawImage(off,sx,sy,Math.max(1,sw),Math.max(1,sh),0,0,W,H);drawAxis($("#clipAxis"),view.f0,view.f1);
  const tx=t=>(t-view.t0)/(view.t1-view.t0)*W,fy=f=>(1-(f-view.f0)/(view.f1-view.f0))*H,d=dprOf();
  clipX.fillStyle=cssVar("--fg");clipX.globalAlpha=.7;clipX.font=`${10*d}px "IBM Plex Mono",monospace`;
  const span=view.t1-view.t0,st=span>6?1:span>2?.5:span>.8?.2:.1;for(let t=Math.ceil(view.t0/st)*st;t<view.t1;t+=st){const x=tx(t);clipX.fillRect(x,H-5*d,1,5*d);clipX.fillText(t.toFixed(st<1?1:0)+"s",x+3*d,H-7*d)}
  clipX.globalAlpha=1;
  if(sel){const x0=tx(sel.ta),x1=tx(sel.tb),y0=fy(sel.fb),y1=fy(sel.fa);clipX.strokeStyle=cssVar("--sel");clipX.lineWidth=2*d;clipX.setLineDash([6*d,4*d]);clipX.strokeRect(x0,y0,x1-x0,y1-y0);clipX.setLineDash([])}
  if(hitsC.length){clipX.save();clipX.font=`600 ${11*d}px "IBM Plex Sans",sans-serif`;hitsC.forEach(h=>{const x0=tx(h.a),x1=tx(h.b);if(x1<0||x0>W)return;const y=(6+h.k*18)*d;
      clipX.globalAlpha=1-h.k*.25;clipX.fillStyle=cssVar("--accent");clipX.fillRect(Math.max(0,x0),y,Math.min(W,x1)-Math.max(0,x0),3*d);const t=`${h.name} ${Math.round(h.sc*100)} %`,lx=Math.max(2*d,x0+2*d);
      clipX.lineWidth=3*d;clipX.strokeStyle=cssVar("--spec0");clipX.strokeText(t,lx,y+15*d);clipX.fillStyle=cssVar("--fg");clipX.fillText(t,lx,y+15*d)});clipX.restore()}
  if(player&&player.pos!=null){const x=tx(player.pos);clipX.fillStyle=cssVar("--accent");clipX.fillRect(x-d,0,2*d,H)}}
function loadClip(c){stopPlay();clip=c;spec=stftOf(c.samples,c.sr);renderOff();view={t0:0,t1:spec.dur,f0:0,f1:off.fTop};sel=null;editing=c.entryId||null;
  $("#clipTitle").textContent=c.title||"Analyse";$("#clipInfo").textContent=c.info||"";
  const e=editing&&entries.find(x=>x.id===editing);$("#spIn").value=e?e.sp:"";$("#spLatin").textContent=e?e.la:"";$("#typeIn").value=e?e.type:"";$("#notesIn").value=e?e.notes:"";
  $("#btnSave").textContent=editing?"Mettre à jour la fiche":"Enregistrer au carnet";
  if(c.suggest){$("#spIn").value=c.suggest.fr;$("#spLatin").textContent=c.suggest.la;c.ai=c.suggest}
  hitsC=[];aiResults={bn:null,perch:null};$("#aiRes").innerHTML="";cmpToken++;$("#cmpRes").innerHTML=`<p class="small muted">Lance « Identifier » : la comparaison suit.</p>`;$("#perchAsk").hidden=true;$("#perchBar").hidden=true;
  updateMeasures();requestAnimationFrame(drawClip)}
new ResizeObserver(()=>drawClip()).observe(clipC);

/* cadre au doigt */
function ptToData(ev){const r=clipC.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height;return{t:view.t0+x*(view.t1-view.t0),f:view.f0+(1-y)*(view.f1-view.f0),px:ev.clientX,py:ev.clientY}}
clipC.addEventListener("pointerdown",e=>{if(!spec)return;clipC.setPointerCapture(e.pointerId);drag=ptToData(e)});
clipC.addEventListener("pointermove",e=>{if(!drag)return;const p=ptToData(e);if(Math.abs(p.px-drag.px)+Math.abs(p.py-drag.py)<8)return;
  sel={ta:Math.max(0,Math.min(drag.t,p.t)),tb:Math.min(spec.dur,Math.max(drag.t,p.t)),fa:Math.max(0,Math.min(drag.f,p.f)),fb:Math.min(off.fTop,Math.max(drag.f,p.f))};drawClip()});
clipC.addEventListener("pointerup",e=>{if(!drag)return;const p=ptToData(e);if(Math.abs(p.px-drag.px)+Math.abs(p.py-drag.py)<8)sel=null;drag=null;if(sel&&(sel.tb-sel.ta<.01||sel.fb-sel.fa<50))sel=null;updateMeasures();drawClip()});
clipC.addEventListener("pointercancel",()=>{drag=null});
function updateMeasures(){const el=$("#measures");$("#btnZoom").disabled=!sel;$("#measScope").textContent=sel?`cadre ${sel.ta.toFixed(2)}–${sel.tb.toFixed(2)} s`:"extrait entier, 1–12 kHz";
  if(!spec){el.innerHTML="";return}const m=measure(spec,sel);
  if(!m||m.empty){el.innerHTML=`<div style="grid-column:1/-1"><b>—</b><span>aucun son net au-dessus du bruit${m?` · S/B ${m.snr.toFixed(0)} dB`:""}</span></div>`;return}
  const sl=Math.abs(m.slope)<800?"plate":m.slope>0?"montante":"descendante";
  el.innerHTML=[["fréq. pic",kHz(m.fpk)+" k"],["fréq. min",kHz(m.fmin)+" k"],["fréq. max",kHz(m.fmax)+" k"],["largeur",kHz(m.bw)+" k"],["durée",m.dur<1?Math.round(m.dur*1000)+" ms":m.dur.toFixed(2)+" s"],["notes",m.notes],["rythme",m.rate.toFixed(1)+" /s"],["pente",sl],["signal/bruit",m.snr.toFixed(0)+" dB"]].map(c=>`<div><b>${c[1]}</b><span>${c[0]}</span></div>`).join("")}
$("#btnZoom").onclick=()=>{if(!sel)return;const pt=(sel.tb-sel.ta)*.15,pf=(sel.fb-sel.fa)*.15;view={t0:Math.max(0,sel.ta-pt),t1:Math.min(spec.dur,sel.tb+pt),f0:Math.max(0,sel.fa-pf),f1:Math.min(off.fTop,sel.fb+pf)};drawClip()};
$("#btnFull").onclick=()=>{if(!spec)return;view={t0:0,t1:spec.dur,f0:0,f1:off.fTop};drawClip()};

/* lecture : ralenti, boucle, bande seule, nettoyage */
const cleanCache=new Map();
function samplesFor(a,b){const s0=Math.floor(a*clip.sr),s1=Math.max(s0+1,Math.floor(b*clip.sr)),raw=clip.samples.subarray(s0,s1);if(!$("#denoise").checked)return raw;
  const key=(clip.entryId||clip.title||"")+":"+s0+":"+s1;if(!cleanCache.has(key)){if(cleanCache.size>6)cleanCache.clear();cleanCache.set(key,denoise(raw))}return cleanCache.get(key)}
function stopPlay(){if(player){try{player.node.stop()}catch(e){}player=null}cancelAnimationFrame(playRaf);$("#btnPlay").textContent="Lire";if(spec)drawClip()}
function play(){if(player){stopPlay();return}if(!clip)return;ctx();
  const a=sel?sel.ta:view.t0,b=sel?sel.tb:view.t1,smp=samplesFor(a,b),buf=ac.createBuffer(1,smp.length,clip.sr);buf.copyToChannel(smp,0);
  const node=ac.createBufferSource();node.buffer=buf;node.playbackRate.value=speed;node.loop=$("#loop").checked;let last=node;
  if($("#bandOnly").checked&&sel){const h=ac.createBiquadFilter();h.type="highpass";h.frequency.value=Math.max(20,sel.fa);const l=ac.createBiquadFilter();l.type="lowpass";l.frequency.value=Math.min(clip.sr/2-10,sel.fb);last.connect(h);h.connect(l);last=l}
  const g=ac.createGain();g.gain.value=Math.pow(10,(+$("#pgain").value)/20);const comp=ac.createDynamicsCompressor();comp.threshold.value=-6;comp.ratio.value=20;last.connect(g);g.connect(comp);comp.connect(ac.destination);
  player={node,a,b,t:ac.currentTime,pos:a};node.onended=()=>{if(player&&player.node===node)stopPlay()};node.start();$("#btnPlay").textContent="Stop";
  const tick=()=>{if(!player)return;const el=(ac.currentTime-player.t)*speed,len=player.b-player.a;player.pos=player.a+(node.loop?el%len:Math.min(el,len));drawClip();playRaf=requestAnimationFrame(tick)};tick()}
$("#btnPlay").onclick=play;$("#loop").onchange=()=>{if(player)player.node.loop=$("#loop").checked};
{const seg=$("#segSpeed"),set=()=>seg.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.v===speed)));set();
  seg.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;speed=+b.dataset.v;set();if(player)player.node.playbackRate.value=speed})}

/* importer, capturer, enregistrer */
$("#fileIn").onchange=async e=>{const f=e.target.files[0];if(!f)return;ctx();try{const ab=await f.arrayBuffer(),buf=await new Promise((res,rej)=>ac.decodeAudioData(ab,res,rej));
  let s=buf.getChannelData(0),note="";const cap=buf.sampleRate*180;if(s.length>cap){s=s.slice(0,cap);note=" · 3 premières minutes"}else s=new Float32Array(s);
  loadClip({sr:buf.sampleRate,samples:s,title:f.name.replace(/\.[^.]+$/,""),info:`${buf.duration.toFixed(1)} s · ${buf.sampleRate} Hz${note}`,source:"import",ts:f.lastModified||Date.now()})}
  catch(err){toast("Format non lu. Essaie un WAV, MP3 ou M4A.")}e.target.value=""};
function capture(sug){const s=grab(S.capSec);if(!s){toast("Rien en mémoire pour l'instant");return}
  loadClip({sr:ac.sampleRate,samples:s,title:"Capture "+fmtT(Date.now()),info:`${(s.length/ac.sampleRate).toFixed(1)} s captées${lastFix?` · ${lastFix.lat.toFixed(5)}, ${lastFix.lon.toFixed(5)} ±${Math.round(lastFix.acc)} m`:""}`,source:demoNode?"demo":"micro",ts:Date.now(),fix:lastFix,suggest:sug||null});
  showTab("analyse");if(S.autoCmp!==false&&AI.ready.bn)setTimeout(()=>$("#btnBn").click(),50)}
$("#btnSave").onclick=async()=>{if(!clip){toast("Aucun extrait chargé");return}const spTxt=$("#spIn").value.trim(),s=spByFr.get(spTxt.toLowerCase()),m=measure(spec,sel);
  if(editing){const e=entries.find(x=>x.id===editing);if(e){e.sp=s?s.fr:spTxt;e.la=s?s.la:"";e.type=$("#typeIn").value;e.notes=$("#notesIn").value.trim();if(m&&!m.empty)e.m=m;if(clip.ai)e.ai=clip.ai;if(e.la)addLife(e.sp,e.la);saveEntries();renderLog();toast("Fiche mise à jour")}return}
  const id=uid(),fx=clip.fix||(clip.source!=="import"&&clip.source!=="demo"?lastFix:null);
  const e={id,ts:clip.ts||Date.now(),lat:fx?fx.lat:null,lon:fx?fx.lon:null,acc:fx?fx.acc:null,sp:s?s.fr:spTxt,la:s?s.la:"",type:$("#typeIn").value,notes:$("#notesIn").value.trim(),source:clip.source||"micro",dur:spec.dur,m:m&&!m.empty?m:null,ai:clip.ai||null};
  await putClip(id,{sr:clip.sr,pcm:toI16(clip.samples)});entries.unshift(e);saveEntries();if(e.la)addLife(e.sp,e.la);editing=id;clip.entryId=id;$("#btnSave").textContent="Mettre à jour la fiche";renderLog();toast("Ajouté au carnet")};
$("#btnWav").onclick=()=>{if(!clip)return;const a=sel?sel.ta:0,b=sel?sel.tb:spec.dur,sp=$("#spIn").value.trim();
  const name=`ramage_${new Date(clip.ts||Date.now()).toISOString().slice(0,16).replace(/[-:T]/g,"")}${sp?"_"+sp.replace(/\s+/g,"-"):""}${$("#denoise").checked?"_nettoye":""}.wav`;saveFile(name,encodeWav(samplesFor(a,b),clip.sr))};

/* identification */
function analysisWindows(win,hop){const a=sel?sel.ta:view.t0,b=sel?sel.tb:view.t1,dur=spec.dur;
  if(b-a<=win){let s0=Math.max(0,(a+b)/2-win/2);s0=Math.max(0,Math.min(s0,dur-win));return[s0]}
  const t=[];for(let x=a;x<b-hop*.5;x+=hop)t.push(Math.max(0,Math.min(x,b-win)));return Array.from(new Set(t.map(v=>+v.toFixed(3)))).slice(0,120)}
async function clip32(){if(!clip.x32)clip.x32=await to32k(clip.samples,clip.sr);return clip.x32}
function aggregate(scores,starts,thr){const best=new Map();scores.forEach((sc,w)=>{for(let i=0;i<sc.length;i++){const v=sc[i];if(v<.05)continue;const b=best.get(i)||{i,max:0,wins:[]};if(v>b.max)b.max=v;if(v>=thr)b.wins.push(starts[w]);best.set(i,b)}});return Array.from(best.values()).sort((a,b)=>b.max-a.max)}
function mergeWins(st,win){const s=st.slice().sort((a,b)=>a-b),o=[];s.forEach(t=>{const l=o[o.length-1];if(l&&t<=l[1])l[1]=Math.max(l[1],t+win);else o.push([t,t+win])});return o}
function hitsHTML(list,thr,model){if(!list.length)return`<p class="small muted">Aucune espèce au-dessus de 5 %. Essaie un cadre plus serré sur le son, ou le filtre géographique « aucun ».</p>`;
  return`<div class="hits">${list.map(r=>{const n=nameOf(r.i);return`<div class="hit${r.max<thr?" weak":""}"><span>${esc(n.fr)} <span class="latin small">${esc(n.la)}</span></span><span class="pc">${Math.round(r.max*100)} %</span>
    <span class="sub"><span>${r.wins.length?`${r.wins.length} fenêtre${r.wins.length>1?"s":""} ≥ seuil`:"sous le seuil"}</span><button class="btn ghost sm" data-use="${r.i}" data-sc="${r.max}" data-m="${model}">Utiliser</button></span><span class="meter"><i style="width:${Math.round(r.max*100)}%"></i></span></div>`}).join("")}</div>`}
function renderAiRes(){const thr=S.conf||.35,b=aiResults.bn,p=aiResults.perch;let agree="";
  if(b&&p&&b[0]&&p[0])agree=b[0].i===p[0].i?`<p class="agree">Les deux IA sont d'accord : ${esc(nameOf(b[0].i).fr)}</p>`:`<p class="small muted">Les deux IA divergent : regarde les deux listes et les mesures.</p>`;
  $("#aiRes").innerHTML=agree+`<div class="cols">${b?`<div><h4>BirdNET+</h4>${hitsHTML(b.slice(0,5),thr,"BirdNET+")}</div>`:""}${p?`<div><h4>Perch v2</h4>${hitsHTML(p.slice(0,5),thr,"Perch v2")}</div>`:""}</div>`}
$("#aiRes").addEventListener("click",e=>{const b=e.target.closest("[data-use]");if(!b)return;const ii=+b.dataset.use,n=nameOf(ii);$("#spIn").value=n.fr;$("#spLatin").textContent=n.la;clip.ai={m:b.dataset.m,fr:n.fr,la:n.la,sc:+b.dataset.sc};
  if(clip.an){let bw=0,bs=-1;clip.an.raw.forEach((p,w)=>{if(p[ii]>bs){bs=p[ii];bw=w}});learnAdd(n.la,clip.an.emb[bw],true)}toast(n.fr+" placé dans ta fiche")});
$("#btnBn").onclick=async()=>{if(!clip)return;if(IN_CLAUDE){toast("L'IA tourne seulement dans la version GitHub Pages");return}const btn=$("#btnBn");btn.disabled=true;btn.textContent="Analyse…";
  try{if(!AI.ready.bn){toast("Chargement de BirdNET+…");await ensureAI()}const x=await clip32(),starts=analysisWindows(3,1.5);
    const res=await runBN2(starts.map(t=>x.subarray(Math.round(t*32000),Math.round(t*32000)+96000))),sc=res.map(o=>postBN(o.raw)),thr=S.conf||.35,list=aggregate(sc,starts,thr);
    const an={starts,raw:sc,emb:res.map(o=>o.emb),x32:x};clip.an=an;setTimeout(()=>compareRefs(list,an).catch(err=>{$("#cmpRes").innerHTML=`<p class="small muted">Comparaison impossible : ${esc(err.message||err)}</p>`}),0);
    aiResults.bn=list;hitsC=[];list.slice(0,3).forEach((r,k)=>{mergeWins(r.wins,3).forEach(([a,b])=>hitsC.push({a,b,k,name:nameOf(r.i).fr,sc:r.max}))});renderAiRes();drawClip();
    if(list[0]&&!$("#spIn").value&&list[0].max>=thr){const n=nameOf(list[0].i);clip.ai={m:"BirdNET+",fr:n.fr,la:n.la,sc:list[0].max}}}
  catch(e){toast("Analyse impossible : "+(e.message||e))}finally{btn.disabled=false;btn.textContent="Identifier · BirdNET+"}};
async function doPerch(){const btn=$("#btnPerch");btn.disabled=true;btn.textContent="Perch…";$("#perchAsk").hidden=true;
  try{if(!AI.labels)await ensureAI();await perchLabels();if(!AI.ready.perch){await perchDownload();await perchActivate();$("#perchBar").hidden=true;$("#perchAsk").hidden=true}
    const x=await clip32(),starts=analysisWindows(5,2.5),sc=await runPerch(starts.map(t=>x.subarray(Math.round(t*32000),Math.round(t*32000)+160000)));aiResults.perch=aggregate(sc,starts,S.conf||.35);renderAiRes()}
  catch(e){$("#perchBar").hidden=true;$("#perchAsk").hidden=false;$("#perchAsk").innerHTML=`<p class="small">Perch v2 n'a pas pu tourner : ${esc(e.message||e)}. Le modèle fait 413 Mo : il faut du réseau et de la place.</p>`}
  finally{btn.disabled=false;btn.textContent="2e avis · Perch v2";renderModelInfo()}}
$("#btnPerch").onclick=async()=>{if(!clip)return;if(IN_CLAUDE){toast("L'IA tourne seulement dans la version GitHub Pages");return}
  if(AI.ready.perch||await perchCached())return doPerch();const a=$("#perchAsk");a.hidden=false;
  a.innerHTML=`<p class="small">Perch v2 pèse <b>413 Mo</b>, téléchargés une fois puis gardés sur le téléphone. À faire en wifi.</p><div class="row"><button class="btn primary sm" id="perchGo">Télécharger</button><button class="btn ghost sm" id="perchNo">Plus tard</button></div>`;
  $("#perchGo").onclick=doPerch;$("#perchNo").onclick=()=>{a.hidden=true}};

/* comparaison aux références */
async function compareRefs(list,an){const box=$("#cmpRes"),tok=++cmpToken,cands=list.filter(r=>r.max>=.1).slice(0,3);
  if(!cands.length){box.innerHTML=`<p class="small muted">Pas d'espèce candidate assez nette pour comparer.</p>`;return}
  box.innerHTML=cands.map(r=>`<div class="cmp" id="cmp-${r.i}"><h4>${esc(nameOf(r.i).fr)} <span class="latin small">${esc(nameOf(r.i).la)}</span></h4><p class="small muted">Préparation des références…</p></div>`).join("");
  for(const r of cands){if(tok!==cmpToken)return;const el=$("#cmp-"+r.i),n=nameOf(r.i);
    let bw=0,bs=-1;an.raw.forEach((p,w)=>{if(p[r.i]>bs){bs=p[r.i];bw=w}});const myE=an.emb[bw],t=an.starts[bw],seg=fit(an.x32.subarray(Math.round(t*32000),Math.round(t*32000)+96000),96000),myM=measure(stftOf(seg,32000),null),mySono=miniSono(seg);
    let rec;try{rec=await refsFor(n.la,(k,nf)=>{if(tok===cmpToken)el.querySelector("p").textContent=`Références Wikimedia Commons : enregistrement ${k}/${nf}…`})}
    catch(e){el.querySelector("p").textContent="Références indisponibles : "+(e.message||e)+" (il faut du réseau la première fois).";continue}
    if(tok!==cmpToken)return;
    if(!rec.items.length){el.innerHTML=`<h4>${esc(n.fr)} <span class="latin small">${esc(n.la)}</span></h4><p class="small muted">${rec.files?"Les enregistrements libres trouvés ne sont pas assez nets pour servir de référence.":"Aucun enregistrement libre de cette espèce sur Wikimedia Commons."}</p>`;continue}
    const sims=rec.items.map(it=>({it,s:dot(myE,it.e)})).sort((a,b)=>b.s-a.s),best=sims[0],kg=kindGuess(rec,myE,seg),same=kg?rec.items.filter(it=>it.kind===kg.k):[],pool=same.length>=3?same:rec.items;
    const vr=varianceRows(myM&&!myM.empty?myM:null,pool),pct=v=>Math.round(Math.max(0,v)*100)+" %";
    el.innerHTML=`<h4>${esc(n.fr)} <span class="latin small">${esc(n.la)}</span></h4>
      <p class="small"><b>Ressemblance ${pct(best.s)}</b> avec la meilleure référence · ${rec.items.length} extraits</p>${kindLine(kg)}
      <div class="pair"><figure><canvas class="sono" data-k="me"></canvas><figcaption>Ta capture · ${t.toFixed(1)}–${(t+3).toFixed(1)} s</figcaption></figure><figure><canvas class="sono" data-k="ref"></canvas><figcaption>Réf. ${esc(best.it.kind||"type non précisé")} · ${pct(best.s)}</figcaption></figure></div>
      <div class="row"><button class="btn ghost sm" data-play="${esc(best.it.url)}" data-t="${best.it.t}">▶ Référence</button><a class="small" href="${esc(best.it.page)}" target="_blank" rel="noopener">Source</a><span class="small muted">${esc(best.it.attr)}</span></div>
      ${vr?`<div class="tablewrap"><table><thead><tr><th>Mesure</th><th>Toi</th><th>Habituel${same.length>=3?` (${esc(kg.k)})`:""}</th><th></th></tr></thead><tbody>${vr}</tbody></table></div>`:""}<p class="honest">${honestNote(pool.length)}</p>
      ${sims.length>1?`<details><summary class="small">Autres références (${sims.length-1})</summary><div class="hits">${sims.slice(1,8).map(z=>`<div class="hit"><span class="small">${esc(z.it.kind||"type non précisé")}</span><span class="pc">${pct(z.s)}</span><span class="sub"><button class="btn ghost sm" data-play="${esc(z.it.url)}" data-t="${z.it.t}">▶</button><a href="${esc(z.it.page)}" target="_blank" rel="noopener">source</a><span>${esc(z.it.attr)}</span></span></div>`).join("")}</div></details>`:""}`;
    requestAnimationFrame(()=>{drawSono(el.querySelector('[data-k="me"]'),mySono);drawSono(el.querySelector('[data-k="ref"]'),best.it.sono)});
    if(r===cands[0]&&kg&&!$("#typeIn").value&&KIND_TYPE[kg.k])$("#typeIn").value=KIND_TYPE[kg.k]}}
$("#cmpRes").addEventListener("click",e=>{const b=e.target.closest("[data-play]");if(b)playUrl(b.dataset.play,+b.dataset.t||0,3600)});
