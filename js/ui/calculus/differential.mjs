import { calcParse, collectVariables } from '../../math/expression.mjs';
import { calculateLimitOperation, computeLimit } from '../../math/calculus/limits.mjs';
import { derivativeDetails, implicitCurveAt } from '../../math/calculus/derivatives.mjs';
import { errBox, resBox, resultWithFraction, v } from './results.mjs';
import { fN, formatResult } from '../../utils/format.mjs';
import { fmtA, fmtNum, fmtResult } from '../../math/calculus/format.mjs';
import { functionAnalysisSvg } from '../../graphics/function-analysis.mjs';
import { rationalFunctionAnalysis } from '../../math/differential-applications.mjs';
import { visSubstitute } from '../../math/calculus/limit-forms.mjs';

// ── HTML DE PASOS ──
function limitStepsHTML(r){
  if(r.error) return errBox(r.error);
  const S=r.steps, a=fmtA(r.aStr), fx=r.fxStr;
  const variable=r.varName||'x';
  let html='<div class="lim-steps">';
  let n=1;

  // 1 Planteamiento
  html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
    <div class="lim-step-title">Planteamiento</div>
    <div class="lim-step-expr">lim<sub>${variable}→${a}</sub> [ ${fx} ]</div>
  </div></div>`;

  // Sustitución simbólica (variables libres o 1^∞)
  const symStep=S.find(s=>s.tipo==='simbolico');
  if(symStep){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">${symStep.detail?'Desarrollo analítico':`Sustitución simbólica ${variable} = ${a}`}</div>
      ${symStep.detail?`<div class="lim-step-hint">${symStep.detail}</div>`:''}
      <div class="lim-step-expr lim-ok">= ${r.value}</div>
    </div></div>`;
  }

  // 2 Sustitución con desarrollo numérico
  const sub=S.find(s=>s.tipo==='sustitucion');
  if(sub){
    const visSub=sub.visSub||visSubstitute(fx,r.a,variable);
    if(sub.direct!==null){
      html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
        <div class="lim-step-title">Sustitución ${variable} = ${a}</div>
        <div class="lim-step-expr">${visSub}</div>
        <div class="lim-step-expr lim-ok">= ${fmtResult(sub.direct)}</div>
      </div></div>`;
    } else {
      const i00=S.find(s=>s.tipo==='indet_00');
      const iII=S.find(s=>s.tipo==='indet_inf');
      const numV=i00?fmtNum(i00.faNum,4):'0';
      const denV=i00?fmtNum(i00.faDen,4):'0';
      html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
        <div class="lim-step-title">Sustitución ${variable} = ${a}</div>
        <div class="lim-step-expr">${visSub}</div>
        ${i00?`<div class="lim-step-expr">= ${numV} / ${denV}</div>`:''}
        <div class="lim-step-expr"><span class="lim-warn">${i00?'→ 0/0 Forma indeterminada':iII?'→ ∞/∞ Forma indeterminada':'La sustitución no da un valor finito.'}</span></div>
      </div></div>`;
    }
  }

  // 3 Estrategia
  const i00=S.find(s=>s.tipo==='indet_00');
  const iII=S.find(s=>s.tipo==='indet_inf');
  if(i00){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">Estrategia: L'Hôpital / Cancelación</div>
      <div class="lim-step-hint">Forma 0/0 — se deriva num. y den. por separado</div>
    </div></div>`;
  } else if(iII){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">Estrategia: L'Hôpital (forma ∞/∞)</div>
    </div></div>`;
  }

  // L'Hôpital
  S.filter(s=>s.tipo==='lhopital').forEach(lh=>{
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">L'Hôpital — orden ${lh.orden}</div>
      <div class="lim-step-expr">N'(${a}) = ${fmtNum(lh.numDeriv)} , D'(${a}) = ${fmtNum(lh.denDeriv)}</div>
      <div class="lim-step-expr">lim = ${fmtNum(lh.numDeriv)} / ${fmtNum(lh.denDeriv)} = <strong class="lim-ok">${isFinite(lh.result)?fmtResult(lh.result):'∞'}</strong></div>
    </div></div>`;
  });

  // L'Hôpital simbólico (derivadas exactas)
  S.filter(s=>s.tipo==='lhopital_simbolico').forEach(lh=>{
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">L'Hôpital — simbólico</div>
      ${(lh.derivatives||[]).map(row=>`<div class="lim-step-expr">Orden ${row.order}: N<sup>(${row.order})</sup> = ${row.numerator}, D<sup>(${row.order})</sup> = ${row.denominator}; en ${variable}=${a}: ${fmtNum(row.numeratorAt)}/${fmtNum(row.denominatorAt)}</div>`).join('')}
      <div class="lim-step-expr">lim = <strong class="lim-ok">${lh.result}</strong></div>
    </div></div>`;
  });

  const domain=S.find(s=>s.tipo==='dominio');
  if(domain){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">Dominio real del lado solicitado</div>
      <div class="lim-step-hint">${domain.detail}</div>
    </div></div>`;
  }

  // Cancelación
  const canc=S.find(s=>s.tipo==='cancelacion');
  if(canc){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">Cancelación factor (${variable} − ${a})</div>
      <div class="lim-step-expr">Q_N ≈ ${fmtNum(canc.qnum)} , Q_D ≈ ${fmtNum(canc.qden)}</div>
      <div class="lim-step-expr">lim = <strong class="lim-ok">${fmtResult(canc.result)}</strong></div>
    </div></div>`;
  }

  // Verificación lateral
  if(r.tipo!=='directo'){
    const lat=S.find(s=>s.tipo==='laterales');
    if(lat){
      html+=`<div class="lim-step"><div class="lim-step-num"><svg class="sc-icon" aria-hidden="true"><use href="#sc-icon-check"></use></svg></div><div class="lim-step-body">
        <div class="lim-step-title">${r.inconclusive?'Muestreo numérico (no es prueba)':'Verificación numérica'}</div>
        <div class="lim-step-expr">${variable}→${a}⁺ ≈ ${fmtNum(lat.vr)} , ${variable}→${a}⁻ ≈ ${fmtNum(lat.vl)}</div>
      </div></div>`;
    }
  }
  html+='</div>';

  // Caja resultado
  const showApprox=r.exact&&r.valueNum&&Math.abs(r.valueNum)>1e-10&&r.tipo!=='directo';
  html+=`<div class="calc-res-box" style="margin-top:8px;${r.exists?'border-color:var(--ca2)':''}">
    <div class="calc-res-label">lim<sub>${variable}→${a}</sub> [ ${fx} ]</div>
    <div class="calc-res-val big">${resultWithFraction(r.value||'No existe')}</div>
    ${showApprox?`<div class="calc-res-hint">≈ ${fN(r.valueNum,8)}</div>`:''}
    ${r.inconclusive&&r.estimate!==null?`<div class="calc-res-hint">Estimación de la muestra: ${fN(r.estimate,8)}</div>`:''}
    <div class="calc-res-hint">${
      r.domainError?r.domainError
      :r.inconclusive?'Los valores muestreados no demuestran el límite.'
      :r.exists
        ?(r.tipo==='directo'?'Sustitución directa'
          :(r.tipo==='simbolico')?'Evaluación simbólica'
          :(r.tipo==='indet_00'||r.tipo==='indet_inf')?'Resuelto por L\u2019H\u00f4pital'
          :'Límite existe')
        :(r.isInfinity?'Límite infinito — la función diverge'
          :'El límite no existe (laterales distintos)')
    }</div>
  </div>`;
  return html;
}

