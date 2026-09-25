import { evalTermN, seqClassify, detectProgression, arithmeticProgression, geometricProgression } from '../../math/algebra/sequences.mjs';

// ═══════════════════════════════════════════════════════
// SUCESIONES Y PROGRESIONES
// ═══════════════════════════════════════════════════════
let seqMode='terminos';

function seqSetMode(mode){
  seqMode=mode;
  ['terminos','pa','pg'].forEach(m=>{
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

function seqAnalyzeTerminos(){
  const expr=document.getElementById('seq-expr').value.trim();
  const nMax=parseInt(document.getElementById('seq-n').value)||5;
  const res=document.getElementById('seq-result');
  if(!expr){ res.innerHTML=errBox('Ingresa la expresión del término Sₙ'); return; }

  const terms=Array.from({length:nMax},(_,i)=>evalTermN(expr,i+1));
  const cls=seqClassify(terms);
  const finite=terms.filter(v=>isFinite(v));
  const acot=finite.length?`Inf = ${seqFmt(Math.min(...finite))}, Sup = ${seqFmt(Math.max(...finite))} (en ${nMax} términos)`:'—';

  // ¿PA o PG?
  let badge='';
  const progression=detectProgression(terms);
  if(progression?.kind==='pa') badge=`<div class="seq-badge pa-badge">Progresión Aritmética — d = ${seqFmt(progression.value)}</div>`;
  if(progression?.kind==='pg') badge=`<div class="seq-badge pg-badge">Progresión Geométrica — r = ${seqFmt(progression.value)}</div>`;

  let html=`<div class="seq-result-wrap">`;
  html+=`<div class="seq-expr-display">Sₙ = ${expr}</div>`;
  html+=badge;
  html+=`<div class="seq-terms-grid">`;
  terms.forEach((t,i)=>html+=`<div class="seq-term-cell"><span class="seq-term-n">n=${i+1}</span><span class="seq-term-v">${seqFmt(t)}</span></div>`);
  html+=`</div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Clasificación</span><span class="seq-prop-val">${cls}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Acotamiento</span><span class="seq-prop-val">${acot}</span></div>`;
  html+=`</div>`;
  res.innerHTML=html;
}

function seqAnalyzePA(){
  const a1=parseFloat(document.getElementById('pa-a1').value);
  const d=parseFloat(document.getElementById('pa-d').value);
  const n=parseInt(document.getElementById('pa-n').value)||10;
  const res=document.getElementById('seq-result');
  if(isNaN(a1)||isNaN(d)){ res.innerHTML=errBox('Ingresa a₁ y diferencia d'); return; }
  const {an,sn,terms}=arithmeticProgression(a1,d,n);
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
  const n=parseInt(document.getElementById('pg-n').value)||10;
  const res=document.getElementById('seq-result');
  if(isNaN(a1)||isNaN(r)){ res.innerHTML=errBox('Ingresa a₁ y razón r'); return; }
  const {an,sn,sInf,terms}=geometricProgression(a1,r,n);
  const cls=Math.abs(r)>1?'Divergente (|r|>1)':r===1?'Constante':r===-1?'Alternante (r=−1)':'Convergente (|r|<1)';
  let html=`<div class="seq-result-wrap">`;
  html+=`<div class="seq-expr-display">PG: a₁ = ${seqFmt(a1)},  r = ${seqFmt(r)}</div>`;
  html+=`<div class="seq-terms-grid">${terms.map((t,i)=>`<div class="seq-term-cell"><span class="seq-term-n">a<sub>${i+1}</sub></span><span class="seq-term-v">${seqFmt(t)}</span></div>`).join('')}${n>8?'<div class="seq-term-cell"><span class="seq-term-n">…</span></div>':''}</div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Fórmula aₙ</span><span class="seq-prop-val">${seqFmt(a1)}·${seqFmt(r)}^(n−1)</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">a<sub>${n}</sub></span><span class="seq-prop-val">${seqFmt(an)}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">S<sub>${n}</sub></span><span class="seq-prop-val">${seqFmt(sn)}</span></div>`;
  if(isFinite(sInf)) html+=`<div class="seq-prop"><span class="seq-prop-label">S∞</span><span class="seq-prop-val">${seqFmt(sInf)}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Clasificación</span><span class="seq-prop-val">${cls}</span></div>`;
  html+=`<div class="seq-prop"><span class="seq-prop-label">Acotamiento</span><span class="seq-prop-val">${Math.abs(r)<1?`Acotada — converge a S∞ = ${seqFmt(sInf)}`:'No acotada'}</span></div>`;
  html+=`</div>`;
  res.innerHTML=html;
}

export { seqSetMode, seqAnalyzeTerminos, seqAnalyzePA, seqAnalyzePG };
