import { calcParse, collectVariables } from './expression.mjs';
import { matGauss } from './algebra/matrix.mjs';

function finite(value,label) {if(!Number.isFinite(value)) throw new RangeError(`${label}: valor finito requerido`);return value;}
function interval(a,b) {finite(a,'Límite inferior');finite(b,'Límite superior');if(!(a<b)) throw new RangeError('Los límites deben cumplir a < b');}
function count(n) {if(!Number.isInteger(n)||n<4||n>1000) throw new RangeError('Usa de 4 a 1000 subintervalos');}
function safe(value,label) {if(!Number.isFinite(value)) throw new RangeError(`${label}: la función sale del dominio`);return value;}

export function piecewiseContinuity(segments,cuts) {
  if(!Array.isArray(segments)||segments.length<2||segments.length>5||!Array.isArray(cuts)||cuts.length!==segments.length-1||
    cuts.some(value=>!Number.isFinite(value))||cuts.some((value,i)=>i&&value<=cuts[i-1])) throw new RangeError('Tramos o puntos de unión inválidos');
  const names=[...new Set(segments.flatMap(expr=>collectVariables(expr).filter(name=>name!=='x')))].sort();
  if(!names.length||names.length>4) throw new RangeError('Usa entre 1 y 4 parámetros desconocidos');
  const parsed=segments.map(expr=>{
    const vars=collectVariables(expr).filter(name=>name!=='x'),fn=calcParse(expr,'x');
    if(!fn) throw new RangeError(`Expresión no reconocida: ${expr}`);
    return {fn,vars};
  });
  const evaluate=(index,x,values)=>safe(parsed[index].fn(x,...parsed[index].vars.map(name=>values[name]??0)),`Tramo ${index+1}`);
  const zero=Object.fromEntries(names.map(name=>[name,0]));
  const equations=cuts.map((cut,i)=>{
    const baseline=evaluate(i,cut,zero)-evaluate(i+1,cut,zero);
    const coefficients=names.map(name=>{
      const assignment={...zero,[name]:1};
      return evaluate(i,cut,assignment)-evaluate(i+1,cut,assignment)-baseline;
    });
    return {cut,coefficients,right:-baseline};
  });
  for(const [i,equation] of equations.entries()) {
    const all=Object.fromEntries(names.map(name=>[name,2]));
    const actual=evaluate(i,equation.cut,all)-evaluate(i+1,equation.cut,all);
    const expected=-equation.right+2*equation.coefficients.reduce((a,b)=>a+b,0);
    if(Math.abs(actual-expected)>1e-8*Math.max(1,Math.abs(actual),Math.abs(expected))) throw new RangeError('Los parámetros no aparecen linealmente en los puntos de unión');
  }
  const result=matGauss(equations.map(row=>row.coefficients),equations.map(row=>row.right));
  const values=result.particular===null?null:Object.fromEntries(names.map((name,i)=>[name,result.particular[i]]));
  const checks=values===null?[]:cuts.map((cut,i)=>({cut,left:evaluate(i,cut,values),right:evaluate(i+1,cut,values)}));
  return {parameters:names,status:result.status,values,freeParameters:result.free.map(i=>names[i]),nullspace:result.nullspace,equations,checks,
    assumption:'continuidad requiere que los límites laterales coincidan en cada unión'};
}

function derivative(fn,x,h) {return safe((fn(x+h)-fn(x-h))/(2*h),'Derivada');}
function secondDerivative(fn,x,h) {return safe((fn(x+h)-2*fn(x)+fn(x-h))/h**2,'Segunda derivada');}
export function parametricDerivatives(xFunction,yFunction,time,step=1e-4) {
  finite(time,'Parámetro');if(typeof xFunction!=='function'||typeof yFunction!=='function'||!Number.isFinite(step)||step<=0) throw new RangeError('Curva o paso inválidos');
  const x=safe(xFunction(time),'x(t)'),y=safe(yFunction(time),'y(t)');
  const dx=derivative(xFunction,time,step),dy=derivative(yFunction,time,step);
  if(Math.abs(dx)<1e-10) throw new RangeError('Tangente vertical: dx/dt≈0; dy/dx no es finita');
  const ddx=secondDerivative(xFunction,time,step),ddy=secondDerivative(yFunction,time,step);
  return {x,y,dxdt:dx,dydt:dy,d2xdt2:ddx,d2ydt2:ddy,dydx:dy/dx,d2ydx2:(dx*ddy-dy*ddx)/dx**3,
    step,assumption:'derivadas centradas numéricas; reduce h para comprobar estabilidad'};
}

export function implicitSlope(functionXY,x,y,step=1e-5) {
  finite(x,'x');finite(y,'y');if(typeof functionXY!=='function'||!Number.isFinite(step)||step<=0) throw new RangeError('Función o paso inválidos');
  const residual=safe(functionXY(x,y),'F(x,y)'),fx=(functionXY(x+step,y)-functionXY(x-step,y))/(2*step),
    fy=(functionXY(x,y+step)-functionXY(x,y-step))/(2*step);
  if(!Number.isFinite(fx)||!Number.isFinite(fy)||Math.abs(fy)<1e-12) throw new RangeError('Fy≈0 o derivada fuera de dominio');
  return {residual,fx,fy,slope:-fx/fy,step,assumption:'F(x,y)=0; pendiente local = −Fx/Fy; derivadas aproximadas'};
}

