// Proyección ortográfica 3D → 2D compartida (RX luego RY, sin perspectiva).
// `scale` es el multiplicador completo píxeles/unidad; el llamador decide la base.
export function project3D(x, y, z, { rotX = 0, rotY = 0, scale = 1, cx = 0, cy = 0 } = {}) {
  const rx = rotX * Math.PI / 180;
  const ry = rotY * Math.PI / 180;
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  return { sx: cx + x2 * scale, sy: cy - y1 * scale, z2 };
}
