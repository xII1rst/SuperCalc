import {
  lineFromPoints, lineFromPointDirection, planeFromPointNormal, planeFromThreePoints,
  planeFromCoefficients, intersectLinePlane, intersectPlanes, intersectLines,
  pointPlaneDistance, planeAngle,
} from '../../math/algebra/geometry.mjs';
import { fN, formatResult } from '../../utils/format.mjs';

const modes = {
  linePoints: {
    fields:[['p','Primer punto P','1, 2, 3'],['q','Segundo punto Q','4, 0, 5']],
    calculate({p,q}) {
      const line = lineFromPoints(p,q);
      return ['Recta por dos puntos', [
        `Dirección d = Q − P = ${tuple(line.direction)}.`,
        `r(t) = P + t·d = ${tuple(line.point)} + t${tuple(line.direction)}, t ∈ ℝ.`,
        `x = ${parameterCoordinate(p[0],line.direction[0])}; y = ${parameterCoordinate(p[1],line.direction[1])}; z = ${parameterCoordinate(p[2],line.direction[2])}.`,
      ]];
    },
  },
  planePoint: {
    fields:[['p','Punto P','1, 2, 3'],['n','Vector normal n','2, -1, 4']],
    calculate({p,n}) {
      const plane = planeFromPointNormal(p,n);
      return ['Plano por punto y normal', [
        `n·(X − P) = 0, con n = ${tuple(n)} y P = ${tuple(p)}.`,
        `n·P = ${fN(plane.constant)}; plano: ${equation(plane)}.`,
      ]];
    },
  },
  planePoints: {
    fields:[['p','Punto P','1, 0, 0'],['q','Punto Q','0, 1, 0'],['r','Punto R','0, 0, 1']],
    calculate({p,q,r}) {
      const plane = planeFromThreePoints(p,q,r);
      return ['Plano por tres puntos', [
        `n = (Q − P) × (R − P) = ${tuple(plane.normal)}.`,
        `n·P = ${fN(plane.constant)}; plano: ${equation(plane)}.`,
      ]];
    },
  },
  linePlane: {
    fields:[['p','Punto de la recta P','1, 0, 2'],['d','Dirección de la recta d','1, 1, -1'],['n','Normal del plano n','1, 2, 1'],['c','Constante c de n·X = c','7']],
    calculate({p,d,n,c}) {
      const result = intersectLinePlane(lineFromPointDirection(p,d), planeFromCoefficients(n,c));
      const steps = [
        `Sustituir X = P + t·d en n·X = c: t = (c − n·P)/(n·d).`,
        `Numerador = ${fN(result.numerator)}; denominador = ${fN(result.denominator)}.`,
      ];
      if (result.status === 'point') steps.push(`t = ${fN(result.parameter)}; intersección X = ${tuple(result.point)}.`);
      else steps.push(result.status === 'coincident' ? 'La recta está contenida en el plano: hay infinitos puntos comunes.' : 'La recta es paralela al plano: no hay intersección.');
      return ['Intersección recta–plano', steps];
    },
  },
  planes: {
    fields:[['n1','Normal del plano 1','1, 1, 1'],['c1','Constante del plano 1','3'],['n2','Normal del plano 2','2, -1, 1'],['c2','Constante del plano 2','0']],
    calculate({n1,c1,n2,c2}) {
      const result = intersectPlanes(planeFromCoefficients(n1,c1), planeFromCoefficients(n2,c2));
      const steps = ['La dirección común es d = n₁ × n₂.'];
      if (result.status === 'line') steps.push(`d = ${tuple(result.direction)}; un punto que satisface ambos planos es P = ${tuple(result.point)}.`, `Recta de intersección: X = ${tuple(result.point)} + t${tuple(result.direction)}, t ∈ ℝ.`);
      else steps.push(result.status === 'coincident' ? 'Las ecuaciones representan el mismo plano: infinitos puntos comunes.' : 'Los planos son paralelos distintos: no se intersectan.');
      return ['Intersección de planos', steps];
    },
  },
  lines: {
    fields:[['p','Punto de la recta 1','0, 0, 0'],['d','Dirección de la recta 1','1, 0, 0'],['q','Punto de la recta 2','1, -1, 0'],['e','Dirección de la recta 2','0, 1, 0']],
    calculate({p,d,q,e}) {
      const result = intersectLines(lineFromPointDirection(p,d), lineFromPointDirection(q,e));
      const steps = ['Resolver P + t·d = Q + s·e y comprobar las tres coordenadas.'];
      if (result.status === 'point') steps.push(`t = ${fN(result.firstParameter)}, s = ${fN(result.secondParameter)}; intersección ${tuple(result.point)}.`);
      else if (result.status === 'skew') steps.push(`Rectas alabeadas: no se cortan. Distancia mínima = ${fN(result.distance)}; puntos más cercanos ${tuple(result.firstPoint)} y ${tuple(result.secondPoint)}.`);
      else steps.push(result.status === 'coincident' ? 'Las rectas coinciden: infinitos puntos comunes.' : 'Las rectas son paralelas distintas: no se cortan.');
      return ['Intersección de rectas 3D', steps];
    },
  },
  distance: {
    fields:[['p','Punto P','1, 2, 3'],['n','Normal del plano n','2, -1, 2'],['c','Constante c de n·X = c','4']],
    calculate({p,n,c}) {
      const result = pointPlaneDistance(p, planeFromCoefficients(n,c));
      return ['Distancia punto–plano', [
        'd = |n·P − c| / ||n||.',
        `|n·P − c| = ${fN(Math.abs(result.signedNumerator))}; ||n|| = ${fN(result.normalLength)}; d = ${formatResult(result.distance)}.`,
      ]];
    },
  },
  angle: {
    fields:[['n1','Normal del plano 1','1, 1, 1'],['c1','Constante del plano 1','3'],['n2','Normal del plano 2','2, -1, 1'],['c2','Constante del plano 2','5']],
    calculate({n1,c1,n2,c2}) {
      const result = planeAngle(planeFromCoefficients(n1,c1), planeFromCoefficients(n2,c2));
      return ['Ángulo entre planos', [
        'Se toma el ángulo agudo (o recto) entre normales: cos θ = |n₁·n₂|/(||n₁||·||n₂||).',
        `cos θ = ${fN(result.cosine)}; θ = ${fN(result.degrees)}°.`
      ]];
    },
  },
};

