import { drawWavePlot, waveScene, waveSvg } from '../../graphics/wave-plot.mjs';
import { fmt, number } from './output.mjs';

export const visualModes=new Set(['harmonic','traveling','standing','lissajous']);
let playing=false,lastFrame=0;
export function stopAnimation(){ playing=false; }

function drawAt(time) {
  const mode=document.getElementById('waves-mode').value;
  if(!visualModes.has(mode)) return;
  const parameters=mode==='harmonic'?{a:number('a'),w:number('w'),phase:number('phase')}:
    mode==='lissajous'?{ax:number('ax'),ay:number('ay'),wx:number('wx'),wy:number('wy'),phase:number('phase')}:
      {a:number('a'),k:number('k'),w:number('w')};
  const canvas=document.getElementById('waves-canvas'),fallback=document.getElementById('waves-fallback');
  const drawn=drawWavePlot(canvas,mode,parameters,time);
  // Sin Canvas 2D: la misma escena como SVG estático y accesible.
  if(fallback){fallback.hidden=drawn;if(!drawn)fallback.innerHTML=waveSvg(mode,parameters,time);}
  if(canvas)canvas.hidden=!drawn;
  const scene=waveScene(mode,parameters,time);
  document.getElementById('waves-visual-description').textContent=`${mode==='harmonic'?'Fasor y gráfica temporal':mode==='lissajous'?'Trayectoria paramétrica':'Perfil de la onda'} en t = ${fmt(time)} s. ${scene?.phaseText?scene.phaseText+'.':''}${drawn?' Usa el deslizador o reproduce para explorar.':' Vista estática: este navegador no dibuja Canvas.'}`;
}
export function wavesTimeChanged() {
  playing=false;document.getElementById('waves-play').textContent='Reproducir';
  try {drawAt(Number(document.getElementById('waves-time').value));}
  catch(error) {document.getElementById('waves-visual-description').textContent=error.message;}
}
export function wavesRedraw() {
  try {drawAt(Number(document.getElementById('waves-time').value));} catch { /* valores aún no introducidos */ }
}
export function wavesToggleAnimation() {
  playing=!playing;
  document.getElementById('waves-play').textContent=playing?'Pausar':'Reproducir';
  if(!playing) return;
  lastFrame=0;
  const frame=now=>{
    if(!playing||!document.getElementById('waves-app').classList.contains('visible')) {playing=false;return;}
    const delta=lastFrame?Math.min(0.05,(now-lastFrame)/1000):0;
    lastFrame=now;
    const slider=document.getElementById('waves-time'),limit=Number(slider.max)||2;
    slider.value=String((Number(slider.value)+delta)%limit);
    wavesRedraw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
