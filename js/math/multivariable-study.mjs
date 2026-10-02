import { tokenize, parseExpr } from './calculus/parser.mjs';
import { diffAST } from './calculus/derivatives.mjs';
import { simplify } from './calculus/ast.mjs';
import { astToStr } from './calculus/printer.mjs';
import { calcParse, collectVariables } from './expression.mjs';
import { simpsonIntegral } from './calculus/numeric.mjs';
import { integrateVariableRegion } from './study-calculus.mjs';
const finite=(x,label='Resultado')=>{if(!Number.isFinite(x))throw new RangeError(`${label}: fuera de dominio o rango numérico`);return x;};
const ast=(source,variables)=>{
  if(typeof source!=='string'||!source.trim()||source.length>400||collectVariables(source).some(v=>!variables.includes(v)))throw new RangeError(`Usa solo ${variables.join(', ')} (máx. 400 caracteres)`);
  return parseExpr(tokenize(source));
};
const derivative=(node,v)=>simplify(diffAST(node,v));
function evaluator(node,variables){
  const text=typeof node==='string'?node:astToStr(node),primary=variables[0],fn=calcParse(text,primary);
  if(!fn)throw new RangeError('Expresión no evaluable');
  const order=[primary,...collectVariables(text).filter(v=>v!==primary)];
  return point=>finite(fn(...order.map(v=>point[variables.indexOf(v)])));
}
function validPoint(point,n){if(!Array.isArray(point)||point.length!==n||point.some(x=>!Number.isFinite(x)))throw new RangeError('Punto de dimensión incompatible');}
export function differentialStudy(expression,variables,point,direction=null){
  if(!Array.isArray(variables)||variables.length<1||variables.length>3||new Set(variables).size!==variables.length||variables.some(v=>!['x','y','z','t','u','v'].includes(v)))throw new RangeError('Entre una y tres variables distintas de x,y,z,t,u,v');
  validPoint(point,variables.length);const node=ast(expression,variables),value=evaluator(node,variables)(point);
  const partials=variables.map(v=>derivative(node,v)),gradient=partials.map(p=>evaluator(p,variables)(point));
  const hessianFormulas=partials.map(p=>variables.map(v=>astToStr(derivative(p,v))));
  const hessian=hessianFormulas.map(row=>row.map(p=>evaluator(p,variables)(point)));
  const maximumRate=Math.hypot(...gradient),result={value,partials:partials.map(astToStr),gradient,hessianFormulas,hessian,maximumRate,
    maximumDirection:maximumRate?gradient.map(v=>v/maximumRate):null,formula:'Dᵤf = ∇f·u, ||u||=1; máximo = ||∇f||.',
    assumption:'Derivadas simbólicas evaluadas en un punto del dominio; las condiciones de diferenciabilidad deben valer en un entorno.'};
  if(direction!==null){validPoint(direction,variables.length);const norm=Math.hypot(...direction);if(!norm)throw new RangeError('La dirección no puede ser cero');result.unitDirection=direction.map(v=>v/norm);result.directionalDerivative=gradient.reduce((s,v,i)=>s+v*result.unitDirection[i],0);}
  return result;
}
export function implicitSurfaceStudy(expression,point){
  const r=differentialStudy(expression,['x','y','z'],point),scale=Math.max(1,...point.map(Math.abs));
  if(Math.abs(r.value)>1e-8*scale)throw new RangeError('El punto no pertenece a F(x,y,z)=0');
  if(!r.maximumRate)throw new RangeError('Gradiente nulo: plano tangente regular no determinado');
  const [a,b,c]=r.gradient,[x,y,z]=point;
  return {point,normal:r.gradient,plane:`${a}(x−(${x})) + ${b}(y−(${y})) + ${c}(z−(${z})) = 0`,
    dzdx:c!==0?-a/c:null,dzdy:c!==0?-b/c:null,residual:r.value,
    formula:'F=0, ∇F≠0; ∇F(P)·(X−P)=0. zₓ=−Fₓ/Fz y zᵧ=−Fᵧ/Fz solo si Fz≠0.'};
}
export function chainRuleStudy(expression,maps,parameters,point){
  if(!Array.isArray(maps)||maps.length<1||maps.length>3||!Array.isArray(parameters)||parameters.length<1||parameters.length>2||new Set(parameters).size!==parameters.length)throw new RangeError('Mapas/variables incompatibles');
  validPoint(point,parameters.length);const coordinates=['x','y','z'].slice(0,maps.length),nodes=maps.map(m=>ast(m,parameters));
  const position=nodes.map(m=>evaluator(m,parameters)(point)),outer=differentialStudy(expression,coordinates,position);
  const jacobianFormulas=nodes.map(m=>parameters.map(v=>astToStr(derivative(m,v))));
  const jacobian=jacobianFormulas.map(row=>row.map(m=>evaluator(m,parameters)(point)));
  const derivatives=parameters.map((_,j)=>outer.gradient.reduce((s,v,i)=>s+v*jacobian[i][j],0));
  return {position,value:outer.value,outerPartials:outer.partials,outerGradient:outer.gradient,jacobianFormulas,jacobian,derivatives,
    formula:'∂w/∂uⱼ = Σᵢ (∂w/∂xᵢ)(∂xᵢ/∂uⱼ). Se evalúan ambos factores en sus puntos correspondientes.'};
}
export function jacobianStudy(maps,point){
  if(!Array.isArray(maps)||maps.length!==2)throw new RangeError('Dos funciones x(u,v), y(u,v)');validPoint(point,2);
  const nodes=maps.map(m=>ast(m,['u','v']));nodes.forEach(m=>evaluator(m,['u','v'])(point));
  const formulas=nodes.map(m=>['u','v'].map(v=>astToStr(derivative(m,v)))),matrix=formulas.map(row=>row.map(m=>evaluator(m,['u','v'])(point)));
  const determinant=finite(matrix[0][0]*matrix[1][1]-matrix[0][1]*matrix[1][0]);
  const expression=astToStr(simplify({type:'-',left:{type:'*',left:derivative(nodes[0],'u'),right:derivative(nodes[1],'v')},right:{type:'*',left:derivative(nodes[0],'v'),right:derivative(nodes[1],'u')}}));
  return {formulas,matrix,expression,determinant,absoluteJacobian:Math.abs(determinant),formula:'J=xᵤyᵥ−xᵥyᵤ; para áreas se usa |J| en una transformación inyectiva salvo fronteras.'};
}
export function curveStudy(expressions,time,start,end,n=200){
  if(!Array.isArray(expressions)||expressions.length!==3||![time,start,end].every(Number.isFinite)||start>=end||!Number.isInteger(n)||n<4||n>1000||n%2)throw new RangeError('Curva 3D, intervalo y malla par (4–1000)');
  const nodes=expressions.map(e=>ast(e,['t'])),first=nodes.map(e=>derivative(e,'t')),second=first.map(e=>derivative(e,'t'));
  const functions=nodes.map(e=>evaluator(e,['t'])),velocities=first.map(e=>evaluator(e,['t']));
  const speed=t=>{functions.forEach(f=>f([t]));return Math.hypot(...velocities.map(f=>f([t])));};
  const length=simpsonIntegral(speed,start,end,n),refined=simpsonIntegral(speed,start,end,2*n);
  return {position:functions.map(f=>f([time])),velocityFormulas:first.map(astToStr),accelerationFormulas:second.map(astToStr),
    velocity:velocities.map(f=>f([time])),acceleration:second.map(e=>evaluator(e,['t'])([time])),length,refined,refinementDifference:Math.abs(length-refined),
    formula:'v=r′(t), a=r″(t), L=∫||r′(t)||dt. Simpson; diferencia entre mallas no es cota.'};
}
export function planeFromPointNormal(point,normal){
  validPoint(point,3);validPoint(normal,3);if(!Math.hypot(...normal))throw new RangeError('Normal no nula requerida');
  const constant=finite(normal.reduce((s,v,i)=>s+v*point[i],0));
  return {point,normal,constant,equation:`(${normal[0]})x + (${normal[1]})y + (${normal[2]})z = ${constant}`,formula:'n·(X−P)=0; n·X=n·P.'};
}
export function lineStudy(fieldExpressions,curves,start,end,type='scalar',n=200){
  if(!Array.isArray(fieldExpressions)||!Array.isArray(curves)||curves.length!==3||!['scalar','vector'].includes(type)||fieldExpressions.length!==(type==='scalar'?1:3)||![start,end].every(Number.isFinite)||start>=end||!Number.isInteger(n)||n<4||n>1000||n%2)throw new RangeError('Campo, curva, tipo o malla inválidos');
  const paths=curves.map(e=>ast(e,['t'])),first=paths.map(e=>derivative(e,'t')),r=paths.map(e=>evaluator(e,['t'])),v=first.map(e=>evaluator(e,['t'])),field=fieldExpressions.map(e=>evaluator(ast(e,['x','y','z']),['x','y','z']));
  const integrand=t=>{const point=r.map(f=>f([t])),velocity=v.map(f=>f([t]));return type==='scalar'?field[0](point)*Math.hypot(...velocity):finite(field.reduce((s,f,i)=>s+f(point)*velocity[i],0));};
  const value=simpsonIntegral(integrand,start,end,n),refined=simpsonIntegral(integrand,start,end,2*n);
  return {value,refined,refinementDifference:Math.abs(value-refined),velocityFormulas:first.map(astToStr),
    formula:type==='scalar'?'∫C f ds = ∫f(r(t)) ||r′(t)|| dt':'∫C F·dr = ∫F(r(t))·r′(t)dt; invertir el recorrido cambia el signo.',
    assumption:'Curva paramétrica regular por tramos; Simpson con derivadas simbólicas, diferencia entre mallas no es cota.'};
}
// Polynomial coefficient identities provide global checks, unlike a derivative
// equality at a sampled point. Degrees and term counts bound computation.
const key=(i,j)=>`${i},${j}`;
const clean=p=>new Map([...p].filter(([,v])=>v!==0));
const add=(a,b,scale=1)=>{const r=new Map(a);for(const [k,v] of b)r.set(k,(r.get(k)||0)+scale*v);return clean(r);};
const multiply=(a,b)=>{const r=new Map();for(const [k,v] of a)for(const [l,w] of b){const [i,j]=k.split(',').map(Number),[u,t]=l.split(',').map(Number);if(i+j+u+t>8)throw new RangeError('Grado polinómico máximo 8');const m=key(i+u,j+t);r.set(m,finite((r.get(m)||0)+v*w));}if(r.size>100)throw new RangeError('Demasiados monomios');return clean(r);};
function polynomial(node){
  if(node.type==='num')return new Map([[key(0,0),node.val]]);
  if(node.type==='var'&&['x','y'].includes(node.val))return new Map([[node.val==='x'?key(1,0):key(0,1),1]]);
  if(node.type==='neg')return new Map([...polynomial(node.arg)].map(([k,v])=>[k,-v]));
  if(['+','-','*'].includes(node.type)){const a=polynomial(node.left),b=polynomial(node.right);return node.type==='*'?multiply(a,b):add(a,b,node.type==='-'?-1:1);}
  if(node.type==='/'&&node.right.type==='num'&&node.right.val!==0)return new Map([...polynomial(node.left)].map(([k,v])=>[k,v/node.right.val]));
  if(node.type==='^'&&node.right.type==='num'&&Number.isInteger(node.right.val)&&node.right.val>=0&&node.right.val<=8){let p=new Map([[key(0,0),1]]);for(let i=0;i<node.right.val;i++)p=multiply(p,polynomial(node.left));return p;}
  throw new RangeError('Se requiere un polinomio en x,y de grado ≤8');
}
const polyDerivative=(p,axis)=>clean(new Map([...p].filter(([k])=>k.split(',').map(Number)[axis]>0).map(([k,c])=>{const e=k.split(',').map(Number),n=e[axis]--;return [key(...e),n*c];})));
const polyText=p=>[...p].map(([k,c])=>{const [i,j]=k.split(',').map(Number);return `(${c})${i?`*x^${i}`:''}${j?`*y^${j}`:''}`;}).join('+')||'0';
const polyValue=(p,x,y)=>finite([...p].reduce((s,[k,c])=>{const [i,j]=k.split(',').map(Number);return s+c*x**i*y**j;},0));
export function polynomialPotentialStudy(P,Q,from,to){
  validPoint(from,2);validPoint(to,2);const p=polynomial(ast(P,['x','y'])),q=polynomial(ast(Q,['x','y']));
  const curl=add(polyDerivative(q,0),polyDerivative(p,1),-1);
  if(curl.size)return {conservative:false,curl:polyText(curl),proof:'Qₓ−Pᵧ no es el polinomio cero: no hay potencial global en ℝ².'};
  let phi=new Map([...p].map(([k,c])=>{const [i,j]=k.split(',').map(Number);return [key(i+1,j),c/(i+1)];}));
  const residual=add(q,polyDerivative(phi,1),-1);
  for(const [k,c] of residual){const [i,j]=k.split(',').map(Number);if(i!==0)throw new RangeError('No se verificó el potencial por coeficientes');phi=add(phi,new Map([[key(0,j+1),c/(j+1)]]));}
  return {conservative:true,potential:polyText(phi),value:polyValue(phi,...to)-polyValue(phi,...from),curl:'0',
    proof:'Identidad de coeficientes Qₓ=Pᵧ; campo polinómico C¹ en ℝ², simplemente conexo. ∇Φ=(P,Q); integral=Φ(final)−Φ(inicial).'};
}
export function polynomialCriticalStudy(expression){
  const p=polynomial(ast(expression,['x','y'])),c=(i,j)=>p.get(key(i,j))||0;let points,proof;
  if([...p.keys()].every(k=>k.split(',').map(Number).reduce((s,v)=>s+v,0)<=2)){
    const a=2*c(2,0),b=c(1,1),d=2*c(0,2),det=a*d-b*b;
    if(det===0)throw new RangeError('Hessiano singular: puntos no aislados o familia no soportada');
    points=[[(b*c(0,1)-d*c(1,0))/det,(b*c(1,0)-a*c(0,1))/det]];
    proof='Gradiente lineal: resolver H·(x,y)=−(c₁₀,c₀₁). det H≠0 garantiza el único punto crítico.';
  }else{
    const allowed=new Set([key(0,0),key(3,0),key(0,3),key(1,1)]),a=c(3,0),b=-c(1,1)/3;
    if(!a||c(0,3)!==a||[...p.keys()].some(k=>!allowed.has(k)))throw new RangeError('Críticos: cuadráticas no degeneradas o a(x³+y³)−3bxy+C');
    points=b?[[0,0],[b/a,b/a]]:[[0,0]];
    proof='x²=(b/a)y, y²=(b/a)x. Eliminación: x[x³−(b/a)³]=0; las únicas soluciones reales son (0,0) y (b/a,b/a), sin duplicar si b=0.';
  }
  const fx=polyDerivative(p,0),fy=polyDerivative(p,1),fxx=polyDerivative(fx,0),fxy=polyDerivative(fx,1),fyy=polyDerivative(fy,1);
  return {points:points.map(([x,y])=>{const A=polyValue(fxx,x,y),B=polyValue(fxy,x,y),D=polyValue(fyy,x,y),det=A*D-B*B;return {point:[x,y],value:polyValue(p,x,y),hessian:[[A,B],[B,D]],determinant:det,type:det<0?'silla':det>0?A>0?'mínimo':'máximo':'inconcluso'};}),proof};
}
export function constrainedQuadraticStudy(objective,constraint,constant){
  finite(constant);const p=polynomial(ast(objective,['x','y'])),g=polynomial(ast(constraint,['x','y'])),c=(poly,i,j)=>poly.get(key(i,j))||0;
  if([...p.keys()].some(k=>k.split(',').map(Number).reduce((s,v)=>s+v,0)>2))throw new RangeError('Objetivo de grado ≤2');
  if([...g.keys()].every(k=>k.split(',').map(Number).reduce((s,v)=>s+v,0)<=1)){
    const a=c(g,1,0),b=c(g,0,1),d=constant-c(g,0,0),norm=a*a+b*b;if(!norm)throw new RangeError('Restricción constante sin recta regular');
    const origin=[a*d/norm,b*d/norm],direction=[-b,a];
    const H=[[2*c(p,2,0),c(p,1,1)],[c(p,1,1),2*c(p,0,2)]],gradient=[H[0][0]*origin[0]+H[0][1]*origin[1]+c(p,1,0),H[1][0]*origin[0]+H[1][1]*origin[1]+c(p,0,1)];
    const quadratic=direction.reduce((s,v,i)=>s+v*H[i].reduce((t,w,j)=>t+w*direction[j],0),0)/2,linear=gradient.reduce((s,v,i)=>s+v*direction[i],0);
    if(quadratic===0)throw new RangeError('Objetivo constante o lineal sobre la recta: no hay extremo aislado');
    const t=-linear/(2*quadratic),point=origin.map((v,i)=>finite(v+t*direction[i])),fx=polyValue(polyDerivative(p,0),...point),fy=polyValue(polyDerivative(p,1),...point),lambda=(fx*a+fy*b)/norm;
    return {points:[{point,value:polyValue(p,...point),lambda,type:quadratic>0?'mínimo global':'máximo global'}],otherExtreme:'No existe: el objetivo es no acotado en el otro sentido.',proof:`Parametrizar la recta X=X₀+t(−b,a). f(t)=At²+Bt+C; A=${quadratic}, B=${linear}. t*=−B/(2A); ∇f=λ∇g.`};
  }
  const allowed=new Set([key(0,0),key(2,0),key(0,2)]);
  if([...g.keys()].some(k=>!allowed.has(k))||c(g,2,0)!==1||c(g,0,2)!==1||[...p.keys()].some(k=>!allowed.has(k)))throw new RangeError('Restricción admitida: recta o x²+y²=R² con objetivo diagonal');
  const radiusSquared=constant-c(g,0,0);if(radiusSquared<=0)throw new RangeError('Radio cuadrado positivo requerido');
  const a=c(p,2,0),b=c(p,0,2),R=Math.sqrt(radiusSquared);
  if(a===b)return {value:c(p,0,0)+a*radiusSquared,allPoints:true,proof:'Objetivo constante sobre toda la circunferencia; cada punto es máximo y mínimo.'};
  return {points:[[R,0],[-R,0],[0,R],[0,-R]].map(point=>{const coefficient=point[0]===0?b:a;return {point,value:polyValue(p,...point),lambda:coefficient,type:coefficient===Math.min(a,b)?'mínimo global':'máximo global'};}),proof:'∇f=λ∇g ⇒ (a−λ)x=(b−λ)y=0. Evaluar ambos pares sobre la circunferencia compacta; conservar empates.'};
}
export function greenRegionStudy(P,Q,a,b,lower,upper,n=120,coordinates='cartesian',orientation='positive'){
  if(!['cartesian','polar'].includes(coordinates)||!['positive','negative'].includes(orientation))throw new RangeError('Coordenadas u orientación inválida');
  const p=polynomial(ast(P,['x','y'])),q=polynomial(ast(Q,['x','y'])),curl=add(polyDerivative(q,0),polyDerivative(p,1),-1),sign=orientation==='positive'?1:-1;
  const integrand=coordinates==='cartesian'?(x,y)=>sign*polyValue(curl,x,y):(theta,r)=>sign*polyValue(curl,r*Math.cos(theta),r*Math.sin(theta))*r;
  const result=integrateVariableRegion(integrand,a,b,lower,upper,n,n),coarse=integrateVariableRegion(integrand,a,b,lower,upper,n/2,n/2);
  return {...result,coarse:coarse.value,refinementDifference:Math.abs(result.value-coarse.value),curl:polyText(curl),orientation:sign===1?'antihoraria':'horaria',
    formula:'∮P dx+Q dy = ∬(Qₓ−Pᵧ)dA, orientación positiva antihoraria.',assumption:'Campo polinómico C¹; región con borde cerrado simple descrito por límites. El usuario debe asegurar que no hay recubrimiento múltiple; valor numérico, no prueba por muestreo.'};
}
export function polynomialRadialLimit(expression){
  const node=ast(expression,['x','y']);
  if(node.type!=='/')throw new RangeError('Cociente polinómico radial requerido');
  const numerator=polynomial(node.left),denominator=polynomial(node.right),A=denominator.get(key(2,0))||0,B=denominator.get(key(0,2))||0;
  if(A<=0||B<=0||[...denominator.keys()].some(k=>![key(2,0),key(0,2)].includes(k)))throw new RangeError('Denominador Ax²+By², A,B>0');
  const degrees=[...numerator.keys()].map(k=>k.split(',').map(Number).reduce((s,v)=>s+v,0)),degree=Math.min(...degrees);
  if(degree<=2)throw new RangeError('Numerador de grado mínimo >2 requerido para esta cota');
  const coefficient=[...numerator.values()].reduce((s,v)=>s+Math.abs(v),0)/Math.min(A,B),power=numerator.size?degree-2:1;
  return {value:0,coefficient,power,proof:`r=√(x²+y²). Para 0<r≤1: |f|≤${coefficient} r^${power}. Dado ε>0, δ=min(1,(ε/${coefficient||1})^(1/${power})). Todas las trayectorias cumplen la cota; por encaje el límite es 0.`};
}

