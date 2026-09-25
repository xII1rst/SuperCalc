import { matFmtNum } from '../utils/format.mjs';
import { readCanvasPalette } from './colors.mjs';

const rendered = new Map();
export function redrawAnalysisCanvases(){
  for(const [canvas,entry] of rendered){
    if(canvas.isConnected===false){ rendered.delete(canvas); continue; }
    if(entry.type==='function') drawFunctionGraph(canvas,entry.data);
    else drawNumberLine(canvas,entry.data);
  }
}

// Renderizadores de resultados matemáticos; reciben canvas y datos preparados.
export function drawFunctionGraph(canvas,pts){
  if(!canvas||!pts.length) return;
  rendered.set(canvas,{type:'function',data:pts});
  const color=readCanvasPalette();
  const W=canvas.offsetWidth||320, H=160;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=color('chrome'); ctx.fillRect(0,0,W,H);
  const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y);
  const xMin=Math.min(...xs),xMax=Math.max(...xs),yMin=Math.min(...ys),yMax=Math.max(...ys);
  const px=(xMax-xMin)*0.05||1, py=(yMax-yMin)*0.1||1;
  const xl=xMin-px,xr=xMax+px,yl=yMin-py,yr=yMax+py;
  const toX=x=>14+(x-xl)/(xr-xl)*(W-28);
  const toY=y=>H-6-(y-yl)/(yr-yl)*(H-12);
  if(yl<=0&&yr>=0){ const ay=toY(0); ctx.strokeStyle=color('line-subtle');ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,ay);ctx.lineTo(W,ay);ctx.stroke(); }
  if(xl<=0&&xr>=0){ const ax=toX(0); ctx.strokeStyle=color('line-subtle');ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax,0);ctx.lineTo(ax,H);ctx.stroke(); }
  ctx.strokeStyle=color('ca'); ctx.lineWidth=2.5; ctx.beginPath();
  let pen=false;
  pts.forEach((p,i)=>{
    const x=toX(p.x),y=toY(p.y);
    const jump=i>0&&Math.abs(p.y-pts[i-1].y)>(yr-yl)*0.4;
    if(!pen||jump) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    pen=true;
  });
  ctx.stroke();
}

export function drawNumberLine(canvas,points){
  if(!canvas) return;
  rendered.set(canvas,{type:'numberLine',data:points});
  const color=readCanvasPalette();
  const W=canvas.offsetWidth||320; canvas.width=W; canvas.height=72;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=color('surface-result'); ctx.fillRect(0,0,W,72);
  const vals=points.map(p=>p.val).filter(v=>isFinite(v));
  if(!vals.length) return;
  const ctr=(Math.min(...vals)+Math.max(...vals))/2;
  const span=Math.max(Math.max(...vals)-Math.min(...vals),4)*1.8;
  const lo=ctr-span/2, hi=ctr+span/2;
  const toX=v=>16+(v-lo)/(hi-lo)*(W-32);
  const ay=38;
  ctx.strokeStyle=color('line-subtle'); ctx.lineWidth=2; ctx.beginPath();
  ctx.moveTo(12,ay); ctx.lineTo(W-12,ay); ctx.stroke();
  ctx.fillStyle=color('text-faint'); ctx.font='10px Space Mono'; ctx.textAlign='center';
  for(let v=Math.ceil(lo);v<=Math.floor(hi);v++){
    const x=toX(v);
    ctx.strokeStyle=color('line-subtle'); ctx.lineWidth=1; ctx.beginPath();
    ctx.moveTo(x,ay-4); ctx.lineTo(x,ay+4); ctx.stroke();
    if((hi-lo)<20) ctx.fillText(v,x,ay+16);
  }
  points.forEach(({val,sym,colorToken})=>{
    if(!isFinite(val)) return;
    const markColor=color(colorToken || 'ineq-accent');
    const x=toX(val);
    const filled=(sym==='≤'||sym==='≥'||sym==='root');
    ctx.beginPath(); ctx.arc(x,ay,7,0,Math.PI*2);
    ctx.strokeStyle=markColor; ctx.lineWidth=2;
    if(filled){ ctx.fillStyle=markColor; ctx.fill(); }
    else { ctx.fillStyle=color('surface-result'); ctx.fill(); ctx.stroke(); }
    ctx.stroke();
    ctx.fillStyle=markColor; ctx.font='bold 10px Space Mono'; ctx.textAlign='center';
    ctx.fillText(matFmtNum(val),x,ay-14);
  });
}
