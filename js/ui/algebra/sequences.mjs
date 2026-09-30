import { compileSequenceTerm, sequenceLimit, radicalRecurrence, seqClassify, detectProgression, arithmeticProgression, geometricProgression } from '../../math/algebra/sequences.mjs';
import { normalizeExpression } from '../../math/expression.mjs';

// ═══════════════════════════════════════════════════════
// SUCESIONES Y PROGRESIONES
// ═══════════════════════════════════════════════════════
let seqMode='terminos';

function seqSetMode(mode){
  seqMode=mode;
  ['terminos','rec','pa','pg'].forEach(m=>{
    const tab=document.getElementById('seq-tab-'+m);
    const pan=document.getElementById('seq-panel-'+m);
    if(tab) tab.classList.toggle('on',m===mode);
    if(pan) pan.style.display=m===mode?'':'none';
  });
}

function seqFmt(v){
  if(isNaN(v)||!isFinite(v)) return '?';
  if(Number.isInteger(v)) return String(v);
  for(let d=1;d<=360;d++){
    const n=Math.round(v*d);
    if(n!==0&&Math.abs(n/d-v)<1e-9) return n+'/'+d;
  }
  return parseFloat(v.toFixed(6)).toString();
}

function seqEscape(value){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function seqPreviewExpression(){
  const input=document.getElementById('seq-expr');
  const preview=document.getElementById('seq-preview');
  if(!input||!preview) return;
  preview.textContent=input.value.trim()
    ? compileSequenceTerm(input.value)
      ? `Entrada interpretada: aₙ = ${normalizeExpression(input.value)}; n es entero positivo.`
      : 'Expresión no admitida. Usa n, números, funciones y operadores matemáticos.'
    : 'Usa n, sen(n), potencias y paréntesis. El límite solo se afirma para familias demostradas.';
}

function seqAnalyzeTerminos(){
  const expr=document.getElementById('seq-expr').value.trim();
  const nMax=Number(document.getElementById('seq-n').value);
  const res=document.getElementById('seq-result');
  if(!expr){ res.innerHTML='<div class="calc-err">Ingresa la expresión del término aₙ.</div>'; return; }
  if(!Number.isInteger(nMax)||nMax<1||nMax>20){
    res.innerHTML='<div class="calc-err">Elige entre 1 y 20 términos.</div>'; return;
  }
  const fn=compileSequenceTerm(expr);
  if(!fn){ res.innerHTML='<div class="calc-err">Expresión no admitida. Usa n, números y funciones como sen(n), ln(n) o exp(n).</div>'; return; }

  const terms=Array.from({length:nMax},(_,i)=>{ try { return fn(i+1); } catch { return NaN; } });
  const cls=seqClassify(terms);
  const finite=terms.filter(v=>isFinite(v));
  const acot=finite.length?`Mín = ${seqFmt(Math.min(...finite))}, máx = ${seqFmt(Math.max(...finite))} entre los ${nMax} términos mostrados`:'Sin términos definidos en la muestra';
  const limit=sequenceLimit(expr);

  // ¿PA o PG?
  let badge='';
  const progression=detectProgression(terms);
  if(progression?.kind==='pa') badge=`<div class="seq-badge pa-badge">Patrón aritmético en la muestra — d = ${seqFmt(progression.value)}</div>`;
  if(progression?.kind==='pg') badge=`<div class="seq-badge pg-badge">Patrón geométrico en la muestra — r = ${seqFmt(progression.value)}</div>`;

  let html=`<div class="seq-result-wrap">`;
  html+=`<div class="seq-expr-display">aₙ = ${seqEscape(normalizeExpression(expr))}</div>`;
  html+=badge;
  html+=`<div class="seq-terms-grid">`;
  terms.forEach((t,i)=>html+=`<div class="seq-term-cell"><span class="seq-term-n">n=${i+1}</span><span class="seq-term-v">${Number.isFinite(t)?seqFmt(t):Number.isNaN(t)?'no definido':'fuera del rango numérico'}</span></div>`);
  html+=`</div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Patrón en la muestra</span><span class="seq-prop-val">${cls}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Rango observado</span><span class="seq-prop-val">${acot}</span></div>`;
  if(limit.status==='demostrado'){
    html+=`<div class="seq-prop"><span class="seq-prop-label">Límite demostrado</span><span class="seq-prop-val">${seqEscape(limit.exact)}${Number.isFinite(limit.value)&&limit.method==='exponencial'?` ≈ ${seqFmt(limit.value)}`:''}</span></div>`;
    html+=`<ol class="calc-steps">${limit.steps.map(step=>`<li>${seqEscape(step)}</li>`).join('')}</ol>`;
    html+=`<div class="calc-res-hint">Hipótesis: ${seqEscape(limit.assumptions)}</div>`;
  }else{
    html+=`<div class="seq-prop"><span class="seq-prop-label">Límite</span><span class="seq-prop-val">No demostrado: ${seqEscape(limit.reason)}</span></div>`;
  }
  html+=`</div>`;
  res.innerHTML=html;
}

function seqAnalyzeRadical(){
  const cText=document.getElementById('seq-rec-c').value.trim();
  const a1Text=document.getElementById('seq-rec-a1').value.trim();
  const nText=document.getElementById('seq-rec-n').value.trim();
  const res=document.getElementById('seq-result');
  if(!cText||!a1Text||!nText){
    res.innerHTML='<div class="calc-err">Ingresa c, a₁ y el número de términos.</div>';
    return;
  }
  const c=Number(cText), a1=Number(a1Text), count=Number(nText);
  const result=radicalRecurrence(c,a1,count);
  if(result.status==='invalido'){
    res.innerHTML=`<div class="calc-err">${seqEscape(result.reason)}</div>`;
    return;
  }
  res.innerHTML=`<div class="seq-result-wrap">
    <div class="seq-expr-display">a₁ = ${seqFmt(a1)}; aₙ₊₁ = √(${seqFmt(c)} + aₙ)</div>
    <div class="seq-terms-grid">${result.terms.map((term,i)=>`<div class="seq-term-cell"><span class="seq-term-n">n=${i+1}</span><span class="seq-term-v">${seqFmt(term)}</span></div>`).join('')}</div>
    <div class="seq-prop"><span class="seq-prop-label">Límite demostrado</span><span class="seq-prop-val">(1 + √(1 + 4·${seqFmt(c)}))/2 ≈ ${seqFmt(result.limit)}</span></div>
    <div class="seq-prop"><span class="seq-prop-label">Comportamiento</span><span class="seq-prop-val">${result.direction} y acotada</span></div>
    <ol class="calc-steps">${result.steps.map(step=>`<li>${seqEscape(step)}</li>`).join('')}</ol>
    <div class="calc-res-hint">Hipótesis: ${seqEscape(result.assumptions)}</div>
  </div>`;
}

function seqAnalyzePA(){
  const a1=parseFloat(document.getElementById('pa-a1').value);
  const d=parseFloat(document.getElementById('pa-d').value);
  const n=Number(document.getElementById('pa-n').value);
  const res=document.getElementById('seq-result');
  if(!Number.isFinite(a1)||!Number.isFinite(d)||!Number.isInteger(n)||n<1||n>500){
    res.innerHTML='<div class="calc-err">Ingresa a₁, d y un número de términos entre 1 y 500.</div>'; return;
  }
  const {an,sn,terms}=arithmeticProgression(a1,d,n);
  if(!Number.isFinite(an)||!Number.isFinite(sn)||terms.some(term=>!Number.isFinite(term))){
    res.innerHTML='<div class="calc-err">El resultado supera el rango numérico; reduce los datos o n.</div>'; return;
  }
  const cls=d>0?'Creciente':d<0?'Decreciente':'Constante';
  const acot=d===0?`Acotada: Sₙ = ${seqFmt(a1)}`:'No acotada (tiende a '+(d>0?'+∞':'-∞')+')';
  let html=`<div class="seq-result-wrap">`;
  html+=`<div class="seq-expr-display">PA: a₁ = ${seqFmt(a1)},  d = ${seqFmt(d)}</div>`;
  html+=`<div class="seq-terms-grid">${terms.map((t,i)=>`<div class="seq-term-cell"><span class="seq-term-n">a<sub>${i+1}</sub></span><span class="seq-term-v">${seqFmt(t)}</span></div>`).join('')}${n>8?'<div class="seq-term-cell"><span class="seq-term-n">…</span></div>':''}</div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Fórmula aₙ</span><span class="seq-prop-val">${seqFmt(a1)} + (n−1)·${seqFmt(d)}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">a<sub>${n}</sub></span><span class="seq-prop-val">${seqFmt(an)}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">S<sub>${n}</sub> = n(a₁+aₙ)/2</span><span class="seq-prop-val">${seqFmt(sn)}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Clasificación</span><span class="seq-prop-val">${cls}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Acotamiento</span><span class="seq-prop-val">${acot}</span></div>`;
  html+=`</div>`;
  res.innerHTML=html;
}

function seqAnalyzePG(){
  const a1=parseFloat(document.getElementById('pg-a1').value);
  const r=parseFloat(document.getElementById('pg-r').value);
  const n=Number(document.getElementById('pg-n').value);
  const res=document.getElementById('seq-result');
  if(!Number.isFinite(a1)||!Number.isFinite(r)||!Number.isInteger(n)||n<1||n>500){
    res.innerHTML='<div class="calc-err">Ingresa a₁, r y un número de términos entre 1 y 500.</div>'; return;
  }
  const {an,sn,sInf,terms}=geometricProgression(a1,r,n);
  if(!Number.isFinite(an)||!Number.isFinite(sn)||terms.some(term=>!Number.isFinite(term))){
    res.innerHTML='<div class="calc-err">El resultado supera el rango numérico; reduce los datos o n.</div>'; return;
  }
  const cls=a1===0?'Constante cero':Math.abs(r)>1?'No acotada (|r|>1)':r===1?'Constante':r===-1?'Alternante acotada (r=−1)':'Convergente a 0 (|r|<1)';
  let html=`<div class="seq-result-wrap">`;
  html+=`<div class="seq-expr-display">PG: a₁ = ${seqFmt(a1)},  r = ${seqFmt(r)}</div>`;
  html+=`<div class="seq-terms-grid">${terms.map((t,i)=>`<div class="seq-term-cell"><span class="seq-term-n">a<sub>${i+1}</sub></span><span class="seq-term-v">${seqFmt(t)}</span></div>`).join('')}${n>8?'<div class="seq-term-cell"><span class="seq-term-n">…</span></div>':''}</div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Fórmula aₙ</span><span class="seq-prop-val">${seqFmt(a1)}·${seqFmt(r)}^(n−1)</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">a<sub>${n}</sub></span><span class="seq-prop-val">${seqFmt(an)}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">S<sub>${n}</sub></span><span class="seq-prop-val">${seqFmt(sn)}</span></div>`;
  if(isFinite(sInf)) html+=`<div class="seq-prop"><span class="seq-prop-label">S∞</span><span class="seq-prop-val">${seqFmt(sInf)}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Clasificación</span><span class="seq-prop-val">${cls}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Límite de aₙ</span><span class="seq-prop-val">${a1===0?'0':Math.abs(r)<1?'0':r===1?seqFmt(a1):'No existe'}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Acotamiento de aₙ</span><span class="seq-prop-val">${a1===0||Math.abs(r)<=1?'Acotada':'No acotada'}</span></div>`;
  html+=`</div>`;
  res.innerHTML=html;
}

export { seqSetMode, seqPreviewExpression, seqAnalyzeTerminos, seqAnalyzeRadical, seqAnalyzePA, seqAnalyzePG };
