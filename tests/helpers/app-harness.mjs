import { readdir, readFile } from 'node:fs/promises';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after } from 'node:test';
import vm from 'node:vm';

// Simulated browser for loading app.js through vm.SourceTextModule.
// Limits: addEventListener keeps one listener per event type, and setTimeout
// runs its callback immediately.
//
// Every harness also records a trace of observable effects (element property,
// style, dataset and class writes, attributes, listeners, timers, history and
// storage). After a test file finishes, each harness's trace hash must match
// tests/fixtures/golden/ui-trace/<file>.json, so a refactor that changes any
// DOM effect, listener count or timer is caught. UI_TRACE_WRITE=1 records new
// baselines; UI_TRACE_DUMP=<dir> writes the full traces for diffing.
//
// Options: { timers: 'manual' } queues timers until harness.advance(ms);
// { selectors: { '.calc-inp': ['id', ...] } } makes document.querySelectorAll
// return those elements. Element listeners are stored for harness.dispatch().

const repoRoot = new URL('../../', import.meta.url);
export const appUrl = new URL('app.js', repoRoot);

// Imports may only reach the application's own modules: js/**/*.mjs inside
// this repository (never noCommit/, tests/ or anything outside the root).
export function resolveAppModule(specifier, referencingUrl) {
  const url = new URL(specifier, referencingUrl);
  const path = url.href.startsWith(repoRoot.href) ? url.href.slice(repoRoot.href.length) : '';
  if (!/^js\/[\w./-]+\.mjs$/.test(path) || path.split('/').includes('..')) {
    throw new Error(`Import desconocido: ${specifier}`);
  }
  return url;
}

// Every production source file, found on disk rather than through whatever a
// scenario happens to load, for the whole-application source audits.
export async function listAppSources() {
  const files = await readdir(new URL('js/', repoRoot), { recursive: true });
  return [appUrl, ...files.filter(file => file.endsWith('.mjs')).sort().map(file => new URL(`js/${file}`, repoRoot))];
}

const tracesByFile = new Map();

// The test file that created a harness, so traces stay per file even when
// several suites share one process.
function callingTestFile() {
  for (const line of new Error().stack.split('\n')) {
    const match = /(file:\/\/[^\s)]+?\.test\.mjs)/.exec(line);
    if (match) return basename(fileURLToPath(match[1]), '.mjs');
  }
  return basename(process.argv[1] || 'unknown', '.mjs');
}

function show(value) {
  if (typeof value === 'function') return 'ƒ';
  if (value && typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return '[object]'; }
  }
  return String(value);
}

function traced(target, label, record) {
  return new Proxy(target, {
    set(object, prop, value) {
      record(`${label}.${String(prop)}=${show(value)}`);
      object[prop] = value;
      return true;
    },
  });
}

