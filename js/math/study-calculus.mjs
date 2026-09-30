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
export function laminaProperties(density,coordinates,outerStart,outerEnd,innerLower,innerUpper,nOuter=80,nInner=80) {
  interval(outerStart,outerEnd);
  if(typeof density!=='function'||typeof innerLower!=='function'||typeof innerUpper!=='function'||
    !['cartesian','polar'].includes(coordinates)||![nOuter,nInner].every(n=>Number.isInteger(n)&&n>=4&&n<=400))
    throw new RangeError('Densidad, coordenadas o malla inválidas (4–400 divisiones por eje)');
  const compute=(outerCount,innerCount)=>{
    const totals=Array(6).fill(0),step=(outerEnd-outerStart)/outerCount;
    for(let i=0;i<outerCount;i++) {
      const outer=outerStart+(i+0.5)*step,lower=safe(innerLower(outer),'Límite interior inferior'),upper=safe(innerUpper(outer),'Límite interior superior');
      if(coordinates==='polar'&&lower<0) throw new RangeError('El radio debe ser no negativo');
      if(upper<lower) throw new RangeError('Límites interiores invertidos');
      const innerStep=(upper-lower)/innerCount;
      for(let j=0;j<innerCount;j++) {
        const inner=lower+(j+0.5)*innerStep;
        const x=coordinates==='polar'?inner*Math.cos(outer):outer;
        const y=coordinates==='polar'?inner*Math.sin(outer):inner;
        const rho=safe(density(x,y),'Densidad');
        if(rho<0) throw new RangeError('La densidad de masa debe ser no negativa');
        const dm=rho*step*innerStep*(coordinates==='polar'?inner:1);
        totals[0]+=dm;totals[1]+=x*dm;totals[2]+=y*dm;
        totals[3]+=y*y*dm;totals[4]+=x*x*dm;totals[5]+=(x*x+y*y)*dm;
      }
    }
    return totals;
  };
  const [mass,firstMomentX,firstMomentY,inertiaX,inertiaY,inertiaZ]=compute(nOuter,nInner);
  if(!(mass>0)) throw new RangeError('Masa nula: el centro de masa no está definido');
  const coarse=compute(Math.max(2,Math.floor(nOuter/2)),Math.max(2,Math.floor(nInner/2)));
  return {mass,centerX:firstMomentX/mass,centerY:firstMomentY/mass,firstMomentX,firstMomentY,
    inertiaX,inertiaY,inertiaZ,coarseMass:coarse[0],massRefinementDifference:Math.abs(mass-coarse[0]),
    inertiaRefinementDifference:Math.abs(inertiaZ-coarse[5]),nx:nOuter,ny:nInner,
    formula:coordinates==='polar'?'dm = ρ(r cosθ,r senθ)·r dr dθ; x̄ = ∫x dm/M; ȳ = ∫y dm/M; Iz = ∫r² dm':
      'dm = ρ(x,y)dy dx; x̄ = ∫x dm/M; ȳ = ∫y dm/M; Iz = ∫(x²+y²)dm',
    assumption:'lámina plana de densidad no negativa; regla de puntos medios; diferencias entre mallas no son cotas de error ni prueban el dominio completo'};
}
export function integrateTripleRegion(integrand,coordinates,outerStart,outerEnd,middleLower,middleUpper,innerLower,innerUpper,subintervals=40) {
  if(typeof integrand!=='function'||![middleLower,middleUpper,innerLower,innerUpper].every(fn=>typeof fn==='function')||
    !['cartesian','cylindrical','spherical'].includes(coordinates)||!Number.isFinite(outerStart)||!Number.isFinite(outerEnd)||outerStart>=outerEnd||
    !Number.isInteger(subintervals)||subintervals<8||subintervals>60||subintervals%4!==0)
    throw new RangeError('Coordenadas, límites o malla inválidos (n múltiplo de 4 entre 8 y 60)');
  const integrate1d=(fn,a,b,n,label)=>{
    if(!Number.isFinite(a)||!Number.isFinite(b)||b<a) throw new RangeError(`${label}: límites inválidos`);
    if(a===b) return 0;
    const h=(b-a)/n;let sum=0;
    for(let i=0;i<=n;i++) {
      const value=fn(a+i*h);
      if(!Number.isFinite(value)) throw new RangeError(`${label}: valor no finito`);
      sum+=(i===0||i===n?1:i%2?4:2)*value;
    }
    return sum*h/3;
  };
  const compute=n=>integrate1d(u=>{
    if(coordinates!=='cartesian'&&u<0) throw new RangeError('Radio negativo');
    const v0=middleLower(u),v1=middleUpper(u);
    return integrate1d(v=>{
      if(coordinates==='spherical'&&(v<0||v>Math.PI+1e-12)) throw new RangeError('Ángulo polar fuera de [0,π]');
      const w0=innerLower(u,v),w1=innerUpper(u,v);
      return integrate1d(w=>{
        let x,y,z,jacobian;
        if(coordinates==='cartesian') {x=u;y=v;z=w;jacobian=1;}
        else if(coordinates==='cylindrical') {x=u*Math.cos(v);y=u*Math.sin(v);z=w;jacobian=u;}
        else {x=u*Math.sin(v)*Math.cos(w);y=u*Math.sin(v)*Math.sin(w);z=u*Math.cos(v);jacobian=u*u*Math.sin(v);}
        return integrand(x,y,z)*jacobian;
      },w0,w1,n,'Límite interior');
    },v0,v1,n,'Límite medio');
  },outerStart,outerEnd,n,'Límite exterior');
  const value=compute(subintervals),coarse=compute(subintervals/2);
  return {value,coarse,refinementDifference:Math.abs(value-coarse),subintervals,
    formula:coordinates==='cartesian'?'∫∫∫ f(x,y,z) dz dy dx':coordinates==='cylindrical'?'∫∫∫ f(r cosθ,r senθ,z)·r dz dθ dr':'∫∫∫ f(ρ senφ cosθ,ρ senφ senθ,ρ cosφ)·ρ² senφ dθ dφ dρ',
    assumption:'Simpson anidado sobre límites variables; la diferencia de mallas no es una cota de error ni verifica todo el dominio'};
}
export function integrateParametricSurface(parameterization,integrand,uStart,uEnd,vStart,vEnd,subintervals=40) {
  if(typeof parameterization!=='function'||typeof integrand!=='function'||
    ![uStart,uEnd,vStart,vEnd].every(Number.isFinite)||uStart>=uEnd||vStart>=vEnd||
    !Number.isInteger(subintervals)||subintervals<8||subintervals>80||subintervals%4!==0)
    throw new RangeError('Superficie, límites o malla inválidos (n múltiplo de 4 entre 8 y 80)');
  const position=(u,v)=>{
    const point=parameterization(u,v);
    if(!Array.isArray(point)||point.length!==3||point.some(value=>!Number.isFinite(value)))
      throw new RangeError('Parametrización fuera de dominio');
    return point;
  };
  const weight=(u,v)=>{
    const h=1e-5*Math.max(1,Math.abs(u),Math.abs(v));
    const plusU=position(u+h,v),minusU=position(u-h,v),plusV=position(u,v+h),minusV=position(u,v-h);
    const pu=plusU.map((item,i)=>(item-minusU[i])/(2*h));
    const pv=plusV.map((item,i)=>(item-minusV[i])/(2*h));
    const cross=[pu[1]*pv[2]-pu[2]*pv[1],pu[2]*pv[0]-pu[0]*pv[2],pu[0]*pv[1]-pu[1]*pv[0]];
    return Math.hypot(...cross);
  };
  const calculate=(n,weighted)=>simpson(u=>simpson(v=>{
    const point=position(u,v),jacobian=weight(u,v);
    const value=weighted?integrand(...point):1;
    return safe(value,'Integrando')*safe(jacobian,'Elemento de área');
  },vStart,vEnd,n),uStart,uEnd,n);
  const value=calculate(subintervals,true),area=calculate(subintervals,false),coarse=calculate(subintervals/2,true);
  return {value,area,coarse,refinementDifference:Math.abs(value-coarse),subintervals,
    formula:'∫∫ f(r(u,v)) · |∂r/∂u × ∂r/∂v| du dv',
    assumption:'derivadas de la parametrización por diferencias centradas; superficie regular salvo singularidades de coordenadas y sin recubrimiento múltiple'};
}
export function integrateParametricFlux(parameterization,vectorField,uStart,uEnd,vStart,vEnd,subintervals=40,orientation='uv') {
  if(typeof parameterization!=='function'||typeof vectorField!=='function'||
    ![uStart,uEnd,vStart,vEnd].every(Number.isFinite)||uStart>=uEnd||vStart>=vEnd||
    !Number.isInteger(subintervals)||subintervals<8||subintervals>80||subintervals%4!==0||
    !['uv','vu'].includes(orientation)) throw new RangeError('Campo, superficie, orientación o malla inválidos');
  const point=(u,v)=>{
    const value=parameterization(u,v);
    if(!Array.isArray(value)||value.length!==3||value.some(component=>!Number.isFinite(component)))
      throw new RangeError('Parametrización fuera de dominio');
    return value;
  };
  const integrand=(u,v)=>{
    const h=1e-5*Math.max(1,Math.abs(u),Math.abs(v));
    const center=point(u,v),plusU=point(u+h,v),minusU=point(u-h,v),plusV=point(u,v+h),minusV=point(u,v-h);
    const du=plusU.map((item,i)=>(item-minusU[i])/(2*h));
    const dv=plusV.map((item,i)=>(item-minusV[i])/(2*h));
    const field=vectorField(...center);
    if(!Array.isArray(field)||field.length!==3||field.some(component=>!Number.isFinite(component)))
      throw new RangeError('Campo vectorial fuera de dominio');
    const normal=[du[1]*dv[2]-du[2]*dv[1],du[2]*dv[0]-du[0]*dv[2],du[0]*dv[1]-du[1]*dv[0]];
    return (orientation==='uv'?1:-1)*field.reduce((sum,item,i)=>sum+item*normal[i],0);
  };
  const calculate=n=>simpson(u=>simpson(v=>integrand(u,v),vStart,vEnd,n),uStart,uEnd,n);
  const flux=calculate(subintervals),coarse=calculate(subintervals/2);
  return {flux,coarse,refinementDifference:Math.abs(flux-coarse),subintervals,
    orientation:orientation==='uv'?'rᵤ×rᵥ':'rᵥ×rᵤ',
    formula:'Φ = ∫∫ F(r(u,v)) · (rᵤ×rᵥ) du dv (signo según orientación)',
    assumption:'superficie paramétrica regular, sin recubrimiento múltiple; derivadas centradas y Simpson anidado; la diferencia entre mallas no es cota de error'};
}
export function linearObjectiveCylinderPlane(radiusSquared,plane,objective) {
  if(!Number.isFinite(radiusSquared)||radiusSquared<=0||!Array.isArray(plane)||plane.length!==4||
    !Array.isArray(objective)||objective.length!==3||[...plane,...objective].some(value=>!Number.isFinite(value))||plane[2]===0)
    throw new RangeError('Usa x²+y²=R² con R²>0, un plano ax+by+cz=d con c≠0 y objetivo px+qy+sz');
  const [a,b,c,d]=plane,[p,q,s]=objective,mu=s/c;
  const projected=[p-mu*a,q-mu*b],norm=Math.hypot(...projected),radius=Math.sqrt(radiusSquared);
  const formula='z=(d−ax−by)/c; f=sd/c+(p−sa/c)x+(q−sb/c)y; x²+y²=R²';
  if(norm===0) return {status:'constante en toda la intersección',value:mu*d,
    formula,assumption:'cilindro circular y plano con c≠0; todos los puntos de la elipse de intersección son extremos'};
  const candidate=sign=>{
    const x=sign*radius*projected[0]/norm,y=sign*radius*projected[1]/norm,z=(d-a*x-b*y)/c;
    const lambda=sign*norm/(2*radius),value=p*x+q*y+s*z;
    return {point:[x,y,z],value,lambda,mu,
      constraintResiduals:[x*x+y*y-radiusSquared,a*x+b*y+c*z-d],
      stationarityResidual:[p-2*lambda*x-mu*a,q-2*lambda*y-mu*b,s-mu*c]};
  };
  return {status:'dos extremos globales',minimum:candidate(-1),maximum:candidate(1),
    formula,assumption:'intersección compacta de cilindro circular y plano con c≠0; λ para x²+y²−R² y μ para ax+by+cz−d'};
}
export function minimumNormOnPlane(normal,constant) {
  if(!Array.isArray(normal)||normal.length!==3||normal.some(value=>!Number.isFinite(value))||
    !Number.isFinite(constant)) throw new RangeError('Introduce normal 3D y constante finitas');
  const normSquared=normal.reduce((sum,value)=>sum+value*value,0);
  if(!Number.isFinite(normSquared)||normSquared===0) throw new RangeError('La normal del plano debe ser no nula');
  const multiplier=2*constant/normSquared,point=normal.map(value=>constant*value/normSquared);
  const value=constant*constant/normSquared;
  if(!Number.isFinite(value)||point.some(item=>!Number.isFinite(item))) throw new RangeError('Resultado fuera del rango numérico');
  return {minimum:{point,value,multiplier,
    constraintResidual:normal.reduce((sum,item,i)=>sum+item*point[i],0)-constant,
    stationarityResidual:point.map((item,i)=>2*item-multiplier*normal[i])},
    maximum:'no existe: el plano no está acotado',
    formula:'minimizar ||x||² sujeto a n·x=d: 2x=λn ⇒ x*=dn/||n||² y fmin=d²/||n||²',
    assumption:'objetivo x²+y²+z² y un plano afín con normal no nula; mínimo global por convexidad estricta'};
}
export function logarithmicRadialHarmonic(scale,x,y) {
  if([scale,x,y].some(value=>!Number.isFinite(value))) throw new RangeError('Coeficiente y punto finitos requeridos');
  const radiusSquared=x*x+y*y;
  if(radiusSquared===0||!Number.isFinite(radiusSquared)) throw new RangeError('El origen queda fuera del dominio de ln r');
  const value=scale*Math.log(Math.sqrt(radiusSquared));
  const gradient=[scale*x/radiusSquared,scale*y/radiusSquared];
  const secondDerivatives=[scale*(radiusSquared-2*x*x)/radiusSquared**2,
    scale*(radiusSquared-2*y*y)/radiusSquared**2];
  const laplacian=secondDerivatives[0]+secondDerivatives[1];
  if([value,...gradient,...secondDerivatives,laplacian].some(item=>!Number.isFinite(item)))
    throw new RangeError('Derivadas fuera del rango numérico');
  return {value,gradient,secondDerivatives,laplacian,
    formula:'u=k ln r, r²=x²+y²; uxx=k(r²−2x²)/r⁴, uyy=k(r²−2y²)/r⁴ ⇒ Δu=0',
    assumption:'dominio ℝ² sin el origen; el origen es singular y no satisface Laplace clásicamente'};
}
export function trilinearPotentialIntegral(coefficient,from,to) {
  if(!Number.isFinite(coefficient)||![from,to].every(point=>Array.isArray(point)&&point.length===3&&point.every(Number.isFinite)))
    throw new RangeError('Coeficiente y dos puntos 3D finitos requeridos');
  const potential=point=>coefficient*point[0]*point[1]*point[2];
  const fromPotential=potential(from),toPotential=potential(to),lineIntegral=toPotential-fromPotential;
  if([fromPotential,toPotential,lineIntegral].some(value=>!Number.isFinite(value))) throw new RangeError('Integral fuera del rango numérico');
  return {fromPotential,toPotential,lineIntegral,curl:[0,0,0],
    formula:'F=(k yz,k xz,k xy)=∇(k xyz); ∫C F·dr=Φ(fin)−Φ(inicio)',
    assumption:'campo definido en todo ℝ³; cualquier curva suave por tramos entre los extremos da el mismo resultado'};
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
