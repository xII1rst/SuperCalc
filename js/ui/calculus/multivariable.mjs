import { calcParse } from '../../math/expression.mjs';
import { centerOfMass2D, criticalPoints2D, directionalDerivative, doubleIntegralPolar, jacobian2D, lagrangeMultipliers, multivariableLimit, tripleIntegral } from '../../math/multivariable.mjs';
import { curl, curvature, divergence, gradient3D, lineIntegralScalar, lineIntegralVector, unitNormal, unitTangent } from '../../math/vector-calculus.mjs';
import { errBox, pf, resBox, v } from './results.mjs';
import { fN, formatResult } from '../../utils/format.mjs';
import { fmtA } from '../../math/calculus/format.mjs';
import { gradient2D, midpointIntegral2D, partialDerivative } from '../../math/calculus/numeric.mjs';
import { greenRegionStudy, polynomialPotentialStudy, stokesDiskStudy } from '../../math/multivariable-study.mjs';
import { symbolicDeriv } from '../../math/calculus/derivatives.mjs';

// ═══════════════════════════════════════════════════════
// MULTIVARIABLE
// ═══════════════════════════════════════════════════════
export function calcPartial(){
  const fxyStr=v('mul-par-fxy');
  const varN=document.getElementById('mul-par-var').value;
  const ord=parseInt(document.getElementById('mul-par-ord').value);
  const x0=pf('mul-par-x0'), y0=pf('mul-par-y0');
  const res=document.getElementById('res-par');
  const fn=calcParse(fxyStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}

  const sym=symbolicDeriv(fxyStr,ord,varN);
  let html=sym?resBox(`∂${ord>1?ord:''}f/∂${varN}${ord>1?ord:''}`,sym):'' ;

  if(!isNaN(x0)&&!isNaN(y0)){
    const v2=partialDerivative(fn,x0,y0,varN,ord);
    html+=resBox(`Valor en (${x0},${y0})`, formatResult(v2,8), '', true);
  } else {
    html+=resBox('Nota','Ingresa (x₀,y₀) para evaluar en un punto','');
  }
  res.innerHTML=html;
}