// ── CALCULAR LÍMITE (callback del botón) ──
export function calcLimit(){
  const fxStr=document.getElementById('dif-lim-fx').value.trim();
  const aStr =document.getElementById('dif-lim-a').value.trim();
  const side =document.getElementById('dif-lim-side').value;
  const variable=document.getElementById('dif-lim-var')?.value.trim()||'x';
  const res  =document.getElementById('res-lim');
  if(!fxStr){ res.innerHTML=errBox('Ingresa una función f('+variable+')'); return; }
  const r=computeLimit(fxStr,aStr,side,variable);
  res.innerHTML=limitStepsHTML(r);
}

// ── OPERACIÓN ENTRE DOS LÍMITES ──
export function calcLimitOp(){
  const fx1  =document.getElementById('lim-op-fx1').value.trim();
  const a1Str=document.getElementById('lim-op-a1').value.trim();
  const s1   =document.getElementById('lim-op-side1').value;
  const variable1=document.getElementById('lim-op-var1')?.value.trim()||'x';
  const op   =document.getElementById('lim-op-op').value;
  const fx2  =document.getElementById('lim-op-fx2').value.trim();
  const a2Str=document.getElementById('lim-op-a2').value.trim();
  const s2   =document.getElementById('lim-op-side2').value;
  const variable2=document.getElementById('lim-op-var2')?.value.trim()||'x';
  const res  =document.getElementById('res-lim-op');
  if(!fx1||!fx2){ res.innerHTML=errBox('Ingresa ambas funciones'); return; }

  const {first:r1,second:r2,valueNum:resVal,reason}=calculateLimitOperation(
    {expr:fx1,point:a1Str,side:s1,variable:variable1},
    {expr:fx2,point:a2Str,side:s2,variable:variable2},op);
  const v1=r1.valueNum, v2=r2.valueNum;
  const a1=fmtA(a1Str), a2=fmtA(a2Str);
  const opSym={'+':'+','−':'−','*':'·','/':'÷'}[op]||op;

  const resStr=Number.isNaN(resVal)?'Indeterminado':fmtResult(resVal)||'Indefinido';

  let html='';
  html+=`<div class="lim-op-block"><div class="lim-op-label">Límite A — lim<sub>${variable1}→${a1}</sub> [${fx1}]</div>${limitStepsHTML(r1)}</div>`;
  html+=`<div class="lim-op-block"><div class="lim-op-label">Límite B — lim<sub>${variable2}→${a2}</sub> [${fx2}]</div>${limitStepsHTML(r2)}</div>`;
  html+=`<div class="calc-res-box" style="border-color:var(--gold);margin-top:8px">
    <div class="calc-res-label">L_A ${opSym} L_B</div>
    <div class="calc-res-val big">${resultWithFraction(resStr)}</div>
    <div class="calc-res-hint">${fmtResult(v1)||'?'} ${opSym} ${fmtResult(v2)||'?'} = ${resStr}</div>
    ${reason?`<div class="calc-res-hint">${reason}</div>`:''}
  </div>`;
  res.innerHTML=html;
}

