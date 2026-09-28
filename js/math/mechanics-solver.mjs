const LINEAR_KEYS = ['x0', 'x', 'v0', 'v', 'a', 't'];
const DYNAMIC_KEYS = ['mass', 'acceleration', 'force', 'speed', 'height', 'gravity', 'kinetic', 'potential', 'total'];
const PROJECTILE_KEYS = ['speed', 'angle', 'vx', 'vy', 'x', 'y0', 'yEnd', 'time', 'gravity'];

const LABEL = {
  x0:'x₀', x:'x', v0:'v₀', v:'v', a:'a', t:'t',
  mass:'m', acceleration:'a', force:'F', speed:'v', height:'h', gravity:'g',
  kinetic:'Ec', potential:'Ep', total:'E',
  angle:'θ', y0:'y₀', yEnd:'yₛ', time:'t', vx:'vₓ', vy:'vᵧ',
};
const SI_UNIT = {
  x0:'m', x:'m', v0:'m/s', v:'m/s', a:'m/s²', t:'s',
  mass:'kg', acceleration:'m/s²', force:'N', speed:'m/s', height:'m', gravity:'m/s²',
  kinetic:'J', potential:'J', total:'J', angle:'rad', y0:'m', yEnd:'m', time:'s', vx:'m/s', vy:'m/s',
};

const fmt = value => String(Number(value.toPrecision(7)));
const near = (left, right) => Math.abs(left - right) <= 1e-7 * Math.max(1, Math.abs(left), Math.abs(right));
const known = value => value !== null && value !== undefined;

function readKnown(source, keys) {
  const values = {};
  for (const key of keys) {
    const value = source[key];
    values[key] = known(value) ? value : null;
    if (known(value) && !Number.isFinite(value)) throw new RangeError(`${LABEL[key]} debe ser un número finito.`);
  }
  return values;
}

function step(formula, values, used, resultKey, resultValue) {
  return {
    formula,
    substitution: `${used.map(key => `${LABEL[key]}=${fmt(values[key])} ${SI_UNIT[key]}`).join(', ')} ⇒ ${LABEL[resultKey]}=${fmt(resultValue)} ${SI_UNIT[resultKey]}`,
  };
}

function assign(state, key, value, formula, used) {
  if (value === null || !Number.isFinite(value)) return false;
  if ((key === 't' || key === 'time') && value < -1e-9) throw new RangeError('El tiempo calculado es negativo.');
  if (known(state.values[key])) {
    if (!near(state.values[key], value)) throw new RangeError(`Los datos de ${LABEL[key]} son incompatibles con ${formula}.`);
    return false;
  }
  state.steps.push(step(formula, state.values, used, key, value));
  state.values[key] = (key === 't' || key === 'time') && value <= 0 ? 0 : value;
  return true;
}

function oneMissing(state, keys, formula, solvers) {
  const missing = keys.filter(key => !known(state.values[key]));
  if (missing.length !== 1) return false;
  const key = missing[0];
  const result = solvers[key]?.(state.values);
  return assign(state, key, result, formula, keys.filter(item => item !== key));
}

function checkEquation(state, keys, left, right, formula) {
  if (keys.every(key => known(state.values[key])) && !near(left(state.values), right(state.values))) {
    throw new RangeError(`Los datos no cumplen ${formula}.`);
  }
}