export function makeElement(id, record = () => {}) {
  const listeners = new Map();
  const classes = new Set();
  const classList = {
    add: name => { record(`${id}.class+${name}`); return classes.add(name); },
    remove: name => { record(`${id}.class-${name}`); return classes.delete(name); },
    contains: name => classes.has(name),
    toggle: (name, force) => {
      record(`${id}.class~${name}:${force}`);
      if (force ?? !classes.has(name)) classes.add(name);
      else classes.delete(name);
    },
  };
  const context = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  return traced({
    id,
    dataset: traced({}, `${id}.dataset`, record),
    classList,
    style: traced({}, `${id}.style`, record),
    value: '0',
    innerHTML: '',
    clientWidth: 800,
    clientHeight: 600,
    addEventListener(type, listener) {
      record(`${id}.on:${type}`);
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    __listeners: listeners,
    setAttribute(name, value) { record(`${id}.attr:${name}=${show(value)}`); },
    focus() { record(`${id}.focus`); },
    setSelectionRange(start, end) { record(`${id}.selection:${start},${end}`); },
    insertBefore() {},
    remove() { record(`${id}.remove`); },
    getContext: () => context,
    toDataURL: () => 'data:image/png;base64,AA==',
  }, id, record);
}

after(() => {
  const problems = [];
  for (const [traceFile, traces] of tracesByFile) {
    const traceUrl = new URL(`../fixtures/golden/ui-trace/${traceFile}.json`, import.meta.url);
    const actual = traces.map(trace => ({ count: trace.count, sha256: trace.hash.digest('hex') }));
    if (process.env.UI_TRACE_DUMP) {
      mkdirSync(process.env.UI_TRACE_DUMP, { recursive: true });
      traces.forEach((trace, index) => writeFileSync(`${process.env.UI_TRACE_DUMP}/${traceFile}.${index}.txt`, trace.lines.join('\n')));
    }
    if (process.env.UI_TRACE_WRITE) {
      mkdirSync(new URL('./', traceUrl), { recursive: true });
      writeFileSync(traceUrl, `${JSON.stringify(actual, null, 1)}\n`);
      continue;
    }
    const expected = JSON.parse(readFileSync(traceUrl, 'utf8'));
    const differing = actual.flatMap((trace, index) => trace.sha256 === expected[index]?.sha256 ? [] :
      [`arnés ${index}: ${trace.count} efectos (esperados ${expected[index]?.count})`]);
    if (actual.length !== expected.length) differing.push(`${actual.length} arneses (esperados ${expected.length})`);
    if (differing.length) problems.push(`${traceFile}: ${differing.join('; ')}`);
  }
  if (problems.length) throw new Error(`La traza de la interfaz cambió en ${problems.join(' | ')}`);
});

export async function createAppHarness({ timers: timerMode = 'immediate', selectors = {} } = {}) {
  const trace = { count: 0, hash: createHash('sha256'), lines: process.env.UI_TRACE_DUMP ? [] : null };
  const traceFile = callingTestFile();
  if (!tracesByFile.has(traceFile)) tracesByFile.set(traceFile, []);
  tracesByFile.get(traceFile).push(trace);
  const record = line => {
    trace.count++;
    trace.hash.update(line + '\n');
    trace.lines?.push(line);
  };
  const elements = new Map();
  const headLinks = [];
  const delegatedEvents = new Map();
  const windowEvents = new Map();
  const navEntries = [{sc:'launcher'}];
  let navIndex = 0;
  const history = {
    pushState(state) {
      record(`history.push:${show(state)}`);
      navEntries.splice(navIndex + 1);
      navEntries.push(state);
      navIndex++;
    },
    replaceState(state) { record(`history.replace:${show(state)}`); navEntries[navIndex] = state; },
    back() {
      if (navIndex > 0) {
        navIndex--;
        windowEvents.get('popstate')?.({state:navEntries[navIndex]});
      }
    },
    forward() {
      if (navIndex < navEntries.length - 1) {
        navIndex++;
        windowEvents.get('popstate')?.({state:navEntries[navIndex]});
      }
    },
  };
  const getElementById = id => {
    if (id === 'sc-bg-canvas' || id === 'sc-e1') return null;
    if (id === 'update-banner' || id === 'install-banner' || id === 'tri-restore-btn') return elements.get(id) || null;
    if (!elements.has(id)) elements.set(id, makeElement(id, record));
    return elements.get(id);
  };
  getElementById('pV').insertBefore = element => {
    record(`pV.insertBefore:${element.id}`);
    elements.set(element.id, element);
    element.remove = () => elements.delete(element.id);
  };
  let timerCount = 0;
  let clock = 0;
  const pendingTimers = new Map();
  const finishedTimers = new Set();
  const timerLog = [];
  // Manual timers: run every timer due within `ms`, in due order, including
  // timers scheduled by callbacks that fall inside the window.
  const advance = ms => {
    const end = clock + ms;
    for (;;) {
      const next = [...pendingTimers].filter(([, timer]) => timer.due <= end).sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
      if (!next) break;
      const [handle, timer] = next;
      pendingTimers.delete(handle);
      finishedTimers.add(handle);
      clock = timer.due;
      timerLog.push(`fire:${handle}`);
      timer.callback();
    }
    clock = end;
  };
  let updateFound;
  let stateChanged;
  const savedTheme=new Map();
  const registration = {
    installing: { state: 'installed', addEventListener(_type, listener) { stateChanged = listener; } },
    addEventListener(_type, listener) { updateFound = listener; },
  };
  const sandbox = {
    document: {
      documentElement: { dataset: { theme: 'dark' } },
      getElementById,
      contains: element => [...elements.values()].includes(element),
      querySelector: () => null,
      addEventListener(type,listener){ record(`document.on:${type}`); delegatedEvents.set(type,listener); },
      dispatchEvent(event){ delegatedEvents.get(event.type)?.(event); },
      createElement: tag => makeElement(tag, record),
      querySelectorAll: selector => Object.hasOwn(selectors, selector)
        ? selectors[selector].map(getElementById)
        : selector === '.tab'
          ? Array.from({length:7}, (_,i)=>makeElement(`tab-${i}`, record))
          : [],
      head: { appendChild(element) { record(`head.append:${element.rel}`); headLinks.push(element); } },
      body: { appendChild(element) { record(`body.append:${element.id}`); elements.set(element.id, element); } },
    },
    navigator: { serviceWorker: { register: async () => registration, controller: {} } },
    location: { pathname: '/' },
    history,
    URL: { createObjectURL: () => 'blob:test' },
    Blob,
    Event: class { constructor(type){this.type=type;} },
    localStorage: {getItem:key=>savedTheme.get(key)||null,setItem:(key,value)=>{ record(`storage:${key}=${value}`); return savedTheme.set(key,value); }},
    devicePixelRatio: 1,
    requestAnimationFrame() { record('raf'); },
    setTimeout: (callback, delay = 0) => {
      const handle = ++timerCount;
      record(`timeout:${delay}`);
      if (timerMode === 'manual') pendingTimers.set(handle, { due: clock + delay, callback });
      else { finishedTimers.add(handle); callback(); }
      return handle;
    },
    clearTimeout(handle) {
      const state = pendingTimers.has(handle) ? 'live' : finishedTimers.has(handle) ? 'finished' : String(handle);
      record(`clearTimeout:${state}`);
      timerLog.push(`clear:${state}`);
      pendingTimers.delete(handle);
    },
    addEventListener(type, listener) { record(`window.on:${type}`); windowEvents.set(type, listener); },
    alert: message => { throw new Error(message); },
    console,
  };
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);
  // Deterministic Math.random (mulberry32) so random tools give reproducible traces.
  vm.runInContext(`{ let seed = 0x5eed; Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`, context);
  const source = await readFile(appUrl, 'utf8');
  const appModule = new vm.SourceTextModule(source, {
    context,
    identifier: appUrl.href,
  });
  const linked = new Map([[appUrl.href, appModule]]);
  await appModule.link(async (specifier, referencingModule) => {
    const moduleUrl = resolveAppModule(specifier, referencingModule.identifier);
    if (!linked.has(moduleUrl.href)) {
      // Cache the loading promise before awaiting so concurrent imports share
      // one module instance, as they do in a native ES-module browser.
      linked.set(moduleUrl.href,readFile(moduleUrl,'utf8').then(source=>new vm.SourceTextModule(source,{context,identifier:moduleUrl.href})));
    }
    return await linked.get(moduleUrl.href);
  });
  await appModule.evaluate();
  return {
    sandbox, context, source, elements, headLinks, delegatedEvents, windowEvents,
    history, savedTheme, getElementById, appModule, linked,
    actions: appModule.namespace.actions,
    advance,
    pendingTimers: () => [...pendingTimers.values()],
    timerLog,
    listenerCount: (id, type) => getElementById(id).__listeners.get(type)?.length ?? 0,
    dispatch(id, type, event = {}) {
      const element = getElementById(id);
      for (const listener of element.__listeners.get(type) || []) listener({ type, target: element, ...event });
    },
    get updateFound() { return updateFound; },
    get stateChanged() { return stateChanged; },
  };
}
