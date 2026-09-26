// Sólidos de revolución: malla de polígonos [[{x,y,z},...],...] para el volumen de revolución.
// `fn(x)` es la perfil (una función 1D); `axis` es 'x' (discos) o 'y' (cascarones).

function safeRadius(fn, x) {
  const v = fn(x, 0);
  return Number.isFinite(v) ? Math.abs(v) : 0;
}

export function genRevolutionSolid(fn, a, b, axis = 'x', { segments = 48, rings = 32 } = {}) {
  const seg = Math.max(3, segments | 0);
  const ring = Math.max(2, rings | 0);
  const polys = [];

  if (axis === 'x') {
    // Superficie de revolución alrededor del eje X: radio r = |f(x)|.
    const xs = [], rs = [];
    for (let i = 0; i <= ring; i++) {
      const x = a + (b - a) * i / ring;
      xs.push(x);
      rs.push(safeRadius(fn, x));
    }
    for (let i = 0; i < ring; i++) {
      for (let j = 0; j < seg; j++) {
        const t0 = 2 * Math.PI * j / seg, t1 = 2 * Math.PI * (j + 1) / seg;
        polys.push([
          { x: xs[i],     y: rs[i] * Math.cos(t0),     z: rs[i] * Math.sin(t0) },
          { x: xs[i + 1], y: rs[i + 1] * Math.cos(t0), z: rs[i + 1] * Math.sin(t0) },
          { x: xs[i + 1], y: rs[i + 1] * Math.cos(t1), z: rs[i + 1] * Math.sin(t1) },
          { x: xs[i],     y: rs[i] * Math.cos(t1),     z: rs[i] * Math.sin(t1) },
        ]);
      }
    }
    capDisc(polys, xs[0], rs[0], seg);
    capDisc(polys, xs[ring], rs[ring], seg);
  } else {
    // Superficie de revolución alrededor del eje Y: radio r = |x|, altura y = f(x).
    const rs = [], ys = [];
    for (let i = 0; i <= ring; i++) {
      const x = a + (b - a) * i / ring;
      rs.push(Math.abs(x));
      const v = fn(x, 0);
      ys.push(Number.isFinite(v) ? v : 0);
    }
    for (let i = 0; i < ring; i++) {
      for (let j = 0; j < seg; j++) {
        const t0 = 2 * Math.PI * j / seg, t1 = 2 * Math.PI * (j + 1) / seg;
        polys.push([
          { x: rs[i] * Math.cos(t0),     y: ys[i],     z: rs[i] * Math.sin(t0) },
          { x: rs[i + 1] * Math.cos(t0), y: ys[i + 1], z: rs[i + 1] * Math.sin(t0) },
          { x: rs[i + 1] * Math.cos(t1), y: ys[i + 1], z: rs[i + 1] * Math.sin(t1) },
          { x: rs[i] * Math.cos(t1),     y: ys[i],     z: rs[i] * Math.sin(t1) },
        ]);
        polys.push([
          { x: rs[i] * Math.cos(t0),     y: 0, z: rs[i] * Math.sin(t0) },
          { x: rs[i] * Math.cos(t1),     y: 0, z: rs[i] * Math.sin(t1) },
          { x: rs[i + 1] * Math.cos(t1), y: 0, z: rs[i + 1] * Math.sin(t1) },
          { x: rs[i + 1] * Math.cos(t0), y: 0, z: rs[i + 1] * Math.sin(t0) },
        ]);
      }
    }
    // Paredes verticales en el radio interior (x=a) y exterior (x=b).
    wall(polys, rs[0], ys[0], seg);
    wall(polys, rs[ring], ys[ring], seg);
  }
  return polys;
}

function capDisc(polys, x, r, seg) {
  if (!(r > 0)) return;
  for (let j = 0; j < seg; j++) {
    const t0 = 2 * Math.PI * j / seg, t1 = 2 * Math.PI * (j + 1) / seg;
    polys.push([
      { x, y: 0, z: 0 },
      { x, y: r * Math.cos(t0), z: r * Math.sin(t0) },
      { x, y: r * Math.cos(t1), z: r * Math.sin(t1) },
    ]);
  }
}

function wall(polys, r, y, seg) {
  if (!(r > 0)) return;
  for (let j = 0; j < seg; j++) {
    const t0 = 2 * Math.PI * j / seg, t1 = 2 * Math.PI * (j + 1) / seg;
    polys.push([
      { x: r * Math.cos(t0), y,      z: r * Math.sin(t0) },
      { x: r * Math.cos(t1), y,      z: r * Math.sin(t1) },
      { x: r * Math.cos(t1), y: 0,   z: r * Math.sin(t1) },
      { x: r * Math.cos(t0), y: 0,   z: r * Math.sin(t0) },
    ]);
  }
}

export function computeSolidExtent(polys) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let n = 0;
  for (const poly of polys) for (const p of poly) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
    n++;
  }
  if (!n) return { cx: 0, cy: 0, cz: 0, maxR: 0 };
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
  let maxR = 0;
  for (const poly of polys) for (const p of poly) {
    const dx = p.x - cx, dy = p.y - cy, dz = p.z - cz;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > maxR) maxR = d;
  }
  return { cx, cy, cz, maxR };
}

export function recenterSolid(polys) {
  const { cx, cy, cz } = computeSolidExtent(polys);
  return polys.map(poly => poly.map(p => ({ x: p.x - cx, y: p.y - cy, z: p.z - cz })));
}
