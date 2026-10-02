import { tokenize, parseExpr } from '../calculus/parser.mjs';
import { matEigenAll, matGauss, matInv, matMul, matSpace } from './matrix.mjs';

const EPS = 1e-9;

function finiteVector(value, label = 'Vector') {
  if (!Array.isArray(value) || !value.length || value.some(number => typeof number !== 'number' || !Number.isFinite(number))) {
    throw new RangeError(`${label} debe contener números finitos`);
  }
  return [...value];
}

function finiteMatrix(value, label = 'Matriz') {
  if (!Array.isArray(value) || !value.length || !Array.isArray(value[0]) || !value[0].length) {
    throw new RangeError(`${label} debe tener filas y columnas`);
  }
  const columns = value[0].length;
  if (value.some(row => !Array.isArray(row) || row.length !== columns || row.some(number => typeof number !== 'number' || !Number.isFinite(number)))) {
    throw new RangeError(`${label} debe ser rectangular y finita`);
  }
  return value.map(row => [...row]);
}

const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
const norm = vector => Math.hypot(...vector);
const columnMatrix = vectors => vectors[0].map((_, row) => vectors.map(vector => vector[row]));
const maxAbs = matrix => Math.max(1, ...matrix.flat().map(Math.abs));

export function gramSchmidt(vectors) {
  if (!Array.isArray(vectors) || !vectors.length) throw new RangeError('Introduce al menos un vector');
  const input = vectors.map((vector, index) => finiteVector(vector, `Vector ${index + 1}`));
  const dimension = input[0].length;
  if (input.some(vector => vector.length !== dimension)) throw new RangeError('Todos los vectores deben tener la misma dimensión');
  if (dimension > 8 || input.length > 8) throw new RangeError('Máximo 8 vectores de dimensión 8');
  const orthogonal = [], orthonormal = [], steps = [], dependent = [];
  for (const [index, vector] of input.entries()) {
    const inputScale=Math.max(...vector.map(Math.abs)),projections=[];
    if(inputScale===0){dependent.push(index);steps.push({index,vector,projections,status:'dependent'});continue;}
    let scaledRemainder=vector.map(value=>value/inputScale);
    for(const [i,unit]of orthonormal.entries()) {
      const coefficient=dot(scaledRemainder,unit);
      projections.push(coefficient*inputScale/norm(orthogonal[i]));
      scaledRemainder=scaledRemainder.map((value,j)=>value-coefficient*unit[j]);
    }
    const scaledLength=norm(scaledRemainder),tolerance=EPS*norm(vector.map(value=>value/inputScale));
    if(scaledLength<=tolerance){dependent.push(index);steps.push({index,vector,projections,status:'dependent'});continue;}
    const remainder=scaledRemainder.map(value=>value*inputScale),length=scaledLength*inputScale;
    if(!Number.isFinite(length)||remainder.some(value=>!Number.isFinite(value)))throw new RangeError('Gram-Schmidt supera el rango numérico');
    orthogonal.push(remainder);
    orthonormal.push(scaledRemainder.map(value=>value/scaledLength));
    steps.push({index, vector, projections, orthogonal:remainder, length, status:'independent'});
  }
  return {dimension, rank:orthogonal.length, independent:dependent.length === 0,
    orthogonal, orthonormal, dependent, steps};
}

export function coordinatesInBasis(basis, vector) {
  const vectors = basis.map((item, index) => finiteVector(item, `Vector de base ${index + 1}`));
  const target = finiteVector(vector, 'Vector objetivo');
  if (vectors.length !== target.length || vectors.some(item => item.length !== target.length)) {
    throw new RangeError('La base debe tener n vectores de dimensión n');
  }
  const matrix = columnMatrix(vectors);
  const solution = matGauss(matrix, target);
  if (solution.status !== 'unique') throw new RangeError('Los vectores dados no forman una base');
  return {coordinates:solution.particular, steps:solution.steps, matrix};
}

