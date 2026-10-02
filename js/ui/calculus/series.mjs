import { alternatingSeries, geometricSeries, integralTest, nthTermTest, pSeries, ratioTest, rootTest, taylorSeries } from '../../math/series.mjs';
import { calcParse } from '../../math/expression.mjs';
import { errBox, pf, resBox, v } from './results.mjs';
import { fN } from '../../utils/format.mjs';
import { taylorCoefficients } from '../../math/calculus/numeric.mjs';

export function calcTaylor(){
  const fxStr=v('int-taylor-fx');
  const a=pf('int-taylor-a')||0;
  const nTerms=parseInt(document.getElementById('int-taylor-n')?.value)||5;
  const res=document.getElementById('res-taylor');
  const fn=calcParse(fxStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}

  const terms=taylorCoefficients(fn,a,nTerms);
  let poly='';
  for(const {k,coef} of terms){
    const cs=parseFloat(coef.toFixed(5)).toString();
    if(k===0) poly+=cs;
    else if(k===1) poly+=` ${coef>=0?'+':''} ${cs}(x${a!==0?`−${a}`:''})`;
    else poly+=` ${coef>=0?'+':''} ${cs}(x${a!==0?`−${a}`:''})<sup>${k}</sup>`;
  }

  const xtest=a+0.3;
  const freal=fn(xtest,0);
  const fapprox=terms.reduce((s,t)=>s+t.coef*Math.pow(xtest-a,t.k),0);
  res.innerHTML=
    resBox('Serie de Taylor alrededor de a='+a, poly, '')+
    resBox(`Verificación en x=${xtest}`, `f(x) = ${fN(freal,6)}   T(x) = ${fN(fapprox,6)}`,
      `Error = ${fN(Math.abs(freal-fapprox),4)}`);
}

// Muestra solo los campos de la prueba elegida y ajusta sus etiquetas.
export function seriesTypeChanged(){
  const type=document.getElementById('series-type')?.value||'geo';
  document.querySelectorAll?.('#body-series [data-series]').forEach(row=>{row.hidden=!row.dataset.series.split(' ').includes(type);});
  const term=document.getElementById('series-term-lbl'), from=document.getElementById('series-N-lbl'), input=document.getElementById('series-term');
  if(term) term.textContent=type==='alt'?'bₙ =':type==='integral'?'f(n) =':'aₙ =';
  if(input) input.placeholder=type==='alt'?'ej: 1/n  (serie Σ(−1)^(n+1)·bₙ)':type==='integral'?'ej: 1/(n*ln(n)^2)':type==='root'?'ej: (n/(2n+1))^n':'ej: 1/2^n';
  if(from) from.textContent=type==='alt'?'términos N =':'desde n =';
}

const escSeries=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const seriesSteps=steps=>steps.length?`<div class="calc-res-hint">${steps.map(step=>`• ${escSeries(step)}`).join('<br>')}</div>`:'';
const proofNote=proof=>proof==='analytic'?'Familia analítica: conclusión demostrada.':proof==='analytic-sampled-hypotheses'?'Límite demostrado; positividad y decrecimiento comprobados solo por muestreo.':proof==='sampled'?'Conclusión apoyada en muestreo: no es una demostración.':'La familia de esta expresión no permite concluir con este criterio.';

function seriesVerdict(c){
  if(c==='converge') return 'Converge';
  if(c==='diverge') return 'Diverge';
  if(c==='inconcluso') return 'Inconcluso (la prueba no decide)';
  if(c==='posible convergencia') return 'Posible convergencia';
  if(c==='converge absolutamente') return 'Converge absolutamente';
  if(c==='converge condicionalmente') return 'Converge condicionalmente';
  return c;
}

