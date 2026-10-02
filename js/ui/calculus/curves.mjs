import { cartesianToPolar, polarArcLength, polarArea, polarSlope } from '../../math/polar.mjs';
import { circle, conicClassify, ellipse, hyperbola, parabola } from '../../math/conics.mjs';
import { errBox, pf, resBox, v } from './results.mjs';
import { fN, formatResult } from '../../utils/format.mjs';
import { parametricArcLength, parametricArea, parametricSlope, parametricSurfaceArea } from '../../math/parametric.mjs';

// ═══════════════════════════════════════════════════════
// CURVAS PARAMÉTRICAS, POLARES Y CÓNICAS
// ═══════════════════════════════════════════════════════
export function calcParametric(){
  const xExpr=v('par-x'), yExpr=v('par-y');
  const op=document.getElementById('par-op')?.value||'slope';
  const res=document.getElementById('res-param');
  if(!xExpr||!yExpr){res.innerHTML=errBox('Ingresa x(t) y y(t)');return;}
  if(op==='slope'){
    const t0=pf('par-t0');
    if(isNaN(t0)){res.innerHTML=errBox('Ingresa t₀');return;}
    try{
      const s=parametricSlope(xExpr,yExpr,t0);
      const slopeStr=!isFinite(s.slope)?(s.slope>0?'+∞ (tangente vertical)':'−∞ (tangente vertical)'):fN(s.slope,6);
      res.innerHTML=
        resBox('dx/dt', formatResult(s.dxdt,6))+
        resBox('dy/dt', formatResult(s.dydt,6))+
        resBox('dy/dx = (dy/dt)/(dx/dt)', slopeStr, '', true);
    }catch(e){res.innerHTML=errBox(e.message);}
    return;
  }
  const a=pf('par-a'), b=pf('par-b');
  if(isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa a y b');return;}
  try{
    let r,label,unit;
    if(op==='arc'){r=parametricArcLength(xExpr,yExpr,a,b);label='Longitud de arco L';unit='u';}
    else if(op==='area'){r=parametricArea(xExpr,yExpr,a,b);label='Área bajo la curva';unit='u²';}
    else {r=parametricSurfaceArea(xExpr,yExpr,a,b);label='Superficie de revolución (eje X)';unit='u²';}
    res.innerHTML=resBox(label, `${formatResult(r,8)} ${unit}`, `[${a}, ${b}]`, true);
  }catch(e){res.innerHTML=errBox(e.message);}
}

export function calcPolar(){
  const op=document.getElementById('polar-op')?.value||'area';
  const res=document.getElementById('res-polar');
  const rExpr=v('polar-r');
  if(op==='convert'){
    const px=pf('polar-x'), py=pf('polar-y');
    if(!isNaN(px)&&!isNaN(py)){
      const {r,theta}=cartesianToPolar(px,py);
      res.innerHTML=resBox(`(x,y)=(${px},${py}) → polar`, `r = ${fN(r,6)},  θ = ${fN(theta,6)} rad`, '', true);
    } else {
      res.innerHTML=resBox('Conversión cartesiana → polar','Ingresa x e y para convertir','');
    }
    return;
  }
  if(!rExpr){res.innerHTML=errBox('Ingresa r(θ) usando t como ángulo');return;}
  if(op==='slope'){
    const theta=pf('polar-t0');
    if(isNaN(theta)){res.innerHTML=errBox('Ingresa θ');return;}
    try{
      const s=polarSlope(rExpr,theta);
      res.innerHTML=
        resBox('r(θ)', formatResult(s.r,6))+
        resBox("r'(θ)", formatResult(s.drdt,6))+
        resBox('dy/dx de la tangente', isFinite(s.slope)?formatResult(s.slope,6):'indefinida', '', true);
    }catch(e){res.innerHTML=errBox(e.message);}
    return;
  }
  const a=pf('polar-a'), b=pf('polar-b');
  if(isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa los límites a y b');return;}
  try{
    const r=op==='area'?polarArea(rExpr,a,b):polarArcLength(rExpr,a,b);
    const label=op==='area'?'Área polar A':'Longitud de arco L';
    const unit=op==='area'?'u²':'u';
    res.innerHTML=resBox(label, `${formatResult(r,8)} ${unit}`, `θ ∈ [${a}, ${b}]`, true);
  }catch(e){res.innerHTML=errBox(e.message);}
}

export function calcConics(){
  const type=document.getElementById('conic-type')?.value||'parabola';
  const res=document.getElementById('res-conic');
  let html='';
  if(type==='classify'){
    const A=pf('conic-A'), B=pf('conic-B'), C=pf('conic-C');
    if([A,B,C].some(isNaN)){res.innerHTML=errBox('Ingresa A, B y C');return;}
    const c=conicClassify(A,B,C);
    const names={circle:'Circunferencia',ellipse:'Elipse',hyperbola:'Hipérbola',parabola:'Parábola'};
    html=resBox('Discriminante B²−4AC', formatResult(c.discriminant,6))+
      resBox('Tipo de cónica', names[c.type]||c.type, '', true);
    res.innerHTML=html; return;
  }
  const h=pf('conic-h'), k=pf('conic-k'), p1=pf('conic-p1'), p2=pf('conic-p2');
  if([h,k,p1].some(isNaN)){res.innerHTML=errBox('Ingresa los parámetros');return;}
  if(type==='parabola'){
    const o=document.getElementById('conic-axis')?.value||'y';
    const c=parabola(h,k,p1,o==='y');
    html=resBox('Vértice', `(${h}, ${k})`)+
      resBox('Foco', `(${c.focus.x}, ${c.focus.y})`)+
      resBox('Directriz', c.directrixY!==null?`y = ${fN(c.directrixY,4)}`:`x = ${fN(c.directrixX,4)}`)+
      resBox('Lado recto', formatResult(c.latusRectum,4), `Abre ${c.opens}`, true);
  } else if(type==='ellipse'){
    const c=ellipse(h,k,p1,p2,true);
    html=resBox('Centro', `(${h}, ${k})`)+
      resBox('Semiejes a, b', `${fN(c.a,4)}, ${fN(c.b,4)}`)+
      resBox('Focos', c.foci.map(f=>`(${f.x}, ${f.y})`).join('  ,  '))+
      resBox('Excentricidad e = c/a', formatResult(c.eccentricity,6), '', true);
  } else if(type==='hyperbola'){
    const c=hyperbola(h,k,p1,p2,true);
    html=resBox('Centro', `(${h}, ${k})`)+
      resBox('Focos', c.foci.map(f=>`(${f.x}, ${f.y})`).join('  ,  '))+
      resBox('Asíntotas', c.asymptotes.map(a=>`y = ${fN(a.slope,4)}x ${a.intercept>=0?'+':'−'} ${fN(Math.abs(a.intercept),4)}`).join('<br>'))+
      resBox('Excentricidad', formatResult(c.eccentricity,6), '', true);
  }
  res.innerHTML=html;
}
