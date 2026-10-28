/* Ramage : copie le son du micro par blocs de 2048 échantillons vers la page. */
class RamageTap extends AudioWorkletProcessor{
  constructor(){super();this.b=new Float32Array(2048);this.n=0}
  process(inputs){const ch=inputs[0]&&inputs[0][0];if(ch){for(let i=0;i<ch.length;i++){this.b[this.n++]=ch[i];if(this.n===2048){this.port.postMessage(this.b,[this.b.buffer]);this.b=new Float32Array(2048);this.n=0}}}return true}
}
registerProcessor("ramage-tap",RamageTap);
