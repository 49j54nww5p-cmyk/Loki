/* =========================================================
   Navigation, réglages, sauvegarde, mode d'emploi, nouveautés, confidentialité
   ========================================================= */
function showTab(name){$$("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===name)));
  $$("main>section").forEach(s=>s.hidden=s.id!=="tab-"+name);$("#main").scrollTop=0;document.body.className=document.body.className.replace(/\btab-\w+/g,"").trim()+" tab-"+name;
  if(name==="analyse")requestAnimationFrame(drawClip);if(name==="settings"){renderModelInfo();renderRefInfo();renderLearnInfo()}if(name==="log")setLogPane(logPane);if(name==="listen")drawAxis($("#liveAxis"),0,S.fmax)}
$$("nav.tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$("#btnHelp").onclick=()=>{document.body.classList.toggle("help-on");$("#btnHelp").setAttribute("aria-pressed",String(document.body.classList.contains("help-on")))};

function bindSeg(id,key,cb){const g=$(id),set=()=>g.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.v===+S[key])));set();
  g.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;S[key]=+b.dataset.v;saveS();set();cb&&cb()})}
function bindRange(id,lbl,fmt,key,cb){const r=$(id);if(key&&S[key]!=null)r.value=S[key];const up=()=>$(lbl).textContent=fmt(+r.value);up();r.addEventListener("input",()=>{if(key){S[key]=+r.value;saveS()}up();cb&&cb()})}
function bindToggle(id,key,def,cb){const el=$(id);el.checked=def?S[key]!==false:!!S[key];el.onchange=()=>{S[key]=el.checked;saveS();cb&&cb(el.checked)}}
const xFmt=v=>"×"+Math.pow(10,v/20).toFixed(v>12?0:1);
bindSeg("#segHp","hp",applyAudioSettings);
bindSeg("#segFmax","fmax",()=>{drawAxis($("#liveAxis"),0,S.fmax);if(spec){renderOff();view.f1=Math.min(view.f1,off.fTop);if(view.f1<=view.f0)view={t0:view.t0,t1:view.t1,f0:0,f1:off.fTop};drawClip()}});
bindSeg("#segBuf","bufSec",()=>{if(ac&&running)allocRing()});
bindSeg("#segCap","capSec",()=>$("#capLbl").textContent=S.capSec+" s");
bindSeg("#segGeo","geo",()=>updateMask(true).catch(()=>{}));
bindRange("#gain","#gainLbl",xFmt,"gain",applyAudioSettings);
bindRange("#pgain","#pgainLbl",xFmt,null);
bindRange("#range","#rangeLbl",v=>v+" dB","range",()=>{buildLUT();if(spec){renderOff();drawClip()}});
bindRange("#specTop","#specTopLbl",v=>v+" dBFS","specTop",()=>{buildLUT();if(spec){renderOff();drawClip()}});
{const g=$("#segSpecMode"),set=()=>g.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.v==="1")===(S.specAuto===true))));set();
  g.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;S.specAuto=b.dataset.v==="1";saveS();set();buildLUT();if(spec){renderOff();drawClip()}})}
bindSeg("#segPal","pal",rethemed);
bindRange("#thr","#thrLbl",v=>"+"+v+" dB","thr");
bindRange("#sens","#sensLbl",v=>v.toFixed(2),"sens");
bindRange("#conf","#confLbl",v=>Math.round(v*100)+" %","conf",()=>{if(aiResults.bn||aiResults.perch)renderAiRes()});
$("#monitor").onchange=applyAudioSettings;
bindToggle("#hapT","haptic",true,on=>{if(on)haptic()});
bindToggle("#beepT","beep",true);
bindToggle("#voiceT","voice",true,on=>{if(on)speak("Annonce vocale activée")});
bindToggle("#glovesT","gloves",false,on=>document.body.classList.toggle("gloves",on));
bindToggle("#autoThrT","autoThr",true);
bindToggle("#rareT","rare",true);
bindToggle("#recAllT","recAll",true);
bindToggle("#perchLiveT","perchLive",true,on=>{if(on)autoPerch()});
bindToggle("#autoRefT","autoRef",true);
bindToggle("#autoCmp","autoCmp",true);

/* thèmes : nuit rouge, plein soleil */
function rethemed(){buildLUT();if(!running&&liveC.width)paintBg(liveX,liveC);if(spec){renderOff();drawClip()}if(map)renderMap()}
function setNight(on){document.documentElement.classList.toggle("night",on);S.night=on;saveS();$("#nightToggle").checked=on;rethemed()}
$("#nightToggle").onchange=e=>setNight(e.target.checked);
function applySun(){const on=S.sun===2||(S.sun===1&&(()=>{const h=new Date().getHours();return h>=9&&h<18})()),was=document.documentElement.classList.contains("sun");document.documentElement.classList.toggle("sun",on);if(was!==on)rethemed()}
bindSeg("#segSun","sun",applySun);setInterval(applySun,60000);

