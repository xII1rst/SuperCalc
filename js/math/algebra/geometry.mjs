// Geometry in R³. A plane is n·x = constant; a line is p + t·direction.
const EPS = 1e-10;

function vector(value, label) {
  if (!Array.isArray(value) || value.length !== 3 || value.some(v => typeof v !== 'number' || !Number.isFinite(v))) {
    throw new RangeError(`${label} debe tener tres coordenadas finitas`);
  }
  return [...value];
}

const add = (a, b) => a.map((v, i) => v + b[i]);
const subtract = (a, b) => a.map((v, i) => v - b[i]);
const scale = (a, k) => a.map(v => v * k);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = a => Math.hypot(...a);
const nearZero = (value, size) => Math.abs(value) <= EPS * size;

export function lineFromPointDirection(point, direction) {
  const p = vector(point, 'El punto');
  const d = vector(direction, 'La dirección');
  if (norm(d) === 0) throw new RangeError('La dirección de la recta no puede ser cero');
  return {point:p, direction:d};
}

export function lineFromPoints(first, second) {
  const p = vector(first, 'El primer punto');
  const q = vector(second, 'El segundo punto');
  return lineFromPointDirection(p, subtract(q, p));
}

export function planeFromCoefficients(normal, constant) {
  const n = vector(normal, 'La normal');
  if (norm(n) === 0) throw new RangeError('La normal del plano no puede ser cero');
  if (typeof constant !== 'number' || !Number.isFinite(constant)) throw new RangeError('La constante debe ser finita');
  return {normal:n, constant};
}

export function planeFromPointNormal(point, normal) {
  const p = vector(point, 'El punto');
  const n = vector(normal, 'La normal');
  return planeFromCoefficients(n, dot(n, p));
}

export function planeFromThreePoints(first, second, third) {
  const p = vector(first, 'El primer punto');
  const q = vector(second, 'El segundo punto');
  const r = vector(third, 'El tercer punto');
  return planeFromPointNormal(p, cross(subtract(q, p), subtract(r, p)));
}

export function intersectLinePlane(line, plane) {
  const {point:p, direction:d} = lineFromPointDirection(line.point, line.direction);
  const {normal:n, constant:c} = planeFromCoefficients(plane.normal, plane.constant);
  const denominator = dot(n, d);
  const numerator = c - dot(n, p);
  const size = norm(n) * norm(d);
  if (nearZero(denominator, size)) {
    const planeScale = Math.max(Math.abs(c), norm(n) * norm(p));
    return {status:nearZero(numerator, planeScale) ? 'coincident' : 'parallel', numerator, denominator};
  }
  const parameter = numerator / denominator;
  return {status:'point', point:add(p, scale(d, parameter)), parameter, numerator, denominator};
}

export function intersectPlanes(first, second) {
  const a = planeFromCoefficients(first.normal, first.constant);
  const b = planeFromCoefficients(second.normal, second.constant);
  const direction = cross(a.normal, b.normal);
  const directionLength = norm(direction);
  if (nearZero(directionLength, norm(a.normal) * norm(b.normal))) {
    const sample = scale(a.normal, a.constant / dot(a.normal, a.normal));
    const gap = b.constant - dot(b.normal, sample);
    const size = Math.max(Math.abs(b.constant), norm(b.normal) * norm(sample));
    return {status:nearZero(gap, size) ? 'coincident' : 'parallel'};
  }
  const point = scale(cross(subtract(scale(b.normal, a.constant), scale(a.normal, b.constant)), direction), 1 / dot(direction, direction));
  return {status:'line', point, direction};
}

export function intersectLines(first, second) {
  const a = lineFromPointDirection(first.point, first.direction);
  const b = lineFromPointDirection(second.point, second.direction);
  const separation = subtract(b.point, a.point);
  const normal = cross(a.direction, b.direction);
  const normalLength = norm(normal);
  if (nearZero(normalLength, norm(a.direction) * norm(b.direction))) {
    const offset = norm(cross(separation, a.direction));
    return {status:nearZero(offset, norm(separation) * norm(a.direction)) ? 'coincident' : 'parallel'};
  }
  const denominator = dot(normal, normal);
  const firstParameter = dot(cross(separation, b.direction), normal) / denominator;
  const secondParameter = dot(cross(separation, a.direction), normal) / denominator;
  const firstPoint = add(a.point, scale(a.direction, firstParameter));
  const secondPoint = add(b.point, scale(b.direction, secondParameter));
  const distance = norm(subtract(firstPoint, secondPoint));
  const size = Math.max(1, norm(firstPoint), norm(secondPoint));
  if (nearZero(distance, size)) return {status:'point', point:scale(add(firstPoint, secondPoint), 0.5), firstParameter, secondParameter};
  return {status:'skew', firstPoint, secondPoint, distance, firstParameter, secondParameter};
}

export function pointPlaneDistance(point, plane) {
  const p = vector(point, 'El punto');
  const {normal:n, constant:c} = planeFromCoefficients(plane.normal, plane.constant);
  const signedNumerator = dot(n, p) - c;
  return {distance:Math.abs(signedNumerator) / norm(n), signedNumerator, normalLength:norm(n)};
}

export function planeAngle(first, second) {
  const a = planeFromCoefficients(first.normal, first.constant);
  const b = planeFromCoefficients(second.normal, second.constant);
  const cosine = Math.min(1, Math.abs(dot(a.normal, b.normal)) / (norm(a.normal) * norm(b.normal)));
  return {degrees:Math.acos(cosine) * 180 / Math.PI, cosine};
}
