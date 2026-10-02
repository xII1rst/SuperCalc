import { drawPreview } from './preview-renderer.mjs';
import { clearRevolutionSolid, drawRevolutionSolid } from './revolution.mjs';
import { normalizeExpression } from '../../math/expression.mjs';
import * as plotter from '../plotter.mjs';

export let calcCurrentTab  = 'dif';
export function previewCalcExpression(input){
  const destination=document.getElementById(input.dataset.preview);
  if(!destination) return;
  const normalized=normalizeExpression(input.value);
  destination.textContent=normalized?`Entrada interpretada: ${normalized}`
    :'Puedes escribir sen(x²), sin(x^2), π y 2·x.';
}

// ═══════════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════════
const CALC_TITLES = {
  dif:'Diferencial', int:'Integral', mul:'Multivariable',
  edo:'Ecuaciones diferenciales', graf:'Graficador', cur:'Curvas',
};

export function calcTab(id){
  ['Dif','Int','Mul','Edo','Graf','Cur'].forEach(p=>{
    const el = document.getElementById('calc-p'+p);
    if(el) el.classList.toggle('on', p.toLowerCase()===id);
  });
  calcCurrentTab = id;
  const title = document.getElementById('calc-title');
  if(title) title.textContent = CALC_TITLES[id] || 'Cálculo';
  if(id==='graf') plotter.grafInit();
}

export function toggleCard(id){
  const card  = document.getElementById('card-'+id);
  const body  = document.getElementById('body-'+id);
  const arr   = document.getElementById('arr-'+id);
  const isOpen = body.classList.contains('open');

  // Single-open: al abrir una card se cierran las demás del mismo panel
  const scroll = card.closest('.calc-scroll');
  if(scroll){
    scroll.querySelectorAll('.calc-card').forEach(c=>{
      if(c===card) return;
      c.classList.remove('active');
      c.querySelector('.calc-card-body').classList.remove('open');
      c.querySelector('.calc-card-arrow').classList.remove('open');
      c.querySelector('.calc-card-header')?.setAttribute('aria-expanded','false');
    });
  }

  body.classList.toggle('open',  !isOpen);
  arr.classList.toggle('open',   !isOpen);
  card.classList.toggle('active',!isOpen);
  card.querySelector?.('.calc-card-header')?.setAttribute('aria-expanded',String(!isOpen));

  if(!isOpen){
    const cv = body.querySelector('.calc-preview[data-gmode]');
    if(cv) drawPreview(cv);
  }
}

export function clearCard(id){
  // Limpiar inputs dentro de body-id
  const body = document.getElementById('body-'+id);
  if(!body) return;
  body.querySelectorAll('.calc-inp').forEach(el=>el.value='');
  if(id==='rev'){
    document.getElementById('int-rev-m').value='1';
    document.getElementById('int-rev-offset').value='0';
    document.getElementById('int-rev-shift').value='2';
  }
  // Limpiar res dentro de body-id
  body.querySelectorAll('[id^="res-"]').forEach(el=>el.innerHTML='');
  body.querySelectorAll('[id^="preview-"]').forEach(el=>el.textContent='');
  // También buscar res específico por convención
  const resMap = {lim:'res-lim',der:'res-der',imp:'res-imp',ana:'res-ana',
    indef:'res-indef',def:'res-def',rev:'res-rev',taylor:'res-taylor',
    par:'res-par',grad:'res-grad',dint:'res-dint',
    sep:'res-sep',edolin:'res-edolin',edo2:'res-edo2'};
  if(resMap[id]) { const r=document.getElementById(resMap[id]); if(r) r.innerHTML=''; }
  const cv = body.querySelector('.calc-preview[data-gmode]');
  if(cv) drawPreview(cv);
  if(id==='rev'){
    clearRevolutionSolid();
    drawRevolutionSolid();
  }
}