export function changeOfBasis(fromBasis, toBasis) {
  if (!Array.isArray(fromBasis) || !fromBasis.length || !Array.isArray(toBasis) || !toBasis.length) {
    throw new RangeError('Introduce ambas bases');
  }
  const n = fromBasis.length;
  if (toBasis.length !== n) throw new RangeError('Las bases deben tener la misma dimensión');
  const firstVectors = fromBasis.map((v,i)=>finiteVector(v,`Vector ${i+1} de la primera base`));
  const secondVectors = toBasis.map((v,i)=>finiteVector(v,`Vector ${i+1} de la segunda base`));
  if (firstVectors.some(vector=>vector.length!==n) || secondVectors.some(vector=>vector.length!==n)) {
    throw new RangeError('Cada base debe tener n vectores de dimensión n');
  }
  const from = columnMatrix(firstVectors);
  const to = columnMatrix(secondVectors);
  const inverse = matInv(to);
  if (!inverse || !matInv(from)) throw new RangeError('Algún conjunto de vectores no es una base');
  const matrix = matMul(inverse, from);
  const verification = matMul(to, matrix);
  const residual = Math.max(...from.flatMap((row,i)=>row.map((value,j)=>Math.abs(value-verification[i][j]))));
  return {matrix, from, to, residual, formula:'[v]₂ = B₂⁻¹ B₁ [v]₁'};
}

export function projectOntoSpan(vector, generators) {
  const target = finiteVector(vector, 'Vector objetivo');
  const result = gramSchmidt(generators);
  if (result.dimension !== target.length) throw new RangeError('Los generadores y el vector deben tener la misma dimensión');
  const coefficients = result.orthonormal.map(unit => dot(target, unit));
  const projection = target.map((_, index) => coefficients.reduce((sum, coefficient, i) => sum + coefficient * result.orthonormal[i][index], 0));
  const residual = target.map((value, index) => value - projection[index]);
  return {...result, target, coefficients, projection, residual, distance:norm(residual)};
}

export function linearTransformation(matrix, vector) {
  const A = finiteMatrix(matrix);
  const x = finiteVector(vector);
  if (A[0].length !== x.length) throw new RangeError('El vector debe tener tantas coordenadas como columnas de A');
  return {output:A.map(row=>dot(row,x)), spaces:matSpace(A)};
}

export function representationInBases(matrix, domainBasis, codomainBasis) {
  const A = finiteMatrix(matrix);
  const domain = changeOfBasis(domainBasis, Array.from({length:A[0].length},(_,i)=>Array.from({length:A[0].length},(_,j)=>i===j?1:0)));
  const codomain = changeOfBasis(codomainBasis, Array.from({length:A.length},(_,i)=>Array.from({length:A.length},(_,j)=>i===j?1:0)));
  if (domain.matrix.length !== A[0].length || codomain.matrix.length !== A.length) throw new RangeError('Dimensiones de bases incompatibles con A');
  const inverse = matInv(codomain.matrix);
  const represented = matMul(matMul(inverse,A),domain.matrix);
  return {matrix:represented, formula:'[T]ᶜᵦ = C⁻¹ A B'};
}

export function diagonalizeReal(matrix) {
  const A = finiteMatrix(matrix);
  const n = A.length;
  if (A.some(row=>row.length!==n) || n>4) throw new RangeError('Diagonalización disponible para matrices cuadradas hasta 4×4');
  const pairs = matEigenAll(A);
  if (pairs.length !== n || pairs.some(pair=>!pair.converged)) {
    return {status:'unsupported', reason:pairs.message || 'No hay n autovectores reales verificados'};
  }
  const P = columnMatrix(pairs.map(pair=>pair.vec));
  const inverse = matInv(P);
  if (!inverse) return {status:'not_diagonalizable', reason:'Los autovectores no son linealmente independientes'};
  const D = Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?pairs[i].lam:0));
  const AP = matMul(A,P), PD = matMul(P,D);
  const residual = Math.max(...AP.flatMap((row,i)=>row.map((value,j)=>Math.abs(value-PD[i][j]))));
  if (residual > EPS*maxAbs(A)) return {status:'unsupported', reason:'El residuo AP − PD es demasiado grande', residual};
  return {status:'diagonalized', P, D, inverse, eigenpairs:pairs, residual};
}

