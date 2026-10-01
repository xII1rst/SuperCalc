import { readCanvasPalette } from './colors.mjs';
import { fN } from '../utils/format.mjs';
import { fromMechanicsSI } from '../math/mechanics-units.mjs';
import { linearStateAt, projectileStateAt } from '../math/mechanics-solver.mjs';

function prepare(canvas,palette) {
  if (!canvas) return null;
  const width = Math.max(240,Math.round(canvas.clientWidth || 320));
  const height = 220;
  const dpr = Math.min(3,globalThis.devicePixelRatio || 1);
  canvas.width = Math.round(width*dpr);
  canvas.height = Math.round(height*dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle = palette('surface-result');
  ctx.fillRect(0,0,width,height);
  return {ctx,width,height};
}

function arrow(ctx,x1,y1,x2,y2,color,label) {
  if (![x1,y1,x2,y2].every(Number.isFinite)) return;
  const angle = Math.atan2(y2-y1,x2-x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (Math.hypot(x2-x1,y2-y1) < 1) {
    ctx.font = '11px JetBrains Mono, ui-monospace, monospace';
    ctx.fillText(`${label} = 0`,x1+5,y1-7);
    return;
  }
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2,y2);
  ctx.lineTo(x2-8*Math.cos(angle-.5),y2-8*Math.sin(angle-.5));
  ctx.lineTo(x2-8*Math.cos(angle+.5),y2-8*Math.sin(angle+.5));
  ctx.closePath(); ctx.fill();
  ctx.font = '11px JetBrains Mono, ui-monospace, monospace';
  ctx.fillText(label,Math.min(x2+5,ctx.canvas?.width || x2+5),y2-7);
}

export function drawLinearMotion(canvas,values,time,lengthUnit,palette = readCanvasPalette()) {
  if (!canvas || !Number.isFinite(values.t)) return;
  const prepared = prepare(canvas,palette);
  if (!prepared) return;
  const {ctx,width} = prepared;
  const samples = Array.from({length:81},(_,i) => linearStateAt(values,values.t*i/80).x);
  const current = linearStateAt(values,time);
  const low = Math.min(...samples), high = Math.max(...samples);
  const pad = Math.max((high-low)*.12,1);
  const scale = x => 30+(x-low+pad)/(high-low+2*pad)*(width-60);
  const axisY = 124;
  ctx.strokeStyle = palette('line-medium'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20,axisY); ctx.lineTo(width-20,axisY); ctx.stroke();
  const originX = scale(values.x0), currentX = scale(current.x);
  ctx.fillStyle = palette('fi');
  for (const x of [originX,currentX]) { ctx.beginPath(); ctx.arc(x,axisY,4,0,2*Math.PI); ctx.fill(); }
  arrow(ctx,originX,82,currentX,82,palette('fi'),'Δx');
  const direction = Math.sign(current.velocity);
  arrow(ctx,currentX,161,Math.max(22,Math.min(width-22,currentX+direction*Math.min(65,Math.abs(current.velocity)*6))),161,palette('text-strong'),'v');
  ctx.fillStyle = palette('text-muted'); ctx.font = '11px JetBrains Mono, ui-monospace, monospace';
  ctx.fillText(`${fN(fromMechanicsSI(low,'length',lengthUnit),3)} ${lengthUnit}`,22,204);
  ctx.fillText(`${fN(fromMechanicsSI(high,'length',lengthUnit),3)} ${lengthUnit}`,Math.max(22,width-105),204);
}

export function drawExerciseProjectile(canvas,values,time,xUnit,yUnit,palette = readCanvasPalette()) {
  if (!canvas || !Number.isFinite(values.time)) return;
  const prepared = prepare(canvas,palette);
  if (!prepared) return;
  const {ctx,width,height} = prepared;
  const points = Array.from({length:121},(_,i) => projectileStateAt(values,values.time*i/120));
  const current = projectileStateAt(values,time);
  const minX = Math.min(0,...points.map(point => point.x));
  const maxX = Math.max(0,...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const padX = Math.max((maxX-minX)*.1,1);
  const padY = Math.max((maxY-minY)*.14,1);
  const x = value => 36+(value-minX+padX)/(maxX-minX+2*padX)*(width-55);
  const y = value => height-34-(value-minY+padY)/(maxY-minY+2*padY)*(height-52);
  const y0 = Number.isFinite(values.y0) ? values.y0 : 0;
  ctx.strokeStyle = palette('line-medium'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(25,y(y0)); ctx.lineTo(width-15,y(y0)); ctx.stroke();
  const trace = (limit,color,lineWidth) => {
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.beginPath();
    for (let i=0;i<=limit;i++) { const point=points[i]; if(i===0) ctx.moveTo(x(point.x),y(point.y)); else ctx.lineTo(x(point.x),y(point.y)); }
    if (limit < 120) ctx.lineTo(x(current.x),y(current.y));
    ctx.stroke();
  };
  trace(120,palette('line-medium'),2);
  trace(values.time > 0 ? Math.min(120,Math.floor(time/values.time*120)) : 0,palette('fi'),3);
  arrow(ctx,x(0),y(y0),x(current.x),y(current.y),palette('fi'),'Δr');
  const speed = Math.max(1,Math.hypot(current.vx,current.vy));
  arrow(ctx,x(current.x),y(current.y),x(current.x)+current.vx/speed*48,y(current.y)-current.vy/speed*48,palette('text-strong'),'v');
  ctx.fillStyle = palette('fi'); ctx.beginPath(); ctx.arc(x(current.x),y(current.y),4,0,2*Math.PI); ctx.fill();
  ctx.fillStyle = palette('text-muted'); ctx.font = '11px JetBrains Mono, ui-monospace, monospace';
  ctx.fillText(`${fN(fromMechanicsSI(points.at(-1).x,'length',xUnit),3)} ${xUnit}`,Math.max(22,width-110),height-10);
  ctx.fillText(`${fN(fromMechanicsSI(maxY,'length',yUnit),3)} ${yUnit}`,38,16);
}

export function drawProjectileTrajectory(canvas, result, palette = readCanvasPalette()) {
  if (!canvas || !result) return;
  const width = Math.max(240, Math.round(canvas.clientWidth || 320));
  const height = 220;
  const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = palette('surface-result');
  ctx.fillRect(0, 0, width, height);

  const left = 42;
  const right = width - 18;
  const top = 18;
  const bottom = height - 32;
  const maxX = Math.max(result.range, 1);
  const maxY = Math.max(result.maxHeight, 1);
  const x = value => left + value / maxX * (right - left);
  const y = value => bottom - value / maxY * (bottom - top);

  ctx.strokeStyle = palette('line-medium');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.strokeStyle = palette('fi');
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  result.points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(x(point.x), y(point.y));
    else ctx.lineTo(x(point.x), y(point.y));
  });
  ctx.stroke();

  const peak = result.points.reduce((best, point) => point.y > best.y ? point : best);
  ctx.fillStyle = palette('fi');
  for (const point of [result.points[0], peak, result.points.at(-1)]) {
    ctx.beginPath();
    ctx.arc(x(point.x), y(point.y), 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = palette('text-muted');
  ctx.font = '11px JetBrains Mono, ui-monospace, monospace';
  ctx.fillText('0', left, height - 12);
  ctx.fillText(`${fN(result.range, 2)} m`, Math.max(left, right - 70), height - 12);
  ctx.fillText(`${fN(result.maxHeight, 2)} m`, left + 5, top + 9);
}
