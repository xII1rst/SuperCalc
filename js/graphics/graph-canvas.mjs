import { graphGridStep as grafGridStep } from './axes.mjs';
import { grafFmt } from '../utils/format.mjs';
import { readCanvasPalette } from './colors.mjs';

export function renderGraphCanvas(cv,fn,pts,N){
  const color=readCanvasPalette();
  // Calcular rango del canvas con padding
  const ys = pts.map(p=>p.y).filter(isFinite);
  if(!ys.length) ys.push(0);
  const xMin = -N-1, xMax = N+1;
  let yMin = Math.min(...ys, 0)-1;
  let yMax = Math.max(...ys, 0)+1;
  // padding visual
  const yPad = (yMax-yMin)*0.15;
  yMin -= yPad; yMax += yPad;

  const dpr = window.devicePixelRatio||1;
  const W = cv.offsetWidth||300;
  const H = 300;
  cv.width  = W*dpr;
  cv.height = H*dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);

  const toX = wx => (wx-xMin)/(xMax-xMin)*W;
  const toY = wy => (1-(wy-yMin)/(yMax-yMin))*H;

  // ── Fondo blanco como la referencia ──
  ctx.fillStyle = color('graph-bg');
  ctx.fillRect(0,0,W,H);

  // ── Grid fino ──
  ctx.strokeStyle = color('graph-grid');
  ctx.lineWidth = 0.5;
  // verticales cada 1 unidad
  for(let x=Math.ceil(xMin); x<=xMax; x++) {
    const px=toX(x);
    ctx.beginPath(); ctx.moveTo(px,0); ctx.lineTo(px,H); ctx.stroke();
  }
  // horizontales cada unidad entera
  const yStep = grafGridStep(yMax-yMin, 7);
  const y0g = Math.ceil(yMin/yStep)*yStep;
  for(let y=y0g; y<=yMax; y+=yStep) {
    const py=toY(y);
    ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(W,py); ctx.stroke();
  }

  // ── Ejes en negro ──
  ctx.strokeStyle = color('graph-axis');
  ctx.lineWidth = 1.5;
  // eje X
  const axisY = toY(0);
  ctx.beginPath(); ctx.moveTo(0,axisY); ctx.lineTo(W,axisY); ctx.stroke();
  // eje Y
  const axisX = toX(0);
  ctx.beginPath(); ctx.moveTo(axisX,0); ctx.lineTo(axisX,H); ctx.stroke();

  // ── Flechas en los ejes ──
  const arr = 7;
  ctx.fillStyle = color('graph-axis');
  // flecha derecha eje X
  ctx.beginPath(); ctx.moveTo(W,axisY); ctx.lineTo(W-arr,axisY-arr/2); ctx.lineTo(W-arr,axisY+arr/2); ctx.closePath(); ctx.fill();
  // flecha arriba eje Y
  ctx.beginPath(); ctx.moveTo(axisX,0); ctx.lineTo(axisX-arr/2,arr); ctx.lineTo(axisX+arr/2,arr); ctx.closePath(); ctx.fill();

  // ── Marcas y números en los ejes ──
  ctx.fillStyle = color('graph-text');
  ctx.font = `${10}px Space Mono, monospace`;
  ctx.strokeStyle = color('graph-axis');
  ctx.lineWidth = 1;
  // eje X: números
  for(let x=Math.ceil(xMin); x<=Math.floor(xMax); x++) {
    if(x===0) continue;
    const px=toX(x);
    ctx.beginPath(); ctx.moveTo(px, axisY-3); ctx.lineTo(px, axisY+3); ctx.stroke();
    ctx.textAlign='center';
    ctx.fillText(x, px, axisY+(axisY<H-20?16:-8));
  }
  // eje Y: números
  for(let y=y0g; y<=yMax; y+=yStep) {
    if(Math.abs(y)<yStep*0.01) continue;
    const py=toY(y);
    ctx.beginPath(); ctx.moveTo(axisX-3,py); ctx.lineTo(axisX+3,py); ctx.stroke();
    ctx.textAlign='right';
    ctx.fillText(grafFmt(y), axisX-6, py+3);
  }
  // origen
  ctx.textAlign='right';
  ctx.fillText('0', axisX-5, axisY+12);

  // ── Curva continua ──
  const STEPS = W*2;
  ctx.strokeStyle = color('graph-curve');
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let penDown = false;
  let prevPy = null;
  for(let i=0; i<=STEPS; i++) {
    const wx = xMin + (xMax-xMin)*i/STEPS;
    const wy = fn(wx);
    if(!isFinite(wy)) { penDown=false; prevPy=null; continue; }
    const px=toX(wx), py=toY(wy);
    // discontinuidad (tan, etc.)
    if(prevPy!==null && Math.abs(py-prevPy)>H*1.2) { penDown=false; }
    if(!penDown) { ctx.moveTo(px,py); penDown=true; }
    else ctx.lineTo(px,py);
    prevPy=py;
  }
  ctx.stroke();

  // ── Puntos rojos ──
  pts.forEach(({x,y}) => {
    if(!isFinite(y)) return;
    const px=toX(x), py=toY(y);
    if(py<-10||py>H+10) return;
    ctx.fillStyle = color('graph-point');
    ctx.strokeStyle = color('graph-bg');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
  });

}