function propagateLinear(state) {
  let changed = true;
  for (let passes = 0; changed && passes < 12; passes++) {
    changed = false;
    const v = state.values;
    if (known(v.a) && near(v.a, 0) && known(v.v0)) changed = assign(state, 'v', v.v0, 'v = v₀ (MRU)', ['v0', 'a']) || changed;
    if (known(v.a) && near(v.a, 0) && known(v.v)) changed = assign(state, 'v0', v.v, 'v₀ = v (MRU)', ['v', 'a']) || changed;
    changed = oneMissing(state, ['v', 'v0', 'a', 't'], 'v = v₀ + at', {
      v: q => q.v0 + q.a * q.t,
      v0: q => q.v - q.a * q.t,
      a: q => q.t === 0 ? null : (q.v - q.v0) / q.t,
      t: q => q.a === 0 ? null : (q.v - q.v0) / q.a,
    }) || changed;
    changed = oneMissing(state, ['x', 'x0', 'v0', 'a', 't'], 'x = x₀ + v₀t + ½at²', {
      x: q => q.x0 + q.v0 * q.t + q.a * q.t ** 2 / 2,
      x0: q => q.x - q.v0 * q.t - q.a * q.t ** 2 / 2,
      v0: q => q.t === 0 ? null : (q.x - q.x0 - q.a * q.t ** 2 / 2) / q.t,
      a: q => q.t === 0 ? null : 2 * (q.x - q.x0 - q.v0 * q.t) / q.t ** 2,
    }) || changed;
    changed = oneMissing(state, ['x', 'x0', 'v0', 'v', 't'], 'x = x₀ + ½(v₀ + v)t', {
      x: q => q.x0 + (q.v0 + q.v) * q.t / 2,
      x0: q => q.x - (q.v0 + q.v) * q.t / 2,
      v0: q => q.t === 0 ? null : 2 * (q.x - q.x0) / q.t - q.v,
      v: q => q.t === 0 ? null : 2 * (q.x - q.x0) / q.t - q.v0,
      t: q => q.v0 + q.v === 0 ? null : 2 * (q.x - q.x0) / (q.v0 + q.v),
    }) || changed;
    changed = oneMissing(state, ['v', 'v0', 'a', 'x', 'x0'], 'v² = v₀² + 2a(x − x₀)', {
      a: q => q.x === q.x0 ? null : (q.v ** 2 - q.v0 ** 2) / (2 * (q.x - q.x0)),
      x: q => q.a === 0 ? null : q.x0 + (q.v ** 2 - q.v0 ** 2) / (2 * q.a),
      x0: q => q.a === 0 ? null : q.x - (q.v ** 2 - q.v0 ** 2) / (2 * q.a),
    }) || changed;
  }
  const v = state.values;
  checkEquation(state, ['v','v0','a','t'], q => q.v, q => q.v0 + q.a * q.t, 'v = v₀ + at');
  checkEquation(state, ['x','x0','v0','a','t'], q => q.x, q => q.x0 + q.v0 * q.t + q.a * q.t ** 2 / 2, 'x = x₀ + v₀t + ½at²');
  checkEquation(state, ['x','x0','v0','v','t'], q => q.x, q => q.x0 + (q.v0 + q.v) * q.t / 2, 'x = x₀ + ½(v₀+v)t');
  if (known(v.t) && v.t < 0) throw new RangeError('El tiempo no puede ser negativo.');
}

function timeRoots(state) {
  const {x, x0, v0, a, t} = state.values;
  if (known(t) || ![x, x0, v0, a].every(known)) return null;
  const displacement = x - x0;
  if (near(a, 0)) {
    if (near(v0, 0)) return null;
    const time = displacement / v0;
    if (time < 0) throw new RangeError('La posición indicada no se alcanza en tiempo no negativo.');
    return [time];
  }
  const discriminant = v0 ** 2 + 2 * a * displacement;
  if (discriminant < -1e-9) throw new RangeError('La posición indicada no se alcanza con estos datos.');
  const root = Math.sqrt(Math.max(0, discriminant));
  const roots = [(-v0 + root) / a, (-v0 - root) / a]
    .filter(value => value >= -1e-9)
    .map(value => Math.max(0, value))
    .filter((value, index, values) => values.findIndex(other => near(other, value)) === index);
  if (!roots.length) throw new RangeError('La posición indicada no se alcanza en tiempo no negativo.');
  return roots;
}

