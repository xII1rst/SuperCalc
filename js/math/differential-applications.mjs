import { realPolynomialRoots } from './algebra/polynomial.mjs';
export { realPolynomialRoots } from './algebra/polynomial.mjs';
import { tokenize, parseExpr, calcParse, collectVariables, derivativeDetails } from './calculus.mjs';
const finite=(value,name)=>{if(!Number.isFinite(value))throw new RangeError(`${name}: valor finito requerido`);return value;};
const positive=(value,name)=>{finite(value,name);if(value<=0)throw new RangeError(`${name}: valor positivo requerido`);return value;};
const trim=p=>{p=p.slice();while(p.length>1&&p.at(-1)===0)p.pop();return p;};
const add=(a,b)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)+(b[i]||0)));
const scale=(p,c)=>trim(p.map(x=>x*c));
const subtract=(a,b)=>add(a,scale(b,-1));
const product=(a,b)=>{if(a.length+b.length>15)throw new RangeError('Polinomio fuera del límite de grado.');const p=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>p[i+j]+=x*y));return trim(p);};
const derivative=p=>p.length===1?[0]:trim(p.slice(1).map((c,i)=>c*(i+1)));
const evaluate=(p,x)=>p.reduceRight((sum,c)=>sum*x+c,0);
function polynomial(node) {
  if(node.type==='num')return [finite(node.val,'Coeficiente')];
  if(node.type==='var'&&node.val==='x')return [0,1];
  if(node.type==='neg')return scale(polynomial(node.arg),-1);
  if(['+','-','*'].includes(node.type)){const a=polynomial(node.left),b=polynomial(node.right);return node.type==='+'?add(a,b):node.type==='-'?subtract(a,b):product(a,b);}
  if(node.type==='/'&&node.right.type==='num'&&node.right.val!==0)return scale(polynomial(node.left),1/node.right.val);
  if(node.type==='^'&&node.right.type==='num'&&Number.isInteger(node.right.val)&&node.right.val>=0&&node.right.val<=6) {
    const base=polynomial(node.left);let p=[1];for(let i=0;i<node.right.val;i++)p=product(p,base);return p;
  }
  throw new RangeError('Familia admitida: polinomios en x o un cociente de polinomios.');
}
function sourceAST(expression) {
  if(!expression?.trim()||expression.length>500||collectVariables(expression).some(v=>v!=='x'))throw new RangeError('Usa solo x y hasta 500 caracteres.');
  return parseExpr(tokenize(expression));
}
const unique=values=>values.sort((a,b)=>a-b).filter((x,i,a)=>i===0||Math.abs(x-a[i-1])>1e-8*Math.max(1,Math.abs(x),Math.abs(a[i-1])));
function nearZero(p,x) {const weight=p.reduceRight((sum,c)=>sum*Math.abs(x)+Math.abs(c),0);return Math.abs(evaluate(p,x))<=1e-12*Math.max(Number.MIN_VALUE,weight);}
const sampleBetween=(a,b)=>a===-Infinity&&b===Infinity?0:a===-Infinity?b-Math.max(1,Math.abs(b)+1):b===Infinity?a+Math.max(1,Math.abs(a)+1):a+(b-a)/2;
function signIntervals(numerator,denominator,boundaries,power=1) {
  const cuts=[-Infinity,...unique(boundaries),Infinity];
  return cuts.slice(0,-1).map((left,i)=>{const right=cuts[i+1],point=sampleBetween(left,right),sign=Math.sign(evaluate(numerator,point))*Math.sign(evaluate(denominator,point))**power;return {left,right,sign};});
}
function pointTypes(roots,breaks,numerator,denominator,power=1) {
  const charts=signIntervals(numerator,denominator,[...roots,...breaks],power);
  return roots.filter(x=>!breaks.some(b=>Math.abs(b-x)<1e-8*Math.max(1,Math.abs(x)))).map(x=>{
    const index=charts.findIndex(c=>Math.abs(c.right-x)<1e-8*Math.max(1,Math.abs(x))),before=charts[index]?.sign,after=charts[index+1]?.sign;
    return {x,before,after,type:before<0&&after>0?'mínimo local':before>0&&after<0?'máximo local':'estacionario sin extremo'};
  });
}
function division(a,b) {
  let remainder=a.slice();const quotient=Array(Math.max(1,a.length-b.length+1)).fill(0);
  while(remainder.length>=b.length&&remainder.some(c=>c!==0)) {
    const degree=remainder.length-b.length,c=remainder.at(-1)/b.at(-1);quotient[degree]=c;
    for(let i=0;i<b.length;i++)remainder[degree+i]-=c*b[i];
    remainder.pop();remainder=trim(remainder);
  }
  return {quotient:trim(quotient),remainder};
}
function orderAt(p,x) {
  let order=0;while(p.length>1&&nearZero(p,x)){p=derivative(p);order++;}
  const factorial=Array.from({length:order},(_,i)=>i+1).reduce((a,b)=>a*b,1);
  return {order,leading:evaluate(p,x)/factorial};
}
export function rationalFunctionAnalysis(expression,{start=-6,end=6,closedInterval=false}={}) {
  finite(start,'Inicio');finite(end,'Fin');if(start>=end)throw new RangeError('Se requiere inicio < fin.');
  const source=sourceAST(expression),N=polynomial(source.type==='/'?source.left:source),D=source.type==='/'?polynomial(source.right):[1];
  if(N.length>5||D.length>5||D.every(c=>c===0))throw new RangeError('Numerador/denominador hasta grado 4; denominador no nulo.');
  if([...N,...D].some(c=>!Number.isFinite(c)))throw new RangeError('Coeficientes fuera del rango numérico.');
  const excluded=realPolynomialRoots(D),H=subtract(product(derivative(N),D),product(N,derivative(D)));
  const J=subtract(product(derivative(H),D),scale(product(H,derivative(D)),2));
  const firstRoots=realPolynomialRoots(H),secondRoots=realPolynomialRoots(J);
  const value=x=>finite(evaluate(N,x)/evaluate(D,x),'Valor de f');
  const criticalPoints=pointTypes(firstRoots,excluded,H,D,2).map(p=>({...p,value:value(p.x)}));
  const monotonicity=signIntervals(H,D,[...firstRoots,...excluded],2).map(c=>({...c,trend:c.sign>0?'crece':c.sign<0?'decrece':'constante'}));
  const concavity=signIntervals(J,D,[...secondRoots,...excluded],3).map(c=>({...c,trend:c.sign>0?'cóncava hacia arriba':c.sign<0?'cóncava hacia abajo':'curvatura nula'}));
  const inflections=pointTypes(secondRoots,excluded,J,D,3).filter(p=>p.before*p.after<0).map(p=>({x:p.x,value:value(p.x)}));
  const discontinuities=excluded.map(x=>{
    if(N.every(c=>c===0))return {x,type:'hueco removible',limit:0};
    const n=orderAt(N,x),d=orderAt(D,x),difference=d.order-n.order,c=n.leading/d.leading;
    return difference>0?{x,type:'asíntota vertical',left:Math.sign(c)*(difference%2?-1:1)*Infinity,right:Math.sign(c)*Infinity}:
      {x,type:'hueco removible',limit:difference===0?c:0};
  });
  const quotient=division(N,D).quotient;
  const reflected=p=>p.map((c,i)=>i%2?-c:c);
  const identity=subtract(product(reflected(N),D),product(N,reflected(D)));
  const oddIdentity=add(product(reflected(N),D),product(N,reflected(D)));
  const symmetricDomain=excluded.every(x=>excluded.some(y=>Math.abs(y+x)<1e-8*Math.max(1,Math.abs(x))));
  const symmetry=!symmetricDomain?'ninguna':identity.every(c=>c===0)?'par':oddIdentity.every(c=>c===0)?'impar':'ninguna';
  let extrema='Extremos locales; no se declara extremo absoluto de todo el dominio.';
  if(closedInterval) {
    if(excluded.some(x=>x>=start&&x<=end))extrema='Intervalo con singularidad: no aplicar el teorema de extremos de función continua.';
    else {
      const candidates=unique([start,end,...firstRoots.filter(x=>x>start&&x<end)]).map(x=>({x,value:value(x)}));
      const min=Math.min(...candidates.map(p=>p.value)),max=Math.max(...candidates.map(p=>p.value));
      extrema={candidates,minimum:candidates.filter(p=>Math.abs(p.value-min)<1e-9*Math.max(1,Math.abs(min))),maximum:candidates.filter(p=>Math.abs(p.value-max)<1e-9*Math.max(1,Math.abs(max)))};
    }
  }
  return {expression,domain:excluded.length?`ℝ excepto ${excluded.join(', ')}`:'ℝ',excluded,symmetry,criticalPoints,monotonicity,concavity,inflections,discontinuities,
    asymptote:source.type==='/'?quotient:null,asymptoteType:source.type!=='/'?'no aplica: polinomio':quotient.length===1?'horizontal':quotient.length===2?'oblicua':'polinómica',extrema,
    formula:'f′=(N′D−ND′)/D²; f″=(H′D−2HD′)/D³; H=N′D−ND′.',
    assumption:'Polinomios de grado ≤4; raíces reales aisladas por derivadas/bisección, incluidas repetidas, tolerancia relativa 10⁻¹². Gráfica acotada no sustituye el análisis global.'};
}
export function polynomialExponentialAnalysis(expression,rate) {
  finite(rate,'Tasa');const P=polynomial(sourceAST(expression));if(P.length>5)throw new RangeError('Polinomio hasta grado 4.');
  const H=add(derivative(P),scale(P,rate)),J=add(derivative(H),scale(H,rate)),roots=realPolynomialRoots(H);
  return {domain:'ℝ',criticalPoints:pointTypes(roots,[],H,[1]).map(p=>({...p,value:finite(evaluate(P,p.x)*Math.exp(rate*p.x),'f'),secondDerivative:finite(evaluate(J,p.x)*Math.exp(rate*p.x),'f″')})),
    monotonicity:signIntervals(H,[1],roots).map(c=>({...c,trend:c.sign>0?'crece':c.sign<0?'decrece':'constante'})),
    formula:'f=P(x)e^(kx); f′=(P′+kP)e^(kx); f″=(P″+2kP′+k²P)e^(kx).',assumption:'e^(kx)>0; los signos dependen del factor polinómico.'};
}
export function tangentDifferential(expression,x,increment=0) {
  finite(x,'x₀');finite(increment,'dx');const details=derivativeDetails(expression);
  if(!details||collectVariables(expression).some(v=>v!=='x'))throw new RangeError('Expresión diferenciable en x requerida.');
  const r=details.evaluate(x);if(r.status!=='evaluated')throw new RangeError(r.reason);
  const f=calcParse(expression),exact=finite(f(x+increment,0),'Valor desplazado'),differential=finite(r.value*increment,'dy'),approximation=finite(r.functionValue+differential,'Aproximación');
  const intercept=finite(r.functionValue-r.value*x,'Intersección');
  return {point:[x,r.functionValue],slope:r.value,intercept,tangent:`y = (${r.value})(x−(${x})) + (${r.functionValue})`,derivative:details.derivative,differential,approximation,exact,actualChange:exact-r.functionValue,absoluteError:Math.abs(exact-approximation),
    domain:details.conditions,formula:'dy=f′(x₀)dx; L(x₀+dx)=f(x₀)+dy.',assumption:'Aproximación local; el error contra el valor evaluado no es una cota general.'};
}
export function symbolicParametricDerivatives(xExpression,yExpression,time) {
  finite(time,'t');if([xExpression,yExpression].some(expr=>collectVariables(expr).some(v=>v!=='t')))throw new RangeError('Usa solo t en la curva.');
  const X=derivativeDetails(xExpression,2,'t'),Y=derivativeDetails(yExpression,2,'t');
  if(!X||!Y)throw new RangeError('Derivadas de la curva no disponibles.');
  const a=X.evaluate(time),b=Y.evaluate(time);if(a.status!=='evaluated'||b.status!=='evaluated')throw new RangeError(a.reason||b.reason);
  const dx=finite(calcParse(X.derivatives[0].expression,'t')(time,0),'x′'),dy=finite(calcParse(Y.derivatives[0].expression,'t')(time,0),'y′');
  if(dx===0)return {status:dy===0?'punto estacionario; tangente requiere análisis adicional':'tangente vertical',x:a.functionValue,y:b.functionValue,dxdt:dx,dydt:dy,assumption:'No dividir por x′=0.'};
  return {status:'regular',x:a.functionValue,y:b.functionValue,dxdt:dx,dydt:dy,d2xdt2:a.value,d2ydt2:b.value,dydx:finite(dy/dx,'dy/dx'),d2ydx2:finite((dx*b.value-dy*a.value)/dx**3,'d²y/dx²'),
    firstDerivatives:[X.derivatives[0].expression,Y.derivatives[0].expression],secondDerivatives:[X.derivatives[1].expression,Y.derivatives[1].expression],
    formula:'dy/dx=y′/x′; d²y/dx²=(x′y″−y′x″)/(x′)³.',assumption:'Derivadas simbólicas en un punto regular; x′ no nulo.'};
}
export function positiveReciprocalMinimum(a,b,p=2,q=1) {
  [a,b,p,q].forEach(v=>positive(v,'Coeficiente/exponente'));
  const x=(b*q/(a*p))**(1/(p+q)),minimum=a*x**p+b/x**q,secondDerivative=a*p*(p-1)*x**(p-2)+b*q*(q+1)/x**(q+2);
  [x,minimum,secondDerivative].forEach(v=>finite(v,'Resultado'));
  return {x,minimum,secondDerivative,formula:'f=a x^p+b/x^q; x*=(bq/ap)^(1/(p+q)).',steps:['f′=x^(−q−1)[ap x^(p+q)−bq].','El factor entre corchetes es creciente: f′<0 antes de x* y f′>0 después.','f→+∞ al tender x→0+ o x→+∞; mínimo global único.'],assumption:'x>0, a,b,p,q>0.'};
}
export function maximalEllipseRectangle(a,b) {
  positive(a,'Semieje a');positive(b,'Semieje b');const width=finite(Math.SQRT2*a,'Ancho'),height=finite(Math.SQRT2*b,'Altura');
  return {width,height,maximumArea:finite(2*a*b,'Área'),vertex:[a/Math.SQRT2,b/Math.SQRT2],formula:'A=4xy; x=a cosθ,y=b senθ ⇒ A=2ab sen2θ≤2ab.',steps:['Máximo en θ=π/4; lados completos 2x y 2y.'],assumption:'Rectángulo centrado y lados paralelos a los ejes de la elipse; a,b son semiejes.'};
}
export function cylinderAreaMinimum(volume,lids=2) {
  positive(volume,'Volumen');if(![1,2].includes(lids))throw new RangeError('Una o dos tapas.');
  const radius=Math.cbrt(volume/(lids*Math.PI)),height=finite(volume/(Math.PI*radius**2),'Altura'),area=lids*Math.PI*radius**2+2*volume/radius;
  return {radius,height,minimumArea:finite(area,'Área'),formula:`S=${lids}πr²+2V/r; r³=V/(${lids}π); h=${lids}r.`,
    steps:['S′=2tπr−2V/r²=0; S″=2tπ+4V/r³>0.','S→∞ en ambos extremos r→0+ y r→∞; mínimo global.'],assumption:`Cilindro circular recto con ${lids} tapas. Usar unidades coherentes: V en cm³ produce r/h en cm y área en cm².`};
}
export function nearestParabolaPoints(a,u,v) {
  finite(a,'Coeficiente');finite(u,'Coordenada u');finite(v,'Coordenada v');if(a===0)throw new RangeError('a no nulo para y=ax².');
  const roots=realPolynomialRoots([-u,1-2*a*v,0,2*a*a]),candidates=roots.map(x=>({x,y:a*x*x,distanceSquared:finite((x-u)**2+(a*x*x-v)**2,'Distancia del candidato')}));
  const minimumSquared=Math.min(...candidates.map(p=>p.distanceSquared));finite(minimumSquared,'Distancia');
  return {points:candidates.filter(p=>Math.abs(p.distanceSquared-minimumSquared)<=1e-9*Math.max(1,minimumSquared)),distance:Math.sqrt(minimumSquared),candidates,
    formula:'D²=(x−u)²+(ax²−v)²; (D²)′/2=2a²x³+(1−2av)x−u.',steps:['Resolver todos los ceros de la derivada y comparar D².','D²→∞ cuando |x|→∞; el menor candidato es mínimo global.'],assumption:'Todas las x reales; se conservan todos los mínimos empatados.'};
}
export function stationarySineCoefficient(b,frequency,point) {
  finite(b,'B');positive(frequency,'m');finite(point,'Punto');const cosine=Math.cos(point),residual=b*frequency*Math.cos(frequency*point);
  if(Math.abs(cosine)<1e-12)return {status:Math.abs(residual)<1e-12?'coeficiente no determinado por f′=0':'sin coeficiente que haga f′=0',assumption:'cos(x₀)≈0 dentro de tolerancia 10⁻¹²; requiere análisis simbólico del ángulo para clasificar.'};
  const coefficient=-residual/cosine,secondDerivative=-coefficient*Math.sin(point)-b*frequency**2*Math.sin(frequency*point);
  return {coefficient:finite(coefficient,'a'),secondDerivative:finite(secondDerivative,'f″'),type:secondDerivative<0?'máximo local':secondDerivative>0?'mínimo local':'segunda derivada inconclusa',
    formula:'f=a sen x+B sen(mx); f′=a cos x+mB cos(mx); resolver f′(x₀)=0.',assumption:'Clasificación por segunda derivada si es no nula.'};
}
export function exponentialLimitCoefficient(target) {
  finite(target,'Límite requerido');return {coefficients:target<0?[]:target===0?[0]:[-finite(Math.SQRT2*Math.sqrt(target),'k'),finite(Math.SQRT2*Math.sqrt(target),'k')],
    formula:'lim (e^(kx)−1−kx)/x²=k²/2.',steps:['L’Hôpital dos veces: k²e^(kx)/2 → k²/2.','Resolver k²=2·valor requerido; incluir ambos signos reales.'],assumption:target<0?'No existe k real para un límite negativo.':'k real; límite bilateral.'};
}
export function theoremCheck(expression,start,end,kind='mvt') {
  finite(start,'a');finite(end,'b');if(start>=end||!['mvt','rolle'].includes(kind))throw new RangeError('Intervalo o teorema inválido.');
  const source=sourceAST(expression);let slope,points,fa,fb,proof,allPoints;
  if(source.type==='fn'&&source.fn==='sqrt'&&source.arg.type==='var'&&source.arg.val==='x') {
    if(start<0)throw new RangeError('√x requiere a≥0.');fa=Math.sqrt(start);fb=Math.sqrt(end);slope=(fb-fa)/(end-start);points=[1/(4*slope*slope)];proof='√x es continua para x≥0 y diferenciable para x>0; (a,b) está en x>0.';
  }else {
    const p=polynomial(source);if(p.length>5)throw new RangeError('Teoremas: polinomios hasta grado 4 o √x.');
    fa=evaluate(p,start);fb=evaluate(p,end);slope=(fb-fa)/(end-start);const equation=subtract(derivative(p),[slope]);allPoints=equation.every(c=>c===0)?'Todo c del intervalo abierto (a,b)':undefined;points=allPoints?[start+(end-start)/2]:realPolynomialRoots(equation);proof='Un polinomio es continuo en [a,b] y diferenciable en (a,b).';
  }
  [fa,fb,slope].forEach(v=>finite(v,'Valor del teorema'));
  if(kind==='rolle'&&fa!==fb)return {status:'no cumple Rolle',fa,fb,assumption:'f(a) debe igualar f(b); no se concluye existencia por Rolle.'};
  return {status:'hipótesis verificadas',fa,fb,slope,points:points.filter(x=>x>start&&x<end),...(allPoints?{allPoints}:{}),formula:kind==='rolle'?'f′(c)=0, c∈(a,b)':'f′(c)=[f(b)−f(a)]/(b−a), c∈(a,b)',steps:[proof,...(kind==='rolle'?['f(a)=f(b); secante de pendiente 0.']:[])],assumption:'Solo familias declaradas; no se infiere continuidad a partir de muestras.'};
}
