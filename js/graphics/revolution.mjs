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

// Malla de la región comprendida entre dos curvas al girarla alrededor del eje.
export function genRevolutionSolidBetween(fn, gn, a, b, axis = 'x', { segments = 48, rings = 32, offset = 0 } = {}) {
  const seg = Math.max(3, segments | 0), ring = Math.max(2, rings | 0);
  const polys = [], sections = [];
  for(let i=0;i<=ring;i++){
    const x=a+(b-a)*i/ring, f=fn(x,0), g=gn(x,0);
    if(!Number.isFinite(f)||!Number.isFinite(g))
      throw new RangeError('Las funciones deben ser finitas en todo el intervalo');
    const first=f-offset,second=g-offset;
    const outer=Math.max(Math.abs(first),Math.abs(second));
    const inner=first*second<=0 ? 0 : Math.min(Math.abs(first),Math.abs(second));
    sections.push({x,outer,inner,lower:Math.min(f,g),upper:Math.max(f,g)});
  }
  for(let i=0;i<ring;i++){
    const p=sections[i], q=sections[i+1];
    for(let j=0;j<seg;j++){
      const t0=2*Math.PI*j/seg, t1=2*Math.PI*(j+1)/seg;
      if(axis==='x'){
        revolutionQuad(polys,p.x,p.outer,q.x,q.outer,t0,t1);
        if(p.inner>0||q.inner>0)
          revolutionQuad(polys,p.x,p.inner,q.x,q.inner,t0,t1);
      }else{
        horizontalQuad(polys,Math.abs(p.x-offset),p.upper,Math.abs(q.x-offset),q.upper,t0,t1);
        horizontalQuad(polys,Math.abs(p.x-offset),p.lower,Math.abs(q.x-offset),q.lower,t0,t1);
      }
    }
  }
  if(axis==='x'){
    capAnnulus(polys,sections[0].x,sections[0].outer,sections[0].inner,seg);
    capAnnulus(polys,sections[ring].x,sections[ring].outer,sections[ring].inner,seg);
  }else{
    wallBetween(polys,Math.abs(a-offset),sections[0].lower,sections[0].upper,seg);
    wallBetween(polys,Math.abs(b-offset),sections[ring].lower,sections[ring].upper,seg);
  }
  return polys;
}

function revolutionQuad(polys,x0,r0,x1,r1,t0,t1){
  polys.push([
    {x:x0,y:r0*Math.cos(t0),z:r0*Math.sin(t0)},
    {x:x1,y:r1*Math.cos(t0),z:r1*Math.sin(t0)},
    {x:x1,y:r1*Math.cos(t1),z:r1*Math.sin(t1)},
    {x:x0,y:r0*Math.cos(t1),z:r0*Math.sin(t1)},
  ]);
}

function horizontalQuad(polys,r0,y0,r1,y1,t0,t1){
  polys.push([
    {x:r0*Math.cos(t0),y:y0,z:r0*Math.sin(t0)},
    {x:r1*Math.cos(t0),y:y1,z:r1*Math.sin(t0)},
    {x:r1*Math.cos(t1),y:y1,z:r1*Math.sin(t1)},
    {x:r0*Math.cos(t1),y:y0,z:r0*Math.sin(t1)},
  ]);
}

function capAnnulus(polys,x,outer,inner,seg){
  if(outer<=inner) return;
  for(let j=0;j<seg;j++){
    const t0=2*Math.PI*j/seg, t1=2*Math.PI*(j+1)/seg;
    polys.push([
      {x,y:inner*Math.cos(t0),z:inner*Math.sin(t0)},
      {x,y:outer*Math.cos(t0),z:outer*Math.sin(t0)},
      {x,y:outer*Math.cos(t1),z:outer*Math.sin(t1)},
      {x,y:inner*Math.cos(t1),z:inner*Math.sin(t1)},
    ]);
  }
}

function wallBetween(polys,r,lower,upper,seg){
  if(r===0||lower===upper) return;
  for(let j=0;j<seg;j++){
    const t0=2*Math.PI*j/seg, t1=2*Math.PI*(j+1)/seg;
    polys.push([
      {x:r*Math.cos(t0),y:lower,z:r*Math.sin(t0)},
      {x:r*Math.cos(t0),y:upper,z:r*Math.sin(t0)},
      {x:r*Math.cos(t1),y:upper,z:r*Math.sin(t1)},
      {x:r*Math.cos(t1),y:lower,z:r*Math.sin(t1)},
    ]);
  }
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