/* modèles */
$("#btnGetPerch").onclick=async()=>{if(IN_CLAUDE)return;const gp=$("#btnGetPerch");gp.disabled=true;gp.textContent="Démarrage…";
  try{await perchDownload();try{localStorage.removeItem("huginn.perchLoading")}catch(e){}toast("Perch v2 est sur le téléphone");$("#perchBar2").hidden=true;renderModelInfo();await perchActivate();toast("Perch v2 prêt")}
  catch(e){toast("Perch v2 : "+(e.message||e));AI.err="Perch : "+(e.message||e)}finally{gp.disabled=false;gp.textContent="Télécharger "+MODELS.perch.label+" ("+MODELS.perch.size+" Mo)";$("#perchBar2").hidden=true;$("#perchBar").hidden=true;$("#perchAsk").hidden=true;renderModelInfo();setAiChip()}};
{const el=$("#perchUrl");el.value=S.perchUrl||"";el.onchange=()=>{let v=el.value.trim().replace(/\/+$/,"");if(v&&!/^https:\/\//.test(v))v="https://"+v;el.value=v;S.perchUrl=v;saveS();setAiChip();renderModelInfo()};
  $("#perchUrlTest").onclick=async()=>{const i=$("#perchUrlInfo");el.onchange();if(!S.perchUrl){i.textContent="adresse vide";return}i.textContent="test… (1re fois : le serveur se réveille, jusqu'à 1 min)";
    try{const t=performance.now(),r=await fetch(S.perchUrl,{cache:"no-store"}),d=await r.json();i.textContent=d.ok?`✓ ${d.modele} · ${Math.round(performance.now()-t)} ms`:"réponse inattendue"}catch(e){i.textContent="injoignable : "+(e.message||e)}}}
$("#btnActPerch").onclick=async()=>{if(S.perchV==="full"&&IS_IPHONE&&!confirm("Perch complet demande environ 900 Mo de mémoire à l'activation : sur iPhone, Safari risque de fermer la page. Essayer quand même ?"))return;const b=$("#btnActPerch");b.disabled=true;b.textContent="Activation…";try{await perchActivate();toast("Perch v2 prêt")}catch(e){toast("Perch v2 : "+(e.message||e))}finally{b.disabled=false;b.textContent="Activer Perch v2";$("#perchBar2").hidden=true;renderModelInfo();setAiChip()}};
{const g=$("#segPerchV"),set=()=>g.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===(S.perchV==="full"?"full":"lite"))));set();
  g.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b||b.dataset.v===(S.perchV==="full"?"full":"lite"))return;S.perchV=b.dataset.v;saveS();set();
    if(AI.ready.perch){try{await wcall({t:"unload",name:"perch"})}catch(err){}AI.ready.perch=false}try{localStorage.removeItem("huginn.perchLoading")}catch(err){}
    $("#btnGetPerch").textContent="Télécharger "+MODELS.perch.label+" ("+MODELS.perch.size+" Mo)";renderModelInfo();setAiChip()})}
$("#btnFilePerch").onclick=()=>{if(!IN_CLAUDE)$("#perchFile").click()};
$("#perchFile").onchange=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;const b=$("#btnFilePerch");b.disabled=true;const bar=$("#perchBar2");bar.hidden=false;
  try{await perchImport(f,(got,tot)=>{bar.firstElementChild.style.width=(got/tot*100)+"%";b.textContent=`Copie ${Math.round(got/1e6)} / ${Math.round(tot/1e6)} Mo`});
    $("#segPerchV").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.v==="full")));toast(`Perch complet copié (${Math.round(f.size/1e6)} Mo) : activation…`);renderModelInfo();
    await perchActivate();toast("Perch v2 complet prêt")}
  catch(err){toast("Perch : "+(err.message||err));AI.err="Perch : "+(err.message||err)}finally{b.disabled=false;b.textContent="Charger depuis Fichiers";bar.hidden=true;renderModelInfo();setAiChip()}};
$("#btnDropPerch").onclick=async()=>{try{await wcall({t:"drop",name:"perch",key:MODELS.perch.key});AI.ready.perch=false;toast("Perch v2 supprimé du téléphone")}catch(e){toast("Suppression impossible")}renderModelInfo();setAiChip()};

