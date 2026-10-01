import { realPolynomialRoots } from './polynomial.mjs';
// Álgebra lineal: matrices independientes del navegador.

export function matMul(A, B) {
  const rows = A.length;
  const shared = A[0].length;
  const cols = B[0].length;
  if (shared !== B.length) return null;

  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) =>
      A[i].reduce((sum, _, p) => sum + A[i][p] * B[p][j], 0)
    )
  );
}

export function matAdd(A, B, sign = 1) {
  if (A.length !== B.length || A[0].length !== B[0].length) return null;
  return A.map((row, i) => row.map((value, j) => value + sign * B[i][j]));
}

export function matScale(A, scalar) {
  return A.map(row => row.map(value => value * scalar));
}

export function matTranspose(A) {
  return A[0].map((_, j) => A.map(row => row[j]));
}

export function matDet(M) {
  const n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];

  let det = 0;
  for (let col = 0; col < n; col++) {
    const minor = M.slice(1).map(row => [
      ...row.slice(0, col),
      ...row.slice(col + 1),
    ]);
    det += (col % 2 === 0 ? 1 : -1) * M[0][col] * matDet(minor);
  }
  return det;
}

export function matInv(M) {
  const n = M.length;
  const augmented = M.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0),
  ]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

    const pivot = augmented[col][col];
    if (Math.abs(pivot) < 1e-12) return null;
    for (let j = 0; j < 2 * n; j++) augmented[col][j] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = 0; j < 2 * n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  return augmented.map(row => row.slice(n));
}

function fGcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){[a,b]=[b,a%b];}return a||1;}
function fSimp([n,d]){if(d===0)return[n,d];const g=fGcd(Math.abs(n),Math.abs(d));const s=d<0?-1:1;return[s*n/g,s*d/g];}
export function toFrac2(x){
  // convert float to exact fraction via continued fractions
  if(!isFinite(x))return[x>0?1:-1,0];
  const sign=x<0?-1:1;x=Math.abs(x);
  const maxIter=20,eps=1e-9;
  let [n0,d0,n1,d1]=[1,0,0,1];
  let rem=x;
  for(let i=0;i<maxIter;i++){
    const a=Math.floor(rem);
    [n0,n1]=[a*n0+n1,n0];
    [d0,d1]=[a*d0+d1,d0];
    const frac=rem-a;
    if(frac<eps)break;
    rem=1/frac;
  }
  return fSimp([sign*n0,d0]);
}
export function matGauss(A,b) {
  const rows=A.length, cols=A[0]?.length;
  if(!rows||!cols||A.some(row=>row.length!==cols)||b.length!==rows
    ||A.some(row=>row.some(v=>!Number.isFinite(v)))||b.some(v=>!Number.isFinite(v))){
    throw new RangeError('Matriz o vector de términos inválidos');
  }
  const steps=[], pivots=[];
  const display=v=>String(Number(v.toPrecision(8)));
  const aug=A.map((row,i)=>{
    const rowScale=Math.max(...row.map(Math.abs))||Math.abs(b[i])||1;
    if(rowScale!==1)steps.push(`F${i+1} ← F${i+1} / ${display(rowScale)} (escala inicial)`);
    const scaled=[...row.map(v=>v/rowScale),b[i]/rowScale];
    if(scaled.some(v=>!Number.isFinite(v)))throw new RangeError('El sistema supera el rango numérico');
    return scaled;
  });
  const rhsMagnitude=aug.map(row=>Math.abs(row[cols]));
  const tolA=1e-10;
  let rank=0;
  for(let col=0;col<cols&&rank<rows;col++){
    let maxRow=rank;
    for(let r=rank+1;r<rows;r++) if(Math.abs(aug[r][col])>Math.abs(aug[maxRow][col])) maxRow=r;
    if(Math.abs(aug[maxRow][col])<=tolA) continue;
    if(maxRow!==rank){
      [aug[rank],aug[maxRow]]=[aug[maxRow],aug[rank]];
      [rhsMagnitude[rank],rhsMagnitude[maxRow]]=[rhsMagnitude[maxRow],rhsMagnitude[rank]];
      steps.push(`F${rank+1} ↔ F${maxRow+1}`);
    }
    const pivot=aug[rank][col];
    for(let j=col;j<=cols;j++) aug[rank][j]/=pivot;
    rhsMagnitude[rank]/=Math.abs(pivot);
    steps.push(`F${rank+1} ← F${rank+1} / ${display(pivot)}`);
    for(let r=0;r<rows;r++){
      if(r===rank||Math.abs(aug[r][col])<=tolA) continue;
      const factor=aug[r][col];
      for(let j=col;j<=cols;j++) aug[r][j]-=factor*aug[rank][j];
      rhsMagnitude[r]+=Math.abs(factor)*rhsMagnitude[rank];
      steps.push(`F${r+1} ← F${r+1} − (${display(factor)})·F${rank+1}`);
    }
    pivots.push(col);
    rank++;
  }
  if(aug.flat().some(v=>!Number.isFinite(v)))throw new RangeError('El sistema supera el rango numérico');
  for(const [i,row]of aug.entries()) {
    for(let j=0;j<cols;j++)if(Math.abs(row[j])<=tolA)row[j]=0;
    if(row.slice(0,cols).every(v=>v===0)&&Math.abs(row[cols])<=1e-10*rhsMagnitude[i])row[cols]=0;
  }
  const inconsistent=aug.some(row=>row.slice(0,cols).every(v=>v===0)&&row[cols]!==0);
  const status=inconsistent?'inconsistent':rank===cols?'unique':'infinite';
  const free=Array.from({length:cols},(_,i)=>i).filter(i=>!pivots.includes(i));
  const particular=status==='inconsistent'?null:Array(cols).fill(0);
  if(particular) pivots.forEach((col,i)=>{particular[col]=aug[i][cols];});
  const nullspace=free.map(freeCol=>{
    const vector=Array(cols).fill(0);
    vector[freeCol]=1;
    pivots.forEach((col,i)=>{vector[col]=-aug[i][freeCol];});
    return vector;
  });
  return {
    sol:status==='unique'?particular.map(toFrac2):null,
    status, inconsistent, rankA:rank, rankAug:rank+(inconsistent?1:0),
    pivots, free, particular, nullspace, rref:aug, steps, isFrac:true, tolerance:tolA,
    residual:particular?Math.max(...A.map((row,i)=>Math.abs(row.reduce((sum,v,j)=>sum+v*particular[j],0)-b[i]))):null,
  };
}
export function matSpace(A) {
  const rows = A.length;
  const cols = A[0]?.length;
  const reduced = matGauss(A, Array(rows).fill(0));
  const rank = reduced.rankA;
  return {
    rows, cols, rank, nullity:cols-rank,
    pivots:reduced.pivots,
    free:reduced.free,
    rowBasis:reduced.rref.slice(0,rank).map(row=>row.slice(0,cols)),
    columnBasis:reduced.pivots.map(col=>A.map(row=>row[col])),
    kernelBasis:reduced.nullspace,
    rref:reduced.rref.map(row=>row.slice(0,cols)),
    steps:reduced.steps,
  };
}
export function matCramer(A,b) {
  if(!A.length||A.some(row=>row.length!==A.length)||b.length!==A.length) return null;
  const n=A.length,detA=matDet(A);
  if(Math.abs(detA)<1e-12) return null;
  return b.map((_,i)=>{
    const Ai=A.map((row,r)=>row.map((v,c)=>c===i?b[r]:v));
    return matDet(Ai)/detA;
  });
}

function eigenResidual(M, lam, vec) {
  return Math.hypot(...M.map((row,i)=>row.reduce((sum,v,j)=>sum+v*vec[j],0)-lam*vec[i]));
}

function normalizeEigenvector(vec) {
  const norm=Math.hypot(...vec);
  return norm===0?null:vec.map(v=>v/norm);
}