function tuple(values) {
  return `(${values.map(value => fN(value)).join(', ')})`;
}

function parameterCoordinate(origin, direction) {
  if (direction === 0) return fN(origin);
  return `${fN(origin)} ${direction < 0 ? '−' : '+'} ${Math.abs(direction) === 1 ? '' : fN(Math.abs(direction))}t`;
}

function equation(plane) {
  const terms = plane.normal.map((value,i)=>({value,axis:['x','y','z'][i]})).filter(term=>term.value!==0);
  const expression = terms.map(({value,axis},i)=>{
    const coefficient = Math.abs(value)===1 ? '' : fN(Math.abs(value));
    return `${i===0 ? (value<0?'−':'') : (value<0?' − ':' + ')}${coefficient}${axis}`;
  }).join('');
  return `${expression} = ${fN(plane.constant)}`;
}

function readValue(key) {
  const raw = document.getElementById(`geom-${key}`).value.trim();
  if (['c','c1','c2'].includes(key)) {
    if (!raw || !Number.isFinite(Number(raw))) throw new RangeError(`La constante ${key} debe ser un número finito`);
    return Number(raw);
  }
  const parts = raw.replace(/[()]/g, '').split(/[;,\s]+/).filter(Boolean);
  if (parts.length !== 3 || parts.some(part => !Number.isFinite(Number(part)))) {
    throw new RangeError(`${key.toUpperCase()}: introduce tres coordenadas finitas separadas por comas`);
  }
  return parts.map(Number);
}

export function geomSelect() {
  const mode = document.getElementById('geom-mode').value;
  const config = modes[mode];
  if (!config) return;
  document.getElementById('geom-fields').innerHTML = config.fields.map(([key,label,value]) =>
    `<label class="geom-field" for="geom-${key}"><span>${label}</span><input id="geom-${key}" class="tool-input" type="text" inputmode="decimal" value="${value}"></label>`
  ).join('');
  const result = document.getElementById('geom-result');
  result.textContent = '';
  result.classList.remove('tool-error');
}

export function geomInit() {
  geomSelect();
}

export function geomCalculate() {
  const result = document.getElementById('geom-result');
  try {
    const config = modes[document.getElementById('geom-mode').value];
    if (!config) throw new RangeError('Selecciona una operación válida');
    const values = Object.fromEntries(config.fields.map(([key]) => [key, readValue(key)]));
    const [title, steps] = config.calculate(values);
    result.classList.remove('tool-error');
    result.innerHTML = `<div class="tool-result-title">${title}</div><ol class="geom-steps">${steps.map(step => `<li>${step}</li>`).join('')}</ol>`;
  } catch (error) {
    result.textContent = error.message;
    result.classList.add('tool-error');
  }
}