/* apprentissage */
function renderLearnInfo(){let p=0,n=0;LEARN.forEach(o=>{p+=o.pos.length;n+=o.neg.length});$("#learnInfo").textContent=`${p} exemple${p>1?"s":""} validé${p>1?"s":""} et ${n} écarté${n>1?"s":""}, sur ${LEARN.size} espèce${LEARN.size>1?"s":""}. Chaque espèce validée ou écartée lui apprend à quoi ressemblent tes oiseaux et tes faux positifs.`}
$("#btnLearnReset").onclick=()=>{const b=$("#btnLearnReset");if(b.dataset.c!=="1"){b.dataset.c="1";b.textContent="Confirmer";setTimeout(()=>{b.dataset.c="";b.textContent="Tout oublier"},4000);return}
  LEARN.clear();dbClear("learn");b.dataset.c="";b.textContent="Tout oublier";renderLearnInfo();toast("Apprentissage remis à zéro")};

/* sauvegarde / restauration */
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));return btoa(s)};
const unb64=t=>{const s=atob(t),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
$("#btnBackup").onclick=async()=>{const btn=$("#btnBackup");btn.disabled=true;btn.textContent="Préparation…";try{const clips={};
    for(const e of entries){const c=await getClip(e.id);if(c)clips[e.id]={sr:c.sr,pcm:b64(new Uint8Array(c.pcm.buffer,c.pcm.byteOffset,c.pcm.byteLength))}}
    const learn={};LEARN.forEach((o,k)=>{learn[k]={pos:o.pos.map(a=>b64(new Uint8Array(Float32Array.from(a).buffer))),neg:o.neg.map(a=>b64(new Uint8Array(Float32Array.from(a).buffer)))}});
    const data={app:"huginn",name:"Ramage",v:VERSION,at:new Date().toISOString(),entries,clips,life:LIFE,sessions:getSessions(),settings:S,learn};
    await saveFile(`ramage_sauvegarde_${new Date().toISOString().slice(0,10)}.json`,new Blob([JSON.stringify(data)],{type:"application/json"}));$("#restoreMsg").textContent=`${entries.length} fiches et ${Object.keys(clips).length} sons dans la sauvegarde.`}
  catch(e){toast("Sauvegarde impossible : "+(e.message||e))}finally{btn.disabled=false;btn.textContent="Sauvegarder dans un fichier"}};
$("#restoreIn").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;try{const d=JSON.parse(await f.text());if(d.app!=="huginn")throw new Error("ce n'est pas une sauvegarde Ramage");
    const have=new Set(entries.map(x=>x.id));let ne=0;for(const x of d.entries||[]){if(have.has(x.id))continue;entries.push(x);ne++;const c=d.clips&&d.clips[x.id];if(c){const u=unb64(c.pcm);await putClip(x.id,{sr:c.sr,pcm:new Int16Array(u.buffer)})}}
    entries.sort((a,b)=>b.ts-a.ts);saveEntries();Object.entries(d.life||{}).forEach(([k,v])=>{if(!LIFE[k])LIFE[k]=v});LS.set("huginn.life",LIFE);
    const ses=getSessions(),sid=new Set(ses.map(s=>s.id));(d.sessions||[]).forEach(s=>{if(!sid.has(s.id))ses.push(s)});ses.sort((a,b)=>b.start-a.start);LS.set("huginn.sessions",ses.slice(0,60));
    Object.entries(d.learn||{}).forEach(([k,o])=>{const cur=LEARN.get(k)||{pos:[],neg:[]};(o.pos||[]).forEach(t=>cur.pos.push(new Float32Array(unb64(t).buffer)));(o.neg||[]).forEach(t=>cur.neg.push(new Float32Array(unb64(t).buffer)));cur.pos=cur.pos.slice(0,25);cur.neg=cur.neg.slice(0,25);LEARN.set(k,cur);dbPut("learn",k,cur)});
    renderLog();renderLearnInfo();$("#restoreMsg").textContent=`Restauré : ${ne} fiche${ne>1?"s":""} ajoutée${ne>1?"s":""}, liste de vie et sorties fusionnées.`;toast("Sauvegarde restaurée")}
  catch(err){$("#restoreMsg").textContent="Restauration impossible : "+(err.message||err)}};

