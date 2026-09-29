import {
  gramSchmidt, coordinatesInBasis, changeOfBasis, projectOntoSpan,
  linearTransformation, representationInBases, matrixPowerByDiagonalization,
} from '../../math/algebra/linear-spaces.mjs';
import { affineParameterSystem, similarityMatrix } from '../../math/algebra/parameter-systems.mjs';
import { fN } from '../../utils/format.mjs';

const modes = {
  gram: {fields:[['vectors','Vectores, uno por línea','1, 1, 0\n1, 0, 1']]},
  coordinates: {fields:[['basis','Vectores de la base, uno por línea','1, 1\n1, -1'],['target','Vector objetivo','3, 1']]},
  change: {fields:[['from','Base B₁, un vector por línea','1, 2\n0, 1'],['to','Base B₂, un vector por línea','1, 1\n2, 3']]},
  projection: {fields:[['target','Vector objetivo','1, 2, 3'],['vectors','Generadores del subespacio','1, 0, 1\n0, 1, 1']]},
  transform: {fields:[['matrix','Matriz A, una fila por línea','1, 0, 3\n2, 1, -1'],['target','Vector x','2, -1, 4']]},
  representation: {fields:[['matrix','Matriz canónica A, una fila por línea','2, 1\n1, -1'],['from','Base B del dominio','1, 1\n0, 1'],['to','Base C del codominio','1, 0\n0, 1']]},
  diagonal: {fields:[['matrix','Matriz cuadrada A, una fila por línea','3, 1\n0, 2'],['exponent','Potencia k (entero de 0 a 50)','5']]},
  affine: {fields:[['a0','A₀, una fila por línea','1, 1, 1\n1, 2, 3\n1, 3, 0'],['at','Aₜ, una fila por línea','0, 0, 0\n0, 0, 0\n0, 0, 1'],['b0','b₀','1, 2, 0'],['bu','bᵤ','0, 0, 1']]},
  similarity: {fields:[['first','Matriz A','1, 2\n0, 3'],['second','Matriz B','3, 0\n0, 1']]},
};

function parseRows(raw) {
  const rows=raw.trim().split(/[;\n]+/).map(row=>row.trim()).filter(Boolean);
  if (!rows.length || rows.length>8) throw new RangeError('Introduce entre 1 y 8 filas');
  const parsed=rows.map((row,index)=>{
    const parts=row.split(/[,\s]+/).filter(Boolean);
    if (!parts.length || parts.length>8 || parts.some(part=>!Number.isFinite(Number(part)))) {
      throw new RangeError(`Fila ${index+1}: introduce hasta 8 números finitos separados por comas`);
    }
    return parts.map(Number);
  });
  if (parsed.some(row=>row.length!==parsed[0].length)) throw new RangeError('Todas las filas deben tener la misma cantidad de números');
  return parsed;
}

function parseVector(raw) {
  const rows=parseRows(raw);
  if (rows.length!==1) throw new RangeError('El vector objetivo debe ocupar una sola fila');
  return rows[0];
}

const vector = values => `[${values.map(value=>fN(value)).join(', ')}]`;
const matrix = values => `<div class="linear-matrix">${values.map(row=>vector(row)).join('<br>')}</div>`;
const steps = items => `<ol class="geom-steps">${items.map(item=>`<li>${item}</li>`).join('')}</ol>`;

export function linearSelect() {
  const mode=document.getElementById('linear-mode').value;
  const config=modes[mode];
  if (!config) return;
  document.getElementById('linear-fields').innerHTML=config.fields.map(([key,label,defaultValue])=>
    `<label class="linear-field" for="linear-${key}"><span>${label}</span><textarea id="linear-${key}" class="tool-textarea" rows="${key==='exponent'?1:3}" spellcheck="false">${defaultValue}</textarea></label>`
  ).join('');
  const target=document.getElementById('linear-result');
  target.textContent='';
  target.classList.remove('tool-error');
}

export function linearInit() {
  linearSelect();
}

