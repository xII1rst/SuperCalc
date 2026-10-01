import {
  gramSchmidt, coordinatesInBasis, changeOfBasis, projectOntoSpan,
  linearTransformation, representationInBases, matrixPowerByDiagonalization, spanMembership, homogeneousSubspace, determinantIdentities, repeatedEigenvalueParameter, orthogonalDiagonalization, rotationReflection, vectorApplications, transformationFromExpressions, transformationFromImages, representationFromExpressions,
} from '../../math/algebra/linear-spaces.mjs';
import { affineParameterSystem, similarityMatrix } from '../../math/algebra/parameter-systems.mjs';
import { fN } from '../../utils/format.mjs';

const modes = {
  representationformulas: {fields:[['expressions','Componentes de T, una fórmula por línea','2*x+y\nx-y\n3*y'],['variables','Variables del dominio, en orden','x,y'],['from','Base B del dominio, un vector por línea','1,1\n0,1'],['to','Base C del codominio, un vector por línea','1,0,0\n0,1,0\n0,0,1']]},
  formulas: {fields:[['expressions','Componentes de T, una fórmula por línea','x+y\nx-y'],['variables','Variables del dominio, en orden','x,y'],['target','Vector para evaluar T','0,0']]},
  images: {fields:[['images','Imágenes T(eⱼ), una por línea (serán columnas de A)','1,2\n0,1\n3,-1'],['target','Vector para evaluar T','2,-1,4']]},
  vectors: {fields:[['u','Vector u (2 o 3 coordenadas)','2, -1, 3'],['v','Vector v','1, 4, -2'],['a','Escalar a en au+bv','3'],['b','Escalar b','-2'],['w','Vector w opcional para volumen en ℝ³','']]},
  span: {fields:[['vectors','Generadores: un vector por línea','1, 2, 3\n0, 1, 2'],['target','Vector objetivo','4, 5, 6']]},
  subspace: {fields:[['matrix','A: ecuaciones de Ax=b, una fila por línea','1, 1, -1'],['rhs','b (ceros para subespacio)','0']]},
  detproperties: {fields:[['determinant','det(A)','5'],['order','Orden n (1–8)','3'],['scalar','k en det(kA)','2'],['exponent','Potencia p (0–50)','3']]},
  repeated: {fields:[['a','a de A=[[a,k],[c,d]]','2'],['d','d','3'],['c','c','1']]},
  orthogonal: {fields:[['matrix','Matriz simétrica A','2, 2\n2, -1']]},
  rotation: {fields:[['angle','Ángulo antihorario (grados)','45'],['exponent','Potencia k (0–50)','8'],['axis','Eje de reflexión: x o y','x']]},
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
  const num=key=>{const raw=read(key).trim();if(!raw||!Number.isFinite(Number(raw)))throw new RangeError(`${key}: número finito requerido`);return Number(raw);};
  try {
    let title='', details='';
    if(mode==='representationformulas') {
      const r=representationFromExpressions(read('expressions').split(/[;\n]+/).map(s=>s.trim()).filter(Boolean),read('variables').split(/[,\s]+/).filter(Boolean),parseRows(read('from')),parseRows(read('to')));
      title='Matriz entre bases desde fórmulas de T';
      details=steps([...r.steps,`Matriz canónica A = ${matrix(r.canonical)}`,r.formula,`[T]ᶜᵦ = ${matrix(r.matrix)}`,r.assumption]);
    } else if(mode==='formulas'||mode==='images') {
      const r=mode==='formulas'?transformationFromExpressions(read('expressions').split(/[;\n]+/).map(s=>s.trim()).filter(Boolean),read('variables').split(/[,\s]+/).filter(Boolean),parseVector(read('target'))):transformationFromImages(parseRows(read('images')),parseVector(read('target')));
      title='Matriz canónica de transformación lineal';
      details=steps([...r.steps,`A = ${matrix(r.matrix)}`,`Imágenes T(eⱼ) = ${r.images.map(vector).join(', ')}.`,`T(x) = Ax = ${vector(r.output)}.`,`rango(A) = ${r.spaces.rank}; nulidad(A) = ${r.spaces.nullity}.`,`Base del núcleo = ${r.spaces.kernelBasis.map(vector).join(', ')||'conjunto vacío (núcleo {0})'}.`,`Base de la imagen = ${r.spaces.columnBasis.map(vector).join(', ')||'conjunto vacío'}.`,...r.spaces.steps,r.assumption]);
    } else if(mode==='vectors') {
      const r=vectorApplications(parseVector(read('u')),parseVector(read('v')),num('a'),num('b'),read('w').trim()?parseVector(read('w')):null);
      title='Operaciones, unitario y volumen';
      details=steps([...r.steps,`u+v = ${vector(r.sum)}; au+bv = ${vector(r.combination)}.`,`u·v = ${fN(r.dot)}; ||u|| = ${fN(r.norm)}; unitario = ${r.unit?vector(r.unit):'no existe: u=0'}.`,...(r.cross?[`u×v = ${vector(r.cross)}.`]:[]),...(r.volume!==undefined?[`Producto triple orientado = ${fN(r.signedTriple)}; volumen = ${fN(r.volume)}.`]:[]),r.assumption]);
    } else if(mode==='span') {
      const r=spanMembership(parseRows(read('vectors')),parseVector(read('target')));
      title='Independencia, base y pertenencia al generado';
      details=steps([...r.steps,`rango(G) = ${r.rank}; dimensión ambiente = ${r.dimension}.`,`Generadores ${r.independent?'independientes':'dependientes'}; ${r.isBasis?'forman base del espacio ambiente':'no forman base del espacio ambiente'}.`,...r.solution.steps,r.belongs?`El objetivo pertenece: coeficientes c = ${vector(r.coefficients)}; Gc=v.`:'El objetivo no pertenece: sistema incompatible.',...(r.belongs&&r.coefficientDirections.length?[`Otras combinaciones: c=c₀+Σtᵢnᵢ, direcciones ${r.coefficientDirections.map(vector).join(', ')}.`]:[])]);
    } else if(mode==='subspace') {
      const r=homogeneousSubspace(parseRows(read('matrix')),parseVector(read('rhs')));
      title=r.isSubspace?'Subespacio: demostración y base':'No es subespacio';
      details=steps([r.formula,...r.steps,...(r.isSubspace?[`Base de W = ${r.spaces.kernelBasis.map(vector).join(', ')||'conjunto vacío'}; dimensión = ${r.spaces.nullity}.`,...r.spaces.steps]:[])]);
    } else if(mode==='detproperties') {
      const r=determinantIdentities(num('determinant'),num('order'),num('scalar'),num('exponent'));
      title='Identidades del determinante';
      details=steps([...r.steps,`det(kA) = ${fN(r.values.scaled)}; det(A⁻¹) = ${r.values.inverse===null?'no existe inversa':fN(r.values.inverse)}; det(A^p) = ${fN(r.values.powered)}; det(Aᵀ) = ${fN(r.values.transpose)}; det(adj A) = ${fN(r.values.adjugate)}.`,r.assumption]);
    } else if(mode==='repeated') {
      const r=repeatedEigenvalueParameter(num('a'),num('d'),num('c'));
      title='Parámetro para valor propio repetido';
      details=steps([...r.steps,`Estado: ${r.status}.`,...(r.k!==undefined?[`k = ${fN(r.k)}; valor propio doble λ = ${fN(r.lambda)}.`,`Base del espacio propio = ${r.eigenspace.map(vector).join(', ')}; multiplicidad geométrica = ${r.geometricMultiplicity}.`]:[]),r.assumption]);
    } else if(mode==='orthogonal') {
      const r=orthogonalDiagonalization(parseRows(read('matrix')));
      title='Diagonalización ortogonal';
      details=r.status!=='diagonalized'?steps([r.reason]):steps([r.formula,`P = ${matrix(r.P)}`,`D = ${matrix(r.D)}`,`Residuo AP−PD = ${fN(r.residual)}; residuo PᵀP−I = ${fN(r.orthogonalityResidual)}.`,r.assumption]);
    } else if(mode==='rotation') {
      const r=rotationReflection(num('angle'),num('exponent'),read('axis').trim());
      title='Composición y potencia de rotación';
      details=steps([...r.steps,`T = ${matrix(r.rotation)}`,`S = ${matrix(r.reflection)}`,`S∘T = ST = ${matrix(r.composition)}`,`T^${r.power} = ${matrix(r.powered)}`,r.assumption]);
    } else if (mode==='gram') {
      const result=gramSchmidt(parseRows(read('vectors')));
      title='Gram-Schmidt';
      details=steps([
        ...result.steps.map(step=>step.status==='dependent'
          ? `v${step.index+1} es combinación de los anteriores: no añade dimensión.`
          : `u${step.index+1} = v${step.index+1} − Σ proy anteriores = ${vector(step.orthogonal)}; ||u|| = ${fN(step.length)}.`),
        `Rango = ${result.rank}; base ortonormal = ${result.orthonormal.map(vector).join(', ') || 'conjunto vacío'}.`,
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
        `Base de imagen: ${result.spaces.columnBasis.map(vector).join(', ') || 'conjunto vacío'}.`,
        `Base de núcleo: ${result.spaces.kernelBasis.map(vector).join(', ') || 'conjunto vacío (núcleo {0})'}.`,...result.spaces.steps]);
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
      else details=steps([`χ(λ)=det(λI−A); vectores de ker(A−λI) normalizados.`, `A = P D P⁻¹; residuo máximo de AP − PD = ${fN(result.residual)}.`,
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