/* mode d'emploi : visite guidée, un rond et une flèche sur les vrais boutons */
const GUIDE=[
  {t:"Bienvenue sur Ramage",d:"Une minute de visite : je te montre où tout se trouve, directement sur l'appli. Touche « Suivant », ou glisse vers la gauche."},
  {tab:"listen",el:"#btnStart",round:1,t:"Écouter",d:"Touche ce bouton pour lancer l'écoute. Il disparaît pendant l'écoute ; le son est analysé sur le téléphone."},
  {tab:"listen",el:"#liveWrap",t:"Le spectro",d:"Le son défile de droite à gauche : la hauteur en kHz, la force en couleur (dBFS, comme Raven). Le nom de chaque espèce reconnue s'inscrit au-dessus de son chant. Double-tap : plein écran."},
  {tab:"listen",el:"#liveList",demo:1,t:"Les oiseaux entendus",d:"Chaque espèce garde sa ligne et s'allume quand elle chante : CHANT ou CRI, score, et « 2 IA ✓ » quand BirdNET+ et Perch sont d'accord. Ici, un exemple."},
  {tab:"listen",el:"#liveList .sp",demo:1,swipe:1,t:"Glisse pour trier",d:"Vers la droite : validé au carnet. Vers la gauche : écarté, et Ramage apprend de ton choix. Touche la ligne pour la fiche de l'espèce."},
  {tab:"listen",ctrl:1,el:"#btnListen",round:1,t:"Arrêter",d:"Pendant l'écoute, ce bouton rouge arrête tout. Ramage te demande alors si tu gardes l'enregistrement complet."},
  {tab:"listen",ctrl:1,el:"#btnCapture",t:"Capturer",d:"Garde les dernières secondes, même un chant déjà passé, et l'ouvre dans Analyse."},
  {tab:"listen",ctrl:1,el:"#btnBlack",t:"La nuit",d:"Écran noir et enregistrement toute la nuit, parabole branchée. Au réveil : les 5 meilleurs extraits par espèce, rangés pour Faune-France."},
  {el:"#chipAi",t:"L'état des IA",d:"Point vert « IA ×2 » : BirdNET+ et Perch sont prêts. ☁ : Perch complet tourne sur ton serveur. Orange : chargement."},
  {el:"#btnHelp",round:1,t:"Le « ? »",d:"Affiche une petite explication sous chaque outil et chaque réglage."},
  {el:'nav.tabs [data-tab="analyse"]',t:"Analyse",d:"Importe un son ou ouvre une capture : encadre au doigt, 9 mesures, ralenti jusqu'à ⅛, nettoyage, comparaison aux références."},
  {el:'nav.tabs [data-tab="log"]',t:"Carnet",d:"Sorties, nuits, enregistrements, fiches, ta collection Plumage et la carte. Exports CSV, GeoJSON et ZIP."},
  {tab:"settings",el:"#segGeo",t:"Filtre géographique",d:"« autour de moi » : les espèces probables ici cette semaine (conseillé). « France + raretés » : 601 espèces, vagabonds compris, aux bonnes semaines."},
  {tab:"settings",el:()=>$("#modelInfo").closest(".card"),t:"Les modèles",d:"BirdNET+ et Perch se téléchargent une fois et restent sur le téléphone. Colle ici l'adresse de ton serveur pour Perch complet."},
  {tab:"settings",el:"#btnTour",t:"Revoir le guide",d:"Il est ici, dans Réglages › À propos, quand tu veux. Bonne écoute !"}];
const GD={i:0,on:false};
const DEMO_ROWS=`<div class="sp on g-demo" style="--k:var(--song)"><div class="ph"></div><div class="mid"><div class="nm">Rougegorge familier</div><div class="la">Erithacus rubecula</div><div class="tags"><span class="tg k" style="--k:var(--song)">CHANT</span><span class="tg ai2">2 IA ✓</span></div></div><div class="rt"><span class="pct">92<small>%</small></span><span class="eq"><i></i><i></i><i></i></span></div></div>
<div class="sp g-demo" style="--k:var(--call)"><div class="ph"></div><div class="mid"><div class="nm">Pinson des arbres</div><div class="la">Fringilla coelebs</div><div class="tags"><span class="tg k" style="--k:var(--call)">CRI</span></div></div><div class="rt"><span class="pct">74<small>%</small></span><span class="ago">il y a 23 s</span></div></div>`;
function guideDemo(on){const l=$("#liveList");l.querySelectorAll(".g-demo").forEach(e=>e.remove());const em=l.querySelector(".empty");
  if(on&&!l.querySelector(".sp")){l.insertAdjacentHTML("afterbegin",DEMO_ROWS);if(em)em.hidden=true}else if(em)em.hidden=false}
