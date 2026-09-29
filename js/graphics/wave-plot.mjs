import { readCanvasPalette } from './colors.mjs';

export function drawWavePlot(canvas,mode,parameters,time=0) {
  if(!canvas||!['harmonic','traveling','standing','lissajous'].includes(mode)) return false;
  const width=Math.max(240,Math.round(canvas.clientWidth||600)),height=260;
  const ratio=Math.min(2,typeof window!=='undefined'?window.devicePixelRatio||1:1);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  const ctx=canvas.getContext('2d');
  if(!ctx) return false;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  const color=readCanvasPalette();
  ctx.fillStyle=color('surface-result');ctx.fillRect(0,0,width,height);
  const left=42,right=width-18,top=18,bottom=height-34;
  ctx.strokeStyle=color('border2');ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(left,(top+bottom)/2);ctx.lineTo(right,(top+bottom)/2);
  ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.stroke();
  const count=240,availableWidth=right-left,availableHeight=bottom-top;
  const xMap=x=>left+x*availableWidth,yMap=y=>top+(1-y)*availableHeight/2;
  let points=[],marker=null,axisLabel='x';
  if(mode==='harmonic') {
    const {a,w,phase}=parameters,span=2,scale=Math.max(0.05,a);
    points=Array.from({length:count+1},(_,i)=>[i/count,a/scale*Math.cos(w*span*i/count+phase)]);
    const phaseTime=((time%span)+span)%span;
    const x=phaseTime/span;marker=[x,a/scale*Math.cos(w*phaseTime+phase)];axisLabel='t (0–2 s)';
  } else if(mode==='lissajous') {
    const {ax,ay,wx,wy,phase}=parameters,scale=Math.max(ax,ay,1e-12);
    const span=4*Math.PI/Math.min(wx,wy);
    points=Array.from({length:count+1},(_,i)=>{
      const t=span*i/count;
      return [(ax/scale*Math.sin(wx*t+phase)+1)/2,ay/scale*Math.sin(wy*t)];
    });
    marker=[(ax/scale*Math.sin(wx*time+phase)+1)/2,ay/scale*Math.sin(wy*time)];axisLabel='x frente a y';
  } else {
    const {a,k,w}=parameters,scale=Math.max(0.05,a);
    points=Array.from({length:count+1},(_,i)=>{
      const x=i/count*2;
      return [i/count,a/scale*(mode==='traveling'?Math.sin(k*x-w*time):Math.sin(k*x)*Math.cos(w*time))];
    });
    marker=points[Math.floor(count/4)];axisLabel='x (0–2 m)';
  }
  ctx.strokeStyle=color('fi');ctx.lineWidth=2.5;ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(xMap(x),yMap(y)):ctx.moveTo(xMap(x),yMap(y)));
  ctx.stroke();
  ctx.fillStyle=color('fi2');ctx.beginPath();ctx.arc(xMap(marker[0]),yMap(marker[1]),5,0,2*Math.PI);ctx.fill();
  ctx.fillStyle=color('text2');ctx.font='12px sans-serif';ctx.fillText(axisLabel,left,bottom+23);
  ctx.fillText(mode==='lissajous'?'y':'amplitud normalizada',left+4,top+12);
  return true;
}
