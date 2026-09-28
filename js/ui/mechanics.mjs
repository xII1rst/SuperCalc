import { MECHANICS_UNITS, convertMechanicsUnit, fromMechanicsSI, toMechanicsSI } from '../math/mechanics-units.mjs';
import { solveLinearExercise, solveProjectileExercise, solveDynamicsExercise, linearStateAt, projectileStateAt } from '../math/mechanics-solver.mjs';
import { drawLinearMotion, drawExerciseProjectile } from '../graphics/mechanics-trajectory.mjs';
import { fN } from '../utils/format.mjs';

const FIELDS = {
  motion: [
    ['x0','mech-x0','Posición inicial','length','0'], ['x','mech-x','Posición final','length',''],
    ['v0','mech-v0','Velocidad inicial','speed','10'], ['v','mech-v','Velocidad final','speed',''],
    ['a','mech-a','Aceleración','acceleration','2'], ['t','mech-t','Tiempo','time','5'],
  ],
  projectile: [
    ['speed','mech-speed','Rapidez inicial','speed','20'], ['angle','mech-angle','Ángulo desde la horizontal','angle','45'],
    ['vx','mech-vx','Velocidad horizontal inicial','speed',''], ['vy','mech-vy','Velocidad vertical inicial','speed',''],
    ['x','mech-destination','Destino horizontal','length',''], ['y0','mech-height','Altura inicial','length','0'],
    ['yEnd','mech-landing','Altura final','length','0'], ['time','mech-flight-time','Tiempo de vuelo','time',''],
    ['gravity','mech-g','Gravedad','acceleration','9.81'],
  ],
  dynamics: [
    ['mass','mech-mass','Masa','mass','2'], ['acceleration','mech-accel','Aceleración','acceleration','3'],
    ['force','mech-force','Fuerza neta','force',''], ['speed','mech-energy-speed','Rapidez','speed','4'],
    ['height','mech-energy-height','Altura','length','5'], ['gravity','mech-energy-g','Gravedad','acceleration','9.81'],
    ['kinetic','mech-kinetic','Energía cinética','energy',''], ['potential','mech-potential','Energía potencial','energy',''],
    ['total','mech-total','Energía total','energy',''],
  ],
};
const latest = {motion:null,projectile:null,dynamics:null};
const choice = {motion:0,projectile:0};
const currentTime = {motion:null,projectile:null};
let initialized = false;
const el = id => document.getElementById(id);
const field = (panel,key) => FIELDS[panel].find(item => item[0] === key);
const fmt = value => fN(value,6);

