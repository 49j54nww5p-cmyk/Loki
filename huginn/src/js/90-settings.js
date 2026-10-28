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
  catch(e){toast("Perch v2 : "+(e.message||e));AI.err="Perch : "+(e.message||e)}finally{gp.disabled=false;gp.textContent="Télécharger Perch v2 (131 Mo)";$("#perchBar2").hidden=true;$("#perchBar").hidden=true;$("#perchAsk").hidden=true;renderModelInfo();setAiChip()}};
$("#btnActPerch").onclick=async()=>{const b=$("#btnActPerch");b.disabled=true;b.textContent="Activation…";try{await perchActivate();toast("Perch v2 prêt")}catch(e){toast("Perch v2 : "+(e.message||e))}finally{b.disabled=false;b.textContent="Activer Perch v2";$("#perchBar2").hidden=true;renderModelInfo();setAiChip()}};
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

/* mode d'emploi */
const TOUR=[
  {ic:"bird",t:"Bienvenue sur Ramage",d:"Ramage reconnaît les oiseaux à leur ramage, chants et cris, directement sur ton téléphone, même sans réseau une fois les modèles chargés."},
  {ic:"wave",t:"Écouter",d:"Touche « Écouter » au centre et tends le téléphone ; pour arrêter, le bouton rouge en bas. Le spectro défile en haut ; chaque espèce reconnue s'inscrit dessus, au moment où elle chante."},
  {ic:"list",t:"La liste qui s'allume",d:"En dessous, les espèces entendues gardent leur place et s'allument quand elles chantent. Chaque ligne dit chant ou cri, et « 2 IA ✓ » quand BirdNET+ et Perch v2 sont d'accord. Un « ? » veut dire : pas encore sûr."},
  {ic:"two",t:"Valider, écarter",d:"Glisse une espèce vers la droite pour la valider au carnet, vers la gauche pour l'écarter : Ramage apprend de tes choix. Touche-la pour sa fiche : photo, référence, ressemblance et variance."},
  {ic:"frame",t:"Capturer, analyser",d:"Les 30 dernières secondes restent en mémoire : « Capturer » garde un son déjà passé. Dans Analyse, encadre un son au doigt : mesures, ralenti jusqu'à ⅛, nettoyage, comparaison aux références."},
  {ic:"moon",t:"La nuit",d:"Bouton « Nuit » : écran noir, téléphone sur batterie. Ramage garde 4 s autour de chaque son et te donne le rapport au réveil."},
  {ic:"shield",t:"Tout reste chez toi",d:"Pas de compte. Le son est analysé sur le téléphone et n'est jamais envoyé. Sauvegarde de temps en temps (Réglages) et ajoute Ramage à l'écran d'accueil depuis Safari."}];
const TST={i:0};
function renderTour(){const s=TOUR[TST.i],last=TST.i===TOUR.length-1;
  $("#tourIn").innerHTML=`<div class="tart">${svgIc(s.ic,40)}</div><span class="eyebrow">${TST.i+1} / ${TOUR.length}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p><div class="tdots">${TOUR.map((_,k)=>`<i class="${k===TST.i?"on":""}"></i>`).join("")}</div>
   <div class="tact">${last?"":`<button class="btn ghost" id="tSkip">Passer</button>`}<button class="btn primary" id="tNext">${last?"C'est parti":"Suivant"}</button></div>`;
  $("#tNext").onclick=()=>{if(last)endTour();else{TST.i++;renderTour()}};if(!last)$("#tSkip").onclick=endTour}
function openTour(){TST.i=0;$("#tour").hidden=false;renderTour()}
function endTour(){$("#tour").hidden=true;S.toured=Date.now();S.newsSeen=VERSION;saveS()}
$("#tour").addEventListener("touchstart",e=>{TST.x=e.touches[0].clientX},{passive:true});
$("#tour").addEventListener("touchend",e=>{if(TST.x==null)return;const dx=e.changedTouches[0].clientX-TST.x;TST.x=null;if(dx<-60&&TST.i<TOUR.length-1){TST.i++;renderTour()}else if(dx>60&&TST.i>0){TST.i--;renderTour()}});

/* nouveautés */
const NEWS=[
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
