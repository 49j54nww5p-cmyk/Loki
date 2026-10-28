/* =========================================================
   Démarrage
   ========================================================= */
if(S.night)document.documentElement.classList.add("night");$("#nightToggle").checked=!!S.night;applySun();
document.body.classList.toggle("gloves",!!S.gloves);document.body.classList.add("tab-listen");
$("#aboutVer").textContent="v"+VERSION;
buildLUT();drawAxis($("#liveAxis"),0,S.fmax);requestAnimationFrame(()=>{sizeCanvas(liveC);paintBg(liveX,liveC);sizeCanvas(liveO)});
refreshSpeciesList();loadClip(genDemo());renderLive();setAiChip();startSplash();
openDB().then(()=>{learnLoad();renderLog()});
if(!IN_CLAUDE)ensureAI().then(autoPerch);
window.addEventListener("online",refPump);
if(location.hostname==="localhost")window.__r={AI,LIVE,MARKS,AUD,SPECT,renderLive,openFocus,addMark,drawOverlay,REF,S,nightHit,openNight,exportNightZip,getNights,get running(){return running}};
/* mise à jour : GitHub Pages garde la page 10 min en cache, on compare avec la version en ligne */
async function checkUpdate(){if(IN_CLAUDE||!/^https?:/.test(location.protocol))return;try{const r=await fetch(location.pathname+"?check="+Date.now(),{cache:"no-store"});if(!r.ok)return;const m=(await r.text()).match(/const VERSION="([\d.]+)"/);
  if(m&&m[1]!==VERSION&&vcmp(m[1],VERSION)>0){$("#updTxt").textContent=`Nouvelle version v${m[1]}`;$("#upd").hidden=false;$("#updGo").onclick=()=>location.replace(location.pathname+"?v="+m[1])}}catch(e){}}
checkUpdate();document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkUpdate()});