function unit(panel,key) {
  const item = field(panel,key);
  const units = MECHANICS_UNITS[item[3]];
  const selected = el(`${item[1]}-unit`)?.value;
  return Object.hasOwn(units,selected) ? selected : (item[3] === 'angle' ? '°' : Object.keys(units)[0]);
}
function read(panel,key) {
  const item = field(panel,key);
  const raw = el(item[1])?.value?.trim();
  if (raw === '' || raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new RangeError(`${item[2]} debe ser un número finito.`);
  return toMechanicsSI(value,item[3],unit(panel,key));
}
const inputs = panel => Object.fromEntries(FIELDS[panel].map(([key]) => [key,read(panel,key)]));
function fieldMarkup(panel,[key,id,label,quantity,defaultValue]) {
  const selected = quantity === 'angle' ? '°' : Object.keys(MECHANICS_UNITS[quantity])[0];
  const options = Object.keys(MECHANICS_UNITS[quantity]).map(name => `<option value="${name}" ${name === selected ? 'selected' : ''}>${name}</option>`).join('');
  return `<label class="mech-field" for="${id}"><span>${label}</span><span class="mech-field-control"><input id="${id}" class="tool-input" type="number" step="any" value="${defaultValue}" placeholder="sin dato"><select id="${id}-unit" class="tool-input" aria-label="Unidad de ${label}" data-action="mechUnitChanged" data-event="change" data-arg="${panel}:${key}" data-previous="${selected}">${options}</select></span></label>`;
}
export function mechInitialize() {
  if (initialized) return;
  for (const panel of Object.keys(FIELDS)) el(`mech-${panel}-fields`).innerHTML = FIELDS[panel].map(item => fieldMarkup(panel,item)).join('');
  initialized = true;
}
export function mechOpenPanel(panel) {
  const copy = {
    motion:['Movimiento rectilíneo','Resuelve MRU o MRUA con los datos disponibles y explora posición y velocidad en el tiempo.'],
    projectile:['Tiro parabólico','Despeja lanzamiento o destino y sigue la trayectoria con sus vectores.'],
    dynamics:['Fuerza y energía','Despeja fuerza, masa, aceleración y energías con los datos disponibles.'],
  };
  if (!Object.hasOwn(copy,panel)) return;
  for (const name of Object.keys(FIELDS)) {
    const card = el(`mech-${name}-card`);
    card.hidden = name !== panel;
    card.inert = name !== panel;
  }
  el('mech-panel-title').textContent = copy[panel][0];
  el('mech-panel-heading').textContent = copy[panel][0];
  el('mech-panel-description').textContent = copy[panel][1];
  const scroll = el('mech-app')?.querySelector?.('.tool-scroll');
  if (scroll) scroll.scrollTop = 0;
  if (panel === 'motion' || panel === 'projectile') mechRedrawTrajectory();
}
function error(panel,cause) {
  const target = el(`mech-${panel}-result`);
  target.textContent = cause.message;
  target.classList.add('tool-error');
  latest[panel] = null;
}
function stat(label,value,quantity,displayUnit) {
  if (!Number.isFinite(value)) return '';
  return `<div class="tool-stat"><span>${label}</span><strong>${fmt(fromMechanicsSI(value,quantity,displayUnit))} ${displayUnit}</strong></div>`;
}
const stats = (panel,values) => FIELDS[panel].map(([key,,label,quantity]) => stat(label,values[key],quantity,unit(panel,key))).join('');
function conversions(panel) {
  return FIELDS[panel].flatMap(([key,id,label,quantity]) => {
    const raw = el(id)?.value?.trim();
    if (raw === '' || raw === undefined) return [];
    const chosen = unit(panel,key);
    const base = Object.keys(MECHANICS_UNITS[quantity])[0];
    return chosen === base ? [] : [`<li>${label}: ${fmt(Number(raw))} ${chosen} = ${fmt(toMechanicsSI(Number(raw),quantity,chosen))} ${base}</li>`];
  }).join('');
}
function details(panel,state) {
  const target = el(`mech-${panel}-target`)?.value || 'all';
  const guidance = panel === 'projectile' && target === 'angle' ? ' Por ejemplo, combina destino, tiempo y rapidez; puede haber dos ángulos.' : '';
  const pending = target !== 'all' && !Number.isFinite(state.values[target]) ? `<p class="mech-pending">No se puede despejar ${field(panel,target)?.[2] || 'la magnitud'} con estos datos. Añade otra medida independiente.${guidance}</p>` : '';
  const missing = state.missing.filter(key => field(panel,key)).map(key => field(panel,key)[2]);
  const missingText = missing.length ? `<p class="tool-note">Sin datos suficientes para: ${missing.join(', ')}.</p>` : '';
  const steps = state.steps.map(entry => `<li><strong>${entry.formula}</strong><br>${entry.substitution}</li>`).join('');
  return `${pending}${missingText}<details class="mech-process" open><summary>Fórmulas y proceso</summary><ol>${conversions(panel)}${steps}</ol></details>`;
}
function branchSelector(panel,states) {
  if (states.length < 2) return '';
  const timeKey = panel === 'motion' ? 't' : 'time';
  return `<label class="mech-branch">Solución física <select class="tool-input" data-action="mechBranchChanged" data-event="change" data-arg="${panel}">${states.map((state,index) => `<option value="${index}" ${index === choice[panel] ? 'selected' : ''}>${index+1}: t = ${fmt(fromMechanicsSI(state.values[timeKey],'time',unit(panel,timeKey)))} ${unit(panel,timeKey)}${panel === 'projectile' ? `; θ = ${fmt(fromMechanicsSI(state.values.angle,'angle',unit(panel,'angle')))} ${unit(panel,'angle')}` : ''}</option>`).join('')}</select></label>`;
}
function explorer(panel,duration) {
  if (!Number.isFinite(duration) || duration < 0) return '';
  const key = panel === 'motion' ? 't' : 'time';
  const displayUnit = unit(panel,key);
  const time = Math.min(duration,Math.max(0,currentTime[panel] ?? duration));
  currentTime[panel] = time;
  return `<div class="mech-explorer"><h3>Explora el tiempo</h3><p class="tool-note">Mueve el control para ver la posición y los vectores. Cambia un dato arriba y pulsa Resolver para calcular otro ejercicio.</p><div class="mech-time-controls"><input id="mech-${panel}-slider" type="range" min="0" max="${duration}" step="any" value="${time}" aria-label="Tiempo del movimiento" data-action="mechTimeChanged" data-event="input" data-arg="${panel}:slider"><input id="mech-${panel}-now" class="tool-input" type="number" min="0" max="${fromMechanicsSI(duration,'time',displayUnit)}" step="any" value="${fromMechanicsSI(time,'time',displayUnit)}" aria-label="Tiempo seleccionado" data-action="mechTimeChanged" data-event="change" data-arg="${panel}:number"><span>${displayUnit}</span></div><div id="mech-${panel}-state" class="tool-stats-grid"></div><canvas id="mech-${panel}-canvas" class="mech-trajectory" role="img" aria-label="Trayectoria y vectores de desplazamiento y velocidad"></canvas><p class="tool-note">Trazo tenue: recorrido completo. Trazo intenso: recorrido hasta t. Δr / Δx: desplazamiento; v: velocidad instantánea.</p></div>`;
}
function renderMotion() {
  const states = latest.motion;
  if (!states) return;
  const state = states[choice.motion] || states[0];
  const v = state.values;
  const ready = [v.v0,v.a,v.t].every(Number.isFinite);
  const displacement = ready ? v.v0*v.t+v.a*v.t**2/2 : Number.isFinite(v.x) && Number.isFinite(v.x0) ? v.x-v.x0 : null;
  const target = el('mech-motion-result');
  target.classList.remove('tool-error');
  target.innerHTML = branchSelector('motion',states)+`<div class="tool-stats-grid">${stats('motion',v)}${stat('Desplazamiento',displacement,'length',unit('motion','x'))}</div>`+details('motion',state)+(ready ? explorer('motion',v.t) : '');
  if (ready) renderTime('motion');
}
function renderProjectile() {
  const states = latest.projectile;
  if (!states) return;
  const state = states[choice.projectile] || states[0];
  const v = state.values;
  const ready = [v.vx,v.vy,v.time,v.gravity].every(Number.isFinite);
  const hasVelocity = [v.vx,v.vy,v.gravity].every(Number.isFinite);
  const peakTime = hasVelocity ? Math.min(Number.isFinite(v.time) ? v.time : Infinity,Math.max(0,v.vy/v.gravity)) : null;
  const peak = hasVelocity ? projectileStateAt(v,peakTime) : null;
  const landing = ready ? projectileStateAt(v,v.time) : null;
  const derived = (hasVelocity ? stat('Tiempo hasta altura máxima',peakTime,'time',unit('projectile','time'))+stat(Number.isFinite(v.y0) ? 'Altura máxima' : 'Ascenso máximo relativo',peak.y,'length',unit('projectile','y0')) : '')+(ready ? stat('Alcance horizontal',landing.x,'length',unit('projectile','x'))+stat('Rapidez al final',landing.speed,'speed',unit('projectile','speed'))+stat('Ángulo al final',Math.atan2(landing.vy,landing.vx),'angle',unit('projectile','angle')) : '');
  const target = el('mech-projectile-result');
  target.classList.remove('tool-error');
  target.innerHTML = branchSelector('projectile',states)+`<div class="tool-stats-grid">${stats('projectile',v)}${derived}</div>`+details('projectile',state)+(ready ? explorer('projectile',v.time) : '');
  if (ready) renderTime('projectile');
}
function renderDynamics() {
  const state = latest.dynamics;
  if (!state) return;
  const target = el('mech-dynamics-result');
  target.classList.remove('tool-error');
  target.innerHTML = `<div class="tool-stats-grid">${stats('dynamics',state.values)}</div>`+details('dynamics',state);
}
function renderTime(panel) {
  const state = latest[panel]?.[choice[panel]] || latest[panel]?.[0];
  if (!state) return;
  const v = state.values;
  const duration = panel === 'motion' ? v.t : v.time;
  if (!Number.isFinite(duration)) return;
  const time = Math.min(duration,Math.max(0,currentTime[panel] ?? duration));
  currentTime[panel] = time;
  const slider = el(`mech-${panel}-slider`);
  const number = el(`mech-${panel}-now`);
  if (slider) slider.value = String(time);
  if (number) number.value = String(fromMechanicsSI(time,'time',unit(panel,panel === 'motion' ? 't' : 'time')));
  if (panel === 'motion') {
    const relative = !Number.isFinite(v.x0);
    const plotValues = relative ? {...v,x0:0} : v;
    const now = linearStateAt(plotValues,time);
    el('mech-motion-state').innerHTML = stat(relative ? 'Posición relativa' : 'Posición actual',now.x,'length',unit('motion','x'))+stat('Desplazamiento vectorial',now.displacement,'length',unit('motion','x'))+stat('Velocidad vectorial',now.velocity,'speed',unit('motion','v'));
    drawLinearMotion(el('mech-motion-canvas'),plotValues,time,unit('motion','x'));
  } else {
    const now = projectileStateAt(v,time);
    el('mech-projectile-state').innerHTML = stat('x actual',now.x,'length',unit('projectile','x'))+stat(Number.isFinite(v.y0) ? 'Altura actual' : 'Altura relativa',now.y,'length',unit('projectile','y0'))+stat('vₓ',now.vx,'speed',unit('projectile','speed'))+stat('vᵧ',now.vy,'speed',unit('projectile','speed'))+stat('Rapidez',now.speed,'speed',unit('projectile','speed'));
    drawExerciseProjectile(el('mech-projectile-canvas'),v,time,unit('projectile','x'),unit('projectile','y0'));
  }
}
export function mechCalculateMotion() {
  try { latest.motion = solveLinearExercise(inputs('motion'),el('mech-mode')?.value === 'mru' ? 'mru' : 'mrua'); choice.motion = 0; currentTime.motion = null; renderMotion(); }
  catch (cause) { error('motion',cause); }
}
export function mechCalculateProjectile() {
  try { latest.projectile = solveProjectileExercise(inputs('projectile')); choice.projectile = 0; currentTime.projectile = null; renderProjectile(); }
  catch (cause) { error('projectile',cause); }
}
export function mechCalculateDynamics() {
  try { latest.dynamics = solveDynamicsExercise(inputs('dynamics')); renderDynamics(); }
  catch (cause) { error('dynamics',cause); }
}
export function mechModeChanged() {
  const acceleration = el('mech-a');
  if (el('mech-mode')?.value === 'mru') { acceleration.dataset.previousAcceleration = acceleration.value; acceleration.value = '0'; acceleration.disabled = true; }
  else { acceleration.disabled = false; if (acceleration.dataset.previousAcceleration !== undefined) acceleration.value = acceleration.dataset.previousAcceleration; }
}
export function mechTargetChanged(panel) {
  const item = field(panel,el(`mech-${panel}-target`)?.value);
  if (item) el(item[1]).value = '';
}
export function mechUnitChanged(arg) {
  const [panel,key] = arg.split(':');
  const item = field(panel,key);
  if (!item) return;
  const selector = el(`${item[1]}-unit`);
  const input = el(item[1]);
  if (input.value.trim() !== '' && Object.hasOwn(MECHANICS_UNITS[item[3]],selector.dataset.previous)) input.value = String(convertMechanicsUnit(Number(input.value),item[3],selector.dataset.previous,selector.value));
  selector.dataset.previous = selector.value;
  if (panel === 'motion') renderMotion(); else if (panel === 'projectile') renderProjectile(); else renderDynamics();
}
export function mechBranchChanged(panel) {
  choice[panel] = Number(el(`mech-${panel}-result`)?.querySelector?.('.mech-branch select')?.value || 0);
  currentTime[panel] = null;
  if (panel === 'motion') renderMotion(); else renderProjectile();
}
export function mechTimeChanged(arg) {
  const [panel,control] = arg.split(':');
  const duration = panel === 'motion' ? latest.motion?.[choice.motion]?.values.t : latest.projectile?.[choice.projectile]?.values.time;
  if (!Number.isFinite(duration)) return;
  const raw = Number(el(`mech-${panel}-${control === 'slider' ? 'slider' : 'now'}`)?.value);
  if (!Number.isFinite(raw)) return;
  const seconds = control === 'slider' ? raw : toMechanicsSI(raw,'time',unit(panel,panel === 'motion' ? 't' : 'time'));
  currentTime[panel] = Math.min(duration,Math.max(0,seconds));
  renderTime(panel);
}
export function mechRedrawTrajectory() {
  if (!el('mech-app')?.classList.contains('visible')) return;
  if (latest.motion) renderTime('motion');
  if (latest.projectile) renderTime('projectile');
}
if (typeof window !== 'undefined') window.addEventListener('resize',mechRedrawTrajectory);
