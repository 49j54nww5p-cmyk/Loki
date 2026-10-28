/* =========================================================
   Ramage : socle (version, utilitaires, réglages, stockage)
   Les clés « huginn.* » et la base « huginn » sont gardées :
   ainsi le carnet, les sons et la liste de vie d'avant restent là.
   ========================================================= */
const VERSION="1.2.0";
const IN_CLAUDE=!!(window.claude&&window.claude.use);
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));

const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const S=Object.assign({fmax:11000,bufSec:30,capSec:10,range:70,thr:12,hp:300,gain:0,deviceId:"",night:false,sun:0,sens:1,conf:0.35,geo:0,mapSeason:0,autoCmp:true,autoRef:true,pal:0},LS.get("huginn.settings",{}));
const saveS=()=>LS.set("huginn.settings",S);

let toastT;
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("show"),2600)}
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmtT=ts=>new Date(ts).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
const fmtD=ts=>new Date(ts).toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
const kHz=v=>(v/1000).toFixed(v<10000?2:1);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ago=ms=>ms<4000?"à l'instant":ms<60000?`il y a ${Math.round(ms/1000)} s`:ms<3600000?`il y a ${Math.round(ms/60000)} min`:fmtT(Date.now()-ms);
const dureeTxt=ms=>{const m=Math.round(ms/60000);return m<60?`${m} min`:`${Math.floor(m/60)} h ${String(m%60).padStart(2,"0")}`};
const dprOf=()=>Math.min(window.devicePixelRatio||1,3);
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function vcmp(a,b){const x=String(a).split(".").map(Number),y=String(b).split(".").map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d}return 0}

async function saveFile(name,blob){
  if(IN_CLAUDE){try{const d=await window.claude.use("downloads");if(d){await d.save({filename:name,data:blob});toast("Fichier enregistré");return}}
    catch(e){if(e&&e.code==="declined"){toast("Enregistrement annulé");return}}toast("Téléchargement indisponible dans cet aperçu");return}
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}

/* ---- IndexedDB : sons des fiches, références, apprentissage ---- */
let idb=null;const memClips=new Map();
function openDB(){return new Promise(res=>{try{const r=indexedDB.open("huginn",3);r.onupgradeneeded=()=>{const d=r.result;["clips","refs","learn"].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n)})};r.onsuccess=()=>{idb=r.result;res()};r.onerror=()=>res()}catch(e){res()}})}
function dbGet(store,key){if(!idb)return Promise.resolve(null);return new Promise(res=>{try{const r=idb.transaction(store).objectStore(store).get(key);r.onsuccess=()=>res(r.result||null);r.onerror=()=>res(null)}catch(e){res(null)}})}
function dbPut(store,key,val){if(!idb)return Promise.resolve();return new Promise(res=>{try{const t=idb.transaction(store,"readwrite");t.objectStore(store).put(val,key);t.oncomplete=res;t.onerror=res}catch(e){res()}})}
function dbDel(store,key){if(!idb)return;try{idb.transaction(store,"readwrite").objectStore(store).delete(key)}catch(e){}}
function dbKeys(store){if(!idb)return Promise.resolve([]);return new Promise(res=>{try{const r=idb.transaction(store).objectStore(store).getAllKeys();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>res([])}catch(e){res([])}})}
function dbClear(store){if(!idb)return Promise.resolve();return new Promise(res=>{try{const t=idb.transaction(store,"readwrite");t.objectStore(store).clear();t.oncomplete=res;t.onerror=res}catch(e){res()}})}
function putClip(id,obj){memClips.set(id,obj);return dbPut("clips",id,obj)}
function getClip(id){return memClips.has(id)?Promise.resolve(memClips.get(id)):dbGet("clips",id)}
function delClip(id){memClips.delete(id);dbDel("clips",id)}

/* ---- carnet, liste de vie, sorties ---- */
let entries=LS.get("huginn.entries",[]);
const saveEntries=()=>LS.set("huginn.entries",entries);
let LIFE=LS.get("huginn.life",{});
const isLifer=la=>!!la&&!LIFE[la];
function addLife(fr,la){if(!la||LIFE[la])return false;LIFE[la]={fr,ts:Date.now()};LS.set("huginn.life",LIFE);return true}
const getSessions=()=>LS.get("huginn.sessions",[]);
function saveSession(rec){const a=getSessions();a.unshift(rec);LS.set("huginn.sessions",a.slice(0,60));renderLog()}

/* ---- types de vocalise ---- */
const TYPES=["Chant","Cri de contact","Cri d'alarme","Cri de vol","Cri de quémande (jeune)","Tambourinage","Chant de parade / en vol","Incertain"];
const KIND_TYPE={"chant":"Chant","babil":"Chant","cri":"Cri de contact","cri d'alarme":"Cri d'alarme","cri de vol":"Cri de vol","cri de vol nocturne":"Cri de vol","cri de quémande":"Cri de quémande (jeune)","tambourinage":"Tambourinage"};
const isSong=k=>/chant|babil/.test(k||"");
const kindVar=k=>!k?"var(--muted)":isSong(k)?"var(--song)":"var(--call)";

/* ---- icônes ---- */
const IC={bird:'<path d="M3 15.5c1.8.2 3.3-.3 4.6-1.4 1.5-1.3 2.6-3.7 5.6-4.4 2.4-.6 4.3.2 5.4 1.4l2.9-.3-2.3 1.9c0 3.7-3 6.8-7.3 6.8-2.7 0-4.9-1-6.5-2.6z"/>',
  wave:'<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10"/>',list:'<rect x="4" y="4" width="16" height="6" rx="2"/><rect x="4" y="14" width="16" height="6" rx="2"/>',
  frame:'<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="8" y="9" width="6" height="5" stroke-dasharray="2 2"/>',book:'<path d="M6 3h10l3 3v15H6z"/><path d="M9 9h7M9 13h7M9 17h4"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',two:'<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>'};
const svgIc=(k,s)=>`<svg viewBox="0 0 24 24" width="${s||24}" height="${s||24}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]||IC.spark}</svg>`;
const PLAY=`<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z"></path></svg>`;
