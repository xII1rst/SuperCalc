import { figureState } from '../state/figures.mjs';

export function createFigureControls({ draw, emDraw }) {
// ══════════════════════════════════════════════════════
// ── FIGURAS GEOMÉTRICAS 3D ─────────────────────────────
// Motor compartido: genera puntos de malla para cada figura
// ══════════════════════════════════════════════════════


let emFigPanelOpen = false;

// ── PARÁMETROS POR FIGURA ──────────────────────────────
const FIG_PARAMS = {
  sphere:   [{ id:'r',   label:'Radio',    def:'3' }],
  cylinder: [{ id:'r',   label:'Radio',    def:'2' }, { id:'h', label:'Altura', def:'4' }],
  cone:     [{ id:'r',   label:'Radio base', def:'2' }, { id:'h', label:'Altura', def:'4' }],
  plane:    [{ id:'nx',  label:'Normal x', def:'0' }, { id:'ny', label:'Normal y', def:'0' }, { id:'nz', label:'Normal z', def:'1' }, { id:'size', label:'Tamaño', def:'4' }],
  torus:    [{ id:'R',   label:'R (mayor)',def:'3' }, { id:'r', label:'r (tubo)',  def:'1' }],
};

function figParamsHTML(prefix, type, vals={}){
  const ps = FIG_PARAMS[type] || [];
  if(!ps.length) return '';
  return `<div style="margin-bottom:8px">
    <div style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;letter-spacing:.04em">Parámetros</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${ps.map(p=>`<div class="inp-group"><label>${p.label}</label><input type="number" id="${prefix}${p.id}" value="${vals[p.id]??p.def}" step="any" min="0.1"/></div>`).join('')}
    </div>
  </div>`;
}

// ── AL: TAB FIGURAS ────────────────────────────────────
let figCurrentType = 'sphere';

function figInitPanel(){
  figSetType(figCurrentType);
  const opEl=document.getElementById('fig-opacity');
  const opVal=document.getElementById('fig-opacity-val');
  if(opEl && opVal){
    opEl.addEventListener('input',()=>{ opVal.textContent=opEl.value+'%'; });
  }
}

function figSetType(type){
  figCurrentType = type;
  document.querySelectorAll('.fig-type-btn').forEach(b=>{
    b.classList.toggle('on', b.textContent.toLowerCase()===
      ({sphere:'esfera',cylinder:'cilindro',cone:'cono',plane:'plano',torus:'toro'}[type]));
  });
  const vals = figureState.vector && figureState.vector.type===type ? figureState.vector.params : {};
  document.getElementById('fig-params').innerHTML = figParamsHTML('fig-p-', type, vals);
}

function figGetParams(){
  const ps = FIG_PARAMS[figCurrentType]||[];
  const out={};
  ps.forEach(p=>{ out[p.id]=parseFloat(document.getElementById('fig-p-'+p.id)?.value||p.def)||parseFloat(p.def); });
  return out;
}

function figDraw(){
  const cx=parseFloat(document.getElementById('fig-cx').value)||0;
  const cy=parseFloat(document.getElementById('fig-cy').value)||0;
  const cz=parseFloat(document.getElementById('fig-cz').value)||0;
  const color=document.getElementById('fig-color').value;
  const opacity=parseInt(document.getElementById('fig-opacity').value)||22;
  figureState.vector={ type:figCurrentType, params:figGetParams(), cx, cy, cz, color, opacity };
  // Forzar redraw del canvas AL
  draw();
  document.getElementById('fig-res').textContent='✓ Figura graficada en el canvas.';
}

function figClear(){
  figureState.vector=null;
  draw();
  document.getElementById('fig-res').textContent='';
}

// ── EM: PANEL FLOTANTE FIGURAS ─────────────────────────
let emFigCurrentType = 'sphere';

function emFigToggle(){
  emFigPanelOpen = !emFigPanelOpen;
  const panel=document.getElementById('em-fig-panel');
  const btn=document.getElementById('em-fig-btn');
  panel.style.display = emFigPanelOpen ? 'block' : 'none';
  btn.style.background = emFigPanelOpen ? 'rgba(var(--al-rgb),.25)' : 'rgba(var(--al-rgb),.1)';
  if(emFigPanelOpen) emFigSetType(emFigCurrentType);
  // Cerrar al clic fuera
  if(emFigPanelOpen){
    setTimeout(()=>{ document.addEventListener('click', emFigOutside, {once:true}); },100);
  }
}

function emFigOutside(e){
  const panel=document.getElementById('em-fig-panel');
  const btn=document.getElementById('em-fig-btn');
  if(panel && !panel.contains(e.target) && !btn.contains(e.target)){
    emFigPanelOpen=false;
    panel.style.display='none';
    btn.style.background='rgba(var(--al-rgb),.1)';
  }
}

function emFigSetType(type){
  emFigCurrentType=type;
  document.querySelectorAll('.em-fig-type-btn').forEach(b=>{
    b.classList.toggle('on', b.textContent.toLowerCase()===
      ({sphere:'esfera',cylinder:'cilindro',cone:'cono',plane:'plano',torus:'toro'}[type]));
  });
  const vals = figureState.em && figureState.em.type===type ? figureState.em.params : {};
  document.getElementById('em-fig-params').innerHTML = figParamsHTML('em-fig-p-', type, vals);
  const opEl=document.getElementById('em-fig-opacity');
  const opVal=document.getElementById('em-fig-opacity-val');
  if(opEl && opVal) opEl.addEventListener('input',()=>{ opVal.textContent=opEl.value+'%'; });
}

function emFigGetParams(){
  const ps=FIG_PARAMS[emFigCurrentType]||[];
  const out={};
  ps.forEach(p=>{ out[p.id]=parseFloat(document.getElementById('em-fig-p-'+p.id)?.value||p.def)||parseFloat(p.def); });
  return out;
}

function emFigDraw(){
  const color=document.getElementById('em-fig-color').value;
  const opacity=parseInt(document.getElementById('em-fig-opacity').value)||20;
  figureState.em={ type:emFigCurrentType, params:emFigGetParams(), cx:0, cy:0, cz:0, color, opacity };
  emDraw();
}

function emFigClear(){
  figureState.em=null;
  emDraw();
}

return {
  figInitPanel, figSetType, figDraw, figClear,
  emFigToggle, emFigSetType, emFigDraw, emFigClear,
};
}
