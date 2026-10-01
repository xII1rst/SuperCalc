import { luSolve } from './numerical-advanced.mjs';
import { tokenize, parseExpr, diffAST, simplify, astToStr, collectVariables, calcParse } from './calculus.mjs';
const allowed=['x','y','z','u','v','w'];
const norm=v=>Math.max(...v.map(Math.abs));
export function newtonSystem(expressions,variables,initial,{iterations=30,tolerance=1e-9}={}){
 if(!Array.isArray(variables)||variables.length<2||variables.length>6||new Set(variables).size!==variables.length||variables.some(v=>!allowed.includes(v))||!Array.isArray(expressions)||expressions.length!==variables.length||!Array.isArray(initial)||initial.length!==variables.length||initial.some(v=>!Number.isFinite(v)))throw new RangeError('De 2 a 6 ecuaciones y variables distintas x,y,z,u,v,w; semilla compatible.');
 if(!Number.isInteger(iterations)||iterations<1||iterations>100||!Number.isFinite(tolerance)||tolerance<=0)throw new RangeError('De 1 a 100 iteraciones y tolerancia positiva.');
 const compile=source=>{if(typeof source!=='string'||source.length>300||collectVariables(source).some(v=>!variables.includes(v)))throw new RangeError('Expresión de hasta 300 caracteres y variables declaradas.');const node=parseExpr(tokenize(source)),first=variables[0],order=[first,...collectVariables(source).filter(v=>v!==first)],fn=calcParse(source,first);if(!fn)throw new RangeError('Expresión inválida.');return {node,run:point=>fn(...order.map(v=>point[variables.indexOf(v)]))};};
 const parsed=expressions.map(compile),jacobianFormulas=parsed.map(({node})=>variables.map(v=>astToStr(simplify(diffAST(node,v))))),jacobianFns=jacobianFormulas.map(row=>row.map(compile));
 const evaluate=point=>parsed.map(({run})=>run(point));let solution=initial.slice(),history=[];
 for(let iteration=0;iteration<=iterations;iteration++){
  let values;try{values=evaluate(solution);}catch{return {status:'domain_error',solution,history,variables,jacobianFormulas};}
  if(values.some(v=>!Number.isFinite(v)))return {status:'domain_error',solution,history,variables,jacobianFormulas};
  const residual=norm(values);if(residual<=tolerance)return {status:'converged',solution,residual,history,variables,jacobianFormulas,tolerance};
  if(iteration===iterations)return {status:'max_iterations',solution,residual,history,variables,jacobianFormulas,tolerance};
  let jacobian;try{jacobian=jacobianFns.map(row=>row.map(({run})=>run(solution)));}catch{return {status:'domain_error',solution,residual,history,variables,jacobianFormulas};}
  if(jacobian.flat().some(v=>!Number.isFinite(v)))return {status:'domain_error',solution,residual,history,variables,jacobianFormulas};
  let delta;try{delta=luSolve(jacobian,values.map(v=>-v)).solution;}catch{return {status:'singular_jacobian',solution,residual,history,variables,jacobianFormulas};}
  const next=solution.map((v,i)=>v+delta[i]);history.push({iteration:iteration+1,point:solution.slice(),values,jacobian,step:delta,next:next.slice(),stepNorm:norm(delta)});
  if(next.some(v=>!Number.isFinite(v)||Math.abs(v)>1e100))return {status:'diverged',solution:next,residual,history,variables,jacobianFormulas};solution=next;
 }
}
const multiply=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((s,v,k)=>s+v*B[k][j],0)));
const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
// A certificate for constant systems X′=AX. A norm > 1 does not imply instability.
export function systemStability(matrix,step,method='rk4'){
 const n=matrix?.length;if(!Array.isArray(matrix)||n<1||n>6||matrix.some(row=>!Array.isArray(row)||row.length!==n||row.some(v=>!Number.isFinite(v)))||!Number.isFinite(step)||step<=0||!['euler','rk2','rk4','ab2'].includes(method))throw new RangeError('Matriz cuadrada finita de 1–6, h>0 y método Euler/RK2/RK4/AB2.');
 const Z=matrix.map(row=>row.map(v=>step*v)),I=identity(n);let amplification;
 if(method==='ab2')amplification=[...Z.map((row,i)=>[...row.map((v,j)=>I[i][j]+1.5*v),...row.map(v=>-.5*v)]),...I.map(row=>[...row,...Array(n).fill(0)])];
 else{amplification=I.map(row=>row.slice());let power=I,factorial=1;const order=method==='euler'?1:method==='rk2'?2:4;for(let k=1;k<=order;k++){power=multiply(power,Z);factorial*=k;amplification=amplification.map((row,i)=>row.map((v,j)=>v+power[i][j]/factorial));}}
 if(amplification.flat().some(v=>!Number.isFinite(v)))throw new RangeError('Amplificación fuera del rango numérico.');
 const history=[];let power=identity(amplification.length),status='inconclusive',bound=null,certificatePower=null;
 for(let k=1;k<=16;k++){power=multiply(power,amplification);const upper=Math.max(...power.map(row=>row.reduce((s,v)=>s+Math.abs(v),0)));if(!Number.isFinite(upper))break;history.push({power:k,norm:upper});if(upper<1-1e-12){status='stable';bound=upper**(1/k);certificatePower=k;break;}}
 // Triangular matrices expose their complete spectrum; AB2 uses the two scalar roots.
 const upperTriangular=matrix.every((row,i)=>row.every((v,j)=>j>=i||v===0)),lowerTriangular=matrix.every((row,i)=>row.every((v,j)=>j<=i||v===0));let spectralRadius=null;
 if(upperTriangular||lowerTriangular){
  const radii=matrix.map((row,i)=>{const z=step*row[i];if(method==='ab2'){const a=1+1.5*z,d=a*a-2*z;return d<0?Math.sqrt(Math.abs(z)/2):Math.max(Math.abs((a+Math.sqrt(d))/2),Math.abs((a-Math.sqrt(d))/2));}return Math.abs(1+z+(method!=='euler'?z*z/2:0)+(method==='rk4'?z**3/6+z**4/24:0));});
  spectralRadius=Math.max(...radii);status=spectralRadius<1-1e-12?'stable':spectralRadius>1+1e-12?'unstable':'boundary';
 }
 return {status,amplification,spectralRadius,bound,certificatePower,history,step,method,
  criterion:'Estabilidad asintótica de la recurrencia: ρ(R)<1. ||R^k||∞<1 es suficiente; una norma mayor no demuestra inestabilidad. Matrices triangulares: espectro diagonal completo.',
  assumption:'Sistema lineal constante X′=AX; no certifica estabilidad global de un sistema no lineal. AB2 usa estado [Xₙ,Xₙ₋₁] y requiere un arranque.'};
}
