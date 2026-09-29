import { matDet, matGauss, matInv, matMul } from './matrix.mjs';
import { diagonalizeReal } from './linear-spaces.mjs';
import { luSolve } from '../numerical-advanced.mjs';

function validate(A0,At,b0,bu) {
  const n=A0?.length;
  if(!Number.isInteger(n)||n<2||n>3||[A0,At].some(A=>!Array.isArray(A)||A.length!==n||A.some(row=>!Array.isArray(row)||row.length!==n||row.some(value=>!Number.isFinite(value))))||
    [b0,bu].some(vector=>!Array.isArray(vector)||vector.length!==n||vector.some(value=>!Number.isFinite(value)))) throw new RangeError('A₀, Aₜ cuadradas 2×2 o 3×3 y dos vectores del mismo orden requeridos');
  return n;
}
const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);
const evaluatePolynomial=(coefficients,x)=>coefficients.reduceRight((value,coefficient)=>value*x+coefficient,0);
function realRoots(coefficients) {
  const scale=Math.max(1,...coefficients.map(Math.abs));
  const c=coefficients.slice();while(c.length>1&&Math.abs(c.at(-1))<1e-10*scale) c.pop();
  const degree=c.length-1;
  if(degree===0) return [];
  if(degree===1) return [-c[0]/c[1]];
  const derivative=c.slice(1).map((value,i)=>value*(i+1));
  const stationary=realRoots(derivative);
  const bound=1+Math.max(...c.slice(0,-1).map(value=>Math.abs(value/c.at(-1))));
  const marks=[-bound,...stationary.filter(value=>value>-bound&&value<bound),bound].sort((a,b)=>a-b),roots=[];
  for(const mark of marks) if(Math.abs(evaluatePolynomial(c,mark))<1e-8*scale) roots.push(mark);
  for(let i=0;i<marks.length-1;i++) {
    let left=marks[i],right=marks[i+1],a=evaluatePolynomial(c,left),b=evaluatePolynomial(c,right);
    if(a*b>=0) continue;
    for(let iteration=0;iteration<90;iteration++) {
      const mid=(left+right)/2,value=evaluatePolynomial(c,mid);
      if(a*value<=0) {right=mid;b=value;} else {left=mid;a=value;}
    }
    roots.push((left+right)/2);
  }
  return roots.sort((a,b)=>a-b).filter((value,i,list)=>i===0||Math.abs(value-list[i-1])>1e-6*Math.max(1,Math.abs(value)));
}
export function affineParameterSystem(A0,At,b0,bu) {
  const n=validate(A0,At,b0,bu);
  const matrix=t=>A0.map((row,i)=>row.map((value,j)=>value+t*At[i][j]));
  const rhs=u=>b0.map((value,i)=>value+u*bu[i]);
  const samples=Array.from({length:n+1},(_,i)=>i),vandermonde=samples.map(t=>Array.from({length:n+1},(_,j)=>t**j));
  const coefficients=luSolve(vandermonde,samples.map(t=>matDet(matrix(t)))).solution;
  const scale=Math.max(...coefficients.map(Math.abs));
  if(scale<1e-12) return {status:'singular_for_all_t',determinantCoefficients:coefficients,
    reason:'det A(t)≈0 para todos los valores muestreados; se requiere análisis simbólico adicional'};
  const critical=realRoots(coefficients).map(t=>{
    const A=matrix(t),leftKernel=matGauss(A[0].map((_,i)=>A.map(row=>row[i])),Array(n).fill(0)).nullspace;
    const conditions=leftKernel.map(vector=>({constant:dot(vector,b0),coefficient:dot(vector,bu)}));
    let compatibleU=null,compatibility='all';
    for(const {constant,coefficient} of conditions) {
      if(Math.abs(coefficient)<1e-9) {if(Math.abs(constant)>1e-9) compatibility='none';}
      else {
        const candidate=-constant/coefficient;
        if(compatibleU!==null&&Math.abs(candidate-compatibleU)>1e-7*Math.max(1,Math.abs(candidate))) compatibility='none';
        else compatibleU=candidate;
      }
    }
    if(compatibility!=='none'&&compatibleU!==null) compatibility='only_at_u';
    const example=compatibility==='none'?null:matGauss(A,rhs(compatibleU??0));
    return {t,rankA:example?.rankA??matGauss(A,Array(n).fill(0)).rankA,compatibility,compatibleU,
      conditions,solutionAtCompatible:example?.particular??null,nullspace:example?.nullspace??[]};
  });
  let genericT=0;
  while(critical.some(item=>Math.abs(item.t-genericT)<1e-6)) genericT++;
  const generic=matGauss(matrix(genericT),rhs(0));
  return {status:'classified',determinantCoefficients:coefficients,critical,generic:{t:genericT,u:0,status:generic.status,solution:generic.particular},
    formula:'A(t)=A₀+tAₜ, b(u)=b₀+ubᵤ; det A(t)≠0 ⇒ solución única; det=0 ⇒ compara rango y condiciones de compatibilidad'};
}

export function similarityMatrix(first,second) {
  const A=diagonalizeReal(first),B=diagonalizeReal(second);
  if(A.status!=='diagonalized'||B.status!=='diagonalized') return {status:'unsupported',reason:'Ambas matrices necesitan bases de autovectores reales verificadas'};
  const n=A.D.length;
  if(n!==B.D.length) throw new RangeError('Matrices de dimensiones diferentes');
  const sortedA=A.eigenpairs.map((pair,i)=>({value:pair.lam,vector:A.P.map(row=>row[i])})).sort((a,b)=>a.value-b.value);
  const sortedB=B.eigenpairs.map((pair,i)=>({value:pair.lam,vector:B.P.map(row=>row[i])})).sort((a,b)=>a.value-b.value);
  if(sortedA.some((pair,i)=>Math.abs(pair.value-sortedB[i].value)>1e-7*Math.max(1,Math.abs(pair.value)))) return {status:'not_similar',reason:'Los espectros reales difieren'};
  const SA=first.map((_,i)=>sortedA.map(pair=>pair.vector[i]));
  const SB=second.map((_,i)=>sortedB.map(pair=>pair.vector[i]));
  const inverse=matInv(SB);
  if(!inverse) return {status:'unsupported',reason:'Base espectral numéricamente singular'};
  const P=matMul(SA,inverse),inverseP=matInv(P);
  if(!inverseP) return {status:'unsupported',reason:'Cambio de base singular'};
  const AP=matMul(first,P),PB=matMul(P,second);
  const residual=Math.max(...AP.flatMap((row,i)=>row.map((value,j)=>Math.abs(value-PB[i][j]))));
  if(residual>1e-7*Math.max(1,...first.flat().map(Math.abs))) return {status:'unsupported',reason:'La identidad AP=PB no se verifica',residual};
  return {status:'similar',P,inverseP,residual,formula:'B=P⁻¹AP; verificación equivalente AP=PB'};
}
