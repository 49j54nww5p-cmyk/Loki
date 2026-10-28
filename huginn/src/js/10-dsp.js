/* =========================================================
   Signal : FFT, spectrogrammes, mesures, WAV, nettoyage, rééchantillonnage
   ========================================================= */
function makeFFT(N){const lev=Math.log2(N)|0,rev=new Uint32Array(N);for(let i=0;i<N;i++){let r=0,x=i;for(let j=0;j<lev;j++){r=(r<<1)|(x&1);x>>=1}rev[i]=r}
  const cos=new Float32Array(N/2),sin=new Float32Array(N/2);for(let i=0;i<N/2;i++){cos[i]=Math.cos(2*Math.PI*i/N);sin[i]=Math.sin(2*Math.PI*i/N)}
  const win=new Float32Array(N);for(let i=0;i<N;i++)win[i]=.5-.5*Math.cos(2*Math.PI*i/(N-1));const re=new Float32Array(N),im=new Float32Array(N);
  /* src : tableau ; off : début ; outPow : puissance par bande (N/2) ; ring : longueur de l'anneau si src est circulaire */
  return function(src,off,outPow,ring){for(let i=0;i<N;i++){const k=ring?(off+i)%ring:off+i;const v=src[k]||0;re[rev[i]]=v*win[i];im[rev[i]]=0}
    for(let size=2;size<=N;size<<=1){const h=size>>1,step=N/size;for(let i=0;i<N;i+=size){for(let j=0,k=0;j<h;j++,k+=step){const tr=re[i+j+h]*cos[k]+im[i+j+h]*sin[k],ti=im[i+j+h]*cos[k]-re[i+j+h]*sin[k];re[i+j+h]=re[i+j]-tr;im[i+j+h]=im[i+j]-ti;re[i+j]+=tr;im[i+j]+=ti}}}
    for(let b=0;b<N/2;b++)outPow[b]=re[b]*re[b]+im[b]*im[b]}}

const NFFT=1024,fft=makeFFT(NFFT);
function stftOf(samples,sr){const bins=NFFT/2,maxFrames=6000;let hop=256,frames=Math.max(1,Math.floor((samples.length-NFFT)/hop)+1);
  if(frames>maxFrames){hop=Math.ceil((samples.length-NFFT)/(maxFrames-1));frames=Math.floor((samples.length-NFFT)/hop)+1}
  const db=new Float32Array(frames*bins),pw=new Float32Array(bins);let mx=-300;
  for(let f=0;f<frames;f++){fft(samples,f*hop,pw);for(let b=0;b<bins;b++){const v=10*Math.log10(pw[b]+1e-12);db[f*bins+b]=v;if(b>2&&v>mx)mx=v}}
  return{db,frames,bins,hop,sr,max:mx,dur:samples.length/sr,binHz:sr/NFFT,frameDt:hop/sr}}

/* mesures d'un son (cadre optionnel) : fréquences, durée, notes, rythme, pente, signal/bruit */
function measure(sp,box){const b0=Math.max(3,Math.floor((box?box.fa:1000)/sp.binHz)),b1=Math.min(sp.bins-1,Math.ceil((box?box.fb:Math.min(12000,sp.sr/2-1))/sp.binHz));
  const f0=box?Math.max(0,Math.floor(box.ta/sp.frameDt)):0,f1=box?Math.min(sp.frames-1,Math.ceil(box.tb/sp.frameDt)):sp.frames-1;
  if(f1<=f0||b1<=b0)return null;let mx=-300;for(let f=f0;f<=f1;f++)for(let b=b0;b<=b1;b++){const v=sp.db[f*sp.bins+b];if(v>mx)mx=v}
  const fm=[];for(let f=f0;f<=f1;f++){let m=-300;for(let b=b0;b<=b1;b++)m=Math.max(m,sp.db[f*sp.bins+b]);fm.push(m)}const noise=fm.slice().sort((a,b)=>a-b)[Math.floor(fm.length*.2)];
  const thr=Math.max(mx-20,noise+6);let fmin=Infinity,fmax=-Infinity,first=-1,last=-1;const sum=new Float64Array(b1+1),pkT=[],pkF=[],act=[];
  for(let f=f0;f<=f1;f++){let pm=-300,pb=0,on=false;for(let b=b0;b<=b1;b++){const v=sp.db[f*sp.bins+b];if(v>thr){on=true;const fr=b*sp.binHz;if(fr<fmin)fmin=fr;if(fr>fmax)fmax=fr;sum[b]+=Math.pow(10,v/10)}if(v>pm){pm=v;pb=b}}
    act.push(on);if(on){if(first<0)first=f;last=f;pkT.push(f*sp.frameDt);pkF.push(pb*sp.binHz)}}
  if(first<0)return{empty:true,snr:mx-noise};
  let pbin=b0;for(let b=b0;b<=b1;b++)if(sum[b]>sum[pbin])pbin=b;
  const gapF=Math.max(1,Math.round(.015/sp.frameDt)),minF=Math.max(1,Math.round(.005/sp.frameDt));let notes=0,run=0,gap=gapF+1;
  for(let i=0;i<act.length;i++){if(act[i]){run++;gap=0}else{gap++;if(gap>gapF&&run>0){if(run>=minF)notes++;run=0}}}if(run>=minF)notes++;
  let slope=0;if(pkT.length>3){const n=pkT.length,mt=pkT.reduce((a,b)=>a+b)/n,mf=pkF.reduce((a,b)=>a+b)/n;let num=0,den=0;for(let i=0;i<n;i++){num+=(pkT[i]-mt)*(pkF[i]-mf);den+=(pkT[i]-mt)**2}slope=den?num/den:0}
  const dur=(last-first+1)*sp.frameDt;
  return{fpk:pbin*sp.binHz,fmin,fmax,bw:fmax-fmin,dur,notes,rate:dur>0?notes/dur:0,slope,snr:mx-noise}}