function openTour(){if(running){toast("Arrête l'écoute pour suivre le guide");return}GD.i=0;GD.on=true;$("#guide").hidden=false;document.body.classList.add("guiding");guideGo()}
function endTour(){GD.on=false;$("#guide").hidden=true;document.body.classList.remove("guiding","g-ctrl");guideDemo(false);showTab("listen");S.toured=Date.now();S.newsSeen=VERSION;saveS()}
function guideGo(){const s=GUIDE[GD.i];if(s.tab&&!document.body.classList.contains("tab-"+s.tab))showTab(s.tab);
  document.body.classList.toggle("g-ctrl",!!s.ctrl);guideDemo(!!s.demo);
  const t=s.el?(typeof s.el==="function"?s.el():$(s.el)):null;
  if(t){const r=t.getBoundingClientRect(),top=60,bot=innerHeight-(s.ctrl?0:150);if(r.top<top||r.bottom>bot){t.scrollIntoView({block:"center",behavior:"instant"})}}
  requestAnimationFrame(()=>requestAnimationFrame(()=>guideDraw(s,t)))}
function guideDraw(s,t){const W=innerWidth,H=innerHeight,last=GD.i===GUIDE.length-1;
  const b=$("#gBub");b.innerHTML=`<span class="eyebrow">${GD.i+1} / ${GUIDE.length}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p>
   <div class="tact">${GD.i?`<button class="btn ghost" id="gPrev">Retour</button>`:`<button class="btn ghost" id="gSkip">Passer</button>`}<button class="btn primary" id="gNext">${last?"C'est parti":"Suivant"}</button></div>`;
  $("#gNext").onclick=()=>{if(last)endTour();else{GD.i++;guideGo()}};if(GD.i)$("#gPrev").onclick=()=>{GD.i--;guideGo()};else $("#gSkip").onclick=endTour;
  const hole=$("#gHole"),ring=$("#gRing"),arr=$("#gArr"),sw=$("#gSwipe");sw.hidden=true;
  if(!t||!t.getClientRects().length){hole.setAttribute("d","");ring.setAttribute("d","");arr.setAttribute("d","");b.style.top=Math.max(80,H/2-120)+"px";b.style.bottom="auto";b.classList.add("mid");return}
  b.classList.remove("mid");const r=t.getBoundingClientRect(),pad=s.round?10:8,cx=r.left+r.width/2,cy=r.top+r.height/2;let shape,ex,ey;
  if(s.round){const R=Math.max(r.width,r.height)/2+pad;shape=`M${cx-R} ${cy}a${R} ${R} 0 1 0 ${2*R} 0a${R} ${R} 0 1 0 ${-2*R} 0z`;var hr={t:cy-R,b:cy+R,l:cx-R,r:cx+R}}
  else{const x=Math.max(4,r.left-pad),y=r.top-pad,w=Math.min(W-8,r.right+pad)-x,h=r.height+2*pad,k=Math.min(16,h/2);
    shape=`M${x+k} ${y}h${w-2*k}a${k} ${k} 0 0 1 ${k} ${k}v${h-2*k}a${k} ${k} 0 0 1 ${-k} ${k}h${-(w-2*k)}a${k} ${k} 0 0 1 ${-k} ${-k}v${-(h-2*k)}a${k} ${k} 0 0 1 ${k} ${-k}z`;var hr={t:y,b:y+h,l:x,r:x+w}}
  hole.setAttribute("d",shape);ring.setAttribute("d",shape);
  const below=(hr.t+hr.b)/2<H*.48;b.style.top=below?Math.min(H-b.offsetHeight-16,hr.b+56)+"px":"auto";b.style.bottom=below?"auto":Math.min(H-b.offsetHeight-16,H-hr.t+56)+"px";
  const bb=b.getBoundingClientRect(),sx=Math.min(bb.right-40,Math.max(bb.left+40,cx)),sy=below?bb.top-6:bb.bottom+6;
  ex=Math.min(hr.r-6,Math.max(hr.l+6,cx));ey=below?hr.b+8:hr.t-8;
  if(Math.abs(sy-ey)<14){arr.setAttribute("d","")}else{const bend=(sx<W/2?1:-1)*Math.min(60,Math.abs(sy-ey)*.6);arr.setAttribute("d",`M${sx} ${sy}Q${(sx+ex)/2+bend} ${(sy+ey)/2} ${ex} ${ey}`)}
  if(s.swipe){sw.hidden=false;sw.style.left=(r.left+r.width/2-14)+"px";sw.style.top=(r.top+r.height/2-14)+"px"}}
