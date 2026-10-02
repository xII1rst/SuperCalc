import { readCanvasPalette } from './colors.mjs';

// La escena se describe una vez y se dibuja en Canvas o, si no hay contexto 2D, como SVG estático.
const MODES = ['harmonic', 'traveling', 'standing', 'lissajous'];
const fmt = value => String(Number(value.toPrecision(4)));
const TAU = 2 * Math.PI;

export function waveScene(mode, parameters, time = 0, width = 600, height = 260) {
  if (!MODES.includes(mode)) return null;
  width = Math.max(240, width);
  const items = [], top = 28, bottom = height - 36, mid = (top + bottom) / 2, half = (bottom - top) / 2;
  const line = (x1, y1, x2, y2, color = 'graph-grid', w = 1, dash = null) => items.push({ type: 'line', x1, y1, x2, y2, color, width: w, dash });
  const text = (x, y, value, color = 'graph-text', anchor = 'start', size = 12) => items.push({ type: 'text', x, y, text: value, color, anchor, size });
  const arrow = (x1, y1, x2, y2, color) => { if (Math.hypot(x2 - x1, y2 - y1) > 2) items.push({ type: 'arrow', x1, y1, x2, y2, color }); };
  let phaseText = '';

  if (mode === 'harmonic') {
    // Fasor: el eje real apunta hacia arriba, así su proyección vertical es x(t) = A·cos(ωt + φ).
    const { a, w, phase } = parameters, theta = w * time + phase, R = half, cx = 18 + R, cy = mid;
    items.push({ type: 'circle', cx, cy, r: R, color: 'graph-grid' });
    line(cx, cy - R - 6, cx, cy + R + 6); line(cx - R - 6, cy, cx + R + 6, cy);
    text(cx + 4, cy - R - 8, 'Re', 'graph-text', 'start', 11); text(cx - R + 4, cy - 5, 'Im', 'graph-text', 'start', 11);
    const tipX = cx - R * Math.sin(theta), tipY = cy - R * Math.cos(theta);
    arrow(cx, cy, tipX, tipY, 'graph-curve');
    const arcR = Math.min(22, R * 0.35), steps = 24, span = ((theta % TAU) + TAU) % TAU;
    items.push({ type: 'path', points: Array.from({ length: steps + 1 }, (_, i) => { const t = span * i / steps; return [cx - arcR * Math.sin(t), cy - arcR * Math.cos(t)]; }), color: 'graph-text', width: 1 });
    phaseText = `θ = ωt + φ = ${fmt(theta)} rad (${fmt(span * 180 / Math.PI)}° en la vuelta)`;
    text(cx - R, bottom + 26, phaseText, 'graph-text', 'start', 11);
    // Gráfica temporal a la derecha, enlazada con la proyección del fasor.
    const left = cx + R + 34, right = width - 14, duration = 2, scale = Math.max(1e-12, a);
    line(left, mid, right, mid); line(left, top, left, bottom);
    const y = v => mid - (v / scale) * half;
    items.push({ type: 'path', points: Array.from({ length: 241 }, (_, i) => { const t = duration * i / 240; return [left + (right - left) * i / 240, y(a * Math.cos(w * t + phase))]; }), color: 'graph-curve', width: 2.5 });
    const local = ((time % duration) + duration) % duration, mx = left + (right - left) * local / duration, my = y(a * Math.cos(theta));
    line(tipX, tipY, mx, my, 'graph-point', 1, [5, 4]);
    items.push({ type: 'circle', cx: mx, cy: my, r: 5, color: 'graph-point', fill: true });
    text(left, bottom + 26, 't (0–2 s)'); text(left + 4, top - 8, 'x(t) normalizada', 'graph-text', 'start', 11);
    return { width, height, items, phaseText };
  }

  const left = 44, right = width - 16;
  line(left, mid, right, mid); line(left, top, left, bottom);
  if (mode === 'lissajous') {
    const { ax, ay, wx, wy, phase } = parameters, scale = Math.max(ax, ay, 1e-12), span = 4 * Math.PI / Math.min(wx, wy);
    const px = t => (left + right) / 2 + (ax / scale) * Math.sin(wx * t + phase) * (right - left) / 2, py = t => mid - (ay / scale) * Math.sin(wy * t) * half;
    items.push({ type: 'path', points: Array.from({ length: 401 }, (_, i) => { const t = span * i / 400; return [px(t), py(t)]; }), color: 'graph-curve', width: 2.5 });
    const vx = (ax / scale) * wx * Math.cos(wx * time + phase) * (right - left) / 2, vy = -(ay / scale) * wy * Math.cos(wy * time) * half, len = Math.hypot(vx, vy) || 1;
    const x0 = px(time), y0 = py(time);
    arrow(x0, y0, x0 + 42 * vx / len, y0 + 42 * vy / len, 'graph-point');
    items.push({ type: 'circle', cx: x0, cy: y0, r: 5, color: 'graph-point', fill: true });
    phaseText = `Fase relativa φ = ${fmt(phase)} rad; la flecha es la velocidad en t = ${fmt(time)} s`;
    text(left, bottom + 26, 'x frente a y'); text(left + 4, top - 8, 'y', 'graph-text', 'start', 11);
    return { width, height, items, phaseText };
  }

  const { a, k, w } = parameters, scale = Math.max(1e-12, a), length = 2;
  const xMap = x => left + (right - left) * x / length, yMap = v => mid - (v / scale) * half;
  const shape = x => mode === 'traveling' ? a * Math.sin(k * x - w * time) : a * Math.sin(k * x) * Math.cos(w * time);
  if (mode === 'standing') {
    // Envolvente ±A|sen kx| y nodos en kx = nπ.
    for (const sign of [1, -1]) items.push({ type: 'path', points: Array.from({ length: 241 }, (_, i) => { const x = length * i / 240; return [xMap(x), yMap(sign * a * Math.abs(Math.sin(k * x)))]; }), color: 'graph-grid', width: 1, dash: [4, 4] });
    for (let n = 0; n * Math.PI / k <= length + 1e-9 && n < 40; n++) items.push({ type: 'circle', cx: xMap(n * Math.PI / k), cy: mid, r: 3.5, color: 'graph-curve2', fill: true });
  }
  items.push({ type: 'path', points: Array.from({ length: 241 }, (_, i) => { const x = length * i / 240; return [xMap(x), yMap(shape(x))]; }), color: 'graph-curve', width: 2.5 });
  const xp = length / 4, vy = mode === 'traveling' ? -a * w * Math.cos(k * xp - w * time) : -a * w * Math.sin(k * xp) * Math.sin(w * time);
  const px = xMap(xp), py = yMap(shape(xp));
  arrow(px, py, px, py - 38 * vy / (scale * Math.max(w, 1e-12)), 'graph-point');
  items.push({ type: 'circle', cx: px, cy: py, r: 5, color: 'graph-point', fill: true });
  if (mode === 'traveling') {
    const speed = w / k;
    arrow(right - 120, top + 6, right - 60, top + 6, 'graph-curve2');
    text(right - 56, top + 10, `v = ω/k = ${fmt(speed)} m/s`, 'graph-text', 'start', 11);
    phaseText = `Fase en x = 0,5 m: kx − ωt = ${fmt(k * xp - w * time)} rad; la flecha roja es la velocidad de la partícula`;
  } else {
    phaseText = `Puntos verdes: nodos (kx = nπ); línea discontinua: envolvente ±A|sen kx|; flecha: velocidad en x = 0,5 m`;
  }
  text(left, bottom + 26, 'x (0–2 m)'); text(left + 4, top - 8, 'amplitud normalizada', 'graph-text', 'start', 11);
  return { width, height, items, phaseText };
}