export function solveLinearExercise(source, mode = 'mrua') {
  if (!['mru', 'mrua'].includes(mode)) throw new RangeError('Selecciona MRU o MRUA.');
  const values = readKnown(source, LINEAR_KEYS);
  if (mode === 'mru') {
    if (known(values.a) && !near(values.a, 0)) throw new RangeError('En MRU la aceleración debe ser cero.');
    values.a = 0;
  }
  const initial = {values, steps: []};
  propagateLinear(initial);
  const roots = timeRoots(initial);
  let solutions = roots?.length ? roots.map(time => {
    const state = {values: {...initial.values}, steps: [...initial.steps]};
    assign(state, 't', time, 'x = x₀ + v₀t + ½at² (raíz no negativa)', ['x','x0','v0','a']);
    propagateLinear(state);
    return state;
  }) : [initial];
  if (!roots && [values.v,values.a,values.x,values.x0].every(known) && !known(initial.values.v0)) {
    const square = values.v ** 2 - 2 * values.a * (values.x - values.x0);
    if (square < -1e-9) throw new RangeError('El estado inicial no puede producir esos datos.');
    solutions = [Math.sqrt(Math.max(0,square)),-Math.sqrt(Math.max(0,square))].flatMap(v0 => {
      const state = {values:{...initial.values},steps:[...initial.steps]};
      try {
        assign(state,'v0',v0,'v₀ = ±√(v² − 2a(x − x₀))',['v','a','x','x0']);
        propagateLinear(state);
        return [state];
      } catch (error) { return []; }
    }).filter((state,index,list) => list.findIndex(other => near(other.values.v0,state.values.v0)) === index);
    if (!solutions.length) throw new RangeError('Los datos no producen un tiempo no negativo.');
  }
  return solutions.map(state => ({
    ...state,
    missing: LINEAR_KEYS.filter(key => !known(state.values[key])),
  }));
}

export function linearStateAt(values, time) {
  if (![values.x0, values.v0, values.a, time].every(Number.isFinite) || time < 0) {
    throw new RangeError('Faltan datos para dibujar el movimiento.');
  }
  const x = values.x0 + values.v0 * time + values.a * time ** 2 / 2;
  const velocity = values.v0 + values.a * time;
  if (![x, velocity].every(Number.isFinite)) throw new RangeError('El resultado excede el límite numérico.');
  return {x, velocity, displacement: x - values.x0, time};
}

export function solveDynamicsExercise(source) {
  const state = {values: readKnown(source, DYNAMIC_KEYS), steps: []};
  const v = state.values;
  for (const key of ['mass', 'speed', 'height', 'kinetic', 'potential', 'total']) {
    if (known(v[key]) && v[key] < 0) throw new RangeError(`${LABEL[key]} no puede ser negativo.`);
  }
  if (known(v.gravity) && v.gravity <= 0) throw new RangeError('La gravedad debe ser positiva.');
  let changed = true;
  for (let passes = 0; changed && passes < 12; passes++) {
    changed = false;
    changed = oneMissing(state, ['force','mass','acceleration'], 'F = ma', {
      force: q => q.mass * q.acceleration,
      mass: q => q.acceleration === 0 ? null : q.force / q.acceleration,
      acceleration: q => q.mass === 0 ? null : q.force / q.mass,
    }) || changed;
    changed = oneMissing(state, ['kinetic','mass','speed'], 'Ec = ½mv²', {
      kinetic: q => q.mass * q.speed ** 2 / 2,
      mass: q => q.speed === 0 ? null : 2 * q.kinetic / q.speed ** 2,
      speed: q => q.mass === 0 || q.kinetic < 0 ? null : Math.sqrt(2 * q.kinetic / q.mass),
    }) || changed;
    changed = oneMissing(state, ['potential','mass','gravity','height'], 'Ep = mgh', {
      potential: q => q.mass * q.gravity * q.height,
      mass: q => q.gravity * q.height === 0 ? null : q.potential / (q.gravity * q.height),
      gravity: q => q.mass * q.height === 0 ? null : q.potential / (q.mass * q.height),
      height: q => q.mass * q.gravity === 0 ? null : q.potential / (q.mass * q.gravity),
    }) || changed;
    changed = oneMissing(state, ['total','kinetic','potential'], 'E = Ec + Ep', {
      total: q => q.kinetic + q.potential,
      kinetic: q => q.total - q.potential,
      potential: q => q.total - q.kinetic,
    }) || changed;
  }
  checkEquation(state, ['force','mass','acceleration'], q => q.force, q => q.mass * q.acceleration, 'F = ma');
  checkEquation(state, ['kinetic','mass','speed'], q => q.kinetic, q => q.mass * q.speed ** 2 / 2, 'Ec = ½mv²');
  checkEquation(state, ['potential','mass','gravity','height'], q => q.potential, q => q.mass * q.gravity * q.height, 'Ep = mgh');
  checkEquation(state, ['total','kinetic','potential'], q => q.total, q => q.kinetic + q.potential, 'E = Ec + Ep');
  if (v.mass === 0 && ((known(v.force) && !near(v.force,0)) || (known(v.kinetic) && !near(v.kinetic,0)) || (known(v.potential) && !near(v.potential,0)))) {
    throw new RangeError('Una masa cero no puede producir esa fuerza o energía.');
  }
  for (const key of ['mass', 'speed', 'height', 'gravity', 'kinetic', 'potential', 'total']) {
    if (known(v[key]) && v[key] < 0) throw new RangeError(`Los datos implican ${LABEL[key]} negativo.`);
  }
  return {...state, missing: DYNAMIC_KEYS.filter(key => !known(v[key]))};
}