export function calcDerivative(){
  const fxStr = document.getElementById('dif-der-fx').value.trim();
  const ord   = Number(document.getElementById('dif-der-ord').value);
  const ptStr = document.getElementById('dif-der-pt').value.trim();
  const variable=document.getElementById('dif-der-var')?.value.trim()||'x';
  const res   = document.getElementById('res-der');
  if(!fxStr){res.innerHTML=errBox('Ingresa una función');return;}

  const labels = ['Primera','Segunda','Tercera','Cuarta'];
  const primes = [`f'(${variable})`,`f''(${variable})`,`f'''(${variable})`,`f⁽⁴⁾(${variable})`];
  const details=derivativeDetails(fxStr,ord,variable);
  if(!details){res.innerHTML=errBox('Expresión o variable inválida. Usa funciones con paréntesis y un orden de 1 a 4 (máximo 500 caracteres).');return;}
  let html=resBox(primes[ord-1]+' — derivada simbólica',details.derivative,labels[ord-1]+' derivada',true);
  html+=`<div class="calc-res-box"><div class="calc-res-label">Reglas utilizadas</div><ol>${details.rules.map(rule=>`<li>${rule}</li>`).join('')}</ol>`;
  if(ord>1) html+=`<div class="calc-res-label">Derivaciones sucesivas</div><ol>${details.derivatives.map(row=>`<li>Orden ${row.order}: ${row.expression}</li>`).join('')}</ol>`;
  html+=`<div class="calc-res-label">Condiciones de la fórmula</div>${details.conditions.length?`<ul>${details.conditions.map(condition=>`<li>${condition}</li>`).join('')}</ul>`:'<p>Conserva el dominio real de la función original.</p>'}<div class="calc-res-hint">Son condiciones suficientes de esta fórmula; los puntos de frontera requieren análisis aparte.</div></div>`;
  if(ptStr!==''&&ptStr!=='opcional'){
    const pointFn=collectVariables(ptStr).length===0?calcParse(ptStr):null;
    const x0=pointFn?.(0);
    if(!Number.isFinite(x0)) html+=errBox('El punto debe ser una expresión real constante, como π/6 o sqrt(2).');
    else{
      const evaluation=details.evaluate(x0);
      html+=evaluation.status==='evaluated'
        ? resBox(`${primes[ord-1]} en ${variable} = ${x0}`,formatResult(evaluation.value,8),`Sustituyendo en ${details.derivative}`)
        : errBox(evaluation.reason);
    }
  }
  res.innerHTML=html;
}