export function calcSeries(){
  const type=document.getElementById('series-type')?.value||'geo';
  const res=document.getElementById('res-series');
  let html='';
  if(type==='geo'){
    const a1=pf('series-a1'), r=pf('series-r');
    if(isNaN(a1)||isNaN(r)){res.innerHTML=errBox('Ingresa a₁ y r');return;}
    const g=geometricSeries(a1,r);
    html=resBox('Serie geométrica Σ a₁·r^(n−1)',
      g.converges?`Converge — suma = ${fN(g.sum,8)}`:'Diverge (|r| ≥ 1)',
      `a₁ = ${a1},  r = ${r}`, true);
  } else if(type==='p'){
    const p=pf('series-p');
    if(isNaN(p)){res.innerHTML=errBox('Ingresa p');return;}
    const s=pSeries(p);
    html=resBox('p-serie Σ 1/n^p', s.converges?'Converge (p > 1)':'Diverge (p ≤ 1)', `p = ${p}`, true);
  } else if(type==='ratio'){
    const term=v('series-term');
    if(!term){res.innerHTML=errBox('Ingresa el término aₙ');return;}
    const r=ratioTest(term);
    html=resBox('Prueba de la razón', seriesVerdict(r.conclusion), r.proof==='analytic'?`L = lim |aₙ₊₁/aₙ| = ${fN(r.L,6)}; familia analítica admitida`:`Cociente muestreado ≈ ${fN(r.sampleRatio,6)}; no demuestra el límite`, true);
  } else if(type==='root'){
    const term=v('series-term');
    if(!term){res.innerHTML=errBox('Ingresa el término aₙ');return;}
    const r=rootTest(term);
    html=resBox('Prueba de la raíz', seriesVerdict(r.conclusion), r.proof==='analytic'?`L = lím |aₙ|^(1/n) = ${r.L===Infinity?'∞':fN(r.L,6)}${r.L===1?'; L = 1 no decide: usa otro criterio':''}. ${proofNote(r.proof)}`:`Raíz muestreada ≈ ${fN(r.sampleRoot,6)}; no demuestra el límite.`, true);
  } else if(type==='integral'){
    const term=v('series-term'), start=parseInt(document.getElementById('series-N')?.value)||1;
    if(!term){res.innerHTML=errBox('Ingresa f(n)');return;}
    const r=integralTest(term,start);
    html=resBox('Prueba de la integral', seriesVerdict(r.conclusion), [r.family?`Familia: ${escSeries(r.family)}.`:'', r.antiderivative?`Primitiva F(x) = ${escSeries(r.antiderivative)}.`:'', proofNote(r.proof)].filter(Boolean).join(' '), true)
      +(r.hypothesis?`<div class="calc-res-hint">Hipótesis: ${escSeries(r.hypothesis)}</div>`:'')+seriesSteps(r.steps);
  } else if(type==='alt'){
    const term=v('series-term'), N=parseInt(document.getElementById('series-N')?.value)||10;
    if(!term){res.innerHTML=errBox('Ingresa bₙ > 0 de Σ(−1)^(n+1)·bₙ');return;}
    const r=alternatingSeries(term,N);
    html=resBox('Serie alternante Σ(−1)^(n+1)·bₙ', seriesVerdict(r.conclusion), [proofNote(r.proof)].filter(Boolean).join(' '), true)+seriesSteps(r.steps);
  } else if(type==='nth'){
    const term=v('series-term');
    if(!term){res.innerHTML=errBox('Ingresa el término aₙ');return;}
    const r=nthTermTest(term);
    html=resBox('Prueba del término n-ésimo', seriesVerdict(r.conclusion),r.proof==='analytic'?`lim aₙ = ${fN(r.limit,6)}; límite analítico. Límite 0 no prueba convergencia de la serie.`:`Término muestreado ≈ ${fN(r.sampleTerm,6)}; no demuestra el límite`, true);
  } else if(type==='taylor'){
    const fx=v('series-fx'), a=pf('series-a')||0;
    const n=parseInt(document.getElementById('series-n')?.value)||5;
    if(!fx){res.innerHTML=errBox('Ingresa f(x)');return;}
    const t=taylorSeries(fx,a,n);
    if(!t){res.innerHTML=errBox('No se pudo expandir la serie');return;}
    html=resBox(`Taylor de orden ${n} alrededor de a=${a}`, t.polynomial, 'Desarrollo simbólico', true);
  }
  res.innerHTML=html;
}