function projectileAssign(state, key, value, formula, used) {
  if (!Number.isFinite(value)) return false;
  if (key === 'time' && value < -1e-9) throw new RangeError('El tiempo debe ser no negativo.');
  return assign(state, key, value, formula, used);
}

function propagateProjectile(state) {
  for (let pass = 0, changed = true; pass < 12 && changed; pass++) {
    changed = false;
    const v = state.values;
    const add = (key, value, formula, used) => { changed = projectileAssign(state, key, value, formula, used) || changed; };
    if (known(v.speed) && known(v.angle)) {
      add('vx', v.speed * Math.cos(v.angle), 'vₓ = v cos θ', ['speed', 'angle']);
      add('vy', v.speed * Math.sin(v.angle), 'vᵧ = v sen θ', ['speed', 'angle']);
    }
    if (known(v.vx) && known(v.angle) && !near(Math.cos(v.angle),0)) {
      add('speed',v.vx/Math.cos(v.angle),'v = vₓ/cos θ',['vx','angle']);
    }
    if (known(v.vy) && known(v.angle) && !near(Math.sin(v.angle),0)) {
      add('speed',v.vy/Math.sin(v.angle),'v = vᵧ/sen θ',['vy','angle']);
    }
    if (known(v.vx) && known(v.vy)) {
      add('speed', Math.hypot(v.vx, v.vy), 'v = √(vₓ² + vᵧ²)', ['vx', 'vy']);
      if (!near(v.vx, 0) || !near(v.vy, 0)) add('angle', Math.atan2(v.vy, v.vx), 'θ = atan2(vᵧ, vₓ)', ['vx', 'vy']);
    }
    if (known(v.x) && known(v.time) && v.time > 0) add('vx', v.x / v.time, 'vₓ = x/t', ['x', 'time']);
    if (known(v.vx) && known(v.time)) add('x', v.vx * v.time, 'x = vₓt', ['vx', 'time']);
    if (known(v.x) && known(v.vx) && !near(v.vx, 0)) add('time', v.x / v.vx, 't = x/vₓ', ['x', 'vx']);
    if ([v.y0,v.yEnd,v.time,v.gravity].every(known) && v.time > 0) {
      add('vy', (v.yEnd - v.y0 + v.gravity * v.time ** 2 / 2) / v.time,
        'vᵧ = (yₛ − y₀ + ½gt²)/t', ['yEnd','y0','gravity','time']);
    }
    if ([v.y0,v.vy,v.time,v.gravity].every(known)) {
      add('yEnd', v.y0 + v.vy * v.time - v.gravity * v.time ** 2 / 2,
        'yₛ = y₀ + vᵧt − ½gt²', ['y0','vy','time','gravity']);
    }
    if ([v.yEnd,v.vy,v.time,v.gravity].every(known)) {
      add('y0', v.yEnd - v.vy * v.time + v.gravity * v.time ** 2 / 2,
        'y₀ = yₛ − vᵧt + ½gt²', ['yEnd','vy','time','gravity']);
    }
    if ([v.y0,v.yEnd,v.vy,v.time].every(known) && v.time > 0) {
      add('gravity',2*(v.y0+v.vy*v.time-v.yEnd)/v.time**2,
        'g = 2(y₀ + vᵧt − yₛ)/t²',['y0','vy','time','yEnd']);
    }
    if (known(v.speed) && known(v.vx) && !known(v.vy) && near(v.speed, Math.abs(v.vx))) {
      add('vy', 0, 'vᵧ² = v² − vₓ²', ['speed','vx']);
    }
    if (known(v.speed) && known(v.vy) && !known(v.vx) && near(v.speed, Math.abs(v.vy))) {
      add('vx', 0, 'vₓ² = v² − vᵧ²', ['speed','vy']);
    }
  }
  const v = state.values;
  if (known(v.speed) && v.speed < 0) throw new RangeError('La rapidez debe ser no negativa.');
  if (known(v.gravity) && v.gravity <= 0) throw new RangeError('La gravedad debe ser positiva.');
  if (known(v.time) && v.time < 0) throw new RangeError('El tiempo debe ser no negativo.');
  if (known(v.angle) && Math.abs(v.angle) > Math.PI + 1e-9) throw new RangeError('El ángulo debe estar entre −180° y 180°.');
  if ([v.vx,v.time,v.x].every(known) && !near(v.x, v.vx * v.time)) throw new RangeError('Los datos horizontales son incompatibles.');
  if ([v.y0,v.vy,v.time,v.gravity,v.yEnd].every(known) && !near(v.yEnd, v.y0 + v.vy*v.time - v.gravity*v.time**2/2)) {
    throw new RangeError('Los datos verticales son incompatibles.');
  }
}

