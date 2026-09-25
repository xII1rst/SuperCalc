// Mallas geométricas y dibujo compartidos por los canvas de vectores y EM.
// Cada generador devuelve polígonos de puntos {x, y, z}.

export function genSphere(cx, cy, cz, r, segs = 18) {
  const polys = [];
  for (let i = 0; i < segs; i++) {
    const t0 = Math.PI * i / segs, t1 = Math.PI * (i + 1) / segs;
    for (let j = 0; j < segs * 2; j++) {
      const p0 = Math.PI * 2 * j / (segs * 2), p1 = Math.PI * 2 * (j + 1) / (segs * 2);
      polys.push([
        { x: cx + r * Math.sin(t0) * Math.cos(p0), y: cy + r * Math.cos(t0), z: cz + r * Math.sin(t0) * Math.sin(p0) },
        { x: cx + r * Math.sin(t0) * Math.cos(p1), y: cy + r * Math.cos(t0), z: cz + r * Math.sin(t0) * Math.sin(p1) },
        { x: cx + r * Math.sin(t1) * Math.cos(p1), y: cy + r * Math.cos(t1), z: cz + r * Math.sin(t1) * Math.sin(p1) },
        { x: cx + r * Math.sin(t1) * Math.cos(p0), y: cy + r * Math.cos(t1), z: cz + r * Math.sin(t1) * Math.sin(p0) },
      ]);
    }
  }
  return polys;
}

export function genCylinder(cx, cy, cz, r, h, segs = 24) {
  const polys = [], y0 = cy - h / 2, y1 = cy + h / 2;
  for (let j = 0; j < segs; j++) {
    const a0 = Math.PI * 2 * j / segs, a1 = Math.PI * 2 * (j + 1) / segs;
    polys.push([
      { x: cx + r * Math.cos(a0), y: y0, z: cz + r * Math.sin(a0) },
      { x: cx + r * Math.cos(a1), y: y0, z: cz + r * Math.sin(a1) },
      { x: cx + r * Math.cos(a1), y: y1, z: cz + r * Math.sin(a1) },
      { x: cx + r * Math.cos(a0), y: y1, z: cz + r * Math.sin(a0) },
    ]);
    polys.push([{ x: cx, y: y0, z: cz }, { x: cx + r * Math.cos(a0), y: y0, z: cz + r * Math.sin(a0) }, { x: cx + r * Math.cos(a1), y: y0, z: cz + r * Math.sin(a1) }]);
    polys.push([{ x: cx, y: y1, z: cz }, { x: cx + r * Math.cos(a0), y: y1, z: cz + r * Math.sin(a0) }, { x: cx + r * Math.cos(a1), y: y1, z: cz + r * Math.sin(a1) }]);
  }
  return polys;
}

export function genCone(cx, cy, cz, r, h, segs = 24) {
  const polys = [], yBase = cy, yTip = cy + h;
  for (let j = 0; j < segs; j++) {
    const a0 = Math.PI * 2 * j / segs, a1 = Math.PI * 2 * (j + 1) / segs;
    polys.push([
      { x: cx + r * Math.cos(a0), y: yBase, z: cz + r * Math.sin(a0) },
      { x: cx + r * Math.cos(a1), y: yBase, z: cz + r * Math.sin(a1) },
      { x: cx, y: yTip, z: cz },
    ]);
    polys.push([{ x: cx, y: yBase, z: cz }, { x: cx + r * Math.cos(a0), y: yBase, z: cz + r * Math.sin(a0) }, { x: cx + r * Math.cos(a1), y: yBase, z: cz + r * Math.sin(a1) }]);
  }
  return polys;
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function genPlane(cx, cy, cz, nx, ny, nz, size) {
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  const n = [nx / len, ny / len, nz / len];
  const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = cross(n, up);
  const uL = Math.sqrt(u[0] ** 2 + u[1] ** 2 + u[2] ** 2);
  const uu = [u[0] / uL, u[1] / uL, u[2] / uL];
  const v = cross(uu, n);
  const corners = [
    [cx + uu[0] * size + v[0] * size, cy + uu[1] * size + v[1] * size, cz + uu[2] * size + v[2] * size],
    [cx - uu[0] * size + v[0] * size, cy - uu[1] * size + v[1] * size, cz - uu[2] * size + v[2] * size],
    [cx - uu[0] * size - v[0] * size, cy - uu[1] * size - v[1] * size, cz - uu[2] * size - v[2] * size],
    [cx + uu[0] * size - v[0] * size, cy + uu[1] * size - v[1] * size, cz + uu[2] * size - v[2] * size],
  ];
  return [corners.map(c => ({ x: c[0], y: c[1], z: c[2] }))];
}

export function genTorus(cx, cy, cz, R, r, segs = 20) {
  const polys = [];
  for (let i = 0; i < segs; i++) {
    const u0 = Math.PI * 2 * i / segs, u1 = Math.PI * 2 * (i + 1) / segs;
    for (let j = 0; j < segs; j++) {
      const v0 = Math.PI * 2 * j / segs, v1 = Math.PI * 2 * (j + 1) / segs;
      const pt = (u, v) => ({
        x: cx + (R + r * Math.cos(v)) * Math.cos(u),
        y: cy + r * Math.sin(v),
        z: cz + (R + r * Math.cos(v)) * Math.sin(u),
      });
      polys.push([pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)]);
    }
  }
  return polys;
}

// projectFn(x, y, z) devuelve {sx, sy, z2}; state contiene tipo, parámetros y estilo.
export function renderFigure(ctx, projectFn, state) {
  if (!state) return;
  const { type, params, cx: ox, cy: oy, cz: oz, color, opacity } = state;
  let polys = [];
  if (type === 'sphere') polys = genSphere(ox, oy, oz, params.r);
  else if (type === 'cylinder') polys = genCylinder(ox, oy, oz, params.r, params.h);
  else if (type === 'cone') polys = genCone(ox, oy, oz, params.r, params.h);
  else if (type === 'plane') polys = genPlane(ox, oy, oz, params.nx, params.ny, params.nz, params.size);
  else if (type === 'torus') polys = genTorus(ox, oy, oz, params.R, params.r);

  const projected = polys.map(poly => {
    const pts = poly.map(p => projectFn(p.x, p.y, p.z));
    const zAvg = pts.reduce((sum, point) => sum + (point.z2 ?? 0), 0) / pts.length;
    return { pts, zAvg };
  });
  projected.sort((a, b) => a.zAvg - b.zAvg);

  const alpha = opacity / 100;
  ctx.save();
  projected.forEach(({ pts }) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
    ctx.closePath();
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = Math.min(alpha * 1.8, 0.75);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}