export function calcImplicit(){
  const fxyStr = document.getElementById('dif-imp-fxy').value.trim();
  const constant=text=>{const s=text.trim();return s&&collectVariables(s).length===0?calcParse(s)?.(0):NaN;};
  const x0 = constant(document.getElementById('dif-imp-x0').value);
  const y0 = constant(document.getElementById('dif-imp-y0').value);
  const rateText=document.getElementById('dif-imp-dxdt')?.value.trim()||'';
  const dxdt=rateText?constant(rateText):null;
  const res = document.getElementById('res-imp');
  if(!fxyStr){res.innerHTML=errBox('Ingresa F(x,y)');return;}
  try{
    const result=implicitCurveAt(fxyStr,x0,y0,{dxdt});
    let html=resBox('Diferenciar F(x,y)=0',`Fₓ = ${result.symbolicFx}; Fᵧ = ${result.symbolicFy}`,
      'Fₓ + Fᵧ·dy/dx = 0; por tanto dy/dx = −Fₓ/Fᵧ cuando Fᵧ≠0.');
    html+=resBox('Verificación del punto',`F(${fN(x0)},${fN(y0)}) = ${fN(result.fval,10)}`,
      `Residuo relativo ${result.residual.toExponential(2)}; tolerancia ${result.tolerance}.`);
    if(['off-curve','singular'].includes(result.status)){
      res.innerHTML=html+errBox(result.reason); return;
    }
    html+=resBox(`∂F/∂x en (${x0},${y0})`,formatResult(result.fx,8));
    html+=resBox(`∂F/∂y en (${x0},${y0})`,formatResult(result.fy,8));
    if(result.status==='vertical') html+=resBox('Tangente vertical',`x = ${fN(x0)}`,'Fᵧ≈0 y Fₓ≠0; dy/dx no es finito.',true);
    else{
      html+=resBox(`dy/dx en (${x0},${y0})`,formatResult(result.slope,8),`−(${fN(result.fx)})/(${fN(result.fy)})`,true);
      html+=resBox('Recta tangente',`y = (${fN(result.slope,8)})x ${result.intercept>=0?'+':'−'} ${fN(Math.abs(result.intercept),8)}`,
        `${fN(result.fx)}·(x−${fN(x0)}) + ${fN(result.fy)}·(y−${fN(y0)}) = 0.`);
    }
    if(result.rates){
      html+=result.rates.status==='evaluated'
        ? resBox('Tasa relacionada dy/dt',formatResult(result.rates.dydt,8),
          `Fₓ·dx/dt + Fᵧ·dy/dt=0: dy/dt = (${fN(result.slope)})·(${fN(dxdt)}). Conserva unidades coherentes de coordenada y tiempo.`)
        : errBox(result.rates.reason);
    }
    res.innerHTML=html+`<div class="calc-res-hint">Hipótesis: ${result.hypotheses}</div>`;
  }catch(error){res.innerHTML=errBox(error.message);}
}

export function calcAnalysis(){
  const expression=v('dif-ana-fx'),res=document.getElementById('res-ana');
  const number=value=>value===Infinity?'+∞':value===-Infinity?'−∞':fN(value,8);
  const interval=c=>`(${number(c.left)}, ${number(c.right)}): ${c.trend}`;
  const point=p=>`(${number(p.x)}, ${number(p.value)}): ${p.type||'inflexión'}`;
  try {
    const r=rationalFunctionAnalysis(expression);
    res.innerHTML=resBox('Dominio y simetría',`${r.domain}; ${r.symmetry}`)+
      resBox('Puntos críticos',r.criticalPoints.map(point).join('<br>')||'Sin puntos críticos aislados')+
      resBox('Signos de f′ y monotonía',r.monotonicity.map(interval).join('<br>'))+
      resBox('Signos de f″ y concavidad',r.concavity.map(interval).join('<br>'))+
      resBox('Inflexiones',r.inflections.map(point).join('<br>')||'Ninguna')+
      resBox('Discontinuidades',r.discontinuities.map(p=>`x=${number(p.x)}: ${p.type}; ${p.type==='asíntota vertical'?`límite izquierdo ${number(p.left)}, derecho ${number(p.right)}`:`límite ${number(p.limit)}`}`).join('<br>')||'Ninguna')+
      resBox('Asíntota al infinito',r.asymptote?`${r.asymptoteType}; coeficientes desde constante: [${r.asymptote.map(number).join(', ')}]`:'No aplica a polinomios')+
      resBox('Método y alcance',r.formula+' '+r.assumption)+functionAnalysisSvg(r);
  }catch(error){res.innerHTML=errBox(error.message);}
}


export function toggleLimOp(){
  const p=document.getElementById('lim-op-panel');
  if(p) p.style.display=p.style.display==='none'?'block':'none';
}
