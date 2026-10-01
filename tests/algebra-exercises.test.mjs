import test from 'node:test';
import assert from 'node:assert/strict';
import {matMul,matAdd,matDet,matInv,matGauss,matCramer,matEigenAll,matSpace,determinantExpansion,inverseGaussJordan} from '../js/math/algebra/matrix.mjs';
import {lineFromPoints,planeFromPointNormal,pointPlaneDistance,planeFromCoefficients,intersectLinePlane,lineFromPointDirection,planeAngle,intersectPlanes} from '../js/math/algebra/geometry.mjs';
import {gramSchmidt,coordinatesInBasis,changeOfBasis,projectOntoSpan,linearTransformation,representationInBases,diagonalizeReal,matrixPowerByDiagonalization,spanMembership,homogeneousSubspace,determinantIdentities,repeatedEigenvalueParameter,orthogonalDiagonalization,rotationReflection,vectorApplications,transformationFromExpressions,transformationFromImages,representationFromExpressions} from '../js/math/algebra/linear-spaces.mjs';
import {affineParameterSystem,similarityMatrix} from '../js/math/algebra/parameter-systems.mjs';
const near=(a,b,tol=1e-8)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
const vec=(a,b)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i]));};
const matrix=(a,b)=>{assert.equal(a.length,b.length);a.forEach((row,i)=>vec(row,b[i]));};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const mul=(A,v)=>A.map(row=>dot(row,v));
const eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
const transpose=A=>A[0].map((_,j)=>A.map(row=>row[j]));
const solve=(A,b,expected)=>{const r=matGauss(A,b);assert.equal(r.status,'unique');vec(r.particular,expected);vec(mul(A,r.particular),b);assert.ok(r.steps.length);};
const eig=(A,expected)=>{const r=matEigenAll(A);vec(r.map(p=>p.lam),expected);for(const p of r){assert.equal(p.converged,true);vec(mul(A,p.vec),p.vec.map(x=>x*p.lam));near(Math.hypot(...p.vec),1);}return r;};
const diagonal=(A,expected)=>{const r=diagonalizeReal(A);assert.equal(r.status,'diagonalized');vec(r.D.map((row,i)=>row[i]),expected);matrix(matMul(A,r.P),matMul(r.P,r.D));matrix(matMul(r.P,r.inverse),eye(A.length));return r;};
const spaces=(A,rank,nullity)=>{const r=matSpace(A);assert.equal(r.rank,rank);assert.equal(r.nullity,nullity);assert.equal(r.kernelBasis.length,nullity);assert.equal(r.columnBasis.length,rank);r.kernelBasis.forEach(v=>vec(mul(A,v),Array(A.length).fill(0)));assert.equal(matSpace(transpose(r.columnBasis)).rank,rank);return r;};
const u=[2,-1,3],v=[1,4,-2],A5=[[1,2],[3,4]],B5=[[0,1],[-1,2]];
const checks={
  1:()=>{const r=vectorApplications(u,v,3,-2);vec(r.sum,[3,3,1]);vec(r.combination,[4,-11,13]);near(r.dot,-8);},
  2:()=>vec(vectorApplications(u,v).cross,[-10,7,9]),
  3:()=>{const r=lineFromPoints([1,2,3],[4,0,5]);vec(r.point,[1,2,3]);vec(r.direction,[3,-2,2]);},
  4:()=>{const r=planeFromPointNormal([1,2,3],[2,-1,4]);near(r.constant,12);vec(r.normal,[2,-1,4]);},
  5:()=>{matrix(matAdd(A5,B5),[[1,3],[2,6]]);matrix(matMul(A5,B5),[[-2,5],[-4,11]]);matrix(matMul(B5,A5),[[3,4],[5,6]]);},
  6:()=>near(determinantExpansion([[2,1,0],[1,3,1],[0,1,4]]).value,18),
  7:()=>matrix(inverseGaussJordan([[2,1],[5,3]]).inverse,[[3,-1],[-5,2]]),
  8:()=>solve([[2,1],[1,-1]],[5,1],[2,1]),
  9:()=>solve([[1,1,1],[2,-1,1],[1,2,-1]],[6,3,2],[1,2,3]),
  10:()=>vec(matCramer([[3,-2],[1,5]],[4,7]),[2,1]),
  11:()=>spaces([[1,2,3],[2,4,6],[1,0,1]],2,1),
  12:()=>{const r=spanMembership([[1,2],[3,6]],[0,0]);assert.equal(r.independent,false);assert.equal(r.rank,1);},
  13:()=>{const r=spanMembership([[1,0,1],[0,1,1],[1,1,0]],[0,0,0]);assert.equal(r.independent,true);assert.equal(r.isBasis,true);assert.equal(r.rank,3);},
  14:()=>{const r=transformationFromExpressions(['x+y','x-y'],['x','y'],[2,3]);matrix(r.matrix,[[1,1],[1,-1]]);vec(r.output,[5,-1]);assert.equal(r.spaces.nullity,0);assert.equal(r.spaces.kernelBasis.length,0);},
  15:()=>{const r=transformationFromExpressions(['x+2*y','y-z','3*z'],['x','y','z'],[1,2,3]);matrix(r.matrix,[[1,2,0],[0,1,-1],[0,0,3]]);vec(r.output,[5,-1,9]);assert.equal(r.spaces.rank,3);},
  16:()=>eig([[4,1],[2,3]],[5,2]),
  17:()=>{const r=vectorApplications([3,4,12],[0,0,0]);near(r.norm,13);vec(r.unit,[3/13,4/13,12/13]);near(Math.hypot(...r.unit),1);},
  18:()=>near(pointPlaneDistance([1,2,3],planeFromCoefficients([2,-1,2],4)).distance,2/3),
  19:()=>{const r=intersectLinePlane(lineFromPointDirection([1,0,2],[1,1,-1]),planeFromCoefficients([1,2,1],7));near(r.parameter,2);vec(r.point,[3,2,0]);},
  20:()=>{const r=planeAngle(planeFromCoefficients([1,1,1],3),planeFromCoefficients([2,-1,1],5));near(r.cosine,2/Math.sqrt(18));near(r.degrees,Math.acos(2/Math.sqrt(18))*180/Math.PI);},
  21:()=>matrix(matMul([[1,2,0],[0,1,3],[2,0,1]],[[1,0,2],[3,1,0],[0,2,1]]),[[7,2,2],[3,7,3],[2,2,5]]),
  22:()=>{const r=determinantExpansion([[1,2,0,1],[2,1,3,0],[0,1,1,2],[1,0,2,1]]);near(r.value,-8);vec(r.terms.map(t=>t.minorDeterminant),[-6,0,4,2]);vec(r.terms.map(t=>t.contribution),[-6,0,0,-2]);},
  23:()=>{const A=[[1,2,3],[0,1,4],[5,6,0]],r=inverseGaussJordan(A);matrix(r.inverse,[[-24,18,5],[20,-15,-4],[-5,4,1]]);matrix(matMul(A,r.inverse),eye(3));assert.ok(r.steps.length);},
  24:()=>{const A0=[[1,1,1],[1,2,3],[1,3,0]],At=[[0,0,0],[0,0,0],[0,0,1]],r=affineParameterSystem(A0,At,[1,2,0],[0,0,1]);assert.equal(r.status,'classified');vec(r.determinantCoefficients,[-5,1,0,0]);near(r.critical[0].t,5);near(r.critical[0].compatibleU,3);assert.equal(r.critical[0].compatibility,'only_at_u');const A=a=>[[1,1,1],[1,2,3],[1,3,a]];assert.equal(matGauss(A(5),[1,2,3]).status,'infinite');assert.equal(matGauss(A(5),[1,2,4]).status,'inconsistent');solve(A(4),[1,2,3],[0,1,0]);},
  25:()=>{const A=[[1,2,-1],[2,4,-2],[1,1,1]],r=matGauss(A,[0,0,0]);assert.equal(r.status,'infinite');vec(r.particular,[0,0,0]);vec(r.nullspace[0],[-3,2,1]);},
  26:()=>{const r=homogeneousSubspace([[1,1,-1]],[0]);assert.equal(r.isSubspace,true);assert.equal(r.spaces.nullity,2);r.spaces.kernelBasis.forEach(v=>near(v[0]+v[1]-v[2],0));assert.match(r.steps.join(' '),/cierre bajo suma/);assert.match(r.steps.join(' '),/cierre bajo escalares/);},
  27:()=>{const r=spanMembership([[1,2,3],[0,1,2]],[4,5,6]);assert.equal(r.belongs,true);vec(r.coefficients,[4,-3]);},
  28:()=>{const r=spaces([[1,2,0,1],[2,4,1,3],[3,6,1,4]],2,2);matrix(r.columnBasis,[[1,2,3],[0,1,1]]);},
  29:()=>vec(coordinatesInBasis([[1,1],[1,-1]],[3,1]).coordinates,[2,1]),
  30:()=>{const r=gramSchmidt([[1,1,0],[1,0,1]]);matrix(r.orthogonal,[[1,1,0],[.5,-.5,1]]);matrix(r.orthonormal,[[1/Math.SQRT2,1/Math.SQRT2,0],[1/Math.sqrt(6),-1/Math.sqrt(6),2/Math.sqrt(6)]]);near(dot(...r.orthonormal),0);},
  31:()=>spaces([[1,1,0],[0,1,1]],2,1),
  32:()=>matrix(representationFromExpressions(['2*x+y','x-y','3*y'],['x','y'],[[1,1],[0,1]],eye(3)).matrix,[[3,1],[0,-1],[3,3]]),
  33:()=>eig([[2,0,0],[0,3,4],[0,4,9]],[11,2,1]),
  34:()=>diagonal([[1,2],[2,1]],[3,-1]),
  35:()=>{const A=[[4,1,1],[1,4,1],[1,1,4]],r=diagonal(A,[6,3,3]);matrix(matMul(transpose(r.P),r.P),eye(3));},
  36:()=>{const A=[[2,2],[2,-1]],r=orthogonalDiagonalization(A);assert.equal(r.status,'diagonalized');vec(r.D.map((row,i)=>row[i]),[3,-2]);matrix(matMul(r.transpose,r.P),eye(2));matrix(matMul(matMul(r.transpose,A),r.P),r.D);},
  37:()=>matrix(matrixPowerByDiagonalization([[3,1],[0,2]],5).value,[[243,211],[0,32]]),
  38:()=>{const r=changeOfBasis([[1,2],[0,1]],[[1,1],[2,3]]);matrix(r.matrix,[[-1,-2],[1,1]]);matrix(matMul(r.to,r.matrix),r.from);},
  39:()=>{const r=rotationReflection(45,8,'x'),s=Math.SQRT1_2;matrix(r.composition,[[s,-s],[-s,-s]]);matrix(r.powered,eye(2));},
  40:()=>spaces([[1,2,0,1],[0,1,1,2],[1,3,1,3]],2,2),
  41:()=>solve([[1,1,1,1],[1,-1,2,1],[2,1,-1,3],[1,2,1,-1]],[2,6,-1,1],[1,-1,2,0]),
  42:()=>vec(matCramer([[1,2,1],[2,-1,3],[3,1,-1]],[4,-3,6]),[1,2,-1]),
  43:()=>{const r=determinantIdentities(5,3,2,3);assert.deepEqual(r.values,{scaled:40,inverse:.2,powered:125,transpose:5,adjugate:25});},
  44:()=>{const r=vectorApplications([1,2,0],[0,1,3],1,1,[2,0,1]);near(r.volume,13);near(r.signedTriple,13);},
  45:()=>{const r=projectOntoSpan([1,2,3],[[1,0,1],[0,1,1]]);vec(r.projection,[1,2,3]);near(r.distance,0);r.orthonormal.forEach(q=>near(dot(r.residual,q),0));},
  46:()=>{const r=repeatedEigenvalueParameter(2,3,1);near(r.k,-.25);near(r.lambda,2.5);assert.equal(r.geometricMultiplicity,1);vec(r.eigenspace[0],[-.5,1]);},
  47:()=>{const A=[[1,2],[0,3]],B=[[3,0],[0,1]],r=similarityMatrix(A,B);assert.equal(r.status,'similar');matrix(matMul(A,r.P),matMul(r.P,B));matrix(matMul(matMul(r.inverseP,A),r.P),B);},
  48:()=>{const A=[[1,0,3],[2,1,-1]],r=transformationFromImages([[1,2],[0,1],[3,-1]],[2,-1,4]);matrix(r.matrix,A);vec(r.output,[14,-1]);assert.equal(r.spaces.rank,2);assert.equal(r.spaces.nullity,1);vec(mul(A,r.spaces.kernelBasis[0]),[0,0]);},
  49:()=>{const r=intersectPlanes(planeFromCoefficients([1,1,1],3),planeFromCoefficients([2,-1,1],0));assert.equal(r.status,'line');for(const t of [-2,0,4]){const p=r.point.map((x,i)=>x+t*r.direction[i]);near(dot([1,1,1],p),3);near(dot([2,-1,1],p),0);}},
  50:()=>{const A=[[0,1,0],[0,0,1],[6,-11,6]],r=eig(A,[3,2,1]);vec(r.characteristic,[-6,11,-6,1]);r.forEach(p=>{near(p.vec[1]/p.vec[0],p.lam);near(p.vec[2]/p.vec[0],p.lam**2);});},
};
for(const [id,check]of Object.entries(checks))test(`Álgebra guía ${id}: referencia independiente`,check);
test('escalar ecuaciones no cambia solución, rango ni nulidad',()=>{
  for(const scale of [1e-12,1,1e12]){
    solve([[2,1],[1,-1]].map(row=>row.map(x=>x*scale)),[5*scale,scale],[2,1]);
    const g=gramSchmidt([[scale,scale,0],[scale,0,scale]]);assert.equal(g.rank,2);near(dot(...g.orthonormal),0);g.orthonormal.forEach(v=>near(Math.hypot(...v),1));
    const r=matGauss([[scale,scale,scale],[2*scale,2*scale,2*scale]],[2*scale,4*scale]);assert.equal(r.status,'infinite');assert.equal(r.rankA,1);assert.equal(r.nullspace.length,2);vec(mul([[1,1,1]],r.particular),[2]);
  }
  vec(matGauss([[1]],[1e-15]).particular,[1e-15]);
});
test('subespacios, parámetros y operaciones degeneradas explican límites',()=>{
  assert.equal(homogeneousSubspace([[1,1]],[1]).isSubspace,false);
  assert.throws(()=>transformationFromExpressions(['x*y'],['x','y']),/Producto de variables/);
  assert.throws(()=>transformationFromExpressions(['x+1'],['x']),/T\(0\)≠0/);
  assert.throws(()=>transformationFromExpressions(['1/x'],['x']),/Solo división/);
  assert.equal(spanMembership([[1,0,0],[0,1,0]],[0,0,1]).belongs,false);
  assert.equal(repeatedEigenvalueParameter(2,3,0).status,'ningún k real');
  assert.equal(repeatedEigenvalueParameter(2,2,0).status,'todo k real');
  assert.equal(vectorApplications([0,0],[1,2]).unit,null);
  assert.equal(determinantIdentities(0,3,2,3).values.inverse,null);
  assert.throws(()=>orthogonalDiagonalization([[1,2],[0,1]]),/simétrica/);
  assert.throws(()=>determinantExpansion([[1,2],[3]]),/cuadrada/);
  assert.equal(inverseGaussJordan([[1,2],[2,4]]).status,'singular');
  assert.throws(()=>determinantIdentities(5,3.5,2,3),/orden/);
  assert.throws(()=>vectorApplications([1,2],[3,4,5]),/dimensión/);
});
test('espectro 3×3 separa multiplicidad geométrica de falta de base real',()=>{
  const good=diagonalizeReal([[1,0,1],[0,1,0],[0,0,2]]);assert.equal(good.status,'diagonalized');matrix(matMul(good.P,good.inverse),eye(3));
  const bad=matEigenAll([[1,1,0],[0,1,0],[0,0,2]]);assert.equal(bad.length,2);assert.match(bad.message,/No se declara diagonalización/);
  const complex=matEigenAll([[0,-1,0],[1,0,0],[0,0,2]]);assert.equal(complex.length,1);assert.match(complex.message,/complejos/);
  assert.equal(diagonalizeReal([[0,-1,0],[1,0,0],[0,0,2]]).status,'unsupported');
});
