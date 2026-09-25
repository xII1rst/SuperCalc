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
function fAdd([an,ad],[bn,bd]){return fSimp([an*bd+bn*ad,ad*bd]);}
function fSub([an,ad],[bn,bd]){return fSimp([an*bd-bn*ad,ad*bd]);}
function fMul([an,ad],[bn,bd]){return fSimp([an*bn,ad*bd]);}
function fDiv([an,ad],[bn,bd]){return fSimp([an*bd,ad*bn]);}
function fractionString([n,d]) { return d===0 ? '∞' : d===1 ? `${n}` : `${n}/${d}`; }
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
  const n=A.length;
  // Convert to fractions
  const aug=A.map((row,i)=>[...row,b[i]].map(v=>toFrac2(v)));
  const steps=[];
  for(let col=0;col<n;col++){
    // Partial pivot by absolute value of numerator/denominator
    let maxR=col;
    for(let r=col+1;r<n;r++){
      const [an,ad]=aug[r][col],[bn,bd]=aug[maxR][col];
      if(Math.abs(an/ad)>Math.abs(bn/bd)) maxR=r;
    }
    if(maxR!==col){ [aug[col],aug[maxR]]=[aug[maxR],aug[col]]; steps.push(`Swap F${col+1} ↔ F${maxR+1}`); }
    const piv=aug[col][col];
    if(Math.abs(piv[0]/piv[1])<1e-12) return {sol:null,steps,inconsistent:true};
    for(let r=0;r<n;r++) if(r!==col){
      const f=fDiv(aug[r][col],piv);
      if(Math.abs(f[0]/f[1])<1e-12) continue;
      for(let j=col;j<=n;j++) aug[r][j]=fSub(aug[r][j],fMul(f,aug[col][j]));
      steps.push(`F${r+1} ← F${r+1} − (${fractionString(f)})·F${col+1}`);
    }
    steps.push(`Pivote col ${col+1}: ${fractionString(piv)}`);
  }
  const sol=aug.map((row,i)=>fDiv(row[n],row[i]));
  return {sol,steps,inconsistent:false,isFrac:true};
}
export function matCramer(A,b) {
  const n=A.length,detA=matDet(A);
  if(Math.abs(detA)<1e-12) return null;
  return b.map((_,i)=>{
    const Ai=A.map((row,r)=>row.map((v,c)=>c===i?b[r]:v));
    return matDet(Ai)/detA;
  });
}

// Power iteration for dominant eigenvalue
export function matPowerIter(M,maxIter=200) {
  const n=M.length;
  let v=Array(n).fill(0).map(()=>Math.random()*2-1);
  let norm=Math.sqrt(v.reduce((s,x)=>s+x*x,0));
  if(norm===0){ v[0]=1; norm=1; }
  v=v.map(x=>x/norm);
  let lam=0;
  for(let iter=0;iter<maxIter;iter++){
    const Mv=M.map(row=>row.reduce((s,val,j)=>s+val*v[j],0));
    const newNorm=Math.sqrt(Mv.reduce((s,x)=>s+x*x,0));
    if(newNorm===0) return {lam:0,vec:v};
    lam=Mv.reduce((s,x,i)=>s+x*v[i],0);
    v=Mv.map(x=>x/newNorm);
  }
  return {lam,vec:v};
}
function matDeflate(M,lam,vec) {
  const n=M.length;
  const norm2=vec.reduce((s,x)=>s+x*x,0);
  return M.map((row,i)=>row.map((v,j)=>v-lam*vec[i]*vec[j]/norm2));
}
export function matEigenAll(M) {
  const n=M.length;
  const pairs=[];
  let Mcur=M.map(r=>[...r]);
  for(let k=0;k<n;k++){
    const {lam,vec}=matPowerIter(Mcur);
    pairs.push({lam,vec});
    Mcur=matDeflate(Mcur,lam,vec);
  }
  return pairs;
}