export function stokesDiskStudy(field,radius,n=200,orientation='positive'){
 if(!Array.isArray(field)||field.length!==3||!Number.isFinite(radius)||radius<=0||!['positive','negative'].includes(orientation))throw new RangeError('Campo de tres polinomios, R>0 y orientación positiva/negativa.');
 const polynomialOnly=node=>{
  if(node.type==='num'||node.type==='var')return true;if(node.type==='neg')return polynomialOnly(node.arg);
  if(['+','-','*'].includes(node.type))return polynomialOnly(node.left)&&polynomialOnly(node.right);
  if(node.type==='/')return polynomialOnly(node.left)&&node.right.type==='num'&&node.right.val!==0;
  if(node.type==='^')return polynomialOnly(node.left)&&node.right.type==='num'&&Number.isInteger(node.right.val)&&node.right.val>=0&&node.right.val<=8;
  return false;
 };
 const nodes=field.map(source=>ast(source,['x','y','z']));if(nodes.some(node=>!polynomialOnly(node)))throw new RangeError('Stokes certificado admite campos polinómicos; otros dominios/regularidad no se han demostrado.');
 const atPlane=node=>node.type==='var'&&node.val==='z'?{type:'num',val:0}:node.arg?{...node,arg:atPlane(node.arg)}:node.left?{...node,left:atPlane(node.left),right:atPlane(node.right)}:node;
 const [P,Q]=nodes.slice(0,2).map(node=>astToStr(simplify(atPlane(node)))),surface=greenRegionStudy(P,Q,0,2*Math.PI,()=>0,()=>radius,n,'polar',orientation);
 const maps=[`${radius}*cos(t)`,`${orientation==='positive'?radius:-radius}*sin(t)`,'0'],line=lineStudy(field,maps,0,2*Math.PI,'vector',n);
 return {value:surface.value,lineIntegral:line.value,refinementDifference:surface.refinementDifference,lineRefinementDifference:line.refinementDifference,agreementDifference:Math.abs(surface.value-line.value),curlNormal:surface.curl,
  orientation:orientation==='positive'?'normal +k; borde antihorario visto desde +z':'normal −k; borde horario visto desde +z',
  formula:'∮∂S F·dr = ∬S (∇×F)·n dS; disco z=0, x²+y²≤R²; dS=r dr dθ.',
  assumption:'Campo polinómico C¹ en ℝ³, disco regular orientable y borde circular suave. Los dos valores se integran numéricamente; diferencia no es certificado de cuadratura.'};
}
