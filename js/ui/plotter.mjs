import { GRAPH_TYPES, parseGraphValues } from '../math/graph-types.mjs';
import { renderGraphCanvas } from '../graphics/graph-canvas.mjs';
import { grafFmt } from '../utils/format.mjs';

// ═══════════════════════════════════════════════════════
// GRAFICACIÓN MODULE
// ═══════════════════════════════════════════════════════

let grafType = 'lin';

function grafInit(){
  grafSetType(grafType);
}

function grafSetType(type) {
  if(!GRAPH_TYPES[type]) return;
  grafType = type;
  document.querySelectorAll('.graf-type-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('gtype-'+type).classList.add('sel');
  grafInitFields();
}

function grafInitFields() {
  const def = GRAPH_TYPES[grafType];
  if(!def) return;
  document.getElementById('graf-inputs-title').textContent = def.title;
  const wrap = document.getElementById('graf-coef-fields');
  wrap.innerHTML = def.coefs.map(c => `
    <div class="graf-coef-row">
      <label>${c.label}</label>
      <input class="graf-coef" id="${c.id}" placeholder="${c.placeholder}" value="${c.default}" data-action="grafPreview" data-event="input"/>
    </div>`).join('');
  grafPreview();
}

function grafGetVals() {
  const def = GRAPH_TYPES[grafType];
  const v = {};
  def.coefs.forEach(c => {
    const el = document.getElementById(c.id);
    v[c.id] = el ? (el.value.trim()||c.default) : c.default;
  });
  return v;
}

function grafPreview() {
  const def = GRAPH_TYPES[grafType];
  if(!def) return;
  try {
    const v = grafGetVals();
    document.getElementById('graf-formula-preview').textContent = def.preview(v);
  } catch(e) {}
}

function grafDraw() {
  const def = GRAPH_TYPES[grafType];
  if(!def) return;
  const v   = parseGraphValues(grafType,grafGetVals());
  if(!v){
    document.getElementById('graf-canvas-wrap').style.display='none';
    document.getElementById('graf-steps-wrap').style.display='block';
    document.getElementById('graf-steps').textContent='Revisa los coeficientes: deben ser números reales válidos.';
    return;
  }
  const N   = Math.max(1,Math.min(10,parseInt(document.getElementById('graf-pts-n').value)||3));
  const fn  = (x) => def.eval(x, v);

  // Generar puntos: -N ... 0 ... +N (enteros)
  const xs = [];
  for(let i=-N; i<=N; i++) xs.push(i);
  const pts = xs.map(x => ({ x, y: fn(x) }));

  document.getElementById('graf-canvas-wrap').style.display='block';
  renderGraphCanvas(document.getElementById('graf-cv'),fn,pts,N);
  // ── Tabla de valores (overlay) ──
  const tableEl = document.getElementById('graf-table');
  tableEl.innerHTML = `<table>
    <tr><th>x</th><th>y</th></tr>
    ${pts.map(({x,y})=>`
      <tr class="${x===0?'zero-row':''}">
        <td>${x}</td>
        <td>${grafFmt(y)}</td>
      </tr>`).join('')}
  </table>`;

  // ── Pasos de cálculo ──
  const stepsWrap = document.getElementById('graf-steps-wrap');
  const stepsEl   = document.getElementById('graf-steps');
  stepsWrap.style.display = 'block';
  stepsEl.innerHTML = pts.map(({x,y}) => {
    if(!isFinite(y)) return '';
    const lines = def.steps(x, v, grafFmt(y));
    return `<div class="graf-step-block">
      <div style="color:var(--gold);font-weight:700;margin-bottom:4px">x = ${x}</div>
      ${lines.map(l=>`<div>${l}</div>`).join('')}
    </div>`;
  }).join('');
}

function grafClear() {
  document.getElementById('graf-canvas-wrap').style.display='none';
  document.getElementById('graf-steps-wrap').style.display='none';
  document.getElementById('graf-steps').innerHTML='';
  document.getElementById('graf-table').innerHTML='';
  // reset coefs a defaults
  grafInitFields();
}

function grafUpdate() {
  // si ya hay una gráfica visible, redibujar con los nuevos parámetros
  if(document.getElementById('graf-canvas-wrap').style.display!=='none') {
    grafDraw();
  }
}

export { grafInit, grafSetType, grafPreview, grafDraw, grafClear, grafUpdate };