function projectileTimeRoots(v) {
  if (![v.y0,v.yEnd,v.vy,v.gravity].every(known)) return [];
  const d = v.vy**2 - 2*v.gravity*(v.yEnd-v.y0);
  if (d < -1e-9) throw new RangeError('El proyectil no alcanza esa altura.');
  const root = Math.sqrt(Math.max(0,d));
  const roots = [(v.vy-root)/v.gravity,(v.vy+root)/v.gravity]
    .filter(t => t >= -1e-9).map(t => Math.max(0,t))
    .filter((t,i,list) => list.findIndex(other => near(other,t)) === i);
  if (!roots.length) throw new RangeError('El proyectil no alcanza esa altura en tiempo no negativo.');
  return roots.some(t => t > 1e-9) ? roots.filter(t => t > 1e-9) : roots;
}

function projectileCandidates(initial) {
  const v = initial.values;
  const candidates = [];
  const add = (key, value, formula, used) => {
    const candidate = {values:{...v}, steps:[...initial.steps]};
    try {
      projectileAssign(candidate,key,value,formula,used);
      propagateProjectile(candidate);
      const roots = known(candidate.values.time) ? [] : projectileTimeRoots(candidate.values);
      if (!roots.length) candidates.push(candidate);
      for (const time of roots) {
        const branch = {values:{...candidate.values},steps:[...candidate.steps]};
        try {
          projectileAssign(branch,'time',time,'yₛ = y₀ + vᵧt − ½gt² (raíz)',['yEnd','y0','vy','gravity']);
          propagateProjectile(branch);
          candidates.push(branch);
        } catch (error) { /* Esta raíz no cumple las demás medidas. */ }
      }
    } catch (error) { /* This branch conflicts with supplied measurements. */ }
  };
  if (!known(v.time)) {
    for (const t of projectileTimeRoots(v)) add('time',t,'yₛ = y₀ + vᵧt − ½gt² (raíz)', ['yEnd','y0','vy','gravity']);
  }
  if (known(v.speed) && known(v.vx) && !known(v.vy)) {
    const square = v.speed**2-v.vx**2;
    if (square >= -1e-9) for (const vy of [Math.sqrt(Math.max(0,square)),-Math.sqrt(Math.max(0,square))]) {
      add('vy',vy,'vᵧ = ±√(v² − vₓ²)', ['speed','vx']);
    }
  }
  if (known(v.speed) && known(v.vy) && !known(v.vx)) {
    const square = v.speed**2-v.vy**2;
    if (square >= -1e-9) for (const vx of [Math.sqrt(Math.max(0,square)),-Math.sqrt(Math.max(0,square))]) {
      add('vx',vx,'vₓ = ±√(v² − vᵧ²)', ['speed','vy']);
    }
  }
  if ([v.x,v.speed,v.y0,v.yEnd,v.gravity].every(known) && !known(v.time)) {
    const dy = v.yEnd-v.y0;
    const b = v.gravity*dy-v.speed**2;
    const discriminant = b**2-v.gravity**2*(v.x**2+dy**2);
    if (discriminant < -1e-9) throw new RangeError('El destino está fuera del alcance con esa rapidez.');
    if (discriminant >= -1e-9) {
      for (const t2 of [2*(-b+Math.sqrt(Math.max(0,discriminant)))/v.gravity**2,
        2*(-b-Math.sqrt(Math.max(0,discriminant)))/v.gravity**2]) {
        if (t2 > 1e-12) add('time',Math.sqrt(t2),
          '¼g²t⁴ + (gΔy − v²)t² + x² + Δy² = 0', ['gravity','yEnd','y0','speed','x']);
      }
    }
  }
  if ([v.x,v.angle,v.y0,v.yEnd,v.gravity].every(known) && !known(v.speed)) {
    const c = Math.cos(v.angle);
    const denominator = 2*c*c*(v.x*Math.tan(v.angle)-(v.yEnd-v.y0));
    if (Math.abs(denominator) > 1e-12) {
      const speed2 = v.gravity*v.x**2/denominator;
      if (speed2 >= 0) add('speed',Math.sqrt(speed2),
        'v² = gx²/[2cos²θ(x tan θ − Δy)]', ['gravity','x','angle','yEnd','y0']);
    }
  }
  if ([v.time,v.speed,v.y0,v.yEnd,v.gravity].every(known) && v.time > 0 && !known(v.vy)) {
    const vy = (v.yEnd-v.y0+v.gravity*v.time**2/2)/v.time;
    const candidate = {values:{...v},steps:[...initial.steps]};
    try {
      projectileAssign(candidate,'vy',vy,'vᵧ = (Δy + ½gt²)/t',['yEnd','y0','gravity','time']);
      propagateProjectile(candidate);
      candidates.push(...projectileCandidates(candidate));
    } catch (error) { /* Incompatible branch. */ }
  }
  return candidates;
}

