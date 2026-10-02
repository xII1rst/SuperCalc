import { arcLength, areaBetweenCurves, centroidRegion, fluidForce, surfaceAreaOfRevolution, workVariable } from '../../math/integral-applications.mjs';
import { calcParse } from '../../math/expression.mjs';
import { definiteIntegral } from '../../math/integration/definite.mjs';
import { errBox, pf, pinf, resBox, v } from './results.mjs';
import { fN, formatResult } from '../../utils/format.mjs';
import { fmtA } from '../../math/calculus/format.mjs';
import { integrate } from '../../math/integration/engine.mjs';
import { riemannSum, trapezoidalRule } from '../../math/numeric.mjs';
import { simpsonIntegral } from '../../math/calculus/numeric.mjs';

// ═══════════════════════════════════════════════════════
// CÁLCULO INTEGRAL
// ═══════════════════════════════════════════════════════
export function calcIntegralIndef(){
  const fxStr=v('int-indef-fx');
  const res=document.getElementById('res-indef');
  const fn=calcParse(fxStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  // Comparte el motor y el procedimiento con la tarjeta CAS.
  const integral=integrate(fxStr),antideriv=integral.result;
  let html=antideriv?
    resBox('∫ f(x) dx =', antideriv+' + C', 'Verificable derivando el resultado', true):
    resBox('∫ f(x) dx','Usa la Integral Definida para calcular numéricamente','');
  if(integral.steps.length)html+=resBox('Pasos',integral.steps.join('; '));
  if(integral.domain.length)html+=resBox('Condiciones suficientes en cada intervalo',integral.domain.join('; '));
  html+=resBox('f(1) para referencia', formatResult(fn(1,0),6));
  res.innerHTML=html;
}

export function calcIntegralDef(){
  const fxStr=v('int-def-fx');
  const a=pinf('int-def-a'), b=pinf('int-def-b');
  const res=document.getElementById('res-def');
  if(!fxStr){res.innerHTML=errBox('Ingresa una función');return;}
  if(isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa los límites a y b');return;}
  if(a>=b){res.innerHTML=errBox('Se requiere a < b');return;}

  const r=definiteIntegral(fxStr,a,b,'x');
  if(r.error){res.innerHTML=errBox(r.error);return;}

  const bl=x=>fmtA(String(x));
  const label=`∫<sub>${bl(a)}</sub><sup>${bl(b)}</sup> f(x) dx`;

  if(r.diverges){
    res.innerHTML=resBox(label, 'Diverge', 'La integral impropia no converge', true)+resBox('Criterio analítico',r.steps.join('; '));
    return;
  }

  let hint='';
  if(r.improper) hint=r.proof==='analytic'?'Integral impropia · límite analítico':'Estimación impropia · convergencia no demostrada';
  else if(r.technique&&r.technique!=='ninguna') hint='Antiderivada · '+r.technique;
  else hint='Numérico (Simpson)';

  let html=resBox(label, r.value, hint, true);

  const steps=[];
  if(r.antiderivative){
    steps.push(`Antiderivada:  F(x) = ${r.antiderivative}`);
    steps.push(`F(${bl(b)}) − F(${bl(a)}) = ${r.value}`);
  }
  if(r.improper&&r.proof==='numerical') steps.push('Transformación numérica de límite infinito sobre [0,1]');
  if(r.refinementDifference!==null)steps.push(`Diferencia entre mallas: ${r.refinementDifference}; no es cota de error.`);
  if(r.steps&&r.steps.length) steps.push(...r.steps);
  if(steps.length){
    html+=`<div class="calc-res-box"><div class="calc-res-label">Pasos</div><div class="calc-res-hint">${steps.map(s=>String(s).replace(/</g,'&lt;')).join('<br>')}</div></div>`;
  }

  if(Number.isFinite(a)&&Number.isFinite(b)){
    html+=resBox('Valor promedio  f̄ = (1/(b−a))∫f dx', formatResult(r.valueNum/(b-a)))+
          resBox('Longitud del intervalo', formatResult(b-a,4)+' u');
  }
  res.innerHTML=html;
}

export function calcIntegralNumeric(){
  const res=document.getElementById('res-def-num');
  const fxStr=v('int-def-fx'), fn=calcParse(fxStr);
  const a=pf('int-def-a'), b=pf('int-def-b');
  const n=v('int-num-n')===''?4:pf('int-num-n');
  const method=document.getElementById('int-num-method').value;
  if(!fn||![a,b].every(Number.isFinite)||a>=b){
    res.innerHTML=errBox('Ingresa f(x) válida y límites finitos con a < b');return;
  }
  if(!Number.isInteger(n)||n<1||n>1000||(method==='simpson'&&n%2!==0)){
    res.innerHTML=errBox('Usa 1–1000 subintervalos; Simpson requiere n par');return;
  }
  try{
    const value=method==='trapezoid'?trapezoidalRule(fn,a,b,n)
      :method==='simpson'?simpsonIntegral(fn,a,b,n)
      :riemannSum(fn,a,b,n,method);
    if(!Number.isFinite(value)) throw new RangeError('La función no es finita en la malla');
    const h=(b-a)/n;
    const formula=method==='right'?'h·Σ f(a+i·h), i=1…n'
      :method==='left'?'h·Σ f(a+i·h), i=0…n−1'
      :method==='midpoint'?'h·Σ f(a+(i+½)·h), i=0…n−1'
      :method==='trapezoid'?'h·[f(a)/2 + Σf(a+i·h) + f(b)/2]'
      :'h/3·[f(a) + 4Σf(x impar) + 2Σf(x par) + f(b)]';
    res.innerHTML=resBox('Aproximación numérica',formatResult(value,8),
      `${formula}; h=(${fN(b,5)}−${fN(a,5)})/${n}=${fN(h,6)}`,true);
    const reference=definiteIntegral(fxStr,a,b);
    if(reference.proof==='antiderivative'&&!reference.error)res.innerHTML+=resBox('Referencia por antiderivada',reference.value)+
      resBox('Error absoluto frente a referencia',formatResult(Math.abs(value-reference.valueNum),10));
    const sampleCount=method==='trapezoid'||method==='simpson'?n+1:n;
    const mesh=Array.from({length:Math.min(sampleCount,40)},(_,i)=>{
      const x=method==='right'?a+(i+1)*h:method==='midpoint'?a+(i+.5)*h:a+i*h;
      return `x=${fN(x,6)}, f(x)=${fN(fn(x,0),6)}`;
    }).join('; ');
    res.innerHTML+=resBox('Malla y valores',mesh+(sampleCount>40?`; … ${sampleCount} puntos en total`:''));
  }catch(e){res.innerHTML=errBox(e.message);}
}

// ═══════════════════════════════════════════════════════
// INTEGRACIÓN SIMBÓLICA (CAS), SERIES Y APLICACIONES
// ═══════════════════════════════════════════════════════
export function calcIntegrateCAS(){
  const fxStr=v('int-cas-fx');
  const res=document.getElementById('res-cas');
  if(!fxStr){res.innerHTML=errBox('Ingresa una función');return;}
  const r=integrate(fxStr,'x');
  if(!r||!r.result){res.innerHTML=errBox('No se pudo integrar simbólicamente');return;}
  let html=resBox('∫ f(x) dx =', r.result+' + C', 'Técnica: '+r.technique, true);
  if(r.steps&&r.steps.length){
    html+=`<div class="calc-res-box"><div class="calc-res-label">Pasos</div><div class="calc-res-hint">${r.steps.map(s=>String(s).replace(/</g,'&lt;')).join('<br>')}</div></div>`;
  }
  if(r.domain?.length)html+=resBox('Condiciones suficientes en cada intervalo',r.domain.join('; '));
  res.innerHTML=html;
}

export function calcIntegralApp(){
  const type=document.getElementById('intapp-type')?.value||'area';
  const res=document.getElementById('res-intapp');
  const fx=v('intapp-fx'), a=pf('intapp-a'), b=pf('intapp-b');
  let html='';
  try{
    if(type==='area'){
      const gx=v('intapp-gx');
      const f=calcParse(fx), g=calcParse(gx);
      if(!f||!g||isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa f(x), g(x), a y b');return;}
      html=resBox('Área entre curvas ∫(f−g)dx', `${formatResult(areaBetweenCurves(f,g,a,b),8)} u²`, `[${a}, ${b}]`, true);
    } else if(type==='arc'||type==='surface'||type==='centroid'){
      const f=calcParse(fx);
      if(!f||isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa f(x), a y b');return;}
      if(type==='arc') html=resBox('Longitud de arco ∫√(1+f\'²)dx', `${formatResult(arcLength(f,a,b),8)} u`, `[${a}, ${b}]`, true);
      else if(type==='surface') html=resBox('Superficie de revolución (eje X)', `${formatResult(surfaceAreaOfRevolution(f,a,b),8)} u²`, `[${a}, ${b}]`, true);
      else { const c=centroidRegion(f,a,b); html=resBox('Centroide (x̄, ȳ)', `(${fN(c.xbar,6)}, ${fN(c.ybar,6)})`, `Área = ${fN(c.area,6)} u²`, true); }
    } else if(type==='work'){
      const f=calcParse(fx);
      if(!f||isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa F(x), a y b');return;}
      html=resBox('Trabajo W = ∫F(x)dx', `${formatResult(workVariable(f,a,b),8)} J`, `[${a}, ${b}]`, true);
    } else if(type==='fluid'){
      const rho=pf('intapp-rho'), depth=v('intapp-depth'), width=v('intapp-width');
      const h=calcParse(depth), w=calcParse(width);
      if(!h||!w||isNaN(a)||isNaN(b)||isNaN(rho)){res.innerHTML=errBox('Ingresa ρ, h(x), w(x), a y b');return;}
      html=resBox('Fuerza hidrostática F = ρ∫h·w dx', `${formatResult(fluidForce(rho,h,w,a,b),8)} N`, `ρ = ${rho}`, true);
    }
  }catch(e){res.innerHTML=errBox(e.message);return;}
  res.innerHTML=html;
}