$("#guide").addEventListener("touchstart",e=>{GD.x=e.touches[0].clientX},{passive:true});
$("#guide").addEventListener("touchend",e=>{if(GD.x==null)return;const dx=e.changedTouches[0].clientX-GD.x;GD.x=null;if(dx<-60&&GD.i<GUIDE.length-1){GD.i++;guideGo()}else if(dx>60&&GD.i>0){GD.i--;guideGo()}});
addEventListener("resize",()=>{if(GD.on)guideGo()});
addEventListener("keydown",e=>{if(!GD.on)return;if(e.key==="Escape")endTour();else if(e.key==="ArrowRight"&&GD.i<GUIDE.length-1){GD.i++;guideGo()}else if(e.key==="ArrowLeft"&&GD.i>0){GD.i--;guideGo()}});

/* nouveautés */
const NEWS=[
  {n:"1.9",d:"1er novembre 2026",items:[["spark","Un vrai mode d'emploi","Visite guidée sur l'appli elle-même : un rond doré et une flèche montrent chaque bouton, avec son explication. Réglages › À propos › Mode d'emploi pour la revoir."]]},
  {n:"1.8",d:"1er novembre 2026",items:[["two","Perch complet sur serveur","Réglages › Modèles : colle l'adresse de ton serveur Perch (Hugging Face) et le vrai Perch de 413 Mo donne son avis, même sur iPhone. Le son n'est envoyé que quand BirdNET+ entend quelque chose."]]},
  {n:"1.7",d:"1er novembre 2026",items:[["bird","France + raretés de saison","Nouvelle liste : les 601 espèces possibles en France (raretés de migration comprises : Pouillots de Pallas, à grands sourcils, brun…), chacune seulement aux semaines où elle passe. Remplace le mode à 8 000 espèces. En « autour de moi », une rareté hors liste locale n'est acceptée que si elle est dans cette liste et de saison."]]},
  {n:"1.6.2",d:"1er novembre 2026",items:[["two","Perch v2 : les scores comme Google l'a entraîné","Softmax sur toutes ses classes. Testé sur de vrais chants xeno-canto : le pinson sort à 59–92 %, les autres espèces restent sous 5 %, le bruit sous 6 %."]]},
  {n:"1.6.1",d:"1er novembre 2026",items:[["two","Perch ne voit plus de hiboux dans le silence","La v1.6 lisait mal les scores de Perch : sur du bruit, Chouette hulotte et Hibou moyen-duc sortaient à 100 %. Les scores sont recalés sur des mesures (bruit : moins de 25 %, vrais chants : 60 à 99 %)."],["book","Perch complet depuis Fichiers","Réglages › Modèles › « Charger depuis Fichiers » : choisis perch_v2_no_dft.onnx rangé sur ton iPhone, plus besoin de le télécharger dans l'appli."]]},
  {n:"1.6",d:"1er novembre 2026",items:[["wave","Enregistrement continu","Tout ce que tu écoutes est enregistré. À l'arrêt, Ramage te demande si tu gardes l'enregistrement complet (Carnet › Sorties, export en m4a)."],["two","Fini les espèces inventées par Perch","Perch notait ses espèces les unes par rapport aux autres : sur du bruit, l'une sortait forcément haut. Chaque espèce a maintenant sa vraie probabilité ; Perch seul n'ajoute une espèce qu'à 85 % et plus."],["bird","Raretés plus strictes","Une espèce hors liste doit atteindre 75 % chez BirdNET+, et être confirmée par Perch s'il est activé."]]},
  {n:"1.5",d:"1er novembre 2026",items:[["wave","Spectro étalonné en dBFS","Même échelle que Audacity, Raven ou Sonic Visualiser : fenêtre de Hann, 1024 points, de −100 à −20 dBFS par défaut. Une même couleur veut toujours dire le même niveau, d'un enregistrement à l'autre."],["bird","BirdNET+ se recharge","Corrige l'erreur « téléchargement coupé à 67 / 60 Mo »."]]},
  {n:"1.4.1",d:"1er novembre 2026",items:[["wave","Spectro qui ne sature plus","Le niveau se cale tout seul sur le bruit de fond : fond sombre, oiseaux en clair, même avec la parabole ou un micro sensible. Le contraste (Réglages) règle la plage au-dessus du fond."]]},
  {n:"1.4",d:"28 octobre 2026",items:[["moon","La nuit complète","Toute la nuit enregistrée (AAC, une pièce par heure) et, pour chaque espèce, les 5 meilleurs extraits de 10 s. Au réveil : un dossier ZIP trié nuit › espèce › extraits, avec le tableau des espèces à 80 % et plus."]]},
  {n:"1.3",d:"28 octobre 2026",items:[["bird","Les raretés ne sont plus effacées","Avant, une espèce non attendue ici cette semaine (comme le Pouillot verdâtre à Lanton) était filtrée d'office. Maintenant elle passe si BirdNET+ est très sûr, marquée « rareté ? à vérifier »."]]},
  {n:"1.2.1",d:"28 octobre 2026",items:[["two","Perch : légère ou complète","Choisis dans Réglages › Modèles : la légère (131 Mo) ou la complète (413 Mo, pleine précision). Les deux peuvent rester sur le téléphone."]]},
  {n:"1.2",d:"28 octobre 2026",items:[["two","Perch v2 allégé","Version int8 de 131 Mo au lieu de 413 : elle tient dans la mémoire de l'iPhone. Elle est servie par l'appli elle-même, rangée par morceaux sur le téléphone, et le téléchargement reprend s'il est coupé. L'ancien fichier de 413 Mo est supprimé pour libérer la place."]]},
  {n:"1.1",d:"28 octobre 2026",items:[["wave","Spectro en carte de chaleur","Palette scientifique « chaleur » (inferno), avec viridis ou gris au choix dans Réglages, barre de couleurs en dB et grille kHz / secondes."],["spark","Plus sobre","Gris neutres, l'or seulement pour l'essentiel. Chant en vert d'eau, cri en bleu."],["bird","Gros bouton Écouter","Au centre ; il disparaît pendant l'écoute, tu arrêtes avec le bouton rouge en bas."]]},
  {n:"1.0",d:"28 octobre 2026",items:[["spark","Nouvelle base, plus sobre","L'appli est réécrite proprement. Tes fiches, tes sons, ta liste de vie et ce qu'elle a appris sont gardés."],["list","Spectro + liste qui s'allume","En haut le spectro, en dessous les espèces entendues qui s'allument quand elles chantent. Gros bouton en bas."],["bird","Chant ou cri, sans tricher","Chaque espèce dit chant ou cri, d'après les références proches ou la forme du son. Un « ? » quand ce n'est pas sûr."],["two","Double avis","« 2 IA ✓ » quand BirdNET+ et Perch v2 sont d'accord."],["wave","Plus de décalage","Le spectro et les noms se calent sur le son lui-même, plus sur l'horloge : ils restent alignés même quand le téléphone rame."],["frame","Radar retiré","Sans micro directionnel il ne disait rien de vrai. Il reviendra avec la parabole."]]},
  {n:"0.8",d:"28 octobre 2026",items:[["bird","Huginn devient Ramage","Encre et or, et l'ouverture « la plume devient chant »."]]},
  {n:"0.5 à 0.7",d:"28 octobre 2026",items:[["bird","L'IA apprend de toi","Validations et rejets affinent les détections."],["spark","Pièges sonores","Sosies et imitations signalés."],["book","Données","Nettoyage du son, sauvegarde fichier, carte filtrable, Plumage."]]},
  {n:"0.1 à 0.4",d:"28 octobre 2026",items:[["wave","Les bases","Spectro, capture rétro, analyse, carnet GPS, BirdNET+, Perch v2, références Wikimedia Commons, sorties et nuits."]]}];