export function solveProjectileExercise(source) {
  const values = readKnown(source, PROJECTILE_KEYS);
  const initial = {values, steps:[]};
  propagateProjectile(initial);
  const branches = projectileCandidates(initial);
  if (!branches.length && known(initial.values.speed) && known(initial.values.vx) && initial.values.speed < Math.abs(initial.values.vx) - 1e-9) {
    throw new RangeError('La rapidez es menor que su componente horizontal.');
  }
  if (!branches.length && known(initial.values.speed) && known(initial.values.vy) && initial.values.speed < Math.abs(initial.values.vy) - 1e-9) {
    throw new RangeError('La rapidez es menor que su componente vertical.');
  }
  const solutions = branches.length ? branches : [initial];
  const unique = solutions.filter((item,index) => solutions.findIndex(other =>
    ['time','vx','vy','angle'].every(key => known(item.values[key]) === known(other.values[key]) &&
      (!known(item.values[key]) || near(item.values[key],other.values[key])))) === index);
  return unique.map(state => ({...state, missing:PROJECTILE_KEYS.filter(key => !known(state.values[key]))}));
}

export function projectileStateAt(values, time) {
  if (![values.vx,values.vy,values.gravity,time].every(Number.isFinite) || time < 0) {
    throw new RangeError('Faltan datos para dibujar el tiro.');
  }
  const y0 = Number.isFinite(values.y0) ? values.y0 : 0;
  const x = values.vx*time;
  const y = y0+values.vy*time-values.gravity*time**2/2;
  const vy = values.vy-values.gravity*time;
  return {x,y,vx:values.vx,vy,speed:Math.hypot(values.vx,vy),time,displacementY:y-y0};
}