/* palette du spectro, reprise des couleurs du thème */
function hex2rgb(h){h=h.trim().replace("#","");if(h.length===3)h=h.split("").map(c=>c+c).join("");const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255]}
const LUT=new Uint8Array(256*3);
function buildLUT(){const st=["--spec0","--spec1","--spec2","--spec3"].map(v=>hex2rgb(cssVar(v)||"#000")),pos=[0,.35,.68,1];
  for(let i=0;i<256;i++){const x=i/255;let k=0;while(k<2&&x>pos[k+1])k++;const f=(x-pos[k])/(pos[k+1]-pos[k]);for(let c=0;c<3;c++)LUT[i*3+c]=Math.round(st[k][c]+(st[k+1][c]-st[k][c])*f)}}
function sizeCanvas(c){const r=c.getBoundingClientRect(),d=dprOf(),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;return true}return false}
function paintBg(ctx,c){ctx.fillStyle=`rgb(${LUT[0]},${LUT[1]},${LUT[2]})`;ctx.fillRect(0,0,c.width,c.height)}
function drawAxis(el,fmin,fmax){const step=fmax-fmin>9000?2000:fmax-fmin>3000?1000:500;let h="";for(let f=Math.ceil(fmin/step)*step;f<fmax;f+=step){if(f<=fmin)continue;h+=`<span style="top:${(1-(f-fmin)/(fmax-fmin))*100}%">${(f/1000).toFixed(step<1000?1:0)} k</span>`}el.innerHTML=h}

/* mini-spectro 150 × 128 (0–12 kHz) gardé avec les références */
function miniSono(seg){const sp=stftOf(seg,32000),cols=150,rows=128,top=Math.min(sp.bins,Math.round(12000/sp.binHz)),o=new Uint8Array(cols*rows),lo=sp.max-70;
  for(let c=0;c<cols;c++){const f0=Math.floor(c*sp.frames/cols),f1=Math.max(f0+1,Math.floor((c+1)*sp.frames/cols));for(let r=0;r<rows;r++){const b0=Math.floor(r*top/rows),b1=Math.max(b0+1,Math.floor((r+1)*top/rows));let m=-300;
      for(let f=f0;f<f1;f++)for(let b=b0;b<b1;b++){const v=sp.db[f*sp.bins+b];if(v>m)m=v}o[(rows-1-r)*cols+c]=Math.round(Math.max(0,Math.min(1,(m-lo)/70))*255)}}return o}
function drawSono(cv,sono){if(!cv||!sono)return;const d=dprOf(),r=cv.getBoundingClientRect();cv.width=Math.max(1,Math.round(r.width*d));cv.height=Math.max(1,Math.round(r.height*d));
  const x=cv.getContext("2d"),off=document.createElement("canvas");off.width=150;off.height=128;const ox=off.getContext("2d"),img=ox.createImageData(150,128);
  for(let i=0;i<sono.length;i++){const li=sono[i]*3;img.data[i*4]=LUT[li];img.data[i*4+1]=LUT[li+1];img.data[i*4+2]=LUT[li+2];img.data[i*4+3]=255}ox.putImageData(img,0,0);x.imageSmoothingEnabled=true;x.drawImage(off,0,0,cv.width,cv.height)}

/* WAV */
function encodeWav(samples,sr){const n=samples.length,buf=new ArrayBuffer(44+n*2),v=new DataView(buf),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,"RIFF");v.setUint32(4,36+n*2,true);w(8,"WAVE");w(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){const s=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,s<0?s*32768:s*32767,true)}return new Blob([buf],{type:"audio/wav"})}
const toI16=f=>{const o=new Int16Array(f.length);for(let i=0;i<f.length;i++){const s=Math.max(-1,Math.min(1,f[i]));o[i]=s<0?s*32768:s*32767}return o};
const toF32=a=>{const o=new Float32Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]/32768;return o};