// Power iteration returns only a dominant candidate. The residual tells the UI
// whether the iteration actually found an eigenpair.
export function matPowerIter(M,maxIter=200) {
  const n=M.length;
  if(!n||M.some(row=>row.length!==n||row.some(v=>!Number.isFinite(v)))) throw new RangeError('Matriz cuadrada inválida');
  let v=normalizeEigenvector(Array.from({length:n},(_,i)=>i+1));
  const scale=Math.max(1,...M.flat().map(Math.abs));
  for(let iter=1;iter<=maxIter;iter++){
    const mv=M.map(row=>row.reduce((sum,value,j)=>sum+value*v[j],0));
    const next=normalizeEigenvector(mv);
    if(!next){
      const residual=eigenResidual(M,0,v);
      return {lam:0,vec:v,residual,iterations:iter,converged:residual<=1e-9*scale};
    }
    v=next;
    const product=M.map(row=>row.reduce((sum,value,j)=>sum+value*v[j],0));
    const lam=product.reduce((sum,value,i)=>sum+value*v[i],0);
    const residual=eigenResidual(M,lam,v);
    if(residual<=1e-9*scale) return {lam,vec:v,residual,iterations:iter,converged:true};
    if(iter===maxIter) return {lam,vec:v,residual,iterations:iter,converged:false};
  }
  throw new RangeError('Se requiere al menos una iteración');
}

function symmetricEigenpairs(M) {
  const n=M.length;
  const a=M.map(row=>[...row]);
  const vectors=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
  const scale=Math.max(1,...M.flat().map(Math.abs));
  let iterations=0, maxOff=Infinity;
  while(iterations<50*n*n){
    let p=0,q=1;
    maxOff=0;
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
      if(Math.abs(a[i][j])>maxOff){maxOff=Math.abs(a[i][j]);p=i;q=j;}
    }
    if(maxOff<=1e-12*scale) break;
    const tau=(a[q][q]-a[p][p])/(2*a[p][q]);
    const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.sqrt(1+tau*tau));
    const cosine=1/Math.sqrt(1+t*t), sine=t*cosine;
    const app=a[p][p], aqq=a[q][q], apq=a[p][q];
    a[p][p]=app-t*apq;
    a[q][q]=aqq+t*apq;
    a[p][q]=a[q][p]=0;
    for(let k=0;k<n;k++){
      if(k!==p&&k!==q){
        const akp=a[k][p], akq=a[k][q];
        a[k][p]=a[p][k]=cosine*akp-sine*akq;
        a[k][q]=a[q][k]=sine*akp+cosine*akq;
      }
      const vkp=vectors[k][p], vkq=vectors[k][q];
      vectors[k][p]=cosine*vkp-sine*vkq;
      vectors[k][q]=sine*vkp+cosine*vkq;
    }
    iterations++;
  }
  return Array.from({length:n},(_,col)=>{
    const lam=a[col][col], vec=vectors.map(row=>row[col]);
    const residual=eigenResidual(M,lam,vec);
    return {lam,vec,residual,iterations,converged:residual<=1e-9*scale,method:'Jacobi'};
  }).sort((a,b)=>b.lam-a.lam);
}

function twoByTwoEigenpairs(M) {
  const [[a,b],[c,d]]=M;
  const disc=(a-d)**2+4*b*c;
  const pairs=[];
  if(disc<0) return pairs;
  const roots=disc===0?[(a+d)/2]:[(a+d+Math.sqrt(disc))/2,(a+d-Math.sqrt(disc))/2];
  for(const lam of roots){
    const vector=Math.abs(b)>=Math.abs(c)?[b,lam-a]:[lam-d,c];
    const vec=normalizeEigenvector(vector)||[1,0];
    const residual=eigenResidual(M,lam,vec);
    pairs.push({lam,vec,residual,iterations:0,converged:residual<=1e-9,method:'fórmula 2×2'});
  }
  return pairs;
}