export function matrixPowerByDiagonalization(matrix, exponent) {
  if (!Number.isInteger(exponent) || exponent<0 || exponent>50) throw new RangeError('El exponente debe ser entero entre 0 y 50');
  const result = diagonalizeReal(matrix);
  if (result.status !== 'diagonalized') return result;
  const powered = result.D.map((row,i)=>row.map((_,j)=>i===j?result.D[i][i]**exponent:0));
  const value = matMul(matMul(result.P,powered),result.inverse);
  if (value.flat().some(number=>!Number.isFinite(number))) throw new RangeError('El resultado supera el rango numérico');
  return {...result, exponent, value, formula:'Aᵏ = P Dᵏ P⁻¹'};
}

export function spanMembership(generators,vector) {
  const rows=finiteMatrix(generators,'Generadores'),target=finiteVector(vector,'Vector objetivo');
  if(rows.length>8||target.length>8||rows[0].length!==target.length)throw new RangeError('Hasta 8 generadores de la misma dimensión que el objetivo');
  const A=columnMatrix(rows),solution=matGauss(A,target),spaces=matSpace(A);
  return {matrix:A,belongs:solution.status!=='inconsistent',independent:spaces.rank===rows.length,isBasis:rows.length===target.length&&spaces.rank===target.length,
    coefficients:solution.particular,coefficientDirections:solution.nullspace,rank:spaces.rank,dimension:target.length,solution,
    steps:['Colocar generadores como columnas y resolver Gc=v.','Existe combinación si rango(G)=rango([G|v]); independencia si rango(G)=número de generadores.'],formula:'v=Σ cᵢgᵢ.'};
}
export function homogeneousSubspace(matrix,rhs=null) {
  const A=finiteMatrix(matrix);if(A.length>8||A[0].length>8)throw new RangeError('Máximo 8×8');
  const b=rhs===null?Array(A.length).fill(0):finiteVector(rhs,'Vector b');
  if(b.length!==A.length)throw new RangeError('b debe tener tantas entradas como filas de A');
  const homogeneous=b.every(x=>x===0),spaces=matSpace(A);
  if(!homogeneous)return {isSubspace:false,spaces,steps:['A·0=0 y b≠0: el vector cero no pertenece a {x: Ax=b}.','Falla una condición necesaria de subespacio, incluso si el sistema es incompatible.'],formula:'Ax=b; b≠0.'};
  return {isSubspace:true,spaces,steps:['A·0=0: el cero pertenece a W.','Si Au=Av=0, A(u+v)=Au+Av=0: cierre bajo suma.','Si Au=0 y α∈ℝ, A(αu)=αAu=0: cierre bajo escalares.','W=ker(A); los vectores libres de RREF dan una base y dim W=n−rango(A).'],formula:'W={x∈ℝⁿ:Ax=0}=ker(A).'};
}
export function determinantIdentities(determinant,order,scalar,power) {
  if(!Number.isFinite(determinant)||!Number.isFinite(scalar)||!Number.isInteger(order)||order<1||order>8||!Number.isInteger(power)||power<0||power>50)throw new RangeError('det/k finitos, orden 1–8 y potencia 0–50');
  const values={scaled:scalar**order*determinant,inverse:determinant===0?null:1/determinant,powered:determinant**power,transpose:determinant,adjugate:order===1?1:determinant**(order-1)};
  if(Object.values(values).some(x=>x!==null&&!Number.isFinite(x)))throw new RangeError('Identidades fuera del rango numérico');
  return {values,steps:[`det(kA)=k^n det A: n=${order},k=${scalar}.`,'det(A⁻¹)=1/det A solo si det A≠0.',`det(A^p)=(det A)^p: p=${power}.`,'det(Aᵀ)=det A.','det(adj A)=(det A)^(n−1); para n=1 adj A=[1].'],assumption:'Solo se necesita det A y el orden; A cuadrada.'};
}
export function repeatedEigenvalueParameter(a,d,c) {
  if(![a,d,c].every(Number.isFinite))throw new RangeError('Coeficientes finitos requeridos');
  const difference=a-d,lambda=(a+d)/2;
  if(!Number.isFinite(difference)||!Number.isFinite(lambda))throw new RangeError('Resultado fuera del rango numérico');
  if(c===0)return {status:a===d?'todo k real':'ningún k real',lambda:a===d?lambda:null,steps:['Δ=(a−d)²+4ck; si c=0 no depende de k.'],assumption:a===d?'k=0: matriz escalar, dos direcciones; k≠0: un solo autovector independiente.':'a≠d: valores propios distintos para cualquier k.'};
  const k=-(difference**2)/(4*c);if(!Number.isFinite(k))throw new RangeError('Parámetro fuera del rango numérico');
  const A=[[a,k],[c,d]],spaces=matSpace(A.map((row,i)=>row.map((v,j)=>v-(i===j?lambda:0))));
  return {status:'parámetro único',k,lambda,matrix:A,eigenspace:spaces.kernelBasis,geometricMultiplicity:spaces.nullity,
    steps:['χ(λ)=λ²−(a+d)λ+(ad−ck).','Δ=(a−d)²+4ck=0 ⇒ k=−(a−d)²/(4c).','Valor doble λ=(a+d)/2; dimensión del núcleo de A−λI decide diagonalización.'],assumption:'Familia A=[[a,k],[c,d]], c≠0; valores reales.'};
}
export function orthogonalDiagonalization(matrix) {
  const A=finiteMatrix(matrix),n=A.length;
  if(A.some(row=>row.length!==n))throw new RangeError('Matriz cuadrada requerida');
  const scale=maxAbs(A);
  if(A.some((row,i)=>row.some((v,j)=>Math.abs(v-A[j][i])>1e-12*scale)))throw new RangeError('Diagonalización ortogonal: matriz simétrica real requerida');
  const result=diagonalizeReal(A);if(result.status!=='diagonalized')return result;
  const transpose=result.P[0].map((_,j)=>result.P.map(row=>row[j])),check=matMul(transpose,result.P);
  const orthogonalityResidual=Math.max(...check.flatMap((row,i)=>row.map((v,j)=>Math.abs(v-(i===j?1:0)))));
  if(orthogonalityResidual>1e-8)return {status:'unsupported',reason:'No se verificó PᵀP=I',orthogonalityResidual};
  return {...result,transpose,orthogonalityResidual,formula:'PᵀP=I; PᵀAP=D; A=PDPᵀ.',assumption:'A simétrica real; columnas ortonormales de P.'};
}
export function rotationReflection(angleDegrees,power=1,axis='x') {
  if(!Number.isFinite(angleDegrees)||Math.abs(angleDegrees)>1e6||!Number.isInteger(power)||power<0||power>50||!['x','y'].includes(axis))throw new RangeError('Ángulo finito |θ|≤10⁶°, potencia 0–50 y eje x/y');
  const rotation=degrees=>{const radians=(degrees%360)*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);return [[c,-s],[s,c]];};
  const T=rotation(angleDegrees),S=axis==='x'?[[1,0],[0,-1]]:[[-1,0],[0,1]];
  return {rotation:T,reflection:S,composition:matMul(S,T),powered:rotation(angleDegrees*power),power,
    steps:['Rotación antihoraria: T=[[cosθ,−senθ],[senθ,cosθ]].','S∘T se aplica de derecha a izquierda: su matriz es ST.',`T^${power}=R(${power}θ) por suma de ángulos.`],assumption:`Base canónica de ℝ²; reflexión sobre eje ${axis}; ángulo en grados.`};
}
export function vectorApplications(u,v,a=1,b=1,w=null) {
  u=finiteVector(u,'u');v=finiteVector(v,'v');
  if(![2,3].includes(u.length)||v.length!==u.length||![a,b].every(Number.isFinite))throw new RangeError('Dos vectores de dimensión 2/3 y escalares finitos');
  const result={sum:u.map((x,i)=>x+v[i]),combination:u.map((x,i)=>a*x+b*v[i]),dot:dot(u,v),norm:norm(u),unit:norm(u)===0?null:u.map(x=>x/norm(u))};
  if(u.length===3){result.cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(w!==null){w=finiteVector(w,'w');if(w.length!==3)throw new RangeError('w de dimensión 3');result.signedTriple=dot(result.cross,w);result.volume=Math.abs(result.signedTriple);}}
  if(Object.values(result).flat().some(x=>x!==null&&!Number.isFinite(x)))throw new RangeError('Resultado vectorial fuera del rango numérico');
  return {...result,steps:[`au+bv por componentes, a=${a},b=${b}.`,'u·v=Σuᵢvᵢ; ||u||=√(u·u); unitario=u/||u|| si u≠0.',...(u.length===3?['u×v por cofactores; volumen=|(u×v)·w| si se aporta w.']:[])],assumption:'Vectores reales; el vector cero no tiene unitario.'};
}