function renderCanvas(ctx, scene) {
  const color = readCanvasPalette();
  ctx.fillStyle = color('graph-bg'); ctx.fillRect(0, 0, scene.width, scene.height);
  for (const item of scene.items) {
    ctx.setLineDash(item.dash || []);
    if (item.type === 'line' || item.type === 'arrow') {
      ctx.strokeStyle = color(item.color); ctx.lineWidth = item.width || 2.2;
      ctx.beginPath(); ctx.moveTo(item.x1, item.y1); ctx.lineTo(item.x2, item.y2); ctx.stroke();
      if (item.type === 'arrow') {
        const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
        ctx.fillStyle = color(item.color); ctx.beginPath(); ctx.moveTo(item.x2, item.y2);
        ctx.lineTo(item.x2 - 9 * Math.cos(angle - 0.4), item.y2 - 9 * Math.sin(angle - 0.4));
        ctx.lineTo(item.x2 - 9 * Math.cos(angle + 0.4), item.y2 - 9 * Math.sin(angle + 0.4)); ctx.closePath(); ctx.fill();
      }
    } else if (item.type === 'path') {
      ctx.strokeStyle = color(item.color); ctx.lineWidth = item.width || 2; ctx.beginPath();
      item.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    } else if (item.type === 'circle') {
      ctx.beginPath(); ctx.arc(item.cx, item.cy, item.r, 0, TAU);
      if (item.fill) { ctx.fillStyle = color(item.color); ctx.fill(); } else { ctx.strokeStyle = color(item.color); ctx.lineWidth = 1; ctx.stroke(); }
    } else if (item.type === 'text') {
      ctx.fillStyle = color(item.color); ctx.font = `${item.size}px sans-serif`; ctx.textAlign = item.anchor === 'end' ? 'right' : item.anchor === 'middle' ? 'center' : 'left';
      ctx.fillText(item.text, item.x, item.y);
    }
  }
  ctx.setLineDash([]); ctx.textAlign = 'left';
}

