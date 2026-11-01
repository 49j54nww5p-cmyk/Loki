/* =========================================================
   Analyse rapide : « Capturer » ouvre les dernières secondes
   dans un volet par-dessus l'écoute, qui continue derrière.
   ========================================================= */
const QK={n:0};
function quickSono(cv,x){const sp=stftOf(x,32000),d=dprOf(),r=cv.getBoundingClientRect();cv.width=Math.max(1,Math.round(r.width*d));cv.height=Math.max(1,Math.round(r.height*d));
  const cols=Math.min(600,cv.width),rows=160,top=Math.min(sp.bins,Math.round(Math.min(S.fmax||11000,16000)/sp.binHz)),lo=sp.max-70,img=new ImageData(cols,rows);
  for(let c=0;c<cols;c++){const f0=Math.floor(c*sp.frames/cols),f1=Math.max(f0+1,Math.floor((c+1)*sp.frames/cols));
    for(let rr=0;rr<rows;rr++){const b0=Math.floor(rr*top/rows),b1=Math.max(b0+1,Math.floor((rr+1)*top/rows));let m=-300;
      for(let f=f0;f<f1;f++)for(let b=b0;b<b1;b++){const v=sp.db[f*sp.bins+b];if(v>m)m=v}
      const li=Math.round(Math.max(0,Math.min(1,(m-lo)/70))*255)*3,o=((rows-1-rr)*cols+c)*4;img.data[o]=LUT[li];img.data[o+1]=LUT[li+1];img.data[o+2]=LUT[li+2];img.data[o+3]=255}}
  const off=document.createElement("canvas");off.width=cols;off.height=rows;off.getContext("2d").putImageData(img,0,0);const g=cv.getContext("2d");g.imageSmoothingEnabled=true;g.drawImage(off,0,0,cv.width,cv.height);
  return top*sp.binHz}
const QCOL=["var(--accent)","var(--song)","var(--call)"];
async function quickCapture(){const s=grab(S.capSec);if(!s){toast("Rien en mémoire pour l'instant");return}
  const sr=ac.sampleRate,dur=s.length/sr,ts=Date.now(),fix=lastFix,n=++QK.n;
  loadClip({sr,samples:s,title:"Capture "+fmtT(ts),info:`${dur.toFixed(1)} s captées${fix?` · ${fix.lat.toFixed(5)}, ${fix.lon.toFixed(5)} ±${Math.round(fix.acc)} m`:""}`,source:demoNode?"demo":"micro",ts,fix});
  openSheet(`<div class="sumhead"><span class="eyebrow">Analyse rapide · ${Math.round(dur)} dernières secondes</span><h2>Qui chantait ?</h2>
      <p class="small qlive">${running?"● L'écoute continue derrière, rien n'est coupé":"Écoute arrêtée"}</p></div>
    <div class="qwrap"><canvas class="qsono" id="qSono"></canvas><span class="qf" id="qTop"></span><div class="qmarks" id="qMarks"></div>
      <div class="qt mono"><span>−${Math.round(dur)} s</span><span>−${Math.round(dur/2)} s</span><span>maintenant</span></div></div>
    <div class="qres" id="qRes"><p class="small muted">BirdNET+ écoute l'extrait…</p></div>
    <div class="qacts"><button class="btn ghost" id="qFull">Analyse détaillée</button><button class="btn primary" id="qBack">Retour à l'écoute</button></div>`,"quick");
  $("#qBack").onclick=closeSheet;$("#qFull").onclick=()=>{closeSheet();showTab("analyse");if(S.autoCmp!==false&&AI.ready.bn)setTimeout(()=>$("#btnBn").click(),50)};
  const x=await to32k(s,sr);if(n!==QK.n)return;
  requestAnimationFrame(()=>{const cv=$("#qSono");if(cv){const ft=quickSono(cv,x);$("#qTop").textContent=kHz(ft)+" kHz"}});
  if(IN_CLAUDE){$("#qRes").innerHTML=`<p class="small muted">L'IA tourne seulement dans la version GitHub Pages.</p>`;return}
  try{if(!AI.ready.bn){$("#qRes").innerHTML=`<p class="small muted">Chargement de BirdNET+…</p>`;await ensureAI()}
    const D=x.length/32000,thr=S.conf||.35,st3=[];for(let t=0;t===0||t+1.5<=D-1.5;t+=1.5)st3.push(Math.min(t,Math.max(0,D-3)));
    const res=await runBN2(st3.map(t=>x.subarray(Math.round(t*32000),Math.round(t*32000)+96000)));if(n!==QK.n||!$("#qRes"))return;
    const sc=res.map(o=>postBN(o.raw)),bn=aggregate(sc,st3,thr),emb=res.map(o=>o.emb);
    const Q={x,D,thr,bn,sc,emb,perch:null,s,sr,ts,fix,saved:new Set()};QK.cur=Q;quickRender(Q);
    if(AI.ready.perch||perchRemoteOn()){const st5=[];for(let t=0;t===0||t+2.5<=D-2.5;t+=2.5)st5.push(Math.min(t,Math.max(0,D-5)));
      const ps=await runPerch(st5.map(t=>x.subarray(Math.round(t*32000),Math.round(t*32000)+160000)));if(n!==QK.n||!$("#qRes"))return;
      Q.perch=aggregate(ps,st5,thr);quickRender(Q)}}
  catch(e){const r=$("#qRes");if(r)r.innerHTML=`<p class="small muted">Analyse impossible : ${esc(e.message||e)}</p>`}}