function openNews(all){const list=all?NEWS:NEWS.filter(n=>!S.newsSeen||vcmp(n.n.split(" ")[0],S.newsSeen)>0);if(!list.length)return;
  openSheet(`<div class="sumhead"><span class="eyebrow">Version ${esc(VERSION)}</span><h2>${all?"Toutes les versions":"Quoi de neuf ?"}</h2></div>
   <div class="newslist">${list.map(n=>`${list.length>1?`<div class="nv"><b>v${esc(n.n)}</b><span>${esc(n.d)}</span></div>`:""}${n.items.map(([ic,t,d])=>`<div class="nit"><span class="nic">${svgIc(ic,20)}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></div>`).join("")}`).join("")}</div>
   <div class="row" style="margin-top:12px"><button class="btn primary" id="newsOk">Super</button></div>`,"news");
  $("#newsOk").onclick=closeSheet;S.newsSeen=VERSION;saveS()}

/* confidentialité et sources */
const SOURCES=[
  ["BirdNET+ V3.0 et son géomodèle","https://github.com/birdnet-team/birdnet-live-app","L'identification des chants et des cris, et la liste des espèces probables selon le lieu et la semaine. Le modèle tourne sur ton téléphone.","BirdNET Team (K. Lisa Yang Center, Cornell Lab of Ornithology, et Université technique de Chemnitz). Licence Apache 2.0. Modèle adapté pour calculer dans le navigateur, résultats vérifiés identiques. C'est une préversion : sa précision n'est pas encore publiée."],
  ["Perch v2 (int8)","https://github.com/JamesHollyer/fluttr-assets/releases/tag/model-perch-v2-int8-1","Le 2e avis, téléchargé seulement si tu le demandes.","Google DeepMind, licence Apache 2.0. Version ONNX quantifiée en int8 publiée par James Hollyer (Fluttr), hébergée avec l'appli ; liste des classes de cgeorgiaw/Perch (Hugging Face)."],
  ["onnxruntime-web","https://onnxruntime.ai","Le moteur qui fait tourner les modèles dans le navigateur, chargé depuis jsDelivr.","Microsoft, licence MIT."],
  ["Wikimedia Commons","https://commons.wikimedia.org","Les enregistrements de référence : comparaison, chant ou cri, variance, sons à réécouter. Le type vient de ce que l'auteur a écrit : il peut être faux.","Licence libre propre à chaque fichier, affichée avec l'auteur."],
  ["iNaturalist","https://www.inaturalist.org","Les photos des espèces.","Chaque photo garde sa licence et son auteur, affichés dans la fiche."],
  ["OpenStreetMap et Leaflet","https://www.openstreetmap.org/copyright","Le fond et l'affichage de la carte du carnet.","© contributeurs OpenStreetMap (ODbL) ; Leaflet, licence BSD-2-Clause, chargé depuis cdnjs."],
  ["IM Fell English, IBM Plex","https://fonts.google.com","La typographie, chargée depuis Google Fonts.","SIL Open Font License 1.1."],
  ["Critères des sosies sonores","","Les textes des pièges sonores : résumé simplifié des critères classiques des guides.","En cas de doute, ton guide et ton oreille font foi."]];
