/* =========================================================
   Audio : micro, filtre, mémoire rétro, GPS.
   Le son est copié dans un anneau avec un compteur d'échantillons absolu :
   le spectro et les détections se repèrent sur ce compteur, pas sur l'horloge,
   donc rien ne glisse quand le téléphone ralentit.
   ========================================================= */
let ac=null,hp=null,gainN=null,monitorN=null,tapNode=null,stream=null,srcNode=null,demoNode=null,watchId=null,lastFix=null;
const AUD={ring:null,pos:0,fill:0,total:0};
const gainValue=()=>Math.pow(10,S.gain/20);
function ctx(){if(!ac){const AC=window.AudioContext||window.webkitAudioContext;ac=new AC({latencyHint:"interactive"});
    hp=ac.createBiquadFilter();hp.type="highpass";hp.Q.value=.707;gainN=ac.createGain();monitorN=ac.createGain();monitorN.gain.value=0;
    hp.connect(gainN);gainN.connect(monitorN);monitorN.connect(ac.destination);applyAudioSettings()}
  if(ac.state!=="running")ac.resume();return ac}
function applyAudioSettings(){if(!ac)return;hp.frequency.value=S.hp>0?S.hp:10;gainN.gain.value=gainValue();monitorN.gain.value=$("#monitor").checked?gainValue():0}
function pushSamples(d){const r=AUD.ring;if(!r)return;const L=r.length,n=d.length;let p=AUD.pos;
  if(n>=L){r.set(d.subarray(n-L));p=0}else{const a=Math.min(n,L-p);r.set(d.subarray(0,a),p);if(a<n)r.set(d.subarray(a),0);p=(p+n)%L}
  AUD.pos=p;AUD.fill=Math.min(L,AUD.fill+n);AUD.total+=n}
async function ensureTap(){if(tapNode)return;ctx();const mute=ac.createGain();mute.gain.value=0;mute.connect(ac.destination);
  try{if(!ac.audioWorklet)throw 0;await ac.audioWorklet.addModule("worklet.js?v="+VERSION);tapNode=new AudioWorkletNode(ac,"ramage-tap",{numberOfInputs:1,numberOfOutputs:1,channelCount:1,channelCountMode:"explicit"});
    tapNode.port.onmessage=e=>pushSamples(e.data)}
  catch(e){tapNode=ac.createScriptProcessor(4096,1,1);tapNode.onaudioprocess=ev=>pushSamples(new Float32Array(ev.inputBuffer.getChannelData(0)))}
  hp.connect(tapNode);tapNode.connect(mute)}
function allocRing(){AUD.ring=new Float32Array(Math.round(ac.sampleRate*S.bufSec));AUD.pos=0;AUD.fill=0}
/* les « sec » dernières secondes ; .end = compteur absolu du dernier échantillon */
function grab(sec){const r=AUD.ring;if(!r||!AUD.fill)return null;const n=Math.min(AUD.fill,Math.round(sec*ac.sampleRate)),L=r.length,out=new Float32Array(n),st=(AUD.pos-n+L)%L;
  const a=Math.min(n,L-st);out.set(r.subarray(st,st+a));if(a<n)out.set(r.subarray(0,n-a),a);out.end=AUD.total;return out}

/* GPS */
function setGps(t,ok){const c=$("#chipGps");c.classList.toggle("ok",!!ok);c.lastElementChild.textContent=t}
function startGPS(){if(!navigator.geolocation){setGps("GPS");return}try{watchId=navigator.geolocation.watchPosition(p=>{lastFix={lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy};setGps(`±${Math.round(p.coords.accuracy)} m`,true);updateMask().catch(()=>{})},()=>setGps("GPS"),{enableHighAccuracy:true,maximumAge:15000,timeout:20000})}catch(e){}}
function stopGPS(){if(watchId!=null){try{navigator.geolocation.clearWatch(watchId)}catch(e){}watchId=null}}

/* micros disponibles (micro USB-C, parabole…) */
async function listDevices(){try{const ds=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="audioinput"),sel=$("#devSel");
  sel.innerHTML=`<option value="">Micro par défaut (iPhone ou micro branché)</option>`+ds.map(d=>`<option value="${esc(d.deviceId)}">${esc(d.label||"Micro")}</option>`).join("");sel.value=S.deviceId||""}catch(e){}}
$("#devSel").onchange=e=>{S.deviceId=e.target.value;saveS();if(running&&!demoNode){stopListen();startListen()}};

/* alertes : retour haptique iOS, bip, voix */
function haptic(strong){try{if(navigator.vibrate)navigator.vibrate(strong?[60,50,60]:40)}catch(e){}try{$("#hapL").click();if(strong)setTimeout(()=>$("#hapL").click(),140)}catch(e){}}
function beep(strong){if(!ac||S.beep===false)return;try{const t=ac.currentTime;[0,strong?.14:null].forEach(dt=>{if(dt==null)return;const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.value=strong?1320:880;g.gain.setValueAtTime(0,t+dt);g.gain.linearRampToValueAtTime(.06,t+dt+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dt+.09);o.connect(g);g.connect(ac.destination);o.start(t+dt);o.stop(t+dt+.1)})}catch(e){}}
function speak(t){if(S.voice===false||!t||!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(t);u.lang="fr-FR";u.rate=1.05;const v=speechSynthesis.getVoices().find(v=>/^fr/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}
function primeSpeech(){try{if(S.voice!==false&&window.speechSynthesis){const u=new SpeechSynthesisUtterance(" ");u.volume=0;speechSynthesis.speak(u)}}catch(e){}}
function alertNew(lifer,fr){if(S.haptic!==false)haptic(lifer);beep(lifer);if(fr)speak(lifer?"Nouveau ! "+fr:fr)}