function simpson(fn,a,b,n) {
  interval(a,b);count(n);if(n%2) throw new RangeError('Simpson requiere n par');
  const h=(b-a)/n;
  let sum=safe(fn(a),'Extremo izquierdo')+safe(fn(b),'Extremo derecho');
  for(let i=1;i<n;i++) sum+=(i%2?4:2)*safe(fn(a+i*h),`Punto ${i}`);
  return sum*h/3;
}
export function polarAreaBetween(outerRadius,innerRadius,start,end,subintervals=400) {
  if(typeof outerRadius!=='function'||typeof innerRadius!=='function') throw new RangeError('Radios funcionales requeridos');
  const integrand=theta=>{
    const outer=safe(outerRadius(theta),'Radio exterior'),inner=safe(innerRadius(theta),'Radio interior');
    if(inner<0||outer<inner) throw new RangeError('Se requiere 0 ≤ radio interior ≤ radio exterior en todo el intervalo');
    return 0.5*(outer**2-inner**2);
  };
  const area=simpson(integrand,start,end,subintervals);
  return {area,subintervals,formula:'A = ½∫(r exterior²−r interior²)dθ',assumption:'radios no negativos y ordenados en todo el intervalo muestreado'};
}
export function curveArcLength(functionY,start,end,subintervals=400) {
  if(typeof functionY!=='function') throw new RangeError('Función requerida');
  const h=(end-start)/(subintervals*10);
  const slope=x=>x<=start+h?(functionY(x+h)-functionY(x))/h:x>=end-h?(functionY(x)-functionY(x-h))/h:derivative(functionY,x,h);
  const length=simpson(x=>Math.hypot(1,safe(slope(x),'Pendiente')),start,end,subintervals);
  return {length,subintervals,formula:'L = ∫√(1+f′(x)²) dx',assumption:'derivada por diferencia finita; verificar refinamiento cerca de singularidades'};
}
export function surfaceOfRevolution(functionY,start,end,axis='x',subintervals=400) {
  if(typeof functionY!=='function'||!['x','y'].includes(axis)) throw new RangeError('Función o eje inválido');
  const h=(end-start)/(subintervals*10);
  const slope=x=>x<=start+h?(functionY(x+h)-functionY(x))/h:x>=end-h?(functionY(x)-functionY(x-h))/h:derivative(functionY,x,h);
  const area=simpson(x=>{
    const radius=axis==='x'?safe(functionY(x),'Radio'):Math.abs(x);
    if(radius<0) throw new RangeError('La función debe estar sobre el eje x');
    return 2*Math.PI*radius*Math.hypot(1,safe(slope(x),'Pendiente'));
  },start,end,subintervals);
  return {area,subintervals,formula:axis==='x'?'S = 2π∫f(x)√(1+f′²)dx':'S = 2π∫|x|√(1+f′²)dx',
    assumption:'superficie sin autointersecciones; cálculo numérico'};
}
export function integrateVariableRegion(integrand,xStart,xEnd,lowerY,upperY,nx=80,ny=80) {
  interval(xStart,xEnd);
  if(typeof integrand!=='function'||typeof lowerY!=='function'||typeof upperY!=='function'||!Number.isInteger(nx)||!Number.isInteger(ny)||nx<2||ny<2||nx>400||ny>400) throw new RangeError('Región o malla inválida');
  const dx=(xEnd-xStart)/nx;let sum=0;
  for(let i=0;i<nx;i++) {
    const x=xStart+(i+0.5)*dx,y0=safe(lowerY(x),'Límite y inferior'),y1=safe(upperY(x),'Límite y superior');
    if(y1<y0) throw new RangeError('Límites y invertidos');
    const dy=(y1-y0)/ny;
    for(let j=0;j<ny;j++) sum+=safe(integrand(x,y0+(j+0.5)*dy),'Integrando')*dx*dy;
  }
  return {value:sum,nx,ny,formula:'∫[xa,xb]∫[yinf(x),ysup(x)] f(x,y) dy dx',assumption:'regla de puntos medios; compara mallas para estimar convergencia'};
}
export function tangentPlane(functionXY,x,y,step=1e-5) {
  finite(x,'x');finite(y,'y');if(typeof functionXY!=='function'||!Number.isFinite(step)||step<=0) throw new RangeError('Función o paso inválidos');
  const z=safe(functionXY(x,y),'f(x,y)'),fx=(functionXY(x+step,y)-functionXY(x-step,y))/(2*step),
    fy=(functionXY(x,y+step)-functionXY(x,y-step))/(2*step);
  if(!Number.isFinite(fx)||!Number.isFinite(fy)) throw new RangeError('Derivada fuera de dominio');
  return {point:[x,y,z],gradient:[fx,fy],normal:[-fx,-fy,1],formula:`z = ${z} + (${fx})(x−${x}) + (${fy})(y−${y})`,
    assumption:'plano tangente local; derivadas numéricas'};
}
export function powerSeriesInterval(center,radius,power) {
  finite(center,'Centro');if(!Number.isFinite(radius)||radius<=0) throw new RangeError('Radio positivo requerido');finite(power,'Exponente p');
  return {radius,openInterval:[center-radius,center+radius],leftEndpoint:{x:center-radius,converges:power>0,absolute:power>1},
    rightEndpoint:{x:center+radius,converges:power>1,absolute:power>1},
    formula:'Σₙ₌₁∞ ((x−c)/R)ⁿ/nᵖ',assumption:'en x=c−R se usa alternancia para p>0; en x=c+R la p-serie exige p>1'};
}
export function telescopingOffset(offset) {
  if(!Number.isInteger(offset)||offset<1||offset>1000) throw new RangeError('Desplazamiento entero de 1 a 1000');
  const harmonic=Array.from({length:offset},(_,i)=>1/(i+1)).reduce((a,b)=>a+b,0);
  return {sum:harmonic/offset,formula:`Σₙ₌₁∞ 1/[n(n+${offset})] = H_${offset}/${offset}`,
    decomposition:`1/[n(n+${offset})] = (1/n−1/(n+${offset}))/${offset}`};
}