export function linearCalculate() {
  const mode=document.getElementById('linear-mode').value;
  const target=document.getElementById('linear-result');
  const read=key=>document.getElementById(`linear-${key}`).value;
  try {
    let title='', details='';
    if (mode==='gram') {
      const result=gramSchmidt(parseRows(read('vectors')));
      title='Gram-Schmidt';
      details=steps([
        ...result.steps.map(step=>step.status==='dependent'
          ? `v${step.index+1} es combinación de los anteriores: no añade dimensión.`
          : `u${step.index+1} = v${step.index+1} − Σ proy anteriores = ${vector(step.orthogonal)}; ||u|| = ${fN(step.length)}.`),
        `Rango = ${result.rank}; base ortonormal = ${result.orthonormal.map(vector).join(', ') || '{0}'}.`,
      ]);
    } else if (mode==='coordinates') {
      const result=coordinatesInBasis(parseRows(read('basis')),parseVector(read('target')));
      title='Coordenadas en una base';
      details=steps(['Resolver B·c = v con las columnas de B iguales a los vectores de la base.',
        ...result.steps, `[v]ᵦ = ${vector(result.coordinates)}.`]);
    } else if (mode==='change') {
      const result=changeOfBasis(parseRows(read('from')),parseRows(read('to')));
      title='Cambio de base';
      details=steps([result.formula,`Matriz de transición B₁ → B₂: ${matrix(result.matrix)}`,
        `Comprobación ||B₂P − B₁||∞ = ${fN(result.residual)}.`]);
    } else if (mode==='projection') {
      const result=projectOntoSpan(parseVector(read('target')),parseRows(read('vectors')));
      title='Proyección ortogonal';
      details=steps(['Obtener una base ortonormal qᵢ por Gram-Schmidt; proy(b) = Σ(b·qᵢ)qᵢ.',
        `Proyección = ${vector(result.projection)}; residuo perpendicular = ${vector(result.residual)}.`,
        `Distancia al subespacio = ${fN(result.distance)}; dimensión = ${result.rank}.`]);
    } else if (mode==='transform') {
      const result=linearTransformation(parseRows(read('matrix')),parseVector(read('target')));
      title='Transformación lineal';
      details=steps([`T(x) = Ax = ${vector(result.output)}.`,
        `rango(A) = ${result.spaces.rank}; nulidad(A) = ${result.spaces.nullity}.`,
        `Base de imagen: ${result.spaces.columnBasis.map(vector).join(', ') || '{0}'}.`,
        `Base de núcleo: ${result.spaces.kernelBasis.map(vector).join(', ') || '{0}'}.`]);
    } else if (mode==='representation') {
      const result=representationInBases(parseRows(read('matrix')),parseRows(read('from')),parseRows(read('to')));
      title='Matriz de transformación entre bases';
      details=steps([result.formula,`[T]ᶜᵦ = ${matrix(result.matrix)}`]);
    } else if (mode==='diagonal') {
      const A=parseRows(read('matrix'));
      const raw=read('exponent').trim();
      if (!/^\d+$/.test(raw)) throw new RangeError('k debe ser entero entre 0 y 50');
      const result=matrixPowerByDiagonalization(A,Number(raw));
      title='Diagonalización y potencia';
      if (result.status!=='diagonalized') details=steps([`Estado: ${result.reason}.`, 'No se presenta una potencia por diagonalización sin n autovectores reales verificados.']);
      else details=steps([`A = P D P⁻¹; residuo máximo de AP − PD = ${fN(result.residual)}.`,
        `P = ${matrix(result.P)}`,`D = ${matrix(result.D)}`,`${result.formula}; A^${result.exponent} = ${matrix(result.value)}`]);
    } else if (mode==='affine') {
      const result=affineParameterSystem(parseRows(read('a0')),parseRows(read('at')),parseVector(read('b0')),parseVector(read('bu')));
      title='Sistema con parámetros';
      if(result.status!=='classified') details=steps([result.reason]);
      else details=steps([result.formula,
        `det A(t) tiene coeficientes ascendentes ${vector(result.determinantCoefficients)}; fuera de los valores críticos hay solución única.`,
        ...result.critical.map(branch=>`t = ${fN(branch.t)}: rango(A) = ${branch.rankA}; ${branch.compatibility==='only_at_u'?`soluciones infinitas solo si u = ${fN(branch.compatibleU)}; para otros u, incompatible`:branch.compatibility==='all'?'soluciones infinitas para todo u':'incompatible para todo u'}. Condiciones: ${branch.conditions.map(item=>`${fN(item.constant)} + (${fN(item.coefficient)})u = 0`).join('; ')}.`),
        `Ejemplo regular t=${result.generic.t}, u=0: x=${vector(result.generic.solution)}.`]);
    } else if (mode==='similarity') {
      const result=similarityMatrix(parseRows(read('first')),parseRows(read('second')));
      title='Semejanza de matrices';
      details=result.status==='similar'?steps([result.formula,`P = ${matrix(result.P)}`,`P⁻¹ = ${matrix(result.inverseP)}`,`Residuo máximo de AP−PB = ${fN(result.residual)}.`]):steps([`Estado: ${result.status}. ${result.reason}`]);
    } else throw new RangeError('Selecciona una operación válida');
    target.classList.remove('tool-error');
    target.innerHTML=`<div class="tool-result-title">${title}</div>${details}`;
  } catch (error) {
    target.textContent=error.message;
    target.classList.add('tool-error');
  }
}