// Esta familia se verifica en el AST: no se decide linealidad muestreando puntos.
export function transformationFromExpressions(expressions,variables,vector=null) {
  if(!Array.isArray(expressions)||!expressions.length||expressions.length>8||!Array.isArray(variables)||!variables.length||variables.length>4||new Set(variables).size!==variables.length||variables.some(v=>!['x','y','z','w'].includes(v)))throw new RangeError('1–8 componentes y 1–4 variables distintas entre x,y,z,w');
  const n=variables.length,constant=c=>[c,...Array(n).fill(0)],active=p=>p.slice(1).some(c=>c!==0);
  const walk=node=>{
    if(node.type==='num')return constant(node.val);
    if(node.type==='var'){const index=variables.indexOf(node.val);if(index<0)throw new RangeError('Variable fuera del dominio declarado');const row=constant(0);row[index+1]=1;return row;}
    if(node.type==='neg')return walk(node.arg).map(v=>-v);
    if(node.type==='+'||node.type==='-'){const a=walk(node.left),b=walk(node.right);return a.map((c,i)=>c+(node.type==='+'?1:-1)*b[i]);}
    if(node.type==='*'){const a=walk(node.left),b=walk(node.right);if(active(a)&&active(b))throw new RangeError('Producto de variables: fuera de la familia lineal admitida');return active(a)?a.map(v=>v*b[0]):b.map(v=>v*a[0]);}
    if(node.type==='/'){const a=walk(node.left),b=walk(node.right);if(active(b)||b[0]===0)throw new RangeError('Solo división por constante no nula');return a.map(v=>v/b[0]);}
    if(node.type==='^'&&node.right.type==='num'&&[0,1].includes(node.right.val)){const a=walk(node.left);return node.right.val===0?constant(1):a;}
    throw new RangeError('Familia lineal: sumas y productos por constantes; sin funciones ni potencias variables');
  };
  const rows=expressions.map(expr=>{if(typeof expr!=='string'||expr.length>500)throw new RangeError('Máximo 500 caracteres por componente');const row=walk(parseExpr(tokenize(expr)));if(row.some(c=>!Number.isFinite(c)))throw new RangeError('Coeficientes fuera del rango numérico');if(row[0]!==0)throw new RangeError('T(0)≠0: hay término constante, no es transformación lineal');return row.slice(1);});
  const target=vector===null?Array(n).fill(0):vector,result=linearTransformation(rows,target);
  return {...result,matrix:rows,images:rows[0].map((_,j)=>rows.map(row=>row[j])),steps:['Cada componente se verifica como combinación lineal homogénea en el AST.','Columna j de A = T(eⱼ); T(x)=Ax.'],assumption:'Fórmulas lineales reales declaradas en toda ℝⁿ; no se infiere linealidad de muestras.'};
}
export function transformationFromImages(images,vector=null) {
  const rows=finiteMatrix(images,'Imágenes T(eⱼ)');if(rows.length>8||rows[0].length>8)throw new RangeError('Máximo 8 imágenes de dimensión 8');
  const A=columnMatrix(rows),result=linearTransformation(A,vector===null?Array(rows.length).fill(0):vector);
  return {...result,matrix:A,images:rows,steps:['Colocar cada imagen T(eⱼ) como la columna j de A.','Linealidad dada: T(Σxⱼeⱼ)=ΣxⱼT(eⱼ)=Ax.'],assumption:'Se define la transformación lineal por sus imágenes de la base canónica.'};
}
export function representationFromExpressions(expressions,variables,domainBasis,codomainBasis) {
  const canonical=transformationFromExpressions(expressions,variables);
  const result=representationInBases(canonical.matrix,domainBasis,codomainBasis);
  return {...result,canonical:canonical.matrix,steps:canonical.steps,assumption:canonical.assumption};
}
