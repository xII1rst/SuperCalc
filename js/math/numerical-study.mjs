import { tokenize, parseExpr, simplify, diffAST, astToStr, calcParse, collectVariables, derivativeDetails } from './calculus.mjs';
import { newtonInterpolation } from './numerical-analysis.mjs';

const finite=(x)=>{if(!Number.isFinite(x))throw new RangeError('Resultado fuera del rango numérico');return x;};
const factorial=n=>{let r=1;for(let i=2;i<=n;i++)r*=i;return r;};
function source(expression){
  if(typeof expression!=='string'||!expression.trim()||expression.length>300||collectVariables(expression).some(v=>v!=='x'))throw new RangeError('Expresión en x, hasta 300 caracteres');
  return parseExpr(tokenize(expression));
}
// Conservative interval arithmetic. It proves inclusion for these AST families;
// it never infers a derivative maximum from sampled values.
function interval(node,a,b){
  if(node.type==='num')return [node.val,node.val];
  if(node.type==='var'&&node.val==='x')return [a,b];
  if(node.type==='neg'){const [lo,hi]=interval(node.arg,a,b);return [-hi,-lo];}
  if(['+','-','*','/'].includes(node.type)){
    const [l,h]=interval(node.left,a,b),[u,v]=interval(node.right,a,b);
    if(node.type==='+')return [finite(l+u),finite(h+v)];
    if(node.type==='-')return [finite(l-v),finite(h-u)];
    if(node.type==='/'&&u<=0&&v>=0)throw new RangeError('El intervalo del denominador contiene cero; cota no demostrada');
    const values=node.type==='*'?[l*u,l*v,h*u,h*v]:[l/u,l/v,h/u,h/v];values.forEach(finite);return [Math.min(...values),Math.max(...values)];
  }
  if(node.type==='^'&&node.right.type==='num'&&Number.isInteger(node.right.val)&&Math.abs(node.right.val)<=12){
    const [l,h]=interval(node.left,a,b),n=node.right.val;
    if(n<0&&l<=0&&h>=0)throw new RangeError('Potencia negativa con base que puede anularse');
    if(n===0)return [1,1];
    const values=[finite(l**n),finite(h**n)];if(n>0&&n%2===0&&l<=0&&h>=0)values.push(0);
    return [Math.min(...values),Math.max(...values)];
  }
  if(node.type==='fn'){
    const [l,h]=interval(node.arg,a,b);
    if(node.fn==='exp')return [finite(Math.exp(l)),finite(Math.exp(h))];
    if(node.fn==='ln'&&l>0)return [Math.log(l),Math.log(h)];
    if(['sin','cos'].includes(node.fn))return [-1,1];
  }
  throw new RangeError('Cota no soportada: polinomios, cocientes sin cero, exp, ln positiva, sen y cos');
}
export function derivativeIntervalBound(expression,a,b,order){
  if(![a,b].every(Number.isFinite)||a>b||!Number.isInteger(order)||order<0||order>8)throw new RangeError('Intervalo u orden inválido (0–8)');
  let ast=source(expression);interval(ast,a,b); // Preserve the domain of the original expression.
  if(ast.type==='fn'&&ast.fn==='ln'&&ast.arg.type==='var'&&ast.arg.val==='x'&&order>0){
    const constant=(-1)**(order-1)*factorial(order-1),values=[constant/a**order,constant/b**order];values.forEach(finite);
    return {bound:Math.abs(constant)/a**order,range:[Math.min(...values),Math.max(...values)],derivative:`(${constant})/x^${order}`,order,
      proof:`Para x≥${a}>0, |(ln x)⁽ⁿ⁾|=(n−1)!/xⁿ ≤ (n−1)!/${a}ⁿ.`};
  }
  for(let i=0;i<order;i++){ast=simplify(diffAST(ast,'x'));if(astToStr(ast).length>8000)throw new RangeError('Derivada demasiado grande');}
  const range=interval(ast,a,b),bound=finite(Math.max(...range.map(Math.abs)));
  return {bound,range,derivative:astToStr(ast),order,proof:`Inclusión por aritmética de intervalos en [${a}, ${b}]; exp y ln monótonas, |sen| y |cos| ≤ 1. Cota conservadora, no necesariamente el máximo.`};
}
export function taylorErrorStudy(expression,center,x,degree){
  if(![center,x].every(Number.isFinite)||!Number.isInteger(degree)||degree<0||degree>6)throw new RangeError('Centro y punto finitos; grado 0–6');
  const bound=derivativeIntervalBound(expression,Math.min(center,x),Math.max(center,x),degree+1);
  let ast=source(expression),coefficients=[];
  for(let i=0;i<=degree;i++){
    const fn=calcParse(astToStr(ast));if(!fn)throw new RangeError('Derivada no evaluable');
    coefficients.push(finite(fn(center))/factorial(i));ast=simplify(diffAST(ast,'x'));
  }
  const terms=coefficients.map((c,i)=>finite(c*(x-center)**i)),approximation=finite(terms.reduce((s,v)=>s+v,0));
  const reference=finite(calcParse(expression)(x)),errorBound=finite(bound.bound*Math.abs(x-center)**(degree+1)/factorial(degree+1));
  return {coefficients,terms,approximation,reference,actualError:Math.abs(reference-approximation),errorBound,...bound,
    formula:'|Rₙ(x)| ≤ Mₙ₊₁ |x−a|ⁿ⁺¹/(n+1)!'};
}
export function bisectionIterationRequirement(a,b,tolerance){
  if(![a,b,tolerance].every(Number.isFinite)||a>=b||tolerance<=0)throw new RangeError('Intervalo y tolerancia positivos requeridos');
  let iterations=Math.max(1,Math.floor(Math.log2((b-a)/tolerance))+1);
  if(!Number.isFinite(iterations)||iterations>1074)throw new RangeError('Tolerancia fuera del rango');
  while((b-a)/2**iterations>=tolerance)iterations++;
  return {iterations,bound:(b-a)/2**iterations,formula:'Tras N puntos medios, |r−mₙ| ≤ (b−a)/2ᴺ < ε. Requiere continuidad y cambio de signo.'};
}
export function expandedInterpolation(points){
  const result=newtonInterpolation(points),coefficients=Array(points.length).fill(0);let basis=[1];
  for(let i=0;i<points.length;i++){
    basis.forEach((c,j)=>coefficients[j]+=result.coefficients[i]*c);
    const next=Array(basis.length+1).fill(0);basis.forEach((c,j)=>{next[j]-=points[i][0]*c;next[j+1]+=c;});basis=next;
  }
  return {...result,powerCoefficients:coefficients};
}
export function convergenceOrderStudy(iterates,reference){
  if(!Array.isArray(iterates)||iterates.length<3||iterates.some(x=>!Number.isFinite(x))||!Number.isFinite(reference))throw new RangeError('Al menos tres aproximaciones y referencia finitas');
  const errors=iterates.map(x=>Math.abs(x-reference));
  return errors.slice(0,-1).map((error,i)=>{
    const next=errors[i+1],previous=errors[i-1];
    return {iteration:i,error,nextError:next,linearRatio:error>1e-14?next/error:null,quadraticRatio:error>1e-14?next/error**2:null,
      observedOrder:i>0&&previous>1e-14&&error>1e-14&&next>1e-14&&Math.abs(Math.log(error/previous))>1e-12?Math.log(next/error)/Math.log(error/previous):null};
  });
}
export function derivativeReference(expression,x){
  const details=derivativeDetails(expression);if(!details)throw new RangeError('Derivada simbólica no soportada');
  const value=details.evaluate(x);if(value.status!=='evaluated')throw new RangeError(value.reason);
  return {value:value.value,expression:details.derivative};
}