function openAbout(){openSheet(`<div class="sumhead"><span class="eyebrow">Ramage · v${esc(VERSION)}</span><h2>Confidentialité et sources</h2></div>
  <div class="prose"><p><b>Pas de compte, pas de publicité, pas de traceur.</b> Le son du micro est analysé sur ton téléphone et n'est jamais envoyé.</p>
   <h3>Ce qui reste sur ton téléphone</h3><ul><li>Ton carnet, tes sons, ta liste de vie, tes sorties, tes réglages.</li><li>Ce que Ramage a appris, la bibliothèque de références, les modèles et les photos, pour marcher sans réseau.</li><li>Ta position GPS : elle sert au filtre des espèces (calculé sur le téléphone) et à tes fiches.</li></ul>
   <h3>Ce qui sort</h3><ul><li>Les fichiers et modèles sont téléchargés chez les services ci-dessous, qui voient l'adresse IP de ton appareil.</li><li><b>Wikimedia Commons et iNaturalist</b> reçoivent seulement le nom latin de l'espèce.</li><li><b>La carte</b> demande à OpenStreetMap les tuiles de la zone affichée.</li><li><b>Tes exports et sauvegardes</b> ne vont que là où tu les ranges.</li></ul>
   <h3>Hébergement</h3><ul><li>GitHub Pages, qui enregistre l'adresse IP des visiteurs pour la sécurité.</li></ul>
   <small class="muted">Mise à jour : 28 octobre 2026.</small></div>
  <div class="sumhead"><h3>Sources</h3></div>
  <div class="srcs">${SOURCES.map(([n,u,d,l])=>`<div class="src"><div class="sh"><b>${esc(n)}</b>${u?`<a href="${esc(u)}" target="_blank" rel="noopener">ouvrir ↗</a>`:""}</div><p>${esc(d)}</p><small>${esc(l)}</small></div>`).join("")}</div>`,"about")}
$("#btnTour").onclick=openTour;$("#btnNews").onclick=()=>openNews(true);$("#btnAbout").onclick=openAbout;
$("#btnDemo").onclick=()=>{loadClip(genDemo());showTab("analyse")};
$("#btnWipe").onclick=async()=>{const b=$("#btnWipe");if(b.dataset.c!=="1"){b.dataset.c="1";b.textContent="Toucher encore pour tout effacer";setTimeout(()=>{b.dataset.c="";b.textContent="Tout effacer"},5000);return}
  try{Object.keys(localStorage).filter(k=>k.startsWith("huginn.")).forEach(k=>localStorage.removeItem(k))}catch(e){}
  try{if(idb)idb.close();indexedDB.deleteDatabase("huginn")}catch(e){}try{await caches.delete("huginn-models")}catch(e){}location.replace(location.pathname)};
