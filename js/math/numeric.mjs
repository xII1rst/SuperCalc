// Integración numérica: sumas de Riemann, regla del trapecio e integrales
// impropias (tipo I: intervalo infinito; tipo II: integrando no acotado).
// Las funciones públicas siguen la convención de los núcleos numéricos: fn(x, y).

// Regla de Simpson 1/3 para una función de una variable g(t) en [lo, hi].
function simpson1D(g, lo, hi, n) {
  if (n % 2 !== 0) n++;
  const h = (hi - lo) / n;
  let s = g(lo) + g(hi);
  for (let i = 1; i < n; i++) s += (i % 2 === 0 ? 2 : 4) * g(lo + i * h);
  return s * h / 3;
}

// Suma de Riemann de fn en [a,b] con n subintervalos.
// method: 'left' | 'right' | 'midpoint' (punto medio por defecto).
export function riemannSum(fn, a, b, n = 100, method = 'midpoint') {
  if (typeof fn !== 'function') throw new TypeError('Ingresa una función válida');
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) throw new RangeError('Se requieren límites finitos con a < b');
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n debe ser un entero positivo');
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x = method === 'left' ? a + i * h
      : method === 'right' ? a + (i + 1) * h
      : a + (i + 0.5) * h;
    s += fn(x, 0);
  }
  return h * s;
}

// Regla del trapecio compuesta.
export function trapezoidalRule(fn, a, b, n = 100) {
  if (typeof fn !== 'function') throw new TypeError('Ingresa una función válida');
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) throw new RangeError('Se requieren límites finitos con a < b');
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n debe ser un entero positivo');
  const h = (b - a) / n;
  let s = (fn(a, 0) + fn(b, 0)) / 2;
  for (let i = 1; i < n; i++) s += fn(a + i * h, 0);
  return h * s;
}

// Tipo I: intervalo infinito, compactado con x = a + t/(1−t) (o su reflejo).
function improperTypeI(fn, a, b, n, tol) {
  const parts = (a === -Infinity && b === Infinity) ? [[-Infinity, 0], [0, Infinity]] : [[a, b]];
  let total = 0, converged = true;
  for (const [lo, hi] of parts) {
    const up = hi === Infinity;
    const g = up
      ? t => fn(lo + t / (1 - t), 0) / ((1 - t) * (1 - t))
      : t => fn(hi - (1 - t) / t, 0) / (t * t);
    // El extremo singular (x = ±∞) se excluye con un corte δ que se reduce.
    const d1 = 1e-7, d2 = 1e-10;
    const lo1 = up ? 0 : d1, hi1 = up ? 1 - d1 : 1;
    const lo2 = up ? 0 : d2, hi2 = up ? 1 - d2 : 1;
    const v1 = simpson1D(g, lo1, hi1, n);
    const v2 = simpson1D(g, lo2, hi2, n);
    if (!Number.isFinite(v2) || Math.abs(v2 - v1) > tol) converged = false;
    total += v2;
  }
  return { value: total, converged, type: 'I' };
}

// Tipo II: integrando no acotado en un extremo finito; se suaviza con u².
function improperTypeII(fn, a, b, n, tol) {
  const L = b - a;
  const singularAtA = !Number.isFinite(fn(a, 0));
  const singularAtB = !Number.isFinite(fn(b, 0));
  // Singularidad en ambos extremos: se parte por el punto medio.
  if (singularAtA && singularAtB) {
    const mid = (a + b) / 2;
    const left = improperTypeII(fn, a, mid, n, tol);
    const right = improperTypeII(fn, mid, b, n, tol);
    return { value: left.value + right.value, converged: left.converged && right.converged, type: 'II' };
  }
  const g = singularAtA
    ? u => 2 * L * u * fn(a + L * u * u, 0)
    : u => 2 * L * u * fn(b - L * u * u, 0);
  // La singularidad queda en u = 0; se integra [δ, 1] reduciendo δ.
  const d1 = 1e-7, d2 = 1e-10;
  const v1 = simpson1D(g, d1, 1, n);
  const v2 = simpson1D(g, d2, 1, n);
  return { value: v2, converged: Number.isFinite(v2) && Math.abs(v2 - v1) < tol, type: 'II' };
}

// Integral impropia: admite límites infinitos (tipo I) o un integrando no
// acotado en un extremo finito (tipo II). Devuelve { value, converged, type }.
export function improperIntegral(fn, a, b, { tol = 1e-6, n = 4000 } = {}) {
  if (typeof fn !== 'function') throw new TypeError('Ingresa una función válida');
  if (a >= b) throw new RangeError('Se requiere a < b');

  const infA = a === -Infinity;
  const infB = b === Infinity;
  const singA = !infA && !Number.isFinite(fn(a, 0));
  const singB = !infB && !Number.isFinite(fn(b, 0));

  if (singA || singB) return improperTypeII(fn, a, b, n, tol);
  if (infA || infB) return improperTypeI(fn, a, b, n, tol);
  return { value: NaN, converged: false, type: 'I' };
}
