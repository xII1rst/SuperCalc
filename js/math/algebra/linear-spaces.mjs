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
    let remainder = [...vector];
    const projections = [];
    for (const basisVector of orthogonal) {
      const coefficient = dot(vector, basisVector) / dot(basisVector, basisVector);
      projections.push(coefficient);
      remainder = remainder.map((value, coordinate) => value - coefficient * basisVector[coordinate]);
    }
    const length = norm(remainder);
    const tolerance = EPS * Math.max(1, norm(vector));
    if (length <= tolerance) {
      dependent.push(index);
      steps.push({index, vector, projections, status:'dependent'});
      continue;
    }
    orthogonal.push(remainder);
    orthonormal.push(remainder.map(value => value / length));
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
