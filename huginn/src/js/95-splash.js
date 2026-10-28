/* =========================================================
   Ouverture : la plume au vent se fend en empreinte sonore.
   Touche n'importe où pour passer ; ensuite mode d'emploi ou nouveautés.
   ========================================================= */
function featherSVG(){let seed=13;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280},f=v=>v.toFixed(1);
  const M=23,X0=-150,L=300,P=L/M,N=2*M,bend=x=>14*((x/150)*(x/150)-1);
  const prof=(x,a)=>{if(x<-108)return .8;const t=(x+108)/258;if(t>=1)return .8;return a*Math.pow(Math.sin(Math.PI*Math.pow(t,.8)),.55)+.8};
  const H=[];for(let i=0;i<M;i++)H.push(Math.round(6+rnd()*26+(i%4===1?6:0)));
  const nT={15:.72,16:.9,31:.78,32:.93},nB={22:.75,23:.92},fx=[],ex=[];
  for(let k=0;k<N;k++){fx.push(X0+k*L/(N-1));const c=Math.floor(k/2);ex.push(k%2===0?X0+c*P:X0+(c+1)*P-.3)}
  const rx=[];for(let k=0;k<=10;k++)rx.push(150-k*30);
  const vane=(sg,a,nt,fin)=>{let s="M"+f(X0)+" "+f(fin?0:bend(X0));for(let k=0;k<N;k++){const x=fin?ex[k]:fx[k],y=fin?sg*H[Math.floor(k/2)]:bend(x)+sg*prof(x,a)*(nt[k]||1);s+=" L"+f(x)+" "+f(y)}
    rx.forEach(x=>s+=" L"+f(x)+" "+f(fin?0:bend(x)));return s+" Z"};
  const tA=vane(-1,32,nT,0),tB=vane(-1,32,nT,1),bA=vane(1,24,nB,0),bB=vane(1,24,nB,1);
  let clip="M"+f(X0)+" "+f(bend(X0));for(let k=0;k<N;k++)clip+=" L"+f(fx[k])+" "+f(bend(fx[k])-prof(fx[k],32)*(nT[k]||1));for(let k=N-1;k>=0;k--)clip+=" L"+f(fx[k])+" "+f(bend(fx[k])+prof(fx[k],24)*(nB[k]||1));clip+=" Z";
  const stripes=nar=>{let s="";for(let c=0;c<M;c++){const a=nar?X0+(c+.5)*P-3:X0+c*P-.4,b=nar?X0+(c+.5)*P+3:X0+(c+1)*P+.4;s+="M"+f(a)+" -60 H"+f(b)+" V60 H"+f(a)+" Z "}return s.trim()};
  const sw=stripes(0),sn=stripes(1);let barbs="";
  for(let x=-104;x<146;x+=4.5){const x2=x+16;barbs+="M"+f(x)+" "+f(bend(x))+" Q"+f(x+9)+" "+f(bend(x)-14)+" "+f(x2)+" "+f(bend(x2)-prof(x2,34))+" M"+f(x)+" "+f(bend(x))+" Q"+f(x+9)+" "+f(bend(x)+10)+" "+f(x2)+" "+f(bend(x2)+prof(x2,26))+" "}
  let fluff="";for(let k=0;k<6;k++){const bx=-118+k*3.5;fluff+="M"+f(bx)+" "+f(bend(bx))+" q"+f(-8-k)+" "+f(-12+k*4)+" "+f(-18-k*2)+" "+f(-10+k*4.5)+" "}
  const rA="M-150 "+f(bend(-150))+" Q0 -28 150 "+f(bend(150)),rB="M-162 0 Q0 0 162 0";
  const bars=m=>{let s="";for(let c=0;c<M;c++){const cx=X0+(c+.5)*P,h=Math.max(1,Math.min(40,H[c]*m[c])-3);s+="M"+f(cx)+" "+f(-h)+" V"+f(h)+" "}return s.trim()};
  const one=[],m1=[],m2=[],m3=[];for(let i=0;i<M;i++){one.push(1);m1.push(.5+rnd()*.9);m2.push(.4+rnd()*1.1);m3.push(.6+rnd()*.7)}
  const b0=bars(one),sp=n=>Array(n).fill(".45 0 .55 1").join(";"),A=`dur="6.5s" repeatCount="1" fill="freeze"`;
  return `<defs><mask id="rgStr" maskUnits="userSpaceOnUse" x="-220" y="-120" width="440" height="240"><path fill="#fff" d="${sw}"><animate attributeName="d" ${A} keyTimes="0;.508;.554;1" values="${sw};${sw};${sn};${sn}" calcMode="spline" keySplines="${sp(3)}"/></path></mask><clipPath id="rgVane"><path d="${clip}"/></clipPath></defs>
  <g class="spwind">
    <path d="M-240 -120 C -130 -145, -10 -85, 240 -130" stroke-dasharray="80 640" style="animation-duration:1.9s"/>
    <path d="M-240 -50 C -110 -70, 20 -20, 240 -70" stroke-dasharray="60 660" style="animation-duration:2.3s;animation-delay:.6s;opacity:.7"/>
    <path d="M-240 50 C -90 25, 30 75, 240 35" stroke-dasharray="90 630" style="animation-duration:2.1s;animation-delay:1.1s"/>
    <path d="M-240 100 C -120 80, 60 120, 240 85" stroke-dasharray="50 670" style="animation-duration:2.6s;animation-delay:.3s;opacity:.6"/></g>
  <g transform="scale(1.12)"><g><animateTransform attributeName="transform" type="rotate" ${A} keyTimes="0;.092;.185;.277;.369;.446;1" values="-32;-25;-37;-27;-33;0;0" calcMode="spline" keySplines="${sp(6)}"/>
   <g><animateTransform attributeName="transform" type="translate" ${A} keyTimes="0;.092;.185;.277;.369;.446;1" values="0 0;5 -7;-4 5;4 -4;0 0;0 0;0 0" calcMode="spline" keySplines="${sp(6)}"/>
    <g mask="url(#rgStr)"><animate attributeName="opacity" ${A} keyTimes="0;.546;.569;1" values="1;1;0;0"/>
     <path d="${tA}" fill="#f1e6c8" stroke="#3a2c14" stroke-width="1.1" stroke-linejoin="round"><animate attributeName="d" ${A} keyTimes="0;.446;.508;1" values="${tA};${tA};${tB};${tB}" calcMode="spline" keySplines="${sp(3)}"/><animate attributeName="fill" ${A} keyTimes="0;.446;.508;1" values="#f1e6c8;#f1e6c8;#e8cf8f;#e8cf8f"/></path>
     <path d="${bA}" fill="#d4b77a" stroke="#3a2c14" stroke-width="1.1" stroke-linejoin="round"><animate attributeName="d" ${A} keyTimes="0;.446;.508;1" values="${bA};${bA};${bB};${bB}" calcMode="spline" keySplines="${sp(3)}"/><animate attributeName="fill" ${A} keyTimes="0;.446;.508;1" values="#d4b77a;#d4b77a;#d6b25e;#d6b25e"/></path></g>
    <g clip-path="url(#rgVane)"><animate attributeName="opacity" ${A} keyTimes="0;.423;.462;1" values="1;1;0;0"/><path d="${barbs}" fill="none" stroke="#a9843f" stroke-width=".8" stroke-linecap="round" opacity=".55"/><path d="M-90 ${f(bend(-90)-6)} Q 0 ${f(bend(0)-12)} 90 ${f(bend(90)-8)}" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>
    <path d="${fluff}" fill="none" stroke="#efe2c0" stroke-width="1.3" stroke-linecap="round" opacity=".7"><animate attributeName="opacity" ${A} keyTimes="0;.423;.462;1" values=".7;.7;0;0"/></path>
    <path d="${rA}" fill="none" stroke="#b8964f" stroke-width="2.4" stroke-linecap="round"><animate attributeName="d" ${A} keyTimes="0;.446;.508;1" values="${rA};${rA};${rB};${rB}" calcMode="spline" keySplines="${sp(3)}"/><animate attributeName="stroke-width" ${A} keyTimes="0;.446;.508;1" values="2.4;2.4;1.4;1.4"/><animate attributeName="stroke" ${A} keyTimes="0;.446;.508;1" values="#b8964f;#b8964f;#8c7a55;#8c7a55"/></path>
    <path class="spbars" d="${b0}" fill="none" stroke="#e8cf8f" stroke-width="6" stroke-linecap="round" opacity="0"><animate attributeName="opacity" ${A} keyTimes="0;.546;.569;1" values="0;0;1;1"/><animate attributeName="d" ${A} keyTimes="0;.575;.65;.72;.79;.86;1" values="${b0};${b0};${bars(m1)};${bars(m2)};${bars(m3)};${b0};${b0}" calcMode="spline" keySplines="${sp(6)}"/></path>
   </g></g></g>`}
const SPF={done:false,t:0};
function endSplash(){if(SPF.done)return;SPF.done=true;clearTimeout(SPF.t);const s=$("#splash");s.classList.add("gone");setTimeout(()=>{s.hidden=true;$("#spFeather").innerHTML=""},700);
  if(!S.toured)openTour();else if(S.newsSeen&&vcmp(VERSION,S.newsSeen)>0)setTimeout(()=>openNews(false),300);else if(!S.newsSeen){S.newsSeen=VERSION;saveS()}}
function startSplash(){const sv=$("#spFeather"),sp=$("#splash");
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){sp.classList.add("still");SPF.t=setTimeout(endSplash,1200)}
  else{sv.innerHTML=featherSVG();try{sv.setCurrentTime(0);sv.unpauseAnimations()}catch(e){}SPF.t=setTimeout(endSplash,5600)}
  sp.addEventListener("pointerup",endSplash)}