export function matEigenAll(M) {
  const n=M.length;
  if(!n||M.some(row=>row.length!==n||row.some(v=>!Number.isFinite(v)))) throw new RangeError('Matriz cuadrada inválida');
  if(n===1) return [{lam:M[0][0],vec:[1],residual:0,iterations:0,converged:true,method:'directo'}];
  const symmetric=M.every((row,i)=>row.every((value,j)=>Math.abs(value-M[j][i])<=1e-12));
  if(symmetric) return symmetricEigenpairs(M);
  if(n===2){
    const pairs=twoByTwoEigenpairs(M);
    if(!pairs.length) pairs.message='Autovalores complejos: esta vista solo muestra pares reales.';
    else if(pairs.length===1) pairs.message='Valor propio doble con un solo vector propio independiente; no es diagonalizable.';
    return pairs;
  }
  if(n===3) {
    const tr=M[0][0]+M[1][1]+M[2][2];
    const minors=M[0][0]*M[1][1]-M[0][1]*M[1][0]+M[0][0]*M[2][2]-M[0][2]*M[2][0]+M[1][1]*M[2][2]-M[1][2]*M[2][1];
    const characteristic=[-matDet(M),minors,-tr,1],pairs=[];
    let rootIterations=0;
    const roots=realPolynomialRoots(characteristic,{onIteration:()=>rootIterations++}).sort((a,b)=>b-a);
    const scale=Math.max(1,...M.flat().map(Math.abs));
    for(const lam of roots) {
      const shifted=M.map((row,i)=>row.map((v,j)=>{const entry=v-(i===j?lam:0);return Math.abs(entry)<=1e-10*scale?0:entry;}));
      const kernel=matGauss(shifted,[0,0,0]).nullspace;
      // Repeat only independent eigenvectors; geometric multiplicity is explicit.
      for(const basis of kernel) {
        const vec=normalizeEigenvector(basis),residual=eigenResidual(M,lam,vec);
        pairs.push({lam,vec,residual,iterations:rootIterations,rootTolerance:1e-13,maxIterationsPerInterval:160,converged:residual<=1e-8*scale,method:'polinomio característico 3×3 y núcleo',geometricMultiplicity:kernel.length});
      }
    }
    pairs.characteristic=characteristic;
    if(pairs.length!==n)pairs.message='No se obtuvieron tres autovectores reales independientes; pueden existir autovalores complejos, defectos o raíces numéricamente no separadas. No se declara diagonalización.';
    return pairs;
  }
  const pair=matPowerIter(M);
  const pairs=[pair];
  pairs.message='Matriz no simétrica: solo se calcula el par dominante; no se infieren los demás por deflación.';
  return pairs;
}

// Desarrollo visible de cofactores, con tamaño acotado por la interfaz.
export function determinantExpansion(matrix,row=0) {
  const n=matrix?.length;
  if(!Number.isInteger(n)||n<1||n>5||!Number.isInteger(row)||row<0||row>=n||matrix.some(r=>!Array.isArray(r)||r.length!==n||r.some(x=>!Number.isFinite(x))))throw new RangeError('Matriz cuadrada finita de orden 1–5 y fila válida');
  if(n===1)return {value:matrix[0][0],row,terms:[],formula:'det[a]=a.'};
  const terms=matrix[row].map((coefficient,column)=>{
    const minor=matrix.filter((_,i)=>i!==row).map(r=>r.filter((_,j)=>j!==column)),minorDeterminant=matDet(minor),sign=(row+column)%2?-1:1;
    return {column,coefficient,sign,minor,minorDeterminant,contribution:sign*coefficient*minorDeterminant};
  });
  const value=terms.reduce((sum,t)=>sum+t.contribution,0);
  if(!Number.isFinite(value)||terms.some(t=>!Number.isFinite(t.contribution)))throw new RangeError('El determinante supera el rango numérico');
  return {value,row,terms,formula:'det A = Σⱼ (−1)^(i+j) aᵢⱼ det Mᵢⱼ.'};
}
export function inverseGaussJordan(matrix) {
  const n=matrix?.length;
  if(!Number.isInteger(n)||n<1||n>5||matrix.some(r=>!Array.isArray(r)||r.length!==n||r.some(x=>!Number.isFinite(x))))throw new RangeError('Matriz cuadrada finita de orden 1–5');
  const results=Array.from({length:n},(_,j)=>matGauss(matrix,Array.from({length:n},(_,i)=>i===j?1:0)));
  if(results.some(r=>r.status!=='unique'))return {status:'singular',steps:results[0].steps,formula:'Reducir [A|I] a [I|A⁻¹]; se requieren n pivotes.'};
  const inverse=matrix.map((_,i)=>results.map(r=>r.particular[i]));
  const check=matMul(matrix,inverse),residual=Math.max(...check.flatMap((row,i)=>row.map((v,j)=>Math.abs(v-(i===j?1:0)))));
  if(!Number.isFinite(residual))throw new RangeError('La inversa supera el rango numérico');
  return {status:'inverted',inverse,steps:results[0].steps,augmented:matrix.map((_,i)=>[...Array.from({length:n},(_,j)=>i===j?1:0),...inverse[i]]),residual,
    formula:'Las operaciones de Gauss-Jordan sobre A se aplican a todas las columnas de I: [A|I] → [I|A⁻¹].'};
}
