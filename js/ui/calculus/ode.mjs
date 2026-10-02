import { calcParse } from '../../math/expression.mjs';
import { errBox, pf, resBox, v } from './results.mjs';
import { fN, formatResult } from '../../utils/format.mjs';
import { rk4Refinement } from '../../math/calculus/numeric.mjs';
import { solveSecondOrderHomogeneous } from '../../math/applications.mjs';

// ═══════════════════════════════════════════════════════
// EDO
// ═══════════════════════════════════════════════════════
function edoNumericResult(fn,prefix,title,description){
  const read=(suffix,defaultValue)=>v(`${prefix}-${suffix}`)===''?defaultValue:pf(`${prefix}-${suffix}`);
  const x0=read('x0',0), y0=read('y0',1);
  const xFinal=read('xfinal',x0+5), steps=read('steps',50);
  if(![x0,y0,xFinal].every(Number.isFinite)||!Number.isInteger(steps)||steps<1||steps>1000){
    throw new RangeError('Ingresa condiciones finitas y entre 1 y 1000 pasos');
  }
  const result=rk4Refinement(fn,x0,y0,xFinal,steps);
  const interval=Math.max(1,Math.ceil(steps/5));
  const sample=result.coarse.filter((_,i)=>i%interval===0||i===steps)
    .map(p=>`y(${fN(p[0],4)}) ≈ ${fN(p[1],6)}`).join('<br>');
  return resBox(title,sample,description)+
    resBox(`y(${fN(xFinal,4)}) ≈`,formatResult(result.fineValue,8),
      `h=${fN(result.h,6)}, ${steps} pasos; refinado con ${2*steps} pasos`,true)+
    resBox('Comparación de mallas',`|y₂ₙ − yₙ| = ${formatResult(Math.abs(result.fineValue-result.coarseValue),8)}`,
      `Estimación de error RK4 ≈ ${formatResult(result.errorEstimate,8)} (si rige el orden 4)`);
}

export function calcEDOSep(){
  const rhsStr=v('edo-sep-rhs');
  const res=document.getElementById('res-sep');
  const fn=calcParse(rhsStr);
  if(!fn){res.innerHTML=errBox('Función inválida. Usa x e y');return;}
  try{
    res.innerHTML=edoNumericResult((x,y)=>fn(x,y),'edo-sep','RK4 — Solución numérica',`dy/dx = ${rhsStr}`);
  }catch(e){res.innerHTML=errBox(e.message);}
}

export function calcEDOLinear(){
  const px=calcParse(v('edo-lin-px')), qx=calcParse(v('edo-lin-qx'));
  const res=document.getElementById('res-edolin');
  if(!px||!qx){res.innerHTML=errBox('P(x) o Q(x) inválidos');return;}
  try{
    res.innerHTML=edoNumericResult((x,y)=>qx(x,0)-px(x,0)*y,'edo-lin',
      'RK4 — y\' + P(x)y = Q(x)',`P(x)=${v('edo-lin-px')}, Q(x)=${v('edo-lin-qx')}`);
  }catch(e){res.innerHTML=errBox(e.message);}
}

export function calcEDO2nd(){
  const read=(id,defaultValue)=>v(id)===''?defaultValue:pf(id);
  const a=read('edo-2do-a',1), b=read('edo-2do-b',0), c=read('edo-2do-c',0);
  const y0=read('edo-2do-y0',1), dy0=read('edo-2do-dy0',0);
  const res=document.getElementById('res-edo2');
  let solution;
  try{ solution=solveSecondOrderHomogeneous(a,b,c,y0,dy0); }
  catch(e){ res.innerHTML=errBox(e.message); return; }
  const {roots,c1,c2}=solution;
  const {disc}=roots;
  let solType,sol,particular,constants;
  if(roots.type==='distinct'){
    const {r1,r2}=roots;
    solType='Raíces reales distintas';
    sol=`y = C₁·e^(${fN(r1,4)}x) + C₂·e^(${fN(r2,4)}x)`;
    particular=`y = ${fN(c1,6)}·e^(${fN(r1,4)}x) + ${fN(c2,6)}·e^(${fN(r2,4)}x)`;
    constants=`C₁ = [y'(0) − r₂y(0)]/(r₁ − r₂) = ${fN(c1,6)}<br>C₂ = y(0) − C₁ = ${fN(c2,6)}`;
  } else if(roots.type==='repeated'){
    const {r}=roots;
    solType='Raíz real doble';
    sol=`y = (C₁ + C₂x)·e^(${fN(r,4)}x)`;
    particular=`y = (${fN(c1,6)} + ${fN(c2,6)}x)·e^(${fN(r,4)}x)`;
    constants=`C₁ = y(0) = ${fN(c1,6)}<br>C₂ = y'(0) − r·y(0) = ${fN(c2,6)}`;
  } else {
    const {alpha,beta}=roots;
    solType='Raíces complejas conjugadas';
    sol=`y = e^(${fN(alpha,4)}x)[C₁cos(${fN(beta,4)}x) + C₂sin(${fN(beta,4)}x)]`;
    particular=`y = e^(${fN(alpha,4)}x)[${fN(c1,6)}cos(${fN(beta,4)}x) + ${fN(c2,6)}sin(${fN(beta,4)}x)]`;
    constants=`C₁ = y(0) = ${fN(c1,6)}<br>C₂ = [y'(0) − α·y(0)]/β = ${fN(c2,6)}`;
  }
  res.innerHTML=
    resBox('Ecuación característica', `${a}r² + ${b}r + ${c} = 0`)+
    resBox('Discriminante Δ', formatResult(disc))+
    resBox('Tipo de solución', solType)+
    resBox('Solución general', sol)+
    resBox('Condiciones iniciales', constants,`y(0)=${y0}; y'(0)=${dy0}`)+
    resBox('Solución del ejercicio',particular,'Constantes sustituidas',true);
}
