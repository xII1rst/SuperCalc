// Secciones cónicas: parábola, elipse, hipérbola, circunferencia y clasificación
// de la cónica general Ax² + Bxy + Cy² + Dx + Ey + F = 0. Sin DOM.

// Parábola con vértice en (h,k) y distancia focal p.
// vertical=true → (x−h)² = 4p(y−k); vertical=false → (y−k)² = 4p(x−h).
export function parabola(h, k, p, vertical = true) {
  if (vertical) {
    return {
      vertex: { x: h, y: k },
      focus: { x: h, y: k + p },
      directrixY: k - p,
      directrixX: null,
      p,
      latusRectum: Math.abs(4 * p),
      opens: p >= 0 ? 'arriba' : 'abajo',
    };
  }
  return {
    vertex: { x: h, y: k },
    focus: { x: h + p, y: k },
    directrixX: h - p,
    directrixY: null,
    p,
    latusRectum: Math.abs(4 * p),
    opens: p >= 0 ? 'derecha' : 'izquierda',
  };
}

// Elipse centrada en (h,k) con semiejes a y b. Se reordena para que a ≥ b.
// horizontal=true → eje mayor sobre la horizontal.
export function ellipse(h, k, a, b, horizontal = true) {
  if (a < b) { const t = a; a = b; b = t; }
  const c = Math.sqrt(a * a - b * b);
  const foci = horizontal
    ? [{ x: h - c, y: k }, { x: h + c, y: k }]
    : [{ x: h, y: k - c }, { x: h, y: k + c }];
  const vertices = horizontal
    ? [{ x: h - a, y: k }, { x: h + a, y: k }]
    : [{ x: h, y: k - a }, { x: h, y: k + a }];
  const coVertices = horizontal
    ? [{ x: h, y: k - b }, { x: h, y: k + b }]
    : [{ x: h - b, y: k }, { x: h + b, y: k }];
  return {
    center: { x: h, y: k }, a, b, c, foci, vertices, coVertices,
    eccentricity: c / a, latusRectum: 2 * b * b / a,
  };
}

// Hipérbola centrada en (h,k); a = semieje transverso, b = conjugado.
// horizontal=true → eje transverso sobre la horizontal.
export function hyperbola(h, k, a, b, horizontal = true) {
  const c = Math.sqrt(a * a + b * b);
  const foci = horizontal
    ? [{ x: h - c, y: k }, { x: h + c, y: k }]
    : [{ x: h, y: k - c }, { x: h, y: k + c }];
  const vertices = horizontal
    ? [{ x: h - a, y: k }, { x: h + a, y: k }]
    : [{ x: h, y: k - a }, { x: h, y: k + a }];
  // Asíntotas: y − k = ±m(x − h); m = b/a (horizontal) o a/b (vertical).
  const m = horizontal ? b / a : a / b;
  const asymptotes = [
    { slope: m, intercept: k - m * h },
    { slope: -m, intercept: k + m * h },
  ];
  return {
    center: { x: h, y: k }, a, b, c, foci, vertices, asymptotes,
    eccentricity: c / a, latusRectum: 2 * b * b / a,
  };
}

export function circle(h, k, r) {
  return {
    center: { x: h, y: k },
    radius: r,
    area: Math.PI * r * r,
    circumference: 2 * Math.PI * r,
  };
}

// Clasifica la cónica general por su discriminante B² − 4AC.
export function conicClassify(A, B, C, D = 0, E = 0, F = 0) {
  const disc = B * B - 4 * A * C;
  let type;
  if (disc < -1e-12) type = (B === 0 && A === C) ? 'circle' : 'ellipse';
  else if (disc > 1e-12) type = 'hyperbola';
  else type = 'parabola';
  return { discriminant: disc, type };
}
