import { calcCurrentTab } from './cards.mjs';

// ═══════════════════════════════════════════════════════
// TECLADO — arquitectura correcta
// El input activo se registra con onfocus (no oninput)
// El botón usa pointer events para no robar el foco
// ═══════════════════════════════════════════════════════
export let calcActiveInput = null;
const trackedCalcInputs = new WeakSet();

// Registrar todos los inputs calc-inp con onfocus
export function initInputTracking(){
  document.querySelectorAll('.calc-inp').forEach(inp=>{
    if(trackedCalcInputs.has(inp)) return;
    inp.addEventListener('focus', ()=>{ calcActiveInput = inp; });
    trackedCalcInputs.add(inp);
  });
}

const CALC_KB = [
  { label:'Funciones', btns:[
    {icon:'sin',  name:'seno',     ins:'sin('},
    {icon:'cos',  name:'coseno',   ins:'cos('},
    {icon:'tan',  name:'tangente', ins:'tan('},
    {icon:'asin', name:'arcsin',   ins:'asin('},
    {icon:'acos', name:'arccos',   ins:'acos('},
    {icon:'atan', name:'arctan',   ins:'atan('},
    {icon:'ln',   name:'log nat',  ins:'ln('},
    {icon:'log',  name:'log₁₀',   ins:'log('},
    {icon:'√',    name:'raíz',     ins:'sqrt('},
    {icon:'|x|',  name:'abs',      ins:'abs('},
    {icon:'eˣ',   name:'exp',      ins:'e^('},
  ]},
  { label:'Constantes y operadores', btns:[
    {icon:'xⁿ',  name:'potencia', ins:'^'},
    {icon:'π',   name:'pi',       ins:'π'},
    {icon:'e',   name:'euler',    ins:'e'},
    {icon:'∞',   name:'inf',      ins:'Infinity'},
    {icon:'( )', name:'parén.',   ins:'('},
    {icon:'*',   name:'mult.',    ins:'*'},
    {icon:'1/x', name:'fracción', ins:'1/('},
  ]},
];

export function buildKB(containerId){
  const el = document.getElementById(containerId);
  if(!el || el.dataset.built) return;
  el.dataset.built = '1';
  el.innerHTML = CALC_KB.map(g=>`
    <div class="calc-kb-group" role="group" aria-label="${g.label}">
      <div class="calc-kb-label" aria-hidden="true">${g.label}</div>
      <div class="calc-kb-btns">
        ${g.btns.map(b=>`
          <button type="button" class="calc-kb-btn" aria-label="${b.name}" title="${b.name}"
            data-action="kbInsert" data-event="pointerdown" data-insert="${b.ins}">
            <span class="kb-icon">${b.icon}</span>
            <span class="kb-name">${b.name}</span>
          </button>`).join('')}
      </div>
    </div>`).join('');
}

export function setCalcActiveInput(input){ calcActiveInput = input; }

export function kbInsert(event, text){
  // Prevenir que el pointer event robe el foco del input
  event.preventDefault();

  // Buscar el mejor input target:
  // 1. El que tiene foco actualmente (calcActiveInput)
  // 2. Si no, el primer input visible en la card abierta del panel activo
  let inp = calcActiveInput;
  if(!inp || !document.contains(inp)){
    const panelId = 'calc-p' + calcCurrentTab.charAt(0).toUpperCase() + calcCurrentTab.slice(1);
    const panel   = document.getElementById(panelId);
    const openCard = panel ? panel.querySelector('.calc-card-body.open') : null;
    inp = openCard ? openCard.querySelector('.calc-inp') : null;
    if(!inp && panel) inp = panel.querySelector('.calc-inp');
  }
  if(!inp) return;

  const s = inp.selectionStart ?? inp.value.length;
  const e = inp.selectionEnd   ?? inp.value.length;
  inp.value = inp.value.slice(0,s) + text + inp.value.slice(e);
  const pos = s + text.length;
  inp.focus();
  inp.setSelectionRange(pos, pos);
  calcActiveInput = inp;
}

// ═══════════════════════════════════════════════════════
// CALC INIT
// ═══════════════════════════════════════════════════════
let enterKeyBound = false;
export function initEnterKey(){
  if(enterKeyBound) return;
  enterKeyBound = true;
  document.addEventListener('keydown', e => {
    if(e.key !== 'Enter' || e.isComposing) return;
    const inp = e.target;
    if(!inp || !inp.classList || !inp.classList.contains('calc-inp')) return;
    const card = inp.closest ? inp.closest('.calc-card') : null;
    if(!card) return;
    const btn = card.querySelector('.calc-btn:not(.sec)');
    if(btn){ e.preventDefault(); btn.click(); }
  });
}
