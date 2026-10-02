import { readdir, readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Simulated browser for loading app.js through vm.SourceTextModule.
// Limits: addEventListener keeps one listener per event type, and setTimeout
// runs its callback immediately.

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

export function makeElement(id) {
  const classes = new Set();
  const classList = {
    add: name => classes.add(name),
    remove: name => classes.delete(name),
    contains: name => classes.has(name),
    toggle: (name, force) => {
      if (force ?? !classes.has(name)) classes.add(name);
      else classes.delete(name);
    },
  };
  const context = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  return {
    id,
    dataset: {},
    classList,
    style: {},
    value: '0',
    innerHTML: '',
    clientWidth: 800,
    clientHeight: 600,
    addEventListener() {},
    setAttribute() {},
    insertBefore() {},
    remove() {},
    getContext: () => context,
    toDataURL: () => 'data:image/png;base64,AA==',
  };
}

export async function createAppHarness() {
  const elements = new Map();
  const headLinks = [];
  const delegatedEvents = new Map();
  const windowEvents = new Map();
  const navEntries = [{sc:'launcher'}];
  let navIndex = 0;
  const history = {
    pushState(state) {
      navEntries.splice(navIndex + 1);
      navEntries.push(state);
      navIndex++;
    },
    replaceState(state) { navEntries[navIndex] = state; },
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
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  };
  getElementById('pV').insertBefore = element => {
    elements.set(element.id, element);
    element.remove = () => elements.delete(element.id);
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
      querySelector: () => null,
      addEventListener(type,listener){ delegatedEvents.set(type,listener); },
      dispatchEvent(event){ delegatedEvents.get(event.type)?.(event); },
      createElement: tag => makeElement(tag),
      querySelectorAll: selector => selector === '.tab'
        ? Array.from({length:7}, (_,i)=>makeElement(`tab-${i}`))
        : [],
      head: { appendChild(element) { headLinks.push(element); } },
      body: { appendChild(element) { elements.set(element.id, element); } },
    },
    navigator: { serviceWorker: { register: async () => registration, controller: {} } },
    location: { pathname: '/' },
    history,
    URL: { createObjectURL: () => 'blob:test' },
    Blob,
    Event: class { constructor(type){this.type=type;} },
    localStorage: {getItem:key=>savedTheme.get(key)||null,setItem:(key,value)=>savedTheme.set(key,value)},
    devicePixelRatio: 1,
    requestAnimationFrame() {},
    setTimeout: callback => callback(),
    clearTimeout() {},
    addEventListener(type, listener) { windowEvents.set(type, listener); },
    alert: message => { throw new Error(message); },
    console,
  };
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);
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
    get updateFound() { return updateFound; },
    get stateChanged() { return stateChanged; },
  };
}
