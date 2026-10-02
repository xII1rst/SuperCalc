import { formatResult } from '../../utils/format.mjs';

// ═══════════════════════════════════════════════════════
// PARSER NUMÉRICO
// ═══════════════════════════════════════════════════════
export function resultWithFraction(val){
  if (typeof val !== 'string') return val;
  const fraction = /^(-?\d+)\/(\d+)$/.exec(val);
  const numeric = /^-?\d+(?:\.\d+)?$/.test(val);
  if (!fraction && !numeric) return val;
  const value = fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(val);
  if (!Number.isFinite(value)) return val;
  const displayed = formatResult(value, 8);
  return displayed.includes(' → ') || (numeric && displayed === String(Math.round(value))) ? displayed : val;
}
export function resBox(label,val,hint='',big=false){
  val = resultWithFraction(val);
  return `<div class="calc-res-box">
    <div class="calc-res-label">${label}</div>
    <div class="calc-res-val${big?' big':''}">${val}</div>
    ${hint?`<div class="calc-res-hint">${hint}</div>`:''}
  </div>`;
}
export function errBox(msg){ return `<div class="calc-err">${msg}</div>`; }

export function v(id){ const el=document.getElementById(id); return el?el.value.trim():''; }
export function pf(id){ return parseFloat(v(id)); }

export function pinf(id){
  const s=v(id).replace(/∞/g,'Infinity').replace(/\binf\b/gi,'Infinity');
  if(!s) return NaN;
  return Number(s);
}

export function readInputValue(id){
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

export function readInputNum(id){
  const el = document.getElementById(id);
  const v = el ? parseFloat(el.value) : NaN;
  return Number.isFinite(v) ? v : NaN;
}

export function readRevolutionParameters(){
  const mText=readInputValue('int-rev-m'), bText=readInputValue('int-rev-offset');
  const m=mText===''?1:Number(mText), b=bText===''?0:Number(bText);
  return Number.isFinite(m)&&Number.isFinite(b) ? {m,b} : null;
}

export function usesRevolutionCoefficients(expression){
  return /\b(?:mx|m|b)\b/.test(expression);
}