export function drawWavePlot(canvas, mode, parameters, time = 0) {
  if (!canvas || !MODES.includes(mode)) return false;
  const width = Math.max(240, Math.round(canvas.clientWidth || 600)), height = 260;
  const ratio = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return false;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  renderCanvas(ctx, waveScene(mode, parameters, time, width, height));
  return true;
}

// Alternativa estática y accesible cuando el navegador no ofrece Canvas 2D.
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = n => Math.round(n * 100) / 100;
export function waveSvg(mode, parameters, time = 0) {
  const scene = waveScene(mode, parameters, time, 600, 260);
  if (!scene) return '';
  const v = token => `var(--${token})`;
  const body = scene.items.map(item => {
    const dash = item.dash ? ` stroke-dasharray="${item.dash.join(' ')}"` : '';
    if (item.type === 'line') return `<line x1="${r2(item.x1)}" y1="${r2(item.y1)}" x2="${r2(item.x2)}" y2="${r2(item.y2)}" stroke="${v(item.color)}" stroke-width="${item.width}"${dash}/>`;
    if (item.type === 'arrow') return `<line x1="${r2(item.x1)}" y1="${r2(item.y1)}" x2="${r2(item.x2)}" y2="${r2(item.y2)}" stroke="${v(item.color)}" stroke-width="2.2" marker-end="url(#wave-arrow)" color="${v(item.color)}"/>`;
    if (item.type === 'path') return `<polyline points="${item.points.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ')}" fill="none" stroke="${v(item.color)}" stroke-width="${item.width}"${dash}/>`;
    if (item.type === 'circle') return `<circle cx="${r2(item.cx)}" cy="${r2(item.cy)}" r="${item.r}" ${item.fill ? `fill="${v(item.color)}"` : `fill="none" stroke="${v(item.color)}"`}/>`;
    return `<text x="${r2(item.x)}" y="${r2(item.y)}" text-anchor="${item.anchor}" font-size="${item.size}" fill="${v(item.color)}">${esc(item.text)}</text>`;
  }).join('');
  return `<svg class="waves-static" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-label="Vista estática de la onda"><title>Vista estática de la onda</title><desc>${esc(scene.phaseText)}</desc><defs><marker id="wave-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="context-stroke"/></marker></defs><rect width="${scene.width}" height="${scene.height}" fill="${v('graph-bg')}"/>${body}</svg>`;
}
