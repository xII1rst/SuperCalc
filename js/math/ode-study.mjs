import { tokenize, parseExpr } from './calculus/parser.mjs';
import { collectVariables } from './expression.mjs';
import { luSolve } from './numerical-advanced.mjs';
import { linearSystem2D } from './study-ode.mjs';
import { solveSecondOrderHomogeneous } from './applications.mjs';
const finite=(x)=>{if(!Number.isFinite(x))throw new RangeError('Dato o resultado no finito');return x;};
const polynomialText=p=>p.map((c,i)=>`(${c})${i?`x^${i}`:''}`).join(' + ');
const poly=(p,x)=>p.reduceRight((s,c)=>s*x+c,0);
const derivative=p=>p.length===1?[0]:p.slice(1).map((v,i)=>v*(i+1));

export function odeClassification(expression){
  if(typeof expression!=='string'||!expression.trim()||expression.length>300)throw new RangeError('Ecuación de hasta 300 caracteres');
  const source=expression.replace(/y[′″‴]/g,match=>`y${"'".repeat({'′':1,'″':2,'‴':3}[match[1]])}`);
  let order=0;
  const replaced=source.replace(/\by('{1,4})(?!')/g,(_,primes)=>{order=Math.max(order,primes.length);return `v${primes.length}`;}).replace(/\by\b/g,'v0');
  if(!order||replaced.includes("'"))throw new RangeError('Usa y, y′, y″, y‴ o y con 1–4 apóstrofes');
  const sides=replaced.split('=');if(sides.length>2||collectVariables(replaced).some(v=>!['x','v0','v1','v2','v3','v4'].includes(v)))throw new RangeError('Variable independiente x; una igualdad');
  const node=parseExpr(tokenize(`(${sides[0]})-(${sides[1]||'0'})`));
  const degree=(n,variables)=>{
    if(n.type==='num')return 0;if(n.type==='var')return variables.includes(n.val)?1:0;
    if(n.type==='neg')return degree(n.arg,variables);
    if(n.type==='fn'){const d=degree(n.arg,variables);return d===0?0:null;}
    const a=degree(n.left,variables),b=degree(n.right,variables);if(a===null||b===null)return null;
    if(n.type==='+'||n.type==='-')return Math.max(a,b);if(n.type==='*')return a+b;
    if(n.type==='/')return b===0?a:null;
    if(n.type==='^'){if(a===0&&b===0)return 0;return b===0&&n.right.type==='num'&&Number.isInteger(n.right.val)&&n.right.val>=0?a*n.right.val:null;}
    return null;
  };
  const differentialDegree=degree(node,['v1','v2','v3','v4']),highestDegree=degree(node,[`v${order}`]),totalDegree=degree(node,['v0','v1','v2','v3','v4']);
  return {order,degree:differentialDegree===null?null:highestDegree,linear:totalDegree!==null&&totalDegree<=1,
    formula:'Orden: derivada más alta presente. Grado: potencia de esa derivada si la ecuación es polinómica en las derivadas. Lineal: y y sus derivadas aparecen con grado total ≤1, sin productos ni funciones no lineales.',
    assumption:'Clasificación de la forma escrita; no se elevan potencias para eliminar radicales ni se elimina una derivada por cancelaciones no verificadas.'};
}
export function homogeneousSecondOrderStudy(a,b,y0,v0,x){
  [a,b,y0,v0,x].forEach(finite);const result=solveSecondOrderHomogeneous(1,a,b,y0,v0),roots=result.roots;
  let generalSolution,first;
  if(roots.type==='distinct'){
    const {r1,r2}=roots;generalSolution=`y=C₁e^(${r1}x)+C₂e^(${r2}x)`;first=t=>r1*result.c1*Math.exp(r1*t)+r2*result.c2*Math.exp(r2*t);
  }else if(roots.type==='repeated'){
    const r=roots.r;generalSolution=`y=(C₁+C₂x)e^(${r}x)`;first=t=>Math.exp(r*t)*(result.c2+r*(result.c1+result.c2*t));
  }else{
    const {alpha,beta}=roots;generalSolution=`y=e^(${alpha}x)[C₁cos(${beta}x)+C₂sen(${beta}x)]`;
    first=t=>Math.exp(alpha*t)*(alpha*(result.c1*Math.cos(beta*t)+result.c2*Math.sin(beta*t))+beta*(-result.c1*Math.sin(beta*t)+result.c2*Math.cos(beta*t)));
  }
  const value=finite(result.evaluate(x)),slope=finite(first(x));
  return {value,derivative:slope,secondDerivative:finite(-a*slope-b*value),generalSolution,roots,constants:[result.c1,result.c2],initialCheck:[result.evaluate(0),first(0)],
    characteristic:`r²+(${a})r+(${b})=0`,formula:'y″+ay′+by=0; resolver el polinomio característico y sustituir las dos condiciones iniciales.'};
}
export function polynomialExponentialSecondOrder(a,b,rate,coefficients,y0,v0,x){
  [a,b,rate,y0,v0,x].forEach(finite);
  if(!Array.isArray(coefficients)||!coefficients.length||coefficients.length>5||coefficients.some(c=>!Number.isFinite(c)))throw new RangeError('Polinomio forzante grado 0–4, coeficientes ascendentes');
  const alpha=2*rate+a,beta=rate*rate+a*rate+b,resonance=beta!==0?0:alpha!==0?1:2,n=coefficients.length;
  const matrix=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{const power=j+resonance;return i===power?beta:i===power-1?alpha*power:i===power-2?power*(power-1):0;}));
  const u=[...Array(resonance).fill(0),...luSolve(matrix,coefficients).solution],u1=derivative(u),u2=derivative(u1);
  const particular=t=>Math.exp(rate*t)*poly(u,t),particularFirst=t=>Math.exp(rate*t)*(rate*poly(u,t)+poly(u1,t));
  const homogeneous=homogeneousSecondOrderStudy(a,b,y0-particular(0),v0-particularFirst(0),x),exponential=Math.exp(rate*x);
  const yp=finite(particular(x)),dp=finite(particularFirst(x)),ddp=finite(exponential*(rate*rate*poly(u,x)+2*rate*poly(u1,x)+poly(u2,x)));
  const value=finite(homogeneous.value+yp),slope=finite(homogeneous.derivative+dp),second=finite(homogeneous.secondDerivative+ddp),forcing=finite(exponential*poly(coefficients,x));
  return {value,derivative:slope,secondDerivative:second,particular:yp,particularCoefficients:u,resonanceOrder:resonance,
    particularExpression:`e^(${rate}x)[${polynomialText(u)}]`,generalSolution:homogeneous.generalSolution+` + e^(${rate}x)[${polynomialText(u)}]`,constants:homogeneous.constants,
    initialCheck:[homogeneous.initialCheck[0]+particular(0),homogeneous.initialCheck[1]+particularFirst(0)],residual:finite(second+a*slope+b*value-forcing),
    steps:[`yₚ=e^(${rate}x)u; u″+(${alpha})u′+(${beta})u=P(x).`,`Raíz de multiplicidad ${resonance}; comenzar u con x^${resonance} para evitar términos homogéneos.`,`Igualar coeficientes y resolver ${n} ecuaciones; fijar C₁,C₂ con y(0),y′(0).`],
    assumption:'Coeficientes constantes, forzamiento exponencial por polinomio grado≤4. Residuo numérico complementa la identidad por coeficientes.'};
}
export function variationRepeatedReciprocal(root,amplitude,c0,c1,x){
  [root,amplitude,c0,c1,x].forEach(finite);if(x===0)throw new RangeError('x=0 queda fuera del dominio');
  const log=Math.log(Math.abs(x)),u=c0+c1*x+amplitude*x*log,du=c1+amplitude*(log+1),ddu=amplitude/x,exp=Math.exp(root*x);
  const value=finite(exp*u),first=finite(exp*(root*u+du)),second=finite(exp*(root*root*u+2*root*du+ddu));
  return {value,derivative:first,secondDerivative:second,residual:second-2*root*first+root*root*value-amplitude*exp/x,
    generalSolution:`y=e^(${root}x)[C₀+C₁x+(${amplitude})x ln|x|]`,
    steps:['y₁=e^(rx), y₂=x e^(rx), W=e^(2rx).',`Variación: u₁′=−A, u₂′=A/x; u₁=−Ax, u₂=A ln|x|.`,`yₚ=A e^(rx)(x ln|x|−x); absorber −Ax e^(rx) en la parte homogénea.`],
    domain:'Cualquier intervalo contenido en x>0 o x<0; no cruzar x=0.'};
}
export function variationTangent(amplitude,omega,c0,c1,x){
  [amplitude,omega,c0,c1,x].forEach(finite);if(omega<=0)throw new RangeError('ω>0 requerido');
  const angle=omega*x,cos=Math.cos(angle),sin=Math.sin(angle);if(Math.abs(cos)<1e-12)throw new RangeError('Polo de tan(ωx) fuera del dominio');
  const L=Math.sign(cos)*Math.asinh(Math.tan(angle)),yp=-amplitude*cos*L/omega**2,dp=amplitude*(sin*L-1)/omega,ddp=amplitude*(cos*L+Math.tan(angle));
  const yh=c0*cos+c1*sin,dyh=omega*(-c0*sin+c1*cos),value=finite(yh+yp),first=finite(dyh+dp),second=finite(-omega*omega*yh+ddp);
  return {value,derivative:first,secondDerivative:second,residual:second+omega*omega*value-amplitude*Math.tan(angle),
    generalSolution:`y=C₀cos(${omega}x)+C₁sen(${omega}x)−(${amplitude}/${omega**2})cos(${omega}x)ln|sec(${omega}x)+tan(${omega}x)|`,
    steps:[`W=ω=${omega}; u₁′=−(A/ω)sen(ωx)tan(ωx), u₂′=(A/ω)cos(ωx)tan(ωx).`,`Integrar sec y sen; los términos sen·cos se cancelan. yₚ=−(A/ω²)cos(ωx)ln|sec(ωx)+tan(ωx)|.`],
    domain:'Intervalo entre polos consecutivos de tan(ωx); constante libre en cada intervalo.'};
}
export function familyEquation(kind,rate=1,point=[1,1]){
  finite(rate);if(kind==='exponential')return {equation:`y′−(${rate})y=0`,steps:['Derivar y=Ce^(rx): y′=rCe^(rx)=ry.'],family:`y=Ce^(${rate}x)`};
  if(kind==='repeated')return {equation:`y″−(${2*rate})y′+(${rate*rate})y=0`,steps:['Para y=e^(rx)(C₁+C₂x), (D−r)²y=e^(rx)D²(C₁+C₂x)=0.'],family:`y=e^(${rate}x)(C₁+C₂x)`};
  if(kind!=='circles'||!Array.isArray(point)||point.length!==2||point.some(v=>!Number.isFinite(v)))throw new RangeError('Familia o punto no soportado');
  const [x,y]=point;
  return {equation:'2xy y′=y²−x²',slope:x&&y?(y*y-x*x)/(2*x*y):null,
    steps:['x²+y²=2Cx ⇒ 2x+2yy′=2C.','Eliminar C=(x²+y²)/(2x) para x≠0; multiplicar por x: 2xyy′=y²−x².'],
    assumption:'La ecuación explícita requiere xy≠0; en los puntos singulares la ecuación multiplicada no garantiza equivalencia local con la familia.'};
}
export function sumSubstitution(a,b,c,d,x,y){
  [a,b,c,d,x,y].forEach(finite);if(a===0&&b===0&&c===0&&d===0)return {status:'underdetermined',generalSolution:'0=0: cualquier curva diferenciable satisface la forma; no hay una EDO que determine y.',slope:null};const alpha=c-a,beta=d-b,u=x+y,N=c*u+d;
  if(alpha===0&&beta===0)return {generalSolution:'u=x+y=C; todas las rectas y=C−x satisfacen la forma donde se define.',slope:N===0?null:-1};
  let expression,primitive;
  if(alpha===0){primitive=c*u*u/(2*beta)+d*u/beta;expression=`(${c}/${2*beta})u²+(${d}/${beta})u`;}
  else{
    const denominator=alpha*u+beta;if(denominator===0)return {equilibrium:`u=${-beta/alpha}; y=${-beta/alpha}−x`,slope:N===0?null:-1,formula:'Solución de equilibrio que se pierde al dividir por u′.'};
    primitive=c*u/alpha+(d*alpha-c*beta)/alpha**2*Math.log(Math.abs(denominator));
    expression=`(${c}/${alpha})u+(${d*alpha-c*beta}/${alpha**2})ln|(${alpha})u+(${beta})|`;
  }
  return {u,slope:N===0?null:-(a*u+b)/N,constant:finite(x-primitive),generalSolution:`x=${expression}+C, u=x+y`,equilibrium:alpha!==0?`u=${-beta/alpha}; y=${-beta/alpha}−x`:'ninguno',
    formula:'M=au+b,N=cu+d; y′=−M/N; u′=1+y′=((c−a)u+d−b)/(cu+d). Integrar dx/du; conservar el equilibrio.',
    assumption:'Solución implícita en intervalos regulares; no dividir por cu+d=0 ni perder la solución u constante.'};
}
export function affineForcedSystem(matrix,slope,constant,initial,time){
  if(!Array.isArray(matrix)||matrix.length!==2||matrix.some(row=>!Array.isArray(row)||row.length!==2)||![slope,constant,initial].every(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite)))throw new RangeError('Sistema2×2 y vectores de dos componentes');
  const p1=luSolve(matrix,slope.map(v=>-v)).solution,p0=luSolve(matrix,p1.map((v,i)=>v-constant[i])).solution;
  const homogeneous=linearSystem2D(matrix,initial.map((v,i)=>v-p0[i]),time),particular=p1.map((v,i)=>v*time+p0[i]),value=homogeneous.value.map((v,i)=>finite(v+particular[i]));
  const first=value.map((_,i)=>finite(matrix[i].reduce((s,v,j)=>s+v*value[j],0)+slope[i]*time+constant[i]));
  const [[a,b],[c,d]]=matrix;
  return {value,derivative:first,particularSlope:p1,particularConstant:p0,particular,matrixExponential:homogeneous.matrixExponential,
    generalSolution:`X(t)=e^(At)C+[${p1.join(',')}]t+[${p0.join(',')}]`,
    elimination:`y″−(${a+d})y′+(${a*d-b*c})y=(${c*slope[0]-a*slope[1]})t+(${c*constant[0]-a*constant[1]+slope[1]})`,
    steps:['Probar Xₚ=p₁t+p₀: Ap₁=−f₁ y Ap₀=p₁−f₀.','Para el PVI, C=X(0)−p₀; para familia general C es libre.','Derivar y′ y eliminar x; los coeficientes son tr A y det A.'],
    assumption:'A constante invertible y fuerza afín f₁t+f₀; si A es singular este método de particular no está soportado.'};
}