function quickRender(Q){const pm=new Map((Q.perch||[]).map(r=>[r.i,r])),rows=[];
  Q.bn.slice(0,6).forEach(r=>{if(r.max>=.1)rows.push({i:r.i,bn:r.max,wins:r.wins,pe:pm.has(r.i)?pm.get(r.i).max:null})});
  (Q.perch||[]).forEach(p=>{if(p.max>=.3&&!rows.some(r=>r.i===p.i))rows.push({i:p.i,bn:0,wins:p.wins.map(t=>t),pe:p.max,w5:1})});
  rows.forEach(r=>r.best=Math.max(r.bn,r.pe||0));rows.sort((a,b)=>b.best-a.best);Q.rows=rows;
  const el=$("#qRes");if(!el)return;
  if(!rows.length){el.innerHTML=`<p class="small muted">Aucun oiseau net dans ces ${Math.round(Q.D)} secondes. Le son est peut-être trop loin ou trop faible : ouvre l'analyse détaillée pour regarder le spectro de près.</p>`;$("#qMarks").innerHTML="";return}
  const perTxt=Q.perch?"":AI.ready.perch||perchRemoteOn()?" · Perch écoute…":"";
  el.innerHTML=`<p class="small muted">${rows.filter(r=>r.best>=Q.thr).length} espèce(s) au-dessus du seuil de ${Math.round(Q.thr*100)} %${perTxt}</p>`+rows.map((r,k)=>{const n=nameOf(r.i),two=r.pe!=null&&r.pe>=.3&&r.bn>=Q.thr*.9,done=Q.saved.has(r.i),rk=rarity(r.i);
    return`<div class="sp qrow${k<3?" on":""}${r.best<Q.thr?" weak":""}" style="--k:${QCOL[k]||"var(--muted)"}"><div class="ph">${imgPh(n.la,"s")}</div>
      <div class="mid"><div class="nm">${esc(n.fr)}</div><div class="la">${esc(n.la)}</div><div class="tags">${two?`<span class="tg ai2">2 IA ✓</span>`:""}${rk?`<span class="tg rare">${rk[1]}</span>`:""}<span class="tg">BirdNET+ ${r.bn?Math.round(r.bn*100)+" %":"—"}</span>${Q.perch?`<span class="tg">Perch ${r.pe!=null?Math.round(r.pe*100)+" %":"—"}</span>`:""}</div></div>
      <div class="rt"><span class="pct">${Math.round(r.best*100)}<small>%</small></span><button class="btn ${done?"ghost":"primary"} sm" data-qok="${r.i}" ${done?"disabled":""}>${done?"✓ carnet":"Valider"}</button></div></div>`}).join("");
  const mk=[];rows.slice(0,3).forEach((r,k)=>{const w=r.w5?5:3;mergeWins(r.wins,w).forEach(([a,b])=>mk.push(`<i style="left:${a/Q.D*100}%;width:${Math.max(1.5,(Math.min(b,Q.D)-a)/Q.D*100)}%;top:${k*7}px;background:${QCOL[k]}"></i>`))});
  $("#qMarks").innerHTML=mk.join("")}
document.addEventListener("click",async e=>{const b=e.target.closest("[data-qok]");if(!b||!QK.cur)return;const Q=QK.cur,i=+b.dataset.qok,n=nameOf(i),r=Q.rows.find(x=>x.i===i);if(!r||Q.saved.has(i))return;
  b.disabled=true;const id=uid(),fx=Q.fix,lv=LIVE.get(i);
  const ent={id,ts:Q.ts,lat:fx?fx.lat:null,lon:fx?fx.lon:null,acc:fx?fx.acc:null,sp:n.fr,la:n.la,type:lv&&lv.kind?KIND_TYPE[lv.kind.k]||"":"",notes:"Analyse rapide",source:demoNode?"demo":"micro",dur:Q.s.length/Q.sr,m:null,
    ai:{m:r.bn>=(r.pe||0)?"BirdNET+":"Perch v2",fr:n.fr,la:n.la,sc:r.best}};
  await putClip(id,{sr:Q.sr,pcm:toI16(Q.s)});const m=measure(stftOf(Q.s,Q.sr),null);if(m&&!m.empty)ent.m=m;
  entries.unshift(ent);saveEntries();const nw=addLife(n.fr,n.la);let bw=0,bs=-1;Q.sc.forEach((p,w)=>{if(p[i]>bs){bs=p[i];bw=w}});learnAdd(n.la,Q.emb[bw],true);
  if(lv){lv.validated=true;lv.lifer=false;renderLive()}Q.saved.add(i);quickRender(Q);renderLog();toast(nw?`${n.fr} : nouvelle espèce sur ta liste de vie !`:`${n.fr} validé au carnet`)});