/* nettoyage du bruit (soustraction spectrale) */
function cfft(re,im,inv){const n=re.length;for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]}}
  for(let len=2;len<=n;len<<=1){const a=(inv?2:-2)*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<len/2;k++){const ur=re[i+k],ui=im[i+k],vr=re[i+k+len/2]*cr-im[i+k+len/2]*ci,vi=re[i+k+len/2]*ci+im[i+k+len/2]*cr;
    re[i+k]=ur+vr;im[i+k]=ui+vi;re[i+k+len/2]=ur-vr;im[i+k+len/2]=ui-vi;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t}}}if(inv)for(let i=0;i<n;i++){re[i]/=n;im[i]/=n}}
function denoise(x){const N=1024,H=256,W=new Float32Array(N);for(let i=0;i<N;i++)W[i]=.5-.5*Math.cos(2*Math.PI*i/N);const F=Math.max(1,Math.floor((x.length-N)/H)+1),B=N/2+1;
  const mags=new Float32Array(F*B),re=new Float32Array(N),im=new Float32Array(N);
  for(let f=0;f<F;f++){for(let i=0;i<N;i++){re[i]=(x[f*H+i]||0)*W[i];im[i]=0}cfft(re,im,false);for(let b=0;b<B;b++)mags[f*B+b]=Math.hypot(re[b],im[b])}
  const noise=new Float32Array(B),col=new Float32Array(F);for(let b=0;b<B;b++){for(let f=0;f<F;f++)col[f]=mags[f*B+b];noise[b]=Array.from(col).sort((p,q)=>p-q)[Math.floor(F*.2)]||0}
  const out=new Float32Array(x.length),norm=new Float32Array(x.length);
  for(let f=0;f<F;f++){for(let i=0;i<N;i++){re[i]=(x[f*H+i]||0)*W[i];im[i]=0}cfft(re,im,false);
    for(let b=0;b<B;b++){const m=mags[f*B+b]||1e-9,g=Math.max(.05,1-2*noise[b]/m);re[b]*=g;im[b]*=g;if(b>0&&b<N/2){re[N-b]=re[b];im[N-b]=-im[b]}}
    cfft(re,im,true);for(let i=0;i<N;i++){const k=f*H+i;if(k<out.length){out[k]+=re[i]*W[i];norm[k]+=W[i]*W[i]}}}
  for(let i=0;i<out.length;i++)out[i]=out[i]/Math.max(norm[i],1.5);return out}

/* vers 32 kHz (fréquence des modèles) */
async function to32k(x,sr){if(sr===32000)return x;const len=Math.max(1,Math.round(x.length*32000/sr));
  try{const oc=new OfflineAudioContext(1,len,32000),b=oc.createBuffer(1,x.length,sr);b.copyToChannel(x,0);const s=oc.createBufferSource();s.buffer=b;s.connect(oc.destination);s.start();return(await oc.startRendering()).getChannelData(0)}
  catch(e){const o=new Float32Array(len),k=sr/32000;for(let i=0;i<len;i++){const t=i*k,j=Math.floor(t),f=t-j,a=(x[j-1]||0)*.25+(x[j]||0)*.5+(x[j+1]||0)*.25,b=(x[j]||0)*.25+(x[j+1]||0)*.5+(x[j+2]||0)*.25;o[i]=a+(b-a)*f}return o}}
function fit(x,n){if(x.length===n)return x;const o=new Float32Array(n);o.set(x.subarray(0,Math.min(n,x.length)));return o}
function quant(a,q){const s=a.slice().sort((x,y)=>x-y),p=(s.length-1)*q,i=Math.floor(p);return s[i]+(s[Math.min(i+1,s.length-1)]-s[i])*(p-i)}
const dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s};

/* extrait synthétique de démonstration */
function genDemo(){const sr=32000,dur=9,n=sr*dur,x=new Float32Array(n);let lp=0;
  for(let i=0;i<n;i++){const w=Math.random()*2-1;lp=lp*.97+w*.03;x[i]=lp*.03+Math.sin(2*Math.PI*90*i/sr)*.004}
  function tone(t0,d,f0,f1,amp,harm){const s=Math.floor(t0*sr),m=Math.floor(d*sr);let ph=0;for(let i=0;i<m&&s+i<n;i++){const u=i/m,f=f0+(f1-f0)*u;ph+=2*Math.PI*f/sr;const env=Math.sin(Math.PI*u)**1.5;let v=Math.sin(ph);if(harm)v+=.35*Math.sin(2*ph);x[s+i]+=v*amp*env}}
  function phrase(t){let tt=t;for(let k=0;k<7;k++){tone(tt,.075,6200-180*k,4300-150*k,.22);tt+=.115}for(let k=0;k<4;k++){tone(tt,.05,5200,3200,.25);tt+=.075}tone(tt,.11,2900,6100,.25,true);tone(tt+.11,.17,6100,2400,.28,true)}
  phrase(.7);phrase(4.6);[3.15,3.55,3.9,7.55].forEach(t=>tone(t,.028,9200,7100,.18));[8.15,8.45].forEach(t=>tone(t,.045,2950,2750,.2,true));
  return{sr,samples:x,title:"Extrait de démonstration",info:"Signal synthétique (pas un vrai oiseau) : une phrase descendante façon pinson ×2, des « tsip » aigus et deux cris bas.",source:"demo"}}
