// Vista previa 2D ligera y reentrante: muestrea y dibuja funciones, paramétricas y polares.
import { graphGridStep } from './axes.mjs';
import { grafFmt } from '../utils/format.mjs';
import { readCanvasPalette } from './colors.mjs';
import { polarToCartesian } from '../math/polar.mjs';

export function sampleFn(fn, x0, x1, N = 256) {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = x0 + (x1 - x0) * i / N;
    const y = fn(x, 0);
    if (Number.isFinite(y)) pts.push({ x, y });
  }
  return pts;
}

export function sampleParametric(xFn, yFn, t0, t1, N = 512) {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = t0 + (t1 - t0) * i / N;
    const x = xFn(t, 0), y = yFn(t, 0);
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
  }
  return pts;
}

export function samplePolar(rFn, t0, t1, N = 512) {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = t0 + (t1 - t0) * i / N;
    const r = rFn(t, 0);
    if (!Number.isFinite(r)) continue;
    const c = polarToCartesian(r, t);
    if (Number.isFinite(c.x) && Number.isFinite(c.y)) pts.push({ x: c.x, y: c.y });
  }
  return pts;
}

export function autoRange(points, pad = 0.12) {
  if (!points.length) return { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const p of points) {
    if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y;
  }
  if (!Number.isFinite(xMin)) return { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };
  const dx = (xMax - xMin) || 1;
  const dy = (yMax - yMin) || 1;
  return {
    xMin: xMin - dx * pad, xMax: xMax + dx * pad,
    yMin: yMin - dy * pad, yMax: yMax + dy * pad,
  };
}

export function renderPreview(cv, points, opts = {}) {
  const color = readCanvasPalette();
  const secondPoints = opts.secondPoints || [];
  const markers = opts.markers || [];
  const referenceLine = opts.referenceLine;
  const referencePoint = referenceLine&&Number.isFinite(referenceLine.value)
    ? (referenceLine.axis==='x' ? {x:points[0]?.x??0,y:referenceLine.value} : {x:referenceLine.value,y:points[0]?.y??0})
    : null;
  const { xMin, xMax, yMin, yMax } = autoRange([
    ...points, ...secondPoints, ...markers, ...(referencePoint?[referencePoint]:[]),
  ]);

  const ratio = (opts.dpr > 0 ? opts.dpr : (globalThis.devicePixelRatio || 1));
  const W = cv.clientWidth || cv.offsetWidth || 300;
  const H = cv.clientHeight || cv.offsetHeight || 220;
  cv.width = Math.max(1, Math.floor(W * ratio));
  cv.height = Math.max(1, Math.floor(H * ratio));
  const ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(ratio, ratio);

  const toX = wx => (wx - xMin) / (xMax - xMin) * W;
  const toY = wy => (1 - (wy - yMin) / (yMax - yMin)) * H;

  // Fondo
  ctx.fillStyle = color('graph-bg');
  ctx.fillRect(0, 0, W, H);

  // Cuadrícula
  ctx.strokeStyle = color('graph-grid');
  ctx.lineWidth = 0.5;
  const xStep = graphGridStep(xMax - xMin, 10);
  const yStep = graphGridStep(yMax - yMin, 7);
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    const px = toX(x);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    const py = toY(y);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
  }

  // Ejes (solo si el 0 está dentro del rango)
  const showX = yMin <= 0 && 0 <= yMax;
  const showY = xMin <= 0 && 0 <= xMax;
  ctx.strokeStyle = color('graph-axis');
  ctx.lineWidth = 1.5;
  const axisY = showX ? toY(0) : null;
  const axisX = showY ? toX(0) : null;
  if (showX) { ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(W, axisY); ctx.stroke(); }
  if (showY) { ctx.beginPath(); ctx.moveTo(axisX, 0); ctx.lineTo(axisX, H); ctx.stroke(); }

  if(referencePoint){
    ctx.strokeStyle=color('graph-point');
    ctx.lineWidth=1.5;
    ctx.setLineDash?.([6,4]);
    ctx.beginPath();
    if(referenceLine.axis==='x'){
      const y=toY(referenceLine.value);
      ctx.moveTo(0,y);ctx.lineTo(W,y);
    }else{
      const x=toX(referenceLine.value);
      ctx.moveTo(x,0);ctx.lineTo(x,H);
    }
    ctx.stroke();
    ctx.setLineDash?.([]);
  }

  // Etiquetas numéricas
  ctx.fillStyle = color('graph-text');
  ctx.font = '10px Space Mono, monospace';
  if (showY) {
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
      if (Math.abs(y) < yStep * 0.01) continue;
      ctx.fillText(grafFmt(y), axisX - 6, toY(y) + 3);
    }
  }
  if (showX) {
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
      if (Math.abs(x) < xStep * 0.01) continue;
      ctx.fillText(grafFmt(x), toX(x), axisY + 12);
    }
  }

  if(secondPoints.length){
    ctx.fillStyle = color('ca2');
    ctx.globalAlpha = 0.16;
    for(let i=1;i<Math.min(points.length,secondPoints.length);i++){
      const f0=points[i-1], f1=points[i], g0=secondPoints[i-1], g1=secondPoints[i];
      if(f0.x!==g0.x||f1.x!==g1.x) continue;
      ctx.beginPath();
      ctx.moveTo(toX(f0.x),toY(f0.y));
      ctx.lineTo(toX(f1.x),toY(f1.y));
      ctx.lineTo(toX(g1.x),toY(g1.y));
      ctx.lineTo(toX(g0.x),toY(g0.y));
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const drawCurve=(curve,stroke)=>{
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let penDown = false;
    let prevPy = null;
    for (const p of curve) {
      const px = toX(p.x), py = toY(p.y);
      if (prevPy !== null && Math.abs(py - prevPy) > H * 1.2) penDown = false;
      if (!penDown) { ctx.moveTo(px, py); penDown = true; }
      else ctx.lineTo(px, py);
      prevPy = py;
    }
    ctx.stroke();
  };
  drawCurve(points,color('graph-curve'));
  if(secondPoints.length) drawCurve(secondPoints,color('ca2'));

  if(markers.length){
    ctx.fillStyle = color('graph-point');
    for(const p of markers){
      ctx.beginPath();
      ctx.arc(toX(p.x),toY(p.y),4,0,2*Math.PI);
      ctx.fill();
    }
  }

  ctx.restore();
}