export function calcGradient(){
  const fxyStr=v('mul-grad-fxy');
  const x0=pf('mul-grad-x0'), y0=pf('mul-grad-y0');
  const res=document.getElementById('res-grad');
  const fn=calcParse(fxyStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  if(isNaN(x0)||isNaN(y0)){res.innerHTML=errBox('Ingresa el punto (x₀, y₀)');return;}

  const {fx,fy,mag}=gradient2D(fn,x0,y0);
  res.innerHTML=
    resBox('∂f/∂x', formatResult(fx))+
    resBox('∂f/∂y', formatResult(fy))+
    resBox('∇f = (∂f/∂x, ∂f/∂y)', `(${fN(fx,4)},  ${fN(fy,4)})`, 'Dirección de máximo crecimiento', true)+
    resBox('|∇f| — magnitud', formatResult(mag,6))+
    resBox('∇f unitario', mag>1e-10?`(${fN(fx/mag,4)},  ${fN(fy/mag,4)})`:'(0, 0)');
}

export function calcDoubleIntegral(){
  const fxyStr=v('mul-dint-fxy');
  const x1=pf('mul-dint-x1'),x2=pf('mul-dint-x2');
  const y1=pf('mul-dint-y1'),y2=pf('mul-dint-y2');
  const res=document.getElementById('res-dint');
  const fn=calcParse(fxyStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  if([x1,x2,y1,y2].some(isNaN)){res.innerHTML=errBox('Ingresa todos los límites');return;}

  const result=midpointIntegral2D(fn,x1,x2,y1,y2);
  res.innerHTML=
    resBox(`∬ f dx dy — [${x1},${x2}]×[${y1},${y2}]`, formatResult(result,8), 'Punto medio 100×100', true)+
    resBox('Área de la región', formatResult((x2-x1)*(y2-y1),4)+' u²')+
    resBox('Valor promedio f̄', formatResult(result/((x2-x1)*(y2-y1)),6));
}

// ═══════════════════════════════════════════════════════
// CÁLCULO VECTORIAL Y MULTIVARIABLE (nuevas tarjetas)
// ═══════════════════════════════════════════════════════
export function calcGrad3D(){
  const fxyz=v('vec-grad-fxyz');
  const x=pf('vec-grad-x'), y=pf('vec-grad-y'), z=pf('vec-grad-z');
  const res=document.getElementById('res-vecgrad');
  if(!fxyz){res.innerHTML=errBox('Ingresa f(x,y,z)');return;}
  if(isNaN(x)||isNaN(y)||isNaN(z)){res.innerHTML=errBox('Ingresa el punto (x, y, z)');return;}
  try{
    const g=gradient3D(fxyz,x,y,z);
    res.innerHTML=
      resBox('∂f/∂x', formatResult(g.x,6))+
      resBox('∂f/∂y', formatResult(g.y,6))+
      resBox('∂f/∂z', formatResult(g.z,6))+
      resBox('∇f =', `(${fN(g.x,4)}, ${fN(g.y,4)}, ${fN(g.z,4)})`, 'Gradiente 3D', true);
  }catch(e){ res.innerHTML=errBox(e.message); }
}

export function calcDirectional(){
  const fxy=v('vec-dir-fxy');
  const x0=pf('vec-dir-x0'), y0=pf('vec-dir-y0');
  const dx=pf('vec-dir-dx'), dy=pf('vec-dir-dy');
  const res=document.getElementById('res-vecdir');
  if(!fxy){res.innerHTML=errBox('Ingresa f(x,y)');return;}
  if([x0,y0,dx,dy].some(isNaN)){res.innerHTML=errBox('Ingresa el punto y la dirección');return;}
  if(dx===0&&dy===0){res.innerHTML=errBox('La dirección no puede ser (0,0)');return;}
  try{
    const v=directionalDerivative(fxy,x0,y0,{x:dx,y:dy});
    res.innerHTML=resBox('D_u f', formatResult(v,8), `en dirección (${dx}, ${dy})`, true);
  }catch(e){ res.innerHTML=errBox(e.message); }
}

export function calcCurvature(){
  const x=v('vec-cur-x'), y=v('vec-cur-y');
  const t=pf('vec-cur-t');
  const res=document.getElementById('res-veccur');
  if(!x||!y){res.innerHTML=errBox('Ingresa x(t) y y(t)');return;}
  if(isNaN(t)){res.innerHTML=errBox('Ingresa el parámetro t');return;}
  try{
    const k=curvature(x,y,t);
    const T=unitTangent(x,y,t);
    const N=unitNormal(x,y,t);
    res.innerHTML=
      resBox('Curvatura κ', formatResult(k,8), '', true)+
      resBox('Tangente unitaria T', `(${fN(T.x,4)}, ${fN(T.y,4)})`)+
      resBox('Normal unitaria N', `(${fN(N.x,4)}, ${fN(N.y,4)})`);
  }catch(e){ res.innerHTML=errBox(e.message); }
}

export function calcDivCurl(){
  const fx=v('vec-fx'), fy=v('vec-fy'), fz=v('vec-fz');
  const x=pf('vec-px'), y=pf('vec-py'), z=pf('vec-pz');
  const res=document.getElementById('res-divcurl');
  if(!fx||!fy||!fz){res.innerHTML=errBox('Ingresa Fx, Fy y Fz');return;}
  if(isNaN(x)||isNaN(y)||isNaN(z)){res.innerHTML=errBox('Ingresa el punto (x, y, z)');return;}
  try{
    const d=divergence(fx,fy,fz,x,y,z);
    const c=curl(fx,fy,fz,x,y,z);
    res.innerHTML=
      resBox('Divergencia ∇·F', formatResult(d,8), '', true)+
      resBox('Rotacional ∇×F', `(${fN(c.x,4)}, ${fN(c.y,4)}, ${fN(c.z,4)})`);
  }catch(e){ res.innerHTML=errBox(e.message); }
}

export function calcConservative(){
  const fx=v('cons-fx'), fy=v('cons-fy');
  const x0=pf('cons-x0'), y0=pf('cons-y0');
  const res=document.getElementById('res-cons');
  if(!fx||!fy){res.innerHTML=errBox('Ingresa Fx y Fy');return;}
  try{
    let proof;
    try { proof=polynomialPotentialStudy(fx,fy,[0,0],[Number.isFinite(x0)?x0:0,Number.isFinite(y0)?y0:0]); }
    catch(error){
      res.innerHTML=resBox('¿Conservativo?','No demostrado',error.message+'; una igualdad de parciales en un punto no demuestra que el campo tenga potencial global.');return;
    }
    let html=resBox('¿Conservativo?',proof.conservative?'Sí':'No',proof.proof,true);
    html+=resBox('Qₓ−Pᵧ',proof.curl,'Identidad de coeficientes, no muestra en un punto');
    if(proof.conservative)html+=resBox('Potencial Φ(x,y)',proof.potential+' + C')+resBox(`Φ(${x0},${y0})−Φ(0,0)`,formatResult(proof.value,8));
    res.innerHTML=html;
  }catch(e){ res.innerHTML=errBox(e.message); }
}

export function calcLineIntegral(){
  const fs=v('li-s-f'), xs=v('li-s-x'), ys=v('li-s-y');
  const st0=pf('li-s-t0'), st1=pf('li-s-t1');
  const fx=v('li-v-fx'), fy=v('li-v-fy'), xv=v('li-v-x'), yv=v('li-v-y');
  const vt0=pf('li-v-t0'), vt1=pf('li-v-t1');
  const res=document.getElementById('res-lineint');
  let html='';
  if(fs&&xs&&ys&&!isNaN(st0)&&!isNaN(st1)){
    try{
      html+=resBox('∫_C f ds (escalar)', formatResult(lineIntegralScalar(fs,xs,ys,st0,st1),8),
        `f=${fs}, C: (${xs}, ${ys})`, true);
    }catch(e){ html+=errBox('Escalar: '+e.message); }
  }
  if(fx&&fy&&xv&&yv&&!isNaN(vt0)&&!isNaN(vt1)){
    try{
      html+=resBox('∫_C F·dr (vectorial)', formatResult(lineIntegralVector(fx,fy,xv,yv,vt0,vt1),8),
        `F=(${fx}, ${fy})`, true);
    }catch(e){ html+=errBox('Vectorial: '+e.message); }
  }
  if(!html) html=errBox('Completa la integral escalar o la vectorial');
  res.innerHTML=html;
}

export function calcTheorems(){
  const p=v('th-p'), q=v('th-q');
  const x1=pf('th-x1'), x2=pf('th-x2'), y1=pf('th-y1'), y2=pf('th-y2');
  const fx=v('th-fx'), fy=v('th-fy'), fz=v('th-fz'), R=pf('th-r');
  const res=document.getElementById('res-theorems');
  let html='';
  if(p&&q&&![x1,x2,y1,y2].some(isNaN)){
    try{
      const green=greenRegionStudy(p,q,x1,x2,()=>y1,()=>y2,120);
      const gauss=greenRegionStudy(`-(${q})`,p,x1,x2,()=>y1,()=>y2,120);
      html+=resBox('Green ∮ P dx + Q dy',formatResult(green.value,8),`Rectángulo; borde positivo antihorario. Qₓ−Pᵧ=${green.curl}. ${green.assumption} Diferencia entre mallas=${formatResult(green.refinementDifference,8)}.`,true);
      html+=resBox('Flujo (Gauss 2D)',formatResult(gauss.value,8),'Normal exterior; ∇·F='+gauss.curl);
    }catch(e){ html+=errBox('Green: '+e.message); }
  }
  if(fx&&fy&&fz&&!isNaN(R)&&R>0){
    try{
      const solved=stokesDiskStudy([fx,fy,fz],R);
      html+=resBox('Stokes sobre disco de radio R',formatResult(solved.value,8),`${solved.orientation}. ${solved.formula} ${solved.assumption} Integral de borde=${formatResult(solved.lineIntegral,8)}; diferencia borde/superficie=${formatResult(solved.agreementDifference,8)}.`,true);
    }catch(e){ html+=errBox('Stokes: '+e.message); }
  }
  if(!html) html=errBox('Completa Green (P,Q,región) o Stokes (F,R)');
  res.innerHTML=html;
}

export function calcMvLimit(){
  const fxy=v('mvlim-fxy');
  const x0=pf('mvlim-x0'), y0=pf('mvlim-y0');
  const res=document.getElementById('res-mvlim');
  if(!fxy){res.innerHTML=errBox('Ingresa f(x,y)');return;}
  if(isNaN(x0)||isNaN(y0)){res.innerHTML=errBox('Ingresa el punto (x₀, y₀)');return;}
  try{
    const r=multivariableLimit(fxy,x0,y0);
    const answer=r.status==='proved'?fmtA(String(r.value))
      :r.status==='disproved'?'No existe':'Indeterminado con este método';
    const hint=r.status==='proved'?(r.proof||'Sustitución directa en una expresión continua en el punto')
      :r.status==='disproved'?'Dos trayectorias tienen límites distintos'
      :'Un número finito de trayectorias coincidentes no demuestra el límite';
    let html=resBox('Límite',answer,hint,true);
    html+=`<div class="calc-res-box"><div class="calc-res-label">Trayectorias</div><div class="calc-res-hint">${r.paths.map(p=>`${p.name}: ${p.formalValue!==null?fmtA(String(p.formalValue))+' (analítico)':p.value===null?'—':fN(p.value,4)+' (muestra)'}`).join('<br>')}</div></div>`;
    res.innerHTML=html;
  }catch(e){ res.innerHTML=errBox(e.message); }
}

export function calcExtrema(){
  const fxy=v('extr-fxy');
  const x1=pf('extr-x1'), x2=pf('extr-x2'), y1=pf('extr-y1'), y2=pf('extr-y2');
  const g=v('extr-g'), c=pf('extr-c');
  const res=document.getElementById('res-extr');
  if(!fxy){res.innerHTML=errBox('Ingresa f(x,y)');return;}
  if([x1,x2,y1,y2].some(isNaN)){res.innerHTML=errBox('Ingresa la región de búsqueda');return;}
  let html=resBox('Alcance','Búsqueda numérica en la ventana: candidatos verificados, sin garantizar que sean todos.');
  try{
    const pts=criticalPoints2D(fxy,x1,x2,y1,y2);
    html+=pts.length
      ? `<div class="calc-res-box"><div class="calc-res-label">Puntos críticos</div><div class="calc-res-hint">${pts.map(p=>`(${fN(p.x,4)}, ${fN(p.y,4)}) — ${p.type} (D=${fN(p.D,4)})`).join('<br>')}</div></div>`
      : resBox('Puntos críticos','No se hallaron en la región','');
  }catch(e){ html+=errBox(e.message); }
  if(g&&!isNaN(c)){
    try{
      const sols=lagrangeMultipliers(fxy,g,c,x1,x2,y1,y2);
      html+=`<div class="calc-res-box"><div class="calc-res-label">Lagrange ∇f=λ∇g, g=${c}</div><div class="calc-res-hint">${sols.length?sols.map(s=>`(${fN(s.x,4)}, ${fN(s.y,4)}) — λ=${fN(s.lambda,4)}`).join('<br>'):'Sin soluciones'}</div></div>`;
    }catch(e){ html+=errBox('Lagrange: '+e.message); }
  }
  res.innerHTML=html;
}

export function calcMvIntegral(){
  const res=document.getElementById('res-mvint');
  let html='';
  // Doble polar
  const fp=v('mvint-pf');
  const pr1=pf('mvint-pr1'), pr2=pf('mvint-pr2'), pt1=pf('mvint-pt1'), pt2=pf('mvint-pt2');
  if(fp&&![pr1,pr2,pt1,pt2].some(isNaN)){
    try{
      html+=resBox('∬ f dA (polar)', formatResult(doubleIntegralPolar(fp,pr1,pr2,pt1,pt2),8),
        `r∈[${pr1},${pr2}], θ∈[${pt1},${pt2}]`, true);
    }catch(e){ html+=errBox('Polar: '+e.message); }
  }
  // Triple
  const ft=v('mvint-tf');
  const tx1=pf('mvint-tx1'),tx2=pf('mvint-tx2'),ty1=pf('mvint-ty1'),ty2=pf('mvint-ty2'),tz1=pf('mvint-tz1'),tz2=pf('mvint-tz2');
  if(ft&&![tx1,tx2,ty1,ty2,tz1,tz2].some(isNaN)){
    try{
      html+=resBox('∭ f dV (triple)', formatResult(tripleIntegral(ft,tx1,tx2,ty1,ty2,tz1,tz2),8),
        `caja [${tx1},${tx2}]×[${ty1},${ty2}]×[${tz1},${tz2}]`, true);
    }catch(e){ html+=errBox('Triple: '+e.message); }
  }
  // Jacobiano
  const jx=v('mvint-jx'), jy=v('mvint-jy'), ju=pf('mvint-ju'), jv=pf('mvint-jv');
  if(jx&&jy&&!isNaN(ju)&&!isNaN(jv)){
    try{
      html+=resBox('Jacobiano ∂(x,y)/∂(u,v)', formatResult(jacobian2D(jx,jy,ju,jv),8),
        `en (u,v)=(${ju},${jv})`, true);
    }catch(e){ html+=errBox('Jacobiano: '+e.message); }
  }
  // Centro de masa
  const cf=v('mvint-cf');
  const cx1=pf('mvint-cx1'),cx2=pf('mvint-cx2'),cy1=pf('mvint-cy1'),cy2=pf('mvint-cy2');
  if(cf&&![cx1,cx2,cy1,cy2].some(isNaN)){
    try{
      const c=centerOfMass2D(cf,cx1,cx2,cy1,cy2);
      html+=resBox('Centro de masa (x̄,ȳ)', `(${fN(c.x,4)}, ${fN(c.y,4)})`, `masa = ${fN(c.mass,6)}`, true);
    }catch(e){ html+=errBox('Centro de masa: '+e.message); }
  }
  if(!html) html=errBox('Completa una de las integrales');
  res.innerHTML=html;
}
